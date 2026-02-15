'use client';

import React from 'react';
import { Plus } from 'lucide-react';

export default function JobsTab({ data, setShowJobModal, statusColors }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Tüm İş Emirleri</h3>
        <button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700">
          <Plus size={14} /> Yeni Görev
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-left text-xs">
           <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
             <tr>
               <th className="px-5 py-3">Lokasyon / Müşteri</th>
               <th className="px-5 py-3">Görev Tipi</th>
               <th className="px-5 py-3">Tarih</th>
               <th className="px-5 py-3">Sorumlu</th>
               <th className="px-5 py-3 text-right">Durum</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {data?.jobs?.length > 0 ? data.jobs.map((j: any) => (
               <tr key={j.id} className="hover:bg-slate-50">
                 <td className="px-5 py-3 font-semibold text-slate-800">{j.customer_name}</td>
                 <td className="px-5 py-3 text-slate-600">{j.work_type}</td>
                 <td className="px-5 py-3 text-slate-500">{j.scheduled_date || 'Anlık'}</td>
                 <td className="px-5 py-3 text-slate-600">{data?.staff?.find((s: any) => s.id === j.staff_id)?.name || '-'}</td>
                 <td className="px-5 py-3 text-right">
                    <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                 </td>
               </tr>
             )) : <tr><td colSpan="5" className="p-10 text-center text-slate-400">İş kaydı bulunamadı.</td></tr>}
           </tbody>
         </table>
      </div>
    </div>
  );
}