import { getAuth, clerkClient } from '@clerk/express';
import User from '../models/User.js';

// Create/update the Mongo profile from the verified Clerk user.
export async function syncUser(clerkId) {
  const c = await clerkClient.users.getUser(clerkId);
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.username || 'User';
  return User.findOneAndUpdate(
    { clerkId },
    { name, email: c.emailAddresses?.[0]?.emailAddress || '', avatar: c.imageUrl || '' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function requireUser(req, res, next) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    req.user = (await User.findOne({ clerkId: userId })) || (await syncUser(userId));
    next();
  } catch (e) { next(e); }
}
