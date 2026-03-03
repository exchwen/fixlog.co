'use client';

import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Copy, Check, Building2, Phone, Globe, Palette } from 'lucide-react';
// Orijinal WhatsApp ikonu için react-icons kullanıyoruz
import { FaWhatsapp } from 'react-icons/fa'; 
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
  const [idCopied, setIdCopied] = useState(false); 
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');
  
  const [showPrintModeSelection, setShowPrintModeSelection] = useState(false);
  const [printMode, setPrintMode] = useState<'color' | 'bw'>('color');

  // 🚀 GÜVENLİ LİNK DÖNÜŞÜTÜRÜCÜ (PROXY)
  const getSafeImageUrl = (url: string | undefined) => {
    if (!url) return '';
    // Eğer link bizim R2 bucket ise, onu Vercel proxy'sine çevir
    if (url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev')) {
       return url.replace('https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPrintModeSelection) {
          setShowPrintModeSelection(false);
          e.stopImmediatePropagation(); 
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, showPrintModeSelection, onClose]);

  useEffect(() => {
    if (!companyLogo) {
      setLogoBgColor('#ffffff');
      return;
    }

    // 🔥 Linki güvenli hale getiriyoruz
    const safeLogoUrl = getSafeImageUrl(companyLogo);

    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onerror = () => {
      setLogoBgColor('#ffffff');
    };

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
    // 🚀 Güvenli linki kullanıyoruz
    img.src = safeLogoUrl + (safeLogoUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
    }, [companyLogo]);

  const handlePrint = useReactToPrint({
    contentRef: printRef, 
    documentTitle: `QR_${asset?.apartmentName || asset?.name || 'Etiket'}`,
    onAfterPrint: () => {
        console.log('Yazdırma işlemi tamamlandı');
        setPrintMode('color');
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
        
        .print-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100vw !important;
          height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: white !important;
        }

        .print-container { 
          width: 78mm !important; /* Marjin payı */
          height: 78mm !important; 
          border: none !important; 
          box-shadow: none !important; 
          border-radius: 0 !important; 
          padding: 3mm !important; 
          margin: 0 auto !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: space-between !important; 
          position: relative !important;
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
          overflow: hidden !important;
          transform: scale(1) !important; /* PDF'de küçülmeyi engeller */
          transform-origin: center center !important;
        }

        /* Mobilde ve PDF'te Yazı Tiplerinin Küçülmesini Engelleyen Sabit CSS */
        .print-title { font-size: 14pt !important; line-height: 1.1 !important; margin-bottom: 2mm !important; }
        .print-subtitle { font-size: 11pt !important; line-height: 1.1 !important; }
        .print-id-box { font-size: 9pt !important; margin-top: 2mm !important; padding: 1mm 2mm !important; }
        .print-info-text { font-size: 8.5pt !important; }
        
        /* QR KOD İÇİN SABİT BOYUT */
        .print-qr-wrapper svg {
           width: 35mm !important;
           height: 35mm !important;
           max-width: none !important;
        }

        .print-simple-footer { color: #64748b !important; font-size: 7pt !important; }
        .print-simple-footer-link { color: #94a3b8 !important; font-size: 6pt !important; }
        .print-bw-icon { color: black !important; fill: black !important; }
        .print-id-text { color: black !important; font-weight: bold !important; }
        
        ::-webkit-scrollbar { display: none; }
      }
    `
  });

  const executePrint = (mode: 'color' | 'bw') => {
    setPrintMode(mode);
    setShowPrintModeSelection(false);
    setTimeout(() => {
      handlePrint();
    }, 150);
  };

  if (!isOpen || !asset) return null;

  const uniqueId = asset.uuid || asset.id;
  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/q/${uniqueId}`;

  const aptName = asset.apartmentName || asset.apartment_name;
  const mainTitle = aptName || asset.name;
  const subTitle = aptName ? asset.name : null;

  const iconSize = 10; // İkonlar baskıda daha net görünsün diye hafif büyütüldü

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0"
        onClick={onClose} 
      >
        
        <motion.div 
          onClick={(e) => e.stopPropagation()} 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col relative print:shadow-none print:w-auto print:max-w-none print:rounded-none print:h-auto print:max-h-none print:bg-transparent"
        >
          <AnimatePresence>
            {showPrintModeSelection && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 sm:p-8 print:hidden"
              >
                <h3 className="text-2xl font-black text-slate-800 mb-2">Baskı Türü</h3>
                <p className="text-[13px] font-medium text-slate-500 mb-8 text-center px-2">
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
                  className="mt-6 px-6 py-2 text-slate-400 font-bold text-sm hover:text-slate-800 transition-colors active:scale-95"
                >
                  İptal Et
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 print:hidden shrink-0">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
               <Printer size={18} className="text-blue-600"/> Etiket Önizleme
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors active:scale-95">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 py-8 overflow-y-auto flex flex-col items-center justify-center bg-slate-100 print:bg-white print:p-0 print:m-0 print:block print:overflow-visible">
            
            {/* 🚀 Wrapper Div'i Eklendi (Baskıda tam ortalama için) */}
            <div className="print-wrapper w-full flex items-center justify-center">
              <div 
                ref={printRef} 
                className="print-container w-[302px] h-[302px] bg-white border border-slate-200 shadow-xl rounded-2xl flex flex-col items-center justify-between py-4 px-2 relative box-border print:border-none print:shadow-none print:rounded-none shrink-0"
              >
                
                <div className="w-full flex flex-col items-center justify-center shrink-0">
                  <div 
                    className={`w-10 h-10 print:w-[12mm] print:h-[12mm] rounded-lg flex items-center justify-center mb-1.5 overflow-hidden shadow-sm border-2 ${printMode === 'bw' ? 'border-black bg-white' : 'border-white ring-1 ring-slate-100'}`}
                    style={{ backgroundColor: printMode === 'bw' ? '#ffffff' : (companyLogo ? logoBgColor : '#f8fafc') }}
                  >
                    {companyLogo ? (
                      // 🚀 GÜVENLİ LİNK KULLANIMI
                      <img 
                        src={getSafeImageUrl(companyLogo)} 
                        alt="Logo" 
                        crossOrigin="anonymous"
                        className={`w-7 h-7 print:w-[8mm] print:h-[8mm] object-contain drop-shadow-md print:drop-shadow-none ${printMode === 'bw' ? 'grayscale brightness-0' : ''}`} 
                      />
                    ) : (
                      <Building2 size={18} className={printMode === 'bw' ? 'text-black' : 'text-slate-400'} />
                    )}
                  </div>
                  <div className={`text-[13px] print-title font-black tracking-tight uppercase leading-none text-center truncate w-full px-2 ${printMode === 'bw' ? 'text-black' : 'text-slate-900'}`}>
                    {companyName || 'İşletme Adı'}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center w-full relative my-2 shrink-0 print-qr-wrapper">
                  <QRCodeSVG 
                    value={qrUrl} 
                    size={90} 
                    level="Q"
                    includeMargin={false}
                  />
                  <div 
                     onClick={() => {
                       navigator.clipboard.writeText(uniqueId);
                       setIdCopied(true);
                       setTimeout(() => setIdCopied(false), 2000);
                     }}
                     className={`mt-2 flex items-center justify-center gap-1.5 text-[9px] print-id-box font-bold tracking-widest uppercase px-3 py-1 rounded-md border border-slate-200 cursor-pointer transition-colors print:border-none print:bg-transparent ${printMode === 'bw' ? 'text-black' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'}`}
                     title="Kodu Kopyalamak İçin Tıklayın"
                  >
                     ID: {asset.id}
                     <span className="print:hidden">
                       {idCopied ? <Check size={8} className="text-emerald-500" /> : <Copy size={8} className="text-slate-400" />}
                     </span>
                  </div>
                </div>

                <div className="w-full flex flex-col items-center shrink-0">
                  <h2 className={`text-sm print-subtitle font-black leading-tight mb-1 text-center truncate w-full px-1 ${printMode === 'bw' ? 'text-black' : 'text-slate-900'}`}>
                    {mainTitle}
                  </h2>
                  
                  {subTitle && (
                    <div className={`text-[9px] font-bold px-2 py-0.5 rounded mb-1.5 max-w-full truncate ${printMode === 'bw' ? 'bg-transparent border border-black text-black' : 'bg-slate-100 text-slate-600'}`}>
                      {subTitle}
                    </div>
                  )}

                  {(landlinePhone || whatsappPhone || companyWebsite) && (
                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-1 w-full px-1">
                      {landlinePhone && (
                        <div className={`flex items-center gap-1 text-[9px] print-info-text font-bold ${printMode === 'bw' ? 'text-black' : 'text-slate-800'}`}>
                          <Phone size={iconSize} className={printMode === 'bw' ? 'print-bw-icon' : ''} /> {landlinePhone}
                        </div>
                      )}
                      {whatsappPhone && (
                        <div className={`flex items-center gap-1 text-[9px] print-info-text font-bold ${printMode === 'bw' ? 'text-black' : 'text-slate-800'}`}>
                          <FaWhatsapp size={iconSize} className={printMode === 'bw' ? 'print-bw-icon' : 'text-[#25D366]'} /> {whatsappPhone}
                        </div>
                      )}
                      {companyWebsite && (
                        <div className={`flex items-center gap-1 text-[9px] print-info-text font-bold ${printMode === 'bw' ? 'text-black' : 'text-slate-600'}`}>
                          <Globe size={iconSize} className={printMode === 'bw' ? 'print-bw-icon' : ''} /> {companyWebsite.replace(/^https?:\/\//, '')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center shrink-0 mt-2">
                  <span className={`text-[8px] font-medium ${printMode === 'bw' ? 'text-black' : 'text-slate-500'} print-simple-footer`}>
                     Powered by İş Dökümü
                  </span>
                  <span className={`text-[7px] font-medium ${printMode === 'bw' ? 'text-black' : 'text-slate-400'} print-simple-footer-link mt-0.5`}>
                     www.isdokumu.com
                  </span>
                </div>

              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 print:hidden shrink-0">
            <button 
              onClick={() => setShowPrintModeSelection(true)} 
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
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