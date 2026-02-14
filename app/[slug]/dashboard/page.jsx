'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ClipboardList, Settings, Bell, Search, Plus,
  Clock, CheckCircle2, Menu, X, LogOut, ShieldCheck, Loader2, ArrowRight,
  Box, Package, CreditCard, Send, MessageSquare, Phone, MapPin, TrendingUp, 
  ChevronDown, Wallet, Calendar, UserPlus, Home, UserCheck, HardHat, Info
} from 'lucide-react';

const API_URL = 'https://backend.isdokumu.workers.dev';

export default function Dashboard() {
  const { slug } = useParams();
  const router = useRouter();
  
  // -- UI & Nav States --
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState('current');

  // -- Modal States --
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showStaffDetail, setShowStaffDetail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // -- Chat States --
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef(null);

  // -- Form States --
  const [jobForm, setJobForm] = useState({ customerName: '', assetId: '', staffId: '', workType: 'Genel Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' });
  const [assetForm, setAssetForm] = useState({ name: '', location: '', apartmentName: '', deviceDetails: '' });
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' });
  const [customerForm, setCustomerForm] = useState({ name: '', contact: '', address: '', taxInfo: '' });
  const [stockForm, setStockForm] = useState({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '', supplierPhone: '' });

  // -- ESC & Mobile Back Gesture --
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowJobModal(false); setShowAssetModal(false); setShowStaffModal(false); 
        setShowCustomerModal(false); setShowStockModal(false); setShowStaffDetail(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
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

  useEffect(() => { fetchData(); const int = setInterval(fetchData, 15000); return () => clearInterval(int); }, [slug]);
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
    } catch (err) { alert("Hata oluştu, lütfen alanları kontrol edin."); } finally { setIsSaving(false); }
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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 text-[12px] overflow-hidden">
      
      {/* SIDEBAR - COMPACT */}
      <aside className="hidden lg:flex w-56 bg-slate-900 text-slate-400 flex-col sticky top-0 h-screen z-50 shadow-2xl shadow-black">
        <div className="p-5 flex items-center gap-3 border-b border-white/5 bg-slate-900/50">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white"><ShieldCheck size={16} /></div>
          <span className="font-black text-base text-white tracking-tighter uppercase">İş Dökümü</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 mt-2">
          {[
            { id: 'home', label: 'Genel Bakış', icon: LayoutDashboard },
            { id: 'jobs', label: 'İş Emirleri', icon: ClipboardList },
            { id: 'team', label: 'Saha Ekibi', icon: Users },
            { id: 'customers', label: 'Müşteriler', icon: UserPlus },
            { id: 'assets', label: 'Varlıklar', icon: Box },
            { id: 'stock', label: 'Stok Takibi', icon: Package },
            { id: 'finance', label: 'Finans', icon: CreditCard },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={15} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5"><button className="w-full flex items-center gap-3 px-4 py-2 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={15} /> Çıkış</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2"><Menu size={18} /></button>
            <h1 className="font-black text-slate-800 uppercase text-xs tracking-tight">{data?.name} <span className="text-blue-600 font-bold ml-1">• Patron</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
              <Search size={12} className="text-slate-400" />
              <input placeholder="Hızlı ara..." className="bg-transparent outline-none text-[11px] font-bold w-24" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Bell size={16} className="text-slate-400 cursor-pointer" />
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* GENEL BAKIŞ */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {data.stats.map((s, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><TrendingUp size={16} /></div>
                    <div><div className="text-base font-black leading-none mb-1">{s.value}</div><div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</div></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="p-5 border-b flex justify-between items-center"><h3 className="font-black text-xs uppercase tracking-tight">Aktif Akış</h3><button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2"><Plus size={12} /> Yeni İş</button></div>
                  <div className="overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                        <tr><th className="px-6 py-3">Müşteri</th><th className="px-6 py-3">Yönetici</th><th className="px-6 py-3 text-right">Durum</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.jobs.length > 0 ? data.jobs.slice(0, 8).map(j => (
                          <tr key={j.id} className="hover:bg-slate-50 transition-all cursor-pointer">
                            <td className="px-6 py-3.5 font-bold text-slate-700">{j.customer_name}</td>
                            <td className="px-6 py-3.5 text-slate-500 font-bold text-[10px]">{data.staff.find(s => s.id === j.staff_id)?.name || 'Atanmadı'}</td>
                            <td className="px-6 py-3.5 text-right"><span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${statusColors[j.status] || 'bg-slate-50'}`}>{j.status}</span></td>
                          </tr>
                        )) : <tr><td colSpan="3" className="p-10 text-center text-slate-300 italic font-bold uppercase tracking-widest">Kayıtlı Akış Yok</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-between shadow-2xl shadow-blue-900/10">
                  <div><h4 className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1">Ciro ve Kasa</h4><div className="text-2xl font-black tracking-tight">{data.stats[3].value}</div></div>
                  <div className="space-y-3 mt-6">
                    <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5"><div className="text-[10px] font-bold text-green-400">GELİR: ₺{data.finSummary.income}</div><div className="text-[10px] font-bold text-red-400">GİDER: ₺{data.finSummary.expense}</div></div>
                    <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest text-center mt-2">D1 Veritabanı Anlık Verisidir</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* İŞ EMİRLERİ */}
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
                <div className="flex gap-2">
                  <button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2"><Plus size={14} /> İş Ata</button>
                  <button onClick={() => { setJobForm({...jobForm, jobType: 'Planlı'}); setShowJobModal(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2"><Calendar size={14} /> Planla</button>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr><th className="px-8 py-4">Bina / Müşteri</th><th className="px-8 py-4">İş Türü</th><th className="px-8 py-4">Tarih</th><th className="px-8 py-4 text-right">Durum</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.jobs.filter(j => {
                      if(jobFilter === 'past') return j.status === 'Tamamlandı';
                      if(jobFilter === 'current') return j.status !== 'Tamamlandı' && !j.scheduled_date;
                      return j.scheduled_date;
                    }).map(j => (
                      <tr key={j.id} className="hover:bg-slate-50 transition-all font-bold">
                        <td className="px-8 py-3.5">{j.customer_name}</td>
                        <td className="px-8 py-3.5 text-slate-400 uppercase text-[9px] tracking-wider">{j.job_type}</td>
                        <td className="px-8 py-3.5 text-slate-400 text-[10px]">{j.scheduled_date || new Date(j.created_at).toLocaleDateString()}</td>
                        <td className="px-8 py-3.5 text-right"><span className={`px-2 py-0.5 rounded-md text-[8px] uppercase font-black ${statusColors[j.status] || 'bg-slate-50'}`}>{j.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SAHA EKİBİ */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-xs font-black uppercase tracking-tight">Ekip & Branş Takibi</h3><button onClick={() => setShowStaffModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2"><Plus size={14} /> Yeni Kayıt</button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.staff.map(s => (
                  <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg">{s.name.charAt(0)}</div>
                      <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${s.status === 'Aktif' ? 'bg-green-500' : s.status === 'Sahada' ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                    </div>
                    <div className="font-black text-slate-800">{s.name}</div>
                    <div className="text-[8px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">{s.branch || s.role} • {s.status}</div>
                    <div className="flex gap-1.5 w-full">
                       <button onClick={() => setShowStaffDetail(s)} className="flex-1 bg-slate-100 py-1.5 rounded-lg text-[9px] font-black text-slate-600">DOSYA</button>
                       <button onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} className="flex-1 bg-blue-600 py-1.5 rounded-lg text-[9px] font-black text-white shadow-md shadow-blue-500/10">MESAJ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MÜŞTERİLER - YENİ */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-xs font-black uppercase tracking-tight">Müşteri Rehberi</h3><button onClick={() => setShowCustomerModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black"><Plus size={14} className="inline mr-1" /> Müşteri Ekle</button></div>
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase">
                     <tr><th className="px-8 py-3.5">İsim / Kurum</th><th className="px-8 py-3.5">İletişim</th><th className="px-8 py-3.5">Adres</th><th className="px-8 py-3.5 text-right">Vergi Bilgi</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 font-bold">
                     {data.customers?.length > 0 ? data.customers.map(c => (
                       <tr key={c.id} className="hover:bg-slate-50 transition-all text-slate-600">
                         <td className="px-8 py-3.5 text-slate-900">{c.name}</td>
                         <td className="px-8 py-3.5">{c.contact}</td>
                         <td className="px-8 py-3.5 text-[10px] max-w-xs truncate">{c.address}</td>
                         <td className="px-8 py-3.5 text-right text-[10px]">{c.tax_info || '-'}</td>
                       </tr>
                     )) : <tr><td colSpan="4" className="p-10 text-center text-slate-300 font-bold">Müşteri Kaydı Yok</td></tr>}
                   </tbody>
                 </table>
              </div>
            </div>
          )}

          {/* STOK TAKİBİ */}
          {activeTab === 'stock' && (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-5 border-b flex justify-between items-center font-black"><h3>Envanter & Tedarik</h3><button onClick={() => setShowStockModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px]"><Plus size={14} className="inline mr-1" /> Parça Girişi</button></div>
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase">
                    <tr><th className="px-8 py-3.5">Parça</th><th className="px-8 py-3.5">Miktar / Fiyat</th><th className="px-8 py-3.5">Tedarikçi</th><th className="px-8 py-3.5 text-right">Durum</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 font-bold">
                    {data.stock.length > 0 ? data.stock.map(item => (
                      <tr key={item.id}>
                        <td className="px-8 py-3.5">{item.item_name}</td>
                        <td className="px-8 py-3.5">{item.quantity} {item.unit_name} / ₺{item.unit_price || '0'}</td>
                        <td className="px-8 py-3.5 text-slate-400 text-[10px]">{item.supplier_name || '-'}</td>
                        <td className="px-8 py-3.5 text-right"><span className="text-green-600 text-[8px] font-black uppercase bg-green-50 px-2 py-0.5 rounded">Stokta</span></td>
                      </tr>
                    )) : <tr><td colSpan="4" className="p-10 text-center text-slate-300 font-bold uppercase">Stok Verisi Yok</td></tr>}
                 </tbody>
               </table>
            </div>
          )}

          {/* FİNANS */}
          {activeTab === 'finance' && (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden font-bold">
               <div className="p-5 border-b uppercase font-black"><h3>Anlık Finansal Takip</h3></div>
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                   <tr><th className="px-8 py-3.5">Açıklama</th><th className="px-8 py-3.5">Miktar</th><th className="px-8 py-3.5 text-right">Tür</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {data.finances.length > 0 ? data.finances.map(f => (
                     <tr key={f.id}>
                       <td className="px-8 py-3.5 text-slate-500">{f.description}</td>
                       <td className={`px-8 py-3.5 ${f.type === 'Gelir' ? 'text-green-600' : 'text-red-600'}`}>₺{f.amount}</td>
                       <td className="px-8 py-3.5 text-right"><span className="text-[8px] uppercase font-black bg-slate-50 px-2 py-0.5 rounded">{f.type}</span></td>
                     </tr>
                   )) : <tr><td colSpan="3" className="p-10 text-center text-slate-300 font-bold uppercase tracking-widest">Finansal Veri Yok</td></tr>}
                 </tbody>
               </table>
            </div>
          )}

          {/* VARLIKLAR */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2 font-black uppercase tracking-tight"><h3>Varlık Yönetimi</h3><button onClick={() => setShowAssetModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px]"><Plus size={14} className="inline mr-1" /> Yeni Varlık</button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.assets.length > 0 ? data.assets.map(a => (
                  <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-500 transition-all">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all"><Box size={16} /></div>
                    <div className="font-black text-slate-800 text-[11px] mb-1">{a.name}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase mb-4"><MapPin size={10} className="inline mr-1" /> {a.location}</div>
                    <div className="text-[8px] text-slate-300 italic mb-3">{a.device_details || 'Detay girilmedi'}</div>
                    <button className="w-full bg-slate-50 py-1.5 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:bg-slate-900 hover:text-white transition-all">QR KART</button>
                  </div>
                )) : <div className="col-span-4 p-20 text-center border border-dashed border-slate-200 rounded-2xl text-slate-300 font-black tracking-widest uppercase">Varlık Verisi Yok</div>}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CHAT - FACEBOOK STYLE */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="w-72 lg:w-80 h-[450px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 bg-blue-600 text-white flex items-center justify-between font-black text-[11px]"><div className="flex items-center gap-3">{activeChatId ? data.staff.find(s => s.id === activeChatId)?.name : 'Mesajlar'}</div><ChevronDown className="cursor-pointer" onClick={() => setIsChatOpen(false)} /></div>
              {!activeChatId ? (
                <div className="flex-1 p-3 space-y-1.5 overflow-y-auto bg-slate-50">
                   {managers.map(m => <div key={m.id} onClick={() => setActiveChatId(m.id)} className="p-3 bg-white hover:bg-blue-50 rounded-xl cursor-pointer font-bold text-[10px] flex items-center gap-3 shadow-sm border border-slate-100"><div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white">{m.name.charAt(0)}</div>{m.name}</div>)}
                </div>
              ) : (
                <><div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
                    <button onClick={() => setActiveChatId(null)} className="text-[8px] font-black text-blue-600 uppercase mb-2">← Rehbere Dön</button>
                    {messages.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender_id === 'PATRON' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-2.5 rounded-2xl text-[10px] font-bold max-w-[85%] ${m.sender_id === 'PATRON' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-600 border border-slate-100 rounded-tl-none shadow-sm'}`}>{m.message}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 bg-white border-t flex gap-2"><input value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Yazın..." className="flex-1 bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-bold outline-none border-none" /><button onClick={sendMessage} className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20"><Send size={12} /></button></div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><MessageSquare size={20} /></button>
      </div>

      {/* MODALLAR */}
      
      {/* 1. İŞ EMİRLERİ MODALI */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6"><h2 className="text-base font-black uppercase tracking-tighter">Yeni İş Ataması</h2><button onClick={() => setShowJobModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><X size={18} /></button></div>
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-2 px-4 rounded-xl font-black text-[10px] border transition-all ${jobForm.jobType === 'Anlık' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400'}`}>ANLIK GÖREV</button>
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-2 px-4 rounded-xl font-black text-[10px] border transition-all ${jobForm.jobType === 'Planlı' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400'}`}>GELECEK PLANLA</button>
                </div>
                {jobForm.jobType === 'Planlı' && (
                  <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Planlanan Tarih</label><input type="date" className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} /></div>
                )}
                <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Müşteri / Bina / Şantiye</label><input list="asset-list" className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none border border-transparent focus:bg-white focus:border-blue-200 transition-all" placeholder="Rehberden seç veya yeni..." value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value})} /></div>
                <datalist id="asset-list">{data.assets.map(a => <option key={a.id} value={a.name}>{a.location}</option>)}</datalist>
                <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Sorumlu Yönetici</label><select className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none appearance-none" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}><option value="">Seçiniz...</option>{managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">İş Özeti / Notlar</label><textarea rows="3" className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none resize-none" placeholder="Ustanın sahada göreceği detaylar..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} /></div>
              </div>
              <button disabled={isSaving} onClick={() => handleAction('add-job', { ...jobForm, details: { note: jobForm.taskNote } }, setShowJobModal, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs shadow-xl mt-6 flex items-center justify-center gap-2">
                 {isSaving ? <Loader2 className="animate-spin" /> : <>ONAYLA VE GÖNDER <ArrowRight size={14}/></>}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. VARLIK MODALI */}
      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 uppercase font-black tracking-tighter"><h2>Varlık & Cihaz Kaydı</h2><button onClick={() => setShowAssetModal(false)}><X size={20} /></button></div>
              <div className="space-y-4">
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold" placeholder="Cihaz Adı (Örn: Asansör #1)" onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold" placeholder="Apartman / Bina Adı" onChange={e => setAssetForm({...assetForm, apartmentName: e.target.value})} />
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold" placeholder="Konum (Kat/Daire vb.)" onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                <textarea rows="3" className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none" placeholder="Teknik Bilgiler (Marka, Model, Seri No)" onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
                <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs shadow-lg" onClick={() => handleAction('add-asset', assetForm, setShowAssetModal, () => setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '' }))}>VARLIĞI KAYDET</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. PERSONEL MODALI */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 uppercase font-black tracking-tighter"><h2>Saha Ekibi Kaydı</h2><button onClick={() => setShowStaffModal(false)}><X size={20} /></button></div>
              <div className="space-y-4">
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold" placeholder="Ad Soyad" onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold" placeholder="Telefon" onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold" placeholder="Branş (Örn: Mekanik, Elektrik)" onChange={e => setStaffForm({...staffForm, branch: e.target.value})} />
                <select className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold appearance-none outline-none" onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                  <option value="Usta">Usta</option>
                  <option value="Yönetici">Yönetici</option>
                </select>
                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs shadow-xl" onClick={() => handleAction('add-staff', staffForm, setShowStaffModal, () => setStaffForm({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' }))}>PERSONELİ KAYDET</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MÜŞTERİ MODALI */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6 uppercase font-black tracking-tighter"><h2>Müşteri / Kurum Kaydı</h2><button onClick={() => setShowCustomerModal(false)}><X size={20} /></button></div>
              <div className="space-y-4">
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold" placeholder="Müşteri İsim / Firma Adı" onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold" placeholder="Telefon / E-posta" onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold" placeholder="Açık Adres" onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                <input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold" placeholder="Vergi No / T.C. (Opsiyonel)" onChange={e => setCustomerForm({...customerForm, taxInfo: e.target.value})} />
                <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs" onClick={() => handleAction('add-customer', customerForm, setShowCustomerModal, () => setCustomerForm({ name: '', contact: '', address: '', taxInfo: '' }))}>REHBERE EKLE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. PARÇA / STOK GİRİŞ MODALI */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6 uppercase font-black tracking-tighter"><h2>Stok & Parça Girişi</h2><button onClick={() => setShowStockModal(false)}><X size={20} /></button></div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="col-span-2 space-y-2"><label className="text-[9px] font-black opacity-40 ml-1">Parça Adı</label><input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none" placeholder="Örn: Kapı Motoru" onChange={e => setStockForm({...stockForm, itemName: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[9px] font-black opacity-40 ml-1">Miktar</label><input type="number" className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none" onChange={e => setStockForm({...stockForm, quantity: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[9px] font-black opacity-40 ml-1">Birim</label><select className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none" onChange={e => setStockForm({...stockForm, unitName: e.target.value})}><option value="Adet">Adet</option><option value="Metre">Metre</option><option value="Paket">Paket</option></select></div>
                <div className="space-y-2"><label className="text-[9px] font-black opacity-40 ml-1">Birim Alış Fiyatı (₺)</label><input type="number" className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none" onChange={e => setStockForm({...stockForm, unitPrice: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[9px] font-black opacity-40 ml-1">Tedarikçi Adı</label><input className="w-full px-5 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none" onChange={e => setStockForm({...stockForm, supplierName: e.target.value})} /></div>
              </div>
              <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs" onClick={() => handleAction('add-stock', stockForm, setShowStockModal, () => setStockForm({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '', supplierPhone: '' }))}>STOK KAYDET</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. PERSONEL DETAY MODALI */}
      <AnimatePresence>
        {showStaffDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black uppercase tracking-tight">Personel Dosyası: {showStaffDetail.name}</h2><button onClick={() => setShowStaffDetail(null)} className="p-2 bg-slate-50 rounded-xl"><X size={20} /></button></div>
              <div className="grid grid-cols-3 gap-4 mb-8">
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><div className="text-[8px] font-black opacity-40 uppercase">Branş</div><div className="text-xs font-black">{showStaffDetail.branch || 'Genel'}</div></div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><div className="text-[8px] font-black opacity-40 uppercase">Durum</div><div className="text-xs font-black text-green-500">{showStaffDetail.status}</div></div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><div className="text-[8px] font-black opacity-40 uppercase">Telefon</div><div className="text-xs font-black">{showStaffDetail.phone}</div></div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Görev Geçmişi & Planları</h4>
                 {data.jobs.filter(j => j.staff_id === showStaffDetail.id).length > 0 ? data.jobs.filter(j => j.staff_id === showStaffDetail.id).map(j => (
                   <div key={j.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all">
                      <div><div className="font-bold text-slate-800">{j.customer_name}</div><div className="text-[9px] text-slate-400">{j.scheduled_date || new Date(j.created_at).toLocaleDateString()}</div></div>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${statusColors[j.status] || 'bg-slate-100'}`}>{j.status}</span>
                   </div>
                 )) : <div className="text-center p-10 italic text-slate-300">Bu personelin henüz bir iş kaydı yok.</div>}
              </div>
              <div className="pt-6 border-t mt-4 flex gap-2">
                 <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase">Branş/Bilgi Düzenle</button>
                 <button className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-black text-[10px] uppercase">Pasife Al</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}