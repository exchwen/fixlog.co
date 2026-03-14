'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Filter, ShieldAlert, MapPin, Check, WifiOff, Download, Share, X } from 'lucide-react';

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
import PeriodicTab from '@/components/patron/PeriodicTab';
import AssetQRModal from '@/components/modals/AssetQRModal';
import DynamicPWA from '@/components/DynamicPWA';

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

  // PWA States
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installState, setInstallState] = useState('idle');

  // Filtreleme
  const [stockCategory, setStockCategory] = useState('Tümü');

  // 🚀 ŞIK HATA MODALI İÇİN STATE
  const [showErrorModal, setShowErrorModal] = useState({ show: false, message: '' });

  // =================================================================================
  // 1. MODAL VISIBILITY STATES
  // =================================================================================
  const [showAddJob, setShowAddJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null); 

  const [showAddAsset, setShowAddAsset] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [showStockModal, setShowStockModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);
  const [showStockEntryModal, setShowStockEntryModal] = useState(false);

  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRAsset, setSelectedQRAsset] = useState(null);

  // 🚀 AKILLI EXCEL STATE'İ EKLENDİ
  const [showSmartExcelModal, setShowSmartExcelModal] = useState(false);

  // 🚀 EKLENDİ: Fiş Yazdırma Modalı State'leri
  const [showThermalPrintModal, setShowThermalPrintModal] = useState(false);
  const [selectedThermalJob, setSelectedThermalJob] = useState(null);

  // =================================================================================
  // 2. FORM DATA STATES (Yeni Modallara Uyumlu)
  // =================================================================================
  const [jobModalStep, setJobModalStep] = useState(1);
  const [jobForm, setJobForm] = useState({ 
    customerName: '', assetId: '', staffId: '', workType: 'Görev', 
    workCategory: 'Normal İş Atama', jobType: 'Anlık', scheduledDate: '', taskNote: '' 
  });

  const [newAsset, setNewAsset] = useState({ 
    name: '', location: '', customer_id: '', type: '', serial_number: '', maintenance_fee: '' // 🚀 PATRON/YÖNETİCİ BAKIM ÜCRETİNİ BURADAN GİRECEK
  });

  const [newStaff, setNewStaff] = useState({ 
    name: '', role: '', contact: '', branch: '', username: '', password: '' 
  });

  const [newCustomer, setNewCustomer] = useState({ 
    name: '', contact: '', address: '', tax_info: '', asset_name: '', asset_type: '' 
  });

  const [newStock, setNewStock] = useState({ 
    name: '', quantity: '', unit: 'Adet', category: '', min_alert: '' 
  });

  const [newSupplier, setNewSupplier] = useState({ 
    name: '', contact: '', address: '' 
  });

  const [newCategory, setNewCategory] = useState({ name: '' });

  const [newOrder, setNewOrder] = useState({ 
    supplier_id: '', item_name: '', quantity: '', unit: 'Adet' 
  });
  
  const [bulkOrderList, setBulkOrderList] = useState([
    { supplier_id: '', item_name: '', quantity: '', unit: 'Adet' }
  ]);
  
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editStaffForm, setEditStaffForm] = useState({ name: '', phone: '', role: '', branch: '', status: '', username: '', password: '', is_active: 1 });
  
  const [isSaving, setIsSaving] = useState(false);

  // =================================================================================
  // 3. İŞ DETAYI VE DÜZENLEME STATE'LERİ
  // =================================================================================
  const [previewPdfJob, setPreviewPdfJob] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [isEditingJobDetail, setIsEditingJobDetail] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editJobDetailForm, setEditJobDetailForm] = useState({ 
    workCategory: '', workType: '', jobType: '', scheduledDate: '', 
    staffId: '', taskNote: '', customerName: '', assetId: '',
    paymentStatus: 'Bekliyor', paymentAmount: '' // 🚀 MERKEZİN TAHSİLAT GİRİŞİ İÇİN
  });
  const [jobTargetMode, setJobTargetMode] = useState('CUSTOMER');
  const [jobPrice, setJobPrice] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [jobModalType, setJobModalType] = useState(null);

  // Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // Yardımcı Arama
  const [searchCust, setSearchCust] = useState('');
  const [searchAsset, setSearchAsset] = useState('');

  // =================================================================================
  // PWA ve Fetching
  // =================================================================================
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setIsIos(true); setTimeout(() => setShowPwaPrompt(true), 2000);
    } else {
      window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); setTimeout(() => setShowPwaPrompt(true), 2000); });
      window.addEventListener('appinstalled', () => { setInstallState('success'); setTimeout(() => setShowPwaPrompt(false), 3000); });
    }
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); 
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setInstallState('success'); setTimeout(() => setShowPwaPrompt(false), 3000); }
      setDeferredPrompt(null);
    }
  };

  const fetchData = async (isInitial = false) => {
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    let patronToken = localStorage.getItem('patron_authToken') || getCookie('patron_authToken');
    let patronRole = localStorage.getItem('patron_userRole') || getCookie('patron_userRole');

    // Patron yanlışlıkla yönetici linkine girdiyse veya yönlendirildiyse onu kendi evine gönder
    if (patronToken && patronRole === 'Patron') {
        router.replace(`/${slug}/dashboard`);
        return;
    }

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

    // Sadece Yönetici yetkisi olanlar bu sayfada kalabilir
    if (!token || role !== 'Yönetici') {
      localStorage.removeItem('staff_authToken');
      localStorage.removeItem('staff_userRole');
      router.push(`/${slug}/login`);
      return;
    }

    const decoded = parseJwt(token);
    setUserData(decoded);

    try {
      const res = await fetch(`${API_URL}/dashboard-data?slug=${slug}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('patron_authToken');
          localStorage.removeItem('patron_userRole');
          localStorage.removeItem('staff_authToken');
          localStorage.removeItem('staff_userRole');
          router.push(`/${slug}/login`); return;
        }
        throw new Error("Ağ hatası");
    }
      
      const result = await res.json();
      localStorage.setItem(`manager_cache_${slug}`, JSON.stringify(result));
      setIsOffline(false);
      setData(result);
      
    } catch (err) { 
      setIsOffline(true);
      const cachedData = localStorage.getItem(`manager_cache_${slug}`);
      if (cachedData) setData(JSON.parse(cachedData));
    } finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    if (!activeChatId) return;
    const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken'); 
    try {
      const res = await fetch(`${API_URL}/get-messages?slug=${slug}&staffId=${activeChatId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      setMessages(await res.json() || []);
    } catch (err) {}
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken'); 
    await fetch(`${API_URL}/send-message`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slug, senderId: userData?.role === 'Patron' ? 'PATRON' : userData?.id, receiverId: activeChatId, message: messageInput }) 
    });
    setMessageInput(''); fetchMessages();
  };

  useEffect(() => { fetchData(true); const int = setInterval(() => fetchData(false), 15000); return () => clearInterval(int); }, [slug]);
  useEffect(() => { if (isChatOpen && activeChatId) fetchMessages(); }, [isChatOpen, activeChatId]);

  // Modal Kapatma
  const handleCloseJobModal = () => {
    setShowAddJob(false);
  };

  const handleCloseDetail = (type) => {
    if(type === 'asset') setSelectedAsset(null);
    if(type === 'customer') setSelectedCustomer(null);
    if(type === 'staff') setSelectedStaff(null);
    if(type === 'job') {
        setSelectedJob(null);
        setIsEditingJobDetail(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAddJob(false); setShowAddAsset(false); setShowAddStaff(false); setShowAddCustomer(false);
        setShowStockModal(false); setShowSupplierModal(false); setShowCategoryModal(false);
        setSelectedJob(null); setSelectedAsset(null); setSelectedStaff(null); setSelectedCustomer(null);
        setShowQRModal(false);
        setPreviewPdfJob(null);
        setFullScreenImage(null);
        setShowErrorModal({show: false, message: ''}); // ESC basınca hata modalı da kapansın
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAction = async (endpoint, body, closeFn, resetFn) => {
    // 🚀 YÖNETİCİ KISITLAMALARI VE ŞIK UYARI MODALI
    if (endpoint.startsWith('delete-') || endpoint === 'update-settings') {
        setShowErrorModal({
            show: true, 
            message: 'Yöneticilerin sistemden veri silme veya firma ayarlarını değiştirme yetkisi yoktur. Bu işlem için lütfen sistem yöneticisi (Patron) ile iletişime geçin.'
        });
        return false;
    }

    // Yöneticilerin usta ekleyebilmesi için 'add-staff' frontend engeli kaldırıldı.
    // Rol (Sadece Usta) denetimi backend ve modal içerisindeki userRole mantığıyla korunuyor.

    setIsSaving(true);
    const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken');

    // İş güncellenirken Manager ID'yi kaydet
    if (endpoint === 'update-job' && userData && userData.role === 'Yönetici') {
         const details = body.details ? { ...JSON.parse(JSON.stringify(body.details)) } : {};
         details.managerName = userData.name;
         details.managerId = userData.id;
         body.details = details;
    }
    
    const attemptRequest = async (retries = 3) => {
      try {
        const res = await fetch(`${API_URL}/${endpoint}`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
            body: JSON.stringify({ ...body, slug }) 
        });

        if (!res.ok) { 
          if (retries > 0) {
              await new Promise(r => setTimeout(r, 2000));
              return attemptRequest(retries - 1);
          }
          if (res.status === 403) {
              setShowErrorModal({ show: true, message: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmamaktadır.' });
          } else {
              setShowErrorModal({ show: true, message: 'İşlem reddedildi. Bir hata oluştu.' });
          }
          return false; 
        }

        if(closeFn) closeFn(false); 
        if(resetFn) resetFn(); 
        await fetchData(true); 
        return true; 
      } catch (err) { 
          if (retries > 0) {
              await new Promise(r => setTimeout(r, 3000));
              return attemptRequest(retries - 1);
          }
          setShowErrorModal({ show: true, message: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' });
          return false; 
      }
    };

    const result = await attemptRequest();
    setIsSaving(false);
    return result;
  };

  const activeEmergencies = data?.activeEmergencies || [];
  const hasEmergency = activeEmergencies.length > 0;
  const pendingFaults = data?.pendingFaults || [];
  const hasFault = pendingFaults.length > 0;

// 🚀 AKILLI ÇÖZÜMLEYİCİ: Acil durum cihazdan mı yoksa personelden mi geliyor?
const handleResolveEmergency = async (emg) => {
  if (emg.staff_id) {
      handleAction('resolve-sos', { id: emg.id }, null, null);
  } else {
      handleAction('resolve-emergency', { id: emg.id }, null, null);
  }
};
const handleResolveFault = async (id) => handleAction('resolve-fault', { id }, null, null);

  // 🚀 OTONOM BAKIM DAĞITIM MOTORUNU TETİKLEME (Yapay Zekasız, Sıfır Maliyetli Algoritma)
  const [isGeneratingMaintenance, setIsGeneratingMaintenance] = useState(false);
  
  const handleGenerateMonthlyMaintenance = async () => {
      // 🚀 DIKKAT: window.confirm ve kalıntı alert'ler SİLİNDİ!
      setIsGeneratingMaintenance(true);
      const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken');
      
      try {
          const res = await fetch(`${API_URL}/generate-monthly-maintenance`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ slug })
          });
          
          const result = await res.json();
          if (res.ok) {
              fetchData(true); // Dashboard'u yenile ki işler ekrana düşsün
              return result; // periodictab.tsx'in başarılı olduğunu anlaması için geri dön
          } else {
              throw new Error(result.error || 'Dağıtım yapılamadı.');
          }
      } catch (err) {
          throw err; // Hatayı periodictab.tsx'in yakalaması (catch) için fırlat
      } finally {
          setIsGeneratingMaintenance(false);
      }
  };

  // Yönetici kısıtlaması (Ayarlar'a erişemez)
  useEffect(() => {
      if (activeTab === 'settings') {
          setShowErrorModal({ show: true, message: 'Sadece yetkili Patron hesabı firma ayarlarına erişebilir.' });
          setActiveTab('home');
      }
  }, [activeTab]);

  const filteredDataForTabs = useMemo(() => {
    if (!data) return null;
    if (activeTab !== 'stock' || stockCategory === 'Tümü') return data;
    const filteredStocks = (data.stock || []).filter((item) => item?.category === stockCategory);
    return { ...data, stock: filteredStocks };
  }, [data, stockCategory, activeTab]);

  if (loading) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-950">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="mb-4"><ShieldCheck className="text-blue-500 w-12 h-12" /></motion.div>
      <div className="text-white font-black tracking-widest text-[11px] uppercase opacity-40">Yönetici Paneli Hazırlanıyor...</div>
    </div>
  );

  const statusColors = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200', 
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200', 
    'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200',
    'Usta Bekliyor': 'bg-indigo-100 text-indigo-700 border-indigo-200' 
  };

  return (
    <div className={`min-h-[100dvh] flex font-sans text-sm overflow-hidden relative selection:bg-blue-100 manager-scope ${hasEmergency ? 'bg-rose-950' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* YÖNETİCİ KISITLAMALARI İÇİN CSS (SİLME VE AYAR BUTONLARINI GİZLER) */}
      <style dangerouslySetInnerHTML={{__html: `
        .manager-scope button:has(svg.lucide-trash-2),
        .manager-scope button:has(svg.lucide-trash2),
        .manager-scope button:has(svg.lucide-trash) { display: none !important; }
        .manager-scope nav button:has(svg.lucide-settings) { display: none !important; }
      `}} />

      {/* 🚀 ŞIK YETKİ HATASI MODALI (ALERTS YERİNE) */}
      <AnimatePresence>
        {showErrorModal.show && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 10 }}
                    className="bg-white max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
                >
                    <div className="bg-rose-50 border-b border-rose-100 p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
                            <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-xl font-black text-rose-900">Yetkisiz İşlem!</h3>
                    </div>
                    <div className="p-6 text-center text-slate-600 font-medium leading-relaxed">
                        {showErrorModal.message}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <button 
                            onClick={() => setShowErrorModal({ show: false, message: '' })}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-md"
                        >
                            Anladım
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPwaPrompt && !hasEmergency && activeTab === 'home' && (
           <motion.div 
             initial={{ y: 100 }} 
             animate={{ y: 0 }} 
             exit={{ y: 100 }} 
             className={`fixed right-4 sm:right-6 z-[9999] bg-slate-900 text-white p-4 rounded-xl shadow-2xl w-80 transition-all duration-300 ${isChatOpen ? 'bottom-[600px]' : 'bottom-24'}`}
           >
              <div className="flex gap-3"><Download className="text-blue-400" /><div><div className="font-bold">Uygulamayı Yükle</div><div className="text-xs text-slate-400 mt-1">Daha hızlı erişim için ana ekrana ekle.</div></div></div>
              {!isIos && <button onClick={handleInstallPwa} className="mt-3 w-full bg-blue-600 py-2 rounded-lg text-xs font-bold">Yükle</button>}
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
                <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight uppercase">
                    {activeEmergencies[0]?.staff_id ? 'PERSONEL SOS ALARMI!' : 'Acil Durum Bildirildi!'}
                </h1>
                <p className="text-lg md:text-xl text-rose-100 mb-8 font-medium">
                    {activeEmergencies[0]?.staff_id ? `${activeEmergencies[0].staff_name} sahadan SOS acil çağrısı gönderdi.` : 'Sahadan veya bir müşteriden cihaz acil durum butonu tetiklendi.'}
                </p>
                <div className="bg-white/10 p-5 md:p-6 rounded-3xl backdrop-blur-md border border-white/20 mb-8 w-full max-w-md text-left shadow-2xl">
                <div className="text-rose-200 text-xs font-bold uppercase tracking-wider mb-1">
                       {activeEmergencies[0]?.staff_id ? 'Durum & Personel' : 'İlgili Varlık & Konum'}
                   </div>
                   {activeEmergencies[0]?.staff_id && (
                       <div className="text-lg md:text-xl font-bold text-white mb-0.5">
                           {activeEmergencies[0].staff_name}
                       </div>
                   )}
                   <div className="text-xl md:text-2xl font-black text-white mb-2">
                       {activeEmergencies[0]?.staff_id ? activeEmergencies[0].type : (activeEmergencies[0]?.asset_apartment || activeEmergencies[0]?.asset_name || 'Bilinmeyen Varlık')}
                   </div>
                   {activeEmergencies[0]?.staff_id && activeEmergencies[0]?.message && (
                       <div className="text-sm italic text-rose-100 mb-3 border-l-2 border-rose-400 pl-2">"{activeEmergencies[0].message}"</div>
                   )}
                   
                   {/* 🚀 ÜCRETSİZ HARİTA ÖNİZLEMESİ VE YOL TARİFİ - MOBİL UYUMLU SIKIŞTIRILMIŞ TASARIM */}
                   <div className="mt-4 flex flex-col gap-2 w-full max-w-full">
                       {activeEmergencies[0]?.staff_id ? (
                           activeEmergencies[0].location && activeEmergencies[0].location !== 'null' ? (
                               (() => {
                                   let lat, lng;
                                   try {
                                       const parsed = typeof activeEmergencies[0].location === 'string' ? JSON.parse(activeEmergencies[0].location) : activeEmergencies[0].location;
                                       lat = parsed.lat; lng = parsed.lng;
                                   } catch(e) {}
                                   
                                   if (lat && lng) {
                                       return (
                                           <div className="flex flex-col gap-2 w-full max-w-full">
                                               <div className="w-full h-32 rounded-xl overflow-hidden border border-white/20 shadow-inner relative bg-rose-900/50 pointer-events-none isolate">
                                                   <iframe 
                                                       className="absolute inset-0 w-full h-full border-0" 
                                                       loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" 
                                                       src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                                                   ></iframe>
                                               </div>
                                               <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="w-full bg-white text-rose-600 px-4 py-3 rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md hover:bg-rose-50 text-xs sm:text-sm">
                                                   <MapPin size={18} className="shrink-0" /> <span className="truncate">HARİTADA YOL TARİFİ AL</span>
                                               </a>
                                           </div>
                                       );
                                   }
                                   return <div className="flex items-center gap-2 text-rose-200 text-xs"><MapPin size={16} className="shrink-0" /> Konum verisi hatalı</div>;
                               })()
                           ) : (
                               <div className="flex items-center gap-2 text-rose-200 text-xs"><MapPin size={16} className="shrink-0" /> Konum alınamadı (İzin verilmemiş veya sinyal zayıf)</div>
                           )
                       ) : (
                           activeEmergencies[0]?.asset_location ? (
                               (() => {
                                   const cleanAddress = activeEmergencies[0].asset_location.replace(activeEmergencies[0].asset_apartment || '', '').replace(/^[\s-/,]+|[\s-/,]+$/g, '').trim();
                                   return (
                                       <div className="flex flex-col gap-2 w-full max-w-full">
                                           <div className="w-full h-32 rounded-xl overflow-hidden border border-white/20 shadow-inner relative bg-rose-900/50 pointer-events-none isolate">
                                               <iframe 
                                                   className="absolute inset-0 w-full h-full border-0" 
                                                   loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" 
                                                   src={`https://maps.google.com/maps?q=${encodeURIComponent(cleanAddress)}&z=15&output=embed`}
                                               ></iframe>
                                           </div>
                                           <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanAddress)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-white text-rose-600 px-4 py-3 rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md hover:bg-rose-50 text-xs sm:text-sm">
                                               <MapPin size={18} className="shrink-0" /> <span className="truncate">HARİTADA YOL TARİFİ AL</span>
                                           </a>
                                       </div>
                                   )
                               })()
                           ) : (
                               <div className="flex items-center gap-2 text-rose-200 text-xs"><MapPin size={16} className="shrink-0" /> Konum belirtilmemiş</div>
                           )
                       )}
                   </div>
                </div>
                <button onClick={() => handleResolveEmergency(activeEmergencies[0])} disabled={isSaving} className="bg-white text-rose-600 px-6 py-4 md:px-10 md:py-5 w-full sm:w-auto rounded-2xl font-black text-base md:text-xl shadow-2xl hover:bg-rose-50 hover:scale-105 transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-3 disabled:opacity-50"><ShieldCheck size={28} />{isSaving ? 'Kapatılıyor...' : 'KONTROL ETTİM, ALARMI KAPAT'}</button>
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
        <Header data={data} setIsMobileMenuOpen={setIsMobileMenuOpen} setSelectedJob={setSelectedJob} />

        <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full pb-24">
          
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg border border-blue-200 text-xs font-black uppercase tracking-wider">
             <ShieldCheck size={14} /> Yönetici Yetkisi
          </div>

          {activeTab === 'home' && <HomeTab data={data} setShowJobModal={setShowAddJob} statusColors={statusColors} setSelectedJob={setSelectedJob} setActiveTab={setActiveTab} handleAction={handleAction} setJobModalType={setJobModalType} />}
          {activeTab === 'my-jobs' && <MyJobsTab data={data} setShowJobModal={setShowAddJob} statusColors={statusColors} setSelectedJob={setSelectedJob} handleAction={handleAction} setJobModalType={setJobModalType} />}
          {activeTab === 'jobs' && <JobsTab data={data} setShowJobModal={setShowAddJob} statusColors={statusColors} setSelectedJob={setSelectedJob} setJobModalType={setJobModalType} handleAction={handleAction} />}
          {activeTab === 'pending' && <PendingJobsTab data={data} setSelectedJob={setSelectedJob} setJobModalType={setJobModalType} handleAction={handleAction} />}
          {activeTab === 'completed' && <CompletedJobsTab data={data} setSelectedJob={setSelectedJob} statusColors={statusColors} setJobModalType={setJobModalType} handleAction={handleAction} />}
          {activeTab === 'alerts' && <AlertsTab data={data} handleAction={handleAction} />} 
          {activeTab === 'team' && <TeamTab data={data} setShowAddStaff={setShowAddStaff} setShowJobModal={setShowAddJob} setSelectedStaff={setSelectedStaff} setEditStaffForm={setEditStaffForm} setIsEditingStaff={setIsEditingStaff} setActiveChatId={setActiveChatId} setIsChatOpen={setIsChatOpen} setSelectedJob={setSelectedJob} setJobModalType={setJobModalType} handleAction={handleAction} />}
          {activeTab === 'customers' && <CustomersTab data={data} setShowAddCustomer={setShowAddCustomer} setSelectedCustomer={setSelectedCustomer} handleAction={handleAction} />}
          {activeTab === 'support' && <SupportTab handleAction={handleAction} isSaving={isSaving} />} 
          {activeTab === 'periodic' && <PeriodicTab data={data} handleAction={handleAction} statusColors={statusColors} setSelectedAsset={setSelectedAsset} handleGenerateMonthlyMaintenance={handleGenerateMonthlyMaintenance} isGenerating={isGeneratingMaintenance} />}
          
          {activeTab === 'stock' && (
            <div className="flex flex-col space-y-4">
              <div className="flex justify-end w-full">
                <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex items-center gap-2">
                  <Filter size={16} className="text-slate-400 ml-2" />
                  <select value={stockCategory} onChange={(e) => setStockCategory(e.target.value)} className="text-sm font-bold text-slate-700 outline-none cursor-pointer bg-transparent">
                    <option value="Tümü">Tüm Kategoriler</option>
                    {Array.from(new Set((data?.stock || []).map((s) => s?.category).filter(Boolean))).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <StockTab 
                data={filteredDataForTabs} 
                handleAction={handleAction} 
                setShowStockModal={setShowStockModal} 
                setShowSupplierModal={setShowSupplierModal} 
                setShowSupplierListModal={setShowSupplierModal} 
                setShowCategoryModal={setShowCategoryModal}
                setShowOrderModal={setShowOrderModal}
                setShowBulkOrderModal={setShowBulkOrderModal}
                stockCategory={stockCategory}
                setStockCategory={setStockCategory}
                setShowStockEntryModal={setShowStockEntryModal}
              />
            </div>
          )}
          
          {activeTab === 'assets' && <AssetsTab data={data} setShowAddAsset={setShowAddAsset} setSelectedAsset={setSelectedAsset} setShowQRModal={setShowQRModal} setSelectedQRAsset={setSelectedQRAsset} setShowSmartExcelModal={setShowSmartExcelModal} />}
          
          {activeTab === 'finance' && <FinanceTab data={data} userRole="Yönetici" />}

        </div>
      </main>

      <ChatPanel isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} activeChatId={activeChatId} setActiveChatId={setActiveChatId} data={data} messages={messages} setMessages={setMessages} messageInput={messageInput} setMessageInput={setMessageInput} sendMessage={sendMessage} />

      {data && <DynamicPWA companyName={data?.name} companyLogo={data?.logo} />}

      {/* MERKEZİ MODAL YÖNETİCİSİ */}
      <DashboardModals 
        data={data}
        refreshData={() => fetchData(true)}
        handleAction={handleAction}
        isSaving={isSaving}
        handleCloseDetail={handleCloseDetail}

        selectedJob={selectedJob} setSelectedJob={setSelectedJob}
        
        showAddJob={showAddJob} setShowAddJob={setShowAddJob} 
        showJobModal={showAddJob} setShowJobModal={setShowAddJob}
        
        jobModalStep={jobModalStep} setJobModalStep={setJobModalStep}
        jobForm={jobForm} setJobForm={setJobForm}
        
        selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}
        selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset}
        selectedStaff={selectedStaff} setSelectedStaff={setSelectedStaff}
        
        showAddStaff={showAddStaff} setShowAddStaff={setShowAddStaff}
        newStaff={newStaff} setNewStaff={setNewStaff}
        
        showAddCustomer={showAddCustomer} setShowAddCustomer={setShowAddCustomer}
        newCustomer={newCustomer} setNewCustomer={setNewCustomer}

        showAddAsset={showAddAsset} setShowAddAsset={setShowAddAsset}
        newAsset={newAsset} setNewAsset={setNewAsset}

        showStockModal={showStockModal} setShowStockModal={setShowStockModal}
        showStockEntryModal={showStockEntryModal} setShowStockEntryModal={setShowStockEntryModal}
        newStock={newStock} setNewStock={setNewStock}

        showSupplierModal={showSupplierModal} setShowSupplierModal={setShowSupplierModal}
        showSupplierListModal={showSupplierModal} setShowSupplierListModal={setShowSupplierModal} 
        showAddSupplier={showAddSupplier} setShowAddSupplier={setShowAddSupplier}
        newSupplier={newSupplier} setNewSupplier={setNewSupplier}

        showCategoryModal={showCategoryModal} setShowCategoryModal={setShowCategoryModal}
        newCategory={newCategory} setNewCategory={setNewCategory}

        showOrderModal={showOrderModal} setShowOrderModal={setShowOrderModal}
        showBulkOrderModal={showBulkOrderModal} setShowBulkOrderModal={setShowBulkOrderModal}
        newOrder={newOrder} setNewOrder={setNewOrder}
        bulkOrderList={bulkOrderList} setBulkOrderList={setBulkOrderList}

        isEditingStaff={isEditingStaff} setIsEditingStaff={setIsEditingStaff}
        editStaffForm={editStaffForm} setEditStaffForm={setEditStaffForm}

        previewPdfJob={previewPdfJob} setPreviewPdfJob={setPreviewPdfJob}
        fullScreenImage={fullScreenImage} setFullScreenImage={setFullScreenImage}
        isEditingJobDetail={isEditingJobDetail} setIsEditingJobDetail={setIsEditingJobDetail}
        showCancelConfirm={showCancelConfirm} setShowCancelConfirm={setShowCancelConfirm}
        editJobDetailForm={editJobDetailForm} setEditJobDetailForm={setEditJobDetailForm}
        jobTargetMode={jobTargetMode} setJobTargetMode={setJobTargetMode}
        jobPrice={jobPrice} setJobPrice={setJobPrice}
        isApproving={isApproving} setIsApproving={setIsApproving}
        jobModalType={jobModalType} setJobModalType={setJobModalType}

        showQRModal={showQRModal} setShowQRModal={setShowQRModal}
        selectedQRAsset={selectedQRAsset} setSelectedQRAsset={setSelectedQRAsset}
        
        // 🚀 Akıllı Excel Props Aktarımı
        showSmartExcelModal={showSmartExcelModal} setShowSmartExcelModal={setShowSmartExcelModal}

        // 🚀 EKLENDİ: Propsların Modallara geçirilmesi
        showThermalPrintModal={showThermalPrintModal} setShowThermalPrintModal={setShowThermalPrintModal}
        selectedThermalJob={selectedThermalJob} setSelectedThermalJob={setSelectedThermalJob}

        searchCust={searchCust} setSearchCust={setSearchCust}
        searchAsset={searchAsset} setSearchAsset={setSearchAsset}
        userRole="Yönetici"
      />
      
      <AssetQRModal 
  isOpen={showQRModal}
  onClose={() => setShowQRModal(false)} 
  asset={selectedQRAsset} 
  companyName={data?.name} 
  companyLogo={data?.logo} 
  
  /* İletişim bilgilerini aktaran yeni satırlar */
  landlinePhone={data?.landlinePhone}
  whatsappPhone={data?.whatsappPhone}
  companyWebsite={data?.website}
/>

    </div>
  );
}