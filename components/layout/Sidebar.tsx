'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, ClipboardList, Settings, Box, Package, CreditCard, UserPlus, LogOut, ShieldCheck, CheckSquare, Bell, HelpCircle, X, CheckCircle2, UserCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function Sidebar({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }: any) {
  
  const { slug } = useParams();
  const [userRole, setUserRole] = useState<string>('');
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const isPatronPath = window.location.pathname.includes('/dashboard');
    const prefix = isPatronPath ? 'patron_' : 'staff_';
    const role = localStorage.getItem(`${prefix}userRole`) || (isPatronPath ? 'Patron' : '');
    setUserRole(role);
  }, []);

  // Ekran boyutunu dinliyoruz
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
        // Sadece ekranın en solundan (ilk 50px) kaydırmaya başlandıysa aç ki sayfa içinde gezinirken yanlışlıkla açılmasın
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
    { id: 'home', label: 'Genel Bakış', icon: LayoutDashboard },
    ...(userRole === 'Yönetici' ? [{ id: 'my-jobs', label: 'Bana Atananlar', icon: UserCircle }] : []),
    { id: 'jobs', label: 'İş Emirleri', icon: ClipboardList },
    { id: 'pending', label: 'Onay Bekleyenler', icon: CheckSquare },
    { id: 'completed', label: 'Tamamlanan İşler', icon: CheckCircle2 },
    { id: 'periodic', label: 'Periyodik Bakım', icon: RefreshCw },
    { id: 'alerts', label: 'Kayıt Geçmişi', icon: Bell },
    { id: 'team', label: 'Saha Ekibi', icon: Users },
    { id: 'customers', label: 'Müşteriler', icon: UserPlus },
    { id: 'assets', label: 'Varlıklar', icon: Box },
    { id: 'stock', label: 'Stok Takibi', icon: Package },
    { id: 'finance', label: 'Finans', icon: CreditCard },
    { id: 'settings', label: 'Firma Ayarları', icon: Settings },
    { id: 'support', label: 'Destek & Bildirim', icon: HelpCircle },
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
        className={`fixed lg:sticky top-0 left-0 h-[100dvh] bg-slate-900 border-r border-slate-800 z-[210] lg:z-40 w-72 lg:w-20 lg:hover:w-64 group flex flex-col overflow-hidden shrink-0 
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:shadow-none'} 
        max-lg:transition-none lg:transition-all lg:duration-300 lg:ease-in-out`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800 shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg">
               <ShieldCheck size={18} />
            </div>
            <div className="flex-col opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex">
               <span className="font-bold text-white text-sm tracking-tight uppercase whitespace-nowrap">İŞ DÖKÜMÜ</span>
               <span className="text-[10px] text-blue-500 font-bold tracking-widest whitespace-nowrap">{userRole || 'Yönetim'}</span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group/btn relative overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-500 font-bold' 
                  : 'text-slate-400 font-medium hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="relative z-10 shrink-0">
                <item.icon size={18} />
                {item.id === 'pending' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse border border-slate-900"></span>
                )}
              </div>
              <span className="whitespace-nowrap z-10 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[13px]">{item.label}</span>
              {activeTab === item.id && (
                <ChevronRight size={14} className="absolute right-4 text-blue-500 z-10 lg:opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-rose-400 font-bold hover:bg-rose-500/10 transition-colors group/btn"
          >
            <div className="shrink-0"><LogOut size={18} /></div>
            <span className="whitespace-nowrap lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">Çıkış Yap</span>
          </button>
        </div>
      </aside>
    </>
  );
}