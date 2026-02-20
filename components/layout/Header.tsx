'use client';

// YENİ: useState ve useEffect eklendi
import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell } from 'lucide-react';

export default function Header({ data, searchTerm, setSearchTerm, setIsMobileMenuOpen }: any) {
  // YENİ: Çevrimdışı durum kontrolü (Header'daki yeşil/kırmızı nokta için)
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // İlk yüklemede durumu kontrol et
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // YENİ: Bildirim sayısını hesapla (Acil Durumlar + Bekleyen Arızalar)
  const notificationCount = (data?.activeEmergencies?.length || 0) + (data?.pendingFaults?.length || 0);

  return (
    <header className="h-16 sm:h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="lg:hidden p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all active:scale-95 border border-slate-100"
        >
          <Menu size={20} />
        </button>
        <div className="flex flex-col">
          <h1 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2 tracking-tight">
            {data?.name || 'Yükleniyor...'} 
            {/* YENİ: İnternet durumuna göre renk değiştiren akıllı nokta */}
            <span 
              title={isOffline ? "Çevrimdışı (Önbellek)" : "Çevrimiçi (Canlı)"} 
              className={`w-2 h-2 rounded-full animate-pulse shadow-sm ${isOffline ? 'bg-rose-500' : 'bg-emerald-500'}`}
            ></span>
          </h1>
          <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">{data?.ownerName || 'Yönetim'}</span>
        </div>
      </div>

      {/* YENİ: Arama Çubuğu ve Bildirim Zili Eklendi */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* Arama Kutusu (Mobilde gizlenir, tablette/bilgisayarda görünür) */}
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Hızlı ara..." 
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48 lg:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 text-slate-700 shadow-inner"
          />
        </div>
        
        {/* Bildirim Zili */}
        <button className="relative p-2.5 sm:p-2 bg-slate-50 border border-slate-100 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>

      </div>
    </header>
  );
}