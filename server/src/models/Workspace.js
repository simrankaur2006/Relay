import mongoose from 'mongoose';
const { Schema } = mongoose;
const s = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  slug: { type: String, unique: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ _id: false, user: { type: Schema.Types.ObjectId, ref: 'User' }, role: { type: String, enum: ['owner', 'member'], default: 'member' } }],
  inviteCode: { type: String, unique: true, required: true },
}, { timestamps: true });
s.index({ 'members.user': 1 });
export default mongoose.model('Workspace', s);
