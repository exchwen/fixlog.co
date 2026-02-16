'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2 } from 'lucide-react';

export default function StockTab({ data, setShowStockModal }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Satır içi düzenleme state'i
  const [editingStock, setEditingStock] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredStock = (data?.stock || []).filter((item: any) => 
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const companySlug = localStorage.getItem('companySlug');
      await fetch('https://biz-backend.yazilimciburak.workers.dev/update-stock', {
        method: 'POST', body: JSON.stringify({ slug: companySlug, ...editingStock })
      });
      window.location.reload();
    } catch (e) { alert("Hata oluştu"); setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Bu stok kaydını silmek istediğinize emin misiniz?')) {
      const companySlug = localStorage.getItem('companySlug');
      await fetch('https://biz-backend.yazilimciburak.workers.dev/delete-stock', {
        method: 'POST', body: JSON.stringify({ slug: companySlug, id })
      });
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4 relative">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
         <h3 className="text-lg font-bold text-slate-900">Envanter & Parça Girişi</h3>
         
         <div className="flex items-center gap-2 w-full sm:w-auto">
           <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
             <input 
               type="text" 
               placeholder="Parça Adı Ara..." 
               className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
           <button onClick={() => setShowStockModal(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-slate-800 whitespace-nowrap">
             <Plus size={14} /> Yeni Ekle
           </button>
         </div>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-left text-xs">
           <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Parça Adı</th>
                <th className="px-5 py-3">Miktar / Birim</th>
                <th className="px-5 py-3">Birim Fiyatı</th>
                <th className="px-5 py-3">Tedarikçi</th>
                <th className="px-5 py-3 text-right">İşlemler</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {filteredStock.length > 0 ? filteredStock.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-800">{item.item_name}</td>
                  <td className="px-5 py-3 text-slate-600">
                     <span className="font-bold text-blue-600">{item.quantity}</span> {item.unit_name}
                  </td>
                  <td className="px-5 py-3 text-emerald-600 font-semibold">₺{item.unit_price || '0'}</td>
                  <td className="px-5 py-3 text-slate-500">
                     <div>{item.supplier_name || 'Genel Tedarikçi'}</div>
                     <div className="text-[10px]">{item.supplier_phone || '-'}</div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => setEditingStock({ id: item.id, itemName: item.item_name, quantity: item.quantity, unitName: item.unit_name, unitPrice: item.unit_price, supplierName: item.supplier_name, supplierPhone: item.supplier_phone })} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"><Edit2 size={14} /></button>
                       <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={5} className="p-10 text-center text-slate-400">Aradığınız kriterde stok bulunamadı.</td></tr>}
           </tbody>
         </table>
       </div>

       {/* SATIR İÇİ DÜZENLEME MODALI */}
       {editingStock && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Stok Güncelle</h2><button onClick={() => setEditingStock(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-[10px] font-bold text-slate-500 block mb-1">PARÇA ADI</label><input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" value={editingStock.itemName} onChange={e => setEditingStock({...editingStock, itemName: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">MİKTAR</label><input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" value={editingStock.quantity} onChange={e => setEditingStock({...editingStock, quantity: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">BİRİM</label><select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400" value={editingStock.unitName} onChange={e => setEditingStock({...editingStock, unitName: e.target.value})}><option value="Adet">Adet</option><option value="Metre">Metre</option><option value="Paket">Paket</option></select></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">BİRİM FİYAT (₺)</label><input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" value={editingStock.unitPrice} onChange={e => setEditingStock({...editingStock, unitPrice: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">TEDARİKÇİ FİRMA</label><input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" value={editingStock.supplierName} onChange={e => setEditingStock({...editingStock, supplierName: e.target.value})} /></div>
                <div className="col-span-2"><label className="text-[10px] font-bold text-slate-500 block mb-1">TEDARİKÇİ TELEFON</label><input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" value={editingStock.supplierPhone} onChange={e => setEditingStock({...editingStock, supplierPhone: e.target.value})} /></div>
              </div>
              <button disabled={isSaving} className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold text-sm mt-5 hover:bg-blue-700 flex justify-center items-center" onClick={handleUpdate}>
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Değişiklikleri Kaydet'}
              </button>
            </div>
         </div>
       )}
    </div>
  );
}