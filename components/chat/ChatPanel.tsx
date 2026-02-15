'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Send, X, MessageSquare } from 'lucide-react';

export default function ChatPanel({ isChatOpen, setIsChatOpen, activeChatId, setActiveChatId, data, messages, messageInput, setMessageInput, sendMessage }: any) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isChatOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="w-72 h-[400px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between font-medium text-xs">
              <div className="flex items-center gap-2">{activeChatId ? data?.staff?.find((s: any) => s.id === activeChatId)?.name : 'İletişim Paneli'}</div>
              <ChevronDown className="cursor-pointer" onClick={() => setIsChatOpen(false)} size={16} />
            </div>
            {!activeChatId ? (
              <div className="flex-1 p-2 space-y-1 overflow-y-auto bg-slate-50">
                 {data?.staff?.map((m: any) => <div key={m.id} onClick={() => setActiveChatId(m.id)} className="p-2.5 bg-white hover:bg-slate-50 rounded-lg cursor-pointer text-xs font-medium flex items-center gap-2 shadow-sm border border-slate-100 transition-colors">
                   <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-md flex items-center justify-center font-bold">{m.name.charAt(0)}</div>
                   {m.name}
                 </div>)}
              </div>
            ) : (
              <><div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs custom-scrollbar">
                  <button onClick={() => setActiveChatId(null)} className="text-[10px] font-semibold text-slate-500 mb-2 hover:text-slate-700">← Geri</button>
                  {messages.map((m: any, i: number) => (
                    <div key={i} className={`flex flex-col ${m.sender_id === 'PATRON' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2 rounded-lg max-w-[85%] ${m.sender_id === 'PATRON' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}`}>{m.message}</div>
                      <div className="text-[8px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                  <input value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Mesaj yazın..." className="flex-1 bg-slate-50 px-3 py-1.5 rounded-md text-xs outline-none border border-slate-200" />
                  <button onClick={sendMessage} className="bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 transition-colors"><Send size={14} /></button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors relative">
        {isChatOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </div>
  );
}