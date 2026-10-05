'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Loader2 } from 'lucide-react';

export default function HomeQuoteForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'Bakım Sözleşmesi', // Bakım Sözleşmesi, Tadilat Teklifi, Montaj Teklifi
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    // Simüle edilmiş gönderim (gerçek backend bağlantısı buraya eklenebilir)
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setFormData({ name: '', phone: '', email: '', type: 'Bakım Sözleşmesi', message: '' });
      }, 3000);
    }, 1500);
  };

  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden" id="teklif-al">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Yeni Müşterimiz Olun</h2>
          <p className="text-lg text-slate-600 font-medium">Hemen teklif alın, iş süreçlerinizi dijitalleştirerek büyümeye bugünden başlayın.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-slate-100"
        >
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Talebiniz Alındı!</h3>
              <p className="text-slate-600 font-medium max-w-sm">Teklif formunuz başarıyla iletildi. En kısa sürede sizinle iletişime geçeceğiz.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Ad Soyad / Firma Adı *</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Firma veya Adınız" 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Telefon Numarası *</label>
                  <input 
                    required 
                    type="tel" 
                    placeholder="05XX XXX XX XX" 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">E-Posta Adresi</label>
                  <input 
                    type="email" 
                    placeholder="ornek@firma.com" 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Teklif Türü *</label>
                  <select 
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800 appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Bakım Sözleşmesi">Bakım Sözleşmesi</option>
                    <option value="Tadilat Teklifi">Tadilat Teklifi</option>
                    <option value="Montaj Teklifi">Montaj Teklifi</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Eklemek İstedikleriniz (Opsiyonel)</label>
                <textarea 
                  rows={4}
                  placeholder="Bize projenizden veya ihtiyaçlarınızdan bahsedin..." 
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-800 resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {status === 'loading' ? <Loader2 className="animate-spin" size={24} /> : <><Send size={24} /> Teklif İste</>}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
