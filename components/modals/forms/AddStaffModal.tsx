'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Phone, ShieldCheck, Briefcase, KeyRound, MapPin } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';

export default function AddStaffModal({
  showAddStaff, setShowAddStaff,
  newStaff, setNewStaff,
  isSaving, handleAction, data, userRole // 🚀 userRole eklendi
}: any) {

  const currentSector = data?.sector || '';
  const safeSectors: any = sectorsData;
  const branchList = currentSector && safeSectors?.sectors?.[currentSector]?.subTypes 
    ? Object.keys(safeSectors.sectors[currentSector].subTypes) 
    : [];

  // Modal açıldığında varsayılan rolü 'Usta' yapalım ki hata çıkmasın
  useEffect(() => {
    if (showAddStaff && !newStaff?.role) {
        setNewStaff((prev: any) => ({ ...prev, role: 'Usta' }));
    }
}, [showAddStaff, newStaff?.role, setNewStaff]);

  const isFormValid = newStaff?.name?.trim() !== '' && newStaff?.role?.trim() !== '';

  return (
    <AnimatePresence>
      {showAddStaff && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
        >
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowAddStaff(false)}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            transition={{ duration: 0.15 }}
            className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
               <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Yeni Personel Ekle</h2>
                  <div className="text-xs font-medium text-slate-500 mt-1">Ekibe yeni bir üye dahil edin.</div>
               </div>
               <button 
                  onClick={() => setShowAddStaff(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
               >
                  <X size={20} />
               </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <User size={14} /> Ad Soyad
                  </label>
                  <input 
                      type="text" 
                      placeholder="Personelin tam adı" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newStaff.name || ''} 
                      onChange={e => setNewStaff({...newStaff, name: e.target.value})} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                        <ShieldCheck size={14} /> Yetki / Rol
                    </label>
                    <select 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" 
                        value={newStaff.role || 'Usta'} 
                        onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                    >
                        {/* 🚀 Yönetici ekleme seçeneği SADECE Patron'a gösterilir */}
                        {userRole === 'Patron' && <option value="Yönetici">Yönetici</option>}
                        <option value="Usta">Usta</option>
                    </select>
                    </div>

                    <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                        <Briefcase size={14} /> Branş
                    </label>
                    <select 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" 
                        value={newStaff.branch || ''} 
                        onChange={e => setNewStaff({...newStaff, branch: e.target.value})}
                    >
                        <option value="">Genel</option>
                        {branchList.map((subType: any) => (
                            <option key={subType} value={subType}>{subType}</option>
                        ))}
                    </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                    <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                        <User size={14} /> Kullanıcı Adı
                    </label>
                    <input 
                        type="text" 
                        placeholder="örn: ali.usta" 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                        value={newStaff.username || ''} 
                        onChange={e => setNewStaff({...newStaff, username: e.target.value.replace(/\s+/g, '').toLowerCase()})} 
                    />
                    </div>

                    <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                        <KeyRound size={14} /> Şifre
                    </label>
                    <input 
                        type="text" 
                        placeholder="Şifre" 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                        value={newStaff.password || ''} 
                        onChange={e => setNewStaff({...newStaff, password: e.target.value})} 
                    />
                    </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5 mt-2">
                      <Phone size={14} /> Telefon Numarası
                  </label>
                  <input 
                      type="tel" 
                      placeholder="05XX XXX XX XX" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newStaff.contact || ''} 
                      onChange={e => setNewStaff({...newStaff, contact: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5 mt-2">
                      <MapPin size={14} /> Sorumlu Olduğu Bölgeler (Örn: Kadıköy, Beşiktaş)
                  </label>
                  <input 
                      type="text" 
                      placeholder="Virgülle ayırarak yazabilirsiniz" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newStaff.assigned_regions || ''} 
                      onChange={e => setNewStaff({...newStaff, assigned_regions: e.target.value})} 
                  />
                </div>

            </div>

            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={() => handleAction('add-staff', newStaff, setShowAddStaff, () => setNewStaff({ name: '', role: '', contact: '', branch: '', username: '', password: '' }))} 
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Personeli Kaydet'}
               </button>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}