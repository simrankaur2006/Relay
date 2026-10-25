import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let getter = null;
export const setTokenGetter = (f) => { getter = f; };

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use(async (config) => {
  const token = getter && (await getter());
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e) => e?.response?.data?.error || e?.message || 'Something went wrong';

// Send a message through Socket.IO and resolve when the server acknowledges it.
export const sendMessage = (socket, payload) =>
  new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Not connected'));
    socket.timeout(8000).emit('message:send', payload, (err, res) => {
      if (err) reject(new Error('Timed out. Check your connection.'));
      else if (res?.error) reject(new Error(res.error));
      else resolve();
    });
  });

export default api;
