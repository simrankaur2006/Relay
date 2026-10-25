import { useEffect, useState } from 'react';
import api, { errMsg } from '../lib/api';
import { useApp } from './useApp';

const match = (m, sc) =>
  sc.parentId ? m.parent === sc.parentId : !m.parent && (sc.channelId ? m.channel === sc.channelId : m.conversation === sc.conversationId);

// Loads message history for a channel / DM / thread and keeps it live via Socket.IO.
export default function useMessages(scope) {
  const { socket } = useApp();
  const key = JSON.stringify(scope);
  const [s, setS] = useState({ messages: [], loading: true, error: null, more: false });

  useEffect(() => {
    let dead = false;
    setS({ messages: [], loading: true, error: null, more: false });
    api.get('/api/messages', { params: scope })
      .then((r) => !dead && setS({ messages: r.data, loading: false, error: null, more: r.data.length >= 50 }))
      .catch((e) => !dead && setS({ messages: [], loading: false, error: errMsg(e), more: false }));
    return () => { dead = true; };
  }, [key]); // eslint-disable-line

  useEffect(() => {
    if (!socket) return;
    const upd = (f) => setS((x) => ({ ...x, messages: f(x.messages) }));
    const add = ({ message: m }) => match(m, scope) && upd((p) => (p.some((x) => x._id === m._id) ? p : [...p, m]));
    const up = ({ message: m }) => upd((p) => p.map((x) => (x._id === m._id ? m : x)));
    const del = ({ id }) => upd((p) => p.filter((x) => x._id !== id));
    socket.on('message:new', add); socket.on('message:update', up); socket.on('message:delete', del);
    return () => { socket.off('message:new', add); socket.off('message:update', up); socket.off('message:delete', del); };
  }, [socket, key]); // eslint-disable-line

  const loadMore = async () => {
    const first = s.messages[0];
    if (!first) return;
    const r = await api.get('/api/messages', { params: { ...scope, before: first.createdAt } });
    setS((x) => ({ ...x, messages: [...r.data, ...x.messages], more: r.data.length >= 50 }));
  };
  return { ...s, loadMore };
}
