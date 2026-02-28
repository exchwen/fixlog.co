'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Search, User, Box, Calendar, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle, Clock, Image as ImageIcon, Download, MessageSquareText, Settings, CheckSquare, Tag, Wrench, ArrowUpRight, UserPlus, UserCheck } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';

export default function JobDetailModal({
  selectedJob, setSelectedJob, previewPdfJob, setPreviewPdfJob,
  fullScreenImage, setFullScreenImage, isEditingJobDetail, setIsEditingJobDetail,
  showCancelConfirm, setShowCancelConfirm, editJobDetailForm, setEditJobDetailForm,
  jobTargetMode, setJobTargetMode, jobPrice, setJobPrice, isApproving, setIsApproving,
  jobModalType, setJobModalType, handleAction, isSaving, data,
  isAnyProfileDetailOpen, isMobile, handleCloseDetail, userRole,
  searchCust, setSearchCust, searchAsset, setSearchAsset,
  selectedCustomer, setSelectedCustomer,
  selectedAsset, setSelectedAsset
}: any) {

  // 🚀 Hangi alt modalın BU modal tarafından açıldığını takip ediyoruz
  const [openedChild, setOpenedChild] = useState<'customer' | 'asset' | null>(null);

  // Dışarıdan modal kapandığında local state'i temizle
  useEffect(() => {
    if (!selectedCustomer && openedChild === 'customer') setOpenedChild(null);
  }, [selectedCustomer, openedChild]);

  useEffect(() => {
    if (!selectedAsset && openedChild === 'asset') setOpenedChild(null);
  }, [selectedAsset, openedChild]);

  // 🚀 AKILLI VE KADEMELİ KAPATMA MANTIĞI
  const handleSmartClose = useCallback((e?: any) => {
    
    // 🚀 Alt profil açıksa, esc/geri tuşu alt profili kapatsın, bana dokunmasın
    if (openedChild !== null) return true;

    const stopEvent = () => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        } 
        else if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
            e.nativeEvent.stopImmediatePropagation();
        }
      }
    };

    if (fullScreenImage) {
      stopEvent();
      setFullScreenImage(null);
      return true;
    }
    if (previewPdfJob) {
      stopEvent();
      setPreviewPdfJob(null);
      return true;
    }

    if (showCancelConfirm) {
      stopEvent();
      setShowCancelConfirm(false);
      return true;
    }

    if (isEditingJobDetail) {
      stopEvent();
      setIsEditingJobDetail(false);
      return true;
    }

    if (selectedJob) {
      // Başka dış modallar varsa dokunmuyoruz.
      if (isAnyProfileDetailOpen && !openedChild) return false;
      
      stopEvent();
      setSelectedJob(null);
      if (handleCloseDetail) handleCloseDetail('job');
      return true;
    }

    return false;
  }, [
    fullScreenImage, previewPdfJob, showCancelConfirm, openedChild, 
    isEditingJobDetail, selectedJob, isAnyProfileDetailOpen, 
    setFullScreenImage, setPreviewPdfJob, setShowCancelConfirm, 
    setIsEditingJobDetail, setSelectedJob, handleCloseDetail
  ]);

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
    if (selectedJob) {
        window.history.pushState({ jobModal: true }, '');
    }
  }, [selectedJob]);

  useEffect(() => {
    if (fullScreenImage || previewPdfJob || showCancelConfirm || isEditingJobDetail || selectedCustomer || selectedAsset) {
        window.history.pushState({ internalLayer: true }, '');
    }
  }, [fullScreenImage, previewPdfJob, showCancelConfirm, isEditingJobDetail, selectedCustomer, selectedAsset]);

  useEffect(() => {
    if (!selectedJob) return;

    const handlePopState = (e: PopStateEvent) => {
      // Dış modal açıksa biz popstate'e karışmıyoruz
      if (isAnyProfileDetailOpen && openedChild === null) return;
      handleSmartClose(e);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedJob, isAnyProfileDetailOpen, openedChild, handleSmartClose]);

  const sendCustomerWhatsApp = (jobData: any) => {
     const custPhone = (data?.customers || []).find((c:any) => c.name === jobData.customer_name)?.contact;
     if(!custPhone) { alert("Müşterinin kayıtlı telefonu bulunamadı."); return; }
     
     let formattedPhone = custPhone.replace(/\s+/g, '');
     if (formattedPhone.startsWith('0')) formattedPhone = '90' + formattedPhone.substring(1);
     
     const assetName = (data?.assets || []).find((a:any) => a.id === jobData.asset_id)?.name || 'Cihazınızda';
     const price = jobData.details?.price || 'Ücretsiz';
     
     const message = `Merhaba ${jobData.customer_name},\n\n${assetName} işlem yapılmıştır, iş tamamlanmış olup detayları PDF olarak sunulmuştur.\n\nFiyat teklifimiz: ${price}\nÖdeme bilgilerimiz:\nTRXX XXXX XXXX XXXX XXXX XXXX (İş Bankası)\n\n(Servis formunu bu mesaja ek olarak iletebilirsiniz.)`;
     
     window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const statusColors: any = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200',
    'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const getDynamicStatus = (job: any, hasWorker: boolean) => {
    if (!job) return { label: '', colorClass: '' };
    let label = job.status || 'Beklemede';

    // 🚀 DÜZELTİLDİ: İş bir "Genel Görev" ise, usta atanmasına gerek yoktur!
    // Kabul edildiği an "Devam Ediyor" kalır, "Usta Bekliyor"a düşmez.
    const isGeneral = job.work_type === 'Genel Görev' || job.work_type === 'Görev' || !job.customer_name || job.customer_name === 'Genel Görev';

    if (!isGeneral && (label === 'Usta Bekliyor' || label === 'Devam Ediyor')) {
        label = hasWorker ? 'Devam Ediyor' : 'Usta Bekliyor';
    } else if (isGeneral && label === 'Usta Bekliyor') {
        label = 'Devam Ediyor'; // Genel görev kabul edildiyse direkt devam ediyordur
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

  const isEditJobValid = editJobDetailForm?.workCategory === 'Genel İş Atama' ? true : (editJobDetailForm?.customerName || editJobDetailForm?.assetId);
  const currentSector = data?.sector || '';
  const safeSectors: any = sectorsData;
  const branchList = currentSector && safeSectors?.sectors?.[currentSector]?.subTypes 
    ? Object.keys(safeSectors.sectors[currentSector].subTypes) 
    : [];

  const handleEditClick = () => {
    setIsEditingJobDetail(true);
    setEditJobDetailForm({ 
        workCategory: selectedJob.work_type === 'Genel Görev' ? 'Genel İş Atama' : 'Normal İş Atama',
        workType: selectedJob.work_type || 'Genel Görev',
        jobType: selectedJob.job_type || 'Anlık',
        scheduledDate: selectedJob.scheduled_date || '', 
        staffId: selectedJob.staff_id || '', 
        taskNote: selectedJob.details?.note || '',
        customerName: selectedJob.customer_name || '',
        assetId: selectedJob.asset_id || ''
    });
    if (selectedJob.asset_id) {
        setJobTargetMode('ASSET');
    } else {
        setJobTargetMode('CUSTOMER');
    }
  };

  // 🚀 iOS Stacking Kontrolü - SADECE benim açtıklarım veya PDF/Foto iç layerları
  const isStacked = Boolean(previewPdfJob || fullScreenImage || openedChild !== null);

  // 🚀 TÜM EKRANIN ULAŞABİLECEĞİ ORTAK DEĞİŞKENLER (Scope Hatasını Çözer)
  // 🚀 DÜZELTİLDİ: work_type'ı 'Görev' kalmış eski kayıtlar için veya müşteri adı boş olanları da Genel Görev say!
  const isGeneralTask = selectedJob?.work_type === 'Genel Görev' || selectedJob?.work_type === 'Görev' || !selectedJob?.customer_name || selectedJob?.customer_name === 'Genel Görev';
  const hasWorker = !!selectedJob?.worker_name || !!selectedJob?.details?.worker_id || !!(selectedJob?.staff_id && (data?.staff || []).find((s:any) => String(s.id) === String(selectedJob.staff_id) && s.role === 'Usta'));

  return (
    <>
      {/* 0. PDF ÖNİZLEME MODALI */}
      <AnimatePresence>
        {previewPdfJob && (
          <motion.div 
             key="pdf-modal-backdrop"
             className="fixed inset-0 flex items-center justify-center p-4 z-[200]"
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0, pointerEvents: "none" }} 
             transition={{ duration: 0.15 }}
          >
             <div 
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
               onClick={() => handleSmartClose()}
             />
             <motion.div 
               key="pdf-modal-content"
               initial={{ opacity: 0, scale: 0.95, y: 10 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.95, y: 10 }} 
               transition={{ duration: 0.25, ease: "easeInOut" }}
               onClick={(e) => e.stopPropagation()}
               className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative z-10"
             >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print z-10">
                   <h2 className="font-black text-lg text-slate-800">Servis Formu & Fiyat Özeti</h2>
                   <button onClick={() => handleSmartClose()} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"><X size={18} /></button>
                </div>
                
                <div id="pdf-printable-area" className="p-8 overflow-y-auto custom-scrollbar bg-white text-black print-area flex-1 relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none no-print"></div>
                    
                    <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start relative z-10">
                       <div>
                          <h1 className="text-2xl font-black">{data?.name || 'Firma Adı'}</h1>
                          <p className="text-sm text-slate-500 mt-1">{data?.address}</p>
                          <p className="text-xs font-bold text-slate-400 mt-1">{data?.phone}</p>
                       </div>
                       <div className="text-right">
                          <div className="text-xl font-black text-slate-300 tracking-widest">SERVİS FORMU</div>
                          <div className="text-sm font-bold mt-1">Kayıt No: #{previewPdfJob.id}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{new Date().toLocaleDateString('tr-TR')}</div>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                       <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Müşteri Bilgisi</div>
                          <div className="font-bold text-sm text-slate-800">{previewPdfJob.customer_name}</div>
                       </div>
                       <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cihaz / Apartman</div>
                          <div className="font-bold text-sm text-slate-800">
                              {(() => {
                                  const asset = (data?.assets || []).find((a:any) => a.id === previewPdfJob.asset_id);
                                  return asset ? `${asset.name} ${asset.apartmentName ? `- ${asset.apartmentName}` : ''}` : 'Belirtilmedi';
                              })()}
                          </div>
                       </div>
                    </div>

                    <div className="mb-8 relative z-10">
                       <div className="text-xs font-black text-slate-800 uppercase border-b border-slate-200 pb-2 mb-3">Yapılan İşlem / Rapor Detayı</div>
                       <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                           {previewPdfJob.details?.note?.replace(/\[📍 Konum Kaydı\].*/g, '') || 'Rapor girilmemiş.'}
                       </div>
                    </div>

                    {previewPdfJob.details?.price && (
                      <div className="flex justify-end border-t-2 border-slate-800 pt-4 mb-8 relative z-10">
                         <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Toplam İşlem Tutarı</div>
                            <div className="text-3xl font-black text-slate-900">{previewPdfJob.details.price}</div>
                         </div>
                      </div>
                    )}

                    {previewPdfJob.photos && previewPdfJob.photos.length > 0 && (
                       <div className="relative z-10">
                          <div className="text-xs font-black text-slate-800 uppercase border-b border-slate-200 pb-2 mb-3">Saha Kayıt Fotoğrafları</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                             {previewPdfJob.photos.map((p: string, i: number) => (
                               <img key={i} src={p} alt="Saha" className="w-full h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
                             ))}
                          </div>
                       </div>
                    )}
                </div>

                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3 no-print z-10">
                   <button onClick={() => window.print()} className="flex-[2] bg-slate-900 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95">
                      <Download size={18} /> PDF Olarak Cihaza Kaydet
                   </button>
                   <button onClick={() => sendCustomerWhatsApp(previewPdfJob)} className="flex-1 bg-emerald-500 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-md active:scale-95">
                      <MessageSquareText size={18} /> Müşteriye Gönder
                   </button>
                </div>
             </motion.div>
             
             <style dangerouslySetInnerHTML={{__html:`
               @media print {
                 body * { visibility: hidden; }
                 .print-area, .print-area * { visibility: visible; }
                 .print-area { position: absolute; left: 0; top: 0; width: 100%; height: 100%; padding: 20mm; background: white; z-index: 999999; }
                 .no-print { display: none !important; }
               }
             `}} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SEÇİLİ İŞ (GÖREV) DETAY MODALI */}
      <AnimatePresence>
        {selectedJob && jobModalType !== 'APPROVAL' && (
          <motion.div 
             key="job-modal-backdrop"
             className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${isStacked ? 'z-10' : 'z-[130]'}`}
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0, pointerEvents: "none" }} 
             transition={{ duration: 0.15 }}
          >
            {!(isAnyProfileDetailOpen && !isMobile) && (
                <div 
                   className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isStacked ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} cursor-pointer`} 
                   onClick={() => {
                       if (!isStacked) {
                           setSelectedJob(null);
                           if (handleCloseDetail) handleCloseDetail('job');
                       }
                   }}
                />
            )}

            <motion.div 
                key="job-modal-content"
                initial={{ opacity: 0, scale: 0.95, y: 10, x: isAnyProfileDetailOpen && !isMobile ? 280 : 0 }} 
                animate={{ 
                    opacity: 1, 
                    scale: isStacked ? 0.92 : 1, 
                    y: isStacked ? -20 : 0, 
                    filter: isStacked ? 'brightness(0.5)' : 'brightness(1)',
                    x: isAnyProfileDetailOpen && !isMobile ? 280 : 0 
                }} 
                exit={{ opacity: 0, scale: 0.95, y: 10, x: isAnyProfileDetailOpen && !isMobile ? 280 : 0 }} 
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ pointerEvents: isStacked ? 'none' : 'auto' }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 z-10"
            >
              
              <div className="flex justify-between items-start p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 z-10">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{isEditingJobDetail ? 'İş Emrini Düzenle' : 'İş Emri Detayı'}</h2>
                    <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                       <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold">#{selectedJob.id}</span>
                       <span>•</span>
                       <span className="flex items-center gap-1"><Clock size={12}/> {selectedJob.created_at?.split('T')[0] || ''}</span>
                    </div>
                </div>
                <button onClick={() => handleSmartClose()} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>

              {!isEditingJobDetail ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-4 sm:space-y-5 relative">
                    
                    {(() => {
                        // 🚀 D1 SÜTUNLARINDAN DİREKT OKUMA (Tertemiz)
                        const creator = selectedJob.creator_name || (data?.ownerName?.split(' ')[0] || 'Sistem');
                        let managerName = selectedJob.manager_name || null;
                        let finalWorkerName = selectedJob.worker_name || null;

                        // Eski veriler (json içi) için fallback (geri dönük uyumluluk)
                        if (!finalWorkerName) {
                            if (selectedJob.details?.worker_id) {
                                const w = (data?.staff || []).find((s:any) => String(s.id) === String(selectedJob.details?.worker_id));
                                if (w) finalWorkerName = w.name;
                            } else if (selectedJob.staff_id) {
                                const w = (data?.staff || []).find((s:any) => String(s.id) === String(selectedJob.staff_id));
                                if (w && w.role === 'Usta') finalWorkerName = w.name;
                            }
                        }

                        const dynamicStatus = getDynamicStatus(selectedJob, hasWorker);

                        return (
                            <>
                                <AnimatePresence>
                                {showCancelConfirm && (
                                    <motion.div 
                                       initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                       className="absolute inset-0 z-20 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-b-2xl"
                                    >
                                       <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                          <AlertTriangle size={32} />
                                       </div>
                                       <h3 className="text-xl font-black text-slate-800 mb-2">İşi İptal Etmek İstiyor musun?</h3>
                                       <p className="text-sm font-medium text-slate-500 mb-8 max-w-[250px] leading-relaxed">Bu işlem sonucunda iş emri 'İptal' durumuna geçecek ve listeden kaldırılmayacaktır.</p>
                                       <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[250px] sm:max-w-none">
                                           <button 
                                              onClick={async () => {
                                                  await handleAction('update-job', { 
                                                      id: selectedJob.id, 
                                                      status: 'İptal',
                                                      lastEditedBy: data?.ownerName || 'Yönetici' 
                                                  }, () => setSelectedJob(null), () => {});
                                              }}
                                              className="flex-1 bg-rose-600 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-rose-700 shadow-md shadow-rose-200 transition-all active:scale-95"
                                           >
                                              {isSaving ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Evet, İptal Et'}
                                           </button>
                                           <button 
                                              onClick={() => handleSmartClose()}
                                              className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                                           >
                                              Vazgeç
                                           </button>
                                       </div>
                                    </motion.div>
                                )}
                                </AnimatePresence>

                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GÜNCEL DURUM</span>
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black border uppercase tracking-wider ${dynamicStatus.colorClass}`}>
                                        {dynamicStatus.label}
                                    </span>
                                </div>

                                {/* 🚀 DÜZELTİLDİ: GRID YAPSISI KUSURSUZLAŞTIRILDI */}
                                {!isGeneralTask && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                        <div 
                                          onClick={() => {
                                              const theCustomer = (data?.customers || []).find((c:any) => c.name === selectedJob.customer_name);
                                              if(theCustomer && setSelectedCustomer) {
                                                  setOpenedChild('customer');
                                                  setSelectedCustomer(theCustomer);
                                              }
                                          }}
                                          className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors group cursor-pointer active:scale-95 relative"
                                        >
                                            <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Müşteri Profili</div>
                                            <div className="text-sm font-black text-slate-800 pr-5">{selectedJob.customer_name}</div>
                                            <button className="absolute top-4 right-4 text-slate-300 group-hover:text-blue-500 transition-colors">
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </div>
                                        
                                        {(() => {
                                            const theAsset = selectedJob.asset_id ? (data?.assets || []).find((a:any) => String(a.id) === String(selectedJob.asset_id)) : null;
                                            return (
                                                <div 
                                                   onClick={() => {
                                                      if(selectedJob.asset_id && setSelectedAsset && theAsset) {
                                                          setOpenedChild('asset');
                                                          setSelectedAsset(theAsset);
                                                      }
                                                   }}
                                                   className={`bg-white p-4 border border-slate-200 rounded-xl shadow-sm transition-colors relative ${selectedJob.asset_id ? 'hover:border-blue-300 cursor-pointer group active:scale-95' : 'opacity-70'}`}
                                                >
                                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">İlgili Varlık / Cihaz</div>
                                                    
                                                    {theAsset?.apartmentName && (
                                                        <div className="inline-block bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-bold mb-2 border border-blue-100">
                                                            🏢 {theAsset.apartmentName}
                                                        </div>
                                                    )}

                                                    <div className={`text-sm font-bold flex items-center gap-1.5 pr-5 ${selectedJob.asset_id ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                                        <Box size={16} className={selectedJob.asset_id ? 'text-blue-500' : 'text-slate-300'}/>
                                                        {theAsset ? theAsset.name : 'Varlık Seçilmemiş'}
                                                    </div>
                                                    {selectedJob.asset_id && (
                                                        <button className="absolute top-4 right-4 text-slate-300 group-hover:text-blue-500 transition-colors">
                                                            <ArrowUpRight size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                         <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Görev Tipi</div>
                                         <div className="text-sm font-bold text-slate-800">{selectedJob.work_type}</div>
                                    </div>
                                    
                                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                         <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Planlanan Tarih</div>
                                         <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <Calendar size={16} className={dynamicStatus.label === 'Gecikti' ? 'text-rose-500' : 'text-blue-500'}/>
                                            {selectedJob.scheduled_date || 'Anlık / Acil'}
                                         </div>
                                    </div>

                                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-center">
                                         <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Sorumlu Yönetici</div>
                                         <div className="text-sm font-bold text-slate-800 flex flex-col gap-1">
                                            {managerName === creator ? (
                                                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 w-fit px-2 py-0.5 rounded border border-blue-100">
                                                    <ShieldCheck size={14} /> {managerName} <span className="text-[9px] opacity-70 ml-1">(Oluşturan)</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                        <UserPlus size={12} /> {creator} <span className="text-[9px] opacity-70">(Oluşturan)</span>
                                                    </div>
                                                    {managerName && (
                                                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 w-fit px-2 py-0.5 rounded border border-blue-100 mt-1">
                                                            <UserCheck size={14} /> {managerName}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                         </div>
                                    </div>

                                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-center">
                                         <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Atanan Usta</div>
                                         <div className={`text-sm font-bold flex items-center gap-2 ${finalWorkerName ? 'text-emerald-700' : (isGeneralTask ? 'text-slate-500' : 'text-rose-600')}`}>
                                            <Wrench size={16} className={finalWorkerName ? 'text-emerald-500' : (isGeneralTask ? 'text-slate-400' : 'text-rose-400')}/>
                                            {finalWorkerName ? finalWorkerName : (isGeneralTask ? 'Gerek Yok (Genel Görev)' : 'Henüz Atanmadı')}
                                         </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}

                    {selectedJob.photos && selectedJob.photos.length > 0 && (
                        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
                            <div className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-1.5">
                                <ImageIcon size={14} /> SAHA FOTOĞRAFLARI ({selectedJob.photos.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedJob.photos.map((photoUrl: string, idx: number) => (
                                    <div 
                                      key={idx} 
                                      onClick={() => setFullScreenImage(photoUrl)}
                                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:border-blue-500 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <img src={photoUrl} alt={`Saha Fotoğrafı ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">GÖREV NOTLARI / AÇIKLAMA</div>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap italic border-l-2 border-slate-300 pl-3">
                            "{selectedJob.details?.note || 'Herhangi bir not girilmemiş.'}"
                        </p>
                    </div>

                    {selectedJob.details?.lastEditedBy && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                            <ShieldCheck size={18} className="textemerald-600 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-0.5">Güvenlik Kaydı</span>
                                <span className="text-xs font-medium text-slate-600">
                                    Son işlem <strong className="text-slate-800">{selectedJob.details.lastEditedBy}</strong> tarafından yapıldı.
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        {selectedJob.status === 'Onay Bekliyor' && (
                            <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-inner">
                               <div className="text-amber-800 font-black text-sm flex items-center gap-2"><AlertTriangle size={18}/> Personel İşi Tamamladı. Onayınız Bekleniyor.</div>
                               <input type="number" placeholder="Müşteriye yansıtılacak işlem ücreti (₺)" value={jobPrice} onChange={e => setJobPrice(e.target.value)} className="px-4 py-3 sm:py-3.5 rounded-xl border border-amber-300 font-bold outline-none focus:border-amber-500 w-full text-sm bg-white" />
                               <button disabled={isApproving || !jobPrice} onClick={async () => {
                                   setIsApproving(true);
                                   const newDetails = { ...selectedJob.details, price: jobPrice + ' TL' };
                                   await handleAction('update-job', { id: selectedJob.id, status: 'Tamamlandı', taskNote: selectedJob.details?.note, lastEditedBy: data?.ownerName, workType: selectedJob.work_type, details: newDetails }, null, null);
                                   await handleAction('approve-job', { jobId: selectedJob.id, amount: jobPrice, customerName: selectedJob.customer_name }, () => setSelectedJob(null), () => setJobPrice(''));
                                   setIsApproving(false);
                               }} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 sm:py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center active:scale-95 text-sm">
                                   {isApproving ? <Loader2 className="animate-spin" size={18}/> : 'Fiyatı Onayla ve Kasa\'ya İşle'}
                               </button>
                            </div>
                        )}

                        {selectedJob.status === 'Tamamlandı' && (
                            <button onClick={() => setPreviewPdfJob(selectedJob)} className="w-full bg-emerald-100 border border-emerald-300 text-emerald-700 font-black py-3.5 rounded-xl hover:bg-emerald-200 transition-all flex justify-center items-center gap-2 shadow-sm active:scale-95 text-sm">
                               <MessageSquareText size={18} /> Rapor Önizleme & WhatsApp Gönder
                            </button>
                        )}

{selectedJob.status !== 'Tamamlandı' && selectedJob.status !== 'İptal' && (
                        <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 w-full pt-4 mt-2 border-t border-slate-100">
                            {/* 🚀 KABUL ET BUTONU */}
                            {(userRole !== 'Patron' && 
                              (selectedJob.status === 'Beklemede' || selectedJob.status === 'Gelecek') && 
                              !hasWorker && 
                              (selectedJob.creator_role === 'Patron' || selectedJob.details?.creatorRole === 'Patron' || (selectedJob.creator_name || selectedJob.details?.createdBy || data?.ownerName?.split(' ')[0]) === data?.ownerName?.split(' ')[0])) ? (
                                <button 
                                    onClick={async () => {
                                        setIsApproving(true);
                                        const newStatus = isGeneralTask ? 'Devam Ediyor' : 'Usta Bekliyor';
                                        await handleAction('update-job', {
                                            id: selectedJob.id,
                                            status: newStatus,
                                            lastEditedBy: data?.ownerName || 'Yönetici',
                                        }, () => {
                                            setSelectedJob(null);
                                            if (setJobModalType) setJobModalType('');
                                        }, null);
                                        setIsApproving(false);
                                    }}
                                    disabled={isApproving}
                                    className="flex-1 w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                                >
                                    {isApproving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
                                    GÖREVİ KABUL ET
                                </button>
                            ) : (
                                <>
                                    {jobModalType === 'APPROVAL_FIRST_STEP' ? (
                                        <button 
                                            onClick={async () => {
                                                setIsApproving(true);
                                                const newStatus = isGeneralTask ? 'Devam Ediyor' : 'Usta Bekliyor';
                                                await handleAction('update-job', {
                                                    id: selectedJob.id,
                                                    status: newStatus,
                                                    lastEditedBy: data?.ownerName || 'Yönetici',
                                                }, () => {
                                                    setSelectedJob(null);
                                                    if (setJobModalType) setJobModalType('');
                                                }, null);
                                                setIsApproving(false);
                                            }}
                                            disabled={isApproving}
                                            className="flex-1 w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                                        >
                                            {isApproving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
                                            İŞİ ONAYLIYORUM
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={handleEditClick}
                                                className="flex-1 w-full bg-slate-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
                                            >
                                                <Settings size={16} /> {isGeneralTask ? 'Detayları Düzenle' : 'Düzenle / Ata'}
                                            </button>
                                            
                                            {/* 🚀 EKLENDİ: Genel Görev ise Yöneticinin İşi Direkt Bitirmesini Sağlayan Buton */}
                                            {(isGeneralTask && getDynamicStatus(selectedJob, hasWorker).label === 'Devam Ediyor') && (
                                                <button 
                                                    onClick={async () => {
                                                        setIsApproving(true);
                                                        await handleAction('update-job', {
                                                            id: selectedJob.id,
                                                            status: 'Tamamlandı',
                                                            lastEditedBy: data?.ownerName || 'Yönetici',
                                                        }, () => {
                                                            setSelectedJob(null);
                                                        }, null);
                                                        setIsApproving(false);
                                                    }}
                                                    disabled={isApproving}
                                                    className="flex-1 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                                                >
                                                    {isApproving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                                    İşi Tamamla
                                                </button>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                            
                            <button 
                                onClick={() => setShowCancelConfirm(true)}
                                className="flex-1 w-full bg-rose-50 text-rose-600 border border-rose-200 py-3.5 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <X size={16} strokeWidth={3} /> İptal Et
                            </button>
                        </div>
                    )}
                    </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5">
                    
                    {/* 🚀 DÜZELTİLDİ: Usta Bekliyor durumunda VEYA ASSIGN modunda, sadece branş, personel ve not görünür. */}
                    {jobModalType !== 'ASSIGN' && selectedJob?.status !== 'Usta Bekliyor' && !isGeneralTask && (
                        <>
                            <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">İş Türü</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setEditJobDetailForm({...editJobDetailForm, workCategory: 'Normal İş Atama'})} className={`py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${editJobDetailForm.workCategory !== 'Genel İş Atama' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Normal İş Atama</button>
                                <button onClick={() => setEditJobDetailForm({...editJobDetailForm, workCategory: 'Genel İş Atama', customerName: '', assetId: ''})} className={`py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${editJobDetailForm.workCategory === 'Genel İş Atama' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Genel İş Atama</button>
                            </div>
                            </div>

                            <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tarih / Zamanlama</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setEditJobDetailForm({...editJobDetailForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${editJobDetailForm.jobType === 'Anlık' ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Anlık Görev</button>
                                <button onClick={() => setEditJobDetailForm({...editJobDetailForm, jobType: 'Planlı'})} className={`py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${editJobDetailForm.jobType === 'Planlı' ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Tarih Planla</button>
                            </div>
                            {editJobDetailForm.jobType === 'Planlı' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                                <input type="date" value={editJobDetailForm.scheduledDate} className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" onChange={e => setEditJobDetailForm({...editJobDetailForm, scheduledDate: e.target.value})} />
                                </motion.div>
                            )}
                            </div>

                            {editJobDetailForm.workCategory !== 'Genel İş Atama' && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
                                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                <button onClick={() => setJobTargetMode('CUSTOMER')} className={`flex-1 py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${jobTargetMode === 'CUSTOMER' ? 'bg-white text-blue-700 border-blue-300 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-200'}`}>👤 Müşteri Seçerek İlerle</button>
                                <button onClick={() => setJobTargetMode('ASSET')} className={`flex-1 py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${jobTargetMode === 'ASSET' ? 'bg-white text-blue-700 border-blue-300 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-200'}`}>📦 Varlık Seçerek İlerle</button>
                                </div>

                                {jobTargetMode === 'CUSTOMER' ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    <div className="relative">
                                    <Search className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
                                    <input type="text" placeholder="İsim veya TC ile Müşteri Ara..." className="w-full pl-9 pr-3 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white" value={searchCust} onChange={e => setSearchCust(e.target.value)} />
                                    </div>
                                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white focus:border-blue-500 custom-scrollbar" size={4} value={editJobDetailForm.customerName} onChange={e => setEditJobDetailForm({...editJobDetailForm, customerName: e.target.value, assetId: ''})}>
                                    <option value="" disabled className="font-bold text-slate-400 border-b border-slate-100 pb-2 mb-2">-- 1. Listeden Müşteri Seçin --</option>
                                    {(data?.customers || []).filter((c:any) => c.name?.toLowerCase().includes(searchCust?.toLowerCase()) || c.tax_info?.includes(searchCust)).map((c: any) => <option key={c.id} value={c.name} className="py-2 border-b border-slate-50 last:border-0">{c.name} {c.tax_info ? `(${c.tax_info})` : ''}</option>)}
                                    </select>
                                    
                                    {editJobDetailForm.customerName && (() => {
                                    const selectedCustomer = (data?.customers || []).find((c:any) => c.name === editJobDetailForm.customerName);
                                    const customerAssets = (data?.assets || []).filter((a:any) => String(a.customer_id) === String(selectedCustomer?.id));
                                    
                                    return (
                                        <div className="pt-2 border-t border-slate-100">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">2. Bu Müşteriye Ait Varlık (İsteğe Bağlı)</label>
                                            <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white focus:border-blue-500" value={editJobDetailForm.assetId} onChange={e => setEditJobDetailForm({...editJobDetailForm, assetId: e.target.value})}>
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
                                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white focus:border-blue-500 custom-scrollbar" size={4} value={editJobDetailForm.assetId} onChange={e => {
                                    const selectedAsset = (data?.assets || []).find((a:any) => String(a.id) === String(e.target.value));
                                    const parentCust = (data?.customers || []).find((c:any) => String(c.id) === String(selectedAsset?.customer_id));
                                    setEditJobDetailForm({...editJobDetailForm, assetId: e.target.value, customerName: parentCust?.name || ''});
                                    }}>
                                    <option value="" disabled className="font-bold text-slate-400 border-b border-slate-100 pb-2 mb-2">-- Listeden Varlık Seçin --</option>
                                    {(data?.assets || []).filter((a: any) => a.name?.toLowerCase().includes(searchAsset?.toLowerCase())).map((a: any) => (
                                        <option key={a.id} value={a.id} className="py-2 border-b border-slate-50 last:border-0">{a.name} - {a.location}</option>
                                    ))}
                                    </select>
                                    {editJobDetailForm.assetId && (
                                        <div className="mt-3 text-[10px] font-bold text-blue-700 bg-blue-50/80 p-2.5 rounded-lg border border-blue-100 flex items-center gap-1.5">
                                            <CheckCircle size={14} className="text-blue-500 shrink-0"/> Müşteri Eşleşti: <span className="text-slate-800 truncate">{editJobDetailForm.customerName || 'Bağımsız Varlık'}</span>
                                        </div>
                                    )}
                                </motion.div>
                                )}
                            </div>
                            )}
                        </>
                    )}

                    {/* 🚀 EKLENDİ: Görev Tipi / Branş Seçimi */}
                    {editJobDetailForm.workCategory !== 'Genel İş Atama' && (
                                  <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Görev Tipi / Branş</label>
                                    <select className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={editJobDetailForm.workType} onChange={e => setEditJobDetailForm({...editJobDetailForm, workType: e.target.value})}>
                                      <option value="Genel Görev">Genel Görev</option>
                                      {branchList.map((subType: any) => (
                                        <option key={subType} value={subType}>{subType}</option>
                                      ))}
                                    </select>
                                  </div>
                              )}

                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                        {jobModalType === 'ASSIGN' || selectedJob?.status === 'Usta Bekliyor' ? 'Atanacak Usta Seçimi' : 'Sorumlu Personel'}
                      </label>
                      <select className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={editJobDetailForm.staffId} onChange={e => setEditJobDetailForm({...editJobDetailForm, staffId: e.target.value})}>
                        <option value="">Seçiniz...</option>
                        {(data?.staff || [])
                          .filter((s:any) => userRole === 'Patron' && selectedJob?.status !== 'Usta Bekliyor' && jobModalType !== 'ASSIGN' ? s.role === 'Yönetici' : s.role === 'Usta')
                          .map((s:any) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Görev Özeti / Talimatlar</label>
                      <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="İşin detayı nedir?..." value={editJobDetailForm.taskNote} onChange={e => setEditJobDetailForm({...editJobDetailForm, taskNote: e.target.value})} />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 w-full pt-4 mt-2 border-t border-slate-100">
                        <button 
                            disabled={!isEditJobValid || isSaving}
                            onClick={() => handleAction('update-job', { 
                                ...editJobDetailForm, 
                                id: selectedJob.id,
                                lastEditedBy: data?.ownerName || 'Yönetici' 
                            }, () => setSelectedJob(null), () => setIsEditingJobDetail(false))} 
                            className="flex-1 w-full bg-slate-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-md flex justify-center items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : (jobModalType === 'ASSIGN' || selectedJob?.status === 'Usta Bekliyor' ? 'Ustayı Ata' : 'Değişiklikleri Kaydet')}
                        </button>
                        <button 
                            onClick={() => handleSmartClose()} 
                            className="flex-1 w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 flex justify-center items-center"
                        >
                            Vazgeç
                        </button>
                    </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FULLSCREEN GÖRSEL MODALI (Z-Index En Yüksek) */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div 
            key="image-modal-backdrop"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, pointerEvents: "none" }} 
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4"
          >
            <div 
               className="absolute inset-0 bg-slate-900/90 backdrop-blur-md cursor-pointer"
               onClick={() => handleSmartClose()}
            />
            <button 
               onClick={() => handleSmartClose()} 
               className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-rose-500 text-white rounded-full transition-colors backdrop-blur-sm z-20"
            >
               <X size={24} />
            </button>
            <motion.img 
               key="image-modal-content"
               initial={{ scale: 0.95, y: 10 }} 
               animate={{ scale: 1, y: 0 }} 
               exit={{ scale: 0.95, y: 10 }} 
               transition={{ duration: 0.25, ease: "easeInOut" }}
               src={fullScreenImage} 
               alt="Büyütülmüş Fotoğraf" 
               className="max-w-full max-h-full object-contain rounded-xl shadow-2xl relative z-10"
               onClick={(e) => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}