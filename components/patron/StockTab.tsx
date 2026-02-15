'use client';

import React from 'react';
import { Plus } from 'lucide-react';

export default function StockTab({ data, setShowStockModal }: any) {
  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center">
         <h3 className="text-lg font-bold text-slate-900">Envanter & Parça Girişi</h3>
         <button onClick={() => setShowStockModal(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-slate-800">
           <Plus size={14} /> Parça Ekle
         </button>
       </div>
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-left text-xs">
           <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr><th className="px-5 py-3">Parça Adı</th><th className="px-5 py-3">Miktar / Birim</th><th className="px-5 py-3">Tedarikçi</th><th className="px-5 py-3 text-right">Durum</th></tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {data?.stock?.length > 0 ? data.stock.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-800">{item.item_name}</td>
                  <td className="px-5 py-3 text-slate-600">{item.quantity} {item.unit_name} / ₺{item.unit_price || '0'}</td>
                  <td className="px-5 py-3 text-slate-500"><div>{item.supplier_name || 'Genel'}</div><div className="text-[10px]">{item.supplier_phone || '-'}</div></td>
                  <td className="px-5 py-3 text-right"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-medium">Stokta</span></td>
                </tr>
              )) : <tr><td colSpan={4} className="p-10 text-center text-slate-400">Stok kaydı yok.</td></tr>}
           </tbody>
         </table>
       </div>
    </div>
  );
}