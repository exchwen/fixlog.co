'use client';

// YENİ: WifiOff eklendi
import React, { useEffect, useState } from 'react';
import { Save, Loader2, Building2, User, Phone, MapPin, FileText, Briefcase, AlertTriangle, MessageCircle, ImagePlus, CheckCircle, Globe, WifiOff } from 'lucide-react';
import trCitiesData from '@/lib/data/tr-cities.json';
import { motion, AnimatePresence } from 'framer-motion';

const CITY_DATA: any = trCitiesData;

export default function SettingsTab({ settingsForm = {}, setSettingsForm, handleAction, isSaving }: any) {
  
  const [localCity, setLocalCity] = useState('');
  const [localDistrict, setLocalDistrict] = useState('');
  const [localDetail, setLocalDetail] = useState('');
  
  const [modalState, setModalState] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Çevrimdışı kontrolü için State
  const [isOffline, setIsOffline] = useState(false);
  
  // 🚀 LOGO ARKA PLAN RENK SİSTEMİ İÇİN STATE
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

  // İnternet durumunu dinleyen useEffect
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (settingsForm?.address) {
      const parts = settingsForm.address.split(' / ');
      if (parts.length >= 3) {
        const city = parts[parts.length - 1].trim();
        const district = parts[parts.length - 2].trim();
        
        if (CITY_DATA[city]) {
          setLocalCity(city);
          setLocalDistrict(district);
          setLocalDetail(parts.slice(0, parts.length - 2).join(' / ').trim());
          return;
        }
      }
      setLocalDetail(settingsForm.address);
    }
  }, [settingsForm?.address]);

  // 🚀 GÜVENLİ LİNK DÖNÜŞÜTÜRÜCÜ (PROXY)
  const getSafeImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev')) {
       return url.replace('https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  // 🚀 LOGO YÜKLENDİĞİNDE VEYA MEVCUT LOGO VARSA RENK ANALİZİ YAP
  useEffect(() => {
    if (!settingsForm?.logo) {
      setLogoBgColor('#ffffff');
      return;
    }

    // Seçilen logo base64 (yeni yüklendi) veya url (zaten var) olabilir.
    let logoSource = settingsForm.logo;
    
    // Sadece url ise proxy'den geçir. Base64 ise dokunma.
    if (logoSource.startsWith('http')) {
        logoSource = getSafeImageUrl(logoSource);
    }

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
        const data = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          // Saydam pikselleri atla
          if (data[i + 3] < 128) continue; 
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
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
    
    // Cache kırma
    img.src = logoSource + (logoSource.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
  }, [settingsForm?.logo]);

  const updateAddress = (newDetail: string, newCity: string, newDistrict: string) => {
    setLocalDetail(newDetail);
    setLocalCity(newCity);
    setLocalDistrict(newDistrict);

    let fullAddress = newDetail.trim();
    if (newDistrict) fullAddress += ` / ${newDistrict}`;
    if (newCity) fullAddress += ` / ${newCity}`;

    setSettingsForm({ ...(settingsForm || {}), address: fullAddress });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 250; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/png');
            setSettingsForm({ ...(settingsForm || {}), logo: dataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Çevrimdışı/Offline Kuyruk Koruması Entegrasyonu
    if (isOffline) {
       console.warn("İnternet bağlantısı yok. Ayarlarınız kuyruğa alındı.");
       const activeSlug = localStorage.getItem('companySlug') || ''; 
       const pending = JSON.parse(localStorage.getItem(`offline_actions_${activeSlug}`) || '[]');
       pending.push({ endpoint: 'update-settings', body: settingsForm, timestamp: new Date().toISOString() });
       localStorage.setItem(`offline_actions_${activeSlug}`, JSON.stringify(pending));
       
       setModalState('success');
       setTimeout(() => setModalState('idle'), 3000);
       return;
    }

    const success = await handleAction('update-settings', settingsForm);
    if (success) {
      setModalState('success');
      setTimeout(() => setModalState('idle'), 3000);
    } else {
      setModalState('error');
    }
  };

  const isFormValid = 
    settingsForm?.companyName?.trim() &&
    settingsForm?.ownerName?.trim() &&
    settingsForm?.sector?.trim() &&
    settingsForm?.phone?.trim() &&
    settingsForm?.emergencyPhone?.trim() &&
    settingsForm?.address?.trim() &&
    settingsForm?.taxInfo?.trim();

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative pb-20 sm:pb-6">
      
      {/* Modal - Onay veya Hata */}
      <AnimatePresence>
        {modalState !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full"
            >
              {modalState === 'success' ? (
                <>
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">Başarılı!</h3>
                  <p className="text-slate-500 text-center text-sm mb-6 font-medium leading-relaxed">
                    {/* Offline ise başarılı mesajı değişir */}
                    {isOffline ? 'İnternet bağlantınız yok. Ayarlarınız cihaza kaydedildi, bağlantı sağlandığında sisteme aktarılacaktır.' : 'İşletme ayarlarınız başarıyla güncellendi ve sisteme kaydedildi.'}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">Hata Oluştu!</h3>
                  <p className="text-slate-500 text-center text-sm mb-6 font-medium leading-relaxed">Ayarlar kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.</p>
                </>
              )}
              <button 
                onClick={() => setModalState('idle')} 
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors active:scale-95 shadow-md"
              >
                Kapat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
             İşletme Ayarları
             {isOffline && <span title="Çevrimdışı Mod"><WifiOff size={16} className="text-amber-500" /></span>}
          </h3>
          <p className="text-xs font-medium text-slate-500 mt-1">Firma bilgilerinizi buradan güncelleyebilirsiniz.</p>
        </div>
        
        <div className="fixed bottom-4 left-4 right-4 sm:static sm:bottom-auto sm:left-auto sm:right-auto z-50 flex sm:block justify-center pointer-events-none sm:pointer-events-auto">
          <button 
            disabled={isSaving || !isFormValid} 
            onClick={handleSave} 
            className="w-[calc(100vw-32px)] sm:w-auto bg-blue-600 text-white px-6 py-3.5 sm:py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl sm:shadow-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : (isOffline ? <WifiOff size={18} /> : <Save size={18} />)}
            {isOffline ? 'Kuyruğa Al' : 'Ayarları Kaydet'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
        
        {/* Logo Yükleme Alanı */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start bg-slate-50 p-4 border border-slate-200 rounded-xl">
          <div 
             className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-200 transition-colors duration-300"
             // 🚀 BURASI SİHİRLİ ALAN: Renk analizi sonucunu arka plana atarız
             style={{ backgroundColor: settingsForm?.logo ? logoBgColor : '#ffffff' }}
          >
            {settingsForm?.logo ? (
              <img src={settingsForm.logo} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
            ) : (
              <ImagePlus className="text-slate-300" size={32} />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Firma Logosu</label>
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 mb-3 leading-relaxed">Şeffaf arka plana sahip bir PNG dosyası yüklemeniz önerilir. Sistemimiz görseli anında optimize edecektir.</p>
            <div className="flex justify-center sm:justify-start gap-2">
              <label className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 transition-all active:scale-95 shadow-sm inline-flex items-center justify-center">
                <input type="file" accept="image/png" className="hidden" onChange={handleLogoUpload} />
                Logo Seç
              </label>
              {settingsForm?.logo && (
                <button onClick={() => { setSettingsForm({...settingsForm, logo: ''}); setLogoBgColor('#ffffff'); }} className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all active:scale-95 shadow-sm">
                  Kaldır
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Firma Adı & Yetkili */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Firma Ünvanı</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
              <input 
                className="w-full pl-10 pr-3 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 font-bold"
                value={settingsForm?.companyName || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                placeholder="Örn: Kaya Asansör Ltd. Şti."
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Yetkili Ad Soyad</label>
            <div className="relative">
              <User className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
              <input 
                className="w-full pl-10 pr-3 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 font-semibold"
                value={settingsForm?.ownerName || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, ownerName: e.target.value })}
                placeholder="Ad Soyad"
              />
            </div>
          </div>
        </div>

        {/* Sektör & Web Sitesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between sm:justify-start sm:gap-2">
              Faaliyet Sektörü <span className="text-[9px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-400 font-bold">Değiştirilemez</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
              <input 
                className="w-full pl-10 pr-3 py-3 sm:py-2.5 border border-slate-200 bg-slate-50/50 text-slate-500 rounded-xl text-sm outline-none cursor-not-allowed font-bold"
                value={settingsForm?.sector || ''}
                readOnly
                placeholder="Sektör"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Web Sitesi</label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
              <input 
                type="url"
                className="w-full pl-10 pr-3 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 font-semibold"
                value={settingsForm?.website || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                placeholder="www.firmaniz.com"
              />
            </div>
          </div>
        </div>

        {/* İLETİŞİM BİLGİLERİ (4'LÜ GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-6">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">İşletme Telefonu (Cep)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
                <input 
                  type="tel"
                  className="w-full pl-10 pr-3 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 font-bold tracking-wide"
                  value={settingsForm?.phone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <p className="text-[10px] font-medium text-slate-400 mt-1.5 leading-snug">İş Dökümü yetkililerinin sizinle iletişime geçebileceği ana irtibat numarasıdır.</p>
            </div>

            <div>
              <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1.5 block">Sabit Hat Numarası</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 sm:top-2.5 text-blue-400" size={16} />
                <input 
                  type="tel"
                  className="w-full pl-10 pr-3 py-3 sm:py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 font-bold tracking-wide placeholder:text-blue-300"
                  value={settingsForm?.landlinePhone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, landlinePhone: e.target.value })}
                  placeholder="02XX XXX XX XX"
                />
              </div>
              <p className="text-[10px] font-medium text-slate-400 mt-1.5 leading-snug">İşletmenizin sabit hattı. (Cihaz QR etiketlerinde görünür)</p>
            </div>

            <div>
              <label className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 block">WhatsApp Numarası</label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-3 sm:top-2.5 text-emerald-500" size={16} />
                <input 
                  type="tel"
                  className="w-full pl-10 pr-3 py-3 sm:py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 font-bold tracking-wide placeholder:text-emerald-300"
                  value={settingsForm?.whatsappPhone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappPhone: e.target.value })}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <p className="text-[10px] font-medium text-slate-400 mt-1.5 leading-snug">Müşterilere mesaj atabileceğiniz hat. (QR etiketinde görünür)</p>
            </div>

            <div>
              <label className="text-[11px] font-black text-rose-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Acil Durum Hattı
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 sm:top-2.5 text-rose-400" size={16} />
                <input 
                  type="tel"
                  className="w-full pl-10 pr-3 py-3 sm:py-2.5 bg-rose-50/80 border border-rose-200 rounded-xl text-sm outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-slate-800 font-bold tracking-wide placeholder:text-rose-300"
                  value={settingsForm?.emergencyPhone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, emergencyPhone: e.target.value })}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <p className="text-[10px] font-medium text-slate-400 mt-1.5 leading-snug">QR kod sayfasındaki "Acil Destek" butonunda bu numara aranır.</p>
            </div>
        </div>

        {/* Adres Yönetimi */}
        <div className="border-t border-slate-100 pt-6">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Konum ve Adres Bilgisi</label>
          <div className="space-y-4 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1.5 block">İl</label>
                   <select 
                      className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none pr-8 cursor-pointer transition-all"
                      value={localCity}
                      onChange={(e) => updateAddress(localDetail, e.target.value, '')}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
                   >
                      <option value="">İl Seçiniz</option>
                      {Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1.5 block">İlçe</label>
                   <select 
                      className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed appearance-none pr-8 cursor-pointer transition-all"
                      value={localDistrict}
                      onChange={(e) => updateAddress(localDetail, localCity, e.target.value)}
                      disabled={!localCity}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
                   >
                      <option value="">İlçe Seçiniz</option>
                      {localCity && CITY_DATA[localCity]?.map((d: string) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                   </select>
                </div>
             </div>
             <div>
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1.5 block">Adres Detayı (Mahalle, Cadde, Sokak, No...)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 sm:top-3.5 text-slate-400" size={16} />
                  <textarea 
                    rows={2}
                    className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 resize-none bg-white"
                    value={localDetail}
                    onChange={(e) => updateAddress(e.target.value, localCity, localDistrict)}
                    placeholder="Mahalle, Sokak, Bina No..."
                  />
                </div>
             </div>
          </div>
        </div>

        {/* Vergi Bilgileri */}
        <div className="border-t border-slate-100 pt-6 pb-2">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Vergi Dairesi / VKN / T.C.</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
            <input 
              className="w-full pl-10 pr-3 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
              value={settingsForm?.taxInfo || ''}
              onChange={(e) => setSettingsForm({ ...settingsForm, taxInfo: e.target.value })}
              placeholder="Vergi Dairesi ve Numarası"
            />
          </div>
        </div>

        {!isFormValid && (
           <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-[11px] sm:text-xs font-bold border border-amber-200 flex items-start sm:items-center gap-3 mt-4 shadow-sm">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shrink-0 mt-1 sm:mt-0"></span>
              <span>Sistemi kullanmaya devam edebilmek için lütfen tüm zorunlu alanları eksiksiz doldurup <strong>"Ayarları Kaydet"</strong> butonuna basın.</span>
           </div>
        )}

      </div>
    </div>
  );
}