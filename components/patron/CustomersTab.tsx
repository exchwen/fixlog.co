'use client';

import React from 'react';
import { Plus, Box } from 'lucide-react';

export default function CustomersTab({ data, setShowCustomerModal }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Müşteri Rehberi & Cihazlar</h3>
        <button onClick={() => setShowCustomerModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700">
          <Plus size={14} /> Müşteri Ekle
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-left text-xs">
           <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
             <tr>
               <th className="px-5 py-3">İsim / Kurum</th>
               <th className="px-5 py-3">İletişim</th>
               <th className="px-5 py-3">Kayıtlı Cihazlar</th>
               <th className="px-5 py-3 text-right">Adres & Vergi</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {data?.customers?.length > 0 ? data.customers.map((c: any) => {
               // Bu müşteriye ait varlıkları (cihazları) filtreliyoruz
               const customerAssets = data?.assets?.filter((a: any) => a.customer_id === c.id) || [];
               return (
                 <tr key={c.id} className="hover:bg-slate-50">
                   <td className="px-5 py-3 font-semibold text-slate-800">{c.name}</td>
                   <td className="px-5 py-3 text-slate-600">{c.contact || '-'}</td>
                   <td className="px-5 py-3">
                     {customerAssets.length > 0 ? (
                       <div className="flex flex-wrap gap-1.5">
                         {customerAssets.map((a: any) => (
                           <span key={a.id} className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-medium flex items-center gap-1">
                             <Box size={10} /> {a.name}
                           </span>
                         ))}
                       </div>
                     ) : (
                       <span className="text-[10px] text-slate-400 italic">Cihaz atanmamış</span>
                     )}
                   </td>
                   <td className="px-5 py-3 text-right">
                     <div className="text-slate-600 truncate max-w-[150px] ml-auto">{c.address || '-'}</div>
                     <div className="text-[10px] text-slate-400 mt-0.5">{c.tax_info || 'Vergi No Yok'}</div>
                   </td>
                 </tr>
               );
             }) : <tr><td colSpan={4} className="p-10 text-center text-slate-400">Müşteri kaydı yok.</td></tr>}
           </tbody>
         </table>
      </div>
    </div>
  );
}