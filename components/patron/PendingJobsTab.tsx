'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, Calendar, ShieldCheck, User, Wrench, FileText, ArrowUpRight, WifiOff, Check, AlertTriangle, X, Clock } from 'lucide-react';
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
  const waitingForWorkerJobs = localJobs.filter((j: any) => (j.status === 'Beklemede' || j.status === 'Gelecek') && j.staff_id);

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

    try {
      const res = await fetch(`https://backend.isdokumu.workers.dev/${endpoint}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      
      if (res.ok) {
        router.refresh(); 
        setAlertModal({ isOpen: true, title: 'Başarılı!', message: 'İş başarıyla onaylandı ve kasaya (gelirlere) işlendi!', type: 'success' });
        // Fiyat inputunu temizle
        setJobPrices((prev: any) => { const newPrices = {...prev}; delete newPrices[job.id]; return newPrices; });
      } else {
        setAlertModal({ isOpen: true, title: 'Hata Oluştu', message: 'Sunucu isteği reddetti. Lütfen yetkinizi veya bağlantınızı kontrol edin.', type: 'error' });
      }
    } catch (e) { 
      // ÇEVRİMDIŞI İŞLEM KUYRUĞU
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

      // Formu temizle
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
                  
                  const assignedManager = j.staff_id ? staff.find((s:any) => s.id === j.staff_id) : null;
                  const assignedWorker = j.details?.worker_id ? staff.find((s:any) => s.id === j.details?.worker_id) : null;
                  const actionBy = j.details?.lastEditedBy || data?.ownerName?.split(' ')[0] || 'Yönetici';
                  const isSamePerson = assignedManager && assignedManager.name === actionBy;

                  // 🚀 İlgili varlığı ve apartman adını bul
                  const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
                  const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;
                  
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
                        
                        {/* 🚀 Varlık Adı */}
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
                      
                      <td className="px-5 py-4 align-top border-r border-slate-50">
                        <div className="flex flex-col gap-2">
                          {isSamePerson ? (
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={14} className="text-blue-500" />
                              <span className="text-[10px] font-black text-slate-400 uppercase w-[100px] tracking-wider">Atayan & Sorumlu:</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap shadow-sm">
                                {assignedManager.name}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <ShieldCheck size={14} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase w-[56px] tracking-wider">Atayan:</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 whitespace-nowrap shadow-sm">
                                  {actionBy}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User size={14} className={assignedManager ? 'text-blue-500' : 'text-slate-300'} />
                                <span className="text-[10px] font-black text-slate-400 uppercase w-[56px] tracking-wider">Sorumlu:</span>
                                {assignedManager ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap shadow-sm">
                                    {assignedManager.name}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-400 whitespace-nowrap">Atanmadı</span>
                                )}
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-2">
                            <Wrench size={14} className={assignedWorker ? 'text-blue-500' : 'text-slate-300'} />
                            <span className="text-[10px] font-black text-slate-400 uppercase w-[56px] pl-0.5 tracking-wider">Usta:</span>
                            {assignedWorker ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap shadow-sm">
                                {assignedWorker.name}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-400 whitespace-nowrap">Atanmadı</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top font-bold text-slate-600 whitespace-nowrap border-r border-slate-50">
                         <div className="flex items-center gap-1.5"><Calendar size={14} className="text-amber-500" /> {j.scheduled_date || 'Tarih Planlanmadı'}</div>
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

         {/* MOBİL GÖRÜNÜM: DİKEY KARTLAR (Yatay Scroll'u Engeller) */}
         <div className="md:hidden flex flex-col gap-3">
         {pendingJobs.length > 0 ? pendingJobs.map((j: any) => {
              const assignedManager = j.staff_id ? staff.find((s:any) => s.id === j.staff_id) : null;
              const assignedWorker = j.details?.worker_id ? staff.find((s:any) => s.id === j.details?.worker_id) : null;
              const actionBy = j.details?.lastEditedBy || data?.ownerName?.split(' ')[0] || 'Yönetici';
              const isSamePerson = assignedManager && assignedManager.name === actionBy;

              // 🚀 İlgili varlığı ve apartman adını bul
              const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
              const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

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
                      
                      {/* 🚀 Mobil Varlık Adı */}
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

                  {/* Personel Bilgisi */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <div className="flex flex-col gap-1 min-w-0">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isSamePerson ? 'ATAYAN & SORUMLU' : 'SORUMLU'}</div>
                        <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5 truncate bg-blue-50 px-2 py-1 rounded border border-blue-100 w-fit">
                          {isSamePerson ? (
                            <><ShieldCheck size={10} className="shrink-0" /> <span className="truncate">{assignedManager.name}</span></>
                          ) : (
                            <><User size={10} className="shrink-0" /> <span className="truncate">{assignedManager ? assignedManager.name : 'Atanmadı'}</span></>
                          )}
                        </div>
                     </div>
                     <div className="flex flex-col gap-1 min-w-0">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SAHA USTASI</div>
                        <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 truncate bg-white px-2 py-1 rounded border border-slate-200 w-fit">
                          <Wrench size={10} className="text-slate-400 shrink-0" /> <span className="truncate">{assignedWorker ? assignedWorker.name : 'Atanmadı'}</span>
                        </div>
                     </div>
                  </div>

                  {/* Fiyat ve Onay Alanı (Tam Genişlik) */}
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
                 <h2 className="text-lg font-black text-slate-800 tracking-tight">Ustada Bekleyen Atamalar ({waitingForWorkerJobs.length})</h2>
                 <p className="text-xs font-medium text-slate-500 mt-0.5">Personel atanmış ancak ustaların henüz sahada "İşe Başla" demediği görevler.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
             {waitingForWorkerJobs.map((j: any) => {
               const assignedWorker = j.staff_id ? staff.find((s:any) => s.id === j.staff_id) : null;
               
               // 🚀 İlgili varlığı ve apartman adını bul
               const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
               const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

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
                       {/* 🚀 Varlık Adı */}
                       <div className="text-[10px] font-bold text-slate-500 mt-1 truncate">
                          {currentAsset?.name || 'Bağımsız İş'}
                       </div>
                     </div>
                     <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider whitespace-nowrap border border-slate-200 shadow-sm shrink-0">
                       {j.status}
                     </span>
                   </div>
                   
                   <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                     <User size={14} className="text-slate-400" />
                     Atanan: <span className="text-blue-600 font-bold">{assignedWorker ? assignedWorker.name : 'Bilinmiyor'}</span>
                   </div>

                   {setSelectedJob && (
                     <button 
                       onClick={() => setSelectedJob(j)}
                       className="text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-end gap-1 w-full mt-1 active:scale-95"
                     >
                       Detayları Gör <ArrowUpRight size={12} />
                     </button>
                   )}
                 </div>
               )
             })}
           </div>
         </div>
       )}

       {/* ŞIK UYARI MODALI (Alert yerine geçer) */}
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