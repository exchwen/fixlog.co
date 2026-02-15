'use client';

import React from 'react';
import { Plus } from 'lucide-react';

export default function CustomersTab({ data, setShowCustomerModal }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Müşteri Rehberi</h3>
        <button onClick={() => setShowCustomerModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700">
          <Plus size={14} /> Müşteri Ekle
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-left text-xs">
           <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
             <tr><th className="px-5 py-3">İsim / Kurum</th><th className="px-5 py-3">İletişim</th><th className="px-5 py-3">Adres</th><th className="px-5 py-3 text-right">Vergi/TC</th></tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {data?.customers?.length > 0 ? data.customers.map((c: any) => (
               <tr key={c.id} className="hover:bg-slate-50">
                 <td className="px-5 py-3 font-semibold text-slate-800">{c.name}</td>
                 <td className="px-5 py-3 text-slate-600">{c.contact}</td>
                 <td className="px-5 py-3 text-slate-500 truncate max-w-xs">{c.address}</td>
                 <td className="px-5 py-3 text-right text-slate-400">{c.tax_info || '-'}</td>
               </tr>
             )) : <tr><td colSpan="4" className="p-10 text-center text-slate-400">Müşteri kaydı yok.</td></tr>}
           </tbody>
         </table>
      </div>
    </div>
  );
}