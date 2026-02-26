'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Phone, MapPin, FileText, Box } from 'lucide-react';
import trCitiesData from '@/lib/data/tr-cities.json';

const CITY_DATA: any = trCitiesData;

export default function AddCustomerModal({
  showAddCustomer, setShowAddCustomer,
  showAddAsset, setShowAddAsset, // Varlık modalının state'i (Stacking ve tetikleme için)
  newCustomer, setNewCustomer,
  isSaving, handleAction,
  data 
}: any) {

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [buildingNo, setBuildingNo] = useState('');

  // Sadece müşterisi olmayan (bağımsız) varlıkları filtreliyoruz
  const unassignedAssets = (data?.assets || []).filter((a: any) => !a.customer_id);

  const getFullAddress = (rawAddress: string, bNo: string, city: string, district: string) => {
      let full = rawAddress ? rawAddress.trim() : '';
      if (bNo) full += (full ? ` No:${bNo}` : `No:${bNo}`);
      if (district) full += (full ? ` / ${district}` : district);
      if (city) full += (full ? ` / ${city}` : city);
      return full;
  };

  const handleClose = () => {
      setShowAddCustomer(false);
      setSelectedCity('');
      setSelectedDistrict('');
      setBuildingNo('');
  };

  return (
    <AnimatePresence>
      {showAddCustomer && (
        <motion.div 
          key="modal-backdrop-customer"
          // Varlık modalı açılırsa bu modal arkaya düşecek (z-index: 90)
          className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${showAddAsset ? 'z-[90]' : 'z-[110]'}`}
          initial={{ opacity: 0, pointerEvents: "none" }} 
          animate={{ opacity: 1, pointerEvents: "auto" }} 
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: 0.15 }}
        >
          {/* Varlık modalı açıldığında bu karartıyı gizliyoruz ki ekran kapkaranlık olmasın */}
          <div 
             className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${showAddAsset ? 'opacity-0' : 'opacity-100'} cursor-pointer`} 
             onClick={() => !showAddAsset && handleClose()} 
          />
          
          <motion.div 
            key="modal-content-customer"
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            // iOS Stacking Efekti: Varlık ekleme açılırsa arkaya git, karar, küçül!
            animate={{ 
                opacity: 1, 
                scale: showAddAsset ? 0.92 : 1,      
                y: showAddAsset ? -20 : 0,           
                filter: showAddAsset ? 'brightness(0.5)' : 'brightness(1)' 
            }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: showAddAsset ? 'none' : 'auto' }} // Arkadayken tıklanamaz
            className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative z-10 overflow-hidden border border-slate-200 cursor-default flex flex-col max-h-[90vh]"
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
                      <User size={14} /> Müşteri / Firma Adı
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

                {/* Adres / Konum */}
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

                {/* Varlık Atama ve Yeni Varlık Ekle Butonu */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Box size={14} /> Varlık / Cihaz Ataması
                      </label>
                      <button 
                          type="button" 
                          onClick={() => setShowAddAsset && setShowAddAsset(true)} 
                          className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-all active:scale-95"
                      >
                          + Yeni Varlık Ekle
                      </button>
                  </div>
                  <select 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" 
                      value={newCustomer.linked_asset_id || ''} 
                      onChange={e => setNewCustomer({...newCustomer, linked_asset_id: e.target.value})}
                  >
                      <option value="">Bağımsız (Atama Yapılmayacak)</option>
                      {unassignedAssets.map((a: any) => (
                          <option key={a.id} value={a.id}>
                             {a.apartmentName || a.apartment_name ? `${a.apartmentName || a.apartment_name} - ${a.name}` : a.name}
                          </option>
                      ))}
                  </select>
                  {unassignedAssets.length === 0 && (
                      <div className="text-[10px] text-amber-600 mt-1.5 ml-1 font-medium flex items-center gap-1">
                          Sistemde atanmayı bekleyen boşta cihaz yok.
                      </div>
                  )}
                </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving} 
                  onClick={() => {
                      const combinedAddress = getFullAddress(newCustomer.address, buildingNo, selectedCity, selectedDistrict);
                      handleAction('add-customer', { ...newCustomer, address: combinedAddress }, setShowAddCustomer, () => {
                          setNewCustomer({ name: '', contact: '', address: '', tax_info: '', linked_asset_id: '' });
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