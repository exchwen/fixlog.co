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

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  const managers = data?.staff?.filter(s => s.role === 'Yönetici') || [];
  const statusColors = { 'Beklemede': 'bg-amber-50 text-amber-600', 'Tamamlandı': 'bg-green-50 text-green-600', 'Devam Ediyor': 'bg-blue-50 text-blue-600', 'Gelecek': 'bg-slate-100 text-slate-500' };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 text-[13px] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-400 flex-col sticky top-0 h-screen z-50 shadow-2xl">
        <div className="p-6 flex items-center gap-3 border-b border-white/5 bg-slate-900/50">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-lg"><ShieldCheck size={18} /></div>
          <span className="font-black text-lg text-white tracking-tighter uppercase">İş Dökümü</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {[
            { id: 'home', label: 'Genel Bakış', icon: LayoutDashboard },
            { id: 'jobs', label: 'İş Emirleri', icon: ClipboardList },
            { id: 'team', label: 'Saha Ekibi', icon: Users },
            { id: 'customers', label: 'Müşteriler', icon: UserPlus },
            { id: 'assets', label: 'Varlıklar', icon: Box },
            { id: 'stock', label: 'Stok Takibi', icon: Package },
            { id: 'finance', label: 'Finans', icon: CreditCard },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5"><button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={16} /> Çıkış</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu size={20} /></button>
            <h1 className="font-black text-slate-800 uppercase text-sm tracking-tight">{data?.name} <span className="text-blue-600 font-bold ml-1">• Patron</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <input placeholder="Hızlı ara..." className="bg-transparent outline-none text-xs font-bold w-32" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Bell size={20} className="text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* TAB: GENEL BAKIŞ */}
          {activeTab === 'home' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {data.stats.map((s, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
                    <div><div className="text-xl font-black leading-none mb-1">{s.value}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</div></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="p-6 border-b flex justify-between items-center"><h3 className="font-black uppercase text-xs tracking-tight">Anlık İş Akışı</h3><button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[11px] font-black flex items-center gap-2 shadow-lg shadow-blue-500/20"><Plus size={14} /> Yeni İş Ata</button></div>
                  <div className="overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                        <tr><th className="px-6 py-4">Müşteri</th><th className="px-6 py-4">Yönetici</th><th className="px-6 py-4 text-right">Durum</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold">
                        {data.jobs.length > 0 ? data.jobs.slice(0, 8).map(j => (
                          <tr key={j.id} className="hover:bg-slate-50 transition-all cursor-pointer">
                            <td className="px-6 py-4 font-bold text-slate-700">{j.customer_name}</td>
                            <td className="px-6 py-4 text-slate-500 font-bold text-[11px]">{data?.staff?.find(s => s.id === j.staff_id)?.name || 'Atanmadı'}</td>
                            <td className="px-6 py-4 text-right"><span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase ${statusColors[j.status] || 'bg-slate-50'}`}>{j.status}</span></td>
                          </tr>
                        )) : <tr><td colSpan="3" className="p-10 text-center text-slate-300 italic font-bold uppercase tracking-widest">Kayıtlı Akış Yok</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl shadow-blue-900/10">
                <div><h4 className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Net Kasa Durumu</h4><div className="text-3xl font-black tracking-tight">{data?.stats?.[3]?.value || '₺0'}</div></div>
                  <div className="space-y-4 mt-8">
                  <div className="flex justify-between text-xs font-bold bg-white/5 p-4 rounded-2xl border border-white/5"><span className="opacity-40 uppercase tracking-widest">Gelir</span><span className="text-green-400 font-black">₺{data?.finSummary?.income || 0}</span></div>                    
                  <div className="flex justify-between text-xs font-bold bg-white/5 p-4 rounded-2xl border border-white/5"><span className="opacity-40 uppercase tracking-widest">Gider</span><span className="text-red-400 font-black">₺{data?.finSummary?.expense || 0}</span></div>
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest text-center mt-2">D1 Senkronizasyonu Aktif</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: İŞ EMİRLERİ */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                  {['past', 'current', 'future'].map(f => (
                    <button key={f} onClick={() => setJobFilter(f)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${jobFilter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {f === 'past' ? 'Geçmiş' : f === 'current' ? 'Mevcut' : 'Planlanan'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setJobForm({...jobForm, jobType: 'Planlı'}); setShowJobModal(true); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-xl"><Calendar size={16} /> İş Planla</button>
                  <button onClick={() => { setJobForm({...jobForm, jobType: 'Anlık'}); setShowJobModal(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/20"><Plus size={16} /> İş Ata</button>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left font-bold">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr><th className="px-8 py-4">Bina / Müşteri</th><th className="px-8 py-4">İş Türü</th><th className="px-8 py-4">Tarih</th><th className="px-8 py-4 text-right">Durum</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {data.jobs.filter(j => {
                      if(jobFilter === 'past') return j.status === 'Tamamlandı';
                      if(jobFilter === 'current') return j.status !== 'Tamamlandı' && !j.scheduled_date;
                      return j.scheduled_date;
                    }).map(j => (
                      <tr key={j.id} className="hover:bg-slate-50 transition-all font-bold">
                        <td className="px-8 py-3.5 text-slate-800">{j.customer_name}</td>
                        <td className="px-8 py-3.5 text-slate-400 uppercase text-[9px] tracking-wider">{j.job_type}</td>
                        <td className="px-8 py-3.5 text-slate-400 text-[11px]">{j.scheduled_date || new Date(j.created_at).toLocaleDateString()}</td>
                        <td className="px-8 py-3.5 text-right"><span className={`px-3 py-1 rounded-md text-[9px] uppercase font-black ${statusColors[j.status] || 'bg-slate-50'}`}>{j.status}</span></td>
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
              <div className="flex justify-between items-center"><h3 className="text-sm font-black uppercase tracking-tight">Ekip & Branş Takibi</h3><button onClick={() => setShowStaffModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-xl"><Plus size={16} /> Yeni Kayıt</button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.staff.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-blue-500 transition-all">
                    <div className="relative mb-4">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">{s.name.charAt(0)}</div>
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${s.status === 'Aktif' ? 'bg-green-500' : s.status === 'Sahada' ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                    </div>
                    <div className="font-black text-slate-800 text-sm">{s.name}</div>
                    <div className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">{s.branch || s.role} • {s.status}</div>
                    <div className="flex gap-2 w-full">
                       <button onClick={() => setShowStaffDetail(s)} className="flex-1 bg-slate-50 py-2 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-900 hover:text-white transition-all">DOSYA</button>
                       <button onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} className="flex-1 bg-blue-600 py-2 rounded-xl text-[10px] font-black text-white shadow-lg shadow-blue-500/10">MESAJ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MÜŞTERİLER */}
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

          {/* TAB: STOK TAKİBİ */}
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

          {/* TAB: FİNANS */}
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

          {/* TAB: VARLIKLAR */}
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

      {/* CHAT PANEL - FACEBOOK STYLE */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 font-bold">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="w-80 h-[500px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden shadow-slate-900/10">
              <div className="p-5 bg-blue-600 text-white flex items-center justify-between font-black text-xs uppercase"><div className="flex items-center gap-3">{activeChatId ? data.staff.find(s => s.id === activeChatId)?.name : 'Mesajlar'}</div><ChevronDown className="cursor-pointer" onClick={() => setIsChatOpen(false)} /></div>
              {!activeChatId ? (
                <div className="flex-1 p-3 space-y-1.5 overflow-y-auto bg-slate-50">
                   {managers.map(m => <div key={m.id} onClick={() => setActiveChatId(m.id)} className="p-3 bg-white hover:bg-blue-50 rounded-2xl cursor-pointer font-bold text-xs flex items-center gap-3 shadow-sm border border-slate-100 transition-all"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">{m.name.charAt(0)}</div>{m.name}</div>)}
                </div>
              ) : (
                <><div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20 text-xs">
                    <button onClick={() => setActiveChatId(null)} className="text-[9px] font-black text-blue-600 uppercase mb-4 hover:underline">← Ekip Listesi</button>
                    {messages.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender_id === 'PATRON' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl font-bold max-w-[85%] leading-relaxed ${m.sender_id === 'PATRON' ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' : 'bg-white text-slate-600 border border-slate-100 rounded-tl-none shadow-sm'}`}>{m.message}</div>
                        <div className="text-[8px] font-black text-slate-300 mt-2 uppercase">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 bg-white border-t flex gap-2"><input value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Cevap yazın..." className="flex-1 bg-slate-50 px-5 py-3 rounded-xl text-xs font-bold outline-none border-none" /><button onClick={sendMessage} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-90 transition-transform"><Send size={16} /></button></div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative border-4 border-[#F8FAFC]">
          {isChatOpen ? <X size={26} /> : <MessageSquare size={26} />}
          {!isChatOpen && <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-[#F8FAFC] flex items-center justify-center text-[10px] font-black">1</span>}
        </button>
      </div>

      {/* MODALS */}
      
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

      {/* 6. PERSONEL DETAY MODALI (İş Dosyası) */}
      <AnimatePresence>
        {showStaffDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] font-bold">
              <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black uppercase tracking-tight text-blue-600">Personel Kartı: {showStaffDetail.name}</h2><button onClick={() => setShowStaffDetail(null)} className="p-2 bg-slate-50 rounded-xl"><X size={24} /></button></div>
              <div className="grid grid-cols-3 gap-4 mb-8 font-bold">
                 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100"><div className="text-[9px] font-black opacity-30 uppercase tracking-widest">Branş/Rol</div><div className="text-sm uppercase font-black text-slate-700">{showStaffDetail.branch || showStaffDetail.role}</div></div>
                 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100"><div className="text-[9px] font-black opacity-30 uppercase tracking-widest">Statü</div><div className="text-sm uppercase font-black text-green-500">{showStaffDetail.status}</div></div>
                 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100"><div className="text-[9px] font-black opacity-30 uppercase tracking-widest">İletişim</div><div className="text-sm uppercase font-black text-slate-700">{showStaffDetail.phone || 'Girilmedi'}</div></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 font-bold">
              <h4 className="text-[10px] font-black uppercase opacity-40 mb-2 ml-1 tracking-widest">Görev Geçmişi & Planları</h4>
{(data?.jobs || []).filter(j => j.staff_id === showStaffDetail.id).length > 0 ? (data?.jobs || []).filter(j => j.staff_id === showStaffDetail.id).map(j => (
                   <div key={j.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all font-bold">
                      <div><div className="font-bold text-slate-800 text-sm">{j.customer_name}</div><div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{j.scheduled_date || 'Acil Görev'}</div></div>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm ${statusColors[j.status] || 'bg-slate-100'}`}>{j.status}</span>
                   </div>
                 )) : <div className="text-center p-12 text-slate-300 italic font-black text-xs uppercase tracking-widest">Henüz Kayıtlı Görev Yok</div>}
              </div>
              <div className="pt-6 border-t mt-4 flex gap-3">
                 <button className="flex-1 bg-blue-50 text-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">VERİLERİ DÜZENLE</button>
                 <button className="flex-1 bg-red-50 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase shadow-sm">PASİFE AL / MESAİ KAPAT</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}