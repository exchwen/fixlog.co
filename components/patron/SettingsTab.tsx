'use client';

import React from 'react';
import { Settings as SettingsIcon, CheckCircle2, Loader2 } from 'lucide-react';

export default function SettingsTab({ settingsForm, setSettingsForm, handleAction, isSaving }: any) {
  return (
    <div className="max-w-2xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600"><SettingsIcon size={20} /></div>
        <div><h3 className="text-lg font-bold text-slate-900 leading-tight">Şirket Profil Ayarları</h3><p className="text-xs text-slate-500">D1 veritabanındaki şirket kimliğinizi güncelleyin.</p></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><label className="text-[11px] font-semibold text-slate-600">İşletme / Şirket Adı</label><input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={settingsForm.companyName} onChange={e => setSettingsForm({...settingsForm, companyName: e.target.value})} /></div>
        <div className="space-y-1.5"><label className="text-[11px] font-semibold text-slate-600">Sistem Yetkilisi</label><input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={settingsForm.ownerName} onChange={e => setSettingsForm({...settingsForm, ownerName: e.target.value})} /></div>
        <div className="space-y-1.5"><label className="text-[11px] font-semibold text-slate-600">Faaliyet Sektörü</label><input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={settingsForm.sector} onChange={e => setSettingsForm({...settingsForm, sector: e.target.value})} /></div>
        <div className="space-y-1.5"><label className="text-[11px] font-semibold text-slate-600">Vergi No / T.C. Kimlik</label><input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={settingsForm.taxInfo} onChange={e => setSettingsForm({...settingsForm, taxInfo: e.target.value})} /></div>
        <div className="col-span-2 space-y-1.5"><label className="text-[11px] font-semibold text-slate-600">Resmi Firma Adresi</label><textarea rows="3" className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" value={settingsForm.address} onChange={e => setSettingsForm({...settingsForm, address: e.target.value})} /></div>
      </div>
      
      <div className="pt-2">
        <button disabled={isSaving} onClick={() => handleAction('update-settings', settingsForm, null, null)} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Ayarları D1'e Kaydet
        </button>
      </div>
    </div>
  );
}