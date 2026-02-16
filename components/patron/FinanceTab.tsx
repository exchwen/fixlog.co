'use client';

import React, { useState } from 'react';
import { Plus, CheckCircle, X, Loader2, ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function FinanceTab({ data }: any) {
  // useParams ile URL'deki slug'ı güvenli şekilde çekiyoruz
  const params = useParams();
  const activeSlug = params?.slug || localStorage.getItem('companySlug');

  const [jobPrices, setJobPrices] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Gelir / Gider Modalı State'leri
  const [financeModal, setFinanceModal] = useState<{isOpen: boolean, type: 'Gelir' | 'Gider'}>({ isOpen: false, type: 'Gider' });
  const [financeItems, setFinanceItems] = useState([{ name: '', qty: '1' }]);
  const [financeAmount, setFinanceAmount] = useState('');
  const [isSavingFinance, setIsSavingFinance] = useState(false);

  // Ustaların bitirdiği ve Onay bekleyen işler
  const pendingJobs = (data?.jobs || []).filter((j: any) => j.status === 'Onay Bekliyor');

  // Yönetici İşi Onaylayıp Gelir Olarak Kaydeder
  const handleApproveJob = async (job: any) => {
    const amount = jobPrices[job.id];
    if (!amount || amount <= 0) return alert("Lütfen onaylamadan önce geçerli bir fiyat giriniz.");
    
    setIsProcessing(job.id);
    try {
      const res = await fetch('https://backend.isdokumu.workers.dev/approve-job', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: activeSlug, jobId: job.id, amount: parseFloat(amount), customerName: job.customer_name })
      });
      
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Sunucu reddetti. Lütfen veritabanı bağlantınızı kontrol edin.");
        setIsProcessing(null);
      }
    } catch (e) { 
      alert("Ağ bağlantısı kurulamadı!"); 
      setIsProcessing(null); 
    }
  };

  // Dinamik Satır Ekleme / Çıkarma
  const addItemRow = () => setFinanceItems([...financeItems, { name: '', qty: '1' }]);
  const removeItemRow = (idx: number) => setFinanceItems(financeItems.filter((_, i) => i !== idx));
  const handleItemChange = (idx: number, field: string, val: string) => {
    const newItems = [...financeItems];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setFinanceItems(newItems);
  };

  // Manuel Gelir veya Gider Kaydetme
  const handleAddFinanceRecord = async () => {
    const description = financeItems
      .filter(i => i.name.trim() !== '')
      .map(i => `${i.qty}x ${i.name}`)
      .join(', ');

    if(!description || !financeAmount) return alert("Lütfen kalemleri ve toplam tutarı eksiksiz giriniz.");
    setIsSavingFinance(true);
    
    const endpoint = financeModal.type === 'Gelir' ? '/add-income' : '/add-expense';
    
    try {
      const res = await fetch(`https://backend.isdokumu.workers.dev${endpoint}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: activeSlug, description, amount: parseFloat(financeAmount) })
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert("Kayıt Başarısız! Lütfen Cloudflare'da yeni worker.js dosyanızı güncellediğinizden emin olun.");
        setIsSavingFinance(false);
      }
    } catch (e) { 
      alert("Bağlantı hatası oluştu!"); 
      setIsSavingFinance(false); 
    }
  };

  const closeFinanceModal = () => {
    setFinanceModal({ isOpen: false, type: 'Gider' });
    setFinanceItems([{ name: '', qty: '1' }]);
    setFinanceAmount('');
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
           <div className="flex gap-2">
             <button onClick={() => setFinanceModal({ isOpen: true, type: 'Gelir' })} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-emerald-100 transition-colors">
               <Plus size={14} strokeWidth={3} /> Gelir İşle
             </button>
             <button onClick={() => setFinanceModal({ isOpen: true, type: 'Gider' })} className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-rose-100 transition-colors">
               <Plus size={14} strokeWidth={3} /> Gider / Fiş İşle
             </button>
           </div>
         </div>
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <table className="w-full text-left text-xs">
             <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
               <tr><th className="px-5 py-3">Açıklama (Kalemler)</th><th className="px-5 py-3">Tarih</th><th className="px-5 py-3">Miktar</th><th className="px-5 py-3 text-right">Tip</th></tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {data?.finances?.length > 0 ? data.finances.map((f: any) => (
                 <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-5 py-3 font-medium text-slate-800 line-clamp-2">{f.description}</td>
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

       {/* DİNAMİK GELİR / GİDER EKLEME MODALI */}
       {financeModal.isOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-5">
                <h2 className={`text-lg font-bold ${financeModal.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {financeModal.type === 'Gelir' ? 'Yeni Gelir Ekle' : 'Gider / Fiş İşle'}
                </h2>
                <button onClick={closeFinanceModal} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                    {financeModal.type === 'Gelir' ? 'SATILAN / YAPILAN KALEMLER' : 'ALINAN / HARCANAN KALEMLER'}
                  </label>
                  <div className="space-y-2">
                    {financeItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input 
                          className={`flex-[3] px-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400`} 
                          placeholder={financeModal.type === 'Gelir' ? 'Örn: Bakım Ücreti, Parça X' : 'Örn: Ofis Kırtasiye, Yakıt Fişi'} 
                          value={item.name} 
                          onChange={e => handleItemChange(index, 'name', e.target.value)} 
                        />
                        <input 
                          type="number" 
                          className={`flex-1 px-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400 text-center`} 
                          placeholder="Adet" 
                          value={item.qty} 
                          onChange={e => handleItemChange(index, 'qty', e.target.value)} 
                        />
                        {index > 0 && (
                          <button onClick={() => removeItemRow(index)} className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"><Trash2 size={14} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addItemRow} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 w-full p-2 border border-dashed border-blue-200 rounded-md bg-blue-50/50 justify-center">
                    <Plus size={14} /> Yeni Satır Ekle
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">TOPLAM TUTAR (₺)</label>
                  <input 
                    type="number" 
                    className={`w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-bold outline-none focus:border-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400`} 
                    placeholder="0.00" 
                    value={financeAmount} 
                    onChange={e => setFinanceAmount(e.target.value)} 
                  />
                </div>
              </div>
              
              <button disabled={isSavingFinance} className={`w-full text-white py-2.5 rounded-md font-bold text-sm mt-6 flex justify-center items-center transition-colors ${financeModal.type === 'Gelir' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`} onClick={handleAddFinanceRecord}>
                {isSavingFinance ? <Loader2 className="animate-spin" size={16} /> : (financeModal.type === 'Gelir' ? 'Geliri Kasaya İşle' : 'Gideri Kasadan Düş')}
              </button>
            </div>
         </div>
       )}
    </div>
  );
}