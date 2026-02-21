'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trash2, Loader2, Search, User, Box, ExternalLink, MapPin, Calendar, AlertTriangle, ArrowRight, Filter, ShieldCheck, CheckCircle, Clock, Plus, Tags, Truck, Edit2, ShieldAlert, MessageSquareText, Image as ImageIcon, Download } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';
import trCitiesData from '@/lib/data/tr-cities.json';

const CITY_DATA: any = trCitiesData;

export default function DashboardModals({
  showStaffDetail, setShowStaffDetail, isEditingStaff, setIsEditingStaff, editStaffForm, setEditStaffForm,
  showCustomerDetail, setShowCustomerDetail,
  showAssetDetail, setShowAssetDetail,
  showJobModal, setShowJobModal, jobForm, setJobForm,
  showAssetModal, setShowAssetModal, assetForm, setAssetForm,
  showStaffModal, setShowStaffModal, staffForm, setStaffForm,
  showCustomerModal, setShowCustomerModal, customerForm, setCustomerForm,
  showStockModal, setShowStockModal, stockForm, setStockForm,
  showSupplierModal, setShowSupplierModal, supplierForm, setSupplierForm,
  showSupplierListModal, setShowSupplierListModal,
  showCategoryModal, setShowCategoryModal,
  selectedJob, setSelectedJob,
  handleAction, isSaving, data,
  userRole = 'Patron'
}: any) {
  
  const [searchCust, setSearchCust] = useState('');
  const [searchAsset, setSearchAsset] = useState('');
  const [searchSupplier, setSearchSupplier] = useState('');
  const [jobTargetMode, setJobTargetMode] = useState('CUSTOMER'); 

  const [staffJobSearch, setStaffJobSearch] = useState('');

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [buildingNo, setBuildingNo] = useState('');

  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({ id: '', name: '', contact: '', address: '', taxInfo: '' });

  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [editAssetForm, setEditAssetForm] = useState({ id: '', name: '', location: '', apartmentName: '', deviceDetails: '' });

  const [isEditingJobDetail, setIsEditingJobDetail] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const [editJobDetailForm, setEditJobDetailForm] = useState({ 
    workCategory: 'Normal İş Atama',
    workType: 'Genel Görev',
    jobType: 'Anlık',
    scheduledDate: '', 
    staffId: '', 
    taskNote: '',
    customerName: '',
    assetId: ''
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editSupFormLocal, setEditSupFormLocal] = useState({ name: '', phone: '' });

  const [assetDetailTab, setAssetDetailTab] = useState('info');

  const [jobPrice, setJobPrice] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [previewPdfJob, setPreviewPdfJob] = useState<any>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // YENİ: Mobilde yan yana açılmayı engellemek için ekran genişliği kontrolü
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const closeAllModals = () => {
    if (showStaffDetail) setShowStaffDetail(null);
    if (showCustomerDetail) { setShowCustomerDetail(null); setIsEditingCustomer(false); }
    if (showAssetDetail) { setShowAssetDetail(null); setIsEditingAsset(false); setAssetDetailTab('info'); }
    if (selectedJob) { setSelectedJob(null); setIsEditingJobDetail(false); setShowCancelConfirm(false); setFullScreenImage(null); }
    if (previewPdfJob) setPreviewPdfJob(null);
    
    setShowJobModal(false); 
    setShowAssetModal(false); 
    setShowStaffModal(false); 
    setShowCustomerModal(false); 
    setShowStockModal(false); 
    setShowSupplierModal(false);
    if (setShowCategoryModal) setShowCategoryModal(false);
    if (setShowSupplierListModal) setShowSupplierListModal(false);
    
    setSelectedCity(''); setSelectedDistrict(''); setBuildingNo('');
  };

  const handleCloseDetail = (type: string) => {
    if (type === 'customer' && setShowCustomerDetail) { 
        setShowCustomerDetail(null); 
        setIsEditingCustomer(false);
        setSelectedCity(''); setSelectedDistrict(''); setBuildingNo('');
    }
    if (type === 'asset' && setShowAssetDetail) { 
        setShowAssetDetail(null); 
        setIsEditingAsset(false);
        setAssetDetailTab('info');
        setSelectedCity(''); setSelectedDistrict(''); setBuildingNo('');
    }
    if (type === 'job' && setSelectedJob) { 
        setSelectedJob(null); 
        setIsEditingJobDetail(false); 
        setShowCancelConfirm(false); 
        setFullScreenImage(null);
    }
  };

  const isAnyModalOpen = showStaffDetail || showCustomerDetail || showAssetDetail || showJobModal || showAssetModal || showStaffModal || showCustomerModal || showStockModal || showSupplierModal || showSupplierListModal || showCategoryModal || selectedJob || previewPdfJob || fullScreenImage;

  useEffect(() => {
    if (isAnyModalOpen) {
      window.history.pushState({ modalOpen: true }, '', window.location.href);

      const handlePopState = () => {
        if (fullScreenImage) {
            setFullScreenImage(null);
        } else if (previewPdfJob) {
            setPreviewPdfJob(null);
        } else {
            closeAllModals(); 
        }
      };

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (fullScreenImage) {
                setFullScreenImage(null);
            } else if (previewPdfJob) {
                setPreviewPdfJob(null);
            } else {
                closeAllModals();
            }
        }
      };

      window.addEventListener('popstate', handlePopState);
      window.addEventListener('keydown', handleEsc);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isAnyModalOpen, previewPdfJob, fullScreenImage]);

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

  const assetCustMode = assetForm.customerMode || 'NONE';
  const custAssetMode = customerForm.assetMode || 'NONE';
  const stockSupplierMode = stockForm.supplierMode || 'NONE';
  const isJobValid = jobForm.workCategory === 'Genel İş Atama' ? true : (jobForm.customerName || jobForm.assetId);
  const isEditJobValid = editJobDetailForm.workCategory === 'Genel İş Atama' ? true : (editJobDetailForm.customerName || editJobDetailForm.assetId);

  const currentSector = data?.sector || '';
  const safeSectors: any = sectorsData;
  const branchList = currentSector && safeSectors?.sectors?.[currentSector]?.subTypes 
    ? Object.keys(safeSectors.sectors[currentSector].subTypes) 
    : [];

  const filteredStaffJobs = showStaffDetail 
    ? (data?.jobs || [])
        .filter((j: any) => j.staff_id === showStaffDetail.id)
        .filter((j: any) => 
            j.customer_name?.toLowerCase().includes(staffJobSearch.toLowerCase()) ||
            j.work_type?.toLowerCase().includes(staffJobSearch.toLowerCase()) ||
            j.status?.toLowerCase().includes(staffJobSearch.toLowerCase())
        )
    : [];

  const categories = data?.categories || [];
  const isAnyProfileDetailOpen = showStaffDetail || showCustomerDetail || showAssetDetail;

  return (
    <>
      {/* 0. PDF ÖNİZLEME MODALI */}
      <AnimatePresence>
        {previewPdfJob && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print z-10">
                   <h2 className="font-black text-lg text-slate-800">Servis Formu & Fiyat Özeti</h2>
                   <button onClick={() => setPreviewPdfJob(null)} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"><X size={18} /></button>
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
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cihaz / Konum</div>
                          <div className="font-bold text-sm text-slate-800">{(data?.assets || []).find((a:any) => a.id === previewPdfJob.asset_id)?.name || 'Belirtilmedi'}</div>
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
                               <img key={i} src={p} className="w-full h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
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
          </div>
        )}
      </AnimatePresence>

      {/* 1. SEÇİLİ İŞ (GÖREV) DETAY MODALI */}
      <AnimatePresence>
        {selectedJob && !previewPdfJob && (
          <div className={`fixed inset-0 z-[130] flex items-center justify-center p-4 ${isAnyProfileDetailOpen && !isMobile ? 'bg-transparent pointer-events-none' : 'bg-slate-900/60 backdrop-blur-sm'}`}>
            
            {!(isAnyProfileDetailOpen && !isMobile) && (
                <div className="absolute inset-0" onClick={() => handleCloseDetail('job')}></div>
            )}

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: isAnyProfileDetailOpen && !isMobile ? 280 : 0 }} 
                animate={{ opacity: 1, scale: 1, x: isAnyProfileDetailOpen && !isMobile ? 280 : 0 }} 
                exit={{ opacity: 0, scale: 0.95, x: isAnyProfileDetailOpen && !isMobile ? 280 : 0 }} 
                className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 pointer-events-auto transition-transform duration-300"
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
                <button onClick={() => { setSelectedJob(null); setIsEditingJobDetail(false); setShowCancelConfirm(false); setFullScreenImage(null); }} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>

              {!isEditingJobDetail ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-4 sm:space-y-5 relative">
                    
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
                                  onClick={() => setShowCancelConfirm(false)}
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
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black border uppercase tracking-wider ${statusColors[selectedJob.status] || 'bg-slate-100'}`}>{selectedJob.status}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                            <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Müşteri / Lokasyon</div>
                            <div className="text-sm font-black text-slate-800">{selectedJob.customer_name}</div>
                            {selectedJob.asset_id && (
                                <div className="text-xs font-semibold text-blue-600 mt-1.5 flex items-center gap-1.5">
                                    <Box size={14} className="opacity-70" />
                                    {(data?.assets || []).find((a:any) => a.id === selectedJob.asset_id)?.name || 'Bilinmeyen Cihaz'}
                                </div>
                            )}
                        </div>
                        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                             <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Görev Tipi</div>
                             <div className="text-sm font-bold text-slate-800">{selectedJob.work_type}</div>
                        </div>
                        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                             <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Planlanan Tarih</div>
                             <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-500"/>
                                {selectedJob.scheduled_date || 'Anlık / Acil'}
                             </div>
                        </div>
                        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                             <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Sorumlu Personel</div>
                             <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <User size={16} className="text-amber-500"/>
                                {(data?.staff || []).find((s:any) => s.id === selectedJob.staff_id)?.name || 'Atanmamış'}
                             </div>
                        </div>
                    </div>

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
                            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
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

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full pt-2">
                            <button 
                                onClick={handleEditClick}
                                className="flex-1 bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
                            >
                                <Settings size={16} /> Düzenle / Ata
                            </button>
                            
                            {selectedJob.status !== 'İptal' && selectedJob.status !== 'Tamamlandı' && (
                                <button 
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="sm:w-1/3 bg-rose-50 text-rose-600 border border-rose-200 py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <X size={16} strokeWidth={3} /> İptal Et
                                </button>
                            )}
                        </div>
                    </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5">
                    
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

                    {/* DÜZENLENEN ALAN: AKILLI HEDEF SEÇİMİ (EDIT MODU İÇİN) */}
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
                              {(data?.customers || []).filter((c:any) => c.name?.toLowerCase().includes(searchCust.toLowerCase()) || c.tax_info?.includes(searchCust)).map((c: any) => <option key={c.id} value={c.name} className="py-2 border-b border-slate-50 last:border-0">{c.name} {c.tax_info ? `(${c.tax_info})` : ''}</option>)}
                            </select>
                            
                            {editJobDetailForm.customerName && (() => {
                               const selectedCustomer = (data?.customers || []).find((c:any) => c.name === editJobDetailForm.customerName);
                               const customerAssets = (data?.assets || []).filter((a:any) => a.customer_id === selectedCustomer?.id);
                               
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
                              {(data?.assets || []).filter((a: any) => a.name?.toLowerCase().includes(searchAsset.toLowerCase())).map((a: any) => (
                                <option key={a.id} value={a.id} className="py-2 border-b border-slate-50 last:border-0">{a.name} - {a.location}</option>
                              ))}
                            </select>
                            {editJobDetailForm.assetId && (
                                <div className="mt-3 text-[10px] font-bold text-blue-700 bg-blue-50/80 p-2.5 rounded-lg border border-blue-100 flex items-center gap-1.5">
                                    <CheckCircle size={14} className="text-blue-500"/> Otomatik Eşleşen Müşteri: <span className="text-slate-800">{editJobDetailForm.customerName || 'Bağımsız Varlık (Müşteri Yok)'}</span>
                                </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Görev Tipi / Branş</label>
                      <select className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={editJobDetailForm.workType} onChange={e => setEditJobDetailForm({...editJobDetailForm, workType: e.target.value})}>
                        <option value="Genel Görev">Genel Görev</option>
                        {branchList.map((subType: any) => (
                          <option key={subType} value={subType}>{subType}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Sorumlu Personel</label>
                      <select className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={editJobDetailForm.staffId} onChange={e => setEditJobDetailForm({...editJobDetailForm, staffId: e.target.value})}>
                        <option value="">Seçiniz...</option>
                        {(data?.staff || [])
                          .filter((s:any) => userRole === 'Patron' ? s.role === 'Yönetici' : s.role === 'Usta')
                          .map((s:any) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Görev Özeti / Talimatlar</label>
                      <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="İşin detayı nedir?..." value={editJobDetailForm.taskNote} onChange={e => setEditJobDetailForm({...editJobDetailForm, taskNote: e.target.value})} />
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button 
                            disabled={!isEditJobValid || isSaving}
                            onClick={() => handleAction('update-job', { 
                                ...editJobDetailForm, 
                                id: selectedJob.id,
                                lastEditedBy: data?.ownerName || 'Yönetici' 
                            }, () => setSelectedJob(null), () => setIsEditingJobDetail(false))} 
                            className="flex-1 bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-md"
                        >
                            {isSaving ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Değişiklikleri Kaydet'}
                        </button>
                        <button 
                            onClick={() => setIsEditingJobDetail(false)} 
                            className="w-full sm:w-1/3 bg-white border-2 border-slate-200 text-slate-700 py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Vazgeç
                        </button>
                    </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullScreenImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
            onClick={() => setFullScreenImage(null)}
          >
            <button 
               onClick={() => setFullScreenImage(null)} 
               className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-rose-500 text-white rounded-full transition-colors backdrop-blur-sm"
            >
               <X size={24} />
            </button>
            <motion.img 
               initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
               src={fullScreenImage} 
               alt="Büyütülmüş Fotoğraf" 
               className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
               onClick={(e) => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. PERSONEL DETAY MODALI */}
      <AnimatePresence>
        {showStaffDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowStaffDetail(null)}></div>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: selectedJob && !isMobile ? -280 : 0 }} 
                animate={{ opacity: 1, scale: 1, x: selectedJob && !isMobile ? -280 : 0 }} 
                exit={{ opacity: 0, scale: 0.95, x: selectedJob && !isMobile ? -280 : 0 }} 
                className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl relative flex flex-col max-h-[85vh] transition-transform duration-300 pointer-events-auto"
            >
              <div className="flex justify-between items-start mb-6 shrink-0">
                <div><h2 className="text-2xl font-black text-slate-900">{showStaffDetail.name}</h2><div className="text-xs font-medium text-slate-500 mt-1">Personel Dosyası</div></div>
                <button onClick={() => setShowStaffDetail(null)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>
              
              <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-1 space-y-4 pb-2">
                  {!isEditingStaff ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branş / Rol</div>
                            <div className="text-sm font-bold text-slate-800 mt-1">{showStaffDetail.branch || showStaffDetail.role}</div>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefon Numarası</div>
                            <div className="text-sm font-bold text-slate-800 mt-1">{showStaffDetail.phone || '-'}</div>
                         </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col min-h-0">
                         <div className="flex justify-between items-center mb-3 shrink-0">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">GÖREV GEÇMİŞİ</h4>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{filteredStaffJobs.length} Kayıt</span>
                         </div>
                         
                         <div className="relative mb-3 shrink-0">
                            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                            <input 
                              type="text" 
                              placeholder="Geçmiş işlerde ara..." 
                              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" 
                              value={staffJobSearch}
                              onChange={(e) => setStaffJobSearch(e.target.value)}
                            />
                         </div>

                         <div className="overflow-y-auto custom-scrollbar space-y-2.5 flex-1 pr-1 pb-4">
                              {filteredStaffJobs.length > 0 ? filteredStaffJobs.map((j: any) => (
                                <div 
                                   key={j.id} 
                                   onClick={(e) => { 
                                       e.stopPropagation(); 
                                       setSelectedJob(j); 
                                   }} 
                                   className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-95 group ${selectedJob?.id === j.id ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm'}`}
                                >
                                   <div className="min-w-0 pr-2">
                                      <div className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors truncate">{j.customer_name}</div>
                                      <div className="text-[10px] font-medium text-slate-500 mt-1 flex items-center gap-1"><Calendar size={12}/> {j.scheduled_date || 'Anlık'}</div>
                                   </div>
                                   <div className="flex items-center gap-3 shrink-0">
                                      <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                                      <ArrowRight size={16} className={`transition-all ${selectedJob?.id === j.id ? 'text-blue-600 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                                   </div>
                                </div>
                              )) : <div className="text-center p-8 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">Kriterlere uygun kayıt bulunamadı.</div>}
                         </div>
                      </div>
                    </>
                 ) : (
                    // DÜZELTİLEN YER: MOBİL EKRANDA TAŞMAYAN PERSONEL FORMU
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
                                 <input type="password" title="Mevcut şifreyi değiştirmek istemiyorsanız boş bırakın." className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold w-full outline-none focus:border-blue-500 transition-all placeholder:text-[10px] placeholder:text-slate-400 bg-white" value={editStaffForm.password} onChange={(e) => setEditStaffForm({...editStaffForm, password: e.target.value})} placeholder="Değiştirmek için yazın..." />
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
              </div>

              <div className="pt-4 sm:pt-5 border-t border-slate-100 shrink-0">
                 {!isEditingStaff ? (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                      <button onClick={() => setIsEditingStaff(true)} className="flex-[2] bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"><Settings size={16} /> Profili Düzenle</button>
                      <button onClick={async () => { if(confirm(`${showStaffDetail.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-staff', { id: showStaffDetail.id }, () => setShowStaffDetail(null), () => {}); } }} className="flex-1 bg-rose-50 border border-rose-200 text-rose-600 py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16} /> Sil</button>
                    </div>
                 ) : (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button onClick={() => handleAction('add-staff', { ...editStaffForm, id: showStaffDetail.id }, () => setShowStaffDetail(null), () => setIsEditingStaff(false))} className="w-full sm:flex-[2] bg-blue-600 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md flex justify-center items-center">{isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Kaydet'}</button>
                      <button onClick={() => setIsEditingStaff(false)} className="w-full sm:flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 sm:py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95">İptal</button>
                    </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. MÜŞTERİ DETAY MODALI */}
      <AnimatePresence>
        {showCustomerDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => handleCloseDetail('customer')}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95, x: selectedJob && !isMobile ? -280 : 0 }} animate={{ opacity: 1, scale: 1, x: selectedJob && !isMobile ? -280 : 0 }} exit={{ opacity: 0, scale: 0.95, x: selectedJob && !isMobile ? -280 : 0 }} className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative flex flex-col max-h-[85vh] transition-transform duration-300 pointer-events-auto overflow-hidden">
              
              <div className="flex justify-between items-start p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                <div><h2 className="text-xl font-black text-slate-900 leading-tight">{showCustomerDetail.name}</h2><div className="text-xs font-medium text-slate-500 mt-1">Müşteri / Kurum Profili</div></div>
                <button onClick={() => handleCloseDetail('customer')} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6">
                  {!isEditingCustomer ? (
                      <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İletişim / Telefon</div><div className="text-sm font-bold text-slate-800 mt-1.5">{showCustomerDetail.contact || '-'}</div></div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vergi No / T.C.</div><div className="text-sm font-bold text-slate-800 mt-1.5">{showCustomerDetail.tax_info || '-'}</div></div>
                          <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Açık Adres</div>
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1.5 gap-3">
                               <div className="text-sm font-medium text-slate-800 leading-relaxed">{showCustomerDetail.address || 'Adres belirtilmemiş.'}</div>
                               {showCustomerDetail.address && (
                                 <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showCustomerDetail.address || '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg transition-all active:scale-95 whitespace-nowrap shrink-0 shadow-sm"><MapPin size={14} /> Haritada Gör</a>
                               )}
                             </div>
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <h4 className="text-[11px] font-black text-blue-600 mb-2 uppercase tracking-widest flex items-center gap-1.5"><Box size={14}/> Kayıtlı Cihazları / Varlıkları</h4>
                              <div className="space-y-2">
                                  {(data?.assets || []).filter((a: any) => a.customer_id === showCustomerDetail.id).length > 0 ? (data?.assets || []).filter((a: any) => a.customer_id === showCustomerDetail.id).map((a: any) => (
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
                                  {(data?.jobs || []).filter((j: any) => j.customer_name === showCustomerDetail.name).length > 0 ? (data?.jobs || []).filter((j: any) => j.customer_name === showCustomerDetail.name).map((j: any) => (
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
                              <button onClick={async () => { if(confirm(`${showCustomerDetail.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-customer', { id: showCustomerDetail.id }, () => handleCloseDetail('customer'), () => {}); } }} className="flex-1 bg-rose-50 border border-rose-200 text-rose-600 py-3.5 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16} /> Sil</button>
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
                                    handleAction('update-customer', { ...editCustomerForm, address: combined }, () => handleCloseDetail('customer'), () => setIsEditingCustomer(false))
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

      {/* 4. VARLIK/CİHAZ DETAY MODALI */}
      <AnimatePresence>
        {showAssetDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => handleCloseDetail('asset')}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95, x: selectedJob && !isMobile ? -280 : 0 }} animate={{ opacity: 1, scale: 1, x: selectedJob && !isMobile ? -280 : 0 }} exit={{ opacity: 0, scale: 0.95, x: selectedJob && !isMobile ? -280 : 0 }} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col max-h-[85vh] transition-transform duration-300 pointer-events-auto overflow-hidden">
              <div className="flex justify-between items-start p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                <div><h2 className="text-xl font-black text-slate-900 leading-tight">{showAssetDetail.name}</h2><div className="text-xs font-medium text-slate-500 mt-1">Cihaz / Varlık Profili</div></div>
                <button onClick={() => handleCloseDetail('asset')} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>

              {/* SEKME MENÜSÜ */}
              {!isEditingAsset && (
                  <div className="flex border-b border-slate-200 bg-slate-50/50 px-2 sm:px-4 overflow-x-auto custom-scrollbar">
                      <button onClick={() => setAssetDetailTab('info')} className={`px-4 sm:px-5 py-3.5 text-[11px] sm:text-xs font-bold border-b-2 transition-all active:scale-95 whitespace-nowrap uppercase tracking-wider ${assetDetailTab === 'info' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Bilgiler</button>
                      <button onClick={() => setAssetDetailTab('jobs')} className={`px-4 sm:px-5 py-3.5 text-[11px] sm:text-xs font-bold border-b-2 transition-all active:scale-95 whitespace-nowrap uppercase tracking-wider ${assetDetailTab === 'jobs' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>İşler</button>
                      <button onClick={() => setAssetDetailTab('faults')} className={`px-4 sm:px-5 py-3.5 text-[11px] sm:text-xs font-bold border-b-2 transition-all active:scale-95 whitespace-nowrap uppercase tracking-wider ${assetDetailTab === 'faults' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Arızalar</button>
                      <button onClick={() => setAssetDetailTab('emergencies')} className={`px-4 sm:px-5 py-3.5 text-[11px] sm:text-xs font-bold border-b-2 transition-all active:scale-95 whitespace-nowrap uppercase tracking-wider ${assetDetailTab === 'emergencies' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Acil Durum</button>
                  </div>
              )}
              
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                  {!isEditingAsset ? (
                      <>
                      {assetDetailTab === 'info' && (
                          <div className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sahibi (Müşteri)</div>
                                      <div className="text-sm font-bold mt-2">
                                          {showAssetDetail.customer_id ? (() => { 
                                              const cust = (data?.customers || []).find((c: any) => c.id === showAssetDetail.customer_id); 
                                              return cust ? (
                                                  <span onClick={() => { setShowAssetDetail(null); setShowCustomerDetail(cust); }} className="inline-flex items-center justify-between w-full px-3 py-2 bg-white text-blue-700 font-bold border border-blue-200 rounded-lg hover:bg-blue-50 transition-all active:scale-95 cursor-pointer shadow-sm"><span className="flex items-center gap-2 truncate"><User size={14} className="opacity-70 shrink-0" /><span className="truncate">{cust.name}</span></span><ExternalLink size={14} className="opacity-50 shrink-0 ml-2" /></span>
                                              ) : <span className="text-slate-500">Bilinmiyor</span>; 
                                          })() : <span className="text-slate-500 italic">Bağımsız Cihaz</span>}
                                      </div>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tam Konum</div>
                                      <div className="flex flex-col mt-2 space-y-2">
                                          {(showAssetDetail.apartmentName || showAssetDetail.apartment_name) && (
                                              <div className="text-sm font-black text-slate-800">{showAssetDetail.apartmentName || showAssetDetail.apartment_name}</div>
                                          )}
                                          <div className="text-xs font-semibold text-slate-600 leading-snug">{showAssetDetail.location || 'Konum belirtilmemiş.'}</div>
                                          {showAssetDetail.location && (
                                              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showAssetDetail.location || '')}`} target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-100/50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-all active:scale-95 mt-1 border border-blue-200"><MapPin size={12} /> Haritada Gör</a>
                                          )}
                                      </div>
                                  </div>
                                  <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Teknik Detaylar</div>
                                      <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{showAssetDetail.asset_details || 'Teknik detay girilmemiş.'}</div>
                                  </div>
                              </div>
                              <div className="pt-5 border-t border-slate-100">
                                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                                      <button onClick={() => { setIsEditingAsset(true); setEditAssetForm({ id: showAssetDetail.id, name: showAssetDetail.name, location: parseAddressToState(showAssetDetail.location || ''), apartmentName: showAssetDetail.apartmentName || showAssetDetail.apartment_name || '', deviceDetails: showAssetDetail.asset_details || '' }); }} className="flex-[2] bg-slate-900 text-white py-3.5 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"><Settings size={16} /> Düzenle</button>
                                      <button onClick={async () => { if(confirm(`${showAssetDetail.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-asset', { id: showAssetDetail.id }, () => handleCloseDetail('asset'), () => {}); } }} className="flex-1 bg-rose-50 border border-rose-200 text-rose-600 py-3.5 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"><Trash2 size={16} /> Sil</button>
                                  </div>
                              </div>
                          </div>
                      )}

                      {assetDetailTab === 'jobs' && (
                          <div className="space-y-3">
                              {(data?.jobs || []).filter((j: any) => j.asset_id === showAssetDetail.id).length > 0 ? (data?.jobs || []).filter((j: any) => j.asset_id === showAssetDetail.id).map((j: any) => (
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
                              )) : <div className="text-center p-6 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">Bu cihaz için geçmiş iş kaydı bulunmuyor.</div>}
                          </div>
                      )}

                      {assetDetailTab === 'faults' && (
                          <div className="space-y-3">
                              {(data?.allFaults || []).filter((f: any) => f.asset_id === showAssetDetail.uuid).length > 0 ? (data?.allFaults || []).filter((f: any) => f.asset_id === showAssetDetail.uuid).map((fault: any, idx: number) => (
                                  <div key={idx} className="p-4 border border-amber-200 bg-amber-50 rounded-2xl shadow-sm">
                                      <div className="flex justify-between items-start mb-3">
                                          <div>
                                             <div className="font-black text-amber-900 flex items-center gap-1.5 text-sm mb-1"><AlertTriangle size={16}/> Arıza Bildirimi</div>
                                             <div className="text-[10px] font-bold text-amber-700/70">{fault.created_at ? new Date(fault.created_at).toLocaleString('tr-TR') : ''}</div>
                                          </div>
                                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${fault.status === 'Aktif' ? 'bg-amber-200 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>{fault.status}</span>
                                      </div>
                                      <div className="text-xs text-amber-900 font-bold mb-2 flex items-center gap-1.5 bg-amber-100 w-fit px-2 py-1 rounded-md"><User size={12}/> {fault.reporter_name} ({fault.reporter_phone})</div>
                                      <div className="text-sm font-medium text-slate-700 bg-white p-3 rounded-lg border border-amber-200/50 italic leading-relaxed">"{fault.description}"</div>
                                  </div>
                              )) : <div className="text-center p-6 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">Bu cihaz için arıza kaydı bulunmuyor.</div>}
                          </div>
                      )}

                      {assetDetailTab === 'emergencies' && (
                          <div className="space-y-3">
                              {(data?.allEmergencies || []).filter((e: any) => e.asset_id === showAssetDetail.uuid).length > 0 ? (data?.allEmergencies || []).filter((e: any) => e.asset_id === showAssetDetail.uuid).map((em: any, idx: number) => (
                                  <div key={idx} className="p-4 border border-rose-200 bg-rose-50 rounded-2xl shadow-sm flex justify-between items-center">
                                      <div>
                                          <div className="font-black text-rose-900 flex items-center gap-2 text-sm mb-1"><ShieldAlert size={16}/> Acil Durum Çağrısı</div>
                                          <div className="text-[10px] font-bold text-rose-700/70"><Clock size={10} className="inline mr-1"/>{em.created_at ? new Date(em.created_at).toLocaleString('tr-TR') : ''}</div>
                                      </div>
                                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${em.status === 'Aktif' ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-200 animate-pulse' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>{em.status}</span>
                                  </div>
                              )) : <div className="text-center p-6 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">Bu cihaz için acil durum çağrısı bulunmuyor.</div>}
                          </div>
                      )}
                      </>
                  ) : (
                        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-2">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bina / Site Adı</label>
                                   <input className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all" value={editAssetForm.apartmentName} onChange={(e) => setEditAssetForm({...editAssetForm, apartmentName: e.target.value})} placeholder="Apartman Adı" />
                                </div>
                                <div className="sm:col-span-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cihaz Adı</label>
                                   <input className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all" value={editAssetForm.name} onChange={(e) => setEditAssetForm({...editAssetForm, name: e.target.value})} placeholder="Varlık Adı" />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Konum / Adres Detayı</div>
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
                                    <input className="w-full sm:w-1/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="Bina No" />
                                    <input className="w-full sm:w-2/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Mahalle/Cadde" value={editAssetForm.location} onChange={(e) => setEditAssetForm({...editAssetForm, location: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Teknik Detaylar</label>
                                <textarea rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white bg-white transition-all resize-none" value={editAssetForm.deviceDetails} onChange={(e) => setEditAssetForm({...editAssetForm, deviceDetails: e.target.value})} placeholder="Seri no, model vb." />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 mt-2 border-t border-slate-200">
                            <button 
                                onClick={() => {
                                    const combined = getFullAddress(editAssetForm.location, buildingNo, selectedCity, selectedDistrict);
                                    handleAction('update-asset', { ...editAssetForm, location: combined }, () => handleCloseDetail('asset'), () => setIsEditingAsset(false))
                                }} 
                                className="flex-[2] bg-blue-600 text-white py-3.5 sm:py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md flex justify-center items-center"
                            >
                                {isSaving ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Değişiklikleri Kaydet'}
                            </button>
                           <button onClick={() => setIsEditingAsset(false)} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 sm:py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95">İptal</button>
                          </div>
                        </div>
                  )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. YENİ İŞ ATA MODALI (AKILLANDIRILDI) */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowJobModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto">
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50"><h2 className="text-xl font-black text-slate-900 tracking-tight">Yeni İş Ata</h2><button onClick={() => setShowJobModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><X size={20} /></button></div>
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
                
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">İş Türü</label>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setJobForm({...jobForm, workCategory: 'Normal İş Atama', customerName: '', assetId: ''})} className={`py-3 sm:py-2.5 text-xs font-bold rounded-xl border transition-all active:scale-95 ${jobForm.workCategory !== 'Genel İş Atama' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Normal İş Atama</button>
                      <button onClick={() => setJobForm({...jobForm, workCategory: 'Genel İş Atama', customerName: '', assetId: ''})} className={`py-3 sm:py-2.5 text-xs font-bold rounded-xl border transition-all active:scale-95 ${jobForm.workCategory === 'Genel İş Atama' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Genel İş Atama</button>
                  </div>
                </div>

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
                        
                        {/* AKILLANDIRMA: Seçilen Müşterinin Varlıklarını Getir */}
                        {jobForm.customerName && (() => {
                           const selectedCustomer = (data?.customers || []).find((c:any) => c.name === jobForm.customerName);
                           const customerAssets = (data?.assets || []).filter((a:any) => a.customer_id === selectedCustomer?.id);
                           
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
                        {/* AKILLANDIRMA: Otomatik Eşleşen Müşteri Uyarısı */}
                        {jobForm.assetId && (
                            <div className="mt-3 text-[10px] font-bold text-blue-700 bg-blue-50/80 p-2.5 rounded-lg border border-blue-100 flex items-center gap-1.5">
                                <CheckCircle size={14} className="text-blue-500 shrink-0"/> Müşteri Eşleşti: <span className="text-slate-800 truncate">{jobForm.customerName || 'Bağımsız Varlık'}</span>
                            </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}

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
                
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Görev Özeti / Talimatlar</label>
                  <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="İşin detayı nedir?..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} />
                </div>
              </div>
              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50">
                  <button disabled={isSaving || !isJobValid} onClick={() => handleAction('add-job', { ...jobForm, workCategory: jobForm.workCategory || 'Normal İş Atama', details: { note: jobForm.taskNote } }, setShowJobModal, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', workCategory: 'Normal İş Atama', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} className="w-full bg-blue-600 text-white py-3.5 sm:py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex justify-center items-center disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'İş Emrini Gönder'}
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. YENİ VARLIK/CİHAZ EKLE MODALI */}
      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowAssetModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50"><h2 className="text-xl font-black text-slate-900 tracking-tight">Varlık/Cihaz Ekle</h2><button onClick={() => setShowAssetModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95"><X size={20} /></button></div>
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-3">CİHAZIN SAHİBİ (MÜŞTERİ)</label>
                  <div className="grid grid-cols-1 gap-3">
                    <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors active:scale-95 ${assetCustMode === 'NONE' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="custMode" className="hidden" checked={assetCustMode === 'NONE'} onChange={() => setAssetForm({...assetForm, customerMode: 'NONE', customerId: ''})} />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${assetCustMode === 'NONE' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}>
                         {assetCustMode === 'NONE' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                      </div>
                      <span className={`text-sm font-bold ${assetCustMode === 'NONE' ? 'text-blue-800' : 'text-slate-700'}`}>Bağımsız (Müşteri Atanmasın)</span>
                    </label>
                    <div className={`border rounded-xl transition-colors ${assetCustMode === 'SELECT' ? 'border-blue-500 bg-blue-50/30 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <label className="flex items-center p-4 cursor-pointer active:scale-95">
                        <input type="radio" name="custMode" className="hidden" checked={assetCustMode === 'SELECT'} onChange={() => setAssetForm({...assetForm, customerMode: 'SELECT', customerId: ''})} />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${assetCustMode === 'SELECT' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}>
                           {assetCustMode === 'SELECT' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                        </div>
                        <span className={`text-sm font-bold ${assetCustMode === 'SELECT' ? 'text-blue-800' : 'text-slate-700'}`}>Mevcut Müşterilerden Seç</span>
                      </label>
                      {assetCustMode === 'SELECT' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-4 pb-4 pt-1 flex flex-col gap-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-3 text-blue-400" size={16} />
                            <input type="text" placeholder="İsim veya T.C. ile Müşteri Ara..." className="w-full pl-9 pr-3 py-3 sm:py-2.5 border border-blue-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-white" value={searchCust} onChange={e => setSearchCust(e.target.value)} />
                          </div>
                          <select className="w-full px-4 py-3 sm:py-2.5 border border-blue-200 rounded-xl text-sm font-semibold outline-none bg-white focus:border-blue-500 custom-scrollbar" size={4} value={assetForm.customerId !== 'NEW' ? assetForm.customerId : ''} onChange={e => setAssetForm({...assetForm, customerId: e.target.value})}>
                            <option value="" disabled className="font-bold text-slate-500 border-b border-blue-100 pb-2 mb-2">-- Listeden Tıklayıp Seçin --</option>
                            {(data?.customers || []).filter((c:any) => c.name?.toLowerCase().includes(searchCust.toLowerCase()) || c.tax_info?.includes(searchCust)).map((c: any) => <option key={c.id} value={c.id} className="py-2 border-b border-slate-50 last:border-0">{c.name} {c.tax_info ? `(${c.tax_info})` : ''}</option>)}
                          </select>
                        </motion.div>
                      )}
                    </div>
                    <div className={`border rounded-xl transition-colors ${assetCustMode === 'NEW' ? 'border-blue-500 bg-blue-50/30 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <label className="flex items-center p-4 cursor-pointer active:scale-95">
                        <input type="radio" name="custMode" className="hidden" checked={assetCustMode === 'NEW'} onChange={() => setAssetForm({...assetForm, customerMode: 'NEW', customerId: 'NEW'})} />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${assetCustMode === 'NEW' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}>
                           {assetCustMode === 'NEW' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                        </div>
                        <span className={`text-sm font-bold ${assetCustMode === 'NEW' ? 'text-blue-800' : 'text-slate-700'}`}>Sıfırdan Yeni Müşteri Oluştur</span>
                      </label>
                      {assetCustMode === 'NEW' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-4 pb-4 pt-1 space-y-3">
                           <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-white transition-all" placeholder="Firma / Müşteri Adı" value={assetForm.newCustomer?.name || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, name: e.target.value}})} />
                           <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-white transition-all" placeholder="Telefon / İletişim" value={assetForm.newCustomer?.contact || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, contact: e.target.value}})} />
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><select className="px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-medium outline-none bg-white appearance-none" value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}><option value="">İl Seçin</option>{Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}</select><select className="px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-medium outline-none bg-white appearance-none disabled:opacity-50" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity}><option value="">İlçe Seçin</option>{selectedCity && CITY_DATA[selectedCity]?.map((d:string) => <option key={d} value={d}>{d}</option>)}</select></div>
                           <div className="flex flex-col sm:flex-row gap-3">
                             <input className="w-full sm:w-1/3 px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-white transition-all" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="Bina No" />
                             <textarea rows={2} className="w-full sm:w-2/3 px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-white resize-none transition-all" placeholder="Mahalle, Sokak..." value={assetForm.newCustomer?.address || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, address: e.target.value}})} />
                           </div>
                        <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-white transition-all" placeholder="Vergi No / T.C." value={assetForm.newCustomer?.taxInfo || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, taxInfo: e.target.value}})} /></motion.div>)}</div>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-3">VARLIK/CİHAZ DETAYLARI</label>
                  <div className="space-y-3">
                    <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Bina / Site Adı" value={assetForm.apartmentName} onChange={e => setAssetForm({...assetForm, apartmentName: e.target.value})} />
                    <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Varlık/Cihaz Adı (Örn: Yolcu Asansörü)" value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                    
                    <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl space-y-3"><div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Konum / Adres Detayı</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><select className="px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 appearance-none transition-all" value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}><option value="">İl Seçin</option>{Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}</select><select className="px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 appearance-none transition-all disabled:opacity-50" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity}><option value="">İlçe Seçin</option>{selectedCity && CITY_DATA[selectedCity]?.map((d:string) => <option key={d} value={d}>{d}</option>)}</select></div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input className="w-full sm:w-1/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="Bina No" />
                          <input className="w-full sm:w-2/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Mahalle/Cadde" value={assetForm.location} onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                        </div>
                    </div>
                    <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Teknik Detaylar (Seri No, Model vs.)" value={assetForm.deviceDetails} onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50">
                 <button disabled={isSaving} className="w-full bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center shadow-lg disabled:opacity-50" onClick={() => { 
                    const newUUID = self.crypto.randomUUID();
                    if (assetCustMode === 'NEW') { 
                        const combinedAddress = getFullAddress(assetForm.newCustomer.address, buildingNo, selectedCity, selectedDistrict); 
                        const combinedLocation = getFullAddress(assetForm.location, buildingNo, selectedCity, selectedDistrict);
                        const updatedNewCust = { ...assetForm.newCustomer, address: combinedAddress }; 
                        handleAction('add-asset', { ...assetForm, location: combinedLocation, newCustomer: updatedNewCust, uuid: newUUID }, setShowAssetModal, () => { 
                            setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '', customerId: '', customerMode: 'NONE', newCustomer: { name: '', contact: '', address: '', taxInfo: '', assetAction: '', assetMode: 'NONE', newAsset: { name: '', location: '', apartmentName: '', deviceDetails: '' } } }); setSelectedCity(''); setSelectedDistrict(''); setBuildingNo(''); 
                        }); 
                    } else { 
                        const combinedLocation = getFullAddress(assetForm.location, buildingNo, selectedCity, selectedDistrict); 
                        handleAction('add-asset', { ...assetForm, location: combinedLocation, uuid: newUUID }, setShowAssetModal, () => { 
                            setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '', customerId: '', customerMode: 'NONE', newCustomer: { name: '', contact: '', address: '', taxInfo: '', assetAction: '', assetMode: 'NONE', newAsset: { name: '', location: '', apartmentName: '', deviceDetails: '' } } }); setSelectedCity(''); setSelectedDistrict(''); setBuildingNo(''); 
                        }); 
                    } 
                 }}>{isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Varlığı Sisteme Kaydet'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. YENİ MÜŞTERİ EKLE MODALI */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowCustomerModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50"><h2 className="text-xl font-black text-slate-900 tracking-tight">Müşteri Ekle</h2><button onClick={() => setShowCustomerModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><X size={20} /></button></div>
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6">
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">MÜŞTERİ/FİRMA KİMLİĞİ</label>
                  <div className="space-y-3">
                    <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Firma / İsim" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                    <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Telefon / E-posta" value={customerForm.contact} onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
                    <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl space-y-3">
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Adres Bilgileri</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><select className="px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}><option value="">İl Seçin</option>{Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}</select><select className="px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none disabled:opacity-50" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity}><option value="">İlçe Seçin</option>{selectedCity && CITY_DATA[selectedCity]?.map((d:string) => <option key={d} value={d}>{d}</option>)}</select></div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input className="w-full sm:w-1/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="Bina No" />
                          <textarea rows={2} className="w-full sm:w-2/3 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all resize-none" placeholder="Mahalle, Sokak..." value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                        </div>
                    </div>
                    <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Vergi No / T.C." value={customerForm.taxInfo} onChange={e => setCustomerForm({...customerForm, taxInfo: e.target.value})} />
                  </div>
                </div>
                <div className="mt-6"><label className="text-[11px] font-black text-blue-700 uppercase tracking-widest block mb-3">CİHAZ/VARLIK BAĞLANTISI (Opsiyonel)</label><div className="grid grid-cols-1 gap-3"><label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors active:scale-95 ${custAssetMode === 'NONE' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name="assetMode" className="hidden" checked={custAssetMode === 'NONE'} onChange={() => setCustomerForm({...customerForm, assetMode: 'NONE', assetAction: ''})} /><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${custAssetMode === 'NONE' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}>{custAssetMode === 'NONE' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}</div><span className={`text-sm font-bold ${custAssetMode === 'NONE' ? 'text-blue-800' : 'text-slate-700'}`}>Bağlantı Yapma (Bağımsız Müşteri)</span></label><div className={`border rounded-xl transition-colors ${custAssetMode === 'SELECT' ? 'border-blue-500 bg-blue-50/30 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}><label className="flex items-center p-4 cursor-pointer active:scale-95"><input type="radio" name="assetMode" className="hidden" checked={custAssetMode === 'SELECT'} onChange={() => setCustomerForm({...customerForm, assetMode: 'SELECT', assetAction: ''})} /><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${custAssetMode === 'SELECT' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}>{custAssetMode === 'SELECT' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}</div><span className={`text-sm font-bold ${custAssetMode === 'SELECT' ? 'text-blue-800' : 'text-slate-700'}`}>Mevcut Cihazlardan Birini Üzerine Al</span></label>{custAssetMode === 'SELECT' && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-4 pb-4 pt-1 flex flex-col gap-3"><div className="relative"><Search className="absolute left-3 top-3 text-blue-400" size={16} /><input type="text" placeholder="Cihaz Adı veya Konum Ara..." className="w-full pl-9 pr-3 py-3 sm:py-2.5 border border-blue-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-white" value={searchAsset} onChange={e => setSearchAsset(e.target.value)} /></div><select className="w-full px-4 py-3 border border-blue-300 rounded-xl text-sm font-semibold outline-none bg-white focus:border-blue-500 custom-scrollbar" size={4} value={customerForm.assetAction !== 'NEW' ? customerForm.assetAction : ''} onChange={e => setCustomerForm({...customerForm, assetAction: e.target.value})}><option value="" disabled className="font-bold text-slate-500 border-b border-blue-100 pb-2 mb-2">-- Listeden Tıklayıp Seçin --</option>{(data?.assets || []).filter((a:any) => a.name?.toLowerCase().includes(searchAsset.toLowerCase()) || a.location?.toLowerCase().includes(searchAsset.toLowerCase())).map((a: any) => <option key={a.id} value={a.id} className="py-2 border-b border-slate-50 last:border-0">{a.name} {a.customer_id ? '(Başka Müşteride)' : '(Boşta)'}</option>)}</select></motion.div>)}</div><div className={`border rounded-xl transition-colors ${custAssetMode === 'NEW' ? 'border-blue-500 bg-blue-50/30 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}><label className="flex items-center p-4 cursor-pointer active:scale-95"><input type="radio" name="assetMode" className="hidden" checked={custAssetMode === 'NEW'} onChange={() => setCustomerForm({...customerForm, assetMode: 'NEW', assetAction: 'NEW'})} /><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${custAssetMode === 'NEW' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}>{custAssetMode === 'NEW' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}</div><span className={`text-sm font-bold ${custAssetMode === 'NEW' ? 'text-blue-800' : 'text-slate-700'}`}>Sıfırdan Yeni Cihaz Tanımla</span></label>{custAssetMode === 'NEW' && (
  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-4 pb-4 pt-1 space-y-3">
     <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-white transition-all" placeholder="Bina / Site Adı" value={customerForm.newAsset?.apartmentName || ''} onChange={e => setCustomerForm({...customerForm, newAsset: {...customerForm.newAsset, apartmentName: e.target.value}})} />
     <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-white transition-all" placeholder="Cihaz Adı" value={customerForm.newAsset?.name || ''} onChange={e => setCustomerForm({...customerForm, newAsset: {...customerForm.newAsset, name: e.target.value}})} />
     
     <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl space-y-3">
        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cihaz Konumu</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className="px-4 py-3 sm:py-2.5 border border-slate-300 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}>
                <option value="">İl Seçin</option>
                {Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="px-4 py-3 sm:py-2.5 border border-slate-300 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none disabled:opacity-50" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity}>
                <option value="">İlçe Seçin</option>
                {selectedCity && CITY_DATA[selectedCity]?.map((d:string) => <option key={d} value={d}>{d}</option>)}
            </select>
        </div>
        <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Konum Detayı (Mahalle/Cadde)" value={customerForm.newAsset?.location || ''} onChange={e => setCustomerForm({...customerForm, newAsset: {...customerForm.newAsset, location: e.target.value}})} />
     </div>
     <textarea rows={3} className="w-full px-4 py-3 border border-slate-300 shadow-sm rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-white transition-all resize-none" placeholder="Teknik Detay" value={customerForm.newAsset?.deviceDetails || ''} onChange={e => setCustomerForm({...customerForm, newAsset: {...customerForm.newAsset, deviceDetails: e.target.value}})} />
  </motion.div>
)}</div></div></div>
              </div>
              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50">
                 <button disabled={isSaving} className="w-full bg-blue-600 text-white py-3.5 sm:py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all active:scale-95 flex justify-center items-center shadow-lg disabled:opacity-50" onClick={() => { const combinedAddress = getFullAddress(customerForm.address, buildingNo, selectedCity, selectedDistrict); handleAction('add-customer', { ...customerForm, address: combinedAddress }, setShowCustomerModal, () => { setCustomerForm({ name: '', contact: '', address: '', taxInfo: '', assetAction: '', assetMode: 'NONE', newAsset: { name: '', location: '', apartmentName: '', deviceDetails: '' } }); setSelectedCity(''); setSelectedDistrict(''); setBuildingNo(''); }); }}>{isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Müşteriyi Sisteme Kaydet'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. YENİ PERSONEL EKLE MODALI (MOBİLE UYUMLANDI) */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowStaffModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl p-0 shadow-2xl relative pointer-events-auto overflow-hidden">
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50"><h2 className="text-xl font-black text-slate-800 tracking-tight">Personel Ekle</h2><button onClick={() => setShowStaffModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><X size={20} /></button></div>
              <div className="p-5 sm:p-6 space-y-4 bg-white overflow-y-auto max-h-[60vh] custom-scrollbar">
                 <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Ad Soyad" onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                 <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Telefon Numarası" onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <select className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 appearance-none transition-all" onChange={e => setStaffForm({...staffForm, branch: e.target.value})}>
                        <option value="">Branş / Uzmanlık</option>
                        {branchList.map((subType: any) => (<option key={subType} value={subType}>{subType}</option>))}
                        <option value="Genel Usta">Genel Usta</option>
                     </select>
                     <select className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 appearance-none transition-all" onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                        <option value="Usta">Saha Ustası</option>
                        <option value="Yönetici">Yönetici</option>
                     </select>
                 </div>
                 
                 <div className="pt-4 border-t border-slate-100 mt-2 space-y-3">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">Giriş / Güvenlik Bilgileri</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Kullanıcı Adı" onChange={e => setStaffForm({...staffForm, username: e.target.value})} />
                       <input type="password" className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Şifre Belirleyin" onChange={e => setStaffForm({...staffForm, password: e.target.value})} />
                    </div>
                 </div>
              </div>
              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50">
                 <button className="w-full bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center shadow-lg" onClick={() => handleAction('add-staff', staffForm, setShowStaffModal, () => setStaffForm({ name: '', phone: '', role: 'Usta', branch: '', username: '', password: '' }))}>
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Personeli Kaydet'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. KATEGORİ MODALI */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowCategoryModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-sm rounded-2xl p-0 shadow-2xl relative pointer-events-auto overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Kategorileri Yönet</h2>
                <button onClick={() => setShowCategoryModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5">
                    <input type="text" className="flex-1 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Yeni Kategori Adı" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                    <button disabled={!newCategoryName || isSaving} onClick={() => handleAction('add-category', { name: newCategoryName }, null, () => setNewCategoryName(''))} className="bg-blue-600 text-white px-6 py-3 sm:py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 shadow-md">
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Ekle'}
                    </button>
                  </div>
                  <div className="space-y-2.5 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    {categories.length > 0 ? categories.map((c: any) => (
                      <div key={c.id} className="flex justify-between items-center p-3 sm:p-4 bg-white border border-slate-200 shadow-sm hover:border-blue-200 transition-colors rounded-xl group">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{c.name}</span>
                        <button onClick={async () => { if(confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) { await handleAction('delete-category', { id: c.id }, null, null); } }} className="text-rose-400 bg-rose-50 hover:bg-rose-500 hover:text-white p-2 rounded-lg transition-all active:scale-95"><Trash2 size={16} /></button>
                      </div>
                    )) : <div className="text-center p-8 text-sm font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">Henüz kategori eklenmemiş.</div>}
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. STOK / PARÇA GİRİŞİ MODALI */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowStockModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50"><h2 className="text-xl font-black text-slate-800 tracking-tight">Parça Girişi</h2><button onClick={() => setShowStockModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><X size={20} /></button></div>
              
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6">
                 <div>
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">PARÇA BİLGİLERİ</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                     <div className="sm:col-span-2">
                       <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Parça Adı" onChange={e => setStockForm({...stockForm, itemName: e.target.value})} />
                     </div>
                     <div className="sm:col-span-2">
                        <select className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 appearance-none transition-all" value={stockForm.category} onChange={e => setStockForm({...stockForm, category: e.target.value})}>
                          <option value="">Kategori Seçin veya Boş Bırakın</option>
                          {categories.map((c:any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                     </div>
                     <div className="flex flex-col sm:flex-row gap-3 sm:col-span-2">
                        <input type="number" className="w-full sm:w-1/2 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Miktar" onChange={e => setStockForm({...stockForm, quantity: e.target.value})} />
                        <select className="w-full sm:w-1/2 px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 appearance-none transition-all" onChange={e => setStockForm({...stockForm, unitName: e.target.value})}>
                          <option value="Adet">Adet</option><option value="Metre">Metre</option><option value="Paket">Paket</option>
                          <option value="Kutu">Kutu</option><option value="Litre">Litre</option><option value="Kg">Kg</option>
                        </select>
                     </div>
                     <div className="sm:col-span-2">
                        <input type="number" className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-black outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition-all text-emerald-700 placeholder:text-slate-400 placeholder:font-semibold" placeholder="Birim Fiyat (₺)" onChange={e => setStockForm({...stockForm, unitPrice: e.target.value})} />
                     </div>
                   </div>
                 </div>

                 <div>
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">TEDARİKÇİ BİLGİSİ</label>
                   <div className="grid grid-cols-1 gap-3">
                     <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors active:scale-95 ${stockSupplierMode === 'NONE' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input type="radio" name="supMode" className="hidden" checked={stockSupplierMode === 'NONE'} onChange={() => setStockForm({...stockForm, supplierMode: 'NONE', supplierId: ''})} />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${stockSupplierMode === 'NONE' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}>
                           {stockSupplierMode === 'NONE' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                        </div>
                        <span className={`text-sm font-bold ${stockSupplierMode === 'NONE' ? 'text-blue-800' : 'text-slate-700'}`}>Bağımsız (Tedarikçi Atama)</span>
                     </label>

                     <div className={`border rounded-xl transition-colors ${stockSupplierMode === 'SELECT' ? 'border-blue-500 bg-blue-50/30 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <label className="flex items-center p-4 cursor-pointer active:scale-95">
                          <input type="radio" name="supMode" className="hidden" checked={stockSupplierMode === 'SELECT'} onChange={() => setStockForm({...stockForm, supplierMode: 'SELECT', supplierId: ''})} />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${stockSupplierMode === 'SELECT' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}>
                             {stockSupplierMode === 'SELECT' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                          </div>
                          <span className={`text-sm font-bold ${stockSupplierMode === 'SELECT' ? 'text-blue-800' : 'text-slate-700'}`}>Kayıtlı Tedarikçilerden Seç</span>
                        </label>
                        {stockSupplierMode === 'SELECT' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-4 pb-4 pt-1 flex flex-col gap-3">
                             <div className="relative">
                                <Search className="absolute left-3 top-3 sm:top-2.5 text-blue-400" size={16} />
                                <input type="text" placeholder="Firma Adı Ara..." className="w-full pl-9 pr-3 py-3 sm:py-2.5 border border-blue-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 bg-white" value={searchSupplier} onChange={e => setSearchSupplier(e.target.value)} />
                             </div>
                             <select className="w-full px-4 py-3 sm:py-2.5 border border-blue-200 rounded-xl text-sm font-semibold outline-none bg-white focus:border-blue-500 custom-scrollbar" size={4} value={stockForm.supplierId !== 'NEW' ? stockForm.supplierId : ''} onChange={e => setStockForm({...stockForm, supplierId: e.target.value})}>
                                <option value="" disabled className="font-bold text-slate-500 border-b border-blue-100 pb-2 mb-2">-- Listeden Seçin --</option>
                                {(data?.suppliers || []).filter((s:any) => s.name?.toLowerCase().includes(searchSupplier.toLowerCase())).map((s: any) => <option key={s.id} value={s.id} className="py-2 border-b border-slate-50 last:border-0">{s.name}</option>)}
                             </select>
                          </motion.div>
                        )}
                     </div>

                     <div className={`border rounded-xl transition-colors ${stockSupplierMode === 'NEW' ? 'border-blue-500 bg-blue-50/30 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <label className="flex items-center p-4 cursor-pointer active:scale-95">
                          <input type="radio" name="supMode" className="hidden" checked={stockSupplierMode === 'NEW'} onChange={() => setStockForm({...stockForm, supplierMode: 'NEW', supplierId: 'NEW'})} />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${stockSupplierMode === 'NEW' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}>
                             {stockSupplierMode === 'NEW' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                          </div>
                          <span className={`text-sm font-bold ${stockSupplierMode === 'NEW' ? 'text-blue-800' : 'text-slate-700'}`}>Sıfırdan Yeni Tedarikçi Oluştur</span>
                        </label>
                        {stockSupplierMode === 'NEW' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-4 pb-4 pt-1 space-y-3">
                             <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-white transition-all" placeholder="Tedarikçi Firma Adı" value={stockForm.newSupplier?.name || ''} onChange={e => setStockForm({...stockForm, newSupplier: {...stockForm.newSupplier, name: e.target.value}})} />
                             <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-300 shadow-sm rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-white transition-all" placeholder="Telefon Numarası" value={stockForm.newSupplier?.phone || ''} onChange={e => setStockForm({...stockForm, newSupplier: {...stockForm.newSupplier, phone: e.target.value}})} />
                          </motion.div>
                        )}
                     </div>
                   </div>
                 </div>
              </div>

              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50">
                 <button disabled={isSaving} className="w-full bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center shadow-lg disabled:opacity-50" onClick={() => handleAction('add-stock', stockForm, setShowStockModal, () => setStockForm({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', category: '', supplierId: '', supplierMode: 'NONE', newSupplier: { name: '', phone: '' } }))}>
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Stoğu Sisteme Kaydet'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. TEDARİKÇİ LİSTESİ MODALI */}
      <AnimatePresence>
        {showSupplierListModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowSupplierListModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl p-0 shadow-2xl relative max-h-[85vh] flex flex-col pointer-events-auto overflow-hidden">
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Tedarikçileri Yönet</h2>
                <button onClick={() => setShowSupplierListModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-3">
                {(data?.suppliers || []).length > 0 ? (data?.suppliers || []).map((s: any) => (
                  <div key={s.id} className="p-4 bg-white border border-slate-200 shadow-sm hover:border-blue-200 rounded-xl transition-colors group">
                    {editingSupplierId === s.id ? (
                      <div className="space-y-3">
                        <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={editSupFormLocal.name} onChange={e => setEditSupFormLocal({...editSupFormLocal, name: e.target.value})} placeholder="Firma Adı" />
                        <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" value={editSupFormLocal.phone} onChange={e => setEditSupFormLocal({...editSupFormLocal, phone: e.target.value})} placeholder="Telefon" />
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                          <button onClick={() => handleAction('update-supplier', { id: s.id, name: editSupFormLocal.name, phone: editSupFormLocal.phone }, null, () => setEditingSupplierId(null))} className="w-full sm:flex-1 bg-blue-600 text-white py-3 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold transition-all active:scale-95 shadow-md">Kaydet</button>
                          <button onClick={() => setEditingSupplierId(null)} className="w-full sm:flex-1 bg-slate-100 text-slate-700 py-3 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold transition-all active:scale-95 hover:bg-slate-200">İptal</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="min-w-0 pr-3">
                          <div className="text-sm font-black text-slate-800 truncate group-hover:text-blue-700 transition-colors">{s.name}</div>
                          <div className="text-[11px] font-semibold text-slate-500 mt-1">{s.phone || 'Telefon Yok'}</div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => { setEditingSupplierId(s.id); setEditSupFormLocal({ name: s.name, phone: s.phone || '' }); }} className="p-2 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg transition-all active:scale-95 shadow-sm"><Edit2 size={16} /></button>
                          <button onClick={async () => { if(confirm('Bu tedarikçiyi silmek istediğinize emin misiniz? (Bağlı stok ürünleri varsa tedarikçi alanı boş kalır)')) { await handleAction('delete-supplier', { id: s.id }, null, null); } }} className="p-2 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-lg transition-all active:scale-95 shadow-sm"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                )) : <div className="text-center p-8 text-sm font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">Henüz tedarikçi eklenmemiş.</div>}
              </div>

              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50">
                 <button onClick={() => { setShowSupplierListModal(false); setShowSupplierModal(true); }} className="w-full bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
                    <Plus size={16} strokeWidth={3} /> Yeni Tedarikçi Ekle
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 12. YENİ TEDARİKÇİ EKLE MODALI */}
      <AnimatePresence>
        {showSupplierModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowSupplierModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl p-0 shadow-2xl relative pointer-events-auto overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50"><h2 className="text-xl font-black text-slate-800 tracking-tight">Tedarikçi Ekle</h2><button onClick={() => setShowSupplierModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><X size={20} /></button></div>
              <div className="p-5 sm:p-6 space-y-4">
                 <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Tedarikçi Firma Adı" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
                 <input className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="Telefon Numarası" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
              </div>
              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50">
                 <button disabled={isSaving} className="w-full bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center shadow-lg disabled:opacity-50" onClick={() => handleAction('add-supplier', supplierForm, setShowSupplierModal, () => setSupplierForm({ name: '', phone: '' }))}>
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Tedarikçiyi Kaydet'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}