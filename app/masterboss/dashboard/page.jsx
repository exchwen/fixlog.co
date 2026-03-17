"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Users, Activity, BarChart3, LogOut, TicketCheck, Gift, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function MasterbossDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("companies");
  const [replyTexts, setReplyTexts] = useState({});

  // Subscription Control States
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [manageForm, setManageForm] = useState({ subscriptionStatus: '', freeMonths: '', customDiscount: '', cancelTrial: false });
  const [isSaving, setIsSaving] = useState(false);

  // 🚀 YENİ: Bilgi Modalı Stateleri
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoCompany, setInfoCompany] = useState(null);

  // 🚀 YENİ: Ticket Modalı State'i
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("masterbossToken");
      if (!token) {
        router.replace("/masterboss");
        return;
      }

      try {
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
        const res = await fetch(`${BASE_URL}/masterboss-data`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.status === 403) {
          localStorage.removeItem("masterbossToken");
          router.replace("/masterboss");
          return;
        }

        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          toast.error(json.error || "Veri yüklenemedi!");
        }
      } catch (error) {
        toast.error("Bağlantı hatası!");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("masterbossToken");
    router.replace("/masterboss");
  };

  const handleUpdateSubscription = async () => {
    const token = localStorage.getItem("masterbossToken");
    if (!token) return toast.error("Yetkisiz işlem!");

    setIsSaving(true);
    const toastId = toast.loading("Güncelleniyor...");
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
      const res = await fetch(`${BASE_URL}/masterboss-update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            companySlug: selectedCompany.slug, 
            subscriptionStatus: manageForm.subscriptionStatus, 
            freeMonths: manageForm.freeMonths === '' ? null : parseInt(manageForm.freeMonths),
            customDiscount: manageForm.customDiscount === '' ? null : parseInt(manageForm.customDiscount),
            cancelTrial: manageForm.cancelTrial
        })
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success("Firma aboneliği güncellendi!", { id: toastId });
        setShowManageModal(false);
        // Refresh data
        const resData = await fetch(`${BASE_URL}/masterboss-data`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const jsonData = await resData.json();
        if(jsonData.success) setData(jsonData);
      } else {
        toast.error(result.error || "Hata oluştu!", { id: toastId });
      }
    } catch (err) {
      toast.error("Bağlantı hatası", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // 🚀 YENİ: Artık eylemin (action) türünü de alıyor ('reply' veya 'resolve')
  const handleTicketAction = async (ticket, actionType) => {
    const token = localStorage.getItem("masterbossToken");
    if (!token) return toast.error("Yetkisiz işlem!");

    const replyMessage = replyTexts[ticket.id] || "";
    if (actionType === 'reply' && !replyMessage.trim()) return toast.error("Yanıt göndermek için bir mesaj yazmalısınız.");

    const toastId = toast.loading("İşleniyor...");
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.isdokumu.workers.dev";
      const res = await fetch(`${BASE_URL}/masterboss-resolve-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId: ticket.id, companySlug: ticket.company_slug, replyMessage, action: actionType })
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success(actionType === 'resolve' ? "Talep çözüldü!" : "Yanıt gönderildi!", { id: toastId });
        
        const updatedStatus = actionType === 'resolve' ? 'Çözüldü' : ticket.status;
        const newReplies = result.updatedReplies || ticket.replies;

        setData(prev => ({
          ...prev,
          tickets: prev.tickets.map(t => 
             t.id === ticket.id 
               ? { ...t, status: updatedStatus, replies: newReplies } 
               : t
          )
        }));

        if (selectedTicket && selectedTicket.id === ticket.id) {
             setSelectedTicket(prev => ({ ...prev, status: updatedStatus, replies: newReplies }));
        }

        setReplyTexts(prev => ({ ...prev, [ticket.id]: "" }));
      } else {
        toast.error(result.error || "Hata oluştu!", { id: toastId });
      }
    } catch (err) {
      toast.error("Bağlantı hatası", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { companies = [], tickets = [], referrals = [], rewards = [] } = data || {};

  const totalAssets = companies.reduce((acc, c) => acc + (c.total_assets || 0), 0);
  const totalStaff = companies.reduce((acc, c) => acc + (c.total_staff || 0), 0);
  const activeCompanies = companies.filter(c => c.subscription_status === 'active').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500/30">
      
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Masterboss</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all text-sm font-medium border border-neutral-700/50"
          >
            <LogOut className="w-4 h-4" /> Çıkış
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={Building2} label="Toplam Firma" value={companies.length} ext={`${activeCompanies} Aktif Üye`} color="from-blue-500 to-indigo-600" />
          <MetricCard icon={BarChart3} label="Sistemdeki Varlık" value={totalAssets} ext="Global Asansör Hacmi" color="from-rose-500 to-red-600" />
          <MetricCard icon={Users} label="Sistemdeki Personel" value={totalStaff} ext="Kayıtlı Saha Çalışanı" color="from-emerald-500 to-teal-600" />
          <MetricCard icon={Gift} label="Referans Havuzu" value={referrals.filter(r=>r.is_verified===1).length} ext="Başarılı Davet Sayısı" color="from-amber-500 to-orange-600" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <TabButton active={activeTab === "companies"} onClick={() => setActiveTab("companies")} icon={Building2} label="Firmalar & Abonelikler" />
          <TabButton active={activeTab === "tickets"} onClick={() => setActiveTab("tickets")} icon={TicketCheck} label={`Destek Talepleri (${tickets.filter(t=>t.status !== 'Resolved').length})`} />
          <TabButton active={activeTab === "referrals"} onClick={() => setActiveTab("referrals")} icon={Gift} label="Hediye Havuzları" />
        </div>

        {/* Content Area */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden"
        >
          {activeTab === "companies" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Firma Kodu (Slug)</th>
                    <th className="px-6 py-4 font-medium">Firma Adı / Sahibi</th>
                    <th className="px-6 py-4 font-medium">Abonelik Türü</th>
                    <th className="px-6 py-4 font-medium">Bitiş/Kesim Tarihi</th>
                    <th className="px-6 py-4 font-medium">Kurulum</th>
                    <th className="px-6 py-4 font-medium text-right">Eylemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {companies.map((c) => (
                    <tr key={c.slug} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-neutral-300">
                        {c.slug}
                        <div className="text-xs text-neutral-500 mt-1">Ref: {c.referral_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{c.company_name}</div>
                        <div className="text-neutral-500">{c.owner_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          c.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          c.subscription_status === 'trialing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {c.subscription_status?.toUpperCase() || 'BİLİNMİYOR'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-400">
                        {c.subscription_status === 'trialing' ? (
                          c.trial_ends_at ? new Date(c.trial_ends_at).toLocaleDateString("tr-TR") : '-'
                        ) : (
                          c.billing_cycle_anchor ? new Date(c.billing_cycle_anchor).toLocaleDateString("tr-TR") : '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-neutral-400">
                        <div>Varlık: <span className="text-white">{c.total_assets}</span></div>
                        <div>Personel: <span className="text-white">{c.total_staff}</span></div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* 🚀 YENİ: BİLGİ BUTONU */}
                        <button 
                          onClick={() => { setInfoCompany(c); setShowInfoModal(true); }}
                          className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors mr-4"
                        >
                          Bilgi
                        </button>
                        
                        <button 
                          onClick={() => { 
                            setSelectedCompany(c); 
                            setManageForm({ 
                              subscriptionStatus: c.subscription_status || 'trialing', 
                              freeMonths: c.free_months_balance !== undefined && c.free_months_balance !== null ? c.free_months_balance : '', 
                              customDiscount: c.custom_base_price !== undefined && c.custom_base_price !== null ? c.custom_base_price : '', 
                              cancelTrial: false 
                            }); 
                            setShowManageModal(true); 
                          }} 
                          className="text-rose-500 hover:text-rose-400 text-sm font-medium transition-colors"
                        >
                          Yönet
                        </button>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">Henüz kayıtlı firma yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

{activeTab === "tickets" && (
            <div className="p-6">
              <div className="space-y-4">
                {tickets.map(t => (
                  <div key={t.id} className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 flex gap-4 transition-colors items-center">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-white truncate">
                          {t.company_name || t.company_slug} 
                          <span className="text-neutral-400 text-xs ml-2">- {t.sender_name || 'Bilinmiyor'}</span>
                          <span className="text-neutral-500 text-sm ml-2">({t.type})</span>
                        </div>
                        <span className={`shrink-0 ml-2 text-xs px-2 py-1 rounded-full ${t.status === 'Çözüldü' || t.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {t.status === 'Çözüldü' || t.status === 'Resolved' ? 'Çözüldü' : 'Açık'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400 truncate">{t.message}</p>
                    </div>
                    <button 
                        onClick={() => setSelectedTicket(t)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
                    >
                        Bileti İncele
                    </button>
                  </div>
                ))}
                {tickets.length === 0 && <div className="text-center py-12 text-neutral-500">Destek talebi bulunmuyor.</div>}
              </div>
            </div>
          )}

          {activeTab === "referrals" && (
            <div className="overflow-x-auto">
              <div className="p-4 bg-neutral-800/20 border-b border-neutral-800 text-sm font-medium text-neutral-300">
                <span className="text-rose-400 font-bold">{referrals.filter(r=>r.is_verified).length}</span> Onaylı Davet &nbsp;&nbsp;|&nbsp;&nbsp;
                <span className="text-emerald-400 font-bold">{referrals.filter(r=>!r.is_verified).length}</span> Bekleyen Davet
              </div>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Davet Eden (Referans)</th>
                    <th className="px-6 py-4 font-medium">Kayıt Olan (Yeni Firma)</th>
                    <th className="px-6 py-4 font-medium">Durum</th>
                    <th className="px-6 py-4 font-medium">Davet Edendeki Kredi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {referrals.map((r) => {
                    const referrerReward = rewards.find(rew => rew.company_slug === r.referrer_company_slug);
                    return (
                      <tr key={r.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono font-medium text-amber-400">{r.referrer_company_slug}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-medium text-blue-400">{r.referred_company_slug}</div>
                        </td>
                        <td className="px-6 py-4">
                          {r.is_verified ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                              <TicketCheck className="w-3.5 h-3.5" /> İlk Ödeme Alındı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-500/20">
                              <AlertCircle className="w-3.5 h-3.5" /> Ödeme Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {referrerReward ? (
                             <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full border border-rose-500/20 font-bold">
                               <Gift className="w-4 h-4" /> {referrerReward.free_months_balance} Ay
                             </div>
                          ) : (
                             <div className="text-neutral-500">-</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {referrals.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">Henüz referans ilişkisi kurulmamış.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

      </div>

      {/* Subscription Manage Modal */}
      {showManageModal && selectedCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
          >
            <button 
              onClick={() => setShowManageModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors text-sm font-medium"
            >
              Kapat
            </button>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Firma Abonelik Yönetimi</h3>
            <div className="text-sm font-mono text-rose-400 mb-6">{selectedCompany.slug} <span className="text-neutral-500 text-xs ml-2">({selectedCompany.company_name})</span></div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Abonelik Durumu</label>
                <select 
                  value={manageForm.subscriptionStatus} 
                  onChange={(e) => setManageForm({...manageForm, subscriptionStatus: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl py-3 px-4 outline-none focus:border-rose-500 transition-colors appearance-none"
                >
                  <option value="active">Aktif (Kısıtlama Yok)</option>
                  <option value="trialing">Deneme Sürümü (Trial)</option>
                  <option value="past_due">Paywall'a Düşür (Ödeme Gecikti)</option>
                  <option value="canceled">İptal Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Ücretsiz Ay Hediye Et</label>
                <input 
                  type="number" 
                  placeholder="Firmaya kaç ay hediye edeceksiniz? Örn: 3"
                  value={manageForm.freeMonths} 
                  onChange={(e) => setManageForm({...manageForm, freeMonths: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl py-3 px-4 outline-none focus:border-rose-500 transition-colors placeholder-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Özel Fiyat Tanımla (₺)</label>
                <input 
                  type="number" 
                  placeholder="Boş bırakılırsa standart tarife (örn: 3000₺) uygulanır"
                  value={manageForm.customDiscount} 
                  onChange={(e) => setManageForm({...manageForm, customDiscount: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl py-3 px-4 outline-none focus:border-rose-500 transition-colors placeholder-neutral-600"
                />
              </div>

              {selectedCompany.subscription_status === 'trialing' && (
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mt-4">
                  <input 
                    type="checkbox" 
                    id="cancelTrial"
                    checked={manageForm.cancelTrial} 
                    onChange={(e) => setManageForm({...manageForm, cancelTrial: e.target.checked})}
                    className="w-5 h-5 rounded border-rose-500 text-rose-500 focus:ring-rose-500/20 bg-neutral-800"
                  />
                  <label htmlFor="cancelTrial" className="text-sm text-rose-300 font-medium cursor-pointer">Deneme sürümünü iptal et ve anında ödemeye (Paywall'a) düşür</label>
                </div>
              )}
            </div>

            <button 
              onClick={handleUpdateSubscription}
              disabled={isSaving}
              className="mt-8 w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? "Değişiklikler Kaydediliyor..." : "Ayarları Kaydet ve Uygula"}
            </button>
          </motion.div>
        </div>
      )}

      {/* 🚀 YENİ: Ticket Sohbet Modalı */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col h-[85vh]"
          >
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        {selectedTicket.company_slug}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${selectedTicket.status === 'Çözüldü' || selectedTicket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                           {selectedTicket.status === 'Çözüldü' || selectedTicket.status === 'Resolved' ? 'Çözüldü' : 'Açık'}
                        </span>
                    </h3>
                    <div className="text-sm text-neutral-500 mt-1">{selectedTicket.type} • {new Date(selectedTicket.created_at).toLocaleString('tr-TR')}</div>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-neutral-500 hover:text-white transition-colors text-sm font-medium">Kapat</button>
            </div>

            {/* Mesaj Alanı (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {/* Orijinal Mesaj */}
                <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-800/50">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 font-bold">İlk Talep Mesajı</div>
                    <p className="text-sm text-neutral-200 leading-relaxed">{selectedTicket.message}</p>
                </div>

                {/* Yanıtlar */}
                {(() => {
                    let replies = [];
                    try { replies = JSON.parse(selectedTicket.replies || '[]'); } catch(e) {}
                    
                    return replies.map((reply, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl text-sm max-w-[85%] ${reply.sender === 'masterboss' ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50 ml-auto rounded-tr-sm' : 'bg-neutral-800/80 text-neutral-200 mr-auto rounded-tl-sm'}`}>
                            <div className="flex justify-between items-center mb-2 gap-4">
                                <span className={`text-[10px] font-black uppercase tracking-wider ${reply.sender === 'masterboss' ? 'text-blue-400' : 'text-neutral-500'}`}>
                                    {reply.sender === 'masterboss' ? 'Siz (Masterboss)' : selectedTicket.company_slug}
                                </span>
                                <span className="text-[9px] opacity-50 font-mono">{new Date(reply.date).toLocaleString('tr-TR')}</span>
                            </div>
                            <p className="leading-relaxed">{reply.message}</p>
                        </div>
                    ));
                })()}
            </div>

            {/* Yanıt Gönderme Alanı */}
            {selectedTicket.status !== 'Çözüldü' && selectedTicket.status !== 'Resolved' ? (
                <div className="p-6 border-t border-neutral-800 bg-neutral-900/50 rounded-b-3xl shrink-0">
                    <textarea
                        value={replyTexts[selectedTicket.id] || ""}
                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [selectedTicket.id]: e.target.value }))}
                        placeholder="Yanıtınızı buraya yazın..."
                        className="w-full bg-neutral-950 border border-neutral-700 text-white text-sm rounded-xl p-4 focus:border-blue-500 outline-none resize-none transition-colors mb-3"
                        rows="3"
                    />
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => handleTicketAction(selectedTicket, 'reply')}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
                        >
                            Gönder
                        </button>
                        <button 
                            onClick={() => handleTicketAction(selectedTicket, 'resolve')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                        >
                            Çözüldü İşaretle
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-6 border-t border-neutral-800 bg-emerald-500/5 rounded-b-3xl text-center shrink-0">
                    <div className="text-sm font-bold text-emerald-500 flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> Bu talep çözülmüş olarak kapatıldı.
                    </div>
                </div>
            )}
          </motion.div>
        </div>
      )}

      {/* 🚀 YENİ: Company Info Modal */}
      {showInfoModal && infoCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors text-sm font-medium"
            >
              Kapat
            </button>
            <div className="flex items-center gap-4 mb-6">
              {infoCompany.logo ? (
                <img src={infoCompany.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover bg-neutral-800" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center"><Building2 className="w-8 h-8 text-neutral-500"/></div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{infoCompany.company_name}</h3>
                <div className="text-sm font-mono text-blue-400">{infoCompany.slug}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBox label="Sahibi / Yetkili" value={infoCompany.owner_name} />
              <InfoBox label="Sektör" value={infoCompany.sector} />
              <InfoBox label="Kayıt Tarihi" value={new Date(infoCompany.created_at).toLocaleDateString('tr-TR')} />
              <InfoBox label="Vergi Bilgileri" value={infoCompany.tax_info} />
              <InfoBox label="Açık Adres" value={infoCompany.address} fullWidth />
              
              <div className="col-span-1 md:col-span-2 border-t border-neutral-800 my-2 pt-4">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">İletişim Bilgileri</h4>
              </div>
              
              <InfoBox label="E-Posta (Admin)" value={infoCompany.owner_email || 'Belirtilmemiş'} />
              <InfoBox label="Ana Telefon" value={infoCompany.phone} />
              <InfoBox label="WhatsApp" value={infoCompany.whatsapp_phone} />
              <InfoBox label="Acil Durum Hattı" value={infoCompany.emergency_phone} />
              <InfoBox label="Sabit Hat" value={infoCompany.landline_phone} />
              <InfoBox label="Web Sitesi" value={infoCompany.website} />
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

function MetricCard({ icon: Icon, label, value, ext, color }) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} p-0.5 flex items-center justify-center shadow-lg`}>
          <div className="w-full h-full bg-neutral-900 rounded-[14px] flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</div>
        <div className="text-sm font-medium text-neutral-400 mb-1">{label}</div>
        <div className="text-xs text-neutral-600">{ext}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all whitespace-nowrap ${
        active 
          ? "bg-white text-neutral-950 shadow-lg" 
          : "bg-neutral-900/50 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800"
      }`}
    >
      <Icon className="w-4 h-4" /> 
      {label}
    </button>
  );
}

// 🚀 YENİ EKLENEN: InfoBox Bileşeni
function InfoBox({ label, value, fullWidth = false }) {
  return (
    <div className={`bg-neutral-800/30 border border-neutral-800/50 p-4 rounded-xl ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
      <div className="text-xs font-medium text-neutral-500 mb-1">{label}</div>
      <div className="text-sm text-white font-medium break-words">{value || '-'}</div>
    </div>
  );
}