'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Loader2, CheckCircle2, FileSpreadsheet, Bot, ArrowRight, AlertCircle, Download } from 'lucide-react'; // 🚀 Download eklendi
import * as XLSX from 'xlsx'; // 🚀 Müşterinin tarayıcısını sunucu gibi kullanacağız

export default function SmartExcelModal({
  showSmartExcelModal, setShowSmartExcelModal, handleAction
}: any) {
  
  const [step, setStep] = useState(1); // 1: Upload, 2: Fake AI Loading, 3: Mapping, 4: Success
  const [file, setFile] = useState<File | null>(null);
  const [rawExcelData, setRawExcelData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  const [mappings, setMappings] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  // 🚀 İBNELİK 1: Akıllı Sözlük (Müşterinin karmakarışık excel başlıklarını yakalayacak)
  const heuristicDictionary: any = {
      customerName: ['firma', 'müşteri', 'yönetici', 'ad', 'soyisim', 'bina yöneticisi', 'isim'],
      customerPhone: ['tel', 'telefon', 'cep', 'iletişim', 'numara', 'gsm'],
      apartmentName: ['bina', 'apartman', 'tesis', 'site', 'blok', 'yer'],
      customerAddress: ['adres', 'mahalle', 'sokak', 'ilçe', 'il', 'konum', 'adres bilgisi'],
      assetType: ['asansör', 'cihaz', 'tür', 'tip', 'kapasite', 'kps', 'durak', 'cinsi'],
      assetLocation: ['kuyu', 'şube', 'departman', 'kat'],
      assetDetails: ['not', 'detay', 'marka', 'model', 'etiket', 'renk', 'açıklama']
  };

  const targetFields = [
    { id: 'customerName', label: 'Müşteri / Yönetici Adı' },
    { id: 'customerPhone', label: 'İletişim / Telefon' },
    { id: 'apartmentName', label: 'Apartman / Tesis Adı (ÖNEMLİ)' },
    { id: 'customerAddress', label: 'Açık Adres / Konum' },
    { id: 'assetType', label: 'Cihaz / Asansör Türü' },
    { id: 'assetLocation', label: 'Kuyu / Kat Konumu' },
    { id: 'assetDetails', label: 'Ekstra Notlar / Detaylar' }
];

// 🚀 İBNELİK 4: Sunucuya bulaşmadan, adamın kendi RAM'inde Excel yaratıp indirtme
const handleDownloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const templateHeaders = targetFields.map(f => f.label);
    
    // Sektör verine uygun örnek satır (Adamlar nasıl dolduracağını anlasın)
    const exampleRow = [
        "Akdeniz Apartmanı Yönetimi",
        "0555 123 45 67",
        "Akdeniz Apartmanı A Blok",
        "Atatürk Mah. Cumhuriyet Cad. No:1 Kadıköy/İstanbul",
        "Makine Daireli (MR) Yolcu Asansörü", // sector.json'dan çekildi
        "A Blok Sağ Kuyu",
        "Kapasite: 800kg, Etiket: Yeşil"
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([templateHeaders, exampleRow]);
    worksheet['!cols'] = templateHeaders.map(() => ({ wch: 28 })); // Sütunları geniş yap ki şık dursun

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sablon");

    // Anında indir
    XLSX.writeFile(workbook, "IsDokumu_Musteri_ve_Varlik_Sablonu.xlsx");
};

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = e.target.files?.[0];
      if (!uploadedFile) return;
      setFile(uploadedFile);
      processFileLocally(uploadedFile);
  };

  const processFileLocally = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (jsonData.length === 0) {
              alert("Excel dosyası boş görünüyor.");
              return;
          }

          const fileHeaders = Object.keys(jsonData[0] as object);
          setHeaders(fileHeaders);
          setRawExcelData(jsonData);

          // 🚀 KATAKULLİ 2: Sözlük Algoritmasıyla Otomatik Eşleştirme (Sıfır Maliyetli AI)
          let autoMap: any = {};
          fileHeaders.forEach(header => {
              const lowerHeader = header.toLowerCase();
              for (const [targetId, keywords] of Object.entries(heuristicDictionary)) {
                  if ((keywords as string[]).some(kw => lowerHeader.includes(kw))) {
                      if (!Object.values(autoMap).includes(header)) {
                          autoMap[targetId] = header;
                          break; // İlk eşleşeni al
                      }
                  }
              }
          });
          
          setMappings(autoMap);

          // 🚀 İBNELİK 3: Ego okşayıcı Fake Yükleme Ekranı (Adama vay anasını dedirtiyoruz)
          setStep(2);
          setProgress(0);
          const interval = setInterval(() => {
              setProgress((prev) => {
                  if (prev >= 100) {
                      clearInterval(interval);
                      setTimeout(() => setStep(3), 500);
                      return 100;
                  }
                  return prev + Math.floor(Math.random() * 15) + 5; // Rastgele zıplamalar
              });
          }, 300);
      };
      reader.readAsBinaryString(file);
  };

  const handleMappingChange = (targetId: string, headerValue: string) => {
      setMappings({ ...mappings, [targetId]: headerValue });
  };

  const handleImport = async () => {
      setIsSaving(true);
      
      // Müşterinin eşleştirdiği başlıklara göre JSON verisini bizim sistemin diline çeviriyoruz
      const formattedData = rawExcelData.map(row => {
          let cleanRow: any = {};
          targetFields.forEach(field => {
              const excelHeaderName = mappings[field.id];
              cleanRow[field.id] = excelHeaderName ? row[excelHeaderName] : "";
          });
          return cleanRow;
      });

      // API'ye gönder
      const success = await handleAction('bulk-import', { items: formattedData });
      
      if (success !== false) {
          setStep(4); // Başarı Ekranı
      } else {
          setIsSaving(false);
      }
  };

  const handleClose = () => {
      setShowSmartExcelModal(false);
      setTimeout(() => {
          setStep(1); setFile(null); setRawExcelData([]); setHeaders([]); setMappings({}); setIsSaving(false);
      }, 300);
  };

  const autoMappedCount = Object.keys(mappings).length;

  return (
    <AnimatePresence>
      {showSmartExcelModal && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center p-4 z-[150]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm cursor-pointer" onClick={() => !isSaving && handleClose()} />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
               <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                       <Bot size={22} />
                   </div>
                   <div>
                       <h2 className="text-lg font-black text-slate-800 tracking-tight">Akıllı Excel Asistanı</h2>
                       <div className="text-xs font-bold text-slate-500">Yapay zeka destekli veri içe aktarım aracı</div>
                   </div>
               </div>
               {!isSaving && step !== 2 && (
                   <button onClick={handleClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-all">
                      <X size={20} />
                   </button>
               )}
            </div>

            {/* BODY */}
            <div className="p-6">
                
                {/* STEP 1: UPLOAD */}
                {step === 1 && (
                    <div className="flex flex-col items-center justify-center text-center">
                        <input type="file" accept=".xlsx, .xls, .csv" id="excel-upload" className="hidden" onChange={handleFileUpload} />
                        <label htmlFor="excel-upload" className="w-full cursor-pointer group">
                            <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-10 transition-all flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet size={32} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-700">Excel Dosyanızı Buraya Yükleyin</h3>
                                    <p className="text-xs font-medium text-slate-500 mt-2 max-w-sm mx-auto">
                                        Şablon kullanmanıza gerek yok. Kendi dağınık listenizi atın, akıllı asistanımız başlıkları otomatik anlasın ve düzenlesin.
                                    </p>
                                </div>
                                <div className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md group-hover:bg-emerald-700 mt-2">
                                    Dosya Seç
                                </div>
                            </div>
                        </label>

                        {/* 🚀 EKLENDİ: Şablon İndirme Alanı */}
                        <div className="mt-6 flex flex-col items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">veya boş format kullanın</span>
                            <button 
                                onClick={handleDownloadTemplate}
                                className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-all active:scale-95 border border-blue-200 shadow-sm"
                            >
                                <Download size={16} /> Örnek Şablonu İndir
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: FAKE AI LOADING */}
                {step === 2 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-emerald-100 rounded-full"></div>
                            <div className="w-20 h-20 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
                            <Bot size={32} className="text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Yapay Zeka Analiz Ediyor...</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Sütunlar okunuyor ve veritabanıyla eşleştiriliyor.</p>
                        </div>
                        <div className="w-full max-w-md bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {/* STEP 3: MAPPING (EGO BOOST + SORUMLULUK REDDİ) */}
                {step === 3 && (
                    <div className="space-y-5">
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                            <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-black text-blue-800">Analiz Tamamlandı!</h4>
                                <p className="text-xs font-medium text-blue-600 mt-1">
                                    Asistanımız <span className="font-black">{rawExcelData.length} adet</span> asansör kaydı buldu ve <span className="font-black">{autoMappedCount} sütunu</span> otomatik eşleştirdi.
                                </p>
                            </div>
                        </div>

                        {/* 🚀 KATAKULLİ: Sorumluluk Reddi (Disclaimer) Uyarı Kutusu */}
                        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5">
                            <Bot size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-semibold text-amber-700 leading-relaxed">
                                <span className="font-black">DİKKAT:</span> Yapay zeka sistemimiz başlıkları en yüksek doğrulukla tahmin etse de <span className="underline decoration-amber-300">karmaşık Excel dosyalarında hata payı olabilir.</span> Verilerin sisteme yanlış geçmemesi için lütfen aşağıdaki eşleşmeleri son kez gözden geçirin. Sorumluluk kullanıcıya aittir.
                            </p>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                            {targetFields.map(field => {
                                const isMapped = !!mappings[field.id];
                                return (
                                    <div key={field.id} className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${isMapped ? 'bg-white border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                                        <div className="text-xs font-bold text-slate-700 w-1/3 shrink-0 flex items-center gap-2">
                                            {isMapped ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-2 h-2 rounded-full bg-rose-500 ml-1"></div>}
                                            {field.label}
                                        </div>
                                        <div className="hidden sm:block text-slate-300"><ArrowRight size={16} /></div>
                                        <select 
                                            className={`w-full sm:w-1/2 px-3 py-2 text-xs font-semibold outline-none rounded-lg border transition-all ${isMapped ? 'border-slate-200 bg-slate-50 focus:border-emerald-500' : 'border-rose-300 bg-white focus:border-rose-500 ring-2 ring-rose-500/20'}`}
                                            value={mappings[field.id] || ""}
                                            onChange={(e) => handleMappingChange(field.id, e.target.value)}
                                        >
                                            <option value="">-- Bu sütunu yoksay --</option>
                                            {headers.map(h => (
                                                <option key={h} value={h}>{h} (Excel Sütunu)</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>

                        <button 
                            disabled={isSaving || !mappings['apartmentName']} // Apartman adı mecburi
                            onClick={handleImport}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><UploadCloud size={18} /> Onaylıyorum, Sistemi Başlat</>}
                        </button>
                        {!mappings['apartmentName'] && <p className="text-[10px] text-center text-rose-500 font-bold mt-1">Sistemin çalışması için "Apartman / Tesis Adı" sütununu eşleştirmeniz zorunludur.</p>}
                    </div>
                )}

                {/* STEP 4: SUCCESS */}
                {step === 4 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Operasyon Başarılı!</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm mx-auto">
                                Tüm veriler başarıyla arka planda ayrıştırıldı, müşteriler yaratıldı ve varlıklar onlara bağlandı. Sistem artık kullanıma hazır.
                            </p>
                        </div>
                        <button onClick={() => { handleClose(); if(handleAction) window.location.reload(); }} className="mt-4 px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-95">
                            Listeye Geri Dön
                        </button>
                    </div>
                )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}