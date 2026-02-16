'use client';

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, X, Loader2, ArrowDownRight, ArrowUpRight, Trash2, Download, Eye } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function FinanceTab({ data }: any) {
  const params = useParams();
  const router = useRouter();
  const activeSlug = params?.slug || localStorage.getItem('companySlug');

  const [jobPrices, setJobPrices] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Gelir / Gider Modalı State'leri
  const [financeModal, setFinanceModal] = useState<{isOpen: boolean, type: 'Gelir' | 'Gider'}>({ isOpen: false, type: 'Gider' });
  const [financeItems, setFinanceItems] = useState([{ name: '', qty: '1' }]);
  const [financeAmount, setFinanceAmount] = useState('');
  const [isSavingFinance, setIsSavingFinance] = useState(false);

  // İş Detayı Gösterim Modalı State'i
  const [selectedJobDetail, setSelectedJobDetail] = useState<any>(null);

  // Ekranda anında göstermek için yerel (Local) State'ler
  const [localFinances, setLocalFinances] = useState(data?.finances || []);
  const [localJobs, setLocalJobs] = useState(data?.jobs || []);

  useEffect(() => {
    setLocalFinances(data?.finances || []);
    setLocalJobs(data?.jobs || []);
  }, [data]);

  const pendingJobs = localJobs.filter((j: any) => j.status === 'Onay Bekliyor');

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
        setLocalJobs(localJobs.map((j: any) => j.id === job.id ? { ...j, status: 'Tamamlandı' } : j));
        setLocalFinances([{
            id: Date.now().toString(),
            description: `${job.customer_name} - ${job.work_type}`,
            amount: parseFloat(amount),
            type: 'Gelir',
            created_at: new Date().toISOString()
        }, ...localFinances]);
        
        router.refresh(); 
      } else {
        alert("Sunucu reddetti. Lütfen veritabanı bağlantınızı kontrol edin.");
      }
    } catch (e) { 
      alert("Ağ bağlantısı kurulamadı!"); 
    } finally {
      setIsProcessing(null);
    }
  };

  const addItemRow = () => setFinanceItems([...financeItems, { name: '', qty: '1' }]);
  const removeItemRow = (idx: number) => setFinanceItems(financeItems.filter((_, i) => i !== idx));
  const handleItemChange = (idx: number, field: string, val: string) => {
    const newItems = [...financeItems];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setFinanceItems(newItems);
  };

  const handleAddFinanceRecord = async () => {
    // VİRGÜL YERİNE \n (ALT SATIR) KULLANILARAK BİRLEŞTİRİLDİ
    const description = financeItems
      .filter(i => i.name.trim() !== '')
      .map(i => `${i.qty}x ${i.name}`)
      .join('\n');

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
        setLocalFinances([{
            id: Date.now().toString(),
            description,
            amount: parseFloat(financeAmount),
            type: financeModal.type,
            created_at: new Date().toISOString()
        }, ...localFinances]);

        closeFinanceModal();
        router.refresh(); 
      } else {
        alert("Kayıt Başarısız! Lütfen Cloudflare bağlantınızı kontrol edin.");
      }
    } catch (e) { 
      alert("Bağlantı hatası oluştu!"); 
    } finally {
      setIsSavingFinance(false); 
    }
  };

  const closeFinanceModal = () => {
    setFinanceModal({ isOpen: false, type: 'Gider' });
    setFinanceItems([{ name: '', qty: '1' }]);
    setFinanceAmount('');
  };

  // İSTEMCİ TARANFISINDA (SIFIR MALİYETLİ) EXCEL (CSV) ÇIKTISI ALMA FONKSİYONU
  const exportToExcel = (tableData: any[], title: string) => {
    const headers = ['Tarih', 'Aciklama', 'Miktar (TL)', 'Islem Tipi'];
    const rows = tableData.map(f => {
      const date = new Date(f.created_at).toLocaleDateString('tr-TR');
      // Çift tırnakları düzelt ve Excel'in alt satırları ( \n ) okuyabilmesi için tüm açıklamayı tırnak içine al
      const desc = `"${f.description.replace(/"/g, '""')}"`; 
      const amount = f.amount;
      const type = f.type;
      return `${date},${desc},${amount},${type}`;
    });
    
    // Türkçe karakter desteği için \uFEFF eklendi
    const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_Rapor.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3 FARKLI TABLOYU TEKRAR TEKRAR YAZMAMAK İÇİN OLUŞTURDUĞUMUZ RENDER FONKSİYONU
  const renderFinanceTable = (title: string, tableData: any[]) => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button 
          onClick={() => exportToExcel(tableData, title)} 
          className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-colors"
        >
          <Download size={14} /> Excel İndir
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
            <tr><th className="px-5 py-3 w-1/2">Açıklama (Kalemler)</th><th className="px-5 py-3">Tarih</th><th className="px-5 py-3">Miktar</th><th className="px-5 py-3 text-right">Tip</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableData.length > 0 ? tableData.map((f: any) => {
              // İş eşleştirme mantığı: Gelirse ve açıklama müşteri adını içeriyorsa işi bul.
              const relatedJob = localJobs.find((j: any) => f.type === 'Gelir' && j.status === 'Tamamlandı' && f.description.includes(j.customer_name));
              
              return (
              <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  {/* whitespace-pre-line KULLANARAK \n KARAKTERLERİNİ ALT SATIRA İNDİRİYORUZ */}
                  <div className="font-medium text-slate-800 whitespace-pre-line">{f.description}</div>
                  
                  {/* EŞLEŞEN İŞ VARSA BUTONU GÖSTER */}
                  {relatedJob && (
                    <button 
                      onClick={() => setSelectedJobDetail(relatedJob)} 
                      className="mt-2 text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2 py-1.5 rounded border border-blue-100 hover:bg-blue-100 flex items-center gap-1.5 transition-colors w-max"
                    >
                      <Eye size={12} /> İş Kaydını İncele
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-500 align-top pt-4">{new Date(f.created_at).toLocaleDateString('tr-TR')}</td>
                <td className={`px-5 py-3 font-bold align-top pt-4 ${f.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  <div className="flex items-center gap-1">
                    {f.type === 'Gelir' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    ₺{f.amount.toLocaleString('tr-TR')}
                  </div>
                </td>
                <td className="px-5 py-3 text-right align-top pt-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${f.type === 'Gelir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{f.type}</span>
                </td>
              </tr>
            )}) : <tr><td colSpan={4} className="p-10 text-center text-slate-400">Bu tabloda henüz kayıt yok.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
       
       {/* 1. ONAY BEKLEYEN İŞLER BÖLÜMÜ */}
       <div>
         <div className="flex justify-between items-center mb-3">
           <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
             Yönetici Onayı Bekleyen İşler
           </h3>
           <div className="flex gap-2">
             <button onClick={() => setFinanceModal({ isOpen: true, type: 'Gelir' })} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-emerald-100 transition-colors">
               <Plus size={14} strokeWidth={3} /> Manuel Gelir İşle
             </button>
             <button onClick={() => setFinanceModal({ isOpen: true, type: 'Gider' })} className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-rose-100 transition-colors">
               <Plus size={14} strokeWidth={3} /> Gider / Fiş İşle
             </button>
           </div>
         </div>
         <div className="bg-amber-50/50 rounded-xl border border-amber-200 shadow-sm overflow-hidden mb-8">
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

       {/* TABLOLAR BÖLÜMÜ */}
       {renderFinanceTable("Tüm Hesap Hareketleri", localFinances)}
       {renderFinanceTable("Sadece Gelirler", localFinances.filter(f => f.type === 'Gelir'))}
       {renderFinanceTable("Sadece Giderler", localFinances.filter(f => f.type === 'Gider'))}

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
                          placeholder={financeModal.type === 'Gelir' ? 'Örn: Bakım, Parça' : 'Örn: Kırtasiye, Yakıt'} 
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

       {/* İŞ DETAYI GÖSTERİM MODALI */}
       {selectedJobDetail && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">İş Kaydı Detayı</h2>
                  <div className="text-xs text-slate-500 mt-0.5">Bu gelir aşağıdaki işlemden oluşturuldu</div>
                </div>
                <button onClick={() => setSelectedJobDetail(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-md"><X size={16} /></button>
              </div>
              
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Müşteri / Firma</div>
                  <div className="text-sm font-semibold text-slate-800">{selectedJobDetail.customer_name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">İş Türü</div>
                  <div className="text-sm font-medium text-slate-800">{selectedJobDetail.work_type}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Planlanan Tarih</div>
                  <div className="text-sm font-medium text-slate-800">{selectedJobDetail.scheduled_date || 'Tarih Belirtilmedi'}</div>
                </div>
                {selectedJobDetail.details && selectedJobDetail.details.note && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Sahadan Notlar</div>
                    <div className="text-xs font-medium text-slate-700 bg-white p-2 border border-slate-200 rounded-md mt-1">{selectedJobDetail.details.note}</div>
                  </div>
                )}
              </div>
            </div>
         </div>
       )}
    </div>
  );
}