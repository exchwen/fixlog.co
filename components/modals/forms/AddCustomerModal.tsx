'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Phone, MapPin, FileText, Box } from 'lucide-react';
import trCitiesData from '@/lib/data/tr-cities.json';

const CITY_DATA: any = trCitiesData;

export default function AddCustomerModal({
  showAddCustomer, setShowAddCustomer,
  showAddAsset, setShowAddAsset, // Varlık modalının state'i (Stacking animasyonu için)
  newCustomer, setNewCustomer,
  isSaving, handleAction,
  data 
}: any) {

  // Yeni adres sistemi için state'ler
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [buildingNo, setBuildingNo] = useState('');

  // Varlık (Cihaz) Atama Modu: 'independent' (Bağımsız), 'select' (Listeden Seç), 'new' (Yeni Ekle)
  const [assetMode, setAssetMode] = useState('independent'); 

  // Form doğrulama: Sadece Müşteri/Firma Adı zorunlu
  const isFormValid = newCustomer?.name?.trim() !== '';

  // Sadece hiçbir müşteriye atanmamış (customer_id boş veya null olan) varlıkları filtrele
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
      // Kapatırken local state'leri sıfırla
      setSelectedCity('');
      setSelectedDistrict('');
      setBuildingNo('');
      setAssetMode('independent');
  };

  return (
    <AnimatePresence>
      {showAddCustomer && (
        <motion.div 
          key="modal-backdrop-customer"
          // Z-index çakışmasını engelliyoruz: Varlık modalı açılırsa bu modalı z-90 ile arkaya atıyoruz.
          className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${showAddAsset ? 'z-[90]' : 'z-[110]'}`}
          initial={{ opacity: 0, pointerEvents: "none" }} 
          animate={{ opacity: 1, pointerEvents: "auto" }} 
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: 0.15 }}
        >
          {/* Varlık ekleme açıkken kendi siyah arkaplanını şeffaflaştırıyoruz (çift karanlık olmasın diye) */}
          <div 
             className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${showAddAsset ? 'opacity-0' : 'opacity-100'} cursor-pointer`} 
             onClick={() => !showAddAsset && handleClose()} 
          />
          
          <motion.div 
            key="modal-content-customer"
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            // 🚀 STACKING EFEKTİ: Varlık modalı açıldığında arkaya doğru küçül, karar ve yukarı kay!
            animate={{ 
                opacity: 1, 
                scale: showAddAsset ? 0.92 : 1,      
                y: showAddAsset ? -20 : 0,           
                filter: showAddAsset ? 'brightness(0.5)' : 'brightness(1)' 
            }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: showAddAsset ? 'none' : 'auto' }} // Arkada beklerken etkileşimi keser
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

                {/* 🟢 VARLIK (CİHAZ) ATAMA BÖLÜMÜ (3 SEÇENEKLİ) */}
                <div className="pt-4 border-t border-slate-100 mt-2">
                  <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Box size={14} /> İlk Varlığı / Cihazı Belirleyin (Opsiyonel)
                  </div>
                  
                  {/* Sekme Butonları */}
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-3 shadow-inner">
                    <button 
                       type="button" 
                       onClick={() => { 
                           setAssetMode('independent'); 
                           setNewCustomer({...newCustomer, linked_asset_id: '', asset_name: '', apartmentName: ''}); 
                       }} 
                       className={`flex-1 text-[11px] sm:text-xs font-bold py-2 rounded-lg transition-all ${assetMode === 'independent' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       Bağımsız
                    </button>
                    <button 
                       type="button" 
                       onClick={() => { 
                           setAssetMode('select'); 
                           setNewCustomer({...newCustomer, asset_name: '', apartmentName: ''}); 
                       }} 
                       className={`flex-1 text-[11px] sm:text-xs font-bold py-2 rounded-lg transition-all ${assetMode === 'select' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       Listeden Seç
                    </button>
                    <button 
                       type="button" 
                       onClick={() => { 
                           setAssetMode('new'); 
                           setNewCustomer({...newCustomer, linked_asset_id: ''}); 
                       }} 
                       className={`flex-1 text-[11px] sm:text-xs font-bold py-2 rounded-lg transition-all ${assetMode === 'new' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       Yeni Ekle
                    </button>
                  </div>

                  {/* Dinamik İçerik Alanı */}
                  <AnimatePresence mode="wait">
                      {assetMode === 'independent' && (
                          <motion.div 
                              key="independent" 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              exit={{ opacity: 0, height: 0 }} 
                              className="text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed overflow-hidden"
                          >
                              Bu müşteriye şu an için herhangi bir varlık veya cihaz atanmayacak. Daha sonra varlık detaylarından eşleştirme yapabilirsiniz.
                          </motion.div>
                      )}

                      {assetMode === 'select' && (
                          <motion.div 
                              key="select" 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                          >
                             <select 
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" 
                                 value={newCustomer.linked_asset_id || ''} 
                                 onChange={e => setNewCustomer({...newCustomer, linked_asset_id: e.target.value})}
                             >
                                 <option value="" disabled>Listeden Mevcut Bir Varlık Seçin...</option>
                                 {unassignedAssets.map((a: any) => (
                                     <option key={a.id} value={a.id}>
                                        {a.apartmentName || a.apartment_name ? `${a.apartmentName || a.apartment_name} - ${a.name}` : a.name}
                                     </option>
                                 ))}
                             </select>
                             {unassignedAssets.length === 0 && (
                                <div className="text-[10px] text-amber-600 mt-2 font-medium flex items-center gap-1">
                                    Sistemde atanmayı bekleyen boşta cihaz yok.
                                </div>
                             )}
                          </motion.div>
                      )}

                      {assetMode === 'new' && (
                          <motion.div 
                              key="new" 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              exit={{ opacity: 0, height: 0 }} 
                              className="grid grid-cols-1 gap-3 overflow-hidden p-3 bg-blue-50 border border-slate-200 rounded-xl"
                          >
                             <div className="flex justify-between items-center mb-1">
                               <span className="text-[10px] font-bold text-slate-500">SIFIRDAN VARLIK OLUŞTUR</span>
                               <button 
                                  type="button" 
                                  // Varlık Ekleme modalını tetikleyen kısayol (Stacking'i başlatır)
                                  onClick={() => setShowAddAsset && setShowAddAsset(true)} 
                                  className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-md hover:bg-blue-200 transition-all active:scale-95"
                               >
                                  + Yeni Varlık Formunu Aç
                               </button>
                             </div>
                             <input 
                                 type="text" 
                                 placeholder="Apartman / Tesis Adı (Örn: Akdeniz Apt.)" 
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-white transition-all placeholder:text-slate-400" 
                                 value={newCustomer.apartmentName || ''} 
                                 onChange={e => setNewCustomer({...newCustomer, apartmentName: e.target.value})} 
                             />
                             <input 
                                 type="text" 
                                 placeholder="Cihaz / Varlık Türü (Örn: Yük Asansörü)" 
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-white transition-all placeholder:text-slate-400" 
                                 value={newCustomer.asset_name || ''} 
                                 onChange={e => setNewCustomer({...newCustomer, asset_name: e.target.value})} 
                             />
                          </motion.div>
                      )}
                  </AnimatePresence>
                </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={() => {
                      const combinedAddress = getFullAddress(newCustomer.address, buildingNo, selectedCity, selectedDistrict);
                      
                      handleAction('add-customer', { ...newCustomer, address: combinedAddress }, setShowAddCustomer, () => {
                          setNewCustomer({ name: '', contact: '', address: '', tax_info: '', asset_name: '', apartmentName: '', linked_asset_id: '' });
                          setSelectedCity('');
                          setSelectedDistrict('');
                          setBuildingNo('');
                          setAssetMode('independent');
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