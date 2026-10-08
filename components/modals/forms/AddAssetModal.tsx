'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Box, User, MapPin, FileText, Building2, ChevronDown, Search, Calendar, Layers } from 'lucide-react';
import trCitiesData from '@/lib/data/tr-cities.json';
import sectorsData from '@/lib/data/sectors.json'; 

const CITY_DATA: any = trCitiesData;

export default function AddAssetModal({
  showAddAsset, setShowAddAsset,
  showAddCustomer, setShowAddCustomer, 
  newAsset, setNewAsset,
  isSaving, handleAction,
  data
}: any) {

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [buildingNo, setBuildingNo] = useState('');

  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [isPushedBack, setIsPushedBack] = useState(false);
  const [prevCustomers, setPrevCustomers] = useState(data?.customers || []);

  useEffect(() => {
    const currentCustomers = data?.customers || [];
    if (currentCustomers.length > prevCustomers.length) {
        const addedCustomer = currentCustomers.find((c: any) => !prevCustomers.some((pc: any) => pc.id === c.id));
        if (addedCustomer) {
            setNewAsset((prev: any) => ({ ...prev, customer_id: addedCustomer.id }));
        }
    }
    setPrevCustomers(currentCustomers);
  }, [data?.customers]);

  useEffect(() => {
    if (!showAddCustomer) setIsPushedBack(false);
  }, [showAddCustomer]);

  const handleClose = () => {
    setShowAddAsset(false);
    setSelectedCity('');
    setSelectedDistrict('');
    setBuildingNo('');
    setIsCustomerDropdownOpen(false);
    setCustomerSearch('');
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && showAddAsset && !isPushedBack) {
            handleClose();
        }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showAddAsset, isPushedBack]);

  const getFullAddress = (rawAddress: string, bNo: string, city: string, district: string) => {
      let full = rawAddress ? rawAddress.trim() : '';
      if (bNo) full += (full ? ` No:${bNo}` : `No:${bNo}`);
      if (district) full += (full ? ` / ${district}` : district);
      if (city) full += (full ? ` / ${city}` : city);
      return full;
  };

  const filteredCustomers = (data?.customers || []).filter((c: any) => 
      c.name?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomerObj = (data?.customers || []).find((c: any) => c.id === newAsset.customer_id);
  const selectedCustomerDisplay = selectedCustomerObj ? selectedCustomerObj.name : 'Bağımsız / Müşteri Yok';

  return (
    <AnimatePresence>
      {showAddAsset && (
        <motion.div 
        key="modal-backdrop-add"
        className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${isPushedBack ? 'z-[90]' : 'z-[110]'}`}
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        transition={{ duration: 0.15 }}
        style={{ pointerEvents: showAddAsset ? 'auto' : 'none' }} 
      >
          <div 
             className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isPushedBack ? 'opacity-0' : 'opacity-100'} cursor-pointer`} 
             onClick={() => !isPushedBack && handleClose()} 
          />
          
          <motion.div 
            key="modal-content-add"
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ 
                opacity: 1,
                scale: isPushedBack ? 0.92 : 1,
                y: isPushedBack ? -20 : 0,
                filter: isPushedBack ? 'brightness(0.5)' : 'brightness(1)'
            }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            transition={{ duration: 0.20, ease: "easeInOut" }} 
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: (isPushedBack || !showAddAsset) ? 'none' : 'auto' }} 
            className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative z-10 overflow-hidden border border-slate-200 cursor-default flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
               <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Yeni Cihaz / Varlık Ekle</h2>
                  <div className="text-xs font-medium text-slate-500 mt-1">Sisteme yeni bir varlık tanımlayın.</div>
               </div>
               <button 
                  onClick={handleClose} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
               >
                  <X size={20} />
               </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto overscroll-contain custom-scrollbar flex-1">
                
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

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Box size={14} /> Cihaz / Varlık Türü
                  </label>
                  <select 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all appearance-none cursor-pointer" 
                      value={newAsset.name || ''} 
                      onChange={e => setNewAsset({...newAsset, name: e.target.value})} 
                  >
                      <option value="">Lütfen Varlık Türü Seçin...</option>
                      {sectorsData.sectors["Asansör Bakım & Montaj"].assetTypes.map((type: string) => (
                          <option key={type} value={type}>{type}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <User size={14} /> Ait Olduğu Müşteri
                      </label>
                      {!showAddCustomer && (
                        <button 
                            type="button" 
                            onClick={() => { setIsPushedBack(true); setShowAddCustomer && setShowAddCustomer(true); }} 
                            className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-all active:scale-95 flex items-center gap-1"
                        >
                            + Yeni Müşteri
                        </button>
                      )}
                  </div>
                  
                  <div className="relative">
                    <div 
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 hover:bg-white focus-within:border-blue-500 transition-all cursor-pointer flex justify-between items-center"
                    >
                      <span className={newAsset.customer_id ? "text-slate-800" : "text-slate-500"}>
                        {selectedCustomerDisplay}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isCustomerDropdownOpen && (
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
                              placeholder="Müşteri Ara..."
                              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto overscroll-contain custom-scrollbar p-1.5 space-y-1 bg-white">
                            <div 
                              onClick={() => { setNewAsset({...newAsset, customer_id: ''}); setIsCustomerDropdownOpen(false); }}
                              className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${!newAsset.customer_id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700 font-medium'}`}
                            >
                              Bağımsız / Müşteri Yok
                            </div>
                            
                            {filteredCustomers.length > 0 && <div className="px-3 pt-2 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıtlı Müşteriler</div>}
                            
                            {filteredCustomers.map((c: any) => (
                              <div 
                                key={c.id}
                                onClick={() => { setNewAsset({...newAsset, customer_id: c.id}); setIsCustomerDropdownOpen(false); }}
                                className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${newAsset.customer_id === c.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700 font-medium'}`}
                              >
                                {c.name}
                              </div>
                            ))}
                            
                            {filteredCustomers.length === 0 && (data?.customers || []).length > 0 && (
                              <div className="px-3 py-4 text-center text-xs text-slate-500 font-medium">
                                Aranan müşteri bulunamadı.
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 shadow-sm rounded-xl space-y-3">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <Layers size={14} /> Teknik Bilgiler (Sözleşme & Teklif İçin)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1 ml-1">Kapasite</label>
                            <input 
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-500 bg-white transition-all" 
                                value={newAsset.capacity || ''} onChange={(e) => setNewAsset({...newAsset, capacity: e.target.value})} 
                                placeholder="Örn: 800kg / 10 Kişi" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1 ml-1">Durak Sayısı</label>
                            <input 
                                type="number"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-500 bg-white transition-all" 
                                value={newAsset.stops_count || ''} onChange={(e) => setNewAsset({...newAsset, stops_count: e.target.value})} 
                                placeholder="Örn: 5" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1 ml-1">Hızı (m/sn)</label>
                            <input 
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-500 bg-white transition-all" 
                                value={newAsset.elevator_speed || ''} onChange={(e) => setNewAsset({...newAsset, elevator_speed: e.target.value})} 
                                placeholder="Örn: 1.0 m/sn" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1 ml-1">Asansör Adedi</label>
                            <input 
                                type="number"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-500 bg-white transition-all" 
                                value={newAsset.elevator_count || '1'} onChange={(e) => setNewAsset({...newAsset, elevator_count: e.target.value})} 
                                placeholder="Örn: 1" 
                            />
                        </div>
                    </div>
                </div>

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
                            placeholder="Mahalle/Cadde/Sokak" 
                            value={newAsset.location || ''} 
                            onChange={e => setNewAsset({...newAsset, location: e.target.value})} 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                            <Calendar size={14} /> Periyot (Gün)
                        </label>
                        <input 
                            type="number" 
                            placeholder="Örn: 30" 
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" 
                            value={newAsset.maintenance_period || 30} 
                            onChange={e => setNewAsset({...newAsset, maintenance_period: parseInt(e.target.value) || 30})} 
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-black text-emerald-600 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                            💰 Bakım Ücreti
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-sm">₺</span>
                            <input 
                                type="number" 
                                placeholder="Tutar..." 
                                className="w-full pl-7 pr-3 py-3 border border-emerald-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 bg-emerald-50/50 focus:bg-white transition-all text-emerald-800" 
                                value={newAsset.maintenanceFee ?? newAsset.maintenance_fee ?? ''} 
                                onChange={e => setNewAsset({...newAsset, maintenanceFee: e.target.value})} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                            <User size={14} /> Rota Personeli
                        </label>
                        <select 
                            className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all appearance-none cursor-pointer" 
                            value={newAsset.route_staff_id || ''} 
                            onChange={e => setNewAsset({...newAsset, route_staff_id: e.target.value})} 
                        >
                            <option value="">Otomatik</option>
                            {(data?.staff || []).filter((s: any) => s.role !== 'Yönetici').map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                  <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest block mb-1">Otopilot yük çarpanı (standart=1)</label>
                  <input type="number" min={0.1} step={0.1} className="w-full max-w-[120px] px-3 py-2 border border-amber-200 rounded-lg text-sm font-bold bg-white" value={newAsset.maintenance_load_units ?? '1'} onChange={(e) => setNewAsset({ ...newAsset, maintenance_load_units: e.target.value })} />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <FileText size={14} /> Varlık / Cihaz Detayları
                  </label>
                  <textarea
                      rows={3}
                      placeholder="Teknik detaylar, marka, model veya özel notlar..." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400 resize-none" 
                      value={newAsset.asset_details || ''} 
                      onChange={e => setNewAsset({...newAsset, asset_details: e.target.value})} 
                  />
                </div>

            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                  disabled={isSaving} 
                  onClick={() => {
                      const combinedLocation = getFullAddress(newAsset.location, buildingNo, selectedCity, selectedDistrict);
                      handleAction('add-asset', { ...newAsset, location: combinedLocation, customerId: newAsset.customer_id, region: selectedDistrict, maintenance_load_units: parseFloat(newAsset.maintenance_load_units) || 1 }, setShowAddAsset, () => {
                        setNewAsset({ name: '', location: '', customer_id: '', asset_details: '', apartmentName: '', maintenance_load_units: '1' });
                        setSelectedCity('');
                        setSelectedDistrict('');
                        setBuildingNo('');
                        setIsCustomerDropdownOpen(false);
                        setCustomerSearch('');
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