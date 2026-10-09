'use client';

import React, { useState } from 'react';
import { Plus, Box, Search, MessageCircle, Phone, MapPin, Users, Info, Building2, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomersTab({ data, setShowAddCustomer, setSelectedCustomer, handleAction }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOfflineModal, setShowOfflineModal] = useState(false); // 🚀 İnternet bağlantısı uyarı modalı state'i

  // Arama filtresi mantığı
  const filteredCustomers = data?.customers?.filter((c: any) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.contact?.toLowerCase().includes(term) ||
      c.address?.toLowerCase().includes(term) ||
      c.tax_info?.toLowerCase().includes(term)
    );
  }) || [];

  // Akıllı WhatsApp Yönlendirme Kontrolü
  const handleWAClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && !navigator.onLine) {
      e.preventDefault();
      setShowOfflineModal(true); // 🚀 Alert yerine modalı aç
    }
  };

  return (
    <div className="space-y-4">
      {/* BAŞLIK VE ARAMA KONTROLLERİ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-full sm:w-auto flex items-center gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Müşteri Rehberi & Cihazlar</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">Müşterilerinizi ve atanan varlıkları yönetin.</p>
          </div>
          <div className="hidden sm:flex flex-col items-center bg-blue-50 border border-blue-100 rounded-xl px-4 py-1.5 shadow-inner">
             <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Toplam</span>
             <span className="text-lg font-black text-blue-700 leading-none">{data?.customers?.length || 0}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2.5">
           {/* ARAMA KUTUSU */}
           <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="İsim, iletişim veya vergi no..." 
              className="w-full pl-9 pr-4 py-2.5 sm:py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 hover:bg-white transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button onClick={() => setShowAddCustomer(true)} className="bg-blue-600 text-white w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap">
            <Plus size={16} /> Yeni Müşteri Ekle
          </button>
        </div>
      </div>
      
      {/* MASAÜSTÜ GÖRÜNÜMÜ: TABLO (Mobilde gizlenir) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
         <table className="w-full text-left text-xs min-w-[600px]">
           <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
             <tr>
               <th className="px-5 py-3.5 whitespace-nowrap uppercase tracking-wider text-[10px]">İsim / Kurum</th>
               <th className="px-5 py-3.5 whitespace-nowrap uppercase tracking-wider text-[10px]">İletişim</th>
               <th className="px-5 py-3.5 uppercase tracking-wider text-[10px]">Kayıtlı Varlıklar (Konum / Cihaz)</th>
               <th className="px-5 py-3.5 text-right whitespace-nowrap uppercase tracking-wider text-[10px]">Adres & Vergi</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {filteredCustomers.length > 0 ? filteredCustomers.map((c: any) => {
               const customerAssets = data?.assets?.filter((a: any) => a.customer_id === c.id) || [];
               return (
                 <tr 
                   key={c.id} 
                   onClick={() => setSelectedCustomer && setSelectedCustomer(c)} 
                   className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                 >
                   <td className="px-5 py-4 font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{c.name}</td>
                   <td className="px-5 py-4">
                     <div className="flex items-center justify-between gap-3">
                       <span className="text-slate-800 font-bold">{c.contact || '-'}</span>
                       {c.contact && (
                         <div className="flex items-center gap-1.5 shrink-0">
                           <a 
                             href={`tel:${c.contact.replace(/\D/g, '')}`}
                             onClick={(e) => e.stopPropagation()}
                             className="w-8 h-8 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all active:scale-95 flex items-center justify-center shadow-sm"
                             title="Telefonla Ara"
                           >
                             <Phone size={14} />
                           </a>
                           <a 
                             href={`https://wa.me/${c.contact.replace(/\D/g, '').length >= 10 ? '90' + c.contact.replace(/\D/g, '').slice(-10) : c.contact.replace(/\D/g, '')}?text=${encodeURIComponent('Merhaba ' + c.name + ',')}`}
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="w-8 h-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all active:scale-95 flex items-center justify-center shadow-sm"
                             title="WhatsApp Mesajı Gönder"
                             onClick={handleWAClick}
                           >
                             <MessageCircle size={14} />
                           </a>
                         </div>
                       )}
                     </div>
                   </td>
                   <td className="px-5 py-4">
                     {customerAssets.length > 0 ? (
                       <div className="flex flex-wrap gap-2">
                         {customerAssets.map((a: any) => {
                           const aptName = a.apartmentName || a.apartment_name;
                           return (
                             <div key={a.id} className="inline-flex flex-col bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm min-w-[150px] max-w-[220px]">
                                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px] mb-0.5 truncate">
                                    <Building2 size={12} className="text-blue-500 shrink-0" />
                                    <span className="truncate" title={aptName || 'Bağımsız Adres'}>{aptName || 'Bağımsız Adres'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px] truncate">
                                    <Box size={10} className="shrink-0" />
                                    <span className="truncate" title={a.name}>{a.name}</span>
                                </div>
                             </div>
                           );
                         })}
                       </div>
                     ) : (
                       <span className="text-[10px] text-slate-400 italic font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-100">Cihaz atanmamış</span>
                     )}
                   </td>
                   <td className="px-5 py-4 text-right align-top">
                     <div className="text-slate-600 font-medium truncate max-w-[180px] ml-auto" title={c.address}>{c.address || '-'}</div>
                     <div className="text-[10px] text-slate-400 mt-1 font-semibold tracking-wide">{c.tax_info || 'Vergi No Yok'}</div>
                   </td>
                 </tr>
               );
             }) : (
               <tr>
                 <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                   {searchTerm ? (
                     <span>&quot;<span className="font-bold text-slate-700">{searchTerm}</span>&quot; aramasına uygun müşteri bulunamadı.</span>
                   ) : (
                     'Müşteri kaydı bulunmuyor.'
                   )}
                 </td>
               </tr>
             )}
           </tbody>
         </table>
      </div>

      {/* MOBİL GÖRÜNÜM: DİKEY KARTLAR (Masaüstünde gizlenir) */}
      <div className="md:hidden grid grid-cols-1 gap-6">
        {filteredCustomers.length > 0 ? filteredCustomers.map((c: any) => {
          const customerAssets = data?.assets?.filter((a: any) => a.customer_id === c.id) || [];
          return (
            <div 
              key={c.id}
              onClick={() => setSelectedCustomer && setSelectedCustomer(c)}
              className="bg-white rounded-[2rem] border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] hover:border-blue-200 active:scale-[0.98] transition-all duration-300 flex flex-col gap-6 cursor-pointer relative"
            >
              {/* İsim ve Vergi No */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-base leading-tight line-clamp-2">{c.name}</h4>
                    {c.tax_info && (
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                        VKN: {c.tax_info}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* İletişim ve Adres (İç İçe Kutu Karmaşası Kaldırıldı) */}
              <div className="bg-slate-50/80 rounded-2xl p-4 flex flex-col gap-4 border border-slate-100">
                 {/* Telefon ve Arama Butonları */}
                 <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                        <Phone size={14} className="text-slate-500" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 tracking-wide truncate">{c.contact || 'Telefon Yok'}</span>
                    </div>
                    {c.contact && (
                      <div className="flex items-center gap-2 shrink-0">
                          <a 
                            href={`tel:${c.contact.replace(/\D/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 bg-white text-slate-600 hover:text-blue-600 rounded-full transition-all active:scale-95 flex items-center justify-center shadow-sm border border-slate-200"
                            title="Telefonla Ara"
                          >
                            <Phone size={14} />
                          </a>
                          <a 
                            href={`https://wa.me/${c.contact.replace(/\D/g, '').length >= 10 ? '90' + c.contact.replace(/\D/g, '').slice(-10) : c.contact.replace(/\D/g, '')}?text=${encodeURIComponent('Merhaba ' + c.name + ',')}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-9 h-9 bg-emerald-500 text-white hover:bg-emerald-600 rounded-full transition-all active:scale-95 flex items-center justify-center shadow-sm shadow-emerald-200 border border-emerald-600"
                            title="WhatsApp Mesajı Gönder"
                            onClick={handleWAClick}
                          >
                            <MessageCircle size={14} />
                          </a>
                      </div>
                    )}
                 </div>

                 {/* Adres */}
                 <div className="flex items-start gap-2.5 w-full pt-3 border-t border-slate-200/70">
                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 shrink-0 mt-0.5">
                     <MapPin size={14} className="text-slate-500" />
                   </div>
                   <span className="text-xs font-medium text-slate-600 leading-relaxed pt-1.5 line-clamp-2 w-full">{c.address || 'Adres bilgisi eklenmemiş.'}</span>
                 </div>
              </div>

              {/* Cihazlar (Sadeleştirilmiş Şık Liste) */}
              {customerAssets.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kayıtlı Varlıklar ({customerAssets.length})</div>
                  <div className="flex flex-col gap-2 w-full">
                    {customerAssets.map((a: any) => {
                       const aptName = a.apartmentName || a.apartment_name;
                       return (
                         <div key={a.id} className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-sm w-full">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                               <Building2 size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                               <span className="font-bold text-slate-800 text-xs truncate">{aptName || 'Bağımsız Adres'}</span>
                               <span className="text-[10px] font-medium text-slate-500 truncate flex items-center gap-1.5 mt-1">
                                  <Box size={10} className="text-slate-400" /> {a.name}
                               </span>
                            </div>
                         </div>
                       );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="bg-slate-50 p-10 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-3">
            <Info size={32} className="text-slate-300" />
            <p className="text-xs font-medium text-slate-500">
              {searchTerm ? 'Aradığınız müşteri bulunamadı.' : 'Henüz müşteri eklenmemiş.'}
            </p>
          </div>
        )}
        </div>
  
        {/* 🚀 BAĞLANTI HATASI MODALI */}
        <AnimatePresence>
          {showOfflineModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowOfflineModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 10 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 10 }} 
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center border border-slate-200"
              >
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <WifiOff size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Bağlantı Yok!</h3>
                <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                  WhatsApp&apos;a yönlendirilebilmeniz için aktif bir internet bağlantısına ihtiyacınız var. Lütfen bağlantınızı kontrol edip tekrar deneyin.
                </p>
                <button 
                  onClick={() => setShowOfflineModal(false)}
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-md flex justify-center items-center"
                >
                  Anladım
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
  
      </div>
    );
  }