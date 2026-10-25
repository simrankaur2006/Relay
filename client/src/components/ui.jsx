import { X } from 'lucide-react';

export const Spinner = () => <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" />;

export function Avatar({ user, size = 36 }) {
  const st = { width: size, height: size };
  return user?.avatar
    ? <img src={user.avatar} alt="" style={st} className="rounded-lg object-cover shrink-0" />
    : <div style={st} className="rounded-lg bg-indigo-500 text-white grid place-items-center text-sm font-semibold shrink-0">{(user?.name || '?')[0].toUpperCase()}</div>;
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 grid place-items-center p-4" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
export const btnCls = 'px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50';
