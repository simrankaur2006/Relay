import mongoose from 'mongoose';
const { Schema } = mongoose;
const s = new Schema({
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });
s.index({ workspace: 1, participants: 1 });
export default mongoose.model('Conversation', s);
