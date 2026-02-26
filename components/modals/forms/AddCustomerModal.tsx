'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Phone, MapPin, FileText, Box } from 'lucide-react';
import trCitiesData from '@/lib/data/tr-cities.json';

const CITY_DATA: any = trCitiesData;

export default function AddCustomerModal({
  showAddCustomer, setShowAddCustomer,
  newCustomer, setNewCustomer,
  isSaving, handleAction
}: any) {

  // Yeni adres sistemi için state'ler
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [buildingNo, setBuildingNo] = useState('');

  // Form doğrulama: Sadece Müşteri/Firma Adı zorunlu
  const isFormValid = newCustomer?.name?.trim() !== '';

  const getFullAddress = (rawAddress: string, bNo: string, city: string, district: string) => {
      let full = rawAddress ? rawAddress.trim() : '';
      if (bNo) full += ` No:${bNo}`;
      if (district) full += ` / ${district}`;
      if (city) full += ` / ${city}`;
      return full;
  };

  const handleClose = () => {
      setShowAddCustomer(false);
      // Kapatırken local state'leri sıfırla
      setSelectedCity('');
      setSelectedDistrict('');
      setBuildingNo('');
  };

  return (
    <AnimatePresence>
      {showAddCustomer && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
        >
          <div className="absolute inset-0 cursor-pointer" onClick={handleClose}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            transition={{ duration: 0.15 }}
            className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-200 cursor-default flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
               <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Yeni Müşteri Ekle</h2>
                  <div className="text-xs font-medium text-slate-500 mt-1">Sisteme yeni bir müşteri veya firma kaydedin.</div>
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
                
                {/* Müşteri / Firma Adı */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <User size={14} /> Müşteri / Firma Adı <span className="text-rose-500">*</span>
                  </label>
                  <input 
                      type="text" 
                      placeholder="Örn: Ahmet Yılmaz veya ABC Ltd. Şti." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newCustomer.name || ''} 
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                  />
                </div>

                {/* İletişim Numarası */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Phone size={14} /> İletişim Numarası
                  </label>
                  <input 
                      type="tel" 
                      placeholder="05XX XXX XX XX" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newCustomer.contact || ''} 
                      onChange={e => setNewCustomer({...newCustomer, contact: e.target.value})} 
                  />
                </div>

                {/* Adres / Konum (Manuel Sistem) */}
                <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl space-y-3">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin size={14} /> Adres Bilgileri
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
                            placeholder="Bina No" 
                        />
                        <textarea 
                            rows={2} 
                            className="w-full sm:w-2/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all resize-none" 
                            placeholder="Mahalle, Sokak..." 
                            value={newCustomer.address || ''} 
                            onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                        />
                    </div>
                </div>

                {/* Vergi No / TC Kimlik */}
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <FileText size={14} /> Vergi No / TC Kimlik (İsteğe Bağlı)
                  </label>
                  <input 
                      type="text" 
                      placeholder="Fatura işlemleri için..." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400" 
                      value={newCustomer.tax_info || ''} 
                      onChange={e => setNewCustomer({...newCustomer, tax_info: e.target.value})} 
                  />
                </div>

                {/* 🟢 İLK VARLIĞI (CİHAZI) EKLEME BÖLÜMÜ */}
                <div className="pt-4 border-t border-slate-100 mt-2">
                  <div className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Box size={14} /> İlk Varlığı / Cihazı Ekle (Opsiyonel)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input 
                          type="text" 
                          placeholder="Varlık Adı (Örn: A Blok Asansör)" 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:text-slate-400" 
                          value={newCustomer.asset_name || ''} 
                          onChange={e => setNewCustomer({...newCustomer, asset_name: e.target.value})} 
                      />
                    </div>
                    <div>
                      <input 
                          type="text" 
                          placeholder="Türü (Örn: Asansör, Kombi)" 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:text-slate-400" 
                          value={newCustomer.asset_type || ''} 
                          onChange={e => setNewCustomer({...newCustomer, asset_type: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={() => {
                      // Kayıt işleminden önce adresi birleştir
                      const combinedAddress = getFullAddress(newCustomer.address, buildingNo, selectedCity, selectedDistrict);
                      
                      handleAction('add-customer', { ...newCustomer, address: combinedAddress }, setShowAddCustomer, () => {
                          setNewCustomer({ name: '', contact: '', address: '', tax_info: '', asset_name: '', asset_type: '' });
                          setSelectedCity('');
                          setSelectedDistrict('');
                          setBuildingNo('');
                      });
                  }} 
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50 disabled:hover:bg-blue-600"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Müşteriyi Kaydet'}
               </button>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}