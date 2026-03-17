'use client';

// YENİ: useEffect, useState ve WifiOff eklendi
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lightbulb, Wrench, Send, Loader2, CheckCircle, AlertTriangle, WifiOff, History, Clock } from 'lucide-react';

export default function SupportTab({ handleAction, isSaving }: any) {
  const [ticketType, setTicketType] = useState('Öneri/İstek');
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState<'idle' | 'success' | 'error'>('idle');

  // Çevrimdışı kontrolü için State
  const [isOffline, setIsOffline] = useState(false);

  // 🚀 YENİ: Sekme kontrolü ve geçmiş bilet listesi için stateler
  const [activeView, setActiveView] = useState<'new' | 'history'>('new');
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // 🚀 YENİ: Firma içi yanıt gönderme stateleri
  const [replyMessageText, setReplyMessageText] = useState<{ [key: string]: string }>({});
  const [isReplying, setIsReplying] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const toggleTicket = (id: string) => {
    setExpandedTicketId(prev => (prev === id ? null : id));
  };

  const fetchMyTickets = async () => {
    const activeSlug = localStorage.getItem('companySlug') || localStorage.getItem('slug');
    if (!activeSlug) return; // Slug yoksa hiç istek atma, 401'i engeller.
    
    setIsLoadingTickets(true);
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
      // 🚀 CORS ÇÖZÜMÜ: Cache-Control başlığı Worker tarafından reddedildiği için kaldırıldı, önbellek kırma işini sadece URL parametresi yapacak.
      const res = await fetch(`${BASE_URL}/get-my-tickets?t=${Date.now()}`, {
        headers: { 
            "Authorization": `Bearer ${token}` 
        }
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setMyTickets(data);
      } else {
        setMyTickets([]);
      }
    } catch (e) {
      console.error("Biletler çekilemedi:", e);
      setMyTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleCustomerReply = async (ticketId: string) => {
    const text = replyMessageText[ticketId];
    if (!text || !text.trim()) return;

    setIsReplying(true);
    try {
        const activeSlug = localStorage.getItem('companySlug') || localStorage.getItem('slug');
        const token = localStorage.getItem('token');
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
        
        const res = await fetch(`${BASE_URL}/reply-support-ticket`, {
            method: 'POST',
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ slug: activeSlug, ticketId, replyMessage: text })
        });
        
        const result = await res.json();
        if (result.success) {
            setReplyMessageText(prev => ({ ...prev, [ticketId]: '' }));
            // Sadece başarılıysa listeyi yenile
            await fetchMyTickets();
        }
    } catch(e) {
        console.error("Yanıt gönderilemedi", e);
    } finally {
        setIsReplying(false);
    }
  };

  useEffect(() => {
    if (activeView === 'history') {
      fetchMyTickets();
    }
  }, [activeView]);

  // İnternet durumunu dinleyen useEffect
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const activeSlug = localStorage.getItem('companySlug') || localStorage.getItem('slug') || '';

    // Çevrimdışı/Offline Kuyruk Koruması Entegrasyonu
    if (isOffline) {
       console.warn("İnternet bağlantısı yok. Destek talebi kuyruğa alındı.");
       const pending = JSON.parse(localStorage.getItem(`offline_actions_${activeSlug}`) || '[]');
       // 🚀 YENİ: Kuyruğa atarken slug'ı unutmuyoruz!
       pending.push({ endpoint: 'add-support-ticket', body: { slug: activeSlug, type: ticketType, message }, timestamp: new Date().toISOString() });
       localStorage.setItem(`offline_actions_${activeSlug}`, JSON.stringify(pending));
       
       setModalState('success');
       setMessage('');
       setTimeout(() => setModalState('idle'), 3000);
       return;
    }

    // 🚀 YENİ: handleAction'a slug ekledik. Yoksa DB'ye kaydederken firma bilgisini bulamaz ve biletler firmaya listelenmez!
    const success = await handleAction('add-support-ticket', { slug: activeSlug, type: ticketType, message });
    
    if (success) {
      setModalState('success');
      setMessage('');
      // 🚀 YENİ: Başarılı olunca geçmiş talepler sekmesine geçir ve listeyi yenile
      setTimeout(() => {
        setModalState('idle');
        setActiveView('history');
      }, 2000);
    } else {
      setModalState('error');
      setTimeout(() => setModalState('idle'), 3000);
    }
  };

  const types = [
    { id: 'Öneri/İstek', icon: Lightbulb, title: 'Öneri / İstek', desc: 'Sistemde görmek istediğiniz yeni bir özellik.' },
    { id: 'Teknik Destek', icon: Wrench, title: 'Teknik Destek', desc: 'Sistemde yaşadığınız bir hata veya sorun.' },
    { id: 'Geri Bildirim', icon: MessageSquare, title: 'Geri Bildirim', desc: 'Uygulama hakkındaki genel düşünceleriniz.' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      
      {/* BAŞLIK */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-3 sm:pb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            Destek & Geri Bildirim Merkezi
            {/* Offline durumu için küçük ikon. Span içine alındı. */}
            {isOffline && <span title="Çevrimdışı Mod"><WifiOff size={16} className="text-amber-500" /></span>}
          </h3>
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1">İş Dökümü ekibine ulaşın. Fikirleriniz bizim için çok değerli.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* SOL TARAF - BİLGİLENDİRME */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 md:w-1/3 flex flex-col justify-between shrink-0">
            <div>
                <h4 className="text-lg sm:text-xl font-black mb-3 sm:mb-4">Sizi Dinliyoruz</h4>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                    İş Dökümü sistemini sizlerin taleplerine göre geliştiriyoruz. Bir özelliğin eksik olduğunu düşünüyorsanız veya teknik bir aksaklık yaşıyorsanız bize anında buradan bildirebilirsiniz.
                </p>
            </div>
            <div className="bg-white/10 p-4 sm:p-5 rounded-xl border border-white/10 backdrop-blur-sm mt-4 md:mt-0">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Yanıt Süresi</div>
                <div className="text-xs sm:text-sm font-semibold text-white leading-snug">Talepleriniz ortalama <span className="text-emerald-400 font-black">2-4 saat</span> içinde ekibimiz tarafından incelenir.</div>
            </div>
        </div>

        {/* SAĞ TARAF - FORM VE GEÇMİŞ */}
        <div className="p-5 sm:p-8 md:w-2/3 flex flex-col justify-start">
            
            {/* 🚀 YENİ: SEKMELER (TABS) */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-fit border border-slate-200">
              <button 
                onClick={() => setActiveView('new')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Send size={14} /> Yeni Talep
              </button>
              <button 
                onClick={() => setActiveView('history')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <History size={14} /> Geçmiş Taleplerim
              </button>
            </div>

            <AnimatePresence mode="wait">
                {modalState === 'success' ? (
                    <motion.div 
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="h-full flex flex-col items-center justify-center text-center py-10 sm:py-16"
                    >
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Talebiniz Alındı!</h3>
                        <p className="text-slate-500 font-medium px-4 text-sm">
                          {/* Çevrimdışı ise farklı mesaj gösterilir */}
                          {isOffline 
                            ? 'İnternet bağlantınız yok. Talebiniz cihaza kaydedildi, bağlantı sağlandığında ekibimize iletilecektir.' 
                            : 'Geri bildiriminiz İş Dökümü ekibine başarıyla iletildi. İlginiz için teşekkür ederiz.'}
                        </p>
                    </motion.div>
                ) : modalState === 'error' ? (
                     <motion.div 
                        key="error"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="h-full flex flex-col items-center justify-center text-center py-10 sm:py-16"
                    >
                        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
                            <AlertTriangle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Gönderim Başarısız!</h3>
                        <p className="text-slate-500 mb-6 font-medium px-4 text-sm">Bağlantı hatası nedeniyle talebiniz iletilemedi. Lütfen daha sonra tekrar deneyin.</p>
                        <button onClick={() => setModalState('idle')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold active:scale-95 transition-all shadow-md">Tekrar Dene</button>
                    </motion.div>
                ) : activeView === 'new' ? (
                  <motion.form 
                      key="form"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                      onSubmit={handleSubmit} 
                      className="space-y-6"
                  >
                      {/* KONU SEÇİMİ */}
                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Ne hakkında yazmak istersiniz?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {types.map((type) => {
                                    // JSX Parsing hatasını engellemek için Icon değişkenine atandı
                                    const Icon = type.icon;
                                    return (
                                      <div 
                                          key={type.id}
                                          onClick={() => setTicketType(type.id)}
                                          // YENİ: active:scale-95 eklendi (Mobil Dokunmatik Hissi)
                                          className={`cursor-pointer border rounded-xl p-4 sm:p-3 flex flex-row sm:flex-col items-center sm:text-center gap-3 sm:gap-0 transition-all active:scale-95 ${ticketType === type.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                                      >
                                          <Icon size={24} className={`sm:mb-2 shrink-0 ${ticketType === type.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                          <div className={`font-bold text-sm sm:mb-1 ${ticketType === type.id ? 'text-blue-700' : 'text-slate-700'}`}>{type.title}</div>
                                      </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* MESAJ ALANI */}
                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mesajınız</label>
                            <textarea
                                required
                                rows={5}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Talebinizi veya karşılaştığınız sorunu detaylıca buraya yazabilirsiniz..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 resize-none"
                            ></textarea>
                        </div>

                        {/* GÖNDER BUTONU */}
                        <div className="flex justify-end pt-2">
                            {/* YENİ: Mobilde buton tam genişlik (w-full), masaüstünde normal (sm:w-auto) */}
                            <button 
                                type="submit"
                                disabled={isSaving || !message.trim()}
                                className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 active:scale-95"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : (isOffline ? <WifiOff size={18} /> : <Send size={18} />)}
                                {isSaving ? 'Gönderiliyor...' : (isOffline ? 'Kuyruğa Al' : 'Talebi İlet')}
                            </button>
                        </div>
                    </motion.form>
                ) : (
                    // 🚀 YENİ: GEÇMİŞ TALEPLER LİSTESİ VE SOHBET
                    <motion.div 
                      key="history"
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className="space-y-4 h-[400px] overflow-y-auto pr-2 scrollbar-hide"
                    >
                      {isLoadingTickets ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-500" /></div>
                      ) : myTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <History size={40} className="mb-3 opacity-20" />
                          <p className="text-sm font-medium">Henüz bir destek talebi oluşturmadınız.</p>
                        </div>
                      ) : (
                        myTickets.map(ticket => {
                          let replies = [];
                          try { replies = JSON.parse(ticket.replies || '[]'); } catch(e) {}
                          
                          return (
                          <div 
                            key={ticket.id} 
                            onClick={() => toggleTicket(ticket.id)}
                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                {ticket.type} 
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${ticket.status === 'Çözüldü' || ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                {ticket.status === 'Çözüldü' || ticket.status === 'Resolved' ? 'Çözüldü' : 'Açık'}
                              </span>
                            </div>
                            
                            <div className="text-sm text-slate-600 font-medium line-clamp-1 mb-2">
                                {ticket.message}
                            </div>
                            <div className="text-[10px] text-slate-400 mb-2 font-medium flex items-center gap-1">
                                <Clock size={12} /> {new Date(ticket.created_at).toLocaleString('tr-TR')} • {replies.length} Yanıt
                            </div>

                            <AnimatePresence>
                                {expandedTicketId === ticket.id && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="overflow-hidden border-t border-slate-100 mt-3 pt-3"
                                    >
                                        {/* Orijinal Mesaj */}
                                        <div className="bg-slate-50 p-3 rounded-xl mb-3 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">İlk Mesajınız</div>
                                            <p className="text-sm text-slate-700">{ticket.message}</p>
                                        </div>
                                        
                                        {/* 🚀 YENİ: SOHBET GEÇMİŞİ */}
                                        {replies.length > 0 && (
                                            <div className="space-y-2 mb-4 pl-3 ml-2 border-l-2 border-slate-200">
                                               {replies.map((reply: any, idx: number) => (
                                                  <div key={idx} className={`p-3 rounded-xl text-sm ${reply.sender === 'masterboss' ? 'bg-blue-50 border border-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700'}`}>
                                                     <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${reply.sender === 'masterboss' ? 'text-blue-600' : 'text-slate-500'}`}>
                                                            {reply.sender === 'masterboss' ? 'Destek Ekibi' : 'Siz'}
                                                        </span>
                                                        <span className="text-[9px] opacity-60">{new Date(reply.date).toLocaleString('tr-TR')}</span>
                                                     </div>
                                                     <p className="font-medium">{reply.message}</p>
                                                  </div>
                                               ))}
                                            </div>
                                        )}

                                        {/* Eğer bilet açık ise firmaya yanıt yazma imkanı ver */}
                                        {ticket.status !== 'Çözüldü' && ticket.status !== 'Resolved' && (
                                            <div className="mt-3 pt-3 flex gap-2">
                                              <input
                                                 type="text"
                                                 value={replyMessageText[ticket.id] || ''}
                                                 onChange={(e) => setReplyMessageText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                                 placeholder="Yanıtınızı yazın..."
                                                 className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                                              />
                                              <button
                                                 onClick={() => handleCustomerReply(ticket.id)}
                                                 disabled={isReplying || !(replyMessageText[ticket.id]?.trim())}
                                                 className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                              >
                                                 {isReplying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                              </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                      )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}