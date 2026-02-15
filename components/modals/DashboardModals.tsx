'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trash2, Loader2 } from 'lucide-react';

export default function DashboardModals({
  showStaffDetail, setShowStaffDetail, isEditingStaff, setIsEditingStaff, editStaffForm, setEditStaffForm,
  showJobModal, setShowJobModal, jobForm, setJobForm,
  showAssetModal, setShowAssetModal, assetForm, setAssetForm,
  showStaffModal, setShowStaffModal, staffForm, setStaffForm,
  showCustomerModal, setShowCustomerModal, customerForm, setCustomerForm,
  showStockModal, setShowStockModal, stockForm, setStockForm,
  handleAction, isSaving, data
}: any) {
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowJobModal(false); setShowAssetModal(false); setShowStaffModal(false); 
        setShowCustomerModal(false); setShowStockModal(false); setShowStaffDetail(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowJobModal, setShowAssetModal, setShowStaffModal, setShowCustomerModal, setShowStockModal, setShowStaffDetail]);

  const managers = data?.staff?.filter((s: any) => s?.role === 'Yönetici') || [];
  const statusColors: any = { 'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <>
      {/* PERSONEL DETAY MODALI */}
      <AnimatePresence>
        {showStaffDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl relative flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{showStaffDetail.name}</h2>
                  <div className="text-xs text-slate-500 mt-0.5">Personel Dosyası</div>
                </div>
                <button onClick={() => setShowStaffDetail(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18} /></button>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="text-[10px] font-semibold text-slate-500 uppercase">Branş/Rol</div>
                   <div className="text-xs font-medium text-slate-800 mt-0.5">{showStaffDetail.branch || showStaffDetail.role}</div>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="text-[10px] font-semibold text-slate-500 uppercase">Statü</div>
                   <div className="text-xs font-medium text-blue-600 mt-0.5">{showStaffDetail.status}</div>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="text-[10px] font-semibold text-slate-500 uppercase">Telefon</div>
                   <div className="text-xs font-medium text-slate-800 mt-0.5">{showStaffDetail.phone || '-'}</div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-6 custom-scrollbar">
                 <h4 className="text-[11px] font-semibold text-slate-500 mb-2">GÖREV GEÇMİŞİ</h4>
                 {(data?.jobs || []).filter((j: any) => j.staff_id === showStaffDetail.id).length > 0 ? (data?.jobs || []).filter((j: any) => j.staff_id === showStaffDetail.id).map((j: any) => (
                   <div key={j.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-white text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{j.customer_name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{j.scheduled_date || 'Anlık'}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                   </div>
                 )) : <div className="text-center p-6 text-slate-400 text-xs bg-slate-50 rounded-lg">Geçmiş görev bulunmuyor.</div>}
              </div>

              <div className="pt-4 border-t border-slate-100">
                 {!isEditingStaff ? (
                   <div className="flex gap-2 w-full">
                     <button onClick={() => setIsEditingStaff(true)} className="flex-[2] bg-slate-100 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"><Settings size={14} /> Düzenle</button>
                     <button onClick={async () => { if(confirm(`${showStaffDetail.name} isimli personel silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-staff', { id: showStaffDetail.id }, () => setShowStaffDetail(null), () => {}); } }} className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={14} /> Sil</button>
                   </div>
                 ) : (
                   <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <div className="grid grid-cols-2 gap-3">
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.name} onChange={(e) => setEditStaffForm({...editStaffForm, name: e.target.value})} placeholder="Ad Soyad" />
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.phone} onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})} placeholder="Telefon" />
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.branch} onChange={(e) => setEditStaffForm({...editStaffForm, branch: e.target.value})} placeholder="Branş" />
                       <select className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none bg-white focus:border-blue-400" value={editStaffForm.status} onChange={(e) => setEditStaffForm({...editStaffForm, status: e.target.value})}>
                          <option value="Aktif">Aktif</option>
                          <option value="Sahada">Sahada</option>
                          <option value="Mesai Dışı">Mesai Dışı</option>
                       </select>
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

      {/* İŞ EMRİ MODALI */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">İş Emri Ata</h2><button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-1.5 text-xs font-semibold rounded-md border ${jobForm.jobType === 'Anlık' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200'}`}>Anlık Görev</button>
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-1.5 text-xs font-semibold rounded-md border ${jobForm.jobType === 'Planlı' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>Tarih Planla</button>
                </div>
                {jobForm.jobType === 'Planlı' && (
                  <div><label className="text-[11px] font-semibold text-slate-600 block mb-1">Tarih</label><input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} /></div>
                )}
                <div><label className="text-[11px] font-semibold text-slate-600 block mb-1">Müşteri / Lokasyon</label><input list="asset-list" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Seç veya yaz..." value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value})} /></div>
                <datalist id="asset-list">{(data?.assets || []).concat(data?.customers || []).map((a: any,i: number) => <option key={i} value={a.name}>{a.location || a.address}</option>)}</datalist>
                <div><label className="text-[11px] font-semibold text-slate-600 block mb-1">Sorumlu Yönetici</label><select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}><option value="">Seçiniz...</option>{managers.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div><label className="text-[11px] font-semibold text-slate-600 block mb-1">Görev Özeti</label><textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400" placeholder="Talimatlar..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} /></div>
              </div>
              <button disabled={isSaving} onClick={() => handleAction('add-job', { ...jobForm, details: { note: jobForm.taskNote } }, setShowJobModal, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold text-sm mt-5 hover:bg-blue-700 transition-colors flex justify-center items-center">
                 {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'İş Emrini Gönder'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VARLIK MODALI */}
      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Varlık Ekle</h2><button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Varlık/Cihaz Adı" onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Bina / Site Adı" onChange={e => setAssetForm({...assetForm, apartmentName: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Konum (Kat, Blok)" onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                <textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400" placeholder="Teknik Detaylar" onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
                <button className="w-full bg-slate-900 text-white py-2 rounded-md font-semibold text-sm mt-2 hover:bg-slate-800" onClick={() => handleAction('add-asset', assetForm, setShowAssetModal, () => setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '' }))}>Kaydet</button>
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

      {/* MÜŞTERİ MODALI */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Müşteri Ekle</h2><button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Firma / İsim" onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Telefon / E-posta" onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Açık Adres" onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Vergi No / T.C." onChange={e => setCustomerForm({...customerForm, taxInfo: e.target.value})} />
                <button className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold text-sm mt-2 hover:bg-blue-700" onClick={() => handleAction('add-customer', customerForm, setShowCustomerModal, () => setCustomerForm({ name: '', contact: '', address: '', taxInfo: '' }))}>Kaydet</button>
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