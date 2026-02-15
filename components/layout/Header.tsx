'use client';

import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';

export default function Header({ data, searchTerm, setSearchTerm, setIsMobileMenuOpen }: any) {
  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-1.5 text-slate-600"><Menu size={18} /></button>
        <div className="flex flex-col">
          <h1 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            {data?.name || 'Yükleniyor...'} <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          </h1>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{data?.ownerName || 'Yönetim'}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 items-center gap-2">
          <Search size={14} className="text-slate-400" />
          <input placeholder="Arama..." className="bg-transparent outline-none text-xs w-40 text-slate-600 placeholder:text-slate-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer transition-all relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </div>
      </div>
    </header>
  );
}