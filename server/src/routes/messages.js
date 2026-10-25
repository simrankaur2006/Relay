import { Router } from 'express';
import Message from '../models/Message.js';
import { h, ok, getRoom, roomOf } from '../middleware/access.js';

const r = Router();
const U = 'name avatar';
const EMOJIS = ['👍', '❤️', '😂', '🎉', '👀', '🙏'];
const out = (x) => JSON.parse(JSON.stringify(x));
const emit = (req, room, ev, data) => req.app.get('io').to(room).emit(ev, out(data));
const clean = (v) => (typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= 4000 ? v.trim() : null);

r.get('/', h(async (req, res) => {
  const { channelId, conversationId, parentId, before } = req.query;
  let scope = { channelId, conversationId };
  if (parentId) {
    if (!ok(parentId)) return res.status(400).json({ error: 'Invalid parent' });
    const p = await Message.findById(parentId);
    if (!p) return res.status(404).json({ error: 'Not found' });
    scope = roomOf(p);
  }
  const a = await getRoom(req.user._id, scope);
  if (!a) return res.status(403).json({ error: 'No access' });
  const filter = { ...a.ref, parent: parentId || null };
  if (typeof before === 'string' && !isNaN(Date.parse(before))) filter.createdAt = { $lt: new Date(before) };
  const msgs = await Message.find(filter).sort('-createdAt').limit(50).populate('sender', U).lean();
  res.json(msgs.reverse());
}));

async function load(req, res) {
  if (!ok(req.params.id)) { res.status(404).json({ error: 'Not found' }); return null; }
  const m = await Message.findById(req.params.id);
  const a = m && (await getRoom(req.user._id, roomOf(m)));
  if (!a) { res.status(m ? 403 : 404).json({ error: m ? 'No access' : 'Not found' }); return null; }
  return { m, a };
}

r.patch('/:id', h(async (req, res) => {
  const x = await load(req, res); if (!x) return;
  const content = clean(req.body.content);
  if (!content) return res.status(400).json({ error: 'Message must be 1-4000 characters' });
  if (String(x.m.sender) !== String(req.user._id)) return res.status(403).json({ error: 'Only the author can edit' });
  x.m.content = content; x.m.edited = true;
  await x.m.save(); await x.m.populate('sender', U);
  emit(req, x.a.room, 'message:update', { message: x.m });
  res.json(out(x.m));
}));

r.delete('/:id', h(async (req, res) => {
  const x = await load(req, res); if (!x) return;
  const isAuthor = String(x.m.sender) === String(req.user._id);
  const isOwner = String(x.a.ws.owner) === String(req.user._id);
  if (!isAuthor && !isOwner) return res.status(403).json({ error: 'Not allowed' });
  await Message.deleteMany({ $or: [{ _id: x.m._id }, { parent: x.m._id }] });
  emit(req, x.a.room, 'message:delete', { id: x.m._id });
  if (x.m.parent) {
    const p = await Message.findByIdAndUpdate(x.m.parent, { replyCount: await Message.countDocuments({ parent: x.m.parent }) }, { new: true }).populate('sender', U);
    if (p) emit(req, x.a.room, 'message:update', { message: p });
  }
  res.json({ ok: true });
}));

r.post('/:id/react', h(async (req, res) => {
  const x = await load(req, res); if (!x) return;
  const { emoji } = req.body;
  if (!EMOJIS.includes(emoji)) return res.status(400).json({ error: 'Unsupported emoji' });
  const uid = req.user._id;
  const rx = x.m.reactions.find((e) => e.emoji === emoji);
  if (!rx) x.m.reactions.push({ emoji, users: [uid] });
  else {
    const i = rx.users.findIndex((u) => String(u) === String(uid));
    if (i >= 0) rx.users.splice(i, 1); else rx.users.push(uid);
    if (!rx.users.length) x.m.reactions = x.m.reactions.filter((e) => e.emoji !== emoji);
  }
  await x.m.save(); await x.m.populate('sender', U);
  emit(req, x.a.room, 'message:update', { message: x.m });
  res.json(out(x.m));
}));

export default r;
