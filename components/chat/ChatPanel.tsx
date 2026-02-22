'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Send, X, MessageSquare, ArrowLeft, WifiOff } from 'lucide-react';

export default function ChatPanel({ isChatOpen, setIsChatOpen, activeChatId, setActiveChatId, data, messages, setMessages, messageInput, setMessageInput, sendMessage }: any) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [isOffline, setIsOffline] = useState(false);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Sayfa Patron sayfası mı?
    const isPatronPath = window.location.pathname.includes('/dashboard');
    const prefix = isPatronPath ? 'patron_' : 'staff_';
    
    const storedRole = localStorage.getItem(`${prefix}userRole`);
    setCurrentUserRole(storedRole);
    // Patron ise sender_id genelde 'PATRON' atılır. Değilse kendi ID'sidir.
    // Ancak Optimistic Update (anında gösterme) için role yeterli.
  }, []);
  
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        setIsChatOpen(false);
      }
    };

    const handlePopState = () => {
      if (isChatOpen) {
        setIsChatOpen(false);
      }
    };

    if (isChatOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('popstate', handlePopState);
      
      if (!window.history.state?.chatOpen) {
         window.history.pushState({ chatOpen: true }, '');
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isChatOpen, setIsChatOpen]);

  useEffect(() => {
    if (activeChatId) {
      const draftKey = `chat_draft_${activeChatId}`;
      if (messageInput) {
        localStorage.setItem(draftKey, messageInput);
      } else {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          setMessageInput(savedDraft);
        }
      }
    }
  }, [messageInput, activeChatId, setMessageInput]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || isOffline) return;
    
    // 1. Optimistic UI Update: Mesajı anında ekrana ekle! (Beklemeden)
    // Eğer setMessages prop'u geliyorsa doğrudan diziye ekleriz.
    const newMessage = {
      message: messageInput,
      sender_id: currentUserRole === 'Patron' ? 'PATRON' : 'STAFF', // Geçici ID, ekranda sağda çıksın diye
      created_at: new Date().toISOString()
    };
    
    if (setMessages) {
        setMessages((prev: any) => [...prev, newMessage]);
    }

    // 2. Gerçek isteği at
    sendMessage();
    
    // 3. Temizlik
    if (activeChatId) {
      localStorage.removeItem(`chat_draft_${activeChatId}`);
    }
    // Mesaj kutusu temizlenir (sendMessage içinde yapılıyordu ama garanti olsun)
    setMessageInput('');
  };

  const activeStaff = activeChatId ? data?.staff?.find((s: any) => s.id === activeChatId) : null;

  const getDynamicStaffStatus = (staffId: string) => {
    const staffJobs = data?.jobs?.filter((j: any) => j.staff_id === staffId || j.details?.worker_id === staffId) || [];
    
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

  // Hangi kullanıcının mesaj attığını ve balon rengini belirleriz
  const isMessageFromMe = (m: any) => {
    // Eğer Patron ekranındaysak, sender_id 'PATRON' olanlar sağda çıksın
    if (currentUserRole === 'Patron' && m.sender_id === 'PATRON') return true;
    
    // Eğer Personel ekranındaysak, sender_id 'PATRON' OLMAYANLAR (kendisi) sağda çıksın
    if (currentUserRole !== 'Patron' && m.sender_id !== 'PATRON') return true;
    
    return false;
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.95 }} 
            className="w-[calc(100vw-32px)] sm:w-[340px] h-[70vh] max-h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden origin-bottom-right pointer-events-auto"
          >
            
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between font-medium text-xs shadow-md z-10 shrink-0">
              <div className="flex items-center gap-2">
                {activeStaff && activeStatus ? (
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setActiveChatId(null)} className="p-1.5 bg-slate-800/50 hover:bg-slate-700 rounded-md transition-colors active:scale-95">
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
              <ChevronDown className="cursor-pointer hover:text-blue-400 transition-colors mr-1 p-1 active:scale-95" onClick={() => setIsChatOpen(false)} size={20} />
            </div>

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
                         <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${status.dot}`}></span>
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-sm font-bold text-slate-800 truncate">{m.name}</div>
                         <div className="text-[11px] text-slate-500 font-medium truncate mt-1 flex items-center justify-between gap-2">
                           <span className="uppercase tracking-wider font-bold text-[9px] truncate">{m.role}</span>
                           <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${status.badge}`}>
                             {status.label}
                           </span>
                         </div>
                       </div>
                     </div>
                   );
                 })}
                 {(!data?.staff || data?.staff.length === 0) && (
                   <div className="text-center p-8 text-slate-400 text-xs font-medium flex flex-col items-center justify-center h-full gap-2">
                     <MessageSquare size={32} className="opacity-20" />
                     Kayıtlı personel bulunamadı.
                   </div>
                 )}
              </div>
            ) : (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 text-xs custom-scrollbar">
                  {activeStatus && (
                    <div className="flex justify-center mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${activeStatus.badge} shadow-sm opacity-80`}>
                        Şu anki durumu: {activeStatus.label}
                      </span>
                    </div>
                  )}

                  {messages?.map((m: any, i: number) => {
                    const fromMe = isMessageFromMe(m);
                    return (
                      <div key={i} className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] shadow-sm text-[13px] leading-relaxed break-words ${fromMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'}`}>
                          {m.message}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium px-1">
                          {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    )
                  })}
                  {(!messages || messages.length === 0) && (
                    <div className="text-center mt-12 text-slate-400 text-[11px] font-medium px-4">
                      Henüz mesajlaşma yok. Tüm görüşmeler uçtan uca güvenli bir şekilde saklanır.
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="p-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center shrink-0">
                  <input 
                    value={messageInput} 
                    onChange={e => setMessageInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && !isOffline && handleSendMessage()} 
                    disabled={isOffline}
                    placeholder={isOffline ? "İnternet bağlantısı yok..." : "Mesaj yazın..."} 
                    className="flex-1 bg-slate-50 px-4 py-3 sm:py-2.5 rounded-xl text-[13px] outline-none border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-100" 
                  />
                  <button 
                    onClick={handleSendMessage} 
                    disabled={!messageInput.trim() || isOffline}
                    className="bg-blue-600 text-white p-3 sm:p-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center shrink-0 active:scale-95"
                  >
                    {isOffline ? <WifiOff size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)} 
        className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 relative border-2 border-white pointer-events-auto"
      >
        {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}