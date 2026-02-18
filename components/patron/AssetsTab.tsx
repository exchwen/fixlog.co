'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Box, MapPin, Users, Search, QrCode, ExternalLink } from 'lucide-react';

export default function AssetsTab({ data, setShowAssetModal, setShowAssetDetail, setShowQRModal, setSelectedQRAsset }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [logoBgColor, setLogoBgColor] = useState<string>('#f8fafc');

  useEffect(() => {
    const companyLogo = data?.logo;
    if (!companyLogo) {
      setLogoBgColor('#f8fafc');
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const dataPixels = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < dataPixels.length; i += 4) {
          if (dataPixels[i + 3] < 128) continue;
          r += dataPixels[i]; g += dataPixels[i + 1]; b += dataPixels[i + 2];
          count++;
        }
        if (count > 0) {
          r = Math.floor(r / count); g = Math.floor(g / count); b = Math.floor(b / count);
          const palette = [
            { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
            { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' },
            { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }
          ];
          let maxDist = -1;
          let selectedColor = '#ffffff';
          for (const color of palette) {
            const dist = Math.sqrt(Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2));
            if (dist > maxDist) { maxDist = dist; selectedColor = color.hex; }
          }
          setLogoBgColor(selectedColor);
        }
      } catch (e) { setLogoBgColor('#f8fafc'); }
    };
    img.src = companyLogo;
  }, [data?.logo]);

  // Harita linki oluşturucu (apartmentName'i linkten temizler)
  const getMapsUrl = (location: string, apartmentName: string) => {
    if (!location) return '#';
    let mapQuery = location;
    if (apartmentName && mapQuery.includes(apartmentName)) {
      mapQuery = mapQuery.replace(apartmentName, '').trim();
      if (mapQuery.startsWith('-') || mapQuery.startsWith('/')) {
        mapQuery = mapQuery.substring(1).trim();
      }
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  };

  const filteredAssets = data?.assets?.filter((a: any) => {
    const term = searchTerm.toLowerCase();
    const customerName = data?.customers?.find((c: any) => c.id === a.customer_id)?.name || '';
    return (
      a.name?.toLowerCase().includes(term) ||
      a.location?.toLowerCase().includes(term) ||
      customerName.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-bold text-slate-900">Kayıtlı Varlıklar & QR</h3>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Cihaz, konum veya müşteri ara..." 
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500 bg-white"
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
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col group overflow-hidden"
          >
            {/* Kart Başlık Alanı */}
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden"
                  style={{ backgroundColor: data?.logo ? logoBgColor : '#f8fafc' }}
                >
                  {data?.logo ? (
                    <img src={data.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Box size={20} className="text-slate-400" />
                  )}
                </div>
                <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1">
                  <Users size={12}/> {data?.customers?.find((c: any) => c.id === a.customer_id)?.name || 'Genel'}
                </div>
              </div>

              <div className="font-bold text-slate-900 text-base mb-2 group-hover:text-blue-600 transition-colors truncate">
                {a.name}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {a.location}
                    </div>
                    {/* Haritada Görüntüle Butonu */}
                    <a 
                      href={getMapsUrl(a.location, a.apartmentName)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 w-fit px-2 py-1 rounded-md transition-colors"
                    >
                      <ExternalLink size={10} /> Haritada Görüntüle
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Alt Buton Alanı */}
            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  if (setSelectedQRAsset && setShowQRModal) {
                      setSelectedQRAsset(a);
                      setShowQRModal(true);
                  }
                }} 
                className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
              >
                <QrCode size={14} /> QR Kod / Etiket
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
             Varlık kaydı bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}