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
  AlertCircle
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
    assetId: '', // Varlık ID eklendi
    workType: '',
    dynamicFields: {},
  });

  // Veritabanından verileri çekme fonksiyonu
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

  // Tarih formatlama yardımcısı
  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih yok';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  // Arama filtresi
  const filteredJobs = data?.jobs?.filter(job => 
    job.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Sektör verisi çekme
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
          details: jobForm.dynamicFields,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setJobForm({ customerName: '', workType: '', dynamicFields: {} });
        fetchDashboardData(); // Listeyi yenile
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
          <span className="text-lg font-bold text-gray-900">İş Dökümü</span>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => (
            <button key={item.id} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-blue-600 rounded-2xl transition-all">
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
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Dükkan Sahibi</h2>
              <h1 className="text-xl font-black text-gray-900 leading-none">{data?.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="İş ara..." 
                className="bg-transparent border-none text-sm outline-none w-40" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-10 space-y-10 max-w-[1600px]">
          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {data?.stats?.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <ClipboardList className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* İş Tablosu */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Güncel İş Akışı</h3>
              <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg flex items-center gap-2 transition-all">
                <Plus className="w-4 h-4" /> Yeni İş Emri
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Müşteri / Konum</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hizmet Tipi</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarih</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                        <td className="px-8 py-5">
                          <div className="font-bold text-gray-900 text-sm">{job.customer_name}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">İş No: #{job.id}</div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-bold text-gray-600">{job.work_type}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-300" /> {formatDate(job.created_at)}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="w-10 h-10 text-gray-200" />
                          <div className="text-gray-400 font-bold text-sm">Aranan kriterde bir iş bulunamadı.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* YENİ İŞ MODALI */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900">İş Emri Oluştur</h2>
                <button onClick={() => setShowModal(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8 overflow-y-auto space-y-8">
                {/* Varlık Seçimi Listesi */}
<div className="space-y-2">
  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Kayıtlı Varlık Seç (Opsiyonel)</label>
  <select 
    className="w-full px-4 py-4 bg-gray-50 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all appearance-none" 
    onChange={(e) => {
      const selectedId = e.target.value;
      const selectedName = e.target.options[e.target.selectedIndex].text;
      setJobForm({...jobForm, assetId: selectedId, customerName: selectedId ? selectedName : ''});
    }}
  >
    <option value="">Yeni Bina/Müşteri Girişi yap...</option>
    {data?.assets?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
  </select>
</div>

{/* Eğer varlık seçilmediyse bina adını manuel gir */}
{!jobForm.assetId && (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Müşteri / Bina Adı</label>
    <input required type="text" placeholder="Örn: Mecidiyeköy İş Merkezi" className="w-full px-4 py-4 bg-gray-50 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={jobForm.customerName} onChange={(e) => setJobForm({ ...jobForm, customerName: e.target.value })} />
  </div>
)}
                {/* Dinamik Form */}
                <DynamicJobForm sectorData={sectorData} jobForm={jobForm} setJobForm={setJobForm} />
              </div>
              <div className="p-8 border-t border-gray-50 bg-gray-50/50">
                <button disabled={isSaving} onClick={handleSaveJob} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-[1.5rem] font-bold text-sm shadow-xl flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>İş Emrini Başlat <CheckCircle2 className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}