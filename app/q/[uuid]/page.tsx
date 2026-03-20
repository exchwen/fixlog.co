'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Phone, ShieldCheck, Box, MapPin, History, X, ShieldAlert, ChevronRight, User, MessageCircle, WifiOff, Check, ArrowLeft, PenTool, ClipboardList, Wrench, Calendar, Tag, CheckCircle, Image as ImageIcon, CheckSquare } from 'lucide-react';
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
  const [selectedHistoryJob, setSelectedHistoryJob] = useState<any>(null); 
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [showFaultModal, setShowFaultModal] = useState(false);

  // 🚀 YENİ: Şık Bildirim Modalları İçin State'ler
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState({ show: false, message: '' });

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

  // 🚀 GÜVENLİ LİNK DÖNÜŞÜTÜRÜCÜ (PROXY)
  const getSafeImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev')) {
       return url.replace('https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  useEffect(() => {
    // ZIRH: Eğer kullanıcı zaten sistemdeyse ve barkodu okuttuysa "Panele Dön" butonunu göster
    const token = localStorage.getItem('authToken') || localStorage.getItem('staff_authToken');
    const role = localStorage.getItem('userRole') || localStorage.getItem('staff_userRole');
    if (token && role) {
        setStaffRole(role);
    }
  }, []);

  // Ağ (Online First) ve Cache Stratejisi
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`${API_URL}/public/get-asset?uuid=${uuid}`);
        if (!res.ok) throw new Error('Varlık bulunamadı');
        const data = await res.json();
        
        // LOGOYU GÜVENLİ LİNKE ÇEVİR
        if (data.logo) {
            data.logo = getSafeImageUrl(data.logo);
        }

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

  // LOGODAN ZIT RENK SEÇİMİ
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
      if (selectedHistoryJob) { setSelectedHistoryJob(null); return true; } 
      if (showHistory) { setShowHistory(false); return true; }
      if (showEmergencyConfirm) { setShowEmergencyConfirm(false); return true; }
      if (showFaultModal) { setShowFaultModal(false); return true; }
      if (showSuccessAlert) { setShowSuccessAlert(false); return true; }
      if (showErrorAlert.show) { setShowErrorAlert({show: false, message: ''}); return true; }
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
  }, [showHistory, showEmergencyConfirm, showFaultModal, selectedHistoryJob, showSuccessAlert, showErrorAlert.show]);

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
        setShowSuccessAlert(true);
        setShowFaultModal(false);
        setFaultForm({ name: '', phone: '', description: '' });
      } else {
        setShowErrorAlert({ show: true, message: "Bir sorun oluştu. Lütfen doğrudan arama butonunu kullanınız." });
      }
    } catch (err) {
      console.warn("İnternet bağlantısı yok. Arıza bildirimi kuyruğa alındı.");
      const pending = JSON.parse(localStorage.getItem(`offline_public_actions`) || '[]');
      pending.push({ endpoint: 'public/report-fault', body, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_public_actions`, JSON.stringify(pending));
      setPendingSyncCount(pending.length);
      setIsOffline(true);
      
      setShowErrorAlert({ show: true, message: "İnternet bağlantınız yok. Talebiniz sıraya alındı, bağlantı geldiğinde otomatik iletilecektir." });
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

  // 🚀 BAKIM DURUMU KONTROLÜ
  const isUnderMaintenance = asset?.jobs?.some((j: any) => j.status === 'Devam Ediyor');

  // Geçmiş listesi için sadece "Tamamlandı" olanları filtreliyoruz
  const completedHistoryJobs = asset?.jobs?.filter((j: any) => j.status === 'Tamamlandı') || [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative selection:bg-blue-100">

      {/* PERSONEL/PATRON ACİL ÇIKIŞ (PWA KİLİT KIRICI) */}
      <AnimatePresence>
         {staffRole && (
            <motion.button 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                  const savedSlug = localStorage.getItem('userSlug') || localStorage.getItem('staff_userSlug') || asset?.company_slug;
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
        
        {/* 🚀 DİNAMİK BAKIM / KULLANILABİLİR ROZETİ */}
        {isUnderMaintenance ? (
          <div className="absolute top-4 right-4 bg-amber-500 text-amber-950 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1.5 shadow-md z-10 animate-pulse">
            <Wrench size={12} /> CİHAZ BAKIMDA
          </div>
        ) : (
          <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1.5 shadow-md z-10">
            <ShieldCheck size={12} /> KULLANILABİLİR
          </div>
        )}

        <div className="bg-slate-900 pt-10 pb-8 px-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-slate-900"></div>
          <div className="relative z-10">
            {asset?.logo ? (
               <div 
                 className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-white/5 p-2 overflow-hidden"
                 style={{ backgroundColor: logoBgColor }}
               >
                 <img src={getSafeImageUrl(asset.logo)} crossOrigin="anonymous" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
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
                    <div className="text-[10px] opacity-70">Tamamlanan işlemleri görüntüle</div>
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
                href={asset?.whatsapp_phone ? `https://wa.me/${asset.whatsapp_phone.replace(/\D/g, '').length >= 10 ? '90' + asset.whatsapp_phone.replace(/\D/g, '').slice(-10) : asset.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent('Merhaba, ' + (aptName ? aptName + ' (' + asset?.name + ')' : asset?.name) + ' cihazı için destek almak istiyorum.' + (asset?.location ? '\n📍 Konum: ' + asset.location.replace(aptName || '', '').replace(/^[\s-/,]+|[\s-/,]+$/g, '').trim() : '') + '\n🔗 Cihaz Linki: ' + (typeof window !== 'undefined' ? window.location.origin + '/q/' + (asset?.uuid || uuid) : ''))}` : '#'} 
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
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Powered by FixLog.co</p>
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

      {/* 🚀 ANA GEÇMİŞ MODALI (Sadece Tamamlanan İşler) */}
      {showHistory && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Servis Geçmişi</h3>
                        <p className="text-xs text-slate-500">Sadece tamamlanan işlemler listelenir.</p>
                    </div>
                    <button onClick={() => setShowHistory(false)} className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 transition-colors active:scale-95">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {completedHistoryJobs.length > 0 ? (
                        <div className="space-y-3">
                            {completedHistoryJobs.map((job: any, index: number) => (
                                <div 
                                    key={index} 
                                    onClick={() => setSelectedHistoryJob(job)}
                                    className="p-4 border border-slate-200 rounded-xl bg-white hover:bg-blue-50 hover:border-blue-200 cursor-pointer flex justify-between items-center transition-all group active:scale-95 shadow-sm relative overflow-hidden"
                                >
                                    <div>
                                        <div className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors flex items-center gap-2 mb-1.5">
                                            <ClipboardList size={14} className="text-slate-400 group-hover:text-blue-500" />
                                            {job.work_type}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                               <Tag size={10} /> {job.job_type || 'Belirtilmedi'}
                                            </span>
                                            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                                                <Calendar size={12} className="text-blue-400"/>
                                                {job.scheduled_date 
                                                    ? new Date(job.scheduled_date).toLocaleDateString('tr-TR') 
                                                    : new Date(job.created_at).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
                                        <ChevronRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                            <History size={32} className="opacity-20" />
                            <span className="text-sm font-medium">Henüz tamamlanan bir işlem yok.</span>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button onClick={() => setShowHistory(false)} className="w-full py-3.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors active:scale-95 shadow-md">Kapat</button>
                </div>
            </div>
        </div>
      )}

      {/* 🚀 TIKLANAN İŞİN DETAY MODALI */}
      <AnimatePresence>
        {selectedHistoryJob && (
            <motion.div 
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed inset-0 z-[160] bg-white flex flex-col"
            >
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                    <button onClick={() => setSelectedHistoryJob(null)} className="flex items-center gap-1 text-slate-600 font-bold text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm">
                        <ArrowLeft size={16} /> Geri
                    </button>
                    <div className="flex gap-2">
                        <div className="text-[10px] font-black text-slate-600 bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-md tracking-wider uppercase">
                            {selectedHistoryJob.job_type || 'İŞ KAYDI'}
                        </div>
                        <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md tracking-wider uppercase">
                            TAMAMLANDI
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar bg-white text-black flex-1 relative">
                   <div className="flex flex-col items-center justify-center mb-6 text-center">
                        {asset?.logo && (
                            <div 
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center mb-4 overflow-hidden shadow-sm border-2 border-slate-100 p-2"
                                style={{ backgroundColor: logoBgColor }}
                            >
                                <img 
                                    src={getSafeImageUrl(asset.logo)} 
                                    alt="Firma Logosu" 
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-contain" 
                                />
                            </div>
                        )}
                        <h1 className="text-2xl font-black uppercase tracking-widest">{asset?.company_name || 'Firma Adı'}</h1>
                        <h2 className="text-lg font-bold mt-1 text-slate-800">{selectedHistoryJob.work_type === 'Periyodik Bakım' ? 'Bakım Fişi' : 'Servis Raporu'}</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-medium border-y-4 border-slate-900 py-5 mb-8 bg-slate-50/50 px-2 sm:px-4 rounded-xl">
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Fiş Numarası</div>
                            <div className="font-black text-slate-900 text-base">#{selectedHistoryJob.id || '-'}</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Tarih</div>
                            <div className="font-black text-slate-900 text-base">{selectedHistoryJob.scheduled_date ? new Date(selectedHistoryJob.scheduled_date).toLocaleDateString('tr-TR') : new Date(selectedHistoryJob.created_at || Date.now()).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">İlgili Personel</div>
                            <div className="font-black text-slate-900 text-base truncate">{selectedHistoryJob.staff_name || selectedHistoryJob.worker_name || 'Belirtilmedi'}</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Tesis Adı / Adres</div>
                            <div className="font-black text-slate-900 leading-tight text-base">
                                <div>{asset?.apartmentName || asset?.apartment_name || asset?.name || 'Bilinmiyor'}</div>
                                {asset?.location && <div className="text-[11px] font-semibold text-slate-500 mt-1 whitespace-normal">{asset.location.replace(asset?.apartmentName || asset?.apartment_name || '', '').replace(/^[\s-/,]+|[\s-/,]+$/g, '').trim()}</div>}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            
                            <div className="flex flex-col">
                                {(() => {
                                    let parsedDetails: any = {};
                                    try {
                                        parsedDetails = typeof selectedHistoryJob.details === 'string' ? JSON.parse(selectedHistoryJob.details) : selectedHistoryJob.details;
                                    } catch(e) {}

                                    let rawNote = parsedDetails.note || '';
                                    let extractedChecklist: { key: string, val: string }[] = [];
                                    let cleanNote = '';

                                    if (rawNote.includes('---') && rawNote.includes('Saha Formu')) {
                                        const lines = rawNote.split('\n');
                                        let inForm = false;
                                        
                                        for (const line of lines) {
                                            if (line.includes('---') && line.includes('Saha Formu')) {
                                                inForm = true;
                                                continue;
                                            }
                                            if (inForm && line.includes('----------------------------------')) {
                                                inForm = false;
                                                continue;
                                            }

                                            if (inForm && line.includes(':')) {
                                                const [key, ...valArr] = line.split(':');
                                                extractedChecklist.push({ key: key.trim(), val: valArr.join(':').trim() });
                                            } else if (!inForm && line.trim() !== '') {
                                                cleanNote += line + '\n';
                                            }
                                        }
                                    } else {
                                        cleanNote = rawNote;
                                        if (parsedDetails) {
                                            const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName', 'usedMaterials'];
                                            Object.entries(parsedDetails).forEach(([k, v]) => {
                                                if (!excludeKeys.includes(k) && typeof v === 'string') {
                                                    extractedChecklist.push({ key: k, val: v });
                                                }
                                            });
                                        }
                                    }

                                    cleanNote = cleanNote.replace(/\[Usta Notu\]:/g, '').replace(/\[📍 Konum Kaydı\].*/g, '').trim();
                                    
                                    if (extractedChecklist.length === 0 && !cleanNote && (!parsedDetails.usedMaterials || parsedDetails.usedMaterials.length === 0)) return <div className="p-5 text-slate-500 italic text-center">Detaylı rapor girilmemiş.</div>;
                                    
                                    return (
                                        <>
                                            {extractedChecklist.length > 0 && (
                                                <div className="flex flex-col bg-white">
                                                    {extractedChecklist.map((item, idx) => {
                                                        const valStr = item.val.toLowerCase().trim();
                                                        
                                                        const isPositive = ['evet', 'var', 'true', 'ok', 'uygun', 'sorunsuz', 'yapıldı'].some(v => valStr === v || valStr.includes(v));
                                                        const isNegative = ['hayır', 'hayir', 'yok', 'false', 'uygun değil', 'değil', 'sorunlu', 'kötü'].some(v => valStr === v || valStr.includes(v));
                                                        const isBooleanType = isPositive || isNegative;
                                                        
                                                        let colorClass = 'text-slate-900';
                                                        let bgColorClass = 'bg-slate-900';
                                                        let borderColorClass = 'border-slate-900';
                                                        
                                                        if (isPositive) {
                                                            colorClass = 'text-emerald-600';
                                                            bgColorClass = 'bg-emerald-500';
                                                            borderColorClass = 'border-emerald-500';
                                                        } else if (isNegative) {
                                                            colorClass = 'text-rose-600';
                                                            bgColorClass = 'bg-rose-500';
                                                            borderColorClass = 'border-rose-500';
                                                        } else if (valStr.includes('mavi')) colorClass = 'text-blue-600';
                                                        else if (valStr.includes('yeşil') || valStr.includes('yesil')) colorClass = 'text-emerald-600';
                                                        else if (valStr.includes('kırmızı') || valStr.includes('kirmizi')) colorClass = 'text-rose-600';
                                                        else if (valStr.includes('sarı') || valStr.includes('sari')) colorClass = 'text-amber-500';
                                                        else if (valStr.includes('turuncu')) colorClass = 'text-orange-500';
                                                        else if (valStr.includes('mor')) colorClass = 'text-purple-600';

                                                        return (
                                                            <div key={idx} className={`flex justify-between items-center py-3.5 px-5 border-b border-slate-200/80 last:border-b-0 ${idx % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}`}>
                                                                <div className="flex flex-col pr-4">
                                                                    <span className="text-[14px] font-bold leading-tight text-slate-900">{item.key}</span>
                                                                </div>
                                                                
                                                                <div className="shrink-0 flex items-center gap-3">
                                                                    {isBooleanType && (
                                                                        <span className={`text-[12px] font-black uppercase tracking-widest ${colorClass}`}>{item.val}</span>
                                                                    )}
                                                                    {isBooleanType ? (
                                                                        isPositive ? (
                                                                            <div className={`w-6 h-6 flex items-center justify-center rounded shadow-sm ${bgColorClass}`}>
                                                                                <CheckSquare size={16} className="text-white" strokeWidth={3} />
                                                                            </div>
                                                                        ) : (
                                                                            <div className={`w-6 h-6 flex items-center justify-center rounded shadow-sm ${bgColorClass}`}>
                                                                                <X size={16} className="text-white" strokeWidth={4} />
                                                                            </div>
                                                                        )
                                                                    ) : (
                                                                        <span className={`text-[13px] font-black uppercase ${colorClass} ${colorClass === 'text-slate-900' ? `border-b-2 ${borderColorClass}` : ''}`}>{item.val}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            
                                            {parsedDetails.usedMaterials && parsedDetails.usedMaterials.length > 0 && (
                                                <div className="p-5 border-t border-slate-200 bg-white">
                                                    <span className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3">KULLANILAN MALZEMELER:</span>
                                                    <div className="space-y-1.5 text-sm font-semibold text-slate-700">
                                                        {parsedDetails.usedMaterials.map((m: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center">
                                                                <span>• {m.name}</span>
                                                                <span className="font-black text-slate-900">{m.quantity} {m.unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {cleanNote && (
                                                <div className="p-5 border-t border-slate-200 bg-slate-50/50">
                                                    <span className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2">BAKIM / SERVİS NOTU:</span>
                                                    <div className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                        {cleanNote}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            
                            {selectedHistoryJob.details?.price && (
                                <div className="p-5 border-t border-slate-200 bg-slate-100/50 flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Toplam Tutar</span>
                                    <span className="text-2xl font-black text-slate-900">{selectedHistoryJob.details.price}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedHistoryJob.photos && selectedHistoryJob.photos.length > 0 && (
                       <div className="mb-8">
                          <div className="text-xs font-black text-slate-800 uppercase pb-4">Saha Kayıt Fotoğrafları</div>
                          <div className="grid grid-cols-2 gap-4">
                             {selectedHistoryJob.photos.map((p: string, i: number) => (
                               <div key={i} className="w-full">
                                  <img src={getSafeImageUrl(p)} alt="Saha" className="w-full h-auto max-h-64 object-contain rounded-lg border border-slate-300" crossOrigin="anonymous" />
                               </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {selectedHistoryJob.signature_url && (
                        <div className="mt-8 pt-6 border-t-2 border-slate-800 text-center flex flex-col items-center">
                            <p className="text-xs text-slate-500 mb-6 italic max-w-md">
                                Bu form <strong className="text-slate-700">{selectedHistoryJob.staff_name || selectedHistoryJob.worker_name || 'personelimiz'}</strong> tarafından, {selectedHistoryJob.scheduled_date ? new Date(selectedHistoryJob.scheduled_date).toLocaleDateString('tr-TR') : new Date(selectedHistoryJob.created_at || Date.now()).toLocaleDateString('tr-TR')} tarihinde müşteri nezaretinde elektronik imza ile imza altına alınmıştır.
                            </p>
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İmzalayan:</span> 
                                    {selectedHistoryJob.customer_signature_name || 'Bilinmiyor'}
                                </div>
                                <img 
                                    src={getSafeImageUrl(selectedHistoryJob.signature_url)} 
                                    alt="Müşteri İmzası" 
                                    className="h-24 object-contain mix-blend-multiply" 
                                />
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                                    {asset?.company_name || 'Firma Adı'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 BAŞARI MODALI */}
      <AnimatePresence>
        {showSuccessAlert && (
          <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
          >
              <motion.div 
                  initial={{ scale: 0.9, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 10 }}
                  className="bg-white max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col"
              >
                  <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
                          <CheckCircle size={32} />
                      </div>
                      <h3 className="text-xl font-black text-emerald-900">İşlem Başarılı!</h3>
                  </div>
                  <div className="p-6 text-center text-slate-600 font-medium leading-relaxed">
                      Arıza kaydınız başarıyla iletildi. En kısa sürede sizinle iletişime geçilecektir.
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <button 
                          onClick={() => setShowSuccessAlert(false)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-md"
                      >
                          Tamam
                      </button>
                  </div>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 HATA MODALI */}
      <AnimatePresence>
        {showErrorAlert.show && (
          <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
          >
              <motion.div 
                  initial={{ scale: 0.9, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 10 }}
                  className="bg-white max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col"
              >
                  <div className="bg-rose-50 border-b border-rose-100 p-6 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-black text-rose-900">Bilgi / Uyarı</h3>
                  </div>
                  <div className="p-6 text-center text-slate-600 font-medium leading-relaxed">
                      {showErrorAlert.message}
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <button 
                          onClick={() => setShowErrorAlert({ show: false, message: '' })}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-md"
                      >
                          Anladım
                      </button>
                  </div>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}