'use client';

import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Copy, Check, Building2, Phone, Globe, Palette } from 'lucide-react';
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

  // Güvenli Link Dönüştürücü
  const getSafeImageUrl = (url: string | undefined) => {
    if (!url) return '';
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

    const safeLogoUrl = getSafeImageUrl(companyLogo);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onerror = () => setLogoBgColor('#ffffff');

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
          r = Math.floor(r / count); g = Math.floor(g / count); b = Math.floor(b / count);
          const palette = [
            { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
            { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, 
            { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }
          ];

          let maxDist = -1;
          let selectedColor = '#ffffff';

          for (const color of palette) {
            const dist = Math.sqrt(Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2));
            if (dist > maxDist) { maxDist = dist; selectedColor = color.hex; }
          }
          setLogoBgColor(selectedColor);
        }
      } catch (e) {
        console.error("Renk analizi yapılamadı:", e);
      }
    };
    img.src = safeLogoUrl + (safeLogoUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
  }, [companyLogo]);

  const handlePrint = useReactToPrint({
    contentRef: printRef, 
    documentTitle: `QR_${asset?.apartmentName || asset?.name || 'Etiket'}`,
    onAfterPrint: () => {
        setPrintMode('color');
    },
    pageStyle: `
      @page { 
        size: 80mm 80mm; 
        margin: 0mm; 
      }
      @media print { 
        html, body { 
          width: 80mm !important; 
          height: 80mm !important; 
          margin: 0 auto !important; 
          padding: 0 !important; 
          background-color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        } 
        
        .print-container { 
          width: 76mm !important; 
          height: 76mm !important; 
          border: none !important; 
          box-shadow: none !important; 
          border-radius: 0 !important; 
          padding: 2mm !important; 
          margin: auto !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: space-between !important; 
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
          background-color: white !important;
        }

        /* YAZI TİPLERİ PDF'TE NET ÇIKSIN DİYE PT CİNSİNDEN AYARLANDI */
        .print-title { font-size: 13pt !important; line-height: 1 !important; margin-bottom: 1mm !important; color: #000 !important; }
        .print-subtitle { font-size: 11pt !important; line-height: 1 !important; margin-bottom: 1mm !important; color: #000 !important; }
        
        .print-qr-wrapper {
           width: 34mm !important;
           height: 34mm !important;
           margin: 1mm 0 !important;
           display: flex !important;
           justify-content: center !important;
           align-items: center !important;
        }
        .print-qr-svg { width: 100% !important; height: 100% !important; }

        .print-id-box { 
            font-size: 8pt !important; 
            padding: 1mm 3mm !important; 
            margin-top: 2mm !important; 
            border: 1pt solid #cbd5e1 !important; 
            border-radius: 2mm !important; 
        }
        .bw-mode .print-id-box { border-color: #000 !important; color: #000 !important; background: white !important; }

        .print-badge { 
            font-size: 8pt !important; 
            padding: 0.5mm 2.5mm !important; 
            border-radius: 1.5mm !important; 
            margin-bottom: 2mm !important; 
        }
        .bw-mode .print-badge { border: 1pt solid #000 !important; color: #000 !important; background: white !important; }
        
        .print-info-wrap { 
            display: flex !important; 
            flex-wrap: wrap !important; 
            align-items: center !important; 
            justify-content: center !important; 
            gap: 2mm !important; 
            width: 100% !important;
        }
        .print-info-text { 
            font-size: 7.5pt !important; 
            display: flex !important; 
            align-items: center !important; 
            gap: 1mm !important; 
        }
        .bw-mode .print-info-text { color: #000 !important; }
        
        .print-icon { width: 3mm !important; height: 3mm !important; }
        .bw-mode .print-icon { fill: #000 !important; color: #000 !important; }

        /* FOOTER (DAİMA GRİ VE KÜÇÜK) */
        .print-footer { margin-top: auto !important; padding-top: 1mm !important; text-align: center !important; display: flex !important; flex-direction: column !important;}
        .print-simple-footer { color: #64748b !important; font-size: 6.5pt !important; }
        .print-simple-footer-link { color: #94a3b8 !important; font-size: 5.5pt !important; }
        
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

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0 overflow-y-auto"
        onClick={onClose} 
      >
        <motion.div 
          onClick={(e) => e.stopPropagation()} 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[380px] my-auto flex flex-col relative print:shadow-none print:w-auto print:max-w-none print:rounded-none print:h-auto print:max-h-none print:bg-transparent"
        >
          <AnimatePresence>
            {showPrintModeSelection && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 sm:p-8 print:hidden"
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

          <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 print:hidden shrink-0 rounded-t-3xl">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
               <Printer size={18} className="text-blue-600"/> Etiket Önizleme
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors active:scale-95">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-100/50 print:bg-white print:p-0 print:m-0 print:block print:overflow-visible">
            
            {/* 🚀 EKRAN ÖNİZLEMESİ: Sabit height kaldırıldı, boşluklar (gap) ve paddingler ile ferahlatıldı. HİÇBİR ŞEY KESİLMEZ. */}
            <div 
              ref={printRef} 
              className={`print-container w-full max-w-[320px] bg-white border border-slate-200 shadow-xl rounded-3xl flex flex-col items-center p-6 gap-5 print:border-none print:shadow-none print:rounded-none ${printMode === 'bw' ? 'bw-mode' : ''}`}
            >
              
              {/* 1. LOGO VE FİRMA ADI */}
              <div className="w-full flex flex-col items-center justify-center gap-2">
                <div 
                  className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-slate-100 ${printMode === 'bw' ? 'border-black bg-white' : ''}`}
                  style={{ backgroundColor: printMode === 'bw' ? '#ffffff' : (companyLogo ? logoBgColor : '#f8fafc') }}
                >
                  {companyLogo ? (
                    <img 
                      src={getSafeImageUrl(companyLogo)} 
                      alt="Logo" 
                      crossOrigin="anonymous"
                      className={`w-8 h-8 object-contain drop-shadow-sm print:drop-shadow-none ${printMode === 'bw' ? 'grayscale brightness-0' : ''}`} 
                    />
                  ) : (
                    <Building2 className={`w-7 h-7 ${printMode === 'bw' ? 'text-black' : 'text-slate-400'}`} />
                  )}
                </div>
                <div className={`text-sm print-title font-black tracking-tight uppercase leading-none text-center w-full ${printMode === 'bw' ? 'text-black' : 'text-slate-900'}`}>
                  {companyName || 'İşletme Adı'}
                </div>
              </div>

              {/* 2. QR KOD VE ID */}
              <div className="flex flex-col items-center justify-center w-full gap-3 print-qr-wrapper">
                <div className="w-[130px] h-[130px] print-qr-svg flex items-center justify-center">
                    <QRCodeSVG 
                      value={qrUrl} 
                      style={{ width: '100%', height: '100%' }}
                      level="Q"
                      includeMargin={false}
                    />
                </div>
                <div 
                   onClick={() => {
                     navigator.clipboard.writeText(uniqueId);
                     setIdCopied(true);
                     setTimeout(() => setIdCopied(false), 2000);
                   }}
                   className={`flex items-center justify-center gap-1.5 text-[11px] print-id-box font-bold tracking-widest uppercase px-4 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors ${printMode === 'bw' ? 'text-black bg-white' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'}`}
                   title="Kodu Kopyalamak İçin Tıklayın"
                >
                   ID: {asset.id}
                   <span className="print:hidden">
                     {idCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                   </span>
                </div>
              </div>

              {/* 3. BAŞLIK VE İLETİŞİM BİLGİLERİ */}
              <div className="w-full flex flex-col items-center gap-2">
                <h2 className={`text-lg print-subtitle font-black leading-tight text-center w-full ${printMode === 'bw' ? 'text-black' : 'text-slate-900'}`}>
                  {mainTitle}
                </h2>
                
                {subTitle && (
                  <div className={`text-[11px] print-badge font-bold px-3 py-1 rounded-md text-center max-w-full ${printMode === 'bw' ? 'bg-transparent text-black' : 'bg-slate-100 text-slate-600'}`}>
                    {subTitle}
                  </div>
                )}

                {/* İLETİŞİM BİLGİLERİ (Artık sıkışmıyor, alt alta iniyor) */}
                {(landlinePhone || whatsappPhone || companyWebsite) && (
                  <div className="print-info-wrap flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2 w-full">
                    {landlinePhone && (
                      <div className={`print-info-text flex items-center gap-1.5 text-xs font-bold ${printMode === 'bw' ? 'text-black' : 'text-slate-800'}`}>
                        <Phone className={`w-4 h-4 print-icon ${printMode === 'bw' ? 'text-black' : 'text-slate-500'}`} /> {landlinePhone}
                      </div>
                    )}
                    {whatsappPhone && (
                      <div className={`print-info-text flex items-center gap-1.5 text-xs font-bold ${printMode === 'bw' ? 'text-black' : 'text-slate-800'}`}>
                        <FaWhatsapp className={`w-4 h-4 print-icon ${printMode === 'bw' ? 'text-black' : 'text-[#25D366]'}`} /> {whatsappPhone}
                      </div>
                    )}
                    {companyWebsite && (
                      <div className={`print-info-text flex items-center gap-1.5 text-xs font-bold ${printMode === 'bw' ? 'text-black' : 'text-slate-600'}`}>
                        <Globe className={`w-4 h-4 print-icon ${printMode === 'bw' ? 'text-black' : 'text-slate-500'}`} /> {companyWebsite.replace(/^https?:\/\//, '')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. ALT BİLGİ (FOOTER) - PDF'TE GRİ OLMA GARANTİSİ */}
              <div className="print-footer flex flex-col items-center justify-center w-full pt-4">
                <span className="text-[10px] font-medium text-slate-400 print-simple-footer">
                   Powered by <span className="font-bold">Fixlog.co</span>
                </span>
              </div>

            </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 print:hidden shrink-0 rounded-b-3xl">
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