'use client';

import React, { useState } from 'react';
import { Plus, Box, Search, MessageCircle, Phone, MapPin, Users, Info } from 'lucide-react';

// 🟢 DÜZELTME: Prop isimleri patron.jsx'in gönderdikleriyle (setShowAddCustomer, setSelectedCustomer) eşleştirildi.
export default function CustomersTab({ data, setShowAddCustomer, setSelectedCustomer }: any) {
  const [searchTerm, setSearchTerm] = useState('');

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

  // YENİ: Akıllı WhatsApp Yönlendirme Kontrolü (Offline ise uyarı verir)
  const handleWAClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && !navigator.onLine) {
      e.preventDefault();
      alert("WhatsApp'a bağlanmak için internet bağlantısına ihtiyacınız var.");
    }
  };

  return (
    <div className="space-y-4">
      {/* BAŞLIK VE ARAMA KONTROLLERİ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-full sm:w-auto">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Müşteri Rehberi & Cihazlar</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">Müşterilerinizi ve atanan varlıkları yönetin.</p>
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
               <th className="px-5 py-3.5 whitespace-nowrap uppercase tracking-wider text-[10px]">Kayıtlı Cihazlar</th>
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
                     <div className="flex items-center gap-2.5">
                       <span className="text-slate-600 font-medium">{c.contact || '-'}</span>
                       {c.contact && (
                         <a 
                           href={`https://wa.me/${c.contact.replace(/\D/g, '').length >= 10 ? '90' + c.contact.replace(/\D/g, '').slice(-10) : c.contact.replace(/\D/g, '')}?text=${encodeURIComponent('Merhaba ' + c.name + ',')}`}
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all active:scale-95 inline-flex items-center justify-center shadow-sm"
                           title="WhatsApp Mesajı Gönder"
                           onClick={handleWAClick}
                         >
                           <MessageCircle size={14} />
                         </a>
                       )}
                     </div>
                   </td>
                   <td className="px-5 py-4">
                     {customerAssets.length > 0 ? (
                       <div className="flex flex-wrap gap-1.5">
                         {customerAssets.map((a: any) => (
                           <span key={a.id} className="px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                             <Box size={10} className="text-blue-500" /> {a.name}
                           </span>
                         ))}
                       </div>
                     ) : (
                       <span className="text-[10px] text-slate-400 italic font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-100">Cihaz atanmamış</span>
                     )}
                   </td>
                   <td className="px-5 py-4 text-right">
                     <div className="text-slate-600 font-medium truncate max-w-[180px] ml-auto" title={c.address}>{c.address || '-'}</div>
                     <div className="text-[10px] text-slate-400 mt-1 font-semibold tracking-wide">{c.tax_info || 'Vergi No Yok'}</div>
                   </td>
                 </tr>
               );
             }) : (
               <tr>
                 <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                   {searchTerm ? (
                     <span>"<span className="font-bold text-slate-700">{searchTerm}</span>" aramasına uygun müşteri bulunamadı.</span>
                   ) : (
                     'Müşteri kaydı bulunmuyor.'
                   )}
                 </td>
               </tr>
             )}
           </tbody>
         </table>
      </div>

      {/* MOBİL GÖRÜNÜM: DİKEY KARTLAR (Masaüstünde gizlenir, yatay scroll'u engeller) */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {filteredCustomers.length > 0 ? filteredCustomers.map((c: any) => {
          const customerAssets = data?.assets?.filter((a: any) => a.customer_id === c.id) || [];
          return (
            <div 
              key={c.id}
              onClick={() => setSelectedCustomer && setSelectedCustomer(c)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm active:bg-blue-50 transition-colors flex flex-col gap-3 cursor-pointer"
            >
              {/* İsim ve Vergi No */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{c.name}</h4>
                </div>
                {c.tax_info && (
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shrink-0">
                    {c.tax_info}
                  </div>
                )}
              </div>

              {/* İletişim */}
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">{c.contact || 'Telefon Yok'}</span>
                </div>
                {c.contact && (
                  <a 
                    href={`https://wa.me/${c.contact.replace(/\D/g, '').length >= 10 ? '90' + c.contact.replace(/\D/g, '').slice(-10) : c.contact.replace(/\D/g, '')}?text=${encodeURIComponent('Merhaba ' + c.name + ',')}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-all active:scale-95 shadow-sm shadow-emerald-200"
                    title="WhatsApp Mesajı Gönder"
                    onClick={handleWAClick}
                  >
                    <MessageCircle size={14} />
                  </a>
                )}
              </div>

              {/* Adres */}
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="text-[11px] font-medium text-slate-500 line-clamp-2">{c.address || 'Adres bilgisi eklenmemiş.'}</span>
              </div>

              {/* Cihazlar */}
              {customerAssets.length > 0 && (
                <div className="pt-3 mt-1 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5">
                    {customerAssets.map((a: any) => (
                      <span key={a.id} className="px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                        <Box size={12} className="opacity-70" /> {a.name}
                      </span>
                    ))}
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

    </div>
  );
}