'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [isReady, setIsReady] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    setIsReady(true);
    
    // Kullanıcı uygulamayı zaten indirmiş mi? (PWA olarak mı açmış?)
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isAppInstalled);

    // Cihaz iOS mu? (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Android/Chrome için otomatik yükleme tetikleyicisini yakala
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isAppInstalled) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Eğer iOS ise ve uygulama indirilmemişse, manuel olarak barı göster
    if (isIOSDevice && !isAppInstalled) {
      // Sürekli rahatsız etmemek için localStorage kontrolü yapabiliriz ama şimdilik gösterelim
      const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      setShowPrompt(false);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isReady || isStandalone) return null;

  return (
    <>
      {/* ANA YÜKLEME BARI (Alt Kısımda Çıkar) */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 z-[9990] bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-slate-700/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Smartphone size={20} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">Uygulamayı İndir</span>
                <span className="text-[11px] text-slate-400">Daha hızlı ve internetsiz kullanım.</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleInstallClick}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Download size={14} />
                Yükle
              </button>
              <button onClick={handleDismiss} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS (IPHONE) İÇİN ÖZEL YÖNLENDİRME MODALI */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-4 pb-10"
            onClick={handleDismiss}
          >
            <motion.div 
              initial={{ y: 100, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm relative"
            >
              <button onClick={handleDismiss} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full">
                <X size={18} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800">iPhone'a Yükle</h3>
                <p className="text-sm text-slate-500 mt-2">Safari kısıtlamaları nedeniyle uygulamayı manuel olarak ana ekranınıza eklemeniz gerekiyor.</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <Share size={18} className="text-blue-500" />
                  </div>
                  <p className="text-sm text-slate-700 font-medium">1. Alt menüdeki <span className="font-bold">Paylaş</span> ikonuna dokunun.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <PlusSquare size={18} className="text-slate-700" />
                  </div>
                  <p className="text-sm text-slate-700 font-medium">2. Çıkan menüde <span className="font-bold">Ana Ekrana Ekle</span>'yi seçin.</p>
                </div>
              </div>
              
              <button 
                onClick={handleDismiss}
                className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
              >
                Anladım
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}