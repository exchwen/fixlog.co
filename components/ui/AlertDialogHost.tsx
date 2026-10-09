'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function AlertDialogHost() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const originalAlert = window.alert.bind(window);
    window.alert = (message?: any) => setMessages(current => [...current, String(message ?? '')]);
    return () => { window.alert = originalAlert; };
  }, []);

  const close = () => setMessages(current => current.slice(1));
  if (!messages.length) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="app-alert-title" aria-describedby="app-alert-message" className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5 text-slate-800"><AlertCircle size={20} className="text-blue-600" /><h2 id="app-alert-title" className="font-bold">Bilgilendirme</h2></div>
          <button type="button" onClick={close} aria-label="Kapat" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div id="app-alert-message" className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words px-5 py-5 text-sm leading-6 text-slate-600">{messages[0]}</div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button type="button" autoFocus onClick={close} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800">Tamam</button>
        </div>
      </div>
    </div>
  );
}
