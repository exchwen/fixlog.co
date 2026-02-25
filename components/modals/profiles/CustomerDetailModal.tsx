'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MapPin, Box, Briefcase, Calendar, ChevronRight } from 'lucide-react';

export default function CustomerDetailModal({
  selectedCustomer, setSelectedCustomer,
  data, handleCloseDetail,
  setSelectedAsset, setSelectedJob
}: any) {

  // Müşteriye ait varlıkları (cihazları) ve işleri veritabanından filtreliyoruz
  const customerAssets = (data?.assets || []).filter((a:any) => String(a.customer_id) === String(selectedCustomer?.id));
  const customerJobs = (data?.jobs || []).filter((j:any) => String(j.customer_name) === String(selectedCustomer?.name));

  const statusColors: any = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200',
    'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200'
  };

  return (
    <AnimatePresence>
      {selectedCustomer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* Arka plan tıklaması ile kapatma */}
          <div className="absolute inset-0" onClick={() => handleCloseDetail('customer')}></div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 pointer-events-auto"
          >
            {/* HEADER (Üst Başlık Alanı) */}
            <div className="flex justify-between items-start p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 z-10">
              <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedCustomer.name}</h2>
                  <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                     <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold">Müşteri Profili</span>
                     {selectedCustomer.tax_info && (
                        <>
                          <span>•</span>
                          <span>VN/TC: {selectedCustomer.tax_info}</span>
                        </>
                     )}
                  </div>
              </div>
              <button onClick={() => { setSelectedCustomer(null); handleCloseDetail('customer'); }} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95"><X size={20} /></button>
            </div>

            {/* BODY (İçerik Alanı) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6">
                
                {/* 1. İletişim Bilgileri */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-start gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Phone size={18} /></div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Telefon Numarası</div>
                            <div className="text-sm font-bold text-slate-800">{selectedCustomer.contact || 'Belirtilmedi'}</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-start gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0"><MapPin size={18} /></div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Adres / Bölge</div>
                            <div className="text-sm font-bold text-slate-800 line-clamp-2">{selectedCustomer.address || 'Belirtilmedi'}</div>
                        </div>
                    </div>
                </div>

                {/* 2. Kayıtlı Cihazlar / Varlıklar Listesi */}
                <div>
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Box size={14} /> Kayıtlı Cihazlar / Varlıklar ({customerAssets.length})
                    </div>
                    {customerAssets.length > 0 ? (
                        <div className="space-y-2">
                            {customerAssets.map((asset: any) => (
                                <div 
                                  key={asset.id}
                                  onClick={() => setSelectedAsset && setSelectedAsset(asset)}
                                  className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer group"
                                >
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{asset.name}</div>
                                        <div className="text-xs font-medium text-slate-500 mt-0.5">{asset.location}</div>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-sm font-medium text-slate-500 italic">
                            Bu müşteriye ait kayıtlı bir varlık bulunamadı.
                        </div>
                    )}
                </div>

                {/* 3. Geçmiş ve Aktif İşlemler Listesi */}
                <div>
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Briefcase size={14} /> Geçmiş ve Aktif İşler ({customerJobs.length})
                    </div>
                    {customerJobs.length > 0 ? (
                        <div className="space-y-2">
                            {customerJobs.slice(0, 5).map((job: any) => (
                                <div 
                                  key={job.id}
                                  onClick={() => setSelectedJob && setSelectedJob(job)}
                                  className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{job.work_type}</div>
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusColors[job.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                                        <Calendar size={12} className="opacity-70" /> {job.created_at?.split('T')[0] || job.scheduled_date || 'Tarih Yok'}
                                        {job.asset_id && (
                                            <>
                                              <span className="mx-1">•</span>
                                              <Box size={12} className="opacity-70" /> 
                                              <span className="truncate max-w-[120px]">
                                                {customerAssets.find((a:any) => String(a.id) === String(job.asset_id))?.name || 'Cihaz'}
                                              </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {customerJobs.length > 5 && (
                                <div className="text-center pt-2">
                                    <span className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                                        Tüm ({customerJobs.length}) işlemi gör...
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-sm font-medium text-slate-500 italic">
                            Bu müşteriye ait herhangi bir iş emri bulunamadı.
                        </div>
                    )}
                </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}