'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';

interface AssetQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any;
}

export default function AssetQRModal({ isOpen, onClose, asset }: AssetQRModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // GÜNCELLEME BURADA: 'content' yerine 'contentRef' kullanıyoruz
  const handlePrint = useReactToPrint({
    contentRef: printRef, // v3.x uyumlu kullanım
    documentTitle: `QR-${asset?.name || 'Varlik'}`,
    onAfterPrint: () => console.log('Yazdırma işlemi tamamlandı'),
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `
  });

  if (!isOpen || !asset) return null;

  // UUID varsa onu, yoksa ID'yi kullan (Eski kayıtlar için güvenlik ağı)
  const uniqueId = asset.uuid || asset.id;
  // Domain adresini otomatik al
  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/q/${uniqueId}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col print:shadow-none print:w-auto print:max-w-none"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 print:hidden">
            <h3 className="font-bold text-slate-800">Varlık Etiketi</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* YAZDIRILACAK ALAN */}
          <div className="flex-1 p-8 flex items-center justify-center bg-slate-100 print:bg-white print:p-0 print:m-0 print:h-screen print:flex print:items-center print:justify-center">
            
            <div 
              ref={printRef} 
              className="w-[300px] h-[450px] bg-white border-4 border-slate-900 rounded-xl flex flex-col items-center justify-between p-6 text-center shadow-lg print:shadow-none print:border-4 print:border-black box-border"
            >
              {/* Logo Alanı */}
              <div className="w-full border-b-2 border-slate-100 pb-4 mb-2">
                <div className="text-2xl font-black text-slate-900 tracking-tighter uppercase">İŞ DÖKÜMÜ</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Teknik Servis Takip</div>
              </div>

              {/* QR Kod */}
              <div className="flex-1 flex items-center justify-center py-2">
                <QRCodeSVG 
                  value={qrUrl} 
                  size={180} 
                  level="Q" // Yüksek hata düzeltme
                  includeMargin={false}
                />
              </div>

              {/* Alt Bilgiler */}
              <div className="w-full pt-4 border-t-2 border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1 break-words">
                  {asset.name}
                </h2>
                <p className="text-sm font-medium text-slate-600 mb-2 line-clamp-2">
                  {asset.apartmentName ? asset.apartmentName : asset.location}
                </p>
                <div className="inline-block bg-slate-100 px-2 py-1 rounded text-[10px] font-mono text-slate-500 border border-slate-200">
                  ID: {uniqueId.toString().slice(0, 8)}...
                </div>
              </div>
            </div>
          
          </div>

          {/* Footer Butonları */}
          <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 print:hidden">
            <button onClick={() => handlePrint()} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-slate-200">
              <Printer size={18} /> Yazdır
            </button>
            <button 
              onClick={() => { 
                navigator.clipboard.writeText(qrUrl); 
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }} 
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-lg text-sm font-bold transition-colors"
            >
              {copied ? <Check size={18} className="text-emerald-500"/> : <Copy size={18} />} 
              {copied ? 'Kopyalandı' : 'Linki Kopyala'}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}