'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Globe,
  LogIn,
  CheckCircle,
  BarChart3,
  QrCode,
  Mic,
  Bell,
  Star,
  ArrowRight,
  ShieldCheck,
  Menu,
  X,
  LayoutDashboard,
  Briefcase,
  Users,
  CreditCard,
  Search,
  MoreVertical,
  MessageSquareText,
  Plus,
  Send,
  ChevronRight,
  Box,
  Package,
  Smartphone,
  WifiOff,
  LineChart,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  ArrowUpRight
} from 'lucide-react';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase'; 

// Sabit veriler
const SECTORS = [
  'Asansör Bakım & Montaj',
  //'İklimlendirme (Klima & Kombi)',
  //'Güvenlik Kamera & Alarm Sistemleri',
  //'Profesyonel Temizlik Hizmetleri',
  //'İlaçlama ve Pest Kontrol',
  //'Yangın Söndürme Sistemleri',
  //'Su Arıtma Sistemleri',
  //'Endüstriyel Kapı ve Kepenk',
  //'Diğer (Özel Sektör)',
];

const REVIEWS = [
  {
    name: 'Ahmet Y.',
    role: 'Asansör Bakım & Montaj',
    text: 'Usta performanslarını ölçmek kârımı %30 artırdı.',
  },
  {
    name: 'Özkan K.',
    role: 'Asansör Bakım & Montaj',
    text: 'Varlık yönetimi ile müşterilere kurumsal bir yüz sunuyoruz.',
  },
  {
    name: 'Mehmet D.',
    role: 'Asansör Bakım & Montaj',
    text: 'Sesle form doldurma sahadaki işleri çok hızlandırdı.',
  },
  {
    name: 'Fatih T.',
    role: 'Asansör Bakım & Montaj',
    text: 'Taşeronları tek ekrandan yönetmek harika.',
  },
];

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Mobil Uygulama',
    desc: 'Uygulama marketleriyle uğraşmadan, tek tıkla ana ekrana ekleyin ve anında kullanmaya başlayın.',
  },
  {
    icon: WifiOff,
    title: 'Çevrimdışı Çalışma',
    desc: 'İnternet kopsa bile sahadaki işlemler durmaz. Veriler kuyruğa alınır, bağlantı gelince otomatik senkronize edilir.',
  },
  {
    icon: QrCode,
    title: 'QR Varlık & Etiket',
    desc: 'Cihazlarınıza özel QR kodlar oluşturun. Müşterileriniz tek tıkla arıza bildirsin veya bakım geçmişini görsün.',
  },
  {
    icon: Mic,
    title: 'Sesle Akıllı Form',
    desc: 'Sahadaki ustalarınız yazmakla uğraşmasın. Sesi metne çeviren yapay zeka ile saniyeler içinde iş kaydı oluşturun.',
  },
  {
    icon: Package,
    title: 'Akıllı Stok & Depo',
    desc: 'Kritik stok seviyesi uyarıları alın. Tek tuşla tedarikçinize WhatsApp üzerinden otomatik sipariş mesajı gönderin.',
  },
  {
    icon: CreditCard,
    title: 'Finans ve Kasa Takibi',
    desc: 'İş bitiminde fiyatı girin, anında kasanıza işlensin. Gelir ve giderlerinizi tek ekrandan detaylı şekilde yönetin.',
  },
  {
    icon: Users,
    title: 'Personel & Saha Ekibi',
    desc: 'Ekibinizin anlık durumunu görün (Sahada, Müsait, İş Atandı). Yetenek ve branşlarına göre iş dağıtımı yapın.',
  },
  {
    icon: Bell,
    title: 'Anlık Bildirim & Acil Durum',
    desc: 'Acil durum butonları tetiklendiğinde veya yeni bir arıza bildirildiğinde saniyeler içinde haberiniz olsun.',
  },
  {
    icon: LineChart,
    title: 'Performans & Büyüme',
    desc: 'Otomatik hesaplanan büyüme oranları ve personel iş tamamlama istatistikleriyle işletmenizi verilerle büyütün.',
  },
];

const t = {
  brand: 'FixLog.co',
  login: 'Giriş Yap',
  tryFree: '14 Gün Ücretsiz Dene',
  heroTitle1: 'İşletmenizi Uçtan Uca,',
  heroTitle2: 'Sıfır Maliyet Kaybıyla Yönetin',
  heroDesc:
    'Personelinizi, iş emirlerinizi ve müşteri ağınızı tek ekranda birleştirin. Kurulum yok, donanım yok. Sadece tarayıcınızdan yönetin.',
  explore: 'Özellikleri İncele',
};

export default function LandingPage() {
  const router = useRouter();

  const handleLogin = () => router.push('/login');
  const handleRegister = () => router.push('/register');

  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const [mockupTab, setMockupTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffSlugInput, setStaffSlugInput] = useState('');

  const [infoModalContent, setInfoModalContent] = useState<{ title: string, content: string } | null>(null);

  // PWA Açılış Ekranı Yükleniyor Kontrolü
  const [isChecking, setIsChecking] = useState(true);

  const openInfoModal = (title: string, content: string) => {
    setInfoModalContent({ title, content });
    window.history.pushState({ modal: 'infoModal' }, '');
  };

  const closeInfoModal = () => {
    setInfoModalContent(null);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && infoModalContent) {
        closeInfoModal();
        if (window.history.state?.modal === 'infoModal') {
            window.history.back();
        }
      }
    };

    const handlePopState = () => {
      if (infoModalContent) {
        closeInfoModal();
      }
    };

    window.addEventListener('keydown', handleEsc);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [infoModalContent]);

  // YENİ: PWA AKILLI YÖNLENDİRİCİ (TRAFİK POLİSİ)
  useEffect(() => {
    // 🚀 BUG FIX: Token'ın süresinin dolup dolmadığını ve gerçek bir token olup olmadığını kontrol eden fonksiyon
    const isTokenValid = (token: string | null) => {
      if (!token || token === 'null' || token === 'undefined') return false;
      try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return false;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const payload = JSON.parse(jsonPayload);
        
        // Token süresi dolmuşsa (Backend milisaniye olarak exp gönderiyor)
        if (payload.exp && Date.now() > payload.exp * 1000) {
          return false;
        }
        return true;
      } catch (error) {
        return false;
      }
    };

    const patronToken = localStorage.getItem('patron_authToken');
    const patronSlug = localStorage.getItem('patron_userSlug');

    const staffToken = localStorage.getItem('staff_authToken');
    const staffSlug = localStorage.getItem('staff_userSlug');

    // 1. Patron ise ve token GÜNCELSE direkt Dashboard paneline fırlat
    if (isTokenValid(patronToken) && patronSlug && patronSlug !== 'null' && patronSlug !== 'undefined') {
      router.replace(`/${patronSlug}/dashboard`);
      return;
    }

    // 2. Personel ise ve token GÜNCELSE role göre fırlat
    if (isTokenValid(staffToken) && staffSlug && staffSlug !== 'null' && staffSlug !== 'undefined') {
      const staffRole = localStorage.getItem('staff_userRole');
      if (staffRole === 'Yönetici') {
        router.replace(`/${staffSlug}/manager`);
      } else if (staffRole === 'Usta') {
        router.replace(`/${staffSlug}/worker`);
      } else {
        router.replace(`/${staffSlug}/login`);
      }
      return;
    }

    // Çöp olmuş, süresi geçmiş veya bozuk tokenları localStorage'dan temizle ki arka planda bug yaratmasın
    if (patronToken && !isTokenValid(patronToken)) localStorage.removeItem('patron_authToken');
    if (staffToken && !isTokenValid(staffToken)) localStorage.removeItem('staff_authToken');

    // İkisi de yoksa veya geçersizse (yani yeni girmişse) landing page'i göster
    setIsChecking(false);
  }, [router]);

  useEffect(() => {
    const timer = setInterval(
      () => setReviewIndex((prev) => (prev + 1) % REVIEWS.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  const visibleReviews = [
    REVIEWS[reviewIndex],
    REVIEWS[(reviewIndex + 1) % REVIEWS.length],
    REVIEWS[(reviewIndex + 2) % REVIEWS.length],
  ];

  // Uygulama PWA olarak açılırken kim olduğunu bulana kadar beyaz ekran çıkmasın diye şık bir yükleyici
  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <ShieldCheck className="w-12 h-12 text-blue-500 mb-4 animate-pulse" />
        <span className="font-black tracking-widest text-[11px] uppercase opacity-50">Uygulama Hazırlanıyor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden flex flex-col relative">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            <span translate="no" className="notranslate text-xl font-black tracking-tight text-gray-900">
              {t.brand}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={handleLogin} className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 text-sm font-bold transition-all active:scale-95">
              <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">Patron Girişi</span><span className="sm:hidden">Giriş</span>
            </button>
            <button onClick={() => setIsStaffModalOpen(true)} className="hidden md:flex items-center gap-1.5 text-gray-600 hover:text-blue-600 text-sm font-bold transition-all active:scale-95">
              <Users className="w-4 h-4" /> Personel Girişi
            </button>
            <button onClick={handleRegister} className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md shadow-blue-600/20 items-center gap-2 hover:scale-105 active:scale-95">
              {t.tryFree}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95 ml-1">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-b border-gray-100 bg-white absolute w-full overflow-hidden shadow-2xl">
              <div className="px-4 pt-4 pb-6 flex flex-col gap-3">
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogin(); }} className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 hover:bg-gray-100 px-4 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95">
                  <LogIn className="w-4 h-4" /> Patron Girişi
                </button>
                <button onClick={() => { 
                    setIsMobileMenuOpen(false); 
                    setIsStaffModalOpen(true);
                }} className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95">
                  <Users className="w-4 h-4" /> Personel Girişi
                </button>
                <button onClick={() => { setIsMobileMenuOpen(false); handleRegister(); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95">
                  {t.tryFree}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        
        <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 overflow-hidden px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/70 via-white to-white">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-5 leading-[1.15]">
              {t.heroTitle1} <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500">
                {t.heroTitle2}
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-sm sm:text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed px-2 font-medium">
              {t.heroDesc}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row justify-center gap-3 mb-16 sm:mb-20 px-4">
              <button onClick={handleRegister} className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 sm:py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-900/20 w-full sm:w-auto active:scale-95">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
                {t.tryFree}
              </button>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white border-2 border-gray-200 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 sm:py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto hover:bg-blue-50 active:scale-95">
                {t.explore} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* İNTERAKTİF DASHBOARD ÖNİZLEMESİ */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative mx-auto max-w-5xl text-left group px-2 sm:px-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-blue-400 to-amber-500 rounded-[2rem] blur-2xl opacity-30 group-hover:opacity-50 transition duration-700"></div>
              
              <div className="relative bg-white border border-gray-200/80 rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[500px] ring-1 ring-gray-100 transition-all duration-500">
                
                {/* Sol Menü */}
                <div className="w-full md:w-60 bg-[#F8FAFC] border-b md:border-b-0 md:border-r border-gray-200 p-2 md:p-5 flex flex-row md:flex-col gap-2 z-10 overflow-x-auto md:overflow-y-auto custom-scrollbar items-center md:items-stretch shrink-0">
                  <div className="hidden md:flex items-center gap-2.5 mb-6 px-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="font-black text-gray-900 text-base tracking-tight">FixLog.co</span>
                  </div>

                  {[
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Genel Bakış' },
                    { id: 'personel', icon: Users, label: 'Personel & Ekipler' },
                    { id: 'isler', icon: Briefcase, label: 'İş Emirleri' },
                    { id: 'completed', icon: CheckCircle2, label: 'Tamamlanan İşler' },
                    { id: 'musteriler', icon: Users, label: 'Müşteri Bilgileri' },
                    { id: 'varliklar', icon: Box, label: 'Varlık Yönetimi' },
                    { id: 'stok', icon: Package, label: 'Stok & Depo' },
                    { id: 'finans', icon: CreditCard, label: 'Finans' },
                    { id: 'mesajlar', icon: MessageSquareText, label: 'Saha İletişimi' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setMockupTab(item.id)}
                      className={`flex items-center gap-2 md:gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                        mockupTab === item.id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 md:translate-x-1' : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${mockupTab === item.id ? 'text-white' : 'text-gray-400'}`} />
                      {item.label}
                      {item.id === 'mesajlar' && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">1</span>}
                    </button>
                  ))}

                  <div className="hidden md:block mt-auto border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-3 px-2 cursor-pointer hover:bg-gray-100 p-2.5 rounded-xl transition-colors">
                      <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-black shadow-md">P</div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">Patron Hesabı</div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Premium Aktif</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ana İçerik */}
                <div className="flex-1 bg-white flex flex-col overflow-hidden relative z-10">
                  <div className="h-16 border-b border-gray-100 flex items-center justify-between px-5 sm:px-8 bg-white shrink-0">
                    <div className="text-base font-black text-gray-800 tracking-tight truncate pr-2">
                      {mockupTab === 'dashboard' && 'İşletme Özeti'}
                      {mockupTab === 'personel' && 'Yönetici ve Usta Atamaları'}
                      {mockupTab === 'isler' && 'İş Kayıtları ve Planlama'}
                      {mockupTab === 'completed' && 'Tamamlanan İşler Arşivi'}
                      {mockupTab === 'mesajlar' && 'Saha Yöneticisi İletişimi'}
                      {mockupTab === 'musteriler' && 'Müşteri Bilgileri ve Yönetimi'}
                      {mockupTab === 'varliklar' && 'Varlık Yönetimi ve QR İşlemleri'}
                      {mockupTab === 'stok' && 'Depo ve Stok Takibi'}
                      {mockupTab === 'finans' && 'Gelir / Gider Analizi'}
                    </div>
                    <div className="flex items-center gap-5 text-gray-400 shrink-0">
                      <Search className="w-5 h-5 cursor-pointer hover:text-blue-600 transition-colors" />
                      <div className="relative">
                        <Bell className="w-5 h-5 cursor-pointer hover:text-blue-600 transition-colors" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-8 flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar">
                    <AnimatePresence mode="wait">
                      <motion.div key={mockupTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full flex flex-col gap-4 sm:gap-6">
                        
                        {/* 1. DASHBOARD TAB */}
                        {mockupTab === 'dashboard' && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
                              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bu Ay Ciro</div>
                                <div className="text-2xl lg:text-3xl font-black text-gray-900">₺145.250</div>
                              </div>
                              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bekleyen İş</div>
                                <div className="text-2xl lg:text-3xl font-black text-amber-600">12 Adet</div>
                              </div>
                              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sahadaki Ekip</div>
                                <div className="text-2xl lg:text-3xl font-black text-blue-600">8 Usta</div>
                              </div>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col min-h-[200px] h-auto">
                              <div className="text-xs font-black text-gray-400 mb-4 uppercase tracking-widest shrink-0">Son Tamamlanan İşler</div>
                              <div className="flex flex-col gap-1">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors rounded-xl px-2 -mx-2">
                                    <div className="truncate pr-2">
                                      <div className="text-sm font-bold text-gray-900 truncate">
                                        {i === 1 ? 'Merkez Plaza Asansör Bakımı' : i === 2 ? 'A Blok Yangın Tüpü Dolumu' : 'Bina Dış Cephe Temizliği'}
                                      </div>
                                      <div className="text-xs font-medium text-gray-500 mt-0.5">
                                        {i === 1 ? 'Ali Usta • 2 saat sürdü' : i === 2 ? 'Mehmet U. • 45 dk sürdü' : 'Canan T. • 4 saat sürdü'}
                                      </div>
                                    </div>
                                    <span className="shrink-0 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide">TAMAMLANDI</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* 2. İŞ EMİRLERİ TAB */}
                        {mockupTab === 'isler' && (
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-bold text-slate-800">Aktif Sahadaki İşler</div>
                              <button className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm">+ Yeni İş Ata</button>
                            </div>
                            <div className="flex flex-col gap-3">
                              {[
                                { name: 'Klima Motor Değişimi', loc: 'Merkez Plaza', date: 'Yarın, 14:00', status: 'Gelecek', color: 'bg-slate-100 text-slate-600' },
                                { name: 'Yıllık Periyodik Bakım', loc: 'Gül Apartmanı', date: 'Bugün, 10:00', status: 'Devam Ediyor', color: 'bg-blue-100 text-blue-700' },
                                { name: 'Güvenlik Kamera Montajı', loc: 'A Blok', date: 'Bekliyor', status: 'Beklemede', color: 'bg-amber-100 text-amber-700' }
                              ].map((job, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <div className="font-bold text-slate-800 text-sm">{job.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1"><MapPin size={12}/> {job.loc}</div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1.5"><Calendar size={12}/>{job.date}</div>
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${job.color}`}>{job.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. TAMAMLANAN İŞLER TAB */}
                        {mockupTab === 'completed' && (
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-bold text-slate-800">Geçmiş Teslimatlar Arşivi</div>
                            </div>
                            <div className="flex flex-col gap-3">
                              {[
                                { name: 'Merkez Plaza Asansör Bakımı', staff: 'Ali Usta', date: '15 Eylül 2024' },
                                { name: 'A Blok Yangın Tüpü Dolumu', staff: 'Mehmet U.', date: '12 Eylül 2024' },
                                { name: 'Bina Dış Cephe Temizliği', staff: 'Canan T.', date: '10 Eylül 2024' }
                              ].map((job, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-emerald-300 transition-colors">
                                  <div>
                                    <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">{job.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1"><User size={12} className="text-blue-500"/> {job.staff}</div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-xs font-bold text-slate-500"><Calendar size={12} className="inline mr-1 text-emerald-500"/>{job.date}</div>
                                    <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-200 shadow-sm">Tamamlandı</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 4. PERSONEL TAB */}
                        {mockupTab === 'personel' && (
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-bold text-slate-800">Aktif Saha Ekibi</div>
                              <button className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-200">Personel Ekle</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {[
                                { name: 'Yavuz Ş.', role: 'Yönetici', status: 'Müsait', color: 'bg-emerald-100 text-emerald-700' },
                                { name: 'Ali M.', role: 'Bakım Ustası', status: 'Sahada (İşte)', color: 'bg-blue-100 text-blue-700' },
                                { name: 'Canan T.', role: 'Temizlik Şefi', status: 'İzinli', color: 'bg-slate-100 text-slate-500' }
                              ].map((p, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black">{p.name.charAt(0)}</div>
                                    <div>
                                      <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{p.role}</div>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border border-white/0 shadow-sm ${p.color}`}>{p.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. MÜŞTERİLER TAB */}
                        {mockupTab === 'musteriler' && (
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-bold text-slate-800">Kayıtlı Müşteri ve Binalar</div>
                            </div>
                            <div className="flex flex-col gap-3">
                              {[
                                { name: 'Merkez Plaza (A Blok)', contact: 'Ahmet Bey (Yönetici)', phone: '0532 *** ** **' },
                                { name: 'Gül Apartmanı', contact: 'Ayşe Hanım', phone: '0533 *** ** **' }
                              ].map((m, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <div className="font-bold text-slate-800 text-sm">{m.name}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{m.contact}</div>
                                  </div>
                                  <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">{m.phone}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 6. VARLIKLAR (QR) TAB */}
                        {mockupTab === 'varliklar' && (
                          <div className="flex flex-col gap-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
                              <QrCode className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                              <div>
                                <div className="text-sm font-bold text-blue-900">QR Etiket Sistemi</div>
                                <div className="text-xs text-blue-700 mt-1">Cihazların üzerine yapıştırmak için QR kodu yazdırın. Müşteri tek tıkla arıza bildirsin.</div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              {[
                                { name: 'Merkez Plaza Ana Asansör', code: 'VAR-1892' },
                                { name: 'A Blok Zemin Kat Klima', code: 'VAR-2041' }
                              ].map((v, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Box size={18}/></div>
                                    <div>
                                      <div className="font-bold text-slate-800 text-sm">{v.name}</div>
                                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">ID: {v.code}</div>
                                    </div>
                                  </div>
                                  <button className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 hover:bg-blue-50 transition-colors w-full sm:w-auto justify-center"><QrCode size={14}/> QR Yazdır</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 7. STOK TAB */}
                        {mockupTab === 'stok' && (
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-bold text-slate-800">Merkez Depo Durumu</div>
                            </div>
                            <div className="flex flex-col gap-3">
                              {[
                                { name: 'Kontaktör 24V', cat: 'Elektrik Aksamı', qty: '145 Adet', status: 'İyi', color: 'bg-emerald-100 text-emerald-700' },
                                { name: 'V Kayışı (Tip B)', cat: 'Mekanik Parçalar', qty: '4 Adet', status: 'Kritik', color: 'bg-rose-100 text-rose-700 animate-pulse' }
                              ].map((s, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <div className="font-bold text-slate-800 text-sm">{s.name}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">{s.cat}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-700 text-sm">{s.qty}</span>
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border border-white/0 shadow-sm ${s.color}`}>{s.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 8. FİNANS TAB */}
                        {mockupTab === 'finans' && (
                          <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                                <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Aylık Gelir</div>
                                <div className="text-xl font-black text-emerald-700">₺155.000</div>
                              </div>
                              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                                <div className="text-xs text-rose-600 font-bold uppercase tracking-wider mb-1">Aylık Gider</div>
                                <div className="text-xl font-black text-rose-700">₺42.500</div>
                              </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col p-4 gap-3">
                               <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Son Finansal Hareketler</div>
                               <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                 <div className="text-sm font-semibold text-slate-700">Merkez Plaza Bakım Faturası</div>
                                 <div className="text-sm font-black text-emerald-600">+₺12.000</div>
                               </div>
                               <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                 <div className="text-sm font-semibold text-slate-700">Tedarikçi (Motor Alımı)</div>
                                 <div className="text-sm font-black text-rose-600">-₺8.500</div>
                               </div>
                            </div>
                          </div>
                        )}

                        {/* 9. MESAJLAR TAB */}
                        {mockupTab === 'mesajlar' && (
                          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full min-h-[300px] overflow-hidden">
                            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">YŞ</div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-800 truncate">Yavuz Şef (Saha Yöneticisi)</div>
                                <div className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> Çevrimiçi
                                </div>
                              </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                              <div className="bg-slate-100 text-slate-800 p-3 rounded-2xl rounded-tl-sm text-xs self-start max-w-[85%] font-medium shadow-sm">
                                Patron, A binasının asansör revizyonu tamamlandı. Fotoğrafları sisteme yükledim, faturayı kesebiliriz.
                              </div>
                              <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm text-xs self-end max-w-[85%] shadow-md font-medium">
                                Harika, elinize sağlık. Faturayı şimdi muhasebeye iletiyorum.
                              </div>
                            </div>
                            <div className="p-3 border-t border-slate-100 flex gap-2 shrink-0 bg-white">
                              <input type="text" placeholder="Cevap yaz..." disabled className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400 focus:bg-white transition-colors cursor-not-allowed" />
                              <button className="bg-blue-600 text-white p-2.5 rounded-xl opacity-50 cursor-not-allowed"><Send className="w-4 h-4" /></button>
                            </div>
                          </div>
                        )}

                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ÖZELLİKLER */}
        <section id="features" className="relative py-16 md:py-24 bg-gray-50/50 border-y border-gray-100 overflow-hidden">
          
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl mix-blend-multiply pointer-events-none hidden md:block"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-50/60 rounded-full blur-3xl mix-blend-multiply pointer-events-none hidden md:block"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            
            <div className="text-center mb-12 md:mb-20">
              <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-black tracking-widest uppercase text-[10px] mb-4 inline-block shadow-sm">GÜÇLÜ ALTYAPI</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-5 tracking-tight">
                Neden Bizi Seçmelisiniz?
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2 font-medium leading-relaxed">
                Saha operasyonlarınızı dijitalleştirirken maliyetlerinizi düşüren, işinize prestij katan benzersiz SaaS özellikleri.
              </p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="group relative bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-200/60 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r from-blue-600 to-amber-500 group-hover:w-full transition-all duration-500"></div>

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                      <f.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3 group-hover:text-blue-700 transition-colors duration-300 tracking-tight">
                      {f.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </section>

        {/* KAYIT FORMU */}
        <section className="py-16 md:py-24 bg-gray-50 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-gray-800 relative">
              <div className="lg:w-1/2 p-8 md:p-14 flex flex-col justify-center relative overflow-hidden z-10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                  Hemen Ücretsiz Kurun
                </h2>
                <p className="text-gray-400 mb-8 md:mb-10 text-sm md:text-base font-medium">
                  Kredi kartı gerekmez. 14 gün boyunca tüm özellikleri deneyin.
                </p>
                <div className="mb-6 relative">
                  <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest">
                    Sektörünüzü Seçin
                  </label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-2xl px-5 py-4 outline-none text-sm font-bold cursor-pointer hover:border-gray-600 focus:border-blue-500 transition-all appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center' }}
                  >
                    {SECTORS.map((s, i) => (
                      <option key={i} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleRegister}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 sm:py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 mb-5 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-6 h-6 bg-white rounded-full p-0.5"
                  />
                  Google ile Ücretsiz Dene
                </button>
                <p className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Sadece Firma Sahibi hesapları içindir.
                </p>
              </div>

              <div className="lg:w-1/2 bg-gray-800 p-8 md:p-14 relative flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-gray-700 z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />{' '}
                    Patronlar Ne Diyor?
                  </h3>
                  <div className="flex gap-2">
                    {REVIEWS.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReviewIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          reviewIndex === idx
                            ? 'bg-blue-500 w-6'
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                        aria-label={`Yorum ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <AnimatePresence mode="popLayout">
                    {visibleReviews.map((r, i) => (
                      <motion.div
                        key={r.name + reviewIndex + i}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-700 shadow-xl ${
                          i === 2 ? 'hidden sm:block' : 'block'
                        }`}
                      >
                        <div className="flex text-amber-400 mb-3">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <p className="text-gray-300 text-sm md:text-base mb-5 font-medium leading-relaxed">
                          &quot;{r.text}&quot;
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-800 border-2 border-gray-700 text-gray-300 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">
                              {r.name}
                            </div>
                            <div className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                              {r.role}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </section>
        </main>

<AnimatePresence>
  {isStaffModalOpen && (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }} 
        className="bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl w-full max-w-sm border border-gray-100"
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Personel Girişi
          </h3>
          <button onClick={() => setIsStaffModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 font-medium mb-6">
          Sisteme giriş yapmak için yöneticinizin size verdiği firma kodunu girin.
        </p>

        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <ShieldCheck className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Örn: merkez-asansor" 
            value={staffSlugInput}
            onChange={(e) => setStaffSlugInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && staffSlugInput.trim()) {
                setIsStaffModalOpen(false);
                router.push(`/${staffSlugInput.trim().toLowerCase()}/login`);
              }
            }}
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 text-gray-900 font-bold transition-all placeholder:text-gray-400 placeholder:font-medium"
          />
        </div>

        <button 
          onClick={() => {
            if(staffSlugInput.trim()) {
              setIsStaffModalOpen(false);
              router.push(`/${staffSlugInput.trim().toLowerCase()}/login`);
            }
          }}
          disabled={!staffSlugInput.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-95"
        >
          Giriş Yap <ArrowRight className="w-4 h-4" />
        </button>
        </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{/* BİLGİ MODALI */}
<AnimatePresence>
  {infoModalContent && (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4"
      onClick={() => {
        closeInfoModal();
        if (window.history.state?.modal === 'infoModal') {
            window.history.back();
        }
      }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 10 }} 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-lg border border-gray-100 flex flex-col max-h-[80vh]"
      >
        <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4 shrink-0">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            {infoModalContent.title}
          </h3>
          <button onClick={() => {
            closeInfoModal();
            if (window.history.state?.modal === 'infoModal') {
                window.history.back();
            }
          }} className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-xl bg-gray-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-sm text-gray-600 font-medium leading-relaxed overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap">
          {infoModalContent.content}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 shrink-0">
          <button 
            onClick={() => {
                closeInfoModal();
                if (window.history.state?.modal === 'infoModal') {
                    window.history.back();
                }
            }}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
          >
            Anladım, Kapat
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<footer className="bg-white border-t border-gray-100 py-12 md:py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            <div className="col-span-1 sm:col-span-2 lg:col-span-2 lg:pr-16">
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
                <span translate="no" className="notranslate text-xl font-black text-gray-900 tracking-tight">
                FixLog.co
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed pr-4 font-medium">
                İşletmenizi sıfır maliyet kaybı ve maksimum verimlilikle uçtan
                uca yönetmenizi sağlayan yeni nesil SaaS platformu.
              </p>
            </div>
            <div>
              <h4 className="font-black text-gray-900 mb-5 text-sm uppercase tracking-widest">
                Kurumsal
              </h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li onClick={() => openInfoModal('Hakkımızda', `Fixlog.co olarak, saha operasyonlarının zorluklarını ve karmaşasını kökünden çözmek amacıyla yola çıktık. Geleneksel iş takip yöntemlerinin, kağıt kürek işlerinin ve ofis ile saha arasındaki iletişim kopukluklarının işletmelere ne kadar zaman ve maliyet kaybettirdiğini çok iyi biliyoruz. Amacımız, sahadaki ekiplerinizle merkez ofisiniz arasında kesintisiz, akıcı ve akıllı bir köprü kurarak sizi sektörünüzde tartışmasız bir numaraya taşımaktır. Vizyonumuz sadece bir yazılım sunmak değil; işletmenizin kalbine yerleşecek, operasyonlarınızı otonom hale getirecek ve büyümenize ivme kazandıracak stratejik bir iş ortağı olmaktır. Fixlog ile karmaşayı geride bırakın, kontrolü tamamen elinize alın ve geleceğin saha yönetimi standartlarına bugünden adım atın.`)} className="hover:text-blue-600 cursor-pointer transition-colors">Hakkımızda</li>
                <li onClick={() => openInfoModal('Sektörel Çözümler', `Her sektörün kendine has dinamikleri ve zorlukları olduğunun farkındayız. Asansör bakımı, iklimlendirme (HVAC) sistemleri, güvenlik teknolojileri ve periyodik bakım gerektiren tüm alanlar için özel olarak tasarlanmış esnek bir yapı sunuyoruz. Geliştirdiğimiz Fixlog Otopilot teknolojisi sayesinde iş atamalarınız insan hatası olmadan, en doğru teknisyene en doğru zamanda otomatik olarak yönlendirilir. Sahadaki cihazlarınızı ve ekipmanlarınızı QR kod okutarak saniyeler içinde tanıyabilir, geçmiş bakım verilerine anında ulaşabilirsiniz. Ayrıca, teknisyenlerinizin sahada elleri doluyken bile işlerini raporlayabilmeleri için sunduğumuz akıllı sesli form doldurma asistanı ile süreçleri inanılmaz ölçüde hızlandırıyoruz. Hangi sektörde olursanız olun, operasyonel yükünüzü hafifletiyor ve müşteri memnuniyetinizi en üst seviyeye çıkarıyoruz.`)} className="hover:text-blue-600 cursor-pointer transition-colors">Sektörel Çözümler</li>
                <li onClick={() => openInfoModal('Fiyatlandırma', `Büyüme hedeflerinizi destekleyen, şeffaf ve sürpriz maliyetler barındırmayan adil bir fiyatlandırma modeli benimsiyoruz. İşletmenizin ölçeği ne olursa olsun, karmaşık paketler veya gizli ücretlerle uğraşmazsınız. Platformumuzun sunduğu tüm akıllı özelliklere ve sınırsız kullanıcı erişimine aylık sabit 3.000 TL ile sahip olabilirsiniz. Sahada takip etmek istediğiniz, sisteminize eklediğiniz her bir cihaz veya ekipman (varlık) için ise sadece 50 TL gibi düşük bir maliyet yansıtılır.\n\nSisteme adım attığınızda sizden hiçbir ödeme yöntemi istemeden 14 günlük ücretsiz deneme sürenizi başlatıyoruz. Bu sürenin ardından kullanımınız kesintisiz olarak devam eder ve ilk faturanız ay sonunda oluşturulur. Olası bir ödeme gecikmesinde hiçbir veriniz silinmez, yüksek güvenlik standartlarımızla korunmaya devam eder; ancak ödeme tamamlanana kadar sistem erişiminiz kısıtlanarak güvenli moda alınır. İşletmeniz büyüdükçe sizinle birlikte şekillenen bu modelle, yatırımınızın karşılığını ilk günden itibaren almaya başlayacaksınız.`)} className="hover:text-blue-600 cursor-pointer transition-colors">Fiyatlandırma</li>
                <li onClick={() => openInfoModal('İletişim & Destek', `Saha operasyonlarının 7 gün 24 saat kesintisiz devam etmesi gerektiğinin bilincindeyiz. Bu nedenle Fixlog.co olarak sadece bir hizmet sağlayıcı değil, her an yanınızda olan güvenilir bir destek ekibi olarak konumlanıyoruz. Sisteme adaptasyon sürecinizden günlük kullanımdaki en ufak sorularınıza kadar her adımda size rehberlik etmek için buradayız. Platformumuz üzerinden veya e-posta ve telefon yoluyla bize dilediğiniz an ulaşabilirsiniz. İşletmenizin duraksamaması ve sahadaki ekiplerinizin sorunsuz çalışmaya devam etmesi için uzman ekibimiz, en hızlı ve en etkili çözümleri üretmek üzere arkanızda sağlam bir güç olarak durmaktadır.`)} className="hover:text-blue-600 cursor-pointer transition-colors">İletişim & Destek</li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-gray-900 mb-5 text-sm uppercase tracking-widest">
                Yasal
              </h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li onClick={() => openInfoModal('Kullanım Koşulları', `Fixlog.co platformunu kullanmaya başladığınız andan itibaren, adil, şeffaf ve güvenli bir dijital ekosistemin parçası olursunuz. Kullanım koşullarımız, hem sizin kurumsal süreçlerinizi korumak hem de platformumuzun kesintisiz ve yüksek performansla çalışmasını güvence altına almak amacıyla düzenlenmiştir. Platformumuz üzerinden yürüttüğünüz tüm saha operasyonları, iş atamaları ve varlık yönetim süreçleri dünya standartlarında güvenlik önlemleriyle denetlenmektedir. Amacımız, karmaşık hukuki terimlerle sizi kısıtlamak değil; işinizi gönül rahatlığıyla, yasal güvence altında ve en yüksek verimle yönetebileceğiniz güvenilir, profesyonel bir çalışma zemini sunmaktır.`)} className="hover:text-blue-600 cursor-pointer transition-colors">Kullanım Koşulları</li>
                <li onClick={() => openInfoModal('Gizlilik Politikası (KVKK)', `İşletmenize, müşterilerinize ve sahadaki ekiplerinize ait verilerin ne kadar kritik olduğunun son derece farkındayız. Fixlog.co olarak, veri gizliliğini en üst düzeyde tutuyor ve 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) başta olmak üzere tüm yasal mevzuatlara tam uyumluluk gösteriyoruz. Sistemimize girdiğiniz müşteri bilgileri, cihaz geçmişleri, lokasyon verileri ve operasyonel kayıtlar yüksek güvenlikli yöntemlerle korunur ve asla üçüncü şahıslarla paylaşılmaz. Verileriniz sadece sizin operasyonlarınızı iyileştirmek ve sistemin otonom özelliklerini sizin adınıza çalıştırmak için işlenir. Verilerinizin kontrolü her zaman ve tamamen sizin elinizdedir.`)} className="hover:text-blue-600 cursor-pointer transition-colors">Gizlilik Politikası (KVKK)</li>
                <li onClick={() => openInfoModal('İptal ve İade', `Sunduğumuz teknolojiye ve platformumuzun işletmenize katacağı güce o kadar inanıyoruz ki, sizi zorunlu taahhütlerle veya ağır sözleşmelerle sistemde tutmaya ihtiyaç duymuyoruz. İş süreçlerinizde bir değişiklik olması veya hizmetimizden beklediğiniz verimi alamadığınızı düşünmeniz durumunda, aboneliğinizi dilediğiniz an, hiçbir cezai şart veya gizli kesinti olmadan iptal edebilirsiniz. İptal talebinizi ilettiğinizde, o ayki faturalandırma döngünüzün sonunda hizmetiniz durdurulur ve sonraki aylar için hiçbir ücret yansıtılmaz. Bizim için asıl olan sözleşme maddeleri değil, sağladığımız yüksek memnuniyet ve operasyonel başarı ile kurduğumuz uzun vadeli iş ortaklığıdır.`)} className="hover:text-blue-600 cursor-pointer transition-colors">İptal ve İade</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-400">
            <p>© {new Date().getFullYear()} FixLog.co. Tüm hakları saklıdır.</p>
            <div className="flex gap-4">
              <Globe className="w-4 h-4 hover:text-gray-600 cursor-pointer transition-colors" />
              <span>Türkiye / İstanbul</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}