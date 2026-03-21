'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Briefcase, Calendar, User, ShieldCheck, CheckCircle, Clock, Settings, Trash2, Loader2, Filter, MapPin } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';
import trCitiesData from '@/lib/data/tr-cities.json';

export default function StaffDetailModal({
  selectedStaff, setSelectedStaff,
  data, handleCloseDetail,
  selectedJob, // 🚀 iOS Stacking için eklendi
  setSelectedJob,
  isEditingStaff, setIsEditingStaff,
  editStaffForm, setEditStaffForm,
  handleAction, isSaving,
  userRole // 🚀 Yetkilendirme kontrolü için eklendi
}: any) {

    const [activeTab, setActiveTab] = useState('info'); // 'info' | 'jobs'
    const [jobFilter, setJobFilter] = useState('Tümü'); // 'Tümü' | 'Tamamlandı' | 'Aktif' 
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [selectedCity, setSelectedCity] = useState('İstanbul');
    
    const trCities: any = trCitiesData;
    const citiesList = Object.keys(trCities);
    const currentDistricts = trCities[selectedCity] || [];

    const toggleEditRegion = (region: string) => {
        let currentRegions = editStaffForm.assigned_regions ? editStaffForm.assigned_regions.split(',').map((r:string)=>r.trim()).filter(Boolean) : [];
        if (currentRegions.includes(region)) {
            currentRegions = currentRegions.filter((r:string) => r !== region);
        } else {
            currentRegions.push(region);
        }
        setEditStaffForm({...editStaffForm, assigned_regions: currentRegions.join(', ')});
    };
    
    // 🚀 Tıklanamama bug'ını çözen kritik state: Hangi alt modal açıldıysa takip eder
    const [openedChild, setOpenedChild] = useState<'job' | null>(null);
  
    // Silme onayı için state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Eğer dışarıdan iş kapatılırsa, kendi state'imizi de temizliyoruz
  useEffect(() => {
    if (!selectedJob && openedChild === 'job') setOpenedChild(null);
  }, [selectedJob, openedChild]);

  // isStacked artık bu alt state'e bakarak karar verir (Böylece çakışma olmaz)
  const isStacked = openedChild !== null;

  // Personele atanmış tüm işleri buluyoruz
  const staffJobs = (data?.jobs || []).filter((j:any) => String(j.staff_id) === String(selectedStaff?.id));
  
  // İş istatistikleri
  const completedJobs = staffJobs.filter((j:any) => j.status === 'Tamamlandı').length;
  const activeJobs = staffJobs.filter((j:any) => ['Devam Ediyor', 'Usta Bekliyor', 'Onay Bekliyor'].includes(j.status)).length;

  // Filtrelenmiş Liste
  const displayJobs = staffJobs.filter((j:any) => {
    if (jobFilter === 'Tamamlandı') return j.status === 'Tamamlandı';
    if (jobFilter === 'Aktif') return ['Devam Ediyor', 'Usta Bekliyor', 'Onay Bekliyor'].includes(j.status);
    return true;
  });

  // Branş listesi için
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
    'Usta Bekliyor': 'bg-indigo-100 text-indigo-700 border-indigo-200'
  };

  const getDynamicStatus = (job: any, hasWorker: boolean) => {
    if (!job) return { label: '', colorClass: '' };
    let label = job.status || 'Beklemede';

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

  const closeThisModal = () => {
    setSelectedStaff(null);
    if (handleCloseDetail) handleCloseDetail('staff');
    setIsEditingStaff(false);
    setActiveTab('info');
    setJobFilter('Tümü');
  };

  // 🚀 AKILLI POPSTATE VE ESC YÖNETİMİ (Geri tuşu ve ESC ile kapatmak için)
  const handleSmartClose = useCallback((e?: any) => {
    // Üstte bir modal varsa (isStacked true) esc/geri burayı etkilemesin
    if (isStacked) return true;

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

    if (isEditingStaff) {
        stopEvent();
        setIsEditingStaff(false);
        return true;
    }

    if (selectedStaff) {
        stopEvent();
        closeThisModal();
        return true;
    }

    return false;
  }, [isEditingStaff, selectedStaff, isStacked]);

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
    if (selectedStaff) {
        window.history.pushState({ staffModal: true }, '');
    }
  }, [selectedStaff]);

  useEffect(() => {
    if (isEditingStaff) {
        window.history.pushState({ internalLayer: true }, '');
    }
  }, [isEditingStaff]);

  useEffect(() => {
    if (!selectedStaff) return;

    const handlePopState = (e: PopStateEvent) => {
      handleSmartClose(e);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedStaff, handleSmartClose]);


  return (
    <AnimatePresence>
      {selectedStaff && (
        <motion.div 
        key="modal-backdrop-staff-detail"
        // 🚀 KESİN ÇÖZÜM 2.0: Pointer Events direkt Framer Motion'ın kendi motoruna bağlandı.
        // Style tag'i tamamen silindi. Modal çıkış emri aldığı milisaniyede tıklamalara karşı %100 geçirgen olur!
        initial={{ opacity: 0, pointerEvents: 'none' }} 
        animate={{ opacity: 1, pointerEvents: 'auto' }} 
        exit={{ opacity: 0, pointerEvents: 'none', display: 'none' }} 
        transition={{ duration: 0.15 }}
        className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${isStacked ? 'z-[10]' : 'z-[120]'}`}
      >
          {/* Arka plan tıklaması ile kapatma */}
          <div 
             className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isStacked ? 'opacity-0' : 'opacity-100'} cursor-pointer`} 
             onClick={() => !isStacked && closeThisModal()}
          ></div>

          <motion.div 
            key="modal-content-staff-detail"
            initial={{ opacity: 0, scale: 0.95, y: 10, pointerEvents: 'none' }} 
            animate={{ 
                opacity: 1, 
                scale: isStacked ? 0.92 : 1, 
                y: isStacked ? -20 : 0, 
                filter: isStacked ? 'brightness(0.5)' : 'brightness(1)',
                pointerEvents: isStacked ? 'none' : 'auto' 
            }} 
            exit={{ opacity: 0, scale: 0.95, y: 10, pointerEvents: 'none' }} 
            transition={{ duration: 0.20, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 z-10"
          >
            {/* HEADER (Üst Başlık Alanı) */}
            <div className="flex justify-between items-start p-5 sm:p-6 pb-0 border-b border-slate-100 bg-slate-50/50 z-10 flex-col sm:flex-row sm:items-center gap-4 shrink-0">
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
                      <button onClick={closeThisModal} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95 sm:hidden"><X size={20} /></button>
                  </div>

                  {/* SEKMELER (Tabs) */}
                  {!isEditingStaff && (
                    <div className="flex gap-4 mt-4 border-b border-slate-200 w-full">
                        <button 
                            onClick={() => { setActiveTab('info'); setJobFilter('Tümü'); }}
                            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'info' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Personel Bilgileri
                            {activeTab === 'info' && <motion.div layoutId="staffTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                        <button 
                            onClick={() => { setActiveTab('jobs'); setJobFilter('Tümü'); }}
                            className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${activeTab === 'jobs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            İş Geçmişi
                            <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{staffJobs.length}</span>
                            {activeTab === 'jobs' && <motion.div layoutId="staffTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                    </div>
                  )}
              </div>
              <button onClick={closeThisModal} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95 hidden sm:block self-start"><X size={20} /></button>
            </div>

            {/* BODY (İçerik Alanı) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-white relative">
                
                <AnimatePresence mode="wait">
                  {/* BİLGİ SEKMESİ */}
                  {activeTab === 'info' && (
                    <motion.div key="info" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} className="space-y-5">
                        
                        {!isEditingStaff ? (
                            <>
                                {/* -- GÖRÜNTÜLEME MODU -- */}
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div 
                                      onClick={() => { setActiveTab('jobs'); setJobFilter('Tamamlandı'); }} 
                                      className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm cursor-pointer hover:bg-emerald-100 transition-colors group"
                                    >
                                        <CheckCircle size={24} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                                        <div className="text-2xl font-black text-emerald-700">{completedJobs}</div>
                                        <div className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest mt-1">Tamamlanan İş</div>
                                    </div>
                                    <div 
                                      onClick={() => { setActiveTab('jobs'); setJobFilter('Aktif'); }} 
                                      className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm cursor-pointer hover:bg-blue-100 transition-colors group"
                                    >
                                        <Clock size={24} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                                        <div className="text-2xl font-black text-blue-700">{activeJobs}</div>
                                        <div className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest mt-1">Aktif Görevi</div>
                                    </div>
                                </div>

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
                                    
                                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-start gap-3 sm:col-span-2">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0"><MapPin size={18} /></div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sorumlu Olduğu Bölgeler</div>
                                            <div className="text-sm font-bold text-slate-800 break-all">{selectedStaff.assigned_regions || 'Tüm Bölgeler'}</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* -- DÜZENLEME MODU -- */
                            <div className="space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 relative">
                                {userRole === 'Yönetici' && selectedStaff?.role === 'Yönetici' && (
                                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-bl-xl rounded-tr-2xl">Sadece Telefon Düzenlenebilir</div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ad Soyad</label>
                                        <input disabled={userRole === 'Yönetici' && selectedStaff?.role === 'Yönetici'} className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold w-full outline-none focus:border-blue-500 transition-all bg-white disabled:opacity-60 disabled:bg-slate-100" value={editStaffForm.name} onChange={(e) => setEditStaffForm({...editStaffForm, name: e.target.value})} placeholder="Ad Soyad" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Telefon</label>
                                        <input className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none focus:border-blue-500 transition-all bg-white" value={editStaffForm.phone} onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})} placeholder="Telefon" />
                                    </div>
                                    
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Yetki / Rol</label>
                                        <select 
                                            disabled={userRole === 'Yönetici' && selectedStaff?.role === 'Yönetici'}
                                            className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none bg-white focus:border-blue-500 transition-all disabled:opacity-60 disabled:bg-slate-100" 
                                            value={editStaffForm.role || 'Usta'} 
                                            onChange={(e) => setEditStaffForm({...editStaffForm, role: e.target.value})}
                                        >
                                            {userRole === 'Patron' && <option value="Yönetici">Yönetici</option>}
                                            {userRole !== 'Patron' && selectedStaff?.role === 'Yönetici' && <option value="Yönetici" disabled>Yönetici</option>}
                                            <option value="Usta">Usta</option>
                                            <option value="Çırak">Çırak</option>
                                        </select>
                                    </div>
                                    
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Branş / Uzmanlık</label>
                                        <select disabled={userRole === 'Yönetici' && selectedStaff?.role === 'Yönetici'} className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none bg-white focus:border-blue-500 transition-all disabled:opacity-60 disabled:bg-slate-100" value={editStaffForm.branch} onChange={(e) => setEditStaffForm({...editStaffForm, branch: e.target.value})}>
                                            <option value="">Seçiniz</option>
                                            {branchList.map((subType: any) => (
                                                <option key={subType} value={subType}>{subType}</option>
                                            ))}
                                            <option value="Genel Usta">Genel Usta</option>
                                        </select>
                                    </div>

                                    <div className="col-span-1 sm:col-span-2 relative">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sorumlu Olduğu Bölgeler</label>
                                        <div 
                                            onClick={() => { if (!(userRole === 'Yönetici' && selectedStaff?.role === 'Yönetici')) setShowRegionModal(true); }}
                                            className={`w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold bg-white transition-all min-h-[46px] flex items-center flex-wrap gap-1.5 ${userRole === 'Yönetici' && selectedStaff?.role === 'Yönetici' ? 'opacity-60 bg-slate-100 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'}`}
                                        >
                                            {editStaffForm.assigned_regions ? (
                                                editStaffForm.assigned_regions.split(',').map((r:string, i:number) => r.trim() && (
                                                    <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[11px] font-bold">{r.trim()}</span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 font-medium">Bölge seçmek için tıklayın...</span>
                                            )}
                                        </div>
                                        
                                        {showRegionModal && !(userRole === 'Yönetici' && selectedStaff?.role === 'Yönetici') && (
                                            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
                                                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                                                    <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                                                        <h3 className="font-black text-slate-800">Bölgeleri Seçin</h3>
                                                        <button onClick={(e) => { e.stopPropagation(); setShowRegionModal(false); }} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg border border-slate-200"><X size={16} /></button>
                                                    </div>
                                                    <div className="p-3 border-b border-slate-100">
                                                        <select 
                                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                                            value={selectedCity}
                                                            onChange={(e) => setSelectedCity(e.target.value)}
                                                        >
                                                            {citiesList.map(city => (
                                                                <option key={city} value={city}>{city}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="p-4 overflow-y-auto grid grid-cols-2 gap-2 custom-scrollbar">
                                                        {currentDistricts.map((dist: string) => {
                                                            const isSelected = editStaffForm.assigned_regions?.includes(dist);
                                                            return (
                                                                <button 
                                                                    key={dist} 
                                                                    onClick={(e) => { e.stopPropagation(); toggleEditRegion(dist); }}
                                                                    className={`py-2 px-3 rounded-xl text-xs font-bold text-left transition-all border ${isSelected ? 'bg-blue-500 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                                                                >
                                                                    {dist}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                                                        <button onClick={(e) => { e.stopPropagation(); setShowRegionModal(false); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">Seçimi Tamamla</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="col-span-1 sm:col-span-2 pt-3 border-t border-slate-200 mt-1">
                                        <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest block mb-3">Güvenlik ve Giriş Bilgileri</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="col-span-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kullanıcı Adı</label>
                                                <input disabled={userRole === 'Yönetici' && selectedStaff?.role === 'Yönetici'} className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold w-full outline-none focus:border-blue-500 transition-all bg-white disabled:opacity-60 disabled:bg-slate-100" value={editStaffForm.username} onChange={(e) => setEditStaffForm({...editStaffForm, username: e.target.value.replace(/\s+/g, '').toLowerCase()})} placeholder="örn: ali.usta" />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hesap Şifresi</label>
                                                <input disabled={userRole === 'Yönetici' && selectedStaff?.role === 'Yönetici'} type="text" autoComplete="new-password" title="Mevcut şifreyi değiştirmek istemiyorsanız boş bırakın." className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none focus:border-blue-500 transition-all placeholder:text-[10px] placeholder:text-slate-400 bg-white disabled:opacity-60 disabled:bg-slate-100" value={editStaffForm.password} onChange={(e) => setEditStaffForm({...editStaffForm, password: e.target.value})} placeholder="Değiştirmek için yazın..." />
                                            </div>
                                            <div className="col-span-1 sm:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hesap Durumu</label>
                                                <select disabled={userRole === 'Yönetici' && selectedStaff?.role === 'Yönetici'} className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold w-full outline-none bg-white focus:border-blue-500 transition-all disabled:opacity-60 disabled:bg-slate-100" value={editStaffForm.is_active} onChange={(e) => setEditStaffForm({...editStaffForm, is_active: Number(e.target.value)})}>
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
                    <motion.div key="jobs" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="flex flex-col h-full">
                        
                        {jobFilter !== 'Tümü' && (
                            <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold mb-4 flex justify-between items-center border border-blue-100 shrink-0">
                                <span className="flex items-center gap-1.5"><Filter size={14}/> Sadece "{jobFilter}" durumundaki işler gösteriliyor.</span>
                                <button onClick={() => setJobFilter('Tümü')} className="text-blue-500 hover:text-blue-800 underline">Tümünü Gör</button>
                            </div>
                        )}

                        {displayJobs.length > 0 ? (
                            <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-100 pb-4">
                                {displayJobs.sort((a:any, b:any) => new Date(b.created_at || b.scheduled_date).getTime() - new Date(a.created_at || a.scheduled_date).getTime()).map((job: any) => {
                                    
                                    // 🚀 Varlık, Apartman ve Dinamik Durum Hesaplamaları
                                    const currentAsset = data?.assets?.find((a: any) => String(a.id) === String(job.asset_id));
                                    const aptName = currentAsset?.apartmentName || currentAsset?.apartment_name;
                                    const detailWorker = job.details?.worker_id ? true : false;
                                    const staffWorker = job.staff_id && data?.staff?.find((s:any) => String(s.id) === String(job.staff_id) && s.role !== 'Yönetici');
                                    const hasWorker = !!(detailWorker || staffWorker);
                                    const dynamicStatus = getDynamicStatus(job, hasWorker);

                                    return (
                                        <div 
                                          key={job.id}
                                          onClick={() => {
                                              if(setSelectedJob) {
                                                  // 🚀 KİMİ AÇTIĞIMIZI BİLDİRİYORUZ
                                                  setOpenedChild('job');
                                                  setSelectedJob(job);
                                              }
                                          }}
                                          className="relative pl-12 cursor-pointer group"
                                        >
                                            <div className={`absolute left-[13px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white z-10 transition-transform group-hover:scale-125 ${job.status === 'Tamamlandı' ? 'bg-emerald-500' : job.status === 'İptal' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                            
                                            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all">
                                                <div className="flex justify-between items-start mb-2 gap-2">
                                                    <div className="min-w-0 flex flex-col gap-1 pr-2">
                                                        <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors truncate">
                                                            {aptName ? (
                                                                <><span className="text-blue-600">{aptName}</span> - {job.customer_name}</>
                                                            ) : (
                                                                job.customer_name || 'Genel Görev'
                                                            )}
                                                        </div>
                                                        {currentAsset && (
                                                            <div className="text-[11px] font-bold text-slate-500 truncate">
                                                                {currentAsset.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 shadow-sm ${dynamicStatus.colorClass}`}>
                                                        {dynamicStatus.label}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-2">
                                                    <Briefcase size={12} className="opacity-70 shrink-0" /> <span className="truncate">{job.work_type}</span>
                                                    <span className="mx-1 text-slate-300 shrink-0">•</span>
                                                    <Calendar size={12} className={`shrink-0 ${dynamicStatus.label === 'Gecikti' ? 'text-rose-500' : 'text-slate-400'}`} /> 
                                                    <span className={dynamicStatus.label === 'Gecikti' ? 'text-rose-600 font-bold whitespace-nowrap' : 'whitespace-nowrap'}>
                                                        {job.created_at?.split('T')[0] || job.scheduled_date || 'Tarih Yok'}
                                                    </span>
                                                </div>
                                                {job.details?.note && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-medium text-slate-600 line-clamp-2 italic">
                                                        "{job.details.note.replace(/\[📍 Konum Kaydı\].*/g, '')}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
                                    <Briefcase size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700">Sonuç Bulunamadı</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Bu filtreye uygun herhangi bir iş kaydı yok.</p>
                            </div>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* FOOTER (Alt Aksiyon Alanı) */}
            <div className="pt-4 sm:pt-5 border-t border-slate-100 p-5 sm:p-6 bg-slate-50 shrink-0 z-10">
                {!isEditingStaff ? (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                        <button onClick={() => setIsEditingStaff(true)} className="flex-[2] bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"><Settings size={16} /> Profili Düzenle</button>
                        
                        {/* 🚀 YALNIZCA PATRON PERSONEL SİLEBİLİR */}
                        {userRole === 'Patron' && (
                            <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 bg-rose-50 border border-rose-200 text-rose-600 py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16} /> Sil</button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button onClick={() => handleAction('add-staff', { ...editStaffForm, id: selectedStaff.id }, closeThisModal, () => setIsEditingStaff(false))} className="w-full sm:flex-[2] bg-blue-600 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md flex justify-center items-center disabled:opacity-50">
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Değişiklikleri Kaydet'}
                        </button>
                        <button onClick={() => setIsEditingStaff(false)} className="w-full sm:flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95">İptal</button>
                        </div>
                )}
            </div>

            {/* SİLME ONAY MODALI */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="absolute inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 10 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 10 }} 
                            className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center"
                        >
                            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Personeli Sil</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6">
                                <strong className="text-slate-700">{selectedStaff?.name}</strong> adlı personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)} 
                                    className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    İptal
                                </button>
                                <button 
                                    onClick={async () => {
                                        await handleAction('delete-staff', { id: selectedStaff.id }, closeThisModal, () => {});
                                        setShowDeleteConfirm(false);
                                    }} 
                                    disabled={isSaving}
                                    className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Evet, Sil'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}