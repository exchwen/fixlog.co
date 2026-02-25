'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, MapPin, CheckCircle, PlayCircle, AlertTriangle, ArrowUpRight, User, Wrench, Loader2, History, CheckSquare, UserPlus, Calendar, Clock, ChevronRight, Lock, UserCheck } from 'lucide-react';

interface Job {
  id: string | number;
  staff_id: string | number;
  customer_name: string;
  status: string;
  work_type: string;
  created_at?: string;
  asset_name?: string;
  asset_id?: string | number;
  details?: {
    worker_id?: string | number;
    managerId?: string | number;
    createdBy?: string;
    note?: string;
    scheduledDate?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface Staff {
  id: string | number;
  name: string;
  role?: string;
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

  // --- ALTIN KURAL FİLTRESİ (Merkezi Kontrol) ---
  // Bu filtre, aşağıda oluşturulan TÜM listeleri (Bekleyen, Aktif, Geçmiş) etkiler.
  // Eğer ID'niz bu işin içinde yoksa, o iş hiçbir listede görünemez.
  const myAllJobs = useMemo(() => {
     if (!currentUserId) return [];
     const myId = String(currentUserId);

     return jobs.filter((j) => {
        // 1. Sen mi atandın? (Yönetici olarak)
        const isAssignedStaff = String(j.staff_id) === myId;
        // 2. Sen mi yönetiyorsun? (Manager ID)
        const isManager = String(j.details?.managerId) === myId;
        // 3. Sen mi yapıyorsun? (Worker ID - Usta)
        const isWorker = String(j.details?.worker_id) === myId;
        
        return isAssignedStaff || isManager || isWorker;
     });
  }, [jobs, currentUserId]);

  // Gruplandırma (Filtrelenmiş listeden çekilir)
  const incomingJobs = myAllJobs.filter((j) => j.status === 'Beklemede' || j.status === 'Gelecek');
  const waitingForWorkerJobs = myAllJobs.filter((j) => j.status === 'Usta Bekliyor');
  const activeJobs = myAllJobs.filter((j) => j.status === 'Devam Ediyor' || j.status === 'Sahada' || j.status === 'Yolda' || j.status === 'Başlandı');
  const pastJobs = myAllJobs.filter((j) => j.status === 'Tamamlandı' || j.status === 'İptal');

  // İşi Kabul Etme
  const handleAcceptJob = async (job: Job) => {
    if (!handleAction) return;
    setProcessingId(job.id);
    try {
        const isGeneral = job.work_type === 'Genel Görev';
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

  // Modal Açma
  const handleOpenAssignModal = (job: Job) => {
      setSelectedJob(job);
      setShowJobModal(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24">
      
      {/* Üst Bilgi Kartı */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             <UserCheck className="text-blue-600" /> Sorumluluğumdaki İşler
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
             Burada sadece sizin yönettiğiniz, atandığınız veya sahada çalıştığınız işler görünür.
          </p>
        </div>
        
        {/* ÖZET KUTULARI */}
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
           {incomingJobs.length > 0 && (
               <div className="bg-amber-100 text-amber-800 px-3 py-2 rounded-xl text-center border border-amber-200 animate-pulse flex-1 sm:flex-none">
                  <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Onay Bekleyen</div>
                  <div className="text-lg font-black leading-none mt-1">{incomingJobs.length}</div>
               </div>
           )}
           <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-2 rounded-xl text-center flex-1 sm:flex-none">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Atama Bekleyen</div>
              <div className="text-lg font-black leading-none mt-1">{waitingForWorkerJobs.length}</div>
           </div>
           <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-center flex-1 sm:flex-none">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Aktif Süreç</div>
              <div className="text-lg font-black leading-none mt-1">{activeJobs.length}</div>
           </div>
        </div>
      </div>

      {/* 1. GRUP: YENİ GELEN (KABUL EDİLMEYİ BEKLEYEN) İŞLER */}
      {incomingJobs.length > 0 && (
        <div className="bg-amber-500 rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-500/20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="relative z-10">
              <h3 className="text-xs sm:text-sm font-black text-amber-50 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <AlertTriangle size={18} /> Yeni İş Talepleri (Önce Kabul Etmelisiniz)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {incomingJobs.map((job) => {
                    const isGeneral = job.work_type === 'Genel Görev';
                    return (
                        <div 
                            key={job.id} 
                            onClick={() => handleOpenAssignModal(job)}
                            className="bg-amber-950/40 border border-amber-300/30 rounded-2xl p-5 flex flex-col justify-between hover:bg-amber-950/60 transition-colors cursor-pointer group active:scale-95"
                        >
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
                                onClick={(e) => { e.stopPropagation(); handleAcceptJob(job); }}
                                disabled={processingId === job.id}
                                className="mt-2 w-full bg-white text-amber-600 hover:bg-amber-50 py-3 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="space-y-4">
            <h3 className="text-xs sm:text-sm font-black text-indigo-900 uppercase tracking-widest pl-2 flex items-center gap-2 border-l-4 border-indigo-500 ml-1">
                <UserPlus size={18} className="text-indigo-600" /> Ustaya Atanmayı Bekleyenler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {waitingForWorkerJobs.map((job) => (
                    <div 
                        key={job.id} 
                        onClick={() => handleOpenAssignModal(job)}
                        className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group cursor-pointer active:scale-95"
                    >
                        <div>
                             <div className="flex justify-between items-start mb-3">
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                                    Usta Bekliyor
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {job.details?.scheduledDate ? new Date(job.details.scheduledDate).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                                </span>
                            </div>
                            <h4 className="text-lg font-black text-slate-800 leading-tight mb-2 truncate">{job.customer_name}</h4>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mb-4">
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
                                    <MapPin size={14} className="text-indigo-400 shrink-0"/> {job.asset_name || 'Varlık Seçilmedi'}
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenAssignModal(job); }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <UserPlus size={18} />
                            USTAYA ATA
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* 3. GRUP: DEVAM EDENLER (Benimle İlgili) */}
      {activeJobs.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-widest pl-2 flex items-center gap-2 border-l-4 border-blue-500 ml-1">
                  <PlayCircle size={18} className="text-blue-600" /> Aktif / Sahadaki İşlerim
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeJobs.map((job) => {
                      const isGeneral = job.work_type === 'Genel Görev';
                      const assignedWorker = job.details?.worker_id ? staff.find((s) => String(s.id) === String(job.details?.worker_id)) : null;
                      const amITheWorker = String(job.details?.worker_id) === String(currentUserId);

                      return (
                          <div 
                            key={job.id} 
                            onClick={() => handleOpenAssignModal(job)} 
                            className="bg-white border border-slate-200 rounded-2xl p-0 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group active:scale-95 flex flex-col h-full overflow-hidden"
                          >
                              {/* Üst Kısım */}
                              <div className="p-4 flex-1">
                                  <div className="flex justify-between items-start mb-3">
                                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isGeneral ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                          {isGeneral ? 'Genel Görev' : 'Saha İşi'}
                                      </span>
                                      <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase tracking-wider shadow-sm ${statusColors[job.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                          {job.status}
                                      </span>
                                  </div>
                                  
                                  <h4 className="text-base font-black text-slate-800 leading-tight mb-1 truncate">{job.customer_name}</h4>
                                  <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mb-2">
                                      <Briefcase size={14} className="shrink-0 text-slate-400"/> {job.work_type}
                                  </p>

                                  {/* Usta Bilgisi */}
                                  <div className="mt-3 bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${amITheWorker ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-blue-100 border-blue-200 text-blue-600'}`}>
                                        <Wrench size={14} />
                                      </div>
                                      <div>
                                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">İşi Yapan Usta</div>
                                          <div className={`text-xs font-bold ${amITheWorker ? 'text-emerald-600' : 'text-slate-700'}`}>
                                            {assignedWorker ? assignedWorker.name : (isGeneral ? 'Kendisi' : 'Atanmamış')}
                                            {amITheWorker && ' (Ben)'}
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* Alt Kısım */}
                              <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between group-hover:bg-blue-50 transition-colors">
                                  <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                    <Clock size={12} /> Detayları Görüntüle
                                  </div>
                                  <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-300 group-hover:text-blue-500 transition-all">
                                      <ChevronRight size={14} />
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* 4. GRUP: GEÇMİŞ İŞLER (Benimle İlgili) */}
      {pastJobs.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest pl-2 flex items-center gap-2 border-l-4 border-slate-300 ml-1">
                  <History size={18} /> Tamamlanan / Geçmiş Görevlerim
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pastJobs.map((job) => { 
                      const isGeneral = job.work_type === 'Genel Görev';
                      return (
                          <div 
                            key={job.id} 
                            onClick={() => handleOpenAssignModal(job)} 
                            className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all active:scale-95 flex justify-between items-center group"
                          >
                              <div className="min-w-0 pr-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                                    <h4 className="text-sm font-black text-slate-700 truncate">{job.customer_name}</h4>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                     <span>{isGeneral ? 'Genel' : job.work_type}</span>
                                     <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                     <span>{job.created_at ? new Date(job.created_at).toLocaleDateString('tr-TR') : '-'}</span>
                                  </div>
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
          <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center mt-10">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><Lock size={32} /></div>
              <h3 className="text-lg font-black text-slate-700 mb-1">İş Kaydı Bulunamadı</h3>
              <p className="text-sm text-slate-500 max-w-md">Şu an için tarafınıza atanmış, yönettiğiniz veya onay bekleyen herhangi bir görev bulunmuyor.</p>
          </div>
      )}

    </motion.div>
  );
}