import { useEffect, useRef, useState } from 'react';
import { Hash, Lock, MessagesSquare, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, sendMessage } from '../lib/api';
import useMessages from '../hooks/useMessages';
import { useApp } from '../hooks/useApp';
import MessageItem from './MessageItem';
import ThreadPanel from './ThreadPanel';
import Composer from './Composer';
import { Avatar, Spinner, btnCls } from './ui';

function JoinPrompt({ channel, onJoined }) {
  const [busy, setBusy] = useState(false);
  const join = async () => {
    setBusy(true);
    try { await api.post(`/api/channels/${channel._id}/join`); await onJoined(); toast.success(`Joined #${channel.name}`); }
    catch (e) { toast.error(errMsg(e)); setBusy(false); }
  };
  return (
    <div className="flex-1 grid place-items-center p-6 text-center">
      <div>
        <Hash className="mx-auto text-slate-300" size={40} />
        <h2 className="mt-3 text-xl font-semibold text-slate-900">#{channel.name}</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">{channel.description || 'A public channel.'} {channel.memberCount} members.</p>
        <button onClick={join} disabled={busy} className={`${btnCls} mt-4`}>Join channel</button>
      </div>
    </div>
  );
}

function Chat({ kind, item, me, workspace, reload }) {
  const { socket } = useApp();
  const isChannel = kind === 'c';
  const scope = isChannel ? { channelId: item._id } : { conversationId: item._id };
  const other = !isChannel && item.participants.find((p) => p._id !== me._id);
  const { messages, loading, error, more, loadMore } = useMessages(scope);
  const [threadId, setThreadId] = useState(null);
  const [typers, setTypers] = useState({});
  const timers = useRef({});
  const lastTyping = useRef(0);
  const endRef = useRef();
  const isOwner = workspace.owner === me._id;
  const last = messages[messages.length - 1]?._id;
  const room = (isChannel ? 'channel:' : 'conv:') + item._id;

  useEffect(() => { setThreadId(null); setTypers({}); }, [item._id]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [last, loading]);
  useEffect(() => {
    if (!socket) return;
    const on = (p) => {
      if (p.room !== room) return;
      setTypers((t) => ({ ...t, [p.userId]: p.name }));
      clearTimeout(timers.current[p.userId]);
      timers.current[p.userId] = setTimeout(() => setTypers((t) => { const n = { ...t }; delete n[p.userId]; return n; }), 3000);
    };
    socket.on('typing', on);
    return () => socket.off('typing', on);
  }, [socket, room]);

  const onTyping = () => {
    if (Date.now() - lastTyping.current > 2000) { lastTyping.current = Date.now(); socket?.emit('typing', scope); }
  };
  const addable = isChannel && item.type === 'private'
    ? workspace.members.map((m) => m.user).filter((u) => !item.members?.includes(u._id)) : [];
  const addMember = async (userId) => {
    if (!userId) return;
    try { await api.post(`/api/channels/${item._id}/members`, { userId }); toast.success('Member added'); reload(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const names = Object.values(typers);
  const thread = messages.find((m) => m._id === threadId);

  return (
    <div className="flex-1 flex min-h-0">
      <section className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 px-4 border-b border-slate-200 flex items-center gap-3 shrink-0">
          {isChannel ? (item.type === 'private' ? <Lock size={18} className="text-slate-500" /> : <Hash size={18} className="text-slate-500" />) : <Avatar user={other} size={28} />}
          <div className="min-w-0">
            <h1 className="font-semibold text-slate-900 truncate">{isChannel ? item.name : other?.name}</h1>
            {isChannel && item.description && <p className="text-xs text-slate-500 truncate">{item.description}</p>}
          </div>
          {addable.length > 0 && (
            <label className="ml-auto flex items-center gap-1 text-xs text-slate-500">
              <UserPlus size={14} />
              <select value="" onChange={(e) => addMember(e.target.value)} className="border border-slate-200 rounded-md px-1 py-1 text-xs max-w-[120px]">
                <option value="">Add member</option>
                {addable.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </label>
          )}
        </header>
        <div className="flex-1 overflow-y-auto py-3">
          {more && <div className="text-center"><button onClick={loadMore} className="text-xs text-indigo-600 hover:underline mb-2">Load older messages</button></div>}
          {loading ? <div className="grid place-items-center py-10"><Spinner /></div>
            : error ? <p className="text-center text-sm text-red-600 py-10">{error}</p>
            : messages.length === 0 ? (
              <div className="text-center py-16 px-6">
                <MessagesSquare className="mx-auto text-slate-300" size={44} />
                <p className="mt-3 font-medium text-slate-700">{isChannel ? `This is the start of #${item.name}` : `Start your conversation with ${other?.name}`}</p>
                <p className="text-sm text-slate-500">Send the first message below.</p>
              </div>
            ) : messages.map((m, i) => {
              const p = messages[i - 1];
              const compact = p && p.sender._id === m.sender._id && new Date(m.createdAt) - new Date(p.createdAt) < 300000;
              return <MessageItem key={m._id} m={m} me={me} isOwner={isOwner} compact={compact} onReply={setThreadId} />;
            })}
          <div ref={endRef} />
        </div>
        <div className="h-5 px-5 text-xs text-slate-500 italic shrink-0">{names.length > 0 && `${names.join(', ')} ${names.length > 1 ? 'are' : 'is'} typing…`}</div>
        <Composer onTyping={onTyping} placeholder={isChannel ? `Message #${item.name}` : `Message ${other?.name}`}
          onSend={(content) => sendMessage(socket, { ...scope, content }).catch((e) => toast.error(e.message))} />
      </section>
      {thread && <ThreadPanel parent={thread} me={me} isOwner={isOwner} onClose={() => setThreadId(null)} />}
    </div>
  );
}

export default function ChatView(props) {
  if (props.kind === 'c' && !props.item.joined) return <JoinPrompt channel={props.item} onJoined={props.reload} />;
  return <Chat key={props.item._id} {...props} />;
}
