'use client';

import { FormEvent, useEffect, useState } from 'react';
import { onAuthStateChanged, EmailAuthProvider, linkWithCredential, User } from 'firebase/auth';
import { LockKeyhole, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function GooglePasswordGate() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, currentUser => {
    setUser(currentUser);
    setChecking(false);
  }), []);

  const needsPassword = !!user?.email && user.providerData.some(provider => provider.providerId === 'google.com') && !user.providerData.some(provider => provider.providerId === 'password');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.email) return;
    if (password.length < 6) { setError('Sifre en az 6 karakter olmali.'); return; }
    if (password !== confirmPassword) { setError('Sifreler eslesmiyor.'); return; }
    setSaving(true);
    setError('');
    try {
      await linkWithCredential(user, EmailAuthProvider.credential(user.email, password));
      setPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e.code === 'auth/provider-already-linked' ? 'Bu hesapta zaten bir sifre tanimli. Sayfayi yenileyin.' : e.message || 'Sifre kaydedilemedi. Tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  if (checking || !needsPassword) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="google-password-title">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><LockKeyhole /></div>
        <h2 id="google-password-title" className="text-xl font-black text-slate-900">Hesap sifrenizi belirleyin</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Google ile ilk girisiniz. Devam etmeden once e-posta adresinizle de kullanabileceginiz bir sifre belirleyin.</p>
        <label className="mt-5 block text-xs font-bold text-slate-600">Yeni sifre</label>
        <input autoFocus type="password" autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
        <label className="mt-4 block text-xs font-bold text-slate-600">Yeni sifreyi tekrar girin</label>
        <input type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
        {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
        <button type="submit" disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : null} Sifreyi kaydet ve devam et
        </button>
      </form>
    </div>
  );
}
