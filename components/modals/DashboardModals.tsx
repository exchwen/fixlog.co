'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trash2, Loader2, Search } from 'lucide-react';

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
  
  // Arama / Filtreleme Stateleri
  const [searchCust, setSearchCust] = useState('');
  const [searchAsset, setSearchAsset] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowJobModal(false); setShowAssetModal(false); setShowStaffModal(false); 
        setShowCustomerModal(false); setShowStockModal(false); setShowStaffDetail(null);
        if (setShowCustomerDetail) setShowCustomerDetail(null);
        if (setShowAssetDetail) setShowAssetDetail(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowJobModal, setShowAssetModal, setShowStaffModal, setShowCustomerModal, setShowStockModal, setShowStaffDetail, setShowCustomerDetail, setShowAssetDetail]);

  const allStaff = data?.staff || [];
  const statusColors: any = { 'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200' };

  // Akıllı Form Modları (Eğer yoksa varsayılan olarak 'NONE' başlar)
  const assetCustMode = assetForm.customerMode || 'NONE';
  const custAssetMode = customerForm.assetMode || 'NONE';

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
                       <button onClick={() => handleAction('add-staff', { ...editStaffForm, id: showStaffDetail.id }, () => setShowStaffDetail(null), () => setIsEditingStaff(false))} className="flex-1 bg-blue-600 text-white py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700">Kaydet</button>
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
                <button onClick={() => setShowCustomerDetail(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18} /></button>
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
                     <div key={a.id} className="p-3 border border-blue-100 rounded-lg bg-blue-50/30 text-xs mb-2">
                        <div className="font-semibold text-blue-800">{a.name}</div>
                        <div className="text-[10px] text-blue-600/80 mt-0.5">{a.apartment_name || ''} {a.location ? `- ${a.location}` : ''}</div>
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
                 <button onClick={async () => { if(confirm(`${showCustomerDetail.name} adlı müşteriyi silmek istediğinize emin misiniz?`)) { await handleAction('delete-customer', { id: showCustomerDetail.id }, () => setShowCustomerDetail(null), () => {}); } }} className="w-full bg-rose-50 text-rose-600 py-2 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={14} /> Müşteriyi Sil</button>
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
                <button onClick={() => setShowAssetDetail(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Sahibi (Müşteri)</div><div className="text-xs font-medium text-blue-600 mt-0.5">{showAssetDetail.customer_id ? (data?.customers || []).find((c: any) => c.id === showAssetDetail.customer_id)?.name || 'Bilinmiyor' : 'Bağımsız Cihaz'}</div></div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Bina / Site</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showAssetDetail.apartment_name || '-'}</div></div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Konum / Kat</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showAssetDetail.location || '-'}</div></div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Teknik Detaylar</div><div className="text-xs font-medium text-slate-800 mt-0.5 line-clamp-2">{showAssetDetail.device_details || '-'}</div></div>
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
                 <button onClick={async () => { if(confirm(`${showAssetDetail.name} cihazını silmek istediğinize emin misiniz?`)) { await handleAction('delete-asset', { id: showAssetDetail.id }, () => setShowAssetDetail(null), () => {}); } }} className="w-full bg-rose-50 text-rose-600 py-2 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={14} /> Cihazı Sil</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* İŞ EMRİ MODALI */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">İş Emri Ata</h2><button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-1.5 text-xs font-semibold rounded-md border ${jobForm.jobType === 'Anlık' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200'}`}>Anlık Görev</button>
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-1.5 text-xs font-semibold rounded-md border ${jobForm.jobType === 'Planlı' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>Tarih Planla</button>
                </div>
                
                {jobForm.jobType === 'Planlı' && (
                  <div><label className="text-[11px] font-semibold text-slate-600 block mb-1">Tarih</label><input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} /></div>
                )}
                
                {/* İŞ EMRİ - MÜŞTERİ SEÇİMİ VE ARAMA */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Müşteri Seçimi</label>
                  <div className="relative mb-1">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                    <input type="text" placeholder="İsim veya TC ile Müşteri Ara..." className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-slate-50" value={searchCust} onChange={e => setSearchCust(e.target.value)} />
                  </div>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400 custom-scrollbar" size={3} value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value, assetId: ''})}>
                    <option value="" className="font-semibold text-blue-600 border-b border-slate-100 pb-1 mb-1">Bağımsız İş (Müşteri Atanmasın)</option>
                    {(data?.customers || []).filter((c:any) => c.name?.toLowerCase().includes(searchCust.toLowerCase()) || c.tax_info?.includes(searchCust)).map((c: any) => <option key={c.id} value={c.name} className="py-1">{c.name} {c.tax_info ? `(${c.tax_info})` : ''}</option>)}
                  </select>
                </div>

                {/* İŞ EMRİ - CİHAZ SEÇİMİ VE ARAMA */}
                {jobForm.customerName && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1 mt-2">İlgili Varlık / Cihaz</label>
                    <div className="relative mb-1">
                      <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                      <input type="text" placeholder="Cihaz Adı Ara..." className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-slate-50" value={searchAsset} onChange={e => setSearchAsset(e.target.value)} />
                    </div>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400 custom-scrollbar" size={3} value={jobForm.assetId} onChange={e => setJobForm({...jobForm, assetId: e.target.value})}>
                      <option value="" className="font-semibold text-blue-600 border-b border-slate-100 pb-1 mb-1">Bağımsız Görev (Cihaz Atanmasın)</option>
                      {(data?.assets || []).filter((a: any) => {
                        const selectedCust = data?.customers?.find((c: any) => c.name === jobForm.customerName);
                        return selectedCust ? a.customer_id === selectedCust.id : false;
                      }).filter((a: any) => a.name?.toLowerCase().includes(searchAsset.toLowerCase())).map((a: any) => (
                        <option key={a.id} value={a.id} className="py-1">{a.name} - {a.location}</option>
                      ))}
                    </select>
                  </motion.div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1 mt-2">Sorumlu Personel</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}>
                    <option value="">👉 Tıklayın: Personel Seçin (veya Boş Bırakın)</option>
                    <optgroup label="👇 PERSONEL SEÇ 👇">
                      {allStaff.length > 0 ? (
                        allStaff.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)
                      ) : (
                        <option disabled>Kayıtlı personel yok</option>
                      )}
                    </optgroup>
                  </select>
                </div>
                
                <div><label className="text-[11px] font-semibold text-slate-600 block mb-1">Görev Özeti</label><textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400" placeholder="Talimatlar..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} /></div>
              </div>
              <button disabled={isSaving} onClick={() => handleAction('add-job', { ...jobForm, details: { note: jobForm.taskNote } }, setShowJobModal, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold text-sm mt-5 hover:bg-blue-700 transition-colors flex justify-center items-center">
                 {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'İş Emrini Gönder'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VARLIK (CİHAZ) EKLERKEN AKORDEONLU MÜŞTERİ SEÇİMİ */}
      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Varlık/Cihaz Ekle</h2><button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-4">
                
                {/* 3'LÜ RADYO BUTON AKORDEON */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">CİHAZIN SAHİBİ (MÜŞTERİ)</label>
                  <div className="grid grid-cols-1 gap-2">
                    
                    {/* Seçenek 1: Bağımsız */}
                    <label className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-colors ${assetCustMode === 'NONE' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="custMode" className="hidden" checked={assetCustMode === 'NONE'} onChange={() => setAssetForm({...assetForm, customerMode: 'NONE', customerId: ''})} />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${assetCustMode === 'NONE' ? 'border-blue-600 bg-blue-100' : 'border-slate-300'}`}>
                         {assetCustMode === 'NONE' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                      <span className={`text-xs font-semibold ${assetCustMode === 'NONE' ? 'text-blue-800' : 'text-slate-700'}`}>Bağımsız (Müşteri Atanmasın)</span>
                    </label>

                    {/* Seçenek 2: Listeden Seç */}
                    <div className={`border rounded-lg transition-colors ${assetCustMode === 'SELECT' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <label className="flex items-center p-2.5 cursor-pointer">
                        <input type="radio" name="custMode" className="hidden" checked={assetCustMode === 'SELECT'} onChange={() => setAssetForm({...assetForm, customerMode: 'SELECT', customerId: ''})} />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${assetCustMode === 'SELECT' ? 'border-blue-600 bg-blue-100' : 'border-slate-300'}`}>
                           {assetCustMode === 'SELECT' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                        </div>
                        <span className={`text-xs font-semibold ${assetCustMode === 'SELECT' ? 'text-blue-800' : 'text-slate-700'}`}>Mevcut Müşterilerden Seç</span>
                      </label>
                      {/* LİSTEDEN SEÇ - ARAMA KUTULU */}
                      {assetCustMode === 'SELECT' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-3 pb-3 pt-1 flex flex-col gap-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2 text-blue-400" size={14} />
                            <input type="text" placeholder="İsim veya T.C. ile Müşteri Ara..." className="w-full pl-8 pr-3 py-1.5 border border-blue-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={searchCust} onChange={e => setSearchCust(e.target.value)} />
                          </div>
                          <select 
                            className="w-full px-3 py-2 border border-blue-200 rounded-md text-xs outline-none bg-blue-50 focus:border-blue-400 custom-scrollbar" 
                            size={4}
                            value={assetForm.customerId !== 'NEW' ? assetForm.customerId : ''} 
                            onChange={e => setAssetForm({...assetForm, customerId: e.target.value})}
                          >
                            <option value="" disabled className="font-semibold text-slate-500 border-b border-blue-100 pb-1 mb-1">-- Listeden Tıklayıp Seçin --</option>
                            {(data?.customers || []).filter((c:any) => c.name?.toLowerCase().includes(searchCust.toLowerCase()) || c.tax_info?.includes(searchCust)).map((c: any) => <option key={c.id} value={c.id} className="py-1">{c.name} {c.tax_info ? `(${c.tax_info})` : ''}</option>)}
                          </select>
                        </motion.div>
                      )}
                    </div>

                    {/* Seçenek 3: Yeni Oluştur */}
                    <div className={`border rounded-lg transition-colors ${assetCustMode === 'NEW' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <label className="flex items-center p-2.5 cursor-pointer">
                        <input type="radio" name="custMode" className="hidden" checked={assetCustMode === 'NEW'} onChange={() => setAssetForm({...assetForm, customerMode: 'NEW', customerId: 'NEW'})} />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${assetCustMode === 'NEW' ? 'border-blue-600 bg-blue-100' : 'border-slate-300'}`}>
                           {assetCustMode === 'NEW' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                        </div>
                        <span className={`text-xs font-semibold ${assetCustMode === 'NEW' ? 'text-blue-800' : 'text-slate-700'}`}>Sıfırdan Yeni Müşteri Oluştur</span>
                      </label>
                      {assetCustMode === 'NEW' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-3 pb-3 pt-1 space-y-2">
                           <input className="w-full px-3 py-2 border border-slate-300 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-white" placeholder="Firma / Müşteri Adı" value={assetForm.newCustomer?.name || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, name: e.target.value}})} />
                           <input className="w-full px-3 py-2 border border-slate-300 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-white" placeholder="Telefon / İletişim" value={assetForm.newCustomer?.contact || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, contact: e.target.value}})} />
                        </motion.div>
                      )}
                    </div>

                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">VARLIK/CİHAZ DETAYLARI</label>
                  <div className="space-y-2">
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Varlık/Cihaz Adı (Örn: Yolcu Asansörü)" value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Bina / Site Adı" value={assetForm.apartmentName} onChange={e => setAssetForm({...assetForm, apartmentName: e.target.value})} />
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Konum (Kat, Blok)" value={assetForm.location} onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                    <textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400" placeholder="Teknik Detaylar (Seri No, Model vs.)" value={assetForm.deviceDetails} onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
                  </div>
                </div>

                <button disabled={isSaving} className="w-full bg-slate-900 text-white py-2.5 rounded-md font-semibold text-sm mt-4 hover:bg-slate-800 flex justify-center items-center" onClick={() => handleAction('add-asset', assetForm, setShowAssetModal, () => setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '', customerId: '', customerMode: 'NONE', newCustomer: { name: '', contact: '', address: '', taxInfo: '' } }))}>
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Varlığı Sisteme Kaydet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MÜŞTERİ EKLERKEN AKORDEONLU CİHAZ SEÇİMİ */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Müşteri Ekle</h2><button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-4">
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">MÜŞTERİ/FİRMA KİMLİĞİ</label>
                  <div className="space-y-2">
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Firma / İsim" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Telefon / E-posta" value={customerForm.contact} onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Açık Adres" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Vergi No / T.C." value={customerForm.taxInfo} onChange={e => setCustomerForm({...customerForm, taxInfo: e.target.value})} />
                  </div>
                </div>

                {/* 3'LÜ RADYO BUTON AKORDEON */}
                <div className="mt-4">
                  <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-2">CİHAZ/VARLIK BAĞLANTISI (Opsiyonel)</label>
                  <div className="grid grid-cols-1 gap-2">
                    
                    {/* Seçenek 1: Bağımsız */}
                    <label className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-colors ${custAssetMode === 'NONE' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="assetMode" className="hidden" checked={custAssetMode === 'NONE'} onChange={() => setCustomerForm({...customerForm, assetMode: 'NONE', assetAction: ''})} />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${custAssetMode === 'NONE' ? 'border-blue-600 bg-blue-100' : 'border-slate-300'}`}>
                         {custAssetMode === 'NONE' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                      <span className={`text-xs font-semibold ${custAssetMode === 'NONE' ? 'text-blue-800' : 'text-slate-700'}`}>Bağlantı Yapma (Bağımsız Müşteri)</span>
                    </label>

                    {/* Seçenek 2: Listeden Seç */}
                    <div className={`border rounded-lg transition-colors ${custAssetMode === 'SELECT' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <label className="flex items-center p-2.5 cursor-pointer">
                        <input type="radio" name="assetMode" className="hidden" checked={custAssetMode === 'SELECT'} onChange={() => setCustomerForm({...customerForm, assetMode: 'SELECT', assetAction: ''})} />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${custAssetMode === 'SELECT' ? 'border-blue-600 bg-blue-100' : 'border-slate-300'}`}>
                           {custAssetMode === 'SELECT' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                        </div>
                        <span className={`text-xs font-semibold ${custAssetMode === 'SELECT' ? 'text-blue-800' : 'text-slate-700'}`}>Mevcut Cihazlardan Birini Üzerine Al</span>
                      </label>
                      {/* LİSTEDEN SEÇ - ARAMA KUTULU */}
                      {custAssetMode === 'SELECT' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-3 pb-3 pt-1 flex flex-col gap-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2 text-blue-400" size={14} />
                            <input type="text" placeholder="Cihaz Adı veya Konum Ara..." className="w-full pl-8 pr-3 py-1.5 border border-blue-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={searchAsset} onChange={e => setSearchAsset(e.target.value)} />
                          </div>
                          <select 
                            className="w-full px-3 py-2 border border-blue-300 rounded-md text-xs outline-none bg-blue-50 focus:border-blue-500 custom-scrollbar" 
                            size={4}
                            value={customerForm.assetAction !== 'NEW' ? customerForm.assetAction : ''} 
                            onChange={e => setCustomerForm({...customerForm, assetAction: e.target.value})}
                          >
                            <option value="" disabled className="font-semibold text-slate-500 border-b border-blue-100 pb-1 mb-1">-- Listeden Tıklayıp Seçin --</option>
                            {(data?.assets || []).filter((a:any) => a.name?.toLowerCase().includes(searchAsset.toLowerCase()) || a.location?.toLowerCase().includes(searchAsset.toLowerCase())).map((a: any) => <option key={a.id} value={a.id} className="py-1">{a.name} {a.customer_id ? '(Başka Müşteride)' : '(Boşta)'}</option>)}
                          </select>
                        </motion.div>
                      )}
                    </div>

                    {/* Seçenek 3: Yeni Oluştur */}
                    <div className={`border rounded-lg transition-colors ${custAssetMode === 'NEW' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <label className="flex items-center p-2.5 cursor-pointer">
                        <input type="radio" name="assetMode" className="hidden" checked={custAssetMode === 'NEW'} onChange={() => setCustomerForm({...customerForm, assetMode: 'NEW', assetAction: 'NEW'})} />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${custAssetMode === 'NEW' ? 'border-blue-600 bg-blue-100' : 'border-slate-300'}`}>
                           {custAssetMode === 'NEW' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                        </div>
                        <span className={`text-xs font-semibold ${custAssetMode === 'NEW' ? 'text-blue-800' : 'text-slate-700'}`}>Sıfırdan Yeni Cihaz Tanımla</span>
                      </label>
                      {custAssetMode === 'NEW' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-3 pb-3 pt-1 space-y-2">
                           <input className="w-full px-3 py-2 border border-slate-300 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-white" placeholder="Cihaz Adı" value={customerForm.newAsset?.name || ''} onChange={e => setCustomerForm({...customerForm, newAsset: {...customerForm.newAsset, name: e.target.value}})} />
                           <input className="w-full px-3 py-2 border border-slate-300 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-white" placeholder="Konum / Kat" value={customerForm.newAsset?.location || ''} onChange={e => setCustomerForm({...customerForm, newAsset: {...customerForm.newAsset, location: e.target.value}})} />
                        </motion.div>
                      )}
                    </div>

                  </div>
                </div>

                <button disabled={isSaving} className="w-full bg-blue-600 text-white py-2.5 rounded-md font-semibold text-sm mt-4 hover:bg-blue-700 flex justify-center items-center" onClick={() => handleAction('add-customer', customerForm, setShowCustomerModal, () => setCustomerForm({ name: '', contact: '', address: '', taxInfo: '', assetAction: '', assetMode: 'NONE', newAsset: { name: '', location: '', apartmentName: '', deviceDetails: '' } }))}>
                   {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Müşteriyi Kaydet'}
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