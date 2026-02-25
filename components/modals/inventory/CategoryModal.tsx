'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Tag, Plus, List } from 'lucide-react';

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
                
                {/* Yeni Ekleme Alanı */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl shadow-sm">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Plus size={14} /> Yeni Kategori Ekle
                  </label>
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
                          onClick={() => handleAction('add-category', newCategory, null, () => setNewCategory({ name: '' }))} 
                          className="px-4 bg-amber-500 text-white rounded-xl font-bold shadow-md hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-amber-500 flex items-center justify-center shrink-0"
                      >
                          {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Ekle'}
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
                                <div key={cat.id} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm flex items-center gap-2 hover:border-amber-300 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                                    {cat.name}
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