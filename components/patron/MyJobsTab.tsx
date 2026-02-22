'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Clock, MapPin, CheckCircle, PlayCircle, AlertTriangle, ArrowUpRight, ShieldCheck, User, Wrench, Loader2 } from 'lucide-react';

export default function MyJobsTab({ data, setShowJobModal, statusColors, setSelectedJob, handleAction }: any) {
  const [currentUserName, setCurrentUserName] = useState<string>('Yönetici');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  useEffect(() => {
    const isPatronPath = window.location.pathname.includes('/dashboard');
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
    }
  }, []);

  const jobs = data?.jobs || [];
  const staff = data?.staff || [];

  // Bana atanan TÜM işler (Bekleyen + Devam Eden)
  const myAllJobs = useMemo(() => {
     if (!currentUserId) return [];
     return jobs.filter((j: any) => 
        (String(j.staff_id) === String(currentUserId) || String(j.details?.worker_id) === String(currentUserId)) && 
        (j.status !== 'Tamamlandı' && j.status !== 'İptal')
     );
  }, [jobs, currentUserId]);

  const pendingJobs = myAllJobs.filter((j: any) => j.status === 'Beklemede' || j.status === 'Gelecek');
  const activeJobs = myAllJobs.filter((j: any) => j.status === 'Devam Ediyor' || j.status === 'Sahada');

  const handleApproveJob = async (job: any) => {
    if (!handleAction) {
        alert("Sistem hatası: İşlem fonksiyonu bulunamadı.");
        return;
    }
    setIsApproving(job.id);
    try {
        const isGeneralJob = job.work_type === 'Genel Görev';

        const success = await handleAction('update-job', {
            id: job.id,
            status: 'Devam Ediyor',
            lastEditedBy: currentUserName,
        }, null, null);

        if (success) {
            if (!isGeneralJob) {
                // Normal İş -> Modalı açarak ustaya atamasını sağla
                setSelectedJob({ ...job, status: 'Devam Ediyor' });
                setShowJobModal(true);
            } else {
                // Genel Görev -> Üstünde kalır
                alert("Genel Görev başarıyla onaylandı ve üzerinize alındı. İşlemi bitirdiğinizde tamamlandı olarak işaretleyebilirsiniz.");
            }
        }
    } catch (e) {
        console.error(e);
        alert("Bir hata oluştu.");
    } finally {
        setIsApproving(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             <User className="text-blue-600" /> Bana Atanan İşler
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">Size özel atanmış görevleri buradan onaylayabilir, yönetebilir veya devredebilirsiniz.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-center">
              <div className="text-xs font-bold uppercase tracking-wider">Onay Bekleyen</div>
              <div className="text-xl font-black leading-none mt-1">{pendingJobs.length}</div>
           </div>
           <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-center">
              <div className="text-xs font-bold uppercase tracking-wider">Devam Eden</div>
              <div className="text-xl font-black leading-none mt-1">{activeJobs.length}</div>
           </div>
        </div>
      </div>

      {pendingJobs.length > 0 && (
        <div className="bg-indigo-600 rounded-3xl p-5 sm:p-6 shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="relative z-10">
              <h3 className="text-sm font-black text-indigo-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <AlertTriangle size={18} /> Yeni Atamalar / Onayınızı Bekleyenler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {pendingJobs.map((job: any) => {
                    const isGeneral = job.work_type === 'Genel Görev';
                    return (
                        <div key={job.id} className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between hover:bg-indigo-950/60 transition-colors">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isGeneral ? 'bg-purple-500/30 text-purple-200' : 'bg-blue-500/30 text-blue-200'}`}>
                                        {isGeneral ? 'GENEL GÖREV' : 'NORMAL İŞ'}
                                    </span>
                                    <span className="text-[11px] font-bold opacity-80 flex items-center gap-1.5">
                                        <Clock size={12}/> {job.scheduled_date || 'Anlık'}
                                    </span>
                                </div>
                                <h4 className="text-lg font-black leading-tight mb-2 line-clamp-2" title={job.customer_name}>{job.customer_name}</h4>
                                <p className="text-indigo-200 text-xs font-medium flex items-center gap-1.5 mb-2">
                                    <Briefcase size={14} className="shrink-0 opacity-70"/> {job.work_type}
                                </p>
                                {job.details?.note && (
                                    <p className="text-indigo-100/70 text-[11px] italic line-clamp-2 border-l-2 border-indigo-400 pl-2 mb-4">"{job.details.note}"</p>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => handleApproveJob(job)}
                                disabled={isApproving === job.id}
                                className="mt-2 w-full bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isApproving === job.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                {isApproving === job.id ? 'İşleniyor...' : (isGeneral ? 'Gördüm, İşleme Al' : 'Onayla & Ustaya Ata')}
                            </button>
                        </div>
                    );
                 })}
              </div>
           </div>
        </div>
      )}

      {activeJobs.length > 0 && (
          <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest pl-2">Şu An Yürüttüğünüz İşler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeJobs.map((job: any) => {
                      const isGeneral = job.work_type === 'Genel Görev';
                      const assignedWorker = job.details?.worker_id ? staff.find((s:any) => s.id === job.details?.worker_id) : null;
                      
                      return (
                          <div key={job.id} onClick={() => { setSelectedJob(job); setShowJobModal(true); }} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group active:scale-95 flex flex-col justify-between">
                              <div>
                                  <div className="flex justify-between items-start mb-3">
                                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isGeneral ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                          {isGeneral ? 'Genel Görev' : 'Saha İşi'}
                                      </span>
                                      <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase tracking-wider shadow-sm ${statusColors[job.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                          {job.status}
                                      </span>
                                  </div>
                                  <h4 className="text-base font-black text-slate-800 leading-tight mb-1">{job.customer_name}</h4>
                                  <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mb-3">
                                      <Briefcase size={14} className="shrink-0 text-slate-400"/> {job.work_type}
                                  </p>
                              </div>

                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      <Wrench size={14} className={assignedWorker ? 'text-blue-500' : 'text-slate-300'} />
                                      <span className="text-[10px] font-bold text-slate-500 uppercase">Usta:</span>
                                      <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{assignedWorker ? assignedWorker.name : 'Atanmadı'}</span>
                                  </div>
                                  <ArrowUpRight size={18} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {myAllJobs.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><CheckCircle size={32} /></div>
              <h3 className="text-lg font-black text-slate-700 mb-1">Harika, Üzerinizde İş Yok!</h3>
              <p className="text-sm text-slate-500 max-w-md">Şu an için tarafınıza atanmış veya onay bekleyen herhangi bir görev bulunmuyor.</p>
          </div>
      )}

    </motion.div>
  );
}