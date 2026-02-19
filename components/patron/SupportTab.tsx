'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lightbulb, Wrench, Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SupportTab({ handleAction, isSaving }: any) {
  const [ticketType, setTicketType] = useState('Öneri/İstek');
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const success = await handleAction('add-support-ticket', { type: ticketType, message });
    
    if (success) {
      setModalState('success');
      setMessage('');
      setTimeout(() => setModalState('idle'), 3000);
    } else {
      setModalState('error');
      setTimeout(() => setModalState('idle'), 3000);
    }
  };

  const types = [
    { id: 'Öneri/İstek', icon: Lightbulb, title: 'Öneri / İstek', desc: 'Sistemde görmek istediğiniz yeni bir özellik.' },
    { id: 'Teknik Destek', icon: Wrench, title: 'Teknik Destek', desc: 'Sistemde yaşadığınız bir hata veya sorun.' },
    { id: 'Geri Bildirim', icon: MessageSquare, title: 'Geri Bildirim', desc: 'Uygulama hakkındaki genel düşünceleriniz.' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* BAŞLIK */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Destek & Geri Bildirim Merkezi</h3>
          <p className="text-xs text-slate-500 mt-1">İş Dökümü ekibine ulaşın. Fikirleriniz bizim için çok değerli.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* SOL TARAF - BİLGİLENDİRME */}
        <div className="bg-slate-900 text-white p-8 md:w-1/3 flex flex-col justify-between">
            <div>
                <h4 className="text-xl font-black mb-4">Sizi Dinliyoruz</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    İş Dökümü sistemini sizlerin taleplerine göre geliştiriyoruz. Bir özelliğin eksik olduğunu düşünüyorsanız veya teknik bir aksaklık yaşıyorsanız bize anında buradan bildirebilirsiniz.
                </p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Yanıt Süresi</div>
                <div className="text-sm font-medium text-white">Talepleriniz ortalama <span className="text-emerald-400 font-bold">2-4 saat</span> içinde ekibimiz tarafından incelenir.</div>
            </div>
        </div>

        {/* SAĞ TARAF - FORM */}
        <div className="p-8 md:w-2/3">
            <AnimatePresence mode="wait">
                {modalState === 'success' ? (
                    <motion.div 
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="h-full flex flex-col items-center justify-center text-center py-10"
                    >
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Talebiniz Alındı!</h3>
                        <p className="text-slate-500">Geri bildiriminiz İş Dökümü ekibine başarıyla iletildi. İlginiz için teşekkür ederiz.</p>
                    </motion.div>
                ) : modalState === 'error' ? (
                     <motion.div 
                        key="error"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="h-full flex flex-col items-center justify-center text-center py-10"
                    >
                        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-5">
                            <AlertTriangle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Gönderim Başarısız!</h3>
                        <p className="text-slate-500 mb-6">Bağlantı hatası nedeniyle talebiniz iletilemedi. Lütfen daha sonra tekrar deneyin.</p>
                        <button onClick={() => setModalState('idle')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold">Tekrar Dene</button>
                    </motion.div>
                ) : (
                    <motion.form 
                        key="form"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onSubmit={handleSubmit} 
                        className="space-y-6"
                    >
                        {/* KONU SEÇİMİ */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Ne hakkında yazmak istersiniz?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {types.map((type) => (
                                    <div 
                                        key={type.id}
                                        onClick={() => setTicketType(type.id)}
                                        className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center text-center transition-all ${ticketType === type.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                                    >
                                        <type.icon size={24} className={`mb-2 ${ticketType === type.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <div className={`font-bold text-sm mb-1 ${ticketType === type.id ? 'text-blue-700' : 'text-slate-700'}`}>{type.title}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* MESAJ ALANI */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Mesajınız</label>
                            <textarea
                                required
                                rows={6}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Buraya yazın..."
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 resize-none"
                            ></textarea>
                        </div>

                        {/* GÖNDER BUTONU */}
                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit"
                                disabled={isSaving || !message.trim()}
                                className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 active:scale-95"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                {isSaving ? 'Gönderiliyor...' : 'Talebi İlet'}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}