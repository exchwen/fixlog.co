'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Users, Box, Wallet, Plus, ArrowUpRight, 
  CheckCircle, Clock, Calendar, TrendingUp, TrendingDown, 
  Package, AlertTriangle, ShieldCheck, Activity, User, Lock, RefreshCw,
  Settings, X, Wrench, Link as LinkIcon, Check, Database, ImageIcon, ShoppingCart, UserCircle, Briefcase, Loader2, Bell, CheckSquare, UserPlus, UserCheck, MapPin, AlertCircle, Info, ShieldAlert, ArrowRight, Gift, Star, CreditCard, Copy, FileText
} from 'lucide-react';

export default function HomeTab({ data, setShowJobModal, statusColors, setSelectedJob, setActiveTab, userRole: propRole, handleAction, isMyJobsTab, setJobModalType }: any) {
  
  const { slug } = useParams(); 

  const isPatronPath = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard');
  const userRole = propRole || (isPatronPath ? 'Patron' : 'Yönetici');

  const [currentUserName, setCurrentUserName] = useState<string>('Yönetici');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false); 
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });

  const [newJobNotification, setNewJobNotification] = useState<{show: boolean, jobName: string}>({show: false, jobName: ''});
  const prevJobIds = useRef<string[]>([]);

  // 🚀 YENİ: Malzeme Talep Modal State'leri
  const [selectedMaterialRequest, setSelectedMaterialRequest] = useState<any>(null);
  const materialRequests = data?.pendingMaterialRequests || [];

  useEffect(() => {
    const prefix = isPatronPath ? 'patron_' : 'staff_';
    const savedName = localStorage.getItem(`${prefix}userName`);
    
    const token = localStorage.getItem(`${prefix}authToken`);
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const payload = JSON.parse(jsonPayload);
            setCurrentUserId(String(payload.id));
        } catch(e) {}
    }

    if (savedName) {
      setCurrentUserName(savedName.split(' ')[0]); 
    } else if (data?.ownerName && isPatronPath) {
      setCurrentUserName(data.ownerName.split(' ')[0]);
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
  }, [isPatronPath, data]);

  const [copied, setCopied] = useState(false);

  const isProfileComplete = data?.name && data?.ownerName && data?.sector && data?.address && data?.phone && data?.taxInfo;

  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showOrderMenu, setShowOrderMenu] = useState(false); 

  const jobs = data?.jobs || [];
  const finances = data?.finances || [];
  const stock = data?.stock || [];
  const staff = data?.staff || [];

// 🚀 YENİ: DENEME SÜRÜMÜ VE NORMAL FATURA GERİ SAYIM HESAPLAMASI
const { daysLeft, showWarning, warningType, warningMessage, warningTitle } = useMemo(() => {
    const subStatus = data?.subscription_status;
    const freeMonths = data?.free_months_balance || 0;
    const isExempt = data?.has_masterboss_gift === 1 || data?.has_masterboss_gift === true || String(data?.has_masterboss_gift) === 'true';
  let endDateStr = null;
  let type = 'trial';

  // Eğer kullanıcı muaf ise (veya zaten iptal/gecikmedeyse) ekstra gün sayımı uyarısına gerek yok.
  if (isExempt || subStatus === 'past_due' || subStatus === 'canceled') {
      return { daysLeft: null, showWarning: false, warningType: type, warningMessage: '', warningTitle: '' };
  }

  if (subStatus === 'trialing' && data?.trial_ends_at) {
      endDateStr = data.trial_ends_at;
      type = 'trial';
  } else if (subStatus === 'active' && data?.billing_cycle_anchor) {
      endDateStr = data.billing_cycle_anchor;
      type = 'active';
  }

  if (!endDateStr) {
      return { daysLeft: null, showWarning: false, warningType: type, warningMessage: '', warningTitle: '' };
  }
  
  const today = new Date();
  const endDate = new Date(endDateStr);
  
  // Saat farklarını sıfırlayarak net gün farkını bulalım
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Eğer firmanın hediye ayı varsa normal fatura ödeme uyarısı gösterme, darlamayalım.
  const isFree = type === 'active' && freeMonths > 0;
  const shouldShow = diffDays <= 7 && !isFree;

  let title = '';
  let message = '';

  if (shouldShow) {
      if (type === 'trial') {
          title = diffDays <= 0 ? 'Deneme Süreniz Doldu!' : 'Deneme Süreniz Sona Eriyor';
          message = diffDays <= 0 
              ? 'Bugün ödeme için son gün! Ödeme yapmazsanız gün sonunda hesabınız kısıtlanacaktır fakat verileriniz güvenle korunacaktır.' 
              : `Ödemenize son ${diffDays} gün kaldı. Deneme sürümü bitince ödeme yapmazsanız hesabınız kısıtlanacaktır.`;
      } else {
          title = diffDays <= 0 ? 'Fatura Ödeme Günü!' : 'Fatura Kesim Tarihiniz Yaklaşıyor';
          message = diffDays <= 0 
              ? 'Bugün ödeme için son gün! Ödeme yapmazsanız erişiminiz kısıtlanacaktır.' 
              : `Ödemenize son ${diffDays} gün kaldı. Ödeme yapmazsanız hesabınız kısıtlanacaktır.`;
      }
  }
  
  return { 
      daysLeft: diffDays, 
      showWarning: shouldShow, 
      warningType: type,
      warningTitle: title,
      warningMessage: message
  };
}, [data?.subscription_status, data?.trial_ends_at, data?.billing_cycle_anchor, data?.free_months_balance, data?.has_masterboss_gift]);

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j: any) => j.status === 'Tamamlandı').length;
  const pendingJobs = jobs.filter((j: any) => j.status === 'Beklemede' || j.status === 'Devam Ediyor').length;
  const plannedJobs = jobs.filter((j: any) => j.status === 'Gelecek').length;

  // 🚀 YENİ: Onay Bekleyen Kasa İşlemleri (Sadece Patron veya Yetkili Görecek)
  const pendingFinances = useMemo(() => {
    return finances.filter((f: any) => f.status === 'Bekliyor');
  }, [finances]);

  // 🚀 YENİ: Yaklaşan Periyodik Bakımlar (Son 30 gün kalanlar veya gecikenler)
  const upcomingMaintenances = useMemo(() => {
    const maintenances = data?.maintenances || [];
    return maintenances.filter((m: any) => {
        if (m.status === 'Tamamlandı') return false;
        if (!m.next_date) return false;
        const nextDate = new Date(m.next_date);
        const today = new Date();
        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // 30 günden az kalmışsa VEYA tarihi geçmişse (negatif değer) listele
        return diffDays <= 30; 
    }).sort((a: any, b: any) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime());
  }, [data?.maintenances]);

  // 🚀 TÜM İŞLERİ KİMLİĞE VE DURUMA GÖRE FİLTRELEME
  const { incomingJobs, waitingForAssignmentJobs } = useMemo(() => {
    if (!currentUserId || userRole === 'Patron') {
        return { incomingJobs: [], waitingForAssignmentJobs: [] };
    }

    const incoming: any[] = [];
    const waiting: any[] = [];

    jobs.forEach((j: any) => {
        const isCreatedByMe = (j.creator_name === currentUserName) || (j.details?.createdBy === currentUserName);
        const isAssignedToMe = String(j.manager_id) === String(currentUserId) || 
                               String(j.details?.managerId) === String(currentUserId) || 
                               String(j.staff_id) === String(currentUserId);
                               
        const hasWorker = !!j.worker_id || !!j.details?.worker_id;

        if (!isCreatedByMe && !isAssignedToMe) return;
        if (j.status === 'İptal' || j.status === 'Tamamlandı') return;

        if ((j.status === 'Beklemede' || j.status === 'Gelecek') && isAssignedToMe && !hasWorker && !isCreatedByMe) {
            incoming.push(j);
            return;
        }

        if (j.status === 'Usta Bekliyor' && isAssignedToMe && !hasWorker) {
            waiting.push(j);
            return;
        }
    });

    return { incomingJobs: incoming, waitingForAssignmentJobs: waiting };
  }, [jobs, currentUserId, currentUserName, userRole]);

  useEffect(() => {
    if (incomingJobs.length > 0) {
        const currentIds = incomingJobs.map((j: any) => String(j.id));
        
        if (prevJobIds.current.length > 0) {
            const newIds = currentIds.filter((id: string) => !prevJobIds.current.includes(id));
            if (newIds.length > 0) {
                const newlyAddedJob = incomingJobs.find((j: any) => String(j.id) === newIds[0]);
                if (newlyAddedJob) {
                    setNewJobNotification({ show: true, jobName: newlyAddedJob.customer_name || 'Yeni İş' });
                    
                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                        new Notification('Yeni İş Atandı!', {
                            body: `${newlyAddedJob.customer_name} müşterisi için size yeni bir görev atandı.`,
                            icon: '/favicon.ico'
                        });
                    }

                    setTimeout(() => setNewJobNotification({ show: false, jobName: '' }), 5000);
                }
            }
        }
        prevJobIds.current = currentIds;
    }
  }, [incomingJobs]);

  const handleApproveJob = async (job: any) => {
    if (!handleAction) {
        setAlertModal({ isOpen: true, message: "Sistem hatası: İşlem fonksiyonu bulunamadı.", type: 'error' });
        return;
    }
    
    setIsApproving(job.id);
    
    try {
        const isGeneralJob = job.work_type === 'Genel Görev';
        const newStatus = isGeneralJob ? 'Devam Ediyor' : 'Usta Bekliyor';

        const success = await handleAction('update-job', {
            id: job.id,
            status: newStatus,
            lastEditedBy: currentUserName,
        }, null, null);

        if (success) {
            setShowSuccessModal(true); 
            setTimeout(() => setShowSuccessModal(false), 2500); 
            if (setShowJobModal) setShowJobModal(false); 
        }
    } catch (e) {
        console.error(e);
        setAlertModal({ isOpen: true, message: "Bir hata oluştu.", type: 'error' });
    } finally {
        setIsApproving(null);
    }
  };

  const handleAssignWorker = (job: any) => {
    if (setJobModalType) setJobModalType('ASSIGN');
    setSelectedJob(job);
  };

  const handleApproveMaterial = async () => {
    if (!selectedMaterialRequest || !handleAction) return;
    setIsApproving(selectedMaterialRequest.id);
    try {
        const success = await handleAction('resolve-material', { id: selectedMaterialRequest.id }, null, null);
        if (success) {
            setAlertModal({ isOpen: true, message: "Malzeme talebi onaylandı ve stoklardan düşüldü.", type: 'success' });
            setSelectedMaterialRequest(null);
        }
    } catch (e) {
        setAlertModal({ isOpen: true, message: "İşlem sırasında hata oluştu.", type: 'error' });
    } finally {
        setIsApproving(null);
    }
  };

  const { currentMonthJobs, lastMonthJobs, growthPercent, isGrowthPositive, monthlyPhotos } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let currentCount = 0;
    let lastCount = 0;
    let photosThisMonth = 0;

    jobs.forEach((j: any) => {
      if (!j.created_at) return;
      const jobDate = new Date(j.created_at);
      if (jobDate.getFullYear() === currentYear) {
        if (jobDate.getMonth() === currentMonth) {
            currentCount++;
            photosThisMonth += (j.photos?.length || 0); 
        }
        if (jobDate.getMonth() === currentMonth - 1) lastCount++;
      }
    });

    const diff = currentCount - lastCount;
    const percent = lastCount === 0 ? (currentCount > 0 ? 100 : 0) : (diff / lastCount) * 100;

    return {
      currentMonthJobs: currentCount,
      lastMonthJobs: lastCount,
      growthPercent: Math.abs(percent).toFixed(1),
      isGrowthPositive: percent >= 0,
      monthlyPhotos: photosThisMonth
    };
  }, [jobs]);

  const totalLifetimePhotos = jobs.reduce((sum: number, j: any) => sum + (j.photos?.length || 0), 0);
  const totalCustomersCount = data?.stats?.customers || data?.customers?.length || 0;
  const totalAssetsCount = data?.stats?.assets || data?.assets?.length || 0;
  const totalStockTypes = data?.stats?.stock || stock.length;

  const { usagePaid, totalSystemProfit, currentUsageBill, baseMonthlyFee, referralCredits, finalBill, referralCode, subStatus, nextBillingDate, activeReferrals, isExempt } = useMemo(() => {
    const earliestDate = jobs.length > 0 
      ? new Date(Math.min(...jobs.map((j: any) => new Date(j.created_at || new Date()).getTime()))) 
      : new Date();
    
      const calculatedMonths = (new Date().getFullYear() - earliestDate.getFullYear()) * 12 + new Date().getMonth() - earliestDate.getMonth() + 1;
          const finalMonthsUsed = Math.max(1, calculatedMonths); 
          
          const exemptStatus = data?.has_masterboss_gift === 1 || data?.has_masterboss_gift === true || String(data?.has_masterboss_gift) === 'true';
    // Veritabanından gelen dinamik değerleri kullan (Eğer custom girilmemişse Global'den beslen)
   const baseFee = data?.custom_base_price !== undefined && data?.custom_base_price !== null ? Number(data.custom_base_price) : Number(data?.global_base_price || 3000);        
   const perAssetFee = data?.custom_per_asset_price !== undefined && data?.custom_per_asset_price !== null ? Number(data.custom_per_asset_price) : Number(data?.global_asset_price || 50);      

   // Tüm zamanlar ödenen tahmini tutar (sabit fiyat üzerinden hesaplıyoruz)
   const uPaid = exemptStatus ? 0 : finalMonthsUsed * (baseFee + (totalAssetsCount * perAssetFee));
   
   // Bu ayki standart fatura (Masterboss ile birebir aynı)
   const cUsageBill = exemptStatus ? 0 : baseFee + (totalAssetsCount * perAssetFee);

    const operationalSavings = totalJobs * 150; 
    const printAndStorageSavings = totalLifetimePhotos * 5; 
    const profit = operationalSavings + printAndStorageSavings;

// 🚀 YENİ: Abonelik ve Referans Hesaplamaları
const refCode = data?.referralCode || data?.referral_code || 'BEKLENİYOR...';
const aReferrals = data?.free_months_balance || 0; // Kumbarada biriken toplam hediye ay (Otomatik Referans)
    
    // Sadece referans ise taban ücreti (baseFee) kadar indirim uygula.
    let rCredits = 0;
    let fBill = cUsageBill;

    if (exemptStatus) {
        rCredits = 0;
        fBill = 0;
    } else if (aReferrals > 0) {
        rCredits = baseFee; // Sadece taban ücreti sil
        fBill = Math.max(0, cUsageBill - rCredits);
    }
    
    const sStatus = exemptStatus ? 'VIP Muaf' : (data?.subscription_status === 'active' ? 'Aktif' : (data?.subscription_status === 'past_due' ? 'Ödeme Bekliyor' : (data?.subscription_status === 'canceled' ? 'İptal Edildi' : 'Deneme Sürümü')));
    const nBillingDate = data?.nextBillingDate || 'Belirlenmedi';

    return { 
        usagePaid: uPaid, 
        totalSystemProfit: profit, 
        currentUsageBill: cUsageBill, 
        baseMonthlyFee: baseFee,
        referralCredits: rCredits,
        finalBill: fBill,
        referralCode: refCode,
        subStatus: sStatus,
        nextBillingDate: nBillingDate,
        activeReferrals: aReferrals,
        isExempt: exemptStatus,
        hasMasterbossGift: exemptStatus
    };
  }, [jobs, totalJobs, totalLifetimePhotos, totalAssetsCount, data]);

  const totalIncome = data?.finSummary?.income || 0;
  const totalExpense = data?.finSummary?.expense || 0;
  const netCash = totalIncome - totalExpense;
  const recentFinances = finances.slice(0, 4);

  const miniChartPoints = useMemo(() => {
    const chartData = [...finances].reverse().slice(-10).map((f: any) => 
      f.type === 'Gelir' ? Number(f.amount) : -Math.abs(Number(f.amount))
    );
    
    if (chartData.length === 0) return null;
    
    const max = Math.max(...chartData);
    const min = Math.min(...chartData);
    const range = max - min || 1;
    
    return chartData.map((val, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = 40 - ((val - min) / range) * 40;
      return `${x},${y}`;
    }).join(' ');
  }, [finances]);

  const lowStockItems = stock.filter((s: any) => Number(s.quantity) <= 5);

  const handleCopyLink = () => {
    const loginUrl = `${window.location.origin}/${slug}/login`;
    navigator.clipboard.writeText(loginUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDynamicStatus = (job: any, hasWorker: boolean) => {
    let label = job.status || 'Beklemede';

    if (label === 'Usta Bekliyor' || label === 'Devam Ediyor') {
        label = hasWorker ? 'Devam Ediyor' : 'Usta Bekliyor';
    }

    let colorClass = statusColors[label] || 'bg-slate-100 text-slate-500 border-slate-200';

    if ((label === 'Gelecek' || label === 'Beklemede' || label === 'Usta Bekliyor') && job.scheduled_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sDate = new Date(job.scheduled_date.split(' ')[0]);
        sDate.setHours(0, 0, 0, 0);

        if (sDate < today) {
            label = 'Gecikti';
            colorClass = 'bg-rose-100 text-rose-700 border-rose-200';
        }
    }
    return { label, colorClass };
  };

  if (!isProfileComplete) {
    return (
      <div className="relative h-[80vh] flex flex-col items-center justify-center bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden p-4">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-orange-400"></div>
        
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-10 flex flex-col items-center text-center p-6 sm:p-8 max-w-md w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100 shadow-inner">
            <Lock size={28} className="text-rose-500 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3">Sistem Kilitli</h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 sm:mb-8 font-medium leading-relaxed">
            İşletme hesabınızı kullanmaya başlamadan önce firma ünvanı, iletişim ve adres gibi temel ayarlarınızı eksiksiz doldurmanız gerekmektedir.
          </p>
          <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 sm:mb-8 text-left space-y-2.5">
             <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
               <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${data?.name ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> Firma Ünvanı ve Yetkili
             </div>
             <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
               <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${data?.phone ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> İletişim Numarası
             </div>
             <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
               <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${data?.address ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> Açık Adres Bilgisi
             </div>
             <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
               <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${data?.taxInfo ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> Vergi Bilgileri
             </div>
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-blue-600 flex items-center justify-center gap-2 bg-blue-50 px-4 py-3 rounded-lg border border-blue-100 w-full">
            <Settings size={16} className="shrink-0" /> <span className="text-center">Lütfen sol menüden "Ayarlar" sekmesine gidin.</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">
      
      {/* 🚀 YENİ: DENEME SÜRÜMÜ VE FATURA BİTİŞ UYARI ÇUBUĞU */}
      <AnimatePresence>
        {showWarning && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className={`w-full rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border ${(daysLeft ?? 0) <= 0 ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${(daysLeft ?? 0) <= 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>
                        {(daysLeft ?? 0) <= 0 ? <Lock size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div>
                        <h3 className={`text-sm font-black ${(daysLeft ?? 0) <= 0 ? 'text-rose-800' : 'text-amber-800'}`}>
                            {warningTitle}
                        </h3>
                        <p className={`text-xs font-medium mt-0.5 ${(daysLeft ?? 0) <= 0 ? 'text-rose-600' : 'text-amber-700'}`}>
                            {warningMessage}
                        </p>
                    </div>
                </div>
                {userRole === 'Patron' && (
                    <button 
                        onClick={() => { if (setActiveTab) setActiveTab('settings'); }} 
                        className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${(daysLeft ?? 0) <= 0 ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                    >
                        Ödeme Yap
                    </button>
                )}
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {newJobNotification.show && (
            <motion.div 
                initial={{ opacity: 0, y: -50, x: '-50%' }} 
                animate={{ opacity: 1, y: 0, x: '-50%' }} 
                exit={{ opacity: 0, y: -50, x: '-50%' }}
                className="fixed top-6 left-1/2 z-[200] bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-500"
            >
                <div className="bg-white/20 p-2 rounded-full animate-pulse">
                    <Bell size={18} className="text-white" />
                </div>
                <div>
                    <h4 className="text-sm font-black tracking-wide">Yeni Görev Atandı!</h4>
                    <p className="text-[11px] text-blue-100 font-medium">"{newJobNotification.jobName}" için atama yapıldı.</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLowStockModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                   <AlertTriangle size={18} className="text-amber-500" /> Kritik Stoklar
                </h3>
                <button onClick={() => setShowLowStockModal(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-md transition-colors"><X size={18} /></button>
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                {lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl group gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.item_name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.supplier_name || 'Tedarikçi Kaydı Yok'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="text-sm font-black text-amber-600 bg-amber-100 px-2.5 py-1 rounded-md">
                         {item.quantity} <span className="text-[10px] uppercase">{item.unit_name}</span>
                       </div>
                       <button 
                         onClick={() => {
                           setShowLowStockModal(false);
                           if (setActiveTab) setActiveTab('stock');
                         }}
                         className="px-2.5 py-1.5 bg-white border border-slate-200 text-blue-600 rounded-md text-[10px] font-bold hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95 shadow-sm flex items-center gap-1"
                         title="Stok Sayfasına Git"
                       >
                         Stoğa Git <ArrowUpRight size={12} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowLowStockModal(false)} className="w-full mt-5 bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors active:scale-95">
                Kapat
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-start gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Hoş Geldin, {currentUserName} 👋
          </h2>
          <p className="text-slate-500 text-xs mt-1">Sistem üzerindeki anlık özetin aşağıdadır.</p>
        </div>
        <button 
          onClick={handleCopyLink} 
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm border border-slate-200 w-fit"
        >
           {copied ? <Check size={14} className="text-emerald-500" /> : <LinkIcon size={14} className="text-slate-400" />}
           {copied ? 'Bağlantı Kopyalandı' : 'Personel Giriş Linkini Kopyala'}
        </button>
      </div>

      {/* 🚀 YENİ: Yaklaşan Periyodik Bakımlar Modülü */}
      {upcomingMaintenances.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-cyan-600 rounded-3xl p-5 shadow-xl shadow-cyan-600/20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="relative z-10">
              <h2 className="text-xs font-black text-cyan-100 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-cyan-400/30 pb-2">
                 <Wrench size={16} /> Yaklaşan Periyodik Bakımlar ({upcomingMaintenances.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {upcomingMaintenances.slice(0, 3).map((m: any) => {
                    const daysDiff = Math.ceil((new Date(m.next_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isOverdue = daysDiff < 0;

                    return (
                        <div key={m.id} className="bg-cyan-950/40 border border-cyan-400/30 rounded-2xl p-4 flex flex-col justify-between hover:bg-cyan-950/60 transition-colors">
                            <div className="mb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${isOverdue ? 'bg-rose-500 text-white' : 'bg-white/20 text-white'}`}>
                                        {isOverdue ? 'GECİKTİ' : 'YAKLAŞIYOR'}
                                    </span>
                                </div>
                                <h3 className="text-sm font-black leading-tight mb-0.5 line-clamp-2">
                                    {m.customer_name}
                                </h3>
                                <div className="text-[10px] font-bold text-cyan-200/80 mb-2 truncate">
                                    {m.equipment}
                                </div>
                                <p className={`text-[11px] font-bold flex items-center gap-1.5 truncate ${isOverdue ? 'text-rose-300' : 'text-cyan-100'}`}>
                                    <Clock size={12} className="shrink-0 opacity-70"/> 
                                    {isOverdue ? `${Math.abs(daysDiff)} gün gecikti` : `${daysDiff} gün kaldı`} ({new Date(m.next_date).toLocaleDateString('tr-TR')})
                                </p>
                            </div>
                            
                            {/* 🚀 DÜZELTME: Doğru sekmeye yönlendirme yapıldı */}
                            <button
                                onClick={() => { 
                                    if (userRole === 'Usta') {
                                       setAlertModal({ isOpen: true, message: "Yaklaşan bakımlar yönetici/patron tarafından size iş olarak atandığında 'Bekleyen İşler' ekranınıza düşecektir.", type: 'info' });
                                    } else if (setActiveTab) {
                                       setActiveTab('periodic'); 
                                    }
                                }}
                                className="mt-2 w-full bg-white text-cyan-700 hover:bg-cyan-50 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ArrowRight size={14} /> {userRole === 'Usta' ? 'BİLGİ AL' : 'YÖNETİME GİT'}
                            </button>
                        </div>
                    );
                 })}
                 {upcomingMaintenances.length > 3 && (
                     <div 
                        onClick={() => { 
                            if (userRole !== 'Usta' && setActiveTab) setActiveTab('periodic'); 
                        }}
                        className={`bg-cyan-900/50 border border-cyan-400/30 rounded-2xl p-4 flex flex-col justify-center items-center transition-colors ${userRole !== 'Usta' ? 'cursor-pointer hover:bg-cyan-800/50' : 'opacity-70'}`}
                     >
                         <span className="text-2xl font-black text-cyan-200 mb-1">+{upcomingMaintenances.length - 3}</span>
                         <span className="text-xs font-bold text-cyan-100">Tümünü Gör</span>
                     </div>
                 )}
              </div>
           </div>
        </motion.div>
      )}

      {/* 🚀 YENİ: Kasa Onay Bekleyenler Modülü (Sadece Patron Görür) */}
      {pendingFinances.length > 0 && userRole === 'Patron' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-600 rounded-3xl p-5 shadow-xl shadow-rose-600/20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="relative z-10">
              <h2 className="text-xs font-black text-rose-100 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-rose-400/30 pb-2">
                 <ShieldAlert size={16} /> Onay Bekleyen Kasa İşlemleri ({pendingFinances.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {pendingFinances.slice(0, 3).map((f: any) => {
                    const isIncome = f.type === 'Gelir';
                    return (
                        <div key={f.id} className="bg-rose-950/40 border border-rose-400/30 rounded-2xl p-4 flex flex-col justify-between hover:bg-rose-950/60 transition-colors">
                            <div className="mb-2">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/20 text-white flex items-center gap-1 min-w-0">
                                        <User size={10} className="shrink-0" /> <span className="truncate">{f.added_by}</span>
                                    </span>
                                    <span className={`text-[11px] font-black shrink-0 ${isIncome ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {isIncome ? '+' : '-'}₺{f.amount.toLocaleString('tr-TR')}
                                    </span>
                                </div>
                                <h3 className="text-xs font-semibold leading-relaxed line-clamp-2 text-rose-100">
                                    {f.description}
                                </h3>
                            </div>
                            
                            <button
                                onClick={() => { if (setActiveTab) setActiveTab('finance') }}
                                className="mt-2 w-full bg-white text-rose-700 hover:bg-rose-50 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Wallet size={14} /> KASAYI GÖR VE ONAYLA
                            </button>
                        </div>
                    );
                 })}
                 {pendingFinances.length > 3 && (
                     <div 
                        onClick={() => { if (setActiveTab) setActiveTab('finance') }}
                        className="bg-rose-900/50 border border-rose-400/30 rounded-2xl p-4 flex flex-col justify-center items-center cursor-pointer hover:bg-rose-800/50 transition-colors"
                     >
                         <span className="text-2xl font-black text-rose-200 mb-1">+{pendingFinances.length - 3}</span>
                         <span className="text-xs font-bold text-rose-100">Tümünü Gör</span>
                     </div>
                 )}
              </div>
           </div>
        </motion.div>
      )}

      {incomingJobs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500 rounded-3xl p-5 shadow-xl shadow-amber-500/20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="relative z-10">
              <h2 className="text-xs font-black text-amber-100 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-amber-400/30 pb-2">
                 <AlertTriangle size={16} /> Onayınızı Bekleyen İşler ({incomingJobs.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {incomingJobs.map((job: any) => {
                    const isGeneral = job.work_type === 'Genel Görev';
                    const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(job.asset_id));
                    const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

                    return (
                        <div key={job.id} className="bg-amber-950/40 border border-amber-300/30 rounded-2xl p-4 flex flex-col justify-between hover:bg-amber-950/60 transition-colors">
                            <div 
                                className="cursor-pointer mb-2 group" 
                                onClick={() => { 
                                  if (setJobModalType) setJobModalType('');
                                  setSelectedJob(job); 
                              }}
                                title="İş Detayını Görüntüle"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/20 text-white`}>
                                        {isGeneral ? 'GENEL GÖREV' : 'NORMAL İŞ'}
                                    </span>
                                    <span className="text-[10px] font-bold opacity-70 flex items-center gap-1 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight size={14} className="text-amber-200"/> Detay
                                    </span>
                                </div>
                                
                                <h3 className="text-sm font-black leading-tight mb-0.5 line-clamp-2 flex items-center gap-2">
                                    {aptName ? <><span className="text-amber-300">{aptName}</span> - {job.customer_name}</> : job.customer_name}
                                    {job.project_pdf_url && <FileText size={16} className="text-blue-500 shrink-0" />}
                                </h3>
                                <div className="text-[10px] font-bold text-amber-200/80 mb-2 truncate">
                                    {currentAsset ? currentAsset.name : 'Genel Görev / Varlık Yok'}
                                </div>

                                <p className="text-amber-100 text-[11px] font-medium flex items-center gap-1.5 truncate">
                                    <Briefcase size={12} className="shrink-0 opacity-70"/> {job.work_type}
                                </p>
                            </div>
                            
                            <button
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (setJobModalType) setJobModalType('APPROVAL_FIRST_STEP');
                                    setSelectedJob(job); 
                                }}
                                className="mt-2 w-full bg-white text-amber-600 hover:bg-amber-50 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckSquare size={14} /> İŞİ GÖR VE ONAYLA
                            </button>
                        </div>
                    );
                 })}
              </div>
           </div>
        </motion.div>
      )}

      {waitingForAssignmentJobs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-600 rounded-3xl p-5 shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="relative z-10">
              <h2 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-indigo-400/30 pb-2">
                 <UserPlus size={16} /> Ustaya Atanmayı Bekleyenler ({waitingForAssignmentJobs.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {waitingForAssignmentJobs.map((job: any) => {
                    const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(job.asset_id));
                    const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

                    return (
                        <div key={job.id} className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between hover:bg-indigo-950/60 transition-colors">
                            <div 
                                className="cursor-pointer mb-2 group" 
                                onClick={() => { 
                                  if (setJobModalType) setJobModalType('ASSIGN');
                                  setSelectedJob(job); 
                              }}
                                title="İş Detayını Gör ve Ata"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/20 text-white">
                                        ATAMA BEKLİYOR
                                    </span>
                                    <span className="text-[10px] font-bold opacity-70 flex items-center gap-1 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight size={14} className="text-indigo-300"/> Detay
                                    </span>
                                </div>
                                
                                <h3 className="text-sm font-black leading-tight mb-0.5 line-clamp-2 flex items-center gap-2">
                                    {aptName ? <><span className="text-indigo-300">{aptName}</span> - {job.customer_name}</> : job.customer_name}
                                    {job.project_pdf_url && <FileText size={16} className="text-blue-500 shrink-0" />}
                                </h3>
                                <div className="text-[10px] font-bold text-indigo-300/80 mb-2 truncate">
                                    {currentAsset ? currentAsset.name : 'Genel Görev / Varlık Yok'}
                                </div>

                                <p className="text-indigo-200 text-[11px] font-medium flex items-center gap-1.5 truncate">
                                    <Briefcase size={12} className="shrink-0 opacity-70"/> {job.work_type}
                                </p>
                            </div>
                            
                            <button
                                onClick={(e) => { e.stopPropagation(); handleAssignWorker(job); }}
                                className="mt-2 w-full bg-indigo-500 hover:bg-indigo-400 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <UserPlus size={14} /> USTAYA ATA
                            </button>
                        </div>
                    );
                 })}
              </div>
           </div>
        </motion.div>
      )}

      {materialRequests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-teal-600 rounded-3xl p-5 shadow-xl shadow-teal-600/20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="relative z-10">
              <h2 className="text-xs font-black text-teal-100 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-teal-400/30 pb-2">
                 <Package size={16} /> Yeni Malzeme Talepleri ({materialRequests.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {materialRequests.map((req: any) => {
                    return (
                        <div key={req.id} className="bg-teal-950/40 border border-teal-400/30 rounded-2xl p-4 flex flex-col justify-between hover:bg-teal-950/60 transition-colors">
                            <div 
                                className="cursor-pointer mb-2 group" 
                                onClick={() => setSelectedMaterialRequest(req)}
                                title="Talebi Görüntüle ve Onayla"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/20 text-white">
                                        YENİ TALEP
                                    </span>
                                    <span className="text-[10px] font-bold opacity-70 flex items-center gap-1 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight size={14} className="text-teal-200"/> Detay
                                    </span>
                                </div>
                                
                                <h3 className="text-sm font-black leading-tight mb-0.5 line-clamp-2">
                                    {req.staff_name || 'Bilinmeyen Personel'}
                                </h3>
                                <div className="text-[10px] font-bold text-teal-200/80 mb-2 truncate">
                                    {req.parsed_items?.length || 0} Çeşit Malzeme İstiyor
                                </div>

                                <p className="text-teal-100 text-[11px] font-medium flex items-center gap-1.5 truncate">
                                    <Clock size={12} className="shrink-0 opacity-70"/> {new Date(req.created_at).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                            
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedMaterialRequest(req); }}
                                className="mt-2 w-full bg-white text-teal-700 hover:bg-teal-50 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Box size={14} /> İNCELE VE ONAYLA
                            </button>
                        </div>
                    );
                 })}
              </div>
           </div>
        </motion.div>
      )}

      {!isMyJobsTab && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div onClick={() => setActiveTab('jobs')} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:border-blue-300 transition-colors group cursor-pointer active:scale-95">
              <div className="w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shrink-0">
                <ClipboardList size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1">{totalJobs}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wide">Toplam İş</div>
              </div>
            </div>

            <div onClick={() => setActiveTab('completed')} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:border-emerald-300 transition-colors group cursor-pointer active:scale-95">
              <div className="w-10 h-10 bg-emerald-50/80 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                <CheckCircle size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1">{completedJobs}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wide">Tamamlanan</div>
              </div>
            </div>

            <div onClick={() => setActiveTab('pending')} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:border-amber-300 transition-colors group cursor-pointer active:scale-95">
              <div className="w-10 h-10 bg-amber-50/80 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1">{pendingJobs}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wide">Bekleyen İşler</div>
              </div>
            </div>

            <div onClick={() => setActiveTab('jobs')} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:border-purple-300 transition-colors group cursor-pointer active:scale-95">
              <div className="w-10 h-10 bg-purple-50/80 rounded-xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1">{plannedJobs}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wide">Planlanan</div>
              </div>
            </div>

            {/* 🚀 DÜZELTME: Bu kutu artık tıklanamaz ve pasif */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 cursor-default">
              <div className="w-10 h-10 bg-indigo-50/80 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <ImageIcon size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1">{monthlyPhotos}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wide">Bu Ayki Fotoğraflar</div>
              </div>
            </div>
            
            {/* 🚀 YENİ: Yaklaşan Bakımlar Kartı */}
            <div onClick={() => setActiveTab('periodic')} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:border-cyan-300 transition-colors group cursor-pointer active:scale-95 sm:col-span-2 md:col-span-1 lg:col-span-1">
              <div className="w-10 h-10 bg-cyan-50/80 rounded-xl flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform shrink-0">
                <Wrench size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1">{upcomingMaintenances.length}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wide">Bakım Alarmı</div>
              </div>
            </div>

          </div>
      )}

      {!isMyJobsTab && (
          <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${userRole === 'Patron' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
            
            {userRole === 'Patron' && (
              <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-800 flex flex-col relative overflow-hidden finance-block">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
                 
                 <div className="flex justify-between items-start mb-6 z-10 relative gap-3">
                   <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <Wallet size={16} className="text-blue-400 shrink-0" />
                       <span className="text-xs font-bold text-slate-300 uppercase tracking-wider truncate">Kasa Özeti</span>
                     </div>
                     <div className="text-[10px] text-slate-500 mb-1 font-semibold">Net Bakiye</div>
                     <div 
                        className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate w-full"
                        title={`₺${netCash.toLocaleString('tr-TR')}`}
                     >
                         ₺{netCash.toLocaleString('tr-TR')}
                     </div>
                   </div>
                   
                   <div className="h-10 sm:h-12 w-20 sm:w-32 opacity-80 flex items-center justify-end shrink-0">
                     {miniChartPoints ? (
                       <svg viewBox="-5 -5 110 50" className="w-full h-full overflow-visible">
                         <polyline
                           fill="none"
                           stroke="#3b82f6"
                           strokeWidth="4"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           points={miniChartPoints}
                         />
                       </svg>
                     ) : (
                       <div className="text-slate-600 text-[10px] font-bold">Veri Yok</div>
                     )}
                   </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto z-10">
                   <div className="space-y-3">
                     <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between border border-white/5 shadow-sm">
                       <div className="flex items-center gap-2"><ArrowUpRight size={14} className="text-emerald-400" /><span className="text-xs text-slate-300 font-bold">Toplam Gelir</span></div>
                       <span className="text-sm font-black text-emerald-400">₺{totalIncome.toLocaleString('tr-TR')}</span>
                     </div>
                     <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between border border-white/5 shadow-sm">
                       <div className="flex items-center gap-2"><ArrowUpRight size={14} className="text-rose-400 rotate-90" /><span className="text-xs text-slate-300 font-bold">Toplam Gider</span></div>
                       <span className="text-sm font-black text-rose-400">₺{totalExpense.toLocaleString('tr-TR')}</span>
                     </div>
                   </div>

                   <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Son İşlemler</h4>
                      <div className="space-y-3 flex-1">
                        {recentFinances.length > 0 ? recentFinances.map((f: any) => (
                          <div key={f.id} className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.type === 'Gelir' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                              <div className="text-xs font-semibold text-slate-200 truncate">{f.description.split('\n')[0]}</div>
                            </div>
                            <div className={`text-[11px] font-black shrink-0 ${f.type === 'Gelir' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {f.type === 'Gelir' ? '+' : '-'}₺{Number(f.amount).toLocaleString('tr-TR')}
                            </div>
                          </div>
                        )) : (
                          <div className="text-center text-slate-500 text-[10px] py-4 font-semibold">Henüz işlem yok.</div>
                        )}
                      </div>
                   </div>
                 </div>
              </div>
            )}

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 ${userRole !== 'Patron' ? 'lg:col-span-2 lg:grid-cols-2' : ''}`}>
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden h-auto min-h-[140px] sm:h-[192px] flex flex-col justify-center group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2.5">
                     <div className={`p-2 rounded-lg ${isGrowthPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {isGrowthPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                     </div>
                     <h3 className="font-bold text-slate-900 text-sm">İş Büyüme Hızı</h3>
                  </div>
                </div>
                <div>
                   <div className="flex items-baseline gap-2">
                     <span className="text-3xl font-black text-slate-900">%{growthPercent}</span>
                     <span className={`text-xs font-bold uppercase tracking-wider ${isGrowthPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                       {isGrowthPositive ? 'Artış' : 'Düşüş'}
                     </span>
                   </div>
                   <p className="text-[11px] text-slate-500 mt-2.5 font-medium leading-relaxed">
                     Geçen ay <b className="text-slate-700">{lastMonthJobs} iş</b> yapmıştınız. Bu ay şu ana kadar <b className="text-slate-700">{currentMonthJobs} iş</b> kaydı açıldı.
                   </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-visible h-auto min-h-[140px] sm:h-[192px] flex flex-col justify-center group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2.5">
                     <div className={`p-2 rounded-lg ${lowStockItems.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                        <Package size={16} />
                     </div>
                     <h3 className="font-bold text-slate-900 text-sm">Stok Uyarıları</h3>
                  </div>
                  
                  {lowStockItems.length > 0 && (
                    <div className="relative">
                      <button 
                        onClick={() => setShowOrderMenu(!showOrderMenu)} 
                        className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                      >
                        <Plus size={20} />
                      </button>
                      
                      <AnimatePresence>
                        {showOrderMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowOrderMenu(false)}></div>
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9, y: 5 }} 
                              animate={{ opacity: 1, scale: 1, y: 0 }} 
                              exit={{ opacity: 0, scale: 0.9, y: 5 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 overflow-hidden"
                            >
                              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sipariş İşlemleri</span>
                              </div>
                              <button 
                                onClick={() => {
                                  setShowOrderMenu(false);
                                  if (setActiveTab) setActiveTab('stock');
                                }} 
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                <ShoppingCart size={14} className="text-slate-400" /> Sipariş Oluştur
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div>
                   {lowStockItems.length > 0 ? (
                     <>
                       <div className="text-3xl font-black text-slate-900">{lowStockItems.length} Parça</div>
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2.5 gap-2">
                         <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1.5">
                           <AlertTriangle size={14} className="shrink-0" /> Kritik seviyenin altında.
                         </p>
                         <button onClick={() => setShowLowStockModal(true)} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-2 sm:py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 text-center w-full sm:w-auto">
                           Detayları Gör
                         </button>
                       </div>
                     </>
                   ) : (
                     <>
                       <div className="text-2xl font-black text-emerald-600">Sorun Yok</div>
                       <p className="text-[11px] text-slate-500 mt-2.5 font-medium leading-relaxed">
                         Stoğu azalan (5 adetin altında) kritik parçanız yok.
                       </p>
                     </>
                   )}
                </div>
              </div>

            </div>
          </div>
      )}

      {/* 🚀 YENİ: OTOPİLOT VE PERİYODİK BAKIM ÖZETİ (Yönetici ve Patron Görür) */}
      {userRole !== 'Usta' && !isMyJobsTab && (
         <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg border border-slate-800 flex items-center justify-between gap-4 overflow-hidden relative">
            <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none">
                <Box size={150} />
            </div>
            <div className="relative z-10">
                <h3 className="text-sm font-black text-white flex items-center gap-2 tracking-wide mb-1">
                   <RefreshCw size={18} className="text-blue-400" /> Otopilot Bakım Sistemi
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                   Şu an sisteminizdeki <strong className="text-white">{data?.assets?.length || 0}</strong> varlıktan <strong className="text-emerald-400">{data?.assets?.filter((a: any) => a.is_autopilot === 1)?.length || 0}</strong> tanesinde tam otomatik bakım (otopilot) aktiftir.
                </p>
            </div>
            <button 
                onClick={() => { if (setActiveTab) setActiveTab('periodic') }}
                className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 relative z-10"
            >
                Yönet <ArrowRight size={14} />
            </button>
         </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base tracking-tight">Son İş Emirleri ve Onay Durumu</h3>
          </div>
          <button onClick={() => setShowJobModal(true)} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm active:scale-95">
            <Plus size={16} strokeWidth={3} /> Yeni İş Ata
          </button>
        </div>
        
        <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead className="bg-white text-slate-500 font-bold sticky top-0 z-10 shadow-sm uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-4 border-b border-slate-100 whitespace-nowrap">Müşteri / İş</th>
                <th className="px-5 py-4 border-b border-slate-100 whitespace-nowrap">Personel / Onay Süreci</th>
                <th className="px-5 py-4 border-b border-slate-100 whitespace-nowrap">Planlanan Tarih</th>
                <th className="px-5 py-4 border-b border-slate-100 text-right whitespace-nowrap">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
            {jobs.slice(0, 10).map((j: any) => {
                
                const creator = j.creator_name || j.details?.createdBy || (data?.ownerName?.split(' ')[0] || 'Sistem');
                const manager = j.manager_name || j.details?.managerName || null;
                const worker = j.worker_name || null;

                const isCreatorSameAsManager = manager && creator === manager;

                const isApproved = j.status === 'Tamamlandı';
                const staffColor = isApproved ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200';
                
                const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
                const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

                return (
                  <tr 
                    key={j.id} 
                    onClick={() => {
                        if (setJobModalType) setJobModalType('');
                        setSelectedJob && setSelectedJob(j);
                    }}
                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer relative"
                  >
                    <td className="px-5 py-4 align-middle">
                      <div className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-700 transition-colors truncate max-w-[220px] flex items-center gap-2">
                        {aptName ? (
                          <><span className="text-blue-600">{aptName}</span> - {j.customer_name}</>
                        ) : (
                          j.customer_name
                        )}
                        {j.project_pdf_url && <FileText size={16} className="text-blue-500 shrink-0" />}
                      </div>
                      <div className="text-[11px] font-black text-slate-600 mb-1.5 truncate max-w-[220px]">
                        {currentAsset ? currentAsset.name : 'Genel Görev / Varlık Yok'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mb-1.5 truncate max-w-[220px]">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{currentAsset ? currentAsset.location : 'Lokasyon Yok'}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 bg-slate-50 w-max px-2 py-0.5 rounded border border-slate-100">
                        {j.work_type}
                      </div>
                    </td>
                    
                    <td className="px-5 py-4 align-middle">
                      <div className="flex flex-col gap-2 w-fit">
                        
                      {isCreatorSameAsManager ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 w-[130px] shrink-0">
                                  <ShieldCheck size={14} className="text-blue-600" />
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ATAYAN & SORUMLU:</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${staffColor} whitespace-nowrap shadow-sm`}>
                                    {manager}
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 w-[130px] shrink-0">
                                      <UserPlus size={14} className="text-slate-400" />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ATAYAN:</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 whitespace-nowrap shadow-sm">
                                        {creator}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 w-[130px] shrink-0">
                                      <UserCheck size={14} className={manager ? 'text-blue-500' : 'text-slate-300'} />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">SORUMLU:</span>
                                    </div>
                                    {manager ? (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${staffColor} whitespace-nowrap shadow-sm`}>
                                            {manager}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium text-slate-400 italic px-2 py-0.5">-</span>
                                    )}
                                </div>
                            </>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 w-[130px] shrink-0">
                              <Wrench size={14} className={worker ? 'text-indigo-500' : 'text-slate-400'} />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">SAHA USTASI:</span>
                            </div>
                            {worker ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${staffColor} whitespace-nowrap shadow-sm`}>
                                    {worker}
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 whitespace-nowrap shadow-sm">
                                    Atanmadı
                                </span>
                            )}
                        </div>

                      </div>
                    </td>

                    <td className="px-5 py-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                         <Calendar size={14} className={getDynamicStatus(j, !!worker).label === 'Gecikti' ? 'text-rose-500' : 'text-blue-500'} />
                         {j.scheduled_date || 'Anlık Kayıt'}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-3">
                         <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide border shadow-sm ${getDynamicStatus(j, !!worker).colorClass} whitespace-nowrap uppercase`}>
                           {getDynamicStatus(j, !!worker).label}
                         </span>
                         <div className="w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight size={16} className="text-blue-500" />
                         </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-slate-400 text-sm font-medium bg-slate-50">
                    Henüz iş emri bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden flex flex-col gap-3 p-4 bg-slate-50/50 max-h-[500px] overflow-y-auto custom-scrollbar">
        {jobs.slice(0, 10).map((j: any) => {
             const creator = j.creator_name || j.details?.createdBy || (data?.ownerName?.split(' ')[0] || 'Sistem');
             const manager = j.manager_name || j.details?.managerName || null;
             const worker = j.worker_name || null;

             const isCreatorSameAsManager = manager && creator === manager;

             const isApproved = j.status === 'Tamamlandı';
             const staffColor = isApproved ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200';

             const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
             const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

             return (
              <div 
                key={j.id} 
                onClick={() => {
                    if (setJobModalType) setJobModalType('');
                    setSelectedJob && setSelectedJob(j);
                }}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-4 active:scale-95 transition-all cursor-pointer"
              >
                 <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                 <div className="min-w-0 flex flex-col gap-1 w-full pr-2">
                      <div className="font-black text-slate-800 text-sm line-clamp-2 flex items-center gap-2">
                        {aptName ? (
                          <><span className="text-blue-600">{aptName}</span> - {j.customer_name}</>
                        ) : (
                          j.customer_name
                        )}
                        {j.project_pdf_url && <FileText size={16} className="text-blue-500 shrink-0" />}
                      </div>
                      <div className="text-[11px] font-bold text-slate-600 truncate">
                        {currentAsset ? currentAsset.name : 'Genel Görev / Varlık Yok'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-start gap-1.5 line-clamp-2 mb-1">
                        <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                        <span>{currentAsset ? currentAsset.location : 'Lokasyon Yok'}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider truncate bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">
                        {j.work_type}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0 shadow-sm ${getDynamicStatus(j, !!worker).colorClass}`}>
                      {getDynamicStatus(j, !!worker).label}
                    </span>
                 </div>

                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                    {isCreatorSameAsManager ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                               <ShieldCheck size={10} /> ATAYAN & SORUMLU
                            </span>
                            <div className={`text-[11px] font-bold px-2 py-0.5 rounded border ${staffColor}`}>
                                {manager}
                            </div>
                        </div>
                    ) : (
                        <>
                          <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                                 <UserPlus size={10} /> ATAYAN
                              </span>
                              <div className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {creator}
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                                 <UserCheck size={10} /> SORUMLU
                              </span>
                              <div className={`text-[11px] font-bold px-2 py-0.5 rounded border ${manager ? staffColor : 'text-slate-400 bg-slate-100 border-slate-200'}`}>
                                  {manager || '-'}
                              </div>
                          </div>
                        </>
                    )}
                    
                    <div className="flex items-center gap-2 border-t border-slate-200 pt-2 border-dashed">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                           <Wrench size={10} /> SAHA USTASI
                        </span>
                        <div className={`text-[11px] font-bold px-2 py-0.5 rounded border ${worker ? staffColor : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
                            {worker || 'Atanmadı'}
                        </div>
                    </div>
                 </div>

                 <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                   <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1.5 w-fit">
                      <Calendar size={12} className={getDynamicStatus(j, !!worker).label === 'Gecikti' ? 'text-rose-500' : 'text-slate-400'} /> 
                      {j.scheduled_date || 'Tarih Planlanmadı'}
                   </div>
                   <ArrowUpRight size={16} className="text-blue-500" />
                 </div>
              </div>
             );
          })}
          {jobs.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm font-medium bg-white rounded-xl border border-slate-200">
              Henüz iş emri bulunmuyor.
            </div>
          )}
        </div>
      </div>

      {/* 🚀 YENİ: ABONELİK VE REFERANS KONTROL MERKEZİ (Yönetici sadece Referansı görür) */}
      {(userRole === 'Patron' || userRole === 'Yönetici') && !isMyJobsTab && (
          <div className={`grid grid-cols-1 gap-4 sm:gap-6 mt-8 ${userRole === 'Patron' ? 'lg:grid-cols-2' : ''}`}>
              {/* Abonelik Durumu - Sadece Patron */}
              {userRole === 'Patron' && (
                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4 relative z-10">
                          <CreditCard size={18} className="text-blue-600" /> Abonelik ve Fatura Durumu
                      </h3>
                      <div className="grid grid-cols-2 gap-4 relative z-10">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Durum</div>
                              <div className={`text-lg font-black ${isExempt ? 'text-purple-600' : subStatus === 'Aktif' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {isExempt ? 'VIP Muaf' : subStatus}
                              </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sonraki Fatura</div>
                              <div className={`text-sm font-bold mt-1 ${isExempt ? 'text-purple-600' : 'text-slate-700'}`}>
                                  {isExempt ? 'Ücretsiz Kullanım' : nextBillingDate}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Referans Merkezi - Yönetici ve Patron */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-indigo-800/50 flex flex-col relative overflow-hidden text-white">
                  <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-4 -translate-y-4">
                      <Gift size={100} />
                  </div>
                  <h3 className="text-sm font-black text-indigo-100 uppercase tracking-widest flex items-center gap-2 mb-4 relative z-10">
                      <Users size={18} className="text-indigo-400" /> İş Ortaklığı Merkezi
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                      {userRole === 'Patron' && (
                          <div className="flex-1 bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col justify-center">
                              <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Kumbaradaki İndirim (Toplam)</div>
                              <div className="text-2xl font-black text-emerald-400">₺{(activeReferrals * baseMonthlyFee).toLocaleString('tr-TR')}</div>
                              <div className="text-[10px] text-indigo-100 mt-1 opacity-80">{activeReferrals} ay hediye kullanım hakkınız birikti</div>
                          </div>
                      )}
                      <div className={`${userRole === 'Patron' ? 'flex-[2]' : 'flex-1'} flex flex-col justify-center`}>
                          <p className="text-[11px] text-indigo-100 font-medium leading-relaxed mb-3">
                              {userRole === 'Patron' 
                                  ? `Referans kodunuzla kayıt olan ve ilk ödemesini yapan her işletme için kumbaranıza +1 aylık (${baseMonthlyFee.toLocaleString('tr-TR')} ₺ değerinde) indirim eklenir. Sınır yok, getirdiğiniz kadar ay bedava kullanın! (Karşı taraf da 1 ay kazanır).`
                                  : `Firma referans kodunuz aşağıdadır. Sisteme davet ettiğiniz firmalar bu kod ile kayıt olabilirler.`
                              }
                          </p>
                          <div className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/30 rounded-lg p-1.5 pl-3 w-full sm:w-max min-w-[250px]">
                              <span className="text-xs font-black text-indigo-300 tracking-wider flex-1 truncate">{referralCode}</span>
                              <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(referralCode);
                                    setAlertModal({ isOpen: true, message: 'Referans kodunuz kopyalandı!', type: 'success' });
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-md transition-colors shadow-sm"
                                title="Kodu Kopyala"
                              >
                                  <Copy size={14} />
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

<div className="bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 relative overflow-hidden finance-block mt-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Database size={16} className="text-blue-400" /> Başlangıçtan Bugüne Sistem Verileri
            </h3>
            {/* Tekrarlanan "Altyapı & Lisans" kısmı silindi */}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
               <div className="text-xl font-black text-white mb-1">{totalJobs}</div>
               <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Toplam İş Kaydı</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
               <div className="text-xl font-black text-emerald-400 mb-1">{totalLifetimePhotos}</div>
               <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Saha Fotoğrafı</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
               <div className="text-xl font-black text-blue-400 mb-1">{totalCustomersCount}</div>
               <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Kayıtlı Müşteri</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
               <div className="text-xl font-black text-amber-400 mb-1">{totalAssetsCount}</div>
               <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cihaz / Varlık</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center sm:col-span-3 md:col-span-1">
               <div className="text-xl font-black text-purple-400 mb-1">{totalStockTypes}</div>
               <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Farklı Stok Kalemi</div>
            </div>
        </div>

        <div className={`grid grid-cols-1 gap-3 sm:gap-4 pt-4 border-t border-white/10 ${userRole === 'Patron' ? 'lg:grid-cols-3' : ''}`}>
            
            <div className={`${userRole === 'Patron' ? 'lg:col-span-2' : ''} bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 sm:p-5 flex flex-col justify-center relative overflow-hidden`}>
               <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4"><TrendingUp size={80} /></div>
               <div className="text-[10px] sm:text-xs text-emerald-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 z-10"><TrendingUp size={14}/> Önlenen Gizli Operasyon Maliyeti</div>
               <div className="text-3xl sm:text-4xl font-black text-emerald-500 mt-1 mb-1 z-10">₺{totalSystemProfit.toLocaleString('tr-TR')}</div>
               <div className="text-[9px] sm:text-[10px] text-emerald-400/70 font-medium z-10 max-w-lg">Kasa haricinde; tüm zamanlar boyunca zaman, kağıt, telefon trafiği ve personel mesaisinden elde edilen tahmini tasarruf miktarıdır.</div>
            </div>
            
            {userRole === 'Patron' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-center relative overflow-hidden">
                  {isExempt ? (
                      <div className="flex flex-col items-center justify-center text-center h-full">
                          <Star size={28} className="text-purple-400 mb-2" />
                          <h4 className="text-base font-black text-white">VIP Muafiyet Aktif</h4>
                          <p className="text-[10px] text-purple-300 mt-1">Faturanız FixLog.co tarafından karşılanıyor.</p>
                      </div>
                  ) : (
                      <>
                          {referralCredits > 0 && (
                              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                                  <Star size={10} className="fill-white" /> HEDİYE KULLANIM
                              </div>
                          )}
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><Activity size={14}/> Bu Ayki Kullanım Ücreti</div>
                          
                          {referralCredits > 0 ? (
                              <div className="flex items-end gap-2 mt-1 mb-2">
                                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">₺{finalBill.toLocaleString('tr-TR')}</div>
                                  <div className="text-base font-bold text-slate-500 line-through mb-0.5">₺{currentUsageBill.toLocaleString('tr-TR')}</div>
                              </div>
                          ) : (
                              <div className="text-2xl sm:text-3xl font-black text-white mt-1 mb-2">₺{currentUsageBill.toLocaleString('tr-TR')}</div>
                          )}

                          {referralCredits > 0 && (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 mt-1 mb-2">
                                  <p className="text-[9px] sm:text-[10px] text-emerald-400 font-medium leading-relaxed flex items-start gap-1.5">
                                      <Gift size={12} className="shrink-0 mt-0.5" />
                                      <span>Tanımlı <strong>ücretsiz kullanım hakkınız ({activeReferrals} Ay)</strong> ile faturanızdan <strong>₺{referralCredits.toLocaleString('tr-TR')}</strong> indirim uygulandı.</span>
                                  </p>
                              </div>
                          )}

                          <div className="text-[9px] text-slate-500 font-medium pt-2 border-t border-white/5 mt-auto flex justify-between items-center">
                             <div>
                                 <span className="block text-slate-400 font-bold mb-0.5">Sistem Taban Ücreti:</span>
                                 ₺{baseMonthlyFee.toLocaleString('tr-TR')} / Ay
                             </div>
                             <div className="text-right">
                                 <span className="block text-slate-400 font-bold mb-0.5">Ödenen Toplam:</span>
                                 ₺{usagePaid.toLocaleString('tr-TR')}
                             </div>
                          </div>
                      </>
                  )}
              </div>
            )}
        </div>
      </div>

      <AnimatePresence>
        {showSuccessModal && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="bg-white/95 backdrop-blur-md border-2 border-emerald-100 shadow-2xl rounded-3xl p-8 flex flex-col items-center text-center max-w-sm w-full">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner animate-pulse">
                        <CheckCircle size={40} strokeWidth={3} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">İşlem Başarılı!</h3>
                    <p className="text-sm text-slate-500 font-medium">Görev onaylandı ve bir sonraki aşamaya (Usta Atama) başarıyla taşındı.</p>
                </div>
                </motion.div>
        )}
        </AnimatePresence>
  
        {/* 🚀 YENİ: MALZEME TALEP DETAY MODALI */}
        <AnimatePresence>
          {selectedMaterialRequest && (
              <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setSelectedMaterialRequest(null)}
              >
                  <motion.div 
                      initial={{ scale: 0.95, y: 10 }} 
                      animate={{ scale: 1, y: 0 }} 
                      exit={{ scale: 0.95, y: 10 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                  >
                      <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                          <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                                  <Package size={20} />
                              </div>
                              <div>
                                  <h3 className="font-black text-slate-800 text-base leading-tight">Malzeme Talebi</h3>
                                  <p className="text-[11px] font-bold text-slate-500">{selectedMaterialRequest.staff_name}</p>
                              </div>
                          </div>
                          <button onClick={() => setSelectedMaterialRequest(null)} className="text-slate-400 hover:text-rose-500 bg-white p-2 rounded-xl shadow-sm border border-slate-200 transition-colors">
                              <X size={18} />
                          </button>
                      </div>
  
                      <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50 space-y-4">
                          <div className="space-y-2">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Talep Edilen Malzemeler</div>
                              <div className="bg-white border border-slate-200 rounded-2xl p-2 space-y-2">
                                  {(selectedMaterialRequest.parsed_items || []).map((item: any, idx: number) => {
                                      // Stock'tan kategoriyi anlık bulma
                                      const stockItem = stock.find((s: any) => String(s.id) === String(item.id));
                                      const category = stockItem?.category || 'Kategori Yok';
  
                                      return (
                                          <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                              <div className="min-w-0 pr-3">
                                                  <div className="text-sm font-bold text-slate-800 truncate">{item.name}</div>
                                                  <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-0.5">{category}</div>
                                              </div>
                                              <div className="shrink-0 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-center">
                                                  <div className="text-sm font-black text-slate-800">{item.qty}</div>
                                                  <div className="text-[9px] font-bold text-slate-400 uppercase">{item.unit}</div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
  
                          {selectedMaterialRequest.note && (
                              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl relative">
                                  <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Usta Notu:</div>
                                  <p className="text-xs font-medium text-amber-900 leading-relaxed italic relative z-10">"{selectedMaterialRequest.note}"</p>
                              </div>
                          )}
                      </div>
  
                      <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex gap-3">
                          <button 
                              onClick={() => setSelectedMaterialRequest(null)}
                              className="flex-1 bg-slate-100 text-slate-600 font-bold text-sm py-3.5 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                          >
                              Kapat
                          </button>
                          <button 
                              onClick={handleApproveMaterial}
                              disabled={isApproving === selectedMaterialRequest.id}
                              className="flex-[2] bg-teal-600 text-white font-black text-sm py-3.5 rounded-xl shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                              {isApproving === selectedMaterialRequest.id ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Onayla ve Stoktan Düş</>}
                          </button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
  
        {/* 🚀 DİNAMİK GENEL UYARI VE ONAY MODALI */}
        <AnimatePresence>
        {alertModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 10 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 10 }} 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center border border-slate-200"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${
                alertModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                alertModal.type === 'error' ? 'bg-rose-50 text-rose-500' : 
                alertModal.type === 'warning' ? 'bg-amber-50 text-amber-500' : 
                'bg-blue-50 text-blue-500'
              }`}>
                {alertModal.type === 'success' && <CheckCircle size={32} />}
                {alertModal.type === 'error' && <AlertCircle size={32} />}
                {alertModal.type === 'warning' && <AlertCircle size={32} />}
                {alertModal.type === 'info' && <Info size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                {alertModal.type === 'success' ? 'Başarılı!' : 
                 alertModal.type === 'error' ? 'Hata!' : 
                 alertModal.type === 'warning' ? 'Uyarı!' : 
                 'Bilgi / Onay'}
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                {alertModal.message}
              </p>
              
              {(alertModal as any).isConfirm ? (
                  <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                        className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                      >
                        İptal
                      </button>
                      <button 
                        onClick={(alertModal as any).confirmAction}
                        className="flex-[2] bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-md"
                      >
                        Evet, Onayla
                      </button>
                  </div>
              ) : (
                  <button 
                    onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-md flex justify-center items-center"
                  >
                    Tamam
                  </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}