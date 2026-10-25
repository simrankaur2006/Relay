import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import useMessages from '../hooks/useMessages';
import { useApp } from '../hooks/useApp';
import { sendMessage } from '../lib/api';
import MessageItem from './MessageItem';
import Composer from './Composer';
import { Spinner } from './ui';

export default function ThreadPanel({ parent, me, isOwner, onClose }) {
  const { socket } = useApp();
  const { messages, loading, error } = useMessages({ parentId: parent._id });
  return (
    <aside className="fixed inset-0 z-50 lg:static lg:z-auto lg:w-96 shrink-0 bg-white border-l border-slate-200 flex flex-col">
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Thread</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close thread"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <MessageItem m={parent} me={me} isOwner={isOwner} />
        <div className="px-4 py-2 text-xs text-slate-400 border-y border-slate-100 my-2">{parent.replyCount} {parent.replyCount === 1 ? 'reply' : 'replies'}</div>
        {loading ? <div className="grid place-items-center py-6"><Spinner /></div>
          : error ? <p className="text-sm text-red-600 px-4">{error}</p>
          : messages.map((m, i) => (
            <MessageItem key={m._id} m={m} me={me} isOwner={isOwner}
              compact={i > 0 && messages[i - 1].sender._id === m.sender._id && new Date(m.createdAt) - new Date(messages[i - 1].createdAt) < 300000} />
          ))}
      </div>
      <Composer placeholder="Reply…" onSend={(content) => sendMessage(socket, { parentId: parent._id, content }).catch((e) => toast.error(e.message))} />
    </aside>
  );
}
