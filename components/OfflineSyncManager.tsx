'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle, AlertTriangle, Wifi } from 'lucide-react';

export default function OfflineSyncManager() {
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncedCount, setSyncedCount] = useState(0);

  // Senkronizasyon (Eşitleme) Fonksiyonu
  const processOfflineQueue = async () => {
    const slug = localStorage.getItem('companySlug');
    if (!slug) return;

    const queueKey = `offline_actions_${slug}`;
    const pendingActions = JSON.parse(localStorage.getItem(queueKey) || '[]');

    if (pendingActions.length === 0) return;

    // İşlem başlıyor bildirimi
    setSyncState('syncing');
    setSyncedCount(pendingActions.length);
    
    // YENİ: Worker URL'si doğrudan entegre edildi
    const WORKER_URL = 'https://backend.isdokumu.workers.dev'; 

    let remainingQueue = [];
    let successCount = 0;

    for (const action of pendingActions) {
      try {
        const response = await fetch(`${WORKER_URL}/${action.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.body),
        });

        if (response.ok) {
          successCount++;
        } else {
          // Eğer sunucu hata verirse (örn: 500) bunu silme, tekrar denemek için kuyrukta bırak
          remainingQueue.push(action);
        }
      } catch (error) {
        // İnternet anlık gidip gelirse veya fetch patlarsa kuyrukta bırak
        remainingQueue.push(action);
      }
    }

    // Başarılı olanları sildik, hata verenleri tekrar çekmeceye koyduk
    if (remainingQueue.length > 0) {
      localStorage.setItem(queueKey, JSON.stringify(remainingQueue));
      setSyncState('error');
    } else {
      localStorage.removeItem(queueKey);
      setSyncState('success');
    }

    // 4 Saniye sonra bildirimi ekrandan kaldır
    setTimeout(() => {
      setSyncState('idle');
    }, 4000);
  };

  useEffect(() => {
    // 1. Uygulama ilk açıldığında internet varsa ve içeride kuyruk kalmışsa hemen temizle
    if (typeof window !== 'undefined' && navigator.onLine) {
      processOfflineQueue();
    }

    // 2. İnternet yokken geldiği anı dinle ve kuyruğu temizle
    const handleOnline = () => {
      processOfflineQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Eğer hiçbir işlem yoksa ekranda yer kaplama
  if (syncState === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] min-w-[300px]"
      >
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            {syncState === 'syncing' && (
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shrink-0">
                <RefreshCw size={20} className="animate-spin" />
              </div>
            )}
            {syncState === 'success' && (
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle size={20} />
              </div>
            )}
            {syncState === 'error' && (
              <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                {syncState === 'syncing' && 'Bağlantı Sağlandı'}
                {syncState === 'success' && 'Eşitleme Başarılı'}
                {syncState === 'error' && 'Kısmi Eşitleme'}
              </span>
              <span className="text-[11px] text-slate-400">
                {syncState === 'syncing' && `Bekleyen ${syncedCount} işlem sisteme aktarılıyor...`}
                {syncState === 'success' && 'İnternetsiz yapılan işlemleriniz kaydedildi.'}
                {syncState === 'error' && 'Bazı işlemler aktarılamadı, tekrar denenecek.'}
              </span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
             <Wifi size={14} className={syncState === 'error' ? 'text-amber-500' : 'text-emerald-500'} />
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}