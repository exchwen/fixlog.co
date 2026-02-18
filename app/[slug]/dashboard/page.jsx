'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, ArrowRight, Settings } from 'lucide-react';

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
import AssetQRModal from '@/components/modals/AssetQRModal';

const API_URL = 'https://backend.isdokumu.workers.dev';

export default function PatronDashboard() {
  const { slug } = useParams();
  
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState(null); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // MODAL STATE'LERİ
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  
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
  const [assetForm, setAssetForm] = useState({ name: '', location: '', apartmentName: '', deviceDetails: '', customerId: '', newCustomer: { name: '', contact: '', address: '', taxInfo: '' } });
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'Usta', branch: '', status: 'Aktif' });
  const [customerForm, setCustomerForm] = useState({ name: '', contact: '', address: '', taxInfo: '', assetAction: '', newAsset: { name: '', location: '', apartmentName: '', deviceDetails: '' } });
  const [stockForm, setStockForm] = useState({ itemName: '', quantity: '', unitName: 'Adet', unitPrice: '', supplierName: '', supplierPhone: '' });
  const [settingsForm, setSettingsForm] = useState({ companyName: '', ownerName: '', sector: '', address: '', taxInfo: '', phone: '', emergencyPhone: '' });
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
            emergencyPhone: result.emergencyPhone || ''
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
      if (res.ok) { if(closeFn) closeFn(false); if(resetFn) resetFn(); await fetchData(); } else { alert("Veritabanı kayıt hatası."); }
    } catch (err) { alert("Bağlantı kurulamadı."); } finally { setIsSaving(false); }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    await fetch(`${API_URL}/send-message`, { method: 'POST', body: JSON.stringify({ slug, senderId: 'PATRON', receiverId: activeChatId, message: messageInput }) });
    setMessageInput(''); fetchMessages();
  };

  // --- EKSİK BİLGİ KONTROLÜ (GÜNCELLENDİ: Tüm kutular denetleniyor) ---
  const isCompanyDataIncomplete = useMemo(() => {
    if (!data) return false;
    
    const d = data || {};

    const name = d.name?.trim().toLowerCase() || '';
    const owner = d.ownerName?.trim().toLowerCase() || '';
    const phone = d.phone?.trim() || '';
    const emergencyPhone = d.emergencyPhone?.trim() || '';
    const address = d.address?.trim() || '';
    const taxInfo = d.taxInfo?.trim() || '';
    const sector = d.sector?.trim() || '';

    // Varsayılan veya boş değer kontrolü
    const isDefaultName = name === 'işletme' || name === '';
    const isDefaultOwner = owner === 'kullanıcı' || owner === 'yönetici' || owner === '';
    
    return (
      isDefaultName || isDefaultOwner || !phone || !emergencyPhone || !address || !taxInfo || !sector
    );
  }, [data]);

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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 text-sm overflow-hidden relative selection:bg-blue-100">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none z-0"></div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        <Header data={data} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <div className="p-6 space-y-6 max-w-6xl mx-auto w-full pb-24">
          {activeTab === 'home' && <HomeTab data={data} setShowJobModal={setShowJobModal} statusColors={statusColors} setSelectedJob={setSelectedJob} setActiveTab={setActiveTab} />}
          {activeTab === 'jobs' && <JobsTab data={data} setShowJobModal={setShowJobModal} statusColors={statusColors} setSelectedJob={setSelectedJob} />}
          {activeTab === 'pending' && <PendingJobsTab data={data} setSelectedJob={setSelectedJob} />}
          {activeTab === 'team' && <TeamTab data={data} setShowStaffModal={setShowStaffModal} setShowJobModal={setShowJobModal} setShowStaffDetail={setShowStaffDetail} setEditStaffForm={setEditStaffForm} setIsEditingStaff={setIsEditingStaff} setActiveChatId={setActiveChatId} setIsChatOpen={setIsChatOpen} setSelectedJob={setSelectedJob} />}
          {activeTab === 'customers' && <CustomersTab data={data} setShowCustomerModal={setShowCustomerModal} setShowCustomerDetail={setShowCustomerDetail} />}
          {activeTab === 'stock' && <StockTab data={data} setShowStockModal={setShowStockModal} />}
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
        handleAction={handleAction} isSaving={isSaving} data={data}
        selectedJob={selectedJob} setSelectedJob={setSelectedJob}
      />
      
      <AssetQRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} asset={selectedQRAsset} />

      {/* --- ZORUNLU AYARLAR MODALI --- */}
      <AnimatePresence>
        {isCompanyDataIncomplete && activeTab !== 'settings' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              key="setup-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-start gap-4">
                <div className="bg-amber-100 p-3 rounded-full text-amber-600 animate-pulse">
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Kurulumu Tamamla</h2>
                  <p className="text-sm text-slate-600 mt-1">Lütfen işlemlerinize devam edebilmek için eksik bilgileri doldurunuz.</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="font-bold text-slate-700 mb-2">Eksik Olan Bilgiler:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {(data?.name?.trim().toLowerCase() === 'işletme' || !data?.name?.trim()) && <li>Firma Ünvanı</li>}
                    {(data?.ownerName?.trim().toLowerCase() === 'kullanıcı' || data?.ownerName?.trim().toLowerCase() === 'yönetici' || !data?.ownerName?.trim()) && <li>Yetkili Ad Soyad</li>}
                    {!data?.sector?.trim() && <li>Faaliyet Sektörü</li>}
                    {!data?.phone?.trim() && <li>İşletme Telefonu</li>}
                    {!data?.emergencyPhone?.trim() && <li>Acil Durum Hattı (7/24)</li>}
                    {!data?.address?.trim() && <li>Adres Bilgisi</li>}
                    {!data?.taxInfo?.trim() && <li>Vergi Numarası</li>}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 w-full justify-center"
                >
                  <Settings size={16} />
                  Ayarları Tamamla
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}