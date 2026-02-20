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
  LineChart
} from 'lucide-react';

// Sabit veriler
const SECTORS = [
  'Asansör Bakım & Montaj',
  'İklimlendirme (Klima & Kombi)',
  'Güvenlik Kamera & Alarm Sistemleri',
  'Profesyonel Temizlik Hizmetleri',
  'İlaçlama ve Pest Kontrol',
  'Yangın Söndürme Sistemleri',
  'Su Arıtma Sistemleri',
  'Endüstriyel Kapı ve Kepenk',
  'Diğer (Özel Sektör)',
];

const REVIEWS = [
  {
    name: 'Ahmet Y.',
    role: 'Asansör Firması',
    text: 'Usta performanslarını ölçmek kârımı %30 artırdı.',
  },
  {
    name: 'Selin K.',
    role: 'İklimlendirme',
    text: 'Varlık yönetimi ile müşterilere kurumsal bir yüz sunuyoruz.',
  },
  {
    name: 'Mehmet D.',
    role: 'Güvenlik',
    text: 'Sesle form doldurma sahadaki işleri çok hızlandırdı.',
  },
  {
    name: 'Canan T.',
    role: 'Temizlik',
    text: 'Taşeronları tek ekrandan yönetmek harika.',
  },
];

// YENİ EKLENEN ÖZELLİKLER (NEDEN BİZ) LİSTESİ
const FEATURES = [
  {
    icon: Smartphone,
    title: 'Mobil Uygulama (PWA)',
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
  brand: 'İş Dökümü',
  login: 'Giriş Yap',
  tryFree: '14 Gün Ücretsiz Dene',
  heroTitle1: 'İşletmenizi Uçtan Uca,',
  heroTitle2: 'Sıfır Maliyet Kaybıyla Yönetin',
  heroDesc:
    'Personelinizi, iş emirlerinizi ve müşteri ağınızı tek ekranda birleştirin. Kurulum yok, donanım yok. Sadece tarayıcınızdan yönetin.',
  explore: 'Özellikleri İncele',
};

// Basit mockup datası (Geçici)
const MOCKUP_DATA = {
  title: 'Sistem Aktif',
  stats: '34 Aktif İşlem',
  jobs: ['09:00 - Merkez Plaza Bakım', '11:30 - Gül Sitesi Arıza', '14:00 - A Blok Montaj'],
  bg: 'bg-blue-50',
  color: 'text-blue-600',
};

export default function LandingPage() {
  const router = useRouter();

  const handleLogin = () => router.push('/login');
  const handleRegister = () => router.push('/register');

  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const [mockupTab, setMockupTab] = useState('dashboard');
  const [islerTab, setIslerTab] = useState('gelecek');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-[100dvh] bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden flex flex-col relative">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            <span
              translate="no"
              className="notranslate text-xl font-black tracking-tight text-gray-900"
            >
              {t.brand}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogin}
              className="hidden md:flex items-center gap-1.5 text-gray-600 hover:text-blue-600 text-sm font-bold transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" /> {t.login}
            </button>
            <button
              onClick={handleRegister}
              className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md shadow-blue-600/20 items-center gap-2 hover:scale-105 active:scale-95"
            >
              {t.tryFree}
            </button>
            {/* Mobil Menü Butonu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobil Dropdown Menü */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-gray-100 bg-white absolute w-full overflow-hidden shadow-2xl"
            >
              <div className="px-4 pt-4 pb-6 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogin();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 hover:bg-gray-100 px-4 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                >
                  <LogIn className="w-4 h-4" /> {t.login}
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleRegister();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  {t.tryFree}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ANA İÇERİK */}
      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 overflow-hidden px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/70 via-white to-white">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-5 leading-[1.15]"
            >
              {t.heroTitle1} <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500">
                {t.heroTitle2}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm sm:text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed px-2 font-medium"
            >
              {t.heroDesc}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-3 mb-16 sm:mb-20 px-4"
            >
              <button
                onClick={handleRegister}
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 sm:py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-900/20 w-full sm:w-auto active:scale-95"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5 bg-white rounded-full p-0.5"
                />
                {t.tryFree}
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white border-2 border-gray-200 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 sm:py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto hover:bg-blue-50 active:scale-95"
              >
                {t.explore} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* İNTERAKTİF DASHBOARD ÖNİZLEMESİ */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative mx-auto max-w-5xl text-left group px-2 sm:px-0"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-blue-400 to-amber-500 rounded-[2rem] blur-2xl opacity-30 group-hover:opacity-50 transition duration-700"></div>
              
              <div className="relative bg-white border border-gray-200/80 rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[500px] ring-1 ring-gray-100 transition-all duration-500">
                {/* Sol Menü */}
                <div className="w-full md:w-60 bg-[#F8FAFC] border-b md:border-b-0 md:border-r border-gray-200 p-2 md:p-5 flex flex-row md:flex-col gap-2 z-10 overflow-x-auto md:overflow-y-auto custom-scrollbar items-center md:items-stretch shrink-0">
                  <div className="hidden md:flex items-center gap-2.5 mb-6 px-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="font-black text-gray-900 text-base tracking-tight">
                      İş Dökümü
                    </span>
                  </div>

                  {[
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Genel Bakış' },
                    { id: 'personel', icon: Users, label: 'Personel & Ekipler' },
                    { id: 'isler', icon: Briefcase, label: 'İş Emirleri' },
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
                        mockupTab === item.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 md:translate-x-1'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${mockupTab === item.id ? 'text-white' : 'text-gray-400'}`} />
                      {item.label}
                      {item.id === 'mesajlar' && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">1</span>
                      )}
                    </button>
                  ))}

                  <div className="hidden md:block mt-auto border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-3 px-2 cursor-pointer hover:bg-gray-100 p-2.5 rounded-xl transition-colors">
                      <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-black shadow-md">
                        P
                      </div>
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

                  <div className="p-5 sm:p-8 flex-1 overflow-y-auto bg-gray-50/50">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={mockupTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full flex flex-col gap-4 sm:gap-6"
                      >
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
                            <div className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-5 overflow-hidden flex flex-col">
                              <div className="text-xs font-black text-gray-400 mb-4 uppercase tracking-widest">Son Tamamlanan İşler</div>
                              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
                                    <span className="shrink-0 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide">TAMAMLANDI</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                        {/* Mockup'ın geri kalan tab'ları görsel temsili olduğu için aynı bırakıyoruz, paddingler güncellendi. */}
                        {mockupTab !== 'dashboard' && (
                            <div className="h-full flex items-center justify-center flex-col text-gray-400 text-center px-4">
                              <MoreVertical className="w-10 h-10 mb-4 opacity-30" />
                              <div className="text-base font-bold text-gray-500">Bu alanın tüm detaylarını görmek için ücretsiz kayıt olun.</div>
                              <button onClick={handleRegister} className="mt-6 bg-blue-100 hover:bg-blue-200 text-blue-700 px-6 py-3 rounded-xl font-bold text-sm transition-colors active:scale-95">Hemen Başla</button>
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

        {/* EKSİK OLAN "NEDEN BİZ" (ÖZELLİKLER) KISMININ YENİDEN İNŞASI */}
        <section id="features" className="relative py-16 md:py-24 bg-gray-50/50 border-y border-gray-100 overflow-hidden">
          
          {/* Arka Plan Dekoratif Objeleri */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl mix-blend-multiply pointer-events-none hidden md:block"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-50/60 rounded-full blur-3xl mix-blend-multiply pointer-events-none hidden md:block"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            
            <div className="text-center mb-12 md:mb-20">
              <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-black tracking-widest uppercase text-[10px] mb-4 inline-block shadow-sm">GÜÇLÜ ALTYAPI</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-5 tracking-tight">
                Neden Bizi Seçmelisiniz?
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2 font-medium leading-relaxed">
                Saha operasyonlarınızı dijitalleştirirken maliyetlerinizi düşüren, işininize prestij katan benzersiz SaaS özellikleri.
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

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-12 md:py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-8">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
                <span
                  translate="no"
                  className="notranslate text-xl font-black text-gray-900 tracking-tight"
                >
                  İş Dökümü
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed pr-4 font-medium">
                İşletmenizi sıfır maliyet kaybı ve maksimum verimlilikle uçtan
                uca yönetmenizi sağlayan yeni nesil SaaS platformu.
              </p>
            </div>
            <div>
              <h4 className="font-black text-gray-900 mb-5 text-sm uppercase tracking-widest">
                Özellikler
              </h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  Varlık & QR Yönetimi
                </li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  Sesle Form Doldurma
                </li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  Performans Analizi
                </li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  Offline PWA Desteği
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-gray-900 mb-5 text-sm uppercase tracking-widest">
                Kurumsal
              </h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  Hakkımızda
                </li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  Sektörel Çözümler
                </li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  Fiyatlandırma
                </li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  İletişim & Destek
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-gray-900 mb-5 text-sm uppercase tracking-widest">
                Yasal
              </h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  Kullanım Koşulları
                </li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  Gizlilik Politikası (KVKK)
                </li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">
                  İptal ve İade
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-400">
            <p>© {new Date().getFullYear()} İş Dökümü. Tüm hakları saklıdır.</p>
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