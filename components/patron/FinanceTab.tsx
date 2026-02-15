'use client';

import React from 'react';

export default function FinanceTab({ data }: any) {
  return (
    <div className="space-y-4">
       <h3 className="text-lg font-bold text-slate-900">Hesap Hareketleri</h3>
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-left text-xs">
           <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
             <tr><th className="px-5 py-3">Açıklama</th><th className="px-5 py-3">Miktar</th><th className="px-5 py-3 text-right">Tip</th></tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {data?.finances?.length > 0 ? data.finances.map((f: any) => (
               <tr key={f.id} className="hover:bg-slate-50">
                 <td className="px-5 py-3 text-slate-800">{f.description}</td>
                 <td className={`px-5 py-3 font-semibold ${f.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>₺{f.amount.toLocaleString('tr-TR')}</td>
                 <td className="px-5 py-3 text-right"><span className={`px-2 py-1 rounded text-[10px] font-medium border ${f.type === 'Gelir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{f.type}</span></td>
               </tr>
             )) : <tr><td colSpan={3} className="p-10 text-center text-slate-400">Finansal kayıt yok.</td></tr>}
           </tbody>
         </table>
       </div>
    </div>
  );
}