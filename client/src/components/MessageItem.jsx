import { useState } from 'react';
import { MessageSquare, Pencil, SmilePlus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { fmtTime } from '../lib/utils';
import { Avatar } from './ui';

export const EMOJIS = ['👍', '❤️', '😂', '🎉', '👀', '🙏'];

export default function MessageItem({ m, me, isOwner, compact, onReply }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(m.content);
  const [picker, setPicker] = useState(false);
  const mine = m.sender._id === me._id;
  const run = (p) => p.catch((e) => toast.error(errMsg(e)));
  const save = () => {
    const t = text.trim();
    if (!t) return;
    run(api.patch(`/api/messages/${m._id}`, { content: t }).then(() => setEditing(false)));
  };
  const del = () => window.confirm('Delete this message?') && run(api.delete(`/api/messages/${m._id}`));
  const react = (e) => { setPicker(false); run(api.post(`/api/messages/${m._id}/react`, { emoji: e })); };
  const btn = 'p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded';

  return (
    <div className={`group relative flex gap-3 px-3 sm:px-4 hover:bg-slate-50 rounded-lg ${compact ? 'py-0.5' : 'pt-2 pb-1 mt-2'}`}>
      {compact ? <div className="w-9 shrink-0" /> : <Avatar user={m.sender} />}
      <div className="min-w-0 flex-1">
        {!compact && (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-slate-900">{m.sender.name}</span>
            <span className="text-xs text-slate-400">{fmtTime(m.createdAt)}</span>
          </div>
        )}
        {editing ? (
          <div>
            <textarea
              autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
                if (e.key === 'Escape') { setEditing(false); setText(m.content); }
              }}
              className="w-full border border-indigo-400 rounded-lg px-2 py-1 text-[15px] outline-none"
            />
            <p className="text-xs text-slate-400">Enter to save · Esc to cancel</p>
          </div>
        ) : (
          <p className="text-[15px] text-slate-800 whitespace-pre-wrap break-words">
            {m.content}{m.edited && <span className="text-xs text-slate-400"> (edited)</span>}
          </p>
        )}
        {m.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {m.reactions.map((r) => (
              <button key={r.emoji} onClick={() => react(r.emoji)}
                className={`text-xs px-2 py-0.5 rounded-full border ${r.users.includes(me._id) ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                {r.emoji} {r.users.length}
              </button>
            ))}
          </div>
        )}
        {m.replyCount > 0 && onReply && (
          <button onClick={() => onReply(m._id)} className="mt-1 text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1">
            <MessageSquare size={12} /> {m.replyCount} {m.replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>
      <div className="absolute right-3 -top-3 hidden group-hover:flex focus-within:flex bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="relative">
          <button className={btn} onClick={() => setPicker(!picker)} aria-label="React"><SmilePlus size={15} /></button>
          {picker && (
            <div className="absolute right-0 top-full mt-1 z-20 flex bg-white border border-slate-200 rounded-lg shadow-lg p-1">
              {EMOJIS.map((e) => <button key={e} className="p-1.5 hover:bg-slate-100 rounded" onClick={() => react(e)}>{e}</button>)}
            </div>
          )}
        </div>
        {onReply && <button className={btn} onClick={() => onReply(m._id)} aria-label="Reply in thread"><MessageSquare size={15} /></button>}
        {mine && <button className={btn} onClick={() => { setText(m.content); setEditing(true); }} aria-label="Edit"><Pencil size={15} /></button>}
        {(mine || isOwner) && <button className={btn} onClick={del} aria-label="Delete"><Trash2 size={15} /></button>}
      </div>
    </div>
  );
}
