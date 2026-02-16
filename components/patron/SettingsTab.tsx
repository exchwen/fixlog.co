'use client';

import React from 'react';
import { Save, Loader2, Building2, User, Phone, MapPin, FileText, Briefcase } from 'lucide-react';

export default function SettingsTab({ settingsForm, setSettingsForm, handleAction, isSaving }: any) {
  
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

        {/* Sektör (KİLİTLİ) & Telefon (YENİ) */}
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
        </div>

        {/* Adres */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Açık Adres</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
            <textarea 
              rows={3}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 resize-none"
              value={settingsForm.address}
              onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
              placeholder="Mahalle, Sokak, No, İlçe/İl..."
            />
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