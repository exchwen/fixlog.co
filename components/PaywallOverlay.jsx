"use client";
import { CreditCard, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export function PaywallOverlay({ slug, role, onPayClick }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/90 backdrop-blur-xl p-4 selection:bg-rose-500/30">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500/20 to-rose-600/20 rounded-2xl border border-red-500/30 flex items-center justify-center mb-6 shadow-lg">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">Erişim <span className="text-red-500">Kısıtlandı</span></h2>
          
          <p className="text-neutral-400 text-sm leading-relaxed">
            Şirketinizin abonelik süresi dolmuş veya ödeme gecikmesinde görünmektedir. 
            **Hiçbir veriniz silinmemiştir** ancak sisteme erişebilmek için aboneliğin yenilenmesi gerekmektedir.
          </p>

          {role === "Patron" ? (
            <button 
              onClick={onPayClick}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-red-500/20 hover:from-red-500 hover:to-rose-500 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              <CreditCard className="w-5 h-5" />
              Ödeme Yap ve Aç
            </button>
          ) : (
             <div className="bg-neutral-800/50 border border-neutral-700/50 p-4 rounded-xl">
               <p className="text-xs text-neutral-300 font-medium tracking-wide">
                 Bu sorunu çözmek için lütfen iş yeri yetkilinizle ("Patron") iletişime geçin. Sadece yetkili hesaplar ödeme yapabilir.
               </p>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
