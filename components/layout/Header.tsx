'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Building2, ScanLine, X, Camera, ArrowRight, QrCode, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// DİKKAT: setSelectedJob prop'unu ekledik. Dashboardlardan buraya aktarılması gerekiyor.
export default function Header({ data, setIsMobileMenuOpen, setSelectedJob }: any) {
  const [isOffline, setIsOffline] = useState(false);
  
  const [userInfo, setUserInfo] = useState({ name: '', role: '', branch: '' });
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

  // YENİ: Akıllı QR Tarayıcı State'leri
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    let currentBranch = '';
    let currentName = storedName;

    if (storedRole === 'Patron' || isPatronPath) {
        currentName = data?.ownerName || storedName || 'Firma Sahibi';
        currentBranch = ''; 
    } 
    else if (data?.staff) {
        const currentStaff = data.staff.find((s: any) => s.name === storedName);
        if (currentStaff) {
            currentBranch = currentStaff.branch || 'Saha Ekibi';
        }
    }

    setUserInfo({ name: currentName, role: isPatronPath ? 'Patron' : storedRole, branch: currentBranch });

    if (data?.logo) {
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
      img.src = data.logo;
    } else {
      setLogoBgColor('#ffffff');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [data]);

  const notificationCount = (data?.activeEmergencies?.length || 0) + (data?.pendingFaults?.length || 0);

  // ==========================================
  // YENİ: AKILLI QR YÖNLENDİRME (SMART ROUTING)
  // ==========================================
  const processQRData = (code: string) => {
    if (!code.trim()) return;
    
    // 1. Temizleme: Eğer tam URL geldiyse (örn: isdokumu.com/q/123), sadece UUID'yi çıkar.
    let extractedUuid = code.trim();
    if (extractedUuid.includes('/q/')) {
        extractedUuid = extractedUuid.split('/q/')[1].split('?')[0].split('/')[0];
    }

    const isUsta = userInfo.role === 'Usta';
    
    // 2. Eğer USTA ise ve cihaz sisteme kayıtlıysa "Bana atanmış iş var mı?" diye kontrol et
    if (isUsta && setSelectedJob && data?.assets) {
        const foundAsset = data.assets.find((a: any) => a.uuid === extractedUuid);
        
        if (foundAsset && data?.jobs) {
            // Ustanın bu cihaza ait tamamlanmamış bir işi var mı?
            const activeJob = data.jobs.find((j: any) => 
                (String(j.asset_id) === String(foundAsset.id) || String(j.asset_id) === String(foundAsset.uuid)) &&
                (j.status === 'Beklemede' || j.status === 'Gelecek' || j.status === 'Devam Ediyor' || j.status === 'Sahada')
            );
            
            if (activeJob) {
                setSelectedJob(activeJob); // İŞ KAYDI MODALINI AÇ!
                setShowScanner(false);
                setManualCode('');
                return; // Buradan sonrasına gitme, işlem tamam!
            }
        }
    }

    // 3. Eğer Usta değilse VEYA Usta ama üzerine o cihaza atanmış iş yoksa -> Cihaz Profiline Git
    window.open(`/q/${extractedUuid}`, '_blank');
    setShowScanner(false);
    setManualCode('');
  };

  // NATIVE KAMERA BARKOD OKUMA (Extra kütüphane gerektirmez, Android/Chrome/iOS Safari destekler)
  const handleCameraScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanLoading(true);

    // Modern tarayıcı barkod okuyucu API kontrolü
    if (!('BarcodeDetector' in window)) {
        alert("Tarayıcınız çevrimdışı barkod okumayı desteklemiyor. Lütfen kodu manuel girin veya cihazınızın kendi kamerasından linke tıklayın.");
        setScanLoading(false);
        return;
    }

    try {
        const bitmap = await createImageBitmap(file);
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(bitmap);
        
        if (barcodes.length > 0) {
            processQRData(barcodes[0].rawValue);
        } else {
            alert("QR Kod tespit edilemedi. Lütfen daha net bir fotoğraf çekin veya manuel kod girin.");
        }
    } catch (err) {
        console.error(err);
        alert("Görsel işlenirken bir hata oluştu.");
    } finally {
        setScanLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
               <img src={data.logo} alt="Firma Logo" className="w-full h-full object-contain drop-shadow-sm" />
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
            
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate max-w-[70px] sm:max-w-[120px]">
                {userInfo.name || 'Yönetim'}
              </span>
              
              {userInfo.role && (
                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shadow-sm shrink-0
                  ${userInfo.role === 'Patron' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                    userInfo.role === 'Yönetici' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                    'bg-emerald-100 text-emerald-700 border-emerald-200'}`}
                >
                  {userInfo.role}
                </span>
              )}

              {userInfo.branch && userInfo.role !== 'Patron' && (
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shadow-sm shrink-0 truncate max-w-[70px] sm:max-w-[120px]">
                  {userInfo.branch}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          
          {/* YENİ: QR OKUTMA BUTONU */}
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

      {/* YENİ: AKILLI QR OKUMA MODALI */}
      <AnimatePresence>
         {showScanner && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col"
               >
                  <div className="bg-slate-900 p-6 flex flex-col items-center text-center text-white relative overflow-hidden">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-50"></div>
                     <button onClick={() => setShowScanner(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-white/10 rounded-full p-1"><X size={20}/></button>
                     
                     <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-400/30 relative z-10">
                        <QrCode size={32} className="text-blue-400" />
                     </div>
                     <h3 className="text-xl font-black mb-1 relative z-10 tracking-tight">Akıllı QR Tarayıcı</h3>
                     <p className="text-xs text-slate-400 font-medium relative z-10">
                        {userInfo.role === 'Usta' ? 'Kayıtlı cihazın aktif iş formuna veya profiline atlayın.' : 'Cihaz detaylarına ve geçmişine anında ulaşın.'}
                     </p>
                  </div>

                  <div className="p-6 space-y-6">
                     
                     <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Kamera İle Oku</label>
                         <button 
                            disabled={scanLoading}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-dashed border-blue-200 py-4 rounded-2xl font-bold transition-all active:scale-95 group disabled:opacity-50"
                         >
                            {scanLoading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} className="group-hover:scale-110 transition-transform" />}
                            {scanLoading ? 'İşleniyor...' : 'Fotoğraf Çek / Yükle'}
                         </button>
                         {/* Gizli Dosya Seçici (Kamerayı tetikler) */}
                         <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            ref={fileInputRef} 
                            onChange={handleCameraScan} 
                            className="hidden" 
                         />
                     </div>

                     <div className="flex items-center gap-4 w-full">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">VEYA</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Manuel Kod / Link</label>
                        <div className="flex gap-2">
                           <input 
                              type="text" 
                              value={manualCode}
                              onChange={(e) => setManualCode(e.target.value)}
                              placeholder="Kısa kod veya linki yapıştır" 
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white transition-all text-slate-700"
                           />
                           <button 
                              onClick={() => processQRData(manualCode)}
                              disabled={!manualCode.trim()}
                              className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
                           >
                              <ArrowRight size={20} />
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