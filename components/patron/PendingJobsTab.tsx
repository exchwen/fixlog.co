'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, Calendar, ShieldCheck, User, Wrench, FileText, ArrowUpRight, WifiOff, Check, AlertTriangle, X, Clock, UserPlus, UserCheck } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function PendingJobsTab({ data, setSelectedJob }: any) {
  const params = useParams();
  const router = useRouter();
  const activeSlug = params?.slug || localStorage.getItem('companySlug');

  const [jobPrices, setJobPrices] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Çevrimdışı kontrolü için State
  const [isOffline, setIsOffline] = useState(false);

  // Şık Uyarı Modalı State'i
  const [alertModal, setAlertModal] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'warning'}>({ 
    isOpen: false, title: '', message: '', type: 'warning' 
  });

  const localJobs = data?.jobs || [];
  const staff = data?.staff || [];
  
  // 1. Yönetici onayını bekleyen ve fiyatlandırılacak BİTMİŞ işler
  const pendingJobs = localJobs.filter((j: any) => j.status === 'Onay Bekliyor');

  // 2. Usta ataması yapılmış ama usta tarafından henüz "Devam Ediyor" yapılmamış işler
  const waitingForWorkerJobs = localJobs.filter((j: any) => (j.status === 'Beklemede' || j.status === 'Gelecek' || j.status === 'Usta Bekliyor'));

  // İnternet durumunu anlık dinleyen yapı
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const statusColors: any = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200',
    'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200',
    'Usta Bekliyor': 'bg-indigo-100 text-indigo-700 border-indigo-200'
  };

  // 🚀 FİNAL DÜZELTME: Dinamik Statü Kontrolü (Mantık Hatalarını ve Gecikmeleri Tespit Eder)
  const getDynamicStatus = (job: any, hasWorker: boolean) => {
    let label = job.status || 'Beklemede';

    const isGeneralTask = job.work_type === 'Genel Görev' || job.work_type === 'Görev' || !job.customer_name || job.customer_name === 'Genel Görev';

    // 1. İş Onay Bekliyorsa, Tamamlandıysa veya İptal edildiyse statüye MÜDAHALE ETME.
    if (label === 'Onay Bekliyor' || label === 'Tamamlandı' || label === 'İptal') {
        let colorClass = statusColors[label] || 'bg-slate-100 text-slate-500 border-slate-200';
        return { label, colorClass };
    }

    // 2. İş AKTİF bir görevse ve henüz bitmediyse:
    if (isGeneralTask) {
        // Genel Görevlere usta atanmaz. Beklemede veya Devam Ediyor olur.
        label = (label === 'Devam Ediyor' || label === 'Usta Bekliyor') ? 'Devam Ediyor' : 'Beklemede';
    } else {
        // Normal İş Ataması
        if (hasWorker) {
            // Eğer bir USTA atanmışsa, Usta "Devam Ediyor" (İşe Başla) yapana kadar statü "Usta Bekliyor" olmalıdır.
            label = label === 'Devam Ediyor' ? 'Devam Ediyor' : 'Usta Bekliyor';
        } else {
            // Usta atanmamışsa "Beklemede" veya planlıysa "Gelecek" kalır.
            label = label === 'Gelecek' ? 'Gelecek' : 'Beklemede';
        }
    }

    let colorClass = statusColors[label] || 'bg-slate-100 text-slate-500 border-slate-200';

    // Gecikme Kontrolü
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

  // Yönetici İşi Onaylayıp Gelir Olarak Kaydeder
  const handleApproveJob = async (job: any) => {
    const amount = jobPrices[job.id];
    
    if (!amount || amount <= 0) {
      setAlertModal({ isOpen: true, title: 'Fiyat Eksik!', message: 'Lütfen onaylamadan önce geçerli bir fiyat giriniz.', type: 'warning' });
      return;
    }
    
    setIsProcessing(job.id);

    const endpoint = 'approve-job';
    const bodyData = { slug: activeSlug, jobId: job.id, amount: parseFloat(amount), customerName: job.customer_name };

    const attemptRequest = async (retries: number = 3): Promise<boolean> => {
      try {
        const res = await fetch(`https://backend.isdokumu.workers.dev/${endpoint}`, {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
        
        if (!res.ok) {
          if (retries > 0) {
            await new Promise(r => setTimeout(r, 2000));
            return attemptRequest(retries - 1);
          }
          setAlertModal({ isOpen: true, title: 'Hata Oluştu', message: 'Sunucu isteği reddetti. Lütfen yetkinizi veya bağlantınızı kontrol edin.', type: 'error' });
          return false;
        }
        
        router.refresh(); 
        setAlertModal({ isOpen: true, title: 'Başarılı!', message: 'İş başarıyla onaylandı ve kasaya (gelirlere) işlendi!', type: 'success' });
        setJobPrices((prev: any) => { const newPrices = {...prev}; delete newPrices[job.id]; return newPrices; });
        return true;
      } catch (e) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 3000));
          return attemptRequest(retries - 1);
        }
        throw e;
      }
    };

    try {
      await attemptRequest();
    } catch (e) { 
      console.warn("İnternet bağlantısı yok veya sunucuya ulaşılamadı. Onay işlemi kuyruğa alındı.");
      
      const pending = JSON.parse(localStorage.getItem(`offline_actions_${activeSlug}`) || '[]');
      pending.push({ endpoint, body: bodyData, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_actions_${activeSlug}`, JSON.stringify(pending));
      
      setAlertModal({ 
        isOpen: true, 
        title: 'Çevrimdışı Kayıt', 
        message: 'İnternet bağlantınız yok. Onay işlemi cihazınıza kaydedildi, bağlantı geldiğinde otomatik olarak sisteme aktarılacaktır.', 
        type: 'warning' 
      });

      setJobPrices((prev: any) => { const newPrices = {...prev}; delete newPrices[job.id]; return newPrices; });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-8 relative">

       {/* 1. KUTU (YUKARI ALINDI): ONAY BEKLEYEN (TAMAMLANAN) İŞLER */}
       <div className="space-y-4">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-0 sm:bg-transparent rounded-3xl border sm:border-none border-slate-200 shadow-sm sm:shadow-none mb-2">
           <div>
             <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <span className="relative flex h-3.5 w-3.5 shrink-0">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
               </span>
               Fiyat & Onay Bekleyen İşler
             </h2>
             <p className="text-xs font-medium text-slate-500 mt-1">Sahada tamamlanmış ancak fiyatlandırılıp kasaya işlenmemiş son aşama işler.</p>
           </div>
         </div>

         {/* MASAÜSTÜ GÖRÜNÜMÜ: TABLO (Mobilde Gizlenir) */}
         <div className="hidden md:flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col overflow-x-auto custom-scrollbar">
          <div className="overflow-y-auto max-h-[70vh]">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead className="bg-slate-50 text-slate-600 font-black border-b border-slate-200 sticky top-0 z-10 shadow-sm uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-4 w-[25%] whitespace-nowrap">Müşteri / İş Detayı</th>
                  <th className="px-5 py-4 w-[30%] whitespace-nowrap">Personel Dağılımı</th>
                  <th className="px-5 py-4 w-[15%] whitespace-nowrap">Tarih</th>
                  <th className="px-5 py-4 w-[30%] text-right whitespace-nowrap">Fiyat & Onay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {pendingJobs.length > 0 ? pendingJobs.map((j: any) => {
                  
                  // 🚀 D1 SÜTUNLARINDAN DİREKT OKUMA (Geriye Dönük Uyumluluk Eklendi)
                  const creator = j.creator_name || j.details?.createdBy || (data?.ownerName?.split(' ')[0] || 'Sistem');
                  const manager = j.manager_name || j.details?.managerName || null;
                  let worker = j.worker_name || null;

                  if (!worker) {
                      if (j.details?.worker_id) {
                          const w = staff.find((s:any) => String(s.id) === String(j.details?.worker_id));
                          if (w) worker = w.name;
                      } else if (j.staff_id) {
                          const w = staff.find((s:any) => String(s.id) === String(j.staff_id));
                          if (w && w.role === 'Usta') worker = w.name;
                      }
                  }

                  const isCreatorSameAsManager = manager && creator === manager;

                  // 🚀 İlgili varlığı ve apartman adını bul
                  const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
                  const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;
                  
                  // 🚀 YENİ: Varlığın varsayılan rota personeli var mı?
                  const recommendedStaff = currentAsset?.route_staff_id ? staff.find((s:any) => String(s.id) === String(currentAsset.route_staff_id))?.name : null;

                  const dynamicStatus = getDynamicStatus(j, !!worker);

                  return (
                    <tr key={j.id} className="hover:bg-amber-50/50 transition-colors group">
                      <td className="px-5 py-4 align-top border-r border-slate-50">
                        <div className="font-bold text-slate-800 text-sm mb-1.5 group-hover:text-amber-700 transition-colors">
                          {aptName ? (
                            <><span className="text-amber-600">{aptName}</span> - {j.customer_name}</>
                          ) : (
                            j.customer_name
                          )}
                        </div>
                        
                        <div className="text-[10px] font-black text-slate-600 mb-2 truncate max-w-[200px]">
                           {currentAsset?.name || 'Bağımsız İş'}
                        </div>

                        <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-3 bg-slate-50 w-max px-2 py-0.5 rounded border border-slate-100">
                           <FileText size={12} className="text-slate-400" /> {j.work_type}
                        </div>
                        
                        {setSelectedJob && (
                          <button 
                            onClick={() => setSelectedJob(j)}
                            className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 w-max shadow-sm"
                          >
                            <ArrowUpRight size={12} /> Detayları Görüntüle
                          </button>
                        )}
                      </td>
                      
                      {/* 🚀 DÜZELTİLMİŞ: Masaüstü Personel Hiyerarşisi UI (Sabit Genişlikli Izgara) */}
                      <td className="px-5 py-4 align-top border-r border-slate-50">
                        <div className="flex flex-col gap-2 w-fit">
                          {isCreatorSameAsManager ? (
                              <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5 w-[130px] shrink-0">
                                    <ShieldCheck size={14} className="text-blue-600" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ATAYAN & SORUMLU:</span>
                                  </div>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap shadow-sm">
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
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap shadow-sm">
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
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 whitespace-nowrap shadow-sm">
                                          {worker}
                                      </span>
                                  ) : (
                                      <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 whitespace-nowrap shadow-sm">
                                              Atanmadı
                                          </span>
                                          {recommendedStaff && (
                                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                  Öneri: {recommendedStaff}
                                              </span>
                                          )}
                                      </div>
                                  )}
                              </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top font-bold text-slate-600 whitespace-nowrap border-r border-slate-50">
                         <div className="flex items-center gap-1.5">
                           <Calendar size={14} className={dynamicStatus.label === 'Gecikti' ? 'text-rose-500' : 'text-amber-500'} /> 
                           {j.scheduled_date || 'Tarih Planlanmadı'}
                         </div>
                      </td>
                      
                      <td className="px-5 py-4 align-top text-right bg-slate-50/50">
                         <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2.5 w-full">
                           <div className="relative w-full max-w-[140px]">
                             <span className="absolute left-3 top-2.5 font-bold text-slate-400">₺</span>
                             <input 
                               type="number" 
                               placeholder="Fiyat Girin" 
                               className="w-full pl-7 pr-3 py-2 border border-amber-300 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 bg-white shadow-inner font-black text-sm text-slate-800 transition-all placeholder:font-bold placeholder:text-xs" 
                               value={jobPrices[j.id] || ''} 
                               onChange={e => setJobPrices({...jobPrices, [j.id]: e.target.value})} 
                             />
                           </div>
                           <button 
                             onClick={() => handleApproveJob(j)} 
                             disabled={isProcessing === j.id} 
                             className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 disabled:opacity-50 w-full sm:w-auto h-[38px] whitespace-nowrap"
                           >
                             {isProcessing === j.id ? <Loader2 className="animate-spin" size={16} /> : (
                               isOffline ? <><WifiOff size={16} /> Kuyruğa Al</> : <><CheckCircle size={16} /> Kasaya İşle</>
                             )}
                           </button>
                         </div>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan={4} className="p-24 text-center text-slate-400 font-medium text-sm bg-slate-50">Harika! Fiyatlandırılıp onaylanacak bir iş yok.</td></tr>}
              </tbody>
            </table>
          </div>
         </div>

         {/* MOBİL GÖRÜNÜM (ONAY BEKLEYENLER) */}
         <div className="md:hidden flex flex-col gap-3">
           {pendingJobs.length > 0 ? pendingJobs.map((j: any) => {
              
              // 🚀 D1 SÜTUNLARINDAN DİREKT OKUMA
              const creator = j.creator_name || (data?.ownerName?.split(' ')[0] || 'Sistem');
              const manager = j.manager_name || null;
              let worker = j.worker_name || null;

              if (!worker) {
                  if (j.details?.worker_id) {
                      const w = staff.find((s:any) => String(s.id) === String(j.details?.worker_id));
                      if (w) worker = w.name;
                  } else if (j.staff_id) {
                      const w = staff.find((s:any) => String(s.id) === String(j.staff_id));
                      if (w && w.role === 'Usta') worker = w.name;
                  }
              }

              const isCreatorSameAsManager = manager && creator === manager;
              const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
              const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;
              
              // 🚀 YENİ: Varlığın varsayılan rota personeli var mı?
              const recommendedStaff = currentAsset?.route_staff_id ? staff.find((s:any) => String(s.id) === String(currentAsset.route_staff_id))?.name : null;

              const dynamicStatus = getDynamicStatus(j, !!worker);

              return (
                <div key={j.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-4">
                  
                  {/* Müşteri ve İş Tipi */}
                  <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                    <div className="min-w-0 flex flex-col gap-1">
                      <div className="font-black text-slate-800 text-sm truncate">
                        {aptName ? (
                            <><span className="text-amber-600">{aptName}</span> - {j.customer_name}</>
                        ) : (
                            j.customer_name
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-slate-600 truncate">
                        {currentAsset?.name || 'Bağımsız İş'}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-0.5 bg-slate-50 w-max px-2 py-0.5 rounded border border-slate-100">
                         <FileText size={10} className="text-slate-400" /> {j.work_type}
                      </div>
                    </div>
                    {setSelectedJob && (
                      <button 
                        onClick={() => setSelectedJob(j)}
                        className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 shrink-0 border border-blue-100"
                      >
                        Detay <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>

                  {/* 🚀 DÜZELTİLMİŞ: Mobil Personel Hiyerarşisi UI */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                      {isCreatorSameAsManager ? (
                          <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                                 <ShieldCheck size={10} /> ATAYAN & SORUMLU
                              </span>
                              <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                                  {manager}
                              </div>
                          </div>
                      ) : (
                          <>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                                   <UserPlus size={10} /> ATAYAN
                                </span>
                                <div className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                    {creator}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                                   <UserCheck size={10} /> SORUMLU
                                </span>
                                <div className={`text-[11px] font-bold px-2 py-0.5 rounded border shadow-sm ${manager ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-100 border-slate-200'}`}>
                                    {manager || '-'}
                                </div>
                            </div>
                          </>
                      )}
                      
                      <div className="flex items-center gap-2 border-t border-slate-200 pt-2 border-dashed">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                             <Wrench size={10} /> SAHA USTASI
                          </span>
                          <div className={`flex items-center gap-1.5 ${worker ? '' : 'flex-wrap'}`}>
                              <div className={`text-[11px] font-bold px-2 py-0.5 rounded border shadow-sm ${worker ? 'text-indigo-700 bg-indigo-50 border-indigo-100' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
                                  {worker || 'Atanmadı'}
                              </div>
                              {!worker && recommendedStaff && (
                                  <div className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                      Öneri: {recommendedStaff}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Fiyat ve Onay Alanı */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-slate-50">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fiyat Belirle ve Onayla</label>
                     <div className="flex flex-col gap-2 w-full">
                       <div className="relative w-full">
                         <span className="absolute left-3 top-3 font-bold text-slate-400 text-sm">₺</span>
                         <input 
                           type="number" 
                           placeholder="Tutar (Örn: 1500)" 
                           className="w-full pl-8 pr-4 py-3 border border-amber-300 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 bg-slate-50 shadow-inner font-black text-base text-slate-800 transition-all placeholder:font-bold placeholder:text-xs" 
                           value={jobPrices[j.id] || ''} 
                           onChange={e => setJobPrices({...jobPrices, [j.id]: e.target.value})} 
                         />
                       </div>
                       <button 
                         onClick={() => handleApproveJob(j)} 
                         disabled={isProcessing === j.id} 
                         className="w-full bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
                       >
                         {isProcessing === j.id ? <Loader2 className="animate-spin" size={18} /> : (
                           isOffline ? <><WifiOff size={18} /> Kuyruğa Al ve Kasaya İşle</> : <><Check size={18} strokeWidth={3} /> İşi Onayla ve Kasaya İşle</>
                         )}
                       </button>
                     </div>
                  </div>

                </div>
              );
           }) : (
             <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3">
                <CheckCircle size={40} className="text-emerald-400" />
                <span className="text-slate-500 font-medium text-sm">Harika! Fiyatlandırılıp onaylanacak bir iş yok.</span>
             </div>
           )}
         </div>
       </div>

       {/* 2. KUTU (AŞAĞI ALINDI): USTA ONAYI BEKLEYEN İŞLER KUTUSU */}
       {waitingForWorkerJobs.length > 0 && (
         <div className="bg-blue-50/50 p-5 sm:p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
           
           <div className="flex items-center gap-3 mb-5 relative z-10">
              <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                 <Clock size={20} />
              </div>
              <div>
                 <h2 className="text-lg font-black text-slate-800 tracking-tight">İşleme Alınmayı Bekleyen Görevler ({waitingForWorkerJobs.length})</h2>
                 <p className="text-xs font-medium text-slate-500 mt-0.5">Personel atanmış ancak ustaların henüz sahada "İşe Başla" demediği görevler.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
             {waitingForWorkerJobs.map((j: any) => {
               
               // 🚀 D1 SÜTUNLARINDAN DİREKT OKUMA (Hiyerarşi Kusursuzlaştırıldı)
               const creatorName = j.creator_name || j.details?.createdBy || (data?.ownerName?.split(' ')[0] || 'Sistem');
               let managerName = j.manager_name || j.details?.managerName || null;
               let workerName = j.worker_name || null;

               // Geriye dönük uyumluluk (Eski JSON veriler için fallback)
               if (!workerName) {
                   if (j.details?.worker_id) {
                       const w = staff.find((s:any) => String(s.id) === String(j.details?.worker_id));
                       if (w) workerName = w.name;
                   } else if (j.staff_id) {
                       const w = staff.find((s:any) => String(s.id) === String(j.staff_id));
                       if (w && w.role === 'Usta') workerName = w.name;
                   }
               }

               const isCreatorSameAsManager = managerName && (creatorName === managerName);
               const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
               const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;
               
               // 🚀 YENİ: Varlığın varsayılan rota personeli var mı?
               const recommendedStaff = currentAsset?.route_staff_id ? staff.find((s:any) => String(s.id) === String(currentAsset.route_staff_id))?.name : null;

               const dynamicStatus = getDynamicStatus(j, !!workerName);

               return (
                 <div key={j.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 group hover:border-blue-300 transition-colors">
                   <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2">
                     <div className="min-w-0">
                       <div className="font-bold text-slate-800 text-sm truncate pr-2">
                          {aptName ? (
                              <><span className="text-blue-600">{aptName}</span> - {j.customer_name}</>
                          ) : (
                              j.customer_name
                          )}
                       </div>
                       <div className="text-[10px] font-bold text-slate-500 mt-1 truncate">
                          {currentAsset?.name || 'Bağımsız İş'}
                       </div>
                     </div>
                     <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider whitespace-nowrap border shadow-sm shrink-0 ${dynamicStatus.colorClass}`}>
                       {dynamicStatus.label}
                     </span>
                   </div>
                   
                   {/* 🚀 DÜZELTİLMİŞ: Mobil Personel Hiyerarşisi UI (Sabit Genişlikli Izgara) */}
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                      {isCreatorSameAsManager ? (
                          <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                                 <ShieldCheck size={10} /> ATAYAN & SORUMLU
                              </span>
                              <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                  {managerName}
                              </div>
                          </div>
                      ) : (
                          <>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                                   <UserPlus size={10} /> ATAYAN
                                </span>
                                <div className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {creatorName}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                                   <UserCheck size={10} /> SORUMLU
                                </span>
                                <div className={`text-[11px] font-bold px-2 py-0.5 rounded border ${managerName ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-100 border-slate-200'}`}>
                                    {managerName || '-'}
                                </div>
                            </div>
                          </>
                      )}
                      
                      <div className="flex items-center gap-2 border-t border-slate-200 pt-2 border-dashed">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                             <Wrench size={10} /> SAHA USTASI
                          </span>
                          <div className={`flex items-center gap-1.5 ${workerName ? '' : 'flex-wrap'}`}>
                              <div className={`text-[11px] font-bold px-2 py-0.5 rounded border ${workerName ? 'text-indigo-700 bg-indigo-50 border-indigo-100' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
                                  {workerName || 'Atanmadı'}
                              </div>
                              {!workerName && recommendedStaff && (
                                  <div className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                      Öneri: {recommendedStaff}
                                  </div>
                              )}
                          </div>
                      </div>
                   </div>

                   <div className="flex justify-between items-center mt-1">
                     <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                        <Calendar size={12} className={dynamicStatus.label === 'Gecikti' ? 'text-rose-500' : 'text-blue-400'} />
                        {j.scheduled_date || 'Tarih Yok'}
                     </div>
                     {setSelectedJob && (
                       <button 
                         onClick={() => setSelectedJob(j)}
                         className="text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-end gap-1 active:scale-95"
                       >
                         Detayları Gör <ArrowUpRight size={12} />
                       </button>
                     )}
                   </div>
                 </div>
               )
             })}
           </div>
         </div>
       )}

       {/* ŞIK UYARI MODALI */}
       <AnimatePresence>
          {alertModal.isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }} 
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
                  alertModal.type === 'success' ? 'bg-emerald-100 text-emerald-500 shadow-inner border border-emerald-200' : 
                  alertModal.type === 'error' ? 'bg-rose-100 text-rose-500 shadow-inner border border-rose-200' : 
                  'bg-amber-100 text-amber-500 shadow-inner border border-amber-200'
                }`}>
                  {alertModal.type === 'success' && <CheckCircle size={40} />}
                  {alertModal.type === 'error' && <X size={40} strokeWidth={3} />}
                  {alertModal.type === 'warning' && <AlertTriangle size={40} />}
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{alertModal.title}</h3>
                <p className="text-sm font-medium text-slate-600 mb-8 leading-relaxed">{alertModal.message}</p>
                
                <button 
                  onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg
                    ${alertModal.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 
                      alertModal.type === 'error' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 
                      'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
                >
                  Tamam, Anladım
                </button>
              </motion.div>
            </div>
          )}
       </AnimatePresence>

    </div>
  );
}