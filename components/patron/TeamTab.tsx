'use client';

import React from 'react';
import { UserPlus } from 'lucide-react';

export default function TeamTab({ data, setShowStaffModal, setShowStaffDetail, setEditStaffForm, setIsEditingStaff, setActiveChatId, setIsChatOpen }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h3 className="text-lg font-bold text-slate-900">Saha Operasyon Ekibi</h3><p className="text-slate-500 text-xs">Personel durumlarını yönetin.</p></div>
        <button onClick={() => setShowStaffModal(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-slate-800">
          <UserPlus size={14} /> Personel Ekle
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.staff?.map((s: any) => (
          <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative flex flex-col items-center text-center">
            <div className="absolute top-3 right-3"><div className={`w-2 h-2 rounded-full ${s.status === 'Aktif' ? 'bg-emerald-500' : s.status === 'Sahada' ? 'bg-blue-500' : 'bg-slate-300'}`}></div></div>
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-3 font-bold text-lg">{s.name.charAt(0)}</div>
            <div className="font-semibold text-slate-800 text-sm mb-0.5">{s.name}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-4 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{s.branch || s.role}</div>
            <div className="grid grid-cols-2 gap-2 w-full pt-3 border-t border-slate-100">
               <button onClick={() => { setShowStaffDetail(s); setEditStaffForm(s); setIsEditingStaff(false); }} className="flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 py-1.5 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors">Dosya</button>
               <button onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} className="flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-1.5 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors">Mesaj</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}