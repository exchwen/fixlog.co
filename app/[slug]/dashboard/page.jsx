'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ClipboardList, Settings, Bell, Search, Plus,
  Clock, CheckCircle2, Menu, X, LogOut, ShieldCheck, Loader2, ArrowRight,
  Box, Package, CreditCard, Send, MessageSquare, Phone, MapPin, TrendingUp, 
  ChevronDown, Wallet, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

const API_URL = 'https://backend.isdokumu.workers.dev';

export default function Dashboard() {
  const { slug } = useParams();
  const router = useRouter();
  
  // States
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState('current');

  // Modals & Chat
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef(null);

  // Forms
  const [jobForm, setJobForm] = useState({ customerName: '', assetId: '', staffId: '', workType: 'Genel Görev', taskNote: '' });
  const [assetForm, setAssetForm] = useState({ name: '', location: '' });
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'Usta' });

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard-data?slug=${slug}`);
      const result = await res.json();
      setData(result);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`${API_URL}/get-messages?slug=${slug}&staffId=${activeChatId}`);
      const msgs = await res.json();
      setMessages(msgs);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); const int = setInterval(fetchData, 15000); return () => clearInterval(int); }, [slug]);
  useEffect(() => { if (isChatOpen && activeChatId) { fetchMessages(); const cInt = setInterval(fetchMessages, 4000); return () => clearInterval(cInt); } }, [isChatOpen, activeChatId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleAction = async (endpoint, body, closeFn, resetFn) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, slug }) });
      if (res.ok) { closeFn(false); resetFn(); fetchData(); }
    } catch (err) { alert("Hata!"); } finally { setIsSaving(false); }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    await fetch(`${API_URL}/send-message`, { method: 'POST', body: JSON.stringify({ slug, senderId: 'PATRON', receiverId: activeChatId, message: messageInput }) });
    setMessageInput(''); fetchMessages();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" /></div>;

  const managers = data?.staff?.filter(s => s.role === 'Yönetici') || [];
  const statusColors = { 'Beklemede': 'bg-amber-50 text-amber-600', 'Tamamlandı': 'bg-green-50 text-green-600', 'Devam Ediyor': 'bg-blue-50 text-blue-600' };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-slate-900 text-[13px] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-60 bg-slate-900 text-slate-400 flex-col sticky top-0 h-screen z-50">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white"><ShieldCheck size={18} /></div>
          <span className="font-black text-lg text-white tracking-tighter uppercase">İş Dökümü</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'home', label: 'Genel Bakış', icon: LayoutDashboard },
            { id: 'jobs', label: 'İş Emirleri', icon: ClipboardList },
            { id: 'team', label: 'Saha Ekibi', icon: Users },
            { id: 'assets', label: 'Varlıklar', icon: Box },
            { id: 'stock', label: 'Stok Takibi', icon: Package },
            { id: 'finance', label: 'Finans', icon: CreditCard },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white' : 'hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5"><button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={16} /> Çıkış</button></div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2"><Menu size={18} /></button>
            <h1 className="font-black text-slate-800 uppercase text-sm tracking-tight">{data?.name} <span className="text-blue-600 font-bold ml-2">• Patron</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <input placeholder="Hızlı ara..." className="bg-transparent outline-none text-xs font-bold w-28" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Bell size={18} className="text-slate-400 cursor-pointer" />
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {data.stats.map((s, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><TrendingUp size={18} /></div>
                    <div><div className="text-lg font-black">{s.value}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</div></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b flex justify-between items-center"><h3 className="font-black">Aktif İş Akışı</h3><button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[11px] font-black flex items-center gap-2"><Plus size={14} /> Yeni İş</button></div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr><th className="px-6 py-4">Müşteri</th><th className="px-6 py-4">Yönetici</th><th className="px-6 py-4 text-right">Durum</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.jobs.length > 0 ? data.jobs.slice(0, 5).map(j => (
                        <tr key={j.id} className="hover:bg-slate-50 transition-all cursor-pointer">
                          <td className="px-6 py-4 font-bold">{j.customer_name}</td>
                          <td className="px-6 py-4 text-slate-500 font-bold text-[11px]">{data.staff.find(s => s.id === j.staff_id)?.name || 'Atanmadı'}</td>
                          <td className="px-6 py-4 text-right"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${statusColors[j.status]}`}>{j.status}</span></td>
                        </tr>
                      )) : <tr><td colSpan="3" className="px-6 py-10 text-center text-slate-300 italic font-bold">Veritabanında kayıtlı iş bulunamadı.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-200 flex flex-col justify-between">
                  <div><h4 className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-2">Net Kasa Durumu</h4><div className="text-3xl font-black">₺{data.finSummary.income - data.finSummary.expense}</div></div>
                  <div className="space-y-3 mt-8">
                    <div className="flex justify-between text-xs font-bold"><span className="opacity-40 uppercase tracking-widest">Gelir</span><span className="text-green-400 font-black">₺{data.finSummary.income}</span></div>
                    <div className="flex justify-between text-xs font-bold"><span className="opacity-40 uppercase tracking-widest">Gider</span><span className="text-red-400 font-black">₺{data.finSummary.expense}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  {['past', 'current', 'future'].map(f => (
                    <button key={f} onClick={() => setJobFilter(f)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${jobFilter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {f === 'past' ? 'Geçmiş' : f === 'current' ? 'Mevcut' : 'Planlanan'}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-2"><Plus size={16} /> İş Ata</button>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr><th className="px-8 py-4">ID</th><th className="px-8 py-4">Bina / Müşteri</th><th className="px-8 py-4 text-right">Durum</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {data.jobs.filter(j => {
                      if(jobFilter === 'past') return j.status === 'Tamamlandı';
                      if(jobFilter === 'current') return j.status !== 'Tamamlandı';
                      return false;
                    }).map(j => (
                      <tr key={j.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-8 py-4 text-[10px] text-blue-500">#{j.id}</td>
                        <td className="px-8 py-4">{j.customer_name}</td>
                        <td className="px-8 py-4 text-right"><span className={`px-3 py-1 rounded-full text-[9px] uppercase ${statusColors[j.status]}`}>{j.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-4 flex justify-between items-center mb-2"><h3 className="text-lg font-black uppercase tracking-tight">Personel</h3><button onClick={() => setShowStaffModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black"><Plus size={14} className="inline mr-1" /> Ekle</button></div>
              {data.staff.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg mb-4">{s.name.charAt(0)}</div>
                  <div className="font-black">{s.name}</div><div className="text-[10px] font-bold text-slate-400 uppercase mb-4">{s.role}</div>
                  <button onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} className="w-full py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Mesaj Gönder</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center font-black"><h3>Envanter Durumu</h3><button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px]">Parça Girişi</button></div>
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                    <tr><th className="px-8 py-4">Parça Adı</th><th className="px-8 py-4">Miktar</th><th className="px-8 py-4 text-right">Durum</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {data.stock.length > 0 ? data.stock.map(item => (
                      <tr key={item.id} className="font-bold">
                        <td className="px-8 py-4">{item.item_name}</td>
                        <td className="px-8 py-4">{item.quantity} Adet</td>
                        <td className="px-8 py-4 text-right"><span className="text-green-600 text-[10px] uppercase font-black bg-green-50 px-3 py-1 rounded-full">Stokta Var</span></td>
                      </tr>
                    )) : <tr><td colSpan="3" className="px-8 py-10 text-center text-slate-300 italic font-bold">Stok kaydı bulunamadı.</td></tr>}
                 </tbody>
               </table>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 font-black uppercase"><h3>Hesap Hareketleri</h3></div>
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                   <tr><th className="px-8 py-4">Açıklama</th><th className="px-8 py-4">Miktar</th><th className="px-8 py-4 text-right">Tip</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {data.finances.length > 0 ? data.finances.map(f => (
                     <tr key={f.id} className="font-bold">
                       <td className="px-8 py-4 text-slate-600">{f.description}</td>
                       <td className={`px-8 py-4 ${f.type === 'Gelir' ? 'text-green-600' : 'text-red-600'}`}>₺{f.amount}</td>
                       <td className="px-8 py-4 text-right"><span className="text-[10px] uppercase font-black bg-slate-50 px-2 py-1 rounded-lg">{f.type}</span></td>
                     </tr>
                   )) : <tr><td colSpan="3" className="px-8 py-10 text-center text-slate-300 italic font-bold">Finansal hareket bulunamadı.</td></tr>}
                 </tbody>
               </table>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-4 flex justify-between items-center mb-2 font-black uppercase tracking-tight"><h3>Kayıtlı Varlıklar</h3><button onClick={() => setShowAssetModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px]">Varlık Ekle</button></div>
              {data.assets.length > 0 ? data.assets.map(a => (
                <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all"><Box size={18} /></div>
                  <div className="font-black text-slate-800">{a.name}</div><div className="text-[10px] font-bold text-slate-400 uppercase"><MapPin size={10} className="inline mr-1" /> {a.location}</div>
                </div>
              )) : <div className="col-span-4 p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-300 font-bold uppercase tracking-widest">Envanter Boş</div>}
            </div>
          )}
        </div>
      </main>

      {/* CHAT - FACEBOOK STYLE */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="w-80 h-[480px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden shadow-slate-900/10">
              <div className="p-4 bg-blue-600 text-white flex items-center justify-between"><div className="flex items-center gap-3 font-black text-xs">{activeChatId ? data.staff.find(s => s.id === activeChatId)?.name : 'Mesajlaşma'}</div><ChevronDown className="cursor-pointer" onClick={() => setIsChatOpen(false)} /></div>
              {!activeChatId ? (
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                   {managers.map(m => <div key={m.id} onClick={() => setActiveChatId(m.id)} className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl cursor-pointer font-bold text-xs flex items-center gap-3"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">{m.name.charAt(0)}</div>{m.name}</div>)}
                </div>
              ) : (
                <><div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20">
                    <button onClick={() => setActiveChatId(null)} className="text-[9px] font-black text-blue-600 uppercase mb-4">← Geri</button>
                    {messages.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender_id === 'PATRON' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl text-[11px] font-bold max-w-[85%] ${m.sender_id === 'PATRON' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-600 border border-slate-200 rounded-tl-none shadow-sm'}`}>{m.message}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 bg-white border-t flex gap-2"><input value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Yazın..." className="flex-1 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold outline-none border-none" /><button onClick={sendMessage} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg"><Send size={14} /></button></div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><MessageSquare size={24} /></button>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tighter">İş Emri Ata</h2>
              <div className="space-y-4">
                <input list="asset-list" className="w-full px-5 py-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none" placeholder="Müşteri / Bina Adı" value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value})} />
                <datalist id="asset-list">{data.assets.map(a => <option key={a.id} value={a.name}>{a.location}</option>)}</datalist>
                <select className="w-full px-5 py-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}>
                  <option value="">Yönetici Seçin...</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <textarea rows="4" className="w-full px-5 py-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none" placeholder="Yapılacak İş / Görev Özeti" value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} />
              </div>
              <button disabled={isSaving} onClick={() => handleAction('add-job', { ...jobForm, details: { note: jobForm.taskNote } }, setShowJobModal, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', taskNote: '' }))} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[13px] shadow-xl">
                 {isSaving ? <Loader2 className="animate-spin mx-auto" /> : "İŞİ ATAMA YAP"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
              <h2 className="text-lg font-black mb-6 uppercase tracking-tighter">Yeni Varlık</h2>
              <div className="space-y-4 mb-6">
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" placeholder="Cihaz Adı" onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" placeholder="Konum" onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
              </div>
              <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs" onClick={() => handleAction('add-asset', assetForm, setShowAssetModal, () => setAssetForm({ name: '', location: '' }))}>KAYDET</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
              <h2 className="text-lg font-black mb-6 uppercase tracking-tighter">Personel Ekle</h2>
              <div className="space-y-4 mb-6">
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" placeholder="Ad Soyad" onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                <select className="w-full px-5 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                  <option value="Usta">Saha Ustası</option>
                  <option value="Yönetici">Yönetici</option>
                </select>
              </div>
              <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs" onClick={() => handleAction('add-staff', staffForm, setShowStaffModal, () => setStaffForm({ name: '', phone: '', role: 'Usta' }))}>PERSONELİ KAYDET</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}