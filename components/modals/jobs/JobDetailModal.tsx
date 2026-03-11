'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Search, User, Box, Calendar, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle, Clock, Image as ImageIcon, Download, MessageSquareText, Settings, CheckSquare, Tag, Wrench, ArrowUpRight, UserPlus, UserCheck, Printer, Palette, Bluetooth } from 'lucide-react';
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
  selectedAsset, setSelectedAsset,
  setShowThermalPrintModal, setSelectedThermalJob
}: any) {

// 🚀 Hangi alt modalın BU modal tarafından açıldığını takip ediyoruz
const [openedChild, setOpenedChild] = useState<'customer' | 'asset' | null>(null);
  
// 🚀 Yeni Tab State'i (Yönetici Sekmeli Görünüm İçin)
const [activeTab, setActiveTab] = useState('ozet');
  
  // 🚀 Şık Hata/Bilgi Modalı
  const [notification, setNotification] = useState<{show: boolean, msg: string, type: 'error' | 'success'}>({show: false, msg: '', type: 'success'});

  // 🚀 Firma Logosu ve Arka Plan Rengi Sistemi
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

  // 🚀 Yazdırma Modu Seçimi
  const [showPrintModeSelection, setShowPrintModeSelection] = useState(false);
  const [printMode, setPrintMode] = useState<'color' | 'bw'>('color');

  // 🚀 Fotoğraf Yükleme Durumu
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 🚀 İMZA STATE VE REF'LERİ
  const [signatureName, setSignatureName] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const executePrint = (mode: 'color' | 'bw') => {
    setPrintMode(mode);
    setShowPrintModeSelection(false);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode('color'), 1000); // Yazdırdıktan sonra normale dön
    }, 150);
  };

  const getSafeImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev')) {
       return url.replace('https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  useEffect(() => {
    if (!data?.logo) {
      setLogoBgColor('#ffffff');
      return;
    }

    const safeLogoUrl = getSafeImageUrl(data.logo);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onerror = () => {
      setLogoBgColor('#ffffff');
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pxData = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < pxData.length; i += 4) {
          if (pxData[i + 3] < 128) continue; 
          r += pxData[i];
          g += pxData[i + 1];
          b += pxData[i + 2];
          count++;
        }
        
        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          const palette = [
            { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
            { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, 
            { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }
          ];

          let maxDist = -1;
          let selectedColor = '#ffffff';

          for (const color of palette) {
            const dist = Math.sqrt(Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2));
            if (dist > maxDist) {
              maxDist = dist;
              selectedColor = color.hex;
            }
          }
          setLogoBgColor(selectedColor);
        }
      } catch (e) {
        console.error("Renk analizi yapılamadı:", e);
      }
    };
    img.src = safeLogoUrl + (safeLogoUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
  }, [data?.logo]);

// Dışarıdan modal kapandığında local state'i temizle (Eğer parent data'yı null yapmıyor sadece modalı kapatıyorsa isAnyProfileDetailOpen kontrolü hayat kurtarır)
useEffect(() => {
    if ((!selectedCustomer || !isAnyProfileDetailOpen) && openedChild === 'customer') {
        setOpenedChild(null);
    }
  }, [selectedCustomer, isAnyProfileDetailOpen, openedChild]);

  useEffect(() => {
    if ((!selectedAsset || !isAnyProfileDetailOpen) && openedChild === 'asset') {
        setOpenedChild(null);
    }
  }, [selectedAsset, isAnyProfileDetailOpen, openedChild]);

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

    if (showPrintModeSelection) {
        stopEvent();
        setShowPrintModeSelection(false);
        return true;
      }
  
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
      // Modal kapanırken imza alanını sıfırla
      setSignatureImage(null);
      setSignatureName('');
      if (handleCloseDetail) handleCloseDetail('job');
      return true;
    }

    return false;
}, [
    fullScreenImage, previewPdfJob, showCancelConfirm, openedChild, showPrintModeSelection,
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

  // 🚀 İMZA ÇİZİM (CANVAS) FONKSİYONLARI
  const getCoordinates = (e: any) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const coords = getCoordinates(e);
    const ctx = signatureCanvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault(); // Ekranda kaymayı engelle
    const coords = getCoordinates(e);
    const ctx = signatureCanvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.lineTo(coords.x, coords.y);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
        setSignatureImage(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureImage(null);
    }
  };

  const sendCustomerWhatsApp = (jobData: any) => {
    const custPhone = (data?.customers || []).find((c:any) => c.name === jobData.customer_name)?.contact;
    if(!custPhone) { 
        setNotification({show: true, msg: "Bu müşterinin sistemde kayıtlı bir telefon numarası bulunamadı!", type: 'error'});
        setTimeout(() => setNotification({show: false, msg: '', type: 'success'}), 3000);
        return; 
    }
    
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
      {/* 0. PDF ÖNİZLEME MODALI (KESİN YAZDIRMA ÇÖZÜMÜ) */}
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
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer no-print"
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
                {/* BASKI TÜRÜ SEÇİM EKRANI */}
                <AnimatePresence>
                  {showPrintModeSelection && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 sm:p-8 no-print"
                    >
                      <h3 className="text-2xl font-black text-slate-800 mb-2">Baskı Türü</h3>
                      <p className="text-[13px] font-medium text-slate-500 mb-8 text-center px-2">
                        Servis formunu yazıcınıza uygun olan formatta yazdırın.
                      </p>
                      
                      <div className="w-full max-w-xs space-y-3">
                          <button 
                            onClick={() => executePrint('color')} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                          >
                            <Palette size={20} /> Renkli Baskı
                          </button>
                          
                          <button 
                            onClick={() => executePrint('bw')} 
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                          >
                            <Printer size={20} /> Siyah Beyaz Baskı
                          </button>
                      </div>

                      <button 
                        onClick={() => setShowPrintModeSelection(false)} 
                        className="mt-6 px-6 py-2 text-slate-400 font-bold text-sm hover:text-slate-800 transition-colors active:scale-95"
                      >
                        İptal Et
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print z-10">
                   <h2 className="font-black text-lg text-slate-800">Servis Formu & Fiyat Özeti</h2>
                   <button onClick={() => handleSmartClose()} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"><X size={18} /></button>
                </div>
                
                <div id="pdf-printable-area" className={`p-6 sm:p-10 overflow-y-auto custom-scrollbar bg-white text-black flex-1 relative ${printMode === 'bw' ? 'bw-mode' : ''}`}>
                    
                    {/* 🚀 PREMIUM LOGO & BAŞLIK (ORTALANMIŞ) */}
                    <div className="flex flex-col items-center justify-center mb-6 text-center">
                        {data?.logo && (
                            <div 
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 print-logo-container p-2"
                                style={{ backgroundColor: logoBgColor }}
                            >
                                <img 
                                    src={getSafeImageUrl(data.logo)} 
                                    alt="Firma Logosu" 
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-contain print-logo" 
                                />
                            </div>
                        )}
                        <h1 className="text-2xl font-black uppercase tracking-widest">{data?.name || 'Firma Adı'}</h1>
                        <h2 className="text-lg font-bold mt-1 text-slate-800">{previewPdfJob.work_type === 'Periyodik Bakım' ? 'Bakım Fişi' : 'Servis Raporu'}</h2>
                    </div>

                    {/* 🚀 ÜST BİLGİLER (KAYIT NO, TARİH, PERSONEL, TESİS) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-medium border-b-2 border-dashed border-slate-800 pb-4 mb-6">
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fiş Numarası</div>
                            <div className="font-black">#{previewPdfJob.id}</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tarih</div>
                            <div className="font-black">{new Date(previewPdfJob.created_at || Date.now()).toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">İlgili Personel</div>
                            <div className="font-black truncate">{previewPdfJob.worker_name || 'Belirtilmedi'}</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tesis Adı / Adres</div>
                            <div className="font-black leading-tight">
                                {(() => {
                                    const asset = (data?.assets || []).find((a:any) => a.id === previewPdfJob.asset_id);
                                    if (asset) {
                                        return (
                                            <>
                                                <div>{asset.apartmentName || asset.name}</div>
                                                {asset.location && <div className="text-[11px] font-semibold text-slate-600 mt-0.5 whitespace-normal">{asset.location}</div>}
                                            </>
                                        );
                                    }
                                    return previewPdfJob.customer_name || 'Bilinmiyor';
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* 🚀 BİRLEŞTİRİLMİŞ FİŞ GÖRÜNÜMÜ (KONTROL LİSTESİ + NOTLAR) */}
                    <div className="mb-8">
                        <div className="bg-slate-50/50 p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print-no-bg">
                            <div className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">BAKIM / SERVİS NOTU:</div>
                            
                            <div className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap flex flex-col gap-1.5">
                                {(() => {
                                    if (!previewPdfJob.details) return <div className="text-slate-500 italic">Rapor girilmemiş.</div>;
                                    
                                    const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName', 'usedMaterials'];
                                    const formEntries = Object.entries(previewPdfJob.details).filter(([k]) => !excludeKeys.includes(k));
                                    
                                    return (
                                        <>
                                            {/* Saha Formu İçeriği */}
                                            {formEntries.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="text-slate-500 mb-2">--- {previewPdfJob.work_type || 'Servis'} Saha Formu ---</div>
                                                    <div className="flex flex-col gap-1.5">
                                                        {formEntries.map(([key, value], idx) => (
                                                            <div key={idx} className="flex gap-2">
                                                                <span className="text-slate-600">{key}:</span>
                                                                <span className="font-bold text-slate-900">{String(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="text-slate-300 mt-3 border-b border-dashed border-slate-300"></div>
                                                </div>
                                            )}
                                            
                                            {/* Manuel Usta Notu */}
                                            {previewPdfJob.details.note && (
                                                <div className="mt-1 text-slate-800">
                                                    {previewPdfJob.details.note.replace(/\[📍 Konum Kaydı\].*/g, '')}
                                                </div>
                                            )}
                                            
                                            {/* Hiçbiri yoksa */}
                                            {formEntries.length === 0 && !previewPdfJob.details.note && (
                                                <div className="text-slate-500 italic">Kayıtlı veri bulunamadı.</div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            
                            {/* Fiyat Alanı (Varsa) */}
                            {previewPdfJob.details?.price && (
                                <div className="mt-6 pt-4 border-t border-dashed border-slate-300 text-right">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Toplam Tutar</span>
                                    <span className="text-2xl font-black text-slate-900">{previewPdfJob.details.price}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🚀 FOTOĞRAFLAR (Varsa) */}
                    {previewPdfJob.photos && previewPdfJob.photos.length > 0 && (
                       <div className="mb-8 print-always-break">
                          <div className="text-xs font-black text-slate-800 uppercase pb-4">Saha Kayıt Fotoğrafları</div>
                          <div className="grid grid-cols-2 gap-4 print-grid">
                             {previewPdfJob.photos.map((p: string, i: number) => (
                               <div key={i} className="page-break-avoid w-full">
                                  <img src={p} alt="Saha" className="w-full h-auto max-h-64 object-contain rounded-lg border border-slate-300" crossOrigin="anonymous" />
                               </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* 🚀 ELEKTRONİK İMZA ALANI (En Altta Mühür Gibi) */}
                    {previewPdfJob.signature_url && (
                        <div className="mt-8 pt-6 border-t-2 border-slate-800 text-center page-break-avoid flex flex-col items-center">
                            <p className="text-xs text-slate-500 mb-6 italic max-w-md">
                                Bu form <strong className="text-slate-700">{previewPdfJob.worker_name || 'personelimiz'}</strong> tarafından, {new Date(previewPdfJob.created_at || Date.now()).toLocaleString('tr-TR')} tarihinde müşteri nezaretinde elektronik imza ile imza altına alınmıştır.
                            </p>
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İmzalayan:</span> 
                                    {previewPdfJob.customer_signature_name}
                                </div>
                                <img 
                                    src={getSafeImageUrl(previewPdfJob.signature_url)} 
                                    alt="Müşteri İmzası" 
                                    className="h-24 object-contain mix-blend-multiply print-signature" 
                                />
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                                    {data?.name || 'Firma Adı'}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3 no-print z-10">
                   <button onClick={() => setShowPrintModeSelection(true)} className="flex-[2] bg-slate-900 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95">
                      <Printer size={18} /> PDF Olarak Cihaza Kaydet
                   </button>
                   {(() => {
                       const isPdfGeneral = previewPdfJob.work_type === 'Genel Görev' || previewPdfJob.work_type === 'Görev' || !previewPdfJob.customer_name || previewPdfJob.customer_name === 'Genel Görev';
                       const hasPhone = !!(data?.customers || []).find((c:any) => c.name === previewPdfJob.customer_name)?.contact;
                       
                       if (isPdfGeneral && (!previewPdfJob.customer_name || previewPdfJob.customer_name === 'Genel Görev' || !hasPhone)) return null;
                       
                       return (
                           <button onClick={() => sendCustomerWhatsApp(previewPdfJob)} className="flex-1 bg-emerald-500 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-md active:scale-95">
                              <MessageSquareText size={18} /> Müşteriye Gönder
                           </button>
                       );
                   })()}
                </div>
             </motion.div>
             
             {/* 🚀 KUSURSUZ YAZDIRMA CSS'İ - "NUKE" METODU (Framer Motion'u Ezer) */}
             <style dangerouslySetInnerHTML={{__html:`
               @media print {
                 @page { margin: 10mm; size: A4 portrait; }
                 
                 /* YAZICI VE PDF İÇİN RENK KORUMA KİLİDİ */
                 html, body {
                   -webkit-print-color-adjust: exact !important;
                   print-color-adjust: exact !important;
                 }
                 
                 /* 1. BÜTÜN SAYFAYI GİZLE VE RESETLE */
                 body * { visibility: hidden !important; }
                 
                 /* 2. FRAMER MOTION VE TAILWIND ENGELİNİ KALDIR (ÇOK ÖNEMLİ) */
                 * { 
                    position: static !important; 
                    transform: none !important; 
                    overflow: visible !important; 
                    max-height: none !important; 
                    box-shadow: none !important; 
                 }

                 /* 3. SADECE YAZDIRILACAK ALANI GÖSTER */
                 #pdf-printable-area, #pdf-printable-area * {
                    visibility: visible !important;
                 }
                 
                 /* RENKSİZ (SİYAH BEYAZ) BASKI MODU */
                 .bw-mode, .bw-mode * {
                    color: black !important;
                    border-color: black !important;
                 }
                 .bw-mode .print-no-bg, .bw-mode .bg-slate-50, .bw-mode .bg-blue-50 {
                    background-color: transparent !important;
                 }
                 .bw-mode img {
                    filter: grayscale(100%) brightness(0) !important;
                 }

                 /* 4. YAZDIRILACAK ALANI KAĞIDIN EN TEPESİNE YAPIŞTIR */
                 #pdf-printable-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    background-color: white !important;
                 }

                 /* 5. MÜŞTERİ VE CİHAZ KUTULARINI YAN YANA GETİR VE MOBİL KISITLAMALARINI YAZICIDA EZ */
                 .print-header { 
                    flex-direction: row !important; 
                    justify-content: space-between !important; 
                    align-items: flex-start !important;
                 }
                 .print-header-right { 
                    text-align: right !important; 
                 }
                 .print-grid {
                    display: flex !important;
                    flex-direction: row !important;
                    flex-wrap: nowrap !important;
                    gap: 20px !important;
                 }
                 .print-grid > div {
                    flex: 1 !important;
                    border: 1px solid #e2e8f0 !important;
                    background: transparent !important;
                 }

                 /* 6. GEREKSİZLERİ YOK ET */
                 .no-print, .no-print * { 
                    display: none !important; 
                 }
                 
                 /* 7. FOTOĞRAFLARI KESİLMEDEN YAZDIR VE LOGO/İMZA BOYUTLARINI KORU */
                 .print-grid img { 
                    max-width: 100% !important; 
                    height: auto !important; 
                    page-break-inside: avoid !important; 
                    break-inside: avoid !important; 
                 }
                 .print-logo-container {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    border: none !important;
                    box-shadow: none !important;
                 }
                 .print-logo {
                    max-height: 80px !important;
                    width: auto !important;
                    object-fit: contain !important;
                 }
                 .print-signature {
                    max-height: 80px !important;
                    width: auto !important;
                    object-fit: contain !important;
                 }
                 .print-always-break {
                    break-before: page !important;
                    page-break-before: always !important;
                 }
                 .page-break-avoid {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                 }
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
                <div className="flex-1 flex flex-col min-h-0">
                    
                    {/* 🚀 YENİ SEKME (TAB) MENÜSÜ */}
                    <div className="flex items-center px-4 sm:px-6 pt-2 border-b border-slate-200 shrink-0 gap-4 overflow-x-auto custom-scrollbar">
                        <button onClick={() => setActiveTab('ozet')} className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'ozet' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Özet Bilgi</button>
                        
                        {(selectedJob.details?.note || selectedJob.details?.usedMaterials || Object.keys(selectedJob.details || {}).length > 2) && (
                           <button onClick={() => setActiveTab('form')} className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'form' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Form & Stok</button>
                        )}
                        
                        {(selectedJob.photos?.length > 0 || selectedJob.signature_url) && (
                           <button onClick={() => setActiveTab('medya')} className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'medya' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Medya & İmza</button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 relative">
                        
                        {/* 🚀 TAB 1: ÖZET */}
                        {activeTab === 'ozet' && (
                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-4 sm:space-y-5">
                                {(() => {
                                    const creator = selectedJob.creator_name || (data?.ownerName?.split(' ')[0] || 'Sistem');
                                    let managerName = selectedJob.manager_name || null;
                                    let finalWorkerName = selectedJob.worker_name || null;

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
                                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 z-20 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center rounded-b-2xl">
                                                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-inner"><AlertTriangle size={32} /></div>
                                                <h3 className="text-xl font-black text-slate-800 mb-2">İşi İptal Etmek İstiyor musun?</h3>
                                                <div className="flex gap-3 w-full max-w-[250px]">
                                                    <button onClick={async () => { await handleAction('update-job', { id: selectedJob.id, status: 'İptal' }, () => setSelectedJob(null), () => {}); }} className="flex-1 bg-rose-600 text-white py-3 rounded-xl text-sm font-bold shadow-md active:scale-95">{isSaving ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Evet, İptal'}</button>
                                                    <button onClick={() => setShowCancelConfirm(false)} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold active:scale-95">Vazgeç</button>
                                                </div>
                                                </motion.div>
                                            )}
                                            </AnimatePresence>

                                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GÜNCEL DURUM</span>
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-black border uppercase tracking-wider ${dynamicStatus.colorClass}`}>{dynamicStatus.label}</span>
                                            </div>

                                            {!isGeneralTask && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <div onClick={() => {
                                                        const theCustomer = (data?.customers || []).find((c:any) => c.name === selectedJob.customer_name);
                                                        if(theCustomer && setSelectedCustomer) { setOpenedChild('customer'); setSelectedCustomer(theCustomer); }
                                                    }} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors cursor-pointer group relative">
                                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Müşteri Profili</div>
                                                        <div className="text-sm font-black text-slate-800 pr-5">{selectedJob.customer_name}</div>
                                                        <ArrowUpRight size={16} className="absolute top-4 right-4 text-slate-300 group-hover:text-blue-500" />
                                                    </div>
                                                    
                                                    {(() => {
                                                        const theAsset = selectedJob.asset_id ? (data?.assets || []).find((a:any) => String(a.id) === String(selectedJob.asset_id)) : null;
                                                        return (
                                                            <div onClick={() => {
                                                                if(selectedJob.asset_id && setSelectedAsset && theAsset) { setOpenedChild('asset'); setSelectedAsset(theAsset); }
                                                            }} className={`bg-white p-4 border border-slate-200 rounded-xl shadow-sm relative ${selectedJob.asset_id ? 'hover:border-blue-300 cursor-pointer group' : 'opacity-70'}`}>
                                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">İlgili Varlık</div>
                                                                
                                                                {theAsset?.apartmentName ? (
                                                                    <>
                                                                        <div className="text-sm font-bold text-slate-800 pr-5 truncate flex items-center gap-1.5">
                                                                            🏢 {theAsset.apartmentName}
                                                                        </div>
                                                                        <div className="text-[11px] font-medium text-slate-500 mt-0.5 pr-5 truncate">
                                                                            {theAsset.name}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="text-sm font-bold text-slate-800 pr-5 truncate">{theAsset ? theAsset.name : 'Seçilmemiş'}</div>
                                                                )}

                                                                {selectedJob.asset_id && <ArrowUpRight size={16} className="absolute top-4 right-4 text-slate-300 group-hover:text-blue-500 transition-colors" />}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Görev Tipi</div>
                                                    <div className="text-sm font-bold text-slate-800">{selectedJob.work_type}</div>
                                                </div>
                                                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Planlanan Tarih</div>
                                                    <div className="text-sm font-bold text-slate-800">
                                                        {selectedJob.scheduled_date ? (
                                                            selectedJob.scheduled_date
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <span>Anlık</span>
                                                                {selectedJob.created_at && (
                                                                    <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                                        {new Date(selectedJob.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm col-span-2 flex justify-between items-center">
                                                     <div>
                                                         <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Saha Ustası</div>
                                                         <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5"><Wrench size={14}/> {finalWorkerName || 'Atanmadı'}</div>
                                                     </div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        )}

                        {/* 🚀 TAB 2: FORM VE STOK */}
                        {activeTab === 'form' && (
                             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-4">
                                 {(() => {
                                     const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName', 'usedMaterials'];
                                     const formEntries = Object.entries(selectedJob.details || {}).filter(([k]) => !excludeKeys.includes(k));
                                     
                                     const hasFormEntries = formEntries.length > 0;
                                     const hasNote = !!selectedJob.details?.note;
                                     const hasMaterials = selectedJob.details?.usedMaterials && selectedJob.details.usedMaterials.length > 0;

                                     // Eğer hiçbir veri yoksa şık bir uyarı çıkarıyoruz
                                     if (!hasFormEntries && !hasNote && !hasMaterials) {
                                         return (
                                             <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
                                                 <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm text-slate-300 rounded-full flex items-center justify-center mb-4">
                                                     <CheckSquare size={28} />
                                                 </div>
                                                 <div className="text-sm font-black text-slate-700 mb-1">Kayıt Bulunmuyor</div>
                                                 <div className="text-xs font-medium text-slate-500 max-w-[250px]">Bu görev için henüz bir saha formu doldurulmamış veya stok düşülmemiş.</div>
                                             </div>
                                         );
                                     }

                                     // Veri varsa ilgili blokları render et
                                     return (
                                         <>
                                             {/* Form Kontrol Listesi */}
                                             {hasFormEntries && (
                                                 <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                                                     <div className="text-xs font-black text-blue-800 uppercase border-b border-blue-200/50 pb-2 mb-3">Kontrol Edilen Aksamlar</div>
                                                     <div className="space-y-2">
                                                         {formEntries.map(([key, value], idx) => (
                                                             <div key={idx} className="flex justify-between items-center py-2 border-b border-blue-100/50 last:border-0 text-sm">
                                                                 <span className="font-semibold text-slate-700">{key}</span>
                                                                 <span className="font-black text-slate-900">{String(value)}</span>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             )}

                                             {/* Usta Saha Notu */}
                                             {hasNote && (
                                                 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                                     <div className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Usta Saha Notu</div>
                                                     <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap italic border-l-2 border-slate-300 pl-3">
                                                         "{selectedJob.details.note}"
                                                     </p>
                                                 </div>
                                             )}

                                             {/* Kullanılan Malzemeler (Stok) */}
                                             {hasMaterials && (
                                                 <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                                                     <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Box size={14}/> Sistemden Düşülen Malzemeler</div>
                                                     <div className="space-y-2">
                                                         {selectedJob.details.usedMaterials.map((mat:any, i:number) => (
                                                             <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
                                                                 <span className="text-xs font-bold text-slate-800">{mat.name}</span>
                                                                 <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-1 rounded">{mat.quantity} {mat.unit}</span>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             )}
                                         </>
                                     );
                                 })()}
                             </motion.div>
                        )}

                        {/* 🚀 TAB 3: MEDYA VE İMZA */}
                        {activeTab === 'medya' && (
                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
                                {selectedJob.photos && selectedJob.photos.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-1.5">
                                            <ImageIcon size={14} /> Saha Fotoğrafları
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {selectedJob.photos.map((photoUrl: string, idx: number) => (
                                                <div key={idx} onClick={() => setFullScreenImage(photoUrl)} className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:border-blue-500 transition-all hover:scale-105 active:scale-95">
                                                    <img src={photoUrl} alt="Saha" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedJob.signature_url && (
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
                                        <p className="text-xs text-slate-500 mb-4 italic">Bu form müşteri nezaretinde elektronik imza ile onaylanmıştır.</p>
                                        <div className="inline-block bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">İmzalayan: <span className="text-slate-800">{selectedJob.customer_signature_name}</span></div>
                                            <img src={getSafeImageUrl(selectedJob.signature_url)} alt="Müşteri İmzası" className="h-24 mx-auto object-contain mix-blend-multiply" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </div>

                    {/* 🚀 ALT AKSİYON BUTONLARI (Fiyat Onay vb.) */}
                    <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                        {/* Onay ve Fiyat Bloğu */}
                        {selectedJob.status === 'Onay Bekliyor' && (
                                    <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-inner">
                                       <div className="text-amber-800 font-black text-sm flex items-center gap-2"><AlertTriangle size={18}/> Personel İşi Tamamladı. Onayınız Bekleniyor.</div>
                                       
                                       {isGeneralTask ? (
                                           <button disabled={isApproving} onClick={async () => {
                                               setIsApproving(true);
                                               await handleAction('update-job', { id: selectedJob.id, status: 'Tamamlandı', lastEditedBy: data?.ownerName, workType: selectedJob.work_type, details: selectedJob.details }, () => setSelectedJob(null), null);
                                               setIsApproving(false);
                                           }} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 sm:py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center active:scale-95 text-sm">
                                               {isApproving ? <Loader2 className="animate-spin" size={18}/> : 'Görevi Onayla ve Tamamla'}
                                           </button>
                                       ) : (
                                           <>
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
                                           </>
                                       )}
                                    </div>
                                )}

                                {selectedJob.status === 'Tamamlandı' && selectedJob.work_type === 'Periyodik Bakım' && (  
                                    <button 
                                        onClick={() => {
                                            if (setShowThermalPrintModal && setSelectedThermalJob) {
                                                setSelectedThermalJob(selectedJob);
                                                setShowThermalPrintModal(true);
                                            }
                                        }} 
                                        className="w-full bg-blue-600 border border-blue-700 text-white font-black py-3.5 rounded-xl hover:bg-blue-700 transition-all flex justify-center items-center gap-2 shadow-sm active:scale-95 text-sm mt-3"
                                    >
                                        <Bluetooth size={18} /> Bluetooth ile Fiş Yazdır
                                    </button>
                                )}

                                {selectedJob.status === 'Tamamlandı' && (  
                                    <button onClick={() => setPreviewPdfJob(selectedJob)} className="w-full bg-emerald-100 border border-emerald-300 text-emerald-700 font-black py-3.5 rounded-xl hover:bg-emerald-200 transition-all flex justify-center items-center gap-2 shadow-sm active:scale-95 text-sm mt-3">
                                       <MessageSquareText size={18} /> {isGeneralTask && (!selectedJob.customer_name || selectedJob.customer_name === 'Genel Görev') ? 'Servis Formu / PDF Görüntüle' : 'Rapor Önizleme & WhatsApp Gönder'}
                                    </button>
                                )}

                        {selectedJob.status !== 'Tamamlandı' && selectedJob.status !== 'İptal' && (
                        <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 w-full pt-4 mt-2 border-t border-slate-100 flex-wrap">
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
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Görev Özeti / Talimatlar <span className="text-slate-400 font-medium normal-case">(İsteğe Bağlı)</span></label>
                      <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="İşin detayı nedir?..." value={editJobDetailForm.taskNote} onChange={e => setEditJobDetailForm({...editJobDetailForm, taskNote: e.target.value})} />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 w-full pt-4 mt-2 border-t border-slate-100">
                        {/* 🚀 DÜZELTİLDİ: STATÜ GÜNCELLEMESİ BURAYA ENTEGRE EDİLDİ */}
                        <button 
                            disabled={!isEditJobValid || isSaving}
                            onClick={() => {
                                let nextStatus = selectedJob.status;
                                const isGeneral = editJobDetailForm.workCategory === 'Genel İş Atama' || editJobDetailForm.workType === 'Genel Görev';

                                // Durum Otomatik Güncelleme Mantığı
                                if (editJobDetailForm.staffId) {
                                    // Usta atandıysa durum kesinlikle Devam Ediyor olmalı
                                    nextStatus = 'Devam Ediyor';
                                } else if ((nextStatus === 'Beklemede' || nextStatus === 'Gelecek') && !editJobDetailForm.staffId) {
                                    // Usta atanmamışsa ama iş düzenlenip kaydediliyorsa Usta Bekliyor'a geçmeli
                                    nextStatus = isGeneral ? 'Devam Ediyor' : 'Usta Bekliyor';
                                } else if (nextStatus === 'Devam Ediyor' && !editJobDetailForm.staffId && !isGeneral) {
                                    // Yanlışlıkla Devam Eden işten usta silindiyse tekrar Usta Bekliyor'a düşür
                                    nextStatus = 'Usta Bekliyor';
                                }

                                handleAction('update-job', { 
                                    ...editJobDetailForm, 
                                    id: selectedJob.id,
                                    status: nextStatus !== selectedJob.status ? nextStatus : undefined,
                                    lastEditedBy: data?.ownerName || 'Yönetici' 
                                }, () => setSelectedJob(null), () => setIsEditingJobDetail(false));
                            }} 
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

      {/* 3. ŞIK BİLDİRİM / HATA MODALI */}
      <AnimatePresence>
        {notification.show && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed inset-0 z-[400] flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="bg-white/95 backdrop-blur-md border-2 border-slate-100 shadow-2xl rounded-3xl p-8 flex flex-col items-center text-center max-w-sm w-full pointer-events-auto">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner animate-pulse ${notification.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {notification.type === 'error' ? <AlertTriangle size={40} strokeWidth={3} /> : <CheckCircle size={40} strokeWidth={3} />}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">{notification.type === 'error' ? 'Hata!' : 'Başarılı!'}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{notification.msg}</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}