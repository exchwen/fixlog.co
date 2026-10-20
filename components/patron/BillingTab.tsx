'use client';

import React, { useState } from 'react';
import { CreditCard, CheckCircle, Copy, Check } from 'lucide-react';

export default function BillingTab({ data, settingsForm = {} }: any) {
  const [copied, setCopied] = useState(false);
  const iban = 'TR660006200042500006287276';
  const copyIban = async () => {
    try { await navigator.clipboard.writeText(iban); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    catch { alert('IBAN kopyalanamadı. Lütfen elle seçip kopyalayın.'); }
  };
  const refCode = settingsForm?.referralCode || settingsForm?.referral_code || data?.referralCode || data?.referral_code || 'BEKLENİYOR...';
  
  // 🚀 YENİ: Hometab ile birebir aynı dinamik fatura hesaplaması (Tamamen Agresif Veri Arama)
  const { totalAssetsCount, baseFee, perAssetFee, currentUsageBill, activeReferrals, isExempt, finalBill, subStatus, trialEndsAt } = React.useMemo(() => {
    
    // 1. Varlık Sayısı: Undefined veya string gelme ihtimaline karşı Number() ile zorluyoruz
    const rawAssets = data?.stats?.assets ?? data?.assets?.length ?? settingsForm?.stats?.assets ?? settingsForm?.assets?.length ?? 0;
    const assetsCount = Number(rawAssets) || 0;
    
    // 2. Muafiyet (VIP): API'den "1" (string) gelme riskine karşı Number() === 1 veya text === 'true' kontrolü
    const rawExempt = data?.has_masterboss_gift ?? settingsForm?.has_masterboss_gift;
    const exemptStatus = Number(rawExempt) === 1 || String(rawExempt).toLowerCase() === 'true';
    
    // 3. Fiyatlandırma
    const rawBasePrice = data?.custom_base_price ?? settingsForm?.custom_base_price;
    const bFee = rawBasePrice !== undefined && rawBasePrice !== null 
                 ? Number(rawBasePrice) 
                 : Number(data?.global_base_price || settingsForm?.global_base_price || 3000);
                 
    const rawAssetPrice = data?.custom_per_asset_price ?? settingsForm?.custom_per_asset_price;
    const pAssetFee = rawAssetPrice !== undefined && rawAssetPrice !== null 
                      ? Number(rawAssetPrice) 
                      : Number(data?.global_asset_price || settingsForm?.global_asset_price || 50);
  
    // 4. Güncel Kullanım Faturası
    const cUsageBill = exemptStatus ? 0 : bFee + (assetsCount * pAssetFee);
    const aReferrals = Number(data?.free_months_balance ?? settingsForm?.free_months_balance ?? 0);
  
    let fBill = cUsageBill;
    let rCredits = 0;
  
    if (exemptStatus) {
        fBill = 0;
    } else if (aReferrals > 0) {
        rCredits = bFee; // Sadece taban ücreti düşer
        fBill = Math.max(0, cUsageBill - rCredits);
    }
    
    // 5. Abonelik Durumu
    const sStatus = data?.subscription_status || settingsForm?.subscription_status || 'active';
    const tEndsAt = data?.trial_ends_at || settingsForm?.trial_ends_at;
  
    return {
        totalAssetsCount: assetsCount,
        baseFee: bFee,
        perAssetFee: pAssetFee,
        currentUsageBill: cUsageBill,
        activeReferrals: aReferrals,
        isExempt: exemptStatus,
        finalBill: fBill,
        subStatus: sStatus,
        trialEndsAt: tEndsAt
    };
  }, [data, settingsForm]);
  

  return (
    <div className="max-w-3xl mx-auto space-y-6">
        {/* 🚀 YENİ: FATURA VE ABONELİK (İYZİCO ENTEGRASYON ALANI) */}

        <div className="border-t border-slate-200 pt-6"><h4 className="text-sm font-black text-slate-800">Abonelik ve Referans</h4><p className="mt-1 text-xs text-slate-500">Plan durumunuzu ve davet kodu kazanımlarınızı takip edin.</p></div>
        <div className="border-t border-slate-100 pt-6 pb-2">
           <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <CreditCard size={16} /> Fatura ve Abonelik Yönetimi
           </label>
           <div className="bg-blue-50/50 border border-blue-200 p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-center md:items-start shadow-sm">
             <div className="flex-1 space-y-3 w-full">
                <h4 className="font-black text-blue-800 text-sm">Sistem Kullanım Durumu</h4>
                <p className="text-xs text-blue-700/80 font-medium leading-relaxed">
                  İşletmenizin aktif abonelik durumunu ve faturasını buradan takip edebilir, kredi kartı ile güvenle ödeme yapabilirsiniz veya otomatik ödeme talimatı verebilirsiniz (Iyzico altyapısı ile korunmaktadır).
                </p>
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                   <button 
                     onClick={() => {
                        alert('Güvenli Iyzico ödeme altyapısı entegre edildiğinde kart giriş ekranı burada açılacaktır.');
                     }}
                     className="bg-blue-600 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-blue-700 shadow-sm active:scale-95 transition-all w-full sm:w-auto flex justify-center items-center gap-2"
                   >
                     <CreditCard size={16} /> Kart Bilgilerini Gir / Öde
                   </button>
                </div>
             </div>

             <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
                <h4 className="text-sm font-black text-emerald-900">Banka Havalesi / EFT</h4>
                <p className="mt-1 text-xs text-emerald-800">Ödeme açıklamasına firma adınızı yazın.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-2 text-sm">
                    <p><span className="font-bold text-slate-500">Alıcı:</span> <span className="font-bold text-slate-900">Doğukan KAYA</span></p>
                    <p><span className="font-bold text-slate-500">Banka:</span> <span className="font-bold text-slate-900">Garanti Bankası</span></p>
                    <p className="break-all"><span className="font-bold text-slate-500">IBAN:</span> <span className="font-mono font-bold tracking-wide text-slate-900">TR66 0006 2000 4250 0006 2872 76</span></p>
                  </div>
                  <button type="button" onClick={copyIban} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'IBAN Kopyalandı' : 'IBANı Kopyala'}</button>
                </div>
                <a href={`https://wa.me/905457846752?text=${encodeURIComponent('Merhaba, banka havalesi dekontumu iletiyorum. Firma adım: ')}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#1fb85a] sm:w-auto">Dekont Gönder · WhatsApp</a>
             </div>

             <div className="flex-shrink-0 bg-white border border-blue-200 p-4 rounded-xl w-full md:w-48 text-center shadow-sm">
                <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Durum</span>
                
                {isExempt ? (
                    <>
                        <span className="block text-lg font-black mb-1 text-purple-600">VIP (Muaf)</span>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                            Ücret: ₺0
                        </span>
                        <span className="block text-[9px] font-black text-purple-600 tracking-widest leading-tight bg-purple-50 py-1.5 px-2 rounded-lg border border-purple-200 shadow-sm">
                            Faturanız FixLog.co tarafından karşılanıyor.
                        </span>
                    </>
                ) : subStatus === 'trialing' ? (
                    <>
                        <span className="block text-lg font-black mb-1 text-blue-600">Deneme Sürümü</span>
                        {(() => {
                            if (!trialEndsAt) return <span className="block text-[10px] font-bold text-slate-500 uppercase">Aylık: Ücretsiz</span>;
                            const today = new Date();
                            const endDate = new Date(trialEndsAt);
                            today.setHours(0, 0, 0, 0);
                            endDate.setHours(0, 0, 0, 0);
                            const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            if (diff <= 0) return <span className="block text-[9px] font-black text-rose-500 tracking-widest leading-tight bg-rose-50 py-1.5 px-2 rounded-lg border border-rose-200">Süreniz Doldu. Ödeme yapmazsanız hesabınız kısıtlanacaktır.</span>;
                            return <span className="block text-[9px] font-black text-blue-500 tracking-widest leading-tight bg-blue-50 py-1.5 px-2 rounded-lg border border-blue-200">Kalan Süre: {diff} Gün.<br/>Deneme bitince ödeme yapmazsanız hesabınız kısıtlanacaktır.</span>;
                        })()}
                    </>
                ) : subStatus === 'past_due' ? (
                  <>
                      <span className="block text-lg font-black mb-1 text-rose-600">Ödeme Bekliyor</span>
                      <span className="block text-[10px] font-bold text-rose-500 uppercase">Erişim Kısıtlandı</span>
                  </>
                ) : subStatus === 'canceled' ? (
                    <>
                        <span className="block text-lg font-black mb-1 text-slate-600">İptal Edildi</span>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Hesabınız askıya alındı</span>
                    </>
                ) : (
                    <>
                        <span className="block text-lg font-black mb-1 text-emerald-600">Aktif</span>
                        
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                            Aylık: ₺{finalBill.toLocaleString('tr-TR')}
                            {activeReferrals > 0 && (
                                <span className="line-through text-slate-400 ml-1">₺{currentUsageBill.toLocaleString('tr-TR')}</span>
                            )}
                        </span>
                        
                        {activeReferrals > 0 ? (
                           <span className="block text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-tight bg-emerald-50 py-1.5 px-2 rounded-lg border border-emerald-200">
                               🎁 Bu Ay İndirimli Kullanım!<br/>(Kalan Hediye: {activeReferrals} Ay)
                           </span>
                        ) : (
                           <span className="block text-[9px] font-black text-emerald-600 tracking-widest leading-tight bg-emerald-50 py-1.5 px-2 rounded-lg border border-emerald-200">
                               Ödeme yaptığınız için teşekkürler!
                           </span>
                        )}
                    </>
                )}
             </div>
           </div>
        </div>

        {/* 🚀 YENİ: REFERANS PROGRAMI (TAVSİYE KODU VE KAZANÇLAR) */}
        <div className="border-t border-slate-100 pt-6 pb-2">
           <label className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <CheckCircle size={16} /> Referans Programı
           </label>
           <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-center md:items-start shadow-sm">
             
             <div className="flex-1 space-y-3 w-full">
                <h4 className="font-black text-emerald-800 text-sm">Tavsiye Et, Kumbaranda Biriksin!</h4>
                <p className="text-xs text-emerald-700/80 font-medium leading-relaxed">
                  Referans kodunuz ile kayıt olan ve ilk ödemesini gerçekleştiren <strong> her firma için kumbaranıza + 1 ay 3000 TL değerinde indirim kazanılır.</strong> Sınır yok, kaç firma getirirseniz o kadar ay indirim kazanırsınız! (Kayıt olan firma da hoş geldin hediyesi olarak 1 ay indirim kazanır).
                </p>
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                   <div className="flex bg-white border border-emerald-200 rounded-xl overflow-hidden w-full sm:w-auto shadow-sm">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-4 py-2 text-xs flex items-center border-r border-emerald-200">Kodunuz</span>
                      <input 
                         type="text" 
                         readOnly 
                         value={refCode} 
                         className="px-4 py-2 font-black text-slate-800 text-sm outline-none bg-transparent w-full sm:w-40 text-center"
                      />
                   </div>
                   <button 
                     disabled={refCode === 'BEKLENİYOR...'}
                     onClick={() => {
                       navigator.clipboard.writeText(refCode);
                       setCopied(true); setTimeout(() => setCopied(false), 1800);
                     }}
                     className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-700 shadow-sm active:scale-95 transition-all w-full sm:w-auto disabled:opacity-50 flex justify-center"
                   >
                     {copied ? 'Kopyalandı' : 'Kodu Kopyala'}
                   </button>
                </div>
             </div>

             <div className="flex-shrink-0 bg-white border border-emerald-200 p-4 rounded-xl w-full md:w-48 text-center shadow-sm">
                <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Kumbarada Biriken</span>
                <span className="block text-4xl font-black text-emerald-600 mb-1">{activeReferrals}</span>
                <span className="block text-xs font-bold text-slate-600">Ücretsiz Ay</span>
             </div>

           </div>
        </div>

        {/* 🚀 YENİ: ÇALIŞMA GÜNLERİ AYARI (OTOPİLOT İÇİN) */}

    </div>
  );
}
