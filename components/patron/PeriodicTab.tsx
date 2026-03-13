'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Bot, AlertTriangle, CheckCircle2, Clock, User, Building2, MapPin, Wallet, Power, Settings2, ShieldCheck, X, Loader2 } from 'lucide-react';

export default function PeriodicTab({ data, handleAction, statusColors, setSelectedAsset, handleGenerateMonthlyMaintenance, isGenerating }: any) {
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

  // 🚀 TAHSİLAT MODALI İÇİN YENİ STATE VE FONKSİYONLAR
  const [collectionModal, setCollectionModal] = useState({ isOpen: false, asset: null as any });
  const [collectionAmount, setCollectionAmount] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  const handleOpenCollectionModal = (asset: any) => {
      setCollectionAmount(asset.maintenance_fee ? String(asset.maintenance_fee) : '');
      setCollectionModal({ isOpen: true, asset });
  };

  const handleProcessCollection = async () => {
      if (!collectionAmount || Number(collectionAmount) <= 0) return;
      
      setIsCollecting(true);
      const asset = collectionModal.asset;
      
      const description = `Periyodik Bakım Tahsilatı: ${asset.apartmentName || asset.apartment_name || ''} - ${asset.name}`;
      
      // Kasaya Gelir Olarak İşle (add-income apisi)
      const success = await handleAction('add-income', {
          description: description,
          amount: Number(collectionAmount),
          addedBy: data?.ownerName || 'Yönetici',
          status: 'Onaylandı'
      }, null, null);

      setIsCollecting(false);
      
      if (success) {
          setCollectionModal({ isOpen: false, asset: null });
          setCollectionAmount('');
      }
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
        
        {/* 🚀 OTONOM DAĞITIM BUTONU */}
        <div className="mt-5 border-t border-slate-700/50 pt-4 flex justify-end">
            <button 
                onClick={handleGenerateMonthlyMaintenance} 
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-95 disabled:opacity-50"
            >
                {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Bot size={18} />}
                {isGenerating ? 'Otopilot Çalışıyor...' : 'Aylık Bakımları Otonom Dağıt'}
            </button>
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
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* 🚀 MASAÜSTÜ GÖRÜNÜM TABLOSU */}
        <div className="hidden md:block overflow-x-auto w-full">
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
                                    <div className="text-xs text-slate-500 mt-1 font-medium ml-6 flex items-center gap-2">
                                        {asset.name}
                                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-black text-[10px] border border-emerald-100">
                                            ₺{asset.maintenance_fee || 0} / Ay
                                        </span>
                                    </div>
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
                                        onClick={(e) => { e.stopPropagation(); toggleAutopilot(asset); }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shadow-sm ${asset.is_autopilot ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${asset.is_autopilot ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </td>

                                <td className="p-4 pr-6 text-right">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenCollectionModal(asset); }} 
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all active:scale-95 shadow-sm"
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

        {/* 🚀 MOBİL GÖRÜNÜM KARTLARI */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50/50">
            {filteredAssets.length > 0 ? filteredAssets.map((asset: any) => {
                const assignedStaff = staff.find((s:any) => s.id === asset.route_staff_id);
                return (
                    <div key={asset.id} onClick={() => setSelectedAsset && setSelectedAsset(asset)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 relative cursor-pointer active:scale-95 transition-all">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                            <div className="pr-12">
                                <div className="font-black text-slate-800 text-sm truncate flex items-center gap-1.5 mb-1">
                                    <Building2 size={14} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{asset.apartmentName || asset.apartment_name || 'Bilinmeyen Tesis'}</span>
                                </div>
                                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
                                    {asset.name}
                                </div>
                            </div>
                            
                            <div className="absolute right-4 top-4">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleAutopilot(asset); }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shadow-sm ${asset.is_autopilot ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${asset.is_autopilot ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sorumlu</span>
                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                    <User size={10} className="text-slate-400"/> 
                                    {assignedStaff ? assignedStaff.name : 'Atanmadı'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-right">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Periyot / Fiyat</span>
                                <span className="text-[11px] font-bold text-emerald-600">
                                    {asset.maintenance_period || 30} Gün | ₺{asset.maintenance_fee || 0}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenCollectionModal(asset); }}
                            className="w-full mt-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                        >
                            <Wallet size={14} /> Tahsilat Gir
                        </button>
                    </div>
                )
            }) : (
                <div className="text-center p-8 text-slate-500 font-medium bg-white rounded-xl border border-slate-200">
                    Aramanıza uygun varlık bulunamadı.
                </div>
            )}
        </div>
      </div>

      {/* 🚀 ŞIK TAHSİLAT MODALI */}
      <AnimatePresence>
          {collectionModal.isOpen && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div 
                      initial={{ scale: 0.95, opacity: 0, y: 10 }} 
                      animate={{ scale: 1, opacity: 1, y: 0 }} 
                      exit={{ scale: 0.95, opacity: 0, y: 10 }}
                      className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden border border-slate-200"
                  >
                      <button 
                          onClick={() => setCollectionModal({ isOpen: false, asset: null })} 
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors"
                      >
                          <X size={18} />
                      </button>

                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 mx-auto shadow-inner">
                          <Wallet size={32} />
                      </div>

                      <div className="text-center mb-6">
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Hızlı Tahsilat</h3>
                          <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">
                              <strong className="text-slate-700">{collectionModal.asset?.apartmentName || collectionModal.asset?.apartment_name}</strong> - {collectionModal.asset?.name}
                          </p>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tahsil Edilen Tutar</label>
                              <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-emerald-600">₺</span>
                                  <input 
                                      type="number" 
                                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-emerald-200 rounded-xl text-lg font-black outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 shadow-inner transition-all text-emerald-800" 
                                      placeholder="0.00" 
                                      value={collectionAmount} 
                                      onChange={e => setCollectionAmount(e.target.value)} 
                                  />
                              </div>
                          </div>

                          <button 
                              onClick={handleProcessCollection}
                              disabled={isCollecting || !collectionAmount}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
                          >
                              {isCollecting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Kasaya Gelir Olarak İşle</>}
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

    </motion.div>
  );
}