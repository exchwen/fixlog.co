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
  UserCheck
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

  // Yeni İş Emri Modalı State'leri
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [jobForm, setJobForm] = useState({
    customerName: '',
    assetId: '',
    workType: '',
    dynamicFields: {},
  });

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard-data?slug=${slug}`);
      const result = await res.json();
      setData(result);
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

  const filteredJobs = data?.jobs?.filter(job => 
    job.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sectorData = sectorDataFile.sectors[data?.sector] || null;

  const handleSaveJob = async () => {
    if (!jobForm.customerName || !jobForm.workType) {
      return alert('Lütfen müşteri adını ve iş tipini seçiniz.');
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
          details: jobForm.dynamicFields,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setJobForm({ customerName: '', assetId: '', workType: '', dynamicFields: {} });
        fetchDashboardData();
      }
    } catch (err) {
      alert('Kayıt sırasında hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

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
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Dükkan Sahibi</h2>
              <h1 className="text-xl font-black text-gray-900 leading-none">{data?.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Müşteri veya iş ara..." 
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
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                {/* İstatistik Kartları */}
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

                {/* Son İşler ve Finans Özeti */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="text-lg font-black text-gray-900">Son İş Akışı</h3>
                      <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 flex items-center gap-2 transition-all">
                        <Plus className="w-4 h-4" /> Yeni İş Emri
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50/50">
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Müşteri</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hizmet</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {data?.jobs?.slice(0, 5).map((job) => (
                            <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-8 py-5 font-bold text-gray-900 text-sm">{job.customer_name}</td>
                              <td className="px-8 py-5 text-gray-500 text-xs font-bold uppercase">{job.work_type}</td>
                              <td className="px-8 py-5 text-right"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{job.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-gray-200">
                      <div className="text-xs font-bold opacity-50 uppercase tracking-widest mb-1">Ciro (Bu Ay)</div>
                      <div className="text-3xl font-black mb-6">₺0.00</div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold border-t border-white/10 pt-4">
                          <span className="opacity-50">Tahsil Edilen</span>
                          <span className="text-green-400">₺0.00</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="opacity-50">Bekleyen Ödeme</span>
                          <span className="text-amber-400">₺0.00</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Hızlı Duyurular</h4>
                      <p className="text-sm text-gray-500 italic">Saha ekiplerine duyuru yapmak için mesaj oluşturun.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'jobs' && (
              <motion.div key="jobs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">Tüm İş Emirleri</h3>
                  <div className="flex gap-2">
                    <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600"><AlertCircle className="w-5 h-5" /></button>
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold">Yeni İş</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Müşteri</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">İş Tipi</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Oluşturma</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="text-[10px] font-black text-blue-600">#{job.id}</div>
                            <div className="font-bold text-gray-900 text-sm">{job.customer_name}</div>
                          </td>
                          <td className="px-8 py-5 font-bold text-gray-500 text-xs">{job.work_type}</td>
                          <td className="px-8 py-5 text-gray-400 text-xs font-medium">{formatDate(job.created_at)}</td>
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
                  <h3 className="text-2xl font-black text-gray-900">Saha Ekibi</h3>
                  <button className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Personel Ekle
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data?.staff?.length > 0 ? data.staff.map((member) => (
                    <div key={member.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black">{member.name.charAt(0)}</div>
                        <div>
                          <div className="font-bold text-gray-900">{member.name}</div>
                          <div className="text-[10px] font-black text-blue-600 uppercase">{member.role}</div>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Aktif</span>
                    </div>
                  )) : (
                    <div className="col-span-full bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center text-gray-400">
                      Henüz kayıtlı bir personel bulunamadı.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'assets' && (
              <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-gray-900">Varlıklar & QR</h3>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Varlık Kaydet
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {data?.assets?.length > 0 ? data.assets.map((asset) => (
                    <div key={asset.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4"><Box className="w-5 h-5 text-gray-400" /></div>
                      <div className="font-bold text-gray-900 mb-1">{asset.name}</div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-tighter mb-4"><MapPin className="w-3 h-3" /> {asset.location}</div>
                      <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all">QR Kod Yazdır</button>
                    </div>
                  )) : (
                    <div className="col-span-full bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center text-gray-400 font-bold">
                      Henüz kayıtlı cihaz/varlık yok.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {['stock', 'finance', 'settings'].includes(activeTab) && (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-20 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><Settings className="w-10 h-10 text-gray-200" /></div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{activeTab.toUpperCase()} Modülü</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">Bu bölüm üzerinde çalışmalar devam ediyor. Çok yakında burada gerçek verilerinizi göreceksiniz.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* YENİ İŞ MODALI */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-8 overflow-hidden max-h-[90vh] flex flex-col relative">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">İş Emri Oluştur</h2>
                <button onClick={() => setShowModal(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all text-gray-400"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="space-y-8 overflow-y-auto flex-1 pr-2 custom-scrollbar pb-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kayıtlı Varlık Seç (Opsiyonel)</label>
                  <div className="relative group">
                    <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <select 
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all appearance-none" 
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedName = e.target.options[e.target.selectedIndex].text;
                        setJobForm({...jobForm, assetId: selectedId, customerName: selectedId ? selectedName : ''});
                      }}
                    >
                      <option value="">Yeni Bina/Müşteri...</option>
                      {data?.assets?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>

                {!jobForm.assetId && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Müşteri / Bina Adı</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input required type="text" placeholder="Örn: Mecidiyeköy İş Merkezi" className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" value={jobForm.customerName} onChange={(e) => setJobForm({ ...jobForm, customerName: e.target.value })} />
                    </div>
                  </div>
                )}

                <DynamicJobForm sectorData={sectorData} jobForm={jobForm} setJobForm={setJobForm} />
              </div>

              <div className="pt-8 border-t border-gray-50 shrink-0">
                <button disabled={isSaving} onClick={handleSaveJob} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                  {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <>İş Emrini Başlat <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBİL MENÜ OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed top-0 left-0 bottom-0 w-80 bg-white z-50 p-8 lg:hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between mb-10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl ring-4 ring-blue-50">!</div>
                  <span className="font-black text-gray-900 uppercase tracking-tighter">İş Dökümü</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-50 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-6 py-4 text-base font-bold rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-blue-50'}`}
                  >
                    <item.icon className="w-6 h-6" /> {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}