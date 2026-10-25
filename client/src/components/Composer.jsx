import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

export default function Composer({ onSend, onTyping, placeholder }) {
  const [v, setV] = useState('');
  const ta = useRef();
  useEffect(() => {
    if (!ta.current) return;
    ta.current.style.height = 'auto';
    ta.current.style.height = Math.min(ta.current.scrollHeight, 160) + 'px';
  }, [v]);
  const send = () => {
    const t = v.trim();
    if (!t) return;
    onSend(t);
    setV('');
  };
  return (
    <div className="px-3 sm:px-4 pb-4 pt-2">
      <div className="flex items-end gap-2 border border-slate-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white">
        <textarea
          ref={ta} rows={1} value={v} maxLength={4000} placeholder={placeholder}
          onChange={(e) => { setV(e.target.value); onTyping?.(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
          }}
          className="flex-1 resize-none outline-none text-[15px] max-h-40 bg-transparent"
        />
        <button onClick={send} disabled={!v.trim()} className="p-2 rounded-lg bg-indigo-600 text-white disabled:bg-slate-200 disabled:text-slate-400" aria-label="Send">
          <Send size={16} />
        </button>
      </div>
      <p className="text-[11px] text-slate-400 mt-1 px-1 hidden sm:block">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
