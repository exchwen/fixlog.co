'use client';

import React from 'react';
import { Plus, Calendar, User, ArrowRight, Clock, MapPin, ClipboardList, ShieldCheck, Wrench } from 'lucide-react';

export default function JobsTab({ data, setShowJobModal, statusColors, setSelectedJob }: any) {
  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* BAŞLIK VE KONTROLLER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-full sm:w-auto">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Tüm İş Emirleri</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">Sistemdeki tüm kayıtlı işleri ve durumlarını yönetin.</p>
        </div>
        
        <button 
          onClick={() => setShowJobModal(true)} 
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={3} /> Yeni Görev Ata
        </button>
      </div>

      {/* MASAÜSTÜ GÖRÜNÜM: TABLO (Mobilde Gizlenir, Yatay Scroll Engellenir) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
         <table className="w-full text-left text-xs min-w-[750px] border-collapse">
           <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
             <tr>
               <th className="px-5 py-4 whitespace-nowrap">Lokasyon / Müşteri</th>
               <th className="px-5 py-4 whitespace-nowrap">Görev Tipi</th>
               <th className="px-5 py-4 whitespace-nowrap">Tarih / Saat</th>
               <th className="px-5 py-4 whitespace-nowrap w-[30%]">Hiyerarşi & Sorumlular</th>
               <th className="px-5 py-4 text-right whitespace-nowrap">Durum</th>
               <th className="px-5 py-4 w-10"></th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {data?.jobs?.length > 0 ? data.jobs.map((j: any) => {
               // Hiyerarşi Mantığı
               const creator = j.details?.createdBy || 'Sistem';
               const manager = data?.staff?.find((s: any) => s.id === j.staff_id)?.name || null;
               const worker = data?.staff?.find((s: any) => String(s.id) === String(j.details?.worker_id))?.name || null;
               
               // Eğer Atayan ve Yönetici aynı isimse, tek satırda gösterelim
               const isCreatorManager = creator === manager;

               return (
               <tr 
                 key={j.id} 
                 onClick={() => setSelectedJob(j)}
                 className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
               >
                 <td className="px-5 py-4 align-top">
                    <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors truncate max-w-[200px] lg:max-w-[250px]">{j.customer_name}</div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1.5 truncate max-w-[200px] lg:max-w-[250px]">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{data?.assets?.find((a:any) => a.id === j.asset_id)?.location || 'Konum Belirtilmedi'}</span>
                    </div>
                 </td>
                 <td className="px-5 py-4 align-top font-bold text-slate-600 whitespace-nowrap">
                   <div className="flex items-center gap-1.5">
                     <ClipboardList size={14} className="text-slate-400" /> {j.work_type}
                   </div>
                 </td>
                 <td className="px-5 py-4 align-top">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold whitespace-nowrap">
                       <Calendar size={14} className="text-blue-500"/> 
                       {j.scheduled_date || 'Anlık Kayıt'}
                    </div>
                    {j.created_at && (
                       <div className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1.5 whitespace-nowrap" title="Oluşturulma Zamanı">
                          <Clock size={12} className="text-slate-400" />
                          {new Date(j.created_at).toLocaleDateString('tr-TR', { 
                             day: '2-digit', month: '2-digit', year: 'numeric', 
                             hour: '2-digit', minute: '2-digit' 
                          })}
                       </div>
                    )}
                 </td>
                 
                 {/* HİYERARŞİ SÜTUNU */}
                 <td className="px-5 py-4 align-top">
                    <div className="flex flex-col gap-1.5">
                        {/* 1. Atayan / Yönetici */}
                        {isCreatorManager ? (
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-blue-600" />
                                <span className="text-[10px] font-black text-slate-400 uppercase w-[60px] tracking-wider">Yönetici:</span>
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{manager}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase w-[60px] tracking-wider">Atayan:</span>
                                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{creator}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <User size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase w-[60px] tracking-wider">Sorumlu:</span>
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{manager || 'Atanmadı'}</span>
                                </div>
                            </>
                        )}

                        {/* 2. Usta */}
                        <div className="flex items-center gap-1.5">
                            <Wrench size={14} className={worker ? "text-amber-500" : "text-slate-300"} />
                            <span className="text-[10px] font-black text-slate-400 uppercase w-[60px] tracking-wider">Usta:</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${worker ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
                                {worker || 'Atanmadı'}
                            </span>
                        </div>
                    </div>
                 </td>

                 <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                    <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                 </td>
                 <td className="px-5 py-4 align-middle text-slate-300 group-hover:text-blue-500 text-right">
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                 </td>
               </tr>
             )}) : (
               <tr>
                 <td colSpan={6} className="p-20 text-center bg-slate-50">
                    <div className="flex flex-col items-center justify-center gap-3">
                       <Calendar size={48} className="text-slate-200" />
                       <span className="text-slate-500 font-medium text-sm">Henüz iş kaydı bulunamadı.</span>
                    </div>
                 </td>
               </tr>
             )}
           </tbody>
         </table>
      </div>

      {/* MOBİL GÖRÜNÜM: DİKEY İŞ KARTLARI (Yatay Scroll'u Engeller) */}
      <div className="md:hidden flex flex-col gap-3">
        {data?.jobs?.length > 0 ? data.jobs.map((j: any) => {
          // Hiyerarşi Mantığı (Mobil İçin Tekrar)
          const creator = j.details?.createdBy || 'Sistem';
          const manager = data?.staff?.find((s: any) => s.id === j.staff_id)?.name || null;
          const worker = data?.staff?.find((s: any) => String(s.id) === String(j.details?.worker_id))?.name || null;
          const isCreatorManager = creator === manager;

          return (
          <div 
            key={j.id} 
            onClick={() => setSelectedJob(j)}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 active:scale-95 transition-all cursor-pointer group"
          >
            {/* Müşteri Adı ve Durum */}
            <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
               <div className="min-w-0">
                 <div className="font-black text-slate-800 text-sm truncate">{j.customer_name}</div>
                 <div className="text-[10px] text-slate-500 font-semibold mt-1 flex items-start gap-1.5 line-clamp-2">
                   <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                   <span>{data?.assets?.find((a:any) => a.id === j.asset_id)?.location || 'Konum Belirtilmedi'}</span>
                 </div>
               </div>
               <span className={`px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0 shadow-sm ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                 {j.status}
               </span>
            </div>

            {/* Görev Tipi ve Hiyerarşi (Mobil) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2">
               <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GÖREV TİPİ</div>
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <ClipboardList size={12} className="text-slate-400" /> {j.work_type}
                  </div>
               </div>
               
               <div className="h-px bg-slate-200 w-full my-0.5"></div>

               {/* Mobil Hiyerarşi */}
               <div className="flex flex-col gap-1.5">
                  {isCreatorManager ? (
                      <div className="flex items-center justify-between">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={12}/> YÖNETİCİ</div>
                          <div className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">{manager}</div>
                      </div>
                  ) : (
                      <>
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={12}/> ATAYAN</div>
                            <div className="text-[11px] font-bold text-slate-600">{creator}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><User size={12}/> SORUMLU</div>
                            <div className="text-[11px] font-bold text-blue-600">{manager || 'Atanmadı'}</div>
                        </div>
                      </>
                  )}
                  
                  <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Wrench size={12}/> SAHA USTASI</div>
                      <div className={`text-[11px] font-bold px-2 py-0.5 rounded border ${worker ? 'text-amber-700 bg-amber-100 border-amber-200' : 'text-slate-400 bg-white border-slate-200'}`}>
                          {worker || 'Atanmadı'}
                      </div>
                  </div>
               </div>
            </div>

            {/* Tarih ve Oku */}
            <div className="flex justify-between items-center pt-1">
              <div className="flex flex-col gap-0.5">
                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 w-fit">
                   <Calendar size={14} className="text-blue-500" /> {j.scheduled_date || 'Tarih Planlanmadı'}
                </div>
                {j.created_at && (
                  <div className="text-[9px] text-slate-400 font-semibold flex items-center gap-1 ml-0.5">
                    <Clock size={10} /> Olş: {new Date(j.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                 <ArrowRight size={14} className="text-blue-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        )}) : (
          <div className="p-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
             <Calendar size={40} className="text-slate-300" />
             <span className="text-slate-500 font-medium text-sm">Henüz iş kaydı bulunamadı.</span>
          </div>
        )}
      </div>

    </div>
  );
}