'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Box, MapPin, Users, Search, QrCode, ExternalLink, Tag, Archive, Loader2, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssetsTab({ data, setShowAddAsset, setSelectedAsset, setShowQRModal, setSelectedQRAsset, setShowSmartExcelModal }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [logoBgColor, setLogoBgColor] = useState<string>('#f8fafc');

  // 🚀 GÜVENLİ LİNK DÖNÜŞÜTÜRÜCÜ (PROXY)
  const getSafeImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.includes('pub-a78064a5e9304242b0982c01b5778197.r2.dev')) {
       return url.replace('https://pub-a78064a5e9304242b0982c01b5778197.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  useEffect(() => {
    const companyLogo = data?.logo;
    if (!companyLogo || typeof window !== 'undefined' && !navigator.onLine) {
      setLogoBgColor('#f8fafc');
      return;
    }

    const safeLogoUrl = getSafeImageUrl(companyLogo);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onerror = () => setLogoBgColor('#f8fafc');

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
    img.src = safeLogoUrl + (safeLogoUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
  }, [data?.logo]);

  const getMapsUrl = (location: string, apartmentName: string) => {
    if (!location) return '#';
    let mapQuery = location;
    if (apartmentName && mapQuery.includes(apartmentName)) {
      mapQuery = mapQuery.replace(apartmentName, '').trim();
      if (mapQuery.startsWith('-') || mapQuery.startsWith('/')) {
        mapQuery = mapQuery.substring(1).trim();
      }
    }
    return `https://www.google.com/maps/search/?api=1&query=$${encodeURIComponent(mapQuery)}`;
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
    const assetIdStr = a.id ? a.id.toString().toLowerCase() : '';
    const assetUuidStr = a.uuid ? a.uuid.toString().toLowerCase() : '';

    return (
      a.name?.toLowerCase().includes(term) ||
      a.location?.toLowerCase().includes(term) ||
      customerName.toLowerCase().includes(term) ||
      aptName.toLowerCase().includes(term) ||
      assetIdStr.includes(term) ||
      assetUuidStr.includes(term)
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
              placeholder="Cihaz, konum, müşteri veya QR ID ara..." 
              className="w-full pl-9 pr-4 py-2.5 sm:py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 hover:bg-white transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button onClick={() => setShowSmartExcelModal && setShowSmartExcelModal(true)} className="bg-emerald-600 text-white w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all whitespace-nowrap">
            <Box size={16} /> Akıllı Excel Yükle
          </button>

          <button onClick={() => setShowAddAsset(true)} className="bg-blue-600 text-white w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap">
            <Plus size={16} /> Yeni Varlık Ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAssets.length > 0 ? filteredAssets.map((a: any) => {
            const aptName = a.apartmentName || a.apartment_name;
            
            // 🚀 YENİ: Hem String Metin, Hem de JSON içi arama yapabilen akıllı renk çıkarıcı
            const latestColor = (() => {
              const assetJobs = (data?.jobs || [])
                .filter((j: any) => String(j.asset_id) === String(a.id) && j.work_type === 'Periyodik Bakım')
                .sort((j1: any, j2: any) => new Date(j2.created_at || 0).getTime() - new Date(j1.created_at || 0).getTime());
              
              for (const job of assetJobs) {
                  let parsed = job.details || {};
                  if (typeof parsed === 'string') {
                      try { parsed = JSON.parse(parsed); } catch(e) { parsed = {}; }
                  }
                  
                  // 1. JSON Objesi ise içindeki key'leri tara
                  for (const [key, val] of Object.entries(parsed)) {
                      const k = String(key).toLowerCase();
                      const v = String(val).toLowerCase();
                      if (k.includes('etiket')) {
                          if (v.includes('kırmızı') || v.includes('red') || v.includes('kirmizi')) return 'Kırmızı';
                          if (v.includes('sarı') || v.includes('yellow') || v.includes('sari')) return 'Sarı';
                          if (v.includes('mavi') || v.includes('blue')) return 'Mavi';
                          if (v.includes('yeşil') || v.includes('green') || v.includes('yesil')) return 'Yeşil';
                          return String(val); // Rengi bulamazsa direkt kendi adını dönsün
                      }
                  }

                  // 2. Metin İçine Gömülü "Saha Formu" varsa satır satır tara (Referans koddaki yapı)
                  const rawNote = parsed.note || job.taskNote || '';
                  if (rawNote && typeof rawNote === 'string') {
                      const lines = rawNote.split('\n');
                      for (const line of lines) {
                          const lowerLine = line.toLowerCase();
                          if (lowerLine.includes('etiket') && lowerLine.includes(':')) {
                              if (lowerLine.includes('kırmızı') || lowerLine.includes('red') || lowerLine.includes('kirmizi')) return 'Kırmızı';
                              if (lowerLine.includes('sarı') || lowerLine.includes('yellow') || lowerLine.includes('sari')) return 'Sarı';
                              if (lowerLine.includes('mavi') || lowerLine.includes('blue')) return 'Mavi';
                              if (lowerLine.includes('yeşil') || lowerLine.includes('green') || lowerLine.includes('yesil')) return 'Yeşil';
                          }
                      }
                  }
              }

              return a.label_color || a.labelColor || a.etiket_rengi || null;
            })();

            const checkArchiveForColor = async (assetId: string) => {
               const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken');
               const res = await fetch(`https://backend.fixlog-co.workers.dev/get-archived-jobs?slug=${data.slug}&assetId=${assetId}`, {
                   headers: { 'Authorization': `Bearer ${token}` }
               });
               const archived = await res.json();
               if (archived.length > 0) {
                   data.jobs = [...archived, ...data.jobs];
                   setSearchTerm(searchTerm + ' '); 
               }
            };

            const getBorderClass = (color: string) => {
              if (!color) return 'border-slate-200 hover:border-blue-300 shadow-slate-100/50 bg-white';
              const c = String(color).toLowerCase();
              if (c.includes('kırmızı') || c.includes('red') || c.includes('kirmizi')) return 'border-rose-500 hover:border-rose-600 shadow-rose-100/50 bg-rose-50/10';
              if (c.includes('sarı') || c.includes('yellow') || c.includes('sari')) return 'border-amber-400 hover:border-amber-500 shadow-amber-100/50 bg-amber-50/10';
              if (c.includes('mavi') || c.includes('blue')) return 'border-blue-500 hover:border-blue-600 shadow-blue-100/50 bg-blue-50/10';
              if (c.includes('yeşil') || c.includes('green') || c.includes('yesil')) return 'border-emerald-500 hover:border-emerald-600 shadow-emerald-100/50 bg-emerald-50/10';
              return 'border-slate-200 hover:border-blue-300 shadow-slate-100/50 bg-white';
            };

            const getBadgeClass = (color: string) => {
              if (!color) return 'hidden';
              const c = String(color).toLowerCase();
              if (c.includes('kırmızı') || c.includes('red') || c.includes('kirmizi')) return 'bg-rose-100 text-rose-700 border-rose-200';
              if (c.includes('sarı') || c.includes('yellow') || c.includes('sari')) return 'bg-amber-100 text-amber-800 border-amber-200';
              if (c.includes('mavi') || c.includes('blue')) return 'bg-blue-100 text-blue-700 border-blue-200';
              if (c.includes('yeşil') || c.includes('green') || c.includes('yesil')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
              return 'hidden';
            };

            const borderClass = getBorderClass(latestColor);
            const badgeClass = getBadgeClass(latestColor);
            
            return (
              <div 
                key={a.id} 
                onClick={() => setSelectedAsset && setSelectedAsset(a)}
                className={`rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col group overflow-hidden relative ${borderClass}`}
              >
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex flex-row items-start justify-between mb-4 gap-2 sm:gap-3 w-full">
                    {/* LOGO */}
                    <div 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden shrink-0 transition-transform duration-500 group-hover:scale-105 relative z-10"
                      style={{ backgroundColor: data?.logo ? logoBgColor : '#ffffff' }}
                    >
                      {data?.logo ? (
                        <img 
                          src={getSafeImageUrl(data.logo)} 
                          alt="Firma Logosu" 
                          crossOrigin="anonymous"
                          className="w-full h-full object-contain p-2 drop-shadow-sm" 
                        />
                      ) : (
                        <Box size={24} className="text-slate-400 sm:w-[28px] sm:h-[28px]" />
                      )}
                    </div>

                    {/* ETİKET VE MÜŞTERİ BİLGİSİ (Mobilde Sıkışmayı Önleyen Kısım) */}
                    <div className="flex flex-col items-end justify-start gap-1.5 sm:gap-2 flex-1 min-w-0">
                      {latestColor && badgeClass !== 'hidden' && (
                        <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 shadow-sm shrink-0 w-max max-w-full ${badgeClass}`}>
                          <Tag size={10} className="shrink-0" /> <span className="truncate">{latestColor}</span>
                        </div>
                      )}
                      <div className="bg-slate-100 border border-slate-200 text-slate-700 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-1 sm:gap-1.5 shadow-sm max-w-full">
                        <Users size={12} className="shrink-0" /> 
                        <span className="truncate">
                          {data?.customers?.find((c: any) => c.id === a.customer_id)?.name || 'Genel Müşteri'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 mt-1">
                    <div className="font-bold text-slate-800 text-lg sm:text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 pr-16">
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

                <div className="p-3 sm:p-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
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