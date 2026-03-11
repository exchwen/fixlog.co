// StockEntryModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Archive, Hash, Tag, Package, ArrowRight } from 'lucide-react';

export default function StockEntryModal({
  showStockEntryModal, setShowStockEntryModal,
  isSaving, handleAction,
  data
}: any) {
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [addedQuantity, setAddedQuantity] = useState('');

  // Sadece seçili kategoriye ait ürünleri filtrele
  const filteredItems = (data?.stock || []).filter((item: any) => 
    selectedCategory === 'Kategorisiz' ? !item.category : item.category === selectedCategory
  );

  const selectedItemData = (data?.stock || []).find((s: any) => s.id === selectedItemId);

  // Modal kapandığında state'leri temizle
  useEffect(() => {
    if (!showStockEntryModal) {
      setSelectedCategory('');
      setSelectedItemId('');
      setAddedQuantity('');
    }
  }, [showStockEntryModal]);

  // Form doğrulama
  const isFormValid = selectedItemId !== '' && addedQuantity !== '' && Number(addedQuantity) > 0;

  const handleSave = async () => {
    if (!selectedItemData) return;

    // Mevcut miktar ile yeni girilen miktarı topluyoruz.
    const newTotalQuantity = Number(selectedItemData.quantity) + Number(addedQuantity);

    // Mevcut update-stock yapını kullanarak güncelleme gönderiyoruz.
    const payload = {
        id: selectedItemData.id,
        itemName: selectedItemData.item_name,
        quantity: newTotalQuantity.toString(), // String olarak kaydediyoruz
        unitName: selectedItemData.unit_name,
        unitPrice: selectedItemData.unit_price,
        category: selectedItemData.category || '',
        supplierId: selectedItemData.supplier_id || null,
        minAlert: selectedItemData.min_alert || 5
    };

    await handleAction('update-stock', payload, () => setShowStockEntryModal(false), null);
  };

  return (
    <AnimatePresence>
      {showStockEntryModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowStockEntryModal(false)}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
               <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                      <Archive size={22} className="text-emerald-600" /> Stok Girişi Yap
                  </h2>
                  <div className="text-xs font-medium text-slate-500 mt-1">Sistemde var olan bir ürünün stok miktarını artırın.</div>
               </div>
               <button 
                  onClick={() => setShowStockEntryModal(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
               >
                  <X size={20} />
               </button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                
                {/* 1. Kategori Seçimi */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Tag size={14} /> Kategori Seçin
                  </label>
                  <select 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all appearance-none" 
                      value={selectedCategory} 
                      onChange={e => {
                          setSelectedCategory(e.target.value);
                          setSelectedItemId(''); // Kategori değişince ürünü sıfırla
                      }}
                  >
                      <option value="" disabled>Lütfen kategori seçiniz...</option>
                      {(data?.categories || []).map((cat: any) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      <option value="Kategorisiz">Kategorisiz Ürünler</option>
                  </select>
                </div>

                {/* 2. Ürün Seçimi (Kategoriye Göre Filtrelenmiş) */}
                <div className={`${!selectedCategory ? 'opacity-50 pointer-events-none' : ''} transition-opacity`}>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Package size={14} /> Ürün / Parça Seçin
                  </label>
                  <select 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all appearance-none" 
                      value={selectedItemId} 
                      onChange={e => setSelectedItemId(e.target.value)}
                  >
                      <option value="" disabled>Lütfen ürün seçiniz...</option>
                      {filteredItems.map((item: any) => (
                          <option key={item.id} value={item.id}>{item.item_name}</option>
                      ))}
                  </select>
                </div>

                {/* 3. Eklenecek Miktar */}
                <div className={`${!selectedItemId ? 'opacity-50 pointer-events-none' : ''} transition-opacity`}>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Hash size={14} /> Yeni Alınan Miktar <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                      <input 
                          type="number" 
                          min="1"
                          placeholder="Örn: 10" 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-lg font-black outline-none focus:border-emerald-500 bg-emerald-50/30 focus:bg-white transition-all text-emerald-700" 
                          value={addedQuantity} 
                          onChange={e => setAddedQuantity(e.target.value)} 
                      />
                      {selectedItemData && (
                          <div className="shrink-0 bg-slate-100 text-slate-600 font-bold px-4 py-3 rounded-xl border border-slate-200 uppercase text-xs">
                              {selectedItemData.unit_name}
                          </div>
                      )}
                  </div>
                </div>

                {/* Önizleme Alanı */}
                {selectedItemData && addedQuantity && Number(addedQuantity) > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between mt-2">
                        <div className="text-center flex-1">
                            <div className="text-[10px] font-bold text-emerald-600 mb-1">MEVCUT STOK</div>
                            <div className="text-lg font-black text-slate-700">{selectedItemData.quantity}</div>
                        </div>
                        <div className="text-emerald-400 shrink-0">
                            <ArrowRight size={20} />
                        </div>
                        <div className="text-center flex-1">
                            <div className="text-[10px] font-bold text-emerald-600 mb-1">YENİ STOK</div>
                            <div className="text-lg font-black text-emerald-600">{Number(selectedItemData.quantity) + Number(addedQuantity)}</div>
                        </div>
                    </div>
                )}

            </div>

            {/* FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={handleSave} 
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Stok Ekle ve Kaydet'}
               </button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}