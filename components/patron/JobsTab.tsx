'use client';

import React from 'react';
import { Plus, Calendar, ArrowRight, Clock, MapPin, ClipboardList, ShieldCheck, Wrench, UserPlus, UserCheck } from 'lucide-react';

export default function JobsTab({ data, setShowJobModal, statusColors, setSelectedJob, setJobModalType, handleAction }: any) {
  
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

  // 🚀 DÜZELTİLMİŞ: Dinamik Statü Kontrolü (Mantık Hatalarını ve Gecikmeleri Tespit Eder)
  const getDynamicStatus = (job: any, hasWorker: boolean) => {
    let label = job.status;

    // 🛠️ MANTIK HATASI DÜZELTMESİ: 
    // İş tamamlanmadıysa, iptal edilmediyse ve onay beklemiyorsa ustanın varlığına göre durumu otomatik düzelt.
    if (label === 'Usta Bekliyor' || label === 'Devam Ediyor') {
        label = hasWorker ? 'Devam Ediyor' : 'Usta Bekliyor';
    }

    let colorClass = statusColors[label] || 'bg-slate-100 text-slate-500 border-slate-200';

    // Gecikme Kontrolü
    if (label === 'Gelecek' && job.scheduled_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sDate = new Date(job.scheduled_date.split(' ')[0]); // Saati yoksay, sadece tarihi al
        sDate.setHours(0, 0, 0, 0);

        if (sDate < today) {
            label = 'Gecikti';
            colorClass = 'bg-rose-100 text-rose-700 border-rose-200'; // Gecikme için uyarıcı kırmızı renk
        }
    }
    return { label, colorClass };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* BAŞLIK */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-full sm:w-auto">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Tüm İş Emirleri (Genel Arşiv)</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">Filtresiz tüm iş kayıtları ve güncel durumları.</p>
        </div>
        
        <button 
          onClick={() => setShowJobModal(true)} 
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={3} /> Yeni Görev Ata
        </button>
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
             {data?.jobs?.length > 0 ? data.jobs.map((j: any) => {
               
               // --- ROL BAZLI HİYERARŞİ ---
               const ownerName = data?.ownerName?.split(' ')[0] || 'Patron';
               const creatorName = j.details?.createdBy || ownerName;
               const assignedPerson = data?.staff?.find((s: any) => String(s.id) === String(j.staff_id));
               const detailWorker = data?.staff?.find((s: any) => String(s.id) === String(j.details?.worker_id));
               
               // Eğer ustaya atanmışsa eski yöneticiyi details içinden kurtarıyoruz
               let managerName = j.details?.managerName || null;
               let workerName = null;

               if (assignedPerson) {
                   if (assignedPerson.role === 'Yönetici') {
                       if (!managerName) managerName = assignedPerson.name;
                   } else {
                       workerName = assignedPerson.name;
                   }
               }

               if (detailWorker) {
                   workerName = detailWorker.name;
               }

               const isCreatorSameAsManager = managerName && (creatorName === managerName);
               
               // İlgili varlığı ve apartman adını buluyoruz
               const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
               const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

               // 🚀 MANTIK HATASI DÜZELTMESİ: İşin durumunu ustanın varlığına göre hesapla
               const dynamicStatus = getDynamicStatus(j, !!workerName);

               return (
                 <tr
                   key={j.id} 
                   onClick={() => setSelectedJob(j)}
                   className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                 >
                   {/* Müşteri ve Varlık */}
                   <td className="px-5 py-4 align-top">
                      <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors truncate max-w-[220px]">
                        {aptName ? (
                          <><span className="text-blue-600">{aptName}</span> - {j.customer_name}</>
                        ) : (
                          j.customer_name
                        )}
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
                   
                   {/* 🚀 DÜZELTİLMİŞ: Personel Hiyerarşisi (Sıkı ve Düzenli Izgara Görünümü) */}
                   <td className="px-5 py-4 align-top">
                      <div className="flex flex-col gap-2 w-fit">
                        {isCreatorSameAsManager ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 w-[130px] shrink-0">
                                  <ShieldCheck size={14} className="text-blue-600" />
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ATAYAN & SORUMLU:</span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">
                                    {managerName}
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 w-[130px] shrink-0">
                                      <UserPlus size={14} className="text-slate-400" />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ATAYAN:</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 whitespace-nowrap">
                                        {creatorName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 w-[130px] shrink-0">
                                      <UserCheck size={14} className={managerName ? 'text-blue-500' : 'text-slate-300'} />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">SORUMLU:</span>
                                    </div>
                                    {managerName ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">
                                            {managerName}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium text-slate-400 italic px-2 py-0.5">-</span>
                                    )}
                                </div>
                            </>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 w-[130px] shrink-0">
                              <Wrench size={14} className={workerName ? 'text-indigo-500' : 'text-slate-400'} />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">SAHA USTASI:</span>
                            </div>
                            {workerName ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 whitespace-nowrap">
                                    {workerName}
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 whitespace-nowrap">
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
        {data?.jobs?.length > 0 ? data.jobs.map((j: any) => {
          
          // --- MOBİL İÇİN HİYERARŞİ ---
          const ownerName = data?.ownerName?.split(' ')[0] || 'Patron';
          const creatorName = j.details?.createdBy || ownerName;
          const assignedPerson = data?.staff?.find((s: any) => String(s.id) === String(j.staff_id));
          const detailWorker = data?.staff?.find((s: any) => String(s.id) === String(j.details?.worker_id));
          
          let managerName = j.details?.managerName || null;
          let workerName = null;

          if (assignedPerson) {
              if (assignedPerson.role === 'Yönetici') {
                  if (!managerName) managerName = assignedPerson.name;
              } else {
                  workerName = assignedPerson.name;
              }
          }

          if (detailWorker) {
              workerName = detailWorker.name;
          }

          const isCreatorSameAsManager = managerName && (creatorName === managerName);
          
          const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id));
          const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;

          // 🚀 MANTIK HATASI DÜZELTMESİ (MOBİL)
          const dynamicStatus = getDynamicStatus(j, !!workerName);

          return (
            <div 
              key={j.id} 
              onClick={() => setSelectedJob(j)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 active:scale-95 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                 <div className="min-w-0">
                   <div className="font-black text-slate-800 text-sm truncate">
                     {aptName ? (
                        <><span className="text-blue-600">{aptName}</span> - {j.customer_name}</>
                     ) : (
                        j.customer_name
                     )}
                   </div>
                   <div className="text-xs font-bold text-slate-600 mt-0.5 mb-1 truncate">
                     {currentAsset?.name || 'Bağımsız İş'}
                   </div>
                   <div className="text-[10px] text-slate-500 font-medium flex items-start gap-1.5 line-clamp-2">
                     <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                     <span>{currentAsset?.location || 'Konum Belirtilmedi'}</span>
                   </div>
                 </div>
                 {/* DİNAMİK DURUM ROZETİ (MOBİL) */}
                 <span className={`px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0 shadow-sm ${dynamicStatus.colorClass}`}>
                   {dynamicStatus.label}
                 </span>
              </div>

              {/* 🚀 DÜZELTİLMİŞ: Mobil Personel Hiyerarşisi (Düzenli Izgara) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                  {isCreatorSameAsManager ? (
                      <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                             <ShieldCheck size={12} /> ATAYAN & SORUMLU
                          </span>
                          <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {managerName}
                          </div>
                      </div>
                  ) : (
                      <>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                               <UserPlus size={12} /> ATAYAN
                            </span>
                            <div className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {creatorName}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                               <UserCheck size={12} /> SORUMLU
                            </span>
                            <div className={`text-[11px] font-bold px-2 py-0.5 rounded border ${managerName ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-100 border-slate-200'}`}>
                                {managerName || '-'}
                            </div>
                        </div>
                      </>
                  )}
                  
                  <div className="flex items-center gap-2 border-t border-slate-200 pt-2 border-dashed">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 w-[125px] shrink-0">
                         <Wrench size={12} /> SAHA USTASI
                      </span>
                      <div className={`text-[11px] font-bold px-2 py-0.5 rounded border ${workerName ? 'text-indigo-700 bg-indigo-50 border-indigo-100' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
                          {workerName || 'Atanmadı'}
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

    </div>
  );
}