'use client';

// YENİ: useState eklendi
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// YENİ: WifiOff eklendi
import { ChevronDown, Send, X, MessageSquare, ArrowLeft, WifiOff } from 'lucide-react';

export default function ChatPanel({ isChatOpen, setIsChatOpen, activeChatId, setActiveChatId, data, messages, messageInput, setMessageInput, sendMessage }: any) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // YENİ: Sohbet için yerel çevrimdışı kontrolü
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // YENİ: İnternet durumunu anlık dinleyen yapı
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    // İlk yüklemede kontrol et
    setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Aktif personeli bul
  const activeStaff = activeChatId ? data?.staff?.find((s: any) => s.id === activeChatId) : null;

  // Personelin üzerindeki İŞ DURUMUNA göre otomatik durum ve renk belirleyen zeka
  const getDynamicStaffStatus = (staffId: string) => {
    // Personelin üzerine atanmış tüm işleri bul (Sorumlu veya Usta olarak)
    const staffJobs = data?.jobs?.filter((j: any) => j.staff_id === staffId || j.details?.worker_id === staffId) || [];
    
    // İş durumlarını kontrol et
    const isWorking = staffJobs.some((j: any) => j.status === 'Devam Ediyor');
    const isAssigned = staffJobs.some((j: any) => j.status === 'Beklemede' || j.status === 'Gelecek');
    
    if (isWorking) {
      return { 
        label: 'Çalışıyor', 
        dot: 'bg-amber-500', 
        badge: 'bg-amber-50 text-amber-600 border-amber-100' 
      };
    } else if (isAssigned) {
      return { 
        label: 'İş Atandı', 
        dot: 'bg-blue-500', 
        badge: 'bg-blue-50 text-blue-600 border-blue-100' 
      };
    } else {
      return { 
        label: 'Müsait', 
        dot: 'bg-emerald-500', 
        badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' 
      };
    }
  };

  const activeStatus = activeStaff ? getDynamicStaffStatus(activeStaff.id) : null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isChatOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="w-[320px] h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            
            {/* ÜST BİLGİ ALANI (HEADER) */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between font-medium text-xs shadow-md z-10">
              <div className="flex items-center gap-2">
                {activeStaff && activeStatus ? (
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setActiveChatId(null)} className="p-1.5 bg-slate-800/50 hover:bg-slate-700 rounded-md transition-colors">
                      <ArrowLeft size={16} />
                    </button>
                    <div className="flex flex-col">
                      <span className="font-bold text-[13px]">{activeStaff.name}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-semibold tracking-wide">
                         <span className={`w-1.5 h-1.5 rounded-full ${activeStatus.dot} shadow-[0_0_4px_rgba(0,0,0,0.5)]`}></span>
                         {activeStaff.role}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col pl-1">
                    <span className="text-[14px] font-black tracking-wide">Saha Ekibi İletişim</span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">Personel seçip mesajlaşmaya başlayın</span>
                  </div>
                )}
              </div>
              <ChevronDown className="cursor-pointer hover:text-blue-400 transition-colors mr-1 p-1" onClick={() => setIsChatOpen(false)} size={20} />
            </div>

            {/* SOHBET / PERSONEL LİSTESİ ALANI (BODY) */}
            {!activeChatId ? (
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto bg-slate-50 custom-scrollbar">
                 {data?.staff?.map((m: any) => {
                   const status = getDynamicStaffStatus(m.id);
                   
                   return (
                     <div key={m.id} onClick={() => setActiveChatId(m.id)} className="p-3 bg-white hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-3 shadow-sm border border-slate-100 transition-colors group">
                       <div className="relative">
                         <div className="w-10 h-10 bg-slate-100 text-slate-700 border border-slate-200 rounded-full flex items-center justify-center font-bold text-sm group-hover:bg-slate-200 transition-colors">
                           {m.name.charAt(0)}
                         </div>
                         {/* Dinamik Renkli Nokta */}
                         <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${status.dot}`}></span>
                       </div>
                       <div className="flex-1 overflow-hidden">
                         <div className="text-sm font-bold text-slate-800 truncate">{m.name}</div>
                         <div className="text-[11px] text-slate-500 font-medium truncate mt-1 flex items-center justify-between">
                           <span className="uppercase tracking-wider font-bold text-[9px]">{m.role}</span>
                           {/* Dinamik Durum Rozeti */}
                           <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${status.badge}`}>
                             {status.label}
                           </span>
                         </div>
                       </div>
                     </div>
                   );
                 })}
                 {(!data?.staff || data?.staff.length === 0) && (
                   <div className="text-center p-8 text-slate-400 text-xs font-medium">
                     Kayıtlı personel bulunamadı.
                   </div>
                 )}
              </div>
            ) : (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 text-xs custom-scrollbar">
                  {/* Sohbetteki o anki durum bildirimi */}
                  {activeStatus && (
                    <div className="flex justify-center mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${activeStatus.badge} shadow-sm opacity-80`}>
                        Şu anki durumu: {activeStatus.label}
                      </span>
                    </div>
                  )}

                  {messages.map((m: any, i: number) => (
                    <div key={i} className={`flex flex-col ${m.sender_id === 'PATRON' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] shadow-sm text-[13px] leading-relaxed ${m.sender_id === 'PATRON' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'}`}>
                        {m.message}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-medium px-1">
                        {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  ))}
                  {(!messages || messages.length === 0) && (
                    <div className="text-center mt-12 text-slate-400 text-[11px] font-medium px-4">
                      Henüz mesajlaşma yok. Tüm görüşmeler uçtan uca güvenli bir şekilde saklanır.
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
                  <input 
                    value={messageInput} 
                    onChange={e => setMessageInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && !isOffline && sendMessage()} 
                    disabled={isOffline}
                    placeholder={isOffline ? "İnternet bağlantısı yok..." : "Mesaj yazın..."} 
                    className="flex-1 bg-slate-50 px-4 py-2.5 rounded-xl text-[13px] outline-none border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-100" 
                  />
                  <button 
                    onClick={sendMessage} 
                    disabled={!messageInput.trim() || isOffline}
                    className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
                  >
                    {isOffline ? <WifiOff size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 relative border-2 border-white">
        {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}