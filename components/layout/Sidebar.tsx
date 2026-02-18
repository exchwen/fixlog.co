'use client';

import React from 'react';
import { LayoutDashboard, Users, ClipboardList, Settings, Box, Package, CreditCard, UserPlus, LogOut, ShieldCheck, CheckSquare, Bell } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }: any) {
  return (
    <aside className="hidden lg:flex w-56 bg-slate-900 text-slate-400 flex-col sticky top-0 h-screen z-50 border-r border-slate-800">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800 bg-slate-900/50">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg"><ShieldCheck size={18} /></div>
        <span className="font-bold text-sm text-white tracking-tight uppercase">İŞ DÖKÜMÜ</span>
      </div>
      <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
        {[
          { id: 'home', label: 'Genel Bakış', icon: LayoutDashboard },
          { id: 'jobs', label: 'İş Emirleri', icon: ClipboardList },
          { id: 'pending', label: 'Onay Bekleyenler', icon: CheckSquare },
          { id: 'alerts', label: 'Kayıt Geçmişi', icon: Bell }, // YENİ EKLENEN SEKME
          { id: 'team', label: 'Saha Ekibi', icon: Users },
          { id: 'customers', label: 'Müşteriler', icon: UserPlus },
          { id: 'assets', label: 'Varlıklar', icon: Box },
          { id: 'stock', label: 'Stok Takibi', icon: Package },
          { id: 'finance', label: 'Finans', icon: CreditCard },
          { id: 'settings', label: 'Firma Ayarları', icon: Settings },
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all relative ${activeTab === item.id ? 'bg-blue-600/10 text-blue-500' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <item.icon size={16} /> 
            <span className="text-[13px]">{item.label}</span>
            {/* Onay Bekleyenler sekmesine ufak bir dikkat çekici nokta koyduk */}
            {item.id === 'pending' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-rose-400 font-medium hover:bg-rose-500/10 rounded-lg transition-all text-xs">
          <LogOut size={14} /> Çıkış Yap
        </button>
      </div>
    </aside>
  );
}