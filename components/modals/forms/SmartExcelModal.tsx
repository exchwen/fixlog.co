'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Loader2, CheckCircle2, FileSpreadsheet, Bot, ArrowRight, AlertCircle, Download, FileWarning } from 'lucide-react'; 
import * as XLSX from 'xlsx'; 
import sectorsData from '@/lib/data/sectors.json'; 
import trCitiesData from '@/lib/data/tr-cities.json'; 

const CITY_DATA: any = trCitiesData;
const citiesList = Object.keys(CITY_DATA);

export default function SmartExcelModal({
  showSmartExcelModal, setShowSmartExcelModal, handleAction
}: any) {
  
  const [step, setStep] = useState(1); 
  const [file, setFile] = useState<File | null>(null);
  const [rawExcelData, setRawExcelData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  const [mappings, setMappings] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const [uploadMode, setUploadMode] = useState<string | null>(null);
  const [isTemplateMatch, setIsTemplateMatch] = useState<boolean>(true);
  const [importError, setImportError] = useState<string | null>(null); 
  
  const [draftData, setDraftData] = useState<any[]>([]);
  const [draftTab, setDraftTab] = useState<'valid' | 'invalid'>('invalid'); 

  const [isDragging, setIsDragging] = useState(false);

  const assetTypesList = sectorsData.sectors["Asansör Bakım & Montaj"].assetTypes;

  const heuristicDictionary: any = {
    apartmentName: ['bina', 'apartman', 'tesis', 'site', 'blok', 'yer'],
    assetType: ['asansör', 'cihaz', 'tür', 'tip', 'cinsi'],
    district: ['ilçe'],
    city: ['il', 'şehir'],
    streetDetail: ['adres', 'mahalle', 'sokak', 'cadde'],
    buildingNo: ['kapı', 'bina no', 'numara'],
    assetDetails: ['not', 'detay', 'marka', 'model', 'etiket', 'kapasite', 'durak', 'kps'],
    maintenancePeriod: ['periyot', 'bakım süresi', 'gün'],
    maintenanceFee: ['ücret', 'fiyat', 'tutar', '₺', 'tl'],
    customerName: ['firma', 'müşteri', 'yönetici', 'ad', 'soyisim', 'isim'],
    customerPhone: ['tel', 'telefon', 'cep', 'iletişim', 'gsm'],
    taxInfo: ['vergi', 'tc', 't.c.', 'v.d.', 'vd']
};

const targetFields = [
  { id: 'apartmentName', label: 'Bina / Apartman Adı', excelHeader: 'Bina / Apartman Adı' },
  { id: 'assetType', label: 'Varlık (Cihaz) Türü', excelHeader: 'Varlık (Cihaz) Türü' },
  { id: 'city', label: 'İl', excelHeader: 'İl' },
  { id: 'district', label: 'İlçe', excelHeader: 'İlçe' },
  { id: 'streetDetail', label: 'Mahalle / Cadde / Sokak (ZORUNLU)', excelHeader: 'Mahalle / Cadde / Sokak' },
  { id: 'buildingNo', label: 'Bina / Kapı No', excelHeader: 'Bina / Kapı No' },
  { id: 'assetDetails', label: 'Cihaz Detayları (Kapasite, Durak, Marka vb.)', excelHeader: 'Cihaz Detayları (Kapasite, Durak, Marka vb.)' },
  { id: 'maintenancePeriod', label: 'Bakım Periyodu (Gün)', excelHeader: 'Bakım Periyodu (Gün)' },
  { id: 'maintenanceFee', label: 'Bakım Ücreti (₺)', excelHeader: 'Bakım Ücreti (₺)' },
  { id: 'customerName', label: 'Müşteri / Yönetici Adı', excelHeader: 'Müşteri / Yönetici Adı' },
  { id: 'customerPhone', label: 'İletişim / Telefon', excelHeader: 'İletişim / Telefon' },
  { id: 'taxInfo', label: 'Vergi No / T.C. Kimlik', excelHeader: 'Vergi No / T.C.\nKimlik' }
];

const handleDownloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const fileUrl = '/Fixlog_Akilli_Excel_Sablonu.xlsx';
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', 'Fixlog_Akilli_Excel_Sablonu.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = e.target.files?.[0];
      if (!uploadedFile) return;
      setFile(uploadedFile);
      processFileLocally(uploadedFile);
  };

  // 🚀 Sürükle - Bırak (Drag & Drop) Olayları
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (!droppedFile) return;
      setFile(droppedFile);
      processFileLocally(droppedFile);
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

          const normalizeString = (str: string) => str.replace(/\s+/g, '').toLowerCase();
          const normalizedFileHeaders = fileHeaders.map(normalizeString);

          const isMatch = targetFields.every(field => 
              normalizedFileHeaders.includes(normalizeString(field.excelHeader))
          );
          setIsTemplateMatch(isMatch);

          let autoMap: any = {};

          if (isMatch) {
              targetFields.forEach(field => {
                  const matchedHeader = fileHeaders.find(h => normalizeString(h) === normalizeString(field.excelHeader));
                  if (matchedHeader) autoMap[field.id] = matchedHeader;
              });
          } else {
              fileHeaders.forEach(header => {
                  const lowerHeader = header.toLowerCase();
                  for (const [targetId, keywords] of Object.entries(heuristicDictionary)) {
                      if ((keywords as string[]).some(kw => lowerHeader.includes(kw))) {
                          if (!Object.values(autoMap).includes(header)) {
                              autoMap[targetId] = header;
                              break;
                          }
                      }
                  }
              });
          }
          
          setMappings(autoMap);

          setStep(2);
          setProgress(0);
          const interval = setInterval(() => {
              setProgress((prev) => {
                  if (prev >= 100) {
                      clearInterval(interval);
                      setTimeout(() => setStep(3), 500);
                      return 100;
                  }
                  return prev + Math.floor(Math.random() * 15) + 5;
              });
          }, 300);
      };
      reader.readAsBinaryString(file);
  };

  const handleMappingChange = (targetId: string, headerValue: string) => {
      setMappings({ ...mappings, [targetId]: headerValue });
  };

  const handlePrepareDrafts = () => {
    const formattedData = rawExcelData.map((row, index) => {
        let cleanRow: any = { _id: index };
        targetFields.forEach(field => {
            const excelHeaderName = mappings[field.id];
            cleanRow[field.id] = excelHeaderName ? row[excelHeaderName] : "";
        });

        if (cleanRow.customerPhone) {
            cleanRow.customerPhone = cleanRow.customerPhone.toString().trim();
        }

        cleanRow.maintenance_period = parseInt(cleanRow.maintenancePeriod) || 30;

        let fee = cleanRow.maintenanceFee ? cleanRow.maintenanceFee.toString().trim() : "";
        fee = fee.replace(/[^0-9.,]/g, ''); 
        fee = fee.replace(/\./g, ''); 
        fee = fee.replace(',', '.'); 
        cleanRow.maintenanceFee = fee;

        const street = cleanRow.streetDetail?.trim() || "";
        const bNo = cleanRow.buildingNo?.toString().trim() || "";
        const dist = cleanRow.district?.trim() || "";
        const city = cleanRow.city?.trim() || "";

        let combinedLocation = street;
        if (bNo) combinedLocation += ` No:${bNo}`;
        if (dist) combinedLocation += ` / ${dist}`;
        if (city) combinedLocation += ` / ${city}`;
        cleanRow.location = combinedLocation;

        const isValidType = assetTypesList.includes(cleanRow.assetType?.toString().trim());
        const isValidApartment = cleanRow.apartmentName && cleanRow.apartmentName.toString().trim() !== "";
        
        const isCityValid = city === "" || citiesList.includes(city);
        const isDistrictValid = dist === "" || (city !== "" && CITY_DATA[city]?.includes(dist));

        cleanRow.isCityValid = isCityValid;
        cleanRow.isDistrictValid = isDistrictValid;
        cleanRow._isValid = isValidType && isValidApartment && isCityValid && isDistrictValid;
        
        return cleanRow;
    });
    
    const nonEmpties = formattedData.filter(d => d.apartmentName || d.assetType);
    setDraftData(nonEmpties);
    setDraftTab(nonEmpties.some(d => !d._isValid) ? 'invalid' : 'valid');
    setStep(4);
  };

  // 🚀 TAM DÜZENLENEBİLİRLİK + İL / İLÇE AKILLI GÜNCELLEME MOTORU
  const handleDraftChange = (id: number, field: string, value: string) => {
    setDraftData(prev => prev.map(row => {
        if (row._id === id) {
            const updatedRow = { ...row, [field]: value };
            
            // Kullanıcı konumu doğrudan yazıyla ezerse hatayı yoksay
            if (field === 'location') {
                updatedRow.isCityValid = true;
                updatedRow.isDistrictValid = true;
            }

            // İl Dropdown Değişimi
            if (field === 'city') {
                updatedRow.isCityValid = value === "" || citiesList.includes(value);
                // Eğer il değişirse ve eski ilçe yeni ile uymuyorsa ilçeyi sıfırla
                if (value !== "" && updatedRow.district && !CITY_DATA[value]?.includes(updatedRow.district)) {
                    updatedRow.district = "";
                    updatedRow.isDistrictValid = false;
                }
            }

            // İlçe Dropdown Değişimi
            if (field === 'district') {
                updatedRow.isDistrictValid = value === "" || (updatedRow.city !== "" && CITY_DATA[updatedRow.city]?.includes(value));
            }

            // İl veya İlçe değiştiğinde Location metnini dinamik olarak yeniden harmanla
            if (field === 'city' || field === 'district' || field === 'streetDetail' || field === 'buildingNo') {
                const street = updatedRow.streetDetail?.trim() || "";
                const bNo = updatedRow.buildingNo?.toString().trim() || "";
                const dist = updatedRow.district?.trim() || "";
                const city = updatedRow.city?.trim() || "";

                let combinedLocation = street;
                if (bNo) combinedLocation += ` No:${bNo}`;
                if (dist) combinedLocation += ` / ${dist}`;
                if (city) combinedLocation += ` / ${city}`;
                updatedRow.location = combinedLocation;
            }

            const isValidApartment = updatedRow.apartmentName && updatedRow.apartmentName.toString().trim() !== "";
            const isValidType = assetTypesList.includes(updatedRow.assetType?.toString().trim());
            
            updatedRow._isValid = isValidType && isValidApartment && updatedRow.isCityValid && updatedRow.isDistrictValid;
            
            return updatedRow;
        }
        return row;
    }));
  };

  const handleFinalSubmit = async () => {
      setIsSaving(true);
      setImportError(null); 

      const validDrafts = draftData.filter(d => d._isValid);

      const success = await handleAction('bulk-import', { items: validDrafts });
      
      if (success !== false) {
          setStep(5);
      } else {
          setIsSaving(false);
          setImportError("Sunucuya bağlanılamadı veya veriler reddedildi. Lütfen işlemi tekrar deneyin.");
      }
  };

  const handleClose = () => {
    setShowSmartExcelModal(false);
    setTimeout(() => {
        setStep(1); setFile(null); setRawExcelData([]); setHeaders([]); setMappings({}); 
        setIsSaving(false); setUploadMode(null); setIsTemplateMatch(true); setImportError(null); 
        setDraftData([]); setDraftTab('invalid'); setIsDragging(false);
    }, 300);
  };

  const autoMappedCount = Object.keys(mappings).length;
  
  const validDrafts = draftData.filter(d => d._isValid);
  const invalidDrafts = draftData.filter(d => !d._isValid);

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
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden border border-slate-200 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
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

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                
                {step === 1 && (
                    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-4">
                        {!uploadMode ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <div 
                                    onClick={() => setUploadMode('template')}
                                    className="border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center text-center gap-3 group shadow-sm"
                                >
                                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Download size={24} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-emerald-800">Şablonu İndir & Doldur</h3>
                                        <p className="text-[11px] font-medium text-emerald-600 mt-1">En güvenli ve hatasız yöntem.</p>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setUploadMode('custom')}
                                    className="border-2 border-blue-200 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center text-center gap-3 group shadow-sm"
                                >
                                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Bot size={24} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-blue-800">Kendi Excel'imi Yükleyeceğim</h3>
                                        <p className="text-[11px] font-medium text-blue-600 mt-1">Yapay zeka başlıkları tahmin eder.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <button onClick={() => setUploadMode(null)} className="self-start mb-4 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                                    ← Geri Dön
                                </button>

                                {uploadMode === 'template' && (
                                    <div className="w-full mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-left">
                                            <h4 className="text-sm font-black text-emerald-800">Adım 1: Şablonu İndirin</h4>
                                            <p className="text-xs text-emerald-600 font-medium mt-1">Müşteri ve varlıklarınızı bu şablona göre doldurup yükleyin.</p>
                                        </div>
                                        <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-all shadow-sm shrink-0 whitespace-nowrap">
                                            <Download size={16} /> Örnek Şablonu İndir
                                        </button>
                                    </div>
                                )}

                                {uploadMode === 'custom' && (
                                    <div className="w-full mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                        <div className="text-left">
                                            <h4 className="text-sm font-black text-amber-800">Kendi Excel'inizi Yüklüyorsunuz</h4>
                                            <p className="text-[11px] text-amber-700 font-medium mt-1 leading-relaxed">
                                                Akıllı sistemimiz başlıkları analiz edip eşleştirecektir. Ancak yapay zeka karmaşık tablolarda <span className="font-bold underline">hata payı olabilir</span>. Yükleme sonrası eşleşmeleri çok dikkatli kontrol etmeniz gerekmektedir.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Sürükle Bırak Kapsayıcısı */}
                                <div 
                                    className="w-full"
                                    onDragEnter={handleDragEnter}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input type="file" accept=".xlsx, .xls, .csv" id="excel-upload" className="hidden" onChange={handleFileUpload} />
                                    <label 
                                        htmlFor="excel-upload" 
                                        className="w-full cursor-pointer group block"
                                    >
                                        <div className={`border-2 border-dashed rounded-2xl p-10 transition-all duration-300 flex flex-col items-center gap-4 ${isDragging ? 'border-emerald-500 bg-emerald-100/80 scale-[1.02] shadow-inner' : (uploadMode === 'template' ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50' : 'border-blue-300 bg-blue-50/30 hover:bg-blue-50')}`}>
                                            <div className={`w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center transition-transform ${isDragging ? 'scale-125' : 'group-hover:scale-110'}`}>
                                                <FileSpreadsheet size={32} className={isDragging || uploadMode === 'template' ? "text-emerald-500" : "text-blue-500"} />
                                            </div>
                                            <div className="text-center pointer-events-none">
                                                <h3 className="text-base font-black text-slate-700">
                                                    {isDragging ? 'Dosyayı Buraya Bırakın' : 'Dosyanızı Buraya Yükleyin'}
                                                </h3>
                                                <p className="text-xs font-medium text-slate-500 mt-2">
                                                    {isDragging ? 'Yükleme hemen başlayacak...' : 'Doldurduğunuz dosyayı seçin veya sürükleyin.'}
                                                </p>
                                            </div>
                                            <div className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-md mt-2 transition-colors ${isDragging ? 'bg-emerald-500' : (uploadMode === 'template' ? 'bg-emerald-600 group-hover:bg-emerald-700' : 'bg-blue-600 group-hover:bg-blue-700')}`}>
                                                Dosya Seç
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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

                {step === 3 && (
                    <div className="space-y-5 max-w-2xl mx-auto">
                        <div className={`p-4 rounded-xl flex items-start gap-3 border ${isTemplateMatch ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
                            {isTemplateMatch ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />}
                            <div>
                                <h4 className={`text-sm font-black ${isTemplateMatch ? 'text-emerald-800' : 'text-blue-800'}`}>Analiz Tamamlandı!</h4>
                                <p className={`text-xs font-medium mt-1 ${isTemplateMatch ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    Sistem <span className="font-black">{rawExcelData.length} adet</span> kayıt buldu. 
                                    {isTemplateMatch ? ' Şablon formatı algılandı, eşleşmeler %100 kusursuz.' : ` ${autoMappedCount} sütun otomatik eşleştirildi.`}
                                </p>
                            </div>
                        </div>

                        {!isTemplateMatch && (
                            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5">
                                <Bot size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-semibold text-amber-700 leading-relaxed">
                                    <span className="font-black">DİKKAT:</span> Kendi dosyanızı yüklediğiniz için yapay zeka devreye girdi. Karmaşık tablolarda <span className="underline decoration-amber-300">hata payı olabilir.</span> Verilerin sisteme hatalı işlenmemesi için aşağıdaki eşleşmeleri son kez gözden geçirin. Sorumluluk tamamen size aittir.
                                </p>
                            </div>
                        )}

                        <div className="max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 space-y-3 bg-white p-2 rounded-xl border border-slate-200">
                            {targetFields.map(field => {
                                const isMapped = !!mappings[field.id];
                                return (
                                    <div key={field.id} className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${isMapped ? 'bg-slate-50 border-slate-200' : 'bg-rose-50/50 border-rose-200'}`}>
                                        <div className="text-xs font-bold text-slate-700 w-1/3 shrink-0 flex items-center gap-2">
                                            {isMapped ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-2 h-2 rounded-full bg-rose-500 ml-1"></div>}
                                            {field.label}
                                        </div>
                                        <div className="hidden sm:block text-slate-300"><ArrowRight size={16} /></div>
                                        <select 
                                            className={`w-full sm:w-1/2 px-3 py-2 text-xs font-semibold outline-none rounded-lg border transition-all ${isMapped ? 'border-slate-200 bg-white focus:border-emerald-500' : 'border-rose-300 bg-white focus:border-rose-500 ring-2 ring-rose-500/20'}`}
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
                            disabled={!mappings['apartmentName'] || !mappings['assetType']} 
                            onClick={handlePrepareDrafts}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            <FileSpreadsheet size={18} /> Önizleme ve Taslak Tablosunu Oluştur
                        </button>
                        {(!mappings['apartmentName'] || !mappings['assetType']) && <p className="text-[10px] text-center text-rose-500 font-bold mt-1">Devam etmek için "Bina Adı" ve "Cihaz Türü" eşleştirmeleri zorunludur.</p>}
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4 h-full flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                            <div>
                                <h4 className="text-sm font-black text-slate-800">Son Kontrol ve Onay</h4>
                                <p className="text-[11px] font-medium text-slate-500 mt-1">Tüm alanlara tıklayarak doğrudan düzenleme yapabilirsiniz.</p>
                            </div>
                            
                            <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                                <button 
                                    onClick={() => setDraftTab('invalid')}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${draftTab === 'invalid' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {invalidDrafts.length > 0 && <span className="flex w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
                                    Düzeltilecekler ({invalidDrafts.length})
                                </button>
                                <button 
                                    onClick={() => setDraftTab('valid')}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${draftTab === 'valid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <CheckCircle2 size={14} className={draftTab === 'valid' ? 'text-emerald-500' : 'opacity-50'} />
                                    Sorunsuzlar ({validDrafts.length})
                                </button>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex-1 min-h-[300px] shadow-inner relative flex flex-col">
                            {draftTab === 'invalid' && invalidDrafts.length > 0 && (
                                <div className="bg-rose-50 border-b border-rose-100 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2 shrink-0">
                                    <FileWarning size={16} /> Aşağıdaki kayıtlarda hatalı veya eksik veri var. İlgili alanlara tıklayarak anında düzeltebilirsiniz.
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left text-xs min-w-[700px]">
                                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-3 font-black text-slate-600 uppercase tracking-wider text-[10px] w-1/4">Bina / Tesis Adı</th>
                                            <th className="p-3 font-black text-slate-600 uppercase tracking-wider text-[10px] w-1/3">Asansör / Cihaz Türü</th>
                                            <th className="p-3 font-black text-slate-600 uppercase tracking-wider text-[10px] w-1/4">İletişim / Müşteri</th>
                                            <th className="p-3 text-right w-[50px]">Sil</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(draftTab === 'valid' ? validDrafts : invalidDrafts).map((row) => (
                                            <tr key={row._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-3 align-top">
                                                    {/* Bina Adı Düzenlenebilir Input */}
                                                    <input 
                                                        type="text" 
                                                        value={row.apartmentName || ''} 
                                                        onChange={(e) => handleDraftChange(row._id, 'apartmentName', e.target.value)}
                                                        className={`w-full text-xs font-bold p-1.5 border rounded-lg outline-none transition-all ${!row.apartmentName ? 'border-rose-300 text-rose-600 bg-rose-50 placeholder-rose-400' : 'border-transparent bg-transparent hover:bg-slate-100 focus:bg-white focus:border-emerald-400 text-slate-800'}`}
                                                        placeholder="Bina Adı Eksik!"
                                                    />
                                                    {/* Konum Düzenlenebilir Input */}
                                                    <input 
                                                        type="text" 
                                                        value={row.location || ''} 
                                                        onChange={(e) => handleDraftChange(row._id, 'location', e.target.value)}
                                                        className="w-full text-[10px] p-1.5 mt-1 border border-transparent rounded-lg outline-none transition-all bg-transparent hover:bg-slate-100 focus:bg-white focus:border-slate-300 text-slate-500 placeholder-slate-400"
                                                        placeholder="Adres / Konum Ekleyin"
                                                    />
                                                    
                                                    {/* YENİ: İL VE İLÇE AKILLI SEÇİM DROPDOWNLARI */}
                                                    <div className="flex gap-2 mt-1">
                                                        <select
                                                            className={`w-1/2 p-1.5 text-[10px] font-bold rounded-lg outline-none border transition-all ${row.isCityValid && row.city ? 'bg-transparent border-transparent hover:bg-slate-100 focus:bg-white focus:border-slate-300 text-slate-600' : 'bg-rose-50 border-rose-300 text-rose-600'}`}
                                                            value={row.city || ""}
                                                            onChange={(e) => handleDraftChange(row._id, 'city', e.target.value)}
                                                        >
                                                            {!citiesList.includes(row.city) && row.city && <option value={row.city}>⚠️ {row.city} (Düzeltin)</option>}
                                                            <option value="">İl Seçin</option>
                                                            {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>

                                                        <select
                                                            className={`w-1/2 p-1.5 text-[10px] font-bold rounded-lg outline-none border transition-all ${row.isDistrictValid && row.district ? 'bg-transparent border-transparent hover:bg-slate-100 focus:bg-white focus:border-slate-300 text-slate-600' : 'bg-rose-50 border-rose-300 text-rose-600'}`}
                                                            value={row.district || ""}
                                                            onChange={(e) => handleDraftChange(row._id, 'district', e.target.value)}
                                                            disabled={!row.city || !CITY_DATA[row.city]}
                                                        >
                                                            {row.city && CITY_DATA[row.city] && !CITY_DATA[row.city].includes(row.district) && row.district && <option value={row.district}>⚠️ {row.district} (Düzeltin)</option>}
                                                            <option value="">İlçe Seçin</option>
                                                            {row.city && CITY_DATA[row.city]?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                                                        </select>
                                                    </div>

                                                    {(!row.isCityValid || !row.isDistrictValid) && (
                                                        <div className="text-[9px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-rose-200">
                                                            ⚠️ İl veya İlçe hatalı! Listeden seçin.
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3 align-top">
                                                    <select 
                                                        className={`w-full p-2 rounded-lg text-xs font-bold outline-none border transition-all cursor-pointer ${assetTypesList.includes(row.assetType) ? 'bg-transparent hover:bg-slate-100 focus:bg-white border-transparent focus:border-slate-300 text-slate-700' : 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/20'}`}
                                                        value={assetTypesList.includes(row.assetType) ? row.assetType : ""}
                                                        onChange={(e) => handleDraftChange(row._id, 'assetType', e.target.value)}
                                                    >
                                                        {!assetTypesList.includes(row.assetType) && <option value="">⚠️ {row.assetType || 'TÜR BELİRTİLMEMİŞ'} (Düzeltin)</option>}
                                                        {assetTypesList.map((type: string) => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-3 align-top">
                                                    {/* Müşteri Adı Düzenlenebilir Inputs */}
                                                    <input 
                                                        type="text" 
                                                        value={row.customerName || ''} 
                                                        onChange={(e) => handleDraftChange(row._id, 'customerName', e.target.value)}
                                                        className="w-full text-xs font-semibold p-1.5 border border-transparent rounded-lg outline-none transition-all bg-transparent hover:bg-slate-100 focus:bg-white focus:border-slate-300 text-slate-700 placeholder-slate-400"
                                                        placeholder="Müşteri Adı"
                                                    />
                                                    {/* Telefon Düzenlenebilir Input */}
                                                    <input 
                                                        type="text" 
                                                        value={row.customerPhone || ''} 
                                                        onChange={(e) => handleDraftChange(row._id, 'customerPhone', e.target.value)}
                                                        className="w-full text-[10px] p-1.5 mt-1 border border-transparent rounded-lg outline-none transition-all bg-transparent hover:bg-slate-100 focus:bg-white focus:border-slate-300 text-slate-500 placeholder-slate-400"
                                                        placeholder="Telefon"
                                                    />
                                                </td>
                                                <td className="p-3 text-right align-middle">
                                                    <button 
                                                        onClick={() => setDraftData(draftData.filter(d => d._id !== row._id))} 
                                                        title="Bu satırı tamamen sil"
                                                        className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {draftTab === 'invalid' && invalidDrafts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 gap-3">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500"><CheckCircle2 size={32} /></div>
                                        <div><h3 className="text-sm font-bold text-slate-700">Hatalı Kayıt Yok!</h3><p className="text-xs font-medium mt-1">Tüm verileriniz sisteme uygun formatta.</p></div>
                                    </div>
                                )}
                                {draftTab === 'valid' && validDrafts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 gap-3">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center"><AlertCircle size={32} /></div>
                                        <div className="text-sm font-bold">Aktarılacak geçerli kayıt bulunamadı.</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {importError && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold flex items-start gap-2 shrink-0">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{importError}</span>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 mt-2 shrink-0">
                            <button onClick={() => setStep(3)} className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 text-sm">
                                Geri
                            </button>
                            <button 
                                disabled={isSaving || validDrafts.length === 0 || invalidDrafts.length > 0} 
                                onClick={handleFinalSubmit} 
                                className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-emerald-600 flex justify-center items-center gap-2 text-sm"
                                title={invalidDrafts.length > 0 ? "Lütfen önce Hatalı kayıtları düzeltin veya silin." : ""}
                            >
                                 {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><UploadCloud size={18} /> {validDrafts.length} Kusursuz Kaydı Sisteme İşle</>}
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Tebrikler, Operasyon Başarılı!</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm mx-auto">
                                Onayladığınız <span className="font-bold text-slate-700">{validDrafts.length} kayıt</span> başarıyla arka planda ayrıştırıldı, müşteriler yaratıldı ve asansörler onlara bağlandı.
                            </p>
                        </div>
                        <button onClick={() => { handleClose(); if(handleAction) window.location.reload(); }} className="mt-4 px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-95">
                            Sisteme Geri Dön
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