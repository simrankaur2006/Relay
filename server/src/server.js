import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import createApp from './app.js';
import { initSockets } from './sockets/index.js';

const { MONGODB_URI, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, PORT = 5000 } = process.env;
if (!MONGODB_URI || !CLERK_SECRET_KEY || !CLERK_PUBLISHABLE_KEY) {
  console.error('Missing env vars. Set MONGODB_URI, CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY in server/.env');
  process.exit(1);
}
await mongoose.connect(MONGODB_URI);
const app = createApp();
const server = http.createServer(app);
app.set('io', initSockets(server));
server.listen(PORT, () => console.log(`Relay API listening on :${PORT}`));
