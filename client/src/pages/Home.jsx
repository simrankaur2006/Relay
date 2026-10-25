import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { useApp } from '../hooks/useApp';
import { btnCls, inputCls } from '../components/ui';

export default function Home() {
  const { workspaces, reload, me } = useApp();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (workspaces.length && !sp.get('new')) {
    let last = null;
    try { last = localStorage.getItem('relay:ws'); } catch { /* ignore */ }
    const t = workspaces.find((w) => w._id === last) || workspaces[0];
    return <Navigate to={`/w/${t._id}`} replace />;
  }
  const submit = (url, body) => async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post(url, body); await reload(); nav(`/w/${data._id}`); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-900"><MessagesSquare className="text-indigo-600" /> Relay</div>
          <UserButton />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {me.name.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 mt-1">Create a workspace for your team, or join one with an invite code.</p>
        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <form onSubmit={submit('/api/workspaces', { name })} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <h2 className="font-semibold text-slate-900">Create a workspace</h2>
            <input required minLength={2} maxLength={50} className={inputCls} placeholder="Acme Inc." value={name} onChange={(e) => setName(e.target.value)} />
            <button disabled={busy} className={btnCls}>Create workspace</button>
          </form>
          <form onSubmit={submit('/api/workspaces/join', { code })} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <h2 className="font-semibold text-slate-900">Join with invite code</h2>
            <input required className={inputCls} placeholder="Paste invite code" value={code} onChange={(e) => setCode(e.target.value)} />
            <button disabled={busy} className={btnCls}>Join workspace</button>
          </form>
        </div>
        {workspaces.length > 0 && <button onClick={() => nav('/')} className="mt-6 text-sm text-indigo-600 hover:underline">← Back to my workspaces</button>}
      </div>
    </div>
  );
}
