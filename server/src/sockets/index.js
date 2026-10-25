import { Server } from 'socket.io';
import { verifyToken } from '@clerk/backend';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { syncUser } from '../middleware/auth.js';
import { getRoom, roomOf, ok } from '../middleware/access.js';

export function initSockets(httpServer) {
  const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
  const io = new Server(httpServer, { cors: { origin: origins, credentials: true } });

  // Authenticate every connection with the Clerk session token.
  io.use(async (s, next) => {
    try {
      const token = s.handshake.auth?.token;
      if (!token) throw new Error('no token');
      const r = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
      const p = r?.data || r;
      if (!p?.sub) throw new Error('bad token');
      s.user = (await User.findOne({ clerkId: p.sub })) || (await syncUser(p.sub));
      next();
    } catch { next(new Error('Unauthorized')); }
  });

  io.on('connection', async (s) => {
    const uid = s.user._id;
    // Rooms are derived from DB membership only, never from client input.
    const [ws, chs, cvs] = await Promise.all([
      Workspace.find({ 'members.user': uid }).select('_id'),
      Channel.find({ members: uid }).select('_id'),
      Conversation.find({ participants: uid }).select('_id'),
    ]);
    s.join(['user:' + uid, ...ws.map((w) => 'ws:' + w._id), ...chs.map((c) => 'channel:' + c._id), ...cvs.map((c) => 'conv:' + c._id)]);

    s.on('typing', (p) => {
      const room = p?.channelId ? 'channel:' + p.channelId : p?.conversationId ? 'conv:' + p.conversationId : null;
      if (room && s.rooms.has(room)) s.to(room).emit('typing', { room, userId: String(uid), name: s.user.name });
    });

    s.on('message:send', async (p, ack) => {
      if (typeof ack !== 'function') ack = () => {};
      try {
        p = p || {};
        const content = typeof p.content === 'string' ? p.content.trim() : '';
        if (!content || content.length > 4000) return ack({ error: 'Message must be 1-4000 characters' });
        let scope = { channelId: p.channelId, conversationId: p.conversationId };
        let parent = null;
        if (p.parentId) {
          if (!ok(p.parentId)) return ack({ error: 'Invalid thread' });
          parent = await Message.findById(p.parentId);
          if (!parent || parent.parent) return ack({ error: 'Invalid thread' });
          scope = roomOf(parent);
        }
        const a = await getRoom(uid, scope);
        if (!a) return ack({ error: 'You do not have access to this conversation' });
        const m = await Message.create({ workspace: a.ws._id, ...a.ref, sender: uid, content, parent: parent ? parent._id : null });
        await m.populate('sender', 'name avatar');
        io.to(a.room).emit('message:new', { message: JSON.parse(JSON.stringify(m)) });
        if (parent) {
          const up = await Message.findByIdAndUpdate(parent._id, { $inc: { replyCount: 1 } }, { new: true }).populate('sender', 'name avatar');
          io.to(a.room).emit('message:update', { message: JSON.parse(JSON.stringify(up)) });
        }
        if (a.ref.conversation) await Conversation.updateOne({ _id: a.ref.conversation }, { lastMessageAt: new Date() });
        ack({ ok: true });
      } catch (e) { console.error(e); ack({ error: 'Failed to send message' }); }
    });
  });
  return io;
}
