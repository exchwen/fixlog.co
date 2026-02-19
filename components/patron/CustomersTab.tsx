'use client';

import React, { useState } from 'react';
import { Plus, Box, Search, MessageCircle } from 'lucide-react';

export default function CustomersTab({ data, setShowCustomerModal, setShowCustomerDetail }: any) {
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
  const handleWAClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    if (!navigator.onLine) {
      e.preventDefault();
      alert("WhatsApp'a bağlanmak için internet bağlantısına ihtiyacınız var.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-bold text-slate-900">Müşteri Rehberi & Cihazlar</h3>
        
        <div className="flex w-full sm:w-auto gap-2">
           {/* ARAMA KUTUSU */}
           <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Müşteri, iletişim veya vergi no ara..." 
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500 bg-white placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button onClick={() => setShowCustomerModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap">
            <Plus size={14} /> Müşteri Ekle
          </button>
        </div>
      </div>
      
      {/* YENİ: overflow-x-auto eklenerek mobilde tablonun taşması yerine kendi içinde kaydırılabilir olması sağlandı */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
         {/* YENİ: min-w-[600px] eklendi ki dar ekranlarda hücreler ezilmesin */}
         <table className="w-full text-left text-xs min-w-[600px]">
           <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
             <tr>
               <th className="px-5 py-3 whitespace-nowrap">İsim / Kurum</th>
               <th className="px-5 py-3 whitespace-nowrap">İletişim</th>
               <th className="px-5 py-3 whitespace-nowrap">Kayıtlı Cihazlar</th>
               <th className="px-5 py-3 text-right whitespace-nowrap">Adres & Vergi</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {filteredCustomers.length > 0 ? filteredCustomers.map((c: any) => {
               const customerAssets = data?.assets?.filter((a: any) => a.customer_id === c.id) || [];
               return (
                 <tr 
                   key={c.id} 
                   onClick={() => setShowCustomerDetail && setShowCustomerDetail(c)} 
                   className="hover:bg-blue-50 cursor-pointer transition-colors"
                 >
                   <td className="px-5 py-3 font-semibold text-slate-800">{c.name}</td>
                   <td className="px-5 py-3">
                     <div className="flex items-center gap-2">
                       <span className="text-slate-600">{c.contact || '-'}</span>
                       {c.contact && (
                         <a 
                           href={`https://wa.me/${c.contact.replace(/\D/g, '').length >= 10 ? '90' + c.contact.replace(/\D/g, '').slice(-10) : c.contact.replace(/\D/g, '')}?text=${encodeURIComponent('Merhaba ' + c.name + ',')}`}
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-md transition-all active:scale-95 inline-flex items-center justify-center shadow-sm"
                           title="WhatsApp Mesajı Gönder"
                           onClick={handleWAClick}
                         >
                           <MessageCircle size={14} />
                         </a>
                       )}
                     </div>
                   </td>
                   <td className="px-5 py-3">
                     {customerAssets.length > 0 ? (
                       <div className="flex flex-wrap gap-1.5">
                         {customerAssets.map((a: any) => (
                           <span key={a.id} className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-medium flex items-center gap-1 whitespace-nowrap">
                             <Box size={10} /> {a.name}
                           </span>
                         ))}
                       </div>
                     ) : (
                       <span className="text-[10px] text-slate-400 italic">Cihaz atanmamış</span>
                     )}
                   </td>
                   <td className="px-5 py-3 text-right">
                     <div className="text-slate-600 truncate max-w-[150px] ml-auto">{c.address || '-'}</div>
                     <div className="text-[10px] text-slate-400 mt-0.5">{c.tax_info || 'Vergi No Yok'}</div>
                   </td>
                 </tr>
               );
             }) : (
               <tr>
                 <td colSpan={4} className="p-10 text-center text-slate-400">
                   {searchTerm ? 'Aradığınız kriterlere uygun müşteri bulunamadı.' : 'Müşteri kaydı yok.'}
                 </td>
               </tr>
             )}
           </tbody>
         </table>
      </div>
    </div>
  );
}