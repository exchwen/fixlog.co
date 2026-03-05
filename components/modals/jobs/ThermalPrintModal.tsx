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
    
    // 🚀 DİNAMİK FORM DETAYLARI (TÜM SEKTÖRLER İÇİN OTOMATİK ÇALIŞIR)
    if (job.details) {
        const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName'];
        const formEntries = Object.entries(job.details).filter(([k]) => !excludeKeys.includes(k));
        
        if (formEntries.length > 0) {
            formEntries.forEach(([key, value]) => {
                // Anahtarı ve değeri termal yazıcıya uygun (ASCII) hale getiriyoruz
                // Termal kağıt (58mm) dar olduğu için başlıklar 14 karakterden uzunsa kısaltıyoruz ki yan yana sığsın
                let cleanKey = sanitizeText(key);
                if (cleanKey.length > 14) cleanKey = cleanKey.substring(0, 14) + '.'; 
                
                txt += cleanKey + ': ' + sanitizeText(String(value)) + '\n';
            });
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
        className="bg-slate-100 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0 shadow-sm z-20">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Printer size={18} className="text-blue-600" /> Fiş Önizleme
            </h3>
            <button disabled={isConnecting} onClick={onClose} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative flex flex-col items-center">
            
            {/* 🚀 ŞIK PDF / FİŞ GÖRÜNÜMÜ BAŞLANGICI */}
            <div className="w-full max-w-[300px] bg-white text-slate-900 mx-auto shadow-md relative overflow-hidden flex flex-col" style={{
                // Fişin altındaki yırtık kağıt (zikzak) efekti için CSS
                maskImage: 'radial-gradient(circle at 4px bottom, transparent 4px, black 4.5px)',
                maskSize: '12px 100%',
                maskRepeat: 'repeat-x',
                paddingBottom: '20px'
            }}>
                <div className="p-6 pt-8 flex flex-col gap-4 text-[13px] font-mono leading-relaxed relative z-10">
                    
                    {/* Başlık ve Şirket */}
                    <div className="text-center space-y-1">
                        <div className="font-black text-lg tracking-wider uppercase">{sanitizeText(companyName)}</div>
                        <div className="text-[10px] text-slate-500 tracking-widest border-b border-dashed border-slate-300 pb-4 mb-4">
                            PERİYODİK BAKIM FİŞİ
                        </div>
                    </div>

                    {/* Müşteri ve Temel Bilgiler */}
                    <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-4">
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">İş Emri No:</span>
                            <span className="font-bold">#{job.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Tarih:</span>
                            <span className="font-bold">{new Date().toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Müşteri:</span>
                            <span className="font-bold text-right max-w-[150px] truncate">{sanitizeText(job.customer_name || 'Bilinmiyor')}</span>
                        </div>
                        {(() => {
                            const assetName = job.asset_name || (job.details?.assetName) || 'Belirtilmedi';
                            if (assetName !== 'Belirtilmedi') {
                                return (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Varlık:</span>
                                        <span className="font-bold text-right max-w-[150px] truncate">{sanitizeText(assetName)}</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    {/* Form Detayları (Dinamik) */}
                    {(() => {
                        if (!job.details) return null;
                        const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName'];
                        const formEntries = Object.entries(job.details).filter(([k]) => !excludeKeys.includes(k));
                        
                        if (formEntries.length === 0) return null;
                        
                        return (
                            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-4">
                                {formEntries.map(([key, value]) => {
                                    let cleanKey = sanitizeText(key);
                                    if (cleanKey.length > 14) cleanKey = cleanKey.substring(0, 14) + '.'; 
                                    return (
                                        <div key={key} className="flex justify-between gap-4">
                                            <span className="text-slate-500 font-medium whitespace-nowrap">{cleanKey}:</span>
                                            <span className="font-bold text-right break-words">{sanitizeText(String(value))}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    {/* Alt Bilgi */}
                    <div className="text-center mt-2 space-y-1">
                        <div className="font-bold">Bakım tamamlanmıştır.</div>
                        <div className="text-[10px] text-slate-500">Bizi tercih ettiğiniz için<br/>teşekkür ederiz.</div>
                    </div>
                </div>

                {/* Fişin üst kısımdaki hafif gölgesi */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-black/5 to-transparent pointer-events-none"></div>
            </div>
            {/* 🚀 ŞIK PDF / FİŞ GÖRÜNÜMÜ BİTİŞİ */}

            <div className="w-full mt-6 space-y-4">
                {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-start gap-2 shadow-sm">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {statusMsg && !errorMsg && (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm">
                        {statusMsg === 'Yazdırma Başarılı!' ? <CheckCircle size={16} className="text-emerald-500"/> : <Loader2 size={16} className="animate-spin" />}
                        <span>{statusMsg}</span>
                    </div>
                )}

                <button 
                    disabled={isConnecting}
                    onClick={handlePrint}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm shadow-lg hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isConnecting ? 'Bağlanıyor...' : <><Bluetooth size={20} /> Yazıcıya Gönder</>}
                </button>
                <p className="text-[10px] text-center text-slate-400 font-medium px-4">
                    Bluetooth bağlantısı açık olduğundan emin olun. Tarayıcınız son yazıcıyı hatırlayacaktır.
                </p>
            </div>
        </div>
      </motion.div>
    </div>
  );
}