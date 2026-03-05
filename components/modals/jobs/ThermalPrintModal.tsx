'use client';

import React, { useState } from 'react';
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

  if (!isOpen || !job) return null;

  // ESC/POS Termal yazıcılar Türkçe karakterleri bazen "?" olarak basar.
  const sanitizeText = (text: string) => {
    if (!text) return '';
    return text.replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
               .replace(/ü/g, 'u').replace(/Ü/g, 'U')
               .replace(/ş/g, 's').replace(/Ş/g, 'S')
               .replace(/ı/g, 'i').replace(/İ/g, 'I')
               .replace(/ö/g, 'o').replace(/Ö/g, 'O')
               .replace(/ç/g, 'c').replace(/Ç/g, 'C');
  };

  // 🚀 HAYAT KURTARAN FONKSİYON: Çorba olan metni parçalayıp listeye çevirir
  const parseJobData = () => {
    let rawNote = job.details?.note || job.taskNote || '';
    let extractedChecklist: { key: string, val: string }[] = [];
    let cleanNote = '';

    // Eğer veri daha önce birleştirilip "note" içine gömüldüyse onu ayıkla
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
                // Form maddesi (Örn: "Kuyu Alt Boşluğu: Uygun")
                const [key, ...valArr] = line.split(':');
                extractedChecklist.push({ key: key.trim(), val: valArr.join(':').trim() });
            } else if (!inForm && line.trim() !== '') {
                // Kalanlar gerçek bakım notudur
                cleanNote += line + '\n';
            }
        }
    } else {
        cleanNote = rawNote;
        // Eğer veritabanından form alanları ayrı ayrı geldiyse (details içinde objeyse)
        if (job.details) {
            const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName', 'usedMaterials'];
            Object.entries(job.details).forEach(([k, v]) => {
                if (!excludeKeys.includes(k) && typeof v === 'string') {
                    extractedChecklist.push({ key: k, val: v });
                }
            });
        }
    }

    // Gps notunu veya "Usta Notu:" etiketini temizleyelim
    cleanNote = cleanNote.replace(/\[Usta Notu\]:/g, '').replace(/\[📍 Konum Kaydı\].*/g, '').trim();

    return { extractedChecklist, cleanNote };
  };

  const { extractedChecklist, cleanNote } = parseJobData();
  const workerName = job.lastEditedBy || job.worker_name || 'Personel';
  const customerSignName = job.customer_signature_name || 'Müşteri / Yetkili';
  
  // 🚀 Apartman Adı ve Varlık Türü Birleştirme (Örn: "Güneş Apt. - Asansör 1")
  const asset = assets?.find(a => String(a.id) === String(job.asset_id));
  const assetName = asset ? `${asset.apartmentName || ''} - ${asset.name || ''}`.replace(/^- |-$/g, '').trim() : (job.asset_name || job.details?.assetName || job.customer_name);
  
  // Tarih Formatlama
  let formattedDate = new Date().toLocaleDateString('tr-TR');
  let formattedTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' });
  if (job.created_at) {
      const d = new Date(job.created_at);
      formattedDate = d.toLocaleDateString('tr-TR');
      formattedTime = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' });
  }

  // 🖨️ TERMAL YAZICI İÇİN ESC/POS OLUŞTURMA
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
    
    txt += divider;
    
    // Checkbox Listesini Termal Yazıcıya Basma
    if (extractedChecklist.length > 0) {
        extractedChecklist.forEach((item) => {
            let cleanKey = sanitizeText(item.key);
            if (cleanKey.length > 25) cleanKey = cleanKey.substring(0, 25);
            
            const paddedKey = cleanKey.padEnd(26, ' ');
            const valStr = item.val.toLowerCase();
            const isChecked = ['evet', 'var', 'true', 'ok', 'uygun', 'sorunsuz', 'mavi', 'yeşil'].some(v => valStr.includes(v)) ? '[X]' : '[ ]';
            
            txt += paddedKey + isChecked + '\n';
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

        // Kaliteyi artırmak için scale: 3 yapıyoruz
        const canvas = await html2canvas(receiptElement, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Termal fiş boyutlarına (80mm genişlik) sadık kalarak dikey PDF oluştur
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [canvas.width * 0.264583, canvas.height * 0.264583] });
        pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], `Bakim_Fisi_${job.id}.pdf`, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            setStatusMsg('Paylaşım ekranı açılıyor...');
            await navigator.share({
                title: `Bakım Fişi #${job.id}`,
                text: `${companyName} bakım işlemi tamamlanmıştır. Fişinizi ekte bulabilirsiniz.`,
                files: [file]
            });
            setStatusMsg('İşlem Başarılı!');
        } else {
            // Cihaz dosya paylaşımını desteklemiyorsa düz metin olarak WhatsApp at
            const waText = `*${companyName}*\n*Bakım Fişi #${job.id}*\n\nBakım işleminiz tamamlanmıştır.\n\n_Detaylar için web uygulamamızı ziyaret edin._`;
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

        {/* 🚀 EKRAN ÖNİZLEMESİ (ELF ASANSÖR TASARIMI) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-6 bg-slate-200">
            
            <div id="receipt-preview" className="w-full max-w-[380px] bg-white text-black mx-auto shadow-md relative" style={{
                paddingBottom: '24px',
                minHeight: '400px'
            }}>
                <div className="p-5 sm:p-8 flex flex-col text-[12px] font-sans relative z-10">
                    
                    {/* LOGO VE BAŞLIK */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        {companyLogo ? (
                            <img src={companyLogo} alt="Logo" className="max-h-16 object-contain mb-1 grayscale" />
                        ) : (
                            <div className="font-black text-3xl tracking-tighter mb-1 lowercase">{companyName.substring(0, 3)}<span className="text-slate-400">f</span></div>
                        )}
                        <div className="font-bold text-sm uppercase tracking-widest">{companyName}</div>
                        <h2 className="text-base font-bold mt-3">Bakım fişi</h2>
                    </div>

                    {/* FİŞ BİLGİLERİ (HİZALI) */}
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
                    </div>

                    {/* ONAY LİSTESİ (CHECKBOX'LI) */}
                    {extractedChecklist.length > 0 && (
                        <div className="border-t border-black/20 pt-2 pb-2">
                            {extractedChecklist.map((item, idx) => {
                                const valStr = item.val.toLowerCase();
                                const isChecked = ['evet', 'var', 'true', 'ok', 'uygun', 'sorunsuz', 'mavi', 'yeşil'].some(v => valStr.includes(v));
                                
                                return (
                                    <div key={idx} className="flex justify-between items-end border-b border-black/10 py-2.5">
                                        <div className="flex flex-col pr-4">
                                            <span className="font-semibold text-[11px] leading-tight text-slate-800">{item.key}</span>
                                            {/* Altında sahte küçük ikonlar veya value metni */}
                                            <span className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase">{item.val}</span>
                                        </div>
                                        <div className="shrink-0 pb-0.5">
                                            {isChecked ? (
                                                <div className="w-4 h-4 bg-black flex items-center justify-center rounded-sm">
                                                    <CheckSquare size={14} className="text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-4 h-4 border-2 border-black rounded-sm"></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* KULLANILAN MALZEMELER */}
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

                    {/* BAKIM NOTU */}
                    <div className="py-4 border-b border-black/10">
                        <div className="flex">
                            <span className="font-bold w-[100px] shrink-0">Bakım Notu</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="font-normal uppercase flex-1">{cleanNote || 'BELİRTİLMEDİ'}</span>
                        </div>
                    </div>

                    {/* İMZA BÖLÜMÜ */}
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
                            {job.signature_url ? (
                                <img src={job.signature_url} alt="İmza" className="max-w-[150px] max-h-[80px] object-contain grayscale mix-blend-multiply" />
                            ) : (
                                <div className="h-16 w-full"></div>
                            )}
                            <span className="text-[10px] font-medium uppercase tracking-widest mt-4 text-slate-500">{companyName}</span>
                        </div>
                    </div>

                </div>
            </div>
            
        </div>

        {/* 🚀 SABİT ALT BUTONLAR (Mavi tonlarda ve şık) */}
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