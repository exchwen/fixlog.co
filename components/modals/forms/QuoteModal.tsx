"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ArrowRight, Loader2, CheckCircle, Search, FileText, Download, RotateCcw, User, Box, MessageCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
  };
  let token = localStorage.getItem('patron_authToken') || getCookie('patron_authToken');
  if (!token) token = localStorage.getItem('staff_authToken') || getCookie('staff_authToken');
  return token ? token.replace(/^"|"\$/g, '') : '';
};

export default function QuoteModal({ showQuoteModal, setShowQuoteModal, data, setActiveTab }: any) {
  const [step, setStep] = useState(1);
  const [quoteType, setQuoteType] = useState('Bakım Sözleşmesi');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState(''); // 🚀 YENİ: Tarayıcı 'alert' yerine kullanılacak
  
  // 🚀 YENİ: İmza Yöntemi State'i
  const [signMode, setSignMode] = useState<'field' | 'office'>('field'); 

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [searchAsset, setSearchAsset] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [newAssetMode, setNewAssetMode] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  
  const [maintenanceContract, setMaintenanceContract] = useState('');
  const [revisionDetails, setRevisionDetails] = useState('');
  const [elevatorType, setElevatorType] = useState('');
  const [stopsCount, setStopsCount] = useState('');
  const [capacity, setCapacity] = useState('');

  const employerCanvasRef = useRef<HTMLCanvasElement>(null);
  const customerCanvasRef = useRef<HTMLCanvasElement>(null);
  const [employerSignature, setEmployerSignature] = useState(false);
  const [customerSignature, setCustomerSignature] = useState(false);

  useEffect(() => {
    if (data?.settings?.maintenance_contract_template) {
      setMaintenanceContract(data.settings.maintenance_contract_template);
    } else {
      setMaintenanceContract("İşbu sözleşme, taraflar arasında aylık periyodik bakım hizmetlerini kapsamaktadır...\n\n1. Kapsam:\n2. Ücretlendirme:\n3. Yükümlülükler:");
    }
  }, [data]);

  const handleSaveContractTemplate = async (val: string) => {
    setMaintenanceContract(val);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';
      const slug = window.location.pathname.split('/')[1];
      
      await fetch(`${API_URL}/update-maintenance-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ slug, template: val })
      });
    } catch(e) {}
  };

  const resetForm = () => {
    setStep(1);
    setQuoteType('Bakım Sözleşmesi');
    setSignMode('field'); // SIFIRLA
    setCustomerName('');
    setCustomerPhone('');
    setSearchAsset('');
    setSelectedAssetId('');
    setSelectedCustomerId('');
    setNewCustomerMode(false);
    setNewAssetMode(false);
    setNewAssetName('');
    setStatus('idle');
    setErrorMessage('');
    setEmployerSignature(false);
    setCustomerSignature(false);
  };

  const handleClose = () => {
    setShowQuoteModal(false);
    setTimeout(resetForm, 300);
  };

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showQuoteModal) handleClose();
    };
    if (showQuoteModal) window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [showQuoteModal]);

  const getFullAssetName = () => {
      if (newAssetMode) return newAssetName;
      const asset = data?.assets?.find((a: any) => String(a.id) === selectedAssetId);
      if (!asset) return 'Bilinmiyor';
      const aptName = asset.apartmentName || asset.apartment_name;
      return aptName ? `${aptName} (${asset.name})` : asset.name;
  };

  const finalAssetName = getFullAssetName();

  const handleSubmit = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const companySlug = data?.slug || data?.company_slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';
      const secureToken = getAuthToken(); 
      
      if (!secureToken) {
          throw new Error('Sisteme giriş yapılmamış. Oturum süreniz dolmuş olabilir.');
      }

      const customerSignBase64 = signMode === 'field' ? (customerCanvasRef.current?.toDataURL('image/png') || null) : null;
      const employerSignBase64 = employerCanvasRef.current?.toDataURL('image/png') || null;
      
      const res = await fetch(`${API_URL}/add-quote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secureToken}` 
        },
        body: JSON.stringify({
          slug: companySlug,
          company_slug: companySlug,
          quote_type: quoteType,
          is_new_customer: newCustomerMode,
          customer_id: newCustomerMode ? null : selectedCustomerId,
          customer_name: customerName,
          customer_phone: customerPhone,
          is_new_asset: newAssetMode,
          asset_id: newAssetMode ? null : selectedAssetId,
          asset_name: finalAssetName, 
          status: signMode === 'office' ? 'Bekliyor' : 'Müşteri Onayladı', // 🚀 AKILLI STATÜ
          quote_details: {
             revisionDetails,
             elevatorType,
             stopsCount,
             capacity,
             maintenanceContract,
             customerSignature: customerSignBase64,
             employerSignature: employerSignBase64 
          }
        })
      });
      
      const r = await res.json();
      if(!r.success) throw new Error(r.error || 'Bilinmeyen Hata');
      
      setStatus('success');
    } catch(e: any) {
      setErrorMessage(e.message || 'Yetkisiz erişim veya bağlantı sorunu.');
      setStatus('idle');
    }
  };

  const isCustomerValid = newCustomerMode ? !!customerName.trim() : !!selectedCustomerId;
  const isAssetValid = newAssetMode ? !!newAssetName.trim() : !!selectedAssetId;
  
  // 🚀 YENİ VALIDASYON: Sadece seçili moda göre imza kontrolü
  const isSignValid = signMode === 'field' ? (employerSignature && customerSignature) : employerSignature;
  const canSubmit = isCustomerValid && isAssetValid && isSignValid;

  const handleNextFromStep1 = () => { if (!isCustomerValid || !isAssetValid) return; setStep(2); };
  const handleNextFromStep2 = () => { setStep(3); };
  const handleNextFromStep3 = () => { setStep(4); };
  const handleSubmitClick = async () => { if (!canSubmit) return; await handleSubmit(); };

  const initCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>, setHasSignature: (v: boolean) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    
    let isDrawing = false;
    
    const startDrawing = (e: MouseEvent | TouchEvent) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      ctx.beginPath();
      ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      ctx.lineTo(clientX - rect.left, clientY - rect.top);
      ctx.stroke();
      setHasSignature(true);
    };

    const stopDrawing = () => { isDrawing = false; };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  };

  useEffect(() => {
    if (showQuoteModal && step === 4) {
      const timeout = setTimeout(() => {
        initCanvas(employerCanvasRef, setEmployerSignature);
        if (signMode === 'field') {
            initCanvas(customerCanvasRef, setCustomerSignature);
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [showQuoteModal, step, signMode]);

  const clearCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>, setHasSignature: (v: boolean) => void) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  return (
    <AnimatePresence>
      {showQuoteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={handleClose}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* 🚀 YENİ: Hata Balonu (Alert Yerine) */}
            <AnimatePresence>
                {errorMessage && (
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="absolute top-4 left-4 right-4 bg-rose-100 border border-rose-200 text-rose-700 p-3 rounded-xl z-50 flex justify-between items-center shadow-lg">
                        <div className="text-xs font-bold flex items-center gap-2"><AlertTriangle size={16}/> {errorMessage}</div>
                        <button onClick={() => setErrorMessage('')}><X size={16}/></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-base sm:text-lg tracking-tight">Yeni Teklif & Sözleşme</h2>
                  <p className="text-slate-500 text-[11px] sm:text-xs font-semibold">
                    {step === 1 ? 'Adım 1: Müşteri ve Varlık Seçimi' : step === 2 ? 'Adım 2: Teklif Türü' : step === 3 ? 'Adım 3: Detaylar' : 'Adım 4: İmzalar ve Onay'}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 relative">
              {status === "success" ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={40} />
                  </motion.div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Başarıyla Oluşturuldu!</h3>
                  <p className="text-slate-500 font-medium mb-6">Teklifiniz sisteme kaydedildi ve listeye eklendi.</p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-sm mx-auto mt-3">
                    <button onClick={() => { setShowQuoteModal(false); if (setActiveTab) setActiveTab('quotes'); else window.location.hash = 'quotes'; }} className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">Listeye Dön</button>
                  </div>
                </div>
              ) : (
                <>
                  {step === 1 && (
                    <div className="space-y-6">
                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><User size={14}/> Müşteri / Firma</label>
                            <div className="flex bg-slate-200/50 p-1 rounded-xl mb-2">
                              <button onClick={() => {setNewCustomerMode(false); setSelectedCustomerId('');}} className={"flex-1 py-2 text-xs font-bold rounded-lg transition-all " + (!newCustomerMode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Kayıtlılardan Seç</button>
                               <button onClick={() => {setNewCustomerMode(true); setSelectedCustomerId('');}} className={"flex-1 py-2 text-xs font-bold rounded-lg transition-all " + (newCustomerMode ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>+ Yeni Müşteri</button>
                            </div>
                            {!newCustomerMode ? (
                              <div className="space-y-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                  <input type="text" placeholder="Müşteri Ara..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} />
                                </div>
                                <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                  <div className="max-h-48 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">
                                    {(data?.customers || []).filter((c: any) => {
                                        const term = (searchCustomer || '').toLowerCase();
                                        return (c.name || '').toLowerCase().includes(term) || (c.contact || c.phone || '').toLowerCase().includes(term);
                                    }).map((c: any) => {
                                        const isSelected = selectedCustomerId === String(c.id);
                                        return (
                                            <button 
                                                key={c.id} 
                                                onClick={() => { setSelectedCustomerId(String(c.id)); setCustomerName(c.name || ''); setCustomerPhone(c.contact || c.phone || ''); setSearchCustomer(c.name || ''); }}
                                                className={"text-left p-2.5 rounded-lg border transition-all " + (isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-transparent hover:bg-slate-50")}
                                            >
                                                <div className="font-bold text-sm text-slate-800">{c.name}</div>
                                                {(c.contact || c.phone) && <div className="text-[11px] text-slate-500">{c.contact || c.phone}</div>}
                                            </button>
                                        )
                                    })}
                                    {(data?.customers || []).length === 0 && (
                                      <div className="p-3 text-center text-xs text-slate-500">Sistemde müşteri yok. Yeni eklemeyi seçin.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Müşteri Adı *</label>
                                    <input required type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Örn: X Apartmanı veya Y Firması" className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Telefon Numarası</label>
                                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="05XX XXX XX XX" className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                                  </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Box size={14}/> Sistem / Varlık (Asansör)</label>
                            <div className="flex bg-slate-200/50 p-1 rounded-xl mb-2">
                              <button onClick={() => {setNewAssetMode(false); setSelectedAssetId('');}} className={"flex-1 py-2 text-xs font-bold rounded-lg transition-all " + (!newAssetMode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Kayıtlılardan Seç</button>
                               <button onClick={() => {setNewAssetMode(true); setSelectedAssetId('');}} className={"flex-1 py-2 text-xs font-bold rounded-lg transition-all " + (newAssetMode ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>+ Yeni Varlık</button>
                            </div>
                            {!newAssetMode ? (
                              <div className="space-y-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                  <input type="text" placeholder="Asansör veya Bina Adı Ara..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" value={searchAsset} onChange={e => setSearchAsset(e.target.value)} />
                                </div>
                                <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                  <div className="max-h-48 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">
                                    {(data?.assets || []).filter((a: any) => {
                                        if (!newCustomerMode && selectedCustomerId && String(a.customer_id) !== selectedCustomerId) return false;
                                        const term = (searchAsset || '').toLowerCase();
                                        return (a.name || '').toLowerCase().includes(term) || (a.apartmentName || '').toLowerCase().includes(term);
                                    }).map((a: any) => {
                                        const aptName = a.apartmentName || a.apartment_name || '';
                                        const isSelected = selectedAssetId === String(a.id);
                                        return (
                                            <button 
                                                key={a.id} type="button" onClick={() => setSelectedAssetId(String(a.id))}
                                                className={`text-left p-2.5 rounded-lg transition-all flex flex-col gap-0.5 border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                            >
                                                <div className={`text-sm ${isSelected ? 'text-blue-800 font-bold' : 'text-slate-800 font-bold'}`}>{aptName ? `${aptName} (${a.name})` : a.name}</div>
                                                {aptName && <div className={`text-[11px] ${isSelected ? 'text-blue-600 font-semibold' : 'text-slate-500 font-medium'}`}>{a.name}</div>}
                                            </button>
                                        )
                                    })}
                                    {(data?.assets || []).filter((a: any) => (!newCustomerMode && selectedCustomerId) ? String(a.customer_id) === selectedCustomerId : true).length === 0 && (
                                      <div className="p-3 text-center text-xs text-slate-500">Uygun varlık yok. Yeni eklemeyi seçin.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Yeni Asansör Adı / Bilgisi *</label>
                                  <input required type="text" value={newAssetName} onChange={e => setNewAssetName(e.target.value)} placeholder="Örn: A Blok Sağ Asansör" className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                                </div>
                            )}
                        </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1 mb-2">Hangi tür teklif oluşturacaksınız?</label>
                      <div className="grid grid-cols-1 gap-3">
                        {["Bakım Sözleşmesi", "Revizyon Teklifi", "Montaj Teklifi"].map(type => (
                          <button 
                            key={type} onClick={() => setQuoteType(type)}
                            className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${quoteType === type ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex shrink-0 items-center justify-center ${quoteType === type ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                              {quoteType === type && <div className="w-2 h-2 m-auto bg-white rounded-full"></div>}
                            </div>
                            <div>
                              <div className={`font-bold text-base ${quoteType === type ? 'text-blue-900' : 'text-slate-700'}`}>{type}</div>
                              <div className="text-xs text-slate-500 font-medium mt-1">
                                {type === 'Bakım Sözleşmesi' ? 'Aylık periyodik bakım anlaşması metni hazırlayın.' : type === 'Revizyon Teklifi' ? 'Mevcut bir asansör için yenileme/tamirat teklifi.' : 'Sıfırdan kurulacak yeni bir sistem için montaj teklifi.'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      {quoteType === 'Bakım Sözleşmesi' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex justify-between items-center">
                            Sözleşme İçeriği (Düzenlenebilir)
                          </label>
                          <textarea 
                            rows={12} value={maintenanceContract} onChange={(e) => handleSaveContractTemplate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none custom-scrollbar leading-relaxed"
                            placeholder="Sözleşme detaylarını buraya yazın..."
                          />
                        </div>
                      )}
                      {quoteType === 'Revizyon Teklifi' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Yapılacak İşlerin Detayları</label>
                          <textarea 
                            rows={8} value={revisionDetails} onChange={e => setRevisionDetails(e.target.value)} 
                            placeholder="Örn: Motor değişimi, kabin revizyonu kalemleri vb..." 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none custom-scrollbar" 
                          />
                        </div>
                      )}
                      {quoteType === 'Montaj Teklifi' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asansör Tipi</label>
                            <input type="text" value={elevatorType} onChange={e => setElevatorType(e.target.value)} placeholder="Örn: İnsan Asansörü" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Durak Sayısı</label>
                            <input type="number" value={stopsCount} onChange={e => setStopsCount(e.target.value)} placeholder="Örn: 5" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kapasite</label>
                            <input type="text" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Örn: 800kg" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-6">
                      {/* 🚀 YENİ: SAHA VEYA OFİS (UZAKTAN İMZA) SEÇİMİ */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3 text-center">İmza Yöntemini Seçin</label>
                          <div className="flex bg-slate-200/50 p-1 rounded-xl">
                              <button onClick={() => setSignMode('field')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${signMode === 'field' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sahadayım</button>
                              <button onClick={() => setSignMode('office')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${signMode === 'office' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Ofisteyim (Uzaktan)</button>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Yetkili (Firma) İmzası</label>
                                {employerSignature && <button onClick={() => clearCanvas(employerCanvasRef, setEmployerSignature)} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-rose-500 font-bold uppercase transition-colors"><RotateCcw size={12}/> Temizle</button>}
                            </div>
                            <div className={`border-2 border-dashed bg-slate-50 rounded-2xl overflow-hidden touch-none relative ${employerSignature ? 'border-blue-300' : 'border-slate-200'}`}>
                              <canvas ref={employerCanvasRef} className="w-full h-[120px] cursor-crosshair touch-none block" />
                              {!employerSignature && <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 font-bold opacity-50">Buraya imzalayın</div>}
                            </div>
                          </div>

                          {signMode === 'field' ? (
                              <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Müşteri İmzası</label>
                                    {customerSignature && <button onClick={() => clearCanvas(customerCanvasRef, setCustomerSignature)} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-rose-500 font-bold uppercase transition-colors"><RotateCcw size={12}/> Temizle</button>}
                                </div>
                                <div className={`border-2 border-dashed bg-slate-50 rounded-2xl overflow-hidden touch-none relative ${customerSignature ? 'border-emerald-300' : 'border-slate-200'}`}>
                                  <canvas ref={customerCanvasRef} className="w-full h-[120px] cursor-crosshair touch-none block" />
                                  {!customerSignature && <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 font-bold opacity-50">Buraya imzalayın</div>}
                                </div>
                              </motion.div>
                          ) : (
                              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
                                  <MessageCircle className="text-blue-500 mb-2" size={32} />
                                  <h4 className="text-blue-800 font-bold text-sm mb-1">Uzaktan İmza Modu Devrede</h4>
                                  <p className="text-blue-600/80 text-xs font-medium px-4">Teklifi kaydettikten sonra müşteriye WhatsApp üzerinden özel bir imza linki gönderebileceksiniz.</p>
                              </motion.div>
                          )}
                      </div>
                    </div>
                  )}

                </>
              )}
            </div>

            {status !== 'success' && (
              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                {step === 1 ? (
                  <button onClick={handleNextFromStep1} disabled={!isCustomerValid || !isAssetValid} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95">
                    Teklif Türü Seçimine Geç <ArrowRight size={18} />
                  </button>
                ) : step === 2 ? (
                  <div className="flex gap-2">
                      <button onClick={() => setStep(1)} className="p-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all"><ArrowRight size={18} className="rotate-180" /></button>
                      <button onClick={handleNextFromStep2} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95">
                        İçerik Girmeye Geç <ArrowRight size={18} />
                      </button>
                  </div>
                ) : step === 3 ? (
                  <div className="flex gap-2">
                      <button onClick={() => setStep(2)} className="p-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all"><ArrowRight size={18} className="rotate-180" /></button>
                      <button onClick={handleNextFromStep3} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95">
                        İmza ve Onay Aşaması <ArrowRight size={18} />
                      </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                      <button onClick={() => setStep(3)} className="p-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all"><ArrowRight size={18} className="rotate-180" /></button>
                      <button onClick={handleSubmitClick} disabled={status === 'loading' || !canSubmit} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95">
                        {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> {signMode === 'office' ? 'Kaydet ve Link Gönder' : 'Onayla ve Kaydet'}</>}
                      </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}