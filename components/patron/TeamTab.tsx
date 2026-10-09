'use client';

import React, { useState } from 'react';
import { UserPlus, Activity, MapPin, CheckCircle, Plus, ChevronRight, KeyRound, X, MessageCircle, Send, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { staffFormStateFromServer } from '@/lib/staffPayload';

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

// 🟢 DÜZELTME: patron.jsx dosyasının gönderdiği proplarla birebir eşleştirildi.
interface TeamTabProps {
  data: DashboardData | null;
  setShowAddStaff: (show: boolean) => void;
  setSelectedStaff: (staff: Staff | null) => void;
  setEditStaffForm: (staff: any) => void;
  setIsEditingStaff: (isEditing: boolean) => void;
  setActiveChatId: (id: any) => void;
  setIsChatOpen: (isOpen: boolean) => void;
  setShowJobModal: (show: boolean) => void;
  setSelectedJob: (job: Job | null) => void;
  setJobModalType?: (type: string) => void;
  handleAction?: any;
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
  setShowAddStaff, 
  setSelectedStaff, 
  setEditStaffForm, 
  setIsEditingStaff, 
  setActiveChatId, 
  setIsChatOpen, 
  setShowJobModal, 
  setSelectedJob,
  setJobModalType,
  handleAction
}: TeamTabProps) {
  
  const { slug } = useParams(); 

// YENİ: WhatsApp Şifre Gönderim Modalı İçin State'ler
const [waModalStaff, setWaModalStaff] = useState<Staff | null>(null);
const [waPassword, setWaPassword] = useState('');

// 🚀 Dinamik Uyarı Modalı State'i
const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });

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
        text: j.customer_name || j.title || j.work_type || 'Genel Görev',
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
        text: j.customer_name || j.title || j.work_type || 'Genel Görev',
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

// WhatsApp Butonuna Tıklayınca Modalı Aç
const openWhatsAppModal = (staff: Staff) => {
  if (!staff.phone) {
    setAlertModal({ isOpen: true, message: "Bu personelin kayıtlı bir telefon numarası bulunmuyor.", type: 'warning' });
    return;
  }
  setWaModalStaff(staff);
  setWaPassword(''); 
};

  // Modaldan Gönder Butonuna Basılınca WhatsApp'ı Aç
  const executeWhatsAppSend = () => {
    if (!waModalStaff || !waModalStaff.phone) return;

    let formattedPhone = waModalStaff.phone.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '90' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('90')) {
      formattedPhone = '90' + formattedPhone;
    }

    const loginUrl = `${window.location.origin}/${slug}/login`;
    const passwordText = waPassword.trim() !== '' ? waPassword.trim() : '(Daha önce belirlediğiniz şifre)';
    
    const message = `Merhaba ${waModalStaff.name.split(' ')[0]},\n\nİşlem sistemimize ait giriş bilgilerin aşağıdadır:\n\n🌐 Giriş Linki: ${loginUrl}\n👤 Kullanıcı Adı: ${waModalStaff.username || 'Belirtilmedi'}\n🔑 Şifre: *${passwordText}*\n\nLinke tıkladıktan sonra 'Uygulamayı Yükle' butonuna basarak sistemi telefonuna kurabilirsin.`;
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setWaModalStaff(null); 
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* WHATSAPP ŞİFRE GÖNDERİM MODALI */}
      <AnimatePresence>
        {waModalStaff && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-emerald-50">
                <div className="flex items-center gap-2 text-emerald-800">
                  <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-sm">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm leading-tight">Giriş Bilgilerini İlet</h3>
                    <p className="text-[10px] font-bold opacity-80">{waModalStaff.name}</p>
                  </div>
                </div>
                <button onClick={() => setWaModalStaff(null)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Sistem güvenlik gereği şifreleri saklamaz/çözemez. Personelinizin şifresini biliyorsanız (veya yeni belirlediyseniz) aşağıya yazabilirsiniz. <strong>Boş bırakırsanız</strong> &quot;(Daha önce belirlediğiniz şifre)&quot; olarak iletilecektir.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Gönderilecek Şifre (Opsiyonel)</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input 
                      type="text" 
                      value={waPassword} 
                      onChange={(e) => setWaPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                      placeholder="Personelin şifresini girin..."
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setWaModalStaff(null)} 
                  className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                >
                  İptal
                </button>
                <button 
                  onClick={executeWhatsAppSend} 
                  className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                >
                  <Send size={16} /> WhatsApp&apos;a Git
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
          {/* 🟢 DÜZELTME: Doğru fonksiyona bağlandı */}
          <button 
            onClick={() => setShowAddStaff(true)} 
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

              {/* 🚀 DÜZENLENEN KART ALT BUTONLARI */}
              <div className="flex flex-col gap-2 w-full pt-4 border-t border-slate-100 mt-auto">
                 <div className="grid grid-cols-2 gap-2 w-full">
                   {/* 🟢 DÜZELTME: Doğru fonksiyona bağlandı */}
                   <button 
                     onClick={() => { 
                       setSelectedStaff(s); 
                       setEditStaffForm(staffFormStateFromServer(s)); 
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
                 
                 <button 
                   onClick={() => openWhatsAppModal(s)} 
                   title="Giriş Linkini ve Şifreyi WhatsApp'tan Gönder"
                   className="flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#075E54] py-2.5 rounded-xl text-[11px] font-black hover:bg-[#25D366]/20 transition-all active:scale-95 shadow-sm w-full"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                   </svg>
                   Paneli Gönder
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

      {/* 🚀 DİNAMİK GENEL UYARI MODALI */}
      <AnimatePresence>
        {alertModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 10 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 10 }} 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center border border-slate-200"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${
                alertModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                alertModal.type === 'error' ? 'bg-rose-50 text-rose-500' : 
                alertModal.type === 'warning' ? 'bg-amber-50 text-amber-500' : 
                'bg-blue-50 text-blue-500'
              }`}>
                {alertModal.type === 'success' && <CheckCircle size={32} />}
                {alertModal.type === 'error' && <AlertCircle size={32} />}
                {alertModal.type === 'warning' && <AlertTriangle size={32} />}
                {alertModal.type === 'info' && <Info size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                {alertModal.type === 'success' ? 'Başarılı!' : 
                 alertModal.type === 'error' ? 'Hata!' : 
                 alertModal.type === 'warning' ? 'Uyarı!' : 
                 'Bilgi'}
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                {alertModal.message}
              </p>
              <button 
                onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-md flex justify-center items-center"
              >
                Tamam
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}