import { useEffect, useState } from 'react';
import { Hash, Search } from 'lucide-react';
import api, { errMsg } from '../lib/api';
import { fmtTime } from '../lib/utils';
import toast from 'react-hot-toast';

export default function SearchBar({ wid, data, me, nav }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  useEffect(() => {
    setRes(null);
    if (q.trim().length < 2) return;
    const t = setTimeout(() => {
      api.get(`/api/workspaces/${wid}/search`, { params: { q: q.trim() } }).then((r) => setRes(r.data)).catch((e) => toast.error(errMsg(e)));
    }, 350);
    return () => clearTimeout(t);
  }, [q, wid]);

  const label = (m) => {
    if (m.channel) return { icon: true, text: data.channels.find((c) => c._id === m.channel)?.name || 'channel' };
    const c = data.conversations.find((c) => c._id === m.conversation);
    return { text: c?.participants.find((p) => p._id !== me._id)?.name || 'direct message' };
  };
  const go = (m) => { nav(m.channel ? `/w/${wid}/c/${m.channel}` : `/w/${wid}/d/${m.conversation}`); setQ(''); };

  return (
    <div className="relative flex-1 max-w-xl">
      <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages"
        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500" />
      {res && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setQ('')} />
          <div className="absolute z-40 top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-96 overflow-y-auto">
            {res.length === 0 ? <p className="p-4 text-sm text-slate-500">No messages found for “{q}”.</p>
              : res.map((m) => {
                const l = label(m);
                return (
                  <button key={m._id} onClick={() => go(m)} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      {l.icon && <Hash size={12} />}<span className="font-medium text-slate-700">{l.text}</span> · {m.sender.name} · {fmtTime(m.createdAt)}
                    </div>
                    <p className="text-sm text-slate-800 truncate">{m.content}</p>
                  </button>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
