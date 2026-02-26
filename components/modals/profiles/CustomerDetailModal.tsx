'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Box, Calendar, Clock, ArrowRight, Settings, Trash2, Loader2 } from 'lucide-react';
import trCitiesData from '@/lib/data/tr-cities.json';

const CITY_DATA: any = trCitiesData;

export default function CustomerDetailModal({
  showCustomerDetail,
  setShowCustomerDetail,
  setShowAssetDetail,
  data,
  handleAction,
  isSaving,
  selectedJob,
  setSelectedJob,
  isMobile
}: any) {
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({ id: '', name: '', contact: '', address: '', taxInfo: '' });
  
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [buildingNo, setBuildingNo] = useState('');

  const statusColors: any = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200',
    'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200'
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
      if (bNo) full += ` No:${bNo}`;
      if (district) full += ` / ${district}`;
      if (city) full += ` / ${city}`;
      return full;
  };

  const handleCloseDetail = () => {
    if (setShowCustomerDetail) { 
        setShowCustomerDetail(null); 
        setIsEditingCustomer(false);
        setSelectedCity(''); 
        setSelectedDistrict(''); 
        setBuildingNo('');
    }
  };

  return (
    <AnimatePresence>
      {showCustomerDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={handleCloseDetail}></div>
          <motion.div initial={{ opacity: 0, scale: 0.95, x: selectedJob && !isMobile ? -280 : 0 }} animate={{ opacity: 1, scale: 1, x: selectedJob && !isMobile ? -280 : 0 }} exit={{ opacity: 0, scale: 0.95, x: selectedJob && !isMobile ? -280 : 0 }} className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative flex flex-col max-h-[85vh] transition-transform duration-300 pointer-events-auto overflow-hidden">
            
            <div className="flex justify-between items-start p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
              <div><h2 className="text-xl font-black text-slate-900 leading-tight">{showCustomerDetail?.name}</h2><div className="text-xs font-medium text-slate-500 mt-1">Müşteri / Kurum Profili</div></div>
              <button onClick={handleCloseDetail} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6">
                {!isEditingCustomer ? (
                    <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İletişim / Telefon</div><div className="text-sm font-bold text-slate-800 mt-1.5">{showCustomerDetail?.contact || '-'}</div></div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vergi No / T.C.</div><div className="text-sm font-bold text-slate-800 mt-1.5">{showCustomerDetail?.tax_info || '-'}</div></div>
                        <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Açık Adres</div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1.5 gap-3">
                              <div className="text-sm font-medium text-slate-800 leading-relaxed">{showCustomerDetail?.address || 'Adres belirtilmemiş.'}</div>
                              {showCustomerDetail?.address && (
                                <a href={`http://maps.google.com/?q=${encodeURIComponent(showCustomerDetail.address || '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg transition-all active:scale-95 whitespace-nowrap shrink-0 shadow-sm"><MapPin size={14} /> Haritada Gör</a>
                              )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-[11px] font-black text-blue-600 mb-2 uppercase tracking-widest flex items-center gap-1.5"><Box size={14}/> Kayıtlı Cihazları / Varlıkları</h4>
                            <div className="space-y-2">
                                {(data?.assets || []).filter((a: any) => a.customer_id === showCustomerDetail?.id).length > 0 ? (data?.assets || []).filter((a: any) => a.customer_id === showCustomerDetail?.id).map((a: any) => (
                                    <div key={a.id} onClick={() => { setShowCustomerDetail(null); setShowAssetDetail(a); }} className="p-4 border border-blue-200 rounded-xl bg-blue-50/50 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all active:scale-95 group">
                                        <div className="font-bold text-sm text-blue-900 group-hover:text-blue-700 transition-colors">{a.name}</div>
                                        <div className="text-[11px] font-medium text-blue-600/80 mt-1 flex items-center gap-1"><MapPin size={10}/> {a.location || 'Konum Yok'}</div>
                                    </div>
                                )) : <div className="text-center p-5 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">Müşteriye ait cihaz bulunmuyor.</div>}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={14}/> Geçmiş İş Kayıtları</h4>
                            <div className="space-y-2">
                                {(data?.jobs || []).filter((j: any) => j.customer_name === showCustomerDetail?.name).length > 0 ? (data?.jobs || []).filter((j: any) => j.customer_name === showCustomerDetail?.name).map((j: any) => (
                                    <div key={j.id} onClick={(e) => { e.stopPropagation(); setSelectedJob(j); }} className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-95 group ${selectedJob?.id === j.id ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm'}`}>
                                        <div className="min-w-0 pr-2">
                                            <div className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors truncate">{j.work_type || 'Görev'}</div>
                                            <div className="text-[10px] font-medium text-slate-500 mt-1 flex items-center gap-1"><Clock size={10}/> {j.scheduled_date || 'Anlık Kayıt'}</div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                                            <ArrowRight size={16} className={`transition-all ${selectedJob?.id === j.id ? 'text-blue-600 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                                        </div>
                                    </div>
                                )) : <div className="text-center p-5 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">Müşteriye ait iş kaydı bulunmuyor.</div>}
                            </div>
                        </div>
                    </div>

                    <div className="pt-5 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                            <button onClick={() => { setIsEditingCustomer(true); setEditCustomerForm({ id: showCustomerDetail.id, name: showCustomerDetail.name, contact: showCustomerDetail.contact || '', address: parseAddressToState(showCustomerDetail.address || ''), taxInfo: showCustomerDetail.tax_info || '' }); }} className="flex-[2] bg-slate-900 text-white py-3.5 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"><Settings size={16} /> Profili Düzenle</button>
                            <button onClick={async () => { if(confirm(`${showCustomerDetail.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-customer', { id: showCustomerDetail.id }, handleCloseDetail, () => {}); } }} className="flex-1 bg-rose-50 border border-rose-200 text-rose-600 py-3.5 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16} /> Sil</button>
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
                              <input className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none focus:border-blue-500 focus:bg-white transition-all" value={editCustomerForm.taxInfo} onChange={(e) => setEditCustomerForm({...editCustomerForm, taxInfo: e.target.value})} placeholder="Vergi Dairesi ve No / T.C." />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 mt-2 border-t border-slate-200">
                          <button 
                              onClick={() => {
                                  const combined = getFullAddress(editCustomerForm.address, buildingNo, selectedCity, selectedDistrict);
                                  handleAction('update-customer', { ...editCustomerForm, address: combined }, handleCloseDetail, () => setIsEditingCustomer(false))
                              }} 
                              className="flex-[2] bg-blue-600 text-white py-3.5 sm:py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-200 flex justify-center items-center"
                          >
                              {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Değişiklikleri Kaydet'}
                          </button>
                          <button onClick={() => setIsEditingCustomer(false)} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 sm:py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95">İptal</button>
                        </div>
                      </div>
                )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}