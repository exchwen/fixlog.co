"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ArrowRight, Loader2, CheckCircle, Search, FileText, Download, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';

export default function QuoteModal({ showQuoteModal, setShowQuoteModal, data, setActiveTab }: any) {
  const [step, setStep] = useState(1);
  const [quoteType, setQuoteType] = useState('Bakım Sözleşmesi');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Teklif_Sozlesme",
  });

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [maintenanceContract, setMaintenanceContract] = useState('');
  
  const [searchAsset, setSearchAsset] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [newAssetMode, setNewAssetMode] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
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
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';
      const slug = window.location.pathname.split('/')[1];
      await fetch(`${API_URL}/update-maintenance-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slug, template: val })
      });
    } catch(e) { console.error('Sozlesme kaydedilemedi', e); }
  };

  const resetForm = () => {
    setStep(1);
    setQuoteType('Bakım Sözleşmesi');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setSearchAsset('');
    setSelectedAssetId('');
    setNewAssetMode(false);
    setNewAssetName('');
    setStatus('idle');
    setEmployerSignature(false);
    setCustomerSignature(false);
  };

  const handleClose = () => {
    setShowQuoteModal(false);
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async () => {
    setStatus('loading');
    try {
      const companySlug = data?.slug || data?.company_slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '');
      const assetName = newAssetMode ? newAssetName : (data?.assets?.find((a: any) => a.id.toString() === selectedAssetId)?.name || 'Bilinmiyor');
      
      await fetch('/add-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_slug: companySlug,
          quote_type: quoteType,
          customer_name: customerName,
          customer_phone: customerPhone,
          asset_name: assetName,
          quote_details: {
             revisionDetails,
             elevatorType,
             stopsCount,
             capacity
          }
        })
      });
      setStatus('success');
    } catch(e) {
      alert("Hata oluştu");
      setStatus('idle');
    }
  };

  const initCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>, setHasSignature: (v: boolean) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
    if (showQuoteModal && step === 3) {
      const clean1 = initCanvas(employerCanvasRef, setEmployerSignature);
      const clean2 = initCanvas(customerCanvasRef, setCustomerSignature);
      return () => { if(clean1) clean1(); if(clean2) clean2(); };
    }
  }, [showQuoteModal, step]);

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
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-base sm:text-lg tracking-tight">Yeni Teklif & Sözleşme</h2>
                  <p className="text-slate-500 text-[11px] sm:text-xs font-semibold">Müşteriye teklif hazırlayın ve yazdırın</p>
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
                  <p className="text-slate-500 font-medium mb-6">Teklifiniz sisteme kaydedildi ve işleme alındı.</p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-sm mx-auto">
                     <button onClick={handlePrint} className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"><Download size={16}/> PDF Olarak İndir</button>
                     <button onClick={handlePrint} className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"><FileText size={16}/> Termal Fiş Yazdır</button>
                  </div>
<div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-sm mx-auto mt-3">
  <button onClick={() => { setShowQuoteModal(false); if (setActiveTab) setActiveTab('quotes'); else window.location.hash = 'quotes'; }} className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">S�zle�melere Git</button>
</div>
</div>
) : (
                <>
                  {step === 1 && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Müşteri Seçimi</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                              <button onClick={() => {setNewCustomerMode(false); setSelectedCustomerId('');}} className={"flex-1 py-2 text-xs font-bold rounded-lg transition-all " + (!newCustomerMode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Sistemde Var Olanı Seç</button>
                               <button onClick={() => {setNewCustomerMode(true); setSelectedCustomerId('');}} className={"flex-1 py-2 text-xs font-bold rounded-lg transition-all " + (newCustomerMode ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>+ Yeni Müşteri Ekle</button>
                            </div>

                            {!newCustomerMode ? (
                              <div className="space-y-3">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                  <input type="text" placeholder="Müşteri Ara..." className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} />
                                </div>
                                <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                  <div className="max-h-48 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">
                                    {(data?.customers || []).filter((c: any) => {
                                        const term = (searchCustomer || '').toLowerCase();
                                        return (c.name || '').toLowerCase().includes(term);
                                    }).map((c: any) => {
                                        const isSelected = selectedCustomerId === String(c.id);
                                        return (
                                            <button 
                                                key={c.id} 
                                                onClick={() => { setSelectedCustomerId(String(c.id)); setCustomerName(c.name || ''); setCustomerPhone(c.phone || ''); }}
                                                className={"text-left p-3 rounded-lg border transition-all " + (isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100 hover:border-blue-200")}
                                            >
                                                <div className="font-bold text-sm text-slate-800">{c.name}</div>
                                                {c.phone && <div className="text-xs text-slate-500 mt-0.5">{c.phone}</div>}
                                            </button>
                                        )
                                    })}
                                    {(data?.customers || []).length === 0 && (
                                      <div className="p-4 text-center text-xs text-slate-500">Sistemde kayıtlı müşteri yok. Yeni eklemeyi seçin.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                                <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Yeni Müşteri Adı *</label>
                                    <input required type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Örn: X Apartmanı veya Y Firması" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Telefon Numarası</label>
                                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="05XX XXX XX XX" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                                  </div>
                                </div>
                            )}
                        </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1 mb-2">Teklif Türü</label>
                        <div className="grid grid-cols-1 gap-2">
                          {["Bakım Sözleşmesi", "Revizyon Teklifi", "Montaj Teklifi"].map(type => (
                            <button 
                              key={type} 
                              onClick={() => setQuoteType(type)}
                              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${quoteType === type ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex shrink-0 items-center justify-center ${quoteType === type ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                                {quoteType === type && <div className="w-2 h-2 m-auto bg-white rounded-full"></div>}
                              </div>
                              <div>
                                <div className={`font-bold ${quoteType === type ? 'text-blue-900' : 'text-slate-700'}`}>{type}</div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">
                                  {type === 'Bakım Sözleşmesi' ? 'Periyodik bakım anlaşması oluşturun.' : type === 'Revizyon Teklifi' ? 'Mevcut bir asansör için yenileme teklifi.' : 'Sıfırdan kurulacak yeni bir sistem teklifi.'}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      {quoteType === 'Bakım Sözleşmesi' ? (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block flex justify-between items-center">
                            Sözleşme İçeriği
                          </label>
                          <textarea 
                            rows={12}
                            value={maintenanceContract}
                            onChange={(e) => handleSaveContractTemplate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none custom-scrollbar leading-relaxed"
                            placeholder="Sözleşme detaylarını buraya yazın..."
                          />
                          <p className="text-xs text-slate-400">Bu alanda yapacağınız değişiklikler firmanız için D1 veritabanına kaydedilir ve diğer tüm cihazlardan erişilebilir.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Sistem Seçimi (Asansör / Varlık)</label>
                          
                          <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                             <button onClick={() => {setNewAssetMode(false); setSelectedAssetId('');}} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!newAssetMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sistemde Var Olanı Seç</button>
                             <button onClick={() => {setNewAssetMode(true); setSelectedAssetId('');}} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newAssetMode ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>+ Yeni Asansör Ekle</button>
                          </div>

                          {!newAssetMode ? (
                            <div className="space-y-3">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Asansör veya Bina Adı Ara..." className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" value={searchAsset} onChange={e => setSearchAsset(e.target.value)} />
                              </div>
                              <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">
                                  {(data?.assets || []).filter((a: any) => {
                                      const term = (searchAsset || '').toLowerCase();
                                      return (a.name || '').toLowerCase().includes(term) || (a.apartmentName || '').toLowerCase().includes(term);
                                  }).map((a: any) => {
                                      const aptName = a.apartmentName || a.apartment_name || '';
                                      const isSelected = selectedAssetId === String(a.id);
                                      return (
                                          <button 
                                              key={a.id} 
                                              type="button"
                                              onClick={() => setSelectedAssetId(String(a.id))}
                                              className={`text-left px-4 py-3 rounded-xl transition-all flex flex-col gap-1 border-2 ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                                          >
                                              <div className={`text-sm ${isSelected ? 'text-blue-800 font-bold' : 'text-slate-800 font-bold'}`}>{aptName || a.name}</div>
                                              {aptName && <div className={`text-[11px] ${isSelected ? 'text-blue-600 font-semibold' : 'text-slate-500 font-medium'}`}>{a.name}</div>}
                                          </button>
                                      )
                                  })}
                                  {(data?.assets || []).length === 0 && (
                                    <div className="p-4 text-center text-xs text-slate-500">Sistemde kayıtlı asansör yok. Yeni eklemeyi seçin.</div>
                                  )}
                                </div>
                              </div>
<div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-sm mx-auto mt-3">
  <button onClick={() => { setShowQuoteModal(false); if (setActiveTab) setActiveTab('quotes'); else window.location.hash = 'quotes'; }} className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">S�zle�melere Git</button>
</div>
</div>
) : (
                            <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Yeni Asansör Adı / Bilgisi</label>
                                <input required type="text" value={newAssetName} onChange={e => setNewAssetName(e.target.value)} placeholder="Örn: A Blok Sağ Asansör" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                              </div>
                              {quoteType === 'Revizyon Teklifi' && (
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Yapılacak İşlerin Detayları</label>
                                  <textarea rows={3} value={revisionDetails} onChange={e => setRevisionDetails(e.target.value)} placeholder="Örn: Motor değişimi, kabin revizyonu..." className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm resize-none custom-scrollbar" />
                                </div>
                              )}
                              {quoteType === 'Montaj Teklifi' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Asansör Tipi</label>
                                    <input type="text" value={elevatorType} onChange={e => setElevatorType(e.target.value)} placeholder="Örn: İnsan" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Durak Sayısı</label>
                                    <input type="number" value={stopsCount} onChange={e => setStopsCount(e.target.value)} placeholder="Örn: 5" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Kapasite</label>
                                    <input type="text" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Örn: 800kg" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 text-sm font-medium">
                        Lütfen sözleşmeyi onaylamak için imzaları atınız.
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Yetkili (Firma) İmzası</label>
                            {employerSignature && <button onClick={() => clearCanvas(employerCanvasRef, setEmployerSignature)} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-rose-500 font-bold uppercase transition-colors"><RotateCcw size={12}/> Temizle</button>}
                        </div>
                        <div className={`border-2 border-dashed bg-slate-50 rounded-2xl overflow-hidden touch-none relative ${employerSignature ? 'border-blue-300' : 'border-slate-200'}`}>
                          <canvas ref={employerCanvasRef} width={450} height={120} className="w-full h-[120px] cursor-crosshair touch-none" />
                          {!employerSignature && <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 font-bold opacity-50">Buraya imzalayın</div>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Müşteri İmzası</label>
                            {customerSignature && <button onClick={() => clearCanvas(customerCanvasRef, setCustomerSignature)} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-rose-500 font-bold uppercase transition-colors"><RotateCcw size={12}/> Temizle</button>}
                        </div>
                        <div className={`border-2 border-dashed bg-slate-50 rounded-2xl overflow-hidden touch-none relative ${customerSignature ? 'border-emerald-300' : 'border-slate-200'}`}>
                          <canvas ref={customerCanvasRef} width={450} height={120} className="w-full h-[120px] cursor-crosshair touch-none" />
                          {!customerSignature && <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 font-bold opacity-50">Buraya imzalayın</div>}
                        </div>
                      </div>
                    </div>
                  )}

                </>
              )}
            </div>

            {status !== 'success' && (
              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                {step === 1 ? (
                  <button 
                    onClick={() => setStep(2)} 
                    disabled={!customerName.trim()}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                  >
                    Devam Et <ArrowRight size={18} />
                  </button>
                ) : step === 2 ? (
                  <div className="flex gap-2">
                      <button onClick={() => setStep(1)} className="p-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
                        <ArrowRight size={18} className="rotate-180" />
                      </button>
                      <button 
                        onClick={() => setStep(3)} 
                        disabled={quoteType !== 'Bakım Sözleşmesi' && !selectedAssetId && !newAssetName.trim()}
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                      >
                        İmza Aşamasına Geç <ArrowRight size={18} />
                      </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                      <button onClick={() => setStep(2)} className="p-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
                        <ArrowRight size={18} className="rotate-180" />
                      </button>
                      <button 
                        onClick={handleSubmit} 
                        disabled={status === 'loading' || !employerSignature || !customerSignature}
                        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                      >
                        {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Onayla ve Kaydet</>}
                      </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    
      <div style={{ display: "none" }}>
        <div ref={printRef} className="p-8 bg-white text-black max-w-2xl mx-auto font-sans">
          <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-black">{data?.settings?.company_name || 'Firma Adı'}</h1>
              <p className="text-sm font-medium mt-1">{quoteType}</p>
            </div>
            <div className="text-right text-sm">
              <p><strong>Tarih:</strong> {new Date().toLocaleDateString('tr-TR')}</p>
            </div>
          </div>
          
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-bold border-b border-black/20 mb-2 pb-1">Müşteri Bilgileri</h3>
              <p><strong>İsim:</strong> {customerName}</p>
              <p><strong>Telefon:</strong> {customerPhone}</p>
              {customerEmail && <p><strong>E-posta:</strong> {customerEmail}</p>}
            </div>
            <div>
              <h3 className="font-bold border-b border-black/20 mb-2 pb-1">Sistem Bilgileri</h3>
              <p><strong>Sistem Adı:</strong> {newAssetMode ? newAssetName : (data?.assets?.find((a: any) => a.id.toString() === selectedAssetId)?.name || 'Bilinmiyor')}</p>
              {quoteType === 'Revizyon Teklifi' && <p><strong>Detay:</strong> {revisionDetails}</p>}
              {quoteType === 'Montaj Teklifi' && (
                <>
                  <p><strong>Tipi:</strong> {elevatorType}</p>
                  <p><strong>Durak:</strong> {stopsCount}</p>
                  <p><strong>Kapasite:</strong> {capacity}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="font-bold border-b border-black/20 mb-2 pb-1">Sözleşme / Teklif Detayı</h3>
            <div className="text-sm whitespace-pre-wrap">{maintenanceContract}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-black text-center">
            <div>
              <p className="font-bold mb-16">Yetkili (Firma) İmzası</p>
              {employerCanvasRef.current && <img src={employerCanvasRef.current.toDataURL()} className="mx-auto h-20 object-contain mix-blend-multiply grayscale" />}
            </div>
            <div>
              <p className="font-bold mb-16">Müşteri İmzası</p>
              <p className="font-bold mb-2">{customerName}</p>
              {customerCanvasRef.current && <img src={customerCanvasRef.current.toDataURL()} className="mx-auto h-20 object-contain mix-blend-multiply grayscale" />}
            </div>
          </div>
        </div>
      </div>

    </AnimatePresence>
  );
}

