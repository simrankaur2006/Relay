import mongoose from 'mongoose';
const { Schema } = mongoose;
const ref = (r) => ({ type: Schema.Types.ObjectId, ref: r });
const s = new Schema({
  workspace: { ...ref('Workspace'), required: true },
  channel: ref('Channel'),
  conversation: ref('Conversation'),
  sender: { ...ref('User'), required: true },
  content: { type: String, required: true, maxlength: 4000 },
  reactions: [{ _id: false, emoji: String, users: [ref('User')] }],
  parent: { ...ref('Message'), default: null },
  replyCount: { type: Number, default: 0 },
  edited: { type: Boolean, default: false },
}, { timestamps: true });
s.index({ channel: 1, parent: 1, createdAt: -1 });
s.index({ conversation: 1, parent: 1, createdAt: -1 });
s.index({ parent: 1, createdAt: 1 });
export default mongoose.model('Message', s);
