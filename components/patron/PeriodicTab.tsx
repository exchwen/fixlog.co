'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Bot, AlertTriangle, CheckCircle2, Clock, User, Building2, MapPin, Wallet, Power, Settings2, ShieldCheck } from 'lucide-react';

export default function PeriodicTab({ data, handleAction, statusColors, setSelectedAsset }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tümü');

  const assets = data?.assets || [];
  const staff = data?.staff?.filter((s: any) => s.role !== 'Yönetici') || [];
  
  // İstatistikler
  const totalAssets = assets.length;
  // Şimdilik sistemde periyodik bakım atanan/tamamlananları simüle ediyoruz.
  // Gerçek veriler geldiğinde buraları data.jobs üzerinden hesaplayacağız.
  const completedThisMonth = Math.floor(totalAssets * 0.45); 
  const remainingThisMonth = totalAssets - completedThisMonth;
  const completionPercentage = totalAssets === 0 ? 0 : Math.round((completedThisMonth / totalAssets) * 100);

  // Akıllı Yönetici Asistanı Hesaplaması
  const staffCount = staff.length || 1;
  const assetsPerStaff = Math.round(totalAssets / staffCount);
  const isOverloaded = assetsPerStaff > 150; // Örneğin bir personel ayda 150 binadan fazlasına bakıyorsa uyarı verelim

  const filteredAssets = assets.filter((a: any) => {
      const matchSearch = (a.apartmentName || a.apartment_name || a.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      // Bölge filtresi eklenecekse buraya dahil edilebilir
      return matchSearch;
  });

  const toggleAutopilot = async (asset: any) => {
      const newStatus = asset.is_autopilot ? 0 : 1;
      await handleAction('update-asset', { id: asset.id, is_autopilot: newStatus });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* 1. AKILLI YÖNETİCİ ASİSTANI (Büyüyen Firmalar İçin) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden border border-slate-700">
        <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none">
            <Bot size={150} />
        </div>
        <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl shrink-0 border border-blue-500/30 shadow-inner">
                <Bot size={28} />
            </div>
            <div>
                <h3 className="text-white font-black text-lg mb-1 flex items-center gap-2">Akıllı Asistan Analizi</h3>
                {isOverloaded ? (
                    <div className="text-blue-100 text-sm leading-relaxed">
                        <span className="font-bold text-amber-400">İş Yükü Uyarısı: </span> 
                        Şu anda {totalAssets} varlığınız ve {staffCount} saha personeliniz bulunuyor. Personel başına düşen aylık ortalama bakım sayısı <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">{assetsPerStaff}</span>. Verimliliğin düşmemesi ve işlerin yetişmesi için <strong>yeni personel almayı düşünebilirsiniz.</strong>
                    </div>
                ) : (
                    <div className="text-blue-100 text-sm leading-relaxed">
                        <span className="font-bold text-emerald-400">Her Şey Yolunda: </span> 
                        {totalAssets} varlık için {staffCount} personelinizin iş yükü dengeli görünüyor. Personel başına ortalama {assetsPerStaff} bakım düşüyor. Sisteminiz otopilotta kusursuz ilerliyor.
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 2. VERİ ÇUBUKLARI (Dashboard Özet) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Aylık İlerleme</div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><RefreshCw size={18} /></div>
              </div>
              <div className="text-2xl font-black text-slate-800 mb-2">%{completionPercentage}</div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${completionPercentage}%` }} transition={{ duration: 1 }} className="bg-blue-600 h-2 rounded-full"></motion.div>
              </div>
              <div className="text-xs font-semibold text-slate-500">{completedThisMonth} Tamamlandı / {totalAssets} Toplam</div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Bekleyen Bakım</div>
                      <div className="text-3xl font-black text-amber-600">{remainingThisMonth}</div>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={24} /></div>
              </div>
              <div className="text-xs font-bold text-slate-500 mt-4 flex items-center gap-1.5"><AlertTriangle size={14} className="text-amber-500"/> Sistem sırası geldikçe atayacak.</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Otopilot Modu</div>
                      <div className="text-3xl font-black text-emerald-600">{assets.filter((a:any) => a.is_autopilot === 1).length}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Power size={24} /></div>
              </div>
              <div className="text-xs font-bold text-slate-500 mt-4 flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500"/> Otomatik rota oluşturmaya hazır.</div>
          </div>
      </div>

      {/* 3. LİSTE VE KONTROLLER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
                <h3 className="text-lg font-black text-slate-800">Periyodik Bakım Yönetimi</h3>
                <div className="text-xs font-medium text-slate-500 mt-1">Sistemdeki varlıkların otopilot, personel ve tahsilat durumlarını yönetin.</div>
            </div>
            <div className="w-full sm:w-64">
                <input 
                    type="text" 
                    placeholder="Varlık, Tesis veya Apartman Ara..." 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                <thead>
                    <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-widest font-black">
                        <th className="p-4 pl-6">Varlık / Tesis Adı</th>
                        <th className="p-4">Atanmış Personel</th>
                        <th className="p-4">Periyot & Sonraki Tarih</th>
                        <th className="p-4 text-center">Otopilot</th>
                        <th className="p-4 pr-6 text-right">Finans / Tahsilat</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredAssets.length > 0 ? filteredAssets.map((asset: any) => {
                        const assignedStaff = staff.find((s:any) => s.id === asset.route_staff_id);
                        return (
                            <tr key={asset.id} onClick={() => setSelectedAsset && setSelectedAsset(asset)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                <td className="p-4 pl-6">
                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                        <Building2 size={16} className="text-slate-400" />
                                        {asset.apartmentName || asset.apartment_name || 'Bilinmeyen Tesis'}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 font-medium ml-6">{asset.name}</div>
                                </td>
                                
                                <td className="p-4">
                                    {assignedStaff ? (
                                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                                            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]"><User size={12}/></div>
                                            {assignedStaff.name}
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">Personel Atanmadı</span>
                                    )}
                                </td>

                                <td className="p-4">
                                    <div className="font-bold text-slate-700 text-xs">{asset.maintenance_period || 30} Günde Bir</div>
                                    <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1"><Clock size={12}/> {asset.next_maintenance_date || 'Planlanmadı'}</div>
                                </td>

                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => toggleAutopilot(asset)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${asset.is_autopilot ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${asset.is_autopilot ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </td>

                                <td className="p-4 pr-6 text-right">
                                    {/* Tahsilat Modülü Kısayolu */}
                                    <button 
                                        onClick={() => alert('Bu buton Finans/Kasa modalını açacak ve hızlı ödeme almayı sağlayacak.')} 
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all active:scale-95"
                                    >
                                        <Wallet size={14} /> Tahsilat Gir
                                    </button>
                                </td>
                            </tr>
                        )
                    }) : (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                                <Bot size={32} className="mx-auto text-slate-300 mb-3" />
                                Aramanıza uygun varlık bulunamadı.
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