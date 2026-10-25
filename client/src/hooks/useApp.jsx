import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';
import api, { API_URL, errMsg, setTokenGetter } from '../lib/api';
import { Spinner } from '../components/ui';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const { getToken } = useAuth();
  setTokenGetter(() => getToken());
  const [st, setSt] = useState({ me: null, workspaces: [], socket: null, error: null, loading: true });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/me');
      setSt((s) => ({ ...s, me: data.user, workspaces: data.workspaces, loading: false, error: null }));
    } catch (e) {
      setSt((s) => ({ ...s, loading: false, error: errMsg(e) }));
    }
  }, []);

  useEffect(() => {
    load();
    const socket = io(API_URL, { auth: (cb) => getToken().then((token) => cb({ token })) });
    setSt((s) => ({ ...s, socket }));
    return () => socket.disconnect();
  }, []); // eslint-disable-line

  if (st.loading) return <div className="h-full grid place-items-center"><Spinner /></div>;
  if (st.error || !st.me)
    return (
      <div className="h-full grid place-items-center p-6 text-center">
        <div>
          <p className="font-semibold text-slate-900">Couldn't reach the Relay server</p>
          <p className="text-sm text-slate-500 mt-1">{st.error}</p>
          <button onClick={() => { setSt((s) => ({ ...s, loading: true })); load(); }} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Retry</button>
        </div>
      </div>
    );
  return <Ctx.Provider value={{ ...st, reload: load }}>{children}</Ctx.Provider>;
}
