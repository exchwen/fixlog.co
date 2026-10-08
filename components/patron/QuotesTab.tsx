'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Trash2, FileText, FileSignature, CheckCircle, Clock, Search, X, Download, User, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useReactToPrint } from 'react-to-print';

const QuoteModal = dynamic(() => import('@/components/modals/forms/QuoteModal'), { ssr: false });

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

export default function QuotesTab({ data }: any) {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: selectedQuote ? `${selectedQuote.customer_name}_Teklif` : "Teklif_Belgesi",
    });
    
    const companySlug = data?.slug || data?.company_slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '');

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';
            const secureToken = getAuthToken();
            if (!secureToken) return;

            const res = await fetch(`${API_URL}/get-quotes?company_slug=${companySlug}`, {
                headers: { 'Authorization': `Bearer ${secureToken}` }
            });
            const r = await res.json();
            if (r.success) setQuotes(r.data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (companySlug) fetchQuotes();
    }, [companySlug]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu teklifi/sözleşmeyi silmek istediğinize emin misiniz?')) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';
        const secureToken = getAuthToken();

        await fetch(`${API_URL}/delete-quote`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secureToken}`
            },
            body: JSON.stringify({ id, company_slug: companySlug })
        });
        setQuotes(quotes.filter(q => q.id !== id));
        if (selectedQuote?.id === id) setSelectedQuote(null);
    };

    let parsedDetails: any = {};
    if (selectedQuote && selectedQuote.quote_details) {
        try {
            parsedDetails = typeof selectedQuote.quote_details === 'string' 
                ? JSON.parse(selectedQuote.quote_details) 
                : selectedQuote.quote_details;
        } catch(e) {}
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[60vh]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Teklifler ve Sözleşmeler</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Oluşturduğunuz bakım sözleşmeleri ve montaj/revizyon tekliflerini buradan takip edebilirsiniz.</p>
                </div>
                <button onClick={() => setShowQuoteModal(true)} className="px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
                    + Yeni Teklif
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                   <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quotes.map(q => (
                        <div 
                           key={q.id} 
                           onClick={() => setSelectedQuote(q)}
                           className="border border-slate-200 p-5 rounded-xl bg-slate-50 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                   <div className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${q.quote_type === 'Bakım Sözleşmesi' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {q.quote_type}
                                   </div>
                                   <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${q.status === 'Bekliyor' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                      {q.status === 'Bekliyor' ? <Clock size={12}/> : <CheckCircle size={12}/>} {q.status}
                                   </div>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-blue-700 transition-colors">{q.customer_name}</h3>
                                <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1 truncate">
                                   <FileSignature size={14} className="shrink-0" /> <span className="truncate">{q.asset_name || 'Bilinmeyen Varlık'}</span>
                                </p>
                                <div className="mt-3 text-xs text-slate-400">
                                   Tarih: {new Date(q.created_at).toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                                  className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Sil"
                                >
                                   <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {quotes.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                           <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                           <h3 className="text-lg font-bold text-slate-700 mb-1">Henüz teklif bulunmuyor</h3>
                           <p className="text-sm text-slate-500">Oluşturduğunuz teklifler ve sözleşmeler burada listelenecektir.</p>
                        </div>
                    )}
                </div>
            )}

            {showQuoteModal && <QuoteModal showQuoteModal={showQuoteModal} setShowQuoteModal={setShowQuoteModal} data={data} setActiveTab={(tab: string) => { if(typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('navTab', { detail: tab })) }} />}
        
            {/* TEKLİF DETAY VE YAZDIRMA MODALI */}
            <AnimatePresence>
              {selectedQuote && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                  <div className="absolute inset-0" onClick={() => setSelectedQuote(null)}></div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
                    className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden"
                  >
                    <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><FileText size={20} /></div>
                        <div>
                          <h2 className="font-black text-slate-800 text-base sm:text-lg tracking-tight">Teklif Detayı</h2>
                          <p className="text-slate-500 text-[11px] sm:text-xs font-semibold">{selectedQuote.quote_type} - {new Date(selectedQuote.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedQuote(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-0">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><User size={12}/> Müşteri</div>
                                <div className="font-black text-slate-800 truncate">{selectedQuote.customer_name}</div>
                                {selectedQuote.customer_phone && <div className="text-xs font-medium text-slate-500 mt-0.5">{selectedQuote.customer_phone}</div>}
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-0">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Box size={12}/> Varlık (Sistem)</div>
                                <div className="font-black text-slate-800 break-words">{selectedQuote.asset_name || 'Belirtilmemiş'}</div>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2">Metin / İçerik Detayları</div>
                            <div className="text-xs font-medium text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar p-1">
                                {selectedQuote.quote_type === 'Bakım Sözleşmesi' ? (parsedDetails.maintenanceContract || 'Sözleşme metni bulunamadı (Eski Kayıt).') : 
                                 selectedQuote.quote_type === 'Revizyon Teklifi' ? (parsedDetails.revisionDetails || 'Revizyon detayı bulunamadı (Eski Kayıt).') : 
                                 'Montaj teknik detayları PDF belgesindedir.'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center flex flex-col justify-center">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Yetkili İmzası</div>
                                {parsedDetails.employerSignature ? <img src={parsedDetails.employerSignature} alt="Yetkili İmza" className="h-16 mx-auto object-contain mix-blend-multiply" /> : <div className="text-xs text-slate-400 italic py-4">İmza Yok</div>}
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center flex flex-col justify-center">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Müşteri İmzası</div>
                                {parsedDetails.customerSignature ? <img src={parsedDetails.customerSignature} alt="Müşteri İmza" className="h-16 mx-auto object-contain mix-blend-multiply" /> : <div className="text-xs text-slate-400 italic py-4">İmza Yok</div>}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-2">
                        <button onClick={() => handleDelete(selectedQuote.id)} className="p-4 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-all active:scale-95">
                            <Trash2 size={20} />
                        </button>
                        <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white font-bold text-sm py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <Download size={18} /> Yazdır veya PDF İndir
                        </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* GİZLİ YAZDIRMA ŞABLONU */}
            <div style={{ display: "none" }}>
                {selectedQuote && (
                <div ref={printRef} className="p-8 bg-white text-black max-w-2xl mx-auto font-sans">
                  <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                    <div className="flex items-center gap-4">
                      {data?.settings?.company_logo && <img src={data.settings.company_logo} alt="Logo" className="w-16 h-16 object-contain" />}
                      <div>
                        <h1 className="text-3xl font-black">{data?.settings?.company_name || "Firma Adı"}</h1>
                        <p className="text-sm font-medium mt-1">{selectedQuote.quote_type}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p><strong>Tarih:</strong> {new Date(selectedQuote.created_at).toLocaleDateString('tr-TR')}</p>
                      <p><strong>Durum:</strong> {selectedQuote.status}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h3 className="font-bold border-b border-black/20 mb-2 pb-1">Müşteri Bilgileri</h3>
                      <p><strong>İsim:</strong> {selectedQuote.customer_name}</p>
                      {selectedQuote.customer_phone && <p><strong>Telefon:</strong> {selectedQuote.customer_phone}</p>}
                    </div>
                    <div>
                      <h3 className="font-bold border-b border-black/20 mb-2 pb-1">Sistem Bilgileri</h3>
                      <p><strong>Sistem Adı:</strong> {selectedQuote.asset_name}</p>
                      {selectedQuote.quote_type === 'Revizyon Teklifi' && <p><strong>Detay:</strong> {parsedDetails.revisionDetails}</p>}
                      {selectedQuote.quote_type === 'Montaj Teklifi' && (
                        <>
                          <p><strong>Tipi:</strong> {parsedDetails.elevatorType}</p>
                          <p><strong>Durak:</strong> {parsedDetails.stopsCount}</p>
                          <p><strong>Kapasite:</strong> {parsedDetails.capacity}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="font-bold border-b border-black/20 mb-2 pb-1">Sözleşme / Teklif Detayı</h3>
                    <div className="text-sm whitespace-pre-wrap">{selectedQuote.quote_type === 'Bakım Sözleşmesi' ? parsedDetails.maintenanceContract : (selectedQuote.quote_type === 'Revizyon Teklifi' ? parsedDetails.revisionDetails : 'Montaj detayları ektedir.')}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-black text-center">
                    <div>
                      <p className="font-bold mb-16">Yetkili (Firma) İmzası<br/><span className="font-normal text-sm">{data?.ownerName || data?.settings?.owner_name || ""}</span></p>
                      {parsedDetails.employerSignature && <img src={parsedDetails.employerSignature} className="mx-auto h-20 object-contain mix-blend-multiply grayscale" />}
                    </div>
                    <div>
                      <p className="font-bold mb-16">Müşteri İmzası</p>
                      <p className="font-bold mb-2">{selectedQuote.customer_name}</p>
                      {parsedDetails.customerSignature && <img src={parsedDetails.customerSignature} className="mx-auto h-20 object-contain mix-blend-multiply grayscale" />}
                    </div>
                  </div>
                </div>
                )}
            </div>
        </div>
    );
}