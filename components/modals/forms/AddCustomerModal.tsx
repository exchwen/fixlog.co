'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Phone, MapPin, FileText, Box, ChevronDown, Search } from 'lucide-react';
import trCitiesData from '@/lib/data/tr-cities.json';

const CITY_DATA: any = trCitiesData;

export default function AddCustomerModal({
  showAddCustomer, setShowAddCustomer,
  showAddAsset, setShowAddAsset, // Varlık modalının state'i (Stacking animasyonu için)
  newCustomer, setNewCustomer,
  newAsset, setNewAsset,
  isSaving, handleAction,
  data 
}: any) {

  // Yeni adres sistemi için state'ler
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [buildingNo, setBuildingNo] = useState('');

  // Özel Dropdown State'leri
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');

  // 🚀 Stacking Takılmasını Önleyen Özel State
  const [isPushedBack, setIsPushedBack] = useState(false);

  // 🚀 YENİ: Arka planda yeni varlık eklendiğinde otomatik seçmek için gözlemci
  const [prevAssets, setPrevAssets] = useState(data?.assets || []);

  useEffect(() => {
    const currentAssets = data?.assets || [];
    // Eğer varlık sayısında bir artış varsa (Yeni varlık eklendiyse)
    if (currentAssets.length > prevAssets.length) {
        // Eklenen yeni varlığı bul
        const addedAsset = currentAssets.find((a: any) => !prevAssets.some((pa: any) => pa.id === a.id));
        if (addedAsset) {
            // Yeni varlığı otomatik olarak müşteriye ata
            setNewCustomer((prev: any) => ({ ...prev, linked_asset_id: addedAsset.id }));
        }
    }
    setPrevAssets(currentAssets);
  }, [data?.assets]);

  // Eğer diğer modal kapanırsa, bu modalı tekrar öne getir
  useEffect(() => {
    if (!showAddAsset) setIsPushedBack(false);
  }, [showAddAsset]);

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
    setIsAssetDropdownOpen(false);
    setAssetSearch('');
};

const filteredAssets = unassignedAssets.filter((a: any) => {
    const term = assetSearch.toLowerCase();
    const nameMatch = a.name?.toLowerCase().includes(term);
    const aptMatch = a.apartmentName?.toLowerCase().includes(term) || a.apartment_name?.toLowerCase().includes(term);
    return nameMatch || aptMatch;
});

const selectedAssetObj = unassignedAssets.find((a: any) => a.id === newCustomer.linked_asset_id);
const selectedAssetDisplay = selectedAssetObj 
    ? `${selectedAssetObj.apartmentName || selectedAssetObj.apartment_name || ''} - ${selectedAssetObj.name}`
    : 'Bağımsız (Varlık Atanmayacak)';

return (
  <AnimatePresence>
  {showAddCustomer && (
    <motion.div 
      key="modal-backdrop-customer"
      className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${isPushedBack ? 'z-[90]' : 'z-[110]'}`}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} // 🚀 DOM'dan hızlıca kopması için temizlendi
      transition={{ duration: 0.15 }}
      style={{ pointerEvents: showAddCustomer ? 'auto' : 'none' }} // 🚀 State false olduğu an tıklama kilidini anında açar
    >
      <div 
         className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isPushedBack ? 'opacity-0' : 'opacity-100'} cursor-pointer`} 
         onClick={() => !isPushedBack && handleClose()} 
      />
      
      <motion.div 
        key="modal-content-customer"
        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
        animate={{ 
            opacity: 1, 
            scale: isPushedBack ? 0.92 : 1,      
            y: isPushedBack ? -20 : 0,           
            filter: isPushedBack ? 'brightness(0.5)' : 'brightness(1)' 
        }} 
        exit={{ opacity: 0, scale: 0.95, y: 10 }} 
        transition={{ duration: 0.20, ease: "easeInOut" }} // 🚀 0.25'ten 0.20'ye düşürülerek hızlandırıldı
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: (isPushedBack || !showAddCustomer) ? 'none' : 'auto' }} // 🚀 Hayalet katmanı (1-2 sn tıklayamama) tamamen engeller
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
            {/* 🚀 overscroll-contain eklenerek arkadaki sayfanın kayması (Scroll Chaining) kilitlenmesi engellendi */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto overscroll-contain custom-scrollbar flex-1">
                
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

                <div className="p-3 bg-amber-50/80 border border-amber-100 rounded-xl">
                  <label className="text-[10px] font-black text-amber-800 uppercase tracking-widest block mb-1">Otopilot önem (varsayılan 1)</label>
                  <input type="number" min={0.1} step={0.1} className="w-full max-w-[120px] px-3 py-2 border border-amber-200 rounded-lg text-sm font-bold bg-white" value={newCustomer.importance_weight ?? '1'} onChange={(e) => setNewCustomer({ ...newCustomer, importance_weight: e.target.value })} />
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
                    <div className="flex flex-col sm:flex-row gap-3 items-start">
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

                {/* 🟢 VARLIK (CİHAZ) ATAMA BÖLÜMÜ (TEK İNPUT VE ARAMA) */}
                <div className="pt-4 border-t border-slate-100 mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Box size={14} /> İlk Varlığı Belirleyin (Opsiyonel)
                    </label>
                    {/* Döngü kırıcı: Varlık modalı zaten açıksa bu butonu gizle */}
                    {!showAddAsset && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const customerAddress = getFullAddress(newCustomer.address || '', buildingNo, selectedCity, selectedDistrict);
                          if (customerAddress.trim()) {
                            setNewAsset((prev: any) => ({
                              ...prev,
                              location: prev?.location?.trim() ? prev.location : customerAddress
                            }));
                          }
                          setIsPushedBack(true);
                          setShowAddAsset && setShowAddAsset(true);
                        }} 
                        className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-all active:scale-95 flex items-center gap-1"
                      >
                        + Yeni Varlık
                      </button>
                    )}
                  </div>
                  
                  {/* Custom Searchable Dropdown */}
                  <div className="relative">
                    <div 
                      onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 hover:bg-white focus-within:border-blue-500 transition-all cursor-pointer flex justify-between items-center"
                    >
                      <span className={newCustomer.linked_asset_id ? "text-slate-800" : "text-slate-500"}>
                        {selectedAssetDisplay}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isAssetDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isAssetDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                        >
                          <div className="p-2 border-b border-slate-100 flex items-center bg-slate-50 relative">
                            <Search size={16} className="text-slate-400 ml-2 absolute pointer-events-none" />
                            <input 
                              type="text"
                              autoFocus
                              placeholder="Varlık Ara..."
                              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                              value={assetSearch}
                              onChange={(e) => setAssetSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar p-1.5 space-y-1 bg-white">
                            <div 
                              onClick={() => { setNewCustomer({...newCustomer, linked_asset_id: ''}); setIsAssetDropdownOpen(false); }}
                              className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${!newCustomer.linked_asset_id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700 font-medium'}`}
                            >
                              Bağımsız (Varlık Atanmayacak)
                            </div>
                            
                            {filteredAssets.length > 0 && <div className="px-3 pt-2 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Boştaki Varlıklar</div>}
                            
                            {filteredAssets.map((a: any) => (
                              <div 
                                key={a.id}
                                onClick={() => { setNewCustomer({...newCustomer, linked_asset_id: a.id}); setIsAssetDropdownOpen(false); }}
                                className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${newCustomer.linked_asset_id === a.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700 font-medium'}`}
                              >
                                {a.apartmentName || a.apartment_name ? `${a.apartmentName || a.apartment_name} - ${a.name}` : a.name}
                              </div>
                            ))}
                            
                            {filteredAssets.length === 0 && unassignedAssets.length > 0 && (
                              <div className="px-3 py-4 text-center text-xs text-slate-500 font-medium">
                                Aranan varlık bulunamadı.
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving || !isFormValid} 
                  onClick={() => {
                      const combinedAddress = getFullAddress(newCustomer.address, buildingNo, selectedCity, selectedDistrict);
                      
                      // 🚀 DÜZELTME: Backend'in beklediği 'assetAction' anahtarına seçilen cihazın ID'sini ekliyoruz.
                      handleAction('add-customer', { ...newCustomer, address: combinedAddress, assetAction: newCustomer.linked_asset_id, importance_weight: parseFloat(newCustomer.importance_weight) || 1 }, setShowAddCustomer, () => {
                        setNewCustomer({ name: '', contact: '', address: '', tax_info: '', linked_asset_id: '', importance_weight: '1' });
                        setSelectedCity('');
                        setSelectedDistrict('');
                        setBuildingNo('');
                        setIsAssetDropdownOpen(false);
                        setAssetSearch('');
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
