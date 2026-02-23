'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Box, MapPin, Users, Search, QrCode, ExternalLink } from 'lucide-react';

export default function AssetsTab({ data, setShowAssetModal, setShowAssetDetail, setShowQRModal, setSelectedQRAsset }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [logoBgColor, setLogoBgColor] = useState<string>('#f8fafc');

  // --- RENK ANALİZ MOTORU ---
  useEffect(() => {
    const companyLogo = data?.logo;
    if (!companyLogo || typeof window !== 'undefined' && !navigator.onLine) {
      setLogoBgColor('#f8fafc');
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onerror = () => {
      setLogoBgColor('#f8fafc');
    };

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
      } catch (e) {
        setLogoBgColor('#f8fafc'); 
      }
    };
    // 🚀 KESİN ÇÖZÜM: CDN Cache'ini atlamak için Date.now() eklendi
    img.src = companyLogo;
    }, [data?.logo]);
  // --- RENK ANALİZ BİTİŞ ---

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

  const handleMapClick = (e: React.MouseEvent<HTMLAnchorElement>, location: string, apartmentName: string) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && !navigator.onLine) {
      e.preventDefault();
      alert("Haritayı açabilmek için internet bağlantısına ihtiyacınız var.");
    }
  };

  const filteredAssets = data?.assets?.filter((a: any) => {
    const term = searchTerm.toLowerCase();
    const customerName = data?.customers?.find((c: any) => c.id === a.customer_id)?.name || '';
    const aptName = a.apartmentName || a.apartment_name || '';

    return (
      a.name?.toLowerCase().includes(term) ||
      a.location?.toLowerCase().includes(term) ||
      customerName.toLowerCase().includes(term) ||
      aptName.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-full sm:w-auto">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Kayıtlı Varlıklar & QR</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">Tüm cihazları yönetin ve etiketleyin.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cihaz, konum veya müşteri ara..." 
              className="w-full pl-9 pr-4 py-2.5 sm:py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 hover:bg-white transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button onClick={() => setShowAssetModal(true)} className="bg-blue-600 text-white w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap">
            <Plus size={16} /> Yeni Varlık Ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAssets.length > 0 ? filteredAssets.map((a: any) => {
            const aptName = a.apartmentName || a.apartment_name;
            
            return (
              <div 
                key={a.id} 
                onClick={() => setShowAssetDetail && setShowAssetDetail(a)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer flex flex-col group overflow-hidden"
              >
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4 gap-3 flex-wrap sm:flex-nowrap">
                    <div 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden shrink-0 transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundColor: data?.logo ? logoBgColor : '#f8fafc' }}
                    >
                      {data?.logo ? (
                        <img 
                          src={data.logo} 
                          alt="Firma Logosu" 
                          crossOrigin="anonymous"
                          className="w-full h-full object-contain p-2 drop-shadow-sm" 
                        />
                      ) : (
                        <Box size={24} className="text-slate-400 sm:w-[28px] sm:h-[28px]" />
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shrink-0 shadow-sm">
                      <Users size={12}/> <span className="truncate max-w-[100px] sm:max-w-[120px]">{data?.customers?.find((c: any) => c.id === a.customer_id)?.name || 'Genel Müşteri'}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="font-bold text-slate-800 text-lg sm:text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {aptName || a.name}
                    </div>

                    {aptName && (
                      <div className="text-xs sm:text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wide truncate">
                          {a.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100/80">
                    <div className="flex items-start gap-2.5">
                      <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100 shrink-0 mt-0.5">
                        <MapPin size={14} className="text-slate-500" />
                      </div>
                      <div className="flex flex-col gap-2.5 w-full min-w-0">
                        <div className="text-[11px] sm:text-xs text-slate-600 leading-relaxed line-clamp-2 font-medium">
                          {a.location ? a.location.replace(aptName || '', '').replace(/^[\s-/,]+|[\s-/,]+$/g, '').trim() : 'Konum bilgisi eklenmemiş'}
                        </div>
                        
                        <a 
                            href={getMapsUrl(a.location, aptName)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => handleMapClick(e, a.location, aptName)} 
                            className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 w-fit px-3 py-2 sm:py-1.5 rounded-lg transition-all active:scale-95"
                        >
                            <ExternalLink size={12} /> Haritada Gör
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();
                      if (setSelectedQRAsset && setShowQRModal) {
                          setSelectedQRAsset(a);
                          setShowQRModal(true);
                      }
                    }} 
                    className="w-full bg-slate-900 text-white py-3 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-200"
                  >
                    <QrCode size={16} /> QR Etiketini Aç
                  </button>
                </div>
              </div>
            );
        }) : (
          <div className="col-span-full p-16 sm:p-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex flex-col items-center justify-center gap-4">
            <Box size={48} className="text-slate-300" />
            <div className="text-slate-500 font-medium text-sm">
                {searchTerm ? (
                   <span>"<span className="font-bold text-slate-700">{searchTerm}</span>" aramasına uygun varlık bulunamadı.</span>
                ) : (
                   'Henüz sisteme kayıtlı bir varlık bulunmuyor.'
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}