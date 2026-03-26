'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Building2, ScanLine, X, ArrowRight, QrCode, Camera, AlertTriangle, Wrench, Package, Info, CheckCircle2, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function Header({ data, setIsMobileMenuOpen, setSelectedJob }: any) {
  const router = useRouter(); 
  const [isOffline, setIsOffline] = useState(false);
  
  const [userInfo, setUserInfo] = useState({ name: '', role: '' });
  const [userId, setUserId] = useState<string | null>(null);
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const qrRef = useRef<Html5Qrcode | null>(null);

  // 🚀 BİLDİRİM MENÜSÜ STATE'İ
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // 🚀 GÜVENLİ LİNK DÖNÜŞÜTÜRÜCÜ (PROXY)
  const getSafeImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev')) {
       return url.replace('https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  // Zamanı "5 dk önce", "2 saat önce" gibi formatlamak için yardımcı fonksiyon
  const timeAgo = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffMins < 1) return 'Az önce';
      if (diffMins < 60) return `${diffMins} dk önce`;
      if (diffHrs < 24) return `${diffHrs} saat önce`;
      if (diffDays === 1) return `Dün`;
      return `${diffDays} gün önce`;
  };

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Menü dışına tıklanınca bildirimleri kapatma
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const isPatronPath = window?.location?.pathname?.endsWith('/dashboard');
    const prefix = isPatronPath ? 'patron_' : 'staff_';
    
    const storedRole = localStorage.getItem(`${prefix}userRole`) || '';
    const storedName = localStorage.getItem(`${prefix}userName`) || '';
    let currentName = storedName;

    if (storedRole === 'Patron' || isPatronPath) {
        currentName = data?.ownerName || storedName || 'Firma Sahibi';
    } 

    setUserInfo({ name: currentName, role: isPatronPath ? 'Patron' : storedRole });

    const token = localStorage.getItem(`${prefix}authToken`);
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            setUserId(JSON.parse(jsonPayload).id);
        } catch (e) {}
    }

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
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [data]);

// 🚀 BİLDİRİMLERİ HARMANLAMA MOTORU (Acil Durum + Arıza + Malzeme + SOS)
const getNotifications = () => {
  if (userInfo.role === 'Usta') {
      if (!userId || !data?.jobs) return [];
      
      const myPendingJobs = data.jobs.filter((j: any) => 
          String(j.staff_id) === String(userId) && 
          (j.status === 'Beklemede' || j.status === 'Usta Bekliyor' || j.status === 'Gelecek')
      );

      return myPendingJobs.map((j: any) => {
          const asset = data.assets?.find((a: any) => String(a.id) === String(j.asset_id));
          const assetName = asset ? (asset.apartmentName || asset.name) : j.customer_name;
          
          return {
              id: `job-${j.id}`,
              type: 'job',
              title: `Yeni Görev: ${j.work_type}`,
              desc: `Konum: ${assetName}`,
              date: j.created_at,
              timestamp: new Date(j.created_at || 0).getTime(),
              originalJob: j
          };
      }).sort((a: any, b: any) => b.timestamp - a.timestamp);
  }

  const emergencies = data?.activeEmergencies || [];
  const faults = data?.pendingFaults || [];
  const materials = data?.pendingMaterialRequests || [];

  const all = [
      ...emergencies.map((e: any) => ({
          id: e.id,
          type: e.staff_id ? 'sos' : 'emergency', // Usta gönderdiyse SOS, Müşteri gönderdiyse Acil Durum
          title: e.staff_id ? `Personel Acil Durumu` : `Acil Müdahale`,
          desc: e.staff_id ? (e.message || `${e.staff_name} yardım talep etti.`) : `Bina: ${e.asset_apartment || 'Bilinmiyor'}`,
          date: e.created_at,
          timestamp: new Date(e.created_at).getTime()
      })),
      ...faults.map((f: any) => ({
          id: f.id,
          type: 'fault',
          title: `Arıza Bildirimi`,
          desc: `Bina: ${f.asset_apartment || 'Bilinmiyor'} - ${f.description || 'Detay yok'}`,
          date: f.created_at,
          timestamp: new Date(f.created_at).getTime()
      })),
      ...materials.map((m: any) => ({
          id: m.id,
          type: 'material',
          title: `Malzeme Talebi`,
          desc: `${m.staff_name} yeni malzeme talep etti.`,
          date: m.created_at,
          timestamp: new Date(m.created_at).getTime()
      }))
  ];

  return all.sort((a, b) => b.timestamp - a.timestamp); // En yeni en üstte
};

const notifications = getNotifications();
const notificationCount = notifications.length;

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
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => processQRData(decodedText),
          (errorMessage) => {}
        ).catch((err) => {
          setCameraError("Kameraya erişilemedi. Tarayıcı izinlerini kontrol edin.");
          setIsCameraActive(false);
        });
      } catch (err) {
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
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (!showScanner) stopCamera();
    return () => stopCamera(); 
  }, [showScanner]);

  return (
    <>
      {/* 🚀 MOBİL UYUMLULUK VE ESNEK (FLEX) YAPI İYİLEŞTİRİLDİ */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm relative">
        
        {/* SOL KISIM: Logo ve İsim (flex-1 ve overflow-hidden eklendi) */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="lg:hidden p-1.5 sm:p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all active:scale-95 border border-slate-100 shrink-0"
          >
            <Menu size={20} />
          </button>

          {data?.logo ? (
            <div 
               className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-200/50 p-1.5 overflow-hidden"
               style={{ backgroundColor: logoBgColor }}
            >
               <img src={getSafeImageUrl(data.logo)} alt="Firma Logo" crossOrigin="anonymous" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
          ) : (
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <Building2 size={18} />
            </div>
          )}

          {/* Yazı Alanı (Uzun isimler mobilde kayarak devam eder) */}
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <h1 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2 tracking-tight truncate">
              <span className="truncate">{data?.name || 'Yükleniyor...'}</span>
              <span title={isOffline ? "Çevrimdışı (Önbellek)" : "Çevrimiçi (Canlı)"} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse shadow-sm shrink-0 ${isOffline ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
            </h1>
            
            <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1 truncate">
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">
                {userInfo.name || 'Yönetim'}
              </span>
              
              {userInfo.role && (
                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shadow-sm shrink-0
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

        {/* SAĞ KISIM: Butonlar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
          <button 
             onClick={() => setShowScanner(true)}
             className="relative flex items-center justify-center gap-2 p-2 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all active:scale-95 shadow-md shadow-blue-600/20 group"
          >
             <ScanLine size={18} className="group-hover:scale-110 transition-transform" />
             <span className="hidden sm:inline text-xs font-bold">QR Okut</span>
          </button>

          <div ref={notificationRef} className="relative">
            <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`relative p-2 w-9 h-9 sm:w-auto sm:h-auto border rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm
                  ${isNotificationOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'}
                `}
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* 🚀 AÇILIR BİLDİRİM MENÜSÜ (DROPDOWN) */}
            <AnimatePresence>
                {isNotificationOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 sm:top-14 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-[100]"
                    >
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-sm font-black text-slate-800">Bildirim Merkezi</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Son Aktiviteler</p>
                            </div>
                            {notificationCount > 0 && (
                                <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded-md text-[10px] font-black">
                                    {notificationCount} Bekleyen
                                </span>
                            )}
                        </div>

                        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
                            {notifications.length > 0 ? notifications.map((notif: any) => (
                                <div 
                                    key={notif.id} 
                                    onClick={() => {
                                        if (notif.type === 'job' && setSelectedJob) {
                                            setSelectedJob(notif.originalJob);
                                            setIsNotificationOpen(false);
                                        }
                                    }}
                                    className={`p-4 transition-colors flex gap-3 items-start group ${notif.type === 'job' ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-slate-50'}`}
                                >
                                    {/* İkonlar duruma göre renkleniyor */}
                                    <div className={`mt-0.5 p-2 rounded-xl shrink-0 shadow-sm
                                        ${notif.type === 'sos' || notif.type === 'emergency' ? 'bg-rose-100 text-rose-600' : 
                                          notif.type === 'fault' ? 'bg-amber-100 text-amber-600' : 
                                          notif.type === 'job' ? 'bg-blue-100 text-blue-600' :
                                          'bg-emerald-100 text-emerald-600'}`}
                                    >
                                        {notif.type === 'sos' || notif.type === 'emergency' ? <AlertTriangle size={16} /> :
                                         notif.type === 'fault' ? <Wrench size={16} /> : 
                                         notif.type === 'job' ? <Briefcase size={16} /> : 
                                         <Package size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className={`text-xs font-black truncate ${
                                                notif.type === 'sos' || notif.type === 'emergency' ? 'text-rose-700' : 'text-slate-800'
                                            }`}>
                                                {notif.title}
                                            </h4>
                                            <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                                                {timeAgo(notif.date)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                                            {notif.desc}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-700 mb-1">Her Şey Yolunda</h4>
                                    <p className="text-xs text-slate-500 font-medium">Aktif bir çağrı veya bildirim bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Tümünü gör butonu (görsel olarak eklendi, yönetici zaten sekmelerden detayları görüyor) */}
                        {notificationCount > 0 && (
                             <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                     Detaylar için ilgili menüleri ziyaret edin.
                                 </span>
                             </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* QR Tarayıcı Modalı */}
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