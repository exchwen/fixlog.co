'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Phone, ShieldCheck, Box, MapPin, History, X, ShieldAlert, ChevronRight, User, MessageCircle, Info, WifiOff, Download, Share, Check, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssetScanPage() {
  const { uuid } = useParams();
  const router = useRouter(); 
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modallar için State'ler
  const [showHistory, setShowHistory] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [showFaultModal, setShowFaultModal] = useState(false);
  
  // PWA ANA EKRANA EKLE STATE'LERİ
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installState, setInstallState] = useState('idle');

  // Form ve İstek State'leri
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faultForm, setFaultForm] = useState({ name: '', phone: '', description: '' });

  // Logo Arka Plan Rengi
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

  // ÇEVRİMDIŞI, CACHE VE SMART STATE KONTROLLERİ
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Personel Sıkışmasını Önleyen "Panele Dön" State'i
  const [staffRole, setStaffRole] = useState<string | null>(null);

  const API_URL = 'https://backend.isdokumu.workers.dev'; 

  // PWA Kurulum Dinleyicisi
  useEffect(() => {
    // 1. ZIRH: Eğer kullanıcı zaten sistemdeyse ve barkodu okuttuysa "Panele Dön" butonunu göster
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    if (token && role) {
        setStaffRole(role);
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isIOSDevice) {
      setIsIos(true);
      setTimeout(() => setShowPwaPrompt(true), 2000);
    } else {
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShowPwaPrompt(true), 2000);
      };
      window.addEventListener('beforeinstallprompt', handler);

      const handleInstalled = () => {
        setInstallState('success');
        setTimeout(() => setShowPwaPrompt(false), 3000);
      };
      window.addEventListener('appinstalled', handleInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallState('success');
        setTimeout(() => setShowPwaPrompt(false), 3000);
      }
      setDeferredPrompt(null);
    }
  };

  // Ağ (Online First) ve Cache Stratejisi
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`${API_URL}/public/get-asset?uuid=${uuid}`);
        if (!res.ok) throw new Error('Varlık bulunamadı');
        const data = await res.json();
        
        localStorage.setItem(`asset_cache_${uuid}`, JSON.stringify(data));
        setIsOffline(false);
        setAsset(data);
        setError('');
      } catch (err) {
        setIsOffline(true);
        const cachedData = localStorage.getItem(`asset_cache_${uuid}`);
        if (cachedData) {
          setAsset(JSON.parse(cachedData));
          setError('');
        } else {
          setError('Geçersiz QR Kod veya İnternet Bağlantısı Yok.');
        }
      } finally {
        setLoading(false);
      }
    };
    if (uuid) fetchAsset();
  }, [uuid]);

  // LOGODAN ZIT RENK SEÇİMİ (Mavi, Siyah veya Beyaz)
  useEffect(() => {
    if (!asset?.logo) {
      setLogoBgColor('#ffffff');
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onerror = () => { setLogoBgColor('#ffffff'); };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue; 
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        
        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          const palette = [
            { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
            { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, 
            { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }  
          ];

          let maxDist = -1;
          let selectedColor = '#ffffff';

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
        setLogoBgColor('#ffffff');
      }
    };
    img.src = asset.logo + (asset.logo.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
  }, [asset?.logo]);


  const syncOfflineActions = async () => {
    const pending = JSON.parse(localStorage.getItem(`offline_public_actions`) || '[]');
    if (pending.length === 0) {
      setPendingSyncCount(0);
      return;
    }
    
    const remaining = [];
    for (const item of pending) {
      try {
        const res = await fetch(`${API_URL}/${item.endpoint}`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(item.body) 
        });
        if (!res.ok) remaining.push(item);
      } catch (e) {
        remaining.push(item);
      }
    }
    localStorage.setItem(`offline_public_actions`, JSON.stringify(remaining));
    setPendingSyncCount(remaining.length);
  };

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); syncOfflineActions(); };
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const pending = JSON.parse(localStorage.getItem(`offline_public_actions`) || '[]');
    setPendingSyncCount(pending.length);
    if (navigator.onLine) syncOfflineActions();

    return () => { 
      window.removeEventListener('online', handleOnline); 
      window.removeEventListener('offline', handleOffline); 
    };
  }, []);

  useEffect(() => {
    const closeAnyOpenModal = () => {
      if (showHistory) { setShowHistory(false); return true; }
      if (showEmergencyConfirm) { setShowEmergencyConfirm(false); return true; }
      if (showFaultModal) { setShowFaultModal(false); return true; }
      return false; 
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAnyOpenModal();
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      const closedSomething = closeAnyOpenModal();
      if (closedSomething) {
        window.history.pushState({ modalOpen: true }, '');
      }
    };

    window.addEventListener('keydown', handleKeyDown as EventListener);
    window.addEventListener('popstate', handlePopState as EventListener);

    if (!window.history.state?.modalOpen) {
       window.history.pushState({ modalOpen: true }, '');
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown as EventListener);
      window.removeEventListener('popstate', handlePopState as EventListener);
    };
  }, [showHistory, showEmergencyConfirm, showFaultModal]);

  const handleEmergencyConfirm = async () => {
    setIsSubmitting(true);
    const body = { uuid: asset?.uuid || uuid, company_slug: asset?.company_slug };
    try {
      await fetch(`${API_URL}/public/trigger-emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.warn("İnternet bağlantısı yok. Acil durum bildirimi kuyruğa alındı.");
      const pending = JSON.parse(localStorage.getItem(`offline_public_actions`) || '[]');
      pending.push({ endpoint: 'public/trigger-emergency', body, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_public_actions`, JSON.stringify(pending));
      setPendingSyncCount(pending.length);
      setIsOffline(true);
    } finally {
      setIsSubmitting(false);
      setShowEmergencyConfirm(false);
      if (asset?.emergency_phone) {
        window.location.href = `tel:${asset.emergency_phone}`;
      }
    }
  };

  const handleFaultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const body = { 
      uuid: asset?.uuid || uuid, 
      company_slug: asset?.company_slug,
      ...faultForm 
    };
    try {
      const res = await fetch(`${API_URL}/public/report-fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert("Arıza kaydınız başarıyla iletildi. En kısa sürede sizinle iletişime geçilecektir.");
        setShowFaultModal(false);
        setFaultForm({ name: '', phone: '', description: '' });
      } else {
        alert("Bir sorun oluştu. Lütfen doğrudan arama butonunu kullanınız.");
      }
    } catch (err) {
      console.warn("İnternet bağlantısı yok. Arıza bildirimi kuyruğa alındı.");
      const pending = JSON.parse(localStorage.getItem(`offline_public_actions`) || '[]');
      pending.push({ endpoint: 'public/report-fault', body, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_public_actions`, JSON.stringify(pending));
      setPendingSyncCount(pending.length);
      setIsOffline(true);
      
      alert("İnternet bağlantınız yok. Talebiniz sıraya alındı, bağlantı geldiğinde iletilecektir.");
      setShowFaultModal(false);
      setFaultForm({ name: '', phone: '', description: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMapsUrl = () => {
    if (!asset?.location) return '#';
    
    let mapQuery = asset.location;
    const aptName = asset.apartmentName || asset.apartment_name;
    
    if (aptName) {
      const escapedName = aptName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedName, 'gi');
      mapQuery = mapQuery.replace(regex, '').trim();
    }

    if (mapQuery.includes(' - ')) {
      const parts = mapQuery.split(' - ');
      mapQuery = parts.slice(1).join(' ').trim();
    } else if (mapQuery.startsWith('-')) {
      mapQuery = mapQuery.substring(1).trim();
    }

    mapQuery = mapQuery.replace(/^[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+|[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+$/g, '').trim();
    
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm gap-2">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      QR Bilgisi Alınıyor...
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-rose-500 font-bold gap-2 p-6 text-center">
      <AlertTriangle size={48} />
      {error}
    </div>
  );

  const aptName = asset?.apartmentName || asset?.apartment_name;
  const mainTitle = aptName || asset?.name;
  const subTitle = aptName ? asset?.name : null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative selection:bg-blue-100">

      {/* PERSONEL/PATRON ACİL ÇIKIŞ (PWA KİLİT KIRICI) */}
      <AnimatePresence>
         {staffRole && (
            <motion.button 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                  const savedSlug = localStorage.getItem('userSlug') || asset?.company_slug;
                  if(staffRole === 'Patron') router.push(`/${savedSlug}/dashboard`);
                  else if(staffRole === 'Yönetici') router.push(`/${savedSlug}/manager`);
                  else if(staffRole === 'Usta') router.push(`/${savedSlug}/worker`);
                  else router.push(`/${savedSlug}/login`);
              }}
              className="absolute top-6 left-6 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95 z-50 border border-slate-700"
            >
               <ArrowLeft size={16} /> Panele Dön
            </motion.button>
         )}
      </AnimatePresence>

      <AnimatePresence>
        {showPwaPrompt && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }} 
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-[9999] flex flex-row items-center justify-between border border-slate-700"
          >
            {installState === 'success' ? (
              <div className="flex items-center gap-3 w-full justify-center py-1">
                <div className="bg-emerald-500 p-2 rounded-full shrink-0">
                  <Check size={20} className="text-white" />
                </div>
                <div className="flex flex-col flex-1 min-w-0 pr-2">
                  <span className="font-bold text-sm text-emerald-400">Kurulum Başarılı!</span>
                  <span className="text-xs text-slate-400 mt-0.5">Cihazınızın ana ekranından giriş yapabilirsiniz.</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-blue-500 p-2.5 rounded-xl shrink-0">
                    <Download size={20} className="text-white" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className="font-bold text-sm">Uygulamayı Yükle</span>
                    {isIos ? (
                       <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                         Yüklemek için <Share size={12} className="inline-block mx-0.5 mb-0.5" /> <b>Paylaş</b> ikonuna basıp <br/> <b>Ana Ekrana Ekle</b>'yi seçin.
                       </span>
                    ) : (
                       <span className="text-xs text-slate-400 mt-0.5">Daha hızlı ve kolay erişim</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  {!isIos && (
                     <button onClick={handleInstallPwa} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">
                       Yükle
                     </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
          {(isOffline || pendingSyncCount > 0) && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }} 
              animate={{ height: 'auto', opacity: 1, marginBottom: 16 }} 
              exit={{ height: 0, opacity: 0, marginBottom: 0 }} 
              className="w-full max-w-md bg-amber-500 text-amber-950 px-4 py-3 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-center gap-2 shadow-lg z-40 border border-amber-600/20"
            >
              <WifiOff size={16} />
              {isOffline ? 'Bağlantı koptu. Veriler önbellekten okunuyor.' : 'İnternet bağlantısı sağlandı.'}
              {pendingSyncCount > 0 && (
                <span className="bg-amber-950 text-amber-400 px-2.5 py-1 rounded-full ml-1 animate-pulse flex items-center gap-1">
                   Kuyrukta {pendingSyncCount} işlem var...
                </span>
              )}
            </motion.div>
          )}
      </AnimatePresence>

      <div className="bg-white shadow-2xl rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 relative z-10">
        
        <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-100 shadow-sm z-10">
            <ShieldCheck size={12} /> SİSTEME KAYITLI
        </div>

        <div className="bg-slate-900 pt-10 pb-8 px-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-slate-900"></div>
          <div className="relative z-10">
            {asset?.logo ? (
               <div 
                 className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-white/5 p-2 overflow-hidden"
                 style={{ backgroundColor: logoBgColor }}
               >
                 <img src={asset.logo} crossOrigin="anonymous" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
               </div>
            ) : (
               <div className="w-20 h-20 bg-white/10 ring-4 ring-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg">
                 <Box size={36} className="text-blue-400" />
               </div>
            )}
            
            <h1 className="text-2xl font-bold mb-1 tracking-tight">{mainTitle}</h1>
            
            {subTitle && (
                <div className="text-blue-200 font-semibold text-sm mb-1 bg-white/10 inline-block px-3 py-0.5 rounded-lg border border-white/10">{subTitle}</div>
            )}

            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mt-1">{asset?.company_name}</p>
          </div>
        </div>

        <div className="p-6">
          
          <button 
             onClick={() => router.push(`/${asset?.company_slug}/login`)}
             className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white text-xs font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-colors shadow-sm mb-5 active:scale-95"
          >
             <User size={16} /> Personel Girişi
          </button>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex flex-col gap-3">
             <div className="flex items-start gap-3">
                <div className="bg-white p-2 rounded-full border border-slate-200 text-slate-400 mt-1">
                    <MapPin size={18} />
                </div>
                <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Cihaz Konumu</div>
                    
                    {aptName && (
                        <div className="text-xs text-blue-600 font-bold mb-0.5">{aptName}</div>
                    )}
                    
                    <div className="text-sm text-slate-700 font-semibold leading-snug">
                        {asset?.location ? asset.location.replace(aptName || '', '').replace(/^[\s-/,]+|[\s-/,]+$/g, '').trim() : '-'}
                    </div>
                </div>
             </div>
             <a href={getMapsUrl()} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-lg hover:bg-slate-100 transition-colors shadow-sm active:scale-95">
                <MapPin size={14} /> Haritada Görüntüle
             </a>
          </div>

          <button onClick={() => setShowHistory(true)} className="w-full mb-6 flex items-center justify-between bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-xl border border-blue-100 transition-all group active:scale-95">
             <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm"><History size={20} /></div>
                <div className="text-left">
                    <div className="text-sm font-bold">Servis Geçmişi</div>
                    <div className="text-[10px] opacity-70">Son işlemleri görüntüle</div>
                </div>
             </div>
             <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="space-y-3">
            <button 
              onClick={() => setShowFaultModal(true)}
              className="w-full flex items-center justify-center gap-3 bg-amber-400 hover:bg-amber-50 text-amber-950 py-4 rounded-xl font-bold text-lg shadow-lg shadow-amber-200/50 transition-all active:scale-95"
            >
              <AlertTriangle size={24} /> Arıza Bildir
            </button>
            
            <a 
                href={asset?.whatsapp_phone ? `https://wa.me/${asset.whatsapp_phone.replace(/\D/g, '').length >= 10 ? '90' + asset.whatsapp_phone.replace(/\D/g, '').slice(-10) : asset.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent('Merhaba, ' + (aptName || asset?.name) + ' (' + (aptName ? asset?.name : '') + ') cihazı için destek almak istiyorum.')}` : '#'} 
                target={asset?.whatsapp_phone ? "_blank" : undefined} rel={asset?.whatsapp_phone ? "noopener noreferrer" : undefined} onClick={(e) => !asset?.whatsapp_phone && e.preventDefault()}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 text-white
                    ${asset?.whatsapp_phone ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200/50 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'}
                `}
            >
              <MessageCircle size={24} /> {asset?.whatsapp_phone ? 'WhatsApp Destek' : 'WhatsApp Tanımlı Değil'}
            </a>

            <button 
                onClick={(e) => {
                  if(!asset?.emergency_phone) return;
                  e.preventDefault();
                  setShowEmergencyConfirm(true);
                }}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 text-white
                    ${asset?.emergency_phone ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200/50 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'}
                `}
            >
              <Phone size={24} /> {asset?.emergency_phone ? 'Acil Destek Ara' : 'Numara Tanımlı Değil'}
            </button>
          </div>

        </div>
      </div>
      
      <div className="mt-8 mb-4 text-center opacity-70 hover:opacity-100 transition-opacity z-10 relative">
        <a href="https://isdokumu.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-500 font-bold uppercase tracking-widest block hover:text-slate-800 transition-colors">isdokumu.com</a>
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Powered by İş Dökümü</p>
      </div>

      {showEmergencyConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-rose-600 p-6 flex flex-col items-center text-center text-white">
                 <ShieldAlert size={64} className="mb-4 animate-pulse" />
                 <h2 className="text-2xl font-black mb-1">Acil Durum Onayı</h2>
                 <p className="text-rose-100 text-sm">Gerçekten acil bir müdahale mi gerekiyor?</p>
              </div>
              <div className="p-6">
                 <p className="text-sm text-slate-600 text-center mb-6 font-medium">
                    Bu butona bastığınızda doğrudan yetkili kişiye bağlanacaksınız ve <strong>işletme paneline kırmızı alarm</strong> gönderilecektir. Lütfen sadece hayati/acil durumlarda kullanın.
                 </p>
                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleEmergencyConfirm} 
                      disabled={isSubmitting}
                      className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-lg flex justify-center items-center gap-2 shadow-lg shadow-rose-200 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isSubmitting ? <span className="animate-spin border-2 border-white border-t-transparent w-5 h-5 rounded-full" /> : <Phone size={20} />}
                      Evet, Acil Durum
                    </button>
                    <button 
                      onClick={() => setShowEmergencyConfirm(false)} 
                      disabled={isSubmitting}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors active:scale-95"
                    >
                      İptal Et
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showFaultModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
              
              <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-amber-50">
                  <div className="flex items-center gap-3 text-amber-900">
                      <div className="bg-amber-400 p-2 rounded-lg text-amber-950"><AlertTriangle size={20} /></div>
                      <h3 className="text-lg font-bold">Arıza Bildir</h3>
                  </div>
                  <button onClick={() => setShowFaultModal(false)} className="p-2 bg-white/50 hover:bg-white rounded-full text-slate-500 transition-colors active:scale-95">
                      <X size={20} />
                  </button>
              </div>

              <form onSubmit={handleFaultSubmit} className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Adınız Soyadınız</label>
                    <input 
                      required type="text" 
                      value={faultForm.name} onChange={e => setFaultForm({...faultForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all" 
                      placeholder="Ad Soyad"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">İletişim Numaranız</label>
                    <input 
                      required type="tel" 
                      value={faultForm.phone} onChange={e => setFaultForm({...faultForm, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all" 
                      placeholder="05XX XXX XX XX"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Arıza Detayı</label>
                    <textarea 
                      required rows={3}
                      value={faultForm.description} onChange={e => setFaultForm({...faultForm, description: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all resize-none" 
                      placeholder="Sorunu kısaca açıklayın..."
                    />
                 </div>

                 <button 
                   type="submit" disabled={isSubmitting}
                   className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-amber-400 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-70 active:scale-95"
                 >
                   {isSubmitting ? 'Gönderiliyor...' : 'Talebi Gönder'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Servis Geçmişi</h3>
                        <p className="text-xs text-slate-400">Bu cihaza yapılan son işlemler</p>
                    </div>
                    <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors active:scale-95">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {asset?.jobs && asset.jobs.length > 0 ? (
                        <div className="space-y-3">
                            {asset.jobs.map((job: any, index: number) => (
                                <div key={index} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">{job.work_type}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                            {job.scheduled_date 
                                                ? new Date(job.scheduled_date).toLocaleDateString('tr-TR') 
                                                : new Date(job.created_at).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border 
                                        ${job.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                          job.status === 'İptal' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                          'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {job.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                            <History size={32} className="opacity-20" />
                            <span className="text-xs">Henüz kayıtlı bir işlem yok.</span>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100">
                    <button onClick={() => setShowHistory(false)} className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors active:scale-95">Kapat</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}