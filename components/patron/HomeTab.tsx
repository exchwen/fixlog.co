'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Users, Box, Wallet, Plus, ArrowUpRight, 
  CheckCircle, Clock, Calendar, TrendingUp, TrendingDown, 
  Package, AlertTriangle, ShieldCheck, Activity, User, Lock, 
  Settings, X, Wrench, Link as LinkIcon, Check, Database, Image as ImageIcon, ShoppingCart, UserCircle, Briefcase, Loader2, Bell, CheckSquare, UserPlus
} from 'lucide-react';

export default function HomeTab({ data, setShowJobModal, statusColors, setSelectedJob, setActiveTab, userRole: propRole, handleAction, isMyJobsTab, setJobModalType }: any) {
  
  const { slug } = useParams(); 

  const isPatronPath = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard');
  const userRole = propRole || (isPatronPath ? 'Patron' : 'Yönetici');

  const [currentUserName, setCurrentUserName] = useState<string>('Yönetici');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false); 

  const [newJobNotification, setNewJobNotification] = useState<{show: boolean, jobName: string}>({show: false, jobName: ''});
  const prevJobIds = useRef<string[]>([]);

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

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j: any) => j.status === 'Tamamlandı').length;
  const pendingJobs = jobs.filter((j: any) => j.status === 'Beklemede' || j.status === 'Devam Ediyor').length;
  const plannedJobs = jobs.filter((j: any) => j.status === 'Gelecek').length;

  const incomingJobs = useMemo(() => {
     if (!currentUserId || userRole === 'Patron') return [];
     return jobs.filter((j: any) => 
        (String(j.staff_id) === String(currentUserId) || String(j.details?.managerId) === String(currentUserId)) && 
        (j.status === 'Beklemede' || j.status === 'Gelecek')
     );
  }, [jobs, currentUserId, userRole]);

  const waitingForAssignmentJobs = useMemo(() => {
    if (!currentUserId || userRole === 'Patron') return [];
    return jobs.filter((j: any) => 
       (String(j.staff_id) === String(currentUserId) || String(j.details?.managerId) === String(currentUserId)) && 
       (j.status === 'Usta Bekliyor')
    );
 }, [jobs, currentUserId, userRole]);

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
        alert("Sistem hatası: İşlem fonksiyonu bulunamadı.");
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
        alert("Bir hata oluştu.");
    } finally {
        setIsApproving(null);
    }
  };

  const handleAssignWorker = (job: any) => {
    if (setJobModalType) setJobModalType('ASSIGN');
    setSelectedJob(job);
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
  const totalCustomersCount = data?.customers?.length || 0;
  const totalAssetsCount = data?.assets?.length || 0;
  const totalStockTypes = stock.length;

  const { usagePaid, totalSystemProfit, currentUsageBill, baseMonthlyFee } = useMemo(() => {
    const earliestDate = jobs.length > 0 
      ? new Date(Math.min(...jobs.map((j: any) => new Date(j.created_at || new Date()).getTime()))) 
      : new Date();
    
    const calculatedMonths = (new Date().getFullYear() - earliestDate.getFullYear()) * 12 + new Date().getMonth() - earliestDate.getMonth() + 1;
    const finalMonthsUsed = Math.max(1, calculatedMonths); 
    
    const baseFee = 3000;        
    const perAssetFee = 50;      
    const perPhotoFee = 1;       
    const perJobFee = 5;         

    const uPaid = (finalMonthsUsed * (totalAssetsCount * perAssetFee)) + (totalLifetimePhotos * perPhotoFee) + (totalJobs * perJobFee);
    const cUsageBill = (totalAssetsCount * perAssetFee) + (monthlyPhotos * perPhotoFee) + (currentMonthJobs * perJobFee);

    const operationalSavings = totalJobs * 150; 
    const printAndStorageSavings = totalLifetimePhotos * 5; 
    const profit = operationalSavings + printAndStorageSavings;

    return { 
        usagePaid: uPaid, 
        totalSystemProfit: profit, 
        currentUsageBill: cUsageBill, 
        baseMonthlyFee: baseFee 
    };
  }, [jobs, totalJobs, totalLifetimePhotos, totalAssetsCount, monthlyPhotos, currentMonthJobs]);

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Hoş Geldin, {currentUserName} 👋
          </h2>
          <p className="text-slate-500 text-xs mt-1">Sistem üzerindeki anlık özetin aşağıdadır.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button 
              onClick={handleCopyLink} 
              className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm border border-slate-700"
            >
               {copied ? <Check size={14} className="text-emerald-400" /> : <LinkIcon size={14} className="text-blue-400" />}
               {copied ? 'Bağlantı Kopyalandı' : 'Personel Giriş Linkini Kopyala'}
            </button>
        </div>
      </div>

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
                                <h3 className="text-sm font-black leading-tight mb-1 truncate">{job.customer_name}</h3>
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
                                <h3 className="text-sm font-black leading-tight mb-1 truncate">{job.customer_name}</h3>
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

      {!isMyJobsTab && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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

            <div onClick={() => setActiveTab('jobs')} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:border-indigo-300 transition-colors group cursor-pointer active:scale-95 sm:col-span-2 md:col-span-1 lg:col-span-1">
              <div className="w-10 h-10 bg-indigo-50/80 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shrink-0">
                <ImageIcon size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1">{monthlyPhotos}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wide">Bu Ayki Foto</div>
              </div>
            </div>
          </div>
      )}

      {!isMyJobsTab && (
          <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${userRole === 'Patron' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
            
            {userRole === 'Patron' && (
              <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-800 flex flex-col relative overflow-hidden finance-block">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
                 
                 <div className="flex justify-between items-start mb-6 z-10 relative">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <Wallet size={16} className="text-blue-400" />
                       <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Kasa Özeti</span>
                     </div>
                     <div className="text-[10px] text-slate-500 mb-1 font-semibold">Net Bakiye</div>
                     <div className="text-2xl sm:text-3xl font-black text-white tracking-tight break-all">₺{netCash.toLocaleString('tr-TR')}</div>
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
                
                const ownerName = data?.ownerName?.split(' ')[0] || 'Patron';
                const createdBy = j.details?.createdBy || ownerName;
                const creatorRole = j.details?.creatorRole || (createdBy === ownerName ? 'Patron' : 'Yönetici');
                const isPatronCreated = creatorRole === 'Patron' || createdBy === ownerName;
                
                let managerName = j.details?.managerName || null;
                let workerName = null;

                const assignedStaff = j.staff_id ? staff.find((s:any) => String(s.id) === String(j.staff_id)) : null;

                if (assignedStaff) {
                    if (assignedStaff.role === 'Yönetici') {
                        if (!managerName) managerName = assignedStaff.name; 
                    } else {
                        workerName = assignedStaff.name; 
                    }
                }

                const isApproved = j.status === 'Tamamlandı';
                const staffColor = isApproved ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200';
                
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
                      <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{j.customer_name}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {j.work_type}
                      </div>
                    </td>
                    
                    <td className="px-5 py-4 align-middle">
                      <div className="flex flex-col gap-1.5">
                        
                        {isPatronCreated ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck size={14} className={isApproved ? 'text-emerald-500' : 'text-slate-400'} />
                              <span className="text-[9px] font-black text-slate-400 uppercase w-[56px] tracking-wider">Atayan:</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isApproved ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'} whitespace-nowrap shadow-sm`}>
                                {createdBy}
                              </span>
                            </div>
                    
                            <div className="flex items-center gap-1.5">
                              <User size={14} className={managerName ? (isApproved ? 'text-emerald-500' : 'text-amber-500') : 'text-slate-300'} />
                              <span className="text-[9px] font-black text-slate-400 uppercase w-[56px] tracking-wider">Sorumlu:</span>
                              {managerName ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${staffColor} whitespace-nowrap shadow-sm`}>
                                  {managerName}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-400 whitespace-nowrap">
                                  Atanmadı
                                </span>
                              )}
                            </div>
                    
                            <div className="flex items-center gap-1.5">
                              <Wrench size={14} className={workerName ? (isApproved ? 'text-emerald-500' : 'text-amber-500') : 'text-slate-300'} />
                              <span className="text-[9px] font-black text-slate-400 uppercase w-[56px] tracking-wider">Usta:</span>
                              {workerName ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${staffColor} whitespace-nowrap shadow-sm`}>
                                  {workerName}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-400 whitespace-nowrap">
                                  Atanmadı
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck size={14} className={isApproved ? 'text-emerald-500' : 'text-amber-500'} />
                              <span className="text-[9px] font-black text-slate-400 uppercase w-[100px] tracking-wider">Sorumlu (Atayan):</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${staffColor} whitespace-nowrap shadow-sm`}>
                                {createdBy}
                              </span>
                            </div>
                    
                            <div className="flex items-center gap-1.5">
                              <Wrench size={14} className={workerName ? (isApproved ? 'text-emerald-500' : 'text-amber-500') : 'text-slate-300'} />
                              <span className="text-[9px] font-black text-slate-400 uppercase w-[100px] tracking-wider">Saha Ustası:</span>
                              {workerName ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${staffColor} whitespace-nowrap shadow-sm`}>
                                  {workerName}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-400 whitespace-nowrap">
                                  Atanmadı
                                </span>
                              )}
                            </div>
                          </>
                        )}

                      </div>
                    </td>

                    <td className="px-5 py-4 align-middle font-semibold text-slate-600 whitespace-nowrap">
                      {j.scheduled_date || 'Anlık Kayıt'}
                    </td>
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-3">
                         <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide border shadow-sm ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'} whitespace-nowrap uppercase`}>
                           {j.status}
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
             const ownerName = data?.ownerName?.split(' ')[0] || 'Patron';
             const createdBy = j.details?.createdBy || ownerName;
             const creatorRole = j.details?.creatorRole || (createdBy === ownerName ? 'Patron' : 'Yönetici');
             const isPatronCreated = creatorRole === 'Patron' || createdBy === ownerName;
             
             let managerName = j.details?.managerName || null;
             let workerName = null;

             const assignedStaff = j.staff_id ? staff.find((s:any) => String(s.id) === String(j.staff_id)) : null;

             if (assignedStaff) {
                 if (assignedStaff.role === 'Yönetici') {
                     if (!managerName) managerName = assignedStaff.name; 
                 } else {
                     workerName = assignedStaff.name; 
                 }
             }

             const isApproved = j.status === 'Tamamlandı';
             const staffColor = isApproved ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200';

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
                    <div className="min-w-0">
                      <div className="font-black text-slate-800 text-sm truncate">{j.customer_name}</div>
                      <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider truncate bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">{j.work_type}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0 shadow-sm ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {j.status}
                    </span>
                 </div>

                 <div className="flex flex-col gap-2">
                    {isPatronCreated ? (
                      <>
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={14} className={isApproved ? 'text-emerald-500 shrink-0' : 'text-slate-400 shrink-0'} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 w-[55px]">Atayan:</span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md border truncate ${isApproved ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                            {createdBy}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User size={14} className={managerName ? (isApproved ? 'text-emerald-500 shrink-0' : 'text-amber-500 shrink-0') : 'text-slate-300 shrink-0'} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 w-[55px]">Sorumlu:</span>
                          {managerName ? (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border truncate ${staffColor}`}>
                              {managerName}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 bg-slate-100 text-slate-400 truncate">
                              Atanmadı
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Wrench size={14} className={workerName ? (isApproved ? 'text-emerald-500 shrink-0' : 'text-amber-500 shrink-0') : 'text-slate-300 shrink-0'} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 w-[55px]">Usta:</span>
                          {workerName ? (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border truncate ${staffColor}`}>
                              {workerName}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 bg-slate-100 text-slate-400 truncate">
                              Atanmadı
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={14} className={isApproved ? 'text-emerald-500 shrink-0' : 'text-amber-500 shrink-0'} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 w-[105px]">Sorumlu (Atayan):</span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md border truncate ${staffColor}`}>
                            {createdBy}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wrench size={14} className={workerName ? (isApproved ? 'text-emerald-500 shrink-0' : 'text-amber-500 shrink-0') : 'text-slate-300 shrink-0'} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 w-[105px]">Saha Ustası:</span>
                          {workerName ? (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border truncate ${staffColor}`}>
                              {workerName}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 bg-slate-100 text-slate-400 truncate">
                              Atanmadı
                            </span>
                          )}
                        </div>
                      </>
                    )}
                 </div>

                 <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                   <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1.5 w-fit">
                      <Calendar size={12} className="text-slate-400" /> {j.scheduled_date || 'Tarih Planlanmadı'}
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

      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden finance-block mt-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Database size={16} className="text-blue-400" /> Başlangıçtan Bugüne Sistem Verileri
            </h3>
            
            {userRole === 'Patron' && (
              <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
                  <ShieldCheck size={14} className="text-blue-400" />
                  <div className="flex flex-col">
                      <span className="text-[9px] text-blue-400/80 font-black uppercase tracking-widest">Altyapı & Lisans</span>
                      <span className="text-xs font-bold text-white leading-none mt-0.5">₺{baseMonthlyFee.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-normal">/ Ay</span></span>
                  </div>
              </div>
            )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
               <div className="text-2xl font-black text-white mb-1">{totalJobs}</div>
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Toplam İş Kaydı</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
               <div className="text-2xl font-black text-emerald-400 mb-1">{totalLifetimePhotos}</div>
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saha Fotoğrafı</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
               <div className="text-2xl font-black text-blue-400 mb-1">{totalCustomersCount}</div>
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kayıtlı Müşteri</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
               <div className="text-2xl font-black text-amber-400 mb-1">{totalAssetsCount}</div>
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cihaz / Varlık</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center sm:col-span-3 md:col-span-1">
               <div className="text-2xl font-black text-purple-400 mb-1">{totalStockTypes}</div>
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Farklı Stok Kalemi</div>
            </div>
        </div>

        <div className={`grid grid-cols-1 gap-3 sm:gap-4 pt-5 border-t border-white/10 ${userRole === 'Patron' ? 'lg:grid-cols-3' : ''}`}>
            
            <div className={`${userRole === 'Patron' ? 'lg:col-span-2' : ''} bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 sm:p-6 flex flex-col justify-center relative overflow-hidden`}>
               <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4"><TrendingUp size={120} /></div>
               <div className="text-xs text-emerald-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 z-10"><TrendingUp size={16}/> Önlenen Gizli Operasyon Maliyeti (Tüm Zamanlar)</div>
               <div className="text-4xl sm:text-5xl font-black text-emerald-500 mt-1 mb-2 z-10">₺{totalSystemProfit.toLocaleString('tr-TR')}</div>
               <div className="text-[10px] sm:text-xs text-emerald-400/70 font-medium z-10 max-w-lg">Kasa haricinde; tüm zamanlar boyunca zaman, kağıt, telefon trafiği ve personel mesaisinden elde edilen tahmini tasarruf miktarıdır.</div>
            </div>
            
            {userRole === 'Patron' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 sm:p-6 flex flex-col justify-center relative">
                 <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><Activity size={14}/> Bu Ayki İşlem (Kullanım) Ücreti</div>
                 <div className="text-3xl sm:text-4xl font-black text-white mt-1 mb-2">₺{currentUsageBill.toLocaleString('tr-TR')}</div>
                 <div className="text-[10px] text-slate-500 font-medium pt-3 border-t border-white/5 mt-auto">
                    <span className="block text-slate-400 font-bold mb-0.5">Tüm Zamanlar Toplam İşlem Ücreti:</span>
                    ₺{usagePaid.toLocaleString('tr-TR')}
                 </div>
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

    </motion.div>
  );
}