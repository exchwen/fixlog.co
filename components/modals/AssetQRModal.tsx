'use client';

import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Copy, Check, Building2, Phone, MessageCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';

interface AssetQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any;
  companyName?: string;
  companyLogo?: string;
  landlinePhone?: string;
  whatsappPhone?: string;
  companyWebsite?: string;
}

export default function AssetQRModal({ isOpen, onClose, asset, companyName, companyLogo, landlinePhone, whatsappPhone, companyWebsite }: AssetQRModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

  // Logodan zıt/farklı rengi çekme işlemi (Mavi, Siyah, Beyaz arasından seçer)
  useEffect(() => {
    if (!companyLogo) {
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
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        
        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          // Kullanabileceğimiz 3 ana arka plan rengi
          const palette = [
            { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
            { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, // slate-900
            { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }  // blue-600
          ];

          let maxDist = -1;
          let selectedColor = '#ffffff';

          // Logodaki ortalama renge EN UZAK olan (en zıt) rengi bul
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
    img.src = companyLogo;
  }, [companyLogo]);

  const handlePrint = useReactToPrint({
    contentRef: printRef, 
    documentTitle: `QR-${asset?.apartmentName || asset?.name || 'Varlik'}`,
    onAfterPrint: () => console.log('Yazdırma işlemi tamamlandı'),
    pageStyle: `
      @page { size: 80mm 80mm; margin: 0; }
      @media print { 
        body { 
          -webkit-print-color-adjust: exact; 
          margin: 0; 
          padding: 0; 
          width: 80mm;
          height: 80mm;
          display: flex; 
          justify-content: center; 
          align-items: center; 
        } 
        .print-container { 
          width: 80mm !important; 
          height: 80mm !important; 
          border: none !important; 
          box-shadow: none !important; 
          border-radius: 0 !important; 
          padding: 3mm !important; 
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
        .print-container * {
          color: black !important;
        }
      }
    `
  });

  if (!isOpen || !asset) return null;

  const uniqueId = asset.uuid || asset.id;
  // QR her zaman İş Dökümü varlık sayfasına gidecek. Asla şirket web sitesine yönlendirmeyecek.
  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/q/${uniqueId}`;

  // Mantık: Apartman adı varsa Ana Başlık o olur, yoksa Cihaz adı olur.
  const aptName = asset.apartmentName || asset.apartment_name;
  const mainTitle = aptName || asset.name;
  
  // Alt başlık sadece Apartman adı VARSA Cihaz adı olarak görünür.
  const subTitle = aptName ? asset.name : null;

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
          <div className="flex-1 p-8 flex items-center justify-center bg-slate-100 print:bg-white print:p-0 print:m-0 print:h-screen print:w-screen print:flex print:items-center print:justify-center">
            
            <div 
              ref={printRef} 
              className="print-container w-[280px] h-auto min-h-[280px] bg-white border-2 border-slate-900 rounded-xl flex flex-col items-center justify-between p-5 text-center shadow-lg box-border"
            >
              {/* Logo ve Firma Adı */}
              <div className="w-full flex flex-col items-center justify-center mb-3 border-b-2 border-slate-100 pb-3 print:pb-2 print:mb-2 print:border-black">
                
                {/* Dinamik Arka Planlı Logo Alanı */}
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-2 overflow-hidden shadow-sm border-2 border-white ring-1 ring-slate-100 print:w-12 print:h-12 print:mb-1 print:border-black print:ring-0"
                  style={{ backgroundColor: companyLogo ? logoBgColor : '#f8fafc' }}
                >
                  {companyLogo ? (
                    <img src={companyLogo} alt="Logo" className="w-10 h-10 object-contain print:w-8 print:h-8 drop-shadow-md print:drop-shadow-none" />
                  ) : (
                    <Building2 size={24} className="text-slate-400 print:w-5 print:h-5 print:text-black" />
                  )}
                </div>

                <div className="text-lg font-black text-slate-900 tracking-tighter uppercase print:text-xs print:leading-none">
                  {companyName || 'İşletme Adı'}
                </div>
              </div>

              {/* QR Kod */}
              <div className="flex-1 flex items-center justify-center py-2 print:py-0">
                <QRCodeSVG 
                  value={qrUrl} 
                  size={120} 
                  level="Q"
                  includeMargin={false}
                />
              </div>

              {/* Alt Bilgiler */}
              <div className="w-full pt-3 mt-2 border-t border-slate-200 print:pt-1 print:mt-1 print:border-black flex flex-col items-center">
                {/* Ana Başlık: Apartman Adı (Yoksa Cihaz Adı) */}
                <h2 className="text-base font-bold text-slate-900 leading-tight mb-1 break-words print:text-[10px]">
                  {mainTitle}
                </h2>
                
                {/* Alt Başlık: Cihaz Adı (Eğer Apartman Adı varsa) */}
                {subTitle && (
                  <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded print:text-[8px] print:bg-transparent print:p-0 print:text-black mb-1">
                    {subTitle}
                  </div>
                )}

                {/* İLETİŞİM BİLGİLERİ (SABİT HAT & WHATSAPP & WEBSITE) */}
                {(landlinePhone || whatsappPhone || companyWebsite) && (
                  <div className="flex flex-col items-center gap-1 w-full mt-2 border-t border-slate-100 pt-2 print:border-black print:mt-1 print:pt-1">
                    {landlinePhone && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 print:text-[8px] print:text-black">
                        <Phone size={12} className="print:w-2.5 print:h-2.5 print:text-black" /> {landlinePhone}
                      </div>
                    )}
                    {whatsappPhone && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 print:text-[8px] print:text-black">
                        <MessageCircle size={12} className="print:w-2.5 print:h-2.5 print:text-black" /> {whatsappPhone}
                      </div>
                    )}
                    {companyWebsite && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 print:text-[8px] print:text-black">
                        <Globe size={12} className="print:w-2.5 print:h-2.5 print:text-black" /> {companyWebsite.replace(/^https?:\/\//, '')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Powered By */}
              <div className="mt-4 text-[9px] text-slate-400 font-medium uppercase print:text-[6px] print:mt-1 print:text-black">
                 isdokumu.com • Teknik Servis Takip
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