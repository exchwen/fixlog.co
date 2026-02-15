'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trash2, Loader2, Search, User, Box } from 'lucide-react';

export default function DashboardModals({
  showStaffDetail, setShowStaffDetail, isEditingStaff, setIsEditingStaff, editStaffForm, setEditStaffForm,
  showCustomerDetail, setShowCustomerDetail,
  showAssetDetail, setShowAssetDetail,
  showJobModal, setShowJobModal, jobForm, setJobForm,
  showAssetModal, setShowAssetModal, assetForm, setAssetForm,
  showStaffModal, setShowStaffModal, staffForm, setStaffForm,
  showCustomerModal, setShowCustomerModal, customerForm, setCustomerForm,
  showStockModal, setShowStockModal, stockForm, setStockForm,
  handleAction, isSaving, data
}: any) {
  
  const [searchTerm, setSearchTerm] = useState('');

  // İş Emri İçin Birleştirilmiş Arama Listesi (Müşteri + Varlık)
  const combinedSearchList = useMemo(() => {
    const customers = (data?.customers || []).map((c: any) => ({ 
      ...c, 
      searchType: 'CUSTOMER', 
      displayName: c.name, 
      subName: c.contact || 'Müşteri' 
    }));
    const assets = (data?.assets || []).map((a: any) => ({ 
      ...a, 
      searchType: 'ASSET', 
      displayName: a.name, 
      subName: a.location || 'Varlık' 
    }));
    
    return [...customers, ...assets].filter(item => 
      item.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.subName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({ id: '', name: '', contact: '', address: '', taxInfo: '' });

  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [editAssetForm, setEditAssetForm] = useState({ id: '', name: '', location: '', apartmentName: '', deviceDetails: '' });

  const handleCloseDetail = (type: string) => {
    if (type === 'customer' && setShowCustomerDetail) { setShowCustomerDetail(null); setIsEditingCustomer(false); }
    if (type === 'asset' && setShowAssetDetail) { setShowAssetDetail(null); setIsEditingAsset(false); }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowJobModal(false); setShowAssetModal(false); setShowStaffModal(false); 
        setShowCustomerModal(false); setShowStockModal(false); setShowStaffDetail(null);
        handleCloseDetail('customer'); handleCloseDetail('asset');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowJobModal, setShowAssetModal, setShowStaffModal, setShowCustomerModal, setShowStockModal, setShowStaffDetail, setShowCustomerDetail, setShowAssetDetail]);

  const statusColors: any = { 'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <>
      {/* PERSONEL DETAY MODALI */}
      <AnimatePresence>
        {showStaffDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl relative flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-start mb-6">
                <div><h2 className="text-xl font-bold text-slate-900">{showStaffDetail.name}</h2><div className="text-xs text-slate-500 mt-0.5">Personel Dosyası</div></div>
                <button onClick={() => setShowStaffDetail(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Branş/Rol</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showStaffDetail.branch || showStaffDetail.role}</div></div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Statü</div><div className="text-xs font-medium text-blue-600 mt-0.5">{showStaffDetail.status}</div></div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Telefon</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showStaffDetail.phone || '-'}</div></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-6 custom-scrollbar">
                 <h4 className="text-[11px] font-semibold text-slate-500 mb-2">GÖREV GEÇMİŞİ</h4>
                 {(data?.jobs || []).filter((j: any) => j.staff_id === showStaffDetail.id).length > 0 ? (data?.jobs || []).filter((j: any) => j.staff_id === showStaffDetail.id).map((j: any) => (
                   <div key={j.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-white text-xs">
                      <div><div className="font-semibold text-slate-800">{j.customer_name}</div><div className="text-[10px] text-slate-500 mt-0.5">{j.scheduled_date || 'Anlık'}</div></div>
                      <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                   </div>
                 )) : <div className="text-center p-6 text-slate-400 text-xs bg-slate-50 rounded-lg">Geçmiş görev bulunmuyor.</div>}
              </div>
              <div className="pt-4 border-t border-slate-100">
                 {!isEditingStaff ? (
                   <div className="flex gap-2 w-full">
                     <button onClick={() => setIsEditingStaff(true)} className="flex-[2] bg-slate-100 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"><Settings size={14} /> Düzenle</button>
                     <button onClick={async () => { if(confirm(`${showStaffDetail.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-staff', { id: showStaffDetail.id }, () => setShowStaffDetail(null), () => {}); } }} className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={14} /> Sil</button>
                   </div>
                 ) : (
                   <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <div className="grid grid-cols-2 gap-3">
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.name} onChange={(e) => setEditStaffForm({...editStaffForm, name: e.target.value})} placeholder="Ad Soyad" />
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.phone} onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})} placeholder="Telefon" />
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.branch} onChange={(e) => setEditStaffForm({...editStaffForm, branch: e.target.value})} placeholder="Branş" />
                       <select className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none bg-white focus:border-blue-400" value={editStaffForm.status} onChange={(e) => setEditStaffForm({...editStaffForm, status: e.target.value})}><option value="Aktif">Aktif</option><option value="Sahada">Sahada</option><option value="Mesai Dışı">Mesai Dışı</option></select>
                     </div>
                     <div className="flex gap-2 pt-2">
                       <button onClick={() => handleAction('add-staff', { ...editStaffForm, id: showStaffDetail.id }, () => setShowStaffDetail(null), () => setIsEditingStaff(false))} className="flex-1 bg-blue-600 text-white py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700">{isSaving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Kaydet'}</button>
                       <button onClick={() => setIsEditingStaff(false)} className="px-4 bg-slate-200 text-slate-700 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-300">İptal</button>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MÜŞTERİ DETAY MODALI */}
      <AnimatePresence>
        {showCustomerDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl relative flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-start mb-6">
                <div><h2 className="text-xl font-bold text-slate-900">{showCustomerDetail.name}</h2><div className="text-xs text-slate-500 mt-0.5">Müşteri Profili</div></div>
                <button onClick={() => handleCloseDetail('customer')} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">İletişim / Telefon</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showCustomerDetail.contact || '-'}</div></div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Vergi No / T.C.</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showCustomerDetail.tax_info || '-'}</div></div>
                 <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Adres</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showCustomerDetail.address || '-'}</div></div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-6 custom-scrollbar">
                 <div>
                   <h4 className="text-[11px] font-semibold text-blue-600 mb-2 uppercase tracking-wider">Kayıtlı Cihazları / Varlıkları</h4>
                   {(data?.assets || []).filter((a: any) => a.customer_id === showCustomerDetail.id).length > 0 ? (data?.assets || []).filter((a: any) => a.customer_id === showCustomerDetail.id).map((a: any) => (
                     // DEĞİŞİM BURADA: Cihaza Tıklanınca Müşteriyi Kapatıp Cihazı Açıyor
                     <div 
                        key={a.id} 
                        onClick={() => { setShowCustomerDetail(null); setShowAssetDetail(a); }}
                        className="p-3 border border-blue-100 rounded-lg bg-blue-50/30 text-xs mb-2 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all"
                     >
                        <div className="font-semibold text-blue-800">{a.name}</div>
                        <div className="text-[10px] text-blue-600/80 mt-0.5">{a.location || ''}</div>
                     </div>
                   )) : <div className="text-center p-4 text-slate-400 text-xs bg-slate-50 rounded-lg">Kayıtlı cihaz bulunmuyor.</div>}
                 </div>

                 <div>
                   <h4 className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Geçmiş İş Kayıtları</h4>
                   {(data?.jobs || []).filter((j: any) => j.customer_name === showCustomerDetail.name).length > 0 ? (data?.jobs || []).filter((j: any) => j.customer_name === showCustomerDetail.name).map((j: any) => (
                     <div key={j.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-white text-xs mb-2">
                        <div><div className="font-semibold text-slate-800">{j.work_type || 'Görev'}</div><div className="text-[10px] text-slate-500 mt-0.5">{j.scheduled_date || 'Anlık'}</div></div>
                        <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                     </div>
                   )) : <div className="text-center p-4 text-slate-400 text-xs bg-slate-50 rounded-lg">Geçmiş iş kaydı bulunmuyor.</div>}
                 </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                 {!isEditingCustomer ? (
                   <div className="flex gap-2 w-full">
                     <button onClick={() => { setIsEditingCustomer(true); setEditCustomerForm({ id: showCustomerDetail.id, name: showCustomerDetail.name, contact: showCustomerDetail.contact || '', address: showCustomerDetail.address || '', taxInfo: showCustomerDetail.tax_info || '' }); }} className="flex-[2] bg-slate-100 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"><Settings size={14} /> Düzenle</button>
                     <button onClick={async () => { if(confirm(`${showCustomerDetail.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-customer', { id: showCustomerDetail.id }, () => handleCloseDetail('customer'), () => {}); } }} className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={14} /> Sil</button>
                   </div>
                 ) : (
                   <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <div className="grid grid-cols-2 gap-3">
                       <input className="px-3 py-2 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editCustomerForm.name} onChange={(e) => setEditCustomerForm({...editCustomerForm, name: e.target.value})} placeholder="Ad / Firma" />
                       <input className="px-3 py-2 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editCustomerForm.contact} onChange={(e) => setEditCustomerForm({...editCustomerForm, contact: e.target.value})} placeholder="Telefon" />
                       <input className="col-span-2 px-3 py-2 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editCustomerForm.address} onChange={(e) => setEditCustomerForm({...editCustomerForm, address: e.target.value})} placeholder="Açık Adres" />
                       <input className="col-span-2 px-3 py-2 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editCustomerForm.taxInfo} onChange={(e) => setEditCustomerForm({...editCustomerForm, taxInfo: e.target.value})} placeholder="Vergi No / T.C." />
                     </div>
                     <div className="flex gap-2 pt-2">
                       <button onClick={() => handleAction('update-customer', editCustomerForm, () => handleCloseDetail('customer'), () => setIsEditingCustomer(false))} className="flex-1 bg-blue-600 text-white py-2 rounded-md text-xs font-semibold hover:bg-blue-700">{isSaving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Değişiklikleri Kaydet'}</button>
                       <button onClick={() => setIsEditingCustomer(false)} className="px-4 bg-slate-200 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-300">İptal</button>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VARLIK (CİHAZ) DETAY MODALI */}
      <AnimatePresence>
        {showAssetDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl relative flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-start mb-6">
                <div><h2 className="text-xl font-bold text-slate-900">{showAssetDetail.name}</h2><div className="text-xs text-slate-500 mt-0.5">Cihaz / Varlık Profili</div></div>
                <button onClick={() => handleCloseDetail('asset')} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Sahibi (Müşteri)</div>
                    {/* DEĞİŞİM BURADA: Müşteri İsmine Tıklanınca Cihazı Kapatıp Müşteriyi Açıyor */}
                    <div className="text-xs font-medium text-blue-600 mt-0.5">
                       {showAssetDetail.customer_id ? (() => {
                          const cust = (data?.customers || []).find((c: any) => c.id === showAssetDetail.customer_id);
                          return cust ? (
                             <span 
                               onClick={() => { setShowAssetDetail(null); setShowCustomerDetail(cust); }} 
                               className="cursor-pointer hover:underline"
                             >
                               {cust.name}
                             </span>
                          ) : 'Bilinmiyor';
                       })() : 'Bağımsız Cihaz'}
                    </div>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Tam Konum</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showAssetDetail.location || '-'}</div></div>
                 <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Teknik Detaylar</div><div className="text-xs font-medium text-slate-800 mt-0.5 line-clamp-2">{showAssetDetail.asset_details || '-'}</div></div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 mb-6 custom-scrollbar">
                 <h4 className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Cihaza Ait Geçmiş İşler</h4>
                 {(data?.jobs || []).filter((j: any) => j.asset_id === showAssetDetail.id).length > 0 ? (data?.jobs || []).filter((j: any) => j.asset_id === showAssetDetail.id).map((j: any) => (
                   <div key={j.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-white text-xs">
                      <div><div className="font-semibold text-slate-800">{j.work_type || 'Görev'}</div><div className="text-[10px] text-slate-500 mt-0.5">{j.scheduled_date || 'Anlık'}</div></div>
                      <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                   </div>
                 )) : <div className="text-center p-4 text-slate-400 text-xs bg-slate-50 rounded-lg">Bu cihaz için geçmiş iş kaydı bulunmuyor.</div>}
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                 {!isEditingAsset ? (
                   <div className="flex gap-2 w-full">
                     <button onClick={() => { setIsEditingAsset(true); setEditAssetForm({ id: showAssetDetail.id, name: showAssetDetail.name, location: showAssetDetail.location || '', apartmentName: '', deviceDetails: showAssetDetail.asset_details || '' }); }} className="flex-[2] bg-slate-100 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"><Settings size={14} /> Düzenle</button>
                     <button onClick={async () => { if(confirm(`${showAssetDetail.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-asset', { id: showAssetDetail.id }, () => handleCloseDetail('asset'), () => {}); } }} className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={14} /> Sil</button>
                   </div>
                 ) : (
                   <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                     <div className="space-y-2">
                       <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs outline-none focus:border-blue-400 bg-white" value={editAssetForm.name} onChange={(e) => setEditAssetForm({...editAssetForm, name: e.target.value})} placeholder="Cihaz Adı" />
                       <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs outline-none focus:border-blue-400 bg-white" value={editAssetForm.location} onChange={(e) => setEditAssetForm({...editAssetForm, location: e.target.value})} placeholder="Konum (Eklemek İstersen Bina Adı)" />
                       <textarea rows={2} className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs outline-none focus:border-blue-400 bg-white resize-none" value={editAssetForm.deviceDetails} onChange={(e) => setEditAssetForm({...editAssetForm, deviceDetails: e.target.value})} placeholder="Teknik Detaylar" />
                     </div>
                     <div className="flex gap-2 pt-2">
                       <button onClick={() => handleAction('update-asset', editAssetForm, () => handleCloseDetail('asset'), () => setIsEditingAsset(false))} className="flex-1 bg-blue-600 text-white py-2 rounded-md text-xs font-semibold hover:bg-blue-700">{isSaving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Değişiklikleri Kaydet'}</button>
                       <button onClick={() => setIsEditingAsset(false)} className="px-4 bg-slate-200 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-300">İptal</button>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* YENİ GÖREV MODALI (MÜŞTERİ/VARLIK SEÇ) */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Müşteri/Varlık Seç</h2><button onClick={() => { setShowJobModal(false); setSearchTerm(''); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="İsim veya Varlık Ara..." 
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50 transition-all" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                </div>

                <div className="flex-1 overflow-y-auto max-h-48 custom-scrollbar border border-slate-100 rounded-lg bg-slate-50/30">
                  {combinedSearchList.length > 0 ? (
                    combinedSearchList.map((item: any) => (
                      <div 
                        key={`${item.searchType}-${item.id}`} 
                        onClick={() => {
                          if (item.searchType === 'CUSTOMER') {
                            setJobForm({...jobForm, customerName: item.name, assetId: ''});
                          } else {
                            const parentCust = (data?.customers || []).find((c:any) => c.id === item.customer_id);
                            setJobForm({...jobForm, customerName: (parentCust?.name || 'Bağımsız Varlık'), assetId: item.id});
                          }
                          setSearchTerm(item.displayName);
                        }}
                        className={`p-3 border-b border-slate-50 cursor-pointer flex items-center gap-3 transition-colors ${ 
                          (jobForm.assetId === item.id || (item.searchType === 'CUSTOMER' && jobForm.customerName === item.name && !jobForm.assetId)) 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-blue-50' 
                        }`}
                      >
                        {item.searchType === 'CUSTOMER' ? <User size={16} /> : <Box size={16} />}
                        <div>
                          <div className="font-semibold text-xs">{item.displayName}</div>
                          <div className={`text-[10px] ${ (jobForm.assetId === item.id || jobForm.customerName === item.name) ? 'text-blue-100' : 'text-slate-500' }`}>{item.subName}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-slate-400 text-xs italic">Sonuç bulunamadı...</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-2 text-xs font-semibold rounded-md border ${jobForm.jobType === 'Anlık' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-400 border-slate-200'}`}>Hemen Uygula</button>
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-2 text-xs font-semibold rounded-md border ${jobForm.jobType === 'Planlı' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200'}`}>Tarih Belirle</button>
                </div>
                
                {jobForm.jobType === 'Planlı' && (
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} />
                )}

                <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400 bg-slate-50" placeholder="Görev notu veya talimatlar..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} />
              </div>

              <button 
                disabled={isSaving || (!jobForm.customerName && !jobForm.assetId)} 
                onClick={() => handleAction('add-job', { ...jobForm, details: { note: jobForm.taskNote } }, () => { setShowJobModal(false); setSearchTerm(''); }, () => setJobForm({ customerName: '', assetId: '', workType: 'Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} 
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm mt-5 hover:bg-blue-700 transition-all disabled:opacity-50 flex justify-center items-center"
              >
                 {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'İş Emrini Kaydet'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VARLIK EKLE MODALI */}
      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Varlık Ekle</h2><button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-3">Müşteri Seçimi</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400 mb-3" value={assetForm.customerId} onChange={e => setAssetForm({...assetForm, customerId: e.target.value})}>
                    <option value="">Listeden Seçin</option>
                    {(data?.customers || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="NEW" className="font-bold text-blue-600">+ Yeni Müşteri Oluştur</option>
                  </select>
                  {assetForm.customerId === 'NEW' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pt-2 border-t border-slate-200 mt-2">
                      <input className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Yeni Müşteri Adı" value={assetForm.newCustomer?.name || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, name: e.target.value}})} />
                      <input className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs outline-none focus:border-blue-400" placeholder="İletişim Bilgisi" value={assetForm.newCustomer?.contact || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, contact: e.target.value}})} />
                    </motion.div>
                  )}
                </div>
                <div className="space-y-2">
                  <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Varlık Adı" value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                  <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Konum" value={assetForm.location} onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                  <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400" placeholder="Teknik Detaylar" value={assetForm.deviceDetails} onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
                </div>
                <button disabled={isSaving || !assetForm.name} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm mt-4 hover:bg-slate-800 transition-all flex justify-center items-center" onClick={() => handleAction('add-asset', assetForm, setShowAssetModal, () => setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '', customerId: '', newCustomer: { name: '', contact: '', address: '', taxInfo: '' } }))}>
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Varlığı Kaydet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MÜŞTERİ EKLE MODALI */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Müşteri Ekle</h2><button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Firma / İsim" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                  <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Telefon" value={customerForm.contact} onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
                  <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Adres" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                </div>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <label className="text-[10px] font-bold text-blue-700 uppercase block mb-3">Varlık Bağlantısı</label>
                  <select className="w-full px-3 py-2 border border-blue-200 rounded-md text-xs outline-none bg-white focus:border-blue-500 mb-2" value={customerForm.assetAction} onChange={e => setCustomerForm({...customerForm, assetAction: e.target.value})}>
                    <option value="">Listeden Varlık Seçin</option>
                    {(data?.assets || []).map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.location})</option>)}
                    <option value="NEW" className="font-bold text-blue-600">+ Yeni Varlık Tanımla</option>
                  </select>
                  {customerForm.assetAction === 'NEW' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pt-2 border-t border-blue-200 mt-2">
                      <input className="w-full px-3 py-2 border border-blue-300 rounded-md text-xs outline-none focus:border-blue-500 bg-white" placeholder="Cihaz Adı" value={customerForm.newAsset?.name || ''} onChange={e => setCustomerForm({...customerForm, newAsset: {...customerForm.newAsset, name: e.target.value}})} />
                      <input className="w-full px-3 py-2 border border-blue-300 rounded-md text-xs outline-none focus:border-blue-500 bg-white" placeholder="Konum" value={customerForm.newAsset?.location || ''} onChange={e => setCustomerForm({...customerForm, newAsset: {...customerForm.newAsset, location: e.target.value}})} />
                    </motion.div>
                  )}
                </div>
                <button disabled={isSaving || !customerForm.name} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm mt-4 hover:bg-blue-700 transition-all flex justify-center items-center" onClick={() => handleAction('add-customer', customerForm, setShowCustomerModal, () => setCustomerForm({ name: '', contact: '', address: '', taxInfo: '', assetAction: '', newAsset: { name: '', location: '', apartmentName: '', deviceDetails: '' } }))}>
                   {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Müşteriyi Kaydet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERSONEL MODALI */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xs rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Personel Ekle</h2><button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Ad Soyad" onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Telefon" onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Branş" onChange={e => setStaffForm({...staffForm, branch: e.target.value})} />
                <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400" onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                  <option value="Usta">Saha Ustası</option>
                  <option value="Yönetici">Yönetici</option>
                </select>
                <button className="w-full bg-slate-900 text-white py-2 rounded-md font-semibold text-sm mt-2 hover:bg-slate-800" onClick={() => handleAction('add-staff', staffForm, setShowStaffModal, () => setStaffForm({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' }))}>Kaydet</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STOK MODALI */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Parça Girişi</h2><button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Parça Adı" onChange={e => setStockForm({...stockForm, itemName: e.target.value})} /></div>
                <div><input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Miktar" onChange={e => setStockForm({...stockForm, quantity: e.target.value})} /></div>
                <div><select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400" onChange={e => setStockForm({...stockForm, unitName: e.target.value})}><option value="Adet">Adet</option><option value="Metre">Metre</option><option value="Paket">Paket</option></select></div>
                <div><input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Birim Fiyat (₺)" onChange={e => setStockForm({...stockForm, unitPrice: e.target.value})} /></div>
                <div><input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Tedarikçi Firma" onChange={e => setStockForm({...stockForm, supplierName: e.target.value})} /></div>
                <div className="col-span-2"><input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Tedarikçi Telefon" onChange={e => setStockForm({...stockForm, supplierPhone: e.target.value})} /></div>
              </div>
              <button className="w-full bg-slate-900 text-white py-2 rounded-md font-semibold text-sm mt-4 hover:bg-slate-800" onClick={() => handleAction('add-stock', stockForm, setShowStockModal, () => setStockForm({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '', supplierPhone: '' }))}>Stok Kaydet</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}