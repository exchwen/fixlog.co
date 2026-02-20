'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Lock, Loader2, ArrowRight, AlertCircle, Building2, Download, Share, Check } from 'lucide-react';

const API_URL = 'https://backend.isdokumu.workers.dev';

export default function StaffLoginPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '' });
  
  const [companyData, setCompanyData] = useState({ name: '', logo: '' });

  // YENİ: PWA YÜKLEME DURUMU STATE'LERİ EKLENDİ
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installState, setInstallState] = useState('idle');

  // Slug'ı geçici isim yap (veri gelmezse veya gelene kadar kullanılsın)
  const fallbackName = slug ? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Firma';

  // YENİ: ZORUNLU VE GERİ BİLDİRİMLİ PWA YAKALAMA SİSTEMİ
  useEffect(() => {
    // Sadece PWA (uygulama) içinden açılmışsa durdur ve balonu gösterme.
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) {
      return;
    }

    // Cihazın Apple (iOS) olup olmadığını tespit et
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isIOSDevice) {
      setIsIos(true);
      // Apple cihazda buton çıkmaz, sadece yönerge balonu 2 sn sonra açılır
      setTimeout(() => setShowPwaPrompt(true), 2000);
    } else {
      // Android / Masaüstü Chrome vb.
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShowPwaPrompt(true), 2000);
      };
      window.addEventListener('beforeinstallprompt', handler);

      // Tarayıcı menüsünden kurulursa dahi algılayıp "Başarılı" diyen dinleyici
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
    // Sayfa açıldığında sadece firmanın public bilgisini çeken ufak sorgu
    const fetchCompanyBranding = async () => {
      try {
         const res = await fetch(`${API_URL}/public/company-info?slug=${slug}`);
         if(res.ok) {
             const data = await res.json();
             setCompanyData({ name: data.company_name, logo: data.logo });
         } else {
             setCompanyData({ name: fallbackName, logo: '' }); 
         }
      } catch(e) {
         console.warn("Firma bilgileri çekilemedi.");
         setCompanyData({ name: fallbackName, logo: '' }); 
      }
    };
    if (slug) fetchCompanyBranding();
  }, [slug, fallbackName]);

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
        body: JSON.stringify({ slug, username: formData.username, password: formData.password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // BAŞARILI GİRİŞ: Token'ı kalıcı olarak tarayıcıya yaz
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userSlug', slug);
        localStorage.setItem('userName', data.name);

        // Yönlendirme (ZIRH: Usta manager'a giremesin diye baştan ayrıştırıyoruz)
        if (data.role === 'Yönetici') {
            router.push(`/${slug}/manager`);
        } else if (data.role === 'Usta') {
            router.push(`/${slug}/worker`);
        } else {
            router.push(`/${slug}/dashboard`); // Normalde bu ekrana düşmemeli
        }
      } else {
        // HATA DURUMU
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
      
      {/* YENİ: ZORUNLU PWA ANA EKRANA EKLE MODALI */}
      <AnimatePresence>
        {showPwaPrompt && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }} 
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl z-[9999] flex flex-row items-center justify-between border border-slate-700"
          >
            {installState === 'success' ? (
              // BAŞARILI YÜKLEME EKRANI
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
              // STANDART YÜKLEME ÇAĞRISI
              <>
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-blue-500 p-2.5 rounded-xl shrink-0">
                    <Download size={20} className="text-white" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className="font-bold text-sm">Uygulamayı Yükle</span>
                    {isIos ? (
                       // iOS Safari için özel talimat metni
                       <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                         Yüklemek için <Share size={12} className="inline-block mx-0.5 mb-0.5" /> <b>Paylaş</b> ikonuna basıp <br/> <b>Ana Ekrana Ekle</b>'yi seçin.
                       </span>
                    ) : (
                       // Android / Masaüstü metni
                       <span className="text-xs text-slate-400 mt-0.5">Saha işlemlerini hızlıca yönetin.</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  {/* Sadece Android/Masaüstü ise Yükle Butonunu göster */}
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

      {/* Arka Plan Dekorasyonu */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[100px] rounded-full z-0 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-[400px] w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 p-6 sm:p-10 border border-slate-100 relative z-10"
      >
        
        {/* Firma Logosu ve İsmi */}
        <div className="flex flex-col items-center mb-8 mt-2">
          {companyData.logo ? (
             <img src={companyData.logo} alt="Firma Logo" className="w-20 h-20 object-contain mb-4 rounded-xl shadow-sm border border-slate-100 p-2" />
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
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
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
              <input 
                required 
                type="text" 
                name="username" 
                value={formData.username} 
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                placeholder="Örn: ali.usta"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input 
                required 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mt-6"
          >
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