import mongoose from 'mongoose';
const { Schema } = mongoose;
const s = new Schema({
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true, maxlength: 40 },
  description: { type: String, default: '', maxlength: 200 },
  type: { type: String, enum: ['public', 'private'], default: 'public' },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ workspace: 1, name: 1 }, { unique: true });
s.index({ members: 1 });
export default mongoose.model('Channel', s);
