'use client';

import React from 'react';
import { UserPlus, Activity, MapPin, CheckCircle, Plus, ChevronRight, KeyRound, X, MessageCircle } from 'lucide-react';
import { useParams } from 'next/navigation';

// --- TİP TANIMLAMALARI (INTERFACES) ---

interface Job {
  id: string | number;
  staff_id: string | number;
  status: string;
  customer_name?: string;
  title?: string;
  created_at?: string;
  work_type?: string;
  scheduled_date?: string;
  [key: string]: any; 
}

interface Staff {
  id: string | number;
  name: string;
  role: string;
  branch?: string;
  phone?: string;
  username?: string;
  is_active?: number;
  [key: string]: any;
}

interface DashboardData {
  jobs?: Job[];
  staff?: Staff[];
  [key: string]: any;
}

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
  
  const { slug } = useParams(); 

  const getAutoStatus = (staffId: string | number): StatusResult => {
    if (!data || !data.jobs) {
       return { 
        text: 'Müsait', 
        details: [{ text: 'Veri yükleniyor...', jobData: null }], 
        color: 'bg-emerald-500', 
        bg: 'bg-emerald-50', 
        textCol: 'text-emerald-700', 
        icon: <CheckCircle size={14} /> 
      };
    }

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
        icon: <Activity size={14} /> 
      };
    }
    
    const pendingJobs = data.jobs.filter((j: Job) => j.staff_id === staffId && (j.status === 'Beklemede' || j.status === 'Gelecek'));
    
    if (pendingJobs.length > 0) {
      const detailsArray: DetailItem[] = pendingJobs.map((j: Job) => ({
        text: `${j.customer_name || j.title || 'İsimsiz Görev'}`,
        jobData: j
      }));

      return { 
        text: 'İş Atandı', 
        details: detailsArray, 
        color: 'bg-amber-500', 
        bg: 'bg-amber-50', 
        textCol: 'text-amber-700', 
        icon: <MapPin size={14} /> 
      };
    }

    return { 
      text: 'Müsait', 
      details: [{ text: 'Şu an atanmış bir görevi yok.', jobData: null }], 
      color: 'bg-emerald-500', 
      bg: 'bg-emerald-50', 
      textCol: 'text-emerald-700', 
      icon: <CheckCircle size={14} /> 
    };
  };

  const handleSendWhatsApp = (staff: Staff) => {
    if (!staff.phone) {
      alert("Bu personelin kayıtlı bir telefon numarası bulunmuyor.");
      return;
    }

    const tempPassword = window.prompt(
      `${staff.name} adlı personelin şifresini biliyorsanız (veya yeni belirlediyseniz) buraya yazın, WhatsApp mesajına otomatik eklensin.\n\n* Sistem güvenlik gereği şifreleri çözemez, sadece siz bilebilirsiniz.\n* Boş bırakıp 'Tamam' diyebilirsiniz.`,
      ""
    );

    if (tempPassword === null) return;
    
    let formattedPhone = staff.phone.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '90' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('90')) {
      formattedPhone = '90' + formattedPhone;
    }

    const loginUrl = `${window.location.origin}/${slug}/login`;
    const passwordText = tempPassword.trim() !== '' ? tempPassword.trim() : '(Daha önce belirlediğiniz şifre)';
    
    const message = `Merhaba ${staff.name.split(' ')[0]},\n\nİşlem sistemimize ait giriş bilgilerin aşağıdadır:\n\n🌐 Giriş Linki: ${loginUrl}\n👤 Kullanıcı Adı: ${staff.username || 'Belirtilmedi'}\n🔑 Şifre: *${passwordText}*\n\nLinke tıkladıktan sonra 'Uygulamayı Yükle' butonuna basarak sistemi telefonuna kurabilirsin.`;
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-full sm:w-auto">
           <h3 className="text-lg font-black text-slate-800 tracking-tight">Saha Operasyon Ekibi</h3>
           <p className="text-xs text-slate-500 font-medium mt-0.5">Personel durumları iş emirlerine göre otomatik güncellenir.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button 
            onClick={() => setShowJobModal(true)} 
            className="w-full sm:w-auto justify-center bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm sm:text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={16} strokeWidth={3} /> İş Ata
          </button>
          <button 
            onClick={() => setShowStaffModal(true)} 
            className="w-full sm:w-auto justify-center bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm sm:text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-slate-800 transition-all active:scale-95"
          >
            <UserPlus size={16} /> Yeni Personel
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.staff?.map((s: Staff) => {
          const status = s.is_active === 0 
            ? { text: 'Hesap Pasif', details: [{ text: 'Sisteme girişi engellendi.', jobData: null }], color: 'bg-rose-500', bg: 'bg-rose-50', textCol: 'text-rose-700', icon: <X size={14} /> } 
            : getAutoStatus(s.id);
          
          return (
            <div key={s.id} className={`bg-white p-5 rounded-2xl border ${s.is_active === 0 ? 'border-rose-200 opacity-80' : 'border-slate-200'} shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 relative flex flex-col items-center text-center overflow-hidden group`}>
              
              <div className={`absolute top-0 left-0 w-full h-1.5 ${status.color}`}></div>
              
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-3 font-black text-xl mt-2 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform">
                {s.name.charAt(0)}
              </div>
              <div className="font-black text-slate-800 text-base leading-tight mb-0.5">{s.name}</div>
              
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-1">{s.role}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1 mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{s.branch ? s.branch : 'Genel Görev'}</div>
              
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md mb-4 mt-2 border border-slate-200">
                <KeyRound size={10} /> {s.username || 'Kullanıcı adı yok'}
              </div>
              
              <div className={`w-full flex flex-col items-center justify-center py-2.5 px-3 rounded-xl mb-5 ${status.bg} ${status.textCol} border border-white/50 shadow-sm`}>
                <div className="flex items-center justify-center gap-1.5 font-black text-xs mb-1.5 uppercase tracking-wide w-full border-b border-black/5 pb-1.5">
                  {status.icon} {status.text}
                </div>
                
                <div className="w-full flex flex-col gap-1 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                  {status.details && status.details.map((detailItem: DetailItem, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={(e) => {
                        if (detailItem.jobData && typeof setSelectedJob === 'function') {
                          e.stopPropagation();
                          setSelectedJob(detailItem.jobData);
                        }
                      }}
                      className={`text-[10px] font-bold truncate w-full shrink-0 text-left px-2 py-1.5 rounded transition-all flex items-center gap-1.5
                        ${detailItem.jobData ? 'cursor-pointer hover:bg-black/5 active:scale-95 group/item' : 'opacity-80 cursor-default'}`}
                      title={detailItem.text}
                    >
                      {detailItem.jobData ? (
                        <>
                          <ChevronRight size={10} className="shrink-0 opacity-50 group-hover/item:opacity-100 transition-opacity group-hover/item:translate-x-0.5" />
                          <span className="truncate group-hover/item:text-slate-900">{detailItem.text}</span>
                        </>
                      ) : (
                        <span className="truncate mx-auto opacity-70 italic font-medium">{detailItem.text}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 w-full pt-4 border-t border-slate-100 mt-auto">
                 <button 
                   onClick={() => handleSendWhatsApp(s)} 
                   title="Giriş Linkini WhatsApp'tan Gönder"
                   className="flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600 py-2.5 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 transition-all active:scale-95 shadow-sm"
                 >
                   <MessageCircle size={16} />
                 </button>
                 <button 
                   onClick={() => { 
                     setShowStaffDetail(s); 
                     setEditStaffForm({ ...s, password: '', is_active: s.is_active ?? 1 }); 
                     setIsEditingStaff(false); 
                   }} 
                   className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl text-[11px] font-bold hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
                 >
                   Dosya
                 </button>
                 <button 
                   onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} 
                   className="flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 py-2.5 rounded-xl text-[11px] font-bold hover:bg-blue-100 hover:text-blue-800 transition-all active:scale-95 shadow-sm"
                 >
                   Sohbet
                 </button>
              </div>
            </div>
          )
        })}
        
        {(!data?.staff || data?.staff.length === 0) && (
          <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex flex-col items-center justify-center gap-3">
             <UserPlus size={40} className="text-slate-300" />
             <span className="text-slate-500 font-medium text-sm">Henüz personel eklenmemiş.</span>
          </div>
        )}
      </div>
    </div>
  );
}