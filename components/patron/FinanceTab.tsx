'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, ArrowDownRight, ArrowUpRight, Trash2, Download, Eye, Calendar, Clock, Filter, WifiOff, Wallet, User } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function FinanceTab({ data, userRole = 'Patron' }: any) {
  const params = useParams();
  const router = useRouter();
  
  // URL'ye göre 100% güvenilir yol ve slug tespiti (Bilet İzolasyonu)
  const isPatronPath = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard');
  const activeSlug = params?.slug || (typeof window !== 'undefined' ? localStorage.getItem(isPatronPath ? 'patron_userSlug' : 'staff_userSlug') : '');
  
  // Gelir / Gider Modalı State'leri
  const [financeModal, setFinanceModal] = useState<{isOpen: boolean, type: 'Gelir' | 'Gider'}>({ isOpen: false, type: 'Gider' });
  const [financeItems, setFinanceItems] = useState([{ name: '', qty: '1' }]);
  const [financeAmount, setFinanceAmount] = useState('');
  const [isSavingFinance, setIsSavingFinance] = useState(false);

  // Çevrimdışı kontrolü için State
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

  // İnternet durumunu dinleyen useEffect
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
    
    // 🚀 KİM EKLEDİ BİLGİSİ
    // Patron dashboard'daysa ownerName kullanılır, staff panelindeyse mevcut personelin adı bulunur
    let currentUserName = data?.ownerName || 'Patron';
    if (!isPatronPath) {
       const currentUserToken = localStorage.getItem('staff_authToken');
       // Not: Eğer data objesinin içinde staff listesi ve mevcut staff ID varsa daha kesin bir eşleştirme yapılabilir.
       // Şimdilik genel olarak "Yönetici" veya data.staffName vs var ise onu alıyoruz.
       currentUserName = data?.staffName || 'Yönetici / Usta';
    }

    const bodyData = { 
        slug: activeSlug, 
        description, 
        amount: parseFloat(financeAmount),
        addedBy: currentUserName // 🚀 Backend'e de gönderiyoruz (Destekliyorsa kaydeder)
    };
    
    const newRecord = {
        id: Date.now().toString(),
        description,
        amount: parseFloat(financeAmount),
        type: financeModal.type,
        created_at: new Date().toISOString(),
        addedBy: currentUserName // 🚀 UI'da anında göstermek için eklendi
    };

    const token = localStorage.getItem(isPatronPath ? 'patron_authToken' : 'staff_authToken');

    try {
      const res = await fetch(`https://backend.isdokumu.workers.dev/${endpoint}`, {
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        setLocalFinances([newRecord, ...localFinances]);
        closeFinanceModal();
        if (!isPatronPath) {
            alert('İşlem başarıyla kaydedildi. Patron hesabına aktarıldı.');
        }
        router.refresh(); 
      } else {
        alert("Kayıt Başarısız! İşlem reddedildi veya bağlantınız koptu.");
      }
    } catch (e) { 
      console.warn("İnternet bağlantısı yok veya sunucuya ulaşılamadı. Finans işlemi kuyruğa alındı.");
      
      const pending = JSON.parse(localStorage.getItem(`offline_actions_${activeSlug}`) || '[]');
      pending.push({ endpoint, body: bodyData, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_actions_${activeSlug}`, JSON.stringify(pending));
      
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
        'İşlem Tipi': f.type,
        'Ekleyen Kişi': f.addedBy || 'Belirtilmedi' // 🚀 Excel çıktısına eklendi
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finans Raporu");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_Rapor.xlsx`);
  };

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

  const renderFinanceTable = (title: string, rawData: any[]) => {
    const currentFilter = timeFilters[title] || 'Tümü';
    const filteredData = applyTimeFilter(rawData, currentFilter, title);

    return (
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
            {currentFilter === 'Özel Tarih' && (
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-white border border-blue-200 rounded-xl shadow-sm px-3 py-2 animate-in fade-in slide-in-from-right-4 w-full sm:w-auto">
                <input 
                  type="date" 
                  className="text-xs text-slate-600 outline-none bg-transparent font-medium cursor-pointer w-full"
                  value={customDateRanges[title].start}
                  onChange={e => setCustomDateRanges({...customDateRanges, [title]: {...customDateRanges[title], start: e.target.value}})}
                />
                <span className="text-slate-300 font-black">-</span>
                <input 
                  type="date" 
                  className="text-xs text-slate-600 outline-none bg-transparent font-medium cursor-pointer w-full text-right sm:text-left"
                  value={customDateRanges[title].end}
                  onChange={e => setCustomDateRanges({...customDateRanges, [title]: {...customDateRanges[title], end: e.target.value}})}
                />
              </div>
            )}

            <div className={`relative flex items-center bg-white border rounded-xl shadow-sm overflow-hidden transition-colors flex-1 sm:flex-none ${currentFilter === 'Özel Tarih' ? 'border-blue-400 ring-2 ring-blue-400/20' : 'border-slate-200'}`}>
              <div className={`pl-3 ${currentFilter === 'Tümü' ? 'text-slate-400' : 'text-blue-500'}`}><Filter size={16} /></div>
              <select 
                className="bg-transparent text-slate-700 px-3 py-2.5 sm:py-2 w-full text-xs font-bold outline-none cursor-pointer appearance-none pr-8"
                value={currentFilter}
                onChange={(e) => {
                  setTimeFilters({...timeFilters, [title]: e.target.value});
                  if (e.target.value !== 'Özel Tarih') {
                    setCustomDateRanges({...customDateRanges, [title]: { start: '', end: '' }});
                  }
                }}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
              >
                <option value="Tümü">Tüm Zamanlar</option>
                <option value="Bugün">Bugün</option>
                <option value="Bu Ay">Bu Ay</option>
                <option value="Bu Yıl">Bu Yıl</option>
                <option value="Özel Tarih">Özel Tarih Aralığı...</option>
              </select>
            </div>

            <button 
              onClick={() => exportToExcel(filteredData, title)} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm sm:w-auto w-full"
            >
              <Download size={16} /> <span className="sm:hidden">Excel Olarak İndir</span><span className="hidden sm:inline">Excel İndir</span>
            </button>
          </div>
        </div>
        
        <div className="hidden md:flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-left text-xs relative border-collapse min-w-[700px]">
              <thead className="bg-slate-50 text-slate-600 font-black border-b border-slate-200 sticky top-0 z-10 shadow-sm uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-4 w-1/2 border-r border-slate-200 last:border-r-0 whitespace-nowrap">Açıklama (Kalemler)</th>
                  {/* 🚀 TABLO BAŞLIĞINA EKLENDİ */}
                  <th className="px-5 py-4 border-r border-slate-200 last:border-r-0 whitespace-nowrap">Ekleyen</th>
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
                  <tr key={f.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-5 py-4 align-top border-r border-slate-100 last:border-r-0">
                      <div className="flex flex-col gap-1.5">
                        {descriptionItems.map((descItem: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5"></span>
                             <span className="font-semibold text-slate-700 leading-relaxed">{descItem}</span>
                          </div>
                        ))}
                      </div>
                      
                      {relatedJob && (
                        <button 
                          onClick={() => setSelectedJobDetail(relatedJob)} 
                          className="mt-3 text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 flex items-center gap-1.5 transition-colors w-max shadow-sm active:scale-95"
                        >
                          <Eye size={12} /> İş Kaydını İncele
                        </button>
                      )}
                    </td>
                    {/* 🚀 TABLO HÜCRESİNE EKLENDİ */}
                    <td className="px-5 py-4 align-top border-r border-slate-100 last:border-r-0">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 border border-slate-200 px-2 py-1 rounded-md w-max">
                        <User size={12} className="text-slate-400" />
                        {f.addedBy || 'Patron / Sistem'}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top border-r border-slate-100 last:border-r-0">
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5"><Calendar size={12} className="text-slate-400"/> {dateObj.toLocaleDateString('tr-TR')}</div>
                        <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 ml-0.5 mt-0.5"><Clock size={11} className="text-slate-400"/> {dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </td>
                    <td className={`px-5 py-4 font-black align-top text-sm border-r border-slate-100 last:border-r-0 ${f.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <div className="flex items-center gap-1">
                        {f.type === 'Gelir' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        ₺{f.amount.toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right align-top border-r border-slate-100 last:border-r-0">
                      <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border ${f.type === 'Gelir' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'}`}>{f.type}</span>
                    </td>
                  </tr>
                )}) : <tr><td colSpan={5} className="p-16 text-center text-slate-400 font-medium bg-slate-50">Bu filtreye uygun finansal hareket bulunmuyor.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden flex flex-col gap-3">
          {filteredData.length > 0 ? filteredData.map((f: any) => {
            const relatedJob = localJobs.find((j: any) => f.type === 'Gelir' && j.status === 'Tamamlandı' && f.description.includes(j.customer_name));
            const descriptionItems = f.description.split(/,|\n/).map((item: string) => item.trim()).filter((item: string) => item.length > 0);
            const dateObj = new Date(f.created_at);

            return (
              <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 relative">
                
                {/* 🚀 MOBİL KART İÇİNE EKLENDİ */}
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <User size={10} /> {f.addedBy || 'Sistem'}
                </div>

                <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3 pr-24">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-1 w-max rounded-md text-[9px] font-black border uppercase tracking-wider ${f.type === 'Gelir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {f.type}
                    </span>
                    <div className="font-bold text-slate-500 text-[10px] flex items-center gap-1 mt-1">
                      <Calendar size={10} /> {dateObj.toLocaleDateString('tr-TR')} • <Clock size={10} /> {dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className={`font-black text-lg flex items-center gap-1 ${f.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {f.type === 'Gelir' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    ₺{f.amount.toLocaleString('tr-TR')}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  {descriptionItems.map((descItem: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5"></span>
                       <span className="text-xs font-semibold text-slate-700 leading-snug">{descItem}</span>
                    </div>
                  ))}
                </div>

                {relatedJob && (
                  <button 
                    onClick={() => setSelectedJobDetail(relatedJob)} 
                    className="mt-2 w-full text-xs font-bold text-blue-600 bg-blue-50 py-2.5 rounded-xl border border-blue-100 hover:bg-blue-100 flex justify-center items-center gap-2 transition-colors active:scale-95"
                  >
                    <Eye size={14} /> Bağlantılı İş Kaydını Görüntüle
                  </button>
                )}
              </div>
            );
          }) : (
            <div className="bg-slate-50 p-10 rounded-2xl border-2 border-dashed border-slate-200 text-center font-medium text-slate-400 text-sm">
              Bu filtreye uygun hareket bulunmuyor.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative pb-10 ${!isPatronPath && userRole === 'Yönetici' ? 'flex flex-col items-center justify-center min-h-[70vh] px-4' : 'space-y-6 sm:space-y-8'}`}>
       
       {!isPatronPath && userRole === 'Yönetici' ? (
         <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl text-center flex flex-col items-center gap-6 mt-10">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner border border-blue-100">
               <Wallet size={32} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Finans Bildirimi</h2>
               <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                  Sahadaki veya işletmedeki gelir/gider harcamalarını buradan patron hesabına direkt olarak işleyebilirsiniz. Raporları sadece Patron görebilir.
               </p>
            </div>
            <div className="flex flex-col w-full gap-3 mt-2">
               <button onClick={() => setFinanceModal({ isOpen: true, type: 'Gelir' })} className="w-full bg-emerald-500 text-white border border-emerald-600 px-4 py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95">
                 <Plus size={20} strokeWidth={3} /> Gelir Bildir (Kasaya Ekle)
               </button>
               <button onClick={() => setFinanceModal({ isOpen: true, type: 'Gider' })} className="w-full bg-rose-50 text-rose-600 border border-rose-200 px-4 py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 shadow-sm hover:bg-rose-100 transition-all active:scale-95">
                 <Plus size={20} strokeWidth={3} /> Gider Fişi Bildir (Kasadan Düş)
               </button>
            </div>
         </div>
       ) : (
         <>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-0 sm:bg-transparent rounded-3xl border sm:border-none border-slate-200 shadow-sm sm:shadow-none">
             <div>
               <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Finans ve Kasa Yönetimi</h2>
               <p className="text-xs font-medium text-slate-500 mt-1">Tüm gelir ve gider hareketlerini buradan takip edebilirsiniz.</p>
             </div>
             <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2.5">
               <button onClick={() => setFinanceModal({ isOpen: true, type: 'Gelir' })} className="w-full sm:w-auto bg-emerald-500 text-white border border-emerald-600 px-4 py-3 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95">
                 <Plus size={16} strokeWidth={3} /> Gelir İşle
               </button>
               <button onClick={() => setFinanceModal({ isOpen: true, type: 'Gider' })} className="w-full sm:w-auto bg-rose-50 text-rose-600 border border-rose-200 px-4 py-3 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-rose-100 transition-all active:scale-95">
                 <Plus size={16} strokeWidth={3} /> Gider / Fiş İşle
               </button>
             </div>
           </div>

           {renderFinanceTable("Tüm Hesap Hareketleri", localFinances)}
           {renderFinanceTable("Sadece Gelirler", localFinances.filter((f: any) => f.type === 'Gelir'))}
           {renderFinanceTable("Sadece Giderler", localFinances.filter((f: any) => f.type === 'Gider'))}
         </>
       )}

       {financeModal.isOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 shrink-0">
                <h2 className={`text-xl font-black flex items-center gap-2 ${financeModal.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {financeModal.type === 'Gelir' ? 'Kasaya Gelir Ekle' : 'Kasadan Gider Çık'}
                  
                  {isOffline && (
                    <span title="Çevrimdışı Mod" className="flex items-center bg-amber-50 p-1.5 rounded-md border border-amber-200">
                      <WifiOff size={16} className="text-amber-500" />
                    </span>
                  )}
                  
                </h2>
                <button onClick={closeFinanceModal} className="text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>
              
              <div className="space-y-6 flex-1">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">
                    {financeModal.type === 'Gelir' ? 'SATILAN / YAPILAN KALEMLER' : 'ALINAN / HARCANAN KALEMLER'}
                  </label>
                  <div className="space-y-3">
                    {financeItems.map((item, index) => (
                      <div key={index} className="flex gap-2 relative group">
                        <input 
                          className={`flex-[3] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400 focus:ring-2 focus:ring-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400/20 transition-all`} 
                          placeholder={financeModal.type === 'Gelir' ? 'Örn: Bakım, Parça...' : 'Örn: Kırtasiye, Yakıt...'} 
                          value={item.name} 
                          onChange={e => handleItemChange(index, 'name', e.target.value)} 
                        />
                        <input 
                          type="number" 
                          className={`w-20 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400 focus:ring-2 focus:ring-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400/20 text-center transition-all`} 
                          placeholder="Adet" 
                          value={item.qty} 
                          onChange={e => handleItemChange(index, 'qty', e.target.value)} 
                        />
                        {index > 0 && (
                          <button onClick={() => removeItemRow(index)} className="absolute -right-3 -top-3 p-1.5 text-rose-500 bg-white border border-rose-100 shadow-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50"><Trash2 size={12} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addItemRow} className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 w-full py-3.5 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-all justify-center active:scale-95">
                    <Plus size={16} strokeWidth={3} /> Yeni Kalem Ekle
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-100 bg-slate-50 -mx-6 px-6 pb-2">
                  <label className="text-xs font-black text-slate-500 block mb-2 uppercase tracking-widest">TOPLAM TUTAR (₺)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">₺</span>
                    <input 
                      type="number" 
                      className={`w-full pl-10 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-xl font-black outline-none focus:border-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400 focus:ring-4 focus:ring-${financeModal.type === 'Gelir' ? 'emerald' : 'rose'}-400/20 shadow-inner transition-all`} 
                      placeholder="0.00" 
                      value={financeAmount} 
                      onChange={e => setFinanceAmount(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              
              <button 
                disabled={isSavingFinance} 
                className={`w-full text-white py-4 rounded-xl font-black text-base mt-6 flex justify-center items-center transition-all shadow-lg active:scale-95 disabled:opacity-70 ${financeModal.type === 'Gelir' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'}`} 
                onClick={handleAddFinanceRecord}
              >
                {isSavingFinance ? <Loader2 className="animate-spin" size={20} /> : (
                  isOffline ? 'Kuyruğa Al ve Kaydet' : (financeModal.type === 'Gelir' ? 'KASAYA GELİR İŞLE' : 'KASADAN GİDER ÇIK')
                )}
              </button>
            </div>
         </div>
       )}

       {selectedJobDetail && isPatronPath && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-0 shadow-2xl relative overflow-hidden flex flex-col">
              
              <div className="bg-slate-900 p-5 flex justify-between items-start text-white">
                <div>
                  <h2 className="text-xl font-black tracking-tight">İş Kaydı Detayı</h2>
                  <div className="text-xs font-medium text-blue-200 mt-1">Bu işlemden sağlanan gelir</div>
                </div>
                <button onClick={() => setSelectedJobDetail(null)} className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all active:scale-95"><X size={18} /></button>
              </div>
              
              <div className="p-6 space-y-5 bg-slate-50">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Müşteri / Firma</div>
                  <div className="text-base font-black text-slate-800">{selectedJobDetail.customer_name}</div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">İş Türü</div>
                    <div className="text-sm font-bold text-slate-700">{selectedJobDetail.work_type}</div>
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tarih</div>
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                       <Calendar size={14} className="text-blue-500" /> {selectedJobDetail.scheduled_date ? selectedJobDetail.scheduled_date.split('-').reverse().join('.') : '-'}
                    </div>
                  </div>
                </div>

                {selectedJobDetail.details && selectedJobDetail.details.note && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sahadan Notlar</div>
                    <div className="text-sm font-medium text-slate-600 italic border-l-2 border-blue-400 pl-3 leading-relaxed">"{selectedJobDetail.details.note}"</div>
                  </div>
                )}
              </div>
            </div>
         </div>
       )}
    </div>
  );
}