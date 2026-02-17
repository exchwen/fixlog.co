'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Users, Box, Wallet, Plus, ArrowUpRight, 
  CheckCircle, Clock, Calendar, TrendingUp, TrendingDown, 
  Package, AlertTriangle, ShieldCheck, Activity, User, Lock, Settings, X
} from 'lucide-react';

export default function HomeTab({ data, setShowJobModal, statusColors, setSelectedJob }: any) {

  // 1. PROFİL DOLULUK KONTROLÜ (ZORUNLU KİLİT)
  const isProfileComplete = data?.name && data?.ownerName && data?.sector && data?.address && data?.phone && data?.taxInfo;

  // STOK DETAY MODALI İÇİN STATE
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  // 2. VERİLERİ PARÇALAMA VE HESAPLAMA
  const jobs = data?.jobs || [];
  const finances = data?.finances || [];
  const stock = data?.stock || [];
  const staff = data?.staff || [];

  // İş İstatistikleri (4'lü Kutu İçin)
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j: any) => j.status === 'Tamamlandı').length;
  const pendingJobs = jobs.filter((j: any) => j.status === 'Beklemede' || j.status === 'Devam Ediyor').length;
  const plannedJobs = jobs.filter((j: any) => j.status === 'Gelecek').length;

  // Aylık Büyüme Hızı Hesaplama (Yapay Zeka)
  const { currentMonthJobs, lastMonthJobs, growthPercent, isGrowthPositive } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let currentCount = 0;
    let lastCount = 0;

    jobs.forEach((j: any) => {
      if (!j.created_at) return;
      const jobDate = new Date(j.created_at);
      if (jobDate.getFullYear() === currentYear) {
        if (jobDate.getMonth() === currentMonth) currentCount++;
        if (jobDate.getMonth() === currentMonth - 1) lastCount++;
      }
    });

    const diff = currentCount - lastCount;
    const percent = lastCount === 0 ? (currentCount > 0 ? 100 : 0) : (diff / lastCount) * 100;

    return {
      currentMonthJobs: currentCount,
      lastMonthJobs: lastCount,
      growthPercent: Math.abs(percent).toFixed(1),
      isGrowthPositive: percent >= 0
    };
  }, [jobs]);

  // Finans İstatistikleri & Son İşlemler
  const totalIncome = data?.finSummary?.income || 0;
  const totalExpense = data?.finSummary?.expense || 0;
  const netCash = totalIncome - totalExpense;
  const recentFinances = finances.slice(0, 4);

  // ZEKİ VE SAF SVG TREND GRAFİĞİ 
  const miniChartPoints = useMemo(() => {
    const chartData = [...finances].reverse().slice(-10).map((f: any) => 
      f.type === 'Gelir' ? Number(f.amount) : -Math.abs(Number(f.amount))
    );
    
    if (chartData.length === 0) return null;
    
    const max = Math.max(...chartData);
    const min = Math.min(...chartData);
    const range = max - min || 1;
    
    return chartData.map((val, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = 40 - ((val - min) / range) * 40;
      return `${x},${y}`;
    }).join(' ');
  }, [finances]);

  // Stok İstatistikleri (Kritik Seviye Uyarısı)
  const lowStockItems = stock.filter((s: any) => Number(s.quantity) <= 5);

  // EĞER PROFİL EKSİKSE KİLİT EKRANI GÖSTER
  if (!isProfileComplete) {
    return (
      <div className="relative h-[80vh] flex flex-col items-center justify-center bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-orange-400"></div>
        
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-10 flex flex-col items-center text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100 shadow-inner">
            <Lock size={32} className="text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Sistem Kilitli</h2>
          <p className="text-sm text-slate-600 mb-8 font-medium leading-relaxed">
            İşletme hesabınızı kullanmaya başlamadan önce firma ünvanı, iletişim ve adres gibi temel ayarlarınızı eksiksiz doldurmanız gerekmektedir.
          </p>
          <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 text-left space-y-2">
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
               <span className={`w-2 h-2 rounded-full ${data?.name ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> Firma Ünvanı ve Yetkili
             </div>
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
               <span className={`w-2 h-2 rounded-full ${data?.phone ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> İletişim Numarası
             </div>
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
               <span className={`w-2 h-2 rounded-full ${data?.address ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> Açık Adres Bilgisi
             </div>
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
               <span className={`w-2 h-2 rounded-full ${data?.taxInfo ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> Vergi Bilgileri
             </div>
          </div>
          <div className="text-xs font-bold text-blue-600 flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <Settings size={16} /> Lütfen sol menüden "Ayarlar" sekmesine gidin.
          </div>
        </motion.div>
      </div>
    );
  }

  // PROFİL TAMAMSA ANA EKRANI GÖSTER
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* KRİTİK STOK DETAY MODALI */}
      <AnimatePresence>
        {showLowStockModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                   <AlertTriangle size={18} className="text-amber-500" /> Kritik Stoklar
                </h3>
                <button onClick={() => setShowLowStockModal(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-md transition-colors"><X size={18} /></button>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.item_name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.supplier_name || 'Tedarikçi Kaydı Yok'}</div>
                    </div>
                    <div className="text-sm font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-md">
                      {item.quantity} <span className="text-[10px] uppercase">{item.unit_name}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowLowStockModal(false)} className="w-full mt-4 bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                Kapat
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BAŞLIK VE SİSTEM DURUMU */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Hoş Geldin, {data?.ownerName?.split(' ')[0] || 'Yönetici'} 👋
          </h2>
          <p className="text-slate-500 text-xs mt-1">Sistem üzerindeki anlık özetin aşağıdadır.</p>
        </div>
        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wide shadow-sm">
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Bulut Senkronizasyonu Aktif
        </div>
      </div>

      {/* 4'LÜ İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-300 transition-colors group">
          <div className="w-10 h-10 bg-blue-50/80 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <ClipboardList size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 leading-none mb-1">{totalJobs}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Toplam İş</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-emerald-300 transition-colors group">
          <div className="w-10 h-10 bg-emerald-50/80 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <CheckCircle size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 leading-none mb-1">{completedJobs}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Tamamlanan</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-amber-300 transition-colors group">
          <div className="w-10 h-10 bg-amber-50/80 rounded-lg flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 leading-none mb-1">{pendingJobs}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Bekleyen İşler</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-purple-300 transition-colors group">
          <div className="w-10 h-10 bg-purple-50/80 rounded-lg flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
            <Calendar size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 leading-none mb-1">{plannedJobs}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Planlanan</div>
          </div>
        </div>
      </div>

      {/* ORTA BÖLÜM: FİNANS, BÜYÜME VE STOK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL: YENİ NESİL NET KASA TASARIMI */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-800 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
           
           <div className="flex justify-between items-start mb-6 z-10 relative">
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <Wallet size={16} className="text-blue-400" />
                 <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Kasa Özeti</span>
               </div>
               <div className="text-[10px] text-slate-500 mb-1">Net Bakiye</div>
               <div className="text-3xl font-black text-white tracking-tight">₺{netCash.toLocaleString('tr-TR')}</div>
             </div>
             
             {/* YENİ SVG TREND GRAFİĞİ (Sıfır Hata) */}
             <div className="h-12 w-24 sm:w-32 opacity-80 flex items-center justify-end">
               {miniChartPoints ? (
                 <svg viewBox="-5 -5 110 50" className="w-full h-full overflow-visible">
                   <polyline
                     fill="none"
                     stroke="#3b82f6"
                     strokeWidth="4"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     points={miniChartPoints}
                   />
                 </svg>
               ) : (
                 <div className="text-slate-600 text-[10px]">Veri Yok</div>
               )}
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto z-10">
             <div className="space-y-3">
               <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between border border-white/5">
                 <div className="flex items-center gap-2"><ArrowUpRight size={14} className="text-emerald-400" /><span className="text-xs text-slate-300 font-medium">Toplam Gelir</span></div>
                 <span className="text-sm font-bold text-emerald-400">₺{totalIncome.toLocaleString('tr-TR')}</span>
               </div>
               <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between border border-white/5">
                 <div className="flex items-center gap-2"><ArrowUpRight size={14} className="text-rose-400 rotate-90" /><span className="text-xs text-slate-300 font-medium">Toplam Gider</span></div>
                 <span className="text-sm font-bold text-rose-400">₺{totalExpense.toLocaleString('tr-TR')}</span>
               </div>
             </div>

             <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 flex flex-col">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Son İşlemler</h4>
                <div className="space-y-2.5 flex-1">
                  {recentFinances.length > 0 ? recentFinances.map((f: any) => (
                    <div key={f.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${f.type === 'Gelir' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                        <div className="text-xs font-medium text-slate-200 line-clamp-1">{f.description.split('\n')[0]}</div>
                      </div>
                      <div className={`text-[11px] font-bold ${f.type === 'Gelir' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {f.type === 'Gelir' ? '+' : '-'}₺{Number(f.amount).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-slate-500 text-[10px] py-4">Henüz işlem yok.</div>
                  )}
                </div>
             </div>
           </div>
        </div>

        {/* SAĞ: PERFORMANS VE STOK */}
        <div className="space-y-4">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden h-full sm:h-[192px] flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                 <div className={`p-2 rounded-lg ${isGrowthPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {isGrowthPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                 </div>
                 <h3 className="font-bold text-slate-900 text-sm">İş Büyüme Hızı</h3>
              </div>
            </div>
            <div>
               <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-black text-slate-900">%{growthPercent}</span>
                 <span className={`text-xs font-bold ${isGrowthPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                   {isGrowthPositive ? 'Artış' : 'Düşüş'}
                 </span>
               </div>
               <p className="text-[11px] text-slate-500 mt-2 font-medium">
                 Geçen ay <b>{lastMonthJobs} iş</b> yapmıştınız. Bu ay şu ana kadar <b>{currentMonthJobs} iş</b> kaydı açıldı.
               </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden h-full sm:h-[192px] flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                 <div className={`p-2 rounded-lg ${lowStockItems.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Package size={16} />
                 </div>
                 <h3 className="font-bold text-slate-900 text-sm">Stok Uyarıları</h3>
              </div>
            </div>
            <div>
               {lowStockItems.length > 0 ? (
                 <>
                   <div className="text-2xl font-black text-slate-900">{lowStockItems.length} Parça</div>
                   <div className="flex items-center justify-between mt-2">
                     <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                       <AlertTriangle size={12} /> Kritik seviyenin altında.
                     </p>
                     <button onClick={() => setShowLowStockModal(true)} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-md text-[10px] font-bold transition-colors">
                       Detayları Gör
                     </button>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="text-xl font-black text-emerald-600">Sorun Yok</div>
                   <p className="text-[11px] text-slate-500 mt-2 font-medium">
                     Stoğu azalan (5 adetin altında) kritik parçanız yok.
                   </p>
                 </>
               )}
            </div>
          </div>

        </div>
      </div>

      {/* ALT BÖLÜM: YENİLENMİŞ SON İŞLER TABLOSU */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Son İş Emirleri ve Onay Durumu</h3>
          </div>
          <button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-all shadow-sm">
            <Plus size={14} /> Yeni İş Ata
          </button>
        </div>
        
        <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white text-slate-400 font-medium sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-3 border-b border-slate-100">Müşteri / İş</th>
                <th className="px-5 py-3 border-b border-slate-100">Personel / Onay Süreci</th>
                <th className="px-5 py-3 border-b border-slate-100">Planlanan Tarih</th>
                <th className="px-5 py-3 border-b border-slate-100 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {jobs.slice(0, 10).map((j: any) => {
                const assignedStaff = j.staff_id ? staff.find((s:any) => s.id === j.staff_id) : null;
                // İşi kimin atadığını yakalıyoruz:
                const managerName = j.details?.lastEditedBy || data?.ownerName?.split(' ')[0] || 'Yönetici';
                
                const isApproved = j.status === 'Tamamlandı';
                const staffColor = isApproved ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200';
                const managerColor = isApproved ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200';

                return (
                  <tr 
                    key={j.id} 
                    onClick={() => setSelectedJob && setSelectedJob(j)}
                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer relative"
                  >
                    <td className="px-5 py-3 align-middle">
                      <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{j.customer_name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span> {j.work_type}
                      </div>
                    </td>
                    
                    <td className="px-5 py-3 align-middle">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={12} className={isApproved ? 'text-emerald-500' : 'text-amber-500'} />
                          <span className="text-[9px] font-bold text-slate-400 uppercase w-12">Yönetici:</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${managerColor}`}>
                            {managerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User size={12} className={assignedStaff ? (isApproved ? 'text-emerald-500' : 'text-amber-500') : 'text-slate-300'} />
                          <span className="text-[9px] font-bold text-slate-400 uppercase w-12">Usta:</span>
                          {assignedStaff ? (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${staffColor}`}>
                              {assignedStaff.name}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-400">
                              Atanmadı
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 align-middle font-medium text-slate-600">
                      {j.scheduled_date || 'Anlık Kayıt'}
                    </td>
                    <td className="px-5 py-3 align-middle text-right">
                      <div className="flex items-center justify-end gap-3">
                         <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                           {j.status}
                         </span>
                         {/* Satırın üstüne gelince beliren detay oku */}
                         <div className="w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight size={14} className="text-blue-500" />
                         </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 text-xs font-medium">
                    Henüz iş emri bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
}