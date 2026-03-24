'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Lock, Loader2, ArrowRight, AlertCircle, Building2, Download, Share, Check, ArrowLeft } from 'lucide-react';
import DynamicPWA from '@/components/DynamicPWA';

const API_URL = 'https://backend.isdokumu.workers.dev';

export default function StaffLoginPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '' });
  
  const [companyData, setCompanyData] = useState({ name: '', logo: '' });
  const [logoBgColor, setLogoBgColor] = useState('#ffffff'); 

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installState, setInstallState] = useState('idle');

  const actualSlug = Array.isArray(slug) ? slug[0] : slug;
  const fallbackName = actualSlug ? actualSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Firma';

  const [hasPatronSession, setHasPatronSession] = useState(false);

  // 🚀 GÜVENLİ LİNK DÖNÜŞÜTÜRÜCÜ (PROXY)
  const getSafeImageUrl = (url) => {
    if (!url) return '';
    // Eğer link bizim R2 bucket ise, onu Vercel proxy'sine çevir
    if (url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev')) {
       return url.replace('https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  useEffect(() => {
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const patronToken = localStorage.getItem('patron_authToken') || getCookie('patron_authToken');
    const patronRole = localStorage.getItem('patron_userRole') || getCookie('patron_userRole');
    const patronSlug = localStorage.getItem('patron_userSlug') || getCookie('patron_userSlug');

    let staffToken = localStorage.getItem('staff_authToken') || getCookie('staff_authToken');
    let staffRole = localStorage.getItem('staff_userRole') || getCookie('staff_userRole');
    let staffSlug = localStorage.getItem('staff_userSlug') || getCookie('staff_userSlug');

    // iOS PWA Bug Kurtarma: Cookie'de varsa LocalStorage'ı onar
    if (staffToken && !localStorage.getItem('staff_authToken')) {
        localStorage.setItem('staff_authToken', staffToken);
        localStorage.setItem('staff_userRole', staffRole);
        localStorage.setItem('staff_userSlug', staffSlug);
        const cName = getCookie('staff_userName');
        if (cName) localStorage.setItem('staff_userName', decodeURIComponent(cName));
    }

    // 🚀 PWA OTO-GİRİŞ: Eğer cihazda zaten geçerli bir oturum varsa login formunu göstermeden anında içeri al.
    if (staffToken && staffSlug === actualSlug) {
        if (staffRole === 'Usta') {
            router.replace(`/${actualSlug}/worker`);
            return;
        } else if (staffRole === 'Yönetici') {
            router.replace(`/${actualSlug}/manager`);
            return;
        }
    }

    // Patron yanlışlıkla personel girişine düşerse onu da ana panele fırlat
    if (patronToken && patronRole === 'Patron' && patronSlug === actualSlug) {
        router.replace(`/${actualSlug}/dashboard`);
        return;
    }

    if (patronRole === 'Patron' || staffRole === 'Yönetici' || staffRole === 'Usta') {
      setHasPatronSession(true);
  }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isIOSDevice) {
      setIsIos(true);
      setTimeout(() => setShowPwaPrompt(true), 2000);
    } else {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShowPwaPrompt(true), 2000);
      };
      window.addEventListener('beforeinstallprompt', handler);

      // Global yakalanan event varsa onu kullan
      if (window.pwaDeferredPrompt) {
        handler(window.pwaDeferredPrompt);
        window.pwaDeferredPrompt = null;
      }

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

  useEffect(() => {
    const fetchCompanyBranding = async () => {
      try {
         const res = await fetch(`${API_URL}/public/company-info?slug=${actualSlug}`);
         if(res.ok) {
             const data = await res.json();
             
             if (data.logo) {
                 // 🔥 GÜVENLİ LİNK DÖNÜŞÜMÜ
                 const safeLogoUrl = getSafeImageUrl(data.logo);

                 setCompanyData({ name: data.company_name, logo: safeLogoUrl });
                 
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
                         const imgData = imageData.data;
                         let r = 0, g = 0, b = 0, count = 0;
                         for (let i = 0; i < imgData.length; i += 4) {
                             if (imgData[i + 3] < 128) continue; 
                             r += imgData[i]; g += imgData[i + 1]; b += imgData[i + 2]; count++;
                         }
                         if (count > 0) {
                             r = Math.floor(r / count); g = Math.floor(g / count); b = Math.floor(b / count);
                             const palette = [ { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' }, { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' } ];
                             let maxDist = -1; let selectedColor = '#ffffff';
                             for (const color of palette) {
                                 const dist = Math.sqrt(Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2));
                                 if (dist > maxDist) { maxDist = dist; selectedColor = color.hex; }
                             }
                             setLogoBgColor(selectedColor);
                         }
                     } catch (e) { setLogoBgColor('#ffffff'); }
                 };
                 // 🔥 BURADA GÜVENLİ LİNKİ KULLANIYORUZ
                 img.src = safeLogoUrl + (safeLogoUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
             } else {
                 setCompanyData({ name: data.company_name, logo: '' });
             }
         } else {
             setCompanyData({ name: fallbackName, logo: '' }); 
         }
      } catch(e) {
         setCompanyData({ name: fallbackName, logo: '' }); 
      }
    };
    if (actualSlug) fetchCompanyBranding();
  }, [actualSlug, fallbackName]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: actualSlug, username: formData.username, password: formData.password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('staff_authToken', data.token);
        localStorage.setItem('staff_userRole', data.role);
        localStorage.setItem('staff_userSlug', actualSlug);
        localStorage.setItem('staff_userName', data.name);

        // 🚀 KÖKTEN ÇÖZÜM: iOS Safari PWA LocalStorage silinme sorununa karşı Cookie Yedeklemesi
        const expireDate = new Date();
        expireDate.setTime(expireDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 Gün
        const expires = "expires=" + expireDate.toUTCString();
        document.cookie = `staff_authToken=${data.token};${expires};path=/`;
        document.cookie = `staff_userRole=${data.role};${expires};path=/`;
        document.cookie = `staff_userSlug=${actualSlug};${expires};path=/`;
        document.cookie = `staff_userName=${encodeURIComponent(data.name)};${expires};path=/`;

        if (data.role === 'Yönetici') {
            router.push(`/${actualSlug}/manager`);
        } else if (data.role === 'Usta') {
            router.push(`/${actualSlug}/worker`);
        } else {
            router.push(`/${actualSlug}/dashboard`); 
        }
      } else {
        setError(data.error || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 relative font-sans selection:bg-blue-100">
      
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-blue-600 transition-all uppercase tracking-widest bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl shadow-sm border border-slate-100 active:scale-95 z-50"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Ana Sayfa
      </button>

      <DynamicPWA 
        companyName={companyData.name !== fallbackName ? companyData.name : undefined} 
        companyLogo={companyData.logo} 
      />
      
      <AnimatePresence>
         {hasPatronSession && (
            <motion.button 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                const patronRole = localStorage.getItem('patron_userRole');
                const staffRole = localStorage.getItem('staff_userRole');
                
                if(patronRole === 'Patron') router.push(`/${actualSlug}/dashboard`);
                else if(staffRole === 'Yönetici') router.push(`/${actualSlug}/manager`);
                else if(staffRole === 'Usta') router.push(`/${actualSlug}/worker`);
                else router.push(`/`);
            }}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest active:scale-95 z-50"
            >
               Panele Dön <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
         )}
      </AnimatePresence>

      <AnimatePresence>
        {showPwaPrompt && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} 
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl z-[9999] flex flex-row items-center justify-between border border-slate-700"
          >
            {installState === 'success' ? (
              <div className="flex items-center gap-3 w-full justify-center py-1">
                <div className="bg-emerald-500 p-2 rounded-full shrink-0"><Check size={20} className="text-white" /></div>
                <div className="flex flex-col flex-1 min-w-0 pr-2"><span className="font-bold text-sm text-emerald-400">Kurulum Başarılı!</span><span className="text-xs text-slate-400 mt-0.5">Cihazınızın ana ekranından giriş yapabilirsiniz.</span></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-blue-500 p-2.5 rounded-xl shrink-0"><Download size={20} className="text-white" /></div>
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className="font-bold text-sm">Uygulamayı Yükle</span>
                    {isIos ? (<span className="text-[11px] text-slate-400 mt-0.5 leading-tight">Yüklemek için <Share size={12} className="inline-block mx-0.5 mb-0.5" /> <b>Paylaş</b> ikonuna basıp <br/> <b>Ana Ekrana Ekle</b>'yi seçin.</span>) : (<span className="text-xs text-slate-400 mt-0.5">Saha işlemlerini hızlıca yönetin.</span>)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  {!isIos && (<button onClick={handleInstallPwa} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">Yükle</button>)}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[100px] rounded-full z-0 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-[400px] w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 p-6 sm:p-10 border border-slate-100 relative z-10"
      >
        <div className="flex flex-col items-center mb-8 mt-2">
          {companyData.logo ? (
             <div 
               className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-200/50 p-2 overflow-hidden"
               style={{ backgroundColor: logoBgColor }}
             >
                <img src={companyData.logo} crossOrigin="anonymous" alt="Firma Logo" className="w-full h-full object-contain drop-shadow-md" />
             </div>
          ) : (
             <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 mb-4 shadow-inner text-blue-600">
                <Building2 size={32} />
             </div>
          )}
          <h1 className="text-2xl font-black text-slate-900 text-center tracking-tight leading-tight">
            {companyData.name}
          </h1>
          <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mt-3 flex items-center gap-1.5 border border-slate-200">
             <ShieldCheck size={12} className="text-blue-500" /> Personel Portalı
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-bold leading-relaxed">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Kullanıcı Adı</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input required type="text" name="username" value={formData.username} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400" placeholder="Örn: ali.usta" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mt-6">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Giriş Yap <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] font-medium text-slate-400 leading-relaxed">
          Şifrenizi unuttuysanız veya giriş yapamıyorsanız lütfen <br/>
          <strong className="text-slate-600">Firma Yetkilinizle</strong> iletişime geçin.
        </p>

      </motion.div>
    </div>
  );
}