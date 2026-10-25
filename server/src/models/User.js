import mongoose from 'mongoose';
const s = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  avatar: String,
}, { timestamps: true });
export default mongoose.model('User', s);
