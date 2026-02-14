'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ClipboardList, Settings, Bell, Search, Plus,
  Clock, CheckCircle2, Menu, X, LogOut, ShieldCheck, Loader2, ArrowRight,
  Box, Package, CreditCard, Send, MessageSquare, Phone, MapPin, TrendingUp, 
  ChevronDown, Wallet, Calendar, UserPlus, Home, UserCheck, HardHat, Info,
  Trash2, ArrowUpRight, Zap, Building2, Globe
} from 'lucide-react';

const API_URL = 'https://backend.isdokumu.workers.dev';

export default function Dashboard() {
  const { slug } = useParams();
  const router = useRouter();
  
  // -- UI States --
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // -- Modal & Edit States --
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showStaffDetail, setShowStaffDetail] = useState(null);
  const [isEditingStaff, setIsEditingStaff] = useState(false);

  // -- Chat States --
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef(null);

  // -- Form States (Initial Values) --
  const [jobForm, setJobForm] = useState({ customerName: '', staffId: '', workType: 'Genel Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' });
  const [assetForm, setAssetForm] = useState({ name: '', location: '', apartmentName: '', deviceDetails: '' });
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' });
  const [customerForm, setCustomerForm] = useState({ name: '', contact: '', address: '', taxInfo: '' });
  const [stockForm, setStockForm] = useState({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '', supplierPhone: '' });
  const [settingsForm, setSettingsForm] = useState({ companyName: '', ownerName: '', sector: '', address: '', taxInfo: '' });
  const [editStaffForm, setEditStaffForm] = useState({ name: '', phone: '', role: '', branch: '', status: '' });

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard-data?slug=${slug}`);
      if (!res.ok) throw new Error("Veri çekilemedi");
      const result = await res.json();
      setData(result);
      if (result) {
        setSettingsForm({
          companyName: result.name || '',
          ownerName: result.ownerName || '',
          sector: result.sector || '',
          address: result.address || '',
          taxInfo: result.taxInfo || ''
        });
      }
    } catch (err) { console.error("D1 Hatası:", err); } finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`${API_URL}/get-messages?slug=${slug}&staffId=${activeChatId}`);
      const msgs = await res.json();
      setMessages(msgs || []);
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
      if (res.ok) { 
        if(closeFn) closeFn(false); 
        if(resetFn) resetFn(); 
        await fetchData(); 
      } else { alert("İşlem başarısız oldu."); }
    } catch (err) { alert("Bağlantı hatası."); } finally { setIsSaving(false); }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    await fetch(`${API_URL}/send-message`, { method: 'POST', body: JSON.stringify({ slug, senderId: 'PATRON', receiverId: activeChatId, message: messageInput }) });
    setMessageInput(''); fetchMessages();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
        <ShieldCheck className="text-blue-500 w-10 h-10" />
      </motion.div>
      <div className="text-white font-black tracking-widest text-[9px] uppercase mt-4 opacity-40 italic">Sistem D1 Hattına Bağlanıyor...</div>
    </div>
  );

  const statusColors = { 'Beklemede': 'bg-amber-500/10 text-amber-600 border-amber-200/50', 'Tamamlandı': 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50', 'Devam Ediyor': 'bg-blue-500/10 text-blue-600 border-blue-200/50', 'Gelecek': 'bg-slate-100 text-slate-500 border-slate-200' };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 text-[12px] overflow-hidden relative selection:bg-blue-100 selection:text-blue-900">
      {/* Visual background layers */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full z-0"></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none"></div>

      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-56 bg-slate-900 text-slate-400 flex-col sticky top-0 h-screen z-50 border-r border-white/5 shadow-2xl">
        <div className="p-5 flex items-center gap-3 border-b border-white/5 bg-slate-900/50">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"><ShieldCheck size={18} /></div>
          <span className="font-black text-sm text-white tracking-tighter uppercase italic">İŞ DÖKÜMÜ</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-4 overflow-y-auto">
          {[
            { id: 'home', label: 'Genel Bakış', icon: LayoutDashboard },
            { id: 'jobs', label: 'İş Emirleri', icon: ClipboardList },
            { id: 'team', label: 'Saha Ekibi', icon: Users },
            { id: 'customers', label: 'Müşteriler', icon: UserPlus },
            { id: 'assets', label: 'Varlıklar', icon: Box },
            { id: 'stock', label: 'Stok Takibi', icon: Package },
            { id: 'finance', label: 'Finans', icon: CreditCard },
            { id: 'settings', label: 'Firma Ayarları', icon: Settings },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={16} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} /> 
              <span className="tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all border border-red-500/10 uppercase text-[10px] tracking-tighter">
            <LogOut size={14} /> SİSTEMDEN ÇIK
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        <header className="h-14 bg-white/70 backdrop-blur-md border-b border-slate-200/50 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu size={18} /></button>
            <div className="flex flex-col">
              <h1 className="font-black text-slate-900 uppercase text-xs tracking-tighter flex items-center gap-2 italic">
                {data?.name || 'YÜKLENİYOR...'} <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
              </h1>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">{data?.ownerName || 'YÖNETİCİ'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-all relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </div>
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-[9px] uppercase italic shadow-md">
              {data?.ownerName?.charAt(0) || 'P'}
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* TAB: GENEL BAKIŞ */}
          {activeTab === 'home' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Hoş Geldin, {data?.ownerName?.split(' ')[0] || 'Şef'}!</h2>
                  <p className="text-slate-500 font-bold text-[10px] uppercase opacity-50 tracking-tight italic leading-none">Bugünkü saha operasyon özeti aşağıdadır.</p>
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-100 flex items-center gap-2 font-black text-[8px] uppercase tracking-widest shadow-sm">
                  <Zap size={12} className="fill-emerald-600" /> D1 LIVE CONNECTION
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(data?.stats || [{},{},{},{}]).map((s, i) => (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} key={i} className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex items-center gap-4 group hover:border-blue-500 transition-all cursor-default">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner border border-slate-100">
                      {i === 0 ? <ClipboardList size={18} /> : i === 1 ? <Users size={18} /> : i === 2 ? <Box size={18} /> : <Wallet size={18} />}
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">{s?.value || '0'}</div>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{s?.label || 'VERİ YOK'}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[1.8rem] border border-slate-200/60 shadow-md overflow-hidden flex flex-col h-[380px]">
                  <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-white to-slate-50/30">
                    <h4 className="text-xs font-black text-slate-800 tracking-widest uppercase italic">Anlık Saha Akışı</h4>
                    <button onClick={() => setShowJobModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-2 hover:bg-blue-600 shadow-lg transition-all active:scale-95 italic uppercase">
                      <Plus size={14} /> YENİ İŞ ATA
                    </button>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest sticky top-0 backdrop-blur-md">
                        <tr><th className="px-6 py-3">Müşteri / Lokasyon</th><th className="px-6 py-3 text-right">Durum</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {data?.jobs?.length > 0 ? data.jobs.slice(0, 10).map((j) => (
                          <tr key={j.id} className="hover:bg-blue-50/20 transition-all group cursor-pointer">
                            <td className="px-6 py-3">
                              <div className="font-black text-slate-800 text-[11px] uppercase italic tracking-tight">{j?.customer_name}</div>
                              <div className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest italic opacity-60">{j?.work_type}</div>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-tighter shadow-sm border ${statusColors[j.status] || 'bg-slate-100 text-slate-400'}`}>
                                {j.status}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="2" className="p-20 text-center text-slate-300 font-black uppercase italic tracking-widest opacity-20 text-[9px]">Görüntülenecek İş Yok</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="relative group rounded-[2rem] overflow-hidden shadow-xl bg-slate-900 border border-white/5">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 blur-[50px] rounded-full -mr-16 -mt-16 transition-all duration-700 group-hover:bg-blue-600/20"></div>
                  <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white font-black italic">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-lg shadow-white/5"><Wallet size={18} className="text-blue-400" /></div>
                        <div className="text-right">
                          <span className="block text-[7px] font-black text-blue-400 uppercase tracking-widest mb-1">Hesap Hareketleri</span>
                          <span className="text-[9px] font-bold opacity-30 uppercase tracking-tighter italic">LIVE UPDATE</span>
                        </div>
                      </div>
                      <h4 className="text-[8px] font-black text-blue-200/50 uppercase tracking-[0.2em] mb-2 italic">Net Portföy Bakiyesi</h4>
                      <div className="text-3xl font-black tracking-tighter mb-8 group-hover:scale-105 transition-transform origin-left duration-500">
                        {data?.stats?.[3]?.value || '₺0.00'}
                      </div>
                      <div className="space-y-2">
                        <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all shadow-inner">
                          <div className="flex items-center gap-2">
                            <ArrowUpRight size={14} className="text-emerald-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Toplam Gelir</span>
                          </div>
                          <span className="text-sm font-black text-emerald-400 uppercase">₺{data?.finSummary?.income?.toLocaleString('tr-TR') || 0}</span>
                        </div>
                        <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all shadow-inner">
                          <div className="flex items-center gap-2">
                            <ArrowUpRight size={14} className="text-rose-400 rotate-90" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Toplam Gider</span>
                          </div>
                          <span className="text-sm font-black text-rose-400 uppercase">₺{data?.finSummary?.expense?.toLocaleString('tr-TR') || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: SAHA EKİBİ */}
          {activeTab === 'team' && (
            <div className="space-y-6 font-black uppercase italic tracking-tighter">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">Saha Operasyon Ekibi</h3>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest opacity-60 italic">Aktif Personeller ve Yetkinlikler</p>
                </div>
                <button onClick={() => setShowStaffModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[9px] font-black flex items-center gap-2 shadow-xl hover:bg-blue-600 transition-all active:scale-95 italic shadow-slate-900/10">
                  <UserPlus size={16} /> YENİ PERSONEL EKLE
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(data?.staff || []).map((s, i) => (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -5 }} key={s.id} className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-lg flex flex-col items-center text-center group transition-all relative overflow-hidden">
                    <div className="absolute top-4 right-4"><div className={`w-1.5 h-1.5 rounded-full ${s.status === 'Aktif' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div></div>
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 mb-4 shadow-inner border border-slate-100 font-black text-xl tracking-tighter italic">{s.name.charAt(0)}</div>
                    <div className="font-black text-slate-800 text-sm tracking-tighter mb-1">{s.name}</div>
                    <div className="px-2.5 py-1 bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest mb-6 transition-colors shadow-sm">{s.branch || s.role}</div>
                    <div className="grid grid-cols-2 gap-2 w-full pt-4 border-t border-slate-50 font-black italic">
                       <button onClick={() => { setShowStaffDetail(s); setEditStaffForm(s); setIsEditingStaff(false); }} className="flex items-center justify-center gap-1 bg-slate-900 text-white py-2 rounded-lg text-[8px] hover:bg-blue-600 transition-all active:scale-95 shadow-sm uppercase">DOSYA</button>
                       <button onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} className="flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-[8px] hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm uppercase">MESAJ</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MÜŞTERİLER */}
          {activeTab === 'customers' && (
            <div className="space-y-4 font-black uppercase italic">
              <div className="flex justify-between items-center bg-white/50 p-5 rounded-3xl border border-white shadow-sm backdrop-blur-md">
                <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">Müşteri Rehberi</h3>
                <button onClick={() => setShowCustomerModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-2 shadow-xl active:scale-95 transition-all tracking-[0.1em] uppercase"><Plus size={16} /> Müşteri Kaydet</button>
              </div>
              <div className="bg-white rounded-[1.8rem] border border-slate-200/60 shadow-sm overflow-hidden font-bold">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 italic">
                     <tr><th className="px-6 py-4 text-xs italic tracking-widest">Kurum / İsim</th><th className="px-6 py-4">İletişim</th><th className="px-6 py-4 text-right">Vergi/TC Bilgisi</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 italic font-black">
                     {data?.customers?.length > 0 ? data.customers.map(c => (
                       <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                         <td className="px-6 py-4 text-slate-800 text-[11px] tracking-tight">{c.name}</td>
                         <td className="px-6 py-4 text-[10px] text-slate-500">{c.contact}</td>
                         <td className="px-6 py-4 text-right text-[10px] text-slate-300 italic">{c.tax_info || 'GİRİLMEMİŞ'}</td>
                       </tr>
                     )) : <tr><td colSpan="3" className="p-20 text-center opacity-10 text-slate-900 italic font-black text-[12px] uppercase tracking-widest uppercase">Müşteri Verisi Bulunmuyor</td></tr>}
                   </tbody>
                 </table>
              </div>
            </div>
          )}

          {/* TAB: STOK TAKİBİ */}
          {activeTab === 'stock' && (
            <div className="space-y-4 font-black uppercase italic tracking-tighter">
               <div className="flex justify-between items-center bg-white/50 p-5 rounded-3xl border border-white shadow-sm backdrop-blur-md">
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">Depo & Envanter</h3>
                  <button onClick={() => setShowStockModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-2 shadow-xl active:scale-95 transition-all uppercase tracking-widest italic shadow-slate-900/10"><Plus size={16} /> Parça Girişi</button>
               </div>
               <div className="bg-white rounded-[1.8rem] border border-slate-200/60 shadow-sm overflow-hidden font-bold">
                 <table className="w-full text-left font-bold">
                   <thead className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr><th className="px-6 py-4 italic text-xs tracking-widest">Malzeme / Parça</th><th className="px-6 py-4">Miktar & Birim</th><th className="px-6 py-4 text-right">Birim Fiyat</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 font-black italic">
                      {data?.stock?.length > 0 ? data.stock.map(item => (
                        <tr key={item.id} className="font-bold hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4 text-slate-800 text-[11px]">{item.item_name}</td>
                          <td className="px-6 py-4 text-slate-500 text-[10px] uppercase">{item.quantity} {item.unit_name || 'Adet'}</td>
                          <td className="px-6 py-4 text-right text-emerald-600 font-black uppercase">₺{item.unit_price || '0.00'}</td>
                        </tr>
                      )) : <tr><td colSpan="3" className="p-20 text-center opacity-10 text-slate-900 italic font-black text-[12px] uppercase">Envanter Kaydı Bulunmuyor</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* TAB: FİNANS */}
          {activeTab === 'finance' && (
            <div className="space-y-4 font-black uppercase italic tracking-tighter">
               <div className="bg-white/50 p-5 rounded-3xl border border-white shadow-sm backdrop-blur-md">
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">Hesap Hareketleri</h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest italic opacity-60 leading-none">D1 Senkronize Kayıtlar</p>
               </div>
               <div className="bg-white rounded-[1.8rem] border border-slate-200/60 shadow-sm overflow-hidden font-bold">
                 <table className="w-full text-left font-bold">
                   <thead className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                     <tr><th className="px-6 py-4 italic text-xs tracking-widest">Açıklama / Detay</th><th className="px-6 py-4">Miktar</th><th className="px-6 py-4 text-right">İşlem Tipi</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 font-black italic">
                     {data?.finances?.length > 0 ? data.finances.map(f => (
                       <tr key={f.id} className="hover:bg-slate-50/50 transition-all">
                         <td className="px-6 py-4 text-slate-600 text-[10px] tracking-tight">{f.description}</td>
                         <td className={`px-6 py-4 text-[12px] ${f.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>₺{f.amount.toLocaleString('tr-TR')}</td>
                         <td className="px-6 py-4 text-right">
                            <span className={`text-[7px] uppercase font-black px-2 py-0.5 rounded-md border italic shadow-sm ${f.type === 'Gelir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{f.type}</span>
                         </td>
                       </tr>
                     )) : <tr><td colSpan="3" className="p-20 text-center opacity-10 text-slate-900 italic font-black text-[12px] uppercase">Finansal Veri Bulunmuyor</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* TAB: VARLIKLAR */}
          {activeTab === 'assets' && (
            <div className="space-y-6 font-black uppercase italic tracking-tighter">
              <div className="flex justify-between items-center bg-white/50 p-5 rounded-3xl border border-white shadow-sm backdrop-blur-md">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">Varlık Yönetimi</h3>
                  <p className="text-slate-400 font-bold text-[8px] uppercase tracking-widest opacity-60 italic leading-none leading-none">Cihaz Envanteri & QR Takip</p>
                </div>
                <button onClick={() => setShowAssetModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black shadow-lg shadow-blue-500/20 hover:scale-105 transition-all active:scale-95 italic uppercase tracking-widest">
                  <Plus size={16} className="inline mr-1" /> Yeni Varlık Ekle
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.assets?.length > 0 ? data.assets.map(a => (
                  <div key={a.id} className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm group hover:border-blue-500 transition-all relative">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner border border-slate-100"><Box size={18} /></div>
                    <div className="font-black text-slate-800 text-[12px] mb-0.5 tracking-tight uppercase">{a.name}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase mb-4 tracking-widest opacity-60"><MapPin size={10} className="inline mr-1" /> {a.location}</div>
                    <div className="text-[9px] text-slate-400 italic mb-5 leading-relaxed font-black bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[50px] uppercase opacity-80">{a.device_details || 'TEKNİK VERİ GİRİLMEMİŞ'}</div>
                    <button className="w-full bg-slate-900 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all italic active:scale-95 shadow-md">QR ETİKETİ YAZDIR</button>
                  </div>
                )) : <div className="col-span-4 p-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem] opacity-20 font-black text-slate-900 italic text-[12px] uppercase">Varlık Kaydı Bulunmuyor</div>}
              </div>
            </div>
          )}

          {/* TAB: FİRMA AYARLARI */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-2xl font-black uppercase italic tracking-tighter">
              <div className="bg-white rounded-[2.2rem] border border-slate-200/60 shadow-xl overflow-hidden">
                <div className="p-7 bg-slate-900 text-white flex items-center gap-4 relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Building2 size={70}/></div>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-white/5 backdrop-blur-sm"><Building2 size={20} /></div>
                  <div>
                    <h3 className="text-base font-black tracking-widest italic tracking-[0.1em] uppercase">Şirket Kimliği</h3>
                    <p className="text-white/30 text-[8px] font-bold uppercase tracking-[0.3em] italic">D1 CLOUD DATABASE SETTINGS</p>
                  </div>
                </div>
                <div className="p-7 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest italic opacity-60">Ticari Ünvan</label>
                      <input className="w-full px-5 py-3 rounded-xl bg-slate-50 border-none font-black text-[11px] outline-none focus:ring-1 ring-blue-500/20 shadow-inner italic" value={settingsForm.companyName} onChange={e => setSettingsForm({...settingsForm, companyName: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest italic opacity-60">İmza Yetkilisi</label>
                      <input className="w-full px-5 py-3 rounded-xl bg-slate-50 border-none font-black text-[11px] outline-none focus:ring-1 ring-blue-500/20 shadow-inner italic" value={settingsForm.ownerName} onChange={e => setSettingsForm({...settingsForm, ownerName: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5 font-bold">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest italic opacity-60">Hizmet Sektörü</label>
                    <input className="w-full px-5 py-3 rounded-xl bg-slate-50 border-none font-black text-[11px] outline-none focus:ring-1 ring-blue-500/20 shadow-inner italic" value={settingsForm.sector} onChange={e => setSettingsForm({...settingsForm, sector: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest italic opacity-60">Sistem Giriş URL</label>
                      <div className="px-5 py-3 rounded-xl bg-slate-100 text-slate-400 font-black text-[10px] flex items-center gap-2 italic uppercase shadow-inner"><Globe size={14}/> isdokumu.com/{slug}</div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest italic opacity-60">Vergi No / T.C.</label>
                      <input className="w-full px-5 py-3 rounded-xl bg-slate-50 border-none font-black text-[11px] outline-none focus:ring-1 ring-blue-500/20 shadow-inner italic" value={settingsForm.taxInfo} onChange={e => setSettingsForm({...settingsForm, taxInfo: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5 font-bold">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest italic opacity-60">Firma Yasal Adresi</label>
                    <textarea rows="3" className="w-full px-5 py-3 rounded-xl bg-slate-50 border-none font-black text-[11px] outline-none focus:ring-1 ring-blue-500/20 resize-none shadow-inner italic" value={settingsForm.address} onChange={e => setSettingsForm({...settingsForm, address: e.target.value})} />
                  </div>
                  <button disabled={isSaving} onClick={() => handleAction('update-settings', settingsForm)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95 italic shadow-slate-900/10">
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Şirket Bilgilerini D1 Üzerine Yaz</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* CHAT PANEL */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 font-black uppercase italic tracking-tighter">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="w-72 h-[450px] bg-white rounded-[2.2rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden shadow-slate-900/10 backdrop-blur-xl">
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between font-black text-[9px] uppercase italic tracking-widest tracking-[0.1em]">
                <div className="flex items-center gap-3 italic">{activeChatId ? data?.staff?.find(s => s.id === activeChatId)?.name : 'HABERLEŞME HATTI'}</div>
                <ChevronDown className="cursor-pointer" onClick={() => setIsChatOpen(false)} />
              </div>
              {!activeChatId ? (
                <div className="flex-1 p-3 space-y-2 overflow-y-auto bg-slate-50/50 font-black">
                   {(data?.staff || []).map(m => <div key={m.id} onClick={() => setActiveChatId(m.id)} className="p-3 bg-white hover:bg-blue-50 rounded-2xl cursor-pointer text-[9px] flex items-center gap-3 shadow-sm transition-all uppercase italic border border-slate-100/50">
                     <div className="w-7 h-7 bg-slate-900 rounded-xl flex items-center justify-center text-white text-[8px] uppercase italic shadow-lg">{m.name.charAt(0)}</div>
                     {m.name}
                   </div>)}
                </div>
              ) : (
                <><div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/20 text-xs custom-scrollbar italic font-black">
                    <button onClick={() => setActiveChatId(null)} className="text-[8px] font-black text-blue-600 uppercase mb-3 hover:underline tracking-widest italic">← PERSONEL LİSTESİ</button>
                    {(messages || []).map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender_id === 'PATRON' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl font-black max-w-[85%] leading-relaxed shadow-sm text-[10px] ${m.sender_id === 'PATRON' ? 'bg-slate-900 text-white rounded-tr-none shadow-slate-900/10' : 'bg-white text-slate-600 border border-slate-100 rounded-tl-none'}`}>{m.message}</div>
                        <div className="text-[6px] font-black text-slate-300 mt-1 uppercase tracking-widest italic">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 bg-white border-t flex gap-2">
                    <input value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Cevap yazın..." className="flex-1 bg-slate-100/50 px-4 py-3 rounded-2xl text-[9px] font-black outline-none border-none placeholder:italic italic" />
                    <button onClick={sendMessage} className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-90 transition-transform"><Send size={16} /></button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white group relative">
          {isChatOpen ? <X size={20} /> : <MessageSquare size={20} />}
          {!isChatOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-black italic shadow-lg">!</span>}
        </button>
      </div>

      {/* STAFF DETAIL MODAL */}
      <AnimatePresence>
        {showStaffDetail && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] font-black uppercase italic tracking-tighter border border-white">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1 italic opacity-60">Saha Personel Dosyası</h2>
                  <div className="text-xl font-black text-slate-900 tracking-tighter uppercase italic tracking-tighter leading-none">{showStaffDetail.name}</div>
                </div>
                <button onClick={() => setShowStaffDetail(null)} className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all shadow-sm border border-slate-100"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-8 font-black">
                 <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                   <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Branş / Rol</div>
                   <div className="text-[10px] uppercase font-black text-slate-800 italic">{showStaffDetail.branch || showStaffDetail.role}</div>
                 </div>
                 <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                   <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Sistem Statüsü</div>
                   <div className="text-[10px] uppercase font-black text-blue-600 italic">{showStaffDetail.status}</div>
                 </div>
                 <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                   <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">GSM Hattı</div>
                   <div className="text-[10px] uppercase font-black text-slate-800 italic">{showStaffDetail.phone || '-'}</div>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-8 pr-2 custom-scrollbar font-black uppercase italic">
                 <h4 className="text-[8px] font-black uppercase text-slate-400 mb-4 ml-1 tracking-widest italic opacity-40">TAMAMLANAN GÖREVLER</h4>
                 {(data?.jobs || []).filter(j => j.staff_id === showStaffDetail.id).length > 0 ? (data?.jobs || []).filter(j => j.staff_id === showStaffDetail.id).map(j => (
                   <div key={j.id} className="p-3 border border-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-all group font-black uppercase italic border-l-2 border-l-blue-500/20 bg-white shadow-sm">
                      <div>
                        <div className="font-black text-slate-800 text-[10px] uppercase italic tracking-tight">{j.customer_name}</div>
                        <div className="text-[7px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest italic opacity-50">{j.scheduled_date || 'ACİL SERVİS'}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase border italic ${statusColors[j.status] || 'bg-slate-100'}`}>{j.status}</span>
                   </div>
                 )) : <div className="text-center p-12 text-slate-300 italic font-black text-[10px] uppercase tracking-widest opacity-20 flex flex-col items-center gap-2 uppercase">GEÇMİŞ VERİSİ YOK</div>}
              </div>
              <div className="pt-6 border-t border-slate-100 flex flex-col gap-3 font-black uppercase italic">
                 {!isEditingStaff ? (
                   <div className="flex gap-3 w-full">
                     <button onClick={() => setIsEditingStaff(true)} className="flex-[2] bg-slate-900 text-white py-3.5 rounded-2xl font-black text-[9px] uppercase shadow-lg transition-all hover:bg-blue-600 flex items-center justify-center gap-2 tracking-widest italic active:scale-95 shadow-slate-900/10"><Settings size={14} /> Bilgileri Güncelle</button>
                     <button onClick={async () => { if(confirm(`${showStaffDetail.name} personeli silinecektir. Emin misiniz?`)) { await handleAction('delete-staff', { id: showStaffDetail.id }, () => setShowStaffDetail(null), () => {}); } }} className="flex-1 bg-rose-50 text-rose-600 py-3.5 rounded-2xl font-black text-[9px] uppercase border border-rose-100 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 tracking-widest italic active:scale-95"><Trash2 size={14} /> SİL</button>
                   </div>
                 ) : (
                   <div className="space-y-4 bg-slate-50/50 p-5 rounded-3xl border border-blue-100 shadow-inner">
                     <div className="grid grid-cols-2 gap-3 font-black italic uppercase">
                       <input className="w-full px-4 py-3 rounded-xl bg-white border-none font-black text-[10px] outline-none shadow-sm italic" value={editStaffForm.name} onChange={(e) => setEditStaffForm({...editStaffForm, name: e.target.value})} placeholder="Ad Soyad" />
                       <input className="w-full px-4 py-3 rounded-xl bg-white border-none font-black text-[10px] outline-none shadow-sm italic" value={editStaffForm.phone} onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})} placeholder="Telefon" />
                       <input className="w-full px-4 py-3 rounded-xl bg-white border-none font-black text-[10px] outline-none shadow-sm italic" value={editStaffForm.branch} onChange={(e) => setEditStaffForm({...editStaffForm, branch: e.target.value})} placeholder="Branş / Uzmanlık" />
                       <select className="w-full px-4 py-3 rounded-xl bg-white border-none font-black text-[10px] outline-none shadow-sm appearance-none italic" value={editStaffForm.status} onChange={(e) => setEditStaffForm({...editStaffForm, status: e.target.value})}>
                          <option value="Aktif">Aktif</option>
                          <option value="Sahada">Sahada</option>
                          <option value="Mesai Dışı">Mesai Dışı</option>
                       </select>
                     </div>
                     <div className="flex gap-2 uppercase tracking-widest font-black italic">
                       <button onClick={() => handleAction('add-staff', { ...editStaffForm, id: showStaffDetail.id }, () => setShowStaffDetail(null), () => setIsEditingStaff(false))} className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[9px] shadow-xl italic active:scale-95 shadow-slate-900/10">DEĞİŞİKLİKLERİ KAYDET</button>
                       <button onClick={() => setIsEditingStaff(false)} className="px-5 bg-slate-200 text-slate-600 py-3 rounded-xl text-[9px] italic active:scale-95">İPTAL</button>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALS: JOB, ASSET, STAFF, CUSTOMER, STOCK */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 font-black">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] border border-white uppercase italic tracking-tighter">
              <div className="flex justify-between items-center mb-6 font-black uppercase italic tracking-widest"><h2>Saha İş Emri Çık</h2><button onClick={() => setShowJobModal(false)} className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all shadow-sm"><X size={18} /></button></div>
              <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-2 uppercase italic font-black">
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-2.5 px-4 rounded-xl text-[9px] border transition-all ${jobForm.jobType === 'Anlık' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-400'}`}>ANLIK SERVİS</button>
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-2.5 px-4 rounded-xl text-[9px] border transition-all ${jobForm.jobType === 'Planlı' ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-400'}`}>RANDEVULU PLAN</button>
                </div>
                {jobForm.jobType === 'Planlı' && (
                  <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 ml-2 tracking-widest opacity-60 italic">Uygulama Tarihi</label><input type="date" className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none border-none shadow-inner italic" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} /></div>
                )}
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 ml-2 tracking-widest opacity-60 italic">Müşteri / Bina / Lokasyon</label><input list="asset-list" className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none border-none shadow-inner placeholder:italic italic" placeholder="Rehberden bulun veya yeni girin..." value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value})} /></div>
                <datalist id="asset-list">{((data?.assets || []).concat(data?.customers || [])).map((a,i) => <option key={i} value={a.name}>{a.location || a.address}</option>)}</datalist>
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 ml-2 tracking-widest opacity-60 italic">Operasyon Sorumlusu</label><select className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none appearance-none shadow-inner bg-white italic" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}><option value="">Seçim Yapınız...</option>{(data?.staff || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 ml-2 tracking-widest opacity-60 italic">Yapılacak İş Talimatları</label><textarea rows="3" className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none resize-none shadow-inner placeholder:italic italic" placeholder="Saha ekibine iletilecek teknik notlar..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} /></div>
              </div>
              <button disabled={isSaving} onClick={() => handleAction('add-job', { ...jobForm, details: { note: jobForm.taskNote } }, setShowJobModal, () => setJobForm({ customerName: '', staffId: '', workType: 'Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[11px] shadow-2xl mt-6 active:scale-95 transition-all flex items-center justify-center gap-3 tracking-widest uppercase italic shadow-blue-500/20">
                 {isSaving ? <Loader2 className="animate-spin" /> : <>İŞ EMRİNİ D1 ÜZERİNDEN GÖNDER <ArrowRight size={16}/></>}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 font-black">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-white uppercase italic tracking-tighter font-black">
              <div className="flex justify-between items-center mb-6 italic tracking-widest uppercase"><h2>Varlık / Cihaz Kaydı</h2><button onClick={() => setShowAssetModal(false)} className="p-2 bg-slate-50 rounded-xl shadow-sm"><X size={18} /></button></div>
              <div className="space-y-4">
                <input className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black outline-none shadow-inner italic" placeholder="Varlık / Cihaz Adı" onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                <input className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black outline-none shadow-inner italic" placeholder="Bina / Site Bilgisi" onChange={e => setAssetForm({...assetForm, apartmentName: e.target.value})} />
                <input className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black outline-none shadow-inner italic" placeholder="Tam Konum (Kat, No, Blok)" onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                <textarea rows="3" className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black outline-none resize-none shadow-inner placeholder:italic italic uppercase opacity-60" placeholder="Teknik detaylar, Marka, Model vb." onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
                <button disabled={isSaving} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] shadow-xl mt-2 uppercase tracking-widest italic active:scale-95 transition-all shadow-slate-900/10" onClick={() => handleAction('add-asset', assetForm, setShowAssetModal, () => setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '' }))}>ENVANTERE KAYDET</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 font-black">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative border border-white uppercase italic tracking-tighter">
              <div className="flex justify-between items-center mb-6 uppercase text-[8px] tracking-[0.2em] opacity-40 italic"><h2>Personel Tanımlama</h2><button onClick={() => setShowStaffModal(false)} className="p-2 bg-slate-50 rounded-xl shadow-sm"><X size={16} /></button></div>
              <div className="space-y-3 font-black">
                <input className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black italic shadow-inner outline-none uppercase" placeholder="Ad Soyad" onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                <input className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black italic shadow-inner outline-none uppercase" placeholder="GSM Numarası" onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
                <input className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black italic shadow-inner outline-none uppercase" placeholder="Branş / Uzmanlık" onChange={e => setStaffForm({...staffForm, branch: e.target.value})} />
                <select className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black appearance-none outline-none italic shadow-inner bg-white uppercase" onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                  <option value="Usta">Saha Ustası</option>
                  <option value="Yönetici">Yönetici / Operatör</option>
                </select>
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] shadow-xl mt-4 uppercase tracking-widest italic active:scale-95 shadow-slate-900/10 transition-all" onClick={() => handleAction('add-staff', staffForm, setShowStaffModal, () => setStaffForm({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' }))}>KAYDI TAMAMLA</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 font-black">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white uppercase italic tracking-tighter">
              <div className="flex justify-between items-center mb-6 uppercase font-black text-[9px] tracking-widest italic opacity-40"><h2>Cari / Müşteri Kaydı</h2><button onClick={() => setShowCustomerModal(false)} className="p-2 bg-slate-50 rounded-xl shadow-sm"><X size={18} /></button></div>
              <div className="space-y-3 font-black">
                <input className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black italic shadow-inner outline-none uppercase" placeholder="Firma / Şahıs Ünvanı" onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                <input className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black italic shadow-inner outline-none uppercase" placeholder="İletişim Kanalı (Tel/Mail)" onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
                <input className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black italic shadow-inner outline-none uppercase" placeholder="Resmi Adres" onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                <input className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl text-[10px] font-black italic shadow-inner outline-none uppercase" placeholder="Vergi No / T.C. Kimlik" onChange={e => setCustomerForm({...customerForm, taxInfo: e.target.value})} />
                <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] shadow-xl mt-2 uppercase tracking-widest italic active:scale-95 transition-all shadow-blue-500/10" onClick={() => handleAction('add-customer', customerForm, setShowCustomerModal, () => setCustomerForm({ name: '', contact: '', address: '', taxInfo: '' }))}>REHBERE EKLE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 font-black">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-white uppercase italic tracking-tighter">
              <div className="flex justify-between items-center mb-6 uppercase font-black text-[9px] tracking-widest italic opacity-40"><h2>Depo Giriş Formu</h2><button onClick={() => setShowStockModal(false)} className="p-2 bg-slate-50 rounded-xl shadow-sm"><X size={18} /></button></div>
              <div className="grid grid-cols-2 gap-3 mb-6 font-black italic">
                <div className="col-span-2 space-y-1"><label className="text-[8px] font-black text-slate-400 ml-2 tracking-widest uppercase opacity-60">Malzeme Adı</label><input className="w-full px-5 py-3 rounded-xl bg-slate-50 text-[10px] font-black outline-none shadow-inner" placeholder="Örn: Kapı Sensörü" onChange={e => setStockForm({...stockForm, itemName: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 ml-2 tracking-widest uppercase opacity-60">Stok Miktarı</label><input type="number" className="w-full px-5 py-3 rounded-xl bg-slate-50 text-[10px] font-black outline-none shadow-inner" onChange={e => setStockForm({...stockForm, quantity: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 ml-2 tracking-widest uppercase opacity-60">Birim Maliyet (₺)</label><input type="number" className="w-full px-5 py-3 rounded-xl bg-slate-50 text-[10px] font-black outline-none shadow-inner" onChange={e => setStockForm({...stockForm, unitPrice: e.target.value})} /></div>
                <div className="col-span-2 space-y-1"><label className="text-[8px] font-black text-slate-400 ml-2 tracking-widest uppercase opacity-60">Tedarikçi Firma</label><input className="w-full px-5 py-3 rounded-xl bg-slate-50 text-[10px] font-black outline-none shadow-inner" placeholder="Satıcı Adı" onChange={e => setStockForm({...stockForm, supplierName: e.target.value})} /></div>
              </div>
              <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] shadow-xl uppercase tracking-widest italic active:scale-95 transition-all shadow-slate-900/10" onClick={() => handleAction('add-stock', stockForm, setShowStockModal, () => setStockForm({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '', supplierPhone: '' }))}>ENVANTERE İŞLE</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}