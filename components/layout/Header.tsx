'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Building2 } from 'lucide-react';

export default function Header({ data, searchTerm, setSearchTerm, setIsMobileMenuOpen }: any) {
  const [isOffline, setIsOffline] = useState(false);
  
  // Kullanıcı Adı, Rolü ve Branşını tutan State
  const [userInfo, setUserInfo] = useState({ name: '', role: '', branch: '' });
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

  useEffect(() => {
    // 1. İNTERNET DURUMU
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. KULLANICI BİLGİLERİ
    const storedRole = localStorage.getItem('userRole') || '';
    const storedName = localStorage.getItem('userName') || '';
    let currentBranch = '';
    let currentName = storedName;

    // Eğer Patron girdiyse:
    if (storedRole === 'Patron') {
        currentName = data?.ownerName || storedName || 'Firma Sahibi';
        currentBranch = ''; // DÜZELTME: Patronun branşı olmaz, gizliyoruz.
    } 
    // Eğer Personel (Yönetici veya Usta) girdiyse:
    else if (data?.staff) {
        const currentStaff = data.staff.find((s: any) => s.name === storedName);
        if (currentStaff) {
            currentBranch = currentStaff.branch || 'Saha Ekibi';
        }
    }

    setUserInfo({ name: currentName, role: storedRole, branch: currentBranch });

    // 3. LOGO RENK ANALİZİ
    if (data?.logo) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      
      img.onerror = () => {
        setLogoBgColor('#ffffff');
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixelData = imageData.data;
          let r = 0, g = 0, b = 0, count = 0;
          
          for (let i = 0; i < pixelData.length; i += 4) {
            if (pixelData[i + 3] < 128) continue; 
            r += pixelData[i];
            g += pixelData[i + 1];
            b += pixelData[i + 2];
            count++;
          }
          
          if (count > 0) {
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);

            const palette = [
              { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
              { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, 
              { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }
            ];

            let maxDist = -1;
            let selectedColor = '#ffffff';

            for (const color of palette) {
              const dist = Math.sqrt(Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2));
              if (dist > maxDist) {
                maxDist = dist;
                selectedColor = color.hex;
              }
            }
            setLogoBgColor(selectedColor);
          }
        } catch (e) {
          console.error("Renk analizi yapılamadı:", e);
        }
      };
      img.src = data.logo;
    } else {
      setLogoBgColor('#ffffff');
    }

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
          <div 
             className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-200/50 p-1.5 overflow-hidden"
             style={{ backgroundColor: logoBgColor }}
          >
             <img 
               src={data.logo} 
               alt="Firma Logo" 
               className="w-full h-full object-contain drop-shadow-sm" 
             />
          </div>
        ) : (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <Building2 size={20} />
          </div>
        )}

        <div className="flex flex-col justify-center ml-1">
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