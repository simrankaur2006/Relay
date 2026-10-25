import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';
import Conversation from '../models/Conversation.js';

export const h = (fn) => (req, res, next) => fn(req, res, next).catch(next);
export const ok = (id) => (typeof id === 'string' || id instanceof mongoose.Types.ObjectId) && mongoose.isValidObjectId(id);
const eq = (a, b) => String(a) === String(b);
export const isMember = (ws, uid) => ws.members.some((m) => eq(m.user, uid));
export const roomOf = (m) => (m.channel ? { channelId: m.channel } : { conversationId: m.conversation });

export async function getWorkspace(id, uid) {
  if (!ok(id)) return null;
  const ws = await Workspace.findById(id);
  return ws && isMember(ws, uid) ? ws : null;
}

// Authorizes access to a channel (members only) or DM (participants only).
export async function getRoom(uid, { channelId, conversationId }) {
  if (channelId && ok(channelId)) {
    const c = await Channel.findById(channelId);
    if (!c || !c.members.some((m) => eq(m, uid))) return null;
    const ws = await getWorkspace(c.workspace, uid);
    return ws && { ws, room: 'channel:' + c._id, ref: { channel: c._id }, doc: c };
  }
  if (conversationId && ok(conversationId)) {
    const c = await Conversation.findById(conversationId);
    if (!c || !c.participants.some((m) => eq(m, uid))) return null;
    const ws = await getWorkspace(c.workspace, uid);
    return ws && { ws, room: 'conv:' + c._id, ref: { conversation: c._id }, doc: c };
  }
  return null;
}
