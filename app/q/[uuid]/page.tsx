'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Phone, ShieldCheck, Box, MapPin, History, X, ShieldAlert, ChevronRight, User, MessageCircle, Info } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function AssetScanPage() {
  const { uuid } = useParams();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modallar için State'ler
  const [showHistory, setShowHistory] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [showFaultModal, setShowFaultModal] = useState(false);
  
  // Form ve İstek State'leri
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faultForm, setFaultForm] = useState({ name: '', phone: '', description: '' });

  // Logo Arka Plan Rengi
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

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

  // LOGODAN ZIT RENK SEÇİMİ (Mavi, Siyah veya Beyaz)
  useEffect(() => {
    if (!asset?.logo) {
      setLogoBgColor('#ffffff');
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue; 
          
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        
        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          const palette = [
            { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
            { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, 
            { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }  
          ];

          let maxDist = -1;
          let selectedColor = '#ffffff';

          for (const color of palette) {
            const dist = Math.sqrt(Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2));
            if (dist > maxDist) {
              maxDist = dist;
              selectedColor = color.hex;
            }
          }
          setLogoBgColor(selectedColor);
        }
      } catch (e) {
        console.error("Renk analizi yapılamadı:", e);
      }
    };
    img.src = asset.logo;
  }, [asset?.logo]);


  // 🚨 ACİL DURUM ONAYLAMA İŞLEMİ
  const handleEmergencyConfirm = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`${API_URL}/public/trigger-emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid: asset.uuid || uuid, company_slug: asset.company_slug })
      });
    } catch (err) {
      console.error("Acil durum bildirilemedi, ancak yine de aramaya yönlendirilecek.", err);
    } finally {
      setIsSubmitting(false);
      setShowEmergencyConfirm(false);
      if (asset.emergency_phone) {
        window.location.href = `tel:${asset.emergency_phone}`;
      }
    }
  };

  // ⚠️ ARIZA BİLDİRİM FORMU GÖNDERME İŞLEMİ
  const handleFaultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/public/report-fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uuid: asset.uuid || uuid, 
          company_slug: asset.company_slug,
          ...faultForm 
        })
      });
      if (res.ok) {
        alert("Arıza kaydınız başarıyla iletildi. En kısa sürede sizinle iletişime geçilecektir.");
        setShowFaultModal(false);
        setFaultForm({ name: '', phone: '', description: '' });
      } else {
        alert("Bir sorun oluştu. Lütfen doğrudan arama butonunu kullanınız.");
      }
    } catch (err) {
      alert("Bağlantı kurulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Harita URL'sini oluşturan yardımcı fonksiyon
  const getMapsUrl = () => {
      if (!asset?.location) return '#';
      // Sadece temiz adresi göndererek doğru konumu bulmasını sağla
      return `https://maps.google.com/?q=${encodeURIComponent(asset.location)}`;
  };

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
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-slate-900"></div>
          <div className="relative z-10">
            {asset.logo ? (
               <div className="p-3 rounded-2xl inline-block mb-4 backdrop-blur-md ring-4 ring-white/5 shadow-lg transition-colors duration-500" style={{ backgroundColor: logoBgColor }}>
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
          
          <a href="/login" className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white text-xs font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-colors shadow-sm mb-5">
             <User size={16} /> Personel Girişi
          </a>

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
             <a href={getMapsUrl()} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-lg hover:bg-slate-100 transition-colors shadow-sm">
                <MapPin size={14} /> Haritada Görüntüle
             </a>
          </div>

          <button onClick={() => setShowHistory(true)} className="w-full mb-6 flex items-center justify-between bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-xl border border-blue-100 transition-all group">
             <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm"><History size={20} /></div>
                <div className="text-left">
                    <div className="text-sm font-bold">Servis Geçmişi</div>
                    <div className="text-[10px] opacity-70">Son işlemleri görüntüle</div>
                </div>
             </div>
             <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* AKSİYON BUTONLARI */}
          <div className="space-y-3">
            <button 
              onClick={() => setShowFaultModal(true)}
              className="w-full flex items-center justify-center gap-3 bg-amber-400 hover:bg-amber-500 text-amber-950 py-4 rounded-xl font-bold text-lg shadow-lg shadow-amber-200/50 transition-all active:scale-98"
            >
              <AlertTriangle size={24} /> Arıza Bildir
            </button>
            
            <a 
                href={asset.whatsapp_phone ? `https://wa.me/${asset.whatsapp_phone.replace(/\D/g, '').length >= 10 ? '90' + asset.whatsapp_phone.replace(/\D/g, '').slice(-10) : asset.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent('Merhaba, ' + asset.name + ' cihazı için destek almak istiyorum.')}` : '#'} 
                target={asset.whatsapp_phone ? "_blank" : undefined} rel={asset.whatsapp_phone ? "noopener noreferrer" : undefined} onClick={(e) => !asset.whatsapp_phone && e.preventDefault()}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-98 text-white
                    ${asset.whatsapp_phone ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200/50 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'}
                `}
            >
              <MessageCircle size={24} /> {asset.whatsapp_phone ? 'WhatsApp Destek' : 'WhatsApp Tanımlı Değil'}
            </a>

            <button 
                onClick={(e) => {
                  if(!asset.emergency_phone) return;
                  e.preventDefault();
                  setShowEmergencyConfirm(true);
                }}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-98 text-white
                    ${asset.emergency_phone ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200/50 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'}
                `}
            >
              <Phone size={24} /> {asset.emergency_phone ? 'Acil Destek Ara' : 'Numara Tanımlı Değil'}
            </button>
          </div>

        </div>
      </div>
      
      {/* FOOTER */}
      <div className="mt-8 mb-4 text-center opacity-70 hover:opacity-100 transition-opacity">
        <a href="https://isdokumu.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-500 font-bold uppercase tracking-widest block hover:text-slate-800 transition-colors">isdokumu.com</a>
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Powered by İş Dökümü</p>
      </div>

      {/* 🚨 ACİL DURUM ONAY MODALI */}
      {showEmergencyConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-rose-600 p-6 flex flex-col items-center text-center text-white">
                 <ShieldAlert size={64} className="mb-4 animate-pulse" />
                 <h2 className="text-2xl font-black mb-1">Acil Durum Onayı</h2>
                 <p className="text-rose-100 text-sm">Gerçekten acil bir müdahale mi gerekiyor?</p>
              </div>
              <div className="p-6">
                 <p className="text-sm text-slate-600 text-center mb-6 font-medium">
                    Bu butona bastığınızda doğrudan yetkili kişiye bağlanacaksınız ve <strong>işletme paneline kırmızı alarm</strong> gönderilecektir. Lütfen sadece hayati/acil durumlarda kullanın.
                 </p>
                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleEmergencyConfirm} 
                      disabled={isSubmitting}
                      className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-lg flex justify-center items-center gap-2 shadow-lg shadow-rose-200 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? <span className="animate-spin border-2 border-white border-t-transparent w-5 h-5 rounded-full" /> : <Phone size={20} />}
                      Evet, Acil Durum
                    </button>
                    <button 
                      onClick={() => setShowEmergencyConfirm(false)} 
                      disabled={isSubmitting}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                    >
                      İptal Et
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ⚠️ ARIZA BİLDİRİM MODALI */}
      {showFaultModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
              
              <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-amber-50">
                  <div className="flex items-center gap-3 text-amber-900">
                      <div className="bg-amber-400 p-2 rounded-lg text-amber-950"><AlertTriangle size={20} /></div>
                      <h3 className="text-lg font-bold">Arıza Bildir</h3>
                  </div>
                  <button onClick={() => setShowFaultModal(false)} className="p-2 bg-white/50 hover:bg-white rounded-full text-slate-500 transition-colors">
                      <X size={20} />
                  </button>
              </div>

              <form onSubmit={handleFaultSubmit} className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Adınız Soyadınız</label>
                    <input 
                      required type="text" 
                      value={faultForm.name} onChange={e => setFaultForm({...faultForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all" 
                      placeholder="Ad Soyad"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">İletişim Numaranız</label>
                    <input 
                      required type="tel" 
                      value={faultForm.phone} onChange={e => setFaultForm({...faultForm, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all" 
                      placeholder="05XX XXX XX XX"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Arıza Detayı</label>
                    <textarea 
                      required rows={3}
                      value={faultForm.description} onChange={e => setFaultForm({...faultForm, description: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all resize-none" 
                      placeholder="Sorunu kısaca açıklayın..."
                    />
                 </div>

                 <button 
                   type="submit" disabled={isSubmitting}
                   className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-amber-400 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-70"
                 >
                   {isSubmitting ? 'Gönderiliyor...' : 'Talebi Gönder'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* İŞ GEÇMİŞİ MODALI */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Servis Geçmişi</h3>
                        <p className="text-xs text-slate-400">Bu cihaza yapılan son işlemler</p>
                    </div>
                    <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
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
                <div className="p-4 border-t border-slate-100">
                    <button onClick={() => setShowHistory(false)} className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">Kapat</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}