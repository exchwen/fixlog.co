'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, FileText, X, Send, User, Box, ShieldCheck, AlertCircle, RotateCcw, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print'; // 🚀 YENİ: Müşterinin PDF indirebilmesi için eklendi

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';

export default function CustomerQuotePage() {
    const { token } = useParams(); 
    const [loading, setLoading] = useState(true);
    const [quoteData, setQuoteData] = useState<any>(null);
    const [companyData, setCompanyData] = useState<any>(null);
    const [error, setError] = useState('');
    
    // İmza State'leri
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // 🚀 YENİ: PDF Yazdırma/İndirme Referansı
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: quoteData ? `${companyData?.company_name || 'Firma'}_Sozlesme_Kopyasi` : "Sozlesme",
    });

    // Veriyi Çekme
    useEffect(() => {
        if (!token) return;

        const fetchQuote = async () => {
            try {
                const res = await fetch(`${API_URL}/public/get-quote?token=${token}`);
                const r = await res.json();
                
                if (!res.ok || !r.success) {
                    throw new Error(r.error || 'Teklif bulunamadı veya süresi dolmuş.');
                }

                let parsedDetails: any = {};
                try {
                    parsedDetails = typeof r.data.quote_details === 'string' ? JSON.parse(r.data.quote_details) : r.data.quote_details;
                } catch(e) {}

                setQuoteData({ ...r.data, parsedDetails });
                setCompanyData(r.company);
                
                if (parsedDetails.customerSignature) {
                    setSignatureImage(parsedDetails.customerSignature);
                }

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQuote();
    }, [token]);

    const initCanvas = () => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a'; 
    };

    useEffect(() => {
        if (!loading && quoteData && !signatureImage) {
            setTimeout(initCanvas, 100);
        }
    }, [loading, quoteData, signatureImage]);

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
        if (signatureImage) return; 
        setIsDrawing(true);
        const coords = getCoordinates(e);
        const ctx = signatureCanvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
        }
    };

    const draw = (e: any) => {
        if (!isDrawing || signatureImage) return;
        e.preventDefault(); 
        const coords = getCoordinates(e);
        const ctx = signatureCanvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
        }
    };

    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = signatureCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleSignQuote = async () => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;

        const isCanvasBlank = () => {
            const blank = document.createElement('canvas');
            blank.width = canvas.width;
            blank.height = canvas.height;
            return canvas.toDataURL() === blank.toDataURL();
        };

        if (isCanvasBlank()) {
            alert('Lütfen kutucuğun içerisine imzanızı atın.');
            return;
        }

        const base64Img = canvas.toDataURL('image/png');
        setStatus('loading');

        try {
            const res = await fetch(`${API_URL}/public/sign-quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, signatureBase64: base64Img })
            });

            const r = await res.json();
            if (!r.success) throw new Error('Onaylanırken hata oluştu.');

            setSignatureImage(base64Img); 
            setStatus('success');
            
        } catch (e: any) {
            alert('Bağlantı hatası: ' + e.message);
            setStatus('idle');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin text-blue-600 w-12 h-12 mb-4" />
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-sm">Belge Yükleniyor...</span>
                </div>
            </div>
        );
    }

    if (error || !quoteData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-200">
                    <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <X size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Erişim Hatası</h2>
                    <p className="text-slate-600 font-medium mb-6">{error || 'Bu belgeye ulaşılamıyor.'}</p>
                    <div className="text-xs text-slate-400">Belge silinmiş veya geçerlilik süresi dolmuş olabilir.</div>
                </div>
            </div>
        );
    }

    const { parsedDetails } = quoteData;
    const isAlreadySigned = !!parsedDetails.customerSignature || status === 'success';

    const renderAssetName = (fullName: string) => {
        if (!fullName) return { apt: '', dev: 'Bilinmeyen Varlık' };
        if (fullName.includes('|')) {
            const parts = fullName.split('|');
            return { apt: parts[0].trim(), dev: parts[1].trim() };
        }
        return { apt: '', dev: fullName };
    };

    const splitAsset = renderAssetName(quoteData.asset_name);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 font-sans pb-12">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {companyData?.logo ? (
                            <img src={companyData.logo} alt="Logo" className="w-12 h-12 object-contain rounded-lg border border-slate-100" />
                        ) : (
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black text-xl">
                                {companyData?.company_name?.charAt(0) || 'F'}
                            </div>
                        )}
                        <div>
                            <h1 className="font-black text-slate-800 leading-tight">{companyData?.company_name || 'Firma Adı'}</h1>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{quoteData.quote_type}</p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-slate-500">Tarih</div>
                        <div className="text-sm font-black text-slate-800">{new Date(quoteData.created_at).toLocaleDateString('tr-TR')}</div>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
                
                <AnimatePresence>
                    {isAlreadySigned && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full shrink-0">
                                    <CheckCircle size={28} />
                                </div>
                                <div>
                                    <h3 className="text-emerald-800 font-black text-lg">Belge Onaylandı</h3>
                                    <p className="text-emerald-700/80 font-medium text-sm mt-0.5">İmzanız başarıyla alındı. Sözleşmenizin bir kopyasını indirebilirsiniz.</p>
                                </div>
                            </div>
                            {/* 🚀 YENİ: Müşteri için indirme butonu eklendi */}
                            <button 
                                onClick={handlePrint} 
                                className="w-full sm:w-auto bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold px-4 py-3 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
                            >
                                <Download size={18} /> PDF İndir
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl shrink-0"><User size={20}/></div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Müşteri Bilgileri</div>
                            <div className="font-black text-slate-800 text-base truncate">{quoteData.customer_name}</div>
                            {quoteData.customer_phone && <div className="text-sm font-medium text-slate-500 mt-0.5">{quoteData.customer_phone}</div>}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                        <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl shrink-0"><Box size={20}/></div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Varlık (Sistem)</div>
                            <div className="font-black text-slate-800 text-base truncate">{splitAsset.apt || splitAsset.dev}</div>
                            {splitAsset.apt && <div className="text-sm font-medium text-slate-500 mt-0.5 truncate">{splitAsset.dev}</div>}
                        </div>
                    </div>
                </div>

                {quoteData.quote_type !== 'Bakım Sözleşmesi' && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner">
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><FileText size={14}/> Teknik Detaylar</h3>
                        {quoteData.quote_type === 'Montaj Teklifi' ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div><div className="text-xs text-slate-500">Tipi</div><div className="font-bold text-slate-800">{parsedDetails.elevatorType || '-'}</div></div>
                                <div><div className="text-xs text-slate-500">Durak Sayısı</div><div className="font-bold text-slate-800">{parsedDetails.stopsCount || '-'}</div></div>
                                <div><div className="text-xs text-slate-500">Kapasite</div><div className="font-bold text-slate-800">{parsedDetails.capacity || '-'}</div></div>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-800 font-semibold whitespace-pre-wrap">{parsedDetails.revisionDetails || 'Detay bulunamadı.'}</div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                        <ShieldCheck className="text-blue-600" size={20} />
                        <h3 className="font-black text-slate-800">Sözleşme Metni</h3>
                    </div>
                    <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar">
                        <div className="text-sm font-medium text-slate-700 leading-loose whitespace-pre-wrap">
                            {quoteData.quote_type === 'Bakım Sözleşmesi' 
                                ? parsedDetails.maintenanceContract 
                                : 'Yukarıda belirtilen hususlar ve ekte sunulan proje detayları doğrultusunda hizmet verilecektir. İşbu teklif her iki tarafın onayıyla resmi sözleşme niteliği taşır.'}
                        </div>
                    </div>
                </div>

                {parsedDetails.employerSignature && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Yetkili (Firma) İmzası</div>
                        <img src={parsedDetails.employerSignature} alt="Firma İmzası" className="h-20 object-contain mix-blend-multiply opacity-80" />
                        <div className="mt-4 pt-4 border-t border-slate-100 w-full text-xs font-bold text-slate-500">{companyData?.company_name} Tarafından Onaylandı</div>
                    </div>
                )}

                <div className={`rounded-2xl border-2 shadow-lg overflow-hidden transition-all duration-500 ${isAlreadySigned ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-blue-200'}`}>
                    <div className={`px-5 py-4 border-b flex justify-between items-center ${isAlreadySigned ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                        <div className="flex items-center gap-2 font-black">
                            <FileText size={20} />
                            Müşteri Onayı
                        </div>
                        {!isAlreadySigned && (
                            <button onClick={clearSignature} className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-50 active:scale-95 flex items-center gap-1">
                                <RotateCcw size={12} /> Temizle
                            </button>
                        )}
                    </div>
                    
                    <div className="p-6">
                        {isAlreadySigned ? (
                            <div className="flex flex-col items-center justify-center">
                                <img src={signatureImage!} alt="Müşteri İmzası" className="h-24 object-contain mix-blend-multiply" />
                                <div className="mt-4 flex items-center gap-2 text-sm font-black text-emerald-600 bg-emerald-100 px-4 py-2 rounded-xl">
                                    <CheckCircle size={18} /> Elektronik Olarak İmzalandı
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-amber-50 text-amber-700 text-xs font-bold p-3 rounded-xl flex items-start gap-2 border border-amber-200">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    Aşağıdaki alana parmağınızla veya fareyle imzanızı atarak sözleşmeyi onaylayabilirsiniz.
                                </div>
                                <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 h-[200px] relative overflow-hidden touch-none">
                                    <canvas 
                                        ref={signatureCanvasRef} 
                                        className="w-full h-full cursor-crosshair touch-none relative z-10"
                                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={endDrawing} onMouseLeave={endDrawing}
                                        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={endDrawing} onTouchCancel={endDrawing}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                        <span className="text-slate-300 font-black text-2xl opacity-50 select-none">Buraya İmzalayın</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSignQuote} 
                                    disabled={status === 'loading'}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-base py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {status === 'loading' ? <Loader2 className="animate-spin" size={24} /> : <><Send size={20} /> Sözleşmeyi Onayla ve Gönder</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* 🚀 GİZLİ YAZDIRMA ŞABLONU (Müşteri için PDF çıktısı) */}
            <div style={{ display: "none" }}>
                {quoteData && (
                <div 
                    ref={printRef} 
                    className="p-10 bg-white max-w-3xl mx-auto font-serif text-black"
                >
                  <div className="flex justify-between items-center pb-6 mb-8 border-b-4 border-double border-black">
                    <div className="flex items-center gap-4">
                      {companyData?.logo && <img src={companyData.logo} alt="Logo" className="w-20 h-20 object-contain" />}
                      <div>
                        <h1 className="text-4xl font-black">
                            {companyData?.company_name || "Firma Adı"}
                        </h1>
                        <p className="text-base mt-2 font-bold uppercase tracking-widest">
                            {quoteData.quote_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm leading-relaxed">
                      <p><strong>Tarih:</strong> {new Date(quoteData.created_at).toLocaleDateString('tr-TR')}</p>
                      <p><strong>Durum:</strong> {quoteData.status === 'Müşteri Onayladı' || status === 'success' ? 'Onaylandı' : 'Bekliyor'}</p>
                    </div>
                  </div>
                  
                  <div className="mb-8 grid grid-cols-2 gap-8 text-sm">
                    <div className="p-5 border border-black">
                      <h3 className="mb-4 pb-2 font-bold border-b border-black uppercase">Müşteri Bilgileri</h3>
                      <div className="space-y-2">
                        <p><strong>İsim:</strong> {quoteData.customer_name}</p>
                        {quoteData.customer_phone && <p><strong>Telefon:</strong> {quoteData.customer_phone}</p>}
                      </div>
                    </div>
                    
                    <div className="p-5 border border-black">
                      <h3 className="mb-4 pb-2 font-bold border-b border-black uppercase">Sistem Teknik Bilgileri</h3>
                      <div className="space-y-2">
                        <p><strong>Bina/Varlık:</strong> {splitAsset.apt || splitAsset.dev}</p>
                        {parsedDetails.elevatorType && <p><strong>Asansör Tipi/Cinsi:</strong> {parsedDetails.elevatorType}</p>}
                        {parsedDetails.capacity && <p><strong>Kapasite:</strong> {parsedDetails.capacity}</p>}
                        {parsedDetails.stopsCount && <p><strong>Durak Sayısı:</strong> {parsedDetails.stopsCount}</p>}
                        {parsedDetails.elevatorSpeed && <p><strong>Hızı:</strong> {parsedDetails.elevatorSpeed}</p>}
                        {parsedDetails.elevatorCount && <p><strong>Asansör Adedi:</strong> {parsedDetails.elevatorCount}</p>}
                        
                        {quoteData.quote_type === 'Bakım Sözleşmesi' && (
                            <div className="pt-2 mt-2 border-t border-dashed border-gray-300 space-y-2">
                                {parsedDetails.monthlyFee && <p><strong>Aylık Bakım Bedeli:</strong> {parsedDetails.monthlyFee}</p>}
                                {(parsedDetails.startDate || parsedDetails.endDate) && (
                                    <p><strong>Sözleşme Süresi:</strong> {parsedDetails.startDate ? new Date(parsedDetails.startDate).toLocaleDateString('tr-TR') : '-'} / {parsedDetails.endDate ? new Date(parsedDetails.endDate).toLocaleDateString('tr-TR') : '-'}</p>
                                )}
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-16">
                    <h3 className="mb-6 pb-2 font-bold border-b-2 border-black uppercase text-center text-lg">
                        {quoteData.quote_type === 'Bakım Sözleşmesi' ? 'Asansör Bakım ile İlgili Hususlar' : 'İşlem Detayları'}
                    </h3>
                    <div className="text-[13px] whitespace-pre-wrap leading-[1.8] text-justify">
                        {quoteData.quote_type === 'Bakım Sözleşmesi' ? parsedDetails.maintenanceContract : (quoteData.quote_type === 'Revizyon Teklifi' ? parsedDetails.revisionDetails : 'Montaj detayları ektedir.')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-12 mt-20 pt-8 border-t-2 border-black text-center">
                    <div>
                      <p className="font-bold mb-24 uppercase tracking-widest text-sm">Yüklenici Firma Onayı<br/><span className="font-normal text-xs normal-case mt-2 block">{companyData?.owner_name || ""}</span></p>
                      {parsedDetails.employerSignature && <img src={parsedDetails.employerSignature} className="mx-auto h-24 object-contain mix-blend-multiply grayscale" />}
                    </div>
                    <div>
                      <p className="font-bold mb-24 uppercase tracking-widest text-sm">Müşteri Onayı<br/><span className="font-normal text-xs normal-case mt-2 block">{quoteData.customer_name}</span></p>
                      {(signatureImage || parsedDetails.customerSignature) ? <img src={signatureImage || parsedDetails.customerSignature} className="mx-auto h-24 object-contain mix-blend-multiply grayscale" /> : <div className="text-gray-400 italic text-sm">Elektronik İmza Bekleniyor</div>}
                    </div>
                  </div>
                </div>
                )}
            </div>
        </div>
    );
}