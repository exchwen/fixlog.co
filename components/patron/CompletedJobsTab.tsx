'use client';

import React, { useState } from 'react';
import { CheckCircle2, Calendar, User, ArrowUpRight, MapPin, Briefcase, FileCheck, Search } from 'lucide-react';

export default function CompletedJobsTab({ data, setSelectedJob, statusColors }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Önce sadece "Tamamlandı" statüsündeki işleri al
  const completedJobs = data?.jobs?.filter((j: any) => j.status === 'Tamamlandı') || [];
  const staff = data?.staff || [];
  const assets = data?.assets || [];

  // Arama kelimesine göre filtrele (Müşteri, İş Tipi, Usta Adı, Lokasyon veya Tarih içinde arar)
  const filteredJobs = completedJobs.filter((j: any) => {
    if (!searchTerm) return true;
    
    const assignedStaff = staff.find((s:any) => s.id === j.staff_id) || staff.find((s:any) => s.id === j.details?.worker_id);
    const asset = assets.find((a:any) => a.id === j.asset_id);
    const searchLower = searchTerm.toLowerCase();

    return (
      j.customer_name?.toLowerCase().includes(searchLower) ||
      j.work_type?.toLowerCase().includes(searchLower) ||
      assignedStaff?.name?.toLowerCase().includes(searchLower) ||
      asset?.location?.toLowerCase().includes(searchLower) ||
      j.scheduled_date?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 relative pb-10 sm:pb-0">
      
      {/* BAŞLIK, ARAMA KUTUSU VE İSTATİSTİK */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-full xl:w-auto">
           <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
             <CheckCircle2 className="text-emerald-500" size={20} />
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
         <table className="w-full text-left text-xs min-w-[750px] border-collapse">
           <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
             <tr>
               <th className="px-5 py-4 whitespace-nowrap">Müşteri / Lokasyon</th>
               <th className="px-5 py-4 whitespace-nowrap">Görev Tipi</th>
               <th className="px-5 py-4 whitespace-nowrap">Tarih</th>
               <th className="px-5 py-4 whitespace-nowrap">Sorumlu Usta</th>
               <th className="px-5 py-4 text-right whitespace-nowrap">Durum</th>
               <th className="px-5 py-4 w-10 text-center">İşlem</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {filteredJobs.length > 0 ? filteredJobs.map((j: any) => {
               const assignedStaff = staff.find((s:any) => s.id === j.staff_id) || staff.find((s:any) => s.id === j.details?.worker_id);
               const asset = assets.find((a:any) => a.id === j.asset_id);

               return (
                 <tr 
                   key={j.id} 
                   onClick={() => setSelectedJob && setSelectedJob(j)}
                   className="hover:bg-emerald-50/30 cursor-pointer transition-colors group"
                 >
                   <td className="px-5 py-4 align-middle">
                      <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors truncate max-w-[200px] lg:max-w-[250px]">
                          {j.customer_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1.5 truncate max-w-[200px] lg:max-w-[250px]">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{asset?.location || 'Konum Belirtilmedi'}</span>
                      </div>
                   </td>
                   <td className="px-5 py-4 align-middle font-bold text-slate-600 whitespace-nowrap">
                     <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 w-max">
                       <Briefcase size={12} className="text-slate-400" /> {j.work_type}
                     </div>
                   </td>
                   <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold whitespace-nowrap">
                         <Calendar size={14} className="text-emerald-500"/> 
                         {j.scheduled_date || 'Anlık Kayıt'}
                      </div>
                   </td>
                   <td className="px-5 py-4 align-middle font-bold text-slate-600">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <User size={14} className="text-blue-500"/>
                          {assignedStaff ? assignedStaff.name : 'Belirtilmedi'}
                      </div>
                   </td>
                   <td className="px-5 py-4 align-middle text-right whitespace-nowrap">
                      <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${statusColors ? statusColors[j.status] : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                          {j.status}
                      </span>
                   </td>
                   <td className="px-5 py-4 align-middle text-center">
                      <button className="text-slate-400 group-hover:text-emerald-600 bg-white border border-slate-200 group-hover:border-emerald-200 p-1.5 rounded-lg transition-all shadow-sm">
                          <ArrowUpRight size={16} />
                      </button>
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

      {/* MOBİL GÖRÜNÜM: DİKEY İŞ KARTLARI (Yatay Scroll'u Engeller) */}
      <div className="md:hidden flex flex-col gap-3">
        {filteredJobs.length > 0 ? filteredJobs.map((j: any) => {
           const assignedStaff = staff.find((s:any) => s.id === j.staff_id) || staff.find((s:any) => s.id === j.details?.worker_id);
           const asset = assets.find((a:any) => a.id === j.asset_id);

           return (
            <div 
              key={j.id} 
              onClick={() => setSelectedJob && setSelectedJob(j)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-4 active:scale-95 transition-all cursor-pointer group hover:border-emerald-300"
            >
              {/* Üst Kısım: Müşteri ve Durum */}
              <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                 <div className="min-w-0">
                   <div className="font-black text-slate-800 text-sm truncate pr-2">{j.customer_name}</div>
                   <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-1.5 bg-slate-50 w-max px-2 py-0.5 rounded border border-slate-100">
                      <Briefcase size={10} className="text-slate-400" /> {j.work_type}
                   </div>
                 </div>
                 <span className={`shrink-0 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm ${statusColors ? statusColors[j.status] : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                   {j.status}
                 </span>
              </div>

              {/* Alt Kısım: Sorumlu, Tarih ve İkon */}
              <div className="flex items-end justify-between pt-1">
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 w-fit">
                     <User size={14} className="text-blue-500" /> {assignedStaff ? assignedStaff.name : 'Belirtilmedi'}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 w-fit">
                     <Calendar size={12} className="text-emerald-500" /> {j.scheduled_date || 'Tarihsiz'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-colors">
                   <ArrowUpRight size={14} className="text-slate-400 group-hover:text-white transition-colors" />
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