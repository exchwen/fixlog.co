'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, MapPin, Phone, User, Info, MessageCircle } from 'lucide-react';

interface Emergency {
  id: string | number;
  status: string;
  asset_name?: string;
  asset_location?: string;
  created_at?: string;
  [key: string]: any;
}

interface Fault {
  id: string | number;
  status: string;
  asset_name?: string;
  asset_location?: string;
  reporter_name?: string;
  reporter_phone?: string;
  description?: string;
  created_at?: string;
  [key: string]: any;
}

interface AlertsTabProps {
  data: {
    whatsappPhone?: string; // Firmanın WP numarası
    allEmergencies?: Emergency[];
    allFaults?: Fault[];
    [key: string]: any;
  } | null;
}

export default function AlertsTab({ data }: AlertsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'faults' | 'emergencies'>('faults');

  const emergencies = data?.allEmergencies || [];
  const faults = data?.allFaults || [];
  const companyWhatsapp = data?.whatsappPhone || '';

  // Numarayı WhatsApp URL formatına çevirme
  const formatPhoneForWA = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 ? (cleaned.startsWith('90') ? cleaned : '90' + cleaned.slice(-10)) : cleaned;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Bildirim ve Çağrı Geçmişi</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Sahadan gelen arıza talepleri ve acil durum çağrılarının tüm kayıtları.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button 
            onClick={() => setActiveSubTab('faults')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'faults' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlertTriangle size={16} /> Arıza Kayıtları ({faults.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('emergencies')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'emergencies' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldAlert size={16} /> Acil Durumlar ({emergencies.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="wait">
          {activeSubTab === 'faults' && (
            <motion.div key="faults" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {faults.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center text-slate-400">
                  <Info size={48} className="mb-3 opacity-20" />
                  <p className="font-bold text-lg text-slate-600">Henüz Arıza Kaydı Yok</p>
                  <p className="text-sm">Sisteminize düşen herhangi bir arıza talebi bulunmamaktadır.</p>
                </div>
              ) : (
                faults.map((fault, idx) => (
                  <div key={fault.id || idx} className={`p-5 rounded-2xl border flex flex-col md:flex-row gap-5 items-start md:items-center justify-between transition-all hover:shadow-md ${fault.status === 'Aktif' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex gap-4 items-start w-full md:w-auto flex-1">
                      <div className={`p-3 rounded-full mt-1 ${fault.status === 'Aktif' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                        <AlertTriangle size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${fault.status === 'Aktif' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                            {fault.status === 'Aktif' ? 'Müdahale Bekliyor' : 'Çözüldü'}
                          </span>
                          {fault.created_at && (
                             <span className="text-[10px] text-slate-400 font-semibold">{new Date(fault.created_at).toLocaleString('tr-TR')}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">{fault.asset_name || 'Bilinmeyen Varlık'}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mt-2">
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {fault.asset_location || 'Konum yok'}</span>
                          <span className="flex items-center gap-1.5"><User size={14} className="text-slate-400" /> {fault.reporter_name || 'İsimsiz'}</span>
                          <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {fault.reporter_phone || 'Tel yok'}</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3">"{fault.description}"</p>
                      </div>
                    </div>

                    {/* Hızlı İletişim Butonları */}
                    {fault.reporter_phone && (
                        <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                            <a 
                              href={`tel:${fault.reporter_phone}`} 
                              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs transition-colors shadow-sm"
                            >
                              <Phone size={16} /> Ara
                            </a>
                            <a 
                              href={`https://wa.me/${formatPhoneForWA(fault.reporter_phone)}?text=${encodeURIComponent(`Merhaba ${fault.reporter_name || ''}, ${fault.asset_name || ''} için arıza kaydınızla ilgili ulaşıyoruz.`)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-colors shadow-sm shadow-emerald-200"
                            >
                              <MessageCircle size={16} /> WhatsApp
                            </a>
                        </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeSubTab === 'emergencies' && (
            <motion.div key="emergencies" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {emergencies.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center text-slate-400">
                  <ShieldAlert size={48} className="mb-3 opacity-20" />
                  <p className="font-bold text-lg text-slate-600">Acil Durum Kaydı Yok</p>
                  <p className="text-sm">Sisteminize düşen herhangi bir acil durum çağrısı bulunmamaktadır.</p>
                </div>
              ) : (
                emergencies.map((em, idx) => (
                  <div key={em.id || idx} className={`p-5 rounded-2xl border flex flex-col md:flex-row gap-5 items-start md:items-center justify-between transition-all hover:shadow-md ${em.status === 'Aktif' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex gap-4 items-start w-full md:w-auto">
                      <div className={`p-3 rounded-full mt-1 ${em.status === 'Aktif' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                        <ShieldAlert size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${em.status === 'Aktif' ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-700'}`}>
                            {em.status === 'Aktif' ? 'Kırmızı Alarm' : 'Çözüldü / Kapatıldı'}
                          </span>
                          {em.created_at && (
                             <span className="text-[10px] text-slate-400 font-semibold">{new Date(em.created_at).toLocaleString('tr-TR')}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">{em.asset_name || 'Bilinmeyen Varlık'}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mt-2">
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {em.asset_location || 'Konum yok'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}