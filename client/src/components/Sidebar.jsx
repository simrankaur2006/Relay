import { useState } from 'react';
import { ChevronDown, Copy, Hash, Lock, Plus, X } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { Avatar } from './ui';

const Badge = ({ n }) => n ? <span className="ml-auto bg-indigo-500 text-white text-[11px] font-semibold rounded-full px-1.5 min-w-[18px] text-center">{n}</span> : null;
const Row = ({ active, dim, onClick, children }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-left transition ${active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'} ${dim ? 'opacity-60' : ''}`}>
    {children}
  </button>
);
const Label = ({ children, action }) => (
  <div className="flex items-center justify-between px-3 mb-1 text-xs uppercase tracking-wide text-slate-500">
    <span>{children}</span>{action}
  </div>
);

export default function Sidebar({ data, workspaces, me, kind, id, unread, nav, onNewChannel, onDM, onClose }) {
  const { workspace: ws, channels, conversations } = data;
  const [open, setOpen] = useState(false);
  const people = ws.members.map((m) => m.user).filter((u) => u._id !== me._id);
  const copy = () => { navigator.clipboard?.writeText(ws.inviteCode); toast.success('Invite code copied'); };

  return (
    <div className="h-full flex flex-col text-slate-300">
      <div className="relative p-3 border-b border-slate-800">
        <div className="flex items-center gap-1">
          <button onClick={() => setOpen(!open)} className="flex-1 min-w-0 flex items-center gap-2 text-left rounded-md px-2 py-1.5 hover:bg-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white grid place-items-center font-bold shrink-0">{ws.name[0].toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold truncate">{ws.name}</div>
              <div className="text-xs text-slate-400">{ws.members.length} {ws.members.length === 1 ? 'member' : 'members'}</div>
            </div>
            <ChevronDown size={16} />
          </button>
          <button className="lg:hidden p-1 text-slate-400" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
        </div>
        {open && (
          <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-slate-800 rounded-lg shadow-xl p-2 space-y-1">
            {workspaces.map((w) => <Row key={w._id} active={w._id === ws._id} onClick={() => { setOpen(false); nav(`/w/${w._id}`); }}>{w.name}</Row>)}
            <Row onClick={() => nav('/?new=1')}><Plus size={14} /> Create or join workspace</Row>
            <button onClick={copy} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 border-t border-slate-700 mt-1 hover:text-white">
              <Copy size={12} /> Invite code: <b className="text-slate-200 font-mono">{ws.inviteCode}</b>
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        <section>
          <Label action={<button onClick={onNewChannel} className="hover:text-white" aria-label="New channel"><Plus size={14} /></button>}>Channels</Label>
          {channels.map((c) => (
            <Row key={c._id} dim={!c.joined} active={kind === 'c' && id === c._id} onClick={() => nav(`/w/${ws._id}/c/${c._id}`)}>
              {c.type === 'private' ? <Lock size={14} /> : <Hash size={14} />}
              <span className="truncate">{c.name}</span><Badge n={unread['channel:' + c._id]} />
            </Row>
          ))}
        </section>
        <section>
          <Label>Direct messages</Label>
          {people.length === 0 && <p className="px-3 text-xs text-slate-500">Share the invite code to add teammates.</p>}
          {people.map((u) => {
            const conv = conversations.find((c) => c.participants.some((p) => p._id === u._id));
            return (
              <Row key={u._id} active={kind === 'd' && conv && id === conv._id} onClick={() => (conv ? nav(`/w/${ws._id}/d/${conv._id}`) : onDM(u._id))}>
                <Avatar user={u} size={20} /><span className="truncate">{u.name}</span>
                {conv && <Badge n={unread['conv:' + conv._id]} />}
              </Row>
            );
          })}
        </section>
      </div>
      <div className="p-3 border-t border-slate-800 flex items-center gap-3">
        <UserButton />
        <div className="min-w-0">
          <div className="text-sm text-white truncate">{me.name}</div>
          <div className="text-xs text-slate-500 truncate">{me.email}</div>
        </div>
      </div>
    </div>
  );
}
