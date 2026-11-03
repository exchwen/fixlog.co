"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Users, Activity, BarChart3, LogOut, TicketCheck, Gift, AlertCircle, CheckCircle, Database, Plus, ShoppingCart, X, TrendingUp, TrendingDown, Clock, Download, Share, Check } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import toast from "react-hot-toast";
import DynamicPWA from "@/components/DynamicPWA";

const isResolvedTicket = (status) => {
  const normalized = String(status || '').trim().toLocaleLowerCase('tr-TR');
  return normalized === 'resolved' || normalized === String.fromCharCode(231, 246, 122, 252, 108, 252);
};
const EMPTY_LIST = [];
const isBillableSubscription = (company) => (
  company?.subscription_status === "active" &&
  Number(company?.has_masterboss_gift) !== 1 &&
  Number(company?.free_months_balance || 0) <= 0
);
const getSubscriptionEconomics = (company, assetCount, globalPricing) => {
  const basePrice = company?.custom_base_price !== null && company?.custom_base_price !== undefined
    ? Number(company.custom_base_price) || 0
    : Number(globalPricing?.base) || 0;
  const assetPrice = company?.custom_per_asset_price !== null && company?.custom_per_asset_price !== undefined
    ? Number(company.custom_per_asset_price) || 0
    : Number(globalPricing?.asset) || 0;
  const normalizedAssetCount = Number(assetCount) || 0;
  const freeMonths = Number(company?.free_months_balance || 0);
  const hasGift = Number(company?.has_masterboss_gift || 0) === 1;
  const billable = isBillableSubscription(company);
  const grossMonthlyCharge = basePrice + normalizedAssetCount * assetPrice;
  const exclusionReason = hasGift
    ? "VIP muafiyet"
    : freeMonths > 0
      ? `${freeMonths} ücretsiz ay bakiyesi`
      : company?.subscription_status !== "active"
        ? `Abonelik durumu: ${company?.subscription_status || "belirsiz"}`
        : null;
  return {
    currency: "TRY",
    basePrice,
    assetPrice,
    assetCount: normalizedAssetCount,
    assetTotal: normalizedAssetCount * assetPrice,
    grossMonthlyCharge,
    monthlyCharge: billable ? grossMonthlyCharge : 0,
    billable,
    exclusionReason,
    paymentProof: false
  };
};
const CLOUDFLARE_USAGE_WEIGHTS = Object.freeze({
  jobs: 1,
  photos: 2,
  assets: 1,
  staff: 1,
  customers: 1,
  suppliers: 1,
  stock: 1,
  bomTemplates: 2,
  purchaseOrders: 2,
  faults: 2,
  emergencies: 2
});
const getCompanyCloudflareUsage = (company) => {
  const details = company?.details || company || {};
  const usage = {
    jobs: Number(details.jobs?.total ?? details.total_jobs) || 0,
    photos: Number(details.photos?.total) || 0,
    assets: Number(details.assets ?? details.total_assets) || 0,
    staff: Number(details.staff ?? details.total_staff) || 0,
    customers: Number(details.customers ?? details.total_customers) || 0,
    suppliers: Number(details.suppliers) || 0,
    stock: Number(details.stock ?? details.total_stock) || 0,
    bomTemplates: Number(details.bomTemplates) || 0,
    purchaseOrders: Number(details.purchaseOrders) || 0,
    faults: Number(details.faults?.total) || 0,
    emergencies: Number(details.emergencies?.total) || 0
  };
  const breakdown = Object.fromEntries(Object.entries(usage).map(([key, value]) => [
    key,
    { count: value, units: value * (CLOUDFLARE_USAGE_WEIGHTS[key] || 1), weight: CLOUDFLARE_USAGE_WEIGHTS[key] || 1 }
  ]));
  const totalUnits = Object.values(breakdown).reduce((total, item) => total + item.units, 0);
  return { usage, breakdown, totalUnits };
};
const getCloudflareCostAllocation = (company, portfolio, cloudflareBilling) => {
  const companySlug = company?.slug;
  const profiles = (portfolio || []).map((item) => ({
    slug: item.slug,
    ...getCompanyCloudflareUsage(item)
  }));
  const selected = profiles.find((item) => item.slug === companySlug);
  const totalUnits = profiles.reduce((total, item) => total + item.totalUnits, 0);
  const share = selected && totalUnits > 0 ? selected.totalUnits / totalUnits : null;
  const accountAmount = Number(cloudflareBilling?.exactCost?.amount);
  const hasAccountAmount = Number.isFinite(accountAmount);
  const accountCurrency = String(cloudflareBilling?.exactCost?.currency || "USD").toUpperCase();
  const usdTryRate = Number(cloudflareBilling?.usdTryRate);
  const accountUsd = hasAccountAmount && accountCurrency === "USD" ? accountAmount : null;
  const accountTry = hasAccountAmount
    ? accountCurrency === "TRY"
      ? accountAmount
      : accountCurrency === "USD" && Number.isFinite(usdTryRate)
        ? accountAmount * usdTryRate
        : null
    : null;
  return {
    selected,
    totalUnits,
    share,
    sharePercent: share === null ? null : share * 100,
    accountCurrency,
    accountUsd,
    accountTry,
    allocatedUsd: accountUsd === null || share === null ? null : accountUsd * share,
    allocatedTry: accountTry === null || share === null ? null : accountTry * share,
    model: "weighted_resource_volume",
    weights: CLOUDFLARE_USAGE_WEIGHTS
  };
};

export default function MasterbossDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyInsights, setCompanyInsights] = useState([]);
  const [companyInsightsLoading, setCompanyInsightsLoading] = useState(false);
  const [cloudflareBilling, setCloudflareBilling] = useState(null);

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
  const [companySearch, setCompanySearch] = useState("");
  const [companyPage, setCompanyPage] = useState(1);
  const companiesPerPage = 40;

// 🚀 YENİ: Ticket (Destek Talebi) Filtreleme State'i
const [ticketFilter, setTicketFilter] = useState("all");
const [ticketPage, setTicketPage] = useState(1);
const ticketsPerPage = 30;

useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("masterbossToken");
      if (!token) {
        router.replace("/masterboss");
        return;
      }

      try {
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.fixlog.co";
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

  const { companies = EMPTY_LIST, tickets = EMPTY_LIST, referrals = EMPTY_LIST, stats = {}, supportSummary = {}, globalPricing } = data || {};

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("masterbossToken");
    if (!token || !companies.length) {
      setCompanyInsights([]);
      setCompanyInsightsLoading(false);
      return undefined;
    }

    const loadCompanyInsights = async () => {
      setCompanyInsightsLoading(true);
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.fixlog.co";
      const insights = await Promise.all(companies.map(async company => {
        try {
          const headers = { "Authorization": `Bearer ${token}` };
          const [detailsResponse, bomResponse, ordersResponse] = await Promise.all([
            fetch(`${BASE_URL}/masterboss-company-details?slug=${encodeURIComponent(company.slug)}`, { headers }),
            fetch(`${BASE_URL}/get-bom-templates?company_slug=${encodeURIComponent(company.slug)}`, { headers }),
            fetch(`${BASE_URL}/get-purchase-orders?company_slug=${encodeURIComponent(company.slug)}`, { headers })
          ]);
          const [detailsJson, bomJson, ordersJson] = await Promise.all([
            detailsResponse.json(),
            bomResponse.json().catch(() => ({})),
            ordersResponse.json().catch(() => ({}))
          ]);
          return detailsJson.success ? {
            ...company,
            ...(detailsJson.company || {}),
            details: {
              ...detailsJson.stats,
              bomTemplates: Array.isArray(bomJson.data) ? bomJson.data.length : 0,
              purchaseOrders: Array.isArray(ordersJson.data) ? ordersJson.data.length : 0,
              pendingPurchaseOrders: Array.isArray(ordersJson.data)
                ? ordersJson.data.filter(order => !["Tamamlandı", "Tamamlandi"].includes(order.status)).length
                : 0
            },
            economics: detailsJson.economics || getSubscriptionEconomics(company, detailsJson.stats?.assets, globalPricing)
          } : null;
        } catch (error) {
          return null;
        }
      }));

      if (!cancelled) {
        setCompanyInsights(insights.filter(Boolean));
        setCompanyInsightsLoading(false);
      }
    };

    loadCompanyInsights();
    return () => { cancelled = true; };
  }, [companies, globalPricing]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("masterbossToken");
    if (!token || !data?.success) {
      setCloudflareBilling(null);
      return undefined;
    }
    const loadCloudflareBilling = async () => {
      try {
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.fixlog.co";
        const response = await fetch(`${BASE_URL}/masterboss-cloudflare-billing`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await response.json().catch(() => ({}));
        if (!cancelled) setCloudflareBilling(json);
      } catch {
        if (!cancelled) setCloudflareBilling({ success: false, configured: false, exactCost: null });
      }
    };
    loadCloudflareBilling();
    return () => { cancelled = true; };
  }, [data?.success]);

  const filteredCompanies = useMemo(() => companies.filter(c => {
    const matchesFilter = companyFilter === "active" ? c.subscription_status === "active" && Number(c.has_masterboss_gift) !== 1
      : companyFilter === "trialing" ? c.subscription_status === "trialing" && Number(c.has_masterboss_gift) !== 1
      : companyFilter === "past_due" ? (c.subscription_status === "past_due" || c.subscription_status === "canceled") && Number(c.has_masterboss_gift) !== 1
      : companyFilter === "exempt" ? Number(c.has_masterboss_gift) === 1
      : true;
    const query = companySearch.trim().toLocaleLowerCase("tr-TR");
    const matchesSearch = !query || `${c.company_name || ""} ${c.owner_name || ""} ${c.slug || ""}`.toLocaleLowerCase("tr-TR").includes(query);
    return matchesFilter && matchesSearch;
  }), [companies, companyFilter, companySearch]);
  const companyPageCount = Math.max(1, Math.ceil(filteredCompanies.length / companiesPerPage));
  const visibleCompanies = useMemo(() => filteredCompanies.slice((companyPage - 1) * companiesPerPage, companyPage * companiesPerPage), [filteredCompanies, companyPage]);
  const companyBySlug = useMemo(() => new Map(companies.map(company => [company.slug, company])), [companies]);
  useEffect(() => setCompanyPage(1), [companyFilter, companySearch]);
  const filteredTickets = useMemo(() => tickets.filter(ticket => ticketFilter === "open" ? !isResolvedTicket(ticket.status) : ticketFilter === "resolved" ? isResolvedTicket(ticket.status) : true), [tickets, ticketFilter]);
  const ticketPageCount = Math.max(1, Math.ceil(filteredTickets.length / ticketsPerPage));
  const visibleTickets = useMemo(() => filteredTickets.slice((ticketPage - 1) * ticketsPerPage, ticketPage * ticketsPerPage), [filteredTickets, ticketPage]);
  useEffect(() => setTicketPage(1), [ticketFilter]);

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
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.fixlog.co";
      
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
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.fixlog.co";
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
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.fixlog.co";
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
  const activeAccountCompanies = companies.filter(c => c.subscription_status === 'active').length;
  const activeCompanies = companies.filter(c => c.subscription_status === 'active' && Number(c.has_masterboss_gift) !== 1).length;
  const exemptCompanies = companies.filter(c => Number(c.has_masterboss_gift) === 1).length;

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

  const canceledCompanies = companies.filter(c => c.subscription_status === 'canceled' && Number(c.has_masterboss_gift) !== 1).length;
  const pastDueCompanies = companies.filter(c => c.subscription_status === 'past_due' && Number(c.has_masterboss_gift) !== 1).length;
  const trialingCompanies = companies.filter(c => c.subscription_status === 'trialing' && Number(c.has_masterboss_gift) !== 1).length;

  const activeRatio = companies.length > 0 ? (activeAccountCompanies / companies.length) * 100 : 0;
  
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
  } else if (canceledCompanies + pastDueCompanies > activeAccountCompanies) {
      healthStatus = "Riskli Durum (Kayıp Yüksek)";
      healthColor = "text-rose-400";
      healthBg = "bg-rose-500/10 border-rose-500/20";
      healthIcon = <TrendingDown size={24} className="text-rose-500" />;
      healthMessage = "Dikkat! İptal edilen veya ödemesi geciken hesap sayısı, aktif hesaplardan daha fazla. Müşteri memnuniyetini artırmalısınız.";
  } else if (trialingCompanies > activeAccountCompanies) {
      healthStatus = "Potansiyel Büyüme (Dönüşüm Bekleniyor)";
      healthColor = "text-amber-400";
      healthBg = "bg-amber-500/10 border-amber-500/20";
      healthIcon = <Clock size={24} className="text-amber-500" />;
      healthMessage = "Sistemde çok sayıda deneme sürümünde olan kullanıcı var. Bunları ödeyen müşteriye dönüştürmek için iletişime geçin.";
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-white selection:bg-rose-500/30 relative overflow-hidden">
      {/* Abstract Animated Background Elements */}
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
                    {isIos ? (<span className="text-[11px] text-neutral-400 mt-0.5 leading-tight">Yüklemek için <Share size={12} className="inline-block mx-0.5 mb-0.5" /> <b>Paylaş</b> ikonuna basıp <br/> <b>Ana Ekrana Ekle</b>&apos;yi seçin.</span>) : (<span className="text-xs text-neutral-400 mt-0.5">Panele hızlıca erişmek için yükleyin.</span>)}
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
      <nav className="sticky top-0 z-50 bg-neutral-950/95 border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Masterboss</span>
              <span className="hidden sm:block text-[11px] text-neutral-500 mt-0.5">Platform yönetim merkezi</span>
            </div>
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

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        <section className="mb-7 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#11151f] p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-300">Bugün</p>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Platform özeti</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">Firmaları, abonelikleri ve destek taleplerini tek ekrandan takip edin.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-300"><span className="font-semibold text-white">{currentMonthNewCompanies}</span> yeni firma · bu ay</div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <OverviewCard icon={Building2} label="Kayıtlı firma" value={companies.length} detail={`${activeAccountCompanies} aktif hesap`} tone="blue" />
            <OverviewCard icon={AlertCircle} label="Ödeme takibi" value={pastDueCompanies + canceledCompanies} detail={`${pastDueCompanies} gecikmiş · ${canceledCompanies} iptal`} tone="rose" />
            <OverviewCard icon={TicketCheck} label="Açık destek" value={supportSummary.open ?? tickets.filter(t => !isResolvedTicket(t.status)).length} detail="Yanıt bekleyen talepler" tone="violet" />
            <OverviewCard icon={BarChart3} label="Kayıtlı varlık" value={totalAssets} detail="Platformdaki toplam cihaz" tone="indigo" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-4 sm:grid-cols-4">
            <MiniStat label="Deneme" value={trialingCompanies} />
            <MiniStat label="Personel" value={totalStaff} />
            <MiniStat label="İş · bu ay" value={stats.monthlyJobs || 0} />
            <MiniStat label="Başarılı davet" value={referrals.filter(r => Number(r.is_verified) === 1).length} />
          </div>
          <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
            <div>
              <div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-white">Abonelik dağılımı</span><span className="text-neutral-400">{companies.length ? `${activeRatio.toFixed(0)}% aktif hesap` : "Henüz firma yok"}</span></div>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/10" aria-label="Abonelik dağılımı">
                <div className="bg-emerald-400 transition-all" style={{ width: `${activeRatio}%` }} />
                <div className="bg-amber-400 transition-all" style={{ width: `${companies.length ? trialingCompanies / companies.length * 100 : 0}%` }} />
                <div className="bg-rose-400 transition-all" style={{ width: `${companies.length ? (pastDueCompanies + canceledCompanies) / companies.length * 100 : 0}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-400">
                <span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />Aktif hesap: {activeAccountCompanies}</span>
                <span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-white/40" />Ücretli aktif: {activeCompanies}</span>
                <span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-400" />Deneme: {trialingCompanies}</span>
                <span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-rose-400" />Gecikmiş / iptal: {pastDueCompanies + canceledCompanies}</span>
                <span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-sky-300" />Muaf / hediye: {exemptCompanies}</span>
              </div>
            </div>
            <div className="border-t border-white/10 pt-3 text-xs leading-relaxed text-neutral-500 sm:max-w-56 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"><span className="font-semibold text-neutral-300">İşlem hacmi</span><br />Bu ay {Number(stats.monthlyJobs || 0).toLocaleString('tr-TR')} iş, bu yıl {Number(stats.yearlyJobs || 0).toLocaleString('tr-TR')} iş kaydedildi. Fotoğraf sayısı, işlere eklenen dosyaları gösterir.</div>
          </div>
        </section>

        <AnalyticsDeck
          companies={companies}
          tickets={tickets}
          monthlyJobs={stats.monthlyJobs || 0}
          yearlyJobs={stats.yearlyJobs || 0}
          currentMonthNewCompanies={currentMonthNewCompanies}
          lastMonthNewCompanies={lastMonthNewCompanies}
          activeCompanies={activeCompanies}
          trialingCompanies={trialingCompanies}
          pastDueCompanies={pastDueCompanies}
          canceledCompanies={canceledCompanies}
          exemptCompanies={exemptCompanies}
          totalAssets={totalAssets}
          totalStaff={totalStaff}
          companyInsights={companyInsights}
          companyInsightsLoading={companyInsightsLoading}
          whatsappCompanies={companies.filter(company => Boolean(company.whatsapp_phone)).length}
          globalPricing={globalPricing}
          cloudflareBilling={cloudflareBilling}
        />

        <div className="grid gap-4 lg:grid-cols-[224px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-2xl border border-white/[0.08] bg-[#11151f] p-2 shadow-xl shadow-black/10 lg:sticky lg:top-24">
            <div className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Yönetim</div>
            <div className="flex gap-2 lg:flex-col">
              <TabButton active={activeTab === "companies"} onClick={() => setActiveTab("companies")} icon={Building2} label="Firmalar" />
              <TabButton active={activeTab === "tickets"} onClick={() => setActiveTab("tickets")} icon={TicketCheck} label={`Destek (${tickets.filter(t=>!isResolvedTicket(t.status)).length})`} />
              <TabButton active={activeTab === "referrals"} onClick={() => setActiveTab("referrals")} icon={Gift} label="Hediye havuzları" />
            </div>
          </aside>

        {/* Content Area */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11151f] shadow-xl shadow-black/10">
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
              <div className="bg-white/5 border border-white/10 backdrop-blur-lg shadow-xl rounded-2xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
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
                 <button onClick={() => setCompanyFilter("all")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${companyFilter === "all" ? "bg-white text-black" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Tümü ({companies.length})</button>
                 <button onClick={() => setCompanyFilter("active")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${companyFilter === "active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Ücretli aktif ({companies.filter(c => c.subscription_status === 'active' && Number(c.has_masterboss_gift) !== 1).length})</button>
                 <button onClick={() => setCompanyFilter("trialing")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${companyFilter === "trialing" ? "bg-blue-500/20 text-blue-400 border border-blue-500/50" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Deneme ({companies.filter(c => c.subscription_status === 'trialing' && Number(c.has_masterboss_gift) !== 1).length})</button>
                 <button onClick={() => setCompanyFilter("past_due")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${companyFilter === "past_due" ? "bg-rose-500/20 text-rose-400 border border-rose-500/50" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Gecikmede ({companies.filter(c => (c.subscription_status === 'past_due' || c.subscription_status === 'canceled') && Number(c.has_masterboss_gift) !== 1).length})</button>
                 <button onClick={() => setCompanyFilter("exempt")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${companyFilter === "exempt" ? "bg-amber-500/20 text-amber-400 border border-amber-500/50" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Muaf (VIP) ({companies.filter(c => Number(c.has_masterboss_gift) === 1).length})</button>
              </div>

              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input value={companySearch} onChange={e => setCompanySearch(e.target.value)} placeholder="Firma, yetkili veya slug ara" className="w-full sm:max-w-sm rounded-xl border border-white/10 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-blue-500" />
                <div className="text-xs text-neutral-400">{filteredCompanies.length ? `${(companyPage - 1) * companiesPerPage + 1}–${Math.min(companyPage * companiesPerPage, filteredCompanies.length)} / ${filteredCompanies.length}` : 'Eşleşen firma yok'}</div>
              </div>

              {/* Tablo İçeriği (Yatay kaydırma sadece tabloda gerekli) */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="min-w-full text-left text-xs sm:text-sm whitespace-nowrap">
                    <thead className="bg-white/5 border-b border-white/10 text-neutral-300 backdrop-blur-md">
                      <tr>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Firma Kodu (Slug)</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Firma Adı / Sahibi</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Abonelik Türü</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Bitiş/Kesim</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Kullanım</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium">Aylık hesap</th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-right">Eylemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {visibleCompanies.map((c) => (
                        <tr key={c.slug} className="hover:bg-white/5 transition-all duration-200">
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
                              Number(c.has_masterboss_gift) === 1 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              c.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                              c.subscription_status === 'trialing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {Number(c.has_masterboss_gift) === 1 ? 'MUAF (HEDİYE)' : c.subscription_status?.toUpperCase() || 'BİLİNMİYOR'}
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
                            <div>İş: <span className="text-white">{c.total_jobs || 0}</span> · Müşteri: <span className="text-white">{c.total_customers || 0}</span></div>
                            <div>Stok: <span className="text-white">{c.total_stock || 0}</span></div>
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-sm">
                            {(() => {
                              const economics = getSubscriptionEconomics(c, c.total_assets, globalPricing);
                              return economics.billable ? (
                                <div>
                                  <div className="font-bold text-emerald-300">₺{economics.monthlyCharge.toLocaleString('tr-TR')}</div>
                                  <div className="text-[10px] text-neutral-500">paket + varlık</div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-bold text-neutral-400">₺0</div>
                                  <div className="max-w-[150px] whitespace-normal text-[10px] text-amber-300/80">{economics.exclusionReason}</div>
                                </div>
                              );
                            })()}
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
                                  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.fixlog.co";
                                  const res = await fetch(`${BASE_URL}/masterboss-company-details?slug=${c.slug}`, {
                                    headers: { "Authorization": `Bearer ${token}` }
                                  });
                                  const json = await res.json();
                                  if(json.success) {
                                    setInfoCompany(current => ({ ...current, ...(json.company || {}) }));
                                    setInfoDetails({ ...(json.stats || {}), economics: json.economics || null });
                                  }
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
                              onClick={async () => { 
                                setSelectedCompany(c); 
                                setManageForm({ 
                                  subscriptionStatus: c.subscription_status || 'trialing', 
                                  freeMonths: c.free_months_balance !== undefined && c.free_months_balance !== null ? c.free_months_balance : '', 
                                  customDiscount: c.custom_base_price !== undefined && c.custom_base_price !== null ? c.custom_base_price : '', 
                                  customAssetPrice: c.custom_per_asset_price !== undefined && c.custom_per_asset_price !== null ? c.custom_per_asset_price : '',
                                  cancelTrial: false,
                                  hasMasterbossGift: Number(c.has_masterboss_gift) === 1
                                }); 
                                setShowManageModal(true); 
                                try {
                                  const token = localStorage.getItem("masterbossToken");
                                  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.fixlog.co";
                                  const res = await fetch(`${BASE_URL}/masterboss-company-details?slug=${encodeURIComponent(c.slug)}`, {
                                    headers: { "Authorization": `Bearer ${token}` }
                                  });
                                  const json = await res.json();
                                  if (json.success && json.company) {
                                    const fullCompany = { ...c, ...json.company };
                                    setSelectedCompany(fullCompany);
                                    setManageForm({
                                      subscriptionStatus: fullCompany.subscription_status || 'trialing',
                                      freeMonths: fullCompany.free_months_balance ?? '',
                                      customDiscount: fullCompany.custom_base_price ?? '',
                                      customAssetPrice: fullCompany.custom_per_asset_price ?? '',
                                      cancelTrial: false,
                                      hasMasterbossGift: Number(fullCompany.has_masterboss_gift) === 1
                                    });
                                  }
                                } catch (error) {
                                  toast.error("Firma detayları alınamadı; mevcut özet bilgiler gösteriliyor.");
                                }
                              }} 
                              className="text-rose-500 hover:text-rose-400 text-xs sm:text-sm font-medium transition-colors"
                            >
                              Yönet
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredCompanies.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">Eşleşen kayıt bulunamadı.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {companyPageCount > 1 && <div className="mt-4 flex items-center justify-center gap-3">
                <button disabled={companyPage <= 1} onClick={() => setCompanyPage(page => page - 1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Önceki</button>
                <span className="text-xs text-neutral-400">Sayfa {companyPage} / {companyPageCount}</span>
                <button disabled={companyPage >= companyPageCount} onClick={() => setCompanyPage(page => page + 1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Sonraki</button>
              </div>}
            </div>
          )}

{activeTab === "tickets" && (
            <div className="p-4 sm:p-6">
              
              {/* 🚀 BİLET FİLTRELEME BUTONLARI */}
              <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6 border-b border-neutral-800 pb-4">
                 <button onClick={() => setTicketFilter("all")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${ticketFilter === "all" ? "bg-white text-black" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Tümü ({tickets.length})</button>
                 <button onClick={() => setTicketFilter("open")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${ticketFilter === "open" ? "bg-amber-500/20 text-amber-400 border border-amber-500/50" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Açık ({tickets.filter(t => !isResolvedTicket(t.status)).length})</button>
                 <button onClick={() => setTicketFilter("resolved")} className={`flex-1 sm:flex-none justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${ticketFilter === "resolved" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Çözüldü ({tickets.filter(t => isResolvedTicket(t.status)).length})</button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {visibleTickets.map(t => (
                  <div key={t.id} className="bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-2xl backdrop-blur-md p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors">
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
                            <span className={`shrink-0 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${isResolvedTicket(t.status) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {isResolvedTicket(t.status) ? 'Çözüldü' : 'Açık'}
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
                {filteredTickets.length === 0 && <div className="text-center py-12 text-neutral-500">Destek talebi bulunmuyor.</div>}
              </div>
              {ticketPageCount > 1 && <div className="mt-4 flex items-center justify-center gap-3">
                <button disabled={ticketPage <= 1} onClick={() => setTicketPage(page => page - 1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Önceki</button>
                <span className="text-xs text-neutral-400">Sayfa {ticketPage} / {ticketPageCount}</span>
                <button disabled={ticketPage >= ticketPageCount} onClick={() => setTicketPage(page => page + 1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Sonraki</button>
              </div>}
            </div>
          )}

          {activeTab === "referrals" && (
            <div className="overflow-x-auto">
              <div className="p-4 bg-neutral-800/20 border-b border-neutral-800 text-xs sm:text-sm font-medium text-neutral-300">
                <span className="text-rose-400 font-bold">{referrals.filter(r=>Number(r.is_verified) === 1).length}</span> Onaylı Davet &nbsp;&nbsp;|&nbsp;&nbsp;
                <span className="text-emerald-400 font-bold">{referrals.filter(r=>Number(r.is_verified) !== 1).length}</span> Bekleyen Davet
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
                    <tbody className="divide-y divide-white/5">
                      {referrals.map((r) => {
                        const referrerCompany = companyBySlug.get(r.referrer_company_slug);
                        return (
                          <tr key={r.id} className="hover:bg-neutral-800/20 transition-colors">
                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                              <div className="font-mono font-medium text-amber-400">{r.referrer_company_slug}</div>
                            </td>
                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                              <div className="font-mono font-medium text-blue-400">{r.referred_company_slug}</div>
                            </td>
                            <td className="px-4 py-3 sm:px-6 sm:py-4">
                              {Number(r.is_verified) === 1 ? (
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
        </div>
        </div>

      </div>

      {/* 🚀 MOBİL UYUM GÜNCELLEMESİ: Subscription Manage Modalı */}
      <AnimatePresence>
      {showManageModal && selectedCompany && (
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-black/80 backdrop-blur-sm sm:p-4 text-left overscroll-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-none sm:rounded-3xl w-full h-full sm:h-auto sm:w-[95%] sm:max-w-lg shadow-2xl relative flex flex-col overflow-hidden"
          >
            <div className="shrink-0 p-4 md:p-6 border-b border-white/10 relative bg-transparent">
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
                  <option value="active">Aktif (Gelir hesabına dahil / Kısıtlama yok)</option>
                  <option value="trialing">Deneme Sürümü (Trial)</option>
                  <option value="past_due">Paywall&apos;a Düşür (Ödeme Gecikti)</option>
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
                  <label htmlFor="cancelTrial" className="text-sm text-rose-300 font-medium cursor-pointer">Deneme sürümünü iptal et ve anında ödemeye (Paywall&apos;a) düşür</label>
                </div>
              )}
            </div>

            <div className="shrink-0 p-4 md:p-6 border-t border-white/10 bg-transparent pb-[max(1rem,env(safe-area-inset-bottom))]">
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
            className="bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-none sm:rounded-3xl w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[85vh] shadow-2xl relative flex flex-col overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-neutral-800 flex justify-between items-start shrink-0 bg-neutral-900">
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex flex-wrap items-center gap-2 mb-2 pr-12">
                        {selectedTicket.company_name || selectedTicket.company_slug}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isResolvedTicket(selectedTicket.status) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                           {isResolvedTicket(selectedTicket.status) ? 'Çözüldü' : 'Açık'}
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
            {!isResolvedTicket(selectedTicket.status) ? (
                <div className="p-4 sm:p-6 border-t border-white/10 bg-transparent sm:rounded-b-3xl shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
            className="bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-none sm:rounded-3xl w-full h-full sm:h-auto sm:w-[95%] sm:max-w-3xl shadow-2xl relative flex flex-col overflow-hidden"
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
              <button onClick={() => setInfoTab("genel")} className={`shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${infoTab === "genel" ? "bg-white text-black" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Genel Bilgiler</button>
              <button onClick={() => setInfoTab("istatistik")} className={`shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${infoTab === "istatistik" ? "bg-white text-black" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Sistem & Kasa</button>
              <button onClick={() => setInfoTab("abonelik")} className={`shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${infoTab === "abonelik" ? "bg-rose-500 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}>Abonelik & Gelir</button>
              <button onClick={() => setInfoTab("karlilik")} className={`shrink-0 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${infoTab === "karlilik" ? "bg-emerald-500 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"}`}><Activity size={14} /> Cloudflare Maliyeti</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 sm:p-6 overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
              {infoTab === "genel" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <InfoBox label="Sahibi / Yetkili" value={infoCompany.owner_name} />
                  <InfoBox label="Sektör" value={infoCompany.sector} />
                  <InfoBox label="Kayıt Tarihi" value={new Date(infoCompany.created_at).toLocaleDateString('tr-TR')} />
                  <InfoBox label="Vergi Bilgileri" value={infoCompany.tax_info} />
                  <InfoBox label="Açık Adres" value={infoCompany.address} fullWidth />
                  <InfoBox label="Referans Kodu" value={infoCompany.referral_code} />
                  <InfoBox label="Çalışma Günleri" value={infoCompany.work_days} />
                  <InfoBox label="Otomatik İş Kapasitesi" value={infoCompany.autopilot_daily_capacity_units != null ? `${infoCompany.autopilot_daily_capacity_units} birim/gün` : null} />
                  
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
                        const economics = infoDetails.economics || getSubscriptionEconomics(infoCompany, infoDetails.assets, globalPricing);
                        const basePrice = Number(economics.basePrice) || 0;
                        const assetPrice = Number(economics.assetPrice) || 0;
                        const assetCount = Number(economics.assetCount ?? infoDetails.assets) || 0;
                        const assetRevenue = Number(economics.assetTotal) || 0;
                        const totalRevenue = Number(economics.monthlyCharge) || 0;
                        const billable = Boolean(economics.billable);
                        const hasFreeMonth = Number(infoCompany.free_months_balance || 0) > 0;
                        const cloudflareAllocation = getCloudflareCostAllocation(infoCompany, companyInsights, cloudflareBilling);

                        let paymentStatusText = "Bilinmiyor";
                        let paymentStatusColor = "text-neutral-500";
                        let paymentBgColor = "bg-neutral-800";

                        if (billable) {
                            paymentStatusText = "GELİR HESABINA DAHİL";
                            paymentStatusColor = "text-emerald-400";
                            paymentBgColor = "bg-emerald-500/10 border-emerald-500/20";
                        } else if (Number(infoCompany.has_masterboss_gift) === 1) {
                            paymentStatusText = "VIP MUAFİYET";
                            paymentStatusColor = "text-blue-400";
                            paymentBgColor = "bg-blue-500/10 border-blue-500/20";
                        } else if (infoCompany.subscription_status === 'past_due') {
                            paymentStatusText = "GELİR HESABINA DAHİL DEĞİL (GECİKME)";
                            paymentStatusColor = "text-rose-400";
                            paymentBgColor = "bg-rose-500/10 border-rose-500/20";
                        } else if (infoCompany.subscription_status === 'trialing') {
                            paymentStatusText = hasFreeMonth ? "ÜCRETSİZ AY BAKİYESİ" : "DENEME SÜRÜMÜ";
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
                                  <div className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5 sm:mb-1">Gelir kuralı</div>
                                  <div className={`text-sm sm:text-lg font-black ${paymentStatusColor}`}>{paymentStatusText}</div>
                               </div>
                               <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black/20 flex items-center justify-center shrink-0">
                                  {billable ? <CheckCircle className={`w-4 h-4 sm:w-6 sm:h-6 ${paymentStatusColor}`} /> : <AlertCircle className={`w-4 h-4 sm:w-6 sm:h-6 ${paymentStatusColor}`} />}
                               </div>
                            </div>

                            <div className="bg-neutral-800/50 p-4 sm:p-6 rounded-2xl border border-neutral-800">
                              <h4 className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> Sizin abonelik geliriniz (Aylık)
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 border-b border-neutral-700 pb-4 mb-4">
                                <div>
                                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Taban Paket</div>
                                  <div className="text-base sm:text-lg font-bold text-white">
                                    ₺{billable ? basePrice : 0}
                                  </div>
                                  {hasFreeMonth && <div className="text-[8px] sm:text-[10px] text-rose-400 font-bold uppercase mt-0.5 sm:mt-1">Ref. İndirimi</div>}
                                </div>
                                <div>
                                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Varlık Kazanç ({assetPrice}₺)</div>
                                  <div className="text-base sm:text-lg font-bold text-blue-400">₺{billable ? assetRevenue : 0}</div>
                                  <div className="text-[8px] sm:text-[10px] text-neutral-500 uppercase mt-0.5 sm:mt-1">{assetCount} Cihaz</div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                  <div className="text-[10px] sm:text-xs font-bold text-neutral-400 mb-0.5 sm:mb-1 uppercase">Aylık Ücretli Gelir</div>
                                  <div className="text-lg sm:text-xl font-black text-white">₺{totalRevenue.toLocaleString('tr-TR')}</div>
                                </div>
                              </div>

                              <div className="mt-4 rounded-xl border border-sky-400/20 bg-sky-400/5 p-3 text-xs text-sky-200">
                                <div className="font-bold">Hesap kuralı</div>
                                <div className="mt-1 text-sky-200/70">{economics.exclusionReason ? `${economics.exclusionReason}; bu firma gelir hesabına dahil edilmedi.` : "Aktif abonelik + paket ücreti + (varlık sayısı × varlık başı ücret) uygulanıyor."} Tahsilat kanıtı olmadığı için bu tutar tahsil edilmiş ödeme değildir.</div>
                              </div>

                            </div>

                            <div className="bg-neutral-800/50 p-4 sm:p-6 rounded-2xl border border-neutral-800">
                              <h4 className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> Cloudflare maliyeti (işlem hacmine göre)
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
                                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Bu firmanın maliyet payı</div>
                                  {cloudflareAllocation.allocatedUsd !== null ? (
                                    <>
                                      <div className="text-base sm:text-lg font-black text-amber-300">USD {cloudflareAllocation.allocatedUsd.toLocaleString('tr-TR', { maximumFractionDigits: 6 })}</div>
                                      <div className="text-[10px] text-amber-200/70">₺{cloudflareAllocation.allocatedTry === null ? '—' : cloudflareAllocation.allocatedTry.toLocaleString('tr-TR', { maximumFractionDigits: 4 })}</div>
                                    </>
                                  ) : (
                                    <div className="text-base sm:text-lg font-black text-amber-300">Hesaplanıyor</div>
                                  )}
                                  <div className="text-[8px] sm:text-[10px] text-neutral-500 uppercase mt-0.5 sm:mt-1">Ağırlıklı kullanım payı: {cloudflareAllocation.sharePercent === null ? '—' : `%${cloudflareAllocation.sharePercent.toFixed(2)}`}</div>
                                </div>
                                <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-3">
                                  <div className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Cloudflare hesap geneli</div>
                                  {cloudflareAllocation.accountUsd !== null ? (
                                    <>
                                      <div className="text-base sm:text-lg font-black text-sky-300">USD {cloudflareAllocation.accountUsd.toLocaleString('tr-TR', { maximumFractionDigits: 4 })}</div>
                                      <div className="text-[10px] text-sky-200/70">₺{cloudflareAllocation.accountTry === null ? '—' : cloudflareAllocation.accountTry.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</div>
                                    </>
                                  ) : (
                                    <div className="text-base sm:text-lg font-black text-neutral-400">Veri alınamadı</div>
                                  )}
                                  <div className="text-[8px] sm:text-[10px] text-neutral-500 uppercase mt-0.5 sm:mt-1">Cloudflare Billing API</div>
                                </div>
                              </div>
                              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                                <InfoBox label="Varlık" value={infoDetails.assets} />
                                <InfoBox label="İş emri" value={infoDetails.jobs?.total} />
                                <InfoBox label="Fotoğraf" value={infoDetails.photos?.total} />
                                <InfoBox label="Maliyet endeksi" value={cloudflareAllocation.selected?.totalUnits} />
                              </div>
                              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">
                                <div className="font-bold">Maliyet nasıl hesaplandı?</div>
                                <div className="mt-1 text-amber-200/70">Cloudflare toplam hesabı veriyor. Firma payı; iş emri, fotoğraf, varlık, personel, müşteri, stok, BOM, sipariş, arıza ve acil durum hacimlerinin ağırlıklı kullanım endeksine göre dağıtılıyor. Bu bir ortak faturanın analitik firma payıdır; Cloudflare&apos;ın doğrudan firma faturası değildir.</div>
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
                            <div className="text-[10px] sm:text-sm text-rose-200">Bu ekrandaki tutar abonelik fiyatı ve kayıtlı varlık sayısından hesaplanan aylık gelirdir. Ödeme sağlayıcısı entegrasyonu olmadığı için tahsil edilmiş ödeme olarak yorumlanmaz.</div>
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

function AnalyticsDeck({
  companies,
  tickets,
  monthlyJobs,
  yearlyJobs,
  currentMonthNewCompanies,
  lastMonthNewCompanies,
  activeCompanies,
  trialingCompanies,
  pastDueCompanies,
  canceledCompanies,
  exemptCompanies,
  totalAssets,
  totalStaff,
  companyInsights,
  companyInsightsLoading,
  whatsappCompanies,
  globalPricing,
  cloudflareBilling,
}) {
  const openTickets = tickets.filter(ticket => !isResolvedTicket(ticket.status)).length;
  const resolvedTickets = tickets.length - openTickets;
  const riskCompanies = pastDueCompanies + canceledCompanies;
  const usageTotals = companyInsights.reduce((totals, company) => {
    const details = company.details || {};
    totals.jobs += Number(details.jobs?.total) || 0;
    totals.photos += Number(details.photos?.total) || 0;
    totals.monthlyPhotos += Number(details.photos?.monthly) || 0;
    totals.stock += Number(details.stock) || 0;
    totals.bomTemplates += Number(details.bomTemplates) || 0;
    totals.purchaseOrders += Number(details.purchaseOrders) || 0;
    totals.pendingPurchaseOrders += Number(details.pendingPurchaseOrders) || 0;
    totals.customers += Number(details.customers) || 0;
    totals.suppliers += Number(details.suppliers) || 0;
    totals.faults += Number(details.faults?.total) || 0;
    totals.activeFaults += Number(details.faults?.active) || 0;
    totals.emergencies += Number(details.emergencies?.total) || 0;
    totals.activeEmergencies += Number(details.emergencies?.active) || 0;
    totals.income += Number(details.finances?.income) || 0;
    totals.expense += Number(details.finances?.expense) || 0;
    return totals;
  }, { jobs: 0, photos: 0, monthlyPhotos: 0, stock: 0, bomTemplates: 0, purchaseOrders: 0, pendingPurchaseOrders: 0, customers: 0, suppliers: 0, faults: 0, activeFaults: 0, emergencies: 0, activeEmergencies: 0, income: 0, expense: 0 });
  const platformEconomics = companyInsights.reduce((totals, company) => {
    const details = company.details || {};
    const economics = company.economics || getSubscriptionEconomics(company, details.assets, globalPricing);
    const billable = Boolean(economics.billable);
    if (billable) {
      totals.subscriptionRevenue += Number(economics.monthlyCharge) || 0;
      totals.billableSubscriptions += 1;
      totals.billableAssets += Number(economics.assetCount) || 0;
    } else {
      totals.excludedSubscriptions += 1;
    }
    return totals;
  }, { subscriptionRevenue: 0, billableSubscriptions: 0, billableAssets: 0, excludedSubscriptions: 0 });
  const averageSubscriptionRevenue = platformEconomics.billableSubscriptions > 0
    ? platformEconomics.subscriptionRevenue / platformEconomics.billableSubscriptions
    : 0;
  const exactInfrastructureCost = Number.isFinite(Number(cloudflareBilling?.exactCost?.amount))
    ? Number(cloudflareBilling.exactCost.amount)
    : null;
  const infrastructureCurrency = cloudflareBilling?.exactCost?.currency || null;
  const usdTryRate = Number.isFinite(Number(cloudflareBilling?.usdTryRate))
    ? Number(cloudflareBilling.usdTryRate)
    : null;
  const infrastructureCostInTry = exactInfrastructureCost === null
    ? null
    : String(infrastructureCurrency || "").toUpperCase() === "TRY"
      ? exactInfrastructureCost
      : String(infrastructureCurrency || "").toUpperCase() === "USD" && usdTryRate !== null
        ? exactInfrastructureCost * usdTryRate
        : exactInfrastructureCost === 0
          ? 0
          : null;
  const portfolioData = [
    { name: "Ücretli aktif", value: activeCompanies, fill: "#34d399" },
    { name: "Deneme", value: trialingCompanies, fill: "#60a5fa" },
    { name: "Riskli", value: riskCompanies, fill: "#fb7185" },
    { name: "Muaf", value: exemptCompanies, fill: "#fbbf24" },
  ];
  const supportData = [
    { name: "Açık", value: openTickets, fill: "#fbbf24" },
    { name: "Çözüldü", value: resolvedTickets, fill: "#34d399" },
  ];
  const footprintData = [...companies]
    .sort((a, b) => (Number(b.total_assets) + Number(b.total_staff)) - (Number(a.total_assets) + Number(a.total_staff)))
    .slice(0, 5)
    .map(company => ({
      name: (company.company_name || company.slug || "Firma").slice(0, 18),
      varlık: Number(company.total_assets) || 0,
      personel: Number(company.total_staff) || 0,
    }));
  const volumeData = [
    { name: "İş", value: usageTotals.jobs || Number(yearlyJobs) || 0 },
    { name: "Fotoğraf", value: usageTotals.photos },
    { name: "Stok", value: usageTotals.stock },
    { name: "BOM", value: usageTotals.bomTemplates },
    { name: "Sipariş", value: usageTotals.purchaseOrders },
    { name: "Müşteri", value: usageTotals.customers },
    { name: "Tedarikçi", value: usageTotals.suppliers },
  ];
  const growthDelta = currentMonthNewCompanies - lastMonthNewCompanies;
  const actionItems = [
    { label: "Gecikmiş ödeme", value: pastDueCompanies, tone: "rose" },
    { label: "İptal edilen hesap", value: canceledCompanies, tone: "rose" },
    { label: "Deneme hesabı", value: trialingCompanies, tone: "blue" },
    { label: "Açık destek", value: openTickets, tone: "amber" },
  ].sort((a, b) => b.value - a.value);

  return (
    <section className="mb-7 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300">Analitik merkez</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">Sistemde ne oluyor?</h2>
          <p className="mt-1 text-sm text-neutral-500">Portföy, kullanım yoğunluğu ve aksiyon gerektiren alanlar.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Canlı veriler
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <ChartCard title="Firma portföyü" subtitle="Hesapların abonelik durumuna göre dağılımı">
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={portfolioData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" name="Firma" radius={[8, 8, 2, 2]} maxBarSize={54}>
                  {portfolioData.map(item => <Cell key={item.name} fill={item.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Abonelik karması" subtitle="Portföy sağlığı">
          <div className="flex h-64 items-center gap-3 sm:h-72">
            <div className="h-full min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie data={portfolioData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="86%" paddingAngle={4} stroke="none">
                    {portfolioData.map(item => <Cell key={item.name} fill={item.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-[104px] space-y-3">
              {portfolioData.map(item => (
                <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 text-neutral-400"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />{item.name}</span>
                  <strong className="text-white">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr_0.7fr]">
        <ChartCard title="En yoğun firmalar" subtitle="Varlık ve personel ayak izi">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={footprintData} layout="vertical" margin={{ top: 4, right: 16, left: 22, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.07)" />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis type="category" dataKey="name" width={88} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="varlık" name="Varlık" stackId="footprint" fill="#a78bfa" radius={[0, 5, 5, 0]} barSize={16} />
                <Bar dataKey="personel" name="Personel" stackId="footprint" fill="#38bdf8" radius={[0, 5, 5, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Platform kullanım hacmi" subtitle="Takip edilen toplam kaynaklar">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={volumeData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" name="Adet" fill="#f472b6" radius={[7, 7, 2, 2]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Aksiyon kuyruğu" subtitle="Bugün ilgilenilmesi gerekenler">
          <div className="space-y-3 pt-2">
            {actionItems.map(item => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs text-neutral-400"><i className={`h-2 w-2 rounded-full ${item.tone === "rose" ? "bg-rose-400" : item.tone === "amber" ? "bg-amber-400" : "bg-sky-400"}`} />{item.label}</span>
                <span className="text-sm font-black text-white">{item.value}</span>
              </div>
            ))}
            <div className={`mt-4 rounded-xl border px-3 py-3 text-xs ${growthDelta >= 0 ? "border-emerald-400/15 bg-emerald-400/5 text-emerald-300" : "border-rose-400/15 bg-rose-400/5 text-rose-300"}`}>
              {growthDelta >= 0 ? "Bu ay büyüme sinyali" : "Bu ay yeni firma sayısı geriledi"}: geçen aya göre {Math.abs(growthDelta)} firma.
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartCard title="Özellik kullanım haritası" subtitle="Platformdaki gerçek operasyon yoğunluğu">
          {companyInsightsLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-neutral-500">Firma kullanım verileri yükleniyor...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
              <UsageMetric label="Fotoğraf arşivi" value={usageTotals.photos} note={`Bu ay +${usageTotals.monthlyPhotos}`} tone="pink" />
              <UsageMetric label="QR erişime hazır varlık" value={totalAssets} note="Gerçek baskı adedi henüz ölçülmüyor" tone="violet" />
              <UsageMetric label="WhatsApp entegrasyonu" value={whatsappCompanies} note={`${whatsappCompanies} / ${companies.length || 0} firma · gönderim ölçümü yok`} tone="emerald" />
              <UsageMetric label="Stok kalemi" value={usageTotals.stock} note="Stok modülünü kullanan kayıtlar" tone="amber" />
              <UsageMetric label="BOM şablonu" value={usageTotals.bomTemplates} note={`${usageTotals.purchaseOrders} satın alma siparişi`} tone="purple" />
              <UsageMetric label="Müşteri / tedarikçi" value={`${usageTotals.customers} / ${usageTotals.suppliers}`} note="Toplam kayıt" tone="sky" />
              <UsageMetric label="Arıza / acil durum" value={`${usageTotals.faults} / ${usageTotals.emergencies}`} note={`${usageTotals.activeFaults + usageTotals.activeEmergencies} aktif kayıt`} tone="rose" />
            </div>
          )}
        </ChartCard>

        <ChartCard title="Platform geliri ve gerçek gider durumu" subtitle="Yalnızca ücretlendirilen abonelikler">
          {companyInsightsLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-neutral-500">Finans verileri yükleniyor...</div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <FinanceMetric label="Aylık abonelik geliri" value={platformEconomics.subscriptionRevenue} tone="emerald" />
                <UsageMetric label="Ücretli abonelik" value={platformEconomics.billableSubscriptions} note={`${platformEconomics.billableAssets} ücretli varlık`} tone="sky" />
                <FinanceMetric label="Abonelik başı ortalama" value={averageSubscriptionRevenue} tone="sky" />
                <UsageMetric label="Gelir dışı hesap" value={platformEconomics.excludedSubscriptions} note="Deneme / muaf / hediye / gecikmiş" tone="amber" />
              </div>
              {exactInfrastructureCost !== null ? (
                <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-3 text-xs text-sky-200">
                  <div className="font-bold">Cloudflare gerçek kullanım gideri bağlandı</div>
                  <div className="mt-1 text-sky-200/70">Bu dönemin Cloudflare kullanım toplamı: USD {exactInfrastructureCost.toLocaleString("tr-TR", { maximumFractionDigits: 4 })} · ₺{infrastructureCostInTry === null ? "—" : infrastructureCostInTry.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}.</div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">
                  <div className="font-bold">Kesin altyapı gideri henüz alınamıyor</div>
                  <div className="mt-1 text-amber-200/70">{cloudflareBilling?.configured ? "Cloudflare bağlı, ancak API bu dönem için açık bir maliyet tutarı döndürmedi." : "Cloudflare Billing API hesabı ve tokenı henüz Worker'a eklenmedi. Tahmin üretmiyorum."}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><span className="text-neutral-500">Hesaplanan brüt gelir</span><strong className="mt-1 block text-emerald-300">₺{platformEconomics.subscriptionRevenue.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</strong></div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><span className="text-neutral-500">Kesin net kâr</span><strong className="mt-1 block text-neutral-400">—</strong><span className="mt-1 block text-[10px] text-neutral-600">Gider kaynağı bekleniyor</span></div>
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </section>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11151f] p-4 shadow-xl shadow-black/10 sm:p-5">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#090b10]/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
      <div className="mb-1 text-neutral-500">{label}</div>
      {payload.map(item => <div key={item.dataKey} className="font-bold text-white">{item.name}: {Number(item.value || 0).toLocaleString("tr-TR")}</div>)}
    </div>
  );
}

function UsageMetric({ label, value, note, tone }) {
  const tones = {
    pink: "border-pink-400/15 bg-pink-400/5 text-pink-300",
    violet: "border-violet-400/15 bg-violet-400/5 text-violet-300",
    purple: "border-purple-400/15 bg-purple-400/5 text-purple-300",
    emerald: "border-emerald-400/15 bg-emerald-400/5 text-emerald-300",
    amber: "border-amber-400/15 bg-amber-400/5 text-amber-300",
    sky: "border-sky-400/15 bg-sky-400/5 text-sky-300",
    rose: "border-rose-400/15 bg-rose-400/5 text-rose-300",
  };
  return <div className={`rounded-xl border p-3 ${tones[tone] || tones.sky}`}><div className="text-[11px] font-semibold text-neutral-300">{label}</div><div className="mt-2 text-xl font-black text-white">{typeof value === "number" ? value.toLocaleString("tr-TR") : value}</div><div className="mt-1 text-[10px] text-neutral-500">{note}</div></div>;
}

function FinanceMetric({ label, value, tone }) {
  const colors = { emerald: "text-emerald-300", rose: "text-rose-300", sky: "text-sky-300" };
  return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><span className="text-[10px] text-neutral-500">{label}</span><strong className={`mt-1 block truncate text-sm font-black ${colors[tone] || colors.sky}`}>₺{Number(value || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</strong></div>;
}

function MiniStat({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.03]">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="text-sm font-bold text-neutral-200">{Number(value || 0).toLocaleString("tr-TR")}</span>
    </div>
  );
}

function OverviewCard({ icon: Icon, label, value, detail, tone }) {
  const toneStyles = {
    blue: "text-blue-300 bg-blue-400/10 border-blue-300/15",
    rose: "text-rose-300 bg-rose-400/10 border-rose-300/15",
    amber: "text-amber-300 bg-amber-400/10 border-amber-300/15",
    violet: "text-violet-300 bg-violet-400/10 border-violet-300/15",
    indigo: "text-indigo-300 bg-indigo-400/10 border-indigo-300/15",
    emerald: "text-emerald-300 bg-emerald-400/10 border-emerald-300/15",
    cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-300/15",
    orange: "text-orange-300 bg-orange-400/10 border-orange-300/15"
  };

  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5 transition-colors hover:bg-white/[0.06] sm:p-4">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${toneStyles[tone] || toneStyles.blue}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate text-xs font-semibold text-neutral-400">{label}</span>
      </div>
      <div className="mt-4 truncate text-2xl font-black tracking-tight text-white">{Number(value || 0).toLocaleString("tr-TR")}</div>
      <div className="mt-1 min-h-8 text-xs leading-relaxed text-neutral-500">{detail}</div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, ext, color }) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden group flex flex-col justify-between shadow-xl"
    >
      <div className={`absolute -right-4 -top-4 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br ${color} opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
      <div className="flex justify-between items-start mb-2 sm:mb-4 relative z-10">
        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${color} p-[1px] flex items-center justify-center shadow-lg shadow-black/50`}>
          <div className="w-full h-full bg-neutral-900/80 backdrop-blur-sm rounded-[10px] sm:rounded-[14px] flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-xl sm:text-3xl font-black text-white mb-0.5 sm:mb-1 tracking-tight truncate drop-shadow-md">{value}</div>
        <div className="text-[10px] sm:text-sm font-medium text-neutral-300 mb-0.5 sm:mb-1 leading-tight">{label}</div>
        <div className="text-[9px] sm:text-xs text-neutral-400 leading-tight truncate">{ext}</div>
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold transition-all duration-300 shrink-0 overflow-hidden sm:gap-2 sm:px-4 sm:py-3 sm:text-sm lg:w-full lg:flex-none lg:justify-start ${
        active 
          ? "text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10" 
          : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-white/5"
      }`}
    >
      {active && (
        <motion.div 
          layoutId="activeTab" 
          className="absolute inset-0 bg-gradient-to-r from-rose-500/80 to-purple-600/80 backdrop-blur-md" 
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
        <span className="truncate">{label}</span>
      </div>
    </button>
  );
}

function InfoBox({ label, value, fullWidth = false }) {
  const displayValue = value === null || value === undefined || value === '' ? '-' : value;
  return (
    <div className={`bg-white/5 border border-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-inner ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
      <div className="text-[10px] sm:text-xs font-medium text-neutral-400 mb-0.5 sm:mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-xs sm:text-sm text-white font-semibold break-words">{displayValue}</div>
    </div>
  );
}
