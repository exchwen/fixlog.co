'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Building2 } from 'lucide-react';

export default function Header({ data, searchTerm, setSearchTerm, setIsMobileMenuOpen }: any) {
  const [isOffline, setIsOffline] = useState(false);
  
  // Kullanıcı Adı, Rolü ve Branşını tutan State
  const [userInfo, setUserInfo] = useState({ name: '', role: '', branch: '' });

  useEffect(() => {
    // İlk yüklemede internet durumunu kontrol et
    setIsOffline(!navigator.onLine);

    // Tarayıcıdan giriş yapan kişinin bilgilerini alıyoruz
    const storedRole = localStorage.getItem('userRole') || '';
    const storedName = localStorage.getItem('userName') || '';
    let currentBranch = '';
    let currentName = storedName;

    // Eğer Patron girdiyse:
    if (storedRole === 'Patron') {
        currentName = data?.ownerName || storedName || 'Firma Sahibi';
        currentBranch = data?.sector || 'Merkez Yönetim';
    } 
    // Eğer Personel (Yönetici veya Usta) girdiyse:
    else if (data?.staff) {
        const currentStaff = data.staff.find((s: any) => s.name === storedName);
        if (currentStaff) {
            currentBranch = currentStaff.branch || 'Saha Ekibi';
        }
    }

    setUserInfo({ name: currentName, role: storedRole, branch: currentBranch });

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [data]);

  const notificationCount = (data?.activeEmergencies?.length || 0) + (data?.pendingFaults?.length || 0);

  return (
    <header className="h-16 sm:h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="lg:hidden p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all active:scale-95 border border-slate-100 shrink-0"
        >
          <Menu size={20} />
        </button>

        {/* FİRMA LOGOSU VEYA VARSAYILAN İKON */}
        {data?.logo ? (
          <img 
            src={data.logo} 
            alt="Firma Logo" 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1 shadow-sm shrink-0" 
          />
        ) : (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <Building2 size={18} />
          </div>
        )}

        <div className="flex flex-col justify-center">
          <h1 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2 tracking-tight max-w-[150px] sm:max-w-xs">
            <span className="truncate">{data?.name || 'Yükleniyor...'}</span>
            
            <span 
              title={isOffline ? "Çevrimdışı (Önbellek)" : "Çevrimiçi (Canlı)"} 
              className={`w-2 h-2 rounded-full animate-pulse shadow-sm shrink-0 ${isOffline ? 'bg-rose-500' : 'bg-emerald-500'}`}
            ></span>
          </h1>
          
          {/* İSİM, YETKİ VE BRANŞ ETİKETLERİ */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate max-w-[70px] sm:max-w-[120px]">
              {userInfo.name || 'Yönetim'}
            </span>
            
            {userInfo.role && (
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shadow-sm shrink-0
                ${userInfo.role === 'Patron' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                  userInfo.role === 'Yönetici' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                  'bg-emerald-100 text-emerald-700 border-emerald-200'}`}
              >
                {userInfo.role}
              </span>
            )}

            {userInfo.branch && (
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shadow-sm shrink-0 truncate max-w-[70px] sm:max-w-[120px]">
                {userInfo.branch}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        
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