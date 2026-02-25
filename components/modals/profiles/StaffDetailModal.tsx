'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Briefcase, Calendar, User, ShieldCheck, CheckCircle, Clock, Settings, Trash2, Loader2 } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';

export default function StaffDetailModal({
  selectedStaff, setSelectedStaff,
  data, handleCloseDetail,
  setSelectedJob,
  // Yeni eklenen prop'lar (Düzenleme ve Silme için)
  isEditingStaff, setIsEditingStaff,
  editStaffForm, setEditStaffForm,
  handleAction, isSaving
}: any) {

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'jobs'

  // Personele atanmış tüm işleri buluyoruz
  const staffJobs = (data?.jobs || []).filter((j:any) => String(j.staff_id) === String(selectedStaff?.id));
  
  // İş istatistikleri
  const completedJobs = staffJobs.filter((j:any) => j.status === 'Tamamlandı').length;
  const activeJobs = staffJobs.filter((j:any) => ['Devam Ediyor', 'Usta Bekliyor', 'Onay Bekliyor'].includes(j.status)).length;

  // Branş listesi için (Sektör verisinden çekiyoruz)
  const currentSector = data?.sector || '';
  const safeSectors: any = sectorsData;
  const branchList = currentSector && safeSectors?.sectors?.[currentSector]?.subTypes 
    ? Object.keys(safeSectors.sectors[currentSector].subTypes) 
    : [];

  const statusColors: any = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200',
    'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200',
    'Usta Bekliyor': 'bg-orange-100 text-orange-700 border-orange-200'
  };

  return (
    <AnimatePresence>
      {selectedStaff && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* Arka plan tıklaması ile kapatma */}
          <div className="absolute inset-0" onClick={() => handleCloseDetail('staff')}></div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 pointer-events-auto"
          >
            {/* HEADER (Üst Başlık Alanı) */}
            <div className="flex justify-between items-start p-5 sm:p-6 pb-0 border-b border-slate-100 bg-slate-50/50 z-10 flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 w-full">
                  <div className="flex justify-between items-start w-full">
                      <div>
                          <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedStaff.name}</h2>
                          <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${selectedStaff.role === 'Yönetici' ? 'bg-purple-100 text-purple-700' : selectedStaff.role === 'Usta' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                                 <ShieldCheck size={12}/> {selectedStaff.role || 'Personel'}
                             </span>
                          </div>
                      </div>
                      <button onClick={() => { setSelectedStaff(null); handleCloseDetail('staff'); }} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95 sm:hidden"><X size={20} /></button>
                  </div>

                  {/* SEKMELER (Tabs) - Sadece düzenleme modunda değilse göster */}
                  {!isEditingStaff && (
                    <div className="flex gap-4 mt-4 border-b border-slate-200 w-full">
                        <button 
                            onClick={() => setActiveTab('info')}
                            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'info' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Personel Bilgileri
                            {activeTab === 'info' && <motion.div layoutId="staffTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                        <button 
                            onClick={() => setActiveTab('jobs')}
                            className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${activeTab === 'jobs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            İş Geçmişi
                            <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{staffJobs.length}</span>
                            {activeTab === 'jobs' && <motion.div layoutId="staffTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                    </div>
                  )}
              </div>
              <button onClick={() => { setSelectedStaff(null); handleCloseDetail('staff'); }} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95 hidden sm:block self-start"><X size={20} /></button>
            </div>

            {/* BODY (İçerik Alanı) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-white relative">
                
                <AnimatePresence mode="wait">
                  {/* BİLGİ SEKMESİ */}
                  {activeTab === 'info' && (
                    <motion.div key="info" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                        
                        {!isEditingStaff ? (
                            <>
                                {/* -- GÖRÜNTÜLEME MODU -- */}
                                {/* Performans Özeti */}
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                                        <CheckCircle size={24} className="text-emerald-500 mb-2" />
                                        <div className="text-2xl font-black text-emerald-700">{completedJobs}</div>
                                        <div className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest mt-1">Tamamlanan İş</div>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                                        <Clock size={24} className="text-blue-500 mb-2" />
                                        <div className="text-2xl font-black text-blue-700">{activeJobs}</div>
                                        <div className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest mt-1">Aktif Görevi</div>
                                    </div>
                                </div>

                                {/* İletişim Bilgileri */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Phone size={18} /></div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Telefon Numarası</div>
                                            <div className="text-sm font-bold text-slate-800">{selectedStaff.phone || selectedStaff.contact || 'Belirtilmedi'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0"><Mail size={18} /></div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Branş / Uzmanlık</div>
                                            <div className="text-sm font-bold text-slate-800 break-all">{selectedStaff.branch || 'Genel'}</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* -- DÜZENLEME MODU -- */
                            <div className="space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ad Soyad</label>
                                        <input className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold w-full outline-none focus:border-blue-500 transition-all bg-white" value={editStaffForm.name} onChange={(e) => setEditStaffForm({...editStaffForm, name: e.target.value})} placeholder="Ad Soyad" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Telefon</label>
                                        <input className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none focus:border-blue-500 transition-all bg-white" value={editStaffForm.phone} onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})} placeholder="Telefon" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Branş / Uzmanlık</label>
                                        <select className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none bg-white focus:border-blue-500 transition-all" value={editStaffForm.branch} onChange={(e) => setEditStaffForm({...editStaffForm, branch: e.target.value})}>
                                            <option value="">Seçiniz</option>
                                            {branchList.map((subType: any) => (
                                                <option key={subType} value={subType}>{subType}</option>
                                            ))}
                                            <option value="Genel Usta">Genel Usta</option>
                                        </select>
                                    </div>
                                    
                                    <div className="col-span-1 sm:col-span-2 pt-3 border-t border-slate-200 mt-1">
                                        <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest block mb-3">Güvenlik ve Giriş Bilgileri</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="col-span-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kullanıcı Adı</label>
                                                <input className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold w-full outline-none focus:border-blue-500 transition-all bg-white" value={editStaffForm.username} onChange={(e) => setEditStaffForm({...editStaffForm, username: e.target.value})} placeholder="örn: ali.usta" />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hesap Şifresi</label>
                                                <input type="password" autoComplete="new-password" title="Mevcut şifreyi değiştirmek istemiyorsanız boş bırakın." className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none focus:border-blue-500 transition-all placeholder:text-[10px] placeholder:text-slate-400 bg-white" value={editStaffForm.password} onChange={(e) => setEditStaffForm({...editStaffForm, password: e.target.value})} placeholder="Değiştirmek için yazın..." />
                                            </div>
                                            <div className="col-span-1 sm:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hesap Durumu</label>
                                                <select className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold w-full outline-none bg-white focus:border-blue-500 transition-all" value={editStaffForm.is_active} onChange={(e) => setEditStaffForm({...editStaffForm, is_active: Number(e.target.value)})}>
                                                    <option value={1}>Aktif (Sisteme Girebilir)</option>
                                                    <option value={0}>Pasif (Dondurulmuş Hesap)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </motion.div>
                  )}

                  {/* İŞ GEÇMİŞİ SEKMESİ */}
                  {activeTab === 'jobs' && !isEditingStaff && (
                    <motion.div key="jobs" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                        {staffJobs.length > 0 ? (
                            <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-100">
                                {staffJobs.sort((a:any, b:any) => new Date(b.created_at || b.scheduled_date).getTime() - new Date(a.created_at || a.scheduled_date).getTime()).map((job: any) => (
                                    <div 
                                      key={job.id}
                                      onClick={() => setSelectedJob && setSelectedJob(job)}
                                      className="relative pl-12 cursor-pointer group"
                                    >
                                        {/* Timeline Noktası */}
                                        <div className={`absolute left-[13px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white z-10 transition-transform group-hover:scale-125 ${job.status === 'Tamamlandı' ? 'bg-emerald-500' : job.status === 'İptal' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                        
                                        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors line-clamp-1 pr-2">
                                                    {job.customer_name || 'Genel Görev'}
                                                </div>
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${statusColors[job.status] || 'bg-slate-100 text-slate-600'}`}>
                                                    {job.status}
                                                </span>
                                            </div>
                                            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                                                <Briefcase size={12} className="opacity-70" /> {job.work_type}
                                                <span className="mx-1 text-slate-300">•</span>
                                                <Calendar size={12} className="opacity-70" /> {job.created_at?.split('T')[0] || job.scheduled_date || 'Tarih Yok'}
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
                                    <User size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700">İş Ataması Yok</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Bu personele henüz herhangi bir görev atanmamış veya geçmişte bir işlem yapmamış.</p>
                            </div>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* FOOTER (Alt Aksiyon Alanı) */}
            <div className="pt-4 sm:pt-5 border-t border-slate-100 p-5 sm:p-6 bg-slate-50">
                {!isEditingStaff ? (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                        <button onClick={() => setIsEditingStaff(true)} className="flex-[2] bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"><Settings size={16} /> Profili Düzenle</button>
                        <button onClick={async () => { if(confirm(`${selectedStaff.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-staff', { id: selectedStaff.id }, () => handleCloseDetail('staff'), () => {}); } }} className="flex-1 bg-rose-50 border border-rose-200 text-rose-600 py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16} /> Sil</button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button onClick={() => handleAction('add-staff', { ...editStaffForm, id: selectedStaff.id }, () => handleCloseDetail('staff'), () => setIsEditingStaff(false))} className="w-full sm:flex-[2] bg-blue-600 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md flex justify-center items-center">
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Değişiklikleri Kaydet'}
                        </button>
                        <button onClick={() => setIsEditingStaff(false)} className="w-full sm:flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95">İptal</button>
                    </div>
                )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}