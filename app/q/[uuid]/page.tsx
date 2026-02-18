'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Phone, ShieldCheck, Box, MapPin, History, X, ShieldAlert, ChevronRight, User } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function AssetScanPage() {
  const { uuid } = useParams();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // İş Kayıtları Modalı için State
  const [showHistory, setShowHistory] = useState(false);

  // API URL'in (Worker Adresin)
  const API_URL = 'https://backend.isdokumu.workers.dev'; 

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`${API_URL}/public/get-asset?uuid=${uuid}`);
        if (!res.ok) throw new Error('Varlık bulunamadı');
        const data = await res.json();
        setAsset(data);
      } catch (err) {
        setError('Geçersiz QR Kod veya Varlık Bulunamadı.');
      } finally {
        setLoading(false);
      }
    };

    if (uuid) fetchAsset();
  }, [uuid]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm gap-2">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      QR Bilgisi Alınıyor...
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-rose-500 font-bold gap-2 p-6 text-center">
      <AlertTriangle size={48} />
      {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* ANA KART */}
      <div className="bg-white shadow-2xl rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 relative">
        
        {/* Güvenlik Rozeti */}
        <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-100 shadow-sm z-10">
            <ShieldCheck size={12} /> SİSTEME KAYITLI
        </div>

        {/* Üst Bilgi (Header) */}
        <div className="bg-slate-900 pt-10 pb-8 px-8 text-center text-white relative overflow-hidden">
          {/* Arka plan dekoru */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-slate-900"></div>
          
          <div className="relative z-10">
            {asset.logo ? (
               <div className="bg-white/10 p-3 rounded-2xl inline-block mb-4 backdrop-blur-md ring-4 ring-white/5 shadow-lg">
                 <img src={asset.logo} alt="Logo" className="max-h-16 object-contain" />
               </div>
            ) : (
               <div className="w-20 h-20 bg-white/10 ring-4 ring-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg">
                 <Box size={36} className="text-blue-400" />
               </div>
            )}
            <h1 className="text-2xl font-bold mb-1 tracking-tight">{asset.name}</h1>
            <p className="text-blue-200/80 text-xs font-medium uppercase tracking-wider">{asset.company_name}</p>
          </div>
        </div>

        {/* İçerik Alanı */}
        <div className="p-6">
          
          {/* Personel Girişi Butonu */}
          <a href="/login" className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white text-xs font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-colors shadow-sm mb-5">
             <User size={16} /> Personel Girişi
          </a>

          {/* Konum Bilgisi ve Harita */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex flex-col gap-3">
             <div className="flex items-start gap-3">
                <div className="bg-white p-2 rounded-full border border-slate-200 text-slate-400 mt-1">
                    <MapPin size={18} />
                </div>
                <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Cihaz Konumu</div>
                    <div className="text-sm text-slate-700 font-semibold leading-snug">{asset.location}</div>
                </div>
             </div>
             
             {/* Haritada Görüntüle Butonu DÜZELTİLDİ */}
             <a 
               href={`https://maps.google.com/?q=${encodeURIComponent(asset.location)}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
             >
                <MapPin size={14} /> Haritada Görüntüle
             </a>
          </div>

          {/* Geçmiş İş Kayıtları Butonu */}
          <button 
            onClick={() => setShowHistory(true)}
            className="w-full mb-6 flex items-center justify-between bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-xl border border-blue-100 transition-all group"
          >
             <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
                    <History size={20} />
                </div>
                <div className="text-left">
                    <div className="text-sm font-bold">Servis Geçmişi</div>
                    <div className="text-[10px] opacity-70">Son işlemleri görüntüle</div>
                </div>
             </div>
             <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Aksiyon Butonları */}
          <div className="space-y-3">
            {/* Arıza Bildir - SARI */}
            <button className="w-full flex items-center justify-center gap-3 bg-amber-400 hover:bg-amber-500 text-amber-950 py-4 rounded-xl font-bold text-lg shadow-lg shadow-amber-200/50 transition-all active:scale-98">
              <AlertTriangle size={24} />
              Arıza Bildir
            </button>
            
            {/* Acil Destek Ara - KIRMIZI */}
            <a 
                href={asset.emergency_phone ? `tel:${asset.emergency_phone}` : '#'} 
                onClick={(e) => !asset.emergency_phone && e.preventDefault()}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-98 text-white
                    ${asset.emergency_phone ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200/50 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'}
                `}
            >
              <Phone size={24} />
              {asset.emergency_phone ? 'Acil Destek Ara' : 'Numara Tanımlı Değil'}
            </a>
          </div>

          {/* Yasal Uyarı */}
          <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex gap-2 items-start">
                <ShieldAlert size={16} className="text-slate-400 min-w-[16px] mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed text-justify">
                    <strong>YASAL UYARI:</strong> "Acil Destek" butonu sadece hayati tehlike veya acil müdahale gerektiren durumlarda kullanılmalıdır. Asılsız ihbarlar, gereksiz aramalar veya sistemi meşgul edici eylemler hakkında 5326 sayılı Kabahatler Kanunu uyarınca yasal işlem başlatılabilir ve IP adresiniz kayıt altına alınır.
                </p>
            </div>
          </div>

        </div>
      </div>
      
      {/* FOOTER */}
      <div className="mt-8 mb-4 text-center opacity-70 hover:opacity-100 transition-opacity">
        <a href="https://isdokumu.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-500 font-bold uppercase tracking-widest block hover:text-slate-800 transition-colors">
            isdokumu.com
        </a>
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Powered by İş Dökümü</p>
      </div>

      {/* İŞ GEÇMİŞİ MODALI */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Servis Geçmişi</h3>
                        <p className="text-xs text-slate-400">Bu cihaza yapılan son işlemler</p>
                    </div>
                    <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Liste */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {asset.jobs && asset.jobs.length > 0 ? (
                        <div className="space-y-3">
                            {asset.jobs.map((job: any, index: number) => (
                                <div key={index} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">{job.work_type}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                            {job.scheduled_date 
                                                ? new Date(job.scheduled_date).toLocaleDateString('tr-TR') 
                                                : new Date(job.created_at).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border 
                                        ${job.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                          job.status === 'İptal' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                          'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {job.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                            <History size={32} className="opacity-20" />
                            <span className="text-xs">Henüz kayıtlı bir işlem yok.</span>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-100">
                    <button onClick={() => setShowHistory(false)} className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}