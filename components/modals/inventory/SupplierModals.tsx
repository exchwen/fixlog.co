'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Truck, Phone, MapPin, Plus, Search, Edit2 } from 'lucide-react';

export default function SupplierModals({
  showSupplierModal, setShowSupplierModal,
  showAddSupplier, setShowAddSupplier,
  newSupplier, setNewSupplier,
  isSaving, handleAction,
  data
}: any) {

  const [searchSupplier, setSearchSupplier] = useState('');

  // Form doğrulama: Sadece tedarikçi/firma adı zorunlu
  const isFormValid = newSupplier?.name?.trim() !== '';

  // 🚀 DÜZELTME: Arama filtresinde contact yerine phone kullanıldı
  const filteredSuppliers = (data?.suppliers || []).filter((s:any) => 
     s.name?.toLowerCase().includes(searchSupplier.toLowerCase()) ||
     s.phone?.includes(searchSupplier)
  );

  return (
    <>
      {/* 1. TEDARİKÇİ LİSTESİ MODALI */}
      <AnimatePresence>
        {showSupplierModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowSupplierModal(false)}></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                 <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Truck size={22} className="text-blue-600" /> Tedarikçi Firmalar
                    </h2>
                    <div className="text-xs font-medium text-slate-500 mt-1">Stok aldığınız toptancı ve firmaları yönetin.</div>
                 </div>
                 <button 
                    onClick={() => setShowSupplierModal(false)} 
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
                 >
                    <X size={20} />
                 </button>
              </div>

              {/* BODY */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-white">
                  
                  {/* Arama Alanı */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tedarikçi adı veya telefon ara..." 
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" 
                        value={searchSupplier} 
                        onChange={e => setSearchSupplier(e.target.value)} 
                    />
                  </div>

                  {/* Tedarikçi Listesi */}
                  <div className="space-y-3">
                      {filteredSuppliers.length > 0 ? (
                          filteredSuppliers.map((supplier: any) => (
                              <div key={supplier.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <div className="font-bold text-slate-800 text-base mb-2 group-hover:text-blue-700 transition-colors">{supplier.name}</div>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs font-medium text-slate-500">
                                        {/* 🚀 DÜZELTME: contact yerine phone kullanıldı */}
                                        <div className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {supplier.phone || 'Telefon Yok'}</div>
                                    </div>
                                  </div>
                                  
                                  {/* 🚀 YENİ EKLENEN: Düzenle Butonu */}
                                  <div className="shrink-0 flex justify-end">
                                      <button 
                                         onClick={() => {
                                             // Modalı açarken mevcut veriyi state'e dolduruyoruz ki form dolu gelsin
                                             setNewSupplier({ id: supplier.id, name: supplier.name, phone: supplier.phone || '', address: supplier.address || '' });
                                             setShowSupplierModal(false);
                                             setShowAddSupplier(true);
                                         }}
                                         className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all active:scale-95"
                                      >
                                         <Edit2 size={12} /> Düzenle
                                      </button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center px-4 bg-slate-50 rounded-xl border border-slate-100">
                              <Truck size={32} className="text-slate-300 mb-3" />
                              <h3 className="text-sm font-bold text-slate-700">Tedarikçi Bulunamadı</h3>
                              <p className="text-xs font-medium text-slate-500 mt-1">Sistemde kayıtlı tedarikçi yok veya aramanızla eşleşmedi.</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* FOOTER */}
              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                 <button 
                    onClick={() => { 
                        // Yeni ekleme moduna girerken formun içini temizle
                        setNewSupplier({ name: '', phone: '', address: '' });
                        setShowSupplierModal(false); 
                        setShowAddSupplier(true); 
                    }} 
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 flex justify-center items-center gap-2"
                 >
                    <Plus size={18} strokeWidth={3} /> Yeni Tedarikçi Ekle
                 </button>
              </div>
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* 2. YENİ TEDARİKÇİ EKLEME / DÜZENLEME MODALI */}
      <AnimatePresence>
        {showAddSupplier && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowAddSupplier(false)}></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                 <div>
                    {/* 🚀 DÜZELTME: Düzenleme modundaysa başlık değişir */}
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">
                        {newSupplier?.id ? 'Tedarikçiyi Düzenle' : 'Yeni Tedarikçi Ekle'}
                    </h2>
                    <div className="text-xs font-medium text-slate-500 mt-1">
                        {newSupplier?.id ? 'Firma bilgilerini güncelleyin.' : 'Sisteme yeni bir toptancı kaydedin.'}
                    </div>
                 </div>
                 <button 
                    onClick={() => setShowAddSupplier(false)} 
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                        <Truck size={14} /> Tedarikçi / Firma Adı <span className="text-rose-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        placeholder="Örn: ABC Elektronik Toptan" 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                        value={newSupplier?.name || ''} 
                        onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                        <Phone size={14} /> İletişim Numarası
                    </label>
                    <input 
                        type="tel" 
                        placeholder="05XX XXX XX XX veya Sabit Hat" 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                        value={newSupplier?.phone || ''} // 🚀 DÜZELTME: contact yerine phone kullanıldı
                        onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} // 🚀 DÜZELTME: phone güncelleniyor
                    />
                  </div>

                  {/* Not: Backend'de address alanı olmasa da formda durabilir, zararı yok */}
                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                        <MapPin size={14} /> Adres / Konum Notları
                    </label>
                    <textarea 
                        rows={3}
                        placeholder="Firmanın açık adresi..." 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none resize-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                        value={newSupplier?.address || ''} 
                        onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} 
                    />
                  </div>
              </div>

              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                 <button 
                    disabled={isSaving || !isFormValid} 
                    onClick={() => {
                        // 🚀 DÜZELTME: ID varsa update-supplier çalışır, yoksa add-supplier
                        const actionType = newSupplier?.id ? 'update-supplier' : 'add-supplier';
                        handleAction(actionType, newSupplier, setShowAddSupplier, () => setNewSupplier({ name: '', phone: '', address: '' }))
                    }} 
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50 disabled:hover:bg-slate-900"
                 >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : (newSupplier?.id ? 'Değişiklikleri Kaydet' : 'Tedarikçiyi Kaydet')}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}