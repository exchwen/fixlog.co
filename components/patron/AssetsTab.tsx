'use client';

import React from 'react';
import { Plus, Box, MapPin, Users } from 'lucide-react';

export default function AssetsTab({ data, setShowAssetModal, setShowAssetDetail }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Kayıtlı Varlıklar & QR</h3>
        <button onClick={() => setShowAssetModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700">
          <Plus size={14} /> Yeni Varlık
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.assets?.length > 0 ? data.assets.map((a: any) => (
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
              onClick={(e) => e.stopPropagation()} 
              className="w-full bg-slate-50 py-1.5 rounded-md text-[10px] font-medium text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              QR Kod Yazdır
            </button>
          </div>
        )) : <div className="col-span-4 p-16 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">Varlık kaydı bulunmuyor.</div>}
      </div>
    </div>
  );
}