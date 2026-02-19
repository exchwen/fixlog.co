'use client';

import React from 'react';
import { Plus, Calendar, User, ArrowRight, Clock } from 'lucide-react';

export default function JobsTab({ data, setShowJobModal, statusColors, setSelectedJob }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Tüm İş Emirleri</h3>
        <button 
          onClick={() => setShowJobModal(true)} 
          // YENİ: active:scale-95 ve transition-all eklendi (Mobil UX)
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus size={14} /> Yeni Görev
        </button>
      </div>

      {/* YENİ: overflow-x-auto eklendi (Mobilde taşmayı önler) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
         {/* YENİ: min-w-[750px] eklendi (Hücrelerin ezilmesini önler) */}
         <table className="w-full text-left text-xs min-w-[750px]">
           <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
             <tr>
               <th className="px-5 py-3 whitespace-nowrap">Lokasyon / Müşteri</th>
               <th className="px-5 py-3 whitespace-nowrap">Görev Tipi</th>
               <th className="px-5 py-3 whitespace-nowrap">Tarih / Saat</th>
               <th className="px-5 py-3 whitespace-nowrap">Sorumlu</th>
               <th className="px-5 py-3 text-right whitespace-nowrap">Durum</th>
               <th className="px-5 py-3 w-10"></th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {data?.jobs?.length > 0 ? data.jobs.map((j: any) => (
               <tr 
                 key={j.id} 
                 onClick={() => setSelectedJob(j)}
                 className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
               >
                 <td className="px-5 py-3 font-semibold text-slate-800">
                    <div className="truncate max-w-[200px]">{j.customer_name}</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5 truncate max-w-[200px]">
                      {data?.assets?.find((a:any) => a.id === j.asset_id)?.location || ''}
                    </div>
                 </td>
                 <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{j.work_type}</td>
                 <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium whitespace-nowrap">
                       <Calendar size={12} className="text-slate-400"/> 
                       {j.scheduled_date || 'Anlık'}
                    </div>
                    {j.created_at && (
                       <div className="text-[10px] text-slate-400 font-normal mt-1 flex items-center gap-1 whitespace-nowrap" title="Oluşturulma Zamanı">
                          <Clock size={10} />
                          {new Date(j.created_at).toLocaleDateString('tr-TR', { 
                             day: '2-digit', month: '2-digit', year: 'numeric', 
                             hour: '2-digit', minute: '2-digit' 
                          })}
                       </div>
                    )}
                 </td>
                 <td className="px-5 py-3 text-slate-600">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <User size={12} className="opacity-50"/>
                        {data?.staff?.find((s: any) => s.id === j.staff_id)?.name || '-'}
                    </div>
                 </td>
                 <td className="px-5 py-3 text-right whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                 </td>
                 <td className="px-5 py-3 text-slate-300 group-hover:text-blue-500 text-right">
                    <ArrowRight size={14} />
                 </td>
               </tr>
             )) : (
               <tr>
                 <td colSpan={6} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <Calendar size={32} className="text-slate-200" />
                       <span className="text-slate-400 font-medium">İş kaydı bulunamadı.</span>
                    </div>
                 </td>
               </tr>
             )}
           </tbody>
         </table>
      </div>
    </div>
  );
}