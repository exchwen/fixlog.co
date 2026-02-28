'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Briefcase, MapPin, CheckCircle, PlayCircle, 
    ArrowUpRight, User, Wrench, Loader2, 
    UserPlus, Check, Calendar, Activity, AlertTriangle, CheckSquare, Clock, Eye, ShieldCheck, UserCheck // 🚀 ShieldCheck ve UserCheck eklendi
  } from 'lucide-react';

interface Job {
  id: string | number;
  staff_id: string | number;
  customer_name: string;
  status: string;
  work_type: string;
  created_at?: string;
  updated_at?: string;
  asset_name?: string;
  asset_id?: string | number;
  details?: {
    worker_id?: string | number;
    managerId?: string | number;
    note?: string;
    scheduledDate?: string;
    price?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface MyJobsTabProps {
  data: any;
  setShowJobModal: (show: boolean) => void;
  statusColors: { [key: string]: string };
  setSelectedJob: (job: Job | null) => void;
  handleAction: (endpoint: string, body: any, closeFn?: any, resetFn?: any) => Promise<boolean>;
}

export default function MyJobsTab({ data, setShowJobModal, statusColors, setSelectedJob, handleAction }: MyJobsTabProps) {
  const [currentUserName, setCurrentUserName] = useState<string>('Yönetici');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  
  // Şık Bildirim Modalı State'i
  const [successModal, setSuccessModal] = useState<{show: boolean, msg: string}>({show: false, msg: ''});

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
        setCurrentUserName(savedName); 
      }
    }, []);

    const jobs = data?.jobs || [];
    const staff = data?.staff || [];
    const assets = data?.assets || []; 
  
    // 1. ADIM: İZOLASYON (Sadece bana ait veya benim sorumlu olduğum işler)
  const myAllJobs = useMemo(() => {
    if (!currentUserId || !currentUserName) return [];
    
    return jobs.filter((j: any) => {
       const staffMatch = String(j.staff_id) === String(currentUserId);
       const managerIdMatch = String(j.details?.managerId) === String(currentUserId);
       const workerIdMatch = String(j.details?.worker_id) === String(currentUserId);
       
       const managerNameMatch = j.details?.managerName && (j.details.managerName === currentUserName || j.details.managerName.includes(currentUserName));
       const creatorMatch = j.details?.createdBy && (j.details.createdBy === currentUserName || j.details.createdBy.includes(currentUserName));
       const editorMatch = j.details?.lastEditedBy && (j.details.lastEditedBy === currentUserName || j.details.lastEditedBy.includes(currentUserName));

       // İş "Onay Bekliyor" ise ve yöneticinin ekranındaysa (veya yönetici işlem yaptıysa) onu da kapsar
       return staffMatch || managerIdMatch || workerIdMatch || managerNameMatch || creatorMatch || editorMatch;
    });
 }, [jobs, currentUserId, currentUserName]);

  // --- 🚀 KUSURSUZ GRUPLANDIRMA MANTIĞI (YENİ D1 SÜTUNLARIYLA) ---

  // 1. Onay Bekleyenler (Sarı Kutu): İş bana yeni atandı (Patron tarafından), henüz kabul etmedim.
  const incomingJobs = myAllJobs.filter((j: any) => {
    // Hem yeni manager_id hem de eski details.managerId kontrol ediliyor.
    const isMyJob = String(j.staff_id) === String(currentUserId) || 
                    String(j.manager_id) === String(currentUserId) || 
                    String(j.details?.managerId) === String(currentUserId);
    
    const hasWorker = !!j.worker_id || !!j.details?.worker_id;
    
    return (j.status === 'Beklemede' || j.status === 'Gelecek') && isMyJob && !hasWorker;
  });

  // 2. Atama Bekleyenler (Mor Kutu): İşi kabul ettim (Usta Bekliyor durumunda) ama USTA SEÇMEDİM.
  const waitingForAssignment = myAllJobs.filter((j: any) => {
    const isMyJob = String(j.staff_id) === String(currentUserId) || 
                    String(j.manager_id) === String(currentUserId) || 
                    String(j.details?.managerId) === String(currentUserId);
                    
    const hasWorker = !!j.worker_id || !!j.details?.worker_id;
    
    return j.status === 'Usta Bekliyor' && !hasWorker && isMyJob;
  });

  // 3. Devam Edenler & Takiptekiler (Mavi Tablo): Benim oluşturduğum veya Ustaya atadığım aktif işler.
  const ongoingJobs = myAllJobs.filter((j: any) => {
    if (j.status === 'Tamamlandı' || j.status === 'İptal') return false;
    
    const isMyJob = String(j.staff_id) === String(currentUserId) || 
                    String(j.manager_id) === String(currentUserId) || 
                    String(j.details?.managerId) === String(currentUserId);
                    
    const hasWorker = !!j.worker_id || !!j.details?.worker_id;

    // İş üstteki Sarı (Onay Bekleyen) veya Mor (Atama Bekleyen) kutuya aitse, Mavi tabloda GİZLE!
    const isIncoming = (j.status === 'Beklemede' || j.status === 'Gelecek') && isMyJob && !hasWorker;
    const isWaitingAssign = j.status === 'Usta Bekliyor' && !hasWorker && isMyJob;
    if (isIncoming || isWaitingAssign) return false;

    // Eğer işi BİZZAT BEN oluşturduysam (ve yukarıdaki Sarı/Mor engeline takılmadıysa) mutlaka listele.
    const isCreatedByMe = j.creator_name === currentUserName || j.details?.createdBy === currentUserName;
    if (isCreatedByMe) return true;

    // Eğer bana aitse ve ustası varsa (veya iş Onay Bekliyorsa) listele.
    return true; 
  });

  // 4. Tamamlananlar (Yeşil Tablo)
  const completedJobs = myAllJobs.filter((j: any) => j.status === 'Tamamlandı');

  // İŞLEM FONKSİYONLARI
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

        if (success) {
           setSuccessModal({show: true, msg: 'Görev başarıyla kabul edildi.'});
           setTimeout(() => setSuccessModal({show: false, msg: ''}), 2000);
        }
    } catch (e) {
        alert("Hata oluştu.");
    } finally {
        setProcessingId(null);
    }
  };

  const handleOpenModal = (job: Job) => {
    setSelectedJob(job);
};

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 relative pb-20">
      
      {/* BAŞLIK VE ÖZET KARTLARI */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             <Briefcase className="text-blue-600" /> İş Yönetim Paneli
          </h2>
          <p className="text-slate-500 text-sm font-medium">Sorumluluğunuzdaki işlerin durumunu buradan yönetebilirsiniz.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
           <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Onay Bekleyen</div>
              <div className="text-2xl font-black">{incomingJobs.length}</div>
           </div>
           <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 p-3 rounded-xl text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Atama Bekleyen</div>
              <div className="text-2xl font-black">{waitingForAssignment.length}</div>
           </div>
           <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-xl text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Aktif / Takipte</div>
              <div className="text-2xl font-black">{ongoingJobs.length}</div>
           </div>
           <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Tamamlanan</div>
              <div className="text-2xl font-black">{completedJobs.length}</div>
           </div>
        </div>
      </div>

      {/* 1. BÖLÜM: PATRONDAN GELENLER (ONAYLAMA / KABUL ETME) */}
      {incomingJobs.length > 0 && (
        <div className="bg-amber-500 rounded-3xl p-5 shadow-xl shadow-amber-500/20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="relative z-10">
              <h3 className="text-sm font-black text-amber-50 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <AlertTriangle size={18} /> Onayınızı Bekleyen Atamalar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {incomingJobs.map((job: any) => (
                    <div key={job.id} onClick={() => handleOpenModal(job)} className="bg-amber-950/40 border border-amber-300/30 rounded-2xl p-4 cursor-pointer hover:bg-amber-950/60 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/20 text-white">{job.work_type}</span>
                            <span className="text-[10px] font-bold opacity-70">{job.created_at?.split('T')[0]}</span>
                        </div>
                        
                        {/* 🚀 EKLENDİ: Müşteri, Apartman ve Cihaz Türü Birlikte */}
                        <div className="mb-3">
                            <h4 className="font-black text-white leading-tight mb-0.5 line-clamp-2">
                                {(() => {
                                    const asset = assets.find((a: any) => String(a.id) === String(job.asset_id));
                                    const aptName = asset?.apartmentName || asset?.apartment_name;
                                    return aptName ? <><span className="text-amber-200">{aptName}</span> - {job.customer_name}</> : job.customer_name;
                                })()}
                            </h4>
                            <div className="text-[10px] font-bold text-amber-200 truncate">
                                {(() => {
                                    const asset = assets.find((a: any) => String(a.id) === String(job.asset_id));
                                    return asset ? asset.name : 'Genel Görev / Varlık Yok';
                                })()}
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleAcceptJob(job); }}
                            disabled={processingId === job.id}
                            className="w-full bg-white text-amber-600 hover:bg-amber-50 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                        >
                            {processingId === job.id ? <Loader2 size={14} className="animate-spin"/> : <CheckSquare size={14} />}
                            GÖREVİ KABUL ET
                        </button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* 2. BÖLÜM: USTAYA ATANMAYI BEKLEYENLER */}
      {waitingForAssignment.length > 0 && (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg"><UserPlus size={16} /></div>
                <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">
                    Ustaya Atanmayı Bekleyenler ({waitingForAssignment.length})
                </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {waitingForAssignment.map((job: any) => {
                    const currentAsset = assets.find((a: any) => String(a.id) === String(job.asset_id));
                    const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;
                    return (
                    <div 
                        key={job.id} 
                        onClick={() => handleOpenModal(job)} 
                        className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group active:scale-95 flex flex-col justify-between h-full"
                    >
                        <div>
                             <div className="flex justify-between items-start mb-3">
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    Atama Bekliyor
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                    {job.details?.scheduledDate ? new Date(job.details.scheduledDate).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                                </span>
                            </div>
                            <h4 className="text-lg font-black text-slate-800 leading-tight mb-2 line-clamp-2">
                                {aptName ? <><span className="text-indigo-600">{aptName}</span> - {job.customer_name}</> : job.customer_name}
                            </h4>
                            <div className="text-xs font-bold text-slate-500 mb-3 truncate">
                                {currentAsset ? currentAsset.name : 'Genel Görev / Cihaz Yok'}
                            </div>
                            
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 flex flex-col gap-2">
                                <p className="text-[11px] text-slate-600 font-medium flex items-start gap-1.5 line-clamp-2">
                                    <MapPin size={14} className="text-indigo-400 shrink-0 mt-0.5"/> 
                                    <span>{currentAsset ? currentAsset.location : 'Lokasyon bilgisi bulunmuyor'}</span>
                                </p>
                                {currentAsset?.location && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://maps.google.com/?q=${encodeURIComponent(currentAsset.location)}`, '_blank');
                                        }}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100 border border-blue-100 px-2 py-1.5 rounded-lg w-fit transition-colors flex items-center gap-1 mt-1"
                                    >
                                        <MapPin size={12} /> Haritada Göster
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(job); }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2 mt-auto"
                        >
                            <UserPlus size={16} />
                            USTA SEÇ VE ATA
                        </button>
                    </div>
                )})}
            </div>
        </div>
      )}

      {/* 3. BÖLÜM: TABLOLAR (DEVAM EDEN & TAMAMLANAN) */}
      <div className="space-y-8 pt-2">
          
          {/* TABLO 1: DEVAM EDEN & TAKİPTEKİ İŞLER (GÜNCELLENDİ) */}
          <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
              <div className="p-5 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Activity size={18} /></div>
                  <h3 className="font-black text-blue-900 text-sm uppercase tracking-wide">
                      Aktif ve Takip Edilen İşler ({ongoingJobs.length})
                  </h3>
              </div>
              
              {/* Masaüstü Görünüm (Table) */}
              <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                              <th className="px-6 py-4 border-b border-slate-100">Müşteri / İş Detayı</th>
                              <th className="px-6 py-4 border-b border-slate-100">Saha Ustası</th>
                              <th className="px-6 py-4 border-b border-slate-100">Planlanan Tarih</th>
                              <th className="px-6 py-4 border-b border-slate-100 text-right">Durum</th>
                              <th className="px-6 py-4 border-b border-slate-100"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {ongoingJobs.length > 0 ? ongoingJobs.map((job: any) => {
                              
                              // 🚀 D1 SÜTUNLARINDAN DİREKT OKUMA (Tertemiz)
                              const creator = job.creator_name || (data?.ownerName?.split(' ')[0] || 'Sistem');
                              const manager = job.manager_name || null;
                              let worker = job.worker_name || null;

                              // Eğer D1'de worker_name yoksa (eski veri ihtimali)
                              if (!worker) {
                                  if (job.details?.worker_id) {
                                      const w = staff.find((s:any) => String(s.id) === String(job.details?.worker_id));
                                      if (w) worker = w.name;
                                  } else if (String(job.staff_id) !== String(currentUserId)) {
                                      const w = staff.find((s:any) => String(s.id) === String(job.staff_id));
                                      if (w && w.role === 'Usta') worker = w.name;
                                  }
                              }

                              const isCreatorSameAsManager = manager && creator === manager;
                              const staffColor = 'text-amber-600 bg-amber-50 border-amber-200';
                              
                              // AKILLI DURUM METNİ (Yönetici Gözüyle)
                              let displayStatus = job.status;
                              let statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
                              let StatusIcon = Activity;

                              if ((job.status === 'Usta Bekliyor' || job.status === 'Beklemede' || job.status === 'Gelecek') && worker) {
                                  displayStatus = 'Usta Onayı Bekleniyor';
                                  statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
                                  StatusIcon = Clock;
                              } else if (job.status === 'Sahada' || job.status === 'Devam Ediyor') {
                                  if (worker) {
                                      displayStatus = 'Usta Sahada / Çalışıyor';
                                      statusClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                                      StatusIcon = Wrench;
                                  } else {
                                      displayStatus = 'Siz Çalışıyorsunuz'; // Yönetici kendi üzerine aldıysa
                                  }
                              } else if (job.status === 'Onay Bekliyor') {
                                  displayStatus = 'Onayınız Bekleniyor';
                                  statusClass = 'bg-purple-50 text-purple-700 border-purple-200';
                                  StatusIcon = CheckCircle;
                              }

                              const currentAsset = assets.find((a: any) => String(a.id) === String(job.asset_id));
                              const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

                              return (
                                <tr key={job.id} onClick={() => handleOpenModal(job)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 text-sm leading-tight max-w-[250px] truncate">
                                          {aptName ? <><span className="text-blue-600">{aptName}</span> - {job.customer_name}</> : job.customer_name}
                                        </div>
                                        <div className="text-[11px] font-black text-slate-600 mt-1 mb-1.5 truncate max-w-[250px]">
                                          {currentAsset ? currentAsset.name : 'Genel Görev / Varlık Yok'}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mb-1.5 truncate max-w-[250px]">
                                          <MapPin size={12} className="shrink-0" />
                                          <span className="truncate">{currentAsset ? currentAsset.location : 'Lokasyon Yok'}</span>
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded w-fit">{job.work_type}</div>
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col gap-2 w-fit">
                                          {manager === creator ? (
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
                                      <td className="px-6 py-4 font-medium text-slate-600">
                                          <div className="flex items-center gap-1.5">
                                              <Calendar size={14} className="text-slate-400"/>
                                              {job.scheduled_date || 'Anlık / Acil'}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border inline-flex items-center gap-1.5 shadow-sm ${statusClass}`}>
                                              <StatusIcon size={12} />
                                              {displayStatus}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right text-slate-300">
                                          <div className="group-hover:text-blue-500 transition-colors"><Eye size={16} /></div>
                                      </td>
                                  </tr>
                              );
                          }) : (
                              <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium text-sm">Şu anda aktif veya takip edilen bir işiniz yok.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>

              {/* Mobil Görünüm (Cards) */}
              <div className="md:hidden flex flex-col gap-3 p-4 bg-slate-50">
                  {ongoingJobs.length > 0 ? ongoingJobs.map((job: any) => {
                      
                      // 🚀 D1 SÜTUNLARINDAN DİREKT OKUMA (Tertemiz)
                      const creator = job.creator_name || (data?.ownerName?.split(' ')[0] || 'Sistem');
                      const manager = job.manager_name || null;
                      let worker = job.worker_name || null;

                      if (!worker) {
                          if (job.details?.worker_id) {
                              const w = staff.find((s:any) => String(s.id) === String(job.details?.worker_id));
                              if (w) worker = w.name;
                          } else if (String(job.staff_id) !== String(currentUserId)) {
                              const w = staff.find((s:any) => String(s.id) === String(job.staff_id));
                              if (w && w.role === 'Usta') worker = w.name;
                          }
                      }

                      const isCreatorSameAsManager = manager && creator === manager;
                      const staffColor = 'text-amber-600 bg-amber-50 border-amber-200';
                      
                      let displayStatus = job.status;
                      let statusClass = 'bg-blue-50 text-blue-600 border-blue-100';

                      if ((job.status === 'Usta Bekliyor' || job.status === 'Beklemede' || job.status === 'Gelecek') && worker) {
                          displayStatus = 'Usta Onayı Bekleniyor';
                          statusClass = 'bg-amber-50 text-amber-600 border-amber-200';
                      } else if ((job.status === 'Sahada' || job.status === 'Devam Ediyor') && worker) {
                          displayStatus = 'Usta Çalışıyor';
                          statusClass = 'bg-indigo-50 text-indigo-600 border-indigo-200';
                      } else if (job.status === 'Onay Bekliyor') {
                          displayStatus = 'Onay Bekleniyor';
                          statusClass = 'bg-purple-50 text-purple-600 border-purple-200';
                      }

                      const currentAsset = assets.find((a: any) => String(a.id) === String(job.asset_id));
                      const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

                      return (
                        <div key={job.id} onClick={() => handleOpenModal(job)} className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm flex flex-col gap-4 active:scale-95 transition-all cursor-pointer">
                           <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                              <div className="min-w-0 pr-2 flex flex-col gap-1 w-full">
                                <div className="font-black text-slate-800 text-sm line-clamp-2">
                                  {aptName ? <><span className="text-blue-600">{aptName}</span> - {job.customer_name}</> : job.customer_name}
                                </div>
                                <div className="text-[11px] font-bold text-slate-600 truncate">
                                  {currentAsset ? currentAsset.name : 'Genel Görev / Varlık Yok'}
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium flex items-start gap-1.5 line-clamp-2 mb-1">
                                  <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                                  <span>{currentAsset ? currentAsset.location : 'Lokasyon Yok'}</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider truncate bg-slate-50 w-fit px-2 py-0.5 rounded border border-slate-100">
                                  {job.work_type}
                                </div>
                              </div>
                              <span className={`px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0 shadow-sm ${statusClass}`}>
                                {displayStatus}
                              </span>
                           </div>

                           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                                {manager === creator ? (
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

                           <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-1">
                              <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1.5 w-fit">
                                 <Calendar size={12} className={displayStatus === 'Gecikti' ? 'text-rose-500' : 'text-slate-400'}/> {job.scheduled_date || 'Tarih Yok'}
                              </div>
                              <ArrowUpRight size={16} className="text-blue-500" />
                           </div>
                        </div>
                      );
                  }) : <div className="text-center p-6 text-slate-400 text-sm font-medium">Kayıt yok.</div>}
              </div>
          </div>

          {/* TABLO 2: TAMAMLANAN İŞLER */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
              <div className="p-5 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={18} /></div>
                  <h3 className="font-black text-emerald-900 text-sm uppercase tracking-wide">Yönetimimde Tamamlanan İşler ({completedJobs.length})</h3>
              </div>
              
              {/* Masaüstü Görünüm */}
              <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                              <th className="px-6 py-4 border-b border-slate-100">Müşteri / İş</th>
                              <th className="px-6 py-4 border-b border-slate-100">Tamamlayan Usta</th>
                              <th className="px-6 py-4 border-b border-slate-100">Bitiş Tarihi</th>
                              <th className="px-6 py-4 border-b border-slate-100 text-right">Tutar</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {completedJobs.length > 0 ? completedJobs.map((job: any) => {
                              let worker = null;
                              if (String(job.staff_id) !== String(currentUserId)) {
                                  worker = staff.find((s:any) => String(s.id) === String(job.staff_id));
                              } else if (job.details?.worker_id) {
                                  worker = staff.find((s:any) => String(s.id) === String(job.details?.worker_id));
                              }

                              // 🚀 Varlık ve Apartman adını çekiyoruz
                              const currentAsset = assets.find((a: any) => String(a.id) === String(job.asset_id));
                              const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

                              return (
                                  <tr key={job.id} onClick={() => handleOpenModal(job)} className="hover:bg-emerald-50/50 transition-colors cursor-pointer group">
                                      <td className="px-6 py-4">
                                          <div className="font-bold text-slate-800 text-sm leading-tight max-w-[250px] truncate">
                                            {aptName ? <><span className="text-emerald-600">{aptName}</span> - {job.customer_name}</> : job.customer_name}
                                          </div>
                                          <div className="text-[10px] text-slate-500 font-bold mt-1 mb-1 truncate max-w-[250px]">
                                            {currentAsset ? currentAsset.name : 'Genel Görev'}
                                          </div>
                                          <div className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded w-fit">{job.work_type}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                          {worker ? (
                                              <span className="font-bold text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">{worker.name}</span>
                                          ) : <span className="text-slate-400 italic">-</span>}
                                      </td>
                                      <td className="px-6 py-4 font-medium text-slate-600">
                                          {job.updated_at ? new Date(job.updated_at).toLocaleDateString('tr-TR') : '-'}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <span className="font-black text-emerald-600 text-sm bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                            {job.details?.price ? `${job.details.price}` : 'Ücretsiz'}
                                          </span>
                                      </td>
                                  </tr>
                              );
                          }) : (
                              <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium text-sm">Henüz tamamlanmış bir iş kaydınız yok.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>

              {/* Mobil Görünüm */}
              <div className="md:hidden flex flex-col gap-3 p-4 bg-slate-50">
                  {completedJobs.length > 0 ? completedJobs.map((job: any) => {
                      let worker = null;
                      if (String(job.staff_id) !== String(currentUserId)) {
                          worker = staff.find((s:any) => String(s.id) === String(job.staff_id));
                      } else if (job.details?.worker_id) {
                          worker = staff.find((s:any) => String(s.id) === String(job.details?.worker_id));
                      }

                      // 🚀 Varlık ve Apartman adını çekiyoruz
                      const currentAsset = assets.find((a: any) => String(a.id) === String(job.asset_id));
                      const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

                      return (
                        <div key={job.id} onClick={() => handleOpenModal(job)} className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm flex flex-col gap-3 active:scale-95 transition-all cursor-pointer">
                           <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-slate-800 text-sm line-clamp-2">
                                  {aptName ? <><span className="text-emerald-600">{aptName}</span> - {job.customer_name}</> : job.customer_name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold mt-1 mb-1 truncate">
                                  {currentAsset ? currentAsset.name : 'Genel Görev'}
                                </div>
                                <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded w-fit">{job.work_type}</div>
                              </div>
                              <span className="px-2 py-1.5 rounded text-[9px] font-black uppercase tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-100 shrink-0">
                                {job.details?.price || 'Ücretsiz'}
                              </span>
                           </div>
                           <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                              <div className="flex items-center gap-1.5">
                                 <CheckCircle size={12} className="text-emerald-500"/>
                                 <span className="text-xs font-bold text-slate-700">{worker ? worker.name : 'Usta Yok'}</span>
                              </div>
                              <div className="text-xs text-slate-400">
                                 {job.updated_at ? new Date(job.updated_at).toLocaleDateString('tr-TR') : '-'}
                              </div>
                           </div>
                        </div>
                      );
                  }) : <div className="text-center p-6 text-slate-400 text-sm font-medium">Kayıt yok.</div>}
              </div>
          </div>

      </div>

      {/* ŞIK BAŞARI MODALI */}
      <AnimatePresence>
        {successModal.show && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="bg-white/95 backdrop-blur-md border-2 border-emerald-100 shadow-2xl rounded-3xl p-8 flex flex-col items-center text-center max-w-sm w-full pointer-events-auto">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner animate-pulse">
                        <Check size={40} strokeWidth={4} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">Harika!</h3>
                    <p className="text-sm text-slate-500 font-medium">{successModal.msg}</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}