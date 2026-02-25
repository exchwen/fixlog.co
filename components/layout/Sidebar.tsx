'use client';

import React, { useEffect, useState } from 'react';
// YENİ: X ikonu ve UserCircle eklendi
import { LayoutDashboard, Users, ClipboardList, Settings, Box, Package, CreditCard, UserPlus, LogOut, ShieldCheck, CheckSquare, Bell, HelpCircle, X, CheckCircle2, UserCircle } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }: any) {
  
  // YENİ: Menüleri yetkiye göre filtrelemek için kullanıcı rolünü tutuyoruz
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Component yüklendiğinde oturum açan kişinin rolünü bul
    const isPatronPath = window.location.pathname.includes('/dashboard');
    const prefix = isPatronPath ? 'patron_' : 'staff_';
    const role = localStorage.getItem(`${prefix}userRole`) || (isPatronPath ? 'Patron' : '');
    setUserRole(role);
  }, []);

  // Çıkış yapma fonksiyonu
  const handleLogout = () => {
    // Çıkış anında anlık olarak hangi ekranda olduğumuzu tekrar kontrol ediyoruz ki yanlışlık olmasın
    const isPatronPath = window.location.pathname.includes('/dashboard');
    const prefix = isPatronPath ? 'patron_' : 'staff_';

    // SADECE aktif kullanıcının yetkilerini temizle, tarayıcıdaki her şeyi silme
    // Hem standart kayıtları hem de takılı kalabilen firma/slug kayıtlarını temizliyoruz
    localStorage.removeItem(`${prefix}authToken`);
    localStorage.removeItem(`${prefix}userRole`);
    localStorage.removeItem(`${prefix}userName`);
    localStorage.removeItem(`${prefix}userSlug`);
    localStorage.removeItem(`${prefix}firmaSlug`);
    localStorage.removeItem(`${prefix}slug`);

    // Eğer sisteme önek (patron_ veya staff_) olmadan düz kaydedilmiş inatçı veriler varsa onları da temizliyoruz
    localStorage.removeItem('userRole');
    localStorage.removeItem('role');
    localStorage.removeItem('userSlug');
    localStorage.removeItem('slug');
    localStorage.removeItem('firmaSlug');
    localStorage.removeItem('firma_slug');

    // Kullanıcıyı giriş ekranına yönlendir
    window.location.href = '/'; 
  };

  // Mobilde kaydırma (Swipe) hareketlerini algılayan zeka
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
      
      // Soldan sağa kaydırma (Menüyü Açma) 
      if (swipeDistance > 40 && touchStartX < 120) {
        if (setIsMobileMenuOpen) setIsMobileMenuOpen(true);
      }
      
      // Sağdan sola kaydırma (Menüyü Kapatma)
      if (swipeDistance < -40 && isMobileMenuOpen) {
        if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  // YENİ: Dinamik Menü Listesi (Sadece Yönetici İse 'my-jobs' sekmesini ekler)
  const navItems = [
    { id: 'home', label: 'Genel Bakış', icon: LayoutDashboard },
    // SADECE YÖNETİCİYE ÖZEL SEKME:
    ...(userRole === 'Yönetici' ? [{ id: 'my-jobs', label: 'Bana Atananlar', icon: UserCircle }] : []),
    { id: 'jobs', label: 'İş Emirleri', icon: ClipboardList },
    { id: 'pending', label: 'Onay Bekleyenler', icon: CheckSquare },
    { id: 'completed', label: 'Tamamlanan İşler', icon: CheckCircle2 },
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
      {/* Mobilde arka planı karartan overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden" 
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Mobil tarayıcılarda alt kısmı kesilmemesi için h-[100dvh] */}
      <aside className={`fixed lg:sticky top-0 left-0 h-[100dvh] z-[100] lg:z-50 bg-slate-900 text-slate-400 flex flex-col border-r border-slate-800 transition-transform duration-300 w-64 lg:w-56 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        <div className="p-5 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg"><ShieldCheck size={18} /></div>
            <span className="font-bold text-sm text-white tracking-tight uppercase">İŞ DÖKÜMÜ</span>
          </div>
          {/* Mobil görünümde çarpı (kapatma) butonu */}
          <button 
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)} 
            className="lg:hidden p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => {
                setActiveTab(item.id);
                // Mobilde bir sekmeye tıklandığında menüyü otomatik kapat
                if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
              }} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all relative ${activeTab === item.id ? 'bg-blue-600/10 text-blue-500' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon size={16} /> 
              <span className="text-[13px]">{item.label}</span>
              {/* Onay Bekleyenler sekmesine ufak bir dikkat çekici nokta */}
              {item.id === 'pending' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-rose-400 font-medium hover:bg-rose-500/10 rounded-lg transition-all text-xs"
          >
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
}