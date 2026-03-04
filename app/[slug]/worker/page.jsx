'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, CheckCircle2, MessageSquareText, LogOut, ChevronRight, PenTool, Loader2, AlertCircle, PlayCircle, ClipboardList, WifiOff, Download, Share, Check, Camera, X, ShieldCheck, UserPlus, Box, Phone, User, Briefcase } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';
import Header from '@/components/layout/Header';
import WorkerSidebar from '@/components/layout/WorkerSidebar'; 

import ChatPanel from '@/components/chat/ChatPanel';
import DynamicPWA from '@/components/DynamicPWA'; 
import ThermalPrintModal from '@/components/modals/jobs/ThermalPrintModal'; // 🚀 EKLENDİ

const API_URL = 'https://backend.isdokumu.workers.dev';

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export default function WorkerDashboard() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [data, setData] = useState(null); 
  
  const [companyName, setCompanyName] = useState('İşletme');
  const [companySector, setCompanySector] = useState('');
  const [staffBranch, setStaffBranch] = useState(''); 
  
  const [activeTab, setActiveTab] = useState('jobs'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobNote, setJobNote] = useState('');
  const [dynamicForm, setDynamicForm] = useState({}); 
  const [isSaving, setIsSaving] = useState(false);

  // 🚀 CHAT (MESAJLAŞMA) STATE'LERİ
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  // 🚀 EKLENDİ: Fiş Yazdırma Modalı State'leri
  const [showThermalPrintModal, setShowThermalPrintModal] = useState(false);
  const [selectedThermalJob, setSelectedThermalJob] = useState(null);

  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installState, setInstallState] = useState('idle');

  // 🚀 AKILLI VE KADEMELİ KAPATMA (ESC ve Geri Tuşu)
  const handleSmartClose = useCallback((e) => {
    const stopEvent = () => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        else if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') e.nativeEvent.stopImmediatePropagation();
      }
    };

    if (isChatOpen) {
      stopEvent();
      setIsChatOpen(false);
      return true;
    }

    if (selectedJob) {
      stopEvent();
      setSelectedJob(null);
      return true;
    }

    if (isMobileMenuOpen) {
      stopEvent();
      setIsMobileMenuOpen(false);
      return true;
    }

    return false;
  }, [selectedJob, isChatOpen, isMobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleSmartClose(e);
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleSmartClose]);

  useEffect(() => {
    if (selectedJob || isChatOpen || isMobileMenuOpen) {
        window.history.pushState({ internalLayer: true }, '');
    }
  }, [selectedJob, isChatOpen, isMobileMenuOpen]);

  useEffect(() => {
    const handlePopState = (e) => { handleSmartClose(e); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleSmartClose]);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isIOSDevice) {
      setIsIos(true);
      setTimeout(() => setShowPwaPrompt(true), 2000);
    } else {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShowPwaPrompt(true), 2000);
      };
      window.addEventListener('beforeinstallprompt', handler);

      const handleInstalled = () => {
        setInstallState('success');
        setTimeout(() => setShowPwaPrompt(false), 3000);
      };
      window.addEventListener('appinstalled', handleInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); 
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallState('success');
        setTimeout(() => setShowPwaPrompt(false), 3000);
      }
      setDeferredPrompt(null);
    }
  };

  const syncOfflineActions = async () => {
    const pending = JSON.parse(localStorage.getItem(`offline_actions_${slug}`) || '[]');
    if (pending.length === 0) {
      setPendingSyncCount(0);
      return;
    }
    const remaining = [];
    const token = localStorage.getItem('staff_authToken'); 

    for (const item of pending) {
      try {
        const res = await fetch(`${API_URL}/${item.endpoint}`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
          body: JSON.stringify({ ...item.body, slug }) 
        });
        if (!res.ok) remaining.push(item);
      } catch (e) {
        remaining.push(item);
      }
    }
    localStorage.setItem(`offline_actions_${slug}`, JSON.stringify(remaining));
    setPendingSyncCount(remaining.length);
    if (remaining.length < pending.length) fetchData(true);
  };

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); syncOfflineActions(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const pending = JSON.parse(localStorage.getItem(`offline_actions_${slug}`) || '[]');
    setPendingSyncCount(pending.length);
    if (navigator.onLine) syncOfflineActions();

    return () => { 
      window.removeEventListener('online', handleOnline); 
      window.removeEventListener('offline', handleOffline); 
    };
  }, [slug]);

  const fetchData = async (isInitial = false) => {
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    let token = localStorage.getItem('staff_authToken') || getCookie('staff_authToken'); 
    let role = localStorage.getItem('staff_userRole') || getCookie('staff_userRole'); 

    // iOS PWA LocalStorage Wipe Bug Kurtarma
    if (token && !localStorage.getItem('staff_authToken')) {
        localStorage.setItem('staff_authToken', token);
        localStorage.setItem('staff_userRole', role);
        localStorage.setItem('staff_userSlug', getCookie('staff_userSlug'));
        const cName = getCookie('staff_userName');
        if (cName) localStorage.setItem('staff_userName', decodeURIComponent(cName));
    }

    if (!token || role !== 'Usta') {
      localStorage.removeItem('staff_authToken');
      localStorage.removeItem('staff_userRole');
      localStorage.removeItem('staff_userName');
      localStorage.removeItem('staff_userSlug');
      router.push(`/${slug}/login`);
      return;
    }

    const decoded = parseJwt(token);
    setUserData(decoded);

    try {
      const res = await fetch(`${API_URL}/dashboard-data?slug=${slug}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        setData(result); 
        localStorage.setItem(`worker_cache_${slug}`, JSON.stringify(result));
        setIsOffline(false);
        setCompanyName(result.name);
        setCompanySector(result.sector || '');
        const myStaffRecord = result.staff.find(s => String(s.id) === String(decoded.id));
        if (myStaffRecord) setStaffBranch(myStaffRecord.branch);
        const myJobs = result.jobs.filter(j => String(j.staff_id) === String(decoded.id));
        setJobs(myJobs);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (error) {
      console.warn("Veri çekilemedi, cache kullanılıyor:", error);
      setIsOffline(true);
      const cachedData = localStorage.getItem(`worker_cache_${slug}`);
      if (cachedData) {
         const data = JSON.parse(cachedData);
         setCompanyName(data.name);
         setCompanySector(data.sector || '');
         const myStaffRecord = data.staff.find(s => String(s.id) === String(decoded.id));
         if (myStaffRecord) setStaffBranch(myStaffRecord.branch);
         const myJobs = data.jobs.filter(j => String(j.staff_id) === String(decoded.id));
         setJobs(myJobs);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeChatId) return;
    const token = localStorage.getItem('staff_authToken');
    try {
      const res = await fetch(`${API_URL}/get-messages?slug=${slug}&staffId=${activeChatId}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      setMessages(await res.json() || []);
    } catch (err) {}
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    const token = localStorage.getItem('staff_authToken');
    await fetch(`${API_URL}/send-message`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slug, senderId: userData?.id, receiverId: activeChatId, message: messageInput }) 
    });
    setMessageInput(''); 
    fetchMessages();
  };

  useEffect(() => {
    fetchData(true);
    const int = setInterval(() => fetchData(false), 15000); 
    return () => clearInterval(int);
  }, [slug, router]);

  useEffect(() => { 
    if (isChatOpen && activeChatId) fetchMessages(); 
  }, [isChatOpen, activeChatId]);

  useEffect(() => {
    setDynamicForm({});
    setJobNote('');
    setPhotos([]);
  }, [selectedJob]);

  const handleLogout = () => {
    localStorage.removeItem('staff_authToken');
    localStorage.removeItem('staff_userRole');
    localStorage.removeItem('staff_userName');
    localStorage.removeItem('staff_userSlug');
    
    // Cookie'leri de temizle ki tam çıkış yapılsın
    document.cookie = "staff_authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "staff_userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "staff_userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "staff_userSlug=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    router.push(`/${slug}/login`);
  };

  const handleDynamicFormChange = (name, value) => {
    setDynamicForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setIsSaving(true);
    const compressedPhotos = [];
    
    for (const file of files) {
        const compressed = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1920; 
                    let scale = 1;
                    if (img.width > MAX_WIDTH) scale = MAX_WIDTH / img.width; 
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.90)); 
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
        compressedPhotos.push(compressed);
    }
    
    setPhotos(prev => [...prev, ...compressedPhotos]);
    setIsSaving(false);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const currentFields = (companySector && staffBranch && sectorsData.sectors?.[companySector]?.subTypes?.[staffBranch]?.fields) || [];

  const getAssignerInfo = (job) => {
    const ownerName = data?.ownerName?.split(' ')[0] || 'Patron';
    const creator = job.creator_name || job.details?.createdBy || ownerName;
    let manager = job.manager_name || job.details?.managerName || null;
    
    const assignedPerson = data?.staff?.find(s => String(s.id) === String(job.staff_id));
    if (assignedPerson && assignedPerson.role === 'Yönetici' && !manager) manager = assignedPerson.name;
    if (manager) return { name: manager, role: 'Sorumlu Yönetici', icon: 'ShieldCheck' };
    return { name: creator, role: 'Görevlendiren', icon: 'UserPlus' };
  };

  const getAssetDetails = (assetId) => {
    if (!assetId || !data?.assets) return null;
    return data.assets.find(a => String(a.id) === String(assetId)) || null;
  };

// 🚀 İMZA STATE VE REF'LERİ
const [signatureName, setSignatureName] = useState('');
const [signatureImage, setSignatureImage] = useState(null);
const signatureCanvasRef = useRef(null);
const [isDrawing, setIsDrawing] = useState(false);

// 🚀 İMZA ÇİZİM (CANVAS) FONKSİYONLARI
const getCoordinates = (e) => {
  const canvas = signatureCanvasRef.current;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const startDrawing = (e) => {
  setIsDrawing(true);
  const coords = getCoordinates(e);
  const ctx = signatureCanvasRef.current?.getContext('2d');
  if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
  }
};

const draw = (e) => {
  if (!isDrawing) return;
  e.preventDefault(); 
  const coords = getCoordinates(e);
  const ctx = signatureCanvasRef.current?.getContext('2d');
  if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
  }
};

const endDrawing = () => {
  setIsDrawing(false);
  const canvas = signatureCanvasRef.current;
  if (canvas) {
      setSignatureImage(canvas.toDataURL('image/png'));
  }
};

const clearSignature = () => {
  const canvas = signatureCanvasRef.current;
  if (canvas) {
      const ctx = canvas.getContext('2d');
      if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureImage(null);
  }
};

const handleStatusUpdate = async (newStatus) => {
    // 🚀 ANA EKRAN HIZLI TAMAMLAMA ENGELLENİYOR! Usta modalı açıp imza atmak ZORUNDA.
    if (newStatus === 'Tamamlandı' && selectedJob.work_type === 'Periyodik Bakım') {
        alert("Periyodik Bakım işlemini bitirmek için 'İş Detayı'na girip müşteriden imza almanız gerekmektedir.");
        return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('staff_authToken'); 

    let formText = '';
    const targetStatus = newStatus === 'Tamamlandı' ? 'Onay Bekliyor' : newStatus;

    if (targetStatus === 'Onay Bekliyor' && currentFields.length > 0) {
        const filledData = currentFields.map(f => `${f.label}: ${dynamicForm[f.name] || 'Belirtilmedi'}`).join('\n');
        formText = `\n--- ${staffBranch} Saha Formu ---\n${filledData}\n----------------------------------\n`;
    }

    let gpsNote = '';
    if (targetStatus === 'Onay Bekliyor' && navigator.geolocation) {
       try {
         const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
         });
         // 🚀 DÜZELTİLDİ: Stabil Harita Linki
         gpsNote = `\n[📍 Konum Kaydı]: https://www.google.com/maps/search/?api=1&query=${pos.coords.latitude},${pos.coords.longitude}`;
       } catch (e) {
         console.warn("Konum alınamadı.");
       }
    }

    const finalNote = [
        selectedJob.details?.note || '', 
        formText, 
        jobNote ? `[Usta Notu]: ${jobNote}` : '',
        gpsNote
    ].filter(Boolean).join('\n\n').trim();

    const payload = {
      id: selectedJob.id,
      status: targetStatus,
      taskNote: finalNote ? finalNote : undefined,
      lastEditedBy: userData.name,
      photos: photos,
      signatureImage: signatureImage,
      signatureName: signatureName
  };

    const attemptRequest = async (retries = 3) => {
      try {
          const res = await fetch(`${API_URL}/update-job`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ ...payload, slug })
          });

          if (!res.ok) {
              if (retries > 0) {
                  await new Promise(r => setTimeout(r, 2000));
                  return await attemptRequest(retries - 1);
              }
              throw new Error("Sunucu yanıt vermedi.");
          }

          // Başarılı olduğunda true dön
          return true;
      } catch (e) {
          if (retries > 0) {
              await new Promise(r => setTimeout(r, 3000));
              return await attemptRequest(retries - 1);
          }
          // Tüm denemeler bitti ve hala hata varsa fırlat
          throw e;
      }
  };

  try {
      // İstek atılır
      await attemptRequest();
      
      // EĞER BURAYA GELDİYSE İŞLEM KESİN BAŞARILIDIR (KUYRUĞA ALMAZ)
      setSelectedJob(null);
      setJobNote('');
      setDynamicForm({});
      setPhotos([]);
      clearSignature(); // İmzayı temizle
      await fetchData(); // Verileri tazeleyerek arayüzü güncelle
      
  } catch (e) {
      // EĞER BURAYA GELDİYSE GERÇEKTEN İNTERNET YOKTUR (KUYRUĞA ALIR)
      console.warn("Bağlantı kurulamadı, işlem kuyruğa alındı.");
      const pending = JSON.parse(localStorage.getItem(`offline_actions_${slug}`) || '[]');
      pending.push({ endpoint: 'update-job', body: payload, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_actions_${slug}`, JSON.stringify(pending));
      setPendingSyncCount(pending.length);
      setIsOffline(true);

      // Arayüzü sanki başarılı olmuş gibi optimistik (geçici) olarak güncelle
      const updatedJobs = jobs.map(j => {
          if (j.id === selectedJob.id) return { ...j, status: targetStatus, details: { ...j.details, note: finalNote } };
          return j;
      });
      setJobs(updatedJobs);
      setSelectedJob(null);
      setJobNote('');
      setDynamicForm({});
      setPhotos([]);
      clearSignature(); // İmzayı temizle
  } finally {
      setIsSaving(false);
  }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-900">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="mb-4">
            <PenTool className="text-emerald-500 w-12 h-12" />
        </motion.div>
        <div className="text-white font-black tracking-widest text-[11px] uppercase opacity-50">Saha Verileri Alınıyor...</div>
      </div>
    );
  }

  const activeJobs = jobs.filter(j => j.status === 'Devam Ediyor' || j.status === 'Sahada');
  const pendingJobs = jobs.filter(j => j.status === 'Beklemede' || j.status === 'Gelecek' || j.status === 'Usta Bekliyor');
  const completedJobs = jobs.filter(j => j.status === 'Tamamlandı');

  return (
    <div className="min-h-[100dvh] flex font-sans text-sm overflow-hidden relative selection:bg-blue-100 bg-[#F8FAFC] text-slate-900">
      
      <div className="z-[300] lg:relative absolute">
        <WorkerSidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-y-auto relative z-10 w-full">
        <Header data={data} setIsMobileMenuOpen={setIsMobileMenuOpen} setSelectedJob={setSelectedJob} />

        {showPwaPrompt && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }} 
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[420px] bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl z-[9999] flex flex-row items-center justify-between border border-slate-700"
          >
            {installState === 'success' ? (
              <div className="flex items-center gap-3 w-full justify-center py-1">
                <div className="bg-emerald-500 p-2 rounded-full shrink-0">
                  <Check size={20} className="text-white" />
                </div>
                <div className="flex flex-col flex-1 min-w-0 pr-2">
                  <span className="font-bold text-sm text-emerald-400">Kurulum Başarılı!</span>
                  <span className="text-xs text-slate-400 mt-0.5">Saha uygulamasını ana ekrandan açabilirsiniz.</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-blue-500 p-2.5 rounded-xl shrink-0">
                    <Download size={20} className="text-white" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className="font-bold text-sm">Uygulamayı Yükle</span>
                    {isIos ? (
                      <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        Yüklemek için <Share size={12} className="inline-block mx-0.5 mb-0.5" /> <b>Paylaş</b> ikonuna basıp <br/> <b>Ana Ekrana Ekle</b>'yi seçin.
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 mt-0.5">Saha işlemlerini hızlıca yönetin.</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  {!isIos && (
                    <button onClick={handleInstallPwa} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">
                      Yükle
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {(isOffline || pendingSyncCount > 0) && (
              <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="bg-amber-500 text-amber-950 px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-center gap-2 z-50 shadow-md sticky top-0"
              >
              <WifiOff size={16} />
              <span className="text-center">{isOffline ? 'İnternet Yok. İşlemleriniz kaydediliyor.' : 'Bağlantı sağlandı. Veriler gönderiliyor...'}</span>
              {pendingSyncCount > 0 && (
                  <span className="bg-amber-950 text-amber-400 px-2.5 py-1 rounded-full ml-0 sm:ml-2 animate-pulse flex items-center gap-1 w-full sm:w-auto justify-center mt-1 sm:mt-0">
                      Kuyrukta {pendingSyncCount} işlem var
                  </span>
              )}
              </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-slate-900 text-white p-5 rounded-b-3xl shadow-xl z-40 relative md:mx-6 md:mt-6 md:rounded-3xl shrink-0">
          <div className="flex justify-between items-start mb-4">
              <div>
                  <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">{companyName}</div>
                  <h1 className="text-2xl font-black tracking-tight">Merhaba, {userData?.name?.split(' ')[0]}</h1>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl font-black border border-white/20">
                  {userData?.name?.charAt(0)}
              </div>
          </div>
          <div className="flex gap-2">
              <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/5">
                  <div className="text-2xl font-black text-emerald-400">{activeJobs.length + pendingJobs.length}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Bekleyen İş</div>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/5">
                  <div className="text-2xl font-black text-blue-400">{completedJobs.length}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Bitirilen</div>
              </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 space-y-6 max-w-6xl w-full mx-auto pb-24">
          
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              
              {activeJobs.length > 0 && (
                <div>
                  <h2 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <PlayCircle size={14} /> ŞU AN ÜZERİNDE ÇALIŞTIĞINIZ
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {activeJobs.map(job => {
                        const assigner = getAssignerInfo(job);
                        const asset = getAssetDetails(job.asset_id);
                        return (
                        <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-600/20 text-white active:scale-95 transition-transform cursor-pointer border border-blue-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                  <span className="bg-white/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md">Devam Ediyor</span>
                                  <span className="text-[10px] font-bold opacity-80 flex items-center gap-1"><Clock size={10}/> {job.scheduled_date || 'Anlık'}</span>
                                </div>
                                
                                <h3 className="text-lg font-black leading-tight mb-1 truncate">
                                    {asset ? (asset.apartmentName || asset.name) : job.customer_name}
                                </h3>
                                
                                <p className="text-blue-100 text-xs font-medium flex items-center gap-1.5 mb-1 truncate">
                                    <User size={12} className="shrink-0"/> {job.customer_name}
                                </p>

                                <div className="text-[11px] font-medium text-blue-200 mt-2 bg-blue-700/50 p-2 rounded-xl border border-blue-500/50 truncate">
                                    <span className="font-bold flex items-center gap-1 mb-0.5"><Briefcase size={12}/> {job.work_type}</span>
                                    {asset && `📍 ${asset.location}`}
                                </div>

                                <div className="mt-3 pt-3 border-t border-blue-500/50 flex items-center gap-1.5 text-[11px] text-blue-100">
                                  {assigner.icon === 'ShieldCheck' ? <ShieldCheck size={14} /> : <UserPlus size={14} />}
                                  <span className="opacity-80">{assigner.role}:</span> <span className="font-bold text-white">{assigner.name}</span>
                                </div>
                            </div>
                        </div>
                      )})}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertCircle size={14} /> SIRADAKİ GÖREVLER
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pendingJobs.length > 0 ? pendingJobs.map(job => {
                      const assigner = getAssignerInfo(job);
                      const asset = getAssetDetails(job.asset_id);
                      return (
                      <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-95 transition-transform cursor-pointer hover:border-blue-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">{job.status}</span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/> {job.scheduled_date || 'Anlık'}</span>
                          </div>
                          
                          <h3 className="text-base font-black text-slate-800 leading-tight mb-1 truncate">
                              {asset ? (asset.apartmentName || asset.name) : job.customer_name}
                          </h3>
                          
                          <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mb-1 truncate">
                              <User size={12} className="shrink-0 text-slate-400"/> {job.customer_name}
                          </p>
                          
                          <div className="text-[11px] font-medium text-slate-500 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100 truncate">
                              <span className="font-bold flex items-center gap-1 mb-0.5 text-blue-600"><Briefcase size={12}/> {job.work_type}</span>
                              {asset && `📍 ${asset.location}`}
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                            {assigner.icon === 'ShieldCheck' ? <ShieldCheck size={14} className="text-blue-500" /> : <UserPlus size={14} className="text-slate-400" />}
                            <span>{assigner.role}:</span> <span className="font-bold text-slate-700">{assigner.name}</span>
                          </div>
                      </div>
                    )}) : (
                      <div className="col-span-full text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium text-sm">
                        Bekleyen yeni bir göreviniz yok.
                      </div>
                    )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'completed' && (
             <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
                   <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" /> Tamamladığınız İşler
                   </h2>
                   <p className="text-sm text-slate-500 mt-1 font-medium">Bugüne kadar bitirdiğiniz tüm görevlerin listesi.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedJobs.length > 0 ? completedJobs.map(job => {
                      const asset = getAssetDetails(job.asset_id);
                      return (
                      <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors group flex flex-col justify-between">
                          <div>
                              <div className="flex justify-between items-start mb-3">
                                 <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100">{job.status}</span>
                                 <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/> {new Date(job.created_at).toLocaleDateString('tr-TR')}</span>
                              </div>
                              
                              <h3 className="text-base font-black text-slate-800 leading-tight mb-1 truncate group-hover:text-emerald-700 transition-colors">
                                  {asset ? (asset.apartmentName || asset.name) : job.customer_name}
                              </h3>
                              
                              <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5 truncate">
                                  <User size={12} className="shrink-0"/> {job.customer_name}
                              </p>
                          </div>
                          
                          <div className="text-[11px] font-medium text-slate-500 mt-3 bg-slate-50 p-2 rounded-xl border border-slate-100 truncate">
                              <span className="font-bold flex items-center gap-1 text-emerald-600"><ClipboardList size={12}/> {job.work_type}</span>
                          </div>
                      </div>
                   )}) : (
                      <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium">
                         Henüz tamamlanmış bir işiniz bulunmuyor.
                      </div>
                   )}
                </div>
             </div>
          )}

        </div>

        <AnimatePresence>
          {selectedJob && (
            <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-4">
              
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" 
                onClick={() => handleSmartClose()}
              ></motion.div>
              
              <motion.div 
                initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 pb-8 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] border border-slate-200"
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0 md:hidden"></div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-4">
                    
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                            {(() => {
                                const assigner = getAssignerInfo(selectedJob);
                                return (
                                    <>
                                        {assigner.icon === 'ShieldCheck' ? <ShieldCheck size={14} className="text-blue-500"/> : <UserPlus size={14} className="text-slate-400"/>} 
                                        {assigner.role}: <span className="text-slate-700">{assigner.name}</span>
                                    </>
                                );
                            })()}
                        </div>
                        <button onClick={() => handleSmartClose()} className="hidden md:flex p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-rose-100 hover:text-rose-600 transition-colors"><X size={16}/></button>
                    </div>

                    {(() => {
                        const customerInfo = data?.customers?.find(c => c.name === selectedJob.customer_name);
                        return (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <MapPin size={12}/> Müşteri
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 leading-tight mb-1 truncate">{selectedJob.customer_name}</h2>
                                    {customerInfo?.contact ? (
                                        <div className="text-xs font-bold text-slate-600">{customerInfo.contact}</div>
                                    ) : (
                                        <div className="text-xs font-semibold text-slate-400 italic">Telefon bilgisi yok</div>
                                    )}
                                </div>
                                {customerInfo?.contact && (
                                    <a 
                                        href={`tel:${customerInfo.contact.replace(/\s+/g, '')}`} 
                                        className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm shrink-0 border border-emerald-100"
                                        title="Müşteriyi Ara"
                                    >
                                        <Phone size={20} />
                                    </a>
                                )}
                            </div>
                        );
                    })()}

                    {(() => {
                        const asset = getAssetDetails(selectedJob.asset_id);
                        if (!asset) return null;
                        
                        const mapQuery = encodeURIComponent(asset.location || asset.apartmentName || asset.name);
                        // 🚀 DÜZELTİLDİ: Stabil Harita Linki
                        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

                        return (
                           <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                               <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                  <Box size={14} /> İlgili Varlık & Konum
                               </div>
                               <div className="text-sm font-black text-slate-800 mb-1">{asset.apartmentName || asset.name}</div>
                               <div className="text-xs font-medium text-slate-600 mb-3">{asset.location || 'Konum belirtilmemiş.'}</div>
                               
                               <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-white border border-blue-200 text-blue-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                  <MapPin size={16} /> Haritada Yol Tarifi Al
                               </a>
                           </div>
                        );
                    })()}
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GÖREV BİLGİSİ / TALİMAT</div>
                        <div className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                            <PenTool size={14} className="text-blue-500"/> {selectedJob.work_type}
                        </div>
                        {selectedJob.details?.note && (
                            <div className="text-xs text-slate-600 italic border-l-2 border-slate-300 pl-3 whitespace-pre-wrap leading-relaxed">
                                "{selectedJob.details.note}"
                            </div>
                        )}
                    </div>

                    {currentFields.length > 0 && (selectedJob.status === 'Devam Ediyor' || selectedJob.status === 'Sahada') && (
                        <div className="bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100 space-y-4">
                            <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-blue-200/50 pb-2 mb-3">
                              <ClipboardList size={14} /> {staffBranch} KONTROL FORMU
                            </div>
                            
                            {currentFields.map(field => (
                              <div key={field.name}>
                                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">{field.label}</label>
                                  {field.type === 'select' ? (
                                    <select 
                                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                                        value={dynamicForm[field.name] || ''}
                                        onChange={(e) => handleDynamicFormChange(field.name, e.target.value)}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                  ) : field.type === 'textarea' ? (
                                    <textarea 
                                        rows={2}
                                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                                        placeholder="Lütfen belirtin..."
                                        value={dynamicForm[field.name] || ''}
                                        onChange={(e) => handleDynamicFormChange(field.name, e.target.value)}
                                    />
                                  ) : (
                                    <input 
                                        type={field.type}
                                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                        placeholder="Değer girin"
                                        value={dynamicForm[field.name] || ''}
                                        onChange={(e) => handleDynamicFormChange(field.name, e.target.value)}
                                    />
                                  )}
                              </div>
                            ))}
                        </div>
                    )}

                    {(selectedJob.status === 'Devam Ediyor' || selectedJob.status === 'Sahada') && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Saha Fotoğrafları (Opsiyonel)</label>
                                <span className="text-[10px] font-bold text-slate-400">{photos.length} Seçildi</span>
                            </div>
                            
                            <input 
                                type="file" 
                                accept="image/*" 
                                /* multiple özelliği kaldırıldı, bu sayede sistem Kamera seçeneğini gizlemeyecek */
                                ref={fileInputRef}
                                onChange={handlePhotoSelect} 
                                className="hidden" 
                            />

                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-blue-400 hover:text-blue-500 transition-all active:scale-95"
                                >
                                    <Camera size={24} className="mb-1" />
                                    <span className="text-[10px] font-bold">Ekle</span>
                                </button>

                                {photos.map((photoStr, idx) => (
                                    <div key={idx} className="w-20 h-20 relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                                        <img src={photoStr} alt="Önizleme" className="w-full h-full object-cover" />
                                        <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-rose-500 shadow-sm active:scale-95">
                                            <X size={12} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

{(selectedJob.status === 'Devam Ediyor' || selectedJob.status === 'Sahada') && (
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Saha Notu (Opsiyonel)</label>
                            <textarea 
                                rows={3} 
                                value={jobNote}
                                onChange={(e) => setJobNote(e.target.value)}
                                placeholder="Kullanılan ekstra malzeme, değişen parçalar, karşılaşılan sürpriz durumlar vb." 
                                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-sm" 
                            />
                        </div>
                    )}

                    {/* 🚀 MÜŞTERİ İMZA ALANI */}
                    {(selectedJob.status === 'Devam Ediyor' || selectedJob.status === 'Sahada') && selectedJob.work_type === 'Periyodik Bakım' && (
                        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                <span>Müşteri / Yetkili İmzası</span>
                                {signatureImage && <button onClick={clearSignature} className="text-rose-500 underline font-bold">Temizle</button>}
                            </div>
                            <input 
                                type="text" 
                                placeholder="İmzalayan Kişinin Adı Soyadı" 
                                value={signatureName}
                                onChange={(e) => setSignatureName(e.target.value)}
                                className="w-full px-4 py-2.5 mb-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                            />
                            <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white touch-none">
                                <canvas 
                                    ref={signatureCanvasRef}
                                    width={300}
                                    height={150}
                                    className="w-full h-[150px] cursor-crosshair"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={endDrawing}
                                    onMouseLeave={endDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={endDrawing}
                                ></canvas>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-5 shrink-0 space-y-3">
                    {selectedJob.status === 'Beklemede' || selectedJob.status === 'Gelecek' || selectedJob.status === 'Usta Bekliyor' ? (
                        <button 
                            disabled={isSaving}
                            onClick={() => handleStatusUpdate('Devam Ediyor')}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <><PlayCircle size={20} /> İşe Başla (Sahadayım)</>}
                        </button>
                    ) : (
                        <button 
                            disabled={isSaving}
                            onClick={() => handleStatusUpdate('Tamamlandı')}
                            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> Formu Kaydet & İşi Tamamla</>}
                        </button>
                    )}
                    <button onClick={() => handleSmartClose()} className="w-full bg-white text-slate-600 py-3 rounded-2xl font-bold text-sm border-2 border-slate-200 active:scale-95 transition-all md:hidden">
                        Vazgeç / Kapat
                    </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {data && (
          <DynamicPWA 
            companyName={data?.name} 
            companyLogo={data?.logo} 
          />
        )}

<ChatPanel 
          isChatOpen={isChatOpen} 
          setIsChatOpen={setIsChatOpen} 
          activeChatId={activeChatId} 
          setActiveChatId={setActiveChatId} 
          data={data} 
          messages={messages} 
          setMessages={setMessages} 
          messageInput={messageInput} 
          setMessageInput={setMessageInput} 
          sendMessage={sendMessage} 
        />

        {/* 🚀 EKLENDİ: Usta için Termal Yazıcı Modalı */}
        <ThermalPrintModal 
          isOpen={showThermalPrintModal} 
          onClose={() => setShowThermalPrintModal(false)} 
          job={selectedThermalJob} 
          companyName={data?.name || 'İşletme'} 
        />

      </main>

    </div>
  );
}