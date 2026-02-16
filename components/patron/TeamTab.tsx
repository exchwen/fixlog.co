'use client';

import React from 'react';
import { UserPlus, Activity, MapPin, CheckCircle } from 'lucide-react';

export default function TeamTab({ data, setShowStaffModal, setShowStaffDetail, setEditStaffForm, setIsEditingStaff, setActiveChatId, setIsChatOpen }: any) {
  
  // Personelin anlık durumunu görev geçmişinden otomatik çeken zeka
  const getAutoStatus = (staffId: string) => {
    const activeJob = data?.jobs?.find((j: any) => j.staff_id === staffId && (j.status === 'Devam Ediyor' || j.status === 'Sahada'));
    if (activeJob) return { text: 'Şu an Sahada', detail: activeJob.customer_name, color: 'bg-blue-500', bg: 'bg-blue-50', textCol: 'text-blue-700', icon: <Activity size={12} /> };
    
    const pendingJob = data?.jobs?.find((j: any) => j.staff_id === staffId && (j.status === 'Beklemede' || j.status === 'Gelecek'));
    if (pendingJob) return { text: 'Görev Bekliyor', detail: `Sıradaki: ${pendingJob.customer_name}`, color: 'bg-amber-500', bg: 'bg-amber-50', textCol: 'text-amber-700', icon: <MapPin size={12} /> };

    return { text: 'Müsait', detail: 'Şu an boşta', color: 'bg-emerald-500', bg: 'bg-emerald-50', textCol: 'text-emerald-700', icon: <CheckCircle size={12} /> };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-lg font-bold text-slate-900">Saha Operasyon Ekibi</h3>
           <p className="text-slate-500 text-xs">Personel durumları iş emirlerine göre otomatik güncellenir.</p>
        </div>
        <button onClick={() => setShowStaffModal(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-slate-800">
          <UserPlus size={14} /> Personel Ekle
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.staff?.map((s: any) => {
          const status = getAutoStatus(s.id);
          
          return (
            <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative flex flex-col items-center text-center overflow-hidden">
              {/* Dinamik Durum Çizgisi */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${status.color}`}></div>
              
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-3 font-bold text-lg mt-2">{s.name.charAt(0)}</div>
              <div className="font-semibold text-slate-800 text-sm mb-0.5">{s.name}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">{s.branch || s.role}</div>
              
              {/* Otomatik Durum Rozeti */}
              <div className={`w-full flex flex-col items-center justify-center py-2 px-2 rounded-lg mb-4 ${status.bg} ${status.textCol} border border-white/20`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-0.5">{status.icon} {status.text}</div>
                <div className="text-[9px] opacity-80 font-medium truncate w-full px-2">{status.detail}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full pt-3 border-t border-slate-100">
                 <button onClick={() => { setShowStaffDetail(s); setEditStaffForm(s); setIsEditingStaff(false); }} className="flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 py-1.5 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors">Dosya</button>
                 <button onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} className="flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-1.5 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors">Mesaj</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}