'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Clock, MapPin, CheckCircle, PlayCircle, AlertTriangle, ArrowUpRight, ShieldCheck, User, Wrench, Loader2, History, CheckSquare, UserPlus } from 'lucide-react';

interface Job {
  id: string | number;
  staff_id: string | number;
  customer_name: string;
  status: string;
  work_type: string;
  created_at?: string;
  asset_name?: string;
  details?: {
    worker_id?: string | number;
    managerId?: string | number;
    note?: string;
    scheduledDate?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface Staff {
  id: string | number;
  name: string;
  [key: string]: any;
}

interface Data {
  jobs?: Job[];
  staff?: Staff[];
  [key: string]: any;
}

interface MyJobsTabProps {
  data: Data | null;
  setShowJobModal: (show: boolean) => void;
  statusColors: { [key: string]: string };
  setSelectedJob: (job: Job | null) => void;
  handleAction: (endpoint: string, body: any, closeFn?: any, resetFn?: any) => Promise<boolean>;
}

export default function MyJobsTab({ data, setShowJobModal, statusColors, setSelectedJob, handleAction }: MyJobsTabProps) {
  const [currentUserName, setCurrentUserName] = useState<string>('Yönetici');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | number | null>(null);

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

  // 1. ADIM: Bana atanan, benim oluşturduğum veya YÖNETİCİSİ olduğum işleri filtrele
  const myAllJobs = useMemo(() => {
     if (!currentUserId) return [];
     return jobs.filter((j) => 
        String(j.staff_id) === String(currentUserId) || 
        String(j.details?.worker_id) === String(currentUserId) ||
        String(j.details?.managerId) === String(currentUserId)
     );
  }, [jobs, currentUserId]);

  // Gruplandırma Mantığı
  const incomingJobs = myAllJobs.filter((j) => j.status === 'Beklemede' || j.status === 'Gelecek');
  const waitingForWorkerJobs = myAllJobs.filter((j) => j.status === 'Usta Bekliyor');
  const activeJobs = myAllJobs.filter((j) => j.status === 'Devam Ediyor' || j.status === 'Sahada');
  const pastJobs = myAllJobs.filter((j) => j.status === 'Tamamlandı' || j.status === 'İptal');

  // İşi Kabul Etme Fonksiyonu
  const handleAcceptJob = async (job: Job) => {
    if (!handleAction) return;
    setProcessingId(job.id);
    try {
        const isGeneral = job.work_type === 'Genel Görev';
        // Genel görev ise direkt 'Devam Ediyor', değilse 'Usta Bekliyor'
        const newStatus = isGeneral ? 'Devam Ediyor' : 'Usta Bekliyor';

        const success = await handleAction('update-job', {
            id: job.id,
            status: newStatus, 
            lastEditedBy: currentUserName,
        }, null, null);

        if (success && isGeneral) {
           alert("Genel görev kabul edildi ve üzerinize alındı.");
        }
    } catch (e) {
        alert("İş kabul edilirken hata oluştu.");
    } finally {
        setProcessingId(null);
    }
  };

  // Ustaya Atama Modalını Aç
  const handleOpenAssignModal = (job: Job) => {
      setSelectedJob(job);
      setShowJobModal(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* Üst Bilgi Kartı */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             <User className="text-blue-600" /> Bana Atanan İşler
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">Size yönlendirilen işleri buradan kabul edip ekibinize dağıtabilirsiniz.</p>
        </div>
        
        {/* ÖZET KUTULARI */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
           {incomingJobs.length > 0 && (
               <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl text-center border border-amber-200 animate-pulse">
                  <div className="text-[10px] font-bold uppercase tracking-wider">Onay Bekleyen</div>
                  <div className="text-lg font-black leading-none mt-1">{incomingJobs.length}</div>
               </div>
           )}
           <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-xl text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider">Atama Bekleyen</div>
              <div className="text-lg font-black leading-none mt-1">{waitingForWorkerJobs.length}</div>
           </div>
           <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider">Devam Eden</div>
              <div className="text-lg font-black leading-none mt-1">{activeJobs.length}</div>
           </div>
           {/* EKLENDİ: Tamamlanan İşler Kutusu */}
           <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider">Tamamlanan</div>
              <div className="text-lg font-black leading-none mt-1">{pastJobs.length}</div>
           </div>
        </div>
      </div>

      {/* 1. GRUP: YENİ GELEN (KABUL EDİLMEYİ BEKLEYEN) İŞLER */}
      {incomingJobs.length > 0 && (
        <div className="bg-amber-500 rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-500/20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="relative z-10">
              <h3 className="text-sm font-black text-amber-50 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <AlertTriangle size={18} /> Yeni İş Talepleri (Önce Kabul Etmelisiniz)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {incomingJobs.map((job) => {
                    const isGeneral = job.work_type === 'Genel Görev';
                    return (
                        <div key={job.id} className="bg-amber-950/40 border border-amber-300/30 rounded-2xl p-5 flex flex-col justify-between hover:bg-amber-950/60 transition-colors">
                            <div className="mb-2">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                                        {isGeneral ? 'GENEL GÖREV' : 'NORMAL İŞ'}
                                    </span>
                                    <span className="text-[11px] font-bold opacity-80 bg-black/20 px-2 py-1 rounded">
                                        {job.created_at ? new Date(job.created_at).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                                    </span>
                                </div>
                                <h4 className="text-lg font-black leading-tight mb-2 line-clamp-2">{job.customer_name}</h4>
                                <p className="text-amber-100 text-xs font-medium flex items-center gap-1.5 mb-2">
                                    <Briefcase size={14} className="shrink-0 opacity-70"/> {job.work_type}
                                </p>
                                {job.details?.note && (
                                    <p className="text-amber-50/80 text-[11px] italic line-clamp-2 border-l-2 border-amber-300 pl-2 mb-4">"{job.details.note}"</p>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => handleAcceptJob(job)}
                                disabled={processingId === job.id}
                                className="mt-2 w-full bg-white text-amber-600 hover:bg-amber-50 py-3 rounded-xl text-sm font-black transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processingId === job.id ? <Loader2 size={18} className="animate-spin" /> : <CheckSquare size={18} />}
                                {processingId === job.id ? 'Kabul Ediliyor...' : 'GÖREVİ KABUL ET'}
                            </button>
                        </div>
                    );
                 })}
              </div>
           </div>
        </div>
      )}

      {/* 2. GRUP: KABUL EDİLMİŞ, USTA ATAMASI BEKLEYENLER */}
      {waitingForWorkerJobs.length > 0 && (
        <div className="space-y-3">
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest pl-2 flex items-center gap-2 border-l-4 border-indigo-500">
                <UserPlus size={18} className="text-indigo-600" /> Ustaya Atanmayı Bekleyenler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {waitingForWorkerJobs.map((job) => (
                    <div key={job.id} className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group">
                        <div>
                             <div className="flex justify-between items-start mb-3">
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                                    Usta Bekliyor
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {job.details?.scheduledDate ? new Date(job.details.scheduledDate).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                                </span>
                            </div>
                            <h4 className="text-lg font-black text-slate-800 leading-tight mb-2">{job.customer_name}</h4>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mb-4">
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                    <MapPin size={14} className="text-indigo-400"/> {job.asset_name || 'Varlık Seçilmedi'}
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleOpenAssignModal(job)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <UserPlus size={18} />
                            USTAYA ATA
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* 3. GRUP: DEVAM EDENLER */}
      {activeJobs.length > 0 && (
          <div className="space-y-3 mt-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest pl-2 flex items-center gap-2">
                  <PlayCircle size={16} className="text-blue-500" /> Yönetiminizdeki Aktif İşler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeJobs.map((job) => {
                      const isGeneral = job.work_type === 'Genel Görev';
                      const assignedWorker = job.details?.worker_id ? staff.find((s) => s.id === job.details?.worker_id) : null;
                      
                      return (
                          <div key={job.id} onClick={() => handleOpenAssignModal(job)} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group active:scale-95 flex flex-col justify-between">
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

      {/* 4. GRUP: GEÇMİŞ İŞLER (Burada Tamamlananlar Listelenir) */}
      {pastJobs.length > 0 && (
          <div className="space-y-3 mt-8">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                  <History size={16} /> Geçmiş Görevlerim
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-70 hover:opacity-100 transition-opacity">
                  {pastJobs.slice(0, 15).map((job) => { 
                      const isGeneral = job.work_type === 'Genel Görev';
                      return (
                          <div key={job.id} onClick={() => handleOpenAssignModal(job)} className="bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer hover:bg-white transition-colors active:scale-95 flex justify-between items-center">
                              <div className="min-w-0 pr-2">
                                  <h4 className="text-sm font-black text-slate-700 truncate">{job.customer_name}</h4>
                                  <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">{isGeneral ? 'Genel Görev' : job.work_type}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-wider shrink-0 shadow-sm ${statusColors[job.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                  {job.status}
                              </span>
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
              <p className="text-sm text-slate-500 max-w-md">Şu an için tarafınıza atanmış, onay bekleyen veya geçmiş herhangi bir görev bulunmuyor.</p>
          </div>
      )}

    </motion.div>
  );
}