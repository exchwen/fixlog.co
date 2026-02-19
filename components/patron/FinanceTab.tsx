'use client';

import React, { useState, useEffect } from 'react';
// YENİ: WifiOff eklendi
import { Plus, X, Loader2, ArrowDownRight, ArrowUpRight, Trash2, Download, Eye, Calendar, Clock, Filter, WifiOff } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function FinanceTab({ data }: any) {
  const params = useParams();
  const router = useRouter();
  const activeSlug = params?.slug || localStorage.getItem('companySlug');
  
  // Gelir / Gider Modalı State'leri
  const [financeModal, setFinanceModal] = useState<{isOpen: boolean, type: 'Gelir' | 'Gider'}>({ isOpen: false, type: 'Gider' });
  const [financeItems, setFinanceItems] = useState([{ name: '', qty: '1' }]);
  const [financeAmount, setFinanceAmount] = useState('');
  const [isSavingFinance, setIsSavingFinance] = useState(false);

  // YENİ: Çevrimdışı kontrolü için State
  const [isOffline, setIsOffline] = useState(false);

  // Filtre State'leri (Her tablo için ayrı tutuluyor)
  const [timeFilters, setTimeFilters] = useState<any>({
    'Tüm Hesap Hareketleri': 'Tümü',
    'Sadece Gelirler': 'Tümü',
    'Sadece Giderler': 'Tümü'
  });

  // Özel Tarih Aralığı State'leri
  const [customDateRanges, setCustomDateRanges] = useState<any>({
    'Tüm Hesap Hareketleri': { start: '', end: '' },
    'Sadece Gelirler': { start: '', end: '' },
    'Sadece Giderler': { start: '', end: '' }
  });

  // İş Detayı Gösterim Modalı State'i
  const [selectedJobDetail, setSelectedJobDetail] = useState<any>(null);

  // Ekranda anında göstermek için yerel (Local) State'ler
  const [localFinances, setLocalFinances] = useState(data?.finances || []);
  const [localJobs, setLocalJobs] = useState(data?.jobs || []);

  useEffect(() => {
    setLocalFinances(data?.finances || []);
    setLocalJobs(data?.jobs || []);
  }, [data]);

  // YENİ: İnternet durumunu dinleyen useEffect
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addItemRow = () => setFinanceItems([...financeItems, { name: '', qty: '1' }]);
  const removeItemRow = (idx: number) => setFinanceItems(financeItems.filter((_: any, i: number) => i !== idx));
  const handleItemChange = (idx: number, field: string, val: string) => {
    const newItems = [...financeItems];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setFinanceItems(newItems);
  };

  const handleAddFinanceRecord = async () => {
    const description = financeItems
      .filter((i: any) => i.name.trim() !== '')
      .map((i: any) => `${i.qty}x ${i.name}`)
      .join('\n');

    if(!description || !financeAmount) return alert("Lütfen kalemleri ve toplam tutarı eksiksiz giriniz.");
    setIsSavingFinance(true);
    
    const endpoint = financeModal.type === 'Gelir' ? 'add-income' : 'add-expense';
    const bodyData = { slug: activeSlug, description, amount: parseFloat(financeAmount) };
    
    // YENİ: Her durumda arayüze (Local State) anında ekle ki kullanıcı beklemesin
    const newRecord = {
        id: Date.now().toString(),
        description,
        amount: parseFloat(financeAmount),
        type: financeModal.type,
        created_at: new Date().toISOString()
    };

    try {
      const res = await fetch(`https://backend.isdokumu.workers.dev/${endpoint}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        setLocalFinances([newRecord, ...localFinances]);
        closeFinanceModal();
        router.refresh(); 
      } else {
        alert("Kayıt Başarısız! Lütfen Cloudflare bağlantınızı kontrol edin.");
      }
    } catch (e) { 
      // YENİ: VERİTABANI HATASI VEYA BAĞLANTI SORUNU İÇİN CACHE SİSTEMİ (OFFLINE QUEUE)
      console.warn("İnternet bağlantısı yok veya sunucuya ulaşılamadı. Finans işlemi kuyruğa alındı.");
      
      const pending = JSON.parse(localStorage.getItem(`offline_actions_${activeSlug}`) || '[]');
      pending.push({ endpoint, body: bodyData, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_actions_${activeSlug}`, JSON.stringify(pending));
      
      // Local state'e ekleyip modalı kapat, kullanıcıyı mağdur etme
      setLocalFinances([newRecord, ...localFinances]);
      closeFinanceModal();
      
      alert("İnternet bağlantınız yok. İşlem cihazınıza kaydedildi, bağlantı geldiğinde otomatik olarak sisteme aktarılacaktır.");
    } finally {
      setIsSavingFinance(false); 
    }
  };

  const closeFinanceModal = () => {
    setFinanceModal({ isOpen: false, type: 'Gider' });
    setFinanceItems([{ name: '', qty: '1' }]);
    setFinanceAmount('');
  };

  // İSTEMCİ TARAFINDA EXCEL ÇIKTISI
  const exportToExcel = (tableData: any[], title: string) => {
    const rows = tableData.map((f: any) => {
      const dateObj = new Date(f.created_at);
      const dateStr = dateObj.toLocaleDateString('tr-TR');
      const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      return {
        'İşlem Tarihi': dateStr,
        'İşlem Saati': timeStr,
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

  // ZAMAN FİLTRESİ UYGULAMA FONKSİYONU
  const applyTimeFilter = (data: any[], filterValue: string, title: string) => {
    if (filterValue === 'Tümü') return data;
    
    const now = new Date();
    return data.filter((item: any) => {
      const itemDate = new Date(item.created_at);
      
      if (filterValue === 'Bugün') {
        return itemDate.toDateString() === now.toDateString();
      }
      if (filterValue === 'Bu Ay') {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      }
      if (filterValue === 'Bu Yıl') {
        return itemDate.getFullYear() === now.getFullYear();
      }
      if (filterValue === 'Özel Tarih') {
        const range = customDateRanges[title];
        const itemTime = itemDate.getTime();
        
        const start = range.start ? new Date(range.start).setHours(0, 0, 0, 0) : 0;
        const end = range.end ? new Date(range.end).setHours(23, 59, 59, 999) : Infinity;
        
        return itemTime >= start && itemTime <= end;
      }
      return true;
    });
  };

  // 3 FARKLI TABLOYU RENDER EDEN FONKSİYON
  const renderFinanceTable = (title: string, rawData: any[]) => {
    const currentFilter = timeFilters[title] || 'Tümü';
    const filteredData = applyTimeFilter(rawData, currentFilter, title);

    return (
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* ÖZEL TARİH SEÇİCİLER (Sadece "Özel Tarih" seçilirse görünür) */}
            {currentFilter === 'Özel Tarih' && (
              <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-md shadow-sm px-2 py-1.5 animate-in fade-in slide-in-from-right-4">
                <input 
                  type="date" 
                  className="text-xs text-slate-600 outline-none bg-transparent font-medium cursor-pointer"
                  value={customDateRanges[title].start}
                  onChange={e => setCustomDateRanges({...customDateRanges, [title]: {...customDateRanges[title], start: e.target.value}})}
                />
                <span className="text-slate-300 font-bold">-</span>
                <input 
                  type="date" 
                  className="text-xs text-slate-600 outline-none bg-transparent font-medium cursor-pointer"
                  value={customDateRanges[title].end}
                  onChange={e => setCustomDateRanges({...customDateRanges, [title]: {...customDateRanges[title], end: e.target.value}})}
                />
              </div>
            )}

            {/* FİLTRELEME MENÜSÜ */}
            <div className={`relative flex items-center bg-white border rounded-md shadow-sm overflow-hidden transition-colors ${currentFilter === 'Özel Tarih' ? 'border-blue-400 ring-1 ring-blue-400/20' : 'border-slate-200'}`}>
              <div className={`pl-2.5 ${currentFilter === 'Tümü' ? 'text-slate-400' : 'text-blue-500'}`}><Filter size={14} /></div>
              <select 
                className="bg-transparent text-slate-700 px-2 py-1.5 text-xs font-semibold outline-none cursor-pointer"
                value={currentFilter}
                onChange={(e) => {
                  setTimeFilters({...timeFilters, [title]: e.target.value});
                  // Farklı filtre seçilince tarihleri sıfırla
                  if (e.target.value !== 'Özel Tarih') {
                    setCustomDateRanges({...customDateRanges, [title]: { start: '', end: '' }});
                  }
                }}
              >
                <option value="Tümü">Tüm Zamanlar</option>
                <option value="Bugün">Bugün</option>
                <option value="Bu Ay">Bu Ay</option>
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Özel Tarih">Özel Tarih Aralığı...</option>
              </select>
            </div>

            {/* EXCEL BUTONU */}
            <button 
              onClick={() => exportToExcel(filteredData, title)} 
              // YENİ: active:scale-95 eklendi
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-all active:scale-95 shadow-sm"
            >
              <Download size={14} /> Excel İndir
            </button>
          </div>
        </div>
        
        {/* DİKEY ÇİZGİLİ VE ZEBRA DESENLİ TABLO */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-left text-xs relative border-collapse min-w-[600px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-5 py-4 w-1/2 border-r border-slate-200 last:border-r-0 whitespace-nowrap">Açıklama (Kalemler)</th>
                  <th className="px-5 py-4 border-r border-slate-200 last:border-r-0 whitespace-nowrap">Tarih ve Saat</th>
                  <th className="px-5 py-4 border-r border-slate-200 last:border-r-0 whitespace-nowrap">Miktar (₺)</th>
                  <th className="px-5 py-4 text-right border-r border-slate-200 last:border-r-0 whitespace-nowrap">Tip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? filteredData.map((f: any, index: number) => {
                  const relatedJob = localJobs.find((j: any) => f.type === 'Gelir' && j.status === 'Tamamlandı' && f.description.includes(j.customer_name));
                  const descriptionItems = f.description.split(/,|\n/).map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                  const dateObj = new Date(f.created_at);

                  return (
                  <tr key={f.id} className="hover:bg-blue-50/30 transition-colors group even:bg-slate-50/50">
                    <td className="px-5 py-4 align-top border-r border-slate-100 last:border-r-0">
                      <div className="flex flex-col gap-1.5">
                        {descriptionItems.map((descItem: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5"></span>
                             <span className="font-medium text-slate-700 leading-relaxed">{descItem}</span>
                          </div>
                        ))}
                      </div>
                      
                      {relatedJob && (
                        <button 
                          onClick={() => setSelectedJobDetail(relatedJob)} 
                          className="mt-3 text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1.5 rounded border border-blue-100 hover:bg-blue-100 flex items-center gap-1.5 transition-colors w-max shadow-sm"
                        >
                          <Eye size={12} /> İş Kaydını İncele
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top border-r border-slate-100 last:border-r-0">
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5"><Calendar size={12} className="text-slate-400"/> {dateObj.toLocaleDateString('tr-TR')}</div>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 ml-0.5"><Clock size={11} className="text-slate-400"/> {dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </td>
                    <td className={`px-5 py-4 font-extrabold align-top text-sm border-r border-slate-100 last:border-r-0 ${f.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <div className="flex items-center gap-1">
                        {f.type === 'Gelir' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        ₺{f.amount.toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right align-top border-r border-slate-100 last:border-r-0">
                      <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold border ${f.type === 'Gelir' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'}`}>{f.type}</span>
                    </td>
                  </tr>
                )}) : <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-medium">Bu filtreye uygun kayıt bulunmuyor.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 relative pb-10">
       
       <div className="flex justify-between items-center mb-6">
         <div>
           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Finans ve Kasa Yönetimi</h2>
           <p className="text-xs font-medium text-slate-500 mt-1">İşletmenizin tüm gelir ve gider hareketlerini buradan takip edebilirsiniz.</p>
         </div>
         <div className="flex gap-2">
           {/* YENİ: active:scale-95 eklendi */}
           <button onClick={() => setFinanceModal({ isOpen: true, type: 'Gelir' })} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-emerald-100 transition-all active:scale-95">
             <Plus size={14} strokeWidth={3} /> Manuel Gelir İşle
           </button>
           {/* YENİ: active:scale-95 eklendi */}
           <button onClick={() => setFinanceModal({ isOpen: true, type: 'Gider' })} className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-rose-100 transition-all active:scale-95">
             <Plus size={14} strokeWidth={3} /> Gider / Fiş İşle
           </button>
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
                <h2 className={`text-lg font-extrabold flex items-center gap-2 ${financeModal.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {financeModal.type === 'Gelir' ? 'Yeni Gelir Ekle' : 'Gider / Fiş İşle'}
                  
                  {/* DÜZELTİLEN KISIM: İkon span içerisine alındı */}
                  {isOffline && (
                    <span title="Çevrimdışı Mod" className="flex items-center">
                      <WifiOff size={16} className="text-amber-500" />
                    </span>
                  )}
                  
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
              
              <button 
                disabled={isSavingFinance} 
                className={`w-full text-white py-3 rounded-md font-bold text-sm mt-6 flex justify-center items-center transition-all shadow-md active:scale-95 ${financeModal.type === 'Gelir' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`} 
                onClick={handleAddFinanceRecord}
              >
                {isSavingFinance ? <Loader2 className="animate-spin" size={16} /> : (
                  isOffline ? 'Kuyruğa Al ve Kaydet' : (financeModal.type === 'Gelir' ? 'Geliri Kasaya İşle' : 'Gideri Kasadan Düş')
                )}
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