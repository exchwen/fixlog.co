'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, Calendar, ShieldCheck, User, Wrench, FileText, ArrowUpRight, WifiOff, Check } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function PendingJobsTab({ data, setSelectedJob }: any) {
  const params = useParams();
  const router = useRouter();
  const activeSlug = params?.slug || localStorage.getItem('companySlug');

  const [jobPrices, setJobPrices] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Çevrimdışı kontrolü için State
  const [isOffline, setIsOffline] = useState(false);

  const localJobs = data?.jobs || [];
  const staff = data?.staff || [];
  
  const pendingJobs = localJobs.filter((j: any) => j.status === 'Onay Bekliyor');

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
    if (!amount || amount <= 0) return alert("Lütfen onaylamadan önce geçerli bir fiyat giriniz.");
    
    setIsProcessing(job.id);

    // Hem online hem offline için body aynı
    const endpoint = 'approve-job';
    const bodyData = { slug: activeSlug, jobId: job.id, amount: parseFloat(amount), customerName: job.customer_name };

    try {
      const res = await fetch(`https://backend.isdokumu.workers.dev/${endpoint}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      
      if (res.ok) {
        // İşlem başarılıysa sayfayı yenile ki yeni veriler D1'den gelsin ve FinanceTab güncellensin.
        router.refresh(); 
        alert("İş başarıyla onaylandı ve gelirlere işlendi!");
      } else {
        alert("Sunucu reddetti. Lütfen veritabanı bağlantınızı kontrol edin.");
      }
    } catch (e) { 
      // ÇEVRİMDIŞI İŞLEM KUYRUĞU
      console.warn("İnternet bağlantısı yok veya sunucuya ulaşılamadı. Onay işlemi kuyruğa alındı.");
      
      const pending = JSON.parse(localStorage.getItem(`offline_actions_${activeSlug}`) || '[]');
      pending.push({ endpoint, body: bodyData, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_actions_${activeSlug}`, JSON.stringify(pending));
      
      // Kullanıcının beklemesini önlemek için işlemi yerel olarak "yapıldı" kabul edebilirsin, veya yenileme bekletebilirsin.
      // Şimdilik sadece uyarı veriyoruz, Dashboard internet gelince senkronize edecek.
      alert("İnternet bağlantınız yok. Onay işlemi cihazınıza kaydedildi, bağlantı geldiğinde otomatik olarak sisteme aktarılacaktır.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
       
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-0 sm:bg-transparent rounded-3xl border sm:border-none border-slate-200 shadow-sm sm:shadow-none mb-6">
         <div>
           <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <span className="relative flex h-3.5 w-3.5 shrink-0">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
             </span>
             Onay Bekleyen İşler
           </h2>
           <p className="text-xs font-medium text-slate-500 mt-1">Sahada tamamlanmış ancak fiyatlandırılıp kasaya işlenmemiş işler.</p>
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
                
                // Personel Hiyerarşisi Mantığı (HomeTab ile aynı)
                const assignedManager = j.staff_id ? staff.find((s:any) => s.id === j.staff_id) : null;
                const assignedWorker = j.details?.worker_id ? staff.find((s:any) => s.id === j.details?.worker_id) : null;
                const actionBy = j.details?.lastEditedBy || data?.ownerName?.split(' ')[0] || 'Yönetici';
                const isSamePerson = assignedManager && assignedManager.name === actionBy;
                
                return (
                  <tr key={j.id} className="hover:bg-amber-50/50 transition-colors group">
                    <td className="px-5 py-4 align-top border-r border-slate-50">
                      <div className="font-bold text-slate-800 text-sm mb-1 group-hover:text-amber-700 transition-colors">{j.customer_name}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-3 bg-slate-50 w-max px-2 py-0.5 rounded border border-slate-100">
                         <FileText size={12} className="text-slate-400" /> {j.work_type}
                      </div>
                      
                      {/* Tıklanabilir Detay Butonu (Tıklayınca DashboardModals içindeki detay açılır) */}
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
              }) : <tr><td colSpan={4} className="p-24 text-center text-slate-400 font-medium text-sm bg-slate-50">Harika! Onay bekleyen hiçbir işiniz kalmadı.</td></tr>}
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

            return (
              <div key={j.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-4">
                
                {/* Müşteri ve İş Tipi */}
                <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <div className="font-black text-slate-800 text-sm truncate">{j.customer_name}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-1 bg-slate-50 w-max px-2 py-0.5 rounded border border-slate-100">
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
           <div className="p-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
              <CheckCircle size={40} className="text-slate-300" />
              <span className="text-slate-500 font-medium text-sm">Harika! Onay bekleyen hiçbir işiniz kalmadı.</span>
           </div>
         )}
       </div>

    </div>
  );
}