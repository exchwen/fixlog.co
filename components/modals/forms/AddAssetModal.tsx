'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Box, User, MapPin, FileText, Building2 } from 'lucide-react';
import trCitiesData from '@/lib/data/tr-cities.json';

const CITY_DATA: any = trCitiesData;

export default function AddAssetModal({
  showAddAsset, setShowAddAsset,
  newAsset, setNewAsset,
  isSaving, handleAction,
  data
}: any) {

  // Yeni Adres/Konum Sistemi için State'ler
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [buildingNo, setBuildingNo] = useState('');

  // Form doğrulama: Varlık adı ve müşteri seçimi zorunlu
  const isFormValid = newAsset?.name?.trim() !== '' && newAsset?.customer_id !== '';

  const getFullAddress = (rawAddress: string, bNo: string, city: string, district: string) => {
      let full = rawAddress ? rawAddress.trim() : '';
      if (bNo) full += ` No:${bNo}`;
      if (district) full += ` / ${district}`;
      if (city) full += ` / ${city}`;
      return full;
  };

  const handleClose = () => {
      setShowAddAsset(false);
      setSelectedCity('');
      setSelectedDistrict('');
      setBuildingNo('');
  };

  return (
    <AnimatePresence>
      {showAddAsset && (
        <motion.div 
           key="modal-backdrop-add"
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           exit={{ opacity: 0 }} 
           className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="absolute inset-0" onClick={handleClose}></div>
          
          <motion.div 
            key="modal-content-add"
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
               <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Yeni Cihaz / Varlık Ekle</h2>
                  <div className="text-xs font-medium text-slate-500 mt-1">Müşteriye ait yeni bir varlık tanımlayın.</div>
               </div>
               <button 
                  onClick={handleClose} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
               >
                  <X size={20} />
               </button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                
                {/* Apartman / Tesis Adı */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Building2 size={14} /> Apartman / Tesis Adı
                  </label>
                  <input 
                      type="text" 
                      placeholder="Örn: Akdeniz Apartmanı" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newAsset.apartmentName || ''} 
                      onChange={e => setNewAsset({...newAsset, apartmentName: e.target.value})} 
                  />
                </div>

                {/* Varlık / Cihaz Adı */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Box size={14} /> Cihaz / Varlık Türü <span className="text-rose-500">*</span>
                  </label>
                  <input 
                      type="text" 
                      placeholder="Örn: Yük Asansörü, Tıbbi Cihaz #12 vb." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newAsset.name} 
                      onChange={e => setNewAsset({...newAsset, name: e.target.value})} 
                  />
                </div>

                {/* Ait Olduğu Müşteri */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <User size={14} /> Ait Olduğu Müşteri <span className="text-rose-500">*</span>
                  </label>
                  <select 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" 
                      value={newAsset.customer_id} 
                      onChange={e => setNewAsset({...newAsset, customer_id: e.target.value})}
                  >
                      <option value="" disabled>Lütfen Müşteri Seçin...</option>
                      {(data?.customers || []).map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>

                {/* Konum / Şube (Yeni Sistem) */}
                <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl space-y-3">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin size={14} /> Konum / Adres Bilgileri
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select 
                            className="px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" 
                            value={selectedCity} 
                            onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}
                        >
                            <option value="">İl Seçin</option>
                            {Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select 
                            className="px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none disabled:opacity-50" 
                            value={selectedDistrict} 
                            onChange={(e) => setSelectedDistrict(e.target.value)} 
                            disabled={!selectedCity}
                        >
                            <option value="">İlçe Seçin</option>
                            {selectedCity && CITY_DATA[selectedCity]?.map((d:string) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                            className="w-full sm:w-1/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" 
                            value={buildingNo} 
                            onChange={(e) => setBuildingNo(e.target.value)} 
                            placeholder="Bina/Kapı No" 
                        />
                        <textarea 
                            rows={2} 
                            className="w-full sm:w-2/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all resize-none" 
                            placeholder="Açık Adres veya Departman (Örn: 2. Kat Sistem Odası)" 
                            value={newAsset.location || ''} 
                            onChange={e => setNewAsset({...newAsset, location: e.target.value})} 
                        />
                    </div>
                </div>

                {/* Varlık / Cihaz Detayları */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <FileText size={14} /> Varlık / Cihaz Detayları
                  </label>
                  <textarea 
                      rows={3}
                      placeholder="Teknik detaylar, kapasite, marka, model veya özel notlar..." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400 resize-none" 
                      value={newAsset.asset_details || ''} 
                      onChange={e => setNewAsset({...newAsset, asset_details: e.target.value})} 
                  />
                </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={() => {
                      const combinedLocation = getFullAddress(newAsset.location, buildingNo, selectedCity, selectedDistrict);
                      handleAction('add-asset', { ...newAsset, location: combinedLocation }, setShowAddAsset, () => {
                          setNewAsset({ name: '', location: '', customer_id: '', asset_details: '', apartmentName: '' });
                          setSelectedCity('');
                          setSelectedDistrict('');
                          setBuildingNo('');
                      });
                  }} 
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50 disabled:hover:bg-blue-600"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Cihazı Kaydet'}
               </button>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}