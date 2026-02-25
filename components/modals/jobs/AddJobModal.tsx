'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Search, User, Box, AlertTriangle, CheckCircle, ArrowRight, Briefcase } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';

export default function AddJobModal({
  showJobModal, setShowJobModal, jobModalStep, setJobModalStep,
  jobModalType, setJobModalType, jobForm, setJobForm,
  selectedJob, setSelectedJob, jobTargetMode, setJobTargetMode,
  searchCust, setSearchCust, searchAsset, setSearchAsset,
  isSaving, handleAction, data, userRole
}: any) {

  const currentSector = data?.sector || '';
  const safeSectors: any = sectorsData;
  const branchList = currentSector && safeSectors?.sectors?.[currentSector]?.subTypes 
    ? Object.keys(safeSectors.sectors[currentSector].subTypes) 
    : [];

  const isJobValid = jobForm.workCategory === 'Genel İş Atama' ? true : (jobForm.customerName || jobForm.assetId);

  return (
    <AnimatePresence>
      {showJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => { setShowJobModal(false); if (jobModalType === 'APPROVAL') { setSelectedJob(null); setJobModalType(''); } }}></div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto">
            
            {/* HEADER: Geri Butonu ve Başlık */}
            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
               <div className="flex items-center gap-3">
                  {jobModalStep === 2 && (
                      <button onClick={() => setJobModalStep(1)} className="p-1.5 -ml-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                          <ArrowRight size={20} className="rotate-180" />
                      </button>
                  )}
                  <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          {jobModalStep === 1 ? 'Yeni Görev Oluştur' : (jobForm.workCategory === 'Genel İş Atama' ? 'Genel Görev Detayları' : 'Normal İş Detayları')}
                      </h2>
                      {jobModalStep === 2 && <div className="text-xs font-medium text-slate-500">Formu doldurarak atamayı tamamlayın.</div>}
                  </div>
               </div>
               <button onClick={() => { setShowJobModal(false); if (jobModalType === 'APPROVAL') { setSelectedJob(null); setJobModalType(''); } }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><X size={20} /></button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
              
              {/* EĞER MODAL TİPİ 'APPROVAL' İSE SADECE ONAY EKRANI GÖSTER */}
              {jobModalType === 'APPROVAL' && selectedJob ? (
                  <div className="space-y-6 flex flex-col h-full justify-center">
                      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-start gap-4">
                          <div className="bg-amber-100 p-3 rounded-xl text-amber-600 shrink-0 shadow-sm"><AlertTriangle size={24} /></div>
                          <div>
                              <h3 className="font-black text-amber-900 text-sm sm:text-base">Onay Bekleyen İş Ataması</h3>
                              <p className="text-xs font-bold text-amber-700/80 mt-1 leading-relaxed">Bu iş patron tarafından atandı. Kabul ettiğinizde "Usta Bekliyor" aşamasına geçecek ve atama yapabileceksiniz.</p>
                          </div>
                      </div>

                      <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                          <div className="flex flex-col gap-1.5 border-b border-slate-200 pb-3">
                              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1"><User size={12}/> Müşteri / İş</span>
                              <div className="font-black text-slate-800 text-lg">{selectedJob.customer_name}</div>
                          </div>
                          <div className="flex flex-col gap-1.5 border-b border-slate-200 pb-3">
                              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1"><Briefcase size={12}/> Görev Tipi</span>
                              <div className="font-bold text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 inline-block w-fit">{selectedJob.work_type}</div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1"><User size={12}/> Açıklama / Notlar</span>
                              <div className="font-medium text-slate-600 italic bg-white p-4 rounded-xl border border-slate-200 text-sm leading-relaxed">
                                  "{selectedJob.details?.note || 'Açıklama girilmemiş.'}"
                              </div>
                          </div>
                      </div>

                      <div className="mt-auto pt-4">
                          <button 
                              onClick={async () => {
                                  if(handleAction) {
                                      const isGeneralJob = selectedJob.work_type === 'Genel Görev';
                                      const newStatus = isGeneralJob ? 'Devam Ediyor' : 'Usta Bekliyor';
                                      
                                      await handleAction('update-job', {
                                          id: selectedJob.id,
                                          status: newStatus,
                                          lastEditedBy: data?.ownerName || 'Yönetici'
                                      }, () => {
                                          setShowJobModal(false);
                                          setSelectedJob(null);
                                          if (setJobModalType) setJobModalType('');
                                      }, null);
                                  }
                              }}
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-black py-4 rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                              <CheckCircle size={20} strokeWidth={2.5} /> GÖREVİ KABUL ET VE ONAYLA
                          </button>
                      </div>
                  </div>
              ) : (
                  /* NORMAL YENİ İŞ / DÜZENLEME EKRANI */
                  <>
                      {/* ADIM 1: SEÇİM EKRANI */}
                      {jobModalStep === 1 && (
                          <div className="space-y-4 py-2">
                              <p className="text-sm text-slate-500 mb-4 font-medium">Lütfen oluşturmak istediğiniz iş türünü seçin:</p>
                              
                              <button 
                                  onClick={() => {
                                      setJobForm({...jobForm, workCategory: 'Normal İş Atama', customerName: '', assetId: ''});
                                      setJobModalStep(2);
                                  }}
                                  className="w-full bg-blue-50 border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-600 group p-5 rounded-2xl flex items-center gap-4 transition-all text-left active:scale-95"
                              >
                                  <div className="w-12 h-12 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center group-hover:bg-white group-hover:text-blue-600 transition-colors shadow-sm">
                                      <User size={24} strokeWidth={2.5} />
                                  </div>
                                  <div>
                                      <div className="font-black text-slate-800 text-lg group-hover:text-white transition-colors">Normal İş Atama</div>
                                      <div className="text-xs text-slate-500 font-medium group-hover:text-blue-100 mt-0.5 transition-colors">Bir müşteriye veya cihaza bağlı, servis/bakım vb. işlemler için.</div>
                                  </div>
                              </button>

                              <button 
                                  onClick={() => {
                                      setJobForm({...jobForm, workCategory: 'Genel İş Atama', customerName: '', assetId: ''});
                                      setJobModalStep(2);
                                  }}
                                  className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-800 hover:bg-slate-900 group p-5 rounded-2xl flex items-center gap-4 transition-all text-left active:scale-95"
                              >
                                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center group-hover:bg-slate-700 group-hover:text-white transition-colors shadow-sm">
                                      <Briefcase size={24} strokeWidth={2.5} />
                                  </div>
                                  <div>
                                      <div className="font-black text-slate-800 text-lg group-hover:text-white transition-colors">Genel Görev</div>
                                      <div className="text-xs text-slate-500 font-medium group-hover:text-slate-300 mt-0.5 transition-colors">Ofis içi, malzeme temini veya müşteriden bağımsız görevler.</div>
                                  </div>
                              </button>
                          </div>
                      )}

                      {/* ADIM 2: FORM EKRANI */}
                      {jobModalStep === 2 && (
                          <div className="space-y-5">
                              
                              {/* Ortak Alan: Tarih */}
                              <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tarih / Zamanlama</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-3 sm:py-2.5 text-xs font-bold rounded-xl border transition-all active:scale-95 ${jobForm.jobType === 'Anlık' ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Anlık Görev</button>
                                    <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-3 sm:py-2.5 text-xs font-bold rounded-xl border transition-all active:scale-95 ${jobForm.jobType === 'Planlı' ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Tarih Planla</button>
                                </div>
                                {jobForm.jobType === 'Planlı' && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                                    <input type="date" className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} />
                                  </motion.div>
                                )}
                              </div>

                              {/* Sadece Normal İş İse: Müşteri/Varlık Seçimi */}
                              {jobForm.workCategory !== 'Genel İş Atama' && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                    <button onClick={() => setJobTargetMode('CUSTOMER')} className={`flex-1 py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1.5 ${jobTargetMode === 'CUSTOMER' ? 'bg-white text-blue-700 border-blue-300 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-200'}`}><User size={14}/> Müşteri ile İlerle</button>
                                    <button onClick={() => setJobTargetMode('ASSET')} className={`flex-1 py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1.5 ${jobTargetMode === 'ASSET' ? 'bg-white text-blue-700 border-blue-300 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-200'}`}><Box size={14}/> Varlık ile İlerle</button>
                                  </div>

                                  {jobTargetMode === 'CUSTOMER' ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                      <div className="relative">
                                        <Search className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
                                        <input type="text" placeholder="İsim veya TC ile Müşteri Ara..." className="w-full pl-9 pr-3 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white" value={searchCust} onChange={e => setSearchCust(e.target.value)} />
                                      </div>
                                      <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white focus:border-blue-500 custom-scrollbar" size={4} value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value, assetId: ''})}>
                                        <option value="" disabled className="font-bold text-slate-400 border-b border-slate-100 pb-2 mb-2">-- 1. Listeden Müşteri Seçin --</option>
                                        {(data?.customers || []).filter((c:any) => c.name?.toLowerCase().includes(searchCust.toLowerCase()) || c.tax_info?.includes(searchCust)).map((c: any) => <option key={c.id} value={c.name} className="py-2 border-b border-slate-50 last:border-0">{c.name} {c.tax_info ? `(${c.tax_info})` : ''}</option>)}
                                      </select>
                                      
                                      {jobForm.customerName && (() => {
                                         const selectedCustomer = (data?.customers || []).find((c:any) => c.name === jobForm.customerName);
                                         const customerAssets = (data?.assets || []).filter((a:any) => String(a.customer_id) === String(selectedCustomer?.id));
                                         return (
                                           <div className="pt-2 border-t border-slate-100">
                                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">2. Bu Müşteriye Ait Varlık (İsteğe Bağlı)</label>
                                              <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white focus:border-blue-500" value={jobForm.assetId} onChange={e => setJobForm({...jobForm, assetId: e.target.value})}>
                                                  <option value="">-- Varlık Seçilmedi (Genel Müşteri İşi) --</option>
                                                  {customerAssets.map((a:any) => (
                                                     <option key={a.id} value={a.id}>{a.name} - {a.location}</option>
                                                  ))}
                                              </select>
                                              {customerAssets.length === 0 && <div className="text-[10px] text-amber-500 mt-1.5 font-bold px-1">Bu müşteriye ait kayıtlı varlık bulunamadı.</div>}
                                           </div>
                                         );
                                      })()}
                                    </motion.div>
                                  ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                      <div className="relative mb-2">
                                        <Search className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
                                        <input type="text" placeholder="Cihaz Adı Ara..." className="w-full pl-9 pr-3 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white" value={searchAsset} onChange={e => setSearchAsset(e.target.value)} />
                                      </div>
                                      <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white focus:border-blue-500 custom-scrollbar" size={4} value={jobForm.assetId} onChange={e => {
                                        const selectedAsset = (data?.assets || []).find((a:any) => String(a.id) === String(e.target.value));
                                        const parentCust = (data?.customers || []).find((c:any) => String(c.id) === String(selectedAsset?.customer_id));
                                        setJobForm({...jobForm, assetId: e.target.value, customerName: parentCust?.name || ''});
                                      }}>
                                        <option value="" disabled className="font-bold text-slate-400 border-b border-slate-100 pb-2 mb-2">-- Listeden Varlık Seçin --</option>
                                        {(data?.assets || []).filter((a: any) => a.name?.toLowerCase().includes(searchAsset.toLowerCase())).map((a: any) => (
                                          <option key={a.id} value={a.id} className="py-2 border-b border-slate-50 last:border-0">{a.name} - {a.location}</option>
                                        ))}
                                      </select>
                                      {jobForm.assetId && (
                                          <div className="mt-3 text-[10px] font-bold text-blue-700 bg-blue-50/80 p-2.5 rounded-lg border border-blue-100 flex items-center gap-1.5">
                                              <CheckCircle size={14} className="text-blue-500 shrink-0"/> Müşteri Eşleşti: <span className="text-slate-800 truncate">{jobForm.customerName || 'Bağımsız Varlık'}</span>
                                          </div>
                                      )}
                                    </motion.div>
                                  )}
                                </div>
                              )}

                              {/* Ortak Alan: Personel Seçimi */}
                              <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Sorumlu Personel</label>
                                <select className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}>
                                  <option value="">Seçiniz...</option>
                                  {(data?.staff || [])
                                    .filter((s:any) => userRole === 'Patron' ? s.role === 'Yönetici' : s.role === 'Usta')
                                    .map((s:any) => (
                                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                  ))}
                                </select>
                              </div>
                              
                              {/* Ortak Alan: Not */}
                              <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Görev Özeti / Talimatlar</label>
                                <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="İşin detayı nedir?..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} />
                              </div>
                          </div>
                      )}
                  </>
              )}
            </div>

            {/* FOOTER: Sadece Step 2'de Göster */}
            {jobModalStep === 2 && (
                <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50">
                    <button disabled={isSaving || !isJobValid} onClick={() => handleAction('add-job', { ...jobForm, workCategory: jobForm.workCategory || 'Normal İş Atama', details: { note: jobForm.taskNote } }, setShowJobModal, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', workCategory: 'Normal İş Atama', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} className="w-full bg-blue-600 text-white py-3.5 sm:py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50">
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'İş Emrini Gönder'}
                    </button>
                </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}