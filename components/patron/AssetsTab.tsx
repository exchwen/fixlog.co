'use client';

import React, { useState } from 'react';
import { Plus, Box, MapPin, Users, Search, QrCode } from 'lucide-react';

export default function AssetsTab({ data, setShowAssetModal, setShowAssetDetail, setShowQRModal, setSelectedQRAsset }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  // Arama filtresi mantığı
  const filteredAssets = data?.assets?.filter((a: any) => {
    const term = searchTerm.toLowerCase();
    const customerName = data?.customers?.find((c: any) => c.id === a.customer_id)?.name || '';
    
    return (
      a.name?.toLowerCase().includes(term) ||
      a.location?.toLowerCase().includes(term) ||
      a.device_details?.toLowerCase().includes(term) ||
      customerName.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-bold text-slate-900">Kayıtlı Varlıklar & QR</h3>
        
        <div className="flex w-full sm:w-auto gap-2">
          {/* ARAMA KUTUSU */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Cihaz, konum veya müşteri ara..." 
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500 bg-white placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button onClick={() => setShowAssetModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700 whitespace-nowrap">
            <Plus size={14} /> Yeni Varlık
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAssets.length > 0 ? filteredAssets.map((a: any) => (
          <div 
            key={a.id} 
            onClick={() => setShowAssetDetail && setShowAssetDetail(a)}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 cursor-pointer transition-colors flex flex-col"
          >
            <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 mb-3 border border-slate-100"><Box size={16} /></div>
            <div className="font-semibold text-slate-800 text-sm mb-1 truncate">{a.name}</div>
            
            <div className="text-[11px] font-medium text-blue-600 mb-1 flex items-center gap-1">
              <Users size={10}/> {data?.customers?.find((c: any) => c.id === a.customer_id)?.name || 'Müşteri Atanmamış'}
            </div>

            <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1"><MapPin size={10}/> {a.location}</div>
            <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100 mb-4 flex-1 line-clamp-2">{a.device_details || 'Detay yok'}</div>
            
            <button 
              onClick={(e) => { 
                e.stopPropagation();
                if (setSelectedQRAsset && setShowQRModal) {
                    setSelectedQRAsset(a);
                    setShowQRModal(true);
                }
              }} 
              className="w-full bg-slate-900 text-white py-2 rounded-md text-[10px] font-bold mt-auto flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <QrCode size={12} /> QR Kod / Etiket
            </button>
          </div>
        )) : (
          <div className="col-span-4 p-16 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
            {searchTerm ? 'Aradığınız kriterlere uygun varlık bulunamadı.' : 'Varlık kaydı bulunmuyor.'}
          </div>
        )}
      </div>
    </div>
  );
}