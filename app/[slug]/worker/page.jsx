'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, CheckCircle2, MessageSquareText, LogOut, ChevronRight, PenTool, Loader2, AlertCircle, PlayCircle, ClipboardList, WifiOff, Download, Share, Check, Camera, X } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';
import Header from '@/components/layout/Header';

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

  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installState, setInstallState] = useState('idle');

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
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }, 
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
    // 🚀 BUG FIX: Sadece 'Usta' olanlar için net yetki kontrolü
    const token = localStorage.getItem('staff_authToken'); 
    const role = localStorage.getItem('staff_userRole'); 

    if (!token || role !== 'Usta') {
        localStorage.clear();
        router.push(`/${slug}/login`);
        return;
    }

    const decoded = parseJwt(token);
    setUserData(decoded);

    if (isInitial && typeof window !== 'undefined') {
        import('@pusher/push-notifications-web').then((PusherPushNotifications) => {
            const beamsClient = new PusherPushNotifications.Client({
                instanceId: "6a47ebc2-0c89-48f1-81a3-80a4e003dd41",
            });
            beamsClient.start()
                .then(async () => {
                    const userInterest = `user-${slug}-${decoded.id}`;
                    
                    await beamsClient.clearDeviceInterests();
                    await beamsClient.addDeviceInterest(userInterest);
                })
                .catch(console.error);
        }).catch(console.error);
    }

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
        if (myStaffRecord) {
            setStaffBranch(myStaffRecord.branch);
        }
        
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

  useEffect(() => {
    fetchData(true);
    const int = setInterval(() => fetchData(false), 15000); 
    return () => clearInterval(int);
  }, [slug, router]);

  useEffect(() => {
    setDynamicForm({});
    setJobNote('');
    setPhotos([]);
  }, [selectedJob]);

  const handleLogout = () => {
    localStorage.clear();
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
                    if (img.width > MAX_WIDTH) { scale = MAX_WIDTH / img.width; }
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

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const currentFields = (companySector && staffBranch && sectorsData.sectors?.[companySector]?.subTypes?.[staffBranch]?.fields) || [];

  const handleStatusUpdate = async (newStatus) => {
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
         gpsNote = `\n[📍 Konum Kaydı]: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
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
        photos: photos 
    };

    try {
      const res = await fetch(`${API_URL}/update-job`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...payload, slug })
      });

      if (!res.ok) throw new Error("Ağ hatası");

      setSelectedJob(null);
      setJobNote('');
      setDynamicForm({});
      setPhotos([]);
      await fetchData(); 

    } catch (e) {
      const pending = JSON.parse(localStorage.getItem(`offline_actions_${slug}`) || '[]');
      pending.push({ endpoint: 'update-job', body: payload, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_actions_${slug}`, JSON.stringify(pending));
      
      setPendingSyncCount(pending.length);
      setIsOffline(true);

      const updatedJobs = jobs.map(j => {
          if (j.id === selectedJob.id) {
             return { ...j, status: targetStatus, details: { ...j.details, note: finalNote } };
          }
          return j;
      });
      setJobs(updatedJobs);

      setSelectedJob(null);
      setJobNote('');
      setDynamicForm({});
      setPhotos([]);
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
  const pendingJobs = jobs.filter(j => j.status === 'Beklemede' || j.status === 'Gelecek');
  const completedJobs = jobs.filter(j => j.status === 'Tamamlandı');

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] text-slate-900 font-sans flex flex-col pb-20 selection:bg-blue-100 relative">
      
      <Header data={data} setIsMobileMenuOpen={setIsMobileMenuOpen} setSelectedJob={setSelectedJob} />

      {/* PWA YÜKLEME MODALI */}
      <AnimatePresence>
        {showPwaPrompt && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }} 
            className="fixed bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl z-[9999] flex flex-row items-center justify-between border border-slate-700"
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
      </AnimatePresence>

      {/* İNTERNET YOK / KUYRUK UYARI BARI */}
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

      {/* ÜST BİLGİ ALANI (HEADER) */}
      <div className="bg-slate-900 text-white p-5 rounded-b-3xl shadow-xl z-40 relative">
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

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 p-4 overflow-y-auto">
        
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            
            {/* Devam Eden İşler (Öncelikli) */}
            {activeJobs.length > 0 && (
              <div>
                 <h2 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <PlayCircle size={14} /> ŞU AN ÜZERİNDE ÇALIŞTIĞINIZ
                 </h2>
                 <div className="space-y-3">
                    {activeJobs.map(job => (
                      <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-600/20 text-white active:scale-95 transition-transform cursor-pointer border border-blue-500 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-2">
                                 <span className="bg-white/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md">Devam Ediyor</span>
                                 <span className="text-[10px] font-bold opacity-80 flex items-center gap-1"><Clock size={10}/> {job.scheduled_date || 'Anlık'}</span>
                              </div>
                              <h3 className="text-lg font-black leading-tight mb-1">{job.customer_name}</h3>
                              <p className="text-blue-100 text-sm font-medium flex items-center gap-1.5"><MapPin size={14} className="shrink-0"/> {job.work_type}</p>
                          </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Bekleyen İşler */}
            <div>
               <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle size={14} /> SIRADAKİ GÖREVLER
               </h2>
               <div className="space-y-3">
                  {pendingJobs.length > 0 ? pendingJobs.map(job => (
                    <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-95 transition-transform cursor-pointer hover:border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                           <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">{job.status}</span>
                           <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/> {job.scheduled_date || 'Anlık'}</span>
                        </div>
                        <h3 className="text-base font-black text-slate-800 leading-tight mb-1">{job.customer_name}</h3>
                        <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5"><PenTool size={12} className="shrink-0 text-blue-500"/> {job.work_type}</p>
                    </div>
                  )) : (
                    <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium text-sm">
                       Bekleyen yeni bir göreviniz yok.
                    </div>
                  )}
               </div>
            </div>

          </div>
        )}

        {/* Mesajlar Sekmesi */}
        {activeTab === 'messages' && (
           <div className="h-full flex flex-col items-center justify-center text-center opacity-50 pt-20">
               <MessageSquareText size={48} className="text-slate-400 mb-4" />
               <p className="font-bold text-slate-600">Mesajlar alanı yakında aktif olacak.</p>
           </div>
        )}
      </main>

      {/* İŞ DETAY VE AKSİYON MODALI */}
      <AnimatePresence>
        {selectedJob && (
          <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" onClick={() => setSelectedJob(null)}></div>
            <motion.div 
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
               className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-[110] p-6 pb-8 shadow-2xl border-t border-slate-200 flex flex-col max-h-[90vh]"
            >
               <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0"></div>
               
               <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-5">
                   <div>
                       <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><MapPin size={12}/> Müşteri / Konum</div>
                       <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedJob.customer_name}</h2>
                   </div>
                   
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GÖREV DETAYI</div>
                       <div className="text-sm font-bold text-slate-800 mb-2">{selectedJob.work_type}</div>
                       {selectedJob.details?.note && (
                           <div className="text-xs text-slate-600 italic border-l-2 border-slate-300 pl-2 whitespace-pre-wrap">
                               "{selectedJob.details.note}"
                           </div>
                       )}
                   </div>

                   {/* DİNAMİK BRANŞ FORMU */}
                   {currentFields.length > 0 && (selectedJob.status === 'Devam Ediyor' || selectedJob.status === 'Sahada') && (
                       <div className="bg-blue-50/50 p-4 sm:p-5 rounded-xl border border-blue-100 space-y-4">
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

                   {/* GALERİ SEÇİMİ SERBEST BIRAKILAN FOTOĞRAF YÜKLEME ALANI */}
                   {(selectedJob.status === 'Devam Ediyor' || selectedJob.status === 'Sahada') && (
                       <div>
                           <div className="flex items-center justify-between mb-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Saha Fotoğrafları (Opsiyonel)</label>
                               <span className="text-[10px] font-bold text-slate-400">{photos.length} Seçildi</span>
                           </div>
                           
                           <input 
                              type="file" 
                              accept="image/*" 
                              multiple 
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

                   {/* Ustadan Serbest Not Alma Alanı */}
                   <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Saha Notu (Opsiyonel)</label>
                       <textarea 
                          rows={2} 
                          value={jobNote}
                          onChange={(e) => setJobNote(e.target.value)}
                          placeholder="Kullanılan ekstra malzeme, karşılaşılan durum vb." 
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none" 
                       />
                   </div>
               </div>

               {/* AKSİYON BUTONLARI */}
               <div className="pt-6 shrink-0 space-y-3">
                   {selectedJob.status === 'Beklemede' || selectedJob.status === 'Gelecek' ? (
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
                   <button onClick={() => setSelectedJob(null)} className="w-full bg-white text-slate-600 py-3 rounded-2xl font-bold text-sm border-2 border-slate-200 active:scale-95 transition-all">
                       Vazgeç / Kapat
                   </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBİL ALT MENÜ (BOTTOM NAVIGATION) */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 pb-safe pt-2 px-6 flex justify-between items-center z-30 h-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button onClick={() => setActiveTab('jobs')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'jobs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <div className={`p-1.5 rounded-xl ${activeTab === 'jobs' ? 'bg-blue-50' : ''}`}><PenTool size={22} strokeWidth={activeTab === 'jobs' ? 3 : 2} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Görevler</span>
          </button>
          <button onClick={() => setActiveTab('messages')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'messages' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <div className={`p-1.5 rounded-xl ${activeTab === 'messages' ? 'bg-blue-50' : ''}`}><MessageSquareText size={22} strokeWidth={activeTab === 'messages' ? 3 : 2} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Mesajlar</span>
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center gap-1.5 text-rose-400 hover:text-rose-600 transition-colors">
              <div className="p-1.5"><LogOut size={22} strokeWidth={2} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Çıkış</span>
          </button>
      </nav>

    </div>
  );
}