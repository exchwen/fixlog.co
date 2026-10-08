'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Loader2, Trash2, FileText, CheckCircle, Clock, Search, X, Download, User, Box, MessageCircle, LayoutTemplate } from 'lucide-react';
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
  return token ? token.replace(/^"|"$/g, '') : '';
};

export default function QuotesTab({ data }: any) {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false); 
    
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Tümü');
    const [filterStatus, setFilterStatus] = useState('Tümü');

    const [printTemplate, setPrintTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern'); 
    
    useEffect(() => {
        const savedTemplate = localStorage.getItem('selectedQuoteTemplate');
        if (savedTemplate === 'classic' || savedTemplate === 'minimal') {
            setPrintTemplate(savedTemplate);
        }
    }, []);

    const handleTemplateChange = (tmpl: 'modern' | 'classic' | 'minimal') => {
        setPrintTemplate(tmpl);
        localStorage.setItem('selectedQuoteTemplate', tmpl);
    };

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: selectedQuote ? `${selectedQuote.customer_name}_${selectedQuote.quote_type.replace(' ', '_')}` : "Teklif_Belgesi",
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

    const confirmDelete = async () => {
        if (!quoteToDelete) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';
        const secureToken = getAuthToken();

        await fetch(`${API_URL}/delete-quote`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secureToken}`
            },
            body: JSON.stringify({ id: quoteToDelete, company_slug: companySlug })
        });
        setQuotes(quotes.filter(q => q.id !== quoteToDelete));
        if (selectedQuote?.id === quoteToDelete) setSelectedQuote(null);
        setQuoteToDelete(null); 
    };

    let parsedDetails: any = {};
    if (selectedQuote && selectedQuote.quote_details) {
        try {
            parsedDetails = typeof selectedQuote.quote_details === 'string' 
                ? JSON.parse(selectedQuote.quote_details) 
                : selectedQuote.quote_details;
        } catch(e) {}
    }

    const filteredQuotes = quotes.filter(q => {
        const matchesSearch = (q.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (q.asset_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'Tümü' || q.quote_type === filterType;
        const matchesStatus = filterStatus === 'Tümü' || q.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const renderAssetName = (fullName: string) => {
        if (!fullName) return { apt: '', dev: 'Bilinmeyen Varlık' };
        if (fullName.includes('|')) {
            const parts = fullName.split('|');
            return { apt: parts[0].trim(), dev: parts[1].trim() };
        }
        return { apt: '', dev: fullName };
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 min-h-[60vh] relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800">Teklifler ve Sözleşmeler</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Oluşturduğunuz sözleşmeleri yönetin, müşteriye yollayın veya yazdırın.</p>
                </div>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <button 
                        onClick={() => setShowTemplateModal(true)} 
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <LayoutTemplate size={18} /> Şablon Seç
                    </button>
                    <button onClick={() => setShowQuoteModal(true)} className="px-5 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto">
                        + Yeni Teklif
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Müşteri veya Apartman Ara..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400 shadow-sm" 
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        value={filterType} onChange={e => setFilterType(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg outline-none focus:border-blue-400 shadow-sm w-1/2 sm:w-auto"
                    >
                        <option value="Tümü">Tüm Türler</option>
                        <option value="Bakım Sözleşmesi">Bakım Sözleşmesi</option>
                        <option value="Revizyon Teklifi">Revizyon Teklifi</option>
                        <option value="Montaj Teklifi">Montaj Teklifi</option>
                    </select>
                    <select 
                        value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg outline-none focus:border-blue-400 shadow-sm w-1/2 sm:w-auto"
                    >
                        <option value="Tümü">Tüm Durumlar</option>
                        <option value="Müşteri Onayladı">Onaylandı</option>
                        <option value="Bekliyor">Bekliyor</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                   <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredQuotes.map(q => {
                        const splitAsset = renderAssetName(q.asset_name);
                        return (
                        <div 
                           key={q.id} 
                           onClick={() => setSelectedQuote(q)}
                           className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between
                             ${q.status === 'Müşteri Onayladı' ? 'border-emerald-200 hover:border-emerald-400' : 'border-slate-200 hover:border-blue-400'}
                           `}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                   <div className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${q.quote_type === 'Bakım Sözleşmesi' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                      {q.quote_type}
                                   </div>
                                   <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${q.status === 'Bekliyor' ? 'bg-amber-50 text-amber-700 border-amber-200' : q.status === 'Müşteri Onayladı' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                      {q.status === 'Bekliyor' ? <Clock size={12}/> : <CheckCircle size={12}/>} {q.status}
                                   </div>
                                </div>
                                
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Müşteri / Firma</p>
                                    <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">{q.customer_name}</h3>
                                </div>
                                
                                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100/80">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">İlgili Tesis / Varlık</p>
                                    {splitAsset.apt ? (
                                        <>
                                            <div className="text-sm font-black text-slate-700 truncate mb-0.5">{splitAsset.apt}</div>
                                            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 truncate"><Box size={12} className="shrink-0 text-slate-400"/> {splitAsset.dev}</div>
                                        </>
                                    ) : (
                                        <div className="text-sm font-black text-slate-700 truncate flex items-center gap-1.5"><Box size={14} className="text-slate-400"/> {splitAsset.dev}</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
                                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                                    <Calendar size={14} /> {new Date(q.created_at).toLocaleDateString('tr-TR')}
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setQuoteToDelete(q.id); }}
                                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Sil"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )})}
                    {filteredQuotes.length === 0 && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                           <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                           <h3 className="text-lg font-bold text-slate-700 mb-1">Kayıt Bulunamadı</h3>
                           <p className="text-sm text-slate-500">Arama kriterlerinize uygun veya kayıtlı teklif yok.</p>
                        </div>
                    )}
                </div>
            )}

            {/* HARİKA ŞABLON ÖNİZLEME MODALI */}
            <AnimatePresence>
            {showTemplateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0" onClick={() => setShowTemplateModal(false)}></div>
                    <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white rounded-3xl shadow-2xl relative w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Çıktı Şablonu Seçin</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Teklif ve sözleşmelerinizin PDF veya Yazıcı çıktısında nasıl görüneceğini belirleyin.</p>
                            </div>
                            <button onClick={() => setShowTemplateModal(false)} className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-slate-100 flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                
                                {/* Modern Preview */}
                                <div onClick={() => handleTemplateChange('modern')} className={`cursor-pointer rounded-2xl border-4 transition-all bg-white overflow-hidden flex flex-col ${printTemplate === 'modern' ? 'border-blue-500 shadow-xl scale-105' : 'border-transparent shadow-md hover:shadow-lg hover:border-blue-200'}`}>
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                        <span className={`font-black tracking-widest ${printTemplate === 'modern' ? 'text-blue-700' : 'text-slate-600'}`}>MODERN</span>
                                        {printTemplate === 'modern' && <CheckCircle className="text-blue-500" size={24}/>}
                                    </div>
                                    <div className="p-6 flex-1 flex justify-center items-center bg-slate-100">
                                        <div className="w-full max-w-[200px] aspect-[1/1.414] bg-white shadow-sm border border-slate-200 p-4 flex flex-col pointer-events-none">
                                            <div className="border-b-2 border-blue-900 pb-2 mb-3 flex justify-between">
                                                <div className="w-8 h-8 bg-blue-100 rounded"></div>
                                                <div className="w-16 h-2.5 bg-slate-200 mt-2"></div>
                                            </div>
                                            <div className="flex gap-2 mb-3">
                                                <div className="flex-1 bg-slate-50 rounded p-2"><div className="w-10 h-1.5 bg-blue-800 mb-1.5"></div><div className="w-full h-1 bg-slate-300 mb-1"></div><div className="w-2/3 h-1 bg-slate-300"></div></div>
                                                <div className="flex-1 bg-slate-50 rounded p-2"><div className="w-10 h-1.5 bg-blue-800 mb-1.5"></div><div className="w-full h-1 bg-slate-300 mb-1"></div><div className="w-1/2 h-1 bg-slate-300"></div></div>
                                            </div>
                                            <div className="flex-1 bg-slate-50 rounded p-3 mb-3"><div className="w-full h-1 bg-slate-300 mb-1.5"></div><div className="w-full h-1 bg-slate-300 mb-1.5"></div><div className="w-5/6 h-1 bg-slate-300 mb-1.5"></div><div className="w-4/6 h-1 bg-slate-300"></div></div>
                                            <div className="flex justify-between mt-auto px-2"><div className="w-12 h-1 bg-slate-400"></div><div className="w-12 h-1 bg-slate-400"></div></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Classic Preview */}
                                <div onClick={() => handleTemplateChange('classic')} className={`cursor-pointer rounded-2xl border-4 transition-all bg-white overflow-hidden flex flex-col ${printTemplate === 'classic' ? 'border-amber-500 shadow-xl scale-105' : 'border-transparent shadow-md hover:shadow-lg hover:border-amber-200'}`}>
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                        <span className={`font-black tracking-widest ${printTemplate === 'classic' ? 'text-amber-700' : 'text-slate-600'}`}>KLASİK (RESMİ)</span>
                                        {printTemplate === 'classic' && <CheckCircle className="text-amber-500" size={24}/>}
                                    </div>
                                    <div className="p-6 flex-1 flex justify-center items-center bg-slate-100">
                                        <div className="w-full max-w-[200px] aspect-[1/1.414] bg-white shadow-sm border border-slate-200 p-4 flex flex-col font-serif pointer-events-none">
                                            <div className="border-b-[3px] border-double border-black pb-2 mb-3 flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 bg-slate-200 rounded-full mb-1"></div>
                                                <div className="w-20 h-1.5 bg-black"></div>
                                            </div>
                                            <div className="border border-black p-2 mb-3 text-center">
                                                <div className="w-16 h-1.5 bg-black mx-auto mb-1"></div><div className="w-10 h-1 bg-slate-400 mx-auto"></div>
                                            </div>
                                            <div className="flex-1 py-1 space-y-1.5">
                                                <div className="w-full h-1 bg-slate-300"></div><div className="w-full h-1 bg-slate-300"></div><div className="w-full h-1 bg-slate-300"></div><div className="w-3/4 h-1 bg-slate-300"></div>
                                            </div>
                                            <div className="mt-auto grid grid-cols-2 gap-4"><div className="h-6 border-b border-black"></div><div className="h-6 border-b border-black"></div></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Minimal Preview */}
                                <div onClick={() => handleTemplateChange('minimal')} className={`cursor-pointer rounded-2xl border-4 transition-all bg-white overflow-hidden flex flex-col ${printTemplate === 'minimal' ? 'border-emerald-500 shadow-xl scale-105' : 'border-transparent shadow-md hover:shadow-lg hover:border-emerald-200'}`}>
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                        <span className={`font-black tracking-widest ${printTemplate === 'minimal' ? 'text-emerald-700' : 'text-slate-600'}`}>MİNİMAL</span>
                                        {printTemplate === 'minimal' && <CheckCircle className="text-emerald-500" size={24}/>}
                                    </div>
                                    <div className="p-6 flex-1 flex justify-center items-center bg-slate-100">
                                        <div className="w-full max-w-[200px] aspect-[1/1.414] bg-white shadow-sm border border-slate-200 p-5 flex flex-col pointer-events-none">
                                            <div className="mb-5 text-left">
                                                <div className="w-16 h-2.5 bg-slate-800 mb-1.5"></div><div className="w-10 h-1 bg-slate-400"></div>
                                            </div>
                                            <div className="flex gap-4 mb-4 text-left">
                                                <div className="flex-1"><div className="w-12 h-1 bg-gray-500 mb-1.5"></div><div className="w-full h-0.5 bg-slate-300"></div></div>
                                                <div className="flex-1"><div className="w-12 h-1 bg-gray-500 mb-1.5"></div><div className="w-full h-0.5 bg-slate-300"></div></div>
                                            </div>
                                            <div className="flex-1 space-y-1.5"><div className="w-full h-0.5 bg-slate-200"></div><div className="w-full h-0.5 bg-slate-200"></div><div className="w-2/3 h-0.5 bg-slate-200"></div></div>
                                            <div className="mt-auto flex justify-between text-left"><div className="w-12 h-1 bg-slate-400"></div><div className="w-12 h-1 bg-slate-400"></div></div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-white">
                            <button onClick={() => setShowTemplateModal(false)} className="w-full max-w-sm mx-auto block bg-slate-900 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95">Seçimi Onayla ve Kapat</button>
                        </div>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>

            {/* SİLME MODALI */}
            <AnimatePresence>
                {quoteToDelete && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }} 
                            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center"
                        >
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Emin misiniz?</h3>
                            <p className="text-slate-500 font-medium mb-8">Bu teklifi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setQuoteToDelete(null)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-all active:scale-95">İptal</button>
                                <button onClick={confirmDelete} className="flex-1 bg-rose-600 text-white font-bold py-3.5 rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <Trash2 size={18} /> Sil
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {showQuoteModal && <QuoteModal showQuoteModal={showQuoteModal} setShowQuoteModal={setShowQuoteModal} data={data} setActiveTab={(tab: string) => { if(typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('navTab', { detail: tab })) }} />}
        
            {/* TEKLİF DETAY MODALI */}
            <AnimatePresence>
              {selectedQuote && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                  <div className="absolute inset-0" onClick={() => setSelectedQuote(null)}></div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
                    className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden"
                  >
                    <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><FileText size={20} /></div>
                        <div>
                          <h2 className="font-black text-slate-800 text-base sm:text-lg tracking-tight">Teklif Detayı</h2>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-slate-500 text-[11px] sm:text-xs font-semibold">{selectedQuote.quote_type}</span>
                             <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                             <span className="text-slate-500 text-[11px] sm:text-xs font-semibold">{new Date(selectedQuote.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedQuote(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-0">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><User size={14}/> Müşteri</div>
                                <div className="font-black text-slate-800 truncate text-base">{selectedQuote.customer_name}</div>
                                {selectedQuote.customer_phone && <div className="text-xs font-medium text-slate-500 mt-1">{selectedQuote.customer_phone}</div>}
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-0">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Box size={14}/> İlgili Tesis / Varlık</div>
                                {renderAssetName(selectedQuote.asset_name).apt ? (
                                    <>
                                        <div className="font-black text-slate-800 truncate text-base">{renderAssetName(selectedQuote.asset_name).apt}</div>
                                        <div className="text-xs font-semibold text-slate-500 mt-1 truncate">{renderAssetName(selectedQuote.asset_name).dev}</div>
                                    </>
                                ) : (
                                    <div className="font-black text-slate-800 truncate text-base">{renderAssetName(selectedQuote.asset_name).dev}</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">İçerik Detayları</div>
                            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {selectedQuote.quote_type === 'Bakım Sözleşmesi' ? (parsedDetails.maintenanceContract || 'Sözleşme metni bulunamadı.') : 
                                 selectedQuote.quote_type === 'Revizyon Teklifi' ? (parsedDetails.revisionDetails || 'Revizyon detayı bulunamadı.') : 
                                 'Montaj teknik detayları PDF belgesindedir.'}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 px-1">
                                <LayoutTemplate size={12} /> Çıktı Tasarım Şablonu
                            </div>
                            <div className="flex gap-2 w-full">
                                <button onClick={() => setShowTemplateModal(true)} className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-xl py-3 text-xs font-bold text-slate-700 transition-all flex justify-center items-center gap-2">
                                   Şablonu Değiştir / Önizle
                                </button>
                                <div className="bg-slate-100 text-slate-500 text-[10px] font-black tracking-widest px-4 rounded-xl flex items-center uppercase">
                                   Aktif: {printTemplate === 'classic' ? 'KLASİK' : printTemplate === 'minimal' ? 'MİNİMAL' : 'MODERN'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
                        {selectedQuote.public_token && selectedQuote.status !== 'Müşteri Onayladı' && (
                            <a 
                                href={`https://wa.me/?text=${encodeURIComponent(`Merhaba \${selectedQuote.customer_name},\n\nSizin için hazırladığımız \${selectedQuote.quote_type} belgemize aşağıdaki bağlantıdan ulaşıp, online olarak inceleyebilir ve imzalayabilirsiniz:\n\n\${typeof window !== 'undefined' ? window.location.origin : ''}/teklif/${selectedQuote.public_token}\n\nSaygılarımızla, ${data?.settings?.company_name || 'Fixlog'}`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="w-full bg-[#25D366] text-white font-bold text-sm py-3.5 sm:py-4 rounded-xl shadow-md hover:bg-[#20bd5a] transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={20} /> <span className="hidden sm:inline">Müşteriye</span> WhatsApp İle Gönder (Link)
                            </a>
                        )}

                        <div className="flex gap-3 w-full">
                            <button onClick={() => setQuoteToDelete(selectedQuote.id)} className="w-14 shrink-0 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center shadow-sm">
                                <Trash2 size={20} />
                            </button>
                            <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white font-bold text-sm py-3.5 sm:py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Download size={18} /> Yazdır veya PDF İndir
                            </button>
                        </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* 🚀 GİZLİ YAZDIRMA ŞABLONU */}
            <div style={{ display: "none" }}>
                {selectedQuote && (
                <div 
                    ref={printRef} 
                    className={`p-10 bg-white max-w-3xl mx-auto 
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
                      {data?.settings?.company_logo && <img src={data.settings.company_logo} alt="Logo" className="w-20 h-20 object-contain" />}
                      <div>
                        <h1 className={`text-4xl ${printTemplate === 'minimal' ? 'font-light tracking-widest' : 'font-black'}`}>
                            {data?.settings?.company_name || "Firma Adı"}
                        </h1>
                        <p className={`text-base mt-2 ${printTemplate === 'classic' ? 'font-bold uppercase tracking-widest' : 'font-medium'}`}>
                            {selectedQuote.quote_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm leading-relaxed">
                      <p><strong>Tarih:</strong> {new Date(selectedQuote.created_at).toLocaleDateString('tr-TR')}</p>
                      <p><strong>Durum:</strong> {selectedQuote.status}</p>
                    </div>
                  </div>
                  
                  <div className="mb-8 grid grid-cols-2 gap-8 text-sm">
                    <div className={`${printTemplate === 'classic' ? 'p-5 border border-black' : printTemplate === 'modern' ? 'p-5 bg-slate-50 rounded-2xl' : ''}`}>
                      <h3 className={`mb-4 pb-2 ${printTemplate === 'classic' ? 'font-bold border-b border-black uppercase' : printTemplate === 'minimal' ? 'font-semibold text-gray-400 uppercase tracking-widest text-xs' : 'font-bold border-b border-slate-200 text-blue-800'}`}>Müşteri Bilgileri</h3>
                      <div className="space-y-2">
                        <p><strong>İsim:</strong> {selectedQuote.customer_name}</p>
                        {selectedQuote.customer_phone && <p><strong>Telefon:</strong> {selectedQuote.customer_phone}</p>}
                      </div>
                    </div>
                    
                    <div className={`${printTemplate === 'classic' ? 'p-5 border border-black' : printTemplate === 'modern' ? 'p-5 bg-slate-50 rounded-2xl' : ''}`}>
                      <h3 className={`mb-4 pb-2 ${printTemplate === 'classic' ? 'font-bold border-b border-black uppercase' : printTemplate === 'minimal' ? 'font-semibold text-gray-400 uppercase tracking-widest text-xs' : 'font-bold border-b border-slate-200 text-blue-800'}`}>Sistem Teknik Bilgileri</h3>
                      <div className="space-y-2">
                        <p><strong>Bina/Varlık:</strong> {renderAssetName(selectedQuote.asset_name).apt || renderAssetName(selectedQuote.asset_name).dev}</p>
                        {parsedDetails.elevatorType && <p><strong>Asansör Tipi/Cinsi:</strong> {parsedDetails.elevatorType}</p>}
                        {parsedDetails.capacity && <p><strong>Kapasite:</strong> {parsedDetails.capacity}</p>}
                        {parsedDetails.stopsCount && <p><strong>Durak Sayısı:</strong> {parsedDetails.stopsCount}</p>}
                        {parsedDetails.elevatorSpeed && <p><strong>Hızı:</strong> {parsedDetails.elevatorSpeed}</p>}
                        {parsedDetails.elevatorCount && <p><strong>Asansör Adedi:</strong> {parsedDetails.elevatorCount}</p>}
                        
                        {selectedQuote.quote_type === 'Bakım Sözleşmesi' && (
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
                  
                  <div className={`mb-16 ${printTemplate === 'modern' ? 'bg-slate-50 p-8 rounded-2xl' : ''}`}>
                    <h3 className={`mb-6 pb-2 ${printTemplate === 'classic' ? 'font-bold border-b-2 border-black uppercase text-center text-lg' : printTemplate === 'minimal' ? 'font-semibold text-gray-400 uppercase tracking-widest text-xs' : 'font-black border-b border-slate-200 text-blue-800 text-lg'}`}>
                        {selectedQuote.quote_type === 'Bakım Sözleşmesi' ? 'Asansör Bakım ile İlgili Hususlar' : 'İşlem Detayları'}
                    </h3>
                    <div className={`text-[13px] whitespace-pre-wrap leading-[1.8] ${printTemplate === 'classic' ? 'text-justify' : ''}`}>
                        {selectedQuote.quote_type === 'Bakım Sözleşmesi' ? parsedDetails.maintenanceContract : (selectedQuote.quote_type === 'Revizyon Teklifi' ? parsedDetails.revisionDetails : 'Montaj detayları ektedir.')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-12 mt-20 pt-8 border-t-2 border-black text-center">
                    <div>
                      <p className="font-bold mb-24 uppercase tracking-widest text-sm">Yüklenici Firma Onayı<br/><span className={`font-normal text-xs normal-case mt-2 block ${printTemplate === 'minimal' ? 'italic text-gray-500' : ''}`}>{data?.ownerName || data?.settings?.owner_name || ""}</span></p>
                      {parsedDetails.employerSignature && <img src={parsedDetails.employerSignature} className="mx-auto h-24 object-contain mix-blend-multiply grayscale" />}
                    </div>
                    <div>
                      <p className="font-bold mb-24 uppercase tracking-widest text-sm">Müşteri Onayı<br/><span className={`font-normal text-xs normal-case mt-2 block ${printTemplate === 'minimal' ? 'italic text-gray-500' : ''}`}>{selectedQuote.customer_name}</span></p>
                      {parsedDetails.customerSignature ? <img src={parsedDetails.customerSignature} className="mx-auto h-24 object-contain mix-blend-multiply grayscale" /> : <div className="text-gray-400 italic text-sm">Elektronik İmza Bekleniyor</div>}
                    </div>
                  </div>
                </div>
                )}
            </div>
        </div>
    );
}