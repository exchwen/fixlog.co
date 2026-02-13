'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Building2,
  Briefcase,
  Mail,
  Lock,
  Star,
  ChevronRight,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  Quote,
  Zap,
  Users,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
} from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { generateUniqueSlug } from '../../lib/utils';

const API_URL = 'https://backend.isdokumu.workers.dev';

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

const SECTOR_MOCKUP_DATA = {
  'Asansör Bakım & Montaj': {
    title: 'Bakım Takibi',
    jobs: ['A Blok Revizyon', 'Mavi Etiket Kontrol'],
    stats: '14 Aktif Arıza',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    accent: 'bg-blue-600',
  },
  'İklimlendirme (Klima & Kombi)': {
    title: 'Servis Yönetimi',
    jobs: ['Klima Montajı', 'Kombi Yıllık Bakım'],
    stats: '8 Saha Ekibi',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    accent: 'bg-orange-600',
  },
  'Güvenlik Kamera & Alarm Sistemleri': {
    title: 'Proje Takibi',
    jobs: ['Kamera Kurulum', 'Sensör Değişimi'],
    stats: '210 Kayıtlı Cihaz',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    accent: 'bg-indigo-600',
  },
  'Profesyonel Temizlik Hizmetleri': {
    title: 'Ekip Planlama',
    jobs: ['Ofis Temizliği', 'Cam Silimi'],
    stats: '22 Personel',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    accent: 'bg-emerald-600',
  },
  'Diğer (Özel Sektör)': {
    title: 'Operasyon',
    jobs: ['Günlük İş Emri', 'Müşteri Kaydı'],
    stats: 'Hızlı Takip',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    accent: 'bg-gray-800',
  },
};

const REVIEWS = [
  {
    name: 'Kadir B.',
    role: 'Asansör Firma Sahibi',
    text: 'Kağıt formlardan kurtulmak hızı ikiye katladı.',
  },
  {
    name: 'Zeynep A.',
    role: 'İklimlendirme Müdürü',
    text: 'Müşteri memnuniyetimiz %40 arttı, her şey cebimizde.',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewIdx, setReviewIdx] = useState(0);
  const [formData, setFormData] = useState({
    companyName: '',
    sector: SECTORS[0],
    email: '',
    password: '',
  });

  useEffect(() => {
    const timer = setInterval(
      () => setReviewIdx((prev) => (prev + 1) % REVIEWS.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setStep(2);
    } catch (err) {
      setError('Google bağlantısı başarısız.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (formData.companyName.length < 3) return setError('Firma adını girin.');
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const slug = generateUniqueSlug(formData.companyName);

      await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          companyName: formData.companyName,
          sector: formData.sector,
          slug,
        }),
      });

      router.push(`/${slug}/dashboard`);
    } catch (err) {
      setError('Kayıt başarısız.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (formData.companyName.trim().length < 3)
      return setError('Firma adı girin.');
    setIsLoading(true);
    try {
      const slug = generateUniqueSlug(formData.companyName);
      const user = auth.currentUser;

      await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          companyName: formData.companyName,
          sector: formData.sector,
          slug,
        }),
      });

      router.push(`/${slug}/dashboard`);
    } catch (err) {
      setError('İşlem tamamlanamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const mockup =
    SECTOR_MOCKUP_DATA[formData.sector] ||
    SECTOR_MOCKUP_DATA['Diğer (Özel Sektör)'];

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
      <div className="w-full lg:w-[42%] p-6 sm:p-12 md:p-16 flex flex-col justify-center bg-white z-20 shadow-xl lg:shadow-none relative">
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-8 lg:mb-12 flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push('/')}
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
                İş Dökümü
              </span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest bg-gray-50 px-3 py-2 rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Geri Dön
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                  Hesap Oluştur
                </h1>
                <p className="text-gray-500 text-sm mb-8">
                  İşletmenizi dijitalleştirmek için bilgilerinizi girin.
                </p>
                <form onSubmit={handleEmailRegister} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                      {error}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        required
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Firma adınız..."
                      />
                    </div>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="sector"
                        value={formData.sector}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none appearance-none"
                      >
                        {SECTORS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
                      placeholder="İş E-postası"
                    />
                    <input
                      required
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
                      placeholder="Şifre"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all mt-2"
                  >
                    Hesabı Oluştur
                  </button>
                </form>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-400">
                    <span className="bg-white px-4">Veya</span>
                  </div>
                </div>
                <button
                  onClick={handleGoogleRegister}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-95 shadow-sm transition-all"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="G"
                    className="w-5 h-5"
                  />{' '}
                  Google ile Devam Et
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="s2"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                  Son Bir Adım
                </h1>
                <p className="text-gray-500 text-sm mb-8">
                  Google hesabın bağlandı. Şimdi işletme bilgilerini tamamla.
                </p>
                <div className="space-y-5">
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Firma adınız..."
                    />
                  </div>
                  <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleFinalize}
                    disabled={isLoading}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm shadow-2xl active:scale-95 transition-all"
                  >
                    Kurulumu Bitir ve Başla
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SAĞ TARAF - PANEL ÖNİZLEME */}
      <div className="hidden lg:flex w-[58%] bg-[#F8FAFC] relative flex-col items-center justify-center p-12 border-l border-gray-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-gray-100 p-6 mb-10 rotate-1 group hover:rotate-0 transition-all duration-700"
          >
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${mockup.bg} rounded-xl flex items-center justify-center shadow-inner`}
                >
                  <LayoutDashboard className={`w-5 h-5 ${mockup.color}`} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-gray-900 truncate max-w-[150px]">
                    {formData.companyName || 'İşletme Adı'}
                  </h4>
                  <p
                    className={`text-[10px] ${mockup.color} font-bold uppercase tracking-tighter`}
                  >
                    {formData.sector}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-sm"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <motion.div
                layout
                className="bg-gray-900 p-4 rounded-3xl text-white shadow-lg"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] opacity-60 font-bold uppercase">
                    Durum
                  </span>
                </div>
                <div className="text-sm font-bold truncate">{mockup.title}</div>
              </motion.div>
              <motion.div
                layout
                className={`${mockup.bg} p-4 rounded-3xl ${mockup.color} border border-white`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users className={`w-3 h-3 ${mockup.color}`} />
                  <span className="text-[10px] opacity-60 font-bold uppercase">
                    Bilgi
                  </span>
                </div>
                <div className="text-sm font-bold truncate">{mockup.stats}</div>
              </motion.div>
            </div>
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">
                Günlük Akış
              </div>
              <AnimatePresence mode="popLayout">
                {mockup.jobs.map((job, i) => (
                  <motion.div
                    key={job}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-white shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">
                        {job}
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-50" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={reviewIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white/80 backdrop-blur-md border border-white p-5 rounded-2xl shadow-xl relative overflow-hidden max-w-sm mx-auto"
            >
              <Quote className="absolute top-2 right-4 w-12 h-12 text-blue-100/50 -z-10" />
              <div className="relative z-10">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm font-bold text-gray-800 italic leading-snug mb-5">
                  "{REVIEWS[reviewIdx].text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-white">
                    {REVIEWS[reviewIdx].name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900">
                      {REVIEWS[reviewIdx].name}
                    </div>
                    <div className="text-[9px] text-blue-600 font-bold uppercase tracking-wide">
                      {REVIEWS[reviewIdx].role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="lg:hidden p-4 bg-white border-t border-gray-50 flex justify-center fixed bottom-0 left-0 right-0 z-30">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}
