'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Search, User, Box, Calendar, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle, Clock, Image as ImageIcon, Download, MessageSquareText, Settings, CheckSquare, Tag, Wrench, ArrowUpRight, UserPlus, UserCheck, Printer, Palette, Bluetooth, Share2 } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function JobDetailModal({
  selectedJob, setSelectedJob, previewPdfJob, setPreviewPdfJob,
  fullScreenImage, setFullScreenImage, isEditingJobDetail, setIsEditingJobDetail,
  showCancelConfirm, setShowCancelConfirm, editJobDetailForm, setEditJobDetailForm,
  jobTargetMode, setJobTargetMode, jobPrice, setJobPrice, isApproving, setIsApproving,
  jobModalType, setJobModalType, handleAction, isSaving, data,
  isAnyProfileDetailOpen, isMobile, handleCloseDetail, userRole,
  searchCust, setSearchCust, searchAsset, setSearchAsset,
  selectedCustomer, setSelectedCustomer,
  selectedAsset, setSelectedAsset,
  setShowThermalPrintModal, setSelectedThermalJob
}: any) {

// 🚀 Hangi alt modalın BU modal tarafından açıldığını takip ediyoruz
const [openedChild, setOpenedChild] = useState<'customer' | 'asset' | null>(null);
  
// 🚀 Yeni Tab State'i (Yönetici Sekmeli Görünüm İçin)
const [activeTab, setActiveTab] = useState('ozet');
  
  // 🚀 Şık Hata/Bilgi Modalı
  const [notification, setNotification] = useState<{show: boolean, msg: string, type: 'error' | 'success'}>({show: false, msg: '', type: 'success'});

  // 🚀 Firma Logosu ve Arka Plan Rengi Sistemi
  const [logoBgColor, setLogoBgColor] = useState<string>('#ffffff');

  // 🚀 Yazdırma Modu Seçimi
  const [showPrintModeSelection, setShowPrintModeSelection] = useState(false);
  const [printMode, setPrintMode] = useState<'color' | 'bw'>('color');

  // 🚀 Fotoğraf Yükleme Durumu
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 🚀 İMZA STATE VE REF'LERİ
  const [signatureName, setSignatureName] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const executePrint = (mode: 'color' | 'bw') => {
    setPrintMode(mode);
    setShowPrintModeSelection(false);
    setTimeout(() => {
      const printArea = document.getElementById('pdf-printable-area');
      if (!printArea) return;

      // 🚀 İSİMLENDİRME KURALI: varlıkadı-varlıktürü-islemtürü-tarih formatında otomatik isim alsın
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
      const asset = previewPdfJob?.asset_id ? (data?.assets || []).find((a:any) => String(a.id) === String(previewPdfJob.asset_id)) : null;
      
      // 🚀 İSİMLENDİRME VE VARLIK TÜRÜ ÇÖZÜMÜ: Referans koda göre Varlık Türü "name" alanında, Apartman Adı ise "apartmentName" alanında tutuluyor.
      const rawAssetName = asset?.apartmentName || previewPdfJob?.customer_name || 'Varlik';
      const rawAssetType = asset?.name || 'Genel';
      const rawJobType = previewPdfJob?.work_type || 'Servis';
      
      const sanitizeTextForFile = (text: string) => {
        if (!text) return '';
        return text.replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ü/g, 'u').replace(/Ü/g, 'U')
                   .replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ı/g, 'i').replace(/İ/g, 'I')
                   .replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ç/g, 'c').replace(/Ç/g, 'C');
      };

      // 🚀 İSİMLENDİRME SIRALAMASI: varlıkadı-varlıktürü-tarih-islemtürü olarak düzeltildi
      const safeFileName = `${sanitizeTextForFile(rawAssetName).replace(/\s+/g, '-')}-${sanitizeTextForFile(rawAssetType).replace(/\s+/g, '-')}-${formattedDate}-${sanitizeTextForFile(rawJobType).replace(/\s+/g, '-')}`;

      // 🚀 YAZDIRIRKEN İSİMLENDİRME ÇÖZÜMÜ: Tarayıcılar yazdırma ekranında iframe title'ını değil, ana sayfa title'ını baz alır. Geçici olarak ana sayfa adını değiştiriyoruz.
      const originalTitle = document.title;
      document.title = safeFileName;

      // 🚀 BOŞ SAYFA ÇÖZÜMÜ: Sadece formu içeren gizli bir Iframe oluşturup sadece onu yazdırıyoruz.
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.outerHTML).join('');
      const content = printArea.innerHTML;

      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <html>
            <head>
              <title>${safeFileName}</title>
              ${styles}
              <style>
                @page { margin: 5mm; size: A4 portrait; }
                body { zoom: 0.75; transform-origin: top left; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; height: auto !important; overflow: visible !important; }
                .no-print { display: none !important; }
                
                ${mode === 'bw' ? `
                   *, body { color: black !important; border-color: black !important; }
                   .print-no-bg, .bg-slate-50, .bg-blue-50 { background-color: transparent !important; }
                   img:not(.print-logo) { filter: grayscale(100%) brightness(0) !important; }
                ` : ''}

                .bg-emerald-500 { background-color: #10b981 !important; }
                .bg-rose-500 { background-color: #f43f5e !important; }
                .text-emerald-600 { color: #059669 !important; }
                .text-rose-600 { color: #e11d48 !important; }
                .border-emerald-500 { border-color: #10b981 !important; }
                .border-rose-500 { border-color: #f43f5e !important; }
                .bg-black { background-color: #000000 !important; }
                .border-black { border-color: #000000 !important; }
                .bg-slate-50 { background-color: #f8fafc !important; }
                .bg-slate-50\\/80 { background-color: #f8fafc !important; }
                .bg-white { background-color: #ffffff !important; }
                
                .print-grid img { max-width: 100% !important; height: auto !important; }
                .print-logo-container { border: none !important; }
                .print-logo { max-height: 80px !important; width: auto !important; object-fit: contain !important; }
                .print-signature { max-height: 60px !important; width: auto !important; object-fit: contain !important; }
                
                .mb-8 { margin-bottom: 6mm !important; }
                .mb-6 { margin-bottom: 4mm !important; }
                .mt-8 { margin-top: 6mm !important; }
                .pt-6 { padding-top: 4mm !important; }
                .py-3\\.5 { padding-top: 3mm !important; padding-bottom: 3mm !important; }
                .py-5 { padding-top: 4mm !important; padding-bottom: 4mm !important; }
                .px-5 { padding-left: 4mm !important; padding-right: 4mm !important; }
                
                .page-break-avoid { break-inside: avoid !important; page-break-inside: avoid !important; }
              </style>
            </head>
            <body class="${mode === 'bw' ? 'bw-mode' : ''}">
              <div style="padding: 20px;">
                ${content}
              </div>
            </body>
          </html>
        `);
        iframeDoc.close();

        iframe.onload = () => {
            setTimeout(() => {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              setTimeout(() => {
                document.body.removeChild(iframe);
                setPrintMode('color');
                document.title = originalTitle; // İşlem bittikten sonra orijinal sayfa başlığına geri dön
              }, 1000);
            }, 800); // İmajların yüklenmesi için kısa bir bekleme
          };
      }
    }, 150);
  };

  const getSafeImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev')) {
       return url.replace('https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  useEffect(() => {
    if (!data?.logo) {
      setLogoBgColor('#ffffff');
      return;
    }

    const safeLogoUrl = getSafeImageUrl(data.logo);
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
        const pxData = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < pxData.length; i += 4) {
          if (pxData[i + 3] < 128) continue; 
          r += pxData[i];
          g += pxData[i + 1];
          b += pxData[i + 2];
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
  }, [data?.logo]);

// Dışarıdan modal kapandığında local state'i temizle
useEffect(() => {
    if ((!selectedCustomer || !isAnyProfileDetailOpen) && openedChild === 'customer') {
        setOpenedChild(null);
    }
  }, [selectedCustomer, isAnyProfileDetailOpen, openedChild]);

  useEffect(() => {
    if ((!selectedAsset || !isAnyProfileDetailOpen) && openedChild === 'asset') {
        setOpenedChild(null);
    }
  }, [selectedAsset, isAnyProfileDetailOpen, openedChild]);

  // 🚀 AKILLI VE KADEMELİ KAPATMA MANTIĞI
  const handleSmartClose = useCallback((e?: any) => {
    
    // 🚀 Alt profil açıksa, esc/geri tuşu alt profili kapatsın, bana dokunmasın
    if (openedChild !== null) return true;

    const stopEvent = () => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        } 
        else if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
            e.nativeEvent.stopImmediatePropagation();
        }
      }
    };

    if (showPrintModeSelection) {
        stopEvent();
        setShowPrintModeSelection(false);
        return true;
      }
  
      if (fullScreenImage) {
        stopEvent();
        setFullScreenImage(null);
        return true;
      }
      if (previewPdfJob) {
        stopEvent();
        setPreviewPdfJob(null);
        return true;
      }

    if (showCancelConfirm) {
      stopEvent();
      setShowCancelConfirm(false);
      return true;
    }

    if (isEditingJobDetail) {
      stopEvent();
      setIsEditingJobDetail(false);
      return true;
    }

    if (selectedJob) {
      if (isAnyProfileDetailOpen && !openedChild) return false;
      
      stopEvent();
      setSelectedJob(null);
      setSignatureImage(null);
      setSignatureName('');
      if (handleCloseDetail) handleCloseDetail('job');
      return true;
    }

    return false;
}, [
    fullScreenImage, previewPdfJob, showCancelConfirm, openedChild, showPrintModeSelection,
    isEditingJobDetail, selectedJob, isAnyProfileDetailOpen,
    setFullScreenImage, setPreviewPdfJob, setShowCancelConfirm, 
    setIsEditingJobDetail, setSelectedJob, handleCloseDetail
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSmartClose(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleSmartClose]);

  useEffect(() => {
    if (selectedJob) {
        window.history.pushState({ jobModal: true }, '');
    }
  }, [selectedJob]);

  useEffect(() => {
    if (fullScreenImage || previewPdfJob || showCancelConfirm || isEditingJobDetail || selectedCustomer || selectedAsset) {
        window.history.pushState({ internalLayer: true }, '');
    }
  }, [fullScreenImage, previewPdfJob, showCancelConfirm, isEditingJobDetail, selectedCustomer, selectedAsset]);

  useEffect(() => {
    if (!selectedJob) return;

    const handlePopState = (e: PopStateEvent) => {
      if (isAnyProfileDetailOpen && openedChild === null) return;
      handleSmartClose(e);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedJob, isAnyProfileDetailOpen, openedChild, handleSmartClose]);

  const getCoordinates = (e: any) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const coords = getCoordinates(e);
    const ctx = signatureCanvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault(); 
    const coords = getCoordinates(e);
    const ctx = signatureCanvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.lineTo(coords.x, coords.y);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
        setSignatureImage(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureImage(null);
    }
  };

  const sendCustomerWhatsApp = (jobData: any) => {
    const custPhone = (data?.customers || []).find((c:any) => c.name === jobData.customer_name)?.contact;
    if(!custPhone) { 
        setNotification({show: true, msg: "Bu müşterinin sistemde kayıtlı bir telefon numarası bulunamadı!", type: 'error'});
        setTimeout(() => setNotification({show: false, msg: '', type: 'success'}), 3000);
        return; 
    }
    
    let formattedPhone = custPhone.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '90' + formattedPhone.substring(1);
     
     const assetName = (data?.assets || []).find((a:any) => a.id === jobData.asset_id)?.name || 'Cihazınız';
     const price = jobData.details?.price || 'Ücretsiz';
     
     const currentMonth = new Date().toLocaleString('tr-TR', { month: 'long' });
     const workTypeDesc = jobData.work_type === 'Periyodik Bakım' ? `${currentMonth} ayı periyodik bakımı` : 'servis işlemi';
     
     const message = `Merhaba *${jobData.customer_name}*,\n\n*${assetName}* için ${workTypeDesc} başarıyla tamamlanmıştır.\n\nServis detaylarını ve kontrol formunu içeren PDF raporunu bu mesaja ek olarak iletiyoruz.\n\n*İşlem Tutarı:* ${price}\n\nİyi günler dileriz.`;
     
     window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // 🚀 YENİ: PDF Oluşturma ve Native Paylaşma State/Fonksiyonları
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const sanitizeTextForFile = (text: string) => {
    if (!text) return '';
    return text.replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
               .replace(/ü/g, 'u').replace(/Ü/g, 'U')
               .replace(/ş/g, 's').replace(/Ş/g, 'S')
               .replace(/ı/g, 'i').replace(/İ/g, 'I')
               .replace(/ö/g, 'o').replace(/Ö/g, 'O')
               .replace(/ç/g, 'c').replace(/Ç/g, 'C');
  };

  const handleSharePDF = async (jobData: any) => {
        setIsGeneratingPdf(true);
        try {
            const receiptElement = document.getElementById('pdf-printable-area');
            if (!receiptElement) throw new Error("PDF alanı bulunamadı.");
    
            // 🚀 BOŞ SAYFA VE KESİLME ÇÖZÜMÜ: html2canvas scroll'u algılayamadığı için geçici olarak tam boyuta açıyoruz.
            const originalHeight = receiptElement.style.height;
            const originalMaxHeight = receiptElement.style.maxHeight;
            const originalOverflow = receiptElement.style.overflow;
            
            receiptElement.style.height = 'max-content';
            receiptElement.style.maxHeight = 'none';
            receiptElement.style.overflow = 'visible';
    
            const canvas = await html2canvas(receiptElement, { 
                scale: 2, 
                useCORS: true, 
                allowTaint: true,
                backgroundColor: '#ffffff',
                windowHeight: receiptElement.scrollHeight // Tüm içeriğin yüksekliğini zorla
            });
            
            // 🚀 Çizim biter bitmez eski stiline geri döndürüyoruz.
            receiptElement.style.height = originalHeight;
            receiptElement.style.maxHeight = originalMaxHeight;
            receiptElement.style.overflow = originalOverflow;
            
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // 🚀 TEK SAYFAYA SIĞDIRMA ÇÖZÜMÜ: Ölçeği daha da küçülterek (0.72) her şeyin 1 sayfada kalmasını sağlıyoruz.
            const pdfWidth = 210; // A4 Genişliği (mm)
            const pageHeight = 297; // A4 Yüksekliği (mm)
            const scaleFactor = 0.72; // İçeriği A4'e tek sayfa olarak sığdırmak için ekstra küçültüyoruz
            const imgWidth = pdfWidth * scaleFactor;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width * scaleFactor;
            
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            
            let heightLeft = imgHeight;
            let position = 10; // İlk sayfa üstten boşluk
            const xOffset = (pdfWidth - imgWidth) / 2; // Ortalamak için X ekseni kaydırması

            pdf.addImage(imgData, 'JPEG', xOffset, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - 20); // Marjinleri düş

            // İçerik tek bir A4'ten uzunsa otomatik olarak yeni sayfa ekle
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', xOffset, position, imgWidth, imgHeight);
                heightLeft -= (pageHeight - 20);
            }
            
            // 🚀 İSİMLENDİRME KURALI ÇÖZÜMÜ: varlıkadı-varlıktürü-tarih-islemtürü
            const today = new Date();
            const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
            const asset = jobData.asset_id ? (data?.assets || []).find((a:any) => String(a.id) === String(jobData.asset_id)) : null;
            
            // 🚀 İSİMLENDİRME VE VARLIK TÜRÜ ÇÖZÜMÜ: Referans koda göre Varlık Türü "name" alanında, Apartman Adı ise "apartmentName" alanında tutuluyor.
            const rawAssetName = asset?.apartmentName || jobData.customer_name || 'Varlik';
            const rawAssetType = asset?.name || 'Genel';
            const rawJobType = jobData.work_type || 'Servis';
            
            const safeAssetName = sanitizeTextForFile(rawAssetName).replace(/\s+/g, '-');
            const safeAssetType = sanitizeTextForFile(rawAssetType).replace(/\s+/g, '-');
            const safeJobType = sanitizeTextForFile(rawJobType).replace(/\s+/g, '-');
    
            const safeFileName = `${safeAssetName}-${safeAssetType}-${formattedDate}-${safeJobType}.pdf`;
            
            const pdfBlob = pdf.output('blob');
            const file = new File([pdfBlob], safeFileName, { type: 'application/pdf' });
            
            const assetName = asset?.name || 'Cihazınız';
            const shareText = `Merhaba ${jobData.customer_name},\n\n${rawAssetName} işleminiz tamamlanmıştır. Servis raporunuzu bu mesaja eklenmiş dosyada bulabilirsiniz.`;
    
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Servis Raporu #${jobData.id}`,
                    text: shareText,
                    files: [file]
                });
            } else {
                pdf.save(safeFileName);
                sendCustomerWhatsApp(jobData);
            }
        } catch (error) {
            console.error("PDF oluşturma hatası:", error);
            setNotification({show: true, msg: "PDF dosyası hazırlanırken bir hata oluştu.", type: 'error'});
            setTimeout(() => setNotification({show: false, msg: '', type: 'success'}), 3000);
        } finally {
            setIsGeneratingPdf(false);
        }
      };

  const statusColors: any = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200',
    'Onay Bekliyor': 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const getDynamicStatus = (job: any, hasWorker: boolean) => {
    if (!job) return { label: '', colorClass: '' };
    let label = job.status || 'Beklemede';

    const isGeneral = job.work_type === 'Genel Görev' || job.work_type === 'Görev' || !job.customer_name || job.customer_name === 'Genel Görev';

    if (!isGeneral && (label === 'Usta Bekliyor' || label === 'Devam Ediyor')) {
        label = hasWorker ? 'Devam Ediyor' : 'Usta Bekliyor';
    } else if (isGeneral && label === 'Usta Bekliyor') {
        label = 'Devam Ediyor';
    }

    let colorClass = statusColors[label] || 'bg-slate-100 text-slate-500 border-slate-200';

    if ((label === 'Gelecek' || label === 'Beklemede' || label === 'Usta Bekliyor') && job.scheduled_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sDate = new Date(job.scheduled_date.split(' ')[0]);
        sDate.setHours(0, 0, 0, 0);

        if (sDate < today) {
            label = 'Gecikti';
            colorClass = 'bg-rose-100 text-rose-700 border-rose-200';
        }
    }
    return { label, colorClass };
  };

  const isEditJobValid = editJobDetailForm?.workCategory === 'Genel İş Atama' ? true : (editJobDetailForm?.customerName || editJobDetailForm?.assetId);
  const currentSector = data?.sector || '';
  const safeSectors: any = sectorsData;
  const branchList = currentSector && safeSectors?.sectors?.[currentSector]?.subTypes 
    ? Object.keys(safeSectors.sectors[currentSector].subTypes) 
    : [];

  const handleEditClick = () => {
    setIsEditingJobDetail(true);
    setEditJobDetailForm({ 
        workCategory: selectedJob.work_type === 'Genel Görev' ? 'Genel İş Atama' : 'Normal İş Atama',
        workType: selectedJob.work_type || 'Genel Görev',
        jobType: selectedJob.job_type || 'Anlık',
        scheduledDate: selectedJob.scheduled_date || '', 
        staffId: selectedJob.staff_id || '', 
        taskNote: selectedJob.details?.note || '',
        customerName: selectedJob.customer_name || '',
        assetId: selectedJob.asset_id || ''
    });
    if (selectedJob.asset_id) {
        setJobTargetMode('ASSET');
    } else {
        setJobTargetMode('CUSTOMER');
    }
  };

  const isStacked = Boolean(previewPdfJob || fullScreenImage || openedChild !== null);

  const isGeneralTask = selectedJob?.work_type === 'Genel Görev' || selectedJob?.work_type === 'Görev' || !selectedJob?.customer_name || selectedJob?.customer_name === 'Genel Görev';
  const hasWorker = !!selectedJob?.worker_name || !!selectedJob?.details?.worker_id || !!(selectedJob?.staff_id && (data?.staff || []).find((s:any) => String(s.id) === String(selectedJob.staff_id) && s.role === 'Usta'));

  return (
    <>
      {/* 0. PDF ÖNİZLEME MODALI */}
      <AnimatePresence>
        {previewPdfJob && (
          <motion.div 
             key="pdf-modal-backdrop"
             className="fixed inset-0 flex items-center justify-center p-4 z-[200]"
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0, pointerEvents: "none" }} 
             transition={{ duration: 0.15 }}
          >
             <div 
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer no-print"
               onClick={() => handleSmartClose()}
             />
             <motion.div 
               key="pdf-modal-content"
               initial={{ opacity: 0, scale: 0.95, y: 10 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.95, y: 10 }} 
               transition={{ duration: 0.25, ease: "easeInOut" }}
               onClick={(e) => e.stopPropagation()}
               className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative z-10"
             >
                {/* BASKI TÜRÜ SEÇİM EKRANI */}
                <AnimatePresence>
                  {showPrintModeSelection && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 sm:p-8 no-print"
                    >
                      <h3 className="text-2xl font-black text-slate-800 mb-2">Baskı Türü</h3>
                      <p className="text-[13px] font-medium text-slate-500 mb-8 text-center px-2">
                        Servis formunu yazıcınıza uygun olan formatta yazdırın.
                      </p>
                      
                      <div className="w-full max-w-xs space-y-3">
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
                            <Printer size={20} /> Siyah Beyaz Baskı
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

                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print z-10">
                   <h2 className="font-black text-lg text-slate-800">Servis Formu & Fiyat Özeti</h2>
                   <button onClick={() => handleSmartClose()} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"><X size={18} /></button>
                </div>
                
                <div id="pdf-printable-area" className={`p-6 sm:p-10 overflow-y-auto custom-scrollbar bg-white text-black flex-1 relative ${printMode === 'bw' ? 'bw-mode' : ''}`}>
                   
                   <div className="flex flex-col items-center justify-center mb-6 text-center">
                        {data?.logo && (
                            <div 
                                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center mb-4 overflow-hidden shadow-sm border-2 ${printMode === 'bw' ? 'border-black bg-white' : 'border-slate-100 print-logo-container p-2'}`}
                                style={{ backgroundColor: printMode === 'bw' ? '#ffffff' : logoBgColor }}
                            >
                                <img 
                                    src={getSafeImageUrl(data.logo)} 
                                    alt="Firma Logosu" 
                                    crossOrigin="anonymous"
                                    className={`w-full h-full object-contain print-logo ${printMode === 'bw' ? 'grayscale brightness-0' : ''}`} 
                                />
                            </div>
                        )}
                        <h1 className={`text-2xl font-black uppercase tracking-widest ${printMode === 'bw' ? 'text-black' : ''}`}>{data?.name || 'Firma Adı'}</h1>
                        <h2 className={`text-lg font-bold mt-1 ${printMode === 'bw' ? 'text-black' : 'text-slate-800'}`}>{previewPdfJob.work_type === 'Periyodik Bakım' ? 'Bakım Fişi' : 'Servis Raporu'}</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-medium border-y-4 border-slate-900 py-5 mb-8 bg-slate-50/50 px-2 sm:px-4 rounded-xl print:bg-transparent print:px-0 print:rounded-none">
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Fiş Numarası</div>
                            <div className="font-black text-slate-900 text-base">#{previewPdfJob.id}</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Tarih</div>
                            <div className="font-black text-slate-900 text-base">{new Date(previewPdfJob.created_at || Date.now()).toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">İlgili Personel</div>
                            <div className="font-black text-slate-900 text-base truncate">{previewPdfJob.worker_name || 'Belirtilmedi'}</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Tesis Adı / Adres</div>
                            <div className="font-black text-slate-900 leading-tight text-base">
                                {(() => {
                                    const asset = (data?.assets || []).find((a:any) => a.id === previewPdfJob.asset_id);
                                    if (asset) {
                                        return (
                                            <>
                                                <div>{asset.apartmentName || asset.name}</div>
                                                {asset.location && <div className="text-[11px] font-semibold text-slate-500 mt-1 whitespace-normal">{asset.location}</div>}
                                            </>
                                        );
                                    }
                                    return previewPdfJob.customer_name || 'Bilinmiyor';
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm print-no-bg overflow-hidden">
                            
                            <div className="flex flex-col">
                                {(() => {
                                    let rawNote = previewPdfJob.details?.note || previewPdfJob.taskNote || '';
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
                                        if (previewPdfJob.details) {
                                            const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName', 'usedMaterials'];
                                            Object.entries(previewPdfJob.details).forEach(([k, v]) => {
                                                if (!excludeKeys.includes(k) && typeof v === 'string') {
                                                    extractedChecklist.push({ key: k, val: v });
                                                }
                                            });
                                        }
                                    }

                                    cleanNote = cleanNote.replace(/\[Usta Notu\]:/g, '').replace(/\[📍 Konum Kaydı\].*/g, '').trim();
                                    
                                    if (extractedChecklist.length === 0 && !cleanNote) return <div className="p-5 text-slate-500 italic">Rapor girilmemiş.</div>;
                                    
                                    return (
                                        <>
                                            {extractedChecklist.length > 0 && (
                                                <div className="flex flex-col bg-white">
                                                    {extractedChecklist.map((item, idx) => {
                                                        const valStr = item.val.toLowerCase().trim();
                                                        
                                                        const isPositive = ['evet', 'var', 'true', 'ok', 'uygun', 'sorunsuz', 'yapıldı'].some(v => valStr === v || valStr.includes(v));
                                                        const isNegative = ['hayır', 'hayir', 'yok', 'false', 'uygun değil', 'değil', 'sorunlu', 'kötü'].some(v => valStr === v || valStr.includes(v));
                                                        const isBooleanType = isPositive || isNegative;
                                                        
                                                        let colorClass = 'text-slate-900';
                                                        let bgColorClass = 'bg-slate-900';
                                                        let borderColorClass = 'border-slate-900';
                                                        
                                                        if (printMode === 'bw') {
                                                            colorClass = 'text-black font-black';
                                                            bgColorClass = 'bg-white border-2 border-black'; // Simsiyah kutu yerine siyah çerçeveli beyaz kutu
                                                            borderColorClass = 'border-black';
                                                        } else {
                                                            if (isPositive) {
                                                                colorClass = 'text-emerald-600';
                                                                bgColorClass = 'bg-emerald-500';
                                                                borderColorClass = 'border-emerald-500';
                                                            } else if (isNegative) {
                                                                colorClass = 'text-rose-600';
                                                                bgColorClass = 'bg-rose-500';
                                                                borderColorClass = 'border-rose-500';
                                                            } else if (valStr.includes('mavi')) colorClass = 'text-blue-600';
                                                            else if (valStr.includes('yeşil') || valStr.includes('yesil')) colorClass = 'text-emerald-600';
                                                            else if (valStr.includes('kırmızı') || valStr.includes('kirmizi')) colorClass = 'text-rose-600';
                                                            else if (valStr.includes('sarı') || valStr.includes('sari')) colorClass = 'text-amber-500';
                                                            else if (valStr.includes('turuncu')) colorClass = 'text-orange-500';
                                                            else if (valStr.includes('mor')) colorClass = 'text-purple-600';
                                                        }

                                                        return (
                                                            <div key={idx} className={`flex justify-between items-center py-3.5 px-5 border-b border-slate-200/80 last:border-b-0 ${idx % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}`}>
                                                                <div className="flex flex-col pr-4">
                                                                    <span className={`text-[14px] font-bold leading-tight ${printMode === 'bw' ? 'text-black' : 'text-slate-900'}`}>{item.key}</span>
                                                                </div>
                                                                
                                                                <div className="shrink-0 flex items-center gap-3">
                                                                    {isBooleanType && (
                                                                        <span className={`text-[12px] font-black uppercase tracking-widest ${colorClass}`}>{item.val}</span>
                                                                    )}
                                                                    {isBooleanType ? (
                                                        isPositive ? (
                                                            <div className={`w-6 h-6 flex items-center justify-center rounded shadow-sm print-color-exact ${bgColorClass}`}>
                                                                <CheckSquare size={16} className={printMode === 'bw' ? 'text-black' : 'text-white'} strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className={`w-6 h-6 flex items-center justify-center rounded shadow-sm print-color-exact ${bgColorClass}`}>
                                                                <X size={16} className={printMode === 'bw' ? 'text-black' : 'text-white'} strokeWidth={4} />
                                                            </div>
                                                        )
                                                    ) : (
                                                                        <span className={`text-[13px] font-black uppercase ${colorClass} ${colorClass === 'text-slate-900' || colorClass === 'text-black' ? `border-b-2 ${borderColorClass}` : ''}`}>{item.val}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            
                                            {previewPdfJob.details?.usedMaterials && previewPdfJob.details.usedMaterials.length > 0 && (
                                                <div className="p-5 border-t border-slate-200 bg-white">
                                                    <span className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3">KULLANILAN MALZEMELER:</span>
                                                    <div className="space-y-1.5 text-sm font-semibold text-slate-700">
                                                        {previewPdfJob.details.usedMaterials.map((m: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center">
                                                                <span>• {m.name}</span>
                                                                <span className="font-black text-slate-900">{m.quantity} {m.unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {cleanNote && (
                                                <div className="p-5 border-t border-slate-200 bg-slate-50/50">
                                                    <span className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2">BAKIM / SERVİS NOTU:</span>
                                                    <div className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                        {cleanNote}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            
                            {previewPdfJob.details?.price && (
                                <div className="p-5 border-t border-slate-200 bg-slate-100/50 flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Toplam Tutar</span>
                                    <span className="text-2xl font-black text-slate-900">{previewPdfJob.details.price}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {previewPdfJob.photos && previewPdfJob.photos.length > 0 && (
                       <div className="mb-8">
                          <div className="text-xs font-black text-slate-800 uppercase pb-4">Saha Kayıt Fotoğrafları</div>
                          <div className="grid grid-cols-2 gap-4 print-grid">
                             {previewPdfJob.photos.map((p: string, i: number) => (
                               <div key={i} className="page-break-avoid w-full">
                                  <img src={p} alt="Saha" className="w-full h-auto max-h-64 object-contain rounded-lg border border-slate-300" crossOrigin="anonymous" />
                               </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {previewPdfJob.signature_url && (
                        <div className="mt-8 pt-6 border-t-2 border-slate-800 text-center page-break-avoid flex flex-col items-center">
                            <p className="text-xs text-slate-500 mb-6 italic max-w-md">
                                Bu form <strong className="text-slate-700">{previewPdfJob.worker_name || 'personelimiz'}</strong> tarafından, {new Date(previewPdfJob.created_at || Date.now()).toLocaleString('tr-TR')} tarihinde müşteri nezaretinde elektronik imza ile imza altına alınmıştır.
                            </p>
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İmzalayan:</span> 
                                    {previewPdfJob.customer_signature_name}
                                </div>
                                <img 
                                    src={getSafeImageUrl(previewPdfJob.signature_url)} 
                                    alt="Müşteri İmzası" 
                                    className="h-24 object-contain mix-blend-multiply print-signature" 
                                />
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                                    {data?.name || 'Firma Adı'}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3 no-print z-10">
                   <button onClick={() => setShowPrintModeSelection(true)} className="flex-1 bg-slate-900 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95">
                      <Printer size={18} /> Yazdır
                   </button>
                   {(() => {
                       const isPdfGeneral = previewPdfJob.work_type === 'Genel Görev' || previewPdfJob.work_type === 'Görev' || !previewPdfJob.customer_name || previewPdfJob.customer_name === 'Genel Görev';
                       const hasPhone = !!(data?.customers || []).find((c:any) => c.name === previewPdfJob.customer_name)?.contact;
                       
                       if (isPdfGeneral && (!previewPdfJob.customer_name || previewPdfJob.customer_name === 'Genel Görev' || !hasPhone)) return null;
                       
                       return (
                           <>
                               <button disabled={isGeneratingPdf} onClick={() => handleSharePDF(previewPdfJob)} className="flex-1 bg-blue-600 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50">
                                  {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />} PDF İle Paylaş
                               </button>
                               <button onClick={() => sendCustomerWhatsApp(previewPdfJob)} className="flex-1 bg-emerald-500 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-md active:scale-95">
                                  <MessageSquareText size={18} /> Mesaj Gönder
                               </button>
                           </>
                       );
                   })()}
                </div>
             </motion.div>
             
             {/* 🚀 KUSURSUZ YAZDIRMA CSS'İ IFRAME İÇİNE TAŞINDI (Arka planın ghost sayfalar yaratmasını engeller) */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SEÇİLİ İŞ (GÖREV) DETAY MODALI */}
      <AnimatePresence>
        {selectedJob && jobModalType !== 'APPROVAL' && (
          <motion.div 
             key="job-modal-backdrop"
             className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${isStacked ? 'z-[80]' : 'z-[130]'}`}
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0, pointerEvents: "none" }} 
             transition={{ duration: 0.15 }}
          >
            {!(isAnyProfileDetailOpen && !isMobile) && (
                <div 
                   className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isStacked ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} cursor-pointer`} 
                   onClick={() => {
                       if (!isStacked) {
                           setSelectedJob(null);
                           if (handleCloseDetail) handleCloseDetail('job');
                       }
                   }}
                />
            )}

            <motion.div 
                key="job-modal-content"
                initial={{ opacity: 0, scale: 0.95, y: 10, x: isAnyProfileDetailOpen && !isMobile ? 280 : 0 }} 
                animate={{ 
                    opacity: 1, 
                    scale: isStacked ? 0.92 : 1, 
                    y: isStacked ? -20 : 0, 
                    filter: isStacked ? 'brightness(0.5)' : 'brightness(1)',
                    x: isAnyProfileDetailOpen && !isMobile ? 280 : 0 
                }} 
                exit={{ opacity: 0, scale: 0.95, y: 10, x: isAnyProfileDetailOpen && !isMobile ? 280 : 0 }} 
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ pointerEvents: isStacked ? 'none' : 'auto' }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 z-10"
            >
              
              <div className="flex justify-between items-start p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50 z-10">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{isEditingJobDetail ? 'İş Emrini Düzenle' : 'İş Emri Detayı'}</h2>
                    <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                       <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold">#{selectedJob.id}</span>
                       <span>•</span>
                       <span className="flex items-center gap-1"><Clock size={12}/> {selectedJob.created_at?.split('T')[0] || ''}</span>
                    </div>
                </div>
                <button onClick={() => handleSmartClose()} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all active:scale-95"><X size={20} /></button>
              </div>

              {!isEditingJobDetail ? (
                <div className="flex-1 flex flex-col min-h-0">
                    
                    <div className="flex items-center px-4 sm:px-6 pt-2 border-b border-slate-200 shrink-0 gap-4 overflow-x-auto custom-scrollbar">
                        <button onClick={() => setActiveTab('ozet')} className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'ozet' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Özet Bilgi</button>
                        
                        {(selectedJob.details?.note || selectedJob.details?.usedMaterials || Object.keys(selectedJob.details || {}).length > 2) && (
                           <button onClick={() => setActiveTab('form')} className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'form' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Form & Stok</button>
                        )}
                        
                        {(selectedJob.photos?.length > 0 || selectedJob.signature_url) && (
                           <button onClick={() => setActiveTab('medya')} className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'medya' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Medya & İmza</button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 relative">
                        
                        {activeTab === 'ozet' && (
                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-4 sm:space-y-5">
                                {(() => {
                                    const creator = selectedJob.creator_name || (data?.ownerName?.split(' ')[0] || 'Sistem');
                                    let managerName = selectedJob.manager_name || null;
                                    let finalWorkerName = selectedJob.worker_name || null;

                                    if (!finalWorkerName) {
                                        if (selectedJob.details?.worker_id) {
                                            const w = (data?.staff || []).find((s:any) => String(s.id) === String(selectedJob.details?.worker_id));
                                            if (w) finalWorkerName = w.name;
                                        } else if (selectedJob.staff_id) {
                                            const w = (data?.staff || []).find((s:any) => String(s.id) === String(selectedJob.staff_id));
                                            if (w && w.role === 'Usta') finalWorkerName = w.name;
                                        }
                                    }

                                    const dynamicStatus = getDynamicStatus(selectedJob, hasWorker);

                                    return (
                                        <>
                                            <AnimatePresence>
                                            {showCancelConfirm && (
                                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 z-20 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center rounded-b-2xl">
                                                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-inner"><AlertTriangle size={32} /></div>
                                                <h3 className="text-xl font-black text-slate-800 mb-2">İşi İptal Etmek İstiyor musun?</h3>
                                                <div className="flex gap-3 w-full max-w-[250px]">
                                                    <button onClick={async () => { await handleAction('update-job', { id: selectedJob.id, status: 'İptal' }, () => setSelectedJob(null), () => {}); }} className="flex-1 bg-rose-600 text-white py-3 rounded-xl text-sm font-bold shadow-md active:scale-95">{isSaving ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Evet, İptal'}</button>
                                                    <button onClick={() => setShowCancelConfirm(false)} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold active:scale-95">Vazgeç</button>
                                                </div>
                                                </motion.div>
                                            )}
                                            </AnimatePresence>

                                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GÜNCEL DURUM</span>
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-black border uppercase tracking-wider ${dynamicStatus.colorClass}`}>{dynamicStatus.label}</span>
                                            </div>

                                            {!isGeneralTask && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <div onClick={() => {
                                                        const theCustomer = (data?.customers || []).find((c:any) => c.name === selectedJob.customer_name);
                                                        if(theCustomer && setSelectedCustomer) { setOpenedChild('customer'); setSelectedCustomer(theCustomer); }
                                                    }} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors cursor-pointer group relative">
                                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Müşteri Profili</div>
                                                        <div className="text-sm font-black text-slate-800 pr-5">{selectedJob.customer_name}</div>
                                                        <ArrowUpRight size={16} className="absolute top-4 right-4 text-slate-300 group-hover:text-blue-500" />
                                                    </div>
                                                    
                                                    {(() => {
                                                        const theAsset = selectedJob.asset_id ? (data?.assets || []).find((a:any) => String(a.id) === String(selectedJob.asset_id)) : null;
                                                        return (
                                                            <div onClick={() => {
                                                                if(selectedJob.asset_id && setSelectedAsset && theAsset) { setOpenedChild('asset'); setSelectedAsset(theAsset); }
                                                            }} className={`bg-white p-4 border border-slate-200 rounded-xl shadow-sm relative ${selectedJob.asset_id ? 'hover:border-blue-300 cursor-pointer group' : 'opacity-70'}`}>
                                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">İlgili Varlık</div>
                                                                
                                                                {theAsset?.apartmentName ? (
                                                                    <>
                                                                        <div className="text-sm font-bold text-slate-800 pr-5 truncate flex items-center gap-1.5">
                                                                            🏢 {theAsset.apartmentName}
                                                                        </div>
                                                                        <div className="text-[11px] font-medium text-slate-500 mt-0.5 pr-5 truncate">
                                                                            {theAsset.name}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="text-sm font-bold text-slate-800 pr-5 truncate">{theAsset ? theAsset.name : 'Seçilmemiş'}</div>
                                                                )}

                                                                {selectedJob.asset_id && <ArrowUpRight size={16} className="absolute top-4 right-4 text-slate-300 group-hover:text-blue-500 transition-colors" />}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Görev Tipi</div>
                                                    <div className="text-sm font-bold text-slate-800">{selectedJob.work_type}</div>
                                                </div>
                                                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Planlanan Tarih</div>
                                                    <div className="text-sm font-bold text-slate-800">
                                                        {selectedJob.scheduled_date ? (
                                                            selectedJob.scheduled_date
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <span>Anlık</span>
                                                                {selectedJob.created_at && (
                                                                    <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                                        {new Date(selectedJob.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm col-span-2 flex justify-between items-center">
                                                     <div>
                                                         <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Saha Ustası</div>
                                                         <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5"><Wrench size={14}/> {finalWorkerName || 'Atanmadı'}</div>
                                                     </div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        )}

{activeTab === 'form' && (
                             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-4">
                                 {(() => {
                                     const excludeKeys = ['note', 'price', 'lastEditedBy', 'lastEditedAt', 'managerName', 'managerId', 'createdBy', 'worker_id', 'assetName', 'usedMaterials'];
                                     const formEntries = Object.entries(selectedJob.details || {}).filter(([k]) => !excludeKeys.includes(k));
                                     
                                     let rawNote = selectedJob.details?.note || selectedJob.taskNote || '';
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
                                     }

                                     cleanNote = cleanNote.replace(/\[Usta Notu\]:/g, '').replace(/\[📍 Konum Kaydı\].*/g, '').trim();

                                     const hasFormEntries = formEntries.length > 0;
                                     const hasChecklist = extractedChecklist.length > 0;
                                     const hasCleanNote = !!cleanNote;
                                     const hasMaterials = selectedJob.details?.usedMaterials && selectedJob.details.usedMaterials.length > 0;

                                     if (!hasFormEntries && !hasChecklist && !hasCleanNote && !hasMaterials) {
                                         return (
                                             <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
                                                 <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm text-slate-300 rounded-full flex items-center justify-center mb-4">
                                                     <CheckSquare size={28} />
                                                 </div>
                                                 <div className="text-sm font-black text-slate-700 mb-1">Kayıt Bulunmuyor</div>
                                                 <div className="text-xs font-medium text-slate-500 max-w-[250px]">Bu görev için henüz bir saha formu doldurulmamış veya stok düşülmemiş.</div>
                                             </div>
                                         );
                                     }

                                     return (
                                         <>
                                             {hasFormEntries && (
                                                 <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                                                     <div className="text-xs font-black text-blue-800 uppercase border-b border-blue-200/50 pb-2 mb-3">Kontrol Edilen Aksamlar</div>
                                                     <div className="space-y-2">
                                                         {formEntries.map(([key, value], idx) => (
                                                             <div key={idx} className="flex justify-between items-center py-2 border-b border-blue-100/50 last:border-0 text-sm">
                                                                 <span className="font-semibold text-slate-700">{key}</span>
                                                                 <span className="font-black text-slate-900">{String(value)}</span>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             )}

                                             {hasChecklist && (
                                                 <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                     <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200">
                                                         <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={14}/> Doldurulan Saha Formu</div>
                                                     </div>
                                                     <div className="flex flex-col">
                                                         {extractedChecklist.map((item, idx) => {
                                                             const valStr = item.val.toLowerCase().trim();
                                                             const isPositive = ['evet', 'var', 'true', 'ok', 'uygun', 'sorunsuz', 'yapıldı'].some(v => valStr === v || valStr.includes(v));
                                                             const isNegative = ['hayır', 'hayir', 'yok', 'false', 'uygun değil', 'değil', 'sorunlu', 'kötü'].some(v => valStr === v || valStr.includes(v));
                                                             const isBooleanType = isPositive || isNegative;

                                                             let colorClass = 'text-slate-900';
                                                             let bgColorClass = 'bg-slate-900';

                                                             if (isPositive) {
                                                                 colorClass = 'text-emerald-600';
                                                                 bgColorClass = 'bg-emerald-500';
                                                             } else if (isNegative) {
                                                                 colorClass = 'text-rose-600';
                                                                 bgColorClass = 'bg-rose-500';
                                                             } else if (valStr.includes('mavi')) colorClass = 'text-blue-600';
                                                             else if (valStr.includes('yeşil') || valStr.includes('yesil')) colorClass = 'text-emerald-600';
                                                             else if (valStr.includes('kırmızı') || valStr.includes('kirmizi')) colorClass = 'text-rose-600';
                                                             else if (valStr.includes('sarı') || valStr.includes('sari')) colorClass = 'text-amber-500';
                                                             else if (valStr.includes('turuncu')) colorClass = 'text-orange-500';
                                                             else if (valStr.includes('mor')) colorClass = 'text-purple-600';

                                                             return (
                                                                 <div key={idx} className={`flex justify-between items-center py-3.5 px-5 border-b border-slate-100 last:border-0 ${idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
                                                                     <span className="text-[13px] font-bold text-slate-700">{item.key}</span>
                                                                     <div className="shrink-0 flex items-center gap-3">
                                                                         {isBooleanType && <span className={`text-[11px] font-black uppercase tracking-widest ${colorClass}`}>{item.val}</span>}
                                                                         {isBooleanType ? (
                                                                             isPositive ? (
                                                                                 <div className={`w-5 h-5 flex items-center justify-center rounded shadow-sm ${bgColorClass}`}>
                                                                                     <CheckSquare size={14} className="text-white" strokeWidth={3} />
                                                                                 </div>
                                                                             ) : (
                                                                                 <div className={`w-5 h-5 flex items-center justify-center rounded shadow-sm ${bgColorClass}`}>
                                                                                     <X size={14} className="text-white" strokeWidth={4} />
                                                                                 </div>
                                                                             )
                                                                         ) : (
                                                                             <span className={`text-[12px] font-black uppercase ${colorClass}`}>{item.val}</span>
                                                                         )}
                                                                     </div>
                                                                 </div>
                                                             );
                                                         })}
                                                     </div>
                                                 </div>
                                             )}

                                             {hasCleanNote && (
                                                 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                                     <div className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-1.5">Usta Saha Notu</div>
                                                     <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap italic border-l-2 border-slate-300 pl-3">
                                                         {cleanNote}
                                                     </p>
                                                 </div>
                                             )}

                                             {hasMaterials && (
                                                 <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                                                     <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Box size={14}/> Sistemden Düşülen Malzemeler</div>
                                                     <div className="space-y-2">
                                                         {selectedJob.details.usedMaterials.map((mat:any, i:number) => (
                                                             <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
                                                                 <span className="text-xs font-bold text-slate-800">{mat.name}</span>
                                                                 <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-1 rounded">{mat.quantity} {mat.unit}</span>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             )}
                                         </>
                                     );
                                 })()}
                             </motion.div>
                        )}

                        {activeTab === 'medya' && (
                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
                                {selectedJob.photos && selectedJob.photos.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-1.5">
                                            <ImageIcon size={14} /> Saha Fotoğrafları
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {selectedJob.photos.map((photoUrl: string, idx: number) => (
                                                <div key={idx} onClick={() => setFullScreenImage(photoUrl)} className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:border-blue-500 transition-all hover:scale-105 active:scale-95">
                                                    <img src={photoUrl} alt="Saha" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedJob.signature_url && (
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
                                        <p className="text-xs text-slate-500 mb-4 italic">Bu form müşteri nezaretinde elektronik imza ile onaylanmıştır.</p>
                                        <div className="inline-block bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">İmzalayan: <span className="text-slate-800">{selectedJob.customer_signature_name}</span></div>
                                            <img src={getSafeImageUrl(selectedJob.signature_url)} alt="Müşteri İmzası" className="h-24 mx-auto object-contain mix-blend-multiply" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                    {selectedJob.status === 'Onay Bekliyor' && (
                                    <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-inner">
                                       <div className="text-amber-800 font-black text-sm flex items-center gap-2"><AlertTriangle size={18}/> Personel İşi Tamamladı. Onayınız Bekleniyor.</div>
                                       
                                       {isGeneralTask ? (
                                           <button disabled={isApproving} onClick={async () => {
                                               setIsApproving(true);
                                               await handleAction('update-job', { id: selectedJob.id, status: 'Tamamlandı', lastEditedBy: data?.ownerName, workType: selectedJob.work_type, details: selectedJob.details }, () => setSelectedJob(null), null);
                                               setIsApproving(false);
                                           }} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 sm:py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center active:scale-95 text-sm">
                                               {isApproving ? <Loader2 className="animate-spin" size={18}/> : 'Görevi Onayla ve Tamamla'}
                                           </button>
                                       ) : (
                                           <>
                                               {/* 🚀 YENİ: Otopilot fiyatı varsa input'a otomatik yansır */}
                                               <div className="relative">
                                                   <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-amber-600 text-sm">₺</span>
                                                   <input 
                                                       type="number" 
                                                       placeholder="Müşteriye yansıtılacak işlem ücreti" 
                                                       value={jobPrice !== '' ? jobPrice : (selectedJob.payment_amount || '')} 
                                                       onChange={e => setJobPrice(e.target.value)} 
                                                       className="w-full pl-8 pr-4 py-3 sm:py-3.5 rounded-xl border border-amber-300 font-bold outline-none focus:border-amber-500 text-sm bg-white text-amber-900" 
                                                   />
                                               </div>
                                               <button disabled={isApproving || (!jobPrice && !selectedJob.payment_amount)} onClick={async () => {
                                                   setIsApproving(true);
                                                   // 🚀 Hangi fiyatı kullanacağımızı belirliyoruz
                                                   const finalPrice = jobPrice !== '' ? jobPrice : selectedJob.payment_amount;
                                                   const newDetails = { ...selectedJob.details, price: finalPrice + ' TL' };
                                                   
                                                   // 1. İşi Tamamla ve Tahsilat Durumunu Güncelle
                                                   await handleAction('update-job', { 
                                                       id: selectedJob.id, 
                                                       status: 'Tamamlandı', 
                                                       taskNote: selectedJob.details?.note, 
                                                       lastEditedBy: data?.ownerName || 'Yönetici', 
                                                       workType: selectedJob.work_type, 
                                                       details: newDetails,
                                                       paymentStatus: 'Tahsil Edildi',
                                                       paymentAmount: finalPrice
                                                   }, null, null);
                                                   
                                                   // 2. Parayı Kasaya İşle
                                                   await handleAction('approve-job', { 
                                                       jobId: selectedJob.id, 
                                                       amount: finalPrice, 
                                                       customerName: selectedJob.customer_name,
                                                       paymentStatus: 'Tahsil Edildi'
                                                   }, () => setSelectedJob(null), () => setJobPrice(''));
                                                   
                                                   setIsApproving(false);
                                               }} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 sm:py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center active:scale-95 text-sm">
                                                   {isApproving ? <Loader2 className="animate-spin" size={18}/> : 'Fiyatı Onayla ve Kasa\'ya İşle'}
                                               </button>
                                           </>
                                       )}
                                    </div>
                                )}

                                {selectedJob.status === 'Tamamlandı' && selectedJob.work_type === 'Periyodik Bakım' && (  
                                    <button 
                                        onClick={() => {
                                            if (setShowThermalPrintModal && setSelectedThermalJob) {
                                                setSelectedThermalJob(selectedJob);
                                                setShowThermalPrintModal(true);
                                            }
                                        }} 
                                        className="w-full bg-blue-600 border border-blue-700 text-white font-black py-3.5 rounded-xl hover:bg-blue-700 transition-all flex justify-center items-center gap-2 shadow-sm active:scale-95 text-sm mt-3"
                                    >
                                        <Bluetooth size={18} /> Bluetooth ile Fiş Yazdır
                                    </button>
                                )}

                                {selectedJob.status === 'Tamamlandı' && (  
                                    <button onClick={() => setPreviewPdfJob(selectedJob)} className="w-full bg-emerald-100 border border-emerald-300 text-emerald-700 font-black py-3.5 rounded-xl hover:bg-emerald-200 transition-all flex justify-center items-center gap-2 shadow-sm active:scale-95 text-sm mt-3">
                                       <MessageSquareText size={18} /> {isGeneralTask && (!selectedJob.customer_name || selectedJob.customer_name === 'Genel Görev') ? 'Servis Formu / PDF Görüntüle' : 'Rapor Önizleme & WhatsApp Gönder'}
                                    </button>
                                )}

                        {selectedJob.status !== 'Tamamlandı' && selectedJob.status !== 'İptal' && (
                        <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 w-full pt-4 mt-2 border-t border-slate-100 flex-wrap">
                            {(userRole !== 'Patron' && 
                              (selectedJob.status === 'Beklemede' || selectedJob.status === 'Gelecek') && 
                              !hasWorker && 
                              (selectedJob.creator_role === 'Patron' || selectedJob.details?.creatorRole === 'Patron' || (selectedJob.creator_name || selectedJob.details?.createdBy || data?.ownerName?.split(' ')[0]) === data?.ownerName?.split(' ')[0])) ? (
                                <button 
                                    onClick={async () => {
                                        setIsApproving(true);
                                        const newStatus = isGeneralTask ? 'Devam Ediyor' : 'Usta Bekliyor';
                                        await handleAction('update-job', {
                                            id: selectedJob.id,
                                            status: newStatus,
                                            lastEditedBy: data?.ownerName || 'Yönetici',
                                        }, () => {
                                            setSelectedJob(null);
                                            if (setJobModalType) setJobModalType('');
                                        }, null);
                                        setIsApproving(false);
                                    }}
                                    disabled={isApproving}
                                    className="flex-1 w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                                >
                                    {isApproving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
                                    GÖREVİ KABUL ET
                                </button>
                            ) : (
                                <>
                                    {jobModalType === 'APPROVAL_FIRST_STEP' ? (
                                        <button 
                                            onClick={async () => {
                                                setIsApproving(true);
                                                const newStatus = isGeneralTask ? 'Devam Ediyor' : 'Usta Bekliyor';
                                                await handleAction('update-job', {
                                                    id: selectedJob.id,
                                                    status: newStatus,
                                                    lastEditedBy: data?.ownerName || 'Yönetici',
                                                }, () => {
                                                    setSelectedJob(null);
                                                    if (setJobModalType) setJobModalType('');
                                                }, null);
                                                setIsApproving(false);
                                            }}
                                            disabled={isApproving}
                                            className="flex-1 w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                                        >
                                            {isApproving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
                                            İŞİ ONAYLIYORUM
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={handleEditClick}
                                                className="flex-1 w-full bg-slate-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
                                            >
                                                <Settings size={16} /> {isGeneralTask ? 'Detayları Düzenle' : 'Düzenle / Ata'}
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                            
                            <button 
                                onClick={() => setShowCancelConfirm(true)}
                                className="flex-1 w-full bg-rose-50 text-rose-600 border border-rose-200 py-3.5 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <X size={16} strokeWidth={3} /> İptal Et
                            </button>
                        </div>
                    )}
                    </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5">
                    
                    {jobModalType !== 'ASSIGN' && selectedJob?.status !== 'Usta Bekliyor' && !isGeneralTask && (
                        <>
                            <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">İş Türü</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setEditJobDetailForm({...editJobDetailForm, workCategory: 'Normal İş Atama'})} className={`py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${editJobDetailForm.workCategory !== 'Genel İş Atama' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Normal İş Atama</button>
                                <button onClick={() => setEditJobDetailForm({...editJobDetailForm, workCategory: 'Genel İş Atama', customerName: '', assetId: ''})} className={`py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${editJobDetailForm.workCategory === 'Genel İş Atama' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Genel İş Atama</button>
                            </div>
                            </div>

                            <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tarih / Zamanlama</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setEditJobDetailForm({...editJobDetailForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${editJobDetailForm.jobType === 'Anlık' ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Anlık Görev</button>
                                <button onClick={() => setEditJobDetailForm({...editJobDetailForm, jobType: 'Planlı'})} className={`py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${editJobDetailForm.jobType === 'Planlı' ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Tarih Planla</button>
                            </div>
                            {editJobDetailForm.jobType === 'Planlı' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                                <input type="date" value={editJobDetailForm.scheduledDate} className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" onChange={e => setEditJobDetailForm({...editJobDetailForm, scheduledDate: e.target.value})} />
                                </motion.div>
                            )}
                            </div>

                            {editJobDetailForm.workCategory !== 'Genel İş Atama' && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
                                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                <button onClick={() => setJobTargetMode('CUSTOMER')} className={`flex-1 py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${jobTargetMode === 'CUSTOMER' ? 'bg-white text-blue-700 border-blue-300 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-200'}`}>👤 Müşteri Seçerek İlerle</button>
                                <button onClick={() => setJobTargetMode('ASSET')} className={`flex-1 py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${jobTargetMode === 'ASSET' ? 'bg-white text-blue-700 border-blue-300 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-200'}`}>📦 Varlık Seçerek İlerle</button>
                                </div>

                                {jobTargetMode === 'CUSTOMER' ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    <div className="relative">
                                    <Search className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
                                    <input type="text" placeholder="İsim veya TC ile Müşteri Ara..." className="w-full pl-9 pr-3 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white" value={searchCust} onChange={e => setSearchCust(e.target.value)} />
                                    </div>
                                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white focus:border-blue-500 custom-scrollbar" size={4} value={editJobDetailForm.customerName} onChange={e => setEditJobDetailForm({...editJobDetailForm, customerName: e.target.value, assetId: ''})}>
                                    <option value="" disabled className="font-bold text-slate-400 border-b border-slate-100 pb-2 mb-2">-- 1. Listeden Müşteri Seçin --</option>
                                    {(data?.customers || []).filter((c:any) => c.name?.toLowerCase().includes(searchCust?.toLowerCase()) || c.tax_info?.includes(searchCust)).map((c: any) => <option key={c.id} value={c.name} className="py-2 border-b border-slate-50 last:border-0">{c.name} {c.tax_info ? `(${c.tax_info})` : ''}</option>)}
                                    </select>
                                    
                                    {editJobDetailForm.customerName && (() => {
                                    const selectedCustomer = (data?.customers || []).find((c:any) => c.name === editJobDetailForm.customerName);
                                    const customerAssets = (data?.assets || []).filter((a:any) => String(a.customer_id) === String(selectedCustomer?.id));
                                    
                                    return (
                                        <div className="pt-2 border-t border-slate-100">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">2. Bu Müşteriye Ait Varlık (İsteğe Bağlı)</label>
                                            <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white focus:border-blue-500" value={editJobDetailForm.assetId} onChange={e => {
                                                const selectedAsset = customerAssets.find((a:any) => String(a.id) === String(e.target.value));
                                                const autoStaffId = selectedAsset?.route_staff_id || editJobDetailForm.staffId;
                                                setEditJobDetailForm({...editJobDetailForm, assetId: e.target.value, staffId: autoStaffId});
                                            }}>
                                                <option value="">-- Varlık Seçilmedi (Genel Müşteri İşi) --</option>
                                                {customerAssets.map((a:any) => (
                                                <option key={a.id} value={a.id}>{a.name} - {a.location}</option>
                                                ))}
                                            </select>
                                            {customerAssets.length === 0 && <div className="text-[10px] text-amber-500 mt-1.5 font-bold px-1">Bu müşteriye ait kayıtlı varlık bulunamadı.</div>}
                                        </div>
                                    );
                                    })()}
                                </motion.div>
                                ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="relative mb-2">
                                    <Search className="absolute left-3 top-3 sm:top-2.5 text-slate-400" size={16} />
                                    <input type="text" placeholder="Cihaz Adı Ara..." className="w-full pl-9 pr-3 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white" value={searchAsset} onChange={e => setSearchAsset(e.target.value)} />
                                    </div>
                                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none bg-white focus:border-blue-500 custom-scrollbar" size={4} value={editJobDetailForm.assetId} onChange={e => {
                                    const selectedAsset = (data?.assets || []).find((a:any) => String(a.id) === String(e.target.value));
                                    const parentCust = (data?.customers || []).find((c:any) => String(c.id) === String(selectedAsset?.customer_id));
                                    const autoStaffId = selectedAsset?.route_staff_id || editJobDetailForm.staffId;
                                    setEditJobDetailForm({...editJobDetailForm, assetId: e.target.value, customerName: parentCust?.name || '', staffId: autoStaffId});
                                    }}>
                                    <option value="" disabled className="font-bold text-slate-400 border-b border-slate-100 pb-2 mb-2">-- Listeden Varlık Seçin --</option>
                                    {(data?.assets || []).filter((a: any) => a.name?.toLowerCase().includes(searchAsset?.toLowerCase())).map((a: any) => (
                                        <option key={a.id} value={a.id} className="py-2 border-b border-slate-50 last:border-0">{a.name} - {a.location}</option>
                                    ))}
                                    </select>
                                    {editJobDetailForm.assetId && (
                                        <div className="mt-3 text-[10px] font-bold text-blue-700 bg-blue-50/80 p-2.5 rounded-lg border border-blue-100 flex items-center gap-1.5">
                                            <CheckCircle size={14} className="text-blue-500 shrink-0"/> Müşteri Eşleşti: <span className="text-slate-800 truncate">{editJobDetailForm.customerName || 'Bağımsız Varlık'}</span>
                                        </div>
                                    )}
                                </motion.div>
                                )}
                            </div>
                            )}
                        </>
                    )}

                    {editJobDetailForm.workCategory !== 'Genel İş Atama' && (
                                  <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Görev Tipi / Branş</label>
                                    <select className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={editJobDetailForm.workType} onChange={e => setEditJobDetailForm({...editJobDetailForm, workType: e.target.value})}>
                                      <option value="Genel Görev">Genel Görev</option>
                                      {branchList.map((subType: any) => (
                                        <option key={subType} value={subType}>{subType}</option>
                                      ))}
                                    </select>
                                  </div>
                              )}

                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                        {jobModalType === 'ASSIGN' || selectedJob?.status === 'Usta Bekliyor' ? 'Atanacak Usta Seçimi' : 'Sorumlu Personel'}
                      </label>
                      <select className="w-full px-4 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none bg-slate-50 focus:bg-white focus:border-blue-500 transition-all appearance-none" value={editJobDetailForm.staffId} onChange={e => setEditJobDetailForm({...editJobDetailForm, staffId: e.target.value})}>
                        <option value="">Seçiniz...</option>
                        {(data?.staff || [])
                          .filter((s:any) => userRole === 'Patron' && selectedJob?.status !== 'Usta Bekliyor' && jobModalType !== 'ASSIGN' ? s.role === 'Yönetici' : s.role === 'Usta')
                          .map((s:any) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Görev Özeti / Talimatlar <span className="text-slate-400 font-medium normal-case">(İsteğe Bağlı)</span></label>
                      <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" placeholder="İşin detayı nedir?..." value={editJobDetailForm.taskNote} onChange={e => setEditJobDetailForm({...editJobDetailForm, taskNote: e.target.value})} />
                    </div>

                    {/* 🚀 AKILLI TAHSİLAT KONTROLÜ (Sadece Merkez İçin) */}
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mt-2">
                        <label className="text-[11px] font-black text-emerald-700 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                            💰 Tahsilat Durumu & Tutar
                        </label>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button 
                                onClick={() => setEditJobDetailForm({...editJobDetailForm, paymentStatus: 'Tahsil Edildi'})} 
                                className={`py-2 rounded-xl text-xs font-bold transition-all border ${editJobDetailForm.paymentStatus === 'Tahsil Edildi' ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
                            >
                                Tahsil Edildi
                            </button>
                            <button 
                                onClick={() => setEditJobDetailForm({...editJobDetailForm, paymentStatus: 'Bekliyor', paymentAmount: ''})} 
                                className={`py-2 rounded-xl text-xs font-bold transition-all border ${editJobDetailForm.paymentStatus === 'Bekliyor' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'}`}
                            >
                                Ödeme Bekliyor
                            </button>
                        </div>
                        {editJobDetailForm.paymentStatus === 'Tahsil Edildi' && (
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-sm">₺</span>
                                <input 
                                    type="number" 
                                    placeholder="Tahsil edilen tutar..." 
                                    value={editJobDetailForm.paymentAmount || ''} 
                                    onChange={(e) => setEditJobDetailForm({...editJobDetailForm, paymentAmount: e.target.value})}
                                    className="w-full bg-white border border-emerald-200 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 text-emerald-800" 
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 w-full pt-4 mt-2 border-t border-slate-100">
                        <button 
                            disabled={!isEditJobValid || isSaving}
                            onClick={() => {
                                let nextStatus = selectedJob.status;
                                const isGeneral = editJobDetailForm.workCategory === 'Genel İş Atama' || editJobDetailForm.workType === 'Genel Görev';

                                if (editJobDetailForm.staffId) {
                                    nextStatus = 'Devam Ediyor';
                                } else if ((nextStatus === 'Beklemede' || nextStatus === 'Gelecek') && !editJobDetailForm.staffId) {
                                    nextStatus = isGeneral ? 'Devam Ediyor' : 'Usta Bekliyor';
                                } else if (nextStatus === 'Devam Ediyor' && !editJobDetailForm.staffId && !isGeneral) {
                                    nextStatus = 'Usta Bekliyor';
                                }

                                handleAction('update-job', { 
                                    ...editJobDetailForm, 
                                    id: selectedJob.id,
                                    status: nextStatus !== selectedJob.status ? nextStatus : undefined,
                                    lastEditedBy: data?.ownerName || 'Yönetici' 
                                }, () => setSelectedJob(null), () => setIsEditingJobDetail(false));
                            }} 
                            className="flex-1 w-full bg-slate-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-md flex justify-center items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : (jobModalType === 'ASSIGN' || selectedJob?.status === 'Usta Bekliyor' ? 'Ustayı Ata' : 'Değişiklikleri Kaydet')}
                        </button>
                        <button 
                            onClick={() => handleSmartClose()} 
                            className="flex-1 w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 flex justify-center items-center"
                        >
                            Vazgeç
                        </button>
                    </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FULLSCREEN GÖRSEL MODALI (Z-Index En Yüksek) */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div 
            key="image-modal-backdrop"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, pointerEvents: "none" }} 
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4"
          >
            <div 
               className="absolute inset-0 bg-slate-900/90 backdrop-blur-md cursor-pointer"
               onClick={() => handleSmartClose()}
            />
            <button 
               onClick={() => handleSmartClose()} 
               className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-rose-500 text-white rounded-full transition-colors backdrop-blur-sm z-20"
            >
               <X size={24} />
            </button>
            <motion.img 
               key="image-modal-content"
               initial={{ scale: 0.95, y: 10 }} 
               animate={{ scale: 1, y: 0 }} 
               exit={{ scale: 0.95, y: 10 }} 
               transition={{ duration: 0.25, ease: "easeInOut" }}
               src={fullScreenImage} 
               alt="Büyütülmüş Fotoğraf" 
               className="max-w-full max-h-full object-contain rounded-xl shadow-2xl relative z-10"
               onClick={(e) => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ŞIK BİLDİRİM / HATA MODALI */}
      <AnimatePresence>
        {notification.show && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed inset-0 z-[400] flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="bg-white/95 backdrop-blur-md border-2 border-slate-100 shadow-2xl rounded-3xl p-8 flex flex-col items-center text-center max-w-sm w-full pointer-events-auto">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner animate-pulse ${notification.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {notification.type === 'error' ? <AlertTriangle size={40} strokeWidth={3} /> : <CheckCircle size={40} strokeWidth={3} />}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">{notification.type === 'error' ? 'Hata!' : 'Başarılı!'}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{notification.msg}</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}