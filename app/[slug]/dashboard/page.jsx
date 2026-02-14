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
  
  // -- UI States --
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState('current');

  // -- Modal States --
  const [modals, setModals] = useState({ job: false, asset: false, staff: false, customer: false, stock: false, staffDetail: null });
  const [isSaving, setIsSaving] = useState(false);

  // -- Chat --
  const [chat, setChat] = useState({ isOpen: false, activeId: null, messages: [], input: '' });
  const chatEndRef = useRef(null);

  // -- Forms --
  const [jobForm, setJobForm] = useState({ customerName: '', assetId: '', staffId: '', workType: 'Genel Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' });
  const [assetForm, setAssetForm] = useState({ name: '', location: '', apartmentName: '', deviceDetails: '' });
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'Usta', branch: '' });
  const [customerForm, setCustomerForm] = useState({ name: '', contact: '', address: '', taxInfo: '' });
  const [stockForm, setStockForm] = useState({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '', supplierPhone: '' });

  // -- Keyboard Listeners --
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setModals({ job: false, asset: false, staff: false, customer: false, stock: false, staffDetail: null }); };
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
    if (!chat.activeId) return;
    try {
      const res = await fetch(`${API_URL}/get-messages?slug=${slug}&staffId=${chat.activeId}`);
      const msgs = await res.json();
      setChat(prev => ({ ...prev, messages: msgs }));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); const int = setInterval(fetchData, 15000); return () => clearInterval(int); }, [slug]);
  useEffect(() => { if (chat.isOpen && chat.activeId) { fetchMessages(); const cInt = setInterval(fetchMessages, 4000); return () => clearInterval(cInt); } }, [chat.isOpen, chat.activeId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat.messages]);

  const handleAction = async (endpoint, body, resetFn, modalKey) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...body, slug }) 
      });
      if (res.ok) { setModals(prev => ({ ...prev, [modalKey]: false })); resetFn(); fetchData(); }
    } catch (err) { alert("Hata oluştu."); } finally { setIsSaving(false); }
  };

  const sendMessage = async () => {
    if (!chat.input.trim() || !chat.activeId) return;
    await fetch(`${API_URL}/send-message`, { method: 'POST', body: JSON.stringify({ slug, senderId: 'PATRON', receiverId: chat.activeId, message: chat.input }) });
    setChat(prev => ({ ...prev, input: '' })); fetchMessages();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  const managers = data?.staff?.filter(s => s.role === 'Yönetici') || [];
  const statusColors = { 'Beklemede': 'bg-amber-50 text-amber-600', 'Tamamlandı': 'bg-green-50 text-green-600', 'Devam Ediyor': 'bg-blue-50 text-blue-600', 'Gelecek': 'bg-slate-100 text-slate-500' };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 text-[13px] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-60 bg-slate-900 text-slate-400 flex-col sticky top-0 h-screen z-50 shadow-2xl shadow-black">
        <div className="p-6 flex items-center gap-3 border-b border-white/5 bg-slate-900/50">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white"><ShieldCheck size={18} /></div>
          <span className="font-black text-base text-white tracking-tighter uppercase">İş Dökümü</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {[
            { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'jobs', label: 'İş Akışı', icon: ClipboardList },
            { id: 'team', label: 'Saha Ekibi', icon: Users },
            { id: 'customers', label: 'Müşteriler', icon: UserPlus },
            { id: 'assets', label: 'Varlıklar', icon: Box },
            { id: 'stock', label: 'Stok Depo', icon: Package },
            { id: 'finance', label: 'Kasa/Finans', icon: CreditCard },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5"><button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={16} /> Çıkış</button></div>
      </aside>

      {/* ANA PANEL */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2"><Menu size={20} /></button>
            <h1 className="font-black text-slate-800 uppercase text-xs tracking-widest">{data?.name} <span className="text-blue-600 font-bold ml-1">• Patron</span></h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <input placeholder="Hızlı bul..." className="bg-transparent outline-none text-xs font-bold w-32" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Bell size={20} className="text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'home' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {data?.stats?.map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><TrendingUp size={22} /></div>
                    <div><div className="text-lg font-black leading-none mb-1">{s.value}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</div></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[450px]">
                  <div className="p-6 border-b flex justify-between items-center"><h3 className="font-black text-xs uppercase tracking-tight">Anlık İş Akışı</h3><button onClick={() => setModals(m => ({ ...m, job: true }))} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/20"><Plus size={14} /> Yeni İş</button></div>
                  <div className="overflow-y-auto">
                    <table className="w-full text-left font-bold">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                        <tr><th className="px-8 py-4">Bina / Müşteri</th><th className="px-8 py-4">Sorumlu</th><th className="px-8 py-4 text-right">Durum</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data?.jobs?.length > 0 ? data.jobs.slice(0, 10).map(j => (
                          <tr key={j.id} className="hover:bg-slate-50 transition-all cursor-pointer">
                            <td className="px-8 py-4 text-slate-700">{j.customer_name}</td>
                            <td className="px-8 py-4 text-slate-400 text-xs font-bold">{data.staff.find(s => s.id === j.staff_id)?.name || '-'}</td>
                            <td className="px-8 py-4 text-right"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${statusColors[j.status] || 'bg-slate-50'}`}>{j.status}</span></td>
                          </tr>
                        )) : <tr><td colSpan="3" className="p-10 text-center text-slate-300 font-black uppercase tracking-widest">Henüz Kayıt Yok</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl shadow-blue-900/10">
                  <div><h4 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-2">Net Kasa Durumu</h4><div className="text-4xl font-black tracking-tight">{data?.stats?.[3]?.value || '₺0'}</div></div>
                  <div className="space-y-4 mt-8">
                    <div className="bg-white/5 p-5 rounded-2xl flex items-center justify-between border border-white/5"><div className="text-xs font-bold text-green-400 tracking-wide uppercase">Gelir: ₺{data?.finSummary?.income.toLocaleString('tr-TR') || 0}</div><div className="text-xs font-bold text-red-400 tracking-wide uppercase">Gider: ₺{data?.finSummary?.expense.toLocaleString('tr-TR') || 0}</div></div>
                    <div className="text-[9px] font-bold text-white/10 text-center uppercase tracking-widest">Veriler Anlık SQL Senkronizasyonudur</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: İŞ EMİRLERİ (Filtreli) */}
          {activeTab === 'jobs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                  {['past', 'current', 'future'].map(f => (
                    <button key={f} onClick={() => setJobFilter(f)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${jobFilter === f ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}>
                      {f === 'past' ? 'Geçmiş' : f === 'current' ? 'Mevcut' : 'Planlanan'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setJobForm({...jobForm, jobType: 'Planlı'}); setModals(m => ({ ...m, job: true })); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xl"><Calendar size={16} /> Planlama Yap</button>
                  <button onClick={() => { setJobForm({...jobForm, jobType: 'Anlık'}); setModals(m => ({ ...m, job: true })); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xl shadow-blue-500/20"><Plus size={16} /> İş Ata</button>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left font-bold">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr><th className="px-10 py-5">Bina / Müşteri</th><th className="px-10 py-5">Tür</th><th className="px-10 py-5">Tarih</th><th className="px-10 py-5 text-right">Durum</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.jobs?.filter(j => {
                      if(jobFilter === 'past') return j.status === 'Tamamlandı';
                      if(jobFilter === 'current') return j.status !== 'Tamamlandı' && j.status !== 'Gelecek';
                      return j.status === 'Gelecek';
                    }).map(j => (
                      <tr key={j.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-10 py-4 text-slate-800">{j.customer_name}</td>
                        <td className="px-10 py-4 text-slate-400 uppercase text-[9px] tracking-widest">{j.job_type}</td>
                        <td className="px-10 py-4 text-slate-400 text-xs">{j.scheduled_date || new Date(j.created_at).toLocaleDateString('tr-TR')}</td>
                        <td className="px-10 py-4 text-right"><span className={`px-3 py-1 rounded-lg text-[9px] uppercase font-black ${statusColors[j.status] || 'bg-slate-50'}`}>{j.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB: SAHA EKİBİ (Branş ve Dosya) */}
          {activeTab === 'team' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center font-black uppercase text-xs tracking-tight"><h3>Saha Operasyon Ekibi</h3><button onClick={() => setModals(m => ({ ...m, staff: true }))} className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-slate-900/20"><Plus size={16} /> Personel Ekle</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-bold">
                {data?.staff?.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-blue-500 transition-all">
                    <div className="relative mb-4">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-black uppercase group-hover:scale-110 transition-transform">{s.name.charAt(0)}</div>
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${s.status === 'Aktif' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                    </div>
                    <div className="text-sm font-black text-slate-800">{s.name}</div>
                    <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1 mb-6">{s.branch || s.role}</div>
                    <div className="flex gap-2 w-full">
                       <button onClick={() => setModals(m => ({ ...m, staffDetail: s }))} className="flex-1 bg-slate-50 py-2.5 rounded-xl text-[9px] font-black hover:bg-slate-900 hover:text-white transition-all">İŞ DOSYASI</button>
                       <button onClick={() => setChat({ ...chat, isOpen: true, activeId: s.id })} className="flex-1 bg-blue-600 py-2.5 rounded-xl text-[9px] font-black text-white shadow-lg shadow-blue-500/10">MESAJ GÖNDER</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: STOK (Tedarikçi No ile) */}
          {activeTab === 'stock' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-bold">
               <div className="p-6 border-b flex justify-between items-center font-black text-xs uppercase tracking-tight"><h3>Envanter & Parça Deposu</h3><button onClick={() => setModals(m => ({ ...m, stock: true }))} className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl"><Package size={16} /> Parça Girişi Yap</button></div>
               <table className="w-full text-left font-bold">
                 <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr><th className="px-10 py-5">Parça Adı</th><th className="px-10 py-5">Miktar / Fiyat</th><th className="px-10 py-5">Tedarikçi & İletişim</th><th className="px-10 py-5 text-right">Durum</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {data?.stock?.length > 0 ? data.stock.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-4 text-slate-800">{item.item_name}</td>
                        <td className="px-10 py-4 text-slate-500 text-xs">{(item.quantity || 0)} {item.unit_name} • ₺{(item.unit_price || 0).toLocaleString('tr-TR')}</td>
                        <td className="px-10 py-4 text-xs">
                          <div className="text-slate-800">{item.supplier_name || 'Genel'}</div>
                          <div className="text-[10px] text-slate-400 italic">{item.supplier_phone || '-'}</div>
                        </td>
                        <td className="px-10 py-4 text-right font-black text-green-600 text-[10px] uppercase">Stokta Mevcut</td>
                      </tr>
                    )) : <tr><td colSpan="4" className="p-16 text-center text-slate-300 font-black uppercase tracking-widest italic">Veritabanında Stok Verisi Bulunamadı</td></tr>}
                 </tbody>
               </table>
            </motion.div>
          )}

          {/* TAB: MÜŞTERİLER */}
          {activeTab === 'customers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center uppercase font-black text-xs tracking-tight"><h3>Müşteri Rehberi</h3><button onClick={() => setModals(m => ({ ...m, customer: true }))} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-500/20 font-black"><Plus size={16} /> Müşteri Kaydet</button></div>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-bold">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                     <tr><th className="px-10 py-5">İsim / Kurum</th><th className="px-10 py-5">İletişim Detay</th><th className="px-10 py-5">Açık Adres</th><th className="px-10 py-5 text-right">Vergi/Kimlik</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 font-bold">
                     {data.customers?.length > 0 ? data.customers.map(c => (
                       <tr key={c.id} className="hover:bg-slate-50 transition-all">
                         <td className="px-10 py-4 text-slate-900 font-black">{c.name}</td>
                         <td className="px-10 py-4 text-slate-500 text-xs">{c.contact}</td>
                         <td className="px-10 py-4 text-[11px] max-w-sm text-slate-400">{c.address}</td>
                         <td className="px-10 py-4 text-right text-[10px] font-black uppercase tracking-widest">{c.tax_info || 'Girilmedi'}</td>
                       </tr>
                     )) : <tr><td colSpan="4" className="p-16 text-center text-slate-200 uppercase font-black tracking-widest">Kayıtlı Müşteri Yok</td></tr>}
                   </tbody>
                 </table>
              </div>
            </motion.div>
          )}

          {/* TAB: VARLIKLAR (Detaylı) */}
          {activeTab === 'assets' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center font-black uppercase tracking-tight text-xs"><h3>Kayıtlı Varlıklar & Envanter</h3><button onClick={() => setModals(m => ({ ...m, asset: true }))} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl"><Plus size={16} /> Varlık Kaydet</button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.assets.length > 0 ? data.assets.map(a => (
                  <div key={a.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-blue-500 transition-all font-bold">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all"><Box size={20} /></div>
                    <div className="font-black text-slate-800 text-sm mb-1">{a.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-4"><MapPin size={12} /> {a.location}</div>
                    <div className="text-[10px] text-slate-300 italic mb-5 leading-relaxed">{a.device_details || 'Teknik detay girilmemiş'}</div>
                    <button className="w-full bg-slate-50 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all">QR KARTI YAZDIR</button>
                  </div>
                )) : <div className="col-span-4 p-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300 font-black tracking-[0.2em] uppercase italic">Varlık Verisi Bulunamadı</div>}
              </div>
            </motion.div>
          )}

          {/* TAB: FİNANS */}
          {activeTab === 'finance' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden font-bold">
               <div className="p-8 border-b border-slate-100 uppercase font-black text-xs tracking-tight"><h3>Anlık Hesap Hareketleri</h3></div>
               <table className="w-full text-left font-bold">
                 <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                   <tr><th className="px-10 py-5">Hareket Açıklaması</th><th className="px-10 py-5">Miktar</th><th className="px-10 py-5 text-right">İşlem Türü</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {data.finances.length > 0 ? data.finances.map(f => (
                     <tr key={f.id} className="hover:bg-slate-50 transition-all font-bold">
                       <td className="px-10 py-4 text-slate-600 text-xs">{f.description}</td>
                       <td className={`px-10 py-4 font-black ${f.type === 'Gelir' ? 'text-green-600' : 'text-red-600'}`}>₺{(f.amount || 0).toLocaleString('tr-TR')}</td>
                       <td className="px-10 py-4 text-right"><span className="text-[9px] uppercase font-black bg-slate-50 px-3 py-1 rounded-lg border">{f.type}</span></td>
                     </tr>
                   )) : <tr><td colSpan="3" className="p-16 text-center text-slate-200 font-black uppercase tracking-widest">Finansal Kayıt Yok</td></tr>}
                 </tbody>
               </table>
            </motion.div>
          )}
        </div>
      </main>

      {/* CHAT PANEL (Facebook Style) */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-5">
        <AnimatePresence>
          {chat.isOpen && (
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }} className="w-80 lg:w-96 h-[550px] bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-5 bg-blue-600 text-white flex items-center justify-between font-black text-xs uppercase shadow-xl"><div className="flex items-center gap-3">{chat.activeId ? data.staff.find(s => s.id === chat.activeId)?.name : 'Mesajlar'}</div><ChevronDown className="cursor-pointer" onClick={() => setChat({ ...chat, isOpen: false })} /></div>
              {!chat.activeId ? (
                <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-slate-50">
                   {managers.map(m => <div key={m.id} onClick={() => setChat({ ...chat, activeId: m.id })} className="p-4 bg-white hover:bg-blue-50 rounded-2xl cursor-pointer font-bold text-xs flex items-center gap-4 shadow-sm border border-slate-100 transition-all"><div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">{m.name.charAt(0)}</div>{m.name}</div>)}
                </div>
              ) : (
                <><div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/40 text-xs">
                    <button onClick={() => setChat({ ...chat, activeId: null })} className="text-[9px] font-black text-blue-600 uppercase mb-4 hover:underline">← Personel Listesi</button>
                    {chat.messages.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender_id === 'PATRON' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 rounded-2xl font-bold max-w-[85%] leading-relaxed ${m.sender_id === 'PATRON' ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'}`}>{m.message}</div>
                        <div className="text-[8px] font-black text-slate-300 mt-2 uppercase">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-5 bg-white border-t flex gap-3"><input value={chat.input} onChange={e => setChat({...chat, input: e.target.value})} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Cevap yazın..." className="flex-1 bg-slate-50 px-5 py-3.5 rounded-2xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-blue-100 transition-all" /><button onClick={sendMessage} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-90 transition-transform"><Send size={18} /></button></div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setChat({ ...chat, isOpen: !chat.isOpen })} className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] shadow-[0_20px_40px_rgba(37,99,235,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative border-4 border-white">
          {chat.isOpen ? <X size={30} /> : <MessageSquare size={30} />}
          {!chat.isOpen && <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-[#F8FAFC] flex items-center justify-center text-[10px] font-black">1</span>}
        </button>
      </div>

      {/* --- MODALLAR (Eksiksiz) --- */}
      
      {/* 1. İŞ EMİRLERİ */}
      <AnimatePresence>
        {modals.job && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black uppercase tracking-tighter">İş Emri Ataması Yap</h2><button onClick={() => setModals(m => ({...m, job: false}))} className="p-3 hover:bg-slate-50 rounded-2xl transition-all"><X size={22} /></button></div>
              <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar pb-4 font-bold">
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-3 px-5 rounded-2xl font-black text-xs border transition-all ${jobForm.jobType === 'Anlık' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400'}`}>ANLIK GÖREV</button>
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-3 px-5 rounded-2xl font-black text-xs border transition-all ${jobForm.jobType === 'Planlı' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400'}`}>TARİH PLANLA</button>
                </div>
                {jobForm.jobType === 'Planlı' && (
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Planlanan Uygulama Tarihi</label><input type="date" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-blue-200" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} /></div>
                )}
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Bina / Müşteri / Şantiye</label><input list="asset-list" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Rehberden bulun veya yeni isim yazın..." value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value})} /></div>
                <datalist id="asset-list">{data.assets.concat(data.customers).map((a,i) => <option key={i} value={a.name}>{a.location || a.address}</option>)}</datalist>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sorumlu Yönetici Atayın</label><select className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none appearance-none" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}><option value="">Lütfen Yönetici Seçiniz...</option>{managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Uygulama Notları / İş Özeti</label><textarea rows="4" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none resize-none" placeholder="Saha ekibinin göreceği görev detaylarını buraya ekleyin..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} /></div>
              </div>
              <button disabled={isSaving} onClick={() => handleAction('add-job', { ...jobForm, details: { note: jobForm.taskNote } }, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' }), 'job')} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-sm shadow-2xl mt-6 active:scale-[0.98] transition-all flex items-center justify-center gap-3 tracking-widest uppercase">
                 {isSaving ? <Loader2 className="animate-spin" /> : "GÖREVİ ONAYLA VE GÖNDER"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. VARLIK KAYDI (Gelişmiş) */}
      <AnimatePresence>
        {modals.asset && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative font-bold">
              <div className="flex justify-between items-center mb-8 uppercase font-black tracking-tighter"><h2>Varlık & Cihaz Kaydı</h2><button onClick={() => setModals(m => ({...m, asset: false}))}><X size={24} /></button></div>
              <div className="space-y-5">
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Varlık/Cihaz Adı" onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Apartman / Bina Adı (Opsiyonel)" onChange={e => setAssetForm({...assetForm, apartmentName: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Bulunduğu Konum (Örn: Kazan Dairesi)" onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                <textarea rows="3" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Teknik Detaylar (Marka, Seri No, Montaj Tarihi)" onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
                <button className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-xs shadow-xl mt-4" onClick={() => handleAction('add-asset', assetForm, () => setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '' }), 'asset')}>ENVANTERE KAYDET</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. PERSONEL KAYDI */}
      <AnimatePresence>
        {modals.staff && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl relative font-bold">
              <div className="flex justify-between items-center mb-8 uppercase font-black text-xs tracking-widest"><h2>Saha Personel Kaydı</h2><button onClick={() => setModals(m => ({...m, staff: false}))}><X size={24} /></button></div>
              <div className="space-y-4">
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Ad Soyad" onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Telefon Numarası" onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Branş (Örn: Elektrik)" onChange={e => setStaffForm({...staffForm, branch: e.target.value})} />
                <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold appearance-none outline-none" onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                  <option value="Usta">Saha Ustası</option>
                  <option value="Yönetici">Yönetici/Şef</option>
                </select>
                <button className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs shadow-xl mt-4 uppercase" onClick={() => handleAction('add-staff', staffForm, () => setStaffForm({ name: '', phone: '', role: 'Usta', branch: '' }), 'staff')}>PERSONELİ SİSTEME EKLE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MÜŞTERİ KAYDI */}
      <AnimatePresence>
        {modals.customer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative font-bold">
              <div className="flex justify-between items-center mb-8 uppercase font-black text-xs tracking-widest"><h2>Müşteri Rehberi Ekle</h2><button onClick={() => setModals(m => ({...m, customer: false}))}><X size={24} /></button></div>
              <div className="space-y-4">
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Firma Adı / Müşteri İsim" onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="İletişim (Tel/E-posta)" onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Açık Adres" onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Vergi No/Daire (Opsiyonel)" onChange={e => setCustomerForm({...customerForm, taxInfo: e.target.value})} />
                <button className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-xs shadow-xl mt-4 uppercase" onClick={() => handleAction('add-customer', customerForm, () => setCustomerForm({ name: '', contact: '', address: '', taxInfo: '' }), 'customer')}>REHBERE KAYDET</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. STOK GİRİŞİ (Supplier Phone Dahil) */}
      <AnimatePresence>
        {modals.stock && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative font-bold">
              <div className="flex justify-between items-center mb-8 uppercase font-black tracking-widest text-xs"><h2>Depo Malzeme Girişi</h2><button onClick={() => setModals(m => ({...m, stock: false}))}><X size={24} /></button></div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="col-span-2 space-y-2"><label className="text-[10px] font-black opacity-30 ml-2">Ürün/Parça İsmi</label><input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Örn: Kapı Motoru" onChange={e => setStockForm({...stockForm, itemName: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black opacity-30 ml-2">Miktar</label><input type="number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" onChange={e => setStockForm({...stockForm, quantity: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black opacity-30 ml-2">Birim</label><select className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" onChange={e => setStockForm({...stockForm, unitName: e.target.value})}><option value="Adet">Adet</option><option value="Metre">Metre</option><option value="Paket">Paket</option></select></div>
                <div className="space-y-2"><label className="text-[10px] font-black opacity-30 ml-2">Birim Maliyet (₺)</label><input type="number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" onChange={e => setStockForm({...stockForm, unitPrice: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black opacity-30 ml-2">Tedarikçi Adı</label><input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" onChange={e => setStockForm({...stockForm, supplierName: e.target.value})} /></div>
                <div className="col-span-2 space-y-2"><label className="text-[10px] font-black opacity-30 ml-2">Tedarikçi İletişim / Tel</label><input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="05xx..." onChange={e => setStockForm({...stockForm, supplierPhone: e.target.value})} /></div>
              </div>
              <button className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase" onClick={() => handleAction('add-stock', stockForm, () => setStockForm({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '', supplierPhone: '' }), 'stock')}>GİRİŞİ KAYDET</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. PERSONEL DOSYA VE PLANLAMA */}
      <AnimatePresence>
        {modals.staffDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] font-bold">
              <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black uppercase tracking-tight text-blue-600">Personel Kartı: {modals.staffDetail.name}</h2><button onClick={() => setModals(m => ({...m, staffDetail: null}))} className="p-2 bg-slate-50 rounded-xl"><X size={24} /></button></div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100"><div className="text-[9px] font-black opacity-30 uppercase tracking-widest">Branş/Uzmanlık</div><div className="text-sm uppercase font-black text-slate-700">{modals.staffDetail.branch || modals.staffDetail.role}</div></div>
                 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100"><div className="text-[9px] font-black opacity-30 uppercase tracking-widest">Çalışma Statüsü</div><div className="text-sm uppercase font-black text-green-500">{modals.staffDetail.status}</div></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2">
                 <h4 className="text-[10px] font-black uppercase opacity-40 mb-2 ml-1 tracking-widest">Görev Geçmişi & Planlar</h4>
                 {data.jobs.filter(j => j.staff_id === modals.staffDetail.id).length > 0 ? data.jobs.filter(j => j.staff_id === modals.staffDetail.id).map(j => (
                   <div key={j.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div><div className="text-sm text-slate-800">{j.customer_name}</div><div className="text-[10px] text-slate-400 font-medium">{j.scheduled_date || 'ACİL GÖREV'}</div></div>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${statusColors[j.status] || 'bg-slate-100'}`}>{j.status}</span>
                   </div>
                 )) : <div className="text-center p-12 text-slate-300 italic font-black text-xs uppercase tracking-widest">Henüz Kayıtlı Görev Yok</div>}
              </div>
              <div className="pt-6 border-t flex gap-3">
                 <button className="flex-1 bg-blue-50 text-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">VERİLERİ DÜZENLE</button>
                 <button className="flex-1 bg-red-50 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase shadow-sm">MESAiYi KAPAT / PASİF</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}