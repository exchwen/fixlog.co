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

  // 🚀 PDF YAZDIRMA AYARLARI (MİNİMUM VE TEMİZ CSS)
  const handlePrint = useReactToPrint({
    contentRef: printRef, 
    documentTitle: `QR_${asset?.apartmentName || asset?.name || 'Etiket'}`,
    onAfterPrint: () => {
        setPrintMode('color');
    },
    pageStyle: `
      @page { 
        size: 80mm 80mm; 
        margin: 0; 
      }
      @media print { 
        body, html { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 80mm !important; 
          height: 80mm !important; 
          background-color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          overflow: hidden !important;
        }
        
        /* Ana konteyner dışındaki her şeyi gizle */
        body > *:not(.print-only-container) {
          display: none !important;
        }

        .print-only-container {
          display: block !important;
          width: 80mm !important;
          height: 80mm !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          padding: 4mm !important;
          box-sizing: border-box !important;
          background: white !important;
        }

        /* Barkodun tam ortada durması için */
        .print-qr-svg svg {
           width: 32mm !important;
           height: 32mm !important;
        }
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
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
        
        <motion.div 
          onClick={(e) => e.stopPropagation()} 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[380px] my-auto flex flex-col relative"
        >
          <AnimatePresence>
            {showPrintModeSelection && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 sm:p-8"
              >
                <h3 className="text-2xl font-black text-slate-800 mb-2">Baskı Türü</h3>
                <p className="text-[13px] font-medium text-slate-500 mb-8 text-center px-2">
                  Etiketinizi yazıcınıza uygun olan formatta yazdırın.
                </p>
                
                <div className="w-full space-y-3">
                    <button onClick={() => executePrint('color')} className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                      <Palette size={20} /> Renkli Baskı
                    </button>
                    <button onClick={() => executePrint('bw')} className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                      <Printer size={20} /> Siyah Beyaz (Barkod) Baskı
                    </button>
                </div>
                <button onClick={() => setShowPrintModeSelection(false)} className="mt-6 px-6 py-2 text-slate-400 font-bold text-sm hover:text-slate-800 transition-colors active:scale-95">
                  İptal Et
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0 rounded-t-3xl">
            <h3 className="font-black text-slate-800 flex items-center gap-2"><Printer size={18} className="text-blue-600"/> Etiket Önizleme</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors active:scale-95"><X size={20} /></button>
          </div>

          <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-100/50">
            
            {/* 🚀 1. EKRAN ÖNİZLEMESİ (Asla yazdırılmaz) */}
            <div className="w-full max-w-[320px] bg-white border border-slate-200 shadow-xl rounded-3xl flex flex-col items-center p-6 gap-4">
              <div className="w-full flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-slate-100 bg-slate-50" style={{ backgroundColor: companyLogo ? logoBgColor : '#f8fafc' }}>
                  {companyLogo ? <img src={getSafeImageUrl(companyLogo)} alt="Logo" crossOrigin="anonymous" className="w-8 h-8 object-contain drop-shadow-sm" /> : <Building2 className="w-7 h-7 text-slate-400" />}
                </div>
                <div className="text-sm font-black tracking-tight uppercase leading-none text-center text-slate-900">{companyName || 'İşletme Adı'}</div>
              </div>

              <div className="flex flex-col items-center justify-center w-full gap-3">
                <div className="w-[130px] h-[130px] flex items-center justify-center">
                    <QRCodeSVG value={qrUrl} style={{ width: '100%', height: '100%' }} level="Q" includeMargin={false} />
                </div>
                <div onClick={() => { navigator.clipboard.writeText(uniqueId); setIdCopied(true); setTimeout(() => setIdCopied(false), 2000); }} className="flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors text-slate-600 bg-slate-50 hover:bg-slate-100" title="Kodu Kopyalamak İçin Tıklayın">
                   ID: {asset.id} {idCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                </div>
              </div>

              <div className="w-full flex flex-col items-center gap-2">
                <h2 className="text-lg font-black leading-tight text-center text-slate-900">{mainTitle}</h2>
                {subTitle && <div className="text-[11px] font-bold px-3 py-1 rounded-md text-center bg-slate-100 text-slate-600">{subTitle}</div>}

                {(landlinePhone || whatsappPhone || companyWebsite) && (
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2 w-full">
                    {landlinePhone && <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800"><Phone className="w-4 h-4 text-slate-500" /> {landlinePhone}</div>}
                    {whatsappPhone && <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800"><FaWhatsapp className="w-4 h-4 text-[#25D366]" /> {whatsappPhone}</div>}
                    {companyWebsite && <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><Globe className="w-4 h-4 text-slate-500" /> {companyWebsite.replace(/^https?:\/\//, '')}</div>}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center w-full pt-2 border-t border-slate-50 mt-2">
                <span className="text-[10px] font-medium text-slate-400">Powered by <span className="font-bold text-slate-500">Fixlog.co</span></span>
              </div>
            </div>

          </div>

          <div className="p-5 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0 rounded-b-3xl">
            <button onClick={() => setShowPrintModeSelection(true)} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95">
              <Printer size={18} /> Yazdır
            </button>
            <button onClick={() => { navigator.clipboard.writeText(qrUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95">
              {copied ? <Check size={18} className="text-emerald-500"/> : <Copy size={18} />} {copied ? 'Kopyalandı' : 'Linki Kopyala'}
            </button>
          </div>

        </motion.div>
      </div>

      {/* 🚀 2. SADECE YAZDIRMA İÇİN GİZLİ KAPSAYICI (Bu div sadece PDF motoru tarafından okunur) */}
      <div style={{ display: 'none' }}>
        <div 
          ref={printRef} 
          className="print-only-container" 
          style={{
            fontFamily: 'sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'white',
            color: printMode === 'bw' ? 'black' : '#0f172a'
          }}
        >
            
          {/* FİRMA VE LOGO */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2mm', width: '100%' }}>
            <div style={{ 
                width: '12mm', height: '12mm', 
                borderRadius: '2mm', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: printMode === 'bw' ? '1px solid black' : '1px solid #e2e8f0',
                backgroundColor: printMode === 'bw' ? 'white' : (companyLogo ? logoBgColor : '#f8fafc')
            }}>
              {companyLogo ? (
                <img src={getSafeImageUrl(companyLogo)} alt="Logo" crossOrigin="anonymous" style={{ width: '8mm', height: '8mm', objectFit: 'contain', filter: printMode === 'bw' ? 'grayscale(100%) brightness(0)' : 'none' }} />
              ) : (
                <Building2 style={{ width: '7mm', height: '7mm', color: printMode === 'bw' ? 'black' : '#94a3b8' }} />
              )}
            </div>
            <div style={{ fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1 }}>
                {companyName || 'İşletme Adı'}
            </div>
          </div>

          {/* QR VE ID */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5mm', width: '100%' }}>
            <div className="print-qr-svg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QRCodeSVG value={qrUrl} level="Q" includeMargin={false} />
            </div>
            <div style={{ 
                fontSize: '8.5pt', fontWeight: 'bold', letterSpacing: '0.5mm', padding: '1mm 3mm',
                border: printMode === 'bw' ? '1px solid black' : '1px solid #cbd5e1',
                borderRadius: '1.5mm',
                backgroundColor: printMode === 'bw' ? 'white' : '#f8fafc'
            }}>
                ID: {asset.id}
            </div>
          </div>

          {/* BAŞLIK VE İLETİŞİM */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm', width: '100%' }}>
            <h2 style={{ fontSize: '12pt', fontWeight: 900, textAlign: 'center', margin: 0, lineHeight: 1 }}>{mainTitle}</h2>
            {subTitle && (
                <div style={{ 
                    fontSize: '9pt', fontWeight: 'bold', padding: '0.5mm 2.5mm', borderRadius: '1mm',
                    border: printMode === 'bw' ? '1px solid black' : 'none',
                    backgroundColor: printMode === 'bw' ? 'transparent' : '#f1f5f9'
                }}>
                    {subTitle}
                </div>
            )}

            {(landlinePhone || whatsappPhone || companyWebsite) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '2.5mm', marginTop: '1mm' }}>
                    {landlinePhone && (
                        <div style={{ fontSize: '7.5pt', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '1mm' }}>
                            <Phone style={{ width: '3mm', height: '3mm', color: printMode === 'bw' ? 'black' : '#64748b' }} /> {landlinePhone}
                        </div>
                    )}
                    {whatsappPhone && (
                        <div style={{ fontSize: '7.5pt', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '1mm' }}>
                            <FaWhatsapp style={{ width: '3.2mm', height: '3.2mm', color: printMode === 'bw' ? 'black' : '#25D366' }} /> {whatsappPhone}
                        </div>
                    )}
                    {companyWebsite && (
                        <div style={{ fontSize: '7.5pt', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '1mm' }}>
                            <Globe style={{ width: '3mm', height: '3mm', color: printMode === 'bw' ? 'black' : '#64748b' }} /> {companyWebsite.replace(/^https?:\/\//, '')}
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* POWERED BY (Sabit Gri) */}
          <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '1mm' }}>
            <span style={{ fontSize: '6.5pt', color: '#94a3b8', fontWeight: 500 }}>
                Powered by <span style={{ fontWeight: 'bold', color: '#64748b' }}>Fixlog.co</span>
            </span>
          </div>

        </div>
      </div>

    </AnimatePresence>
  );
}