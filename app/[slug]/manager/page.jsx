'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, ArrowRight, Filter, ShieldAlert, Info, MapPin, Check, WifiOff, Download, Share, Lock } from 'lucide-react';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ChatPanel from '@/components/chat/ChatPanel';
import DashboardModals from '@/components/modals/DashboardModals';

import HomeTab from '@/components/patron/HomeTab';
import MyJobsTab from '@/components/patron/MyJobsTab'; 
import JobsTab from '@/components/patron/JobsTab';
import TeamTab from '@/components/patron/TeamTab';
import CustomersTab from '@/components/patron/CustomersTab';
import StockTab from '@/components/patron/StockTab';
import FinanceTab from '@/components/patron/FinanceTab';
import AssetsTab from '@/components/patron/AssetsTab';
import PendingJobsTab from '@/components/patron/PendingJobsTab'; 
import CompletedJobsTab from '@/components/patron/CompletedJobsTab';
import AlertsTab from '@/components/patron/AlertsTab';
import SupportTab from '@/components/patron/SupportTab'; 
import AssetQRModal from '@/components/modals/AssetQRModal';

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

export default function ManagerDashboard() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  const [data, setData] = useState(null); 
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installState, setInstallState] = useState('idle');

  const [stockCategory, setStockCategory] = useState('Tümü');

  const [showJobModal, setShowJobModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showSupplierListModal, setShowSupplierListModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [showStaffDetail, setShowStaffDetail] = useState(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(null);
  const [showAssetDetail, setShowAssetDetail] = useState(null);
  
  const [selectedJob, setSelectedJob] = useState(null); 
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRAsset, setSelectedQRAsset] = useState(null);

  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  const [jobForm, setJobForm] = useState({ customerName: '', assetId: '', staffId: '', workType: 'Genel Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' });
  const [assetForm, setAssetForm] = useState({ name: '', location: '', apartmentName: '', deviceDetails: '', customerId: '', customerMode: 'NONE', newCustomer: { name: '', contact: '', address: '', taxInfo: '' } });
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif', username: '', password: '' });
  const [customerForm, setCustomerForm] = useState({ name: '', contact: '', address: '', taxInfo: '', assetAction: '', assetMode: 'NONE', newAsset: { name: '', location: '', apartmentName: '', deviceDetails: '' } });
  const [stockForm, setStockForm] = useState({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', category: '', supplierId: '', supplierMode: 'NONE', newSupplier: { name: '', phone: '' } });
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '' });
  const [editStaffForm, setEditStaffForm] = useState({ name: '', phone: '', role: '', branch: '', status: '', username: '', password: '', is_active: 1 });

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

  const fetchData = async (isInitial = false) => {
    // 🚀 BUG FIX: Yönlendirme döngüsünü kıran ana kontrol noktası (Patron ve Yönetici ayrı arandı)
    let token = localStorage.getItem('patron_authToken');
    let role = localStorage.getItem('patron_userRole');

    if (!token) {
        token = localStorage.getItem('staff_authToken');
        role = localStorage.getItem('staff_userRole');
    }

    if (!token || (role !== 'Patron' && role !== 'Yönetici')) {
      localStorage.clear(); // Temizlik yap
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
                  const userInterest = decoded.role === 'Patron' ? `user-${slug}-PATRON` : `user-${slug}-${decoded.id}`;
                  const adminInterest = `role-${slug}-ADMIN`; 
                  
                  await beamsClient.clearDeviceInterests();
                  await beamsClient.addDeviceInterest(userInterest);
                  await beamsClient.addDeviceInterest(adminInterest);
              })
              .catch(console.error);
      }).catch(console.error);
  }

    try {
      const res = await fetch(`${API_URL}/dashboard-data?slug=${slug}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            router.push(`/${slug}/login`); return;
          }
          throw new Error("Ağ hatası");
      }
      
      const result = await res.json();
      localStorage.setItem(`manager_cache_${slug}`, JSON.stringify(result));
      setIsOffline(false);
      setData(result);
      
    } catch (err) { 
      console.error("Veri çekilemedi:", err); 
      setIsOffline(true);
      const cachedData = localStorage.getItem(`manager_cache_${slug}`);
      if (cachedData) setData(JSON.parse(cachedData));
    } finally { 
      setLoading(false); 
    }
  };

  const fetchMessages = async () => {
    if (!activeChatId) return;
    const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken'); 
    try {
      const res = await fetch(`${API_URL}/get-messages?slug=${slug}&staffId=${activeChatId}`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessages(await res.json() || []);
    } catch (err) {}
  };

  const syncOfflineActions = async () => {
    const pending = JSON.parse(localStorage.getItem(`offline_actions_${slug}`) || '[]');
    if (pending.length === 0) {
      setPendingSyncCount(0);
      return;
    }
    
    const remaining = [];
    const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken'); 

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

    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [slug]);

  useEffect(() => { 
    fetchData(true); 
    const int = setInterval(() => fetchData(false), 15000); 
    return () => clearInterval(int); 
  }, [slug]);
  
  useEffect(() => { 
      if (isChatOpen && activeChatId) { 
          fetchMessages(); 
      } 
  }, [isChatOpen, activeChatId]);

  const handleAction = async (endpoint, body, closeFn, resetFn) => {
    if (endpoint.startsWith('delete-') || endpoint === 'update-settings') {
        alert("Yetkisiz İşlem: Yöneticiler veri silemez veya firma ayarlarını değiştiremez. Lütfen Patron ile iletişime geçin.");
        return false;
    }

    setIsSaving(true);
    const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken'); 

    try {
      const res = await fetch(`${API_URL}/${endpoint}`, { 
          method: 'POST', 
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          }, 
          body: JSON.stringify({ ...body, slug }) 
      });

      if (res.ok) { 
        if(closeFn) closeFn(false); 
        if(resetFn) resetFn(); 
        await fetchData(true); 
        return true; 
      } else { 
        alert("İşlem reddedildi. Yetkiniz olmayabilir."); 
        return false; 
      }
    } catch (err) { 
      const pending = JSON.parse(localStorage.getItem(`offline_actions_${slug}`) || '[]');
      pending.push({ endpoint, body, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_actions_${slug}`, JSON.stringify(pending));
      
      setPendingSyncCount(pending.length);
      setIsOffline(true);

      if(closeFn) closeFn(false); 
      if(resetFn) resetFn(); 
      return true; 
    } finally { 
      setIsSaving(false); 
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken'); 
    await fetch(`${API_URL}/send-message`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slug, senderId: userData?.role === 'Patron' ? 'PATRON' : userData?.id, receiverId: activeChatId, message: messageInput }) 
    });
    setMessageInput(''); fetchMessages();
  };

  const activeEmergencies = data?.activeEmergencies || [];
  const hasEmergency = activeEmergencies.length > 0;

  const handleResolveEmergency = async (emergencyId) => {
    handleAction('resolve-emergency', { id: emergencyId }, null, null);
  };

  const pendingFaults = data?.pendingFaults || [];
  const hasFault = pendingFaults.length > 0;

  const handleResolveFault = async (faultId) => {
    handleAction('resolve-fault', { id: faultId }, null, null);
  };

  useEffect(() => {
      if (activeTab === 'settings') {
          alert("Yetkisiz Erişim: Sadece Patron firma ayarlarını görüntüleyebilir.");
          setActiveTab('home');
      }
  }, [activeTab]);

  const filteredDataForTabs = useMemo(() => {
    if (!data) return null;
    if (activeTab !== 'stock' || stockCategory === 'Tümü') return data;
    const stockArray = data.stock || data.stocks || [];
    const filteredStocks = stockArray.filter((item) => item?.category === stockCategory);
    return { ...data, stock: data.stock ? filteredStocks : undefined, stocks: data.stocks ? filteredStocks : undefined };
  }, [data, stockCategory, activeTab]);

  if (loading) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-950">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="mb-4"><ShieldCheck className="text-blue-500 w-12 h-12" /></motion.div>
      <div className="text-white font-black tracking-widest text-[11px] uppercase opacity-40">Yönetici Paneli Hazırlanıyor...</div>
    </div>
  );

  const statusColors = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200', 
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200', 'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200'
  };

  return (
    <div className={`min-h-[100dvh] flex font-sans text-sm overflow-hidden relative selection:bg-blue-100 manager-scope ${hasEmergency ? 'bg-rose-950' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .manager-scope button:has(svg.lucide-trash-2),
        .manager-scope button:has(svg.lucide-trash2),
        .manager-scope button:has(svg.lucide-trash) { display: none !important; }
        .manager-scope nav button:has(svg.lucide-settings) { display: none !important; }
      `}} />

      <AnimatePresence>
        {showPwaPrompt && !hasEmergency && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl z-[9999] flex flex-row items-center justify-between border border-slate-700">
            {installState === 'success' ? (
              <div className="flex items-center gap-3 w-full justify-center py-1"><div className="bg-emerald-500 p-2 rounded-full shrink-0"><Check size={20} className="text-white" /></div><div className="flex flex-col flex-1 min-w-0 pr-2"><span className="font-bold text-sm text-emerald-400">Kurulum Başarılı!</span><span className="text-xs text-slate-400 mt-0.5">Yönetici panelini ana ekrandan açabilirsiniz.</span></div></div>
            ) : (
              <><div className="flex items-center gap-3 w-full"><div className="bg-blue-500 p-2.5 rounded-xl shrink-0"><Download size={20} className="text-white" /></div><div className="flex flex-col flex-1 min-w-0 pr-2"><span className="font-bold text-sm">Uygulamayı Yükle</span>{isIos ? (<span className="text-[11px] text-slate-400 mt-0.5 leading-tight">Yüklemek için <Share size={12} className="inline-block mx-0.5 mb-0.5" /> <b>Paylaş</b> ikonuna basıp <br/> <b>Ana Ekrana Ekle</b>'yi seçin.</span>) : (<span className="text-xs text-slate-400 mt-0.5">Yönetim işlemlerini hızlıca yapın.</span>)}</div></div><div className="flex gap-2 shrink-0 items-center">{!isIos && (<button onClick={handleInstallPwa} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">Yükle</button>)}</div></>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!hasEmergency && (
        <>
          <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
          <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none z-0"></div>
        </>
      )}

      {/* ACİL DURUM VE ARIZA EKRANLARI */}
      <AnimatePresence>
        {hasEmergency && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99999] bg-rose-600 flex flex-col items-center justify-center text-white p-6">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"><div className="w-[800px] h-[800px] bg-rose-500/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div></div>
            <div className="relative z-10 flex flex-col items-center max-w-lg text-center w-full">
                <ShieldAlert size={80} className="text-white mb-6 animate-pulse md:w-[100px] md:h-[100px]" />
                <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight uppercase">Acil Durum Bildirildi!</h1>
                <p className="text-lg md:text-xl text-rose-100 mb-8 font-medium">Sahadan veya bir müşteriden acil durum butonu tetiklendi.</p>
                <div className="bg-white/10 p-5 md:p-6 rounded-3xl backdrop-blur-md border border-white/20 mb-8 w-full max-w-md text-left shadow-2xl">
                   <div className="text-rose-200 text-xs font-bold uppercase tracking-wider mb-1">İlgili Varlık & Konum</div>
                   <div className="text-xl md:text-2xl font-black text-white mb-2">{activeEmergencies[0]?.asset_apartment || activeEmergencies[0]?.asset_name || 'Bilinmeyen Varlık'}</div>
                   <div className="flex items-start md:items-center gap-2 text-rose-100 text-sm md:text-base"><MapPin size={18} className="mt-0.5 md:mt-0 flex-shrink-0" /> <span>{activeEmergencies[0]?.asset_location ? activeEmergencies[0].asset_location.replace(activeEmergencies[0].asset_apartment || '', '').replace(/^[\s-/,]+|[\s-/,]+$/g, '').trim() : 'Konum alınamadı'}</span></div>
                </div>
                <button onClick={() => handleResolveEmergency(activeEmergencies[0]?.id)} disabled={isSaving} className="bg-white text-rose-600 px-6 py-4 md:px-10 md:py-5 w-full sm:w-auto rounded-2xl font-black text-base md:text-xl shadow-2xl hover:bg-rose-50 hover:scale-105 transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-3 disabled:opacity-50"><ShieldCheck size={28} />{isSaving ? 'Kapatılıyor...' : 'KONTROL ETTİM, ALARMI KAPAT'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasFault && !hasEmergency && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99998] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-amber-400 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-amber-950 flex flex-col">
               <div className="p-6 md:p-8 flex flex-col items-center text-center border-b border-amber-500/30"><AlertTriangle size={56} className="mb-4 animate-bounce md:w-[64px] md:h-[64px]" /><h2 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tight">Arıza Bildirimi!</h2><p className="font-bold opacity-80 text-amber-900 text-sm md:text-base">Müşterinizden yeni bir arıza kaydı ulaştı.</p></div>
               <div className="bg-white p-6 md:p-8 flex flex-col gap-4">
                  <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100"><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">İlgili Varlık & Konum</div><div className="font-black text-lg md:text-xl text-slate-800 leading-none mb-2">{pendingFaults[0]?.asset_apartment || pendingFaults[0]?.asset_name || 'Bilinmeyen Varlık'}</div><div className="text-slate-600 font-semibold flex items-start md:items-center gap-1.5 text-xs md:text-sm"><MapPin size={16} className="text-slate-400 mt-0.5 md:mt-0 flex-shrink-0"/> <span>{pendingFaults[0]?.asset_location ? pendingFaults[0].asset_location.replace(pendingFaults[0].asset_apartment || '', '').replace(/^[\s-/,]+|[\s-/,]+$/g, '').trim() : 'Konum belirtilmemiş'}</span></div></div>
                  <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100"><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Müşteri & Şikayet Detayı</div><div className="font-bold text-slate-800 text-sm md:text-base">{pendingFaults[0]?.reporter_name} - {pendingFaults[0]?.reporter_phone}</div><div className="text-slate-600 mt-3 text-xs md:text-sm italic border-l-4 border-amber-300 pl-3">"{pendingFaults[0]?.description}"</div></div>
                  <button onClick={() => handleResolveFault(pendingFaults[0]?.id)} disabled={isSaving} className="mt-2 md:mt-4 w-full bg-slate-900 hover:bg-slate-800 text-amber-400 py-3.5 md:py-4.5 rounded-2xl font-black text-base md:text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50 active:scale-95"><Check size={24} /> {isSaving ? 'Kapatılıyor...' : 'GÖRÜLDÜ / BİLDİRİMİ KAPAT'}</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex z-50">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-y-auto relative z-10">
        
        <AnimatePresence>
            {(isOffline || pendingSyncCount > 0) && !hasEmergency && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-amber-500 text-amber-950 px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-center gap-2 z-40 border-b border-amber-600/20">
                <WifiOff size={16} />
                <span className="text-center">{isOffline ? 'Bağlantı koptu. Veriler önbellekten okunuyor.' : 'İnternet bağlantısı sağlandı.'}</span>
                {pendingSyncCount > 0 && (<span className="bg-amber-950 text-amber-400 px-2.5 py-1 rounded-full ml-0 sm:ml-2 animate-pulse flex items-center gap-1 w-full sm:w-auto justify-center mt-1 sm:mt-0">Kuyrukta bekleyen {pendingSyncCount} işlem var...</span>)}
              </motion.div>
            )}
        </AnimatePresence>

        <Header data={data} setIsMobileMenuOpen={setIsMobileMenuOpen} setSelectedJob={setSelectedJob} />

        <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full pb-24">
          
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg border border-blue-200 text-xs font-black uppercase tracking-wider">
             <ShieldCheck size={14} /> Yönetici Yetkisi
          </div>

          {activeTab === 'home' && <HomeTab data={data} setShowJobModal={setShowJobModal} statusColors={statusColors} setSelectedJob={setSelectedJob} setActiveTab={setActiveTab} handleAction={handleAction} />}
          {activeTab === 'my-jobs' && <MyJobsTab data={data} setShowJobModal={setShowJobModal} statusColors={statusColors} setSelectedJob={setSelectedJob} handleAction={handleAction} />}
          {activeTab === 'jobs' && <JobsTab data={data} setShowJobModal={setShowJobModal} statusColors={statusColors} setSelectedJob={setSelectedJob} />}
          {activeTab === 'pending' && <PendingJobsTab data={data} setSelectedJob={setSelectedJob} />}
          {activeTab === 'completed' && <CompletedJobsTab data={data} setSelectedJob={setSelectedJob} statusColors={statusColors} />}
          {activeTab === 'alerts' && <AlertsTab data={data} />} 
          {activeTab === 'team' && <TeamTab data={data} setShowStaffModal={setShowStaffModal} setShowJobModal={setShowJobModal} setShowStaffDetail={setShowStaffDetail} setEditStaffForm={setEditStaffForm} setIsEditingStaff={setIsEditingStaff} setActiveChatId={setActiveChatId} setIsChatOpen={setIsChatOpen} setSelectedJob={setSelectedJob} />}
          {activeTab === 'customers' && <CustomersTab data={data} setShowCustomerModal={setShowCustomerModal} setShowCustomerDetail={setShowCustomerDetail} />}
          {activeTab === 'support' && <SupportTab handleAction={handleAction} isSaving={isSaving} />} 
          
          {activeTab === 'stock' && (
            <div className="flex flex-col space-y-4">
              <StockTab data={filteredDataForTabs} handleAction={handleAction} setShowStockModal={setShowStockModal} setShowSupplierModal={setShowSupplierModal} setShowSupplierListModal={setShowSupplierListModal} setShowCategoryModal={setShowCategoryModal} />
            </div>
          )}
          {activeTab === 'assets' && <AssetsTab data={data} setShowAssetModal={setShowAssetModal} setShowAssetDetail={setShowAssetDetail} setShowQRModal={setShowQRModal} setSelectedQRAsset={setSelectedQRAsset} />}
          
          {activeTab === 'finance' && <FinanceTab data={data} userRole="Yönetici" />}

        </div>
      </main>

      <ChatPanel isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} activeChatId={activeChatId} setActiveChatId={setActiveChatId} data={data} messages={messages} setMessages={setMessages} messageInput={messageInput} setMessageInput={setMessageInput} sendMessage={sendMessage} />

      <DashboardModals 
        showStaffDetail={showStaffDetail} setShowStaffDetail={setShowStaffDetail} isEditingStaff={isEditingStaff} setIsEditingStaff={setIsEditingStaff} editStaffForm={editStaffForm} setEditStaffForm={setEditStaffForm}
        showCustomerDetail={showCustomerDetail} setShowCustomerDetail={setShowCustomerDetail}
        showAssetDetail={showAssetDetail} setShowAssetDetail={setShowAssetDetail}
        showJobModal={showJobModal} setShowJobModal={setShowJobModal} jobForm={jobForm} setJobForm={setJobForm}
        showAssetModal={showAssetModal} setShowAssetModal={setShowAssetModal} assetForm={assetForm} setAssetForm={setAssetForm}
        showStaffModal={showStaffModal} setShowStaffModal={setShowStaffModal} staffForm={staffForm} setStaffForm={setStaffForm}
        showCustomerModal={showCustomerModal} setShowCustomerModal={setShowCustomerModal} customerForm={customerForm} setCustomerForm={setCustomerForm}
        showStockModal={showStockModal} setShowStockModal={setShowStockModal} stockForm={stockForm} setStockForm={setStockForm}
        showSupplierModal={showSupplierModal} setShowSupplierModal={setShowSupplierModal} supplierForm={supplierForm} setSupplierForm={setSupplierForm}
        showSupplierListModal={showSupplierListModal} setShowSupplierListModal={setShowSupplierListModal}
        showCategoryModal={showCategoryModal} setShowCategoryModal={setShowCategoryModal}
        handleAction={handleAction} isSaving={isSaving} data={data}
        selectedJob={selectedJob} setSelectedJob={setSelectedJob}
        userRole="Yönetici" 
      />
      
      <AssetQRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} asset={selectedQRAsset} companyName={data?.name} companyLogo={data?.logo} landlinePhone={data?.landlinePhone} whatsappPhone={data?.whatsappPhone} companyWebsite={data?.website} />
    </div>
  );
}