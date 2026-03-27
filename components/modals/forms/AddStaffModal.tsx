'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Phone, ShieldCheck, Briefcase, KeyRound, MapPin } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';
import trCitiesData from '@/lib/data/tr-cities.json';

export default function AddStaffModal({
  showAddStaff, setShowAddStaff,
  newStaff, setNewStaff,
  isSaving, handleAction, data, userRole // 🚀 userRole eklendi
}: any) {
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState('İstanbul');
  
  const trCities: any = trCitiesData;
  const citiesList = Object.keys(trCities);
  const currentDistricts = trCities[selectedCity] || [];
  
  const toggleRegion = (region: string) => {
    // 🚀 DÜZELTME: newStaff undefined gelme ihtimaline karşı ? ve || eklendi
    let currentRegions = (newStaff?.assigned_regions || '').split(',').map((r:string)=>r.trim()).filter(Boolean);
    
    if (currentRegions.includes(region)) {
        currentRegions = currentRegions.filter((r:string) => r !== region);
    } else {
        currentRegions.push(region);
    }
    setNewStaff({...newStaff, assigned_regions: currentRegions.join(', ')});
};

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
                        name="secure_random_pwd_input_add_1329"
                        autoComplete="new-password" 
                        readOnly={true}
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                        placeholder="Şifre" 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                        value={newStaff.password || ''} 
                        onChange={e => setNewStaff({...newStaff, password: e.target.value.trim()})} 
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
                      value={newStaff.phone || newStaff.contact || ''} 
                      onChange={e => setNewStaff({...newStaff, phone: e.target.value, contact: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5 mt-2">
                      <MapPin size={14} /> Sorumlu Olduğu Bölgeler
                  </label>
                  <div 
                      onClick={() => setShowRegionModal(true)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold cursor-pointer bg-slate-50 hover:bg-white transition-all text-slate-700 min-h-[46px] flex items-center flex-wrap gap-1.5"
                  >
                      {newStaff.assigned_regions ? (
                          newStaff.assigned_regions.split(',').map((r:string, i:number) => r.trim() && (
                              <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold">{r.trim()}</span>
                          ))
                      ) : (
                          <span className="text-slate-400 font-medium">Bölge seçmek için tıklayın...</span>
                      )}
                  </div>
                  
                  {showRegionModal && (
                      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
                          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                              <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                                  <h3 className="font-black text-slate-800">Bölgeleri Seçin</h3>
                                  <button onClick={(e) => { e.stopPropagation(); setShowRegionModal(false); }} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg border border-slate-200"><X size={16} /></button>
                              </div>
                              <div className="p-3 border-b border-slate-100">
                                  <select 
                                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                      value={selectedCity}
                                      onChange={(e) => setSelectedCity(e.target.value)}
                                  >
                                      {citiesList.map(city => (
                                          <option key={city} value={city}>{city}</option>
                                      ))}
                                  </select>
                              </div>
                              <div className="p-4 overflow-y-auto grid grid-cols-2 gap-2 custom-scrollbar">
                                  {currentDistricts.map((dist: string) => {
                                      const isSelected = newStaff.assigned_regions?.includes(dist);
                                      return (
                                          <button 
                                              key={dist} 
                                              onClick={(e) => { e.stopPropagation(); toggleRegion(dist); }}
                                              className={`py-2 px-3 rounded-xl text-xs font-bold text-left transition-all border ${isSelected ? 'bg-blue-500 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                                          >
                                              {dist}
                                          </button>
                                      );
                                  })}
                              </div>
                              <div className="p-4 border-t border-slate-100 bg-slate-50">
                                  <button onClick={(e) => { e.stopPropagation(); setShowRegionModal(false); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">Seçimi Tamamla</button>
                              </div>
                          </div>
                      </div>
                  )}
                </div>

            </div>

            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={() => handleAction('add-staff', newStaff, setShowAddStaff, () => setNewStaff({ name: '', role: '', phone: '', contact: '', branch: '', username: '', password: '', assigned_regions: '' }))} 
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