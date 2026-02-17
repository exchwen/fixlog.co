'use client';

import React, { useEffect, useState } from 'react';
import { Save, Loader2, Building2, User, Phone, MapPin, FileText, Briefcase, AlertTriangle } from 'lucide-react';
// İl Verisini Çekiyoruz
import trCitiesData from '@/lib/data/tr-cities.json';

const CITY_DATA: any = trCitiesData;

export default function SettingsTab({ settingsForm, setSettingsForm, handleAction, isSaving }: any) {
  
  // Yerel state'ler (Dropdownların düzgün görünmesi için)
  const [localCity, setLocalCity] = useState('');
  const [localDistrict, setLocalDistrict] = useState('');
  const [localDetail, setLocalDetail] = useState('');

  // Sayfa yüklendiğinde mevcut adresi parçalara ayırıp yerel state'lere ata
  useEffect(() => {
    if (settingsForm.address) {
      const parts = settingsForm.address.split(' / ');
      // Format: "Detay / İlçe / İl" varsayıyoruz (DashboardModals ile uyumlu)
      if (parts.length >= 3) {
        const city = parts[parts.length - 1].trim();
        const district = parts[parts.length - 2].trim();
        
        if (CITY_DATA[city]) {
          setLocalCity(city);
          setLocalDistrict(district);
          // Geriye kalan ilk kısımları detay olarak al
          setLocalDetail(parts.slice(0, parts.length - 2).join(' / ').trim());
          return;
        }
      }
      // Format uymuyorsa tamamını detaya bas
      setLocalDetail(settingsForm.address);
    }
  }, []); // Sadece ilk yüklemede çalışsın

  // Herhangi bir adres parçası değiştiğinde ana formu güncelle
  const updateAddress = (newDetail: string, newCity: string, newDistrict: string) => {
    // Önce yerel state'leri güncelle
    setLocalDetail(newDetail);
    setLocalCity(newCity);
    setLocalDistrict(newDistrict);

    // Sonra birleştirip ana forma gönder
    let fullAddress = newDetail.trim();
    if (newDistrict) fullAddress += ` / ${newDistrict}`;
    if (newCity) fullAddress += ` / ${newCity}`;

    setSettingsForm({ ...settingsForm, address: fullAddress });
  };

  // Tüm alanların dolu olup olmadığını kontrol et
  const isFormValid = 
    settingsForm.companyName?.trim() &&
    settingsForm.ownerName?.trim() &&
    settingsForm.sector?.trim() &&
    settingsForm.phone?.trim() &&
    settingsForm.address?.trim() &&
    settingsForm.taxInfo?.trim();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">İşletme Ayarları</h3>
          <p className="text-xs text-slate-500 mt-1">Firma bilgilerinizi buradan güncelleyebilirsiniz.</p>
        </div>
        <button 
          disabled={isSaving || !isFormValid} 
          onClick={() => handleAction('update-settings', settingsForm)} 
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Ayarları Kaydet
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        
        {/* Firma Adı & Yetkili */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Firma Ünvanı</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 font-medium"
                value={settingsForm.companyName}
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
                value={settingsForm.ownerName}
                onChange={(e) => setSettingsForm({ ...settingsForm, ownerName: e.target.value })}
                placeholder="Ad Soyad"
              />
            </div>
          </div>
        </div>

        {/* Sektör (KİLİTLİ) & Telefon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
              Faaliyet Sektörü <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-normal">(Değiştirilemez)</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-sm outline-none cursor-not-allowed font-medium"
                value={settingsForm.sector}
                readOnly
                placeholder="Sektör"
              />
            </div>
          </div>

          {/* İLETİŞİM BİLGİLERİ */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">İşletme Telefonu</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    type="tel"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                    value={settingsForm.phone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    placeholder="05XX XXX XX XX"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <AlertTriangle size={12} /> Acil Durum Hattı (7/24)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-rose-400" size={16} />
                  <input 
                    type="tel"
                    className="w-full pl-10 pr-3 py-2.5 border border-rose-200 bg-rose-50 rounded-lg text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-slate-800 placeholder:text-rose-300"
                    value={settingsForm.emergencyPhone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, emergencyPhone: e.target.value })}
                    placeholder="05XX XXX XX XX"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1">QR kod sayfasındaki "Acil Destek" butonunda bu numara aranır.</p>
              </div>
          </div>
        </div>

        {/* Adres Yönetimi (YENİLENMİŞ) */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Konum ve Adres</label>
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
             
             <div className="grid grid-cols-2 gap-4">
                {/* İL SEÇİMİ */}
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

                {/* İLÇE SEÇİMİ */}
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

             {/* DETAY ADRES */}
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
              value={settingsForm.taxInfo}
              onChange={(e) => setSettingsForm({ ...settingsForm, taxInfo: e.target.value })}
              placeholder="Vergi Dairesi ve Numarası"
            />
          </div>
        </div>

        {!isFormValid && (
           <div className="bg-amber-50 text-amber-600 px-4 py-3 rounded-lg text-xs font-medium border border-amber-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              Kaydetmek için lütfen tüm alanları eksiksiz doldurunuz.
           </div>
        )}

      </div>
    </div>
  );
}