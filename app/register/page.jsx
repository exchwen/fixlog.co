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
  deleteUser,
  signInWithPopup,
} from '../../lib/firebase';
import { generateUniqueSlug } from '../../lib/utils';
import { fetchAndStorePatronSession } from '../../lib/patronSession';
// JSON Verisini Buradan Çekiyoruz
import sectorDataFile from '../../lib/data/sectors.json';

const API_URL = 'https://api.fixlog.co';

const SECTOR_DATA = sectorDataFile.sectors;
const SECTORS = Object.keys(SECTOR_DATA);

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
    referredByCode: '',
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
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      setStep(2);
    } catch (err) {
      if (err?.code === 'auth/account-exists-with-different-credential') {
        setError('Bu e-posta zaten kullanılıyor. Aynı adresle e-posta/şifre ile kayıt olduysanız giriş yapın.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('');
      } else {
        setError('Google bağlantısı başarısız.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (formData.companyName.length < 3) return setError('Firma adını girin.');
    if (!formData.email?.trim()) return setError('E-posta adresi girin.');
    if (!formData.password || formData.password.length < 6) {
      return setError('Şifre en az 6 karakter olmalı.');
    }
    setIsLoading(true);
    setError('');
    let userCredential = null;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const slug = generateUniqueSlug(formData.companyName);

      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: await userCredential.user.getIdToken(),
          companyName: formData.companyName,
          sector: formData.sector,
          slug,
          referredByCode: formData.referredByCode,
        }),
      });

      const reg = await res.json().catch(() => ({}));
      if (!res.ok) {
        try {
          await deleteUser(userCredential.user);
        } catch (_) {
          /* yoksay */
        }
        setError(reg.error || 'Kayıt tamamlanamadı. Tekrar deneyin.');
        return;
      }

      const session = await fetchAndStorePatronSession(API_URL, userCredential.user);
      if (!session.ok) {
        setError('Firma oluşturuldu ancak oturum başlatılamadı. Giriş sayfasından giriş yapın.');
        return;
      }

      const destSlug = reg.slug || session.slug || slug;
      router.push(`/${destSlug}/dashboard`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanımda.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre çok zayıf (en az 6 karakter olmalı).');
      } else if (err.code === 'auth/invalid-email') {
        setError('Geçerli bir e-posta adresi girin.');
      } else {
        setError('Kayıt sırasında bir hata oluştu: ' + (err.message || err.code || ''));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (formData.companyName.trim().length < 3)
      return setError('Firma adı girin.');
    setIsLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Oturum bulunamadı. Lütfen tekrar "Google ile Devam Et"e tıklayın.');
        return;
      }
      const slug = generateUniqueSlug(formData.companyName);

      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: await user.getIdToken(),
          companyName: formData.companyName,
          sector: formData.sector,
          slug,
          referredByCode: formData.referredByCode,
        }),
      });

      const reg = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(reg.error || 'Kurulum tamamlanamadı.');
        return;
      }

      const session = await fetchAndStorePatronSession(API_URL, user);
      if (!session.ok) {
        setError('Firma oluşturuldu ancak oturum başlatılamadı. Giriş sayfasından giriş yapın.');
        return;
      }

      const destSlug = reg.slug || session.slug || slug;
      router.push(`/${destSlug}/dashboard`);
    } catch (err) {
      setError('İşlem tamamlanamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const mockup = SECTOR_DATA[formData.sector] || SECTOR_DATA['Diğer (Özel Sektör)'] || { title: 'Yükleniyor', jobs: [], stats: '', color: 'text-gray-400', bg: 'bg-gray-50' };

  return (
    // YENİ: Mobilde klavye açılınca sayfanın bozulmasını önlemek için min-h-[100dvh] eklendi
    <div className="min-h-[100dvh] bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
      <div className="w-full lg:w-[42%] p-6 sm:p-12 md:p-16 flex flex-col justify-center bg-white z-20 shadow-xl lg:shadow-none relative">
      <div className="max-w-sm mx-auto w-full">
          <div className="mb-8 lg:mb-12 flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer transition-all active:scale-95 group"
              onClick={() => router.push('/')}
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md shadow-slate-200/50 border border-slate-100 p-2 overflow-hidden group-hover:shadow-lg transition-shadow">
                <img src="/icons/icon-192x192.png" alt="FixLog Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight hidden sm:block group-hover:text-blue-600 transition-colors">
              FixLog.co
              </span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-all uppercase tracking-widest bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> Geri Dön
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
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">
                  Hesap Oluştur
                </h1>
                <p className="text-gray-500 text-sm mb-8 font-medium">
                  İşletmenizi dijitalleştirmek için bilgilerinizi girin.
                </p>
                <form onSubmit={handleEmailRegister} className="space-y-4">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0"></span>
                      {error}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-gray-400"
                        placeholder="Firma adınız..."
                      />
                    </div>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="sector"
                        value={formData.sector}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none appearance-none transition-all cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                      >
                        {SECTORS.map((s) => (
                          <option key={s} value={s} className="font-medium">
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-gray-400"
                        placeholder="İş E-postası"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-gray-400"
                        placeholder="Şifre"
                      />
                    </div>
                    <div className="relative">
                      <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="referredByCode"
                        value={formData.referredByCode}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-gray-400"
                        placeholder="Referans Kodu (Opsiyonel)"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm shadow-xl shadow-blue-600/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Hesabı Oluştur'}
                  </button>
                </form>
                
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-300 tracking-widest">
                    <span className="bg-white px-4">VEYA</span>
                  </div>
                </div>
                
                <button
                  onClick={handleGoogleRegister}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 rounded-xl px-4 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 active:scale-95 shadow-sm transition-all disabled:opacity-70"
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
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">
                  Son Bir Adım
                </h1>
                <p className="text-gray-500 text-sm mb-8 font-medium">
                  Google hesabın başarıyla bağlandı. Şimdi işletme bilgilerini tamamla.
                </p>
                <div className="space-y-5">
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-gray-400"
                      placeholder="Firma adınız..."
                    />
                  </div>
                  <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="sector"
                        value={formData.sector}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none appearance-none transition-all cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                      >
                        {SECTORS.map((s) => (
                          <option key={s} value={s} className="font-medium">
                            {s}
                          </option>
                        ))}
                      </select>
                  </div>
                  <div className="relative">
                      <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="referredByCode"
                        value={formData.referredByCode}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-gray-400"
                        placeholder="Referans Kodu (Opsiyonel)"
                      />
                  </div>
                  <button
                    onClick={handleFinalize}
                    disabled={isLoading}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Kurulumu Bitir ve Başla'}
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
            className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 p-6 mb-10 rotate-1 group hover:rotate-0 transition-all duration-700"
          >
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 ${mockup.bg} rounded-2xl flex items-center justify-center shadow-inner`}
                >
                  <LayoutDashboard className={`w-6 h-6 ${mockup.color}`} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 truncate max-w-[180px]">
                    {formData.companyName || 'İşletme Adı'}
                  </h4>
                  <p
                    className={`text-[10px] ${mockup.color} font-bold uppercase tracking-widest mt-0.5`}
                  >
                    {formData.sector}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm border border-white"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm border border-white"></div>
                <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm border border-white"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <motion.div
                layout
                className="bg-gray-900 p-5 rounded-3xl text-white shadow-lg flex flex-col justify-center"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">
                    Durum
                  </span>
                </div>
                <div className="text-base font-black truncate">{mockup.title}</div>
              </motion.div>
              <motion.div
                layout
                className={`${mockup.bg} p-5 rounded-3xl ${mockup.color} border border-white flex flex-col justify-center`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className={`w-4 h-4 ${mockup.color}`} />
                  <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">
                    Bilgi
                  </span>
                </div>
                <div className="text-base font-black truncate">{mockup.stats}</div>
              </motion.div>
            </div>
            <div className="space-y-3">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2">
                Günlük Akış
              </div>
              <AnimatePresence mode="popLayout">
                {mockup?.jobs?.map((job, i) => (
                  <motion.div
                    key={job}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-white shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {job}
                      </span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
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
              className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl relative overflow-hidden max-w-sm mx-auto"
            >
              <Quote className="absolute top-4 right-4 w-12 h-12 text-blue-100/50 -z-10" />
              <div className="relative z-10">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm font-bold text-gray-800 italic leading-relaxed mb-6">
                  &quot;{REVIEWS[reviewIdx].text}&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md ring-4 ring-white">
                    {REVIEWS[reviewIdx].name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900">
                      {REVIEWS[reviewIdx].name}
                    </div>
                    <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">
                      {REVIEWS[reviewIdx].role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* YENİ: Mobilde En Altta Sabit (Sticky) Geri Dön Butonu */}
      <div className="lg:hidden p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100 flex justify-center sticky bottom-0 left-0 right-0 z-30">
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 hover:text-blue-600 transition-all uppercase tracking-widest active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}
