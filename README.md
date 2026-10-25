# Relay — Your team. In sync.

A lightweight, Slack-inspired team messaging app.

**Stack:** React + Vite + Tailwind CSS · Express + Socket.IO · MongoDB (Mongoose) · Clerk authentication

## Features
- **Auth:** Clerk sign-up / sign-in / sign-out, protected routes, server-side token verification
- **Workspaces:** create, switch, invite via code, owner and member roles
- **Channels:** public and private, join / add members, message history
- **Messaging:** real-time via Socket.IO, edit / delete, emoji reactions, typing indicators
- **Direct messages:** one-to-one, private to the two participants
- **Threads & search:** reply panel per message, search across your channels and DMs
- **UI:** responsive layout with mobile drawer, unread badges, toasts, loading / error / empty states

## Prerequisites
- Node.js 18+
- A free [Clerk](https://dashboard.clerk.com) account
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## Setup

### 1. Clerk
1. Create an application in the Clerk dashboard.
2. Copy the **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`) from *API Keys*.

### 2. MongoDB Atlas
1. Create a free cluster and a database user.
2. Under *Network Access*, allow your IP address.
3. Click *Connect → Drivers* and copy the connection string. Append a database name, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/relay`

### 3. Environment files
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

`server/.env`
```
PORT=5000
MONGODB_URI=<your Atlas connection string>
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

`client/.env`
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:5000
```

> `CLERK_PUBLISHABLE_KEY` on the server is required by the Clerk Express SDK. It is the same public key used by the client.

### 4. Install and run
```bash
npm install            # root (concurrently)
npm run install:all    # server + client dependencies
npm run dev            # API on :5000, app on :5173
```

Open **http://localhost:5173**, sign up, and create a workspace. A `#general` channel is created automatically.

## Inviting teammates
Open the workspace name dropdown in the sidebar and copy the **invite code**. Others choose *Join with invite code* after signing up.

## Scripts
| Command | Description |
|---|---|
| `npm run dev` | Run server and client together |
| `npm run install:all` | Install server and client dependencies |
| `npm run build` | Build the client to `client/dist` |
| `npm start` | Start the API in production mode |

## Project structure
```
relay/
├── client/   React app (components, pages, hooks, lib)
└── server/   Express API (models, routes, middleware, sockets)
```

## Production
1. Set `VITE_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY`, then run `npm run build`. Serve `client/dist` from any static host.
2. Run the API with `npm start`, with `CLIENT_URL` set to your deployed frontend origin (comma-separate multiple origins).
3. Add your production domain in the Clerk dashboard.

## Security notes
- Every API request and socket connection is verified with the Clerk session token; the user is always derived server-side.
- Channel and DM access is checked against database membership on every read, write and socket event.
- Only a message's author can edit it. The author or workspace owner can delete it.
- Never commit `.env` files (already in `.gitignore`).

## Troubleshooting
| Problem | Fix |
|---|---|
| "Missing env vars" in the server terminal | Fill `MONGODB_URI`, `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` in `server/.env` |
| Blank page: "Missing VITE_CLERK_PUBLISHABLE_KEY" | Fill `client/.env`, then restart `npm run dev` |
| MongoDB connection error | Allow your IP in Atlas; URL-encode special characters in the password |
| "Couldn't reach the Relay server" | Make sure the server is running and `VITE_API_URL` matches its port |

## Limitations
- Unread badges reset on page reload.
- Search is a case-insensitive substring match.
- Reactions use a fixed set of six emojis.
