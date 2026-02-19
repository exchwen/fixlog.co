'use client';

import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Copy, Check, Building2, Phone, MessageCircle, Globe, Palette } from 'lucide-react';
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
  
  // YENİ: Baskı modu ve seçim ekranı state'leri
  const [showPrintModeSelection, setShowPrintModeSelection] = useState(false);
  const [printMode, setPrintMode] = useState<'color' | 'bw'>('color');

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
    documentTitle: `QR_${asset?.apartmentName || asset?.name || 'Etiket'}`,
    onAfterPrint: () => {
        console.log('Yazdırma işlemi tamamlandı');
        setPrintMode('color'); // Yazdırma bitince görünümü normale döndür
    },
    pageStyle: `
      @page { 
        size: 80mm 80mm; 
        margin: 0; 
      }
      @media print { 
        html, body { 
          width: 80mm !important; 
          height: 80mm !important; 
          margin: 0 !important; 
          padding: 0 !important; 
          background-color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        } 
        
        /* Tüm sığdırma ve hizalama işlemleri burada */
        .print-container { 
          width: 80mm !important; 
          height: 80mm !important; 
          border: none !important; 
          box-shadow: none !important; 
          border-radius: 0 !important; 
          padding: 4mm !important; 
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: space-between !important;
          position: relative !important;
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
        }

        /* Baskıda en alt siyah şerit ve beyaz yazısı */
        .print-footer-banner {
          background-color: black !important;
        }
        .print-footer-banner span {
          color: white !important;
        }
        
        ::-webkit-scrollbar { display: none; }
      }
    `
  });

  // Baskı modunu ayarlayıp dom güncellendikten sonra yazıcıyı tetikler
  const executePrint = (mode: 'color' | 'bw') => {
    setPrintMode(mode);
    setShowPrintModeSelection(false);
    setTimeout(() => {
      handlePrint();
    }, 150); // React'in state'i DOM'a basması için ufak bir bekleme
  };

  if (!isOpen || !asset) return null;

  const uniqueId = asset.uuid || asset.id;
  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/q/${uniqueId}`;

  const aptName = asset.apartmentName || asset.apartment_name;
  const mainTitle = aptName || asset.name;
  const subTitle = aptName ? asset.name : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative print:shadow-none print:w-auto print:max-w-none print:rounded-none"
        >
          {/* YENİ: BASKI MODU SEÇİM EKRANI (OVERLAY) */}
          <AnimatePresence>
            {showPrintModeSelection && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 print:hidden"
              >
                <h3 className="text-2xl font-black text-slate-800 mb-2">Baskı Türü</h3>
                <p className="text-[13px] font-medium text-slate-500 mb-8 text-center px-4">
                  Etiketinizi yazıcınıza uygun olan formatta yazdırın.
                </p>
                
                <div className="w-full space-y-3">
                    <button 
                      onClick={() => executePrint('color')} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                      <Palette size={20} /> Renkli Baskı
                    </button>
                    
                    <button 
                      onClick={() => executePrint('bw')} 
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                    >
                      <Printer size={20} /> Siyah Beyaz (Barkod) Baskı
                    </button>
                </div>

                <button 
                  onClick={() => setShowPrintModeSelection(false)} 
                  className="mt-6 px-6 py-2 text-slate-400 font-bold text-sm hover:text-slate-800 transition-colors"
                >
                  İptal Et
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 print:hidden">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Printer size={18} className="text-blue-600"/> Etiket Önizleme
            </h3>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* YAZDIRILACAK ALAN (80x80mm'ye eşdeğer piksel) */}
          <div className="flex-1 py-8 flex items-center justify-center bg-slate-100 print:bg-white print:p-0 print:m-0 print:block">
            
            <div 
              ref={printRef} 
              className="print-container w-[302px] h-[302px] bg-white border border-slate-200 shadow-lg rounded-xl flex flex-col items-center justify-between p-3 relative box-border print:border-none print:shadow-none print:rounded-none"
            >
              
              {/* 1. LOGO VE FİRMA ADI (ALT ALTA) */}
              <div className="w-full flex flex-col items-center justify-center mt-1">
                <div 
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-1 overflow-hidden shadow-sm border-2 ${printMode === 'bw' ? 'border-black bg-white' : 'border-white ring-1 ring-slate-100'}`}
                  style={{ backgroundColor: printMode === 'bw' ? '#ffffff' : (companyLogo ? logoBgColor : '#f8fafc') }}
                >
                  {companyLogo ? (
                    <img 
                      src={companyLogo} 
                      alt="Logo" 
                      className={`w-9 h-9 object-contain drop-shadow-md print:drop-shadow-none ${printMode === 'bw' ? 'grayscale contrast-125' : ''}`} 
                    />
                  ) : (
                    <Building2 size={20} className={printMode === 'bw' ? 'text-black' : 'text-slate-400'} />
                  )}
                </div>
                <div className={`text-sm font-black tracking-tight uppercase leading-none text-center truncate w-full px-2 ${printMode === 'bw' ? 'text-black' : 'text-slate-900'}`}>
                  {companyName || 'İşletme Adı'}
                </div>
              </div>

              {/* 2. QR KOD */}
              <div className="flex-1 flex flex-col items-center justify-center w-full my-1.5">
                <QRCodeSVG 
                  value={qrUrl} 
                  size={105} 
                  level="Q"
                  includeMargin={false}
                />
              </div>

              {/* 3. ALT BİLGİLER VE İLETİŞİM */}
              <div className="w-full flex flex-col items-center pb-5 pt-1">
                <h2 className={`text-[13px] font-black leading-tight mb-0.5 text-center truncate w-full px-1 ${printMode === 'bw' ? 'text-black' : 'text-slate-900'}`}>
                  {mainTitle}
                </h2>
                
                {subTitle && (
                  <div className={`text-[9px] font-bold px-2 py-[1px] rounded mb-1 max-w-full truncate ${printMode === 'bw' ? 'bg-transparent border border-black text-black' : 'bg-slate-100 text-slate-600'}`}>
                    {subTitle}
                  </div>
                )}

                {/* İletişim Bilgileri */}
                {(landlinePhone || whatsappPhone || companyWebsite) && (
                  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 mt-1 w-full px-1">
                    {landlinePhone && (
                      <div className={`flex items-center gap-1 text-[9px] font-bold ${printMode === 'bw' ? 'text-black' : 'text-slate-800'}`}>
                        <Phone size={9} /> {landlinePhone}
                      </div>
                    )}
                    {whatsappPhone && (
                      <div className={`flex items-center gap-1 text-[9px] font-bold ${printMode === 'bw' ? 'text-black' : 'text-slate-800'}`}>
                        <MessageCircle size={9} /> {whatsappPhone}
                      </div>
                    )}
                    {companyWebsite && (
                      <div className={`flex items-center gap-1 text-[9px] font-bold ${printMode === 'bw' ? 'text-black' : 'text-slate-600'}`}>
                        <Globe size={9} /> {companyWebsite.replace(/^https?:\/\//, '')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. SİYAH ŞERİT FOOTER */}
              <div className="absolute bottom-0 left-0 right-0 h-[16px] bg-slate-900 flex items-center justify-center print-footer-banner">
                <span className="text-[6.5px] font-bold tracking-[0.15em] text-white uppercase opacity-90">
                   ISDOKUMU.COM • TEKNİK SERVİS
                </span>
              </div>

            </div>
          </div>

          {/* Footer Butonları */}
          <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 print:hidden">
            <button 
              onClick={() => setShowPrintModeSelection(true)} 
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-900/20 active:scale-95"
            >
              <Printer size={18} /> Yazdır
            </button>
            <button 
              onClick={() => { 
                navigator.clipboard.writeText(qrUrl); 
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }} 
              className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95"
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