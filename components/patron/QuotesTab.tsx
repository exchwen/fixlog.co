'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Trash2, FileText, FileSignature, CheckCircle, Clock, Search, X, Download, User, Box, MessageCircle, LayoutTemplate } from 'lucide-react';
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
    const [printTemplate, setPrintTemplate] = useState('modern'); // 🚀 YENİ: Şablon State'i
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: selectedQuote ? `${selectedQuote.customer_name}_Teklif_Belgesi` : "Teklif_Belgesi",
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
                  <p className="text-sm font-medium text-slate-500 mt-1">Oluşturduğunuz sözleşmeleri yönetin, müşteriye yollayın veya yazdırın.</p>
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
                           className={`border p-5 rounded-xl flex flex-col justify-between transition-all cursor-pointer group shadow-sm hover:shadow-md
                             ${q.status === 'Müşteri Onayladı' ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-400' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}
                           `}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                   <div className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${q.quote_type === 'Bakım Sözleşmesi' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {q.quote_type}
                                   </div>
                                   <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg 
                                      ${q.status === 'Bekliyor' ? 'bg-amber-100 text-amber-700' : 
                                        q.status === 'Müşteri Onayladı' ? 'bg-emerald-500 text-white shadow-sm' : 
                                        'bg-emerald-100 text-emerald-700'}
                                   `}>
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
                            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200/60">
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
                            <div className={`p-4 rounded-xl border text-center flex flex-col justify-center transition-colors ${selectedQuote.status === 'Müşteri Onayladı' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${selectedQuote.status === 'Müşteri Onayladı' ? 'text-emerald-600' : 'text-slate-400'}`}>Müşteri İmzası</div>
                                {parsedDetails.customerSignature ? <img src={parsedDetails.customerSignature} alt="Müşteri İmza" className="h-16 mx-auto object-contain mix-blend-multiply" /> : <div className="text-xs text-slate-400 italic py-4">İmza Bekleniyor</div>}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
                        {/* 🚀 YENİ: WHATSAPP İLE GÖNDER BUTONU */}
                        {selectedQuote.public_token && selectedQuote.status !== 'Müşteri Onayladı' && (
                            <a 
                                href={`https://wa.me/?text=${encodeURIComponent(`Merhaba \${selectedQuote.customer_name},\n\nSizin için hazırladığımız \${selectedQuote.quote_type} belgemize aşağıdaki bağlantıdan ulaşıp, online olarak inceleyebilir ve imzalayabilirsiniz:\n\n\${typeof window !== 'undefined' ? window.location.origin : ''}/teklif/${selectedQuote.public_token}\n\nSaygılarımızla, ${data?.settings?.company_name || 'Fixlog'}`)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full bg-[#25D366] text-white font-bold text-sm py-4 rounded-xl shadow-lg hover:bg-[#20bd5a] transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={20} /> Müşteriye WhatsApp'tan Gönder (İmza Linki)
                            </a>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <button onClick={() => handleDelete(selectedQuote.id)} className="p-4 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center shrink-0">
                                <Trash2 size={20} />
                            </button>
                            
                            <div className="flex-1 flex gap-2">
                                {/* 🚀 YENİ: ŞABLON SEÇİCİ */}
                                <div className="relative flex-1">
                                    <select 
                                        value={printTemplate} 
                                        onChange={(e) => setPrintTemplate(e.target.value)}
                                        className="w-full h-full appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-xs px-4 py-3 rounded-xl outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                                    >
                                        <option value="modern">Modern Şablon</option>
                                        <option value="classic">Klasik Şablon</option>
                                        <option value="minimal">Minimal Şablon</option>
                                    </select>
                                    <LayoutTemplate size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>

                                <button onClick={handlePrint} className="flex-[1.5] bg-blue-600 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <Download size={18} /> Yazdır / İndir
                                </button>
                            </div>
                        </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* 🚀 GİZLİ YAZDIRMA ŞABLONU (DİNAMİK TEMALI) */}
            <div style={{ display: "none" }}>
                {selectedQuote && (
                <div 
                    ref={printRef} 
                    className={`p-10 bg-white max-w-2xl mx-auto 
                        ${printTemplate === 'classic' ? 'font-serif text-black' : 
                          printTemplate === 'minimal' ? 'font-mono text-gray-800' : 
                          'font-sans text-slate-900'}
                    `}
                >
                  <div className={`flex justify-between items-center pb-6 mb-8 
                      ${printTemplate === 'classic' ? 'border-b-4 border-double border-black' : 
                        printTemplate === 'modern' ? 'border-b-2 border-slate-900' : 
                        'border-b border-gray-200'}
                  `}>
                    <div className="flex items-center gap-4">
                      {data?.settings?.company_logo && <img src={data.settings.company_logo} alt="Logo" className="w-16 h-16 object-contain" />}
                      <div>
                        <h1 className={`text-3xl ${printTemplate === 'minimal' ? 'font-light tracking-wide' : 'font-black'}`}>
                            {data?.settings?.company_name || "Firma Adı"}
                        </h1>
                        <p className={`text-sm mt-1 ${printTemplate === 'classic' ? 'font-bold uppercase tracking-widest' : 'font-medium'}`}>
                            {selectedQuote.quote_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p><strong>Tarih:</strong> {new Date(selectedQuote.created_at).toLocaleDateString('tr-TR')}</p>
                      <p><strong>Durum:</strong> {selectedQuote.status}</p>
                    </div>
                  </div>
                  
                  <div className="mb-8 grid grid-cols-2 gap-8 text-sm">
                    <div className={`${printTemplate === 'classic' ? 'p-4 border border-black' : printTemplate === 'modern' ? 'p-4 bg-slate-50 rounded-xl' : ''}`}>
                      <h3 className={`mb-3 pb-1 ${printTemplate === 'classic' ? 'font-bold border-b border-black uppercase' : printTemplate === 'minimal' ? 'font-semibold text-gray-500 uppercase tracking-widest text-xs' : 'font-bold border-b border-slate-200'}`}>Müşteri Bilgileri</h3>
                      <p><strong>İsim:</strong> {selectedQuote.customer_name}</p>
                      {selectedQuote.customer_phone && <p><strong>Telefon:</strong> {selectedQuote.customer_phone}</p>}
                    </div>
                    <div className={`${printTemplate === 'classic' ? 'p-4 border border-black' : printTemplate === 'modern' ? 'p-4 bg-slate-50 rounded-xl' : ''}`}>
                      <h3 className={`mb-3 pb-1 ${printTemplate === 'classic' ? 'font-bold border-b border-black uppercase' : printTemplate === 'minimal' ? 'font-semibold text-gray-500 uppercase tracking-widest text-xs' : 'font-bold border-b border-slate-200'}`}>Sistem Bilgileri</h3>
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
                  
                  <div className={`mb-12 ${printTemplate === 'modern' ? 'bg-slate-50 p-6 rounded-xl' : ''}`}>
                    <h3 className={`mb-4 pb-2 ${printTemplate === 'classic' ? 'font-bold border-b-2 border-black uppercase text-center' : printTemplate === 'minimal' ? 'font-semibold text-gray-500 uppercase tracking-widest text-xs' : 'font-bold border-b border-slate-200'}`}>Sözleşme / Teklif Detayı</h3>
                    <div className={`text-sm whitespace-pre-wrap leading-relaxed ${printTemplate === 'classic' ? 'text-justify' : ''}`}>
                        {selectedQuote.quote_type === 'Bakım Sözleşmesi' ? parsedDetails.maintenanceContract : (selectedQuote.quote_type === 'Revizyon Teklifi' ? parsedDetails.revisionDetails : 'Montaj detayları ektedir.')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t-2 border-black text-center">
                    <div>
                      <p className="font-bold mb-20">Yetkili (Firma) İmzası<br/><span className={`font-normal text-sm ${printTemplate === 'minimal' ? 'italic text-gray-500' : ''}`}>{data?.ownerName || data?.settings?.owner_name || ""}</span></p>
                      {parsedDetails.employerSignature && <img src={parsedDetails.employerSignature} className="mx-auto h-24 object-contain mix-blend-multiply grayscale" />}
                    </div>
                    <div>
                      <p className="font-bold mb-20">Müşteri İmzası<br/><span className={`font-normal text-sm ${printTemplate === 'minimal' ? 'italic text-gray-500' : ''}`}>{selectedQuote.customer_name}</span></p>
                      {parsedDetails.customerSignature ? <img src={parsedDetails.customerSignature} className="mx-auto h-24 object-contain mix-blend-multiply grayscale" /> : <div className="text-gray-400 italic">Elektronik İmza Bekleniyor</div>}
                    </div>
                  </div>
                </div>
                )}
            </div>
        </div>
    );
}