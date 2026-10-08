'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, FileText, FileSignature, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const QuoteModal = dynamic(() => import('@/components/modals/forms/QuoteModal'), { ssr: false });

export default function QuotesTab({ data }: any) {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    
    const companySlug = data?.slug || data?.company_slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '');

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';
            const res = await fetch(`${API_URL}/get-quotes?company_slug=${companySlug}`, {
                headers: { 'Authorization': `Bearer ${token}` }
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
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';
        await fetch(`${API_URL}/delete-quote`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id, company_slug: companySlug })
        });
        setQuotes(quotes.filter(q => q.id !== id));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[60vh]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Teklifler ve Sözleşmeler</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Oluşturduğunuz bakım sözleşmeleri ve montaj/revizyon tekliflerini buradan takip edebilirsiniz.</p>
                </div>
                <button onClick={() => setShowQuoteModal(true)} className="px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-sm">
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
                        <div key={q.id} className="border border-slate-200 p-5 rounded-xl bg-slate-50 flex flex-col justify-between hover:shadow-md transition-all">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                   <div className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${q.quote_type === 'Bakım Sözleşmesi' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {q.quote_type}
                                   </div>
                                   <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${q.status === 'Bekliyor' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                      {q.status === 'Bekliyor' ? <Clock size={12}/> : <CheckCircle size={12}/>} {q.status}
                                   </div>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{q.customer_name}</h3>
                                <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1">
                                   <FileSignature size={14} /> {q.asset_name || 'Bilinmeyen Varlık'}
                                </p>
                                <div className="mt-3 text-xs text-slate-400">
                                   Tarih: {new Date(q.created_at).toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
                                <button onClick={() => handleDelete(q.id)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Sil">
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

            {/* QuoteModal Render */}
            {showQuoteModal && <QuoteModal showQuoteModal={showQuoteModal} setShowQuoteModal={setShowQuoteModal} data={data} setActiveTab={(tab: string) => { if(typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('navTab', { detail: tab })) }} />}
        </div>
    );
}
