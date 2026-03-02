'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Box, Calendar, Clock, ArrowRight, Settings, Trash2, Loader2, Building2 } from 'lucide-react';
import trCitiesData from '@/lib/data/tr-cities.json';

const CITY_DATA: any = trCitiesData;

export default function CustomerDetailModal({
  selectedCustomer,
  setSelectedCustomer,
  selectedAsset,
  setSelectedAsset,
  data,
  handleAction,
  isSaving,
  selectedJob,
  setSelectedJob,
  isMobile
}: any) {
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({ id: '', name: '', contact: '', address: '', tax_info: '' });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [buildingNo, setBuildingNo] = useState('');

  // 🚀 Yeni Varlık Ekleme / Atama State'leri
  const [assignAssetId, setAssignAssetId] = useState('');
  const [isCreatingAsset, setIsCreatingAsset] = useState(false);
  const [newAssetForm, setNewAssetForm] = useState({ name: '', apartmentName: '' });

  // 🚀 Hangi alt modalın BU modal tarafından açıldığını takip ediyoruz
  const [openedChild, setOpenedChild] = useState<'asset' | 'job' | null>(null);

  // Dışarıdan modal kapandığında local state'i temizle
  useEffect(() => {
    if (!selectedAsset && openedChild === 'asset') setOpenedChild(null);
  }, [selectedAsset, openedChild]);

  useEffect(() => {
    if (!selectedJob && openedChild === 'job') setOpenedChild(null);
  }, [selectedJob, openedChild]);

  // 🚀 isStacked sadece 'biz' bir şey açtıysak veya silme onayı açıksa true olur (iOS Stacking için)
  const isStacked = openedChild !== null || showDeleteConfirm;

  const statusColors: any = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200',
    'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200',
    'Usta Bekliyor': 'bg-indigo-100 text-indigo-700 border-indigo-200'
  };

  const getDynamicStatus = (job: any) => {
    if (!job) return { label: '', colorClass: '' };
    let label = job.status || 'Beklemede';

    const detailWorker = job.details?.worker_id ? true : false;
    const staffWorker = job.staff_id && data?.staff?.find((s:any) => String(s.id) === String(job.staff_id) && s.role !== 'Yönetici');
    const hasWorker = detailWorker || staffWorker;

    if (label === 'Usta Bekliyor' || label === 'Devam Ediyor') {
        label = hasWorker ? 'Devam Ediyor' : 'Usta Bekliyor';
    }

    let colorClass = statusColors[label] || 'bg-slate-100 text-slate-500 border-slate-200';

    if ((label === 'Gelecek' || label === 'Beklemede' || label === 'Usta Bekliyor') && job.scheduled_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sDate = new Date(job.scheduled_date.split(' ')[0]);
        sDate.setHours(0, 0, 0, 0);

        if (sDate < today) {
            label = 'Gecikti';
            colorClass = 'bg-rose-100 text-rose-700 border-rose-200';
        }
    }
    return { label, colorClass };
  };

  const parseAddressToState = (fullAddress: string) => {
    if (!fullAddress) {
        setSelectedCity('');
        setSelectedDistrict('');
        setBuildingNo('');
        return '';
    }

    const parts = fullAddress.split(' / ');
    
    if (parts.length >= 3) {
        const possibleCity = parts[parts.length - 1].trim();
        const possibleDistrict = parts[parts.length - 2].trim();

        if (CITY_DATA[possibleCity]) {
            setSelectedCity(possibleCity);
            setSelectedDistrict(possibleDistrict);
            
            let detailPart = parts.slice(0, parts.length - 2).join(' / ').trim();
            
            const noMatch = detailPart.match(/No:\s*(\S+)/i);
            if (noMatch) {
                setBuildingNo(noMatch[1]);
                detailPart = detailPart.replace(/No:\s*\S+/i, '').trim();
            } else {
                setBuildingNo('');
            }
            return detailPart; 
        }
    }
    
    setSelectedCity('');
    setSelectedDistrict('');
    setBuildingNo('');
    return fullAddress;
  };

  const getFullAddress = (rawAddress: string, bNo: string, city: string, district: string) => {
      let full = rawAddress ? rawAddress.trim() : '';
      if (bNo) full += (full ? ` No:${bNo}` : `No:${bNo}`);
      if (district) full += (full ? ` / ${district}` : district);
      if (city) full += (full ? ` / ${city}` : city);
      return full;
  };

  const handleCloseDetail = () => {
    if (setSelectedCustomer) { 
        setSelectedCustomer(null); 
        setIsEditingCustomer(false);
        setIsCreatingAsset(false);
        setAssignAssetId('');
        setSelectedCity(''); 
        setSelectedDistrict(''); 
        setBuildingNo('');
    }
  };

  const handleSmartClose = useCallback((e?: any) => {
    if (openedChild !== null) return true;

    const stopEvent = () => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        } else if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
            e.nativeEvent.stopImmediatePropagation();
        }
      }
    };

    if (showDeleteConfirm) {
        stopEvent();
        setShowDeleteConfirm(false);
        return true;
    }

    if (isEditingCustomer) {
        stopEvent();
        setIsEditingCustomer(false);
        setIsCreatingAsset(false);
        return true;
    }

    if (selectedCustomer) {
        stopEvent();
        handleCloseDetail();
        return true;
    }

    return false;
  }, [openedChild, showDeleteConfirm, isEditingCustomer, selectedCustomer]);

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
    if (selectedCustomer) {
        window.history.pushState({ customerModal: true }, '');
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (showDeleteConfirm || isEditingCustomer) {
        window.history.pushState({ internalLayer: true }, '');
    }
  }, [showDeleteConfirm, isEditingCustomer]);

  useEffect(() => {
    if (!selectedCustomer) return;

    const handlePopState = (e: PopStateEvent) => {
      handleSmartClose(e);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedCustomer, handleSmartClose]);

  return (
    <>
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div 
            key="modal-backdrop-customer-detail"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.15 }}
            className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${isStacked ? 'z-[10]' : 'z-[120]'}`}
          >
            <div 
               className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isStacked ? 'opacity-0' : 'opacity-100'} cursor-pointer`} 
               onClick={() => !isStacked && handleCloseDetail()}
            ></div>
            
            <motion.div 
              key="modal-content-customer-detail"
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
              className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden cursor-default z-10"
            >
              
              <div className="flex justify-between items-start p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                <div><h2 className="text-xl font-black text-slate-900 leading-tight">{selectedCustomer?.name}</h2><div className="text-xs font-medium text-slate-500 mt-1">Müşteri / Kurum Profili</div></div>
                <button onClick={handleCloseDetail} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6">
                  {!isEditingCustomer ? (
                      <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İletişim / Telefon</div><div className="text-sm font-bold text-slate-800 mt-1.5">{selectedCustomer?.contact || '-'}</div></div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vergi No / T.C.</div><div className="text-sm font-bold text-slate-800 mt-1.5">{selectedCustomer?.tax_info || '-'}</div></div>
                          <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Açık Adres</div>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1.5 gap-3">
                                <div className="text-sm font-medium text-slate-800 leading-relaxed">{selectedCustomer?.address || 'Adres belirtilmemiş.'}</div>
                                {selectedCustomer?.address && (
                                  <a href={`http://maps.google.com/?q=${encodeURIComponent(selectedCustomer.address || '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg transition-all active:scale-95 whitespace-nowrap shrink-0 shadow-sm"><MapPin size={14} /> Haritada Gör</a>
                                )}
                              </div>
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <h4 className="text-[11px] font-black text-blue-600 mb-2 uppercase tracking-widest flex items-center gap-1.5"><Box size={14}/> Kayıtlı Cihazları / Varlıkları</h4>
                              <div className="space-y-2">
                                  {(data?.assets || []).filter((a: any) => a.customer_id === selectedCustomer?.id).length > 0 ? (data?.assets || []).filter((a: any) => a.customer_id === selectedCustomer?.id).map((a: any) => {
                                      const aptName = a.apartmentName || a.apartment_name;
                                      return (
                                          <div 
                                              key={a.id} 
                                              onClick={() => { 
                                                  // 🚀 KİMİ AÇTIĞIMIZI BİLDİRİYORUZ
                                                  setOpenedChild('asset');
                                                  if(setSelectedAsset) setSelectedAsset(a); 
                                              }} 
                                              className="p-4 border border-blue-200 rounded-xl bg-blue-50/50 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all active:scale-95 group flex flex-col justify-center gap-1.5"
                                          >
                                              <div className="flex items-center gap-2 text-blue-700 font-black text-sm">
                                                  <Building2 size={16} className="shrink-0" />
                                                  <span className="truncate">{aptName || 'Bağımsız Adres'}</span>
                                              </div>
                                              <div className="flex items-center justify-between ml-6 mt-1">
                                                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs">
                                                      <Box size={14} className="shrink-0" /> 
                                                      <span>{a.name}</span>
                                                  </div>
                                                  {/* 🚀 SADECE HARİTADA GÖSTER BUTONU */}
                                                  {(a.location || selectedCustomer?.address) && (
                                                      <a 
                                                          href={`http://maps.google.com/?q=${encodeURIComponent(a.location || selectedCustomer?.address || '')}`} 
                                                          target="_blank" 
                                                          rel="noopener noreferrer" 
                                                          onClick={(e) => e.stopPropagation()} 
                                                          className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100/50 hover:bg-blue-200 px-2.5 py-1.5 rounded-md transition-all active:scale-95 whitespace-nowrap shrink-0 shadow-sm"
                                                      >
                                                          <MapPin size={12} /> Haritada Göster
                                                      </a>
                                                  )}
                                              </div>
                                          </div>
                                      );
                                  }) : <div className="text-center p-5 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">Müşteriye ait cihaz bulunmuyor.</div>}
                              </div>
                          </div>
                          
                          <div>
                              <h4 className="text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={14}/> Geçmiş İş Kayıtları</h4>
                              
                              {/* 🚀 KUTU İÇİ SCROLL VE SABİT BOY */}
                              {(data?.jobs || []).filter((j: any) => j.customer_name === selectedCustomer?.name).length > 0 ? (
                                  <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                                      {(data?.jobs || []).filter((j: any) => j.customer_name === selectedCustomer?.name).map((j: any) => {
                                          const dynamicStatus = getDynamicStatus(j);
                                          const asset = (data?.assets || []).find((a: any) => String(a.id) === String(j.asset_id));
                                          const aptName = asset?.apartmentName || asset?.apartment_name || '';
                                          const displayAsset = aptName ? `${aptName} - ${asset?.name || 'Varlık'}` : (asset?.name || 'Bağımsız Müşteri İşlemi');
                                          const jobDate = j.created_at?.split('T')[0] || j.scheduled_date?.split(' ')[0] || 'Tarih Yok';

                                          return (
                                              <div 
                                                key={j.id} 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    // 🚀 iOS STACKING İÇİN AÇILAN MODALI BİLDİRİYORUZ
                                                    setOpenedChild('job');
                                                    if(setSelectedJob) setSelectedJob(j); 
                                                }} 
                                                className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-95 group ${selectedJob?.id === j.id ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm'}`}
                                              >
                                                  <div className="min-w-0 pr-2 flex-1">
                                                      <div className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors truncate">{j.work_type || 'Görev'}</div>
                                                      
                                                      {/* 🚀 APARTMAN ADI VE VARLIK TÜRÜ */}
                                                      <div className="text-[11px] font-semibold text-slate-600 mt-1.5 flex items-center gap-1.5 truncate">
                                                          <Box size={12} className="shrink-0 text-blue-500" />
                                                          <span className="truncate">{displayAsset}</span>
                                                      </div>
                                                      
                                                      {/* 🚀 TARİH */}
                                                      <div className="text-[10px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                                                          <Calendar size={10} className={dynamicStatus.label === 'Gecikti' ? 'text-rose-500' : 'text-slate-400'}/> 
                                                          {jobDate}
                                                      </div>
                                                  </div>
                                                  <div className="flex flex-col items-end justify-center gap-2 shrink-0">
                                                      <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm ${dynamicStatus.colorClass}`}>
                                                          {dynamicStatus.label}
                                                      </span>
                                                      <ArrowRight size={16} className={`transition-all ${selectedJob?.id === j.id ? 'text-blue-600 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              ) : (
                                  <div className="text-center p-5 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">Müşteriye ait iş kaydı bulunmuyor.</div>
                              )}
                          </div>
                      </div>

                      <div className="pt-5 border-t border-slate-100">
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                          <button onClick={() => { setIsEditingCustomer(true); setEditCustomerForm({ id: selectedCustomer.id, name: selectedCustomer.name, contact: selectedCustomer.contact || '', address: parseAddressToState(selectedCustomer.address || ''), tax_info: selectedCustomer.tax_info || '' }); }} className="flex-[2] bg-slate-900 text-white py-3.5 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"><Settings size={16} /> Profili Düzenle</button>
                              <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 bg-rose-50 border border-rose-200 text-rose-600 py-3.5 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16} /> Sil</button>
                          </div>
                      </div>
                      </div>
                  ) : (
                        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ad / Firma Ünvanı</label>
                                <input className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold w-full outline-none focus:border-blue-500 focus:bg-white transition-all" value={editCustomerForm.name} onChange={(e) => setEditCustomerForm({...editCustomerForm, name: e.target.value})} placeholder="Ad / Firma" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">İletişim / Telefon</label>
                                <input className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none focus:border-blue-500 focus:bg-white transition-all" value={editCustomerForm.contact} onChange={(e) => setEditCustomerForm({...editCustomerForm, contact: e.target.value})} placeholder="Telefon Numarası" />
                            </div>
                            
                            <div className="sm:col-span-2 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adres Bilgileri</div>
                                <div className="grid grid-cols-2 gap-3">
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
                                  <input className="w-full sm:w-1/3 px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white bg-slate-50 transition-all" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="Bina/Kapı No" />
                                  <input className="w-full sm:w-2/3 px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white bg-slate-50 transition-all" value={editCustomerForm.address} onChange={(e) => setEditCustomerForm({...editCustomerForm, address: e.target.value})} placeholder="Mahalle, Cadde, Sokak..." />
                                </div>
                            </div>
                            
                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vergi Bilgileri</label>
                                <input className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none focus:border-blue-500 focus:bg-white transition-all" value={editCustomerForm.tax_info} onChange={(e) => setEditCustomerForm({...editCustomerForm, tax_info: e.target.value})} placeholder="Vergi Dairesi ve No / T.C." />
                            </div>

                            {/* 🚀 MÜŞTERİ DÜZENLERKEN VARLIKLARIN GÖRÜNMESİ VE YÖNETİLMESİ */}
                            <div className="sm:col-span-2 pt-4 mt-2 border-t border-slate-200">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Müşteriye Kayıtlı Varlıklar</label>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    {(data?.assets || []).filter((a: any) => a.customer_id === selectedCustomer?.id).map((a: any) => (
                                        <div key={a.id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm text-xs flex flex-col gap-2 relative group">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-slate-800">{a.apartmentName || a.apartment_name || 'Bağımsız Adres'}</div>
                                                    <div className="font-medium text-slate-500 flex items-center gap-1.5 mt-1"><Box size={12} /> {a.name}</div>
                                                </div>
                                                {/* Müşteriden Çıkar Butonu */}
                                                <button 
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        await handleAction('update-asset', { id: a.id, customer_id: null });
                                                    }} 
                                                    title="Müşteriden Çıkar"
                                                    className="p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            
                                            {/* Sadece Haritada Göster Butonu */}
                                            {(a.location || editCustomerForm.address) && (
                                                <div className="flex justify-end border-t border-slate-50 pt-2 mt-1">
                                                    <a 
                                                        href={`http://maps.google.com/?q=${encodeURIComponent(a.location || editCustomerForm.address || '')}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        onClick={(e) => e.stopPropagation()} 
                                                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-all shrink-0"
                                                    >
                                                        <MapPin size={12} /> Haritada Göster
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(data?.assets || []).filter((a: any) => a.customer_id === selectedCustomer?.id).length === 0 && (
                                        <div className="text-xs font-medium text-slate-400 col-span-1 sm:col-span-2 p-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
                                            Müşteriye kayıtlı varlık bulunmamaktadır.
                                        </div>
                                    )}
                                </div>

                                {/* YENİ VARLIK EKLEME / ATAMA ALANI */}
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3 shadow-inner">
                                    <h5 className="text-[11px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                                        <Box size={14} /> Varlık Ekle / Ata
                                    </h5>
                                    
                                    {!isCreatingAsset ? (
                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <select 
                                                    className="flex-1 px-3 py-2.5 border border-blue-200 rounded-lg text-xs font-semibold outline-none bg-white focus:border-blue-500 transition-all appearance-none"
                                                    value={assignAssetId}
                                                    onChange={(e) => setAssignAssetId(e.target.value)}
                                                >
                                                    <option value="">Boştaki bir varlığı seçin...</option>
                                                    {(data?.assets || []).filter((a: any) => !a.customer_id).map((a: any) => (
                                                        <option key={a.id} value={a.id}>{a.apartmentName || a.apartment_name || 'İsimsiz'} - {a.name}</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    disabled={!assignAssetId || isSaving}
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        await handleAction('update-asset', { id: assignAssetId, customer_id: selectedCustomer.id });
                                                        setAssignAssetId('');
                                                    }}
                                                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shrink-0"
                                                >
                                                    {isSaving && assignAssetId ? <Loader2 size={14} className="animate-spin" /> : 'Seçileni Ata'}
                                                </button>
                                            </div>
                                            <div className="relative flex py-2 items-center">
                                                <div className="flex-grow border-t border-blue-200"></div>
                                                <span className="flex-shrink-0 mx-4 text-blue-400 text-[10px] font-bold uppercase tracking-widest">veya</span>
                                                <div className="flex-grow border-t border-blue-200"></div>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.preventDefault(); setIsCreatingAsset(true); }}
                                                className="w-full bg-white text-blue-600 border border-blue-200 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"
                                            >
                                                + Sıfırdan Yeni Varlık Oluştur
                                            </button>
                                        </div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                                            <input 
                                                type="text" 
                                                placeholder="Apartman / Tesis Adı" 
                                                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                                                value={newAssetForm.apartmentName}
                                                onChange={e => setNewAssetForm({...newAssetForm, apartmentName: e.target.value})}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Cihaz / Varlık Türü (Örn: Asansör)" 
                                                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                                                value={newAssetForm.name}
                                                onChange={e => setNewAssetForm({...newAssetForm, name: e.target.value})}
                                            />
                                            <div className="flex gap-2 pt-1">
                                                <button 
                                                    disabled={!newAssetForm.name || isSaving}
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        const combinedAddress = getFullAddress(editCustomerForm.address, buildingNo, selectedCity, selectedDistrict);
                                                        await handleAction('add-asset', { ...newAssetForm, customer_id: selectedCustomer.id, location: combinedAddress });
                                                        setIsCreatingAsset(false);
                                                        setNewAssetForm({ name: '', apartmentName: '' });
                                                    }}
                                                    className="flex-[2] bg-emerald-600 text-white py-2 rounded-md text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex justify-center items-center"
                                                >
                                                    {isSaving && !assignAssetId ? <Loader2 size={14} className="animate-spin" /> : 'Kaydet ve Ata'}
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.preventDefault(); setIsCreatingAsset(false); }}
                                                    className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-md text-xs font-bold hover:bg-slate-200 transition-all"
                                                >
                                                    İptal
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 mt-2 border-t border-slate-200">
                            <button 
                                onClick={() => {
                                    const combined = getFullAddress(editCustomerForm.address, buildingNo, selectedCity, selectedDistrict);
                                    handleAction('update-customer', { ...editCustomerForm, address: combined }, handleCloseDetail, () => setIsEditingCustomer(false))
                                }} 
                                className="flex-[2] bg-blue-600 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-200 flex justify-center items-center"
                            >
                                {isSaving && assignAssetId === '' && !isCreatingAsset ? <Loader2 className="animate-spin" size={18} /> : 'Değişiklikleri Kaydet'}
                            </button>
                            <button onClick={() => { setIsEditingCustomer(false); setIsCreatingAsset(false); setAssignAssetId(''); }} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95">İptal</button>
                          </div>
                        </div>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center border border-slate-200"
            >
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Müşteriyi Sil</h3>
              <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                <span className="text-slate-800 font-bold">{selectedCustomer?.name}</span> adlı müşteriyi ve ona bağlı olan cihazları sistemden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  disabled={isSaving}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                >
                  Vazgeç
                </button>
                <button 
                  onClick={async () => { 
                    await handleAction('delete-customer', { id: selectedCustomer.id }, handleCloseDetail, () => {}); 
                    setShowDeleteConfirm(false);
                  }} 
                  disabled={isSaving}
                  className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Evet, Sil'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}