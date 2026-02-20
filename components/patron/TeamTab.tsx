'use client';

import React from 'react';
import { UserPlus, Activity, MapPin, CheckCircle, Plus } from 'lucide-react';

// --- TİP TANIMLAMALARI (INTERFACES) ---

// İş (Job) nesnesi için tip tanımı
interface Job {
  id: string | number;
  staff_id: string | number;
  status: string;
  customer_name?: string;
  title?: string;
  created_at?: string;
  work_type?: string;
  scheduled_date?: string;
  [key: string]: any; // Diğer olası dinamik alanlar için
}

// Personel (Staff) nesnesi için tip tanımı
interface Staff {
  id: string | number;
  name: string;
  role: string;
  branch?: string;
  phone?: string;
  [key: string]: any;
}

// Data nesnesi (Dashboard verisi) için tip tanımı
interface DashboardData {
  jobs?: Job[];
  staff?: Staff[];
  [key: string]: any;
}

// Bileşenin alacağı Props için tip tanımı
interface TeamTabProps {
  data: DashboardData | null;
  setShowStaffModal: (show: boolean) => void;
  setShowStaffDetail: (staff: Staff | null) => void;
  setEditStaffForm: (staff: any) => void;
  setIsEditingStaff: (isEditing: boolean) => void;
  setActiveChatId: (id: any) => void;
  setIsChatOpen: (isOpen: boolean) => void;
  setShowJobModal: (show: boolean) => void;
  setSelectedJob: (job: Job | null) => void;
}

// Otomatik durum hesaplama fonksiyonunun dönüş tipi
interface DetailItem {
  text: string;
  jobData: Job | null;
}

interface StatusResult {
  text: string;
  details: DetailItem[];
  color: string;
  bg: string;
  textCol: string;
  icon: React.ReactNode;
}
// -------------------------

export default function TeamTab({ 
  data, 
  setShowStaffModal, 
  setShowStaffDetail, 
  setEditStaffForm, 
  setIsEditingStaff, 
  setActiveChatId, 
  setIsChatOpen, 
  setShowJobModal, 
  setSelectedJob 
}: TeamTabProps) {
  
  // Personelin anlık durumunu belirleyen fonksiyon
  const getAutoStatus = (staffId: string | number): StatusResult => {
    // Veri güvenliği kontrolü
    if (!data || !data.jobs) {
       return { 
        text: 'Müsait', 
        details: [{ text: 'Veri yükleniyor...', jobData: null }], 
        color: 'bg-emerald-500', 
        bg: 'bg-emerald-50', 
        textCol: 'text-emerald-700', 
        icon: <CheckCircle size={12} /> 
      };
    }

    // 1. Aktif işler
    const activeJobs = data.jobs.filter((j: Job) => j.staff_id === staffId && (j.status === 'Devam Ediyor' || j.status === 'Sahada'));
    
    if (activeJobs.length > 0) {
      const detailsArray: DetailItem[] = activeJobs.map((j: Job) => ({
        text: j.customer_name || j.title || 'İsimsiz Görev',
        jobData: j
      }));

      return { 
        text: 'Şu an Sahada', 
        details: detailsArray, 
        color: 'bg-blue-500', 
        bg: 'bg-blue-50', 
        textCol: 'text-blue-700', 
        icon: <Activity size={12} /> 
      };
    }
    
    // 2. Bekleyen işler
    const pendingJobs = data.jobs.filter((j: Job) => j.staff_id === staffId && (j.status === 'Beklemede' || j.status === 'Gelecek'));
    
    if (pendingJobs.length > 0) {
      const detailsArray: DetailItem[] = pendingJobs.map((j: Job) => ({
        text: `İş Bilgisi: ${j.customer_name || j.title || 'İsimsiz Görev'}`,
        jobData: j
      }));

      return { 
        text: 'İş Atandı', 
        details: detailsArray, 
        color: 'bg-amber-500', 
        bg: 'bg-amber-50', 
        textCol: 'text-amber-700', 
        icon: <MapPin size={12} /> 
      };
    }

    // 3. Müsait
    return { 
      text: 'Müsait', 
      details: [{ text: 'Şu an boşta', jobData: null }], 
      color: 'bg-emerald-500', 
      bg: 'bg-emerald-50', 
      textCol: 'text-emerald-700', 
      icon: <CheckCircle size={12} /> 
    };
  };

  return (
    <div className="space-y-4">
      {/* YENİ: Mobilde başlık ve butonların sıkışmasını engellemek için flex-col sm:flex-row ve gap-4 eklendi */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h3 className="text-lg font-bold text-slate-900">Saha Operasyon Ekibi</h3>
           <p className="text-slate-500 text-xs">Personel durumları iş emirlerine göre otomatik güncellenir.</p>
        </div>
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          {/* YENİ: active:scale-95 eklendi */}
          <button onClick={() => setShowJobModal(true)} className="flex-1 sm:flex-none justify-center bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition-all active:scale-95">
            <Plus size={14} /> İş Ata
          </button>
          {/* YENİ: active:scale-95 eklendi */}
          <button onClick={() => setShowStaffModal(true)} className="flex-1 sm:flex-none justify-center bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-slate-800 transition-all active:scale-95">
            <UserPlus size={14} /> Personel Ekle
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.staff?.map((s: Staff) => {
          const status = getAutoStatus(s.id);
          
          return (
            <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative flex flex-col items-center text-center overflow-hidden">
              {/* Dinamik Durum Çizgisi */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${status.color}`}></div>
              
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-3 font-bold text-lg mt-2">{s.name.charAt(0)}</div>
              <div className="font-semibold text-slate-800 text-sm mb-0.5">{s.name}</div>
              
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mt-1">{s.role}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-3 mt-0.5">{s.branch ? s.branch : 'Genel Görev'}</div>
              
              {/* Otomatik Durum Rozeti */}
              <div className={`w-full flex flex-col items-center justify-center py-2 px-2 rounded-lg mb-4 ${status.bg} ${status.textCol} border border-white/20`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-1">{status.icon} {status.text}</div>
                
                {/* İŞ LİSTESİ ALANI */}
                <div className="w-full flex flex-col gap-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                  {status.details && status.details.map((detailItem: DetailItem, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={(e) => {
                        // Hata önleyici kontrol
                        if (detailItem.jobData && typeof setSelectedJob === 'function') {
                          e.stopPropagation();
                          setSelectedJob(detailItem.jobData);
                        }
                      }}
                      className={`text-[9px] font-medium truncate w-full shrink-0 text-left pl-2 py-1 rounded transition-colors 
                        ${detailItem.jobData ? 'cursor-pointer hover:bg-white/40 hover:text-slate-900 underline decoration-dotted underline-offset-2' : 'opacity-80 cursor-default'}`}
                      title={detailItem.text}
                    >
                      {detailItem.jobData && <span className="inline-block w-1 h-1 rounded-full bg-current mr-1.5 mb-0.5"></span>}
                      {detailItem.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full pt-3 border-t border-slate-100">
                 {/* YENİ: active:scale-95 eklendi */}
                 <button onClick={() => { setShowStaffDetail(s); setEditStaffForm(s); setIsEditingStaff(false); }} className="flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 py-1.5 rounded-md text-xs font-medium hover:bg-slate-50 transition-all active:scale-95">Dosya</button>
                 {/* YENİ: active:scale-95 eklendi */}
                 <button onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} className="flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-1.5 rounded-md text-xs font-medium hover:bg-blue-100 transition-all active:scale-95">Mesaj</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}