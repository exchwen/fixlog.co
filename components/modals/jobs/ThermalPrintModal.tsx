'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bluetooth, Loader2, AlertTriangle, Printer, CheckCircle, CheckSquare } from 'lucide-react';

interface ThermalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  companyName: string;
  companyLogo?: string; // 🚀 EKLENDİ: Dinamik Logo İçin
}

export default function ThermalPrintModal({ isOpen, onClose, job, companyName, companyLogo }: ThermalPrintModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !job) return null;

  // ESC/POS Termal yazıcılar Türkçe karakterleri bazen "?" olarak basar. Bu yüzden karakterleri güvenli ASCII formatına çeviriyoruz.
  const sanitizeText = (text: string) => {
    if (!text) return '';
    return text.replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
               .replace(/ü/g, 'u').replace(/Ü/g, 'U')
               .replace(/ş/g, 's').replace(/Ş/g, 'S')
               .replace(/ı/g, 'i').replace(/İ/g, 'I')
               .replace(/ö/g, 'o').replace(/Ö/g, 'O')
               .replace(/ç/g, 'c').replace(/Ç/g, 'C');
  };

  const buildReceipt = () => {
    // Standart ESC/POS Komutları
    const init = '\x1B\x40'; // Yazıcıyı sıfırla
    const center = '\x1B\x61\x01'; // Ortala
    const left = '\x1B\x61\x00'; // Sola yasla
    const right = '\x1B\x61\x02'; // Sağa yasla
    const boldOn = '\x1B\x45\x01'; // Kalın yaz
    const boldOff = '\x1B\x45\x00'; // Kalın yazıyı kapat
    const divider = '--------------------------------\n';

    let txt = init;
    
    // BAŞLIK BÖLÜMÜ
    txt += center + boldOn + sanitizeText(companyName) + '\n' + boldOff;
    txt += boldOn + 'Bakim Fisi\n' + boldOff;
    txt += divider;
    txt += left;
    
    // ÜST BİLGİLER
    const assetName = job.asset_name || (job.details?.assetName) || job.customer_name;
    const formattedDate = new Date(job.created_at || Date.now()).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    
    txt += 'Fis Numarasi : ' + job.id + '\n';
    txt += 'Tarih        : ' + formattedDate + '\n';
    txt += 'Tesis Adi    : ' + sanitizeText(assetName) + '\n';
    
    txt += divider;
    
    // DİNAMİK FORM DETAYLARI (Checklist Kutucuklu Görünüm)
    if (job.details) {
        const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName', 'usedMaterials'];
        const formEntries = Object.entries(job.details).filter(([k]) => !excludeKeys.includes(k));
        
        if (formEntries.length > 0) {
            formEntries.forEach(([key, value]) => {
                let cleanKey = sanitizeText(key);
                // Kağıda sığması için metni kısaltıyoruz
                if (cleanKey.length > 24) cleanKey = cleanKey.substring(0, 24);
                
                // Sağ tarafa kutucuk [X] veya değer atama
                const paddedKey = cleanKey.padEnd(25, ' ');
                const valStr = String(value).toLowerCase();
                // Eğer usta formda "Evet, Var, Sorunsuz, Uygun" gibi şeyler seçtiyse tik koy, yoksa değerin kendisini yaz
                const isChecked = ['evet', 'var', 'true', 'ok', 'uygun', 'sorunsuz'].includes(valStr) ? '[X]' : sanitizeText(String(value).substring(0, 5));
                
                txt += paddedKey + ': ' + isChecked + '\n';
            });
            txt += divider;
        }
    }

    // KULLANILAN MALZEMELER (Stok)
    if (job.details?.usedMaterials && job.details.usedMaterials.length > 0) {
        txt += boldOn + 'Kullanilan Malzemeler:\n' + boldOff;
        job.details.usedMaterials.forEach((m: any) => {
            txt += `- ${sanitizeText(m.name)} (${m.quantity} ${sanitizeText(m.unit)})\n`;
        });
        txt += divider;
    }

    // BAKIM NOTU
    const note = job.details?.note || job.taskNote;
    if (note) {
        txt += boldOn + 'Bakim Notu: \n' + boldOff + sanitizeText(note) + '\n';
        txt += divider;
    }

    // ALT BİLGİ VE İMZA ONAYI
    const workerName = job.lastEditedBy || job.worker_name || 'Personel';
    txt += `Bu form ${sanitizeText(workerName)} isimli\n`;
    txt += `personelimiz tarafindan,\n`;
    txt += `${formattedDate} tarihinde\n`;
    txt += `elektronik imza ile imzalanmistir.\n\n`;

    const customerSignName = job.customer_signature_name || 'Musteri/Yetkili';
    txt += boldOn + `Imzalayan : ` + boldOff + sanitizeText(customerSignName) + `\n`;
    
    // Fiziksel kağıtta imza için boşluk bırak
    txt += `Imza      : \n\n\n\n`; 
    
    txt += center + sanitizeText(companyName) + '\n';
    txt += '\n\n\n\n\n'; // Kağıdı rahat koparmak için ekstra boşluk

    return new TextEncoder().encode(txt);
  };

  const handlePrint = async () => {
    const nav = navigator as any; // 🚀 TypeScript'i susturan hamle

    if (!nav.bluetooth) {
      setErrorMsg("Tarayıcınız Bluetooth bağlantısını desteklemiyor. iOS kullanıyorsanız App Store'dan 'WebBLE' tarayıcısını indirmelisiniz.");
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
        throw new Error("Yazılabilir servis bulunamadı. Cihaz uyumsuz olabilir.");
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

  // Dinamik formları ayıklama
  const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName', 'usedMaterials'];
  const formEntries = job.details ? Object.entries(job.details).filter(([k]) => !excludeKeys.includes(k)) : [];
  
  const workerName = job.lastEditedBy || job.worker_name || 'Personel';
  const customerSignName = job.customer_signature_name || 'Müşteri / Yetkili';
  const assetName = job.asset_name || (job.details?.assetName) || job.customer_name;
  const formattedDate = new Date(job.created_at || Date.now()).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm cursor-pointer"
        onClick={() => !isConnecting && onClose()}
      />
      
      <motion.div 
        initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-slate-100 w-full md:max-w-lg h-full md:h-auto md:max-h-[95vh] md:rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0 shadow-sm z-20">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                <Printer size={20} className="text-slate-600" /> Rapor Önizleme
            </h3>
            <button disabled={isConnecting} onClick={onClose} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50 active:scale-95"><X size={20} /></button>
        </div>

        {/* 🚀 DİJİTAL FİŞ / PDF GÖRÜNÜMÜ */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 relative flex flex-col items-center bg-slate-200">
            
            <div className="w-full max-w-[400px] bg-white text-black mx-auto shadow-xl relative overflow-hidden flex flex-col rounded-t-sm" style={{
                // Fişin altındaki yırtık kağıt (zikzak) efekti
                maskImage: 'radial-gradient(circle at 6px bottom, transparent 6px, black 6.5px)',
                maskSize: '18px 100%',
                maskRepeat: 'repeat-x',
                paddingBottom: '24px'
            }}>
                <div className="p-6 sm:p-8 flex flex-col gap-4 text-[13px] font-sans leading-relaxed relative z-10">
                    
                    {/* LOGO VE BAŞLIK */}
                    <div className="flex flex-col items-center justify-center mb-2 border-b-2 border-black pb-4">
                        {companyLogo ? (
                            <img src={companyLogo} alt="Logo" className="max-h-16 object-contain mb-3 grayscale contrast-125 brightness-95 mix-blend-multiply" />
                        ) : (
                            <div className="font-black text-2xl tracking-widest uppercase mb-2">{companyName}</div>
                        )}
                        <h2 className="text-lg font-black tracking-widest uppercase">Bakım Fişi</h2>
                    </div>

                    {/* META BİLGİLER */}
                    <div className="space-y-2 border-b border-black/20 pb-4 text-sm">
                        <div className="flex">
                            <span className="font-bold w-32 shrink-0">Fiş Numarası</span>
                            <span className="font-semibold">: {job.id}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold w-32 shrink-0">Tarih</span>
                            <span className="font-semibold">: {formattedDate}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold w-32 shrink-0">Tesis Adı</span>
                            <span className="font-semibold uppercase">: {assetName}</span>
                        </div>
                    </div>

                    {/* DİNAMİK LİSTE (CHECKLIST) */}
                    {formEntries.length > 0 && (
                        <div className="space-y-3 pt-2">
                            {formEntries.map(([key, value], idx) => {
                                const valStr = String(value).toLowerCase();
                                const isChecked = ['evet', 'var', 'true', 'ok', 'uygun', 'sorunsuz'].includes(valStr);
                                
                                return (
                                    <div key={idx} className="flex justify-between items-center border-b border-black/10 pb-2 gap-4">
                                        <span className="font-semibold text-xs leading-snug pr-4">{key}</span>
                                        <div className="shrink-0 flex items-center justify-center">
                                            {isChecked ? (
                                                <div className="w-5 h-5 border-[1.5px] border-black rounded flex items-center justify-center bg-black/5">
                                                    <CheckSquare size={16} strokeWidth={3} className="text-black" />
                                                </div>
                                            ) : (
                                                <span className="font-bold text-xs uppercase">{String(value)}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* KULLANILAN MALZEMELER */}
                    {job.details?.usedMaterials && job.details.usedMaterials.length > 0 && (
                        <div className="mt-4 pt-4 border-t-2 border-black/20">
                            <div className="font-black mb-2 text-sm uppercase">Kullanılan Malzemeler</div>
                            <div className="space-y-1 text-xs font-semibold">
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
                    <div className="mt-2 pt-4 border-t-2 border-black/20">
                        <div className="flex items-start gap-4">
                            <span className="font-black w-24 shrink-0 text-sm">Bakım Notu</span>
                            <span className="font-semibold text-sm uppercase">: {job.details?.note || job.taskNote || 'Belirtilmedi'}</span>
                        </div>
                    </div>

                    {/* ONAY VE İMZA ALANI */}
                    <div className="mt-6 pt-4 border-t border-black/20 text-[11px] font-medium text-black/80 text-justify leading-relaxed">
                        Bu form {workerName} isimli personelimiz tarafından, {formattedDate} tarihinde elektronik imza ile imzalanmıştır.
                    </div>

                    <div className="mt-6 flex flex-col items-start w-full">
                        <div className="flex w-full mb-2">
                            <span className="font-black w-24 shrink-0 text-sm">İmzalayan</span>
                            <span className="font-bold text-sm uppercase">: {customerSignName}</span>
                        </div>
                        
                        <div className="w-full flex flex-col items-center justify-center mt-4">
                            {job.signature_url ? (
                                <img src={job.signature_url} alt="Müşteri İmzası" className="max-w-[200px] max-h-[120px] object-contain grayscale contrast-200 brightness-95 mix-blend-multiply" />
                            ) : (
                                <div className="h-20 w-full border-b border-dashed border-black/30"></div>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest mt-2">{companyName}</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* SABİT BUTON ALANI (TELEFONLAR İÇİN) */}
            <div className="w-full max-w-[400px] mx-auto mt-6 mb-4 space-y-4">
                {errorMsg && (
                    <div className="p-4 bg-white border-l-4 border-rose-500 text-rose-600 text-xs font-bold rounded-r-xl flex items-start gap-3 shadow-sm">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{errorMsg}</span>
                    </div>
                )}

                {statusMsg && !errorMsg && (
                    <div className="p-4 bg-white border-l-4 border-blue-500 text-blue-700 text-xs font-bold rounded-r-xl flex items-center gap-3 shadow-sm">
                        {statusMsg === 'Yazdırma Başarılı!' ? <CheckCircle size={18} className="text-emerald-500"/> : <Loader2 size={18} className="animate-spin" />}
                        <span className="leading-relaxed">{statusMsg}</span>
                    </div>
                )}

                <button 
                    disabled={isConnecting}
                    onClick={handlePrint}
                    className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-2xl font-black text-sm shadow-xl hover:bg-black hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    {isConnecting ? 'Bağlantı Kuruluyor...' : <><Printer size={20} /> Yazdır (Bluetooth)</>}
                </button>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 font-bold text-xs py-3.5 rounded-xl hover:bg-slate-50 transition-colors active:scale-95">İptal</button>
                    {/* Paylaş özelliği istenirse buraya eklenebilir */}
                    <button onClick={() => alert("PDF Paylaşma özelliği yakında eklenecektir.")} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 font-bold text-xs py-3.5 rounded-xl hover:bg-slate-50 transition-colors active:scale-95 text-center">Paylaş</button>
                </div>
            </div>

        </div>
      </motion.div>
    </div>
  );
}