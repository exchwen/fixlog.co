'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trash2, Loader2, Search, User, Box, ExternalLink, MapPin, Calendar, AlertTriangle, ArrowRight, Filter, ShieldCheck, Clock, Plus, Tags, Truck, Edit2, ShieldAlert } from 'lucide-react';
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
  handleAction, isSaving, data
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
    jobType: 'Anlık',
    scheduledDate: '', 
    staffId: '', 
    taskNote: '',
    customerName: '',
    assetId: ''
  });

  // Yeni Modallar İçin Local Stateler
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editSupFormLocal, setEditSupFormLocal] = useState({ name: '', phone: '' });

  // Varlık detayındaki alt sekmeler için (BİLGİ, İŞLER, ARIZALAR, ACİL DURUMLAR)
  const [assetDetailTab, setAssetDetailTab] = useState('info');

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
    }
  };

  // --- MODAL KAPATMA VE NAVİGASYON YÖNETİMİ ---
  const closeAllModals = () => {
    if (setShowJobModal) setShowJobModal(false);
    if (setShowAssetModal) setShowAssetModal(false);
    if (setShowStaffModal) setShowStaffModal(false);
    if (setShowCustomerModal) setShowCustomerModal(false);
    if (setShowStockModal) setShowStockModal(false);
    if (setShowSupplierModal) setShowSupplierModal(false);
    if (setShowCategoryModal) setShowCategoryModal(false);
    if (setShowSupplierListModal) setShowSupplierListModal(false);
    
    if (setShowStaffDetail) setShowStaffDetail(null);
    if (setShowCustomerDetail) setShowCustomerDetail(null);
    if (setShowAssetDetail) setShowAssetDetail(null);
    if (setSelectedJob) setSelectedJob(null);

    // Formları ve state'leri temizle
    setIsEditingCustomer(false);
    setIsEditingAsset(false);
    setIsEditingJobDetail(false);
    setShowCancelConfirm(false);
    setSelectedCity(''); setSelectedDistrict(''); setBuildingNo('');
  };

  // Manuel kapatma (Backdrop click veya X butonu)
  const manualClose = () => {
      closeAllModals();
      // Eğer modal açık state'i history'de varsa geri gel
      if (window.history.state?.modalOpen) {
          window.history.back();
      }
  };

  useEffect(() => {
    const isAnyModalOpen = showJobModal || showAssetModal || showStaffModal || showCustomerModal || showStockModal || showSupplierModal || showSupplierListModal || showCategoryModal || showStaffDetail || showCustomerDetail || showAssetDetail || selectedJob;

    if (isAnyModalOpen) {
        // Modal açıldığında history'e state ekle
        window.history.pushState({ modalOpen: true }, '');

        const handlePopState = () => {
            // Geri tuşuna basıldığında (mobil veya tarayıcı)
            closeAllModals();
        };

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                manualClose();
            }
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('keydown', handleEsc);
        };
    }
  }, [showJobModal, showAssetModal, showStaffModal, showCustomerModal, showStockModal, showSupplierModal, showSupplierListModal, showCategoryModal, showStaffDetail, showCustomerDetail, showAssetDetail, selectedJob]);


  const handleEditClick = () => {
    setIsEditingJobDetail(true);
    setEditJobDetailForm({
        workCategory: selectedJob.work_type === 'Genel Görev' ? 'Genel İş Atama' : 'Normal İş Atama',
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

  const statusColors: any = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200'
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
      <AnimatePresence>
        {selectedJob && (
          <div className={`fixed inset-0 z-[130] flex items-center justify-center p-4 ${isAnyProfileDetailOpen ? 'bg-transparent pointer-events-none' : 'bg-slate-900/40 backdrop-blur-sm'}`}>
            
            {isAnyProfileDetailOpen ? null : (
                <div className="absolute inset-0" onClick={manualClose}></div>
            )}

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: isAnyProfileDetailOpen ? 280 : 0 }} 
                animate={{ opacity: 1, scale: 1, x: isAnyProfileDetailOpen ? 280 : 0 }} 
                exit={{ opacity: 0, scale: 0.95, x: isAnyProfileDetailOpen ? 280 : 0 }} 
                className="bg-white w-full max-w-lg rounded-xl p-0 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 pointer-events-auto transition-transform duration-300"
            >
              
              <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100 bg-white z-10 rounded-t-xl">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{isEditingJobDetail ? 'İş Emrini Düzenle' : 'İş Emri Detayı'}</h2>
                    <div className="text-xs text-slate-500 mt-0.5">ID: #{selectedJob.id} • {selectedJob.created_at?.split('T')[0] || ''}</div>
                </div>
                <button onClick={() => { setSelectedJob(null); setIsEditingJobDetail(false); setShowCancelConfirm(false); manualClose(); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"><X size={18} /></button>
              </div>

              {!isEditingJobDetail ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 relative">
                    
                    <AnimatePresence>
                    {showCancelConfirm && (
                        <motion.div 
                           initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                           className="absolute inset-0 z-20 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center rounded-xl"
                        >
                           <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3">
                              <AlertTriangle size={24} />
                           </div>
                           <h3 className="text-lg font-bold text-slate-900 mb-1">İşi İptal Etmek İstiyor musun?</h3>
                           <p className="text-xs text-slate-500 mb-6 max-w-[200px]">Bu işlem sonucunda iş emri 'İptal' durumuna geçecek ve listeden kaldırılmayacaktır.</p>
                           <div className="flex gap-2 w-full">
                               <button 
                                  onClick={async () => {
                                     await handleAction('update-job', { 
                                         id: selectedJob.id, 
                                         status: 'İptal',
                                         lastEditedBy: data?.ownerName || 'Yönetici' 
                                     }, () => { setSelectedJob(null); manualClose(); }, () => {});
                                  }}
                                  className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-rose-700 shadow-sm shadow-rose-200"
                               >
                                  {isSaving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Evet, İptal Et'}
                               </button>
                               <button 
                                  onClick={() => setShowCancelConfirm(false)}
                                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-50"
                               >
                                  Vazgeç
                               </button>
                           </div>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">GÜNCEL DURUM</span>
                        <span className={`px-2.5 py-1 rounded text-xs font-medium border ${statusColors[selectedJob.status] || 'bg-slate-100'}`}>{selectedJob.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 border border-slate-100 rounded-lg shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Müşteri / Lokasyon</div>
                            <div className="text-sm font-semibold text-slate-800">{selectedJob.customer_name}</div>
                            {selectedJob.asset_id && (
                                <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                    <Box size={12} />
                                    {(data?.assets || []).find((a:any) => a.id === selectedJob.asset_id)?.name || 'Bilinmeyen Cihaz'}
                                </div>
                            )}
                        </div>
                        <div className="bg-white p-3 border border-slate-100 rounded-lg shadow-sm">
                             <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Görev Tipi</div>
                             <div className="text-sm font-semibold text-slate-800">{selectedJob.work_type}</div>
                        </div>
                        <div className="bg-white p-3 border border-slate-100 rounded-lg shadow-sm">
                             <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Planlanan Tarih</div>
                             <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                                <Calendar size={14} className="text-slate-400"/>
                                {selectedJob.scheduled_date || 'Anlık / Acil'}
                             </div>
                        </div>
                        <div className="bg-white p-3 border border-slate-100 rounded-lg shadow-sm">
                             <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Sorumlu Personel</div>
                             <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                                <User size={14} className="text-slate-400"/>
                                {(data?.staff || []).find((s:any) => s.id === selectedJob.staff_id)?.name || 'Atanmamış'}
                             </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">GÖREV NOTLARI / AÇIKLAMA</div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {selectedJob.details?.note || 'Herhangi bir not girilmemiş.'}
                        </p>
                    </div>

                    {selectedJob.details?.lastEditedBy && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-md">
                            <ShieldCheck size={14} className="text-emerald-600" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Güvenlik Kaydı</span>
                                <span className="text-[10px] text-slate-600">
                                    Son işlem <strong>{selectedJob.details.lastEditedBy}</strong> tarafından yapıldı.
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex gap-2">
                        <button 
                            onClick={handleEditClick}
                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Settings size={14} /> Düzenle / Ata
                        </button>
                        
                        {selectedJob.status !== 'İptal' && selectedJob.status !== 'Tamamlandı' && (
                            <button 
                                onClick={() => setShowCancelConfirm(true)}
                                className="px-4 bg-rose-50 text-rose-600 border border-rose-100 py-2.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <X size={14} /> İptal Et
                            </button>
                        )}
                    </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                    
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">İş Türü</label>
                      <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => setEditJobDetailForm({...editJobDetailForm, workCategory: 'Normal İş Atama'})} className={`py-2 text-xs font-semibold rounded-md border transition-colors ${editJobDetailForm.workCategory !== 'Genel İş Atama' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Normal İş Atama</button>
                         <button onClick={() => setEditJobDetailForm({...editJobDetailForm, workCategory: 'Genel İş Atama', customerName: '', assetId: ''})} className={`py-2 text-xs font-semibold rounded-md border transition-colors ${editJobDetailForm.workCategory === 'Genel İş Atama' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Genel İş Atama</button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">Tarih / Zamanlama</label>
                      <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => setEditJobDetailForm({...editJobDetailForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-1.5 text-xs font-semibold rounded-md border ${editJobDetailForm.jobType === 'Anlık' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Anlık Görev</button>
                         <button onClick={() => setEditJobDetailForm({...editJobDetailForm, jobType: 'Planlı'})} className={`py-1.5 text-xs font-semibold rounded-md border ${editJobDetailForm.jobType === 'Planlı' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Tarih Planla</button>
                      </div>
                      {editJobDetailForm.jobType === 'Planlı' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                          <input type="date" value={editJobDetailForm.scheduledDate} className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" onChange={e => setEditJobDetailForm({...editJobDetailForm, scheduledDate: e.target.value})} />
                        </motion.div>
                      )}
                    </div>

                    {editJobDetailForm.workCategory !== 'Genel İş Atama' && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex gap-2 mb-3">
                          <button onClick={() => setJobTargetMode('CUSTOMER')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-colors ${jobTargetMode === 'CUSTOMER' ? 'bg-white text-blue-700 border-blue-300 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100'}`}>Müşteri Seç</button>
                          <button onClick={() => setJobTargetMode('ASSET')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-colors ${jobTargetMode === 'ASSET' ? 'bg-white text-blue-700 border-blue-300 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100'}`}>Varlık Seç</button>
                        </div>

                        {jobTargetMode === 'CUSTOMER' ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="relative mb-2">
                              <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                              <input type="text" placeholder="İsim veya TC ile Müşteri Ara..." className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={searchCust} onChange={e => setSearchCust(e.target.value)} />
                            </div>
                            <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400 custom-scrollbar" size={4} value={editJobDetailForm.customerName} onChange={e => setEditJobDetailForm({...editJobDetailForm, customerName: e.target.value, assetId: ''})}>
                              <option value="" disabled className="font-semibold text-slate-400 border-b border-slate-100 pb-1 mb-1">-- Listeden Müşteri Seçin --</option>
                              {(data?.customers || []).filter((c:any) => c.name?.toLowerCase().includes(searchCust.toLowerCase()) || c.tax_info?.includes(searchCust)).map((c: any) => <option key={c.id} value={c.name} className="py-1">{c.name} {c.tax_info ? `(${c.tax_info})` : ''}</option>)}
                            </select>
                          </motion.div>
                        ) : (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="relative mb-2">
                              <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                              <input type="text" placeholder="Cihaz Adı Ara..." className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={searchAsset} onChange={e => setSearchAsset(e.target.value)} />
                            </div>
                            <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400 custom-scrollbar" size={4} value={editJobDetailForm.assetId} onChange={e => {
                              const selectedAsset = (data?.assets || []).find((a:any) => a.id === e.target.value);
                              const parentCust = (data?.customers || []).find((c:any) => c.id === selectedAsset?.customer_id);
                              setEditJobDetailForm({...editJobDetailForm, assetId: e.target.value, customerName: parentCust?.name || ''});
                            }}>
                              <option value="" disabled className="font-semibold text-slate-400 border-b border-slate-100 pb-1 mb-1">-- Listeden Varlık Seçin --</option>
                              {(data?.assets || []).filter((a: any) => a.name?.toLowerCase().includes(searchAsset.toLowerCase())).map((a: any) => (
                                <option key={a.id} value={a.id} className="py-1">{a.name} - {a.location}</option>
                              ))}
                            </select>
                          </motion.div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Sorumlu Personel (Yalnızca Yöneticiler)</label>
                      <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400" value={editJobDetailForm.staffId} onChange={e => setEditJobDetailForm({...editJobDetailForm, staffId: e.target.value})}>
                        <option value="">Kayıtlı Yöneticilerden Seçin...</option>
                        {(data?.staff || []).filter((s:any) => s.role === 'Yönetici').map((s:any) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Görev Özeti / Talimatlar</label>
                      <textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400" placeholder="İşin detayı nedir?..." value={editJobDetailForm.taskNote} onChange={e => setEditJobDetailForm({...editJobDetailForm, taskNote: e.target.value})} />
                    </div>

                    <div className="pt-4 flex gap-2">
                        <button 
                            disabled={!isEditJobValid || isSaving}
                            onClick={() => handleAction('update-job', { 
                                ...editJobDetailForm, 
                                id: selectedJob.id,
                                lastEditedBy: data?.ownerName || 'Yönetici' 
                            }, () => { setSelectedJob(null); manualClose(); }, () => setIsEditingJobDetail(false))} 
                            className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Değişiklikleri Kaydet'}
                        </button>
                        <button 
                            onClick={() => setIsEditingJobDetail(false)} 
                            className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
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
        {showStaffDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={manualClose}></div>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: selectedJob ? -280 : 0 }} 
                animate={{ opacity: 1, scale: 1, x: selectedJob ? -280 : 0 }} 
                exit={{ opacity: 0, scale: 0.95, x: selectedJob ? -280 : 0 }} 
                className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl relative flex flex-col max-h-[85vh] transition-transform duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div><h2 className="text-xl font-bold text-slate-900">{showStaffDetail.name}</h2><div className="text-xs text-slate-500 mt-0.5">Personel Dosyası</div></div>
                <button onClick={() => { setShowStaffDetail(null); manualClose(); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Branş/Rol</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showStaffDetail.branch || showStaffDetail.role}</div></div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Telefon</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showStaffDetail.phone || '-'}</div></div>
              </div>
              
              <div className="flex-1 flex flex-col overflow-hidden">
                 <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[11px] font-semibold text-slate-500">GÖREV GEÇMİŞİ</h4>
                    <span className="text-[10px] text-slate-400">{filteredStaffJobs.length} Kayıt</span>
                 </div>
                 
                 <div className="relative mb-3">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Geçmiş işlerde ara..." 
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400 bg-slate-50" 
                      value={staffJobSearch}
                      onChange={(e) => setStaffJobSearch(e.target.value)}
                    />
                 </div>

                 <div className="overflow-y-auto custom-scrollbar space-y-2 flex-1 pr-1">
                     {filteredStaffJobs.length > 0 ? filteredStaffJobs.map((j: any) => (
                       <div 
                           key={j.id} 
                           onClick={(e) => { 
                               e.stopPropagation(); 
                               setSelectedJob(j); 
                           }} 
                           className={`p-3 border rounded-lg flex items-center justify-between text-xs cursor-pointer transition-all group ${selectedJob?.id === j.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                       >
                          <div>
                              <div className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{j.customer_name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{j.scheduled_date || 'Anlık'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                              <ArrowRight size={14} className={`transition-all ${selectedJob?.id === j.id ? 'text-blue-600 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                          </div>
                       </div>
                     )) : <div className="text-center p-6 text-slate-400 text-xs bg-slate-50 rounded-lg">Kriterlere uygun kayıt bulunamadı.</div>}
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                 {!isEditingStaff ? (
                   <div className="flex gap-2 w-full">
                     <button onClick={() => setIsEditingStaff(true)} className="flex-[2] bg-slate-100 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"><Settings size={14} /> Düzenle</button>
                     <button onClick={async () => { if(confirm(`${showStaffDetail.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-staff', { id: showStaffDetail.id }, () => { setShowStaffDetail(null); manualClose(); }, () => {}); } }} className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={14} /> Sil</button>
                   </div>
                 ) : (
                   <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <div className="grid grid-cols-2 gap-3">
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.name} onChange={(e) => setEditStaffForm({...editStaffForm, name: e.target.value})} placeholder="Ad Soyad" />
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.phone} onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})} placeholder="Telefon" />
                       <select className="col-span-2 px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none bg-white focus:border-blue-400" value={editStaffForm.branch} onChange={(e) => setEditStaffForm({...editStaffForm, branch: e.target.value})}>
                          <option value="">Branş / Uzmanlık Seçin</option>
                          {branchList.map((subType: any) => (
                            <option key={subType} value={subType}>{subType}</option>
                          ))}
                          <option value="Genel Usta">Genel Usta</option>
                       </select>
                     </div>
                     <div className="flex gap-2 pt-2">
                       <button onClick={() => handleAction('add-staff', { ...editStaffForm, id: showStaffDetail.id }, () => { setShowStaffDetail(null); manualClose(); }, () => setIsEditingStaff(false))} className="flex-1 bg-blue-600 text-white py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700">{isSaving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Kaydet'}</button>
                       <button onClick={() => setIsEditingStaff(false)} className="px-4 bg-slate-200 text-slate-700 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-300">İptal</button>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomerDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={manualClose}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95, x: selectedJob ? -280 : 0 }} animate={{ opacity: 1, scale: 1, x: selectedJob ? -280 : 0 }} exit={{ opacity: 0, scale: 0.95, x: selectedJob ? -280 : 0 }} className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl relative flex flex-col max-h-[85vh] transition-transform duration-300 pointer-events-auto">
              <div className="flex justify-between items-start mb-6">
                <div><h2 className="text-xl font-bold text-slate-900">{showCustomerDetail.name}</h2><div className="text-xs text-slate-500 mt-0.5">Müşteri Profili</div></div>
                <button onClick={() => { setShowCustomerDetail(null); manualClose(); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18} /></button>
              </div>
              
              {!isEditingCustomer ? (
                  <>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">İletişim / Telefon</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showCustomerDetail.contact || '-'}</div></div>
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Vergi No / T.C.</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showCustomerDetail.tax_info || '-'}</div></div>
                     <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">Adres</div>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="text-xs font-medium text-slate-800 line-clamp-2">{showCustomerDetail.address || '-'}</div>
                          {showCustomerDetail.address && (
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showCustomerDetail.address || '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-100/50 hover:bg-blue-100 px-2 py-1 rounded transition-colors whitespace-nowrap ml-2"><MapPin size={12} /> Haritada Gör</a>
                          )}
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 mb-6 custom-scrollbar">
                     <div><h4 className="text-[11px] font-semibold text-blue-600 mb-2 uppercase tracking-wider">Kayıtlı Cihazları / Varlıkları</h4>{(data?.assets || []).filter((a: any) => a.customer_id === showCustomerDetail.id).length > 0 ? (data?.assets || []).filter((a: any) => a.customer_id === showCustomerDetail.id).map((a: any) => (<div key={a.id} onClick={() => { setShowCustomerDetail(null); setShowAssetDetail(a); }} className="p-3 border border-blue-100 rounded-lg bg-blue-50/30 text-xs mb-2 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all"><div className="font-semibold text-blue-800">{a.name}</div><div className="text-[10px] text-blue-600/80 mt-0.5">{a.location || ''}</div></div>)) : <div className="text-center p-4 text-slate-400 text-xs bg-slate-50 rounded-lg">Kayıtlı cihaz bulunmuyor.</div>}</div>
                     <div><h4 className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Geçmiş İş Kayıtları</h4>{(data?.jobs || []).filter((j: any) => j.customer_name === showCustomerDetail.name).length > 0 ? (data?.jobs || []).filter((j: any) => j.customer_name === showCustomerDetail.name).map((j: any) => (<div key={j.id} onClick={(e) => { e.stopPropagation(); setSelectedJob(j); }} className={`p-3 border rounded-lg flex items-center justify-between text-xs mb-2 cursor-pointer transition-all group ${selectedJob?.id === j.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-slate-100 hover:bg-slate-50'}`}><div><div className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{j.work_type || 'Görev'}</div><div className="text-[10px] text-slate-500 mt-0.5">{j.scheduled_date || 'Anlık'}</div></div><div className="flex items-center gap-2"><span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span><ArrowRight size={14} className={`transition-all ${selectedJob?.id === j.id ? 'text-blue-600 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} /></div></div>)) : <div className="text-center p-4 text-slate-400 text-xs bg-slate-50 rounded-lg">Geçmiş iş kaydı bulunmuyor.</div>}</div>
                  </div>
                  <div className="pt-4 border-t border-slate-100"><div className="flex gap-2 w-full"><button onClick={() => { setIsEditingCustomer(true); setEditCustomerForm({ id: showCustomerDetail.id, name: showCustomerDetail.name, contact: showCustomerDetail.contact || '', address: parseAddressToState(showCustomerDetail.address || ''), taxInfo: showCustomerDetail.tax_info || '' }); }} className="flex-[2] bg-slate-100 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"><Settings size={14} /> Düzenle</button><button onClick={async () => { if(confirm(`${showCustomerDetail.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-customer', { id: showCustomerDetail.id }, () => handleCloseDetail('customer'), () => {}); } }} className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={14} /> Sil</button></div></div>
                  </>
              ) : (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="grid grid-cols-2 gap-3">
                        <input className="px-3 py-2 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editCustomerForm.name} onChange={(e) => setEditCustomerForm({...editCustomerForm, name: e.target.value})} placeholder="Ad / Firma" />
                        <input className="px-3 py-2 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editCustomerForm.contact} onChange={(e) => setEditCustomerForm({...editCustomerForm, contact: e.target.value})} placeholder="Telefon" />
                        
                        <div className="col-span-2 grid grid-cols-2 gap-2">
                            <select className="px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white" value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}>
                                <option value="">İl Seçin</option>
                                {Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select className="px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity}>
                                <option value="">İlçe Seçin</option>
                                {selectedCity && CITY_DATA[selectedCity]?.map((d:string) => <option key={d} value={d}>{d}</option>)}
                            </select>
                       </div>
                        
                        <div className="col-span-2 flex gap-2">
                          <input className="w-1/4 px-3 py-2 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="Bina No" />
                          <input className="w-3/4 px-3 py-2 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editCustomerForm.address} onChange={(e) => setEditCustomerForm({...editCustomerForm, address: e.target.value})} placeholder="Cadde, Sokak, Mahalle..." />
                        </div>
                        
                        <input className="col-span-2 px-3 py-2 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editCustomerForm.taxInfo} onChange={(e) => setEditCustomerForm({...editCustomerForm, taxInfo: e.target.value})} placeholder="Vergi No / T.C." />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button 
                            onClick={() => {
                                const combined = getFullAddress(editCustomerForm.address, buildingNo, selectedCity, selectedDistrict);
                                handleAction('update-customer', { ...editCustomerForm, address: combined }, () => { handleCloseDetail('customer'); manualClose(); }, () => setIsEditingCustomer(false))
                            }} 
                            className="flex-1 bg-blue-600 text-white py-2 rounded-md text-xs font-semibold hover:bg-blue-700"
                        >
                            {isSaving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Değişiklikleri Kaydet'}
                        </button>
                        <button onClick={() => setIsEditingCustomer(false)} className="px-4 bg-slate-200 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-300">İptal</button>
                      </div>
                    </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssetDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={manualClose}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95, x: selectedJob ? -280 : 0 }} animate={{ opacity: 1, scale: 1, x: selectedJob ? -280 : 0 }} exit={{ opacity: 0, scale: 0.95, x: selectedJob ? -280 : 0 }} className="bg-white w-full max-w-lg rounded-xl shadow-xl relative flex flex-col max-h-[85vh] transition-transform duration-300 pointer-events-auto overflow-hidden">
              <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100">
                <div><h2 className="text-xl font-bold text-slate-900">{showAssetDetail.name}</h2><div className="text-xs text-slate-500 mt-0.5">Cihaz / Varlık Profili</div></div>
                <button onClick={() => { setShowAssetDetail(null); manualClose(); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18} /></button>
              </div>

              {!isEditingAsset && (
                  <div className="flex border-b border-slate-200 bg-slate-50/50 px-4">
                      <button onClick={() => setAssetDetailTab('info')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${assetDetailTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Bilgiler</button>
                      <button onClick={() => setAssetDetailTab('jobs')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${assetDetailTab === 'jobs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>İşler</button>
                      <button onClick={() => setAssetDetailTab('faults')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${assetDetailTab === 'faults' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Arızalar</button>
                      <button onClick={() => setAssetDetailTab('emergencies')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${assetDetailTab === 'emergencies' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Acil Durumlar</button>
                  </div>
              )}
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                  {!isEditingAsset ? (
                      <>
                      {assetDetailTab === 'info' && (
                          <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Sahibi (Müşteri)</div><div className="text-xs font-medium mt-1">{showAssetDetail.customer_id ? (() => { const cust = (data?.customers || []).find((c: any) => c.id === showAssetDetail.customer_id); return cust ? (<span onClick={() => { setShowAssetDetail(null); setShowCustomerDetail(cust); }} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer"><User size={12} className="opacity-70" />{cust.name}<ExternalLink size={12} className="opacity-50 ml-1" /></span>) : <span className="text-slate-500">Bilinmiyor</span>; })() : <span className="text-slate-500">Bağımsız Cihaz</span>}</div></div>
                                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Bina / Site</div><div className="text-xs font-medium text-slate-800 mt-0.5">{showAssetDetail.apartmentName || '-'}</div></div>
                                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Tam Konum</div><div className="flex flex-col mt-0.5 space-y-1"><div className="text-xs font-medium text-slate-800">{showAssetDetail.location ? showAssetDetail.location.replace(showAssetDetail.apartmentName || '', '').trim() : '-'}</div>{showAssetDetail.location && (<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showAssetDetail.location || '')}`} target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-100/50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"><MapPin size={12} /> Haritada Gör</a>)}</div></div>
                                  <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-semibold text-slate-500 uppercase">Teknik Detaylar</div><div className="text-xs font-medium text-slate-800 mt-0.5 line-clamp-2">{showAssetDetail.asset_details || '-'}</div></div>
                              </div>
                              <div className="pt-4 border-t border-slate-100"><div className="flex gap-2 w-full"><button onClick={() => { setIsEditingAsset(true); setEditAssetForm({ id: showAssetDetail.id, name: showAssetDetail.name, location: parseAddressToState(showAssetDetail.location || ''), apartmentName: showAssetDetail.apartmentName || '', deviceDetails: showAssetDetail.asset_details || '' }); }} className="flex-[2] bg-slate-100 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"><Settings size={14} /> Düzenle</button><button onClick={async () => { if(confirm(`${showAssetDetail.name} silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-asset', { id: showAssetDetail.id }, () => { handleCloseDetail('asset'); manualClose(); }, () => {}); } }} className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={14} /> Sil</button></div></div>
                          </div>
                      )}

                      {assetDetailTab === 'jobs' && (
                          <div className="space-y-2">
                              {(data?.jobs || []).filter((j: any) => j.asset_id === showAssetDetail.id).length > 0 ? (data?.jobs || []).filter((j: any) => j.asset_id === showAssetDetail.id).map((j: any) => (
                                  <div key={j.id} onClick={(e) => { e.stopPropagation(); setSelectedJob(j); }} className={`p-3 border rounded-lg flex items-center justify-between text-xs cursor-pointer transition-all group ${selectedJob?.id === j.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                                      <div>
                                          <div className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{j.work_type || 'Görev'}</div>
                                          <div className="text-[10px] text-slate-500 mt-0.5">{j.scheduled_date || 'Anlık'}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                                          <ArrowRight size={14} className={`transition-all ${selectedJob?.id === j.id ? 'text-blue-600 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                                      </div>
                                  </div>
                              )) : <div className="text-center p-4 text-slate-400 text-xs bg-slate-50 rounded-lg">Bu cihaz için geçmiş iş kaydı bulunmuyor.</div>}
                          </div>
                      )}

                      {assetDetailTab === 'faults' && (
                          <div className="space-y-2">
                              {(data?.allFaults || []).filter((f: any) => f.asset_id === showAssetDetail.uuid).length > 0 ? (data?.allFaults || []).filter((f: any) => f.asset_id === showAssetDetail.uuid).map((fault: any, idx: number) => (
                                  <div key={idx} className="p-3 border border-amber-200 bg-amber-50 rounded-xl">
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs"><AlertTriangle size={14}/> Arıza Bildirimi</div>
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${fault.status === 'Aktif' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{fault.status}</span>
                                      </div>
                                      <div className="text-[10px] text-amber-700 mb-1">{fault.created_at ? new Date(fault.created_at).toLocaleString('tr-TR') : ''}</div>
                                      <div className="text-xs text-amber-800 font-medium">Bildiren: {fault.reporter_name} ({fault.reporter_phone})</div>
                                      <div className="text-xs text-slate-700 bg-white p-2 rounded border border-amber-100 mt-2">"{fault.description}"</div>
                                  </div>
                              )) : <div className="text-center p-4 text-slate-400 text-xs bg-slate-50 rounded-lg">Bu cihaz için arıza kaydı bulunmuyor.</div>}
                          </div>
                      )}

                      {assetDetailTab === 'emergencies' && (
                          <div className="space-y-2">
                              {(data?.allEmergencies || []).filter((e: any) => e.asset_id === showAssetDetail.uuid).length > 0 ? (data?.allEmergencies || []).filter((e: any) => e.asset_id === showAssetDetail.uuid).map((em: any, idx: number) => (
                                  <div key={idx} className="p-3 border border-rose-200 bg-rose-50 rounded-xl flex justify-between items-center">
                                      <div>
                                          <div className="font-bold text-rose-900 flex items-center gap-1.5 text-xs mb-1"><ShieldAlert size={14}/> Acil Durum Çağrısı</div>
                                          <div className="text-[10px] text-rose-700">{em.created_at ? new Date(em.created_at).toLocaleString('tr-TR') : ''}</div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${em.status === 'Aktif' ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-700'}`}>{em.status}</span>
                                  </div>
                              )) : <div className="text-center p-4 text-slate-400 text-xs bg-slate-50 rounded-lg">Bu cihaz için acil durum çağrısı bulunmuyor.</div>}
                          </div>
                      )}
                      </>
                  ) : (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                          <div className="space-y-2">
                            {/* DÜZENLEME: Önce Bina, Sonra Varlık, En Son Konum */}
                            <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs outline-none focus:border-blue-400 bg-white" value={editAssetForm.apartmentName} onChange={(e) => setEditAssetForm({...editAssetForm, apartmentName: e.target.value})} placeholder="Bina / Site Adı" />
                            <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs outline-none focus:border-blue-400 bg-white" value={editAssetForm.name} onChange={(e) => setEditAssetForm({...editAssetForm, name: e.target.value})} placeholder="Varlık/Cihaz Adı" />
                            
                            <div className="p-2 bg-slate-100/50 border border-slate-100 rounded-md space-y-2">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Konum / Adres Detayı</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <select className="px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white" value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}>
                                        <option value="">İl Seçin</option>
                                        {Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select className="px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity}>
                                        <option value="">İlçe Seçin</option>
                                        {selectedCity && CITY_DATA[selectedCity]?.map((d:string) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                
                                <div className="flex gap-2">
                                    <input className="w-1/4 px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="Bina No" />
                                    <input className="w-3/4 px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" placeholder="Mahalle/Cadde" value={editAssetForm.location} onChange={(e) => setEditAssetForm({...editAssetForm, location: e.target.value})} />
                                </div>
                            </div>

                           <textarea rows={2} className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs outline-none focus:border-blue-400 bg-white resize-none" value={editAssetForm.deviceDetails} onChange={(e) => setEditAssetForm({...editAssetForm, deviceDetails: e.target.value})} placeholder="Teknik Detaylar" />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button 
                                onClick={() => {
                                    const combined = getFullAddress(editAssetForm.location, buildingNo, selectedCity, selectedDistrict);
                                    handleAction('update-asset', { ...editAssetForm, location: combined }, () => { handleCloseDetail('asset'); manualClose(); }, () => setIsEditingAsset(false))
                                }} 
                                className="flex-1 bg-blue-600 text-white py-2 rounded-md text-xs font-semibold hover:bg-blue-700"
                            >
                                {isSaving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Değişiklikleri Kaydet'}
                            </button>
                           <button onClick={() => setIsEditingAsset(false)} className="px-4 bg-slate-200 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-300">İptal</button>
                          </div>
                        </div>
                  )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={manualClose}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative overflow-y-auto max-h-[90vh] custom-scrollbar pointer-events-auto">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">İş Emri Ata</h2><button onClick={() => { setShowJobModal(false); manualClose(); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-4">
                
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">İş Türü</label>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setJobForm({...jobForm, workCategory: 'Normal İş Atama', customerName: '', assetId: ''})} className={`py-2 text-xs font-semibold rounded-md border transition-colors ${jobForm.workCategory !== 'Genel İş Atama' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Normal İş Atama</button>
                      <button onClick={() => setJobForm({...jobForm, workCategory: 'Genel İş Atama', customerName: '', assetId: ''})} className={`py-2 text-xs font-semibold rounded-md border transition-colors ${jobForm.workCategory === 'Genel İş Atama' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Genel İş Atama</button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">Tarih / Zamanlama</label>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-1.5 text-xs font-semibold rounded-md border ${jobForm.jobType === 'Anlık' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Anlık Görev</button>
                      <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-1.5 text-xs font-semibold rounded-md border ${jobForm.jobType === 'Planlı' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Tarih Planla</button>
                  </div>
                  {jobForm.jobType === 'Planlı' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} />
                    </motion.div>
                  )}
                </div>

                {jobForm.workCategory !== 'Genel İş Atama' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex gap-2 mb-3">
                      <button onClick={() => setJobTargetMode('CUSTOMER')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-colors ${jobTargetMode === 'CUSTOMER' ? 'bg-white text-blue-700 border-blue-300 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100'}`}>Müşteri Seç</button>
                      <button onClick={() => setJobTargetMode('ASSET')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-colors ${jobTargetMode === 'ASSET' ? 'bg-white text-blue-700 border-blue-300 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100'}`}>Varlık Seç</button>
                    </div>

                    {jobTargetMode === 'CUSTOMER' ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                          <input type="text" placeholder="İsim veya TC ile Müşteri Ara..." className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={searchCust} onChange={e => setSearchCust(e.target.value)} />
                        </div>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400 custom-scrollbar" size={4} value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value, assetId: ''})}>
                          <option value="" disabled className="font-semibold text-slate-400 border-b border-slate-100 pb-1 mb-1">-- Listeden Müşteri Seçin --</option>
                          {(data?.customers || []).filter((c:any) => c.name?.toLowerCase().includes(searchCust.toLowerCase()) || c.tax_info?.includes(searchCust)).map((c: any) => <option key={c.id} value={c.name} className="py-1">{c.name} {c.tax_info ? `(${c.tax_info})` : ''}</option>)}
                        </select>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                          <input type="text" placeholder="Cihaz Adı Ara..." className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={searchAsset} onChange={e => setSearchAsset(e.target.value)} />
                        </div>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400 custom-scrollbar" size={4} value={jobForm.assetId} onChange={e => {
                          const selectedAsset = (data?.assets || []).find((a:any) => a.id === e.target.value);
                          const parentCust = (data?.customers || []).find((c:any) => c.id === selectedAsset?.customer_id);
                          setJobForm({...jobForm, assetId: e.target.value, customerName: parentCust?.name || ''});
                        }}>
                          <option value="" disabled className="font-semibold text-slate-400 border-b border-slate-100 pb-1 mb-1">-- Listeden Varlık Seçin --</option>
                          {(data?.assets || []).filter((a: any) => a.name?.toLowerCase().includes(searchAsset.toLowerCase())).map((a: any) => (
                            <option key={a.id} value={a.id} className="py-1">{a.name} - {a.location}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Sorumlu Personel (Yalnızca Yöneticiler)</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}>
                    <option value="">Kayıtlı Yöneticilerden Seçin...</option>
                    {(data?.staff || []).filter((s:any) => s.role === 'Yönetici').map((s:any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Görev Özeti / Talimatlar</label>
                  <textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400" placeholder="İşin detayı nedir?..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} />
                </div>
              </div>
              <button disabled={isSaving || !isJobValid} onClick={() => handleAction('add-job', { ...jobForm, workCategory: jobForm.workCategory || 'Normal İş Atama', details: { note: jobForm.taskNote } }, () => { setShowJobModal(false); manualClose(); }, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', workCategory: 'Normal İş Atama', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} className="w-full bg-blue-600 text-white py-2.5 rounded-md font-semibold text-sm mt-5 hover:bg-blue-700 transition-colors flex justify-center items-center disabled:opacity-50">
                 {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'İş Emrini Gönder'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={manualClose}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto custom-scrollbar pointer-events-auto">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Varlık/Cihaz Ekle</h2><button onClick={() => { setShowAssetModal(false); manualClose(); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">CİHAZIN SAHİBİ (MÜŞTERİ)</label>
                  <div className="grid grid-cols-1 gap-2">
                    <label className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-colors ${assetCustMode === 'NONE' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="custMode" className="hidden" checked={assetCustMode === 'NONE'} onChange={() => setAssetForm({...assetForm, customerMode: 'NONE', customerId: ''})} />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${assetCustMode === 'NONE' ? 'border-blue-600 bg-blue-100' : 'border-slate-300'}`}>
                         {assetCustMode === 'NONE' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                      <span className={`text-xs font-semibold ${assetCustMode === 'NONE' ? 'text-blue-800' : 'text-slate-700'}`}>Bağımsız (Müşteri Atanmasın)</span>
                    </label>
                    <div className={`border rounded-lg transition-colors ${assetCustMode === 'SELECT' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <label className="flex items-center p-2.5 cursor-pointer">
                        <input type="radio" name="custMode" className="hidden" checked={assetCustMode === 'SELECT'} onChange={() => setAssetForm({...assetForm, customerMode: 'SELECT', customerId: ''})} />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${assetCustMode === 'SELECT' ? 'border-blue-600 bg-blue-100' : 'border-slate-300'}`}>{assetCustMode === 'SELECT' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}</div>
                        <span className={`text-xs font-semibold ${assetCustMode === 'SELECT' ? 'text-blue-800' : 'text-slate-700'}`}>Mevcut Müşterilerden Seç</span>
                      </label>
                      {assetCustMode === 'SELECT' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-3 pb-3 pt-1 flex flex-col gap-2">
                          <div className="relative"><Search className="absolute left-2.5 top-2 text-blue-400" size={14} /><input type="text" placeholder="İsim veya T.C. ile Müşteri Ara..." className="w-full pl-8 pr-3 py-1.5 border border-blue-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={searchCust} onChange={e => setSearchCust(e.target.value)} /></div>
                          <select className="w-full px-3 py-2 border border-blue-200 rounded-md text-xs outline-none bg-blue-50 focus:border-blue-400 custom-scrollbar" size={4} value={assetForm.customerId !== 'NEW' ? assetForm.customerId : ''} onChange={e => setAssetForm({...assetForm, customerId: e.target.value})}><option value="" disabled className="font-semibold text-slate-500 border-b border-blue-100 pb-1 mb-1">-- Listeden Tıklayıp Seçin --</option>{(data?.customers || []).filter((c:any) => c.name?.toLowerCase().includes(searchCust.toLowerCase()) || c.tax_info?.includes(searchCust)).map((c: any) => <option key={c.id} value={c.id} className="py-1">{c.name} {c.tax_info ? `(${c.tax_info})` : ''}</option>)}</select>
                        </motion.div>
                      )}
                    </div>
                    <div className={`border rounded-lg transition-colors ${assetCustMode === 'NEW' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <label className="flex items-center p-2.5 cursor-pointer">
                        <input type="radio" name="custMode" className="hidden" checked={assetCustMode === 'NEW'} onChange={() => setAssetForm({...assetForm, customerMode: 'NEW', customerId: 'NEW'})} />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${assetCustMode === 'NEW' ? 'border-blue-600 bg-blue-100' : 'border-slate-300'}`}>{assetCustMode === 'NEW' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}</div>
                        <span className={`text-xs font-semibold ${assetCustMode === 'NEW' ? 'text-blue-800' : 'text-slate-700'}`}>Sıfırdan Yeni Müşteri Oluştur</span>
                      </label>
                      {assetCustMode === 'NEW' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-3 pb-3 pt-1 space-y-2">
                           <input className="w-full px-3 py-2 border border-slate-300 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-white" placeholder="Firma / Müşteri Adı" value={assetForm.newCustomer?.name || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, name: e.target.value}})} />
                           <input className="w-full px-3 py-2 border border-slate-300 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-white" placeholder="Telefon / İletişim" value={assetForm.newCustomer?.contact || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, contact: e.target.value}})} />
                           <div className="grid grid-cols-2 gap-2"><select className="px-3 py-2 border border-slate-300 rounded-md text-xs outline-none bg-white" value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}><option value="">İl Seçin</option>{Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}</select><select className="px-3 py-2 border border-slate-300 rounded-md text-xs outline-none bg-white" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity}><option value="">İlçe Seçin</option>{selectedCity && CITY_DATA[selectedCity]?.map((d:string) => <option key={d} value={d}>{d}</option>)}</select></div>
                           <div className="flex gap-2">
                              <input className="w-1/4 px-3 py-2 border border-slate-300 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="Bina No" />
                              <textarea rows={2} className="w-3/4 px-3 py-2 border border-slate-300 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-white resize-none" placeholder="Mahalle, Sokak..." value={assetForm.newCustomer?.address || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, address: e.target.value}})} />
                           </div>
                        <input className="w-full px-3 py-2 border border-slate-300 shadow-sm rounded-md text-xs outline-none focus:border-blue-400 bg-white" placeholder="Vergi No / T.C." value={assetForm.newCustomer?.taxInfo || ''} onChange={e => setAssetForm({...assetForm, newCustomer: {...assetForm.newCustomer, taxInfo: e.target.value}})} /></motion.div>)}</div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">VARLIK/CİHAZ DETAYLARI</label>
                  <div className="space-y-2">
                    {/* INPUT SIRALAMASI: BİNA ADI, CİHAZ ADI, KONUM */}
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Bina / Site Adı" value={assetForm.apartmentName} onChange={e => setAssetForm({...assetForm, apartmentName: e.target.value})} />
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Varlık/Cihaz Adı (Örn: Yolcu Asansörü)" value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                    
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-md space-y-2"><div className="text-[10px] text-slate-400 font-bold uppercase">Konum / Adres Detayı</div><div className="grid grid-cols-2 gap-2"><select className="px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white" value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}><option value="">İl Seçin</option>{Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}</select><select className="px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity}><option value="">İlçe Seçin</option>{selectedCity && CITY_DATA[selectedCity]?.map((d:string) => <option key={d} value={d}>{d}</option>)}</select></div>
                        <div className="flex gap-2">
                          <input className="w-1/4 px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} placeholder="Bina No" />
                          <input className="w-3/4 px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" placeholder="Mahalle/Cadde" value={assetForm.location} onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                        </div>
                    </div>
                    <textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400" placeholder="Teknik Detaylar (Seri No, Model vs.)" value={assetForm.deviceDetails} onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
                  </div>
                </div>
                <button disabled={isSaving} className="w-full bg-slate-900 text-white py-2.5 rounded-md font-semibold text-sm mt-4 hover:bg-slate-800 flex justify-center items-center" onClick={() => { 
    const newUUID = self.crypto.randomUUID();
    // Bina adı konuma eklenmeden sadece adres bileşenleri birleştirilir
    if (assetCustMode === 'NEW') { 
        const combinedAddress = getFullAddress(assetForm.newCustomer.address, buildingNo, selectedCity, selectedDistrict); 
        const updatedNewCust = { ...assetForm.newCustomer, address: combinedAddress }; 
        handleAction('add-asset', { ...assetForm, newCustomer: updatedNewCust, uuid: newUUID }, () => { setShowAssetModal(false); manualClose(); }, () => { 
            setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '', customerId: '', customerMode: 'NONE', newCustomer: { name: '', contact: '', address: '', taxInfo: '', assetAction: '', assetMode: 'NONE', newAsset: { name: '', location: '', apartmentName: '', deviceDetails: '' } } }); setSelectedCity(''); setSelectedDistrict(''); setBuildingNo(''); 
        }); 
    } else { 
        const combinedLocation = getFullAddress(assetForm.location, buildingNo, selectedCity, selectedDistrict); 
        handleAction('add-asset', { ...assetForm, location: combinedLocation, uuid: newUUID }, () => { setShowAssetModal(false); manualClose(); }, () => { 
            setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '', customerId: '', customerMode: 'NONE', newCustomer: { name: '', contact: '', address: '', taxInfo: '', assetAction: '', assetMode: 'NONE', newAsset: { name: '', location: '', apartmentName: '', deviceDetails: '' } } }); setSelectedCity(''); setSelectedDistrict(''); setBuildingNo(''); 
        }); 
    } 
}}>{isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Varlığı Sisteme Kaydet'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSupplierListModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={manualClose}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative max-h-[85vh] flex flex-col pointer-events-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">Tedarikçileri Yönet</h2>
                <button onClick={() => { setShowSupplierListModal(false); manualClose(); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {(data?.suppliers || []).length > 0 ? (data?.suppliers || []).map((s: any) => (
                  <div key={s.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    {editingSupplierId === s.id ? (
                      <div className="space-y-2">
                        <input className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={editSupFormLocal.name} onChange={e => setEditSupFormLocal({...editSupFormLocal, name: e.target.value})} placeholder="Firma Adı" />
                        <input className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400 bg-white" value={editSupFormLocal.phone} onChange={e => setEditSupFormLocal({...editSupFormLocal, phone: e.target.value})} placeholder="Telefon" />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleAction('update-supplier', { id: s.id, name: editSupFormLocal.name, phone: editSupFormLocal.phone }, null, () => setEditingSupplierId(null))} className="flex-1 bg-blue-600 text-white py-1.5 rounded-md text-[10px] font-bold">Kaydet</button>
                          <button onClick={() => setEditingSupplierId(null)} className="flex-1 bg-slate-200 text-slate-700 py-1.5 rounded-md text-[10px] font-bold">İptal</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{s.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{s.phone || 'Telefon Yok'}</div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => { setEditingSupplierId(s.id); setEditSupFormLocal({ name: s.name, phone: s.phone || '' }); }} className="p-1.5 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-md transition-colors"><Edit2 size={14} /></button>
                          <button onClick={async () => { if(confirm('Bu tedarikçiyi silmek istediğinize emin misiniz? (Bağlı stok ürünleri varsa tedarikçi alanı boş kalır)')) { await handleAction('delete-supplier', { id: s.id }, null, null); } }} className="p-1.5 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-md transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                )) : <div className="text-center p-4 text-xs text-slate-400">Henüz tedarikçi eklenmemiş.</div>}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                 <button onClick={() => { setShowSupplierListModal(false); setShowSupplierModal(true); }} className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors">
                    <Plus size={14} /> Yeni Tedarikçi Ekle
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSupplierModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={manualClose}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xs rounded-xl p-6 shadow-xl relative pointer-events-auto">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Tedarikçi Ekle</h2><button onClick={() => { setShowSupplierModal(false); manualClose(); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                 <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Tedarikçi Firma Adı" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
                 <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Telefon" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                 <button disabled={isSaving} className="w-full bg-slate-900 text-white py-2 rounded-md font-semibold text-sm mt-2 hover:bg-slate-800 flex justify-center" onClick={() => handleAction('add-supplier', supplierForm, () => { setShowSupplierModal(false); manualClose(); }, () => setSupplierForm({ name: '', phone: '' }))}>
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Kaydet'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}