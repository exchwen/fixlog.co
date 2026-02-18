'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, AlertTriangle, Package, Phone, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StockTab({ data, setShowStockModal, setShowSupplierModal }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Satır içi düzenleme state'i
  const [editingStock, setEditingStock] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const rawStock = data?.stock || [];
  const suppliers = data?.suppliers || [];

  // Mevcut benzersiz kategorileri bul (datalist için)
  const existingCategories = Array.from(new Set(rawStock.map((s: any) => s.category).filter(Boolean)));

  // Kritik Stokları (Miktarı 5 ve altı olanları) bul
  const criticalStocks = rawStock.filter((item: any) => Number(item.quantity) <= 5);

  const filteredStock = rawStock.filter((item: any) => {
    const supplier = suppliers.find((s:any) => s.id === item.supplier_id);
    const supplierName = supplier ? supplier.name : (item.supplier_name || '');
    return (
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const companySlug = localStorage.getItem('companySlug');
      await fetch('https://backend.isdokumu.workers.dev/update-stock', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: companySlug, ...editingStock })
      });
      window.location.reload();
    } catch (e) { 
      alert("Hata oluştu"); 
    } finally {
      setIsSaving(false); 
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Bu stok kaydını silmek istediğinize emin misiniz?')) {
      try {
        const companySlug = localStorage.getItem('companySlug');
        await fetch('https://backend.isdokumu.workers.dev/delete-stock', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: companySlug, id })
        });
        window.location.reload();
      } catch (e) {
        alert("Silme işlemi başarısız.");
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      
       {/* 1. KRİTİK STOK UYARI KUTUSU */}
       <AnimatePresence>
         {criticalStocks.length > 0 && (
           <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm relative overflow-hidden"
           >
              <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
                <AlertTriangle size={120} className="text-amber-500 translate-x-4 -translate-y-4" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shadow-sm border border-amber-200">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900 tracking-tight">Kritik Stok Uyarısı</h3>
                    <p className="text-[11px] font-medium text-amber-700">Tükenmek üzere olan <span className="font-bold underline">{criticalStocks.length} parça</span> tespit edildi. Acil sipariş geçmeniz önerilir.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                  {criticalStocks.map((item: any) => {
                    const supplier = suppliers.find((s:any) => s.id === item.supplier_id);
                    const supName = supplier ? supplier.name : (item.supplier_name || 'Tedarikçi Yok');
                    const supPhone = supplier ? supplier.phone : item.supplier_phone;

                    return (
                      <div key={item.id} className="bg-white/90 backdrop-blur-sm border border-amber-200/60 rounded-lg p-3 flex flex-col justify-between shadow-sm relative group hover:border-amber-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-2 overflow-hidden pr-2">
                            <Package size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                              {item.item_name}
                            </div>
                          </div>
                          <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-black shrink-0 border border-amber-200/50">
                            {item.quantity} <span className="text-[9px] font-bold uppercase">{item.unit_name}</span>
                          </div>
                        </div>

                        <div className="mt-auto pt-2 border-t border-amber-100/50">
                          <div className="text-[10px] text-slate-500 font-bold uppercase truncate mb-1">
                            {supName}
                          </div>
                          {supPhone ? (
                            <a href={`tel:${supPhone}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100 transition-colors w-max">
                              <Phone size={10} /> {supPhone}
                            </a>
                          ) : (
                            <div className="text-[10px] text-slate-400 font-medium italic">Telefon eklenmemiş</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* 2. ANA LİSTE BAŞLIĞI VE ARAMA KUTUSU */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
         <h3 className="text-lg font-bold text-slate-900">Tüm Envanter & Parçalar</h3>
         
         <div className="flex items-center gap-2 w-full sm:w-auto">
           <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
             <input 
               type="text" 
               placeholder="Parça, Kategori veya Tedarikçi Ara..." 
               className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
           <button onClick={() => setShowSupplierModal(true)} className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-200 whitespace-nowrap transition-colors border border-slate-200">
             <Plus size={14} /> Tedarikçi Ekle
           </button>
           <button onClick={() => setShowStockModal(true)} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 whitespace-nowrap transition-colors border border-blue-700">
             <Plus size={14} /> Yeni Parça
           </button>
         </div>
       </div>

       {/* 3. STOK TABLOSU */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto custom-scrollbar">
           <table className="w-full text-left text-xs min-w-[700px]">
             <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-4">Parça Adı</th>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Miktar / Birim</th>
                  <th className="px-5 py-4">Birim Fiyatı</th>
                  <th className="px-5 py-4">Tedarikçi Firma</th>
                  <th className="px-5 py-4 text-right">İşlemler</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {filteredStock.length > 0 ? filteredStock.map((item: any) => {
                  const isCritical = Number(item.quantity) <= 5;
                  const supplier = suppliers.find((s:any) => s.id === item.supplier_id);
                  const supName = supplier ? supplier.name : (item.supplier_name || 'Tedarikçi Yok');
                  const supPhone = supplier ? supplier.phone : item.supplier_phone;
                  
                  return (
                    <tr key={item.id} className={`transition-colors ${isCritical ? 'bg-amber-50/20 hover:bg-amber-50/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {isCritical && <AlertTriangle size={12} className="text-amber-500" />}
                          {item.item_name}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {item.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold border border-slate-200">
                            <Tag size={10} /> {item.category}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Kategorisiz</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                         <span className={`font-black text-sm ${isCritical ? 'text-amber-600' : 'text-blue-600'}`}>
                           {item.quantity}
                         </span> 
                         <span className="text-slate-500 ml-1 font-semibold text-[10px] uppercase">
                           {item.unit_name}
                         </span>
                      </td>
                      <td className="px-5 py-3 text-emerald-600 font-bold">₺{item.unit_price || '0'}</td>
                      <td className="px-5 py-3">
                         <div className="font-bold text-slate-700">{supName}</div>
                         <div className="text-[10px] text-slate-400 font-medium mt-0.5">{supPhone || 'Telefon Kaydı Yok'}</div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                              onClick={() => setEditingStock({ id: item.id, itemName: item.item_name, quantity: item.quantity, unitName: item.unit_name, unitPrice: item.unit_price, category: item.category || '', supplierId: item.supplier_id || '' })} 
                              className="p-1.5 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-md transition-all shadow-sm"
                              title="Düzenle"
                           >
                             <Edit2 size={14} />
                           </button>
                           <button 
                              onClick={() => handleDelete(item.id)} 
                              className="p-1.5 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-md transition-all shadow-sm"
                              title="Sil"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium bg-slate-50/50">Aradığınız kriterde stok bulunamadı.</td></tr>}
             </tbody>
           </table>
         </div>
       </div>

       {/* 4. SATIR İÇİ DÜZENLEME MODALI */}
       <AnimatePresence>
         {editingStock && (
           <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 leading-none">Stok Kaydını Güncelle</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">Sistemdeki mevcut parça verisini değiştiriyorsunuz.</p>
                  </div>
                  <button onClick={() => setEditingStock(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-md transition-colors"><X size={18} /></button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-blue-600 tracking-wider block mb-1">PARÇA ADI</label>
                    <input className="w-full px-3 py-2 border border-slate-200 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-slate-50/50" value={editingStock.itemName} onChange={e => setEditingStock({...editingStock, itemName: e.target.value})} />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-500 tracking-wider block mb-1">KATEGORİ (Opsiyonel)</label>
                    <input list="edit-categories" className="w-full px-3 py-2 border border-slate-200 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-slate-50/50" placeholder="Örn: Rulman, Sarf Malzeme..." value={editingStock.category} onChange={e => setEditingStock({...editingStock, category: e.target.value})} />
                    <datalist id="edit-categories">
                       {existingCategories.map((c:any) => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-500 tracking-wider block mb-1">MİKTAR</label>
                    <input type="number" className="w-full px-3 py-2 border border-slate-200 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-slate-50/50" value={editingStock.quantity} onChange={e => setEditingStock({...editingStock, quantity: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-500 tracking-wider block mb-1">BİRİM</label>
                    <select className="w-full px-3 py-2 border border-slate-200 shadow-sm rounded-md text-xs outline-none bg-slate-50/50 focus:border-blue-400" value={editingStock.unitName} onChange={e => setEditingStock({...editingStock, unitName: e.target.value})}>
                      <option value="Adet">Adet</option>
                      <option value="Metre">Metre</option>
                      <option value="Paket">Paket</option>
                      <option value="Kutu">Kutu</option>
                      <option value="Litre">Litre</option>
                      <option value="Kg">Kg</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-emerald-600 tracking-wider block mb-1">BİRİM FİYAT (₺)</label>
                    <input type="number" className="w-full px-3 py-2 border border-slate-200 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-slate-50/50" value={editingStock.unitPrice} onChange={e => setEditingStock({...editingStock, unitPrice: e.target.value})} />
                  </div>
                  
                  <div className="col-span-2 mt-2 pt-4 border-t border-slate-100">
                     <label className="text-[10px] font-black text-slate-400 tracking-wider block mb-3">TEDARİKÇİ BİLGİSİ</label>
                  </div>

                  <div className="col-span-2">
                    <select className="w-full px-3 py-2 border border-slate-200 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-slate-50/50" value={editingStock.supplierId} onChange={e => setEditingStock({...editingStock, supplierId: e.target.value})}>
                      <option value="">-- Bağımsız / Tedarikçi Seçilmedi --</option>
                      {suppliers.map((s:any) => (
                        <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                  <button disabled={isSaving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold text-xs hover:bg-blue-700 flex justify-center items-center shadow-md shadow-blue-200 transition-colors" onClick={handleUpdate}>
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Değişiklikleri Kaydet'}
                  </button>
                  <button onClick={() => setEditingStock(null)} className="px-4 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors">
                    İptal
                  </button>
                </div>
              </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
}