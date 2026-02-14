'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ClipboardList, Settings, Bell, Search, Plus,
  CheckCircle2, Menu, X, LogOut, ShieldCheck, Loader2, ArrowRight,
  Box, Package, CreditCard, Send, MessageSquare, MapPin, TrendingUp, 
  ChevronDown, Wallet, UserPlus, Info, Trash2, ArrowUpRight, Zap
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

  // -- Modal States --
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showStaffDetail, setShowStaffDetail] = useState(null);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
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
  const [settingsForm, setSettingsForm] = useState({ companyName: '', ownerName: '', sector: '', address: '', taxInfo: '' });
  const [editStaffForm, setEditStaffForm] = useState({ name: '', phone: '', role: '', branch: '', status: '' });

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
      if (!res.ok) throw new Error("Ağ hatası");
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
    } catch (err) { console.error("Veri çekilemedi:", err); } finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`${API_URL}/get-messages?slug=${slug}&staffId=${activeChatId}`);
      const msgs = await res.json();
      setMessages(msgs || []);
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
      if (res.ok) { 
        if(closeFn) closeFn(false); 
        if(resetFn) resetFn(); 
        await fetchData(); 
      } else {
         alert("Veritabanı kayıt hatası. Lütfen konsolu kontrol edin.");
      }
    } catch (err) { alert("Sunucu ile bağlantı kurulamadı."); } finally { setIsSaving(false); }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    await fetch(`${API_URL}/send-message`, { method: 'POST', body: JSON.stringify({ slug, senderId: 'PATRON', receiverId: activeChatId, message: messageInput }) });
    setMessageInput(''); fetchMessages();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="mb-4">
        <ShieldCheck className="text-blue-500 w-12 h-12" />
      </motion.div>
      <div className="text-white font-black tracking-widest text-[11px] uppercase opacity-40">D1 Senkronize Ediliyor...</div>
    </div>
  );

  const managers = data?.staff?.filter(s => s?.role === 'Yönetici') || [];
  const statusColors = { 'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 text-sm overflow-hidden relative selection:bg-blue-100">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none z-0"></div>

      {/* COMPACT SIDEBAR */}
      <aside className="hidden lg:flex w-56 bg-slate-900 text-slate-400 flex-col sticky top-0 h-screen z-50 border-r border-slate-800">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800 bg-slate-900/50">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg"><ShieldCheck size={18} /></div>
          <span className="font-bold text-sm text-white tracking-tight uppercase">İŞ DÖKÜMÜ</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
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
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${activeTab === item.id ? 'bg-blue-600/10 text-blue-500' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon size={16} /> <span className="text-[13px]">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-rose-400 font-medium hover:bg-rose-500/10 rounded-lg transition-all text-xs">
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-1.5 text-slate-600"><Menu size={18} /></button>
            <div className="flex flex-col">
              <h1 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                {data?.name || 'Yükleniyor...'} <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              </h1>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{data?.ownerName || 'Yönetim'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <input placeholder="Arama..." className="bg-transparent outline-none text-xs w-40 text-slate-600 placeholder:text-slate-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer transition-all relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-6xl mx-auto w-full pb-24">
          
          {/* TAB: GENEL BAKIŞ */}
          {activeTab === 'home' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hoş Geldin, {data?.ownerName?.split(' ')[0] || 'Yönetici'} 👋</h2>
                  <p className="text-slate-500 text-xs mt-1">Sistem üzerindeki anlık özetin aşağıdadır.</p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 flex items-center gap-1.5 font-medium text-[10px] uppercase tracking-wide">
                  <Zap size={12} className="fill-emerald-600" /> D1 Bağlantısı Aktif
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.stats?.map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50/50 rounded-lg flex items-center justify-center text-blue-600">
                      {i === 0 ? <ClipboardList size={18} /> : i === 1 ? <Users size={18} /> : i === 2 ? <Box size={18} /> : <Wallet size={18} />}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-900 leading-none mb-1">{s?.value || '0'}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-medium">{s?.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-sm text-slate-800">Son İş Emirleri</h3>
                    <button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 hover:bg-blue-700 transition-all">
                      <Plus size={14} /> Yeni İş Ata
                    </button>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white sticky top-0 shadow-sm text-slate-400 font-medium">
                        <tr><th className="px-5 py-3 border-b border-slate-100">Müşteri / Lokasyon</th><th className="px-5 py-3 border-b border-slate-100">Sorumlu</th><th className="px-5 py-3 border-b border-slate-100 text-right">Durum</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {data?.jobs?.length > 0 ? data.jobs.slice(0, 8).map((j) => (
                          <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="font-semibold text-slate-800">{j?.customer_name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{j?.work_type}</div>
                            </td>
                            <td className="px-5 py-3 text-slate-600">
                               {data?.staff?.find(s => s.id === j.staff_id)?.name || 'Atanmadı'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {j.status}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="3" className="p-10 text-center text-slate-400 text-xs">Aktif iş bulunmuyor.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6 flex flex-col text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                      <Wallet size={16} className="text-blue-400" />
                      <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Kasa Özeti</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mb-1">Net Bakiye</div>
                    <div className="text-3xl font-bold tracking-tight mb-8">{data?.stats?.[3]?.value || '₺0'}</div>
                    
                    <div className="space-y-3 mt-auto">
                      <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight size={14} className="text-emerald-400" />
                          <span className="text-xs text-slate-300">Gelir</span>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">₺{data?.finSummary?.income?.toLocaleString('tr-TR') || 0}</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight size={14} className="text-rose-400 rotate-90" />
                          <span className="text-xs text-slate-300">Gider</span>
                        </div>
                        <span className="text-sm font-semibold text-rose-400">₺{data?.finSummary?.expense?.toLocaleString('tr-TR') || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: İŞ EMİRLERİ */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Tüm İş Emirleri</h3>
                <button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700">
                  <Plus size={14} /> Yeni Görev
                </button>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <table className="w-full text-left text-xs">
                   <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                     <tr>
                       <th className="px-5 py-3">Lokasyon / Müşteri</th>
                       <th className="px-5 py-3">Görev Tipi</th>
                       <th className="px-5 py-3">Tarih</th>
                       <th className="px-5 py-3">Sorumlu</th>
                       <th className="px-5 py-3 text-right">Durum</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {data?.jobs?.length > 0 ? data.jobs.map(j => (
                       <tr key={j.id} className="hover:bg-slate-50">
                         <td className="px-5 py-3 font-semibold text-slate-800">{j.customer_name}</td>
                         <td className="px-5 py-3 text-slate-600">{j.work_type}</td>
                         <td className="px-5 py-3 text-slate-500">{j.scheduled_date || 'Anlık'}</td>
                         <td className="px-5 py-3 text-slate-600">{data?.staff?.find(s => s.id === j.staff_id)?.name || '-'}</td>
                         <td className="px-5 py-3 text-right">
                            <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                         </td>
                       </tr>
                     )) : <tr><td colSpan="5" className="p-10 text-center text-slate-400">İş kaydı bulunamadı.</td></tr>}
                   </tbody>
                 </table>
              </div>
            </div>
          )}

          {/* TAB: SAHA EKİBİ */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Saha Operasyon Ekibi</h3>
                  <p className="text-slate-500 text-xs">Personel durumlarını yönetin.</p>
                </div>
                <button onClick={() => setShowStaffModal(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-slate-800">
                  <UserPlus size={14} /> Personel Ekle
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.staff?.map((s) => (
                  <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative flex flex-col items-center text-center">
                    <div className="absolute top-3 right-3">
                      <div className={`w-2 h-2 rounded-full ${s.status === 'Aktif' ? 'bg-emerald-500' : s.status === 'Sahada' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-3 font-bold text-lg">
                      {s.name.charAt(0)}
                    </div>
                    <div className="font-semibold text-slate-800 text-sm mb-0.5">{s.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-4 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {s.branch || s.role}
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full pt-3 border-t border-slate-100">
                       <button onClick={() => { setShowStaffDetail(s); setEditStaffForm(s); setIsEditingStaff(false); }} className="flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 py-1.5 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors">
                         Dosya
                       </button>
                       <button onClick={() => { setActiveChatId(s.id); setIsChatOpen(true); }} className="flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-1.5 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors">
                         Mesaj
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MÜŞTERİLER */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Müşteri Rehberi</h3>
                <button onClick={() => setShowCustomerModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700">
                  <Plus size={14} /> Müşteri Ekle
                </button>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <table className="w-full text-left text-xs">
                   <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                     <tr><th className="px-5 py-3">İsim / Kurum</th><th className="px-5 py-3">İletişim</th><th className="px-5 py-3">Adres</th><th className="px-5 py-3 text-right">Vergi/TC</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {data?.customers?.length > 0 ? data.customers.map(c => (
                       <tr key={c.id} className="hover:bg-slate-50">
                         <td className="px-5 py-3 font-semibold text-slate-800">{c.name}</td>
                         <td className="px-5 py-3 text-slate-600">{c.contact}</td>
                         <td className="px-5 py-3 text-slate-500 truncate max-w-xs">{c.address}</td>
                         <td className="px-5 py-3 text-right text-slate-400">{c.tax_info || '-'}</td>
                       </tr>
                     )) : <tr><td colSpan="4" className="p-10 text-center text-slate-400">Müşteri kaydı yok.</td></tr>}
                   </tbody>
                 </table>
              </div>
            </div>
          )}

          {/* TAB: STOK TAKİBİ */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900">Envanter & Parça Girişi</h3>
                 <button onClick={() => setShowStockModal(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-slate-800">
                   <Plus size={14} /> Parça Ekle
                 </button>
               </div>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <table className="w-full text-left text-xs">
                   <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr><th className="px-5 py-3">Parça Adı</th><th className="px-5 py-3">Miktar / Birim</th><th className="px-5 py-3">Tedarikçi</th><th className="px-5 py-3 text-right">Durum</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {data?.stock?.length > 0 ? data.stock.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-semibold text-slate-800">{item.item_name}</td>
                          <td className="px-5 py-3 text-slate-600">{item.quantity} {item.unit_name} / ₺{item.unit_price || '0'}</td>
                          <td className="px-5 py-3 text-slate-500">
                            <div>{item.supplier_name || 'Genel'}</div>
                            <div className="text-[10px]">{item.supplier_phone || '-'}</div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-medium">Stokta</span>
                          </td>
                        </tr>
                      )) : <tr><td colSpan="4" className="p-10 text-center text-slate-400">Stok kaydı yok.</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* TAB: FİNANS */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900">Hesap Hareketleri</h3>
               </div>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <table className="w-full text-left text-xs">
                   <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                     <tr><th className="px-5 py-3">Açıklama</th><th className="px-5 py-3">Miktar</th><th className="px-5 py-3 text-right">Tip</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {data?.finances?.length > 0 ? data.finances.map(f => (
                       <tr key={f.id} className="hover:bg-slate-50">
                         <td className="px-5 py-3 text-slate-800">{f.description}</td>
                         <td className={`px-5 py-3 font-semibold ${f.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>₺{f.amount.toLocaleString('tr-TR')}</td>
                         <td className="px-5 py-3 text-right">
                           <span className={`px-2 py-1 rounded text-[10px] font-medium border ${f.type === 'Gelir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{f.type}</span>
                         </td>
                       </tr>
                     )) : <tr><td colSpan="3" className="p-10 text-center text-slate-400">Finansal kayıt yok.</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* TAB: VARLIKLAR */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Kayıtlı Varlıklar & QR</h3>
                <button onClick={() => setShowAssetModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-blue-700">
                  <Plus size={14} /> Yeni Varlık
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.assets?.length > 0 ? data.assets.map(a => (
                  <div key={a.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors flex flex-col">
                    <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 mb-3 border border-slate-100"><Box size={16} /></div>
                    <div className="font-semibold text-slate-800 text-sm mb-1 truncate">{a.name}</div>
                    <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1"><MapPin size={10}/> {a.location}</div>
                    <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100 mb-4 flex-1 line-clamp-2">{a.device_details || 'Detay yok'}</div>
                    <button className="w-full bg-slate-50 py-1.5 rounded-md text-[10px] font-medium text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">QR Kod Yazdır</button>
                  </div>
                )) : <div className="col-span-4 p-16 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">Varlık kaydı bulunmuyor.</div>}
              </div>
            </div>
          )}

          {/* TAB: FİRMA AYARLARI */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600"><Settings size={20} /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Şirket Profil Ayarları</h3>
                  <p className="text-xs text-slate-500">D1 veritabanındaki şirket kimliğinizi güncelleyin.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600">İşletme / Şirket Adı</label>
                  <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={settingsForm.companyName} onChange={e => setSettingsForm({...settingsForm, companyName: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600">Sistem Yetkilisi</label>
                  <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={settingsForm.ownerName} onChange={e => setSettingsForm({...settingsForm, ownerName: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600">Faaliyet Sektörü</label>
                  <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={settingsForm.sector} onChange={e => setSettingsForm({...settingsForm, sector: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600">Vergi No / T.C. Kimlik</label>
                  <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={settingsForm.taxInfo} onChange={e => setSettingsForm({...settingsForm, taxInfo: e.target.value})} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600">Resmi Firma Adresi</label>
                  <textarea rows="3" className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" value={settingsForm.address} onChange={e => setSettingsForm({...settingsForm, address: e.target.value})} />
                </div>
              </div>
              
              <div className="pt-2">
                <button disabled={isSaving} onClick={() => handleAction('update-settings', settingsForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Ayarları D1'e Kaydet
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CHAT PANEL */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="w-72 h-[400px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between font-medium text-xs">
                <div className="flex items-center gap-2">{activeChatId ? data?.staff?.find(s => s.id === activeChatId)?.name : 'İletişim Paneli'}</div>
                <ChevronDown className="cursor-pointer" onClick={() => setIsChatOpen(false)} size={16} />
              </div>
              {!activeChatId ? (
                <div className="flex-1 p-2 space-y-1 overflow-y-auto bg-slate-50">
                   {data?.staff?.map(m => <div key={m.id} onClick={() => setActiveChatId(m.id)} className="p-2.5 bg-white hover:bg-slate-50 rounded-lg cursor-pointer text-xs font-medium flex items-center gap-2 shadow-sm border border-slate-100 transition-colors">
                     <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-md flex items-center justify-center font-bold">{m.name.charAt(0)}</div>
                     {m.name}
                   </div>)}
                </div>
              ) : (
                <><div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs custom-scrollbar">
                    <button onClick={() => setActiveChatId(null)} className="text-[10px] font-semibold text-slate-500 mb-2 hover:text-slate-700">← Geri</button>
                    {messages.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender_id === 'PATRON' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3 py-2 rounded-lg max-w-[85%] ${m.sender_id === 'PATRON' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}`}>{m.message}</div>
                        <div className="text-[8px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                    <input value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Mesaj yazın..." className="flex-1 bg-slate-50 px-3 py-1.5 rounded-md text-xs outline-none border border-slate-200" />
                    <button onClick={sendMessage} className="bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 transition-colors"><Send size={14} /></button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors relative">
          {isChatOpen ? <X size={20} /> : <MessageSquare size={20} />}
        </button>
      </div>

      {/* PERSONEL DETAY MODALI */}
      <AnimatePresence>
        {showStaffDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl relative flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{showStaffDetail.name}</h2>
                  <div className="text-xs text-slate-500 mt-0.5">Personel Dosyası</div>
                </div>
                <button onClick={() => setShowStaffDetail(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18} /></button>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="text-[10px] font-semibold text-slate-500 uppercase">Branş/Rol</div>
                   <div className="text-xs font-medium text-slate-800 mt-0.5">{showStaffDetail.branch || showStaffDetail.role}</div>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="text-[10px] font-semibold text-slate-500 uppercase">Statü</div>
                   <div className="text-xs font-medium text-blue-600 mt-0.5">{showStaffDetail.status}</div>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="text-[10px] font-semibold text-slate-500 uppercase">Telefon</div>
                   <div className="text-xs font-medium text-slate-800 mt-0.5">{showStaffDetail.phone || '-'}</div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-6 custom-scrollbar">
                 <h4 className="text-[11px] font-semibold text-slate-500 mb-2">GÖREV GEÇMİŞİ</h4>
                 {(data?.jobs || []).filter(j => j.staff_id === showStaffDetail.id).length > 0 ? (data?.jobs || []).filter(j => j.staff_id === showStaffDetail.id).map(j => (
                   <div key={j.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-white text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{j.customer_name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{j.scheduled_date || 'Anlık'}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span>
                   </div>
                 )) : <div className="text-center p-6 text-slate-400 text-xs bg-slate-50 rounded-lg">Geçmiş görev bulunmuyor.</div>}
              </div>

              <div className="pt-4 border-t border-slate-100">
                 {!isEditingStaff ? (
                   <div className="flex gap-2 w-full">
                     <button onClick={() => setIsEditingStaff(true)} className="flex-[2] bg-slate-100 text-slate-700 py-2 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"><Settings size={14} /> Düzenle</button>
                     <button onClick={async () => { if(confirm(`${showStaffDetail.name} isimli personel silinecektir. Onaylıyor musunuz?`)) { await handleAction('delete-staff', { id: showStaffDetail.id }, () => setShowStaffDetail(null), () => {}); } }} className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={14} /> Sil</button>
                   </div>
                 ) : (
                   <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <div className="grid grid-cols-2 gap-3">
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.name} onChange={(e) => setEditStaffForm({...editStaffForm, name: e.target.value})} placeholder="Ad Soyad" />
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.phone} onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})} placeholder="Telefon" />
                       <input className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none focus:border-blue-400" value={editStaffForm.branch} onChange={(e) => setEditStaffForm({...editStaffForm, branch: e.target.value})} placeholder="Branş" />
                       <select className="px-3 py-1.5 rounded-md border border-slate-200 text-xs w-full outline-none bg-white focus:border-blue-400" value={editStaffForm.status} onChange={(e) => setEditStaffForm({...editStaffForm, status: e.target.value})}>
                          <option value="Aktif">Aktif</option>
                          <option value="Sahada">Sahada</option>
                          <option value="Mesai Dışı">Mesai Dışı</option>
                       </select>
                     </div>
                     <div className="flex gap-2 pt-2">
                       <button onClick={() => handleAction('add-staff', { ...editStaffForm, id: showStaffDetail.id }, () => setShowStaffDetail(null), () => setIsEditingStaff(false))} className="flex-1 bg-blue-600 text-white py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700">Kaydet</button>
                       <button onClick={() => setIsEditingStaff(false)} className="px-4 bg-slate-200 text-slate-700 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-300">İptal</button>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* İŞ EMRİ MODALI */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">İş Emri Ata</h2><button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Anlık', scheduledDate: ''})} className={`py-1.5 text-xs font-semibold rounded-md border ${jobForm.jobType === 'Anlık' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200'}`}>Anlık Görev</button>
                   <button onClick={() => setJobForm({...jobForm, jobType: 'Planlı'})} className={`py-1.5 text-xs font-semibold rounded-md border ${jobForm.jobType === 'Planlı' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>Tarih Planla</button>
                </div>
                {jobForm.jobType === 'Planlı' && (
                  <div><label className="text-[11px] font-semibold text-slate-600 block mb-1">Tarih</label><input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" onChange={e => setJobForm({...jobForm, scheduledDate: e.target.value})} /></div>
                )}
                <div><label className="text-[11px] font-semibold text-slate-600 block mb-1">Müşteri / Lokasyon</label><input list="asset-list" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Seç veya yaz..." value={jobForm.customerName} onChange={e => setJobForm({...jobForm, customerName: e.target.value})} /></div>
                <datalist id="asset-list">{(data?.assets || []).concat(data?.customers || []).map((a,i) => <option key={i} value={a.name}>{a.location || a.address}</option>)}</datalist>
                <div><label className="text-[11px] font-semibold text-slate-600 block mb-1">Sorumlu Yönetici</label><select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400" value={jobForm.staffId} onChange={e => setJobForm({...jobForm, staffId: e.target.value})}><option value="">Seçiniz...</option>{managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div><label className="text-[11px] font-semibold text-slate-600 block mb-1">Görev Özeti</label><textarea rows="3" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400" placeholder="Talimatlar..." value={jobForm.taskNote} onChange={e => setJobForm({...jobForm, taskNote: e.target.value})} /></div>
              </div>
              <button disabled={isSaving} onClick={() => handleAction('add-job', { ...jobForm, details: { note: jobForm.taskNote } }, setShowJobModal, () => setJobForm({ customerName: '', assetId: '', staffId: '', workType: 'Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' }))} className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold text-sm mt-5 hover:bg-blue-700 transition-colors flex justify-center items-center">
                 {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'İş Emrini Gönder'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VARLIK MODALI */}
      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Varlık Ekle</h2><button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Varlık/Cihaz Adı" onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Bina / Site Adı" onChange={e => setAssetForm({...assetForm, apartmentName: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Konum (Kat, Blok)" onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
                <textarea rows="3" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none resize-none focus:border-blue-400" placeholder="Teknik Detaylar" onChange={e => setAssetForm({...assetForm, deviceDetails: e.target.value})} />
                <button className="w-full bg-slate-900 text-white py-2 rounded-md font-semibold text-sm mt-2 hover:bg-slate-800" onClick={() => handleAction('add-asset', assetForm, setShowAssetModal, () => setAssetForm({ name: '', location: '', apartmentName: '', deviceDetails: '' }))}>Kaydet</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERSONEL MODALI */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xs rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Personel Ekle</h2><button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Ad Soyad" onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Telefon" onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Branş" onChange={e => setStaffForm({...staffForm, branch: e.target.value})} />
                <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400" onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                  <option value="Usta">Saha Ustası</option>
                  <option value="Yönetici">Yönetici</option>
                </select>
                <button className="w-full bg-slate-900 text-white py-2 rounded-md font-semibold text-sm mt-2 hover:bg-slate-800" onClick={() => handleAction('add-staff', staffForm, setShowStaffModal, () => setStaffForm({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' }))}>Kaydet</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MÜŞTERİ MODALI */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Müşteri Ekle</h2><button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Firma / İsim" onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Telefon / E-posta" onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Açık Adres" onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Vergi No / T.C." onChange={e => setCustomerForm({...customerForm, taxInfo: e.target.value})} />
                <button className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold text-sm mt-2 hover:bg-blue-700" onClick={() => handleAction('add-customer', customerForm, setShowCustomerModal, () => setCustomerForm({ name: '', contact: '', address: '', taxInfo: '' }))}>Kaydet</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STOK MODALI */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-slate-800">Parça Girişi</h2><button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Parça Adı" onChange={e => setStockForm({...stockForm, itemName: e.target.value})} /></div>
                <div><input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Miktar" onChange={e => setStockForm({...stockForm, quantity: e.target.value})} /></div>
                <div><select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none bg-white focus:border-blue-400" onChange={e => setStockForm({...stockForm, unitName: e.target.value})}><option value="Adet">Adet</option><option value="Metre">Metre</option><option value="Paket">Paket</option></select></div>
                <div><input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Birim Fiyat (₺)" onChange={e => setStockForm({...stockForm, unitPrice: e.target.value})} /></div>
                <div><input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Tedarikçi Firma" onChange={e => setStockForm({...stockForm, supplierName: e.target.value})} /></div>
                <div className="col-span-2"><input className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-400" placeholder="Tedarikçi Telefon" onChange={e => setStockForm({...stockForm, supplierPhone: e.target.value})} /></div>
              </div>
              <button className="w-full bg-slate-900 text-white py-2 rounded-md font-semibold text-sm mt-4 hover:bg-slate-800" onClick={() => handleAction('add-stock', stockForm, setShowStockModal, () => setStockForm({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '', supplierPhone: '' }))}>Stok Kaydet</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}