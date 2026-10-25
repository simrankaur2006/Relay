import { Router } from 'express';
import crypto from 'crypto';
import { requireUser, syncUser } from '../middleware/auth.js';
import { h, ok, getWorkspace, isMember } from '../middleware/access.js';
import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import messages from './messages.js';

const r = Router();
r.use(requireUser);
r.use('/messages', messages);

const U = 'name avatar email';
const eq = (a, b) => String(a) === String(b);
const clean = (v, min, max) => { if (typeof v !== 'string') return null; v = v.trim(); return v.length >= min && v.length <= max ? v : null; };
const bad = (res, m = 'Invalid input') => res.status(400).json({ error: m });
const nf = (res) => res.status(404).json({ error: 'Not found' });
const joinRooms = (req, uid, rooms) => req.app.get('io').in('user:' + uid).socketsJoin(rooms);
const refresh = (req, room, ws) => req.app.get('io').to(room).emit('refresh', { workspace: String(ws) });
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

r.get('/me', h(async (req, res) => {
  const user = await syncUser(req.user.clerkId).catch(() => req.user);
  const workspaces = await Workspace.find({ 'members.user': user._id }).select('name slug owner').sort('createdAt');
  res.json({ user, workspaces });
}));

r.post('/workspaces', h(async (req, res) => {
  const name = clean(req.body.name, 2, 50);
  if (!name) return bad(res, 'Name must be 2-50 characters');
  const uid = req.user._id;
  const ws = await Workspace.create({
    name, slug: slug(name) + '-' + crypto.randomBytes(2).toString('hex'), owner: uid,
    members: [{ user: uid, role: 'owner' }], inviteCode: crypto.randomBytes(5).toString('hex'),
  });
  const ch = await Channel.create({ workspace: ws._id, name: 'general', description: 'Team-wide announcements and chat', type: 'public', members: [uid], createdBy: uid });
  joinRooms(req, uid, ['ws:' + ws._id, 'channel:' + ch._id]);
  res.status(201).json(ws);
}));

r.post('/workspaces/join', h(async (req, res) => {
  const code = clean(req.body.code, 4, 40);
  if (!code) return bad(res, 'Enter an invite code');
  const ws = await Workspace.findOne({ inviteCode: code });
  if (!ws) return res.status(404).json({ error: 'Invalid invite code' });
  const uid = req.user._id;
  await Workspace.updateOne({ _id: ws._id, 'members.user': { $ne: uid } }, { $push: { members: { user: uid, role: 'member' } } });
  const g = await Channel.findOneAndUpdate({ workspace: ws._id, name: 'general' }, { $addToSet: { members: uid } });
  joinRooms(req, uid, ['ws:' + ws._id, ...(g ? ['channel:' + g._id] : [])]);
  refresh(req, 'ws:' + ws._id, ws._id);
  res.json({ _id: ws._id });
}));

r.get('/workspaces/:id', h(async (req, res) => {
  const uid = req.user._id;
  const ws = await getWorkspace(req.params.id, uid);
  if (!ws) return nf(res);
  await ws.populate('members.user', U);
  const chs = await Channel.find({ workspace: ws._id, $or: [{ type: 'public' }, { members: uid }] }).sort('name').lean();
  const channels = chs.map((c) => {
    const joined = c.members.some((m) => eq(m, uid));
    return { _id: c._id, name: c.name, description: c.description, type: c.type, joined, memberCount: c.members.length, members: joined ? c.members : undefined };
  });
  const conversations = await Conversation.find({ workspace: ws._id, participants: uid }).sort('-lastMessageAt').populate('participants', U);
  res.json({
    workspace: { _id: ws._id, name: ws.name, owner: ws.owner, inviteCode: ws.inviteCode, members: ws.members },
    channels, conversations,
  });
}));

r.post('/workspaces/:id/channels', h(async (req, res) => {
  const uid = req.user._id;
  const ws = await getWorkspace(req.params.id, uid);
  if (!ws) return nf(res);
  const name = clean(req.body.name, 1, 40)?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
  const description = req.body.description == null ? '' : clean(req.body.description, 0, 200);
  const type = req.body.type === 'private' ? 'private' : 'public';
  if (!name) return bad(res, 'Channel name is required (letters, numbers, - and _)');
  if (description === null) return bad(res, 'Description too long');
  const c = await Channel.create({ workspace: ws._id, name, description, type, members: [uid], createdBy: uid });
  joinRooms(req, uid, 'channel:' + c._id);
  if (type === 'public') refresh(req, 'ws:' + ws._id, ws._id);
  res.status(201).json({ _id: c._id });
}));

r.post('/channels/:id/join', h(async (req, res) => {
  const uid = req.user._id;
  const c = ok(req.params.id) && (await Channel.findById(req.params.id));
  if (!c || !(await getWorkspace(c.workspace, uid))) return nf(res);
  if (c.type !== 'public') return res.status(403).json({ error: 'This channel is private' });
  await Channel.updateOne({ _id: c._id }, { $addToSet: { members: uid } });
  joinRooms(req, uid, 'channel:' + c._id);
  res.json({ ok: true });
}));

r.post('/channels/:id/members', h(async (req, res) => {
  const uid = req.user._id;
  const c = ok(req.params.id) && (await Channel.findById(req.params.id));
  const ws = c && (await getWorkspace(c.workspace, uid));
  if (!c || !ws) return nf(res);
  if (!c.members.some((m) => eq(m, uid))) return res.status(403).json({ error: 'Not a channel member' });
  const t = req.body.userId;
  if (!ok(t) || !isMember(ws, t)) return bad(res, 'User is not in this workspace');
  await Channel.updateOne({ _id: c._id }, { $addToSet: { members: t } });
  joinRooms(req, t, 'channel:' + c._id);
  req.app.get('io').to('user:' + t).emit('refresh', { workspace: String(ws._id) });
  res.json({ ok: true });
}));

r.post('/workspaces/:id/conversations', h(async (req, res) => {
  const uid = req.user._id;
  const ws = await getWorkspace(req.params.id, uid);
  if (!ws) return nf(res);
  const t = req.body.userId;
  if (!ok(t) || eq(t, uid) || !isMember(ws, t)) return bad(res, 'Invalid user');
  const participants = [String(uid), String(t)].sort();
  let c = await Conversation.findOne({ workspace: ws._id, participants: { $all: participants, $size: 2 } });
  if (!c) c = await Conversation.create({ workspace: ws._id, participants });
  joinRooms(req, uid, 'conv:' + c._id);
  joinRooms(req, t, 'conv:' + c._id);
  await c.populate('participants', U);
  res.json(c);
}));

r.get('/workspaces/:id/search', h(async (req, res) => {
  const uid = req.user._id;
  const ws = await getWorkspace(req.params.id, uid);
  if (!ws) return nf(res);
  const q = clean(req.query.q, 2, 100);
  if (!q) return bad(res, 'Query must be 2-100 characters');
  const [chs, cvs] = await Promise.all([
    Channel.find({ workspace: ws._id, members: uid }).select('_id'),
    Conversation.find({ workspace: ws._id, participants: uid }).select('_id'),
  ]);
  const msgs = await Message.find({
    workspace: ws._id, content: new RegExp(esc(q), 'i'),
    $or: [{ channel: { $in: chs.map((c) => c._id) } }, { conversation: { $in: cvs.map((c) => c._id) } }],
  }).sort('-createdAt').limit(30).populate('sender', 'name avatar');
  res.json(msgs);
}));

export default r;
