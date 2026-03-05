'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, MapPin, Phone, User, Info, MessageCircle, Package, CheckCircle2 } from 'lucide-react';

interface Emergency {
  id: string | number;
  status: string;
  asset_name?: string;
  asset_apartment?: string; 
  asset_location?: string;
  staff_id?: string;
  staff_name?: string;
  type?: string;
  message?: string;
  location?: string;
  created_at?: string;
  [key: string]: any;
}

interface Fault {
  id: string | number;
  status: string;
  asset_name?: string;
  asset_apartment?: string; 
  asset_location?: string;
  reporter_name?: string;
  reporter_phone?: string;
  description?: string;
  created_at?: string;
  [key: string]: any;
}

interface AlertsTabProps {
  data: {
    whatsappPhone?: string;
    allEmergencies?: Emergency[];
    allFaults?: Fault[];
    pendingMaterialRequests?: any[];
    [key: string]: any;
  } | null;
  handleAction: (endpoint: string, body: any, closeFn: any, resetFn: any) => Promise<boolean>;
}

export default function AlertsTab({ data, handleAction }: AlertsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'faults' | 'emergencies' | 'materials'>('faults');

  const emergencies = data?.allEmergencies || [];
  const faults = data?.allFaults || [];
  const materialRequests = data?.pendingMaterialRequests || [];
  const companyWhatsapp = data?.whatsappPhone || '';

  const formatPhoneForWA = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 ? (cleaned.startsWith('90') ? cleaned : '90' + cleaned.slice(-10)) : cleaned;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Bildirim ve Çağrı Geçmişi</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Sahadan gelen arıza talepleri, acil durumlar ve malzeme istekleri.</p>
        </div>
        
        <div className="flex w-full lg:w-auto bg-slate-100 p-1 rounded-xl overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveSubTab('faults')}
            className={`flex-1 lg:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap ${activeSubTab === 'faults' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlertTriangle size={16} className="shrink-0" /> Arıza ({faults.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('emergencies')}
            className={`flex-1 lg:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap ${activeSubTab === 'emergencies' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldAlert size={16} className="shrink-0" /> Acil ({emergencies.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('materials')}
            className={`flex-1 lg:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap ${activeSubTab === 'materials' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Package size={16} className="shrink-0" /> Malzeme İstekleri {materialRequests.length > 0 && <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px]">{materialRequests.length}</span>}
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
                faults.map((fault: Fault, idx: number) => {
                  const aptName = fault.asset_apartment;
                  const mainTitle = aptName || fault.asset_name || 'Bilinmeyen Varlık';
                  const subTitle = aptName ? fault.asset_name : null;

                  return (
                    <div key={fault.id || idx} className={`p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row gap-4 sm:gap-5 items-start lg:items-center justify-between transition-all hover:shadow-md ${fault.status === 'Aktif' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start w-full lg:w-auto flex-1">
                        <div className={`p-3 rounded-full shrink-0 ${fault.status === 'Aktif' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                          <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1 w-full min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${fault.status === 'Aktif' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                              {fault.status === 'Aktif' ? 'Müdahale Bekliyor' : 'Çözüldü'}
                            </span>
                            {fault.created_at && (
                              <span className="text-[10px] text-slate-400 font-semibold">{new Date(fault.created_at).toLocaleString('tr-TR')}</span>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{mainTitle}</h3>
                          {subTitle && (
                             <div className="text-xs font-semibold text-slate-500 mt-0.5 truncate">{subTitle}</div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs font-semibold text-slate-500 mt-2.5">
                            <span className="flex items-center gap-1.5 w-full sm:w-auto truncate"><MapPin size={14} className="text-slate-400 shrink-0" /> <span className="truncate">{fault.asset_location ? fault.asset_location.replace(aptName || '', '').replace(/^[\s-/,]+|[\s-/,]+$/g, '').trim() : 'Konum yok'}</span></span>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <span className="flex items-center gap-1.5 truncate"><User size={14} className="text-slate-400 shrink-0" /> <span className="truncate">{fault.reporter_name || 'İsimsiz'}</span></span>
                                <span className="flex items-center gap-1.5 shrink-0"><Phone size={14} className="text-slate-400 shrink-0" /> {fault.reporter_phone || 'Tel yok'}</span>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-slate-600 italic border-l-4 border-amber-200 pl-3 line-clamp-3">"{fault.description}"</p>
                        </div>
                      </div>

                      {fault.reporter_phone && (
                          <div className="flex gap-2 w-full lg:w-auto mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 shrink-0">
                              <a 
                                href={`tel:${fault.reporter_phone}`} 
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-sm"
                              >
                                <Phone size={16} /> Ara
                              </a>
                              <a 
                                href={`https://wa.me/${formatPhoneForWA(fault.reporter_phone)}?text=${encodeURIComponent(`Merhaba ${fault.reporter_name || ''}, ${mainTitle} için arıza kaydınızla ilgili ulaşıyoruz.`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all active:scale-95 shadow-sm shadow-emerald-200"
                              >
                                <MessageCircle size={16} /> WhatsApp
                              </a>
                          </div>
                      )}
                    </div>
                  );
                })
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
                emergencies.map((em: Emergency, idx: number) => {
                  const isStaffSos = !!em.staff_id;
                  const mainTitle = isStaffSos ? em.type : (em.asset_apartment || em.asset_name || 'Bilinmeyen Varlık');
                  const subTitle = isStaffSos ? em.staff_name : (em.asset_apartment ? em.asset_name : null);

                  return (
                    <div key={em.id || idx} className={`p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row gap-4 sm:gap-5 items-start lg:items-center justify-between transition-all hover:shadow-md ${em.status === 'Aktif' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start w-full lg:w-auto min-w-0">
                        <div className={`p-3 rounded-full shrink-0 ${em.status === 'Aktif' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                          <ShieldAlert size={24} />
                        </div>
                        <div className="w-full min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${em.status === 'Aktif' ? (isStaffSos ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-200 text-rose-800') : 'bg-emerald-100 text-emerald-700'}`}>
                              {em.status === 'Aktif' ? (isStaffSos ? 'PERSONEL SOS' : 'Kırmızı Alarm') : 'Çözüldü'}
                            </span>
                            {em.created_at && (
                              <span className="text-[10px] text-slate-400 font-semibold">{new Date(em.created_at).toLocaleString('tr-TR')}</span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{mainTitle}</h3>
                          {subTitle && <div className="text-xs font-semibold text-slate-500 mt-0.5 truncate">{subTitle}</div>}
                          {isStaffSos && em.message && <div className="text-xs italic text-rose-600 mt-2 border-l-2 border-rose-300 pl-2">"{em.message}"</div>}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs font-semibold text-slate-500 mt-2.5">
                            <span className="flex items-center gap-1.5 w-full sm:w-auto truncate"><MapPin size={14} className="text-slate-400 shrink-0" /> 
                            <span className="truncate">
                                {isStaffSos ? (em.location ? 'Haritada Konum Kayıtlı' : 'Konum Yok') : (em.asset_location ? em.asset_location.replace(em.asset_apartment || '', '').replace(/^[\s-/,]+|[\s-/,]+$/g, '').trim() : 'Konum yok')}
                            </span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeSubTab === 'materials' && (
            <motion.div key="materials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {materialRequests.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center text-slate-400">
                  <Package size={48} className="mb-3 opacity-20" />
                  <p className="font-bold text-lg text-slate-600">Talep Bulunmuyor</p>
                  <p className="text-sm">Şu an için ustalardan gelen aktif bir malzeme talebi yok.</p>
                </div>
              ) : (
                materialRequests.map((req: any, idx: number) => {
                  let items = [];
                  try { items = typeof req.items === 'string' ? JSON.parse(req.items) : req.items; } catch(e) { items = []; }
                  return (
                    <div key={req.id || idx} className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col sm:flex-row gap-5 items-start justify-between">
                        <div className="flex gap-4 items-start w-full">
                           <div className="p-3 bg-blue-50 text-blue-600 rounded-full shrink-0"><Package size={24} /></div>
                           <div className="w-full">
                               <div className="flex items-center gap-2 mb-1">
                                   <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Bekleyen Talep</span>
                                   <span className="text-[10px] text-slate-400 font-bold">{new Date(req.created_at).toLocaleString('tr-TR')}</span>
                               </div>
                               <h3 className="font-black text-slate-800 text-lg">{req.staff_name || 'Personel'}</h3>
                               {req.note && <div className="text-sm font-medium text-slate-600 mt-1 italic">"{req.note}"</div>}
                               <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                   <div className="text-[10px] font-black text-slate-400 uppercase mb-2">İstenen Malzemeler</div>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                       {items.map((it: any, i: number) => (
                                           <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                               <span className="text-xs font-bold text-slate-700 truncate">{it.name}</span>
                                               <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">{it.qty} {it.unit}</span>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           </div>
                        </div>
                        <button onClick={() => handleAction('resolve-material', { id: req.id }, null, null)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 shrink-0">
                            <CheckCircle2 size={18} /> Verildi / Kapat
                        </button>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}