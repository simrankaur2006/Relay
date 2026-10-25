# Relay — Your team. In sync.

A lightweight Slack-style team chat: React + Vite + Tailwind, Express + Socket.IO, MongoDB (Mongoose), Clerk auth.

## Setup
1. **Clerk** — create an app at https://dashboard.clerk.com (enable Email/Google as you like). Copy the *Publishable key* and *Secret key*.
2. **MongoDB Atlas** — create a free cluster, add a database user, allow your IP, copy the connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/relay`).
3. Configure env files:
   ```
   cp server/.env.example server/.env   # MONGODB_URI, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY
   cp client/.env.example client/.env   # VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL
   ```
   (`CLERK_PUBLISHABLE_KEY` on the server is required by the Clerk Express SDK. It's the same public key as the client's.)
4. Install and run:
   ```
   npm install            # root (concurrently)
   npm run install:all    # server + client
   npm run dev            # API on :5000, app on :5173
   ```
Open http://localhost:5173, sign up, create a workspace, and share its invite code (workspace menu) with teammates.

## Production
Build the client with `npm run build` (serve `client/dist` from any static host) and run `npm start` for the API. Set `VITE_API_URL` at build time and `CLIENT_URL` (comma-separated allowed origins) on the server.

## Notes
- Every API call and socket connection is authenticated with the Clerk session token; the user is derived server-side, never from client input.
- Channels require membership (public channels via *Join*, private via *Add member*); DMs are limited to their two participants. Workspace owners can delete any message in their workspace.
- Unread badges are per session (not persisted across reloads). Search is a case-insensitive substring match across channels/DMs you belong to.
