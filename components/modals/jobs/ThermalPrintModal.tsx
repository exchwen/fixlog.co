'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bluetooth, Loader2, AlertTriangle, Printer, CheckCircle } from 'lucide-react';

interface ThermalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  companyName: string;
}

export default function ThermalPrintModal({ isOpen, onClose, job, companyName }: ThermalPrintModalProps) {
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
    const boldOn = '\x1B\x45\x01'; // Kalın yaz
    const boldOff = '\x1B\x45\x00'; // Kalın yazıyı kapat
    const divider = '--------------------------------\n';

    let txt = init;
    txt += center + boldOn + sanitizeText(companyName) + '\n' + boldOff;
    txt += divider;
    txt += boldOn + 'PERIYODIK BAKIM FISI\n' + boldOff;
    txt += divider;
    txt += left;
    
    txt += 'Is Emri No: #' + job.id + '\n';
    txt += 'Tarih: ' + new Date().toLocaleDateString('tr-TR') + '\n';
    txt += 'Musteri: ' + sanitizeText(job.customer_name || 'Bilinmiyor') + '\n';
    
    const assetName = job.asset_name || (job.details?.assetName) || 'Belirtilmedi';
    if (assetName !== 'Belirtilmedi') {
        txt += 'Varlik: ' + sanitizeText(assetName) + '\n';
    }
    
    txt += divider;
    
    // Periyodik Bakım Form Detayları
    if (job.details) {
        if (job.details.label_color || job.details['Mevcut Etiket']) {
            txt += 'Etiket Rengi: ' + sanitizeText(job.details.label_color || job.details['Mevcut Etiket']) + '\n';
        }
        if (job.details.oil_check || job.details['Ray Yağlama Yapıldı mı?']) {
            txt += 'Ray Yaglama: ' + sanitizeText(job.details.oil_check || job.details['Ray Yağlama Yapıldı mı?']) + '\n';
        }
        if (job.details.brake_check || job.details['Fren Balata Durumu']) {
            txt += 'Fren Balata: ' + sanitizeText(job.details.brake_check || job.details['Fren Balata Durumu']) + '\n';
        }
    }

    txt += divider;
    txt += center + 'Bakim tamamlanmistir.\n';
    txt += 'Bizi tercih ettiginiz icin\n';
    txt += 'tesekkur ederiz.\n';
    txt += '\n\n\n\n'; // Kağıdı koparmak için boşluk bırak

    return new TextEncoder().encode(txt);
  };

  const handlePrint = async () => {
    const nav = navigator as any; // 🚀 TypeScript'i susturan hamle

    // iOS/Safari Bluetooth API desteklemez kontrolü
    if (!nav.bluetooth) {
      setErrorMsg("Tarayıcınız Bluetooth bağlantısını desteklemiyor. iOS kullanıyorsanız App Store'dan 'WebBLE' tarayıcısını indirmelisiniz.");
      return;
    }

    setIsConnecting(true);
    setStatusMsg('Yazıcı aranıyor...');
    setErrorMsg('');

    try {
      let device;
      
      // 🚀 1. ÖNCEKİ BAĞLANTILARI KONTROL ET (OTOMATİK BAĞLANMA)
      if (nav.bluetooth.getDevices) {
        const devices = await nav.bluetooth.getDevices();
        if (devices.length > 0) {
          device = devices[0]; // Listede daha önceden izin verilmiş bir yazıcı varsa, ilkini al
        }
      }

      // 🚀 2. EĞER KAYITLI CİHAZ YOKSA VEYA İLK DEFA GİRİYORSA YENİ CİHAZ SOR
      if (!device) {
        device = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'] 
        });
      }

      setStatusMsg('Yazıcıya bağlanılıyor...');
      const server = await device.gatt?.connect();
      
      if (!server) throw new Error("Bağlantı kurulamadı.");

      // Yazıcı servisini ve karakteristiğini bul
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
      
      // Veriyi küçük paketler halinde (chunk) gönderiyoruz ki yazıcı donmasın
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
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
        onClick={() => !isConnecting && onClose()}
      />
      
      <motion.div 
        initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Printer size={18} className="text-blue-600" /> Fiş Yazdır
            </h3>
            <button disabled={isConnecting} onClick={onClose} className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"><X size={18} /></button>
        </div>

        <div className="p-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center mb-6">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Önizleme (ESC/POS)</div>
                <div className="text-xs font-mono text-slate-700 leading-relaxed">
                    <div>{sanitizeText(companyName)}</div>
                    <div>--------------------------------</div>
                    <div className="font-bold">PERIYODIK BAKIM FISI</div>
                    <div>--------------------------------</div>
                    <div className="text-left mt-2">
                        Tarih: {new Date().toLocaleDateString('tr-TR')} <br/>
                        Musteri: {sanitizeText(job.customer_name || '')} <br/>
                        Etiket: {sanitizeText(job.details?.label_color || job.details?.['Mevcut Etiket'] || 'Belirtilmedi')}
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {statusMsg && !errorMsg && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                    {statusMsg === 'Yazdırma Başarılı!' ? <CheckCircle size={16} className="text-emerald-500"/> : <Loader2 size={16} className="animate-spin" />}
                    <span>{statusMsg}</span>
                </div>
            )}

            <button 
                disabled={isConnecting}
                onClick={handlePrint}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isConnecting ? 'Bağlanıyor...' : <><Bluetooth size={18} /> Bluetooth ile Yazdır</>}
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-3 font-medium px-2">
                Bluetooth bağlantısı açık olduğundan emin olun. Tarayıcınız son yazıcıyı hatırlayacaktır.
            </p>
        </div>
      </motion.div>
    </div>
  );
}