'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Box, MapPin, Users, Search, QrCode } from 'lucide-react';

export default function AssetsTab({ data, setShowAssetModal, setShowAssetDetail, setShowQRModal, setSelectedQRAsset }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  // Logo arka plan rengi için state. Varsayılan: slate-50 (#f8fafc)
  const [logoBgColor, setLogoBgColor] = useState<string>('#f8fafc');

  // --- RENK ANALİZ MOTORU BAŞLANGICI ---
  // Firma logosu (data.logo) değiştiğinde çalışır.
  // Logonun ortalama rengini bulur ve ona en zıt düşen arka plan rengini (Beyaz, Siyah, Mavi) seçer.
  useEffect(() => {
    const companyLogo = data?.logo;
    // Logo yoksa varsayılan açık gri rengi kullan
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
        
        // Pikselleri tara (her 4. pikseli alarak performansı artır, şeffaf pikselleri atla)
        for (let i = 0; i < dataPixels.length; i += 4) {
          if (dataPixels[i + 3] < 128) continue; // Şeffaflık kontrolü
          r += dataPixels[i];
          g += dataPixels[i + 1];
          b += dataPixels[i + 2];
          count++;
        }
        
        if (count > 0) {
          // Ortalama RGB rengini bul
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          // Kullanılabilecek arka plan paleti
          const palette = [
            { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
            { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, // slate-900
            { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }  // blue-600
          ];

          let maxDist = -1;
          let selectedColor = '#ffffff';

          // Logodaki ortalama renge EN UZAK (en zıt) olan rengi bul
          for (const color of palette) {
            const dist = Math.sqrt(Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2));
            if (dist > maxDist) {
              maxDist = dist;
              selectedColor = color.hex;
            }
          }
          setLogoBgColor(selectedColor);
        }
      } catch (e) {
        console.error("Renk analizi yapılamadı:", e);
        setLogoBgColor('#f8fafc'); // Hata durumunda varsayılan renk
      }
    };
    img.onerror = () => setLogoBgColor('#f8fafc'); // Resim yüklenemezse varsayılan renk
    img.src = companyLogo;
  }, [data?.logo]);
  // --- RENK ANALİZ MOTORU BİTİŞİ ---

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
            // Ana kart rengi bg-white olarak sabit
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 cursor-pointer transition-colors flex flex-col group"
          >
            {/* DİNAMİK LOGO KUTUSU - Sadece burası renk değiştirir */}
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 border border-slate-100 overflow-hidden shadow-sm transition-all duration-500 group-hover:scale-105"
              // DİKKAT: Arka plan rengi sadece bu kutuya uygulanıyor
              style={{ backgroundColor: data?.logo ? logoBgColor : '#f8fafc' }}
            >
              {data?.logo ? (
                <img 
                  src={data.logo} 
                  alt="Firma Logosu" 
                  // Logo koyu bir zemine denk gelirse kenarlara yapışmasın diye biraz padding ekledim
                  className="w-full h-full object-contain p-1.5 drop-shadow-sm" 
                />
              ) : (
                // Logo yoksa varsayılan ikon
                <Box size={18} className="text-slate-400" />
              )}
            </div>

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