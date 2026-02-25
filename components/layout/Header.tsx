'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Building2, ScanLine, X, ArrowRight, QrCode, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function Header({ data, setIsMobileMenuOpen, setSelectedJob }: any) {
  const router = useRouter(); 
  const [isOffline, setIsOffline] = useState(false);
  
  const [userInfo, setUserInfo] = useState({ name: '', role: '' });
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const qrRef = useRef<Html5Qrcode | null>(null);

  // 🚀 GÜVENLİ LİNK DÖNÜŞÜTÜRÜCÜ (PROXY)
  const getSafeImageUrl = (url: string) => {
    if (!url) return '';
    // Eğer link bizim R2 bucket ise, onu Vercel proxy'sine çevir
    if (url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev')) {
       return url.replace('https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const isPatronPath = window?.location?.pathname?.endsWith('/dashboard');
    const prefix = isPatronPath ? 'patron_' : 'staff_';
    
    const storedRole = localStorage.getItem(`${prefix}userRole`) || '';
    const storedName = localStorage.getItem(`${prefix}userName`) || '';
    let currentName = storedName;

    if (storedRole === 'Patron' || isPatronPath) {
        currentName = data?.ownerName || storedName || 'Firma Sahibi';
    } 

    setUserInfo({ name: currentName, role: isPatronPath ? 'Patron' : storedRole });

    if (data?.logo) {
      const safeLogoUrl = getSafeImageUrl(data.logo);

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onerror = () => setLogoBgColor('#ffffff');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixelData = imageData.data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < pixelData.length; i += 4) {
            if (pixelData[i + 3] < 128) continue; 
            r += pixelData[i]; g += pixelData[i + 1]; b += pixelData[i + 2]; count++;
          }
          if (count > 0) {
            r = Math.floor(r / count); g = Math.floor(g / count); b = Math.floor(b / count);
            const palette = [
              { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
              { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, 
              { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }
            ];
            let maxDist = -1; let selectedColor = '#ffffff';
            for (const color of palette) {
              const dist = Math.sqrt(Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2));
              if (dist > maxDist) { maxDist = dist; selectedColor = color.hex; }
            }
            setLogoBgColor(selectedColor);
          }
        } catch (e) { console.error(e); }
      };
      img.src = safeLogoUrl + (safeLogoUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
    } else {
      setLogoBgColor('#ffffff');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [data]);

  const notificationCount = (data?.activeEmergencies?.length || 0) + (data?.pendingFaults?.length || 0);

  const processQRData = (code: string) => {
    if (!code.trim()) return;
    
    stopCamera(); 
    
    let extractedId = code.trim();
    if (extractedId.includes('/q/')) {
        extractedId = extractedId.split('/q/')[1].split('?')[0].split('/')[0];
    }

    const isUsta = userInfo.role === 'Usta';
    
    let finalUuidForRouting = extractedId; 
    
    if (data?.assets) {
        const foundAsset = data.assets.find((a: any) => String(a.uuid) === String(extractedId) || String(a.id) === String(extractedId));
        
        if (foundAsset) {
            finalUuidForRouting = foundAsset.uuid || foundAsset.id; 

            if (isUsta && data?.jobs) {
                const activeJob = data.jobs.find((j: any) => 
                    (String(j.asset_id) === String(foundAsset.id) || String(j.asset_id) === String(foundAsset.uuid)) &&
                    (j.status === 'Beklemede' || j.status === 'Gelecek' || j.status === 'Devam Ediyor' || j.status === 'Sahada')
                );
                
                if (activeJob) {
                    setSelectedJob(activeJob); 
                    setShowScanner(false);
                    setManualCode('');
                    return; 
                }
            }
        }
    }

    router.push(`/q/${finalUuidForRouting}`);
    setShowScanner(false);
    setManualCode('');
  };

  const startCamera = () => {
    setIsCameraActive(true);
    setCameraError('');

    setTimeout(() => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader-container");
        qrRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "environment" }, 
          {
            fps: 10,    
            qrbox: { width: 250, height: 250 }, 
            aspectRatio: 1.0
          },
          (decodedText) => {
            processQRData(decodedText);
          },
          (errorMessage) => {}
        ).catch((err) => {
          console.error(err);
          setCameraError("Kameraya erişilemedi. Tarayıcı izinlerini kontrol edin.");
          setIsCameraActive(false);
        });
      } catch (err) {
         console.error(err);
         setCameraError("Kamera başlatılırken bir sorun oluştu.");
         setIsCameraActive(false);
      }
    }, 150);
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    if (qrRef.current) {
      try {
        qrRef.current.stop().then(() => {
          qrRef.current?.clear();
          qrRef.current = null;
        }).catch(() => {});
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (!showScanner) {
        stopCamera();
    }
    return () => {
        stopCamera(); 
    };
  }, [showScanner]);

  return (
    <>
      <header className="h-16 sm:h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="lg:hidden p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all active:scale-95 border border-slate-100 shrink-0"
          >
            <Menu size={20} />
          </button>

          {data?.logo ? (
            <div 
               className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-200/50 p-1.5 overflow-hidden"
               style={{ backgroundColor: logoBgColor }}
            >
               <img src={getSafeImageUrl(data.logo)} alt="Firma Logo" crossOrigin="anonymous" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <Building2 size={20} />
            </div>
          )}

          <div className="flex flex-col justify-center ml-1">
            <h1 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2 tracking-tight max-w-[150px] sm:max-w-xs">
              <span className="truncate">{data?.name || 'Yükleniyor...'}</span>
              <span title={isOffline ? "Çevrimdışı (Önbellek)" : "Çevrimiçi (Canlı)"} className={`w-2 h-2 rounded-full animate-pulse shadow-sm shrink-0 ${isOffline ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
            </h1>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate max-w-[80px] sm:max-w-[120px]">
                {userInfo.name || 'Yönetim'}
              </span>
              
              {/* DÜZENLENEN KISIM: Mobil Görünüm İyileştirildi */}
              {userInfo.role && (
                <span className={`text-[10px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border shadow-sm shrink-0
                  ${userInfo.role === 'Patron' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                    userInfo.role === 'Yönetici' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                >
                  {userInfo.role}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          
          <button 
             onClick={() => setShowScanner(true)}
             className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all active:scale-95 shadow-md shadow-blue-600/20 group"
          >
             <ScanLine size={18} className="group-hover:scale-110 transition-transform" />
             <span className="hidden sm:inline text-xs font-bold">QR Okut</span>
          </button>

          <button className="relative p-2.5 sm:p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
         {showScanner && (
            <div className="fixed inset-0 bg-slate-900/90 sm:bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-0 sm:p-4">
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                  animate={{ scale: 1, opacity: 1, y: 0 }} 
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="bg-white w-full h-full sm:h-auto sm:max-w-sm sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
               >
                  <button onClick={() => setShowScanner(false)} className="absolute top-6 sm:top-4 right-6 sm:right-4 text-slate-400 hover:text-slate-800 transition-colors bg-white/50 backdrop-blur-sm rounded-full p-2 sm:p-1 active:scale-95 z-50"><X size={20}/></button>

                  <div className="bg-slate-900 h-[50vh] sm:h-64 relative flex flex-col items-center justify-center overflow-hidden shrink-0">
                     {isCameraActive ? (
                        <div className="w-full h-full bg-black relative flex items-center justify-center">
                           <div id="qr-reader-container" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center p-6 text-center z-10">
                           <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-400/30">
                              <Camera size={32} className="text-blue-400" />
                           </div>
                           <h3 className="text-xl font-black text-white mb-2">Canlı QR Tarayıcı</h3>
                           {cameraError ? (
                              <p className="text-xs text-rose-400 font-bold bg-rose-500/10 p-2 rounded-lg">{cameraError}</p>
                           ) : (
                              <button onClick={startCamera} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                                 <ScanLine size={18} /> Kamerayı Aç
                              </button>
                           )}
                        </div>
                     )}
                  </div>

                  <div className="p-6 sm:p-6 space-y-6 flex-1 flex flex-col justify-center sm:justify-start">
                     
                     <div className="flex items-center gap-4 w-full">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-xs sm:text-[10px] font-black text-slate-400 uppercase">VEYA MANUEL GİRİŞ</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                     </div>

                     <div className="space-y-4 sm:space-y-3">
                        <label className="text-xs sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Sistem Kodu (ID) Gir</label>
                        <div className="flex gap-2 h-14 sm:h-auto">
                           <input 
                              type="text" 
                              value={manualCode}
                              onChange={(e) => setManualCode(e.target.value)}
                              placeholder="Etiketteki ID'yi yazın..." 
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 sm:px-4 py-3 text-base sm:text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
                           />
                           <button 
                              onClick={() => processQRData(manualCode)}
                              disabled={!manualCode.trim()}
                              className="bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
                           >
                              <ArrowRight size={24} className="sm:w-5 sm:h-5" />
                           </button>
                        </div>
                     </div>

                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </>
  );
}