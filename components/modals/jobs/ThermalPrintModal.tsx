'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bluetooth, Loader2, AlertTriangle, Printer, CheckCircle, CheckSquare, Square, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ThermalPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: any;
    companyName: string;
    companyLogo?: string;
    assets?: any[];
}

export default function ThermalPrintModal({ isOpen, onClose, job, companyName, companyLogo, assets }: ThermalPrintModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // 🚀 YENİ: Logo Arka Plan Rengi State'i
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

  // 🚀 YENİ: CORS Bypass Fonksiyonu
  const getSafeImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev')) {
       return url.replace('https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  // 🚀 YENİ: Logo Baskın Renk Analizi
  useEffect(() => {
    if (!companyLogo) {
      setLogoBgColor('#ffffff');
      return;
    }

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
    img.src = safeLogoUrl + (safeLogoUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
  }, [companyLogo]);

  if (!isOpen || !job) return null;

  const sanitizeText = (text: string) => {
    if (!text) return '';
    return text.replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
               .replace(/ü/g, 'u').replace(/Ü/g, 'U')
               .replace(/ş/g, 's').replace(/Ş/g, 'S')
               .replace(/ı/g, 'i').replace(/İ/g, 'I')
               .replace(/ö/g, 'o').replace(/Ö/g, 'O')
               .replace(/ç/g, 'c').replace(/Ç/g, 'C');
  };

  const parseJobData = () => {
    let rawNote = job.details?.note || job.taskNote || '';
    let extractedChecklist: { key: string, val: string }[] = [];
    let cleanNote = '';

    if (rawNote.includes('---') && rawNote.includes('Saha Formu')) {
        const lines = rawNote.split('\n');
        let inForm = false;
        
        for (const line of lines) {
            if (line.includes('---') && line.includes('Saha Formu')) {
                inForm = true;
                continue;
            }
            if (inForm && line.includes('----------------------------------')) {
                inForm = false;
                continue;
            }

            if (inForm && line.includes(':')) {
                const [key, ...valArr] = line.split(':');
                extractedChecklist.push({ key: key.trim(), val: valArr.join(':').trim() });
            } else if (!inForm && line.trim() !== '') {
                cleanNote += line + '\n';
            }
        }
    } else {
        cleanNote = rawNote;
        if (job.details) {
            const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName', 'usedMaterials'];
            Object.entries(job.details).forEach(([k, v]) => {
                if (!excludeKeys.includes(k) && typeof v === 'string') {
                    extractedChecklist.push({ key: k, val: v });
                }
            });
        }
    }

    cleanNote = cleanNote.replace(/\[Usta Notu\]:/g, '').replace(/\[📍 Konum Kaydı\].*/g, '').trim();
    return { extractedChecklist, cleanNote };
  };

  const { extractedChecklist, cleanNote } = parseJobData();
  const workerName = job.lastEditedBy || job.worker_name || 'Personel';
  const customerSignName = job.customer_signature_name || 'Müşteri / Yetkili';
  
  const asset = assets?.find(a => String(a.id) === String(job.asset_id));
  const assetName = asset ? `${asset.apartmentName || ''} - ${asset.name || ''}`.replace(/^- |-$/g, '').trim() : (job.asset_name || job.details?.assetName || job.customer_name);
  const assetLocation = asset?.location || 'Belirtilmedi';
  const currentMonth = new Date().toLocaleString('tr-TR', { month: 'long' });
  
  let formattedDate = new Date().toLocaleDateString('tr-TR');
  let formattedTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' });
  if (job.created_at) {
      const d = new Date(job.created_at);
      formattedDate = d.toLocaleDateString('tr-TR');
      formattedTime = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' });
  }

  const buildReceipt = () => {
    const init = '\x1B\x40'; 
    const center = '\x1B\x61\x01'; 
    const left = '\x1B\x61\x00'; 
    const boldOn = '\x1B\x45\x01'; 
    const boldOff = '\x1B\x45\x00'; 
    const divider = '--------------------------------\n';

    let txt = init;
    
    txt += center + boldOn + sanitizeText(companyName) + '\n' + boldOff;
    txt += boldOn + 'Bakim Fisi\n' + boldOff;
    txt += divider;
    txt += left;
    
    txt += 'Fis Numarasi : ' + job.id + '\n';
    txt += 'Tarih        : ' + formattedDate + ' ' + formattedTime + '\n';
    txt += 'Tesis Adi    : ' + sanitizeText(assetName) + '\n';
    txt += 'Konum        : ' + sanitizeText(assetLocation) + '\n';
    
    txt += divider;
    
    if (extractedChecklist.length > 0) {
        extractedChecklist.forEach((item) => {
            let cleanKey = sanitizeText(item.key);
            const valStr = item.val.toLowerCase().trim();
            const isPositive = ['evet', 'var', 'true', 'ok', 'uygun', 'sorunsuz'].some(v => valStr === v || valStr.includes(v));
            const isNegative = ['hayir', 'hayır', 'yok', 'false', 'uygun degil', 'değil', 'sorunlu', 'kotu', 'kötü'].some(v => valStr === v || valStr.includes(v));
            
            if (isPositive || isNegative) {
                if (cleanKey.length > 25) cleanKey = cleanKey.substring(0, 25);
                const paddedKey = cleanKey.padEnd(26, ' ');
                const isChecked = isPositive ? '[X]' : '[ ]';
                txt += paddedKey + isChecked + '\n';
            } else {
                if (cleanKey.length > 15) cleanKey = cleanKey.substring(0, 15);
                const paddedKey = cleanKey.padEnd(16, ' ');
                txt += paddedKey + ': ' + sanitizeText(item.val).substring(0, 14) + '\n';
            }
        });
        txt += divider;
    }

    if (job.details?.usedMaterials && job.details.usedMaterials.length > 0) {
        txt += boldOn + 'Kullanilan Malzemeler:\n' + boldOff;
        job.details.usedMaterials.forEach((m: any) => {
            txt += `- ${sanitizeText(m.name)} (${m.quantity} ${sanitizeText(m.unit)})\n`;
        });
        txt += divider;
    }

    if (cleanNote) {
        txt += boldOn + 'Bakim Notu : \n' + boldOff + sanitizeText(cleanNote) + '\n';
        txt += divider;
    }

    txt += `Bu form ${sanitizeText(workerName)} isimli\n`;
    txt += `personelimiz tarafindan,\n`;
    txt += `${formattedDate} tarihinde elektronik \n`;
    txt += `imza ile imzalanmistir.\n\n`;

    txt += boldOn + `Imzalayan : ` + boldOff + sanitizeText(customerSignName) + `\n`;
    txt += `Imza      : \n\n\n\n`; 
    
    txt += center + sanitizeText(companyName) + '\n';
    txt += '\n\n\n\n\n'; 

    return new TextEncoder().encode(txt);
  };

  const handleSharePDF = async () => {
    setIsConnecting(true);
    setStatusMsg('PDF Hazırlanıyor...');
    setErrorMsg('');

    try {
        const receiptElement = document.getElementById('receipt-preview');
        if (!receiptElement) throw new Error("Fiş alanı bulunamadı.");

        // 🚀 DÜZELTME: Mobilde Resimlerin Gelmesi için allowTaint eklendi.
        const canvas = await html2canvas(receiptElement, { 
            scale: 3, 
            useCORS: true, 
            allowTaint: true,
            backgroundColor: '#ffffff' 
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [canvas.width * 0.264583, canvas.height * 0.264583] });
        pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        
        const pdfBlob = pdf.output('blob');
        const safeFileName = `${sanitizeText(assetName).replace(/\s+/g, '_')}_${currentMonth}_ay_bakim_fisi.pdf`;
        const file = new File([pdfBlob], safeFileName, { type: 'application/pdf' });
        
        const shareText = `${sanitizeText(assetName)} ${currentMonth} ay bakımı yapılmıştır. Fişinizi ekte bulabilirsiniz.`;

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            setStatusMsg('Paylaşım ekranı açılıyor...');
            await navigator.share({
                title: `Bakım Fişi #${job.id}`,
                text: shareText,
                files: [file]
            });
            setStatusMsg('İşlem Başarılı!');
        } else {
            const waText = `*${companyName}*\n*Bakım Fişi #${job.id}*\n\n${sanitizeText(assetName)} ${currentMonth} ay bakımı yapılmıştır.\n\n_Detaylar için web uygulamamızı ziyaret edin._`;
            window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
            setStatusMsg('Dosya desteği yok, metin iletildi.');
        }
    } catch (error) {
        console.error(error);
        setErrorMsg('PDF oluşturulurken bir hata oluştu.');
    } finally {
        setTimeout(() => setIsConnecting(false), 2000);
    }
  };

  const handlePrint = async () => {
    const nav = navigator as any; 

    if (!nav.bluetooth) {
      setErrorMsg("Tarayıcınız Bluetooth bağlantısını desteklemiyor.");
      return;
    }

    setIsConnecting(true);
    setStatusMsg('Yazıcı aranıyor...');
    setErrorMsg('');

    try {
      let device;
      
      if (nav.bluetooth.getDevices) {
        const devices = await nav.bluetooth.getDevices();
        if (devices.length > 0) {
          device = devices[0]; 
        }
      }

      if (!device) {
        device = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'] 
        });
      }

      setStatusMsg('Yazıcıya bağlanılıyor...');
      const server = await device.gatt?.connect();
      
      if (!server) throw new Error("Bağlantı kurulamadı.");

      const services = await server.getPrimaryServices();
      let printCharacteristic = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            printCharacteristic = char;
            break;
          }
        }
        if (printCharacteristic) break;
      }

      if (!printCharacteristic) {
        throw new Error("Yazılabilir servis bulunamadı.");
      }

      setStatusMsg('Fiş yazdırılıyor...');
      const payload = buildReceipt();
      
      const CHUNK_SIZE = 100; 
      for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        const chunk = payload.slice(i, i + CHUNK_SIZE);
        await printCharacteristic.writeValue(chunk);
      }

      setStatusMsg('Yazdırma Başarılı!');
      setTimeout(() => {
        setIsConnecting(false);
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error(error);
      setIsConnecting(false);
      if (error.name === 'NotFoundError') {
        setErrorMsg('Cihaz seçimi iptal edildi veya cihaz bulunamadı.');
      } else {
        setErrorMsg(error.message || 'Yazıcıya bağlanırken bir hata oluştu.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 cursor-pointer"
        onClick={() => !isConnecting && onClose()}
      />
      
      <motion.div 
        initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-slate-200 w-full md:max-w-lg h-full md:h-auto md:max-h-[95vh] md:rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-slate-300 flex justify-between items-center bg-white shrink-0 shadow-sm z-20">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                <Printer size={20} className="text-slate-600" /> Rapor
            </h3>
            <button disabled={isConnecting} onClick={onClose} className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-6 bg-slate-200">
            
            <div id="receipt-preview" className="w-full max-w-[380px] bg-white text-black mx-auto shadow-md relative" style={{ paddingBottom: '24px', minHeight: '400px' }}>
                <div className="p-5 sm:p-8 flex flex-col text-[12px] font-sans relative z-10">
                    
                    {/* 🚀 EKLENDİ: Dinamik Logo Arka Planı (Termal Yazıcı Uyumlu) */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        {companyLogo ? (
                            <div 
                                className="w-16 h-16 rounded-xl flex items-center justify-center mb-2 overflow-hidden border border-slate-100 shadow-sm"
                                style={{ backgroundColor: logoBgColor }}
                            >
                                <img 
                                    src={getSafeImageUrl(companyLogo)} 
                                    crossOrigin="anonymous" 
                                    alt="Logo" 
                                    className="w-12 h-12 object-contain grayscale" 
                                />
                            </div>
                        ) : (
                            <div className="font-black text-3xl tracking-tighter mb-1 lowercase">{companyName.substring(0, 3)}<span className="text-slate-400">f</span></div>
                        )}
                        <div className="font-bold text-sm uppercase tracking-widest">{companyName}</div>
                        <h2 className="text-base font-bold mt-2">Bakım Fişi</h2>
                    </div>

                    <div className="space-y-1.5 mb-6">
                        <div className="flex">
                            <span className="font-bold w-[100px] shrink-0">Fiş Numarası</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="font-normal">{job.id}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold w-[100px] shrink-0">Tarih</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="font-normal">{formattedDate} {formattedTime}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold w-[100px] shrink-0">Tesis Adı</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="font-normal uppercase break-words flex-1">{assetName}</span>
                        </div>
                        <div className="flex mt-1.5">
                            <span className="font-bold w-[100px] shrink-0">Konum</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="font-normal uppercase break-words flex-1">{assetLocation}</span>
                        </div>
                    </div>

                    {extractedChecklist.length > 0 && (
                        <div className="border-t border-black/20 pt-2 pb-2">
                            {extractedChecklist.map((item, idx) => {
                                const valStr = item.val.toLowerCase().trim();
                                const isPositive = ['evet', 'var', 'true', 'ok', 'uygun', 'sorunsuz'].some(v => valStr === v || valStr.includes(v));
                                const isNegative = ['hayır', 'hayir', 'yok', 'false', 'uygun değil', 'değil', 'sorunlu', 'kötü'].some(v => valStr === v || valStr.includes(v));
                                const isBooleanType = isPositive || isNegative;
                                
                                return (
                                    <div key={idx} className="flex justify-between items-end border-b border-black/10 py-2.5">
                                        <div className="flex flex-col pr-4">
                                            <span className="font-semibold text-[11px] leading-tight text-black">{item.key}</span>
                                            <span className="text-[10px] font-bold mt-0.5 uppercase text-black">{item.val}</span>
                                        </div>
                                        <div className="shrink-0 pb-0.5">
                                            {isBooleanType ? (
                                                isPositive ? (
                                                    <div className="w-4 h-4 bg-black flex items-center justify-center rounded-sm">
                                                        <CheckSquare size={14} className="text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="w-4 h-4 border-2 border-black rounded-sm"></div>
                                                )
                                            ) : (
                                                <span className="text-[10px] font-black uppercase text-black border-b border-black">{item.val}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {job.details?.usedMaterials && job.details.usedMaterials.length > 0 && (
                        <div className="py-4 border-b border-black/10">
                            <div className="font-bold mb-2">Kullanılan Malzemeler</div>
                            <div className="space-y-1 text-xs">
                                {job.details.usedMaterials.map((m: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <span>• {m.name}</span>
                                        <span>{m.quantity} {m.unit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="py-4 border-b border-black/10">
                        <div className="flex">
                            <span className="font-bold w-[100px] shrink-0">Bakım Notu</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="font-normal uppercase flex-1">{cleanNote || 'BELİRTİLMEDİ'}</span>
                        </div>
                    </div>

                    <div className="mt-4 text-[10px] leading-relaxed text-black/80 text-justify">
                        Bu form {workerName} isimli personelimiz tarafından, {formattedDate}-{formattedTime} tarihinde elektronik imza ile imzalanmıştır.
                    </div>

                    <div className="mt-4 flex flex-col">
                        <div className="flex">
                            <span className="font-bold w-[100px] shrink-0">İmzalayan</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="font-normal uppercase flex-1">{customerSignName}</span>
                        </div>
                        
                        <div className="w-full flex flex-col items-center mt-6">
                            {/* 🚀 EKLENDİ: İmza görselinin mobilde patlamaması için Proxy ve crossOrigin */}
                            {job.signature_url ? (
                                <img 
                                    src={getSafeImageUrl(job.signature_url)} 
                                    crossOrigin="anonymous" 
                                    alt="İmza" 
                                    className="max-w-[150px] max-h-[80px] object-contain grayscale mix-blend-multiply" 
                                />
                            ) : (
                                <div className="h-16 w-full"></div>
                            )}
                            <span className="text-[10px] font-medium uppercase tracking-widest mt-4 text-slate-500">{companyName}</span>
                        </div>
                    </div>

                </div>
            </div>
            
        </div>

        <div className="bg-white p-4 sm:p-5 border-t border-slate-200 shrink-0">
            {errorMsg && (
                <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold rounded-xl flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span className="leading-tight">{errorMsg}</span>
                </div>
            )}
            {statusMsg && !errorMsg && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold rounded-xl flex items-center gap-2">
                    {statusMsg === 'Yazdırma Başarılı!' ? <CheckCircle size={16} className="text-emerald-500"/> : <Loader2 size={16} className="animate-spin" />}
                    <span>{statusMsg}</span>
                </div>
            )}

            <div className="flex gap-3">
                <button onClick={onClose} className="w-1/4 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">
                    Kapat
                </button>
                <button 
                    disabled={isConnecting}
                    onClick={handlePrint}
                    className="flex-1 bg-[#1A91D1] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isConnecting ? 'Bağlanıyor...' : 'YAZDIR'}
                </button>
                <button disabled={isConnecting} onClick={handleSharePDF} className="w-1/4 py-3 text-[#1A91D1] font-bold text-sm hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {isConnecting && statusMsg.includes('PDF') ? <Loader2 size={16} className="animate-spin" /> : <><Share2 size={16}/> Paylaş</>}
                </button>
            </div>
        </div>

      </motion.div>
    </div>
  );
}