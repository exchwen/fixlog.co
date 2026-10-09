'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, ClipboardList, Settings, Box, Package, CreditCard, UserPlus, LogOut, CheckSquare, Bell, HelpCircle, X, CheckCircle2, UserCircle, ChevronRight, ChevronDown, RefreshCw, FileText, List } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function Sidebar({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }: any) {
  
  const { slug } = useParams();
  const [userRole, setUserRole] = useState<string>('');
  const [isDesktop, setIsDesktop] = useState(true);
  const [openGroups, setOpenGroups] = useState<string[]>(['overview']);

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
    const isPatron = userRole === 'Patron';
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    if (isPatron) {
      window.location.replace('/'); 
    } else {
      window.location.replace(`/${slug}/login`); 
    }
  };

    const navGroups = [
    { id: 'overview', label: 'Genel Bak\u0131\u015f', icon: LayoutDashboard, items: [{ id: 'home', label: 'Genel Bak\u0131\u015f', icon: LayoutDashboard }] },
    { id: 'sales', label: 'M\u00fc\u015fteri & Sat\u0131\u015f', icon: Users, items: [
      { id: 'quotes', label: 'Teklifler', icon: FileText },
      { id: 'customers', label: 'M\u00fc\u015fteriler', icon: UserPlus },
    ] },
    { id: 'operations', label: '\u0130\u015f & Bak\u0131m', icon: ClipboardList, items: [
      ...(userRole === 'Y\u00f6netici' ? [{ id: 'my-jobs', label: 'Bana Atananlar', icon: UserCircle }] : []),
      { id: 'jobs', label: '\u0130\u015f Emirleri', icon: ClipboardList },
      { id: 'pending', label: 'Onay Bekleyenler', icon: CheckSquare },
      { id: 'completed', label: 'Tamamlanan \u0130\u015fler', icon: CheckCircle2 },
      { id: 'periodic', label: 'Periyodik Bak\u0131m', icon: RefreshCw },
      { id: 'alerts', label: 'Kay\u0131t Ge\u00e7mi\u015fi', icon: Bell },
    ] },
    { id: 'inventory', label: 'Varl\u0131k & Stok', icon: Package, items: [
      { id: 'assets', label: 'Varl\u0131klar', icon: Box },
      { id: 'stock', label: 'Stok Takibi', icon: Package },
      { id: 'bom', label: 'BOM \u015eablonlar\u0131', icon: List },
    ] },
    { id: 'management', label: 'Y\u00f6netim', icon: Settings, items: [
      { id: 'team', label: 'Saha Ekibi', icon: Users },
      { id: 'finance', label: 'Finans', icon: CreditCard },
      { id: 'settings', label: 'Firma Ayarlar\u0131', icon: Settings },
      { id: 'support', label: 'Destek & Bildirim', icon: HelpCircle },
    ] },
  ];

  useEffect(() => {
    const activeGroup = navGroups.find(group => group.items.some(item => item.id === activeTab));
    if (activeGroup) setOpenGroups(current => current.includes(activeGroup.id) ? current : [...current, activeGroup.id]);
  }, [activeTab, userRole]);

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
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
               <img src="/favicon.ico" alt="FixLog.co Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex-col opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex">
               <span className="font-bold text-white text-sm tracking-tight whitespace-nowrap">FixLog.co</span>
               <span className="text-[10px] text-blue-500 font-bold tracking-widest whitespace-nowrap">{userRole || 'Yönetim'}</span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-2 mt-1 overflow-y-auto custom-scrollbar">
          {navGroups.map(group => {
            const isOpen = openGroups.includes(group.id);
            const groupIsActive = group.items.some(item => item.id === activeTab);
            return (
              <section key={group.id} className="rounded-xl">
                <button type="button" aria-expanded={isOpen} aria-controls={`sidebar-group-${group.id}`}
                  onClick={() => setOpenGroups(current => current.includes(group.id) ? current.filter(id => id !== group.id) : [...current, group.id])}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group/folder ${groupIsActive ? 'text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <group.icon size={18} className="shrink-0" />
                  <span className="flex-1 text-left whitespace-nowrap text-[12px] font-bold uppercase tracking-wide lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">{group.label}</span>
                  <ChevronDown size={14} className={`shrink-0 transition-transform lg:opacity-0 group-hover:opacity-100 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <div id={`sidebar-group-${group.id}`} className="mt-1 hidden space-y-1 border-l border-slate-700 ml-[21px] pl-2 lg:group-hover:block">
                  {group.items.map(item => (
                    <button key={item.id} type="button" onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} aria-current={activeTab === item.id ? 'page' : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left transition-colors ${activeTab === item.id ? 'bg-blue-600/15 text-blue-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'}`}>
                      <span className="relative shrink-0"><item.icon size={16} />{item.id === 'pending' && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full border border-slate-900 bg-amber-500" />}</span>
                      <span className="flex-1 whitespace-nowrap text-[12px]">{item.label}</span>
                      {activeTab === item.id && <ChevronRight size={13} className="shrink-0" />}
                    </button>
                  ))}
                </div>}
              </section>
            );
          })}
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
