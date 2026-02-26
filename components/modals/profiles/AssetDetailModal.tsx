'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Box, Briefcase, Calendar, User, Hash, AlertCircle, ChevronRight, Settings, Edit, Trash2, Save, Loader2 } from 'lucide-react';

export default function AssetDetailModal({
  selectedAsset, setSelectedAsset,
  data, handleCloseDetail,
  setSelectedJob, setSelectedCustomer,
  handleAction, userRole
}: any) {

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'history'
  
  // Düzenleme Modu State'leri
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(selectedAsset || {});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedAsset) {
        setEditForm(selectedAsset);
        setIsEditing(false);
    }
  }, [selectedAsset]);

  const assetJobs = (data?.jobs || []).filter((j:any) => String(j.asset_id) === String(selectedAsset?.id));
  const assetOwner = (data?.customers || []).find((c:any) => String(c.id) === String(selectedAsset?.customer_id));

  const statusColors: any = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200',
    'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const handleSaveEdit = async () => {
      if(!editForm.name || !editForm.customer_id) {
          alert("Lütfen Varlık Adı ve Müşteri alanlarını doldurun.");
          return;
      }
      setIsSaving(true);
      const success = await handleAction('update-asset', editForm);
      setIsSaving(false);
      
      if(success !== false) {
          setIsEditing(false);
          setSelectedAsset({...selectedAsset, ...editForm});
      }
  };

  const handleDelete = async () => {
      if(confirm("Bu varlığı kalıcı olarak silmek istediğinize emin misiniz? (Geçmiş işler ve atamalar etkilenebilir)")) {
          const success = await handleAction('delete-asset', { id: selectedAsset.id });
          if(success !== false) {
              setSelectedAsset(null);
              handleCloseDetail('asset');
          }
      }
  };

  return (
    <AnimatePresence>
      {selectedAsset && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => handleCloseDetail('asset')}></div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 pointer-events-auto"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start p-5 sm:p-6 pb-0 border-b border-slate-100 bg-slate-50/50 z-10 flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 w-full">
                  <div className="flex justify-between items-start w-full">
                      <div>
                          <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedAsset.name}</h2>
                          <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                             <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold flex items-center gap-1"><Box size={12}/> Varlık / Cihaz Profili</span>
                          </div>
                      </div>
                      
                      {/* MOBİL BUTONLAR */}
                      <div className="flex items-center gap-1.5 sm:hidden">
                          {userRole === 'Patron' && !isEditing && (
                              <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all"><Trash2 size={18} /></button>
                          )}
                          <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-blue-600 text-white' : 'text-blue-500 hover:bg-blue-100'}`}><Edit size={18} /></button>
                          <button onClick={() => { setSelectedAsset(null); handleCloseDetail('asset'); }} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-all"><X size={20} /></button>
                      </div>
                  </div>

                  {/* SEKMELER (Sadece görüntüleme modunda görünür) */}
                  {!isEditing && (
                    <div className="flex gap-4 mt-4 border-b border-slate-200 w-full">
                        <button 
                          onClick={() => setActiveTab('info')}
                          className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'info' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Cihaz Bilgileri
                            {activeTab === 'info' && <motion.div layoutId="assetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                        <button 
                          onClick={() => setActiveTab('history')}
                          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Servis Geçmişi
                            <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{assetJobs.length}</span>
                            {activeTab === 'history' && <motion.div layoutId="assetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                    </div>
                  )}
              </div>

              {/* MASAÜSTÜ BUTONLAR */}
              <div className="hidden sm:flex items-center gap-1.5 self-start">
                  {userRole === 'Patron' && !isEditing && (
                      <button onClick={handleDelete} title="Varlığı Sil" className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all"><Trash2 size={18} /></button>
                  )}
                  <button onClick={() => setIsEditing(!isEditing)} title="Düzenle" className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-blue-500 hover:bg-blue-100'}`}><Edit size={18} /></button>
                  <button onClick={() => { setSelectedAsset(null); handleCloseDetail('asset'); }} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-all"><X size={20} /></button>
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-white relative">
                
                {isEditing ? (
                   /* DÜZENLEME MODU */
                   <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-4">
                       <div className="bg-blue-50 text-blue-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-2 border border-blue-100">
                           <Edit size={16} /> Varlık Profilini Düzenliyorsunuz
                       </div>
                       
                       <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Cihaz / Varlık Adı <span className="text-rose-500">*</span></label>
                          <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                       </div>
                       
                       <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ait Olduğu Müşteri <span className="text-rose-500">*</span></label>
                          <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={editForm.customer_id || ''} onChange={e => setEditForm({...editForm, customer_id: e.target.value})}>
                              <option value="" disabled>Müşteri Seçin</option>
                              {(data?.customers || []).map((c: any) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                          </select>
                       </div>
                       
                       <div>
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                            <span>Konum / Adres</span>
                            <span className="text-[9px] text-slate-400">(Tam adresi elle güncelleyebilirsiniz)</span>
                          </label>
                          <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all resize-none" value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                           <div>
                              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Türü / Modeli</label>
                              <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={editForm.type || ''} onChange={e => setEditForm({...editForm, type: e.target.value})} />
                           </div>
                           <div>
                              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Seri No / Barkod</label>
                              <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all font-mono" value={editForm.serial_number || ''} onChange={e => setEditForm({...editForm, serial_number: e.target.value})} />
                           </div>
                       </div>
                       
                       <div className="pt-2">
                           <button disabled={isSaving} onClick={handleSaveEdit} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex justify-center items-center">
                               {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} className="mr-2" /> Değişiklikleri Kaydet</>}
                           </button>
                       </div>
                   </motion.div>
                ) : (
                  /* GÖRÜNTÜLEME MODU */
                  <AnimatePresence mode="wait">
                    {activeTab === 'info' && (
                      <motion.div key="info" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                          
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-all">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                  <User size={14} /> AİT OLDUĞU MÜŞTERİ
                              </div>
                              {assetOwner ? (
                                  <div 
                                      onClick={() => setSelectedCustomer && setSelectedCustomer(assetOwner)}
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
                                      <AlertCircle size={16} /> Herhangi bir müşteriye atanmamış.
                                  </div>
                              )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3"><MapPin size={16} /></div>
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Konum / Şube</div>
                                  <div className="text-sm font-bold text-slate-800">{selectedAsset.location || 'Belirtilmedi'}</div>
                              </div>
                              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg w-fit mb-3"><Settings size={16} /></div>
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Türü / Modeli</div>
                                  <div className="text-sm font-bold text-slate-800">{selectedAsset.type || 'Belirtilmedi'}</div>
                              </div>
                              {selectedAsset.serial_number && (
                                  <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm sm:col-span-2 flex items-center gap-3">
                                      <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0"><Hash size={16} /></div>
                                      <div>
                                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Seri Numarası</div>
                                          <div className="text-sm font-bold text-slate-800 font-mono">{selectedAsset.serial_number}</div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </motion.div>
                    )}

                    {activeTab === 'history' && (
                      <motion.div key="history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                          {assetJobs.length > 0 ? (
                              <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-100">
                                  {assetJobs.map((job: any) => (
                                      <div 
                                        key={job.id}
                                        onClick={() => setSelectedJob && setSelectedJob(job)}
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
                                              {job.details?.note && (
                                                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-medium text-slate-600 line-clamp-2 italic">
                                                      "{job.details.note.replace(/\[📍 Konum Kaydı\].*/g, '')}"
                                                  </div>
                                              )}
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
                  </AnimatePresence>
                )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}