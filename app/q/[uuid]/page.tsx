'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Phone, Wrench, ShieldCheck } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function AssetScanPage() {
  const { uuid } = useParams();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">QR Bilgisi Alınıyor...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-rose-500 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 relative">
        
        {/* Güvenlik Rozeti */}
        <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-100">
            <ShieldCheck size={12} /> DOĞRULANDI
        </div>

        {/* Üst Bilgi */}
        <div className="bg-slate-900 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm text-2xl font-bold">
             {asset.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold mb-1">{asset.name}</h1>
          <p className="text-slate-400 text-sm">{asset.location}</p>
        </div>

        {/* Detaylar */}
        <div className="p-6">
          <div className="flex flex-col gap-3 mb-6">
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Teknik Detaylar</div>
                <div className="text-xs text-slate-700 font-medium">{asset.asset_details || 'Belirtilmemiş'}</div>
             </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-3 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-rose-200 transition-all active:scale-95">
              <AlertTriangle size={24} />
              Arıza Bildir
            </button>
            
            <a href="tel:+905555555555" className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 py-4 rounded-xl font-bold text-lg transition-all">
              <Phone size={24} />
              Acil Destek Ara
            </a>
          </div>

          {/* Personel Girişi */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <a href={`/login?redirect=/dashboard/assets/${asset.id}`} className="inline-flex items-center justify-center gap-2 text-slate-400 hover:text-blue-600 text-xs font-bold uppercase transition-colors">
               <Wrench size={14} /> Personel Girişi
             </a>
          </div>

        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Powered by İş Dökümü</p>
      </div>
    </div>
  );
}