'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ClipboardList, Settings, Bell, Search, Plus,
  Clock, CheckCircle2, Menu, X, LogOut, ShieldCheck, Loader2, ArrowRight,
  Box, Package, CreditCard, Send, MessageSquare, Phone, MapPin, TrendingUp, 
  ChevronDown, Wallet, Calendar, UserPlus, Home, UserCheck, HardHat, Info, Edit3
} from 'lucide-react';

const API_URL = 'https://backend.isdokumu.workers.dev';

export default function Dashboard() {
  const { slug } = useParams();
  const router = useRouter();
  
  // -- Navigasyon --
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState('current');

  // -- Modal Kontrolleri --
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showStaffDetail, setShowStaffDetail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // -- Chat --
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef(null);

  // -- Form Datası --
  const [jobForm, setJobForm] = useState({ customerName: '', assetId: '', staffId: '', workType: 'Genel Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' });
  const [assetForm, setAssetForm] = useState({ name: '', location: '', apartmentName: '', deviceDetails: '' });
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' });
  const [customerForm, setCustomerForm] = useState({ name: '', contact: '', address: '', taxInfo: '' });
  const [stockForm, setStockForm] = useState({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '' });

  // -- ESC ve Klavye Dinleyici --
  useEffect(() => {
    const handleKeys = (e) => {
      if (e.key === 'Escape') {
        setShowJobModal(false); setShowAssetModal(false); setShowStaffModal(false); 
        setShowCustomerModal(false); setShowStockModal(false); setShowStaffDetail(null);
        setIsChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, []);

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

  useEffect(() => { fetchData(); const int = setInterval(fetchData, 20000); return () => clearInterval(int); }, [slug]);
  useEffect(() => { if (isChatOpen && activeChatId) { fetchMessages(); const cInt = setInterval(fetchMessages, 4000); return () => clearInterval(cInt); } }, [isChatOpen, activeChatId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleAction = async (endpoint, body, closeFn, resetFn) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...body, slug }) 
      });
      if (res.ok) { closeFn(false); resetFn(); fetchData(); }
    } catch (err) { alert("Sistem hatası: Veritabanı bağlantısını kontrol edin."); } finally { setIsSaving(false); }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    await fetch(`${API_URL}/send-message`, { method: 'POST', body: JSON.stringify({ slug, senderId: 'PATRON', receiverId: activeChatId, message: messageInput }) });
    setMessageInput(''); fetchMessages();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>;

  const managers = data?.staff?.filter(s => s.role === 'Yönetici') || [];
  const statusColors = { 'Beklemede': 'bg-amber-50 text-amber-600', 'Tamamlandı': 'bg-green-50 text-green-600', 'Devam Ediyor': 'bg-blue-50 text-blue-600', 'Gelecek': 'bg-slate-100 text-slate-500' };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 text-[11px] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-52 bg-slate-900 text-slate-400 flex-col sticky top-0 h-screen z-50">
        <div className="p-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white"><ShieldCheck size={16} /></div>
          <span className="font-black text-sm text-white uppercase tracking-tighter">İş Dökümü</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 mt-2">
          {[
            { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'jobs', label: 'İş Akışı', icon: ClipboardList },
            { id: 'team', label: 'Saha Ekibi', icon: Users },
            { id: 'customers', label: 'Müşteriler', icon: UserPlus },
            { id: 'assets', label: 'Varlıklar', icon: Box },
            { id: 'stock', label: 'Stok Depo', icon: Package },
            { id: 'finance', label: 'Kasa/Finans', icon: CreditCard },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={14} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5"><button className="w-full flex items-center gap-3 px-4 py-2 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={14} /> Çıkış</button></div>
      </aside>

      {/* ANA PANEL */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-12 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2"><Menu size={18} /></button>
            <h1 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{data?.name} <span className="text-blue-600 ml-1">PANEL</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-2">
              <Search size={12} className="text-slate-400" />
              <input placeholder="Hızlı bul..." className="bg-transparent outline-none text-[10px] font-bold w-20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Bell size={14} className="text-slate-400 cursor-pointer" />
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.stats?.map((s, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><TrendingUp size={14} /></div>
                    <div><div className="text-sm font-black">{s.value}</div><div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</div></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[380px]">
                  <div className="p-4 border-b flex justify-between items-center"><h3 className="font-black text-[10px] uppercase">Anlık Akış</h3><button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black"><Plus size={10} className="inline mr-1" /> Yeni İş</button></div>
                  <div className="overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        <tr><th className="px-6 py-3">Müşteri</th><th className="px-6 py-3">Yönetici</th><th className="px-6 py-3 text-right">Durum</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data?.jobs?.length > 0 ? data.jobs.slice(0, 8).map(j => (
                          <tr key={j.id} className="hover:bg-slate-50 transition-all font-bold">
                            <td className="px-6 py-3">{j.customer_name}</td>
                            <td className="px-6 py-3 text-slate-400 text-[9px]">{data.staff.find(s => s.id === j.staff_id)?.name || '-'}</td>
                            <td className="px-6 py-3 text-right"><span className={`px-2 py-0.5 rounded text-[8px] uppercase ${statusColors[j.status] || 'bg-slate-100'}`}>{j.status}</span></td>
                          </tr>
                        )) : <tr><td colSpan="3" className="p-10 text-center text-slate-300 font-black">AKEV VERİSİ YOK</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-between shadow-xl">
                  <div><h4 className="text-[8px] font-bold opacity-30 uppercase tracking-[0.2em] mb-1">Mali Durum (Kasa)</h4><div className="text-2xl font-black">{data?.stats?.[3]?.value || '₺0'}</div></div>
                  <div className="space-y-2.5 mt-6">
                    <div className="bg-white/5 p-3 rounded-xl flex items-center justify-between"><div className="text-[9px] font-bold text-green-400">GELİR: ₺{data?.finSummary?.income || 0}</div><div className="text-[9px] font-bold text-red-400">GİDER: ₺{data?.finSummary?.expense || 0}</div></div>
                    <div className="text-[8px] font-bold text-white/10 text-center uppercase">Canlı D1 Senkronizasyonu</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: İŞ EMİRLERİ */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  {['past', 'current', 'future'].map(f => (
                    <button key={f} onClick={() => setJobFilter(f)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${jobFilter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>
                      {f === 'past' ? 'Geçmiş' : f === 'current' ? 'Mevcut' : 'Planlanan'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setJobForm({...jobForm, jobType: 'Planlı'}); setShowJobModal(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-2"><Calendar size={12} /> Geleceği Planla</button>
                  <button onClick={() => { setJobForm({...jobForm, jobType: 'Anlık'}); setShowJobModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-2"><Plus size={12} /> İş Ata</button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left font-bold">
                  <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <tr><th className="px-8 py-3.5">Müşteri / Bina</th><th className="px-8 py-3.5">Tür</th><th className="px-8 py-3.5">Tarih</th><th className="px-8 py-3.5 text-right">Durum</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.jobs?.filter(j => {
                      if(jobFilter === 'past') return j.status === 'Tamamlandı';
                      if(jobFilter === 'current') return j.status !== 'Tamamlandı' && j.status !== 'Gelecek';
                      return j.status === 'Gelecek';
                    }).map(j => (
                      <tr key={j.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-8 py-3">{j.customer_name}</td>
                        <td className="px-8 py-3 text-slate-400 uppercase text-[8px]">{j.job_type}</td>
                        <td className="px-8 py-3 text-slate-400 text-[9px]">{j.scheduled_date || new Date(j.created_at).toLocaleDateString()}</td>
                        <td className="px-8 py-3 text-right"><span className={`px-2 py-0.5 rounded text-[8px] uppercase ${statusColors[j.status] || 'bg-slate-50'}`}>{j.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SAHA EKİBİ */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center font-black uppercase text-[10px]"><h3>Ekip & Personel</h3><button onClick={() => setShowStaffModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={12} /> Personel Ekle</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-bold">
                {data?.staff?.map(s => (
                  <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-base">{s.name.charAt(0)}</div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${s.status === 'Aktif' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                    </div>
                    <div>{s.name}</div><div className="text-[8px] font-black text-slate-400 uppercase mt-1 mb-4">{s.branch || s.role}</div>
                    <div className="flex gap-1.5 w-full">
                       <button onClick={() => setShowStaffDetail(s)} className="flex-1 bg-slate-50 py-1.5 rounded-lg text-[8px] font-black hover:bg-slate-100 transition-all">DETAY/PLAN</button>
                       <button onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} className="flex-1 bg-blue-600 py-1.5 rounded-lg text-[8px] font-black text-white shadow-lg shadow-blue-500/10 transition-all">MESAJ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MÜŞTERİ REHBERİ */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center uppercase font-black text-[10px]"><h3>Müşteri Rehberi</h3><button onClick={() => setShowCustomerModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={12} /> Müşteri Ekle</button></div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-bold">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase">
                     <tr><th className="px-8 py-3.5">İsim / Kurum</th><th className="px-8 py-3.5">İletişim</th><th className="px-8 py-3.5">Adres</th><th className="px-8 py-3.5 text-right">Durum</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {data?.customers?.length > 0 ? data.customers.map(c => (
                       <tr key={c.id} className="hover:bg-slate-50">
                         <td className="px-8 py-3 text-slate-900">{c.name}</td>
                         <td className="px-8 py-3 text-slate-500">{c.contact}</td>
                         <td className="px-8 py-3 text-[9px] max-w-xs truncate">{c.address}</td>
                         <td className="px-8 py-3 text-right"><span className="text-green-500 text-[7px] uppercase font-black bg-green-50 px-2 py-0.5 rounded">AKTİF</span></td>
                       </tr>
                     )) : <tr><td colSpan="4" className="p-10 text-center text-slate-200 uppercase font-black tracking-widest">REHBER BOŞ</td></tr>}
                   </tbody>
                 </table>
              </div>
            </div>
          )}

          {/* TAB: STOK DEPO */}
          {activeTab === 'stock' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-bold">
               <div className="p-4 border-b flex justify-between items-center font-black text-[10px] uppercase"><h3>Stok & Depo Akışı</h3><button onClick={() => setShowStockModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Package size={12} /> Parça Girişi</button></div>
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase">
                    <tr><th className="px-8 py-3.5">Parça Adı</th><th className="px-8 py-3.5">Miktar/Birim</th><th className="px-8 py-3.5">Tedarikçi</th><th className="px-8 py-3.5 text-right">Durum</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {data?.stock?.length > 0 ? data.stock.map(item => (
                      <tr key={item.id}>
                        <td className="px-8 py-3">{item.item_name}</td>
                        <td className="px-8 py-3 text-slate-500">{item.quantity} {item.unit_name} / ₺{item.unit_price}</td>
                        <td className="px-8 py-3 text-[9px] text-slate-400 uppercase">{item.supplier_name || 'Genel'}</td>
                        <td className="px-8 py-3 text-right font-black text-green-600 text-[8px]">STOKTA</td>
                      </tr>
                    )) : <tr><td colSpan="4" className="p-10 text-center text-slate-200 font-black uppercase tracking-widest">DEPO BOŞ</td></tr>}
                 </tbody>
               </table>
            </div>
          )}

        </div>
      </main>

      {/* CHAT PANEL */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 font-bold">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-64 lg:w-72 h-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-3.5 bg-blue-600 text-white flex items-center justify-between font-black text-[9px] uppercase"><div className="flex items-center gap-2">{activeChatId ? data.staff.find(s => s.id === activeChatId)?.name : 'Mesajlar'}</div><ChevronDown className="cursor-pointer" onClick={() => setIsChatOpen(false)} /></div>
              {!activeChatId ? (
                <div className="flex-1 p-3 space-y-1.5 overflow-y-auto bg-slate-50">
                   {managers.map(m => <div key={m.id} onClick={() => setActiveChatId(m.id)} className="p-3 bg-white hover:bg-blue-50 rounded-xl cursor-pointer font-bold text-[9px] flex items-center gap-2 shadow-sm border border-slate-100"><div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[10px]">{m.name.charAt(0)}</div>{m.name}</div>)}
                </div>
              ) : (
                <><div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20 text-[10px]">
                    <button onClick={() => setActiveChatId(null)} className="text-[7px] font-black text-blue-600 uppercase mb-2">← Listeye Dön</button>
                    {messages.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender_id === 'PATRON' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-2.5 rounded-xl max-w-[85%] ${m.sender_id === 'PATRON' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-600 border border-slate-100 rounded-tl-none shadow-sm'}`}>{m.message}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 bg-white border-t flex gap-2"><input value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Yaz..." className="flex-1 bg-slate-50 px-4 py-2 rounded-xl text-[9px] font-bold outline-none border-none" /><button onClick={sendMessage} className="bg-blue-600 text-white p-2 rounded-xl"><Send size={12} /></button></div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-12 h-12 bg-blue-600 text-white rounded-xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><MessageSquare size={18} /></button>
      </div>

      {/* MODALLAR */}

      {/* MODAL: İŞ EMİRLERİ */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xs font-black uppercase tracking-widest">Yeni İş Ataması</h2><button onClick={() => setShowJobModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={16} /></button></div>
              <div className="space-y-4 overflow-y-auto font-bold">
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-2 rounded-xl text-[9px] font-black border transition-all ${jobForm.jobType === 'Anlık' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400'}`}>HEMEN BAŞLAT</button>
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-2 rounded-xl text-[9px] font-black border transition-all ${jobForm.jobType === 'Planlı' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400'}`}>İLERİ TARİHLİ</button>
                </div>
                {jobForm.jobType === 'Planlı' && (
                  <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-1">Planlanan Tarih</label><input type="date" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px] outline-none border border-transparent focus:border-blue-100" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} /></div>
                )}
                <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-1">Müşteri / Bina Adı</label><input list="asset-list" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px] outline-none" placeholder="Rehberden seç veya yeni..." value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value})} /></div>
                <datalist id="asset-list">{data?.assets?.map(a => <option key={a.id} value={a.name}>{a.location}</option>)}</datalist>
                <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-1">Sorumlu Yönetici</label><select className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px] outline-none appearance-none" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}><option value="">Seçiniz...</option>{managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase ml-1">İş Özeti / Görev Notu</label><textarea rows="3" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px] outline-none resize-none" placeholder="Usta sahada ne yapacak?" value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} /></div>
              </div>
              <button disabled={isSaving} onClick={() => handleAction('add-job', { ...jobForm, details: { note: jobForm.taskNote } }, setShowJobModal, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black text-[10px] shadow-lg mt-6 uppercase">
                 {isSaving ? <Loader2 className="animate-spin mx-auto" /> : "İŞ EMRİNİ GÖNDER"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: VARLIK KAYDI */}
      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative font-bold">
              <div className="flex justify-between items-center mb-6 uppercase font-black tracking-tighter text-[10px]"><h2>Varlık & Cihaz Kaydı</h2><button onClick={() => setShowAssetModal(false)}><X size={18} /></button></div>
              <div className="space-y-3 mb-6">
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Cihaz Adı" onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Apartman / Bina Adı" onChange={e => setAssetForm({...assetForm, apartmentName: e.target.value})} />
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Konum (Kat/Daire)" onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                <textarea rows="2" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px] outline-none" placeholder="Marka, Model, Seri No vb." onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
              </div>
              <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black text-[10px] shadow-lg" onClick={() => handleAction('add-asset', assetForm, setShowAssetModal, () => setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '' }))}>VARLIĞI KAYDET</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PERSONEL KAYDI */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl relative font-bold">
              <div className="flex justify-between items-center mb-6 uppercase font-black text-[10px]"><h2>Saha Personel Kaydı</h2><button onClick={() => setShowStaffModal(false)}><X size={18} /></button></div>
              <div className="space-y-3 mb-6">
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Ad Soyad" onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Telefon" onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Branş (Örn: Elektrik)" onChange={e => setStaffForm({...staffForm, branch: e.target.value})} />
                <select className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px] outline-none appearance-none" onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                  <option value="Usta">Usta</option>
                  <option value="Yönetici">Yönetici</option>
                </select>
              </div>
              <button className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-[10px] shadow-xl uppercase" onClick={() => handleAction('add-staff', staffForm, setShowStaffModal, () => setStaffForm({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' }))}>PERSONELİ KAYDET</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: MÜŞTERİ KAYDI */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative font-bold">
              <div className="flex justify-between items-center mb-6 uppercase font-black text-[10px]"><h2>Müşteri / Kurum Ekle</h2><button onClick={() => setShowCustomerModal(false)}><X size={18} /></button></div>
              <div className="space-y-3 mb-6">
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Müşteri/Firma Adı" onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="İletişim (Tel/Mail)" onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Adres" onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Vergi No/Kimlik (Opsiyonel)" onChange={e => setCustomerForm({...customerForm, taxInfo: e.target.value})} />
              </div>
              <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black text-[10px] shadow-lg uppercase" onClick={() => handleAction('add-customer', customerForm, setShowCustomerModal, () => setCustomerForm({ name: '', contact: '', address: '', taxInfo: '' }))}>REHBERE EKLE</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PARÇA / STOK GİRİŞİ */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative font-bold">
              <div className="flex justify-between items-center mb-6 uppercase font-black text-[10px]"><h2>Parça Girişi (Depo)</h2><button onClick={() => setShowStockModal(false)}><X size={18} /></button></div>
              <div className="space-y-3 mb-6">
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Parça Adı (Örn: Motor)" onChange={e => setStockForm({...stockForm, itemName: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Miktar" onChange={e => setStockForm({...stockForm, quantity: e.target.value})} />
                  <select className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px] outline-none" onChange={e => setStockForm({...stockForm, unitName: e.target.value})}><option value="Adet">Adet</option><option value="Metre">Metre</option><option value="Paket">Paket</option></select>
                </div>
                <input type="number" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Birim Alış Fiyatı (₺)" onChange={e => setStockForm({...stockForm, unitPrice: e.target.value})} />
                <input className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[10px]" placeholder="Tedarikçi Adı" onChange={e => setStockForm({...stockForm, supplierName: e.target.value})} />
              </div>
              <button className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-[10px] shadow-xl uppercase" onClick={() => handleAction('add-stock', stockForm, setShowStockModal, () => setStockForm({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '' }))}>STOK KAYDET</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PERSONEL DETAY VE PLAN */}
      <AnimatePresence>
        {showStaffDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col font-bold">
              <div className="flex justify-between items-center mb-6"><h2 className="text-[10px] font-black uppercase tracking-tight text-blue-600">Personel Kartı: {showStaffDetail.name}</h2><button onClick={() => setShowStaffDetail(null)} className="p-1 hover:bg-slate-50 rounded-lg"><X size={18} /></button></div>
              <div className="grid grid-cols-2 gap-2 mb-6">
                 <div className="bg-slate-50 p-3 rounded-xl"><div className="text-[7px] font-black opacity-30 uppercase">Branş/Rol</div><div className="text-[10px] uppercase font-black">{showStaffDetail.branch || showStaffDetail.role}</div></div>
                 <div className="bg-slate-50 p-3 rounded-xl"><div className="text-[7px] font-black opacity-30 uppercase">Statü</div><div className="text-[10px] uppercase font-black text-green-500">{showStaffDetail.status}</div></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                 <h4 className="text-[8px] font-black uppercase opacity-40 mb-1 ml-1">Görev Geçmişi & Planlar</h4>
                 {data.jobs.filter(j => j.staff_id === showStaffDetail.id).length > 0 ? data.jobs.filter(j => j.staff_id === showStaffDetail.id).map(j => (
                   <div key={j.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div><div className="text-[10px]">{j.customer_name}</div><div className="text-[8px] text-slate-400">{j.scheduled_date || 'Acil'}</div></div>
                      <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${statusColors[j.status] || 'bg-slate-100'}`}>{j.status}</span>
                   </div>
                 )) : <div className="text-center p-6 text-slate-300 italic text-[9px]">Henüz bir görev bulunmuyor.</div>}
              </div>
              <div className="pt-4 border-t flex gap-2">
                 <button className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl font-black text-[9px] uppercase hover:bg-blue-600 hover:text-white transition-all">BRANŞ DÜZENLE</button>
                 <button className="flex-1 bg-red-50 text-red-500 py-2.5 rounded-xl font-black text-[9px] uppercase">PASİFE AL</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}