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
  X, // Mobil menü kapatma butonu için eklendi
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
} from 'lucide-react';

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

export default function LandingPage() {
  const router = useRouter();

  const handleLogin = () => router.push('/login');
  const handleRegister = () => router.push('/register');

  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const [mockupTab, setMockupTab] = useState('dashboard');
  const [islerTab, setIslerTab] = useState('gelecek'); // 'gelecek' | 'gecmis'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobil menü state'i eklendi

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
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden flex flex-col relative">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span
              translate="no"
              className="notranslate text-xl font-bold tracking-tight text-gray-900"
            >
              {t.brand}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogin}
              className="hidden md:flex items-center gap-1.5 text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" /> {t.login}
            </button>
            <button
              onClick={handleRegister}
              className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-md items-center gap-2 hover:scale-105 active:scale-95"
            >
              {t.tryFree}
            </button>
            {/* Mobil Menü Butonu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-600 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
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
              className="md:hidden border-b border-gray-100 bg-white absolute w-full overflow-hidden shadow-xl"
            >
              <div className="px-4 pt-2 pb-6 flex flex-col gap-4">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogin();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  <LogIn className="w-4 h-4" /> {t.login}
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleRegister();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {t.tryFree}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ANA İÇERİK - Flex Büyümesi (Footer'ı alta itmek için) */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 md:pt-16 pb-16 md:pb-24 overflow-hidden px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight"
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
              className="text-sm sm:text-base md:text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed px-2"
            >
              {t.heroDesc}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-3 mb-12 sm:mb-16 px-4"
            >
              <button
                onClick={handleRegister}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3.5 sm:py-3 rounded-xl sm:rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10 w-full sm:w-auto hover:scale-[1.02]"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-4 h-4 bg-white rounded-full p-0.5"
                />
                {t.tryFree}
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById('features')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="bg-white border border-gray-200 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-6 py-3.5 sm:py-3 rounded-xl sm:rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto hover:bg-blue-50"
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
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-blue-400 to-amber-500 rounded-[1.5rem] blur-xl opacity-30 group-hover:opacity-60 transition duration-700"></div>
              {/* Mockup Container (Mobil uyumlu flex-col yapısı ve height ayarı eklendi) */}
              <div className="relative bg-white border border-gray-200/80 rounded-2xl shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[480px] ring-1 ring-gray-100 transition-all duration-500 group-hover:shadow-blue-500/30">
                {/* Etkileşimli Sol/Üst Menü (Mobilde yatay scroll, masaüstünde dikey menü) */}
                <div className="w-full md:w-56 bg-[#F8FAFC] border-b md:border-b-0 md:border-r border-gray-200 p-2 md:p-4 flex flex-row md:flex-col gap-2 z-10 overflow-x-auto md:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 items-center md:items-stretch shrink-0">
                  <div className="hidden md:flex items-center gap-2 mb-4 px-2">
                    <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      İş Dökümü
                    </span>
                  </div>

                  {[
                    {
                      id: 'dashboard',
                      icon: LayoutDashboard,
                      label: 'Genel Bakış',
                    },
                    {
                      id: 'personel',
                      icon: Users,
                      label: 'Personel & Ekipler',
                    },
                    { id: 'isler', icon: Briefcase, label: 'İş Emirleri' },
                    {
                      id: 'musteriler',
                      icon: Users,
                      label: 'Müşteri Bilgileri',
                    },
                    { id: 'varliklar', icon: Box, label: 'Varlık Yönetimi' },
                    { id: 'stok', icon: Package, label: 'Stok & Depo' },
                    { id: 'finans', icon: CreditCard, label: 'Finans' },
                    {
                      id: 'mesajlar',
                      icon: MessageSquareText,
                      label: 'Yönetici Mesajları',
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setMockupTab(item.id)}
                      className={`flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
                        mockupTab === item.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 md:translate-x-1'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                      }`}
                    >
                      <item.icon
                        className={`w-4 h-4 ${
                          mockupTab === item.id ? 'text-white' : 'text-gray-400'
                        }`}
                      />{' '}
                      {item.label}
                      {item.id === 'mesajlar' && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                          1
                        </span>
                      )}
                    </button>
                  ))}

                  <div className="hidden md:block mt-auto border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2 px-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors">
                      <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                        P
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          Patron Hesabı
                        </div>
                        <div className="text-[10px] text-green-600 font-bold">
                          Premium Aktif
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Etkileşimli Ana İçerik */}
                <div className="flex-1 bg-white flex flex-col overflow-hidden relative z-10">
                  <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 bg-white shrink-0">
                    <div className="text-sm font-semibold text-gray-800 truncate pr-2">
                      {mockupTab === 'dashboard' && 'Panel Özeti'}
                      {mockupTab === 'personel' && 'Yönetici ve Usta Atamaları'}
                      {mockupTab === 'isler' && 'İş Kayıtları ve Planlama'}
                      {mockupTab === 'mesajlar' && 'Saha Yöneticisi İletişimi'}
                      {mockupTab === 'musteriler' &&
                        'Müşteri Bilgileri ve Yönetimi'}
                      {mockupTab === 'varliklar' &&
                        'Varlık Yönetimi ve QR İşlemleri'}
                      {mockupTab === 'stok' && 'Depo ve Stok Takibi'}
                      {mockupTab === 'finans' && 'Gelir / Gider Analizi'}
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 shrink-0">
                      <Search className="w-4 h-4 cursor-pointer hover:text-blue-600 transition-colors" />
                      <div className="relative">
                        <Bell className="w-4 h-4 cursor-pointer hover:text-blue-600 transition-colors" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-gray-50/50">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={mockupTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full flex flex-col gap-4"
                      >
                        {mockupTab === 'dashboard' && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                                <div className="text-xs text-gray-500 mb-1">
                                  Toplam Ciro (Bu Ay)
                                </div>
                                <div className="text-xl sm:text-lg lg:text-xl font-bold text-gray-900">
                                  ₺145.250
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                                <div className="text-xs text-gray-500 mb-1">
                                  Bekleyen İşler
                                </div>
                                <div className="text-xl sm:text-lg lg:text-xl font-bold text-amber-600">
                                  12 Adet
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                                <div className="text-xs text-gray-500 mb-1">
                                  Aktif Personel
                                </div>
                                <div className="text-xl sm:text-lg lg:text-xl font-bold text-blue-600">
                                  8 Usta
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm p-4 overflow-hidden flex flex-col">
                              <div className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">
                                Son Tamamlanan İşler
                              </div>
                              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {[1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors rounded px-2 -mx-2"
                                  >
                                    <div className="truncate pr-2">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {i === 1
                                          ? 'Merkez Plaza Asansör Bakımı'
                                          : i === 2
                                          ? 'A Blok Yangın Tüpü Dolumu'
                                          : 'Bina Dış Cephe Temizliği'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {i === 1
                                          ? 'Ali Usta • 2 saat sürdü'
                                          : i === 2
                                          ? 'Mehmet U. • 45 dk sürdü'
                                          : 'Canan T. • 4 saat sürdü'}
                                      </div>
                                    </div>
                                    <span className="shrink-0 bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">
                                      TAMAMLANDI
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {mockupTab === 'isler' && (
                          <div className="flex flex-col h-full gap-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => setIslerTab('gelecek')}
                                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                    islerTab === 'gelecek'
                                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                                      : 'text-gray-500 hover:bg-gray-100 border-transparent'
                                  }`}
                                >
                                  Gelecek İşler
                                </button>
                                <button
                                  onClick={() => setIslerTab('gecmis')}
                                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                    islerTab === 'gecmis'
                                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                                      : 'text-gray-500 hover:bg-gray-100 border-transparent'
                                  }`}
                                >
                                  Geçmiş Kayıtlar
                                </button>
                              </div>
                              <button className="w-full sm:w-auto justify-center bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:scale-105 shadow-sm">
                                <Plus className="w-3 h-3" /> İş Emri Oluştur
                              </button>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex-1 overflow-hidden">
                              <div className="overflow-x-auto w-full h-full">
                                <table className="w-full min-w-[400px] text-left text-sm">
                                  <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                                    <tr>
                                      <th className="p-3 font-medium">
                                        İş Tanımı
                                      </th>
                                      <th className="p-3 font-medium">Tarih</th>
                                      <th className="p-3 font-medium text-right">
                                        Durum
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {islerTab === 'gelecek' ? (
                                      <>
                                        <tr className="border-b border-gray-50">
                                          <td className="p-3 font-medium text-gray-900">
                                            Klima Motor Değişimi
                                          </td>
                                          <td className="p-3 text-gray-500 text-xs">
                                            Yarın, 14:00
                                          </td>
                                          <td className="p-3 text-right">
                                            <span className="inline-block bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold">
                                              USTA BEKLİYOR
                                            </span>
                                          </td>
                                        </tr>
                                        <tr className="border-b border-gray-50">
                                          <td className="p-3 font-medium text-gray-900">
                                            Yıllık Periyodik Bakım
                                          </td>
                                          <td className="p-3 text-gray-500 text-xs">
                                            22 Ekim 2024
                                          </td>
                                          <td className="p-3 text-right">
                                            <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">
                                              PLANLANDI
                                            </span>
                                          </td>
                                        </tr>
                                      </>
                                    ) : (
                                      <>
                                        <tr className="border-b border-gray-50">
                                          <td className="p-3 font-medium text-gray-900">
                                            Merkez Plaza Revizyon
                                          </td>
                                          <td className="p-3 text-gray-500 text-xs">
                                            15 Eylül 2024
                                          </td>
                                          <td className="p-3 text-right">
                                            <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">
                                              TAMAMLANDI
                                            </span>
                                          </td>
                                        </tr>
                                        <tr className="border-b border-gray-50">
                                          <td className="p-3 font-medium text-gray-900">
                                            Güvenlik Kamerası Montajı
                                          </td>
                                          <td className="p-3 text-gray-500 text-xs">
                                            12 Eylül 2024
                                          </td>
                                          <td className="p-3 text-right">
                                            <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">
                                              TAMAMLANDI
                                            </span>
                                          </td>
                                        </tr>
                                      </>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {mockupTab === 'personel' && (
                          <div className="flex flex-col h-full gap-4">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-bold text-gray-900">
                                Aktif Ekip Üyeleri
                              </div>
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:scale-105 shadow-sm">
                                <Plus className="w-3 h-3" />{' '}
                                <span className="hidden sm:inline">
                                  Yeni Personel
                                </span>{' '}
                                Ekle
                              </button>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex-1 overflow-hidden">
                              <div className="overflow-x-auto w-full h-full">
                                <table className="w-full min-w-[400px] text-left text-sm">
                                  <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                                    <tr>
                                      <th className="p-3 font-medium">
                                        İsim / Rol
                                      </th>
                                      <th className="p-3 font-medium">Branş</th>
                                      <th className="p-3 font-medium text-right">
                                        Durum
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-gray-50 hover:bg-gray-50">
                                      <td className="p-3">
                                        <div className="font-bold text-gray-900">
                                          Yavuz K.
                                        </div>
                                        <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                                          Yönetici
                                        </div>
                                      </td>
                                      <td className="p-3 text-gray-500 text-xs">
                                        Tüm Operasyon
                                      </td>
                                      <td className="p-3 text-right">
                                        <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">
                                          AKTİF
                                        </span>
                                      </td>
                                    </tr>
                                    <tr className="border-b border-gray-50 hover:bg-gray-50">
                                      <td className="p-3">
                                        <div className="font-bold text-gray-900">
                                          Ali M.
                                        </div>
                                        <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                                          Usta
                                        </div>
                                      </td>
                                      <td className="p-3 text-gray-500 text-xs">
                                        Bakımcı, Montajcı
                                      </td>
                                      <td className="p-3 text-right">
                                        <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">
                                          SAHADA
                                        </span>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {mockupTab === 'musteriler' && (
                          <div className="flex flex-col h-full gap-4">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-bold text-gray-900">
                                Kayıtlı Müşteriler
                              </div>
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:scale-105 shadow-sm">
                                <Plus className="w-3 h-3" />{' '}
                                <span className="hidden sm:inline">
                                  Yeni Müşteri
                                </span>{' '}
                                Ekle
                              </button>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex-1 overflow-hidden">
                              <div className="overflow-x-auto w-full h-full">
                                <table className="w-full min-w-[450px] text-left text-sm">
                                  <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                                    <tr>
                                      <th className="p-3 font-medium">
                                        Müşteri / Firma
                                      </th>
                                      <th className="p-3 font-medium">
                                        İletişim
                                      </th>
                                      <th className="p-3 font-medium text-right">
                                        İşlem
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-gray-50 hover:bg-gray-50">
                                      <td className="p-3">
                                        <div className="font-bold text-gray-900">
                                          Merkez Plaza (A Blok)
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                          Adres: Şişli, İstanbul
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <div className="text-gray-900 text-xs">
                                          Ahmet Bey (Yönetici)
                                        </div>
                                        <div className="text-[10px] text-blue-600">
                                          0532 *** ** **
                                        </div>
                                      </td>
                                      <td className="p-3 text-right">
                                        <button className="text-[10px] font-bold text-blue-600 bg-white border border-blue-100 px-3 py-1.5 rounded-md hover:bg-blue-50">
                                          Detay
                                        </button>
                                      </td>
                                    </tr>
                                    <tr className="border-b border-gray-50 hover:bg-gray-50">
                                      <td className="p-3">
                                        <div className="font-bold text-gray-900">
                                          Gül Apartmanı
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                          Adres: Kadıköy, İstanbul
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <div className="text-gray-900 text-xs">
                                          Ayşe Hanım
                                        </div>
                                        <div className="text-[10px] text-blue-600">
                                          0533 *** ** **
                                        </div>
                                      </td>
                                      <td className="p-3 text-right">
                                        <button className="text-[10px] font-bold text-blue-600 bg-white border border-blue-100 px-3 py-1.5 rounded-md hover:bg-blue-50">
                                          Detay
                                        </button>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {mockupTab === 'mesajlar' && (
                          <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
                            <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                              <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                Y
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-gray-900 truncate">
                                  Yavuz Şef (Yönetici)
                                </div>
                                <div className="text-[10px] text-green-500 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>{' '}
                                  Çevrimiçi
                                </div>
                              </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
                              <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-xs self-start max-w-[85%] sm:max-w-[80%]">
                                Patron, X binasının asansör revizyonu
                                tamamlandı. Onayınızı bekliyor.
                              </div>
                              <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm text-xs self-end max-w-[85%] sm:max-w-[80%] shadow-sm">
                                Harika, faturayı kesiyorum. Eline sağlık.
                              </div>
                            </div>
                            <div className="p-3 border-t border-gray-100 flex gap-2 shrink-0">
                              <input
                                type="text"
                                placeholder="Mesaj yaz..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 focus:bg-white transition-colors"
                              />
                              <button className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {mockupTab === 'varliklar' && (
                          <div className="flex flex-col h-full gap-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
                              <Box className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                              <div>
                                <div className="text-sm font-bold text-blue-900">
                                  Kayıtlı Varlıklar (Makineler / Cihazlar)
                                </div>
                                <div className="text-xs text-blue-700 mt-1">
                                  Geçmiş işleri görmek veya cihazın üzerine
                                  yapıştırmak için QR yazdırmak istediğiniz
                                  varlığı seçin.
                                </div>
                              </div>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer group"
                                >
                                  <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                                      <Box className="w-5 h-5" />
                                    </div>
                                    <div className="truncate pr-2">
                                      <div className="text-xs font-bold text-gray-900 truncate">
                                        {i === 1
                                          ? 'Merkez Plaza Ana Asansör'
                                          : i === 2
                                          ? 'A Blok Zemin Kat Klima'
                                          : 'Gül Apt. Yangın Söndürücü'}
                                      </div>
                                      <div className="text-[10px] text-gray-500">
                                        ID: VAR-{i}892 • Son Bakım: 2 ay önce
                                      </div>
                                    </div>
                                  </div>
                                  <button className="w-full sm:w-auto justify-center text-[10px] font-bold text-blue-600 bg-white border border-blue-100 px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-blue-50 shadow-sm">
                                    Detay / QR Bas{' '}
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {mockupTab === 'stok' && (
                          <div className="flex flex-col h-full gap-4">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-bold text-gray-900">
                                Merkez Depo Durumu
                              </div>
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:scale-105 shadow-sm">
                                <Plus className="w-3 h-3" />{' '}
                                <span className="hidden sm:inline">
                                  Yeni Ürün
                                </span>{' '}
                                Ekle
                              </button>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex-1 overflow-hidden">
                              <div className="overflow-x-auto w-full h-full">
                                <table className="w-full min-w-[400px] text-left text-sm">
                                  <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                                    <tr>
                                      <th className="p-3 font-medium">
                                        Malzeme / Parça
                                      </th>
                                      <th className="p-3 font-medium">
                                        Kategori
                                      </th>
                                      <th className="p-3 font-medium text-right">
                                        Miktar
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-gray-50 hover:bg-gray-50">
                                      <td className="p-3">
                                        <div className="font-bold text-gray-900">
                                          Kontaktör 24V
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                          Kodu: ELK-102
                                        </div>
                                      </td>
                                      <td className="p-3 text-gray-500 text-xs">
                                        Elektrik Aksamı
                                      </td>
                                      <td className="p-3 text-right">
                                        <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">
                                          145 ADET
                                        </span>
                                      </td>
                                    </tr>
                                    <tr className="border-b border-gray-50 hover:bg-gray-50">
                                      <td className="p-3">
                                        <div className="font-bold text-gray-900">
                                          V Kayışı (Tip B)
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                          Kodu: MKN-045
                                        </div>
                                      </td>
                                      <td className="p-3 text-gray-500 text-xs">
                                        Mekanik Parçalar
                                      </td>
                                      <td className="p-3 text-right">
                                        <span className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold">
                                          4 ADET (KRİTİK)
                                        </span>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {mockupTab === 'finans' && (
                          <div className="h-full flex items-center justify-center flex-col text-gray-400 text-center px-4">
                            <MoreVertical className="w-8 h-8 mb-2 opacity-50" />
                            <div className="text-sm font-medium">
                              Gelişmiş finans grafikleri için ücretsiz kayıt
                              olun.
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

        {/* ÖZELLİKLER SECTION */}
        <section
          id="features"
          className="relative py-16 md:py-24 bg-gray-50/50 border-y border-gray-100 overflow-hidden"
        >
          {/* Arka Plan Dekoratif Objeleri */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl mix-blend-multiply pointer-events-none hidden md:block"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-50/60 rounded-full blur-3xl mix-blend-multiply pointer-events-none hidden md:block"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12 md:mb-16">
              <span className="text-blue-600 font-bold tracking-wider uppercase text-xs mb-3 block">
                GÜÇLÜ ALTYAPI
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                Neden Bizi Seçmelisiniz?
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                Saha operasyonlarınızı dijitalleştirirken maliyetlerinizi
                düşüren, işininize prestij katan benzersiz özellikler.
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {[
                {
                  icon: BarChart3,
                  title: 'Performans Analizi',
                  desc: 'Ustanın hızını ölçün. Kâr/Zarar tablosunu otomatik çıkarın.',
                },
                {
                  icon: QrCode,
                  title: 'QR Varlık Yönetimi',
                  desc: 'Varlık detaylarından QR basın. Müşteri tek tuşla arıza bildirsin.',
                },
                {
                  icon: Mic,
                  title: 'Sesle Form Doldurma',
                  desc: 'Ustalar konuşsun, yapay zeka iş formunu otomatik doldursun.',
                },
                {
                  icon: Package,
                  title: 'Stok ve Depo Yönetimi',
                  desc: 'Kritik seviyeye düşen yedek parçaları görün, deponuzu fire vermeden yönetin.',
                },
                {
                  icon: Users,
                  title: 'Personel Yönetimi',
                  desc: 'Ustaların yetkinliklerini belirleyin ve saha görevlerini tek ekrandan dağıtın.',
                },
                {
                  icon: CreditCard,
                  title: 'Finans ve Kasa Logu',
                  desc: 'Gelir ve gider işlemlerini anında kaydedin, nakit akışınızı kontrol altına alın.',
                },
                {
                  icon: Bell,
                  title: 'Ücretsiz Bildirimler',
                  desc: 'SMS maliyeti yok. Tarayıcı üzerinden push bildirimleri.',
                },
                {
                  icon: CheckCircle,
                  title: 'Varlık Geçmişi',
                  desc: 'Cihazın sağlık karnesini timeline şeklinde tek bakışta görün.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Size Özel Subdomain',
                  desc: 'Size özel veritabanı alanı ve sizeozel.isdokumu.com adresi.',
                },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="group relative bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-200/60 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 overflow-hidden"
                >
                  {/* Kart İçi Hover Efekti */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  {/* Dekoratif Alt Çizgi */}
                  <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r from-blue-600 to-amber-500 group-hover:w-full transition-all duration-500"></div>

                  <div className="relative z-10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center mb-5 sm:mb-6 shadow-lg shadow-blue-600/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <f.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-blue-700 transition-colors duration-300">
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
        <section className="py-12 md:py-16 bg-gray-50 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-gray-800">
              <div className="lg:w-1/2 p-6 md:p-12 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 relative z-10">
                  Hemen Ücretsiz Kurun
                </h2>
                <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-base relative z-10">
                  Kredi kartı gerekmez. 14 gün boyunca tüm özellikleri deneyin.
                </p>
                <div className="mb-6 relative z-10">
                  <label className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Sektörünüz
                  </label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 sm:py-3.5 outline-none text-sm cursor-pointer hover:border-gray-500 focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
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
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mb-4 hover:shadow-lg hover:shadow-blue-600/30 hover:scale-[1.02] relative z-10"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-5 h-5 bg-white rounded-full p-0.5"
                  />
                  Google ile Ücretsiz Dene
                </button>
                <p className="text-center text-xs text-gray-500 relative z-10">
                  Sadece Patron (Firma Sahibi) hesapları içindir.
                </p>
              </div>
              <div className="lg:w-1/2 bg-gray-800 p-6 md:p-12 relative flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />{' '}
                    Patronlar Ne Diyor?
                  </h3>
                  <div className="flex gap-2 relative z-10">
                    {REVIEWS.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReviewIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          reviewIndex === idx
                            ? 'bg-blue-500 w-4'
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                        aria-label={`Yorum ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {visibleReviews.map((r, i) => (
                      <motion.div
                        key={r.name + reviewIndex + i}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`bg-gray-900/80 p-4 sm:p-5 rounded-xl border border-gray-700 shadow-lg ${
                          i === 2 ? 'hidden sm:block' : 'block'
                        }`}
                      >
                        <div className="flex text-amber-400 mb-2">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                        <p className="text-gray-300 text-sm mb-4 font-medium leading-relaxed">
                          "{r.text}"
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-900/50 border border-blue-800 text-blue-400 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">
                              {r.name}
                            </div>
                            <div className="text-blue-300 text-[10px] font-medium">
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
      <footer className="bg-white border-t border-gray-100 py-10 md:py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
                <span
                  translate="no"
                  className="notranslate text-lg font-bold text-gray-900"
                >
                  İş Dökümü
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed pr-4">
                İşletmenizi sıfır maliyet kaybı ve maksimum verimlilikle uçtan
                uca yönetmenizi sağlayan yeni nesil SaaS platformu.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                Özellikler
              </h4>
              <ul className="space-y-3 text-sm text-gray-500">
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
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                Kurumsal
              </h4>
              <ul className="space-y-3 text-sm text-gray-500">
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
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                Yasal
              </h4>
              <ul className="space-y-3 text-sm text-gray-500">
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
          <div className="border-t border-gray-100 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
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
