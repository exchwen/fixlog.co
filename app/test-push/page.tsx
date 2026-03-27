'use client';

import React, { useState } from 'react';
import * as PusherPushNotifications from '@pusher/push-notifications-web';

const API_URL = 'https://api.fixlog.co'; 

export default function TestPushPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState('');

  const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} -> ${msg}`]);

  const handleRegister = async () => {
    addLog('🚀 1. Başlatılıyor...');
    
    // Tarayıcı destekliyor mu?
    if (!('serviceWorker' in navigator)) {
        addLog('❌ HATA: Tarayıcı Service Worker desteklemiyor.');
        return;
    }

    try {
        // İzin İste
        const perm = await Notification.requestPermission();
        addLog(`📢 İzin Durumu: ${perm}`);
        if (perm !== 'granted') {
            addLog('❌ HATA: Kullanıcı izin vermedi.');
            return;
        }

        // Service Worker Hazır mı?
        const registration = await navigator.serviceWorker.ready;
        addLog('✅ Service Worker Aktif.');

        // Beams SDK Başlat
        const beamsClient = new PusherPushNotifications.Client({
            instanceId: '015accc9-e581-44a3-b37f-5410549611da', // Senin ID'n
            serviceWorkerRegistration: registration,
        });

        await beamsClient.start();
        const id = await beamsClient.getDeviceId();
        setDeviceId(id);
        addLog(`🆔 Cihaz ID Alındı: ${id}`);

        // "test-kanal"a abone ol
        await beamsClient.addDeviceInterest('test-kanal');
        addLog('✅ "test-kanal" kanalına abone olundu.');

        // Abonelikleri kontrol et
        const interests = await beamsClient.getDeviceInterests();
        addLog(`📋 Mevcut Abonelikler: ${JSON.stringify(interests)}`);

    } catch (e: any) {
        addLog(`❌ KRİTİK HATA (Kayıt): ${e.message}`);
        console.error(e);
    }
  };

  const handleSend = async () => {
    addLog('📨 2. Sunucuya Gönderme İsteği Atılıyor...');
    try {
        const res = await fetch(`${API_URL}/send-test-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                interests: ['test-kanal'], // Cihazın abone olduğu kanalla AYNI olmalı
                title: 'Test Başarılı! 🎉',
                body: 'Bu bildirimi görüyorsan sistem çalışıyor.',
                link: 'https://isdokumu-app.vercel.app',
                slug: 'test-slug'
            })
        });
        
        const data = await res.json();
        addLog(`📡 Sunucu Cevabı: ${JSON.stringify(data)}`);
        
        if (!data.success) {
             addLog('❌ Sunucu Pusher\'a ulaşamadı. Loglara bak.');
        }

    } catch (e: any) {
        addLog(`❌ KRİTİK HATA (Fetch): ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4 text-emerald-400">Push Bildirim Testi</h1>
      
      <div className="grid gap-4 mb-6">
        <button onClick={handleRegister} className="bg-blue-600 hover:bg-blue-700 py-3 px-4 rounded font-bold text-left">
          1. ADIM: Cihazı Kaydet ve 'test-kanal'a Abone Ol
        </button>
        
        <button onClick={handleSend} className="bg-purple-600 hover:bg-purple-700 py-3 px-4 rounded font-bold text-left">
          2. ADIM: 'test-kanal'a Bildirim Gönder (Worker Üzerinden)
        </button>
      </div>

      <div className="bg-black/50 p-4 rounded-xl border border-slate-700 h-96 overflow-y-auto">
        <div className="text-slate-400 mb-2 border-b border-slate-800 pb-2">Log Kayıtları:</div>
        {logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
        ))}
      </div>
    </div>
  );
}