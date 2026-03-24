"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Users, Activity, BarChart3, LogOut, TicketCheck, Gift, AlertCircle, CheckCircle, Database, Plus, ShoppingCart, X, TrendingUp, TrendingDown, Clock, Download, Share, Check } from "lucide-react";
import toast from "react-hot-toast";
import DynamicPWA from "@/components/DynamicPWA";

export default function MasterbossDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

// 🚀 PWA KURULUM STATE'LERİ
const [deferredPrompt, setDeferredPrompt] = useState(null);
const [showPwaPrompt, setShowPwaPrompt] = useState(false);
const [isIos, setIsIos] = useState(false);
const [installState, setInstallState] = useState('idle');

useEffect(() => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) return;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
  setIsIos(isIOSDevice);

  if (isIOSDevice) {
    setTimeout(() => setShowPwaPrompt(true), 2000);
  } else {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPwaPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Global olarak yakalanmış PWA kurulum tetikleyicisi varsa al
    if (window.pwaDeferredPrompt) {
      handler(window.pwaDeferredPrompt);
      window.pwaDeferredPrompt = null;
    }

    window.addEventListener('appinstalled', () => {
      setInstallState('success');
      setTimeout(() => setShowPwaPrompt(false), 3000);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }
}, []);

const handleInstallPwa = async () => {
  if (isIos) {
    toast('Yüklemek için "Paylaş" ikonuna basıp "Ana Ekrana Ekle"yi seçin.', {
      icon: '📲',
      duration: 5000,
      style: { background: '#171717', color: '#fff', border: '1px solid #e11d48' }
    });
    return;
  }
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
  const [activeTab, setActiveTab] = useState("companies");
  const [replyTexts, setReplyTexts] = useState({});

  // Subscription Control States
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [manageForm, setManageForm] = useState({ subscriptionStatus: '', freeMonths: '', customDiscount: '', customAssetPrice: '', cancelTrial: false, hasMasterbossGift: false });
  const [globalPricingForm, setGlobalPricingForm] = useState({ base: "", asset: "" });
  const [isSaving, setIsSaving] = useState(false);

  // 🚀 YENİ: Başarı Modalı State'i
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // 🚀 YENİ: Bilgi Modalı Stateleri
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoCompany, setInfoCompany] = useState(null);
  const [infoTab, setInfoTab] = useState("genel");
  const [infoDetails, setInfoDetails] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);

  // 🚀 YENİ: Ticket Modalı State'i
  const [selectedTicket, setSelectedTicket] = useState(null);

  // 🚀 YENİ: Firma Filtreleme State'i
  const [companyFilter, setCompanyFilter] = useState("all");

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("masterbossToken");
      if (!token) {
        router.replace("/masterboss");
        return;
      }

      try {
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
        const res = await fetch(`${BASE_URL}/masterboss-data`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.status === 403 || res.status === 401) {
          localStorage.removeItem("masterbossToken");
          router.replace("/masterboss");
          return;
        }

        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          toast.error(json.error || "Veri yüklenemedi!");
        }
      } catch (error) {
        toast.error("Bağlantı hatası!");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("masterbossToken");
    router.replace("/masterboss");
  };

  const { companies = [], tickets = [], referrals = [], rewards = [], stats = {}, globalPricing } = data || {};

  // Veri yüklendiğinde globalPricing state'ini senkronize et
  useEffect(() => {
      if (globalPricing) setGlobalPricingForm({ base: globalPricing.base, asset: globalPricing.asset });
  }, [globalPricing]);

  const handleUpdateSubscription = async () => {
    const token = localStorage.getItem("masterbossToken");
    if (!token) return toast.error("Yetkisiz işlem!");

    setIsSaving(true);
    const toastId = toast.loading("Güncelleniyor...");
    
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
      
      const payload = {
        companySlug: selectedCompany.slug,
        subscriptionStatus: manageForm.subscriptionStatus,
        freeMonths: manageForm.freeMonths === '' ? 0 : parseInt(manageForm.freeMonths, 10),
        customDiscount: manageForm.customDiscount === '' ? null : parseInt(manageForm.customDiscount, 10),
        customAssetPrice: manageForm.customAssetPrice === '' ? null : parseInt(manageForm.customAssetPrice, 10),
        cancelTrial: manageForm.cancelTrial,
        hasMasterbossGift: manageForm.hasMasterbossGift
      };

      const res = await fetch(`${BASE_URL}/masterboss-update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success("Firma aboneliği güncellendi!", { id: toastId });
        setShowManageModal(false);
        setSuccessMessage("Firma aboneliği başarıyla güncellendi.");
        setShowSuccessModal(true);
        
        // Veriyi yenile
        const resData = await fetch(`${BASE_URL}/masterboss-data`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const jsonData = await resData.json();
        if(jsonData.success) setData(jsonData);
      } else {
        console.error("Masterboss Update Sub Error:", result.error);
        toast.error(result.error || "Hata oluştu!", { id: toastId });
      }
    } catch (err) {
      console.error("Masterboss Update Sub Catch Error:", err);
      toast.error("Bağlantı hatası", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGlobalPricing = async () => {
    const token = localStorage.getItem("masterbossToken");
    if (!token) return toast.error("Yetkisiz işlem!");

    setIsSaving(true);
    const toastId = toast.loading("Sistem genel fiyatları güncelleniyor...");
    
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
      const res = await fetch(`${BASE_URL}/masterboss-update-global-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ basePrice: globalPricingForm.base, assetPrice: globalPricingForm.asset })
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success("Fiyatlar güncellendi!", { id: toastId });
        
        // 🚀 BİLDİRİM MODALINI TETİKLİYORUZ
        setSuccessMessage("Sistem genel fiyatları başarıyla güncellendi. Özel fiyat tanımlanmayan tüm firmalara yeni tarife uygulanacaktır.");
        setShowSuccessModal(true);

        // Veriyi yenile
        const resData = await fetch(`${BASE_URL}/masterboss-data`, { headers: { "Authorization": `Bearer ${token}` } });
        const jsonData = await resData.json();
        if(jsonData.success) setData(jsonData);
      } else {
        toast.error(result.error || "Hata oluştu!", { id: toastId });
      }
    } catch (err) {
      toast.error("Bağlantı hatası", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // 🚀 YENİ: Esc ve Mobil Geri Tuşu (PopState) ile Modalları Kapatma
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedTicket(null);
        setShowInfoModal(false);
        setShowManageModal(false);
        setShowSuccessModal(false);
      }
    };

    const handlePopState = () => {
      if (selectedTicket) setSelectedTicket(null);
      if (showInfoModal) setShowInfoModal(false);
      if (showManageModal) setShowManageModal(false);
      if (showSuccessModal) setShowSuccessModal(false);
    };

    if (selectedTicket || showInfoModal || showManageModal || showSuccessModal) {
      window.history.pushState({ modal: "open" }, "");
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    }
  }, [selectedTicket, showInfoModal, showManageModal, showSuccessModal]);

  const handleTicketAction = async (ticket, actionType) => {
    const token = localStorage.getItem("masterbossToken");
    if (!token) return toast.error("Yetkisiz işlem!");

    const replyMessage = replyTexts[ticket.id] || "";
    if (actionType === 'reply' && !replyMessage.trim()) return toast.error("Yanıt göndermek için bir mesaj yazmalısınız.");

    const toastId = toast.loading("İşleniyor...");
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
      const res = await fetch(`${BASE_URL}/masterboss-resolve-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId: ticket.id, companySlug: ticket.company_slug, replyMessage, action: actionType })
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success(actionType === 'resolve' ? "Talep çözüldü!" : "Yanıt gönderildi!", { id: toastId });
        
        const updatedStatus = actionType === 'resolve' ? 'Çözüldü' : ticket.status;
        const newReplies = result.updatedReplies || ticket.replies;

        setData(prev => ({
          ...prev,
          tickets: prev.tickets.map(t => 
             t.id === ticket.id 
               ? { ...t, status: updatedStatus, replies: newReplies } 
               : t
          )
        }));

        if (selectedTicket && selectedTicket.id === ticket.id) {
             setSelectedTicket(prev => ({ ...prev, status: updatedStatus, replies: newReplies }));
        }

        setReplyTexts(prev => ({ ...prev, [ticket.id]: "" }));
      } else {
        toast.error(result.error || "Hata oluştu!", { id: toastId });
      }
    } catch (err) {
      toast.error("Bağlantı hatası", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  const totalAssets = companies.reduce((acc, c) => acc + (c.total_assets || 0), 0);
  const totalStaff = companies.reduce((acc, c) => acc + (c.total_staff || 0), 0);
  const activeCompanies = companies.filter(c => c.subscription_status === 'active').length;

  const totalMonthlyRevenue = stats.monthlyRevenue || 0;
  const totalYearlyRevenue = stats.yearlyRevenue || 0;

  const monthlyExpectedCost = (
     (stats.monthlyJobs || 0) * 3 * 0.0003 + 
     (stats.monthlyJobs || 0) * 12 * 0.00005 + 
     (stats.monthlyPhotos || 0) * 15 * 0.0001 + 
     (stats.totalPhotos || 0) * 2.5 * 0.001 + 
     (stats.monthlyJobs || 0) * 15 * 0.00001 
  );

  const yearlyExpectedCost = (
     (stats.yearlyJobs || 0) * 3 * 0.0003 + 
     (stats.yearlyJobs || 0) * 12 * 0.00005 + 
     (stats.yearlyPhotos || 0) * 15 * 0.0001 + 
     (stats.totalPhotos || 0) * 2.5 * 0.001 + 
     (stats.yearlyJobs || 0) * 15 * 0.00001 
  );

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0,0,0,0);
  
  const lastMonthStart = new Date(currentMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  
  const currentMonthNewCompanies = companies.filter(c => new Date(c.created_at) >= currentMonthStart).length;
  const lastMonthNewCompanies = companies.filter(c => {
      const d = new Date(c.created_at);
      return d >= lastMonthStart && d < currentMonthStart;
  }).length;

  const canceledCompanies = companies.filter(c => c.subscription_status === 'canceled').length;
  const pastDueCompanies = companies.filter(c => c.subscription_status === 'past_due').length;
  const trialingCompanies = companies.filter(c => c.subscription_status === 'trialing').length;

  const activeRatio = companies.length > 0 ? (activeCompanies / companies.length) * 100 : 0;
  
  let healthStatus = "Nötr";
  let healthColor = "text-blue-400";
  let healthBg = "bg-blue-500/10 border-blue-500/20";
  let healthIcon = <Activity size={24} className="text-blue-500" />;
  let healthMessage = "Sistem dengede ilerliyor.";

  if (activeRatio > 70 && currentMonthNewCompanies > 0) {
      healthStatus = "Büyüme Eğiliminde";
      healthColor = "text-emerald-400";
      healthBg = "bg-emerald-500/10 border-emerald-500/20";
      healthIcon = <TrendingUp size={24} className="text-emerald-500" />;
      healthMessage = "Harika! Aktif müşteri oranınız yüksek ve sistem yeni kullanıcı kazanıyor.";
  } else if (canceledCompanies + pastDueCompanies > activeCompanies) {
      healthStatus = "Riskli Durum (Kayıp Yüksek)";
      healthColor = "text-rose-400";
      healthBg = "bg-rose-500/10 border-rose-500/20";
      healthIcon = <TrendingDown size={24} className="text-rose-500" />;
      healthMessage = "Dikkat! İptal edilen veya ödemesi geciken hesap sayısı, aktif hesaplardan daha fazla. Müşteri memnuniyetini artırmalısınız.";
  } else if (trialingCompanies > activeCompanies) {
      healthStatus = "Potansiyel Büyüme (Dönüşüm Bekleniyor)";
      healthColor = "text-amber-400";
      healthBg = "bg-amber-500/10 border-amber-500/20";
      healthIcon = <Clock size={24} className="text-amber-500" />;
      healthMessage = "Sistemde çok sayıda deneme sürümünde olan kullanıcı var. Bunları ödeyen müşteriye dönüştürmek için iletişime geçin.";
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500/30 relative">
      <DynamicPWA companyName="FixLog.co" companyLogo="/icons/icon-512x512.png" />
      {/* 🚀 PWA YÜKLEME BALONU EKLENDİ */}
      <AnimatePresence>
        {showPwaPrompt && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} 
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-neutral-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl z-[9999] flex flex-row items-center justify-between border border-neutral-700"
          >
            {installState === 'success' ? (
              <div className="flex items-center gap-3 w-full justify-center py-1">
                <div className="bg-emerald-500 p-2 rounded-full shrink-0"><Check size={20} className="text-white" /></div>
                <div className="flex flex-col flex-1 min-w-0 pr-2"><span className="font-bold text-sm text-emerald-400">Kurulum Başarılı!</span><span className="text-xs text-neutral-400 mt-0.5">Cihazınızın ana ekranından giriş yapabilirsiniz.</span></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-rose-600 p-2.5 rounded-xl shrink-0"><Download size={20} className="text-white" /></div>
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className="font-bold text-sm">Masterboss Panelini Yükle</span>
                    {isIos ? (<span className="text-[11px] text-neutral-400 mt-0.5 leading-tight">Yüklemek için <Share size={12} className="inline-block mx-0.5 mb-0.5" /> <b>Paylaş</b> ikonuna basıp <br/> <b>Ana Ekrana Ekle</b>'yi seçin.</span>) : (<span className="text-xs text-neutral-400 mt-0.5">Panele hızlıca erişmek için yükleyin.</span>)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  {!isIos && (<button onClick={handleInstallPwa} className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">Yükle</button>)}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Masterboss</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {showPwaPrompt && installState !== 'success' && (
              <button 
                onClick={handleInstallPwa}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all text-xs sm:text-sm font-bold border border-rose-500/20 active:scale-95"
              >
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Uygulamayı Yükle</span>
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all text-xs sm:text-sm font-medium border border-neutral-700/50 active:scale-95"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        
        {/* Metric Cards - MOBİLDE 2'Lİ GRID OLARAK GÜNCELLENDİ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <MetricCard icon={Building2} label="Toplam Firma" value={companies.length} ext={`${activeCompanies} Aktif Üye`} color="from-blue-500 to-indigo-600" />
          <MetricCard icon={BarChart3} label="Toplam QR (Varlık)" value={totalAssets} ext="Sistemdeki Tüm Cihazlar" color="from-indigo-500 to-purple-600" />
          <MetricCard icon={Users} label="Sistem Personeli" value={totalStaff} ext="Kayıtlı Saha Çalışanı" color="from-emerald-500 to-teal-600" />
          <MetricCard icon={Gift} label="Referans Havuzu" value={referrals.filter(r=>r.is_verified===1).length} ext="Başarılı Davet Sayısı" color="from-amber-500 to-orange-600" />
          
          <MetricCard icon={Activity} label="Aylık İşlem Hacmi" value={stats.monthlyJobs || 0} ext={`Yıllık: ${stats.yearlyJobs || 0} İşlem`} color="from-blue-500 to-cyan-600" />
          <MetricCard icon={BarChart3} label="Aylık Foto Yükü" value={stats.monthlyPhotos || 0} ext={`Yıllık: ${stats.yearlyPhotos || 0} Foto`} color="from-fuchsia-500 to-pink-600" />
          <MetricCard icon={Activity} label="Aylık Net Kazanç" value={`₺${totalMonthlyRevenue.toLocaleString('tr-TR')}`} ext={`Yıllık: ₺${totalYearlyRevenue.toLocaleString('tr-TR')}`} color="from-emerald-500 to-teal-600" />
          <MetricCard icon={AlertCircle} label="Aylık Gerçek Maliyet" value={`₺${monthlyExpectedCost.toFixed(2).toLocaleString('tr-TR')}`} ext={`Yıllık Toplam: ₺${yearlyExpectedCost.toFixed(2).toLocaleString('tr-TR')}`} color="from-rose-500 to-red-600" />
        </div>

        {/* Tabs - YATAY SCROLL İPTAL EDİLDİ, FLEX-WRAP EKLENDİ */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <TabButton active={activeTab === "companies"} onClick={() => setActiveTab("companies")} icon={Building2} label="Firmalar & Abonelikler" />
          <TabButton active={activeTab === "tickets"} onClick={() => setActiveTab("tickets")} icon={TicketCheck} label={`Destek Talepleri (${tickets.filter(t=>t.status !== 'Resolved').length})`} />
          <TabButton active={activeTab === "referrals"} onClick={() => setActiveTab("referrals")} icon={Gift} label="Hediye Havuzları" />
        </div>

        {/* Content Area */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-2xl sm:rounded-3xl overflow-hidden"
        >
          {activeTab === "companies" && (
            <div className="p-4 sm:p-6">

              {/* PERFORMANS ÖZETİ */}
              <div className={`border rounded-2xl p-4 sm:p-5 mb-6 flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 justify-between ${healthBg}`}>
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-black/20 rounded-full flex items-center justify-center shrink-0">
                          {healthIcon}
                      </div>
                      <div>
                          <h4 className={`text-base sm:text-lg font-black tracking-tight mb-0.5 sm:mb-1 ${healthColor}`}>
                              {healthStatus}
                          </h4>
                          <p className="text-[11px] sm:text-xs text-neutral-400 max-w-xl leading-tight">
                              {healthMessage}
                          </p>
                      </div>
                  </div>
                  {/* Mobilde 3'lü Grid olarak düzgün sığması için güncellendi */}
                  <div className="grid grid-cols-3 gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                      <div className="bg-black/20 border border-black/20 rounded-xl p-2 sm:p-3 text-center">
                          <div className="text-[9px] sm:text-xs text-neutral-500 font-bold mb-1 uppercase tracking-wider truncate">Aktif Oranı</div>
                          <div className="text-sm sm:text-xl font-black text-white">%{activeRatio.toFixed(1)}</div>
                      </div>
                      <div className="bg-black/20 border border-black/20 rounded-xl p-2 sm:p-3 text-center">
                          <div className="text-[9px] sm:text-xs text-neutral-500 font-bold mb-1 uppercase tracking-wider truncate">Bu Ay Yeni</div>
                          <div className="text-sm sm:text-xl font-black text-white flex items-center justify-center gap-1">
                              {currentMonthNewCompanies} 
                              {currentMonthNewCompanies > lastMonthNewCompanies ? <TrendingUp size={12} className="text-emerald-400" /> : currentMonthNewCompanies < lastMonthNewCompanies ? <TrendingDown size={12} className="text-rose-400" /> : null}
                          </div>
                      </div>
                      <div className="bg-black/20 border border-black/20 rounded-xl p-2 sm:p-3 text-center">
                          <div className="text-[9px] sm:text-xs text-neutral-500 font-bold mb-1 uppercase tracking-wider truncate">İptal/Borçlu</div>
                          <div className="text-sm sm:text-xl font-black text-rose-400">{canceledCompanies + pastDueCompanies}</div>
                      </div>
                  </div>
              </div>
              
              {/* Sistem Genel Fiyatlandırması */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                  <div className="w-full md:w-auto">
                      <h4 className="text-sm sm:text-base text-white font-bold flex items-center gap-2 mb-1"><Database size={16} className="text-blue-500" /> Sistem Genel Fiyatlandırması (Oto-Zam)</h4>
                      <p className="text-[11px] sm:text-xs text-neutral-500 leading-tight">Özel fiyat tanımlanmayan tüm firmalara otomatik uygulanacak sabit paket ve varlık başı fiyatı buradan değiştirebilirsiniz.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full md:w-auto">
                      <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[10px] sm:text-xs font-bold">Sabit:</span>
                            <input 
                                type="number" 
                                value={globalPricingForm.base} 
                                onChange={(e) => setGlobalPricingForm({...globalPricingForm, base: Number(e.target.value)})}
                                className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-lg py-2 pl-12 pr-2 outline-none focus:border-blue-500 text-xs sm:text-sm font-bold"
                            />
                        </div>
                        <div className="relative w-full sm:w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[10px] sm:text-xs font-bold">Varlık:</span>
                            <input 
                                type="number" 
                                value={globalPricingForm.asset} 
                                onChange={(e) => setGlobalPricingForm({...globalPricingForm, asset: Number(e.target.value)})}
                                className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-lg py-2 pl-14 pr-2 outline-none focus:border-blue-500 text-xs sm:text-sm font-bold"
                            />
                        </div>
                      </div>
                      <button 
                          onClick={handleUpdateGlobalPricing} 
                          disabled={isSaving}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap transition-colors"
                      >
                          Kaydet (Zam Yap)
                      </button>
                  </div>
              </div>

              {/* Firma Filtreleme Sekmeleri - YATAY SCROLL İPTAL, FLEX-WRAP YAPILDI */}
              <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6 border-b border-neutral-800 pb-4">
                 <button onClick={() => setCompanyFilter("all")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${companyFilter === "all" ? "bg-white text-black" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}>Tümü ({companies.length})</button>
                 <button onClick={() => setCompanyFilter("active")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${companyFilter === "active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}>Aktif ({companies.filter(c => c.subscription_status === 'active' && c.has_masterboss_gift !== 1).length})</button>
                 <button onClick={() => setCompanyFilter("trialing")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${companyFilter === "trialing" ? "bg-blue-500/20 text-blue-400 border border-blue-500/50" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}>Deneme ({companies.filter(c => c.subscription_status === 'trialing' && c.has_masterboss_gift !== 1).length})</button>
                 <button onClick={() => setCompanyFilter("past_due")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${companyFilter === "past_due" ? "bg-rose-500/20 text-rose-400 border border-rose-500/50" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}>Gecikmede ({companies.filter(c => (c.subscription_status === 'past_due' || c.subscription_status === 'canceled') && c.has_masterboss_gift !== 1).length})</button>
                 <button onClick={() => setCompanyFilter("exempt")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${companyFilter === "exempt" ? "bg-amber-500/20 text-amber-400 border border-amber-500/50" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}>Muaf (VIP) ({companies.filter(c => c.has_masterboss_gift === 1).length})</button>
              </div>

              {/* Tablo İçeriği (Yatay kaydırma sadece tabloda gerekli) */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="min-w-full text-left text-xs sm:text-sm whitespace-nowrap">
                    <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
                      <tr>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Firma Kodu (Slug)</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Firma Adı / Sahibi</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Abonelik Türü</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Bitiş/Kesim</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Kurulum</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-right">Eylemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                      {companies.filter(c => {
                          if (companyFilter === "active") return c.subscription_status === 'active' && c.has_masterboss_gift !== 1;
                          if (companyFilter === "trialing") return c.subscription_status === 'trialing' && c.has_masterboss_gift !== 1;
                          if (companyFilter === "past_due") return (c.subscription_status === 'past_due' || c.subscription_status === 'canceled') && c.has_masterboss_gift !== 1;
                          if (companyFilter === "exempt") return c.has_masterboss_gift === 1;
                          return true;
                      }).map((c) => (
                        <tr key={c.slug} className="hover:bg-neutral-800/20 transition-colors">
                          <td className="px-4 py-3 sm:px-6 sm:py-4 font-mono text-neutral-300">
                            {c.slug}
                            <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1">Ref: {c.referral_code}</div>
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4">
                            <div className="font-medium text-white flex items-center gap-1 sm:gap-2">
                                {c.company_name}
                                {(c.custom_base_price !== null || c.custom_per_asset_price !== null) && (
                                    <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1 py-0.5 sm:px-1.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-widest" title="Bu firma genel zamlardan etkilenmez">ÖZEL FİYAT</span>
                                )}
                            </div>
                            <div className="text-[11px] sm:text-sm text-neutral-500">{c.owner_name}</div>
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${
                              c.has_masterboss_gift === 1 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              c.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                              c.subscription_status === 'trialing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {c.has_masterboss_gift === 1 ? 'MUAF (HEDİYE)' : c.subscription_status?.toUpperCase() || 'BİLİNMİYOR'}
                            </span>
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4 text-neutral-400 text-[11px] sm:text-sm">
                            {c.subscription_status === 'trialing' ? (
                              c.trial_ends_at ? new Date(c.trial_ends_at).toLocaleDateString("tr-TR") : '-'
                            ) : (
                              c.billing_cycle_anchor ? new Date(c.billing_cycle_anchor).toLocaleDateString("tr-TR") : '-'
                            )}
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4 text-neutral-400 text-[11px] sm:text-sm">
                            <div>Varlık: <span className="text-white">{c.total_assets}</span></div>
                            <div>Personel: <span className="text-white">{c.total_staff}</span></div>
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                            <button 
                              onClick={async () => { 
                                setInfoCompany(c); 
                                setInfoTab("genel");
                                setInfoDetails(null);
                                setShowInfoModal(true); 
                                
                                setInfoLoading(true);
                                try {
                                  const token = localStorage.getItem("masterbossToken");
                                  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
                                  const res = await fetch(`${BASE_URL}/masterboss-company-details?slug=${c.slug}`, {
                                    headers: { "Authorization": `Bearer ${token}` }
                                  });
                                  const json = await res.json();
                                  if(json.success) setInfoDetails(json.stats);
                                } catch(e) {
                                  toast.error("Detaylar alınamadı");
                                } finally {
                                  setInfoLoading(false);
                                }
                              }}
                              className="text-blue-500 hover:text-blue-400 text-xs sm:text-sm font-medium transition-colors mr-3 sm:mr-4"
                            >
                              Bilgi
                            </button>
                            
                            <button
                              onClick={() => { 
                                setSelectedCompany(c); 
                                setManageForm({ 
                                  subscriptionStatus: c.subscription_status || 'trialing', 
                                  freeMonths: c.free_months_balance !== undefined && c.free_months_balance !== null ? c.free_months_balance : '', 
                                  customDiscount: c.custom_base_price !== undefined && c.custom_base_price !== null ? c.custom_base_price : '', 
                                  customAssetPrice: c.custom_per_asset_price !== undefined && c.custom_per_asset_price !== null ? c.custom_per_asset_price : '',
                                  cancelTrial: false,
                                  hasMasterbossGift: c.has_masterboss_gift === 1
                                }); 
                                setShowManageModal(true); 
                              }} 
                              className="text-rose-500 hover:text-rose-400 text-xs sm:text-sm font-medium transition-colors"
                            >
                              Yönet
                            </button>
                          </td>
                        </tr>
                      ))}
                      {companies.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">Henüz kayıtlı firma yok.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tickets" && (
            <div className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {tickets.map(t => (
                  <div key={t.id} className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors">
                    <div className="flex gap-3 sm:gap-4 items-start sm:items-center flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                            <div className="font-medium text-white truncate max-w-full text-sm sm:text-base">
                              {t.company_name || t.company_slug} 
                              <span className="text-neutral-400 text-[10px] sm:text-xs ml-1 sm:ml-2">- {t.sender_name || 'Bilinmiyor'}</span>
                            </div>
                            <span className={`shrink-0 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${t.status === 'Çözüldü' || t.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {t.status === 'Çözüldü' || t.status === 'Resolved' ? 'Çözüldü' : 'Açık'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-neutral-400 truncate">{t.message}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedTicket(t)}
                        className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white text-xs sm:text-sm font-medium px-4 py-2 sm:py-2.5 rounded-xl transition-colors shrink-0"
                    >
                        Bileti İncele
                    </button>
                  </div>
                ))}
                {tickets.length === 0 && <div className="text-center py-12 text-neutral-500">Destek talebi bulunmuyor.</div>}
              </div>
            </div>
          )}

          {activeTab === "referrals" && (
            <div className="overflow-x-auto">
              <div className="p-4 bg-neutral-800/20 border-b border-neutral-800 text-xs sm:text-sm font-medium text-neutral-300">
                <span className="text-rose-400 font-bold">{referrals.filter(r=>r.is_verified).length}</span> Onaylı Davet &nbsp;&nbsp;|&nbsp;&nbsp;
                <span className="text-emerald-400 font-bold">{referrals.filter(r=>!r.is_verified).length}</span> Bekleyen Davet
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="min-w-full text-left text-xs sm:text-sm whitespace-nowrap">
                    <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
                      <tr>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Davet Eden (Referans)</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Kayıt Olan (Yeni Firma)</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Durum</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Davet Edendeki Kredi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                      {referrals.map((r) => {
                        const referrerCompany = companies.find(c => c.slug === r.referrer_company_slug);
                        return (
                          <tr key={r.id} className="hover:bg-neutral-800/20 transition-colors">
                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                              <div className="font-mono font-medium text-amber-400">{r.referrer_company_slug}</div>
                            </td>
                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                              <div className="font-mono font-medium text-blue-400">{r.referred_company_slug}</div>
                            </td>
                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                              {r.is_verified ? (
                                <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border border-emerald-500/20">
                                  <TicketCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> İlk Ödeme Alındı
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-amber-500/10 text-amber-400 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border border-amber-500/20">
                                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Ödeme Bekliyor
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                              {referrerCompany && referrerCompany.free_months_balance > 0 ? (
                                 <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-rose-500/10 text-rose-400 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-rose-500/20 font-bold text-[11px] sm:text-sm">
                                   <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {referrerCompany.free_months_balance} Ay
                                 </div>
                              ) : (
                                 <div className="text-neutral-500">-</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {referrals.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">Henüz referans ilişkisi kurulmamış.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>

      </div>

      {/* 🚀 MOBİL UYUM GÜNCELLEMESİ: Subscription Manage Modalı */}
      <AnimatePresence>
      {showManageModal && selectedCompany && (
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-black/80 backdrop-blur-sm sm:p-4 text-left overscroll-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-neutral-900 border border-neutral-800 rounded-none sm:rounded-3xl w-full h-full sm:h-auto sm:w-[95%] sm:max-w-lg shadow-2xl relative flex flex-col overflow-hidden"
          >
            <div className="shrink-0 p-4 md:p-6 border-b border-neutral-800 relative bg-neutral-900">
              <button 
                onClick={() => setShowManageModal(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors text-sm font-medium z-10"
              >
                Kapat
              </button>
              <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2 tracking-tight pr-12">Firma Abonelik Yönetimi</h3>
              <div className="text-xs md:text-sm font-mono text-rose-400">{selectedCompany.slug} <span className="text-neutral-500 text-[10px] md:text-xs ml-1 md:ml-2">({selectedCompany.company_name})</span></div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 md:p-6 space-y-4 overscroll-contain">
              {/* VIP Muafiyet Alanı (Checkbox ile Ayrıldı) */}
              <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3 md:p-4 rounded-xl mt-2 md:mt-4">
                <input 
                  type="checkbox" 
                  id="vipStatus"
                  checked={manageForm.hasMasterbossGift} 
                  onChange={(e) => setManageForm({...manageForm, hasMasterbossGift: e.target.checked})}
                  className="w-5 h-5 rounded border-emerald-500 text-emerald-500 focus:ring-emerald-500/20 bg-neutral-800 mt-0.5 cursor-pointer shrink-0"
                />
                <label htmlFor="vipStatus" className="text-sm text-emerald-300 font-medium cursor-pointer leading-tight">
                  VIP Muafiyet Tanımla <br/>
                  <span className="text-xs text-emerald-500/80 font-normal">Bu firma sistemden tamamen ücretsiz yararlanır ve fatura kesilmez.</span>
                </label>
              </div>

              {/* Gerçek Abonelik Durumu */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Abonelik Durumu</label>
                <select 
                  value={manageForm.subscriptionStatus} 
                  onChange={(e) => setManageForm({...manageForm, subscriptionStatus: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl py-3 px-4 outline-none focus:border-rose-500 transition-colors appearance-none text-sm md:text-base"
                >
                  <option value="active">Aktif (Ödeyen / Kısıtlama Yok)</option>
                  <option value="trialing">Deneme Sürümü (Trial)</option>
                  <option value="past_due">Paywall'a Düşür (Ödeme Gecikti)</option>
                  <option value="canceled">İptal Edildi</option>
                </select>
              </div>

              {/* Her Zaman Görünür Hediye Ay Alanı */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Tanımlı Hediye Ay Bakiye (Adet)</label>
                <input 
                  type="number" 
                  placeholder="Firmaya kaç ay hediye edeceksiniz? Örn: 1"
                  value={manageForm.freeMonths} 
                  onChange={(e) => setManageForm({...manageForm, freeMonths: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-colors placeholder-neutral-600 text-sm md:text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-800 pt-4">
                <div className="col-span-1 md:col-span-2"><label className="block text-xs font-black text-purple-400 uppercase tracking-wider">Özel Fiyatlandırma (Opsiyonel)</label><p className="text-[10px] text-neutral-500 mb-2">Eğer buraya değer girerseniz, sistem genelindeki zamlar bu firmayı etkilemez. Sıfırlamak için içini boş bırakın.</p></div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Sabit Paket Ücreti (₺)</label>
                  <input 
                    type="number" 
                    placeholder={`Sistem Geneli: ${globalPricing?.base || 0}₺`}
                    value={manageForm.customDiscount} 
                    onChange={(e) => setManageForm({...manageForm, customDiscount: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl py-3 px-4 outline-none focus:border-purple-500 transition-colors placeholder-neutral-600 font-bold text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Varlık Başı Ücret (₺)</label>
                  <input 
                    type="number" 
                    placeholder={`Sistem Geneli: ${globalPricing?.asset || 0}₺`}
                    value={manageForm.customAssetPrice} 
                    onChange={(e) => setManageForm({...manageForm, customAssetPrice: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl py-3 px-4 outline-none focus:border-purple-500 transition-colors placeholder-neutral-600 font-bold text-sm md:text-base"
                  />
                </div>
              </div>

              {selectedCompany.subscription_status === 'trialing' && selectedCompany.trial_ends_at !== null && (
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-3 md:p-4 rounded-xl mt-4">
                  <input 
                    type="checkbox" 
                    id="cancelTrial"
                    checked={manageForm.cancelTrial} 
                    onChange={(e) => {
                       if (e.target.checked) {
                           setManageForm({...manageForm, cancelTrial: true, subscriptionStatus: 'past_due'});
                       } else {
                           setManageForm({...manageForm, cancelTrial: false});
                       }
                    }}
                    className="w-5 h-5 rounded border-rose-500 text-rose-500 focus:ring-rose-500/20 bg-neutral-800 cursor-pointer shrink-0"
                  />
                  <label htmlFor="cancelTrial" className="text-sm text-rose-300 font-medium cursor-pointer">Deneme sürümünü iptal et ve anında ödemeye (Paywall'a) düşür</label>
                </div>
              )}
            </div>

            <div className="shrink-0 p-4 md:p-6 border-t border-neutral-800 bg-neutral-900 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                onClick={handleUpdateSubscription}
                disabled={isSaving}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-[0.98] disabled:opacity-50 text-sm md:text-base"
              >
                {isSaving ? "Değişiklikler Kaydediliyor..." : "Ayarları Kaydet ve Uygula"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* 🚀 MOBİL UYUM GÜNCELLEMESİ: Ticket Sohbet Modalı */}
      <AnimatePresence>
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-black/80 backdrop-blur-sm sm:p-4 text-left overscroll-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-neutral-900 border border-neutral-800 rounded-none sm:rounded-3xl w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[85vh] shadow-2xl relative flex flex-col overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-neutral-800 flex justify-between items-start shrink-0 bg-neutral-900">
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex flex-wrap items-center gap-2 mb-2 pr-12">
                        {selectedTicket.company_name || selectedTicket.company_slug}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${selectedTicket.status === 'Çözüldü' || selectedTicket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                           {selectedTicket.status === 'Çözüldü' || selectedTicket.status === 'Resolved' ? 'Çözüldü' : 'Açık'}
                        </span>
                    </h3>
                    <div className="text-xs sm:text-sm text-neutral-400 font-medium flex flex-wrap items-center gap-2 mb-1">
                        <span>Slug: <span className="text-blue-400">{selectedTicket.company_slug}</span></span>
                        <span className="opacity-50">•</span>
                        <span>Açan: <span className="text-amber-400">{selectedTicket.sender_name || 'Bilinmiyor'}</span></span>
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-500">{selectedTicket.type} • {new Date(selectedTicket.created_at).toLocaleString('tr-TR')}</div>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors text-sm font-medium">Kapat</button>
            </div>

            {/* Mesaj Alanı (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-hide overscroll-contain">
                {/* Orijinal Mesaj */}
                <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-800/50">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 font-bold">İlk Talep Mesajı</div>
                    <p className="text-sm text-neutral-200 leading-relaxed">{selectedTicket.message}</p>
                </div>

                {/* Yanıtlar */}
                {(() => {
                    let replies = [];
                    try { replies = JSON.parse(selectedTicket.replies || '[]'); } catch(e) {}
                    
                    return replies.map((reply, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl text-sm max-w-[90%] sm:max-w-[85%] ${reply.sender === 'masterboss' ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50 ml-auto rounded-tr-sm' : 'bg-neutral-800/80 text-neutral-200 mr-auto rounded-tl-sm'}`}>
                            <div className="flex justify-between items-center mb-2 gap-4">
                                <span className={`text-[10px] font-black uppercase tracking-wider ${reply.sender === 'masterboss' ? 'text-blue-400' : 'text-neutral-500'}`}>
                                    {reply.sender === 'masterboss' ? 'Siz (Masterboss)' : selectedTicket.company_slug}
                                </span>
                                <span className="text-[9px] opacity-50 font-mono">{new Date(reply.date).toLocaleString('tr-TR')}</span>
                            </div>
                            <p className="leading-relaxed">{reply.message}</p>
                        </div>
                    ));
                })()}
            </div>

            {/* Yanıt Gönderme Alanı */}
            {selectedTicket.status !== 'Çözüldü' && selectedTicket.status !== 'Resolved' ? (
                <div className="p-4 sm:p-6 border-t border-neutral-800 bg-neutral-900 sm:rounded-b-3xl shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <textarea
                        value={replyTexts[selectedTicket.id] || ""}
                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [selectedTicket.id]: e.target.value }))}
                        placeholder="Yanıtınızı buraya yazın..."
                        className="w-full bg-neutral-950 border border-neutral-700 text-white text-sm rounded-xl p-3 sm:p-4 focus:border-blue-500 outline-none resize-none transition-colors mb-3"
                        rows="3"
                    />
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button 
                            onClick={() => handleTicketAction(selectedTicket, 'resolve')}
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-6 py-3 sm:py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-600/20 order-2 sm:order-1"
                        >
                            Çözüldü İşaretle
                        </button>
                        <button 
                            onClick={() => handleTicketAction(selectedTicket, 'reply')}
                            className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold px-6 py-3 sm:py-2.5 rounded-xl transition-colors order-1 sm:order-2"
                        >
                            Gönder
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 sm:p-6 border-t border-neutral-800 bg-emerald-500/5 sm:rounded-b-3xl text-center shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <div className="text-sm font-bold text-emerald-500 flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> Bu talep çözülmüş olarak kapatıldı.
                    </div>
                </div>
            )}
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Başarı Modalı (Success Modal) */}
      <AnimatePresence>
      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-center overscroll-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-neutral-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">İşlem Başarılı!</h3>
            <p className="text-sm text-neutral-400 mb-6">{successMessage}</p>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              Tamam
            </button>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* 🚀 MOBİL UYUM GÜNCELLEMESİ: Company Info Modal */}
      <AnimatePresence>
      {showInfoModal && infoCompany && (
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-black/80 backdrop-blur-sm sm:p-4 text-left overscroll-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-neutral-900 border border-neutral-800 rounded-none sm:rounded-3xl w-full h-full sm:h-auto sm:w-[95%] sm:max-w-3xl shadow-2xl relative flex flex-col overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-neutral-800 bg-neutral-900 shrink-0">
              <button 
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors text-sm font-medium z-10"
              >
                Kapat
              </button>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pr-10">
                {infoCompany.logo ? (
                  <img src={infoCompany.logo} alt="Logo" className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover bg-neutral-800 shrink-0" />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0"><Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-500"/></div>
                )}
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-bold text-white tracking-tight truncate max-w-full">{infoCompany.company_name}</h3>
                  <div className="text-[11px] sm:text-sm font-mono text-blue-400 truncate">{infoCompany.slug}</div>
                </div>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 p-3 sm:px-6 sm:pt-4 sm:pb-4 border-b border-neutral-800 shrink-0 overflow-x-auto scrollbar-hide bg-neutral-900">
              <button onClick={() => setInfoTab("genel")} className={`shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${infoTab === "genel" ? "bg-white text-black" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}>Genel Bilgiler</button>
              <button onClick={() => setInfoTab("istatistik")} className={`shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${infoTab === "istatistik" ? "bg-white text-black" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}>Sistem & Kasa</button>
              <button onClick={() => setInfoTab("abonelik")} className={`shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${infoTab === "abonelik" ? "bg-rose-500 text-white" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}>Abonelik & Gelir</button>
              <button onClick={() => setInfoTab("karlilik")} className={`shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${infoTab === "karlilik" ? "bg-emerald-500 text-white" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}><Activity size={14} /> Karlılık & Maliyet</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 sm:p-6 overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
              {infoTab === "genel" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <InfoBox label="Sahibi / Yetkili" value={infoCompany.owner_name} />
                  <InfoBox label="Sektör" value={infoCompany.sector} />
                  <InfoBox label="Kayıt Tarihi" value={new Date(infoCompany.created_at).toLocaleDateString('tr-TR')} />
                  <InfoBox label="Vergi Bilgileri" value={infoCompany.tax_info} />
                  <InfoBox label="Açık Adres" value={infoCompany.address} fullWidth />
                  
                  <div className="col-span-1 md:col-span-2 border-t border-neutral-800 my-2 pt-4">
                    <h4 className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 sm:mb-4">İletişim Bilgileri</h4>
                  </div>
                  
                  <InfoBox label="E-Posta (Admin)" value={infoCompany.owner_email || 'Belirtilmemiş'} />
                  <InfoBox label="Ana Telefon" value={infoCompany.phone} />
                  <InfoBox label="WhatsApp" value={infoCompany.whatsapp_phone} />
                  <InfoBox label="Acil Durum Hattı" value={infoCompany.emergency_phone} />
                  <InfoBox label="Sabit Hat" value={infoCompany.landline_phone} />
                  <InfoBox label="Web Sitesi" value={infoCompany.website} />
                </div>
              )}

              {infoTab === "istatistik" && (
                <div>
                  {infoLoading ? (
                    <div className="flex items-center justify-center py-12 text-neutral-500 text-xs sm:text-sm">Veriler yükleniyor...</div>
                  ) : infoDetails ? (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h4 className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 sm:mb-3">İş Yükü ve Operasyon</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                          <InfoBox label="Aylık İş Kaydı" value={infoDetails.jobs.monthly} />
                          <InfoBox label="Yıllık İş Kaydı" value={infoDetails.jobs.yearly} />
                          <InfoBox label="Toplam İş Kaydı" value={infoDetails.jobs.total} />
                          <InfoBox label="Personel Sayısı" value={infoDetails.staff} />
                          <InfoBox label="Kayıtlı Varlık" value={infoDetails.assets} />
                          <InfoBox label="Stok Kalemi" value={infoDetails.stock} />
                          <InfoBox label="Müşteri Sayısı" value={infoDetails.customers} />
                          <InfoBox label="Tedarikçi Sayısı" value={infoDetails.suppliers} />
                          <InfoBox label="Aylık R2 Foto Yükü" value={infoDetails.photos.monthly} />
                          <InfoBox label="Toplam R2 Foto Arşivi" value={infoDetails.photos.total} />
                          <InfoBox label="Toplam Arıza Kaydı" value={infoDetails.faults.total} />
                          <InfoBox label="Aktif Acil Durum" value={infoDetails.emergencies.active} />
                        </div>
                      </div>
                      
                      <div className="border-t border-neutral-800 pt-4">
                        <h4 className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 sm:mb-3">Firma İçi Finansal Durum (Kasa)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                          <InfoBox label="Toplam Gelir (Tahsilat)" value={`₺${infoDetails.finances.income.toLocaleString('tr-TR')}`} />
                          <InfoBox label="Toplam Gider (Harcama)" value={`₺${infoDetails.finances.expense.toLocaleString('tr-TR')}`} />
                          <div className={`p-3 sm:p-4 rounded-xl border ${infoDetails.finances.net >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                             <div className="text-[10px] sm:text-xs font-medium text-neutral-500 mb-0.5 sm:mb-1">Net Kasa (İçerideki Para)</div>
                             <div className={`text-base sm:text-lg font-bold ${infoDetails.finances.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₺{infoDetails.finances.net.toLocaleString('tr-TR')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-500 text-xs sm:text-sm">Veri bulunamadı.</div>
                  )}
                </div>
              )}

              {infoTab === "karlilik" && (
                <div>
                  {infoLoading ? (
                    <div className="flex items-center justify-center py-12 text-neutral-500 text-xs sm:text-sm">Hesaplanıyor...</div>
                  ) : infoDetails ? (
                    <div className="space-y-4 sm:space-y-6">
                      {(() => {
                        // 1. GELİR HESAPLAMASI
                        const basePrice = (infoCompany.custom_base_price !== null && infoCompany.custom_base_price !== undefined) ? Number(infoCompany.custom_base_price) : Number(globalPricing?.base || 0);
                        const assetPrice = (infoCompany.custom_per_asset_price !== null && infoCompany.custom_per_asset_price !== undefined) ? Number(infoCompany.custom_per_asset_price) : Number(globalPricing?.asset || 0);

                        const hasFreeMonth = infoCompany.free_months_balance && Number(infoCompany.free_months_balance) > 0;
                        const activeBasePrice = hasFreeMonth ? 0 : basePrice;
                        
                        const assetCount = infoDetails.assets || 0;
                        const assetRevenue = assetCount * assetPrice; 
                        const totalRevenue = activeBasePrice + assetRevenue;

                        // 2. DETAYLI GİDER (D1 & R2 & WORKER MALİYET) HESAPLAMASI
                        const photoCount = infoDetails.photos.total || 0;
                        const jobCount = infoDetails.jobs.total || 0;
                        const customerCount = infoDetails.customers || 0;
                        const faultCount = infoDetails.faults.total || 0;
                        const assetCountReq = infoDetails.assets || 0;

                        // Varsayılan CF Maliyet Çarpanları
                        const D1_WRITE_COST_PER_REQ = 0.0003; 
                        const D1_READ_COST_PER_REQ = 0.00005;
                        const R2_STORAGE_COST_PER_MB = 0.001;
                        const R2_REQ_COST = 0.0001;
                        const WORKER_REQ_COST = 0.00001;

                        // Gerçek İşlem Kullanım Sayıları
                        const realWorkerRequests = (jobCount * 15) + (photoCount * 5) + (customerCount * 8) + (faultCount * 6) + (assetCountReq * 10);
                        const realD1Writes = (jobCount * 3) + (customerCount * 2) + faultCount + assetCountReq;
                        const realD1Reads = realWorkerRequests * 2;
                        const realR2Requests = photoCount * 15;
                        const realR2StorageMB = photoCount * 2.5;

                        const workerTotalCost = realWorkerRequests * WORKER_REQ_COST;
                        const d1TotalCost = (realD1Writes * D1_WRITE_COST_PER_REQ) + (realD1Reads * D1_READ_COST_PER_REQ);
                        const r2TotalCost = (realR2Requests * R2_REQ_COST) + (realR2StorageMB * R2_STORAGE_COST_PER_MB);

                        const totalServerCost = workerTotalCost + d1TotalCost + r2TotalCost;

                        // 3. NET KÂR
                        const netProfit = totalRevenue - totalServerCost;

                        // Sunucu yük durumu etiketi
                        const totalDataPoints = realWorkerRequests;
                        let loadStatus = "Düşük";
                        let loadColor = "text-emerald-400";
                        if (totalDataPoints > 10000) { loadStatus = "Orta"; loadColor = "text-amber-400"; }
                        if (totalDataPoints > 50000) { loadStatus = "Yüksek (Maliyetli)"; loadColor = "text-rose-400"; }

                        // 4. İYZİCO ÖDEME DURUMU KONTROLÜ
                        let paymentStatusText = "Bilinmiyor";
                        let paymentStatusColor = "text-neutral-500";
                        let paymentBgColor = "bg-neutral-800";

                        if (infoCompany.subscription_status === 'active') {
                            paymentStatusText = "ÖDENDİ (İyzico)";
                            paymentStatusColor = "text-emerald-400";
                            paymentBgColor = "bg-emerald-500/10 border-emerald-500/20";
                        } else if (infoCompany.subscription_status === 'past_due') {
                            paymentStatusText = "ÖDENMEDİ (Gecikme)";
                            paymentStatusColor = "text-rose-400";
                            paymentBgColor = "bg-rose-500/10 border-rose-500/20";
                        } else if (infoCompany.subscription_status === 'trialing') {
                            paymentStatusText = "DENEME SÜRÜMÜ";
                            paymentStatusColor = "text-blue-400";
                            paymentBgColor = "bg-blue-500/10 border-blue-500/20";
                        } else if (infoCompany.subscription_status === 'canceled') {
                            paymentStatusText = "İPTAL EDİLDİ";
                            paymentStatusColor = "text-neutral-400";
                            paymentBgColor = "bg-neutral-800 border-neutral-700";
                        }

                        return (
                          <>
                            {/* ÖDEME DURUMU KARTI */}
                            <div className={`p-3 sm:p-5 rounded-2xl border ${paymentBgColor} flex items-center justify-between`}>
                               <div>
                                  <div className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5 sm:mb-1">Fatura Durumu</div>
                                  <div className={`text-sm sm:text-lg font-black ${paymentStatusColor}`}>{paymentStatusText}</div>
                               </div>
                               <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black/20 flex items-center justify-center shrink-0">
                                  {infoCompany.subscription_status === 'active' ? <CheckCircle className={`w-4 h-4 sm:w-6 sm:h-6 ${paymentStatusColor}`} /> : <AlertCircle className={`w-4 h-4 sm:w-6 sm:h-6 ${paymentStatusColor}`} />}
                               </div>
                            </div>

                            <div className="bg-neutral-800/50 p-4 sm:p-6 rounded-2xl border border-neutral-800">
                              <h4 className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> Platform Gelir Analizi (Aylık)
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 border-b border-neutral-700 pb-4 mb-4">
                                <div>
                                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Taban Paket</div>
                                  <div className="text-base sm:text-lg font-bold text-white">
                                    {hasFreeMonth ? (
                                      <span className="text-rose-400 line-through mr-1 sm:mr-2">₺{basePrice}</span>
                                    ) : null}
                                    ₺{activeBasePrice}
                                  </div>
                                  {hasFreeMonth && <div className="text-[8px] sm:text-[10px] text-rose-400 font-bold uppercase mt-0.5 sm:mt-1">Ref. İndirimi</div>}
                                </div>
                                <div>
                                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Varlık Kazanç ({assetPrice}₺)</div>
                                  <div className="text-base sm:text-lg font-bold text-blue-400">₺{assetRevenue}</div>
                                  <div className="text-[8px] sm:text-[10px] text-neutral-500 uppercase mt-0.5 sm:mt-1">{assetCount} Cihaz</div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                  <div className="text-[10px] sm:text-xs font-bold text-neutral-400 mb-0.5 sm:mb-1 uppercase">Beklenen Brüt Ciro</div>
                                  <div className="text-lg sm:text-xl font-black text-white">₺{totalRevenue.toLocaleString('tr-TR')}</div>
                                </div>
                              </div>
                              
                              <h4 className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 mt-4 sm:mt-6 flex items-center gap-2">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> Gerçekleşen Sunucu Maliyeti
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 border-b border-neutral-700 pb-4 mb-4">
                                <div className="bg-neutral-800/50 p-2.5 sm:p-3 rounded-xl border border-neutral-700/50">
                                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1 font-bold">R2 Depolama & İstek</div>
                                  <div className="text-base sm:text-lg font-black text-rose-400">- ₺{r2TotalCost.toFixed(2)}</div>
                                  <div className="text-[9px] sm:text-[10px] text-neutral-400 mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                                    <div className="flex justify-between"><span>Depolama:</span> <span>{realR2StorageMB.toFixed(1)} MB</span></div>
                                    <div className="flex justify-between"><span>Okuma/Yazma:</span> <span>{realR2Requests.toLocaleString('tr-TR')}</span></div>
                                  </div>
                                </div>
                                <div className="bg-neutral-800/50 p-2.5 sm:p-3 rounded-xl border border-neutral-700/50">
                                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1 font-bold">D1 Veritabanı Maliyeti</div>
                                  <div className="text-base sm:text-lg font-black text-rose-400">- ₺{d1TotalCost.toFixed(2)}</div>
                                  <div className="text-[9px] sm:text-[10px] text-neutral-400 mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                                    <div className="flex justify-between"><span>D1 Yazma:</span> <span>{realD1Writes.toLocaleString('tr-TR')}</span></div>
                                    <div className="flex justify-between"><span>D1 Okuma:</span> <span>{realD1Reads.toLocaleString('tr-TR')}</span></div>
                                  </div>
                                </div>
                                <div className="bg-neutral-800/50 p-2.5 sm:p-3 rounded-xl border border-neutral-700/50">
                                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1 font-bold">Worker Trafik Maliyeti</div>
                                  <div className="text-base sm:text-lg font-black text-rose-400">- ₺{workerTotalCost.toFixed(2)}</div>
                                  <div className="text-[9px] sm:text-[10px] text-neutral-400 mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                                    <div className="flex justify-between"><span>Toplam İstek:</span> <span>{realWorkerRequests.toLocaleString('tr-TR')}</span></div>
                                    <div className="flex justify-between mt-1 pt-1 border-t border-neutral-700/50 text-neutral-500"><span>Sunucu Yükü:</span> <span className={`${loadColor} font-bold`}>{loadStatus}</span></div>
                                  </div>
                                </div>
                              </div>

                              {/* NET KÂR GÖSTERGESİ */}
                              <div className="bg-emerald-500/10 p-3 sm:p-4 rounded-xl border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                                  <div>
                                    <div className="text-[10px] sm:text-xs font-bold text-emerald-500 mb-0.5 sm:mb-1 uppercase tracking-wider">Net Platform Karı</div>
                                    <div className="text-[9px] sm:text-[10px] text-emerald-500/70">Cirodan sunucu ve veritabanı masrafları düşüldükten sonra</div>
                                  </div>
                                  <div className="text-lg sm:text-2xl font-black text-emerald-400">₺{netProfit.toFixed(2).toLocaleString('tr-TR')}</div>
                              </div>

                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-500 text-xs sm:text-sm">Analiz oluşturulamadı.</div>
                  )}
                </div>
              )}

              {infoTab === "abonelik" && (
                <div className="space-y-3 sm:space-y-4">
                   <div className="bg-neutral-800/50 p-4 sm:p-5 rounded-2xl border border-neutral-800">
                      <div className="text-[10px] sm:text-sm text-neutral-400 mb-0.5 sm:mb-1">Abonelik Durumu</div>
                      <div className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                        {infoCompany.subscription_status === 'active' ? 'Aktif Üye' : 
                         infoCompany.subscription_status === 'trialing' ? 'Deneme Sürümünde' : 'Ödeme Bekliyor / Kısıtlı'}
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t border-neutral-700/50 pt-3 sm:pt-4">
                         <div>
                           <div className="text-[9px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Özel Tanımlı Fiyat (Aylık)</div>
                           <div className="text-xs sm:text-sm font-medium text-amber-400">{(infoCompany.custom_base_price !== null && infoCompany.custom_base_price !== undefined) ? `₺${infoCompany.custom_base_price}` : `Sistem Geneli (${globalPricing?.base || 0}₺)`}</div>
                         </div>
                         <div>
                           <div className="text-[9px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Özel Varlık Ücreti</div>
                           <div className="text-xs sm:text-sm font-medium text-amber-400">{(infoCompany.custom_per_asset_price !== null && infoCompany.custom_per_asset_price !== undefined) ? `₺${infoCompany.custom_per_asset_price}` : `Sistem Geneli (${globalPricing?.asset || 0}₺)`}</div>
                         </div>
                         <div>
                           <div className="text-[9px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Tanımlı Hediye / Ücretsiz Ay</div>
                           <div className="text-xs sm:text-sm font-medium text-blue-400">{infoCompany.free_months_balance || 0} Ay</div>
                         </div>
                         <div>
                           <div className="text-[9px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Deneme Sürümü Bitişi</div>
                           <div className="text-xs sm:text-sm font-medium text-white">{infoCompany.trial_ends_at ? new Date(infoCompany.trial_ends_at).toLocaleDateString('tr-TR') : '-'}</div>
                         </div>
                         <div className="col-span-2 sm:col-span-1">
                           <div className="text-[9px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Sonraki Kesim Tarihi</div>
                           <div className="text-xs sm:text-sm font-medium text-white">{infoCompany.billing_cycle_anchor ? new Date(infoCompany.billing_cycle_anchor).toLocaleDateString('tr-TR') : '-'}</div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-rose-500/5 p-3 sm:p-4 rounded-xl border border-rose-500/20">
                     <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                       <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                       <div className="text-[10px] sm:text-sm text-rose-200">Tahmini Toplam Masterboss Ödemesi özelliği sonraki güncellemelerde PayTR/Iyzico entegrasyonu ile otomatik hesaplanacaktır. Şu an firmaların kendi kasaları izlenmektedir. Detaylar "Karlılık & Maliyet" sekmesine taşınmıştır.</div>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

    </div>
  );
}

function MetricCard({ icon: Icon, label, value, ext, color }) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden group flex flex-col justify-between">
      <div className={`absolute -right-4 -top-4 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br ${color} opacity-10 rounded-full blur-xl sm:blur-2xl group-hover:scale-150 transition-transform duration-500`} />
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${color} p-0.5 flex items-center justify-center shadow-lg`}>
          <div className="w-full h-full bg-neutral-900 rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        </div>
      </div>
      <div>
        <div className="text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1 tracking-tight truncate">{value}</div>
        <div className="text-[10px] sm:text-sm font-medium text-neutral-400 mb-0.5 sm:mb-1 leading-tight">{label}</div>
        <div className="text-[9px] sm:text-xs text-neutral-600 leading-tight truncate">{ext}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-bold sm:font-medium transition-all shrink-0 ${
        active 
          ? "bg-white text-neutral-950 shadow-lg" 
          : "bg-neutral-900/50 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800"
      }`}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
      <span className="truncate">{label}</span>
    </button>
  );
}

function InfoBox({ label, value, fullWidth = false }) {
  return (
    <div className={`bg-neutral-800/30 border border-neutral-800/50 p-3 sm:p-4 rounded-xl ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
      <div className="text-[10px] sm:text-xs font-medium text-neutral-500 mb-0.5 sm:mb-1">{label}</div>
      <div className="text-xs sm:text-sm text-white font-medium break-words">{value || '-'}</div>
    </div>
  );
}