'use client';

import React, { useState } from 'react';
import { CheckCircle, Loader2, Calendar, ShieldCheck, User, Wrench, FileText, ArrowUpRight } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function PendingJobsTab({ data, setSelectedJob }: any) {
  const params = useParams();
  const router = useRouter();
  const activeSlug = params?.slug || localStorage.getItem('companySlug');

  const [jobPrices, setJobPrices] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const localJobs = data?.jobs || [];
  const staff = data?.staff || [];
  
  const pendingJobs = localJobs.filter((j: any) => j.status === 'Onay Bekliyor');

  // Yönetici İşi Onaylayıp Gelir Olarak Kaydeder
  const handleApproveJob = async (job: any) => {
    const amount = jobPrices[job.id];
    if (!amount || amount <= 0) return alert("Lütfen onaylamadan önce geçerli bir fiyat giriniz.");
    
    setIsProcessing(job.id);
    try {
      const res = await fetch('https://backend.isdokumu.workers.dev/approve-job', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: activeSlug, jobId: job.id, amount: parseFloat(amount), customerName: job.customer_name })
      });
      
      if (res.ok) {
        // İşlem başarılıysa sayfayı yenile ki yeni veriler D1'den gelsin ve FinanceTab güncellensin.
        router.refresh(); 
        alert("İş başarıyla onaylandı ve gelirlere işlendi!");
      } else {
        alert("Sunucu reddetti. Lütfen veritabanı bağlantınızı kontrol edin.");
      }
    } catch (e) { 
      alert("Ağ bağlantısı kurulamadı!"); 
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
       
       <div className="flex justify-between items-center mb-6">
         <div>
           <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <span className="relative flex h-4 w-4">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
             </span>
             Onay Bekleyen İşler
           </h2>
           <p className="text-xs font-medium text-slate-500 mt-1">Sahada tamamlanmış ancak fiyatlandırılıp kasaya işlenmemiş işler.</p>
         </div>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-4 w-[25%]">Müşteri / İş Detayı</th>
                <th className="px-5 py-4 w-[30%]">Personel Dağılımı</th>
                <th className="px-5 py-4 w-[15%]">Tarih</th>
                <th className="px-5 py-4 w-[30%] text-right">Fiyat & Onay</th>
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
                  <tr key={j.id} className="hover:bg-amber-50/30 transition-colors group">
                    <td className="px-5 py-4 align-top">
                      <div className="font-bold text-slate-800 text-sm mb-1">{j.customer_name}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-3">
                         <FileText size={12} className="text-slate-400" /> {j.work_type}
                      </div>
                      
                      {/* Tıklanabilir Detay Butonu (Tıklayınca DashboardModals içindeki detay açılır) */}
                      {setSelectedJob && (
                        <button 
                          onClick={() => setSelectedJob(j)}
                          className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors w-max"
                        >
                          <ArrowUpRight size={12} /> Detayları Görüntüle
                        </button>
                      )}
                    </td>
                    
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        {isSamePerson ? (
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-blue-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase w-[100px]">Atayan & Sorumlu:</span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
                              {assignedManager.name}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={14} className="text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase w-[55px]">Atayan:</span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">
                                {actionBy}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User size={14} className={assignedManager ? 'text-blue-500' : 'text-slate-300'} />
                              <span className="text-[10px] font-bold text-slate-400 uppercase w-[55px]">Sorumlu:</span>
                              {assignedManager ? (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
                                  {assignedManager.name}
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-400">Atanmadı</span>
                              )}
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-2">
                          <Wrench size={14} className={assignedWorker ? 'text-blue-500' : 'text-slate-300'} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase w-[55px] pl-0.5">Usta:</span>
                          {assignedWorker ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
                              {assignedWorker.name}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-400">Atanmadı</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top font-semibold text-slate-600">
                       <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {j.scheduled_date || 'Tarihsiz'}</div>
                    </td>
                    
                    <td className="px-5 py-4 align-top text-right">
                       <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2 w-full">
                         <div className="relative w-full max-w-[140px]">
                           <span className="absolute left-3 top-2.5 font-bold text-slate-400">₺</span>
                           <input 
                             type="number" 
                             placeholder="Fiyat Girin" 
                             className="w-full pl-7 pr-3 py-2 border border-amber-200 rounded-lg outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 bg-white shadow-inner font-bold text-sm text-slate-800 transition-all placeholder:font-medium placeholder:text-xs" 
                             value={jobPrices[j.id] || ''} 
                             onChange={e => setJobPrices({...jobPrices, [j.id]: e.target.value})} 
                           />
                         </div>
                         <button 
                           onClick={() => handleApproveJob(j)} 
                           disabled={isProcessing === j.id} 
                           className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 w-full sm:w-auto h-[38px]"
                         >
                           {isProcessing === j.id ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle size={16} /> Kasaya İşle</>}
                         </button>
                       </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan={4} className="p-16 text-center text-slate-400 font-medium text-sm">Harika! Onay bekleyen hiçbir işiniz kalmadı.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}