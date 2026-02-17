'use client';

import React from 'react';
import { UserPlus, Activity, MapPin, CheckCircle } from 'lucide-react';

export default function TeamTab({ data, setShowStaffModal, setShowStaffDetail, setEditStaffForm, setIsEditingStaff, setActiveChatId, setIsChatOpen }: any) {
  
  // Personelin anlık durumunu görev geçmişinden otomatik çeken zeka (Tüm işleri listeler)
  const getAutoStatus = (staffId: string) => {
    // 1. Önce aktif işlerin tümünü bulalım (Sahada veya Devam Ediyor olanlar)
    const activeJobs = data?.jobs?.filter((j: any) => j.staff_id === staffId && (j.status === 'Devam Ediyor' || j.status === 'Sahada')) || [];
    
    if (activeJobs.length > 0) {
      // Eğer müşteri adı boşsa 'İsimsiz Görev' yazdırarak boş satır çıkmasını engelliyoruz
      const detailsArray = activeJobs.map((j: any) => j.customer_name || j.title || 'İsimsiz Görev');
      return { text: 'Şu an Sahada', details: detailsArray, color: 'bg-blue-500', bg: 'bg-blue-50', textCol: 'text-blue-700', icon: <Activity size={12} /> };
    }
    
    // 2. Eğer aktif iş yoksa, bekleyen işlerin tümünü bulalım (Beklemede veya Gelecek olanlar)
    const pendingJobs = data?.jobs?.filter((j: any) => j.staff_id === staffId && (j.status === 'Beklemede' || j.status === 'Gelecek')) || [];
    
    if (pendingJobs.length > 0) {
      // Eğer müşteri adı boşsa 'İsimsiz Görev' yazdırarak boş satır çıkmasını engelliyoruz
      const detailsArray = pendingJobs.map((j: any) => `İş Bilgisi: ${j.customer_name || j.title || 'İsimsiz Görev'}`);
      return { text: 'İş Atandı', details: detailsArray, color: 'bg-amber-500', bg: 'bg-amber-50', textCol: 'text-amber-700', icon: <MapPin size={12} /> };
    }

    // 3. Hiçbir işi yoksa müsait döndürelim
    return { text: 'Müsait', details: ['Şu an boşta'], color: 'bg-emerald-500', bg: 'bg-emerald-50', textCol: 'text-emerald-700', icon: <CheckCircle size={12} /> };
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
              
              {/* ROL VE BRANŞ AYRIMI BURADA YAPILDI */}
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mt-1">{s.role}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-3 mt-0.5">{s.branch ? s.branch : 'Genel Görev'}</div>
              
              {/* Otomatik Durum Rozeti */}
              <div className={`w-full flex flex-col items-center justify-center py-2 px-2 rounded-lg mb-4 ${status.bg} ${status.textCol} border border-white/20`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-1">{status.icon} {status.text}</div>
                
                {/* Tüm işleri alt alta listeleyen alan (Yükseklik artırıldı, taşma sorunu çözüldü) */}
                <div className="w-full flex flex-col gap-0.5 max-h-20 overflow-y-auto pr-1">
                  {status.details.map((detailText: string, idx: number) => (
                    <div key={idx} className="text-[9px] opacity-80 font-medium truncate w-full shrink-0 text-left pl-1" title={detailText}>
                      {detailText}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alt Butonlar: İş Ata, Dosya, Mesaj - Üçlü Grid Yapısı */}
              <div className="grid grid-cols-3 gap-1.5 w-full pt-3 border-t border-slate-100">
                 <button onClick={() => { console.log('İş ata tıklandı', s.id); }} className="flex items-center justify-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 py-1.5 rounded-md text-[11px] font-medium hover:bg-emerald-100 transition-colors">İş Ata</button>
                 <button onClick={() => { setShowStaffDetail(s); setEditStaffForm(s); setIsEditingStaff(false); }} className="flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 py-1.5 rounded-md text-[11px] font-medium hover:bg-slate-50 transition-colors">Dosya</button>
                 <button onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} className="flex items-center justify-center gap-1 bg-blue-50 text-blue-600 border border-blue-50 py-1.5 rounded-md text-[11px] font-medium hover:bg-blue-100 transition-colors">Mesaj</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}