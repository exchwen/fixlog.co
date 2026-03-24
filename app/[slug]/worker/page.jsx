'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, CheckCircle2, MessageSquareText, LogOut, ChevronRight, PenTool, Loader2, AlertCircle, PlayCircle, ClipboardList, WifiOff, Download, Share, Check, Camera, X, ShieldCheck, UserPlus, Box, Phone, User, Briefcase, Map, AlertOctagon, Navigation, PlusCircle, Search, Package, AlertTriangle, Send, Plus, Mic } from 'lucide-react';
import sectorsData from '@/lib/data/sectors.json';
import Header from '@/components/layout/Header';
import WorkerSidebar from '@/components/layout/WorkerSidebar'; 

import ChatPanel from '@/components/chat/ChatPanel';
import DynamicPWA from '@/components/DynamicPWA'; 
import ThermalPrintModal from '@/components/modals/jobs/ThermalPrintModal'; // 🚀 EKLENDİ
import { PaywallOverlay } from '@/components/PaywallOverlay';

const API_URL = 'https://backend.isdokumu.workers.dev';

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export default function WorkerDashboard() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [data, setData] = useState(null); 
  
  const [companyName, setCompanyName] = useState('İşletme');
  const [companySector, setCompanySector] = useState('');
  const [staffBranch, setStaffBranch] = useState(''); 
  
  const [activeTab, setActiveTab] = useState('jobs'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobNote, setJobNote] = useState('');
  const [dynamicForm, setDynamicForm] = useState({}); 
  const [isSaving, setIsSaving] = useState(false);

  // 🚀 ŞIK UYARI STATE'İ (EKLENDİ)
  const [notification, setNotification] = useState({show: false, msg: '', type: 'success'});

  // 🚀 SAHA SİHİRBAZI VE STOK STATE'LERİ
  const [wizardStep, setWizardStep] = useState(1);
  const [usedMaterials, setUsedMaterials] = useState([]);

// 🚀 ÇÖKME HATASINI ÖNLEMEK İÇİN YUKARI TAŞINAN STATE'LER (FOTO VE İMZA)
const [photos, setPhotos] = useState([]);
const fileInputRef = useRef(null);
const [signatureName, setSignatureName] = useState('');
const [signatureImage, setSignatureImage] = useState(null);
const signatureCanvasRef = useRef(null);
const [isDrawing, setIsDrawing] = useState(false);

// 🚀 ŞIK STOK SEÇİM MODALI İÇİN YENİ STATE'LER (EKLENDİ)
const [showStockSelectorModal, setShowStockSelectorModal] = useState(false);
const [stockSearchTerm, setStockSearchTerm] = useState('');
const [selectedStockCategory, setSelectedStockCategory] = useState('Tümü');

// 🚀 YENİ ÖZELLİK: MALZEME TALEP VE SOS STATE'LERİ
const [showMaterialModal, setShowMaterialModal] = useState(false);
const [materialRequestItems, setMaterialRequestItems] = useState([]);
const [materialNote, setMaterialNote] = useState('');
const [materialSearch, setMaterialSearch] = useState('');

const [showSOSModal, setShowSOSModal] = useState(false);
const [sosType, setSosType] = useState('Araç Arızası');
const [sosMessage, setSosMessage] = useState('');

// 🚀 YENİ ÖZELLİK: SESLİ YAZMA STATE VE FONKSİYONLARI (WEB SPEECH API)
const [isListeningNote, setIsListeningNote] = useState(false);
const [isListeningStock, setIsListeningStock] = useState(false);
const [isListeningMaterial, setIsListeningMaterial] = useState(false);
const [listeningField, setListeningField] = useState(null);

const handleSpeechToText = (target, fieldName = null) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        setNotification({ show: true, msg: "Cihazınız veya tarayıcınız (Safari/Chrome önerilir) sesli yazmayı desteklemiyor.", type: 'error' });
        setTimeout(() => setNotification({ show: false, msg: '', type: 'success' }), 4000);
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        if (target === 'note') setIsListeningNote(true);
        else if (target === 'stock') setIsListeningStock(true);
        else if (target === 'material') setIsListeningMaterial(true);
        else if (target === 'form') setListeningField(fieldName);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (target === 'note') {
            setJobNote(prev => prev ? prev + ' ' + transcript : transcript);
        } else if (target === 'stock') {
            setStockSearchTerm(transcript);
        } else if (target === 'material') {
            setMaterialSearch(transcript);
        } else if (target === 'form') {
            setDynamicForm(prev => ({ ...prev, [fieldName]: transcript }));
        }
    };

    recognition.onerror = (event) => {
        console.warn("Ses tanıma hatası:", event.error);
        if(event.error === 'not-allowed') {
             setNotification({ show: true, msg: "Mikrofon izni reddedildi. Lütfen tarayıcı ayarlarından mikrofon erişimine izin verin.", type: 'error' });
             setTimeout(() => setNotification({ show: false, msg: '', type: 'success' }), 4000);
        }
    };

    recognition.onend = () => {
        setIsListeningNote(false);
        setIsListeningStock(false);
        setIsListeningMaterial(false);
        setListeningField(null);
    };

    recognition.start();
};

// 🚀 YENİ ÖZELLİK: GOOGLE MAPS ROTA OLUŞTURUCU
const openGoogleMapsRoute = () => {
    const addresses = pendingJobs.map(job => {
        const asset = getAssetDetails(job.asset_id);
        return asset ? (asset.location || asset.apartmentName || asset.name) : job.customer_name;
    }).filter(Boolean);

    if(addresses.length === 0) {
        setNotification({ show: true, msg: 'Rotaya eklenecek bekleyen iş bulunamadı.', type: 'warning' });
        setTimeout(() => setNotification({ show: false, msg: '', type: 'success' }), 3000);
        return;
    }
    const url = `https://www.google.com/maps/dir//$${addresses.map(a => encodeURIComponent(a)).join('/')}`;
    window.open(url, '_blank');
};

// 🚀 YENİ ÖZELLİK: MALZEME TALEBİ GÖNDERİCİ
const handleRequestMaterial = async () => {
    if(materialRequestItems.length === 0) return;
    setIsSaving(true);
    const token = localStorage.getItem('staff_authToken');
    try {
        const res = await fetch(`${API_URL}/request-material`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ slug, staffId: userData?.id, items: materialRequestItems, note: materialNote })
        });
        
        if(!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'İşlem reddedildi');
        }

        setNotification({ show: true, msg: 'Talebiniz yöneticiye başarıyla iletildi.', type: 'success' });
        setShowMaterialModal(false);
        setMaterialRequestItems([]);
        setMaterialNote('');
        setTimeout(() => setNotification({ show: false, msg: '', type: 'success' }), 3000);
    } catch(e) {
        setNotification({ show: true, msg: `Hata: ${e.message}`, type: 'error' });
        setTimeout(() => setNotification({ show: false, msg: '', type: 'success' }), 4000);
    }
    setIsSaving(false);
};

// 🚀 YENİ ÖZELLİK: SOS GÖNDERİCİ
const handleSendSOS = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('staff_authToken');
    let location = null;
    try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
                });
                location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            } catch (e) {
                console.warn("Konum alınamadı, detay: ", e);
            }

    try {
        const res = await fetch(`${API_URL}/send-sos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ slug, staffId: userData?.id, type: sosType, message: sosMessage, location })
        });
        
        if(!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'İşlem reddedildi');
        }

        setNotification({ show: true, msg: 'Acil durum bildiriminiz merkeze ulaştı.', type: 'success' });
        setShowSOSModal(false);
        setSosMessage('');
        setTimeout(() => setNotification({ show: false, msg: '', type: 'success' }), 4000);
    } catch(e) {
        setNotification({ show: true, msg: `Hata: ${e.message}`, type: 'error' });
        setTimeout(() => setNotification({ show: false, msg: '', type: 'success' }), 4000);
    }
    setIsSaving(false);
};

// 🚀 ÇÖZÜM: 'currentFields' değişkenini kullanıldığı yerlerden ÖNCE tanımlıyoruz!
const rawFields = (companySector && staffBranch && sectorsData.sectors?.[companySector]?.subTypes?.[staffBranch]?.fields) || [];
  
// 🚀 YENİ: Seçili işin varlık türünü (MRL, Hidrolik, Yürüyen Merdiven vb.) buluyoruz
const currentAssetForForm = (data?.assets && selectedJob?.asset_id) 
    ? data.assets.find(a => String(a.id) === String(selectedJob.asset_id)) 
    : null;
const assetTypeName = currentAssetForForm?.name || '';

// 🚀 YENİ: Varlık türüne göre sadece o cihaza ait soruları (conditions) filtreliyoruz
const currentFields = rawFields.filter(field => {
    if (!field.conditions) return true; // Şart yoksa (Örn: Etiket rengi) herkese göster
    // Varlık türü (assetTypeName), condition içindeki kelimelerden herhangi birini içeriyorsa göster
    return field.conditions.some(cond => assetTypeName.includes(cond));
});

// 🚀 TASLAK (DRAFT) YÜKLEME (FOTOĞRAFLAR, İMZA VE ADIM NUMARASI EKLENDİ)
useEffect(() => {
      if (selectedJob && (selectedJob.status === 'Devam Ediyor' || selectedJob.status === 'Sahada')) {
          const draft = localStorage.getItem(`draft_${slug}_${selectedJob.id}`);
          if (draft) {
              try {
                  const parsed = JSON.parse(draft);
                  setDynamicForm(parsed.dynamicForm || {});
                  setJobNote(parsed.jobNote || '');
                  setUsedMaterials(parsed.usedMaterials || []);
                  if (parsed.wizardStep) setWizardStep(parsed.wizardStep);
                  if (parsed.photos) setPhotos(parsed.photos);
                  if (parsed.signatureImage) setSignatureImage(parsed.signatureImage);
                  if (parsed.signatureName) setSignatureName(parsed.signatureName);
              } catch(e) {}
          }
      } else if (!selectedJob) {
          setWizardStep(1);
          setUsedMaterials([]);
          setJobNote('');
          setDynamicForm({});
          setPhotos([]);
          setSignatureImage(null);
          setSignatureName('');
      }
  }, [selectedJob, slug]);

  // 🚀 TASLAK (DRAFT) KAYDETME (FOTOĞRAFLAR, İMZA VE ADIM NUMARASI EKLENDİ)
  useEffect(() => {
      if (selectedJob && (selectedJob.status === 'Devam Ediyor' || selectedJob.status === 'Sahada')) {
          const draftPhotos = photos.slice(0, 3);
          const draft = { dynamicForm, jobNote, usedMaterials, wizardStep, photos: draftPhotos, signatureImage, signatureName };
          localStorage.setItem(`draft_${slug}_${selectedJob.id}`, JSON.stringify(draft));
      }
  }, [dynamicForm, jobNote, usedMaterials, wizardStep, photos, signatureImage, signatureName, selectedJob, slug]);

  // 🚀 ZORUNLU ALAN KONTROLÜ (Not artık isteğe bağlı)
  const isStep2Valid = useCallback(() => {
      const isFormFilled = currentFields.length === 0 || currentFields.every(f => dynamicForm[f.name] && String(dynamicForm[f.name]).trim() !== '');
      return isFormFilled; 
  }, [currentFields, dynamicForm]);

  // 🚀 CHAT (MESAJLAŞMA) STATE'LERİ
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // 🚀 EKLENDİ: Fiş Yazdırma Modalı State'leri
  const [showThermalPrintModal, setShowThermalPrintModal] = useState(false);
  const [selectedThermalJob, setSelectedThermalJob] = useState(null);

  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installState, setInstallState] = useState('idle');

  // 🚀 AKILLI VE KADEMELİ KAPATMA (ESC ve Geri Tuşu)
  const handleSmartClose = useCallback((e) => {
    const stopEvent = () => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        else if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') e.nativeEvent.stopImmediatePropagation();
      }
    };

    if (isChatOpen) {
      stopEvent();
      setIsChatOpen(false);
      return true;
    }

// Stok Seçim Modalı Açıksa ÖNCE ONU KAPAT
if (showStockSelectorModal) { stopEvent(); setShowStockSelectorModal(false); return true; }
if (showMaterialModal) { stopEvent(); setShowMaterialModal(false); return true; }
if (showSOSModal) { stopEvent(); setShowSOSModal(false); return true; }

    if (selectedJob) {
      stopEvent();
      setSelectedJob(null);
      return true;
    }

    if (isMobileMenuOpen) {
      stopEvent();
      setIsMobileMenuOpen(false);
      return true;
    }

    return false;
  }, [selectedJob, isChatOpen, isMobileMenuOpen, showStockSelectorModal, showMaterialModal, showSOSModal]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleSmartClose(e);
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleSmartClose]);

  useEffect(() => {
    if (selectedJob || isChatOpen || isMobileMenuOpen) {
        window.history.pushState({ internalLayer: true }, '');
    }
  }, [selectedJob, isChatOpen, isMobileMenuOpen]);

  useEffect(() => {
    const handlePopState = (e) => { handleSmartClose(e); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleSmartClose]);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isIOSDevice) {
      setIsIos(true);
      setTimeout(() => setShowPwaPrompt(true), 2000);
    } else {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShowPwaPrompt(true), 2000);
      };
      window.addEventListener('beforeinstallprompt', handler);
      
      // Global yakalanan event varsa onu kullan
      if (window.pwaDeferredPrompt) {
        handler(window.pwaDeferredPrompt);
        window.pwaDeferredPrompt = null;
      }

      const handleInstalled = () => {
        setInstallState('success');
        setTimeout(() => setShowPwaPrompt(false), 3000);
      };
      window.addEventListener('appinstalled', handleInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); 
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallState('success');
        setTimeout(() => setShowPwaPrompt(false), 3000);
      }
      setDeferredPrompt(null);
    }
  };

  const syncOfflineActions = async () => {
    const pending = JSON.parse(localStorage.getItem(`offline_actions_${slug}`) || '[]');
    if (pending.length === 0) {
      setPendingSyncCount(0);
      return;
    }
    
    const remaining = [];
    const token = localStorage.getItem('staff_authToken'); 
    let hasChanges = false;

    for (const item of pending) {
      // Hatalı işlemlerin sonsuza kadar döngüye girmesini engellemek için deneme sayacı
      item.retryCount = (item.retryCount || 0) + 1;

      try {
        const res = await fetch(`${API_URL}/${item.endpoint}`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
          body: JSON.stringify({ ...item.body, slug }) 
        });
        
        if (res.ok) {
           hasChanges = true; // Başarılı, kuyruktan silinecek
        } else {
           // Sunucu hata verse bile EMEĞİ ASLA SİLME, kuyrukta tutmaya devam et!
           console.warn(`Sunucu hatası (Kod: ${res.status}). İşlem silinmedi, kuyrukta bekliyor.`);
           remaining.push(item); 
        }
      } catch (e) {
        // İnternet yok. ASLA SİLME, kuyrukta tutmaya devam et!
        remaining.push(item);
      }
    }
    
    localStorage.setItem(`offline_actions_${slug}`, JSON.stringify(remaining));
    setPendingSyncCount(remaining.length);
    if (hasChanges) fetchData(true);
  };

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); syncOfflineActions(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const pending = JSON.parse(localStorage.getItem(`offline_actions_${slug}`) || '[]');
    setPendingSyncCount(pending.length);
    if (navigator.onLine) syncOfflineActions();

    return () => { 
      window.removeEventListener('online', handleOnline); 
      window.removeEventListener('offline', handleOffline); 
    };
  }, [slug]);

  const fetchData = async (isInitial = false) => {
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    let token = localStorage.getItem('staff_authToken') || getCookie('staff_authToken'); 
    let role = localStorage.getItem('staff_userRole') || getCookie('staff_userRole'); 

    // iOS PWA LocalStorage Wipe Bug Kurtarma
    if (token && !localStorage.getItem('staff_authToken')) {
        localStorage.setItem('staff_authToken', token);
        localStorage.setItem('staff_userRole', role);
        localStorage.setItem('staff_userSlug', getCookie('staff_userSlug'));
        const cName = getCookie('staff_userName');
        if (cName) localStorage.setItem('staff_userName', decodeURIComponent(cName));
    }

    if (!token || role !== 'Usta') {
      localStorage.removeItem('staff_authToken');
      localStorage.removeItem('staff_userRole');
      localStorage.removeItem('staff_userName');
      localStorage.removeItem('staff_userSlug');
      router.push(`/${slug}/login`);
      return;
    }

    const decoded = parseJwt(token);
    setUserData(decoded);

    try {
      const res = await fetch(`${API_URL}/dashboard-data?slug=${slug}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        setData(result); 
        localStorage.setItem(`worker_cache_${slug}`, JSON.stringify(result));
        setIsOffline(false);
        setCompanyName(result.name);
        setCompanySector(result.sector || '');
        const myStaffRecord = result.staff.find(s => String(s.id) === String(decoded.id));
        if (myStaffRecord) setStaffBranch(myStaffRecord.branch);
        const myJobs = result.jobs.filter(j => String(j.staff_id) === String(decoded.id));
        setJobs(myJobs);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (error) {
      console.warn("Veri çekilemedi, cache kullanılıyor:", error);
      setIsOffline(true);
      const cachedData = localStorage.getItem(`worker_cache_${slug}`);
      if (cachedData) {
         const data = JSON.parse(cachedData);
         setCompanyName(data.name);
         setCompanySector(data.sector || '');
         const myStaffRecord = data.staff.find(s => String(s.id) === String(decoded.id));
         if (myStaffRecord) setStaffBranch(myStaffRecord.branch);
         const myJobs = data.jobs.filter(j => String(j.staff_id) === String(decoded.id));
         setJobs(myJobs);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeChatId) return;
    const token = localStorage.getItem('staff_authToken');
    try {
      const res = await fetch(`${API_URL}/get-messages?slug=${slug}&staffId=${activeChatId}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      setMessages(await res.json() || []);
    } catch (err) {}
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    const token = localStorage.getItem('staff_authToken');
    await fetch(`${API_URL}/send-message`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slug, senderId: userData?.id, receiverId: activeChatId, message: messageInput }) 
    });
    setMessageInput(''); 
    fetchMessages();
  };

  useEffect(() => {
    fetchData(true);
    const int = setInterval(() => fetchData(false), 15000); 
    return () => clearInterval(int);
  }, [slug, router]);

  useEffect(() => { 
    if (isChatOpen && activeChatId) fetchMessages(); 
  }, [isChatOpen, activeChatId]);

  useEffect(() => {
    setDynamicForm({});
    setJobNote('');
    setPhotos([]);
  }, [selectedJob]);

  const handleLogout = () => {
    localStorage.removeItem('staff_authToken');
    localStorage.removeItem('staff_userRole');
    localStorage.removeItem('staff_userName');
    localStorage.removeItem('staff_userSlug');
    
    // Cookie'leri de temizle ki tam çıkış yapılsın
    document.cookie = "staff_authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "staff_userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "staff_userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "staff_userSlug=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    router.push(`/${slug}/login`);
  };

  const handleDynamicFormChange = (name, value) => {
    setDynamicForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setIsSaving(true);
    const compressedPhotos = [];
    
    for (const file of files) {
        const compressed = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1920; 
                    let scale = 1;
                    if (img.width > MAX_WIDTH) scale = MAX_WIDTH / img.width; 
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.90)); 
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
        compressedPhotos.push(compressed);
    }
    
    setPhotos(prev => [...prev, ...compressedPhotos]);
    setIsSaving(false);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const getAssignerInfo = (job) => {
    const ownerName = data?.ownerName?.split(' ')[0] || 'Patron';
    const creator = job.creator_name || job.details?.createdBy || ownerName;
    let manager = job.manager_name || job.details?.managerName || null;
    
    const assignedPerson = data?.staff?.find(s => String(s.id) === String(job.staff_id));
    if (assignedPerson && assignedPerson.role === 'Yönetici' && !manager) manager = assignedPerson.name;
    if (manager) return { name: manager, role: 'Sorumlu Yönetici', icon: 'ShieldCheck' };
    return { name: creator, role: 'Görevlendiren', icon: 'UserPlus' };
  };

  const getAssetDetails = (assetId) => {
    if (!assetId || !data?.assets) return null;
    return data.assets.find(a => String(a.id) === String(assetId)) || null;
  };


// 🚀 İMZA ÇİZİM (CANVAS) FONKSİYONLARI
const getCoordinates = (e) => {
  const canvas = signatureCanvasRef.current;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const startDrawing = (e) => {
  setIsDrawing(true);
  const coords = getCoordinates(e);
  const ctx = signatureCanvasRef.current?.getContext('2d');
  if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
  }
};

const draw = (e) => {
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
      // 🚀 ÇÖZÜM: İmzanın tam çizilmesini bekleyip state'e öyle atıyoruz.
      setTimeout(() => {
          setSignatureImage(canvas.toDataURL('image/png'));
      }, 50);
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

const handleStatusUpdate = async (newStatus) => {
  // 🚀 ANA EKRAN HIZLI TAMAMLAMA ENGELLENİYOR! Usta modalı açıp imza atmak ZORUNDA.
  if (newStatus === 'Tamamlandı' && selectedJob.work_type === 'Periyodik Bakım' && !signatureImage) {
      setNotification({show: true, msg: "Periyodik Bakım işlemini bitirmek için müşteriden imza almanız gerekmektedir.", type: 'error'});
      setTimeout(() => setNotification({show: false, msg: '', type: 'success'}), 4000);
      return;
  }

  setIsSaving(true);
  const token = localStorage.getItem('staff_authToken'); 

  let formText = '';
  
  // 🚀 DÜZELTME: Eğer iş "Periyodik Bakım" ise onay beklemeden DİREKT Tamamlandı'ya gitsin. Değilse Onay Beklesin.
  let targetStatus = newStatus;
  if (newStatus === 'Tamamlandı') {
        targetStatus = selectedJob.work_type === 'Periyodik Bakım' ? 'Tamamlandı' : 'Onay Bekliyor';
  }

  if ((targetStatus === 'Onay Bekliyor' || targetStatus === 'Tamamlandı') && currentFields.length > 0) {
        const filledData = currentFields.map(f => `${f.label}: ${dynamicForm[f.name] || 'Belirtilmedi'}`).join('\n');
        formText = `\n--- ${staffBranch} Saha Formu ---\n${filledData}\n----------------------------------\n`;
    }

    let gpsNote = '';
    if (targetStatus === 'Onay Bekliyor' && navigator.geolocation) {
       try {
         const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
         });
         // 🚀 DÜZELTİLDİ: Stabil Harita Linki
         gpsNote = `\n[📍 Konum Kaydı]: https://www.google.com/maps/search/?api=1&query=$${pos.coords.latitude},${pos.coords.longitude}`;
       } catch (e) {
         console.warn("Konum alınamadı.");
       }
    }

    const finalNote = [
        selectedJob.details?.note || '', 
        formText, 
        jobNote ? `[Usta Notu]: ${jobNote}` : '',
        gpsNote
    ].filter(Boolean).join('\n\n').trim();

    const payload = {
      id: selectedJob.id,
      status: targetStatus,
      taskNote: finalNote ? finalNote : undefined,
      lastEditedBy: userData.name,
      photos: photos,
      signatureImage: signatureImage,
      signatureName: signatureName,
      usedMaterials: usedMaterials || []
  };

    const attemptRequest = async (retries = 3) => {
      try {
          const res = await fetch(`${API_URL}/update-job`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ ...payload, slug })
          });

          if (!res.ok) {
              if (retries > 0) {
                  await new Promise(r => setTimeout(r, 2000));
                  return await attemptRequest(retries - 1);
              }
              throw new Error("Sunucu yanıt vermedi.");
          }

          // Başarılı olduğunda true dön
          return true;
      } catch (e) {
          if (retries > 0) {
              await new Promise(r => setTimeout(r, 3000));
              return await attemptRequest(retries - 1);
          }
          // Tüm denemeler bitti ve hala hata varsa fırlat
          throw e;
      }
  };

  try {
    // İstek atılır
    await attemptRequest();
    
    // EĞER BURAYA GELDİYSE İŞLEM KESİN BAŞARILIDIR
    localStorage.removeItem(`draft_${slug}_${selectedJob.id}`);
    
    // Fiş Yazdırmayı Tetikle (Sadece Periyodik Bakımsa VE İŞ TAMAMLANDIYSA)
    if (targetStatus === 'Tamamlandı' && selectedJob.work_type === 'Periyodik Bakım') {
        setSelectedThermalJob({
            ...selectedJob, 
            details: { ...selectedJob.details, note: finalNote, usedMaterials: usedMaterials }, 
            signature_url: signatureImage, 
            customer_signature_name: signatureName
        });
        setShowThermalPrintModal(true);
    }

    setSelectedJob(null);
    setJobNote('');
    setDynamicForm({});
    setPhotos([]);
    setUsedMaterials([]);
    setWizardStep(1);
    clearSignature(); 
    await fetchData(); 
    
} catch (e) {
      // EĞER BURAYA GELDİYSE GERÇEKTEN İNTERNET YOKTUR (KUYRUĞA ALIR)
      console.warn("Bağlantı kurulamadı, işlem kuyruğa alındı.");
      const pending = JSON.parse(localStorage.getItem(`offline_actions_${slug}`) || '[]');
      pending.push({ endpoint: 'update-job', body: payload, timestamp: new Date().toISOString() });
      localStorage.setItem(`offline_actions_${slug}`, JSON.stringify(pending));
      setPendingSyncCount(pending.length);
      setIsOffline(true);

      // Arayüzü sanki başarılı olmuş gibi optimistik (geçici) olarak güncelle
      const updatedJobs = jobs.map(j => {
          if (j.id === selectedJob.id) return { ...j, status: targetStatus, details: { ...j.details, note: finalNote } };
          return j;
      });
      setJobs(updatedJobs);
      setSelectedJob(null);
      setJobNote('');
      setDynamicForm({});
      setPhotos([]);
      clearSignature(); // İmzayı temizle
  } finally {
      setIsSaving(false);
  }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-900">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="mb-4">
            <PenTool className="text-emerald-500 w-12 h-12" />
        </motion.div>
        <div className="text-white font-black tracking-widest text-[11px] uppercase opacity-50">Saha Verileri Alınıyor...</div>
      </div>
    );
  }

  const activeJobs = jobs.filter(j => j.status === 'Devam Ediyor' || j.status === 'Sahada');
  const pendingJobs = jobs.filter(j => j.status === 'Beklemede' || j.status === 'Gelecek' || j.status === 'Usta Bekliyor');
  const completedJobs = jobs.filter(j => j.status === 'Tamamlandı');

  const isPastDue = data?.subscription_status === 'past_due';

  // 🚀 EKLENDİ: Paywall kontrolü. Eğer süre bittiyse (past_due) veya iptal edildiyse (canceled) arkadaki HİÇBİR ŞEYİ yükleme. Sadece siyah karartılmış ekranı ver.
  if (isPastDue || data?.subscription_status === 'canceled') {
      return (
          <div className="bg-neutral-950 min-h-screen">
            <PaywallOverlay slug={slug} role="Usta" />
          </div>
      );
  }

  return (
    <div className="min-h-[100dvh] flex font-sans text-sm overflow-hidden relative selection:bg-blue-100 bg-[#F8FAFC] text-slate-900">
      
      <div className="z-[300] lg:relative absolute">
        <WorkerSidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-y-auto relative z-10 w-full">
        <Header data={data} setIsMobileMenuOpen={setIsMobileMenuOpen} setSelectedJob={setSelectedJob} />

        {showPwaPrompt && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }} 
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[420px] bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl z-[9999] flex flex-row items-center justify-between border border-slate-700"
          >
            {installState === 'success' ? (
              <div className="flex items-center gap-3 w-full justify-center py-1">
                <div className="bg-emerald-500 p-2 rounded-full shrink-0">
                  <Check size={20} className="text-white" />
                </div>
                <div className="flex flex-col flex-1 min-w-0 pr-2">
                  <span className="font-bold text-sm text-emerald-400">Kurulum Başarılı!</span>
                  <span className="text-xs text-slate-400 mt-0.5">Saha uygulamasını ana ekrandan açabilirsiniz.</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-blue-500 p-2.5 rounded-xl shrink-0">
                    <Download size={20} className="text-white" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className="font-bold text-sm">Uygulamayı Yükle</span>
                    {isIos ? (
                      <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        Yüklemek için <Share size={12} className="inline-block mx-0.5 mb-0.5" /> <b>Paylaş</b> ikonuna basıp <br/> <b>Ana Ekrana Ekle</b>'yi seçin.
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 mt-0.5">Saha işlemlerini hızlıca yönetin.</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  {!isIos && (
                    <button onClick={handleInstallPwa} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">
                      Yükle
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

<AnimatePresence>
          {(isOffline || pendingSyncCount > 0) && (
              <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="bg-amber-500 text-amber-950 px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-center gap-2 z-50 shadow-md sticky top-0"
              >
              <WifiOff size={16} />
              <span className="text-center">{isOffline ? 'İnternet Yok. İşlemleriniz kaydediliyor.' : 'Bağlantı sağlandı. Veriler gönderiliyor...'}</span>
              {pendingSyncCount > 0 && (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-center mt-1 sm:mt-0 ml-0 sm:ml-2">
                      <span className="bg-amber-950 text-amber-400 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                          Kuyrukta {pendingSyncCount} işlem var
                      </span>
                      <button 
                          onClick={() => {
                              localStorage.removeItem(`offline_actions_${slug}`);
                              setPendingSyncCount(0);
                              fetchData(true);
                          }} 
                          className="bg-white/20 hover:bg-white/30 text-amber-950 px-2 py-1 rounded border border-amber-950/20 transition-colors active:scale-95 font-black"
                      >
                          İptal Et / Temizle
                      </button>
                  </div>
              )}
              </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-slate-900 text-white p-5 rounded-b-3xl shadow-xl z-40 relative md:mx-6 md:mt-6 md:rounded-3xl shrink-0">
          <div className="flex justify-between items-start mb-4">
              <div>
                  <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">{companyName}</div>
                  <h1 className="text-2xl font-black tracking-tight">Merhaba, {userData?.name?.split(' ')[0]}</h1>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl font-black border border-white/20">
                  {userData?.name?.charAt(0)}
              </div>
          </div>
          <div className="flex gap-2">
              <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/5">
                  <div className="text-2xl font-black text-emerald-400">{activeJobs.length + pendingJobs.length}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Bekleyen İş</div>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/5">
                  <div className="text-2xl font-black text-blue-400">{completedJobs.length}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Bitirilen</div>
              </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 space-y-6 max-w-6xl w-full mx-auto pb-24">
          
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              
              {activeJobs.length > 0 && (
                <div>
                  <h2 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <PlayCircle size={14} /> ŞU AN ÜZERİNDE ÇALIŞTIĞINIZ
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {activeJobs.map(job => {
                        const assigner = getAssignerInfo(job);
                        const asset = getAssetDetails(job.asset_id);
                        return (
                        <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-600/20 text-white active:scale-95 transition-transform cursor-pointer border border-blue-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                  <span className="bg-white/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md">Devam Ediyor</span>
                                  <span className="text-[10px] font-bold opacity-80 flex items-center gap-1"><Clock size={10}/> {job.scheduled_date || 'Anlık'}</span>
                                </div>
                                
                                <h3 className="text-lg font-black leading-tight mb-1 truncate">
                                    {asset ? (asset.apartmentName || asset.name) : job.customer_name}
                               </h3>
                                
                                <p className="text-blue-100 text-xs font-medium flex items-center gap-1.5 mb-1 truncate">
                                    <User size={12} className="shrink-0"/> {job.customer_name}
                                </p>

                                <div className="text-[11px] font-medium text-blue-200 mt-2 bg-blue-700/50 p-2 rounded-xl border border-blue-500/50 truncate">
                                    <span className="font-bold flex items-center gap-1 mb-0.5"><Briefcase size={12}/> {job.work_type}</span>
                                    {asset && `📍 ${asset.location}`}
                                </div>

                                <div className="mt-3 pt-3 border-t border-blue-500/50 flex items-center gap-1.5 text-[11px] text-blue-100">
                                  {assigner.icon === 'ShieldCheck' ? <ShieldCheck size={14} /> : <UserPlus size={14} />}
                                  <span className="opacity-80">{assigner.role}:</span> <span className="font-bold text-white">{assigner.name}</span>
                                </div>
                            </div>
                        </div>
                      )})}
                  </div>
                </div>
              )}

<div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={14} /> SIRADAKİ GÖREVLER
                    </h2>
                    
                    {/* 🚀 YENİ HIZLI ERİŞİM BUTONLARI */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={openGoogleMapsRoute}
                            className="flex-1 sm:flex-none bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        >
                            <Map size={14} /> Rotayı Çiz
                        </button>
                        <button 
                            onClick={() => setShowMaterialModal(true)}
                            className="flex-1 sm:flex-none bg-slate-900 text-white hover:bg-slate-800 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
                        >
                            <PlusCircle size={14} /> Malzeme İste
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pendingJobs.length > 0 ? pendingJobs.map(job => {
                      const assigner = getAssignerInfo(job);
                      const asset = getAssetDetails(job.asset_id);
                      return (
                      <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-95 transition-transform cursor-pointer hover:border-blue-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">{job.status}</span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/> {job.scheduled_date || 'Anlık'}</span>
                          </div>
                          
                          <h3 className="text-base font-black text-slate-800 leading-tight mb-1 truncate">
                              {asset ? (asset.apartmentName || asset.name) : job.customer_name}
                          </h3>
                          
                          <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mb-1 truncate">
                              <User size={12} className="shrink-0 text-slate-400"/> {job.customer_name}
                          </p>
                          
                          <div className="text-[11px] font-medium text-slate-500 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100 truncate">
                              <span className="font-bold flex items-center gap-1 mb-0.5 text-blue-600"><Briefcase size={12}/> {job.work_type}</span>
                              {asset && `📍 ${asset.location}`}
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                            {assigner.icon === 'ShieldCheck' ? <ShieldCheck size={14} className="text-blue-500" /> : <UserPlus size={14} className="text-slate-400" />}
                            <span>{assigner.role}:</span> <span className="font-bold text-slate-700">{assigner.name}</span>
                          </div>
                      </div>
                    )}) : (
                      <div className="col-span-full text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium text-sm">
                        Bekleyen yeni bir göreviniz yok.
                      </div>
                    )}
                </div>
              </div>

            </div>
          )}

{activeTab === 'completed' && (
             <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div>
                       <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                          <CheckCircle2 className="text-emerald-500" /> Tamamlanan İş Geçmişi
                       </h2>
                       <p className="text-sm text-slate-500 mt-1 font-medium">Bugüne kadar başarıyla bitirdiğiniz tüm görevler.</p>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row gap-4 sm:items-center w-full sm:w-auto">
                       {/* 🚀 YENİ EKLENEN ARAMA KUTUSU */}
                       <div className="relative w-full sm:w-64">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                           <input 
                               type="text" 
                               placeholder="Müşteri veya İş Ara..." 
                               className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all"
                               onChange={(e) => {
                                   const val = e.target.value.toLowerCase();
                                   const cards = document.querySelectorAll('.completed-job-card');
                                   cards.forEach((card) => {
                                       const text = card.textContent.toLowerCase();
                                       card.style.display = text.includes(val) ? 'flex' : 'none';
                                   });
                               }}
                           />
                       </div>

                       {/* 🚀 VERİ KUTUSU */}
                       <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-3 shrink-0 hidden sm:flex">
                           <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-emerald-200 flex items-center justify-center">
                               <span className="text-lg font-black text-emerald-600">{completedJobs.length}</span>
                           </div>
                           <div className="pr-2">
                               <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Toplam İşlem</div>
                               <div className="text-xs font-bold text-emerald-900">Görev Bitti</div>
                           </div>
                       </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedJobs.length > 0 ? completedJobs.map(job => {
                      const asset = getAssetDetails(job.asset_id);
                      return (
                        <div key={job.id} onClick={() => setSelectedJob(job)} className="completed-job-card bg-white rounded-2xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors group flex flex-col justify-between">
                          <div>
                              <div className="flex justify-between items-start mb-3">
                                 <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100">{job.status}</span>
                                 <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/> {new Date(job.created_at).toLocaleDateString('tr-TR')}</span>
                              </div>
                              
                              <h3 className="text-base font-black text-slate-800 leading-tight mb-1 truncate group-hover:text-emerald-700 transition-colors">
                                  {asset ? (asset.apartmentName || asset.name) : job.customer_name}
                              </h3>
                              
                              <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5 truncate">
                                  <User size={12} className="shrink-0"/> {job.customer_name}
                              </p>
                          </div>
                          
                          <div className="text-[11px] font-medium text-slate-500 mt-3 bg-slate-50 p-2 rounded-xl border border-slate-100 truncate">
                              <span className="font-bold flex items-center gap-1 text-emerald-600"><ClipboardList size={12}/> {job.work_type}</span>
                          </div>
                      </div>
                   )}) : (
                      <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium">
                         Henüz tamamlanmış bir işiniz bulunmuyor.
                      </div>
                   )}
                </div>
             </div>
          )}

        </div>

        <AnimatePresence>
          {selectedJob && (
            <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-4">
              
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" 
                onClick={() => handleSmartClose()}
              ></motion.div>
              
              <motion.div 
                initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 pb-8 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] border border-slate-200"
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0 md:hidden"></div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-4">
                    
                <div className="flex justify-between items-center sticky top-0 bg-white z-20 pb-2 border-b border-slate-100 mb-2">
                        <div className="flex items-center gap-2">
                           {wizardStep > 1 && selectedJob.status !== 'Tamamlandı' && (
                               <button onClick={() => setWizardStep(wizardStep - 1)} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg active:scale-95"><ChevronRight size={18} className="rotate-180" /></button>
                           )}
                           <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                               {selectedJob.status === 'Tamamlandı' ? 'GÖREV DETAYI' : `ADIM ${wizardStep} / ${selectedJob.work_type === 'Periyodik Bakım' && (selectedJob.status === 'Devam Ediyor' || selectedJob.status === 'Sahada') ? '3' : '2'}`}
                           </span>
                        </div>
                        <button onClick={() => handleSmartClose()} className="hidden md:flex p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-rose-100 hover:text-rose-600 transition-colors"><X size={16}/></button>
                    </div>

                    {/* 🚀 ADIM 1: GÖREV ÖZETİ VE KEŞİF */}
                    {wizardStep === 1 && (
                        <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="space-y-4">
                            {(() => {
                                const customerInfo = data?.customers?.find(c => c.name === selectedJob.customer_name);
                                return (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><User size={12}/> Müşteri</div>
                                            <h2 className="text-lg font-black text-slate-900 leading-tight mb-1 truncate">{selectedJob.customer_name}</h2>
                                            {customerInfo?.contact ? <div className="text-xs font-bold text-slate-600">{customerInfo.contact}</div> : <div className="text-xs font-semibold text-slate-400 italic">Telefon bilgisi yok</div>}
                                        </div>
                                        {customerInfo?.contact && (
                                            <a href={`tel:${customerInfo.contact.replace(/\s+/g, '')}`} className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm shrink-0 border border-emerald-100"><Phone size={20} /></a>
                                        )}
                                    </div>
                                );
                            })()}

                            {(() => {
                                const asset = getAssetDetails(selectedJob.asset_id);
                                if (!asset) return null;
                                const mapUrl = `https://www.google.com/maps/search/?api=1&query=$$${encodeURIComponent(asset.location || asset.apartmentName || asset.name)}`;
                                return (
                                   <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                       <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Box size={14} /> İlgili Varlık & Konum</div>
                                       <div className="text-sm font-black text-slate-800 mb-1">{asset.apartmentName || asset.name}</div>
                                       <div className="text-xs font-medium text-slate-600 mb-3">{asset.location || 'Konum belirtilmemiş.'}</div>
                                       <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-white border border-blue-200 text-blue-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"><MapPin size={16} /> Haritada Yol Tarifi Al</a>
                                   </div>
                                );
                            })()}
                            
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GÖREV BİLGİSİ / TALİMAT</div>
                                <div className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5"><PenTool size={14} className="text-blue-500"/> {selectedJob.work_type}</div>
                                
                                {(() => {
                                    const rawNote = selectedJob.details?.note;
                                    if (!rawNote) return null;
                                    
                                    if (!rawNote.includes('---') && !rawNote.includes('Saha Formu')) {
                                        return <div className="text-xs text-slate-600 italic border-l-2 border-slate-300 pl-3 whitespace-pre-wrap leading-relaxed">"{rawNote}"</div>;
                                    }

                                    const lines = rawNote.split('\n');
                                    let inForm = false;
                                    let checklist = [];
                                    let cleanNote = '';

                                    for (const line of lines) {
                                        if (line.includes('---') && line.includes('Saha Formu')) { inForm = true; continue; }
                                        if (inForm && line.includes('----------------------------------')) { inForm = false; continue; }

                                        if (inForm && line.includes(':')) {
                                            const [key, ...valArr] = line.split(':');
                                            checklist.push({ key: key.trim(), val: valArr.join(':').trim() });
                                        } else if (!inForm && line.trim() !== '') {
                                            cleanNote += line + '\n';
                                        }
                                    }
                                    
                                    cleanNote = cleanNote.replace(/\[Usta Notu\]:/g, '').replace(/\[📍 Konum Kaydı\].*/g, '').trim();

                                    return (
                                        <div className="space-y-3 mt-3">
                                            {checklist.length > 0 && (
                                                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2 flex items-center gap-1.5"><ClipboardList size={12}/> Kontrol Formu Yanıtları</div>
                                                    <div className="space-y-2">
                                                    {checklist.map((item, idx) => {
                                                            const valStr = item.val.toLowerCase().trim();
                                                            
                                                            const isBlue = valStr.includes('mavi');
                                                            const isGreen = valStr.includes('yeşil') || valStr.includes('yesil');
                                                            const isRed = valStr.includes('kırmızı') || valStr.includes('kirmizi');
                                                            const isYellow = valStr.includes('sarı') || valStr.includes('sari');
                                                            
                                                            const isChecked = ['evet', 'var', 'true', 'ok', 'uygun', 'sorunsuz'].some(v => valStr === v || valStr.includes(v));
                                                            const isNegative = ['hayır', 'hayir', 'yok', 'false', 'uygun değil', 'değil', 'sorunlu', 'kötü'].some(v => valStr === v || valStr.includes(v));
                                                            
                                                            return (
                                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                                    <span className="font-semibold text-slate-600">{item.key}</span>
                                                                    {isBlue ? (
                                                                        <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1 font-bold text-[10px]"><CheckCircle2 size={12}/> {item.val}</div>
                                                                    ) : isGreen ? (
                                                                        <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1 font-bold text-[10px]"><CheckCircle2 size={12}/> {item.val}</div>
                                                                    ) : isRed ? (
                                                                        <div className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded flex items-center gap-1 font-bold text-[10px]"><X size={12}/> {item.val}</div>
                                                                    ) : isYellow ? (
                                                                        <div className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1 font-bold text-[10px]"><AlertCircle size={12}/> {item.val}</div>
                                                                    ) : isChecked ? (
                                                                        <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1 font-bold text-[10px]"><CheckCircle2 size={12}/> {item.val}</div>
                                                                    ) : isNegative ? (
                                                                        <div className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded flex items-center gap-1 font-bold text-[10px]"><X size={12}/> {item.val}</div>
                                                                    ) : (
                                                                        <span className="font-bold text-slate-800">{item.val}</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            {cleanNote && (
                                                <div className="text-xs text-slate-600 italic border-l-2 border-blue-400 pl-3 py-1 whitespace-pre-wrap leading-relaxed bg-blue-50/50 rounded-r-xl">
                                                    {cleanNote}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}

                    {/* 🚀 ADIM 2: SAHA KAYITLARI, STOK VE FORM */}
                    {wizardStep === 2 && (
                        <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-4 pb-2">
                            {currentFields.length > 0 && (
                                <div className="bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100 space-y-4">
                                    <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-blue-200/50 pb-2 mb-3">
                                      <ClipboardList size={14} /> {staffBranch} KONTROL FORMU <span className="text-rose-500 ml-auto">*Zorunlu</span>
                                    </div>
                                    {currentFields.map(field => (
                                      <div key={field.name}>
                                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">{field.label}</label>
                                          {field.type === 'select' ? (
                                            <select className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500" value={dynamicForm[field.name] || ''} onChange={(e) => handleDynamicFormChange(field.name, e.target.value)}>
                                                <option value="">Seçiniz...</option>
                                                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                          ) : (
                                            <div className="relative">
                                                {field.type === 'textarea' ? (
                                                    <textarea rows={3} className="w-full bg-white border border-blue-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold outline-none focus:border-blue-500 resize-none" placeholder="Açıklama girin..." value={dynamicForm[field.name] || ''} onChange={(e) => handleDynamicFormChange(field.name, e.target.value)}></textarea>
                                                ) : (
                                                    <input type={field.type || 'text'} className={`w-full bg-white border border-blue-200 rounded-xl pl-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 ${field.type !== 'date' && field.type !== 'number' ? 'pr-10' : 'pr-4'}`} placeholder="Değer girin" value={dynamicForm[field.name] || ''} onChange={(e) => handleDynamicFormChange(field.name, e.target.value)} />
                                                )}
                                                
                                                {/* Sayı ve Tarih DEĞİLSE mikrofonu göster */}
                                                {field.type !== 'date' && field.type !== 'number' && (
                                                    <button type="button" onClick={() => handleSpeechToText('form', field.name)} className={`absolute right-2 ${field.type === 'textarea' ? 'top-3' : 'top-1/2 -translate-y-1/2'} p-1.5 rounded-lg transition-colors ${listeningField === field.name ? 'bg-rose-100 text-rose-600 animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}>
                                                        <Mic size={16} />
                                                    </button>
                                                )}
                                            </div>
                                          )}
                                      </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Yapılan İşlem / Saha Notu <span className="text-slate-400 font-medium normal-case">(İsteğe Bağlı)</span></label>
                                    <button onClick={() => handleSpeechToText('note')} className={`text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm border ${isListeningNote ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' : 'bg-white text-slate-600 border-slate-200 hover:text-blue-600 hover:border-blue-200 active:scale-95'}`}>
                                        <Mic size={12} /> {isListeningNote ? 'Sizi Dinliyor...' : 'Sesle Yazdır'}
                                    </button>
                                </div>
                                <textarea rows={3} value={jobNote} onChange={(e) => setJobNote(e.target.value)} placeholder="Yapılan işlemleri yazabilirsiniz..." className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-blue-500 shadow-sm" />
                            </div>

                            {/* 🚀 KULLANILAN MALZEMELER (STOK) */}
                            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                                <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center justify-between mb-3">
                                   <div className="flex items-center gap-1.5"><Box size={14}/> Kullanılan Malzemeler (Stok)</div>
                                </div>
                                
                                {/* YENİ: ŞIK STOK EKLEME BUTONU */}
                                <button 
                                    onClick={() => setShowStockSelectorModal(true)}
                                    className="w-full bg-white border border-amber-300 hover:border-amber-400 rounded-xl px-4 py-3.5 text-sm font-black text-amber-600 mb-3 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Package size={18} /> + Depodan Malzeme Seç
                                </button>
                                
                                {usedMaterials.map((mat, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200 mb-2 shadow-sm">
                                        <span className="text-xs font-bold text-slate-800 truncate pr-2">{mat.name}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <input type="number" min="1" value={mat.quantity} onChange={(e) => {
                                                const newMats = [...usedMaterials];
                                                newMats[index].quantity = e.target.value;
                                                setUsedMaterials(newMats);
                                            }} className="w-16 p-1 text-center border border-slate-200 rounded text-xs font-bold" />
                                            <span className="text-[10px] font-medium text-slate-500">{mat.unit}</span>
                                            <button onClick={() => setUsedMaterials(usedMaterials.filter((_, i) => i !== index))} className="text-rose-500 p-1"><X size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* FOTOĞRAF ALANI */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Saha Fotoğrafları (Opsiyonel)</label>
                                    <span className="text-[10px] font-bold text-slate-400">{photos.length} Seçildi</span>
                                </div>
                                <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" />
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all active:scale-95">
                                        <Camera size={24} className="mb-1" /><span className="text-[10px] font-bold">Ekle</span>
                                    </button>
                                    {photos.map((photoStr, idx) => (
                                        <div key={idx} className="w-20 h-20 relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                                            <img src={photoStr} alt="Önizleme" className="w-full h-full object-cover" />
                                            <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-rose-500 shadow-sm"><X size={12} strokeWidth={3} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 🚀 ADIM 3: MÜŞTERİ İMZASI (SADECE PERİYODİK BAKIM) */}
                    {wizardStep === 3 && selectedJob.work_type === 'Periyodik Bakım' && (
                        <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                <span>Müşteri / Yetkili İmzası <span className="text-rose-500">*Zorunlu</span></span>
                                {signatureImage && <button onClick={clearSignature} className="text-rose-500 underline font-bold">Temizle</button>}
                            </div>
                            <input 
                                type="text" placeholder="İmzalayan Kişinin Adı Soyadı" value={signatureName} onChange={(e) => setSignatureName(e.target.value)}
                                className="w-full px-4 py-3 mb-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-white"
                            />
                            <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white touch-none">
                                <canvas 
                                    ref={signatureCanvasRef} width={300} height={180} className="w-full h-[180px] cursor-crosshair"
                                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={endDrawing} onMouseLeave={endDrawing}
                                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={endDrawing} onTouchCancel={endDrawing}
                                ></canvas>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="pt-5 shrink-0 space-y-3 border-t border-slate-100 mt-2">
                    {/* 🚀 DİNAMİK BUTON YÖNETİMİ */}
                    {selectedJob.status === 'Tamamlandı' ? (
                        <button onClick={() => {
                            setSelectedThermalJob(selectedJob);
                            setShowThermalPrintModal(true);
                        }} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-emerald-200 active:scale-95 flex justify-center gap-2 transition-all">
                            <ClipboardList size={20} /> Fişi Görüntüle / Yazdır
                        </button>
                    ) : selectedJob.status === 'Beklemede' || selectedJob.status === 'Gelecek' || selectedJob.status === 'Usta Bekliyor' ? (
                        <button onClick={() => handleStatusUpdate('Devam Ediyor')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-blue-200 active:scale-95 flex justify-center gap-2">
                            {isSaving ? <Loader2 className="animate-spin" /> : <><PlayCircle size={20} /> İşe Başla / Keşfe Çıktım</>}
                        </button>
                    ) : (
                        <>
                            {wizardStep === 1 && (
                                <button onClick={() => setWizardStep(2)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-blue-200 active:scale-95 flex justify-center gap-2">
                                    Formu Doldurmaya Başla <ChevronRight size={20} />
                                </button>
                            )}
                            
                            {wizardStep === 2 && selectedJob.work_type === 'Periyodik Bakım' && (
                                <div className="flex gap-3">
                                    <button onClick={() => setWizardStep(1)} className="w-1/3 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-base active:scale-95 transition-all border border-slate-200">
                                        Geri
                                    </button>
                                    <button onClick={() => setWizardStep(3)} disabled={!isStep2Valid()} className="w-2/3 bg-indigo-600 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-indigo-200 active:scale-95 flex justify-center gap-2 transition-all">
                                        İleri <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}

                            {wizardStep === 2 && selectedJob.work_type !== 'Periyodik Bakım' && (
                                <div className="flex gap-3">
                                    <button onClick={() => setWizardStep(1)} className="w-1/3 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-base active:scale-95 transition-all border border-slate-200">
                                        Geri
                                    </button>
                                    <button onClick={() => handleStatusUpdate('Tamamlandı')} disabled={!isStep2Valid() || isSaving} className="w-2/3 bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-emerald-200 active:scale-95 flex justify-center gap-2 transition-all">
                                        {isSaving ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> İşi Tamamla</>}
                                    </button>
                                </div>
                            )}

                            {wizardStep === 3 && (
                                <div className="flex gap-3">
                                    <button onClick={() => setWizardStep(2)} className="w-1/3 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-base active:scale-95 transition-all border border-slate-200">
                                        Geri
                                    </button>
                                    <button onClick={() => handleStatusUpdate('Tamamlandı')} disabled={!signatureImage || !signatureName.trim() || isSaving} className="w-2/3 bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-emerald-200 active:scale-95 flex justify-center gap-2 transition-all">
                                        {isSaving ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> Onayla & Yazdır</>}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    <button onClick={() => handleSmartClose()} className="w-full bg-white text-slate-600 py-3 rounded-2xl font-bold text-sm border-2 border-slate-200 active:scale-95 transition-all md:hidden">Vazgeç / Kapat</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {data && (
          <DynamicPWA 
            companyName={data?.name} 
            companyLogo={data?.logo} 
          />
        )}

<ChatPanel 
          isChatOpen={isChatOpen} 
          setIsChatOpen={setIsChatOpen} 
          activeChatId={activeChatId} 
          setActiveChatId={setActiveChatId} 
          data={data} 
          messages={messages} 
          setMessages={setMessages} 
          messageInput={messageInput} 
          setMessageInput={setMessageInput} 
          sendMessage={sendMessage} 
        />

        {/* 🚀 EKLENDİ: Usta için Termal Yazıcı Modalı */}
        <ThermalPrintModal 
          isOpen={showThermalPrintModal} 
          onClose={() => setShowThermalPrintModal(false)} 
          job={selectedThermalJob} 
          companyName={data?.name || 'İşletme'} 
          companyLogo={data?.logo}
          assets={data?.assets}

          /* İletişim bilgilerini aktaran yeni satırlar */
          landlinePhone={data?.landlinePhone}
          whatsappPhone={data?.whatsappPhone}
          companyWebsite={data?.website}
        />

        {/* 🚀 YENİ STOK SEÇİM MODALI (Tam Ekran, Arama ve Kategorili) */}
        <AnimatePresence>
            {showStockSelectorModal && (
                <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" 
                        onClick={() => setShowStockSelectorModal(false)}
                    ></motion.div>
                    
                    <motion.div 
                        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] border border-slate-200 overflow-hidden"
                    >
                        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Box size={22} className="text-amber-500"/> Depodan Seç</h2>
                                <button onClick={() => setShowStockSelectorModal(false)} className="p-2 bg-white text-slate-400 hover:text-rose-500 rounded-xl transition-colors shadow-sm"><X size={20}/></button>
                            </div>
                            
                            <div className="flex gap-2">
                                {/* Arama Kutusu */}
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" placeholder="Malzeme Ara..." 
                                        className="w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 shadow-inner bg-white"
                                        value={stockSearchTerm} onChange={e => setStockSearchTerm(e.target.value)}
                                    />
                                    <button onClick={() => handleSpeechToText('stock')} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListeningStock ? 'bg-rose-100 text-rose-600 animate-pulse' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}>
                                        <Mic size={16} />
                                    </button>
                                </div>
                                {/* Kategori Filtresi */}
                                <select 
                                    className="w-[130px] px-3 py-3 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-white text-slate-600 focus:border-amber-400"
                                    value={selectedStockCategory} onChange={e => setSelectedStockCategory(e.target.value)}
                                >
                                    <option value="Tümü">Tüm Kategoriler</option>
                                    {Array.from(new Set((data?.stock || []).map((s) => s.category || 'Diğer'))).map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 bg-slate-50/50">
                            <div className="grid grid-cols-1 gap-2">
                                {(() => {
                                    const filtered = (data?.stock || []).filter((item) => {
                                        const matchSearch = item.item_name.toLowerCase().includes(stockSearchTerm.toLowerCase());
                                        const matchCategory = selectedStockCategory === 'Tümü' || (item.category || 'Diğer') === selectedStockCategory;
                                        return matchSearch && matchCategory;
                                    });

                                    if (filtered.length === 0) return <div className="text-center text-slate-400 font-medium py-10 text-sm">Aradığınız malzeme bulunamadı.</div>;

                                    return filtered.map((item) => {
                                        const isAlreadyAdded = usedMaterials.some((m) => m.id === item.id);
                                        return (
                                            <div key={item.id} className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-amber-300 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-800 text-sm truncate">{item.item_name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{item.category || 'Diğer'}</span>
                                                        <span className="text-[10px] font-bold text-amber-600">Stok: {item.quantity} {item.unit_name}</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    disabled={isAlreadyAdded}
                                                    onClick={() => {
                                                        setUsedMaterials([...usedMaterials, { id: item.id, name: item.item_name, quantity: 1, unit: item.unit_name }]);
                                                        setShowStockSelectorModal(false);
                                                        setStockSearchTerm(''); // Arama sıfırlanır
                                                    }}
                                                    className={`shrink-0 px-4 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 ${isAlreadyAdded ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-amber-100 hover:bg-amber-500 text-amber-700 hover:text-white border border-amber-200'}`}
                                                >
                                                    {isAlreadyAdded ? <CheckCircle2 size={16}/> : <Plus size={16}/>}
                                                    {isAlreadyAdded ? 'Eklendi' : 'Ekle'}
                                                </button>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* 🚀 ŞIK BİLDİRİM / HATA MODALI */}
        <AnimatePresence>
          {notification.show && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 z-[500] flex items-center justify-center p-4 pointer-events-none"
              >
                  <div className="bg-white/95 backdrop-blur-md border-2 border-slate-100 shadow-2xl rounded-3xl p-8 flex flex-col items-center text-center max-w-sm w-full pointer-events-auto">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner animate-pulse ${notification.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {notification.type === 'error' ? <AlertTriangle size={40} strokeWidth={3} /> : <CheckCircle2 size={40} strokeWidth={3} />}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1">{notification.type === 'error' ? 'Hata!' : 'Başarılı!'}</h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{notification.msg}</p>
                  </div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* 🚀 SABİT YÜZEN SOS BUTONU (Floating Action Button) */}
        {!showSOSModal && !selectedJob && (
            <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                onClick={() => setShowSOSModal(true)}
                className="fixed bottom-6 left-6 z-[350] w-14 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-[0_0_20px_rgba(225,29,72,0.5)] flex items-center justify-center transition-transform active:scale-90"
            >
                <AlertOctagon size={28} className="animate-pulse" />
            </motion.button>
        )}

        {/* 🚀 ACİL DURUM (SOS) MODALI */}
        <AnimatePresence>
            {showSOSModal && (
                <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-rose-950/80 backdrop-blur-sm cursor-pointer" onClick={() => setShowSOSModal(false)}></motion.div>
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", bounce: 0 }} className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col border border-rose-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3 shadow-inner"><AlertOctagon size={32} /></div>
                            <h2 className="text-xl font-black text-rose-600 uppercase tracking-widest">ACİL DURUM BİLDİRİMİ</h2>
                            <p className="text-xs text-slate-500 font-medium mt-2">Merkeze acil durum çağrısı gönderin. Konumunuz otomatik olarak iletilecektir.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Durum Türü</label>
                                <select value={sosType} onChange={e => setSosType(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-rose-400 bg-slate-50">
                                    <option value="Araç Arızası">Araç Arızası / Kaza</option>
                                    <option value="İş Kazası">İş Kazası / Yaralanma</option>
                                    <option value="Müşteri Sorunu">Müşteri ile Sorun</option>
                                    <option value="Diğer Acil Durum">Diğer Acil Durum</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Açıklama (İsteğe Bağlı)</label>
                                <textarea rows={2} value={sosMessage} onChange={e => setSosMessage(e.target.value)} placeholder="Kısaca durumu açıklayın..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-rose-400 bg-slate-50 resize-none"></textarea>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button disabled={isSaving} onClick={handleSendSOS} className="flex-[2] bg-rose-600 text-white font-black text-sm py-4 rounded-xl shadow-lg shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin" size={18}/> : <><Navigation size={18}/> ACİL ÇAĞRI GÖNDER</>}
                            </button>
                            <button onClick={() => setShowSOSModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold text-sm py-4 rounded-xl active:scale-95 transition-all">İptal</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* 🚀 MALZEME TALEP MODALI */}
        <AnimatePresence>
            {showMaterialModal && (
                <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" onClick={() => setShowMaterialModal(false)}></motion.div>
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", bounce: 0 }} className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] border border-slate-200 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Box size={22} className="text-blue-500"/> Malzeme Talep Et</h2>
                                <button onClick={() => setShowMaterialModal(false)} className="p-2 bg-white text-slate-400 hover:text-rose-500 rounded-xl transition-colors shadow-sm"><X size={20}/></button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Malzeme Ara..." value={materialSearch} onChange={e => setMaterialSearch(e.target.value)} className="w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 shadow-inner bg-white" />
                                <button onClick={() => handleSpeechToText('material')} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListeningMaterial ? 'bg-rose-100 text-rose-600 animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}>
                                    <Mic size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50/50 space-y-4">
                            <div className="bg-white p-3 rounded-2xl border border-slate-200">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Talep Edilenler Listesi ({materialRequestItems.length})</label>
                                {materialRequestItems.length === 0 ? (
                                    <div className="text-xs text-center text-slate-400 font-medium py-3">Henüz malzeme seçmediniz.</div>
                                ) : (
                                    materialRequestItems.map((mat, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-blue-50 p-2.5 rounded-lg border border-blue-100 mb-2">
                                            <span className="text-xs font-bold text-slate-800 truncate pr-2">{mat.name}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <input type="number" min="1" value={mat.qty} onChange={(e) => {
                                                    const newMats = [...materialRequestItems];
                                                    newMats[idx].qty = e.target.value;
                                                    setMaterialRequestItems(newMats);
                                                }} className="w-12 p-1 text-center border border-white rounded text-xs font-bold" />
                                                <span className="text-[10px] font-medium text-slate-500">{mat.unit}</span>
                                                <button onClick={() => setMaterialRequestItems(materialRequestItems.filter((_, i) => i !== idx))} className="text-rose-500 p-1"><X size={14}/></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {(() => {
                                    const filtered = (data?.stock || []).filter((item) => item.item_name.toLowerCase().includes(materialSearch.toLowerCase()));
                                    if (filtered.length === 0) return <div className="text-center text-slate-400 font-medium py-5 text-sm">Bulunamadı.</div>;

                                    return filtered.map((item) => {
                                        const isAdded = materialRequestItems.some((m) => m.id === item.id);
                                        return (
                                            <div key={item.id} className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-blue-300 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-800 text-sm truncate">{item.item_name}</div>
                                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md mt-1 inline-block">{item.category || 'Diğer'}</span>
                                                </div>
                                                <button disabled={isAdded} onClick={() => setMaterialRequestItems([...materialRequestItems, { id: item.id, name: item.item_name, qty: 1, unit: item.unit_name }])} className={`shrink-0 px-4 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 ${isAdded ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white'}`}>
                                                    {isAdded ? <CheckCircle2 size={16}/> : <PlusCircle size={16}/>} {isAdded ? 'Eklendi' : 'Ekle'}
                                                </button>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        <div className="p-5 sm:p-6 border-t border-slate-100 bg-white shrink-0">
                            <textarea rows={2} value={materialNote} onChange={e => setMaterialNote(e.target.value)} placeholder="Merkeze iletmek istediğiniz not (örn: Acil lazım, arabada bitti)..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 bg-slate-50 resize-none mb-3"></textarea>
                            <button disabled={isSaving || materialRequestItems.length === 0} onClick={handleRequestMaterial} className="w-full bg-slate-900 text-white font-black text-sm py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {isSaving ? <Loader2 className="animate-spin" size={18}/> : <><Send size={18}/> Talebi Gönder</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </main>

    </div>
  );
}