'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Send, X, MessageSquare, ArrowLeft, WifiOff, CheckCheck, Clock, Lock, Bell } from 'lucide-react';
import Pusher from 'pusher-js';

export default function ChatPanel({ isChatOpen, setIsChatOpen, activeChatId, setActiveChatId, data, messages, setMessages, messageInput, setMessageInput, sendMessage }: any) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [isOffline, setIsOffline] = useState(false);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [msgToast, setMsgToast] = useState<{show: boolean, senderName: string, text: string}>({show: false, senderName: '', text: ''});
  
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const [logoBgColor, setLogoBgColor] = useState<string>('#2563eb');
  
  const [pusherChannel, setPusherChannel] = useState<any>(null);

  // URL'den veya data üzerinden slug bilgisini %100 garantili şekilde alıyoruz.
  const actualSlug = data?.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '');

  useEffect(() => {
    console.log("--- CHAT PANEL BAŞLATILDI ---");
    const isPatronPath = window.location.pathname.includes('/dashboard');
    const prefix = isPatronPath ? 'patron_' : 'staff_';
    
    const storedRole = localStorage.getItem(`${prefix}userRole`);
    setCurrentUserRole(storedRole);
    
    const token = localStorage.getItem(`${prefix}authToken`);
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const payload = JSON.parse(jsonPayload);
            setCurrentUserId(String(payload.id));
            console.log("Aktif Kullanıcı ID:", payload.id, "Rol:", storedRole);
        } catch(e) {
            console.error("Token çözümlenemedi:", e);
        }
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!currentUserId || !actualSlug) return;
    
    const script = document.createElement("script");
    script.src = "https://js.pusher.com/beams/1.0/push-notifications-web.js";
    script.async = true;
    script.onload = () => {
        if (typeof window !== 'undefined' && (window as any).PusherPushNotifications) {
            const beamsClient = new (window as any).PusherPushNotifications.Client({
                instanceId: '6a47ebc2-0c89-48f1-81a3-80a4e003dd41',
            });
            beamsClient.start()
                .then(() => {
                    const interest = currentUserRole === 'Patron' ? `user-${actualSlug}-PATRON` : `user-${actualSlug}-${currentUserId}`;
                    beamsClient.addDeviceInterest(interest);
                    console.log("✅ Pusher Beams Cihaz Kaydı Başarılı! Bildirimler Gelecek. İlgi Alanı:", interest);
                })
                .catch(console.error);
        }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [currentUserId, actualSlug, currentUserRole]);

  useEffect(() => {
    if (!data?.logo) {
      setLogoBgColor('#2563eb'); 
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onerror = () => {
      setLogoBgColor('#2563eb');
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < pixelData.length; i += 4) {
          if (pixelData[i + 3] < 128) continue; 
          r += pixelData[i];
          g += pixelData[i + 1];
          b += pixelData[i + 2];
          count++;
        }
        
        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          const palette = [
            { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
            { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, 
            { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }
          ];

          let maxDist = -1;
          let selectedColor = '#2563eb';

          for (const color of palette) {
            const dist = Math.sqrt(Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2));
            if (dist > maxDist) {
              maxDist = dist;
              selectedColor = color.hex;
            }
          }
          
          if (selectedColor === '#ffffff') {
              setLogoBgColor('#f1f5f9');
          } else {
              setLogoBgColor(selectedColor);
          }
        }
      } catch (e) {
        console.error("Renk analizi yapılamadı:", e);
      }
    };
    img.src = data.logo;
  }, [data?.logo]);


  useEffect(() => {
    const fetchAllMessages = async () => {
        if (!actualSlug || !currentUserId) return;
        const isPatronPath = window.location.pathname.includes('/dashboard');
        const prefix = isPatronPath ? 'patron_' : 'staff_';
        const token = localStorage.getItem(`${prefix}authToken`);
        const API_URL = 'https://backend.isdokumu.workers.dev';
        
        try {
            const myId = currentUserRole === 'Patron' ? 'PATRON' : currentUserId;
            console.log(`Geçmiş Mesajlar Çekiliyor... API: /get-messages?slug=${actualSlug}&staffId=${myId}`);
            
            const res = await fetch(`${API_URL}/get-messages?slug=${actualSlug}&staffId=${myId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const msgs = await res.json();
            console.log("Gelen Tüm Mesaj Geçmişi:", msgs);
            if (msgs) setAllMessages(msgs);
        } catch (e) {
            console.error("Geçmiş mesajları çekerken hata:", e);
        }
    };
    
    if (isChatOpen && !activeChatId) {
        fetchAllMessages();
    }
  }, [isChatOpen, activeChatId, actualSlug, currentUserId, currentUserRole]);

  const sortedStaffList = useMemo(() => {
    if (!data?.staff) return [];

    const staffWithLastMsg = data.staff.map((staff: any) => {
        const staffIdStr = String(staff.id);
        const myIdStr = currentUserRole === 'Patron' ? 'PATRON' : String(currentUserId);
        
        const chatHistory = allMessages.filter(m => 
            (String(m.sender_id) === staffIdStr && String(m.receiver_id) === myIdStr) || 
            (String(m.sender_id) === myIdStr && String(m.receiver_id) === staffIdStr)
        );

        const lastMsgTime = chatHistory.length > 0 
            ? new Date(chatHistory[chatHistory.length - 1].created_at).getTime() 
            : 0;

        return { ...staff, lastMsgTime };
    });

    staffWithLastMsg.sort((a: any, b: any) => b.lastMsgTime - a.lastMsgTime);
    
    return staffWithLastMsg;
  }, [data?.staff, allMessages, currentUserId, currentUserRole]);

  useEffect(() => {
    if (!actualSlug || !currentUserId) return;

    const isPatronPath = window.location.pathname.includes('/dashboard');
    const prefix = isPatronPath ? 'patron_' : 'staff_';
    const token = localStorage.getItem(`${prefix}authToken`);
    const API_URL = 'https://backend.isdokumu.workers.dev';

    Pusher.logToConsole = true;

    console.log("Pusher'a bağlanılıyor... Kanal:", `presence-chat-${actualSlug}`);
    const pusher = new Pusher('75dfed44245e16eaea0a', {
      cluster: 'eu',
      authEndpoint: `${API_URL}/pusher/auth`,
      auth: {
          headers: { 'Authorization': `Bearer ${token}` }
      }
    });

    pusher.connection.bind('connected', () => {
        console.log("✅ Pusher WebSocket Bağlantısı Başarılı!");
    });

    const channelName = `presence-chat-${actualSlug}`;
    const channel = pusher.subscribe(channelName);
    setPusherChannel(channel);

    channel.bind('pusher:subscription_succeeded', (members: any) => {
        const online = new Set<string>();
        members.each((member: any) => online.add(member.id));
        setOnlineUsers(online);
    });

    channel.bind('pusher:member_added', (member: any) => {
        setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(member.id);
            return newSet;
        });
    });

    channel.bind('pusher:member_removed', (member: any) => {
        setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(member.id);
            return newSet;
        });
    });

    channel.bind('new-message', (newMsg: any) => {
        console.log("Pusher'dan YENİ MESAJ geldi:", newMsg);
        const isForMe = String(newMsg.receiver_id) === String(currentUserId) || (currentUserRole === 'Patron' && newMsg.receiver_id === 'PATRON');
        const isFromMe = String(newMsg.sender_id) === String(currentUserId) || (currentUserRole === 'Patron' && newMsg.sender_id === 'PATRON');

        if (!isForMe && !isFromMe) {
            console.log("Bu mesaj bana ait değil, yok sayılıyor.");
            return;
        }

        setAllMessages(prev => {
            if (newMsg._tempId) {
                const tempIdx = prev.findIndex((p: any) => String(p._tempId) === String(newMsg._tempId));
                if (tempIdx !== -1) {
                    console.log("Pusher: Temp ID eşleşti, mesaj güncelleniyor (Saat İkonu Kalkıyor)");
                    const arr = [...prev];
                    arr[tempIdx] = { ...newMsg, _tempId: undefined };
                    return arr;
                }
            }
            if (!prev.some((p: any) => String(p.id) === String(newMsg.id))) {
                console.log("Pusher: Yeni mesaj listeye eklendi.");
                return [...prev, newMsg];
            }
            return prev;
        });

        if (isForMe) {
            if (isChatOpen && document.hasFocus() && (String(activeChatId) === String(newMsg.sender_id) || (activeChatId === 'PATRON' && newMsg.sender_id === 'PATRON'))) {
                markMessagesAsRead(newMsg.sender_id);
            } else {
                let senderName = 'Bilinmeyen Kullanıcı';
                if (newMsg.sender_id === 'PATRON') {
                    senderName = data?.ownerName || 'Firma Sahibi';
                } else {
                    const foundStaff = data?.staff?.find((s:any) => String(s.id) === String(newMsg.sender_id));
                    if (foundStaff) senderName = foundStaff.name;
                }

                setUnreadCount(prev => prev + 1);
                setMsgToast({ show: true, senderName: senderName, text: newMsg.message });
                setTimeout(() => setMsgToast({ show: false, senderName: '', text: '' }), 4000);

                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification(`Yeni Mesaj: ${senderName}`, {
                        body: newMsg.message.length > 30 ? newMsg.message.substring(0, 30) + '...' : newMsg.message,
                        icon: '/favicon.ico'
                    });
                }
            }
        }
    });

    channel.bind('messages-read', (readData: any) => {
        console.log("Pusher'dan MESAJ OKUNDU bilgisi geldi:", readData);
        const iAmSender = String(readData.senderId) === String(currentUserId) || (currentUserRole === 'Patron' && readData.senderId === 'PATRON');
        if (iAmSender) {
            setAllMessages((prev: any) => prev.map((m: any) => {
                if (String(m.sender_id) === String(readData.senderId) && String(m.receiver_id) === String(readData.readerId)) {
                    return { ...m, is_read: 1 };
                }
                return m;
            }));
        }
    });

    channel.bind('client-typing', (typeData: any) => {
        console.log("Pusher'dan YAZIYOR bilgisi geldi:", typeData);
        const iAmReceiver = String(typeData.receiverId) === String(currentUserId) || (currentUserRole === 'Patron' && typeData.receiverId === 'PATRON');
        const isFromActiveChat = String(typeData.senderId) === String(activeChatId) || (typeData.senderId === 'PATRON' && activeChatId === 'PATRON');
        
        if (iAmReceiver && isFromActiveChat) {
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
            }, 3000);
        }
    });

    return () => {
        console.log("Pusher aboneliği iptal ediliyor...");
        pusher.unsubscribe(channelName);
        pusher.disconnect();
    };
  }, [actualSlug, currentUserId, currentUserRole, activeChatId, isChatOpen]);

  const markMessagesAsRead = async (targetSenderId: string | null = activeChatId) => {
    if (!targetSenderId || !currentUserId || !document.hasFocus()) return;
    
    const isPatronPath = window.location.pathname.includes('/dashboard');
    const prefix = isPatronPath ? 'patron_' : 'staff_';
    const token = localStorage.getItem(`${prefix}authToken`);
    const API_URL = 'https://backend.isdokumu.workers.dev';
    
    try {
        await fetch(`${API_URL}/read-messages`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                slug: actualSlug, 
                readerId: currentUserRole === 'Patron' ? 'PATRON' : currentUserId, 
                senderId: targetSenderId 
            })
        });
        
        setAllMessages((prev: any) => prev.map((m: any) => 
            (String(m.sender_id) === String(targetSenderId) && m.is_read === 0) ? { ...m, is_read: 1 } : m
        ));
    } catch (e) {
        console.error("Mesajları okundu işaretlerken hata:", e);
    }
  };

  useEffect(() => {
    if (isChatOpen && activeChatId) {
      setUnreadCount(0);
      markMessagesAsRead(activeChatId);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatOpen, activeChatId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [allMessages, activeChatId]);

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

  const handleSendMessage = () => {
    if (!messageInput.trim() || isOffline) return;
    
    const tempId = Date.now();
    const newMessage = {
      _tempId: tempId, 
      message: messageInput,
      sender_id: currentUserRole === 'Patron' ? 'PATRON' : currentUserId, 
      receiver_id: activeChatId,
      created_at: new Date().toISOString(),
      is_read: 0
    };
    
    console.log("Giden Mesaj Objesi:", newMessage);

    setAllMessages(prev => [...prev, newMessage]);
    
    if (setMessages) {
        setMessages((prev: any) => [...(prev || []), newMessage]);
    }
    
    setMessageInput(''); 

    const isPatronPath = window.location.pathname.includes('/dashboard');
    const prefix = isPatronPath ? 'patron_' : 'staff_';
    const token = localStorage.getItem(`${prefix}authToken`);
    const API_URL = 'https://backend.isdokumu.workers.dev';
    
    console.log("Backend'e istek atılıyor: /send-message");

    fetch(`${API_URL}/send-message`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
            slug: actualSlug, 
            senderId: currentUserRole === 'Patron' ? 'PATRON' : currentUserId, 
            receiverId: activeChatId, 
            message: newMessage.message,
            tempId: tempId 
        }) 
    })
    .then(res => res.json())
    .then(responseData => {
        console.log("Backend'den Gelen Yanıt:", responseData);
        
        if (responseData.success && responseData.data) {
             setAllMessages(prev => prev.map(m => {
                 if (String(m._tempId) === String(tempId)) {
                     console.log("REST API: Saat ikonu tike dönüştürülüyor!");
                     return { ...m, _tempId: undefined, id: responseData.data.id, created_at: responseData.data.created_at };
                 }
                 return m;
             }));
        } else if (!responseData.success) {
             console.error("Backend Hata Döndürdü:", responseData);
             setAllMessages(prev => prev.filter(m => String(m._tempId) !== String(tempId)));
        }
    })
    .catch(err => {
        console.error("Mesaj Gönderiminde Ağ Hatası:", err);
        setAllMessages(prev => prev.filter(m => String(m._tempId) !== String(tempId)));
    });
    
    if (activeChatId) {
      localStorage.removeItem(`chat_draft_${activeChatId}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
     setMessageInput(e.target.value);
     if (!isOffline && activeChatId && pusherChannel) {
         try {
             pusherChannel.trigger('client-typing', {
                 senderId: currentUserRole === 'Patron' ? 'PATRON' : currentUserId,
                 receiverId: activeChatId
             });
         } catch(err) {
             console.error("Typing event trigger hatası:", err);
         }
     }
  };

  const activeStaff = activeChatId && activeChatId !== 'PATRON' ? data?.staff?.find((s: any) => String(s.id) === String(activeChatId)) : null;

  const getDynamicStaffStatus = (staffId: string) => {
    const staffJobs = data?.jobs?.filter((j: any) => String(j.staff_id) === String(staffId) || String(j.details?.worker_id) === String(staffId)) || [];
    const isWorking = staffJobs.some((j: any) => j.status === 'Devam Ediyor');
    const isAssigned = staffJobs.some((j: any) => j.status === 'Beklemede' || j.status === 'Gelecek');
    
    if (isWorking) return { label: 'Çalışıyor', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600 border-amber-100' };
    if (isAssigned) return { label: 'İş Atandı', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-600 border-blue-100' };
    return { label: 'Müsait', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  };

  const activeStatus = activeStaff ? getDynamicStaffStatus(activeStaff.id) : null;
  const isUserReallyOnline = activeChatId === 'PATRON' ? onlineUsers.has('PATRON') : onlineUsers.has(String(activeChatId));

  const isMessageFromMe = (m: any) => {
    if (currentUserRole === 'Patron') return m.sender_id === 'PATRON';
    return String(m.sender_id) === String(currentUserId);
  };

  const displayMessages = useMemo(() => {
    if (!activeChatId) return [];
    const filtered = allMessages.filter(m => 
      (String(m.sender_id) === String(activeChatId) && (m.receiver_id === 'PATRON' || String(m.receiver_id) === String(currentUserId))) || 
      (String(m.receiver_id) === String(activeChatId) && (m.sender_id === 'PATRON' || String(m.sender_id) === String(currentUserId)))
    );
    console.log(`Ekranda Gösterilen Filtrelenmiş Mesajlar (${activeChatId} için):`, filtered);
    return filtered;
  }, [allMessages, activeChatId, currentUserId, currentUserRole]);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      
      <AnimatePresence>
        {msgToast.show && !isChatOpen && (
            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.9 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl flex flex-col gap-1 border border-slate-700 pointer-events-auto cursor-pointer max-w-[250px] sm:max-w-xs"
                onClick={() => setIsChatOpen(true)}
            >
                <div className="flex items-center gap-2">
                   <div className="bg-emerald-500/20 p-1.5 rounded-full animate-pulse">
                      <MessageSquare size={14} className="text-emerald-400" />
                   </div>
                   <h4 className="text-[11px] font-black tracking-wide text-slate-200 uppercase truncate">{msgToast.senderName}</h4>
                </div>
                <p className="text-xs text-slate-300 font-medium line-clamp-2 pl-8">{msgToast.text}</p>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.95 }} 
            className="w-[calc(100vw-32px)] sm:w-[340px] h-[70vh] max-h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden origin-bottom-right pointer-events-auto"
          >
            
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shadow-md z-10 shrink-0">
              <div className="flex items-center gap-2">
                {activeStaff && activeStatus ? (
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setActiveChatId(null)} className="p-1.5 bg-slate-800/50 hover:bg-slate-700 rounded-md transition-colors active:scale-95">
                      <ArrowLeft size={16} />
                    </button>
                    <div className="flex flex-col">
                      <span className="font-bold text-[13px] leading-none mb-0.5">{activeStaff.name}</span>
                      
                      {isTyping ? (
                          <span className="text-[10px] text-emerald-400 font-bold italic tracking-wide animate-pulse">
                              yazıyor...
                          </span>
                      ) : isUserReallyOnline ? (
                          <span className="text-[10px] text-emerald-500 flex items-center gap-1.5 font-bold tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)] animate-pulse"></span>
                              Çevrimiçi
                          </span>
                      ) : (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium tracking-wide">
                             <span className={`w-1.5 h-1.5 rounded-full ${activeStatus.label === 'Müsait' ? 'bg-emerald-500' : 'bg-slate-500'} shadow-[0_0_4px_rgba(0,0,0,0.5)]`}></span>
                             {activeStatus.label}
                          </span>
                      )}
                    </div>
                  </div>
                ) : activeChatId === 'PATRON' ? (
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setActiveChatId(null)} className="p-1.5 bg-slate-800/50 hover:bg-slate-700 rounded-md transition-colors active:scale-95">
                      <ArrowLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div 
                         className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-slate-700 shrink-0"
                         style={{ backgroundColor: logoBgColor }}
                      >
                         {data?.logo ? (
                            <img src={data.logo} alt="Logo" className="w-5 h-5 object-contain" />
                         ) : (
                            <span className="text-white font-black text-xs">P</span>
                         )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px] leading-none mb-0.5">{data?.ownerName || 'Firma Sahibi'}</span>
                        {isTyping ? (
                            <span className="text-[10px] text-emerald-400 font-bold italic tracking-wide animate-pulse">
                                yazıyor...
                            </span>
                        ) : isUserReallyOnline ? (
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1.5 font-bold tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)] animate-pulse"></span>
                                Çevrimiçi
                            </span>
                        ) : (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-bold tracking-wide">
                               <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shadow-[0_0_4px_rgba(0,0,0,0.5)]"></span>
                               Son görülme: Yakınlarda
                            </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col pl-1">
                    <span className="text-[14px] font-black tracking-wide leading-none mb-0.5">Saha Ekibi İletişim</span>
                    <span className="text-[10px] font-medium text-slate-400">Personel seçip mesajlaşmaya başlayın</span>
                  </div>
                )}
              </div>
              <ChevronDown className="cursor-pointer hover:text-blue-400 transition-colors mr-1 p-1 active:scale-95" onClick={() => setIsChatOpen(false)} size={20} />
            </div>

            {!activeChatId ? (
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto bg-slate-50 custom-scrollbar">
                 
                 {currentUserRole !== 'Patron' && (
                     <div onClick={() => setActiveChatId('PATRON')} className="p-3 bg-blue-50 hover:bg-blue-100 rounded-xl cursor-pointer flex items-center gap-3 shadow-sm border border-blue-200 transition-colors group mb-2">
                       <div className="relative">
                           <div 
                             className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform shadow-md overflow-hidden border-2 border-white"
                             style={{ backgroundColor: logoBgColor }}
                           >
                             {data?.logo ? (
                                <img src={data.logo} alt="Logo" className="w-6 h-6 object-contain" />
                             ) : (
                                <span className="text-white">P</span>
                             )}
                           </div>
                           <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full shadow-sm ${onlineUsers.has('PATRON') ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-sm font-black text-blue-900 truncate">{data?.ownerName || 'Firma Sahibi'}</div>
                         <div className="text-[11px] text-blue-700 font-bold truncate mt-1">
                             {onlineUsers.has('PATRON') ? <span className="text-emerald-600">Çevrimiçi</span> : 'YÖNETİM KADEMESİ'}
                         </div>
                       </div>
                     </div>
                 )}

                 {sortedStaffList.map((m: any) => {
                   if (currentUserRole !== 'Patron' && String(m.id) === String(currentUserId)) return null;

                   const status = getDynamicStaffStatus(m.id);
                   const isStaffOnline = onlineUsers.has(String(m.id));
                   
                   return (
                     <div key={m.id} onClick={() => setActiveChatId(m.id)} className="p-3 bg-white hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-3 shadow-sm border border-slate-100 transition-colors group">
                       <div className="relative">
                         <div className="w-10 h-10 bg-slate-100 text-slate-700 border border-slate-200 rounded-full flex items-center justify-center font-bold text-sm group-hover:bg-slate-200 transition-colors">
                           {m.name.charAt(0)}
                         </div>
                         <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isStaffOnline ? 'bg-emerald-500' : status.dot}`}></span>
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-sm font-bold text-slate-800 truncate">{m.name}</div>
                         <div className="text-[11px] text-slate-500 font-medium truncate mt-1 flex items-center justify-between gap-2">
                           <span className="uppercase tracking-wider font-bold text-[9px] truncate">{m.role}</span>
                           <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${isStaffOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : status.badge}`}>
                             {isStaffOnline ? 'Çevrimiçi' : status.label}
                           </span>
                         </div>
                       </div>
                     </div>
                   );
                 })}

                 {(!data?.staff || data?.staff.length === 0) && currentUserRole === 'Patron' && (
                   <div className="text-center p-8 text-slate-400 text-xs font-medium flex flex-col items-center justify-center h-full gap-2">
                     <MessageSquare size={32} className="opacity-20" />
                     Kayıtlı personel bulunamadı.
                   </div>
                 )}
              </div>
            ) : (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#E5E7EB] text-xs custom-scrollbar">
                  
                  <div className="flex justify-center mb-6">
                    <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-[10px] font-medium shadow-sm flex items-center gap-1.5 max-w-[85%] text-center leading-tight">
                        <Lock size={10} /> Bu sohbetteki mesajlar uçtan uca şifrelenmektedir.
                    </span>
                  </div>

                  {displayMessages?.map((m: any, i: number) => {
                    const fromMe = isMessageFromMe(m);
                    
                    const isPending = !!m._tempId; 
                    const isDelivered = !!m.id;
                    const isRead = m.is_read === 1; 
                    
                    let msgTime = '';
                    try {
                        const dateObj = new Date(m.created_at);
                        if (!isNaN(dateObj.getTime())) {
                            msgTime = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        }
                    } catch(e) {}

                    return (
                      <div key={i} className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'} group`}>
                        <div 
                           className={`px-3 py-2 rounded-2xl max-w-[85%] shadow-sm text-[13px] leading-relaxed break-words relative
                           ${fromMe ? 'bg-[#DCF8C6] text-slate-800 rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'}`}
                        >
                          <div className="pr-12"> 
                             {m.message}
                          </div>
                          
                          <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                            {msgTime}
                            
                            {fromMe && (
                                <span className="ml-0.5">
                                    {isPending && <Clock size={10} className="text-slate-400 animate-pulse" />}
                                    {!isPending && isDelivered && !isRead && <CheckCheck size={14} className="text-slate-400" />}
                                    {!isPending && isDelivered && isRead && <CheckCheck size={14} className="text-blue-500" />}
                                </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {isTyping && (
                      <div className="flex items-start">
                         <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.div>
                            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.div>
                            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.div>
                         </div>
                      </div>
                  )}

                  {(!displayMessages || displayMessages.length === 0) && (
                    <div className="text-center mt-12 text-slate-500 text-[11px] font-medium px-4">
                      Sohbet geçmişi bulunamadı. İlk mesajı siz gönderin.
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="p-2 sm:p-3 bg-[#F0F2F5] flex gap-2 items-end shrink-0">
                  <textarea 
                    value={messageInput} 
                    onChange={handleInputChange} 
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!isOffline) handleSendMessage();
                        }
                    }} 
                    disabled={isOffline}
                    placeholder={isOffline ? "İnternet bağlantısı bekleniyor..." : "Mesaj yazın..."} 
                    className="flex-1 bg-white px-4 py-3 rounded-2xl text-[13px] outline-none border border-white focus:border-blue-400 transition-all placeholder:text-slate-400 disabled:opacity-50 resize-none overflow-hidden max-h-24 min-h-[44px]"
                    rows={1}
                  />
                  <button 
                    onClick={handleSendMessage} 
                    disabled={!messageInput.trim() || isOffline}
                    className="w-11 h-11 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center shrink-0 active:scale-95 mb-0.5"
                  >
                    {isOffline ? <WifiOff size={18} /> : <Send size={18} className="ml-1" />}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)} 
        className="w-14 h-14 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 relative border-2 border-white pointer-events-auto"
      >
        {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
        
        {!isChatOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
            </span>
        )}
      </button>
    </div>
  );
}