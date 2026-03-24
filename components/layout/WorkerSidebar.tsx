'use client';

import React, { useState, useEffect } from 'react';
import { LogOut, CheckCircle2, ChevronRight, X, ListTodo } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function WorkerSidebar({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }: any) {
  const { slug } = useParams();
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(true);

  // 🚀 Ekran boyutunu dinleyerek animasyon çakışmasını engelliyoruz
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop(); 
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // 🚀 Swipe (Kaydırma) Algılama Mantığı
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;
      const minSwipeDistance = 50; // Kaydırmanın algılanması için gereken minimum piksel

      if (swipeDistance > minSwipeDistance) {
        // Soldan Sağa Kaydırma -> Aç
        // Sadece ekranın en solundan (ilk 50px) kaydırmaya başlandıysa aç ki sayfada gezinirken yanlışlıkla menü açılmasın
        if (touchStartX < 50 && !isDesktop) {
          setIsMobileMenuOpen(true);
        }
      } else if (swipeDistance < -minSwipeDistance) {
        // Sağdan Sola Kaydırma -> Kapat
        if (isMobileMenuOpen && !isDesktop) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen, isDesktop]);

  const handleLogout = () => {
    // 🚀 KESİN ÇIKIŞ MANTIĞI: Tüm önbelleği, çerezleri ve local verileri silip zorla yönlendirir.
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.replace(`/${slug}/login`); 
  };

  const navItems = [
    { id: 'jobs', icon: <ListTodo size={20} />, label: 'Bekleyen Görevler' },
    { id: 'completed', icon: <CheckCircle2 size={20} />, label: 'Tamamlanan İşler' }
  ];

  return (
    <>
      {/* Mobildeki Arka Plan Karartması (Animasyonsuz, Performanslı) */}
      {isMobileMenuOpen && !isDesktop && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-[100dvh] bg-white border-r border-slate-200 z-[210] lg:z-40 w-72 lg:w-20 lg:hover:w-64 group flex flex-col overflow-hidden shrink-0 
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:shadow-none'} 
        max-lg:transition-transform max-lg:duration-300 max-lg:ease-out lg:transition-all lg:duration-300 lg:ease-in-out`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
               <img src="/favicon.ico" alt="FixLog.co Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex-col opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex">
               <span className="font-black text-slate-800 text-lg leading-tight tracking-tight whitespace-nowrap">FixLog.co</span>
               <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest whitespace-nowrap">Personel</span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group/btn relative overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-sm border border-blue-100' 
                  : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-800 border border-transparent'
              }`}
            >
              <div className="relative z-10 shrink-0">
                {item.icon}
              </div>
              <span className="whitespace-nowrap z-10 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">{item.label}</span>
              {activeTab === item.id && (
                <ChevronRight size={16} className="absolute right-4 text-blue-500 z-10 lg:opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl text-rose-500 font-bold hover:bg-rose-100 hover:text-rose-700 transition-colors border border-transparent hover:border-rose-200 group/btn"
          >
            <div className="shrink-0"><LogOut size={20} /></div>
            <span className="whitespace-nowrap lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">Oturumu Kapat</span>
          </button>
        </div>
      </aside>
    </>
  );
}