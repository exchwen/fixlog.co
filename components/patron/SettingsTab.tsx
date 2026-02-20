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
  
  // YENİ: Çevrimdışı kontrolü için State
  const [isOffline, setIsOffline] = useState(false);

  // YENİ: İnternet durumunu dinleyen useEffect
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
    // YENİ: Çevrimdışı/Offline Kuyruk Koruması Entegrasyonu
    if (isOffline) {
       console.warn("İnternet bağlantısı yok. Ayarlarınız kuyruğa alındı.");
       const activeSlug = localStorage.getItem('companySlug') || ''; // Eğer parametreyle gelmiyorsa lokalden çek
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
    <div className="max-w-3xl mx-auto space-y-6">
      
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
              className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full"
            >
              {modalState === 'success' ? (
                <>
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Başarılı!</h3>
                  <p className="text-slate-500 text-center text-sm mb-6">
                    {/* YENİ: Offline ise başarılı mesajı değişir */}
                    {isOffline ? 'İnternet bağlantınız yok. Ayarlarınız cihaza kaydedildi, bağlantı sağlandığında sisteme aktarılacaktır.' : 'İşletme ayarlarınız başarıyla güncellendi ve sisteme kaydedildi.'}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Hata Oluştu!</h3>
                  <p className="text-slate-500 text-center text-sm mb-6">Ayarlar kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.</p>
                </>
              )}
              <button 
                onClick={() => setModalState('idle')} 
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                Kapat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             İşletme Ayarları
             {/* YENİ: Offline durumu için küçük ikon. Span içine alındı. */}
             {isOffline && <span title="Çevrimdışı Mod"><WifiOff size={14} className="text-amber-500" /></span>}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Firma bilgilerinizi buradan güncelleyebilirsiniz.</p>
        </div>
        <button 
          disabled={isSaving || !isFormValid} 
          onClick={handleSave} 
          // YENİ: active:scale-95 eklendi (Mobil dokunmatik hissi)
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : (isOffline ? <WifiOff size={16} /> : <Save size={16} />)}
          {isOffline ? 'Kuyruğa Al' : 'Ayarları Kaydet'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        
        {/* Logo Yükleme Alanı */}
        <div className="flex flex-col sm:flex-row gap-5 items-center bg-slate-50 p-4 border border-slate-200 rounded-xl">
          <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            {settingsForm?.logo ? (
              <img src={settingsForm.logo} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
            ) : (
              <ImagePlus className="text-slate-300" size={32} />
            )}
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Firma Logosu</label>
            <p className="text-xs text-slate-500 mb-3">Şeffaf arka plana sahip bir PNG dosyası yüklemeniz önerilir. Sistemimiz görseli anında optimize edecektir.</p>
            <div className="flex gap-2">
              <label className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all active:scale-95 shadow-sm inline-block">
                <input type="file" accept="image/png" className="hidden" onChange={handleLogoUpload} />
                Logo Seç
              </label>
              {settingsForm?.logo && (
                <button onClick={() => setSettingsForm({...settingsForm, logo: ''})} className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all active:scale-95 shadow-sm">
                  Kaldır
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Firma Adı & Yetkili */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Firma Ünvanı</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 font-medium"
                value={settingsForm?.companyName || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                placeholder="Örn: Kaya Asansör Ltd. Şti."
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Yetkili Ad Soyad</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                value={settingsForm?.ownerName || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, ownerName: e.target.value })}
                placeholder="Ad Soyad"
              />
            </div>
          </div>
        </div>

        {/* Sektör (KİLİTLİ) & Web Sitesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              Faaliyet Sektörü <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-normal">(Değiştirilemez)</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-sm outline-none cursor-not-allowed font-medium"
                value={settingsForm?.sector || ''}
                readOnly
                placeholder="Sektör"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Web Sitesi</label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="url"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                value={settingsForm?.website || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                placeholder="www.firmaniz.com"
              />
            </div>
          </div>
        </div>

        {/* İLETİŞİM BİLGİLERİ (4'LÜ GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">İşletme Telefonu (Cep)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="tel"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                  value={settingsForm?.phone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">İş Dökümü yetkililerinin sizinle iletişime geçebileceği ana irtibat numarasıdır.</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1.5 block">Sabit Hat Numarası</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 text-blue-400" size={16} />
                <input 
                  type="tel"
                  className="w-full pl-10 pr-3 py-2.5 border border-blue-200 bg-blue-50/30 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-blue-300"
                  value={settingsForm?.landlinePhone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, landlinePhone: e.target.value })}
                  placeholder="02XX XXX XX XX"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">İşletmenizin sabit hattı. (Cihaz QR etiketlerinde görünür)</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5 block">WhatsApp Numarası</label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-2.5 text-emerald-500" size={16} />
                <input 
                  type="tel"
                  className="w-full pl-10 pr-3 py-2.5 border border-emerald-200 bg-emerald-50/30 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-800 placeholder:text-emerald-300"
                  value={settingsForm?.whatsappPhone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappPhone: e.target.value })}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Müşterilere mesaj atabileceğiniz hat. (QR etiketinde görünür)</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} /> Acil Durum Hattı
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-rose-400" size={16} />
                <input 
                  type="tel"
                  className="w-full pl-10 pr-3 py-2.5 border border-rose-200 bg-rose-50 rounded-lg text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-slate-800 placeholder:text-rose-300"
                  value={settingsForm?.emergencyPhone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, emergencyPhone: e.target.value })}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">QR kod sayfasındaki "Acil Destek" butonunda bu numara aranır.</p>
            </div>
        </div>

        {/* Adres Yönetimi */}
        <div className="border-t border-slate-100 pt-5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Konum ve Adres</label>
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">İl</label>
                   <select 
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none bg-white focus:border-blue-500"
                      value={localCity}
                      onChange={(e) => updateAddress(localDetail, e.target.value, '')}
                   >
                      <option value="">Seçiniz</option>
                      {Object.keys(CITY_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">İlçe</label>
                   <select 
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                      value={localDistrict}
                      onChange={(e) => updateAddress(localDetail, localCity, e.target.value)}
                      disabled={!localCity}
                   >
                      <option value="">Seçiniz</option>
                      {localCity && CITY_DATA[localCity]?.map((d: string) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                   </select>
                </div>
             </div>
             <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Adres Detayı (Mahalle, Cadde, Sokak, No...)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                  <textarea 
                    rows={2}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 resize-none bg-white"
                    value={localDetail}
                    onChange={(e) => updateAddress(e.target.value, localCity, localDistrict)}
                    placeholder="Mahalle, Sokak, Bina No..."
                  />
                </div>
             </div>
          </div>
        </div>

        {/* Vergi Bilgileri */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Vergi Dairesi / VKN / T.C.</label>
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
              value={settingsForm?.taxInfo || ''}
              onChange={(e) => setSettingsForm({ ...settingsForm, taxInfo: e.target.value })}
              placeholder="Vergi Dairesi ve Numarası"
            />
          </div>
        </div>

        {!isFormValid && (
           <div className="bg-amber-50 text-amber-600 px-4 py-3 rounded-lg text-xs font-medium border border-amber-100 flex items-center gap-2 mt-4">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              Sistemi kullanmaya devam edebilmek için lütfen tüm zorunlu alanları eksiksiz doldurup kaydedin.
           </div>
        )}

      </div>
    </div>
  );
}