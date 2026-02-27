'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Tag, Plus, List, Edit2 } from 'lucide-react';

export default function CategoryModal({
  showCategoryModal, setShowCategoryModal,
  newCategory, setNewCategory,
  isSaving, handleAction,
  data
}: any) {

  // Form doğrulama: Sadece kategori adı zorunlu
  const isFormValid = newCategory?.name?.trim() !== '';

  return (
    <AnimatePresence>
      {showCategoryModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* Arka plan tıklaması ile kapatma */}
          <div className="absolute inset-0" onClick={() => setShowCategoryModal(false)}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            className="bg-white w-full max-w-sm rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
               <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                      <Tag size={20} className="text-amber-500" /> Kategori Yönetimi
                  </h2>
                  <div className="text-xs font-medium text-slate-500 mt-1">Stoklarınız için sınıflandırmalar oluşturun.</div>
               </div>
               <button 
                  onClick={() => setShowCategoryModal(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
               >
                  <X size={20} />
               </button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                
                {/* 🚀 Yeni Ekleme / Düzenleme Alanı */}
                <div className={`p-4 border rounded-xl shadow-sm transition-colors ${newCategory?.id ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          {newCategory?.id ? <Edit2 size={14} className="text-blue-500" /> : <Plus size={14} />} 
                          {newCategory?.id ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
                      </label>
                      {newCategory?.id && (
                          <button 
                             onClick={() => setNewCategory({ name: '' })}
                             className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors"
                          >
                             İptal Et
                          </button>
                      )}
                  </div>
                  <div className="flex gap-2">
                      <input 
                          type="text" 
                          placeholder="Örn: Kablolar, Motorlar..." 
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                          value={newCategory?.name || ''} 
                          onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                      />
                      <button 
                          disabled={isSaving || !isFormValid} 
                          onClick={() => {
                              // 🚀 Düzenleme veya Ekleme işlemine karar veren yönlendirici
                              const actionType = newCategory?.id ? 'update-category' : 'add-category';
                              handleAction(actionType, newCategory, null, () => setNewCategory({ name: '' }));
                          }} 
                          className={`px-4 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 ${newCategory?.id ? 'bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600' : 'bg-amber-500 hover:bg-amber-600 disabled:hover:bg-amber-500'}`}
                      >
                          {isSaving ? <Loader2 className="animate-spin" size={18} /> : (newCategory?.id ? 'Kaydet' : 'Ekle')}
                      </button>
                  </div>
                </div>

                {/* Mevcut Kategoriler */}
                <div>
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 px-1">
                        <List size={14} /> Mevcut Kategoriler ({data?.categories?.length || 0})
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {(data?.categories || []).length > 0 ? (
                            (data?.categories || []).map((cat: any) => (
                                <div key={cat.id} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm flex items-center justify-between group hover:border-amber-300 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                                        {cat.name}
                                    </div>
                                    
                                    {/* 🚀 Düzenle Butonu (Sadece üzerine gelindiğinde veya mobilde görünür) */}
                                    <button 
                                        onClick={() => setNewCategory({ id: cat.id, name: cat.name })}
                                        className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        <Edit2 size={12} /> Düzenle
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-sm font-medium text-slate-500 italic">
                                Henüz hiç kategori eklenmemiş.
                            </div>
                        )}
                    </div>
                </div>

            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}