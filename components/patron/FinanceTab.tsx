'use client';

import React, { useState } from 'react';
import { Plus, CheckCircle, X, Loader2, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function FinanceTab({ data }: any) {
  const [jobPrices, setJobPrices] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '' });
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Ustaların bitirdiği ve Onay bekleyen işler
  const pendingJobs = (data?.jobs || []).filter((j: any) => j.status === 'Onay Bekliyor');

  // Yönetici İşi Onaylayıp Gelir Olarak Kaydeder
  const handleApproveJob = async (job: any) => {
    const amount = jobPrices[job.id];
    if (!amount || amount <= 0) return alert("Lütfen onaylamadan önce geçerli bir fiyat giriniz.");
    
    setIsProcessing(job.id);
    try {
      const companySlug = localStorage.getItem('companySlug');
      await fetch('https://biz-backend.yazilimciburak.workers.dev/approve-job', {
        method: 'POST', body: JSON.stringify({ slug: companySlug, jobId: job.id, amount: parseFloat(amount), customerName: job.customer_name })
      });
      window.location.reload(); // Değişikliklerin anında yansıması için
    } catch (e) { alert("Hata oluştu"); setIsProcessing(null); }
  };

  // Manuel Gider / Fiş Ekleme
  const handleAddExpense = async () => {
    if(!expenseForm.description || !expenseForm.amount) return alert("Lütfen açıklama ve tutar giriniz.");
    setIsSavingExpense(true);
    try {
      const companySlug = localStorage.getItem('companySlug');
      await fetch('https://biz-backend.yazilimciburak.workers.dev/add-expense', {
        method: 'POST', body: JSON.stringify({ slug: companySlug, description: expenseForm.description, amount: parseFloat(expenseForm.amount) })
      });
      window.location.reload();
    } catch (e) { alert("Hata oluştu"); setIsSavingExpense(false); }
  };

  return (
    <div className="space-y-6 relative">
       
       {/* 1. ONAY BEKLEYEN İŞLER BÖLÜMÜ */}
       <div>
         <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
           <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
           Yönetici Onayı Bekleyen İşler
         </h3>
         <div className="bg-amber-50/50 rounded-xl border border-amber-200 shadow-sm overflow-hidden">
           <table className="w-full text-left text-xs">
             <thead className="bg-amber-100/50 text-amber-800 font-semibold border-b border-amber-200">
               <tr><th className="px-5 py-3">Müşteri / İş</th><th className="px-5 py-3">Tarih</th><th className="px-5 py-3 w-48">Fiyat Gir (₺)</th><th className="px-5 py-3 text-right">İşlem</th></tr>
             </thead>
             <tbody className="divide-y divide-amber-100">
               {pendingJobs.length > 0 ? pendingJobs.map((j: any) => (
                 <tr key={j.id} className="hover:bg-amber-50 transition-colors">
                   <td className="px-5 py-3"><div className="font-bold text-slate-800">{j.customer_name}</div><div className="text-[10px] text-slate-500">{j.work_type}</div></td>
                   <td className="px-5 py-3 text-slate-600">{j.scheduled_date || 'Tarihsiz'}</td>
                   <td className="px-5 py-3">
                     <input type="number" placeholder="Örn: 1500" className="w-full px-3 py-1.5 border border-amber-200 rounded outline-none focus:border-amber-400 bg-white shadow-sm" value={jobPrices[j.id] || ''} onChange={e => setJobPrices({...jobPrices, [j.id]: e.target.value})} />
                   </td>
                   <td className="px-5 py-3 text-right">
                     <button onClick={() => handleApproveJob(j)} disabled={isProcessing === j.id} className="bg-emerald-600 text-white px-3 py-1.5 rounded text-[11px] font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1 shadow-sm disabled:opacity-50">
                       {isProcessing === j.id ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle size={14} /> Onayla & Gelir Yaz</>}
                     </button>
                   </td>
                 </tr>
               )) : <tr><td colSpan={4} className="p-8 text-center text-amber-600/70 font-medium">Onay bekleyen iş bulunmuyor.</td></tr>}
             </tbody>
           </table>
         </div>
       </div>

       {/* 2. GENEL FİNANS HAREKETLERİ */}
       <div>
         <div className="flex justify-between items-center mb-3">
           <h3 className="text-lg font-bold text-slate-900">Hesap Hareketleri & Fişler</h3>
           <button onClick={() => setShowExpenseModal(true)} className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-rose-100 transition-colors">
             <Plus size={14} strokeWidth={3} /> Gider / Fiş İşle
           </button>
         </div>
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <table className="w-full text-left text-xs">
             <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
               <tr><th className="px-5 py-3">Açıklama</th><th className="px-5 py-3">Tarih</th><th className="px-5 py-3">Miktar</th><th className="px-5 py-3 text-right">Tip</th></tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {data?.finances?.length > 0 ? data.finances.map((f: any) => (
                 <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-5 py-3 font-medium text-slate-800">{f.description}</td>
                   <td className="px-5 py-3 text-slate-500">{new Date(f.created_at).toLocaleDateString('tr-TR')}</td>
                   <td className={`px-5 py-3 font-bold ${f.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                     <div className="flex items-center gap-1">
                       {f.type === 'Gelir' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                       ₺{f.amount.toLocaleString('tr-TR')}
                     </div>
                   </td>
                   <td className="px-5 py-3 text-right">
                     <span className={`px-2 py-1 rounded text-[10px] font-bold border ${f.type === 'Gelir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{f.type}</span>
                   </td>
                 </tr>
               )) : <tr><td colSpan={4} className="p-10 text-center text-slate-400">Henüz finansal hareket yok.</td></tr>}
             </tbody>
           </table>
         </div>
       </div>

       {/* GİDER EKLEME MODALI */}
       {showExpenseModal && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-rose-600">Gider / Fiş İşle</h2><button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">AÇIKLAMA (Ne alındı?)</label><input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-rose-400" placeholder="Örn: Ofis Kırtasiye, Yakıt Fişi" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">TUTAR (₺)</label><input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-rose-400" placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} /></div>
              </div>
              <button disabled={isSavingExpense} className="w-full bg-rose-600 text-white py-2.5 rounded-md font-bold text-sm mt-5 hover:bg-rose-700 flex justify-center items-center" onClick={handleAddExpense}>
                {isSavingExpense ? <Loader2 className="animate-spin" size={16} /> : 'Kasadan Düş (Kaydet)'}
              </button>
            </div>
         </div>
       )}
    </div>
  );
}