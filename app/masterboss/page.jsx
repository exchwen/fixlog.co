"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, User, Download, Share, Check } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import DynamicPWA from "@/components/DynamicPWA";

export default function MasterbossLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // PWA States
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installState, setInstallState] = useState('idle');

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); 
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setInstallState('success'); setTimeout(() => setShowPwaPrompt(false), 3000); }
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setIsIos(true); setTimeout(() => setShowPwaPrompt(true), 2000);
    } else {
      const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setTimeout(() => setShowPwaPrompt(true), 2000); };
      window.addEventListener('beforeinstallprompt', handler);
      
      // Global yakalanan event varsa onu kullan
      if (window.pwaDeferredPrompt) {
        handler(window.pwaDeferredPrompt);
        window.pwaDeferredPrompt = null;
      }

      const handleInstalled = () => { setInstallState('success'); setTimeout(() => setShowPwaPrompt(false), 3000); };
      window.addEventListener('appinstalled', handleInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }
  }, []);

  // 🚀 PWA VE OTOMATİK GİRİŞ KONTROLÜ: Masterboss token varsa direkt dashboard'a at!
  useEffect(() => {
    const token = localStorage.getItem("masterbossToken");
    if (token) {
      router.replace("/masterboss/dashboard");
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.fixlog.co";
      const res = await fetch(`${BASE_URL}/masterboss-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, masterPassword: password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("masterbossToken", data.token);
        toast.success("Süper Admin Girişi Başarılı!");
        router.push("/masterboss/dashboard");
      } else {
        toast.error(data.error || "Yetkisiz Giriş!");
      }
    } catch (err) {
      toast.error("Sunucuya ulaşılamıyor!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 selection:bg-rose-500/30 relative overflow-hidden">
      <DynamicPWA companyName="FixLog.co" companyLogo="/icons/icon-512x512.png" />
      <AnimatePresence>
        {showPwaPrompt && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} 
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-neutral-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl z-[9999] flex flex-row items-center justify-between border border-neutral-700"
          >
            {installState === 'success' ? (
              <div className="flex items-center gap-3 w-full justify-center py-1">
                <div className="bg-emerald-500 p-2 rounded-full shrink-0"><Check size={20} className="text-white" /></div>
                <div className="flex flex-col flex-1 min-w-0 pr-2"><span className="font-bold text-sm text-emerald-400">Kurulum Başarılı!</span><span className="text-xs text-neutral-400 mt-0.5">Cihazınızın ana ekranından giriş yapabilirsiniz.</span></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-rose-600 p-2.5 rounded-xl shrink-0"><Download size={20} className="text-white" /></div>
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className="font-bold text-sm">Masterboss Panelini Yükle</span>
                    {isIos ? (<span className="text-[11px] text-neutral-400 mt-0.5 leading-tight">Yüklemek için <Share size={12} className="inline-block mx-0.5 mb-0.5" /> <b>Paylaş</b> ikonuna basıp <br/> <b>Ana Ekrana Ekle</b>&apos;yi seçin.</span>) : (<span className="text-xs text-neutral-400 mt-0.5">Panele hızlıca erişmek için yükleyin.</span>)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  {!isIos && (<button onClick={handleInstallPwa} className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">Yükle</button>)}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 mb-4 shadow-lg shadow-rose-500/20 border border-rose-400/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Masterboss <span className="text-rose-500 font-black">Portal</span></h1>
          <p className="text-neutral-400 text-sm">Bu alana sadece kurucu yöneticiler girebilir.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-neutral-900/50 backdrop-blur-xl p-8 rounded-3xl border border-neutral-800/50 shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Admin E-Posta</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-950/50 border border-neutral-800/80 rounded-2xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all text-white placeholder-neutral-600"
                  placeholder="FixLog.co"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Süper Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-950/50 border border-neutral-800/80 rounded-2xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all text-white placeholder-neutral-600"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50 mt-4 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>Giriş Yap <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </form>
        
        <p className="text-center text-xs text-neutral-600 mt-8">
          İzinsiz giriş denemeleri kayıt altına alınmaktadır.<br/>
          Copyright © {new Date().getFullYear()} FixLog.co
        </p>
      </motion.div>
    </div>
  );
}