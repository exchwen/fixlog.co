'use client';

import React, { useState } from 'react';
import { Search, CheckCircle, MapPin, ClipboardList, Calendar, Clock, ArrowRight, ShieldCheck, UserPlus, UserCheck, Wrench, Building2, FileCheck } from 'lucide-react';

export default function CompletedJobsTab({ data, setSelectedJob, statusColors }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  // Tarih Formatlayıcı (Gün.Ay.Yıl Saat:Dakika)
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

  // Sadece tamamlanan işleri filtrele ve aramayı uygula
  const completedJobs = (data?.jobs || []).filter((j: any) => j.status === 'Tamamlandı');
  
  const filteredJobs = completedJobs.filter((j: any) => {
    const term = searchTerm.toLowerCase();
    const customer = j.customer_name?.toLowerCase() || '';
    const wType = j.work_type?.toLowerCase() || '';
    const asset = data?.assets?.find((a: any) => String(a.id) === String(j.asset_id))?.name?.toLowerCase() || '';
    
    // Aramaya usta, sorumlu ve atayan isimleri de dahil ediliyor
    const ownerName = data?.ownerName?.split(' ')[0] || 'Patron';
    const creator = (j.creator_name || j.details?.createdBy || ownerName).toLowerCase();
    const manager = (j.manager_name || j.details?.managerName || '').toLowerCase();
    
    let workerName = '';
    if (j.worker_name) workerName = j.worker_name;
    else if (j.details?.worker_id) {
        const w = data?.staff?.find((s:any) => String(s.id) === String(j.details?.worker_id));
        if (w) workerName = w.name;
    } else if (j.staff_id) {
        const w = data?.staff?.find((s:any) => String(s.id) === String(j.staff_id));
        if (w && w.role === 'Usta') workerName = w.name;
    }
    const worker = workerName.toLowerCase();

    return customer.includes(term) || wType.includes(term) || asset.includes(term) || creator.includes(term) || manager.includes(term) || worker.includes(term);
  });

  return (
    <div className="space-y-4 sm:space-y-6 relative pb-10 sm:pb-0">
      
      {/* BAŞLIK, ARAMA KUTUSU VE İSTATİSTİK */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-full xl:w-auto">
           <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
             <CheckCircle className="text-emerald-500" size={20} />
             Tamamlanan İşler
           </h3>
           <p className="text-xs text-slate-500 font-medium mt-0.5">
             Sahada başarıyla teslim edilen ve kapatılan tüm görevlerin arşivi.
           </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            {/* ARAMA KUTUSU */}
            <div className="relative flex-1 sm:min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Müşteri, usta, lokasyon ara..." 
                className="w-full pl-9 pr-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 hover:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium text-slate-800 shadow-inner sm:shadow-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* TOPLAM SAYAÇ */}
            <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 sm:py-2.5 rounded-xl flex items-center gap-2 shadow-sm shrink-0 justify-between sm:justify-start">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Teslimat:</span>
                <span className="text-sm font-black text-emerald-600 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-sm">
                    {filteredJobs.length}
                </span>
            </div>
        </div>
      </div>

      {/* MASAÜSTÜ GÖRÜNÜM: TABLO (Mobilde Gizlenir) */}
      <div className="hidden md:flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col overflow-x-auto custom-scrollbar">
         <table className="w-full text-left text-xs min-w-[900px] border-collapse">
           <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
             <tr>
               <th className="px-5 py-4 whitespace-nowrap">Müşteri / Lokasyon</th>
               <th className="px-5 py-4 whitespace-nowrap">Görev Tipi</th>
               <th className="px-5 py-4 whitespace-nowrap">Kayıt / Plan Tarihi</th>
               <th className="px-5 py-4 whitespace-nowrap">Personel Hiyerarşisi</th>
               <th className="px-5 py-4 text-right whitespace-nowrap">Durum</th>
               <th className="px-5 py-4 w-10 text-center"></th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {filteredJobs.length > 0 ? filteredJobs.map((j: any) => {
               
               // 🚀 STANDART HİYERARŞİ HESAPLAMASI
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

               return (
                 <tr 
                   key={j.id} 
                   onClick={() => setSelectedJob && setSelectedJob(j)}
                   className="hover:bg-emerald-50/30 cursor-pointer transition-colors group"
                 >
                   {/* Müşteri ve Varlık */}
                   <td className="px-5 py-4 align-top">
                      <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors truncate max-w-[220px]">
                        {aptName ? (
                          <><span className="text-blue-600">{aptName}</span> - {j.customer_name}</>
                        ) : (
                          j.customer_name
                        )}
                      </div>
                      <div className="text-[11px] font-black text-slate-600 mt-1 mb-1.5 truncate max-w-[220px]">
                        {currentAsset?.name || 'Bağımsız İş'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 truncate max-w-[220px]">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{currentAsset?.location || 'Konum Belirtilmedi'}</span>
                      </div>
                   </td>
                   
                   {/* Görev Tipi */}
                   <td className="px-5 py-4 align-top font-bold text-slate-600 whitespace-nowrap">
                     <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 w-max uppercase tracking-wide text-[10px]">
                       <ClipboardList size={14} className="text-slate-400" /> {j.work_type}
                     </div>
                   </td>
                   
                   {/* 🚀 TARİH / SAAT ALANI */}
                   <td className="px-5 py-4 align-top">
                      <div className="flex flex-col gap-1.5">
                         <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 whitespace-nowrap">
                             <Calendar size={14} className="text-emerald-500"/> 
                             {j.scheduled_date ? `${j.scheduled_date} (Planlı)` : 'Anlık Kayıt'}
                         </div>
                         <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                             <Clock size={12} className="text-slate-400"/> 
                             {formatFullDate(j.created_at)}
                         </div>
                      </div>
                   </td>

                   {/* 🚀 PERSONEL HİYERARŞİSİ SÜTUNU (Sabit Genişlik) */}
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
                              <Wrench size={14} className={worker ? 'text-emerald-500' : 'text-slate-400'} />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">SAHA USTASI:</span>
                            </div>
                            {worker ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap shadow-sm">
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

                   {/* DURUM ROZETİ */}
                   <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                      <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${statusColors ? statusColors[j.status] : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                          {j.status}
                      </span>
                   </td>
                   
                   <td className="px-5 py-4 align-middle text-slate-300 group-hover:text-emerald-600 text-center">
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                   </td>
                 </tr>
               )
             }) : (
               <tr>
                 <td colSpan={6} className="p-20 text-center bg-slate-50">
                    <div className="flex flex-col items-center justify-center gap-3">
                       <FileCheck size={48} className="text-slate-200" />
                       <span className="text-slate-500 font-medium text-sm">
                         {searchTerm ? 'Aradığınız kritere uygun arşiv kaydı bulunamadı.' : 'Henüz tamamlanmış bir iş bulunmuyor.'}
                       </span>
                    </div>
                 </td>
               </tr>
             )}
           </tbody>
         </table>
      </div>

      {/* MOBİL GÖRÜNÜM: DİKEY İŞ KARTLARI */}
      <div className="md:hidden flex flex-col gap-3">
        {filteredJobs.length > 0 ? filteredJobs.map((j: any) => {
           
           // 🚀 HİYERARŞİ HESAPLAMASI (MOBİL)
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

           return (
            <div 
              key={j.id} 
              onClick={() => setSelectedJob(j)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-4 active:scale-95 transition-all cursor-pointer group hover:border-emerald-300"
            >
              {/* Üst Kısım: Müşteri ve Durum */}
              <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                 <div className="min-w-0 pr-2">
                   <div className="font-black text-slate-800 text-sm line-clamp-2">
                     {aptName ? (
                        <><span className="text-blue-600">{aptName}</span> - {j.customer_name}</>
                     ) : (
                        j.customer_name
                     )}
                   </div>
                   <div className="text-[11px] font-bold text-slate-600 mt-1 mb-1.5 truncate">
                     {currentAsset?.name || 'Bağımsız İş'}
                   </div>
                   <div className="text-[10px] text-slate-500 font-medium flex items-start gap-1.5 line-clamp-2">
                     <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                     <span>{currentAsset?.location || 'Konum Belirtilmedi'}</span>
                   </div>
                 </div>
                 <span className={`shrink-0 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm ${statusColors ? statusColors[j.status] : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                   {j.status}
                 </span>
              </div>

              {/* 🚀 MOBİL PERSONEL HİYERARŞİSİ */}
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
                      <div className={`text-[11px] font-bold px-2 py-0.5 rounded border shadow-sm ${worker ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
                          {worker || 'Atanmadı'}
                      </div>
                  </div>
              </div>

              {/* Alt Kısım: Tarih ve İkon */}
              <div className="flex items-end justify-between pt-1">
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 bg-slate-50 w-max px-2 py-1 rounded border border-slate-100">
                      <ClipboardList size={10} className="text-slate-400" /> {j.work_type}
                  </div>
                  {/* 🚀 TARİH / SAAT ALANI (MOBİL) */}
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 w-fit mt-0.5">
                     <Calendar size={14} className="text-emerald-500" /> 
                     {j.scheduled_date ? `${j.scheduled_date} (Planlı)` : 'Anlık Kayıt'}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 w-fit">
                     <Clock size={12} className="text-slate-400" /> 
                     {formatFullDate(j.created_at)}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-colors">
                   <ArrowRight size={14} className="text-emerald-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          )
        }) : (
          <div className="p-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
             <FileCheck size={40} className="text-slate-300" />
             <span className="text-slate-500 font-medium text-sm text-center">
                {searchTerm ? 'Aramanıza uygun kayıt bulunamadı.' : 'Henüz tamamlanmış bir iş bulunmuyor.'}
             </span>
          </div>
        )}
      </div>

    </div>
  );
}