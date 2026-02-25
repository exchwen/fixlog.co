'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, MapPin, CheckCircle, PlayCircle, 
  ArrowUpRight, User, Wrench, Loader2, 
  UserPlus, Check, Calendar, Activity, AlertTriangle, CheckSquare, Clock, ShieldCheck, Eye
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
    createdBy?: string;
    creatorRole?: string;
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
      setCurrentUserName(savedName.split(' ')[0]); 
    }
  }, []);

  const jobs = data?.jobs || [];
  const staff = data?.staff || [];

  // --- İZOLASYON VE GRUPLANDIRMA MANTIĞI (DÜZELTİLDİ) ---
  
  // 1. "Benimle İlgili" Tüm İşler
  const myAllJobs = useMemo(() => {
     if (!currentUserId) return [];
     return jobs.filter((j: any) => 
        String(j.staff_id) === String(currentUserId) || // Direkt bana atanmış (Yönetici olarak)
        String(j.details?.managerId) === String(currentUserId) || // Ben yönetici olarak atanmışım
        String(j.details?.worker_id) === String(currentUserId) // Ben usta olarak atanmışım
     );
  }, [jobs, currentUserId]);

  // A) ONAY BEKLEYENLER (Patrondan bana gelen, henüz kabul etmediğim)
  const incomingJobs = myAllJobs.filter((j: any) => 
    (j.status === 'Beklemede' || j.status === 'Gelecek') && 
    String(j.staff_id) === String(currentUserId)
  );

  // B) ATAMA BEKLEYENLER (Kabul ettim, statü 'Usta Bekliyor' ama worker_id YOK)
  const waitingForAssignment = myAllJobs.filter((j: any) => 
    j.status === 'Usta Bekliyor' && 
    !j.details?.worker_id && 
    String(j.staff_id) === String(currentUserId)
  );

  // C) DEVAM EDEN & TAKİPTEKİ İŞLER (KRİTİK DÜZELTME)
  // Şartlar:
  // 1. Statü 'Tamamlandı' veya 'İptal' OLMAYACAK.
  // 2. Yukarıdaki (A) ve (B) gruplarına girmeyecek.
  // 3. Ya ben yapıyorumdur (worker_id yok veya benim id'm) YA DA atadığım usta yapıyordur (worker_id var).
  const ongoingJobs = myAllJobs.filter((j: any) => {
    // Tamamlanmış veya iptalleri çıkar
    if (j.status === 'Tamamlandı' || j.status === 'İptal') return false;
    
    // Onay bekleyen veya atama bekleyenleri çıkar (zaten yukarıda varlar)
    const isIncoming = (j.status === 'Beklemede' || j.status === 'Gelecek') && String(j.staff_id) === String(currentUserId);
    const isWaitingAssign = j.status === 'Usta Bekliyor' && !j.details?.worker_id;
    
    if (isIncoming || isWaitingAssign) return false;

    // Geriye kalanlar: 'Devam Ediyor', 'Sahada' veya 'Usta Bekliyor' (ama worker_id dolu)
    return true; 
  });

  // D) TAMAMLANANLAR
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
      setShowJobModal(true);
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

      {/* 1. BÖLÜM: ONAY BEKLEYENLER */}
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
                        <h4 className="font-black text-white leading-tight mb-1 truncate">{job.customer_name}</h4>
                        <p className="text-amber-100/80 text-xs line-clamp-1 mb-3">{job.details?.note || 'Not girilmemiş.'}</p>
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

      {/* 2. BÖLÜM: ATAMA BEKLEYENLER */}
      {waitingForAssignment.length > 0 && (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg"><UserPlus size={16} /></div>
                <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">
                    Ustaya Atanmayı Bekleyenler ({waitingForAssignment.length})
                </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {waitingForAssignment.map((job: any) => (
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
                            <h4 className="text-lg font-black text-slate-800 leading-tight mb-2 line-clamp-2">{job.customer_name}</h4>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                    <MapPin size={14} className="text-indigo-400 shrink-0"/> 
                                    <span className="truncate">{job.asset_name || 'Lokasyon/Cihaz Belirtilmemiş'}</span>
                                </p>
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
                ))}
            </div>
        </div>
      )}

      {/* 3. BÖLÜM: AKTİF VE TAKİPTEKİ İŞLER */}
      <div className="space-y-8 pt-2">
          
          <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
              <div className="p-5 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Activity size={18} /></div>
                  <h3 className="font-black text-blue-900 text-sm uppercase tracking-wide">
                      Yönetimimdeki Aktif İşler ({ongoingJobs.length})
                  </h3>
              </div>
              
              {/* Masaüstü Görünüm */}
              <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                              <th className="px-6 py-4 border-b border-slate-100">Müşteri / Hiyerarşi</th>
                              <th className="px-6 py-4 border-b border-slate-100">Atanan Usta</th>
                              <th className="px-6 py-4 border-b border-slate-100">Planlanan Tarih</th>
                              <th className="px-6 py-4 border-b border-slate-100 text-right">Durum</th>
                              <th className="px-6 py-4 border-b border-slate-100"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {ongoingJobs.length > 0 ? ongoingJobs.map((job: any) => {
                              // HIYERARŞİ VE İSİM BULMA
                              const ownerName = data?.ownerName?.split(' ')[0] || 'Patron';
                              const createdBy = job.details?.createdBy || ownerName;
                              const assignedManager = data?.staff?.find((s: any) => String(s.id) === String(job.staff_id));
                              const assignedWorker = data?.staff?.find((s:any) => String(s.id) === String(job.details?.worker_id));
                              
                              const isCreatorSameAsManager = assignedManager && (assignedManager.name === createdBy);

                              // AKILLI DURUM MANTIĞI
                              let displayStatus = job.status;
                              let statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
                              let StatusIcon = Activity;

                              if (job.status === 'Usta Bekliyor' && assignedWorker) {
                                  displayStatus = 'Usta Onayı Bekleniyor';
                                  statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
                                  StatusIcon = Clock;
                              } else if (job.status === 'Sahada' || job.status === 'Devam Ediyor') {
                                  if (assignedWorker) {
                                      displayStatus = 'Usta Sahada / Çalışıyor';
                                      statusClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                                      StatusIcon = Wrench;
                                  } else {
                                      displayStatus = 'Siz Çalışıyorsunuz';
                                  }
                              }

                              return (
                                  <tr key={job.id} onClick={() => handleOpenModal(job)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                                      {/* Müşteri ve Atayan Bilgisi */}
                                      <td className="px-6 py-4">
                                          <div className="font-bold text-slate-800 text-sm">{job.customer_name}</div>
                                          <div className="flex items-center gap-1 mt-1">
                                              {isCreatorSameAsManager ? (
                                                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                      <ShieldCheck size={10} /> {assignedManager?.name} (Siz)
                                                  </span>
                                              ) : (
                                                  <>
                                                      <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                          {createdBy}
                                                      </span>
                                                      <span className="text-[10px] text-slate-300">➜</span>
                                                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                          {assignedManager?.name} (Siz)
                                                      </span>
                                                  </>
                                              )}
                                          </div>
                                      </td>

                                      {/* Usta Bilgisi */}
                                      <td className="px-6 py-4">
                                          {assignedWorker ? (
                                              <div className="flex items-center gap-2">
                                                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black border border-indigo-200">
                                                      {assignedWorker.name.charAt(0)}
                                                  </div>
                                                  <span className="font-bold text-slate-700 text-xs">{assignedWorker.name}</span>
                                              </div>
                                          ) : (
                                              <div className="flex items-center gap-2 opacity-60">
                                                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center"><User size={12} /></div>
                                                  <span className="text-slate-500 italic text-[11px]">Kendim</span>
                                              </div>
                                          )}
                                      </td>

                                      <td className="px-6 py-4 font-medium text-slate-600">
                                          <div className="flex items-center gap-1.5 text-xs">
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

              {/* Mobil Görünüm */}
              <div className="md:hidden flex flex-col gap-3 p-4 bg-slate-50">
                  {ongoingJobs.length > 0 ? ongoingJobs.map((job: any) => {
                      const assignedWorker = data?.staff?.find((s:any) => String(s.id) === String(job.details?.worker_id));
                      
                      let displayStatus = job.status;
                      let statusClass = 'bg-blue-50 text-blue-600 border-blue-100';

                      if (job.status === 'Usta Bekliyor' && assignedWorker) {
                          displayStatus = 'Usta Onayı Bekleniyor';
                          statusClass = 'bg-amber-50 text-amber-600 border-amber-200';
                      } else if ((job.status === 'Sahada' || job.status === 'Devam Ediyor') && assignedWorker) {
                          displayStatus = 'Usta Çalışıyor';
                          statusClass = 'bg-indigo-50 text-indigo-600 border-indigo-200';
                      }

                      return (
                        <div key={job.id} onClick={() => handleOpenModal(job)} className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm flex flex-col gap-3 active:scale-95 transition-all">
                           <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 text-sm truncate">{job.customer_name}</div>
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">{job.work_type}</div>
                              </div>
                              <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${statusClass}`}>
                                {displayStatus}
                              </span>
                           </div>
                           
                           {/* Mobil Hiyerarşi Özeti */}
                           <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                              <div className="flex items-center gap-1.5">
                                 <Wrench size={12} className="text-slate-400"/>
                                 <span className="text-xs font-bold text-slate-700">
                                    {assignedWorker ? assignedWorker.name : 'Sorumlu: Siz'}
                                 </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                 <Calendar size={12}/> {job.scheduled_date || 'Tarih Yok'}
                              </div>
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
              
              {/* Masaüstü */}
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
                              const worker = staff.find((s:any) => String(s.id) === String(job.details?.worker_id));
                              return (
                                  <tr key={job.id} onClick={() => handleOpenModal(job)} className="hover:bg-emerald-50/50 transition-colors cursor-pointer group">
                                      <td className="px-6 py-4">
                                          <div className="font-bold text-slate-800 text-sm">{job.customer_name}</div>
                                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">{job.work_type}</div>
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

              {/* Mobil */}
              <div className="md:hidden flex flex-col gap-3 p-4 bg-slate-50">
                  {completedJobs.length > 0 ? completedJobs.map((job: any) => {
                      const worker = staff.find((s:any) => String(s.id) === String(job.details?.worker_id));
                      return (
                        <div key={job.id} onClick={() => handleOpenModal(job)} className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm flex flex-col gap-3 active:scale-95 transition-all">
                           <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 text-sm truncate">{job.customer_name}</div>
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">{job.work_type}</div>
                              </div>
                              <span className="px-2 py-1 rounded text-[9px] font-black uppercase border bg-emerald-50 text-emerald-600 border-emerald-100">
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