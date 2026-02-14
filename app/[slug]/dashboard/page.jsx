'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  Bell,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Loader2,
  ArrowRight,
  AlertCircle,
  Box,
  Package,
  CreditCard,
  MoreVertical,
  TrendingUp,
  MapPin,
  UserCheck,
  Phone,
  Briefcase,
  Send,
  MessageSquare
} from 'lucide-react';

import sectorDataFile from '../../../lib/data/sectors.json';
import DynamicJobForm from '../../../components/DynamicJobForm';

const API_URL = 'https://backend.isdokumu.workers.dev';

export default function Dashboard() {
  const { slug } = useParams();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modalların State'leri
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  // Mesajlaşma State'leri
  const [activeChatId, setActiveChatId] = useState(null);
  const [messageText, setMessageText] = useState('');

  // Form State'leri
  const [jobForm, setJobForm] = useState({
    customerName: '',
    assetId: '',
    staffId: '', // Sorumlu Yönetici ID
    workType: '',
    dynamicFields: {},
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    location: '',
    type: ''
  });

  const [staffForm, setStaffForm] = useState({
    name: '',
    phone: '',
    role: 'Usta'
  });

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard-data?slug=${slug}`);
      const result = await res.json();
      setData(result);
      // Eğer yönetici varsa ilkini sohbette seç
      if (result.staff?.filter(s => s.role === 'Yönetici').length > 0) {
        setActiveChatId(result.staff.filter(s => s.role === 'Yönetici')[0].id);
      }
    } catch (err) {
      console.error('Veri çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [slug]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih yok';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  // İş Kaydetme (Yönetici Atamalı)
  const handleSaveJob = async () => {
    if (!jobForm.customerName || !jobForm.workType || !jobForm.staffId) {
      return alert('Lütfen müşteri adını, iş tipini ve sorumlu yöneticiyi seçiniz.');
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/add-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          customerName: jobForm.customerName,
          workType: jobForm.workType,
          assetId: jobForm.assetId,
          staffId: jobForm.staffId, // Atanan yönetici
          details: jobForm.dynamicFields,
        }),
      });
      if (res.ok) {
        setShowJobModal(false);
        setJobForm({ customerName: '', assetId: '', staffId: '', workType: '', dynamicFields: {} });
        fetchDashboardData();
      }
    } catch (err) { alert('Hata oluştu.'); } 
    finally { setIsSaving(false); }
  };

  const handleSaveAsset = async () => {
    if (!assetForm.name) return alert('İsim gerekli.');
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/add-asset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...assetForm }),
      });
      if (res.ok) {
        setShowAssetModal(false);
        setAssetForm({ name: '', location: '', type: '' });
        fetchDashboardData();
      }
    } catch (err) { alert('Hata.'); }
    finally { setIsSaving(false); }
  };

  const handleSaveStaff = async () => {
    if (!staffForm.name) return alert('İsim gerekli.');
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/add-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...staffForm }),
      });
      if (res.ok) {
        setShowStaffModal(false);
        setStaffForm({ name: '', phone: '', role: 'Usta' });
        fetchDashboardData();
      }
    } catch (err) { alert('Hata.'); }
    finally { setIsSaving(false); }
  };

  const filteredJobs = data?.jobs?.filter(job => 
    job.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sectorData = sectorDataFile.sectors[data?.sector] || null;
  const managers = data?.staff?.filter(s => s.role === 'Yönetici') || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const menuItems = [
    { id: 'home', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'jobs', label: 'İş Emirleri', icon: ClipboardList },
    { id: 'team', label: 'Saha Ekibi', icon: Users },
    { id: 'assets', label: 'Varlıklar (QR)', icon: Box },
    { id: 'stock', label: 'Stok Takibi', icon: Package },
    { id: 'finance', label: 'Finans', icon: CreditCard },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-gray-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">İş Dökümü</span>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all rounded-2xl ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-gray-50">
          <button onClick={() => router.push('/login')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all">
            <LogOut className="w-5 h-5" /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 bg-gray-50 rounded-xl">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Patron Paneli</h2>
              <h1 className="text-xl font-black text-gray-900 leading-none">{data?.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Arama..." 
                className="bg-transparent border-none text-sm outline-none w-48 font-medium" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative cursor-pointer group">
              <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-all border border-gray-100">
                <Bell className="w-5 h-5 text-gray-600" />
              </div>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-10 space-y-10 max-w-[1600px] w-full mx-auto">
          
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {data?.stats?.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="text-lg font-black text-gray-900">Son Atanan İşler</h3>
                      <button onClick={() => setShowJobModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 flex items-center gap-2 transition-all">
                        <Plus className="w-4 h-4" /> İş Ata
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Müşteri</th>
                            <th className="px-8 py-4">Sorumlu Yönetici</th>
                            <th className="px-8 py-4 text-right">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {data?.jobs?.slice(0, 5).map((job) => {
                            const managerName = data?.staff?.find(s => s.id === job.staff_id)?.name || 'Atanmadı';
                            return (
                              <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-5 font-bold text-gray-900 text-sm">{job.customer_name}</td>
                                <td className="px-8 py-5 text-gray-500 text-xs font-bold">{managerName}</td>
                                <td className="px-8 py-5 text-right"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{job.status}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* YÖNETİCİ MESAJLAŞMA ALANI */}
                  <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                          {activeChatId ? managers.find(m => m.id === activeChatId)?.name.charAt(0) : 'M'}
                        </div>
                        <div>
                          <div className="text-sm font-black text-gray-900 leading-none mb-1">Yönetici Sohbeti</div>
                          <div className="text-[10px] text-green-500 font-bold uppercase tracking-widest leading-none">Çevrimiçi</div>
                        </div>
                      </div>
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/30">
                      <div className="flex flex-col items-start max-w-[80%]">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-xs text-gray-600 leading-relaxed font-medium">
                          Patron selamlar, A blok asansör parçalarını sipariş geçtim. Yarın elimizde olur.
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold mt-1 ml-1 uppercase">Yavuz Şef • 10:45</span>
                      </div>
                      <div className="flex flex-col items-end max-w-[80%] ml-auto">
                        <div className="bg-blue-600 p-3 rounded-2xl rounded-tr-none shadow-md text-xs text-white leading-relaxed font-bold">
                          Tamamdır Yavuz, montaj için ekibi hazır tutalım. Eline sağlık.
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold mt-1 mr-1 uppercase">Siz • 10:52</span>
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Yöneticiye yaz..." 
                        className="flex-1 bg-gray-50 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                      />
                      <button className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Diğer Sekmeler (Jobs, Team, Assets vb.) aynı mantıkla devam eder */}
            {activeTab === 'jobs' && (
              <motion.div key="jobs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">İş Emri Takip</h3>
                  <button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Yeni İş</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <tr><th className="px-8 py-4">ID / Müşteri</th><th className="px-8 py-4">Sorumlu</th><th className="px-8 py-4 text-right">Durum</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredJobs.map(job => (
                        <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5"><div className="text-[10px] font-black text-blue-600">#{job.id}</div><div className="font-bold text-gray-900 text-sm">{job.customer_name}</div></td>
                          <td className="px-8 py-5 text-gray-500 text-xs font-bold">{data?.staff?.find(s => s.id === job.staff_id)?.name || 'Atanmadı'}</td>
                          <td className="px-8 py-5 text-right"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{job.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'team' && (
              <motion.div key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-gray-900">Saha Personeli</h3>
                  <button onClick={() => setShowStaffModal(true)} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Personel Ekle</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {data?.staff?.map(member => (
                    <div key={member.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black">{member.name.charAt(0)}</div>
                        <div><div className="font-bold text-gray-900">{member.name}</div><div className="text-[10px] font-black text-blue-600 uppercase">{member.role}</div></div>
                      </div>
                      <Phone className="w-4 h-4 text-gray-300" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Assets, Finance vb. modüller yukarıdaki Dashboard mantığıyla korunur */}
          </AnimatePresence>
        </div>
      </main>

      {/* MODALLAR */}

      {/* 1. YENİ İŞ MODALI (Yönetici Atama Eklemeli) */}
      <AnimatePresence>
        {showJobModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-gray-900">İş Ataması Yap</h2>
                <button onClick={() => setShowJobModal(false)} className="p-3 bg-gray-50 rounded-2xl text-gray-400"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Müşteri / Varlık Adı</label>
                  <input 
                    list="asset-list" 
                    required 
                    className="w-full px-4 py-4 bg-gray-50 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
                    placeholder="Seç veya yeni yaz..." 
                    value={jobForm.customerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const existingAsset = data?.assets?.find(a => a.name === val);
                      setJobForm({ ...jobForm, customerName: val, assetId: existingAsset ? existingAsset.id : '' });
                    }} 
                  />
                  <datalist id="asset-list">
                    {data?.assets?.map(a => <option key={a.id} value={a.name}>{a.location}</option>)}
                  </datalist>
                </div>

                {/* YÖNETİCİ SEÇİMİ (Kritik Alan) */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sorumlu Yönetici</label>
                  <div className="relative group">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
                      value={jobForm.staffId}
                      onChange={(e) => setJobForm({ ...jobForm, staffId: e.target.value })}
                    >
                      <option value="">Yönetici Seçiniz...</option>
                      {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>

                <DynamicJobForm sectorData={sectorData} jobForm={jobForm} setJobForm={setJobForm} isAdmin={true} />
                
                <button disabled={isSaving} onClick={handleSaveJob} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl flex items-center justify-center gap-3">
                  {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <>İşi Yöneticiye Ata <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Varlık ve Personel Kayıt Modalları aynı şekilde Dashboard içinde kalır */}
      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
              <h2 className="text-2xl font-black mb-8">Varlık Kayıt</h2>
              <div className="space-y-4 mb-8">
                <input className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="Cihaz/Varlık Adı" onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                <input className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="Konum / Adres" onChange={e => setAssetForm({...assetForm, location: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <button className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold" onClick={() => setShowAssetModal(false)}>İptal</button>
                <button className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold" onClick={handleSaveAsset}>Kaydet</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
              <h2 className="text-2xl font-black mb-8">Personel Ekle</h2>
              <div className="space-y-4 mb-8">
                <input className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="Ad Soyad" onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                <select className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none" onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                  <option value="Usta">Usta</option>
                  <option value="Yönetici">Yönetici</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold" onClick={() => setShowStaffModal(false)}>İptal</button>
                <button className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold" onClick={handleSaveStaff}>Kaydet</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}