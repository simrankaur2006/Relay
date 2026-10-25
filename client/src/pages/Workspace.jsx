import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Menu, MessagesSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { roomKey } from '../lib/utils';
import { useApp } from '../hooks/useApp';
import Sidebar from '../components/Sidebar';
import ChatView from '../components/ChatView';
import SearchBar from '../components/SearchBar';
import { Modal, Spinner, btnCls, inputCls } from '../components/ui';

function NewChannel({ wid, onClose, onCreated }) {
  const [f, setF] = useState({ name: '', description: '', type: 'public' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post(`/api/workspaces/${wid}/channels`, f); await onCreated(data._id); }
    catch (err) { toast.error(errMsg(err)); setBusy(false); }
  };
  return (
    <Modal title="Create a channel" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input autoFocus required maxLength={40} className={inputCls} placeholder="e.g. design-team" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input maxLength={200} className={inputCls} placeholder="Description (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="flex gap-4 text-sm">
          {['public', 'private'].map((t) => (
            <label key={t} className="flex items-center gap-2 capitalize"><input type="radio" checked={f.type === t} onChange={() => setF({ ...f, type: t })} />{t}</label>
          ))}
        </div>
        <button disabled={busy} className={btnCls}>Create channel</button>
      </form>
    </Modal>
  );
}

export default function Workspace() {
  const { wid, kind, id } = useParams();
  const nav = useNavigate();
  const { me, workspaces, socket } = useApp();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [unread, setUnread] = useState({});
  const [drawer, setDrawer] = useState(false);
  const [modal, setModal] = useState(false);
  const activeKey = kind === 'c' ? 'channel:' + id : kind === 'd' ? 'conv:' + id : null;

  const load = useCallback(() => api.get(`/api/workspaces/${wid}`).then((r) => { setData(r.data); setErr(null); }).catch((e) => setErr(errMsg(e))), [wid]);
  useEffect(() => { setData(null); setErr(null); setUnread({}); load(); try { localStorage.setItem('relay:ws', wid); } catch { /* ignore */ } }, [load, wid]);
  useEffect(() => { if (activeKey) setUnread((u) => ({ ...u, [activeKey]: 0 })); }, [activeKey]);

  const ref = useRef({});
  ref.current = { activeKey, data, wid };
  useEffect(() => {
    if (!socket) return;
    const onNew = ({ message: m }) => {
      const { activeKey, data, wid } = ref.current;
      if (m.sender._id === me._id || m.parent) return;
      if (m.workspace !== wid) return toast(`${m.sender.name} sent a message in another workspace`);
      const key = roomKey(m);
      if (data && m.conversation && !data.conversations.some((c) => c._id === m.conversation)) load();
      if (key === activeKey) return;
      setUnread((u) => ({ ...u, [key]: (u[key] || 0) + 1 }));
      const where = m.channel ? '#' + (data?.channels.find((c) => c._id === m.channel)?.name || 'channel') : 'DM';
      toast(`${m.sender.name} in ${where}: ${m.content.slice(0, 60)}`, { icon: '💬' });
    };
    const onRefresh = (p) => p.workspace === ref.current.wid && load();
    socket.on('message:new', onNew); socket.on('refresh', onRefresh);
    return () => { socket.off('message:new', onNew); socket.off('refresh', onRefresh); };
  }, [socket, me._id, load]);

  const go = (p) => { setDrawer(false); nav(p); };
  const startDM = async (userId) => {
    try { const { data: c } = await api.post(`/api/workspaces/${wid}/conversations`, { userId }); await load(); go(`/w/${wid}/d/${c._id}`); }
    catch (e) { toast.error(errMsg(e)); }
  };

  if (err) return (
    <div className="h-full grid place-items-center p-6 text-center">
      <div><p className="font-semibold text-slate-900">Couldn't open this workspace</p><p className="text-sm text-slate-500 mt-1">{err}</p>
        <Link to="/?new=1" className={`${btnCls} inline-block mt-4`}>Back to Relay</Link></div>
    </div>
  );
  if (!data) return <div className="h-full grid place-items-center"><Spinner /></div>;

  if (!kind) {
    const first = data.channels.find((c) => c.joined) || data.channels[0];
    if (first) return <Navigate to={`/w/${wid}/c/${first._id}`} replace />;
  }
  const item = kind === 'c' ? data.channels.find((c) => c._id === id) : kind === 'd' ? data.conversations.find((c) => c._id === id) : null;

  return (
    <div className="h-full flex bg-white">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 transform transition-transform lg:static lg:translate-x-0 shrink-0 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar data={data} workspaces={workspaces} me={me} kind={kind} id={id} unread={unread} nav={go}
          onNewChannel={() => { setDrawer(false); setModal(true); }} onDM={startDM} onClose={() => setDrawer(false)} />
      </aside>
      {drawer && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setDrawer(false)} />}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="h-14 px-3 sm:px-4 border-b border-slate-200 flex items-center gap-3 shrink-0 bg-white">
          <button className="lg:hidden p-2 -ml-1 text-slate-600" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu size={20} /></button>
          <SearchBar wid={wid} data={data} me={me} nav={go} />
        </div>
        {item ? (
          <ChatView kind={kind} item={item} me={me} workspace={data.workspace} reload={load} />
        ) : (
          <div className="flex-1 grid place-items-center text-center p-6">
            <div><MessagesSquare className="mx-auto text-slate-300" size={44} />
              <p className="mt-3 font-medium text-slate-700">{kind ? 'Conversation not found' : 'Nothing here yet'}</p>
              <p className="text-sm text-slate-500">Create a channel or pick a teammate to start chatting.</p></div>
          </div>
        )}
      </main>
      {modal && <NewChannel wid={wid} onClose={() => setModal(false)} onCreated={async (cid) => { await load(); setModal(false); go(`/w/${wid}/c/${cid}`); }} />}
    </div>
  );
}
