'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Users, Box, Wallet, Plus, ArrowUpRight, Zap } from 'lucide-react';

export default function HomeTab({ data, setShowJobModal, statusColors }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hoş Geldin, {data?.ownerName?.split(' ')[0] || 'Yönetici'} 👋</h2>
          <p className="text-slate-500 text-xs mt-1">Sistem üzerindeki anlık özetin aşağıdadır.</p>
        </div>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 flex items-center gap-1.5 font-medium text-[10px] uppercase tracking-wide">
          <Zap size={12} className="fill-emerald-600" /> D1 Bağlantısı Aktif
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.stats?.map((s: any, i: number) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50/50 rounded-lg flex items-center justify-center text-blue-600">
              {i === 0 ? <ClipboardList size={18} /> : i === 1 ? <Users size={18} /> : i === 2 ? <Box size={18} /> : <Wallet size={18} />}
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 leading-none mb-1">{s?.value || '0'}</div>
              <div className="text-[10px] text-slate-500 uppercase font-medium">{s?.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-sm text-slate-800">Son İş Emirleri</h3>
            <button onClick={() => setShowJobModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 hover:bg-blue-700 transition-all">
              <Plus size={14} /> Yeni İş Ata
            </button>
          </div>
          <div className="overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-white sticky top-0 shadow-sm text-slate-400 font-medium">
                <tr><th className="px-5 py-3 border-b border-slate-100">Müşteri / Lokasyon</th><th className="px-5 py-3 border-b border-slate-100">Sorumlu</th><th className="px-5 py-3 border-b border-slate-100 text-right">Durum</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.jobs?.length > 0 ? data.jobs.slice(0, 8).map((j: any) => (
                  <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-800">{j?.customer_name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{j?.work_type}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{data?.staff?.find((s: any) => s.id === j.staff_id)?.name || 'Atanmadı'}</td>
                    <td className="px-5 py-3 text-right"><span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusColors[j.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>{j.status}</span></td>
                  </tr>
                )) : (<tr><td colSpan="3" className="p-10 text-center text-slate-400 text-xs">Aktif iş bulunmuyor.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6 flex flex-col text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-6"><Wallet size={16} className="text-blue-400" /><span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Kasa Özeti</span></div>
            <div className="text-[10px] text-slate-400 mb-1">Net Bakiye</div>
            <div className="text-3xl font-bold tracking-tight mb-8">{data?.stats?.[3]?.value || '₺0'}</div>
            <div className="space-y-3 mt-auto">
              <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2"><ArrowUpRight size={14} className="text-emerald-400" /><span className="text-xs text-slate-300">Gelir</span></div>
                <span className="text-sm font-semibold text-emerald-400">₺{data?.finSummary?.income?.toLocaleString('tr-TR') || 0}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2"><ArrowUpRight size={14} className="text-rose-400 rotate-90" /><span className="text-xs text-slate-300">Gider</span></div>
                <span className="text-sm font-semibold text-rose-400">₺{data?.finSummary?.expense?.toLocaleString('tr-TR') || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}