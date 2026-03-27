'use client';

import React, { useState } from 'react';
import { Plus, Calendar, ArrowRight, Clock, MapPin, ClipboardList, ShieldCheck, Wrench, UserPlus, UserCheck, Search, Archive, Loader2, AlertCircle, CheckCircle, Info, AlertTriangle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function JobsTab({ data, setShowJobModal, statusColors, setSelectedJob, setJobModalType, handleAction }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🚀 Arşiv taranırken butonun durumunu takip edecek sistem eklendi
  const [isScanning, setIsScanning] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });
  
  // Tarih Formatlayıcı
  const formatFullDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 🚀 Dinamik Statü Kontrolü (Mantık Hatalarını ve Gecikmeleri Tespit Eder)
  const getDynamicStatus = (job: any, hasWorker: boolean) => {
    let label = job.status;

    // MANTIK HATASI DÜZELTMESİ: 
    if (label === 'Usta Bekliyor' || label === 'Devam Ediyor') {
        label = hasWorker ? 'Devam Ediyor' : 'Usta Bekliyor';
    }

    let colorClass = statusColors[label] || 'bg-slate-100 text-slate-500 border-slate-200';

    // Gecikme Kontrolü
    if (label === 'Gelecek' && job.scheduled_date) {
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
  
    // Arama Filtresi
    const filteredJobs = data?.jobs?.filter((j: any) => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
      const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name || '';
      const assetName = currentAsset?.name || '';
      const location = currentAsset?.location || '';
      
      return (
        j.customer_name?.toLowerCase().includes(searchLower) ||
        j.work_type?.toLowerCase().includes(searchLower) ||
        aptName.toLowerCase().includes(searchLower) ||
        assetName.toLowerCase().includes(searchLower) ||
        location.toLowerCase().includes(searchLower)
      );
    }) || [];
  
    return (
      <div className="space-y-4 sm:space-y-6">
      
      {/* BAŞLIK */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-full md:w-auto">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Tüm İş Emirleri</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">Filtresiz tüm iş kayıtları ve güncel durumları.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          {/* Arama Kutusu */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Müşteri, Varlık veya İş Türü..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <button 
            disabled={isScanning}
            onClick={async () => {
               setIsScanning(true);
               try {
                 const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken');
                 const res = await fetch(`https://api.fixlog.co/get-archived-jobs?slug=${data.slug}`, {
                     headers: { 'Authorization': `Bearer ${token}` }
                 });
                 
                 if (!res.ok) throw new Error('Sunucu hatası');
                 
                 const archived = await res.json();
                 
                 if(archived.length > 0) {
                  data.jobs = [...archived, ...(data.jobs || [])];
                  setSearchTerm(searchTerm + ' '); // Listeyi re-render etmek için ufak tetikleyici
                  setAlertModal({ isOpen: true, message: "Geçmiş iş kayıtlarınızın tüm arşiv dökümleri başarıyla yüklendi ve tabloya eklendi.", type: 'success' });
              } else {
                  setAlertModal({ isOpen: true, message: "Şu anda sisteme eklenecek yeni bir arşiv kaydı bulunamadı.", type: 'info' });
              }
            } catch (error) {
              setAlertModal({ 
                  isOpen: true, 
                  message: "Şu an için arşive aktarılmış yeni bir geçmiş kayıt bulunmuyor. Uygulamanızın daima en yüksek hızda çalışması için kayıtlarınız her 2 ayda bir otomatik olarak arşive taşınır.", 
                  type: 'warning' 
              });
            } finally {
                 setIsScanning(false);
               }
            }}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all whitespace-nowrap shrink-0 ${
              isScanning 
                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 active:scale-95'
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 size={16} className="animate-spin text-blue-500" /> Taranıyor...
              </>
            ) : (
              <>
                <Archive size={16} className="text-blue-500" /> Arşivi Taramaya Başla
              </>
            )}
          </button>

          <button 
            onClick={() => setShowJobModal(true)} 
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap shrink-0"
          >
            <Plus size={16} strokeWidth={3} /> Yeni Görev Ata
          </button>
        </div>
      </div>

      {/* MASAÜSTÜ TABLO */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
         <table className="w-full text-left text-xs min-w-[900px] border-collapse">
           <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
             <tr>
               <th className="px-5 py-4 whitespace-nowrap">Lokasyon / Müşteri</th>
               <th className="px-5 py-4 whitespace-nowrap">Görev Tipi</th>
               <th className="px-5 py-4 whitespace-nowrap">Plan / Kayıt Tarihi</th>
               <th className="px-5 py-4 whitespace-nowrap">Personel Hiyerarşisi</th>
               <th className="px-5 py-4 text-right whitespace-nowrap">Durum</th>
               <th className="px-5 py-4 w-10"></th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {filteredJobs?.length > 0 ? filteredJobs.map((j: any) => {
               
               // 🚀 HİYERARŞİ HESAPLAMASI (GÜVENLİ & GERİYE DÖNÜK UYUMLU)
               const ownerName = data?.ownerName?.split(' ')[0] || 'Patron';
               
               // 1. Atayan (Creator)
               const creator = j.creator_name || j.details?.createdBy || ownerName;
               
               // 2. Yönetici & Usta Atamaları (Hem D1 Sütunu Hem Details/Staff Taraması)
               let manager = j.manager_name || j.details?.managerName || null;
               let worker = j.worker_name || null;

               const assignedPerson = data?.staff?.find((s: any) => String(s.id) === String(j.staff_id));
               const detailWorker = data?.staff?.find((s: any) => String(s.id) === String(j.details?.worker_id));

               if (assignedPerson) {
                   if (assignedPerson.role === 'Yönetici') {
                       if (!manager) manager = assignedPerson.name;
                   } else {
                       if (!worker) worker = assignedPerson.name;
                   }
               }
               if (detailWorker && !worker) {
                   worker = detailWorker.name;
               }

               const isCreatorSameAsManager = manager && (creator === manager);
               
               const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
               const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

               const dynamicStatus = getDynamicStatus(j, !!worker);

               return (
                 <tr
                   key={j.id} 
                   onClick={() => setSelectedJob(j)}
                   className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                 >
                   {/* Müşteri ve Varlık */}
                   <td className="px-5 py-4 align-top">
                   <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors truncate max-w-[220px] flex items-center gap-2">
                        {aptName ? (
                          <><span className="text-blue-600">{aptName}</span> - {j.customer_name}</>
                        ) : (
                          j.customer_name
                        )}
                        {j.project_pdf_url && <FileText size={16} className="text-blue-500 shrink-0" />}
                      </div>
                      <div className="text-[11px] font-black text-slate-600 mt-1 mb-1 truncate max-w-[220px]">
                        {currentAsset?.name || 'Bağımsız İş'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 truncate max-w-[220px]">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{currentAsset?.location || 'Konum Belirtilmedi'}</span>
                      </div>
                   </td>

                   {/* Görev Tipi */}
                   <td className="px-5 py-4 align-top font-bold text-slate-600 whitespace-nowrap">
                     <div className="flex items-center gap-1.5 bg-slate-50 w-fit px-2 py-1 rounded border border-slate-100 uppercase tracking-wide text-[10px]">
                       <ClipboardList size={14} className="text-slate-400" /> {j.work_type}
                     </div>
                   </td>

                   {/* Tarih */}
                   <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold whitespace-nowrap">
                         <Calendar size={14} className={dynamicStatus.label === 'Gecikti' ? 'text-rose-500' : 'text-blue-500'}/> 
                         {j.scheduled_date || 'Plan Yok'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1.5 whitespace-nowrap ml-0.5">
                        <Clock size={10} />
                        Kayıt: {formatFullDate(j.created_at)}
                      </div>
                   </td>
                   
                  {/* 🚀 MASAÜSTÜ PERSONEL HİYERARŞİSİ (SABİT GENİŞLİK) */}
                  <td className="px-5 py-4 align-top">
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
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 whitespace-nowrap shadow-sm">
                                    Atanmadı
                                </span>
                            )}
                        </div>
                      </div>
                   </td>

                   {/* DİNAMİK DURUM ROZETİ */}
                   <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                      <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${dynamicStatus.colorClass}`}>
                          {dynamicStatus.label}
                      </span>
                   </td>
                   
                   <td className="px-5 py-4 align-middle text-slate-300 group-hover:text-blue-500 text-right">
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                   </td>
                 </tr>
               );
             }) : (
               <tr>
                 <td colSpan={6} className="p-20 text-center bg-slate-50">
                    <div className="flex flex-col items-center justify-center gap-3">
                       <Calendar size={48} className="text-slate-200" />
                       <span className="text-slate-500 font-medium text-sm">Henüz iş kaydı bulunamadı.</span>
                    </div>
                 </td>
               </tr>
             )}
           </tbody>
         </table>
      </div>

      {/* MOBİL GÖRÜNÜM */}
      <div className="md:hidden flex flex-col gap-3">
        {filteredJobs?.length > 0 ? filteredJobs.map((j: any) => {
          
          // 🚀 HİYERARŞİ HESAPLAMASI (MOBİL İÇİN AYNI GÜVENLİ MANTIK)
          const ownerName = data?.ownerName?.split(' ')[0] || 'Patron';
          const creator = j.creator_name || j.details?.createdBy || ownerName;
          
          let manager = j.manager_name || j.details?.managerName || null;
          let worker = j.worker_name || null;

          const assignedPerson = data?.staff?.find((s: any) => String(s.id) === String(j.staff_id));
          const detailWorker = data?.staff?.find((s: any) => String(s.id) === String(j.details?.worker_id));

          if (assignedPerson) {
              if (assignedPerson.role === 'Yönetici') {
                  if (!manager) manager = assignedPerson.name;
              } else {
                  if (!worker) worker = assignedPerson.name;
              }
          }
          if (detailWorker && !worker) {
              worker = detailWorker.name;
          }

          const isCreatorSameAsManager = manager && (creator === manager);
          
          const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
          const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

          const dynamicStatus = getDynamicStatus(j, !!worker);

          return (
            <div 
              key={j.id} 
              onClick={() => setSelectedJob(j)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 active:scale-95 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                 <div className="min-w-0 pr-2">
                 <div className="font-black text-slate-800 text-sm line-clamp-2 flex items-center gap-2">
                     {aptName ? (
                        <><span className="text-blue-600">{aptName}</span> - {j.customer_name}</>
                     ) : (
                        j.customer_name
                     )}
                     {j.project_pdf_url && <FileText size={16} className="text-blue-500 shrink-0" />}
                   </div>
                   <div className="text-[11px] font-bold text-slate-600 mt-1 mb-1.5 truncate">
                     {currentAsset?.name || 'Bağımsız İş'}
                   </div>
                   <div className="text-[10px] text-slate-500 font-medium flex items-start gap-1.5 line-clamp-2">
                     <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                     <span>{currentAsset?.location || 'Konum Belirtilmedi'}</span>
                   </div>
                 </div>
                 <span className={`px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0 shadow-sm ${dynamicStatus.colorClass}`}>
                   {dynamicStatus.label}
                 </span>
              </div>

              {/* 🚀 MOBİL PERSONEL HİYERARŞİSİ (SABİT GENİŞLİK) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                  {isCreatorSameAsManager ? (
                      <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                             <ShieldCheck size={12} /> ATAYAN & SORUMLU
                          </span>
                          <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                              {manager}
                          </div>
                      </div>
                  ) : (
                      <>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                               <UserPlus size={12} /> ATAYAN
                            </span>
                            <div className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                {creator}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                               <UserCheck size={12} /> SORUMLU
                            </span>
                            <div className={`text-[11px] font-bold px-2 py-0.5 rounded border shadow-sm ${manager ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-100 border-slate-200'}`}>
                                {manager || '-'}
                            </div>
                        </div>
                      </>
                  )}
                  
                  <div className="flex items-center gap-2 border-t border-slate-200 pt-2 border-dashed">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                         <Wrench size={12} /> SAHA USTASI
                      </span>
                      <div className={`text-[11px] font-bold px-2 py-0.5 rounded border shadow-sm ${worker ? 'text-indigo-700 bg-indigo-50 border-indigo-100' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
                          {worker || 'Atanmadı'}
                      </div>
                  </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="flex flex-col gap-0.5">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 w-fit">
                     <Calendar size={14} className={dynamicStatus.label === 'Gecikti' ? 'text-rose-500' : 'text-blue-500'} /> 
                     {j.scheduled_date || 'Tarih Yok'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                     <Clock size={10} /> Kayıt: {formatFullDate(j.created_at)}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                   <ArrowRight size={14} className="text-blue-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="p-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
             <Calendar size={40} className="text-slate-300" />
             <span className="text-slate-500 font-medium text-sm">Henüz iş kaydı bulunamadı.</span>
          </div>
        )}
      </div>

      {/* 🚀 DİNAMİK UYARI MODALI */}
      <AnimatePresence>
        {alertModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 10 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 10 }} 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center border border-slate-200"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${
                alertModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                alertModal.type === 'error' ? 'bg-rose-50 text-rose-500' : 
                alertModal.type === 'warning' ? 'bg-amber-50 text-amber-500' : 
                'bg-blue-50 text-blue-500'
              }`}>
                {alertModal.type === 'success' && <CheckCircle size={32} />}
                {alertModal.type === 'error' && <AlertCircle size={32} />}
                {alertModal.type === 'warning' && <AlertTriangle size={32} />}
                {alertModal.type === 'info' && <Info size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                {alertModal.type === 'success' ? 'Başarılı!' : 
                 alertModal.type === 'error' ? 'Hata!' : 
                 alertModal.type === 'warning' ? 'Uyarı!' : 
                 'Bilgi'}
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                {alertModal.message}
              </p>
              <button 
                onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-md flex justify-center items-center"
              >
                Tamam
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}