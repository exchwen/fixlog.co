'use client';

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, X, Loader2, ArrowDownRight, ArrowUpRight, Trash2, Download, Eye, Calendar, Clock } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

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
  const removeItemRow = (idx: number) => setFinanceItems(financeItems.filter((_: any, i: number) => i !== idx));
  const handleItemChange = (idx: number, field: string, val: string) => {
    const newItems = [...financeItems];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setFinanceItems(newItems);
  };

  const handleAddFinanceRecord = async () => {
    // VİRGÜL YERİNE \n (ALT SATIR) KULLANILARAK BİRLEŞTİRİLDİ
    const description = financeItems
      .filter((i: any) => i.name.trim() !== '')
      .map((i: any) => `${i.qty}x ${i.name}`)
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

  // İSTEMCİ TARAFINDA SIFIR MALİYETLİ GERÇEK EXCEL (.XLSX) ÇIKTISI ALMA
  const exportToExcel = (tableData: any[], title: string) => {
    const rows = tableData.map((f: any) => {
      const dateObj = new Date(f.created_at);
      const dateStr = dateObj.toLocaleDateString('tr-TR');
      const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      return {
        'İşlem Tarihi': dateStr,
        'İşlem Saati': timeStr,
        // Excel içinde alt satırlar düzgün görünmesi için \n leri tire ile ayırıyoruz
        'Açıklama / Kalemler': f.description.replace(/\n|,/g, ' - '), 
        'Miktar (TL)': f.amount,
        'İşlem Tipi': f.type
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finans Raporu");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_Rapor.xlsx`);
  };

  // 3 FARKLI TABLOYU TEKRAR TEKRAR YAZMAMAK İÇİN OLUŞTURDUĞUMUZ RENDER FONKSİYONU
  const renderFinanceTable = (title: string, tableData: any[]) => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button 
          onClick={() => exportToExcel(tableData, title)} 
          className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors shadow-sm"
        >
          <Download size={14} /> Excel İndir (.xlsx)
        </button>
      </div>
      
      {/* SCROLL MANTIĞI EKLENDİ (max-h ve overflow) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
          <table className="w-full text-left text-xs relative">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-4 w-1/2">Açıklama (Kalemler)</th>
                <th className="px-5 py-4">Tarih ve Saat</th>
                <th className="px-5 py-4">Miktar (₺)</th>
                <th className="px-5 py-4 text-right">Tip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableData.length > 0 ? tableData.map((f: any) => {
                const relatedJob = localJobs.find((j: any) => f.type === 'Gelir' && j.status === 'Tamamlandı' && f.description.includes(j.customer_name));
                
                // Eski virgüllü kayıtları ve yeni \n kayıtları akıllıca algılayıp alt alta listeye çevirme
                const descriptionItems = f.description.split(/,|\n/).map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                const dateObj = new Date(f.created_at);

                return (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-4 align-top">
                    {/* KALEMLERİ ALT ALTA LİSTELEME */}
                    <div className="flex flex-col gap-1.5">
                      {descriptionItems.map((descItem: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5"></span>
                           <span className="font-medium text-slate-700 leading-relaxed">{descItem}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* EŞLEŞEN İŞ VARSA BUTONU GÖSTER */}
                    {relatedJob && (
                      <button 
                        onClick={() => setSelectedJobDetail(relatedJob)} 
                        className="mt-3 text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1.5 rounded border border-blue-100 hover:bg-blue-100 flex items-center gap-1.5 transition-colors w-max shadow-sm"
                      >
                        <Eye size={12} /> İş Kaydını İncele
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5"><Calendar size={12} className="text-slate-400"/> {dateObj.toLocaleDateString('tr-TR')}</div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 ml-0.5"><Clock size={11} className="text-slate-400"/> {dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </td>
                  <td className={`px-5 py-4 font-bold align-top text-sm ${f.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <div className="flex items-center gap-1">
                      {f.type === 'Gelir' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      ₺{f.amount.toLocaleString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right align-top">
                    <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold border ${f.type === 'Gelir' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'}`}>{f.type}</span>
                  </td>
                </tr>
              )}) : <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-medium">Bu tabloda henüz kayıt bulunmuyor.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 relative pb-10">
       
       {/* 1. ONAY BEKLEYEN İŞLER BÖLÜMÜ */}
       <div>
         <div className="flex justify-between items-center mb-4">
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
         <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200 shadow-sm overflow-hidden mb-8">
           <table className="w-full text-left text-xs">
             <thead className="bg-amber-100/80 text-amber-800 font-semibold border-b border-amber-200">
               <tr><th className="px-5 py-4">Müşteri / İş</th><th className="px-5 py-4">Tarih</th><th className="px-5 py-4 w-48">Fiyat Gir (₺)</th><th className="px-5 py-4 text-right">İşlem</th></tr>
             </thead>
             <tbody className="divide-y divide-amber-100/50">
               {pendingJobs.length > 0 ? pendingJobs.map((j: any) => (
                 <tr key={j.id} className="hover:bg-amber-100/30 transition-colors">
                   <td className="px-5 py-4"><div className="font-bold text-slate-800 text-sm mb-0.5">{j.customer_name}</div><div className="text-[10px] font-medium text-slate-500 uppercase">{j.work_type}</div></td>
                   <td className="px-5 py-4 font-medium text-slate-600">{j.scheduled_date || 'Tarihsiz'}</td>
                   <td className="px-5 py-4">
                     <input type="number" placeholder="Örn: 1500" className="w-full px-3 py-2 border border-amber-200 rounded-md outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 bg-white shadow-sm transition-all" value={jobPrices[j.id] || ''} onChange={e => setJobPrices({...jobPrices, [j.id]: e.target.value})} />
                   </td>
                   <td className="px-5 py-4 text-right">
                     <button onClick={() => handleApproveJob(j)} disabled={isProcessing === j.id} className="bg-emerald-600 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-md disabled:opacity-50">
                       {isProcessing === j.id ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle size={14} /> Onayla & Gelir Yaz</>}
                     </button>
                   </td>
                 </tr>
               )) : <tr><td colSpan={4} className="p-12 text-center text-amber-600/70 font-semibold">Onay bekleyen iş bulunmuyor. Harika!</td></tr>}
             </tbody>
           </table>
         </div>
       </div>

       {/* TABLOLAR BÖLÜMÜ */}
       {renderFinanceTable("Tüm Hesap Hareketleri", localFinances)}
       {renderFinanceTable("Sadece Gelirler", localFinances.filter((f: any) => f.type === 'Gelir'))}
       {renderFinanceTable("Sadece Giderler", localFinances.filter((f: any) => f.type === 'Gider'))}

       {/* DİNAMİK GELİR / GİDER EKLEME MODALI */}
       {financeModal.isOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg font-extrabold ${financeModal.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {financeModal.type === 'Gelir' ? 'Yeni Gelir Ekle' : 'Gider / Fiş İşle'}
                </h2>
                <button onClick={closeFinanceModal} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-md transition-colors"><X size={18} /></button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-2.5 uppercase tracking-wider">
                    {financeModal.type === 'Gelir' ? 'SATILAN / YAPILAN KALEMLER' : 'ALINAN / HARCANAN KALEMLER'}
                  </label>
                  <div className="space-y-2.5">
                    {financeItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input 
                          className={`flex-[3] px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400 focus:ring-2 focus:ring-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400/20 shadow-sm transition-all`} 
                          placeholder={financeModal.type === 'Gelir' ? 'Örn: Bakım Ücreti, Parça' : 'Örn: Kırtasiye, Yakıt Fişi'} 
                          value={item.name} 
                          onChange={e => handleItemChange(index, 'name', e.target.value)} 
                        />
                        <input 
                          type="number" 
                          className={`flex-1 px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400 focus:ring-2 focus:ring-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400/20 text-center shadow-sm transition-all`} 
                          placeholder="Adet" 
                          value={item.qty} 
                          onChange={e => handleItemChange(index, 'qty', e.target.value)} 
                        />
                        {index > 0 && (
                          <button onClick={() => removeItemRow(index)} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-md transition-colors"><Trash2 size={14} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addItemRow} className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 w-full py-2.5 border border-dashed border-blue-300 rounded-md bg-blue-50/50 hover:bg-blue-50 transition-colors justify-center">
                    <Plus size={14} strokeWidth={3} /> Yeni Satır Ekle
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">TOPLAM TUTAR (₺)</label>
                  <input 
                    type="number" 
                    className={`w-full px-3 py-2.5 border border-slate-200 rounded-md text-sm font-bold outline-none focus:border-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400 focus:ring-2 focus:ring-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400/20 shadow-sm transition-all`} 
                    placeholder="0.00" 
                    value={financeAmount} 
                    onChange={e => setFinanceAmount(e.target.value)} 
                  />
                </div>
              </div>
              
              <button disabled={isSavingFinance} className={`w-full text-white py-3 rounded-md font-bold text-sm mt-6 flex justify-center items-center transition-all shadow-md ${financeModal.type === 'Gelir' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`} onClick={handleAddFinanceRecord}>
                {isSavingFinance ? <Loader2 className="animate-spin" size={16} /> : (financeModal.type === 'Gelir' ? 'Geliri Kasaya İşle' : 'Gideri Kasadan Düş')}
              </button>
            </div>
         </div>
       )}

       {/* İŞ DETAYI GÖSTERİM MODALI */}
       {selectedJobDetail && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl relative">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">İş Kaydı Detayı</h2>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Bu gelir aşağıdaki işlemden oluşturuldu</div>
                </div>
                <button onClick={() => setSelectedJobDetail(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-md transition-colors"><X size={16} /></button>
              </div>
              
              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Müşteri / Firma</div>
                  <div className="text-sm font-bold text-slate-800">{selectedJobDetail.customer_name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">İş Türü</div>
                  <div className="text-sm font-semibold text-slate-700">{selectedJobDetail.work_type}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Planlanan Tarih</div>
                  <div className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                     <Calendar size={14} className="text-slate-400" /> {selectedJobDetail.scheduled_date || 'Tarih Belirtilmedi'}
                  </div>
                </div>
                {selectedJobDetail.details && selectedJobDetail.details.note && (
                  <div className="pt-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sahadan Notlar</div>
                    <div className="text-xs font-medium text-slate-700 bg-white p-3 border border-slate-200 rounded-lg shadow-sm leading-relaxed">{selectedJobDetail.details.note}</div>
                  </div>
                )}
              </div>
            </div>
         </div>
       )}
    </div>
  );
}