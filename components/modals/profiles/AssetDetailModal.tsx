'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Box, Briefcase, Calendar, User, AlertCircle, ChevronRight, Edit, Trash2, Save, Loader2, Search, Wrench, Siren, FileText, Building2 } from 'lucide-react';
import trCitiesData from '@/lib/data/tr-cities.json';

const CITY_DATA: any = trCitiesData;

export default function AssetDetailModal({
  selectedAsset, setSelectedAsset,
  data, handleCloseDetail,
  selectedJob, setSelectedJob, // 🚀 İşi takip etmek için eklendi
  selectedCustomer, setSelectedCustomer, // 🚀 Müşteriyi takip etmek için eklendi
  handleAction, userRole
}: any) {

  const [activeTab, setActiveTab] = useState('info'); 
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(selectedAsset || {});
  const [isSaving, setIsSaving] = useState(false);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [buildingNo, setBuildingNo] = useState('');

  // 🚀 Hangi alt modalın BU modal tarafından açıldığını takip ediyoruz (Çakışmayı önler)
  const [openedChild, setOpenedChild] = useState<'customer' | 'job' | null>(null);

  // Dışarıdan modal kapandığında local state'i temizle
  useEffect(() => {
    if (!selectedCustomer && openedChild === 'customer') setOpenedChild(null);
  }, [selectedCustomer, openedChild]);

  useEffect(() => {
    if (!selectedJob && openedChild === 'job') setOpenedChild(null);
  }, [selectedJob, openedChild]);

  // Bu modalın arkaya itilip itilmeyeceğini belirliyoruz
  const isStacked = openedChild !== null;

  useEffect(() => {
    if (selectedAsset) {
        setEditForm(selectedAsset);
        setIsEditing(false);
        setSelectedCity('');
        setSelectedDistrict('');
        setBuildingNo('');
        setActiveTab('info');
    }
  }, [selectedAsset]);

  const handleToggleEdit = () => {
      if (!isEditing && editForm?.location) {
          const loc = editForm.location;
          const parts = loc.split('/').map((p: string) => p.trim());
          
          if (parts.length >= 3) {
              const city = parts[parts.length - 1];
              const dist = parts[parts.length - 2];
              
              setSelectedCity(Object.keys(CITY_DATA).includes(city) ? city : '');
              setSelectedDistrict(dist);
              
              let remaining = parts.slice(0, -2).join(' / ');
              const noMatch = remaining.match(/No:\s*(.+)$/i);
              
              if (noMatch) {
                  setBuildingNo(noMatch[1].trim());
                  setEditForm((prev: any) => ({ ...prev, location: remaining.replace(noMatch[0], '').trim() }));
              } else {
                  setBuildingNo('');
                  setEditForm((prev: any) => ({ ...prev, location: remaining }));
              }
          } else {
              setEditForm((prev: any) => ({ ...prev, location: loc }));
          }
      } else if (isEditing) {
          setEditForm(selectedAsset);
      }
      setIsEditing(!isEditing);
  };

  const assetJobs = (data?.jobs || []).filter((j:any) => String(j.asset_id) === String(selectedAsset?.id));
  const assetFaults = (data?.fault_reports || []).filter((f:any) => String(f.asset_id) === String(selectedAsset?.id));
  const assetEmergencies = (data?.emergencies || []).filter((e:any) => String(e.asset_id) === String(selectedAsset?.id));
  const assetOwner = (data?.customers || []).find((c:any) => String(c.id) === String(selectedAsset?.customer_id));

  const filteredCustomers = (data?.customers || []).filter((c:any) => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const statusColors: any = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200',
    'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const getFullAddress = (rawAddress: string, bNo: string, city: string, district: string) => {
    let full = rawAddress ? rawAddress.trim() : '';
    if (bNo) full += (full ? ` No:${bNo}` : `No:${bNo}`);
    if (district) full += (full ? ` / ${district}` : district);
    if (city) full += (full ? ` / ${city}` : city);
    return full;
  };

  const handleSaveEdit = async () => {
      setIsSaving(true);
      const locationToSave = (selectedCity || selectedDistrict || buildingNo) 
          ? getFullAddress(editForm.location, buildingNo, selectedCity, selectedDistrict) 
          : editForm.location;

      const payload = { ...editForm, location: locationToSave };
      
      const success = await handleAction('update-asset', payload);
      setIsSaving(false);
      
      if(success !== false) {
          setIsEditing(false);
          setSelectedAsset(payload);
      }
  };

  const handleDelete = async () => {
      if(confirm("Bu varlığı kalıcı olarak silmek istediğinize emin misiniz? (Geçmiş işler ve atamalar etkilenebilir)")) {
          const success = await handleAction('delete-asset', { id: selectedAsset.id });
          if(success !== false) {
              setSelectedAsset(null);
              if (handleCloseDetail) handleCloseDetail('asset');
          }
      }
  };

  const handleClose = () => {
      setSelectedAsset(null);
      if (handleCloseDetail) handleCloseDetail('asset');
  };

  // 🚀 Akıllı Popstate ve ESC Yönetimi
  const handleSmartClose = useCallback((e?: any) => {
    // Üstte açılmış bir modal varsa escape/geri tuşu bu modalı etkilemesin!
    if (isStacked) return true;

    const stopEvent = () => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        else if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
            e.nativeEvent.stopImmediatePropagation();
        }
      }
    };

    if (isEditing) {
        stopEvent();
        setIsEditing(false);
        setEditForm(selectedAsset);
        return true;
    }

    if (selectedAsset) {
        stopEvent();
        handleClose();
        return true;
    }

    return false;
  }, [isEditing, selectedAsset, isStacked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSmartClose(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleSmartClose]);

  useEffect(() => {
    if (selectedAsset) {
        window.history.pushState({ assetModal: true }, '');
    }
  }, [selectedAsset]);

  useEffect(() => {
    if (isEditing) {
        window.history.pushState({ internalAssetLayer: true }, '');
    }
  }, [isEditing]);

  useEffect(() => {
    if (!selectedAsset) return;

    const handlePopState = (e: PopStateEvent) => {
      handleSmartClose(e);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedAsset, handleSmartClose]);

  return (
    <AnimatePresence>
      {selectedAsset && (
        <motion.div 
          key="modal-backdrop-detail"
          // 🚀 Katman arkaya gittiğinde z-index 10'a düşer ki yeni açılan modal sorunsuz üstte kalsın
          className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${isStacked ? 'z-[10]' : 'z-[130]'}`}
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          // 🚀 ÇÖZÜM: Kapanma animasyonu tetiklendiği an "pointer-events: none" uygulayarak ekrana tıklanmayı bloklamasını önlüyoruz.
          exit={{ opacity: 0, pointerEvents: 'none' }} 
          transition={{ duration: 0.15 }}
        >
          {/* Arkaya itildiğinde transparan olan tıklanabilir arka plan */}
          <div 
             className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isStacked ? 'opacity-0' : 'opacity-100'} cursor-pointer`} 
             onClick={() => !isStacked && handleClose()}
          ></div>

          <motion.div 
            key="modal-content-detail"
            // 🚀 Arkaya gitme (scale ve brightness) animasyonu eklendi
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ 
                opacity: 1, 
                scale: isStacked ? 0.92 : 1, 
                y: isStacked ? -20 : 0, 
                filter: isStacked ? 'brightness(0.5)' : 'brightness(1)' 
            }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ pointerEvents: isStacked ? 'none' : 'auto' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 cursor-default"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start p-5 sm:p-6 pb-0 border-b border-slate-100 bg-slate-50/50 z-10 flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 w-full min-w-0">
                  <div className="flex justify-between items-start w-full gap-2">
                      <div className="min-w-0">
                          <h2 className="text-xl font-black text-slate-800 tracking-tight truncate">
                              {selectedAsset.apartmentName || selectedAsset.apartment_name || 'Apartman / Tesis Adı Yok'}
                          </h2>
                          <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                             <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold flex items-center gap-1">
                                 <Box size={12}/> {selectedAsset.name || 'Varlık Türü'}
                             </span>
                          </div>
                      </div>
                      
                      {/* MOBİL BUTONLAR */}
                      <div className="flex items-center gap-1.5 sm:hidden shrink-0">
                          {userRole === 'Patron' && !isEditing && (
                              <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all"><Trash2 size={18} /></button>
                          )}
                          <button onClick={handleToggleEdit} className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-blue-600 text-white' : 'text-blue-500 hover:bg-blue-100'}`}><Edit size={18} /></button>
                          <button onClick={handleClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-all"><X size={20} /></button>
                      </div>
                  </div>

                  {!isEditing && (
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 border-b border-slate-200 w-full">
                        <button onClick={() => setActiveTab('info')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'info' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            Cihaz Bilgileri
                            {activeTab === 'info' && <motion.div layoutId="assetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                        <button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            Servis Geçmişi
                            <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{assetJobs.length}</span>
                            {activeTab === 'history' && <motion.div layoutId="assetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                        <button onClick={() => setActiveTab('faults')} className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${activeTab === 'faults' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            Arıza
                            <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{assetFaults.length}</span>
                            {activeTab === 'faults' && <motion.div layoutId="assetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                        <button onClick={() => setActiveTab('emergencies')} className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${activeTab === 'emergencies' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            Acil Durum
                            <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{assetEmergencies.length}</span>
                            {activeTab === 'emergencies' && <motion.div layoutId="assetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                    </div>
                  )}
              </div>

              {/* MASAÜSTÜ BUTONLAR */}
              <div className="hidden sm:flex items-center gap-1.5 self-start shrink-0">
                  {userRole === 'Patron' && !isEditing && (
                      <button onClick={handleDelete} title="Varlığı Sil" className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all"><Trash2 size={18} /></button>
                  )}
                  <button onClick={handleToggleEdit} title="Düzenle" className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-blue-500 hover:bg-blue-100'}`}><Edit size={18} /></button>
                  <button onClick={handleClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-all"><X size={20} /></button>
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-white relative">
                
                {isEditing ? (
                   <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-4">
                       <div className="bg-blue-50 text-blue-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-2 border border-blue-100">
                           <Edit size={16} /> Varlık Profilini Düzenliyorsunuz
                       </div>
                       
                       <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Apartman / Tesis Adı</label>
                          <input type="text" placeholder="Örn: Akdeniz Apartmanı" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={editForm.apartmentName || editForm.apartment_name || ''} onChange={e => setEditForm({...editForm, apartmentName: e.target.value})} />
                       </div>

                       <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Cihaz / Varlık Türü</label>
                          <input type="text" placeholder="Örn: Yük Asansörü" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                       </div>
                       
                       <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ait Olduğu Müşteri</label>
                          <div className="space-y-2">
                              <div className="relative">
                                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input 
                                      type="text" 
                                      placeholder="Müşteri Ara..." 
                                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all"
                                      value={customerSearch}
                                      onChange={(e) => setCustomerSearch(e.target.value)}
                                  />
                              </div>
                              <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={editForm.customer_id || ''} onChange={e => setEditForm({...editForm, customer_id: e.target.value})}>
                                  <option value="">Bağımsız / Müşteri Atanmamış</option>
                                  {filteredCustomers.map((c: any) => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                              </select>
                          </div>
                       </div>
                       
                        <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl space-y-3">
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                <MapPin size={14} /> Konum / Adres Bilgileri
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <select className="px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}>
                                    <option value="">İl Seçin</option>
                                    {Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select className="px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none disabled:opacity-50" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity}>
                                    <option value="">İlçe Seçin</option>
                                    {selectedCity && CITY_DATA[selectedCity]?.map((d:string) => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input className="w-full sm:w-1/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="Bina/Kapı No" />
                                <textarea rows={2} className="w-full sm:w-2/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all resize-none" placeholder="Mahalle, Cadde veya Sokak Bilgisi" value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} />
                            </div>
                        </div>
                       
                       <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Varlık / Cihaz Detayları</label>
                          <textarea rows={3} placeholder="Teknik detaylar, kapasite, marka, model veya özel notlar..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all resize-none" value={editForm.asset_details || ''} onChange={e => setEditForm({...editForm, asset_details: e.target.value})} />
                       </div>
                       
                       <div className="pt-2">
                           <button disabled={isSaving} onClick={handleSaveEdit} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex justify-center items-center">
                               {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} className="mr-2" /> Değişiklikleri Kaydet</>}
                           </button>
                       </div>
                   </motion.div>
                ) : (
                  <AnimatePresence mode="wait">
                    {activeTab === 'info' && (
                      <motion.div key="info" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                          
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-all">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                  <User size={14} /> AİT OLDUĞU MÜŞTERİ
                              </div>
                              {assetOwner ? (
                                  <div 
                                    onClick={() => {
                                        if (setSelectedCustomer) {
                                            // 🚀 Müşteriyi açtığımızı state'e kaydedip üst modalı tetikliyoruz
                                            setOpenedChild('customer');
                                            setSelectedCustomer(assetOwner);
                                        }
                                    }} 
                                    className="flex justify-between items-center cursor-pointer group"
                                  >
                                      <div>
                                          <div className="text-sm font-black text-slate-800 group-hover:text-blue-700 transition-colors">{assetOwner.name}</div>
                                          <div className="text-xs font-medium text-slate-500 mt-0.5">{assetOwner.contact || 'Telefon kayıtlı değil'}</div>
                                      </div>
                                      <div className="p-2 bg-white rounded-lg border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50 transition-all">
                                          <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-sm font-medium text-amber-600 flex items-center gap-2">
                                      <AlertCircle size={16} /> Herhangi bir müşteriye atanmamış. Bağımsız varlık.
                                  </div>
                              )}
                          </div>

                          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3"><MapPin size={16} /></div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Konum / Adres</div>
                              <div className="text-sm font-bold text-slate-800 mb-3">{selectedAsset.location || 'Belirtilmedi'}</div>
                              
                              {/* 🚀 EKLENDİ: Haritada Göster Butonu */}
                              {selectedAsset.location && (
                                  <button 
                                      onClick={() => {
                                          window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedAsset.location)}`, '_blank');
                                      }}
                                      className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-200 hover:border-blue-200 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                                  >
                                      <MapPin size={14} /> Google Haritalar'da Aç
                                  </button>
                              )}
                          </div>

                          {selectedAsset.asset_details && (
                              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg w-fit mb-3"><FileText size={16} /></div>
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Varlık / Cihaz Detayları</div>
                                  <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{selectedAsset.asset_details}</div>
                              </div>
                          )}
                      </motion.div>
                    )}

                    {activeTab === 'history' && (
                      <motion.div key="history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                          {assetJobs.length > 0 ? (
                              <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-100">
                                  {assetJobs.map((job: any) => (
                                      <div 
                                        key={job.id} 
                                        onClick={() => {
                                            if (setSelectedJob) {
                                                // 🚀 İşi açtığımızı state'e kaydedip üst modalı tetikliyoruz
                                                setOpenedChild('job');
                                                setSelectedJob(job);
                                            }
                                        }} 
                                        className="relative pl-12 cursor-pointer group"
                                      >
                                          <div className={`absolute left-[13px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white z-10 transition-transform group-hover:scale-125 ${job.status === 'Tamamlandı' ? 'bg-emerald-500' : job.status === 'İptal' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                          
                                          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all">
                                              <div className="flex justify-between items-start mb-2">
                                                  <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{job.work_type}</div>
                                                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusColors[job.status] || 'bg-slate-100 text-slate-600'}`}>
                                                      {job.status}
                                                  </span>
                                              </div>
                                              <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                                                  <Calendar size={12} className="opacity-70" /> {job.created_at?.split('T')[0] || job.scheduled_date || 'Tarih Yok'}
                                                  {job.details?.price && (
                                                      <>
                                                          <span className="mx-1 text-slate-300">•</span>
                                                          <span className="font-bold text-emerald-600">{job.details.price}</span>
                                                      </>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
                                      <Briefcase size={24} />
                                  </div>
                                  <h3 className="text-sm font-bold text-slate-700">İşlem Kaydı Yok</h3>
                                  <p className="text-xs font-medium text-slate-500 mt-1">Bu cihaza/varlığa ait geçmişte yapılmış herhangi bir servis kaydı bulunmuyor.</p>
                              </div>
                          )}
                      </motion.div>
                    )}

                    {activeTab === 'faults' && (
                      <motion.div key="faults" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                          {assetFaults.length > 0 ? (
                              <div className="space-y-3">
                                  {assetFaults.map((fault: any) => (
                                      <div key={fault.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-orange-300 transition-all">
                                          <div className="flex justify-between items-start mb-2 gap-2">
                                              <div className="font-bold text-slate-800 text-sm line-clamp-2">{fault.description || 'Arıza Bildirimi'}</div>
                                              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${fault.status === 'Çözüldü' || fault.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                                  {fault.status || 'Bekliyor'}
                                              </span>
                                          </div>
                                          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                              <Calendar size={12} className="opacity-70" /> {fault.created_at?.split('T')[0] || 'Tarih Yok'}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
                                      <Wrench size={24} />
                                  </div>
                                  <h3 className="text-sm font-bold text-slate-700">Arıza Kaydı Yok</h3>
                                  <p className="text-xs font-medium text-slate-500 mt-1">Bu varlığa ait geçmiş bir arıza kaydı bulunmuyor.</p>
                              </div>
                          )}
                      </motion.div>
                    )}

                    {activeTab === 'emergencies' && (
                      <motion.div key="emergencies" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                          {assetEmergencies.length > 0 ? (
                              <div className="space-y-3">
                                  {assetEmergencies.map((em: any) => (
                                      <div key={em.id} className="p-4 bg-white border border-rose-200 rounded-xl shadow-sm hover:border-rose-300 transition-all">
                                          <div className="flex justify-between items-start mb-2 gap-2">
                                              <div className="font-bold text-rose-700 text-sm flex items-center gap-1.5">
                                                  <Siren size={16} className="shrink-0" /> {em.description || 'Acil Durum Bildirimi'}
                                              </div>
                                              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${em.status === 'Çözüldü' || em.status === 'Tamamlandı' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                                                  {em.status || 'Aktif'}
                                              </span>
                                          </div>
                                          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                              <Calendar size={12} className="opacity-70" /> {em.created_at?.split('T')[0] || 'Tarih Yok'}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                  <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mb-3 border border-rose-100">
                                      <Siren size={24} />
                                  </div>
                                  <h3 className="text-sm font-bold text-slate-700">Acil Durum Kaydı Yok</h3>
                                  <p className="text-xs font-medium text-slate-500 mt-1">Bu varlığa ait geçmiş bir acil durum çağrısı bulunmuyor.</p>
                              </div>
                          )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}