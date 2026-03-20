'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Box, MapPin, Users, Search, QrCode, ExternalLink, Tag, Archive, Loader2, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssetsTab({ data, setShowAddAsset, setSelectedAsset, setShowQRModal, setSelectedQRAsset, setShowSmartExcelModal }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [logoBgColor, setLogoBgColor] = useState<string>('#f8fafc');
  // 🚀 YENİ: Arşiv taranırken butonun durumunu takip edecek sistem eklendi
  const [isScanning, setIsScanning] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });

  // 🚀 GÜVENLİ LİNK DÖNÜŞÜTÜRÜCÜ (PROXY)
  const getSafeImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev')) {
       return url.replace('https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev', '/dosya-deposu');
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
      setAlertModal({ isOpen: true, message: "Haritayı açabilmek için internet bağlantısına ihtiyacınız var.", type: 'warning' });
    }
  };

  const filteredAssets = data?.assets?.filter((a: any) => {
    const term = searchTerm.toLowerCase();
    const customerName = data?.customers?.find((c: any) => c.id === a.customer_id)?.name || '';
    const aptName = a.apartmentName || a.apartment_name || '';
    // 🚀 YENİ: Varlığın ID ve varsa UUID bilgisini arama havuzuna dahil ediyoruz
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

          {/* 🚀 YENİ: Akıllandırılmış Arşiv Tarama Butonu */}
          <button 
            disabled={isScanning}
            onClick={async () => {
               setIsScanning(true); // Yüklenme ekranını başlat
               try {
                 const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken');
                 const res = await fetch(`https://backend.isdokumu.workers.dev/get-archived-jobs?slug=${data.slug}`, {
                     headers: { 'Authorization': `Bearer ${token}` }
                 });
                 
                 if (!res.ok) throw new Error('Sunucu hatası');
                 
                 const archived = await res.json();
                 
                 if(archived.length > 0) {
                  data.jobs = [...archived, ...(data.jobs || [])];
                  setSearchTerm(searchTerm + ' '); // Arayüzü yenilemek için küçük bir taktik
                  setAlertModal({ isOpen: true, message: "Cihazların tüm arşiv dökümleri başarıyla yüklendi. Etiket renkleri ve geçmiş veriler güncellendi.", type: 'success' });
              } else {
                  // Eskiden sessiz kaldığı yer burasıydı, artık kullanıcıya bilgi veriyor
                  setAlertModal({ isOpen: true, message: "Şu anda sisteme eklenecek yeni bir arşiv kaydı bulunamadı.", type: 'info' });
              }
            } catch (error) {
              // Hata durumunda, sıcak-soğuk mimariyi ve R2 aktarımını açıklayan kullanıcı dostu mesaj
              setAlertModal({ 
                  isOpen: true, 
                  message: "Şu an için arşive aktarılmış yeni bir geçmiş kayıt bulunmuyor. Uygulamanızın daima en yüksek hızda çalışması için kayıtlarınız her 2 ayda bir otomatik olarak arşive taşınır. İşlemleriniz henüz taze olduğu için aktif ekranlarınızda yer alıyor olabilir. Daha eski kayıtlarınız için ilerleyen dönemlerde tekrar kontrol edebilirsiniz.", 
                  type: 'warning' 
              });
            } finally {
                 setIsScanning(false); // İşlem bitince yüklenme ekranını kapat
               }
            }}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all whitespace-nowrap ${
              isScanning 
                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 active:scale-95'
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 size={16} className="animate-spin text-blue-500" /> Taranıyor...
              </>
            ) : (
              <>
                <Archive size={16} className="text-blue-500" /> Arşivi Taramaya Başla
              </>
            )}
          </button>

          <button onClick={() => setShowAddAsset(true)} className="bg-blue-600 text-white w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap">
            <Plus size={16} /> Yeni Varlık Ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAssets.length > 0 ? filteredAssets.map((a: any) => {
            const aptName = a.apartmentName || a.apartment_name;
            
            const latestColor = (() => {
              const assetJobs = (data?.jobs || [])
                .filter((j: any) => String(j.asset_id) === String(a.id) && j.work_type === 'Periyodik Bakım')
                .map((j: any) => {
                    let parsed = j.details || {};
                    if (typeof parsed === 'string') {
                        try { parsed = JSON.parse(parsed); } catch(e) { parsed = {}; }
                    }
                    return { ...j, parsedDetails: parsed };
                })
                .filter((j: any) => j.parsedDetails.label_color || j.parsedDetails['Mevcut Etiket'] || j.parsedDetails.etiket)
                .sort((j1: any, j2: any) => new Date(j2.created_at || 0).getTime() - new Date(j1.created_at || 0).getTime());
              
              if (assetJobs.length > 0) {
                 const details = assetJobs[0].parsedDetails;
                 return details.label_color || details['Mevcut Etiket'] || details.etiket;
              }

              return a.label_color || a.labelColor || a.etiket_rengi || null;
            })();

            const checkArchiveForColor = async (assetId: string) => {
               const token = localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken');
               const res = await fetch(`https://backend.isdokumu.workers.dev/get-archived-jobs?slug=${data.slug}&assetId=${assetId}`, {
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
              const c = color.toLowerCase();
              if (c.includes('kırmızı') || c.includes('red')) return 'border-rose-500 hover:border-rose-600 shadow-rose-100/50 bg-rose-50/10';
              if (c.includes('sarı') || c.includes('yellow')) return 'border-amber-400 hover:border-amber-500 shadow-amber-100/50 bg-amber-50/10';
              if (c.includes('mavi') || c.includes('blue')) return 'border-blue-500 hover:border-blue-600 shadow-blue-100/50 bg-blue-50/10';
              if (c.includes('yeşil') || c.includes('green')) return 'border-emerald-500 hover:border-emerald-600 shadow-emerald-100/50 bg-emerald-50/10';
              return 'border-slate-200 hover:border-blue-300 shadow-slate-100/50 bg-white';
            };

            const getBadgeClass = (color: string) => {
              if (!color) return 'hidden';
              const c = color.toLowerCase();
              if (c.includes('kırmızı') || c.includes('red')) return 'bg-rose-100 text-rose-700 border-rose-200';
              if (c.includes('sarı') || c.includes('yellow')) return 'bg-amber-100 text-amber-800 border-amber-200';
              if (c.includes('mavi') || c.includes('blue')) return 'bg-blue-100 text-blue-700 border-blue-200';
              if (c.includes('yeşil') || c.includes('green')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
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
                {latestColor && badgeClass !== 'hidden' && (
                  <div className={`absolute top-4 right-4 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 shadow-sm ${badgeClass}`}>
                    <Tag size={10} /> {latestColor}
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4 gap-3 flex-wrap sm:flex-nowrap">
                    <div 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden shrink-0 transition-transform duration-500 group-hover:scale-105"
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

                    <div className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shrink-0 shadow-sm">
                      <Users size={12}/> <span className="truncate max-w-[100px] sm:max-w-[120px]">{data?.customers?.find((c: any) => c.id === a.customer_id)?.name || 'Genel Müşteri'}</span>
                    </div>
                  </div>

                  <div className="flex-1 mt-1">
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

      {/* 🚀 DİNAMİK UYARI MODALI */}
      <AnimatePresence>
        {alertModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 10 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 10 }} 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center border border-slate-200"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${
                alertModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                alertModal.type === 'error' ? 'bg-rose-50 text-rose-500' : 
                alertModal.type === 'warning' ? 'bg-amber-50 text-amber-500' : 
                'bg-blue-50 text-blue-500'
              }`}>
                {alertModal.type === 'success' && <CheckCircle size={32} />}
                {alertModal.type === 'error' && <AlertCircle size={32} />}
                {alertModal.type === 'warning' && <AlertTriangle size={32} />}
                {alertModal.type === 'info' && <Info size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                {alertModal.type === 'success' ? 'Başarılı!' : 
                 alertModal.type === 'error' ? 'Hata!' : 
                 alertModal.type === 'warning' ? 'Uyarı!' : 
                 'Bilgi'}
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                {alertModal.message}
              </p>
              <button 
                onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-md flex justify-center items-center"
              >
                Tamam
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}