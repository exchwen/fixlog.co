'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ShoppingCart, Truck, Hash, Package, Plus, Trash2, ListOrdered } from 'lucide-react';

export default function OrderModals({
  showOrderModal, setShowOrderModal,
  showBulkOrderModal, setShowBulkOrderModal,
  newOrder, setNewOrder,
  bulkOrderList, setBulkOrderList,
  isSaving, handleAction,
  data
}: any) {

  // Tekli Sipariş Doğrulama
  const isOrderValid = newOrder?.supplier_id !== '' && newOrder?.item_name?.trim() !== '' && newOrder?.quantity > 0;
  
  // Toplu Sipariş Doğrulama
  const isBulkOrderValid = bulkOrderList?.length > 0 && bulkOrderList.every((item: any) => item.supplier_id !== '' && item.item_name.trim() !== '' && item.quantity > 0);

  const addBulkOrderItem = () => {
      setBulkOrderList([...(bulkOrderList || []), { supplier_id: '', item_name: '', quantity: '', unit: 'Adet' }]);
  };

  const removeBulkOrderItem = (index: number) => {
      const newList = [...bulkOrderList];
      newList.splice(index, 1);
      setBulkOrderList(newList);
  };

  const updateBulkOrderItem = (index: number, field: string, value: any) => {
      const newList = [...bulkOrderList];
      newList[index][field] = value;
      setBulkOrderList(newList);
  };

  return (
    <>
      {/* 1. TEKLİ SİPARİŞ MODALI */}
      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowOrderModal(false)}></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                 <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <ShoppingCart size={22} className="text-blue-600" /> Sipariş Ver
                    </h2>
                    <div className="text-xs font-medium text-slate-500 mt-1">Tedarikçiden yeni bir malzeme sipariş edin.</div>
                 </div>
                 <button onClick={() => setShowOrderModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Truck size={14} /> Tedarikçi Seçin <span className="text-rose-500">*</span></label>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={newOrder?.supplier_id || ''} onChange={e => setNewOrder({...newOrder, supplier_id: e.target.value})}>
                        <option value="" disabled>Lütfen seçiniz...</option>
                        {(data?.suppliers || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Package size={14} /> İstenecek Malzeme / Parça <span className="text-rose-500">*</span></label>
                    <input type="text" placeholder="Örn: 12V Adaptör" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={newOrder?.item_name || ''} onChange={e => setNewOrder({...newOrder, item_name: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Hash size={14} /> Miktar <span className="text-rose-500">*</span></label>
                          <input type="number" min="1" placeholder="0" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={newOrder?.quantity || ''} onChange={e => setNewOrder({...newOrder, quantity: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">Birim</label>
                          <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={newOrder?.unit || 'Adet'} onChange={e => setNewOrder({...newOrder, unit: e.target.value})}>
                              <option value="Adet">Adet</option>
                              <option value="Metre">Metre</option>
                              <option value="Kutu">Kutu</option>
                          </select>
                      </div>
                  </div>
              </div>

              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                 <button disabled={isSaving || !isOrderValid} onClick={() => handleAction('place-order', newOrder, setShowOrderModal, () => setNewOrder({ supplier_id: '', item_name: '', quantity: '', unit: 'Adet' }))} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Siparişi Oluştur'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. TOPLU SİPARİŞ MODALI */}
      <AnimatePresence>
        {showBulkOrderModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowBulkOrderModal(false)}></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              className="bg-white w-full max-w-2xl rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                 <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <ListOrdered size={22} className="text-purple-600" /> Toplu Sipariş Ver
                    </h2>
                    <div className="text-xs font-medium text-slate-500 mt-1">Birden fazla malzemeyi aynı anda sipariş edin.</div>
                 </div>
                 <button onClick={() => setShowBulkOrderModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                  {bulkOrderList?.length > 0 ? (
                      <div className="space-y-3">
                          {bulkOrderList.map((item: any, index: number) => (
                              <div key={index} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                                  <button onClick={() => removeBulkOrderItem(index)} className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 p-1.5 rounded-full hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"><X size={14}/></button>
                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                      <div className="sm:col-span-4">
                                          <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none bg-slate-50 focus:bg-white focus:border-purple-500" value={item.supplier_id} onChange={e => updateBulkOrderItem(index, 'supplier_id', e.target.value)}>
                                              <option value="" disabled>Tedarikçi Seç...</option>
                                              {(data?.suppliers || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                          </select>
                                      </div>
                                      <div className="sm:col-span-4">
                                          <input type="text" placeholder="Malzeme Adı" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none bg-slate-50 focus:bg-white focus:border-purple-500" value={item.item_name} onChange={e => updateBulkOrderItem(index, 'item_name', e.target.value)} />
                                      </div>
                                      <div className="sm:col-span-2">
                                          <input type="number" min="1" placeholder="Miktar" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none bg-slate-50 focus:bg-white focus:border-purple-500" value={item.quantity} onChange={e => updateBulkOrderItem(index, 'quantity', e.target.value)} />
                                      </div>
                                      <div className="sm:col-span-2">
                                          <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none bg-slate-50 focus:bg-white focus:border-purple-500" value={item.unit} onChange={e => updateBulkOrderItem(index, 'unit', e.target.value)}>
                                              <option value="Adet">Adet</option>
                                              <option value="Metre">Metre</option>
                                              <option value="Kutu">Kutu</option>
                                          </select>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-8">
                          <Package size={32} className="mx-auto text-slate-300 mb-3" />
                          <div className="text-sm font-bold text-slate-600">Henüz listeye ürün eklemediniz.</div>
                      </div>
                  )}

                  <button onClick={addBulkOrderItem} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold text-sm hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2">
                      <Plus size={18} /> Yeni Satır Ekle
                  </button>
              </div>

              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                 <button disabled={isSaving || !isBulkOrderValid} onClick={() => handleAction('place-bulk-order', bulkOrderList, setShowBulkOrderModal, () => setBulkOrderList([{ supplier_id: '', item_name: '', quantity: '', unit: 'Adet' }]))} className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-purple-700 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : `Toplu Siparişi Gönder (${bulkOrderList?.length || 0} Kalem)`}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}