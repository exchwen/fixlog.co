'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ClipboardList, Settings, Bell, Search, Plus,
  Clock, CheckCircle2, Menu, X, LogOut, ShieldCheck, Loader2, ArrowRight,
  Box, Package, CreditCard, Send, MessageSquare, Phone, MapPin, TrendingUp, 
  ChevronDown, Wallet, Calendar, UserPlus, Home, UserCheck, HardHat, Info,
  Trash2, ArrowUpRight, Zap
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
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showStaffDetail, setShowStaffDetail] = useState(null);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editStaffForm, setEditStaffForm] = useState({ name: '', phone: '', role: '', branch: '', status: '' });
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

  // -- Keyboard Listeners (ESC to close) --
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
    } catch (err) { alert("İşlem sırasında hata oluştu."); } finally { setIsSaving(false); }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    await fetch(`${API_URL}/send-message`, { method: 'POST', body: JSON.stringify({ slug, senderId: 'PATRON', receiverId: activeChatId, message: messageInput }) });
    setMessageInput(''); fetchMessages();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="mb-4"
      >
        <ShieldCheck className="text-blue-500 w-12 h-12" />
      </motion.div>
      <div className="text-white font-black tracking-widest text-[10px] uppercase opacity-40">Sistem Yükleniyor</div>
    </div>
  );

  const managers = data?.staff?.filter(s => s?.role === 'Yönetici') || [];
  const statusColors = { 'Beklemede': 'bg-amber-500/10 text-amber-600 border border-amber-200/50', 'Tamamlandı': 'bg-emerald-500/10 text-emerald-600 border border-emerald-200/50', 'Devam Ediyor': 'bg-blue-500/10 text-blue-600 border border-blue-200/50', 'Gelecek': 'bg-slate-500/10 text-slate-500 border border-slate-200/50' };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 text-[13px] overflow-hidden relative">
      {/* Landing Page Style Background Effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 blur-[120px] rounded-full z-0"></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none z-0"></div>

      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-400 flex-col sticky top-0 h-screen z-50 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
        <div className="p-6 flex items-center gap-3 border-b border-white/5 relative bg-slate-900/50">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"><ShieldCheck size={20} /></div>
          <span className="font-black text-lg text-white tracking-tighter uppercase italic">İŞ DÖKÜMÜ</span>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 mt-4 relative z-10">
          {[
            { id: 'home', label: 'Genel Bakış', icon: LayoutDashboard },
            { id: 'jobs', label: 'İş Emirleri', icon: ClipboardList },
            { id: 'team', label: 'Saha Ekibi', icon: Users },
            { id: 'customers', label: 'Müşteriler', icon: UserPlus },
            { id: 'assets', label: 'Varlıklar', icon: Box },
            { id: 'stock', label: 'Stok Takibi', icon: Package },
            { id: 'finance', label: 'Finans', icon: CreditCard },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={18} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} /> 
              <span className="tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5 relative z-10">
          <button className="w-full flex items-center justify-center gap-3 px-4 py-3.5 text-red-400 font-black hover:bg-red-500/10 rounded-2xl transition-all border border-red-500/20">
            <LogOut size={16} /> ÇIKIŞ YAP
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu size={20} /></button>
            <div className="flex flex-col">
              <h1 className="font-black text-slate-900 uppercase text-base tracking-tighter flex items-center gap-2">
                {data?.name} <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
              </h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yönetim Paneli • Patron</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex bg-slate-100/50 px-4 py-2.5 rounded-2xl border border-slate-200/50 items-center gap-3 focus-within:ring-2 ring-blue-500/20 transition-all">
              <Search size={16} className="text-slate-400" />
              <input placeholder="Her şeyi ara..." className="bg-transparent outline-none text-[12px] font-bold w-48 text-slate-600" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl cursor-pointer transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg">P</div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* TAB: GENEL BAKIŞ (Modernized Landing Style) */}
          {activeTab === 'home' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Hoş Geldin, Şef! 👋</h2>
                  <p className="text-slate-500 font-medium text-sm">İşletmende bugün neler olup bittiğine bir göz at.</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center gap-2 font-black text-[11px] uppercase tracking-wider">
                     <Zap size={14} className="fill-emerald-600" /> Canlı Veri Akışı Aktif
                   </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {data?.stats?.map((s, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -5 }}
                    key={i} 
                    className="group relative bg-white rounded-[2.5rem] p-7 border border-slate-200/60 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-150 group-hover:opacity-[0.07] transition-all duration-700">
                      <TrendingUp size={80} />
                    </div>
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                        {i === 0 ? <ClipboardList size={22} /> : i === 1 ? <Users size={22} /> : i === 2 ? <Box size={22} /> : <Wallet size={22} />}
                      </div>
                      <div>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">{s?.value || '0'}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s?.label}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Real-time Job Flow */}
                <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200/60 shadow-xl overflow-hidden flex flex-col h-[500px]">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
                    <div>
                      <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 mb-1">Operasyonel İzleme</h3>
                      <h4 className="text-xl font-black text-slate-800 tracking-tighter">Anlık İş Akışı</h4>
                    </div>
                    <button onClick={() => setShowJobModal(true)} className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-[11px] font-black flex items-center gap-2 hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all active:scale-95">
                      <Plus size={16} /> YENİ GÖREV EKLE
                    </button>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky top-0 backdrop-blur-md z-10">
                        <tr><th className="px-8 py-5">Müşteri / Bina</th><th className="px-8 py-5">Sorumlu</th><th className="px-8 py-5 text-right">Durum</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {data?.jobs?.length > 0 ? data.jobs.slice(0, 10).map((j, idx) => (
                          <motion.tr 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={j.id} 
                            className="hover:bg-blue-50/30 transition-all cursor-pointer group"
                          >
                            <td className="px-8 py-5">
                              <div className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{j?.customer_name}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{j?.work_type || 'Genel Servis'}</div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500">
                                  {(data?.staff?.find(s => s.id === j.staff_id)?.name || 'A').charAt(0)}
                                </div>
                                <span className="text-slate-500 font-black text-[11px] uppercase tracking-tight">
                                  {data?.staff?.find(s => s.id === j.staff_id)?.name || 'Atanmadı'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm inline-block ${statusColors[j.status] || 'bg-slate-100 text-slate-400'}`}>
                                {j.status}
                              </span>
                            </td>
                          </motion.tr>
                        )) : (
                          <tr>
                            <td colSpan="3" className="p-24 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-10">
                                <ClipboardList size={60} />
                                <span className="font-black uppercase tracking-[0.5em] text-sm">Veri Bekleniyor</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Finance Card */}
                <div className="relative group rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/20">
                  <div className="absolute inset-0 bg-slate-900 z-0"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-blue-600/30 transition-all duration-700"></div>
                  
                  <div className="relative z-10 p-10 h-full flex flex-col justify-between text-white">
                    <div>
                      <div className="flex justify-between items-start mb-10">
                        <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
                          <Wallet size={24} className="text-blue-400" />
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Kasa Durumu</span>
                          <span className="text-xs font-bold opacity-40 italic">Anlık Güncelleme</span>
                        </div>
                      </div>
                      
                      <h4 className="text-[11px] font-black text-blue-200/50 uppercase tracking-[0.3em] mb-3">Net Bakiye</h4>
                      <div className="text-5xl font-black tracking-tighter mb-12 group-hover:scale-105 transition-transform origin-left duration-500">
                        {data?.stats?.[3]?.value || '₺0'}
                      </div>

                      <div className="space-y-4">
                        <div className="p-5 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/5 flex items-center justify-between group/row hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400"><ArrowUpRight size={16}/></div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-white/50">Gelir</span>
                          </div>
                          <span className="text-lg font-black text-emerald-400">₺{data?.finSummary?.income || 0}</span>
                        </div>
                        <div className="p-5 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/5 flex items-center justify-between group/row hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 rotate-90"><ArrowUpRight size={16}/></div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-white/50">Gider</span>
                          </div>
                          <span className="text-lg font-black text-rose-400">₺{data?.finSummary?.expense || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                      <Zap size={12} className="fill-white/20" /> Cloudflare D1 Secured
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: SAHA EKİBİ (Modernize Card Grid) */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Saha Operasyon Ekibi</h3>
                  <p className="text-slate-500 font-medium text-sm">Personel durumlarını ve uzmanlık dallarını yönetin.</p>
                </div>
                <button onClick={() => setShowStaffModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[11px] font-black flex items-center gap-3 shadow-2xl shadow-slate-900/20 hover:bg-blue-600 transition-all active:scale-95">
                  <UserPlus size={18} /> YENİ PERSONEL KAYDI
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data?.staff?.map((s, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -8, shadow: "0 20px 40px rgba(59,130,246,0.15)" }}
                    key={s.id} 
                    className="bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-xl flex flex-col items-center text-center group transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-5">
                      <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_15px] ${s.status === 'Aktif' ? 'bg-emerald-500 shadow-emerald-500' : s.status === 'Sahada' ? 'bg-blue-500 shadow-blue-500' : 'bg-slate-300 shadow-slate-300'}`}></div>
                    </div>
                    
                    <div className="relative mb-6 mt-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[2.2rem] flex items-center justify-center text-slate-400 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-all duration-500 shadow-inner">
                        <span className="font-black text-4xl uppercase">{s.name.charAt(0)}</span>
                      </div>
                    </div>

                    <div className="font-black text-slate-800 text-lg tracking-tighter mb-1 uppercase">{s.name}</div>
                    <div className="px-4 py-1.5 bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 transition-colors">
                      {s.branch || s.role}
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full pt-6 border-t border-slate-50">
                       <button 
                         onClick={() => { setShowStaffDetail(s); setEditStaffForm(s); setIsEditingStaff(false); }} 
                         className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black hover:shadow-xl transition-all active:scale-95"
                       >
                         <Info size={14} /> DOSYA
                       </button>
                       <button 
                         onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} 
                         className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-4 rounded-2xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                       >
                         <MessageSquare size={14} /> MESAJ
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MÜŞTERİLER, STOK, FİNANS, VARLIKLAR (Legacy structure but kept to avoid breaking changes) */}
          {/* ... (Existing Tab Logics) ... */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-sm font-black uppercase tracking-tight">Müşteri Rehberi</h3><button onClick={() => setShowCustomerModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-xl"><Plus size={16} /> Müşteri Ekle</button></div>
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden font-bold">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                     <tr><th className="px-8 py-4">İsim / Kurum</th><th className="px-8 py-4">İletişim</th><th className="px-8 py-4">Adres</th><th className="px-8 py-4 text-right">Vergi/TC</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {data.customers?.length > 0 ? data.customers.map(c => (
                       <tr key={c.id} className="hover:bg-slate-50 transition-all font-bold text-slate-700">
                         <td className="px-8 py-4 font-black">{c.name}</td>
                         <td className="px-8 py-4">{c.contact}</td>
                         <td className="px-8 py-4 text-[11px] text-slate-400 max-w-xs truncate">{c.address}</td>
                         <td className="px-8 py-4 text-right text-[10px] tracking-widest font-black uppercase">{c.tax_info || '-'}</td>
                       </tr>
                     )) : <tr><td colSpan="4" className="p-16 text-center text-slate-300 font-black uppercase tracking-[0.3em]">Rehber Boş</td></tr>}
                   </tbody>
                 </table>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden font-bold">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center font-black"><h3>Envanter & Parça Girişi</h3><button onClick={() => setShowStockModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2"><Plus size={16} /> Parça Girişi</button></div>
               <table className="w-full text-left font-bold">
                 <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                    <tr><th className="px-8 py-4">Parça Adı</th><th className="px-8 py-4">Birim / Fiyat</th><th className="px-8 py-4">Tedarikçi</th><th className="px-8 py-4 text-right">Durum</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {data.stock.length > 0 ? data.stock.map(item => (
                      <tr key={item.id} className="font-bold">
                        <td className="px-8 py-4 text-slate-800">{item.item_name}</td>
                        <td className="px-8 py-4 text-slate-500 font-bold">{item.quantity} {item.unit_name} / ₺{item.unit_price || '0'}</td>
                        <td className="px-8 py-4 text-slate-400 text-[11px] uppercase tracking-wide">
                          <div className="font-black text-slate-600">{item.supplier_name || 'Genel'}</div>
                          <div className="italic">{item.supplier_phone || '-'}</div>
                        </td>
                        <td className="px-8 py-4 text-right font-black text-green-600 text-[10px] uppercase bg-green-50/20 px-4">Stokta Mevcut</td>
                      </tr>
                    )) : <tr><td colSpan="4" className="p-16 text-center text-slate-300 font-black uppercase italic">Stok Kaydı Yok</td></tr>}
                 </tbody>
               </table>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden font-bold">
               <div className="p-6 border-b border-slate-100 font-black uppercase text-xs tracking-tight"><h3>Anlık Hesap Hareketleri</h3></div>
               <table className="w-full text-left font-bold">
                 <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                   <tr><th className="px-8 py-4">Açıklama</th><th className="px-8 py-4">Miktar</th><th className="px-8 py-4 text-right">Tip</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 font-bold">
                   {data.finances.length > 0 ? data.finances.map(f => (
                     <tr key={f.id} className="font-bold">
                       <td className="px-8 py-4 text-slate-600 text-[12px]">{f.description}</td>
                       <td className={`px-8 py-4 font-black ${f.type === 'Gelir' ? 'text-green-600' : 'text-red-600'}`}>₺{f.amount}</td>
                       <td className="px-8 py-4 text-right"><span className="text-[10px] uppercase font-black bg-slate-50 px-3 py-1 rounded-lg border">{f.type}</span></td>
                     </tr>
                   )) : <tr><td colSpan="3" className="p-16 text-center text-slate-300 font-black uppercase tracking-widest italic tracking-tight">Finansal Kayıt Yok</td></tr>}
                 </tbody>
               </table>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-4 font-bold">
              <div className="lg:col-span-4 flex justify-between items-center mb-2 font-black uppercase tracking-tight text-sm"><h3>Kayıtlı Varlıklar & QR</h3><button onClick={() => setShowAssetModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-xl"><Plus size={16} /> Varlık Kaydet</button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-bold">
                {data.assets.length > 0 ? data.assets.map(a => (
                  <div key={a.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-blue-500 transition-all font-bold">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all"><Box size={20} /></div>
                    <div className="font-black text-slate-800 text-[14px] mb-1">{a.name}</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-wide"><MapPin size={12} className="inline mr-1" /> {a.location}</div>
                    <div className="text-[10px] text-slate-300 italic mb-4 leading-relaxed">{a.device_details || 'Teknik detay girilmemiş'}</div>
                    <button className="w-full bg-slate-50 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all">QR Kod Yazdır</button>
                  </div>
                )) : <div className="col-span-4 p-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300 font-black tracking-widest uppercase italic">Envanter Verisi Yok</div>}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CHAT PANEL */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 font-bold">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="w-80 h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden shadow-slate-900/10">
              <div className="p-6 bg-blue-600 text-white flex items-center justify-between font-black text-xs uppercase italic tracking-widest">
                <div className="flex items-center gap-3">{activeChatId ? data.staff.find(s => s.id === activeChatId)?.name : 'MERKEZ MESAJLAR'}</div>
                <ChevronDown className="cursor-pointer" onClick={() => setIsChatOpen(false)} />
              </div>
              {!activeChatId ? (
                <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-slate-50/50">
                   {data?.staff?.map(m => <div key={m.id} onClick={() => setActiveChatId(m.id)} className="p-4 bg-white hover:bg-blue-50 rounded-2xl cursor-pointer font-black text-[11px] flex items-center gap-3 shadow-sm border border-slate-100 transition-all uppercase tracking-tight italic">
                     <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">{m.name.charAt(0)}</div>
                     {m.name}
                   </div>)}
                </div>
              ) : (
                <><div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/20 text-xs">
                    <button onClick={() => setActiveChatId(null)} className="text-[10px] font-black text-blue-600 uppercase mb-4 hover:underline tracking-widest italic">← LİSTEYE DÖN</button>
                    {messages.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender_id === 'PATRON' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 rounded-2xl font-bold max-w-[85%] leading-relaxed ${m.sender_id === 'PATRON' ? 'bg-slate-900 text-white rounded-tr-none shadow-lg shadow-slate-900/10' : 'bg-white text-slate-600 border border-slate-100 rounded-tl-none shadow-sm'}`}>{m.message}</div>
                        <div className="text-[8px] font-black text-slate-300 mt-2 uppercase tracking-widest">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-5 bg-white border-t flex gap-2">
                    <input value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Bir şeyler yazın..." className="flex-1 bg-slate-100/50 px-5 py-3.5 rounded-2xl text-[11px] font-bold outline-none border-none placeholder:text-slate-400" />
                    <button onClick={sendMessage} className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-90 transition-transform"><Send size={18} /></button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative border-4 border-white group">
          {isChatOpen ? <X size={28} /> : <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />}
          {!isChatOpen && <span className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black italic">1</span>}
        </button>
      </div>

      {/* MODALS */}
      {/* (All existing modals follow, but the key change is in Staff Detail Modal below) */}

      {/* 6. PERSONEL DETAY MODALI (Personeli Sil Eklendi) */}
      <AnimatePresence>
        {showStaffDetail && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] font-bold border border-white">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-1">Personel Dosyası</h2>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{showStaffDetail.name}</div>
                </div>
                <button onClick={() => setShowStaffDetail(null)} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"><X size={24} /></button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-10 font-bold">
                 <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-1">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Branş/Rol</div>
                   <div className="text-sm uppercase font-black text-slate-800">{showStaffDetail.branch || showStaffDetail.role}</div>
                 </div>
                 <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-1">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistem Durumu</div>
                   <div className="text-sm uppercase font-black text-blue-600">{showStaffDetail.status}</div>
                 </div>
                 <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-1">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hat Numarası</div>
                   <div className="text-sm uppercase font-black text-slate-800 tracking-tighter">{showStaffDetail.phone || 'Girilmedi'}</div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-8 pr-2 font-bold custom-scrollbar">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 ml-2 tracking-[0.3em] italic">Görev Geçmişi & Atanan İşler</h4>
                 {(data?.jobs || []).filter(j => j.staff_id === showStaffDetail.id).length > 0 ? (data?.jobs || []).filter(j => j.staff_id === showStaffDetail.id).map(j => (
                   <div key={j.id} className="p-5 border border-slate-100 rounded-3xl flex items-center justify-between hover:bg-slate-50 transition-all font-bold group">
                      <div>
                        <div className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors uppercase italic tracking-tight">{j.customer_name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{j.scheduled_date || 'ACİL SERVİS'}</div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-sm ${statusColors[j.status] || 'bg-slate-100 text-slate-400'}`}>{j.status}</span>
                   </div>
                 )) : <div className="text-center p-20 text-slate-300 italic font-black text-xs uppercase tracking-[0.5em] opacity-20 flex flex-col items-center gap-4"><ClipboardList size={40}/> Henüz Görev Yok</div>}
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
                 {!isEditingStaff ? (
                   <div className="flex gap-4 w-full">
                     <button 
                       onClick={() => setIsEditingStaff(true)}
                       className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-[2rem] font-black text-[11px] uppercase shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 tracking-widest"
                     >
                       <Settings size={18} /> PERSONELİ DÜZENLE
                     </button>
                     <button 
                        onClick={async () => {
                          if(confirm(`${showStaffDetail.name} isimli personel sistemden TAMAMEN SİLİNECEKTİR. Bu işlem geri alınamaz. Onaylıyor musunuz?`)) {
                            await handleAction('delete-staff', { id: showStaffDetail.id }, () => setShowStaffDetail(null), () => {});
                          }
                        }}
                        className="flex-1 bg-rose-50 text-rose-600 py-5 rounded-[2rem] font-black text-[11px] uppercase border border-rose-100 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-3 tracking-widest"
                     >
                       <Trash2 size={18} /> PERSONELİ SİL
                     </button>
                   </div>
                 ) : (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 bg-slate-50/50 p-8 rounded-[2.5rem] border border-blue-100 shadow-inner">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tam İsim</label>
                         <input className="w-full px-5 py-4 rounded-2xl border-none font-bold text-xs shadow-sm outline-none focus:ring-2 ring-blue-500/20" value={editStaffForm.name} onChange={(e) => setEditStaffForm({...editStaffForm, name: e.target.value})} />
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Telefon</label>
                         <input className="w-full px-5 py-4 rounded-2xl border-none font-bold text-xs shadow-sm outline-none focus:ring-2 ring-blue-500/20" value={editStaffForm.phone} onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})} />
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Branş</label>
                         <input className="w-full px-5 py-4 rounded-2xl border-none font-bold text-xs shadow-sm outline-none focus:ring-2 ring-blue-500/20" value={editStaffForm.branch} onChange={(e) => setEditStaffForm({...editStaffForm, branch: e.target.value})} />
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Statü</label>
                         <select className="w-full px-5 py-4 rounded-2xl border-none font-bold text-xs shadow-sm outline-none appearance-none bg-white focus:ring-2 ring-blue-500/20" value={editStaffForm.status} onChange={(e) => setEditStaffForm({...editStaffForm, status: e.target.value})}>
                            <option value="Aktif">Aktif</option>
                            <option value="Sahada">Sahada</option>
                            <option value="Mesai Dışı">Mesai Dışı</option>
                         </select>
                       </div>
                     </div>
                     <div className="flex gap-4 pt-4">
                       <button onClick={() => handleAction('add-staff', { ...editStaffForm, id: showStaffDetail.id }, () => setShowStaffDetail(null), () => setIsEditingStaff(false))} className="flex-1 bg-slate-900 text-white py-4.5 rounded-[1.5rem] font-black text-[11px] uppercase shadow-2xl tracking-[0.2em] hover:bg-blue-600 transition-colors">DEĞİŞİKLİKLERİ KAYDET</button>
                       <button onClick={() => setIsEditingStaff(false)} className="px-10 bg-slate-200 text-slate-600 py-4.5 rounded-[1.5rem] font-black text-[11px] uppercase transition-all hover:bg-slate-300 tracking-widest">İPTAL</button>
                     </div>
                   </motion.div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. İŞ EMİRLERİ MODALI */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 font-bold">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">İş Emri Ata</h2><button onClick={() => setShowJobModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"><X size={20} /></button></div>
              <div className="space-y-4 overflow-y-auto pr-1 font-bold">
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-3 px-5 rounded-xl font-black text-[10px] border transition-all ${jobForm.jobType === 'Anlık' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400'}`}>ANLIK GÖREV</button>
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-3 px-5 rounded-xl font-black text-[10px] border transition-all ${jobForm.jobType === 'Planlı' ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-100' : 'bg-slate-50 text-slate-400'}`}>TARİH PLANLA</button>
                </div>
                {jobForm.jobType === 'Planlı' && (
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Planlanan Uygulama Tarihi</label><input type="date" className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-[12px] font-bold outline-none border border-transparent focus:bg-white focus:border-blue-200" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} /></div>
                )}
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Müşteri / Bina / Varlık</label><input list="asset-list" className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-[12px] font-bold outline-none" placeholder="Rehberden bulun veya yeni isim yazın..." value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value})} /></div>
                <datalist id="asset-list">{(data?.assets || []).concat(data?.customers || []).map((a,i) => <option key={i} value={a.name}>{a.location || a.address}</option>)}</datalist>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Sorumlu Yönetici Atayın</label><select className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-[12px] font-bold outline-none appearance-none" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}><option value="">Yönetici Seçiniz...</option>{managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Yapılacak İş / Görev Özeti</label><textarea rows="4" className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-[12px] font-bold outline-none resize-none" placeholder="Ekibe iletilecek teknik talimatlar..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} /></div>
              </div>
              <button disabled={isSaving} onClick={() => handleAction('add-job', { ...jobForm, details: { note: jobForm.taskNote } }, setShowJobModal, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-[13px] shadow-2xl mt-6 active:scale-[0.98] transition-all flex items-center justify-center gap-3 tracking-widest">
                 {isSaving ? <Loader2 className="animate-spin" /> : <>GÖREVİ ONAYLA VE GÖNDER <ArrowRight size={18}/></>}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. VARLIK MODALI (Gelişmiş) */}
      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden font-bold">
              <div className="flex justify-between items-center mb-8 uppercase font-black tracking-tighter text-slate-800"><h2>Varlık & Cihaz Kaydı</h2><button onClick={() => setShowAssetModal(false)}><X size={24} /></button></div>
              <div className="space-y-5 font-bold">
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Varlık/Cihaz Adı" onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Apartman / Site Adı (Opsiyonel)" onChange={e => setAssetForm({...assetForm, apartmentName: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Cihaz Konumu (Kat, Blok vb.)" onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                <textarea rows="3" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Teknik Detaylar (Marka, Model, Seri No, Son Bakım)" onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
                <button className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-xs shadow-xl mt-4" onClick={() => handleAction('add-asset', assetForm, setShowAssetModal, () => setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '' }))}>ENVANTERE KAYDET</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. PERSONEL MODALI */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden font-bold">
              <div className="flex justify-between items-center mb-8 uppercase font-black text-xs tracking-widest text-slate-800"><h2>Yeni Personel Kaydı</h2><button onClick={() => setShowStaffModal(false)}><X size={24} /></button></div>
              <div className="space-y-4 font-bold">
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Ad Soyad" onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Telefon Numarası" onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Branş (Örn: Mekanik, Elektrik)" onChange={e => setStaffForm({...staffForm, branch: e.target.value})} />
                <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold appearance-none outline-none" onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                  <option value="Usta">Saha Ustası</option>
                  <option value="Yönetici">Yönetici / Şef</option>
                </select>
                <button className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs shadow-xl mt-4 uppercase tracking-widest" onClick={() => handleAction('add-staff', staffForm, setShowStaffModal, () => setStaffForm({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' }))}>PERSONELİ KAYDET</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MÜŞTERİ MODALI (Yeni) */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative font-bold">
              <div className="flex justify-between items-center mb-8 uppercase font-black text-xs tracking-widest text-slate-800"><h2>Yeni Müşteri Ekle</h2><button onClick={() => setShowCustomerModal(false)}><X size={24} /></button></div>
              <div className="space-y-4 font-bold">
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Firma Adı / Müşteri İsim" onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Telefon / E-posta" onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Açık Adres" onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                <input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="Vergi No/Kimlik (Opsiyonel)" onChange={e => setCustomerForm({...customerForm, taxInfo: e.target.value})} />
                <button className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-xs shadow-xl mt-4 uppercase tracking-widest" onClick={() => handleAction('add-customer', customerForm, setShowCustomerModal, () => setCustomerForm({ name: '', contact: '', address: '', taxInfo: '' }))}>REHBERE KAYDET</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. PARÇA / STOK GİRİŞ MODALI */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative font-bold">
              <div className="flex justify-between items-center mb-8 uppercase font-black tracking-widest text-xs text-slate-800"><h2>Depo & Malzeme Girişi</h2><button onClick={() => setShowStockModal(false)}><X size={24} /></button></div>
              <div className="grid grid-cols-2 gap-4 mb-8 font-bold">
                <div className="col-span-2 space-y-2"><label className="text-[10px] font-black opacity-30 ml-2 uppercase">Parça İsmi</label><input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Örn: Kapı Motoru" onChange={e => setStockForm({...stockForm, itemName: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black opacity-30 ml-2 uppercase">Miktar</label><input type="number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" onChange={e => setStockForm({...stockForm, quantity: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black opacity-30 ml-2 uppercase">Birim</label><select className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" onChange={e => setStockForm({...stockForm, unitName: e.target.value})}><option value="Adet">Adet</option><option value="Metre">Metre</option><option value="Paket">Paket</option></select></div>
                <div className="space-y-2"><label className="text-[10px] font-black opacity-30 ml-2 uppercase">Birim Alış (₺)</label><input type="number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Birim Fiyat" onChange={e => setStockForm({...stockForm, unitPrice: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black opacity-30 ml-2 uppercase">Tedarikçi Adı</label><input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="Firma Adı" onChange={e => setStockForm({...stockForm, supplierName: e.target.value})} /></div>
                <div className="col-span-2 space-y-2"><label className="text-[10px] font-black opacity-30 ml-2 uppercase">Tedarikçi İletişim / Tel</label><input className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none" placeholder="05xx..." onChange={e => setStockForm({...stockForm, supplierPhone: e.target.value})} /></div>
              </div>
              <button className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs shadow-xl uppercase tracking-widest" onClick={() => handleAction('add-stock', stockForm, setShowStockModal, () => setStockForm({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '', supplierPhone: '' }))}>STOK KAYDINI YAP</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}