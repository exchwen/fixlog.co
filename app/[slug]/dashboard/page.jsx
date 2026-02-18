'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, ArrowRight, Settings, Filter, ShieldAlert, Info, MapPin, Check } from 'lucide-react';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ChatPanel from '@/components/chat/ChatPanel';
import DashboardModals from '@/components/modals/DashboardModals';

import HomeTab from '@/components/patron/HomeTab';
import JobsTab from '@/components/patron/JobsTab';
import TeamTab from '@/components/patron/TeamTab';
import CustomersTab from '@/components/patron/CustomersTab';
import StockTab from '@/components/patron/StockTab';
import FinanceTab from '@/components/patron/FinanceTab';
import AssetsTab from '@/components/patron/AssetsTab';
import SettingsTab from '@/components/patron/SettingsTab';
import PendingJobsTab from '@/components/patron/PendingJobsTab'; 
import AlertsTab from '@/components/patron/AlertsTab'; // YENİ IMPORT
import AssetQRModal from '@/components/modals/AssetQRModal';

const API_URL = 'https://backend.isdokumu.workers.dev';

export default function PatronDashboard() {
  const { slug } = useParams();
  
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState(null); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // STOK KATEGORİ FİLTRESİ
  const [stockCategory, setStockCategory] = useState('Tümü');

  // MODAL STATE'LERİ
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  
  const [showSupplierListModal, setShowSupplierListModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [showStaffDetail, setShowStaffDetail] = useState(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(null);
  const [showAssetDetail, setShowAssetDetail] = useState(null);
  
  const [selectedJob, setSelectedJob] = useState(null); 
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRAsset, setSelectedQRAsset] = useState(null);

  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // FORMLAR
  const [jobForm, setJobForm] = useState({ customerName: '', assetId: '', staffId: '', workType: 'Genel Görev', jobType: 'Anlık', scheduledDate: '', taskNote: '' });
  const [assetForm, setAssetForm] = useState({ name: '', location: '', apartmentName: '', deviceDetails: '', customerId: '', customerMode: 'NONE', newCustomer: { name: '', contact: '', address: '', taxInfo: '' } });
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' });
  const [customerForm, setCustomerForm] = useState({ name: '', contact: '', address: '', taxInfo: '', assetAction: '', assetMode: 'NONE', newAsset: { name: '', location: '', apartmentName: '', deviceDetails: '' } });
  const [stockForm, setStockForm] = useState({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', category: '', supplierId: '', supplierMode: 'NONE', newSupplier: { name: '', phone: '' } });
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '' });
  const [settingsForm, setSettingsForm] = useState({ companyName: '', ownerName: '', sector: '', address: '', taxInfo: '', phone: '', emergencyPhone: '', whatsappPhone: '', logo: '' });
  const [editStaffForm, setEditStaffForm] = useState({ name: '', phone: '', role: '', branch: '', status: '' });

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
            taxInfo: result.taxInfo || '', 
            phone: result.phone || '',
            emergencyPhone: result.emergencyPhone || '',
            whatsappPhone: result.whatsappPhone || '',
            logo: result.logo || ''
        });
      }
    } catch (err) { console.error("Veri çekilemedi:", err); } finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`${API_URL}/get-messages?slug=${slug}&staffId=${activeChatId}`);
      setMessages(await res.json() || []);
    } catch (err) {}
  };

  useEffect(() => { fetchData(); const int = setInterval(fetchData, 15000); return () => clearInterval(int); }, [slug]);
  useEffect(() => { if (isChatOpen && activeChatId) { fetchMessages(); const cInt = setInterval(fetchMessages, 4000); return () => clearInterval(cInt); } }, [isChatOpen, activeChatId]);

  const handleAction = async (endpoint, body, closeFn, resetFn) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, slug }) });
      if (res.ok) { 
        if(closeFn) closeFn(false); 
        if(resetFn) resetFn(); 
        await fetchData(); 
        return true; 
      } else { 
        if (endpoint !== 'update-settings') alert("Veritabanı kayıt hatası."); 
        return false; 
      }
    } catch (err) { 
      if (endpoint !== 'update-settings') alert("Bağlantı kurulamadı."); 
      return false; 
    } finally { 
      setIsSaving(false); 
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    await fetch(`${API_URL}/send-message`, { method: 'POST', body: JSON.stringify({ slug, senderId: 'PATRON', receiverId: activeChatId, message: messageInput }) });
    setMessageInput(''); fetchMessages();
  };

  // 🚨 ACİL DURUM KONTROLÜ VE KAPATMA FONKSİYONU
  const activeEmergencies = data?.activeEmergencies || [];
  const hasEmergency = activeEmergencies.length > 0;

  const handleResolveEmergency = async (emergencyId) => {
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/resolve-emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emergencyId, slug })
      });
      await fetchData(); 
    } catch (err) {
      alert("İşlem başarısız oldu.");
    } finally {
      setIsSaving(false);
    }
  };

  // ⚠️ ARIZA BİLDİRİM KONTROLÜ
  const pendingFaults = data?.pendingFaults || [];
  const hasFault = pendingFaults.length > 0;

  const handleResolveFault = async (faultId) => {
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/resolve-fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faultId, slug })
      });
      await fetchData(); 
    } catch (err) {
      alert("İşlem başarısız oldu.");
    } finally {
      setIsSaving(false);
    }
  };

  const isCompanyDataIncomplete = useMemo(() => {
    if (!data) return false;

    const name = (data.name || '').trim().toLowerCase();
    const owner = (data.ownerName || '').trim().toLowerCase();
    const phone = (data.phone || '').trim();
    const emergencyPhone = (data.emergencyPhone || '').trim();
    const address = (data.address || '').trim();
    const taxInfo = (data.taxInfo || '').trim();
    const sector = (data.sector || '').trim();

    const isDefaultName = name === 'işletme' || name === '';
    const isDefaultOwner = owner === 'kullanıcı' || owner === 'yönetici' || owner === '';
    
    return (
      isDefaultName || isDefaultOwner || !phone || !emergencyPhone || !address || !taxInfo || !sector
    );
  }, [data]);

  const filteredDataForTabs = useMemo(() => {
    if (!data) return null;
    if (activeTab !== 'stock' || stockCategory === 'Tümü') return data;

    const stockArray = data.stock || data.stocks || [];
    const filteredStocks = stockArray.filter((item) => item?.category === stockCategory);

    return {
      ...data,
      stock: data.stock ? filteredStocks : undefined,
      stocks: data.stocks ? filteredStocks : undefined,
    };
  }, [data, stockCategory, activeTab]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="mb-4"><ShieldCheck className="text-blue-500 w-12 h-12" /></motion.div>
      <div className="text-white font-black tracking-widest text-[11px] uppercase opacity-40">D1 Senkronize Ediliyor...</div>
    </div>
  );

  const statusColors = { 
    'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200', 
    'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    'Devam Ediyor': 'bg-blue-100 text-blue-700 border-blue-200', 
    'Gelecek': 'bg-slate-100 text-slate-600 border-slate-200',
    'İptal': 'bg-rose-100 text-rose-700 border-rose-200' 
  };

  return (
    <div className={`min-h-screen flex font-sans text-sm overflow-hidden relative selection:bg-blue-100 ${hasEmergency ? 'bg-rose-950' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* NORMAL ARKA PLAN DEKORLARI */}
      {!hasEmergency && (
        <>
          <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
          <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none z-0"></div>
        </>
      )}

      {/* 🚨 ACİL DURUM KIRMIZI EKRAN UYARISI (TAM EKRAN KAPLAMA) */}
      <AnimatePresence>
        {hasEmergency && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-rose-600 flex flex-col items-center justify-center text-white p-6"
          >
            {/* Arka plan radar / nabız efekti */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="w-[800px] h-[800px] bg-rose-500/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
                <ShieldAlert size={100} className="text-white mb-6 animate-pulse" />
                <h1 className="text-5xl font-black mb-2 tracking-tight uppercase">Acil Durum Bildirildi!</h1>
                <p className="text-xl text-rose-100 mb-8 font-medium">Sahadan veya bir müşteriden acil durum butonu tetiklendi.</p>
                
                {/* Varlık Bilgileri ve Konumu */}
                <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 mb-8 w-full max-w-md text-left shadow-2xl">
                   <div className="text-rose-200 text-xs font-bold uppercase tracking-wider mb-1">İlgili Varlık & Konum</div>
                   <div className="text-2xl font-black text-white mb-2">{activeEmergencies[0]?.asset_name || 'Bilinmeyen Varlık'}</div>
                   <div className="flex items-center gap-2 text-rose-100"><MapPin size={18} /> {activeEmergencies[0]?.asset_location || 'Konum alınamadı'}</div>
                </div>

                <button 
                  onClick={() => handleResolveEmergency(activeEmergencies[0]?.id)}
                  disabled={isSaving}
                  className="bg-white text-rose-600 px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-rose-50 hover:scale-105 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                >
                  <ShieldCheck size={28} />
                  {isSaving ? 'Kapatılıyor...' : 'KONTROL ETTİM, ALARMI KAPAT'}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⚠️ SARI ARIZA BİLDİRİMİ MODALI */}
      <AnimatePresence>
        {hasFault && !hasEmergency && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99998] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
               className="bg-amber-400 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-amber-950 flex flex-col"
            >
               <div className="p-8 flex flex-col items-center text-center border-b border-amber-500/30">
                  <AlertTriangle size={64} className="mb-4 animate-bounce" />
                  <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">Arıza Bildirimi!</h2>
                  <p className="font-bold opacity-80 text-amber-900">Müşterinizden yeni bir arıza kaydı ulaştı.</p>
               </div>
               
               <div className="bg-white p-8 flex flex-col gap-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">İlgili Varlık & Konum</div>
                     <div className="font-black text-xl text-slate-800 leading-none mb-2">{pendingFaults[0]?.asset_name || 'Bilinmeyen Varlık'}</div>
                     <div className="text-slate-600 font-semibold flex items-center gap-1.5"><MapPin size={16} className="text-slate-400"/> {pendingFaults[0]?.asset_location || 'Konum belirtilmemiş'}</div>
                  </div>
                  
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Müşteri & Şikayet Detayı</div>
                     <div className="font-bold text-slate-800 text-base">{pendingFaults[0]?.reporter_name} - {pendingFaults[0]?.reporter_phone}</div>
                     <div className="text-slate-600 mt-3 text-sm italic border-l-4 border-amber-300 pl-3">"{pendingFaults[0]?.description}"</div>
                  </div>
                  
                  <button 
                    onClick={() => handleResolveFault(pendingFaults[0]?.id)} 
                    disabled={isSaving}
                    className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-amber-400 py-4.5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50 active:scale-95"
                  >
                    <Check size={24} /> 
                    {isSaving ? 'Kapatılıyor...' : 'GÖRÜLDÜ / BİLDİRİMİ KAPAT'}
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        <Header data={data} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <div className="p-6 space-y-6 max-w-6xl mx-auto w-full pb-24">
          {activeTab === 'home' && <HomeTab data={data} setShowJobModal={setShowJobModal} statusColors={statusColors} setSelectedJob={setSelectedJob} setActiveTab={setActiveTab} />}
          {activeTab === 'jobs' && <JobsTab data={data} setShowJobModal={setShowJobModal} statusColors={statusColors} setSelectedJob={setSelectedJob} />}
          {activeTab === 'pending' && <PendingJobsTab data={data} setSelectedJob={setSelectedJob} />}
          {activeTab === 'alerts' && <AlertsTab data={data} />} {/* YENİ SEKME EKLENDİ */}
          {activeTab === 'team' && <TeamTab data={data} setShowStaffModal={setShowStaffModal} setShowJobModal={setShowJobModal} setShowStaffDetail={setShowStaffDetail} setEditStaffForm={setEditStaffForm} setIsEditingStaff={setIsEditingStaff} setActiveChatId={setActiveChatId} setIsChatOpen={setIsChatOpen} setSelectedJob={setSelectedJob} />}
          {activeTab === 'customers' && <CustomersTab data={data} setShowCustomerModal={setShowCustomerModal} setShowCustomerDetail={setShowCustomerDetail} />}
          
          {activeTab === 'stock' && (
            <div className="flex flex-col space-y-4">
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end w-full">
                <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm flex items-center gap-2 z-20">
                  <Filter size={16} className="text-slate-400 ml-2" />
                  <span className="text-xs font-semibold text-slate-500">Kategori:</span>
                  <select 
                    value={stockCategory} 
                    onChange={(e) => setStockCategory(e.target.value)}
                    className="bg-slate-50 border-none text-sm font-bold text-slate-700 rounded-lg px-4 py-2 outline-none cursor-pointer hover:bg-slate-100 transition-colors appearance-none pr-8"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
                  >
                    <option value="Tümü">Tüm Kategoriler</option>
                    {Array.from(new Set((data?.stock || data?.stocks || []).map((s) => s?.category).filter(Boolean))).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
              <StockTab data={filteredDataForTabs} handleAction={handleAction} setShowStockModal={setShowStockModal} setShowSupplierModal={setShowSupplierModal} setShowSupplierListModal={setShowSupplierListModal} setShowCategoryModal={setShowCategoryModal} />
            </div>
          )}

          {activeTab === 'finance' && <FinanceTab data={data} />}
          {activeTab === 'assets' && <AssetsTab data={data} setShowAssetModal={setShowAssetModal} setShowAssetDetail={setShowAssetDetail} setShowQRModal={setShowQRModal} setSelectedQRAsset={setSelectedQRAsset} />}
          {activeTab === 'settings' && <SettingsTab settingsForm={settingsForm} setSettingsForm={setSettingsForm} handleAction={handleAction} isSaving={isSaving} />}
        </div>
      </main>

      <ChatPanel isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} activeChatId={activeChatId} setActiveChatId={setActiveChatId} data={data} messages={messages} messageInput={messageInput} setMessageInput={setMessageInput} sendMessage={sendMessage} />

      <DashboardModals 
        showStaffDetail={showStaffDetail} setShowStaffDetail={setShowStaffDetail} isEditingStaff={isEditingStaff} setIsEditingStaff={setIsEditingStaff} editStaffForm={editStaffForm} setEditStaffForm={setEditStaffForm}
        showCustomerDetail={showCustomerDetail} setShowCustomerDetail={setShowCustomerDetail}
        showAssetDetail={showAssetDetail} setShowAssetDetail={setShowAssetDetail}
        showJobModal={showJobModal} setShowJobModal={setShowJobModal} jobForm={jobForm} setJobForm={setJobForm}
        showAssetModal={showAssetModal} setShowAssetModal={setShowAssetModal} assetForm={assetForm} setAssetForm={setAssetForm}
        showStaffModal={showStaffModal} setShowStaffModal={setShowStaffModal} staffForm={staffForm} setStaffForm={setStaffForm}
        showCustomerModal={showCustomerModal} setShowCustomerModal={setShowCustomerModal} customerForm={customerForm} setCustomerForm={setCustomerForm}
        showStockModal={showStockModal} setShowStockModal={setShowStockModal} stockForm={stockForm} setStockForm={setStockForm}
        showSupplierModal={showSupplierModal} setShowSupplierModal={setShowSupplierModal} supplierForm={supplierForm} setSupplierForm={setSupplierForm}
        showSupplierListModal={showSupplierListModal} setShowSupplierListModal={setShowSupplierListModal}
        showCategoryModal={showCategoryModal} setShowCategoryModal={setShowCategoryModal}
        handleAction={handleAction} isSaving={isSaving} data={data}
        selectedJob={selectedJob} setSelectedJob={setSelectedJob}
      />
      
      <AssetQRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} asset={selectedQRAsset} companyName={data?.name} companyLogo={data?.logo} />

      {/* 🛠️ SİSTEM KURULUMU TAMAMLANMADI EKRANI (Ortada Büyük Modal) */}
      <AnimatePresence>
        {isCompanyDataIncomplete && activeTab !== 'settings' && !hasEmergency && !hasFault && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              key="setup-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl p-10 flex flex-col items-center text-center border border-slate-100"
            >
              <div className="bg-blue-50 text-blue-500 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Info size={48} strokeWidth={2.5} />
              </div>
              
              <h2 className="text-[26px] font-black text-slate-800 mb-4 leading-tight tracking-tight">Sistem Kurulumu<br/>Tamamlanmadı</h2>
              
              <p className="text-[15px] text-slate-500 mb-10 font-medium leading-relaxed px-2">
                Lütfen sol menüden <span className="font-bold text-slate-700">'Ayarlar'</span> sekmesine giderek işletme bilgilerinizi eksiksiz doldurunuz.
              </p>
              
              <button 
                onClick={() => setActiveTab('settings')}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4.5 rounded-2xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
              >
                Ayarlara Git <ArrowRight size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}