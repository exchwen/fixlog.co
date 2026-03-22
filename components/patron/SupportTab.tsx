'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lightbulb, Wrench, Send, Loader2, CheckCircle, AlertTriangle, WifiOff, History, Clock, X } from 'lucide-react';

export default function SupportTab({ handleAction, isSaving, setHideChatBubble }: any) {
  const [ticketType, setTicketType] = useState('Öneri/İstek');
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState<'idle' | 'success' | 'error'>('idle');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [activeView, setActiveView] = useState<'new' | 'history'>('new');
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const [replyMessageText, setReplyMessageText] = useState<{ [key: string]: string }>({});
  const [isReplying, setIsReplying] = useState(false);
  
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  useEffect(() => {
    if (setHideChatBubble) {
        setHideChatBubble(!!selectedTicket);
    }
    return () => {
        if (setHideChatBubble) setHideChatBubble(false);
    };
  }, [selectedTicket, setHideChatBubble]);

  const handleCloseModal = () => {
    setSelectedTicket(null);
  };

  useEffect(() => {
    if (!selectedTicket) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseModal();
    };

    const handlePopState = () => {
      setSelectedTicket(null);
    };

    // 🚀 MOBİL KLAVYE İÇİN HAYAT KURTARAN KİLİT
    // Tarayıcının inputa odaklanınca tüm sayfayı yukarı kaydırmasını (scroll) engeller.
    document.body.style.overflow = 'hidden';

    window.history.pushState({ modal: 'ticketOpen' }, '');
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('popstate', handlePopState);

    return () => {
      // Modaldan çıkınca kilidi aç
      document.body.style.overflow = '';

      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modal === 'ticketOpen') {
        window.history.back();
      }
    };
  }, [selectedTicket]);

  const getValidToken = () => {
    if (typeof window === 'undefined') return '';
    
    let token = '';

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('_authToken')) {
            token = localStorage.getItem(key) || '';
            break;
        }
    }

    if (!token) {
        const keys = ['token', 'userToken', 'accessToken', 'patron_authToken'];
        for (const k of keys) {
            const val = localStorage.getItem(k);
            if (val) {
                token = val;
                break;
            }
        }
    }

    if (!token) return '';

    token = token.replace(/^"|"$/g, '');
    if (token.toLowerCase().startsWith('bearer ')) {
      token = token.substring(7).trim();
    }
    
    return token;
  };

  const fetchMyTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const token = getValidToken();

      const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
      const BASE_URL = rawBaseUrl.replace(/\/$/, ""); 

      const res = await fetch(`${BASE_URL}/get-my-tickets?t=${Date.now()}`, {
        method: 'GET',
        headers: { 
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : '' 
        }
      });

      if (!res.ok) {
          let exactReason = `Hata Kodu: ${res.status}`;
          try {
              const errData = await res.json();
              exactReason = errData.reason || errData.error || exactReason;
          } catch(e) {
              const errText = await res.text();
              exactReason = `${exactReason} - Detay: ${errText.substring(0, 50)}`;
          }

          setMyTickets([{ 
              id: 'sistem-hatasi-1', 
              type: `⚠️ Okuma Hatası (${res.status})`, 
              message: `Sunucu kimliği reddetti. Sebep: ${exactReason}`, 
              status: 'Açık',
              created_at: new Date().toISOString()
          }]);
          setIsLoadingTickets(false);
          return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        // 🚀 YENİ: En son mesaj yazılan bileti en üste taşıyan sıralama algoritması
        data.sort((a, b) => {
            const getLatestDate = (ticket: any) => {
                let latest = new Date(ticket.created_at ? ticket.created_at.replace(' ', 'T') : 0).getTime();
                try {
                    const replies = JSON.parse(ticket.replies || '[]');
                    if (replies.length > 0) {
                        const lastReplyDate = new Date(replies[replies.length - 1].date).getTime();
                        if (lastReplyDate > latest) latest = lastReplyDate;
                    }
                } catch(e) {}
                return latest;
            };
            return getLatestDate(b) - getLatestDate(a); // Büyükten küçüğe (En yeni tarih en üstte)
        });

        setMyTickets(data);
      } else {
         setMyTickets([{ 
            id: 'sistem-hatasi-2', 
            type: '⚠️ Veri Okuma Sorunu', 
            message: `Veritabanından talepler dizi olarak dönmedi.`, 
            status: 'Açık',
            created_at: new Date().toISOString()
        }]);
      }
    } catch (e: any) {
        setMyTickets([{ 
            id: 'sistem-hatasi-3', 
            type: '⚠️ Kritik Çökme', 
            message: `İstek atılırken hata oluştu: ${e.message}`, 
            status: 'Açık',
            created_at: new Date().toISOString()
        }]);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleCustomerReply = async (ticketId: string) => {
    const text = replyMessageText[ticketId];
    if (!text || !text.trim()) return;

    setIsReplying(true);
    try {
        let activeSlug = '';
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('_userSlug')) {
                activeSlug = localStorage.getItem(key) || '';
                break;
            }
        }
        if (!activeSlug) activeSlug = localStorage.getItem('companySlug') || localStorage.getItem('slug') || '';
        
        const token = getValidToken(); 
        
        const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
        const BASE_URL = rawBaseUrl.replace(/\/$/, "");
        
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
            await fetchMyTickets(); 
        }
    } catch(e) {
        console.error("Yanıt gönderilemedi", e);
    } finally {
        setIsReplying(false);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
       const freshTicket = myTickets.find(t => t.id === selectedTicket.id);
       if (freshTicket) {
           setSelectedTicket(freshTicket);
       }
    }
  }, [myTickets]);

  useEffect(() => {
    if (activeView === 'history') {
      fetchMyTickets();
    }
  }, [activeView]);

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

    let activeSlug = '';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('_userSlug')) {
            activeSlug = localStorage.getItem(key) || '';
            break;
        }
    }
    if (!activeSlug) activeSlug = localStorage.getItem('companySlug') || localStorage.getItem('slug') || '';

    if (isOffline) {
       const pending = JSON.parse(localStorage.getItem(`offline_actions_${activeSlug}`) || '[]');
       pending.push({ endpoint: 'add-support-ticket', body: { slug: activeSlug, type: ticketType, message }, timestamp: new Date().toISOString() });
       localStorage.setItem(`offline_actions_${activeSlug}`, JSON.stringify(pending));
       
       setModalState('success');
       setMessage('');
       setTimeout(() => setModalState('idle'), 3000);
       return;
    }

    setIsSubmitting(true);
    
    try {
        const token = getValidToken();
        const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
        const BASE_URL = rawBaseUrl.replace(/\/$/, ""); 

        const res = await fetch(`${BASE_URL}/add-support-ticket`, {
            method: 'POST',
            headers: { 
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : '' 
            },
            body: JSON.stringify({ slug: activeSlug, type: ticketType, message })
        });

        if (res.ok) {
            setModalState('success');
            setMessage('');
            setTimeout(() => {
                setModalState('idle');
                setActiveView('history'); 
            }, 2000);
        } else {
            let exactError = 'Bilinmeyen Hata';
            try {
                const errData = await res.json();
                exactError = errData.error || errData.reason || exactError;
            } catch (err) {
                exactError = await res.text();
            }
            
            setMyTickets([{ 
                id: `sistem-hatasi-${Date.now()}`, 
                type: `⚠️ Gönderim Hatası (${res.status})`, 
                message: `Sunucu kaydı reddetti: ${exactError.substring(0, 80)}`, 
                status: 'Açık',
                created_at: new Date().toISOString()
            }]);
            
            setModalState('idle');
            setActiveView('history');
        }
    } catch (error) {
        console.error("Bilet gönderilirken ağ hatası:", error);
        setModalState('error');
        setTimeout(() => setModalState('idle'), 3000);
    } finally {
        setIsSubmitting(false);
    }
  };

  const types = [
    { id: 'Öneri/İstek', icon: Lightbulb, title: 'Öneri / İstek', desc: 'Sistemde görmek istediğiniz yeni bir özellik.' },
    { id: 'Teknik Destek', icon: Wrench, title: 'Teknik Destek', desc: 'Sistemde yaşadığınız bir hata veya sorun.' },
    { id: 'Geri Bildirim', icon: MessageSquare, title: 'Geri Bildirim', desc: 'Uygulama hakkındaki genel düşünceleriniz.' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 relative">
      
      {/* BAŞLIK */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-3 sm:pb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            Destek & Geri Bildirim Merkezi
            {isOffline && <span title="Çevrimdışı Mod"><WifiOff size={16} className="text-amber-500" /></span>}
          </h3>
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1">FixLog.co ekibine ulaşın. Fikirleriniz bizim için çok değerli.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* SOL TARAF - BİLGİLENDİRME */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 md:w-1/3 flex flex-col justify-between shrink-0">
            <div>
                <h4 className="text-lg sm:text-xl font-black mb-3 sm:mb-4">Sizi Dinliyoruz</h4>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                FixLog.co sistemini sizlerin taleplerine göre geliştiriyoruz. Bir özelliğin eksik olduğunu düşünüyorsanız veya teknik bir aksaklık yaşıyorsanız bize anında buradan bildirebilirsiniz.
                </p>
            </div>
            <div className="bg-white/10 p-4 sm:p-5 rounded-xl border border-white/10 backdrop-blur-sm mt-4 md:mt-0">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Yanıt Süresi</div>
                <div className="text-xs sm:text-sm font-semibold text-white leading-snug">Talepleriniz ortalama <span className="text-emerald-400 font-black">2-4 saat</span> içinde ekibimiz tarafından incelenir.</div>
            </div>
        </div>

        {/* SAĞ TARAF - FORM VE GEÇMİŞ */}
        <div className="p-5 sm:p-8 md:w-2/3 flex flex-col justify-start">
            
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
                          {isOffline 
                            ? 'İnternet bağlantınız yok. Talebiniz cihaza kaydedildi, bağlantı sağlandığında ekibimize iletilecektir.' 
                            : 'Geri bildiriminiz FixLog.co ekibine başarıyla iletildi. İlginiz için teşekkür ederiz.'}
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
                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Ne hakkında yazmak istersiniz?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {types.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                      <div 
                                          key={type.id}
                                          onClick={() => setTicketType(type.id)}
                                          className={`cursor-pointer border rounded-xl p-4 sm:p-3 flex flex-row sm:flex-col items-center sm:text-center gap-3 sm:gap-0 transition-all active:scale-95 ${ticketType === type.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                                      >
                                          <Icon size={24} className={`sm:mb-2 shrink-0 ${ticketType === type.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                          <div className={`font-bold text-sm sm:mb-1 ${ticketType === type.id ? 'text-blue-700' : 'text-slate-700'}`}>{type.title}</div>
                                      </div>
                                    );
                                })}
                            </div>
                        </div>

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

                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit"
                                disabled={isSubmitting || !message.trim()}
                                className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 active:scale-95"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (isOffline ? <WifiOff size={18} /> : <Send size={18} />)}
                                {isSubmitting ? 'Gönderiliyor...' : (isOffline ? 'Kuyruğa Al' : 'Talebi İlet')}
                            </button>
                        </div>
                    </motion.form>
                ) : (
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
                            onClick={() => setSelectedTicket(ticket)}
                            className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all ${ticket.id.startsWith('sistem-hatasi') ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className={`font-bold text-sm flex items-center gap-2 ${ticket.id.startsWith('sistem-hatasi') ? 'text-rose-700' : 'text-slate-800'}`}>
                                {ticket.type} 
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${ticket.status === 'Çözüldü' || ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : (ticket.id.startsWith('sistem-hatasi') ? 'bg-rose-200 text-rose-800' : 'bg-amber-100 text-amber-600')}`}>
                                {ticket.status === 'Çözüldü' || ticket.status === 'Resolved' ? 'Çözüldü' : 'Açık'}
                              </span>
                            </div>
                            
                            <div className={`text-sm font-medium line-clamp-1 mb-2 ${ticket.id.startsWith('sistem-hatasi') ? 'text-rose-600' : 'text-slate-600'}`}>
                                {ticket.message}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.created_at ? ticket.created_at.replace(' ', 'T') : new Date()).toLocaleString('tr-TR')}</span>
                                {replies.length > 0 && <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">{replies.length} Yanıt</span>}
                            </div>
                          </div>
                        );
                      })
                      )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

{/* BİLET DETAY MODALI */}
<AnimatePresence>
{selectedTicket && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4"
            onClick={handleCloseModal}
          >
               <motion.div
                 initial={{ scale: 0.95, opacity: 0, y: 10 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 10 }}
                 onClick={(e) => e.stopPropagation()} 
                 className="bg-white w-full flex-1 sm:flex-none sm:h-auto sm:w-[95%] sm:max-w-4xl sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
               >
                 {/* Modal Üst Bilgi (Sabit) */}
                 <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                   <div>
                     <h4 className={`font-black text-lg ${selectedTicket.id.startsWith('sistem-hatasi') ? 'text-rose-700' : 'text-slate-800'}`}>
                        {selectedTicket.type}
                     </h4>
                     <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Oluşturulma: {new Date(selectedTicket.created_at ? selectedTicket.created_at.replace(' ', 'T') : new Date()).toLocaleString('tr-TR')}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${selectedTicket.status === 'Çözüldü' || selectedTicket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {selectedTicket.status === 'Çözüldü' || selectedTicket.status === 'Resolved' ? 'Çözüldü' : 'Açık'}
                        </span>
                     </div>
                   </div>
                   <button onClick={handleCloseModal} className="p-2 hover:bg-rose-100 rounded-xl text-slate-500 hover:text-rose-600 transition-colors bg-white border border-slate-200 shadow-sm">
                     <X size={20} />
                   </button>
                 </div>

                 {/* Modal İçerik / Sohbet Akışı (Scrollable) */}
                 {/* 🚀 3. DEĞİŞİKLİK: overscroll-contain eklendi, böylece mesajlarda kaydırırken sayfa arkada hareket etmez. */}
                 <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50 flex flex-col scrollbar-hide overscroll-contain">
                   
                   {/* İlk Mesaj (Sağda - Kullanıcı) - Geniş ekranlarda mesaj balonu çok uzamasın diye max-w limiti var */}
                   <div className="w-full max-w-[90%] sm:max-w-[75%] ml-auto">
                       <div className="flex justify-end mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">İlk Talebiniz</span>
                       </div>
                       <div className={`p-4 sm:p-5 rounded-2xl rounded-tr-sm text-sm shadow-sm leading-relaxed ${selectedTicket.id.startsWith('sistem-hatasi') ? 'bg-rose-50 border border-rose-100 text-rose-800' : 'bg-blue-600 text-white'}`}>
                           {selectedTicket.message}
                       </div>
                   </div>

                   {/* Yanıtlar */}
                   {(() => {
                       let replies = [];
                       try { replies = JSON.parse(selectedTicket.replies || '[]'); } catch(e) {}
                       
                       if (replies.length > 0) {
                           return replies.map((reply: any, idx: number) => {
                               const isSupport = reply.sender === 'masterboss';
                               return (
                                 <div key={idx} className={`w-full max-w-[90%] sm:max-w-[75%] ${isSupport ? 'mr-auto' : 'ml-auto'}`}>
                                    <div className={`flex items-center mb-1 gap-2 ${isSupport ? 'justify-start' : 'justify-end'}`}>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSupport ? 'text-amber-600' : 'text-slate-400'}`}>
                                            {isSupport ? 'FixLog.co Destek Ekibi' : 'Siz'}
                                        </span>
                                        <span className="text-[9px] font-medium text-slate-400">{new Date(reply.date).toLocaleString('tr-TR')}</span>
                                    </div>
                                    <div className={`p-4 sm:p-5 rounded-2xl text-sm shadow-sm leading-relaxed ${isSupport ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                                        {reply.message}
                                    </div>
                                 </div>
                               );
                           });
                       }
                       return null;
                   })()}
                 </div>

                 {/* Modal Alt Kısmı / Yanıt Yazma Alanı (Sabit) */}
                 {selectedTicket.status !== 'Çözüldü' && selectedTicket.status !== 'Resolved' && !selectedTicket.id.startsWith('sistem-hatasi') && (
                     // 🚀 4. DEĞİŞİKLİK: pb-[max(0.75rem,env(safe-area-inset-bottom))] eklendi. (iPhone home bar ile klavyenin çakışmasını engeller)
                     <div className="p-3 sm:p-5 bg-white border-t border-slate-200 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                       <div className="flex gap-2 sm:gap-3 items-center max-w-4xl mx-auto">
                           <input
                              type="text"
                              value={replyMessageText[selectedTicket.id] || ''}
                              onChange={(e) => setReplyMessageText(prev => ({ ...prev, [selectedTicket.id]: e.target.value }))}
                              placeholder="Yanıtınızı buraya yazın..."
                              onKeyDown={(e) => { if(e.key === 'Enter') handleCustomerReply(selectedTicket.id) }}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-4 text-sm font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                           />
                           <button
                              onClick={() => handleCustomerReply(selectedTicket.id)}
                              disabled={isReplying || !(replyMessageText[selectedTicket.id]?.trim())}
                              className="bg-blue-600 text-white px-5 py-3 sm:py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center active:scale-95"
                           >
                              {isReplying ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                           </button>
                       </div>
                     </div>
                 )}
               </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}