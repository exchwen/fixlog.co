'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from '../../lib/firebase';
import { setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth';

const API_URL = 'https://backend.isdokumu.workers.dev';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // YENİ: KUSURSUZ OTOMATİK GİRİŞ ZEKASI
  // Patron ve Usta rollerini ayırarak doğru sayfaya fırlatır!
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Tarayıcıdaki tokenleri ve rolleri oku
        const patronToken = localStorage.getItem('patron_authToken');
        const patronSlug = localStorage.getItem('patron_userSlug');
        
        const staffToken = localStorage.getItem('staff_authToken');
        const staffSlug = localStorage.getItem('staff_userSlug');

        // ÖNCELİK 1: Eğer Patron tokeni varsa kesinlikle Manager'a at
        if (patronToken && patronSlug) {
          router.replace(`/${patronSlug}/manager`);
          return;
        }

        // ÖNCELİK 2: Eğer Usta tokeni varsa Dashboard'a at
        if (staffToken && staffSlug) {
          router.replace(`/${staffSlug}/dashboard`);
          return;
        }

        // Token yok ama Firebase Auth varsa (yeni giriş/senkronizasyon anı), beklet (aşağıdaki login fonskiyonları devralacak)
        setIsCheckingAuth(false);
      } else {
        // Firebase'de giriş yoksa normal login ekranını göster
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const res = await fetch(
        `${API_URL}/get-slug?uid=${userCredential.user.uid}`
      );
      const data = await res.json();

      if (data.slug && data.token) {
        localStorage.setItem('patron_authToken', data.token);
        localStorage.setItem('patron_userRole', data.role || 'Patron');
        localStorage.setItem('patron_userName', data.name || 'Patron');
        localStorage.setItem('patron_userSlug', data.slug);
        
        router.push(`/${data.slug}/manager`); 
      } else {
        router.push('/register');
      }
    } catch (err) {
      setError('E-posta veya şifre hatalı. Lütfen kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);

      const result = await signInWithPopup(auth, googleProvider);

      const res = await fetch(`${API_URL}/get-slug?uid=${result.user.uid}`);
      const data = await res.json();

      if (data.slug && data.token) {
        localStorage.setItem('patron_authToken', data.token);
        localStorage.setItem('patron_userRole', data.role || 'Patron');
        localStorage.setItem('patron_userName', data.name || 'Patron');
        localStorage.setItem('patron_userSlug', data.slug);
        
        router.push(`/${data.slug}/manager`);
      } else {
        router.push('/register');
      }
    } catch (err) {
      setError('Google ile giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans">
        <ShieldCheck className="w-12 h-12 text-blue-500 mb-4 animate-pulse" />
        <span className="font-black tracking-widest text-[11px] text-gray-400 uppercase">Oturum Kontrol Ediliyor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 relative font-sans">
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-blue-600 transition-all uppercase tracking-widest bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Ana Sayfa
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[400px] w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 p-6 sm:p-10 border border-gray-100"
      >
        <div className="flex flex-col items-center mb-8 sm:mb-10 mt-6 sm:mt-0">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight text-center tracking-tight">
            Tekrar Hoş Geldiniz
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1.5 text-center">
            İşletmenizi yönetmeye devam edin.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-bold leading-relaxed">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-gray-400 uppercase ml-1 tracking-widest">
              E-Posta Adresi
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                placeholder="isim@sirket.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Şifre
              </label>
              <span className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors active:scale-95">
                Unuttum?
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                required
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mt-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Giriş Yap <ArrowRight className="w-4 h-4" />
              </>
            )}
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
          onClick={handleGoogleLogin}
          type="button"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95 shadow-sm disabled:opacity-70"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Google ile Giriş
        </button>

        <p className="mt-8 text-center text-xs font-medium text-gray-500">
          Hesabınız yok mu?{' '}
          <span
            onClick={() => router.push('/register')}
            className="text-blue-600 font-bold cursor-pointer hover:text-blue-700 transition-colors active:scale-95 inline-block"
          >
            Hemen Kaydolun
          </span>
        </p>
      </motion.div>
    </div>
  );
}