'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Copy, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const BOM_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';

export default function BomTab({ data }: any) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any>(null);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [items, setItems] = useState<any[]>([]); 
    
    const companySlug = data?.slug || data?.company_slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '');

    // Worker'ın kapısından geçmek için token'ı alıyoruz
    const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    useEffect(() => {
        let cancelled = false;
        if (!companySlug) { setTemplates([]); setLoading(false); return; }
        setLoading(true);
        fetch(`${BOM_API_URL}/get-bom-templates?slug=${encodeURIComponent(companySlug)}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        })
            .then(async res => {
                const result = await res.json();
                if (!res.ok || result.success === false) throw new Error(result.error || 'BOM sablonlari yuklenemedi.');
                if (!cancelled) setTemplates(Array.isArray(result.data) ? result.data : []);
            })
            .catch(() => { if (!cancelled) setTemplates([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [companySlug]);

    const refreshData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BOM_API_URL}/get-bom-templates?slug=${encodeURIComponent(companySlug)}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const r = await res.json();
            if(r.success) setTemplates(r.data);
        } catch(e) {}
        setLoading(false);
    };


const handleSave = async () => {
    if (!name.trim()) return alert('Sablon adi gerekli.');
    if (!companySlug) return alert('Firma bilgisi bulunamadi.');
    if (items.some((item: any) => !item.stock_id || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) return alert('Her malzeme icin stok ve pozitif miktar secin.');

    const id = editing?.id || Date.now().toString();
    const endpoint = editing?.id
        ? '/update-bom-template'
        : '/add-bom-template';

    const itemsString =
        typeof items === 'string' ? items : JSON.stringify(items);

    const payload = {
        id,
        slug: companySlug,
        name: name.trim(),
        description: desc,
        items: itemsString,
    };

    try {
        const response = await fetch(`${BOM_API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        let result: any = {};
        try {
            result = JSON.parse(responseText);
        } catch {
            result = { error: responseText };
        }

        if (response.ok && result.success !== false) {
            setEditing(null);
            await refreshData();
        } else {
            console.error('[BOM KAYDETME HATASI]', {
                endpoint,
                status: response.status,
                response: result,
                payload,
            });

            alert(
                `Kaydetme başarısız!\n` +
                `HTTP: ${response.status}\n` +
                `Hata: ${result.error || result.message || responseText || 'Bilinmeyen sunucu hatası'}`
            );
        }
    } catch (e) {
        console.error('[BOM BAĞLANTI HATASI]', e);
        alert('Sunucu ile iletişim kurulamadı. Konsolu kontrol et.');
    }
};


    const handleDelete = async (id: string) => {
        if(!window.confirm('Emin misiniz?')) return;
        
        try {
            const response = await fetch(`${BOM_API_URL}/delete-bom-template`, { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}` // Kimlik eklendi
                },
                body: JSON.stringify({ id, slug: companySlug }) 
            });

            const result = await response.json();
            if (!response.ok || result.success === false) throw new Error(result.error || 'Template could not be deleted.');
            setTemplates(current => current.filter(t => t.id !== id));
        } catch(e) {
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const handleDuplicate = async (t: any) => {
        const payload = { 
            id: Date.now().toString(), 
            slug: companySlug,
            name: t.name + ' (Kopya)', 
            description: t.description, 
            items: t.items || '[]'
        };
        
        try {
            const response = await fetch(`${BOM_API_URL}/add-bom-template`, { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}` // Kimlik eklendi
                },
                body: JSON.stringify(payload) 
            });

            if(response.ok) {
                refreshData();
            }
        } catch(e) {
            alert('Kopyalama işlemi başarısız oldu.');
        }
    };

    const parseItems = (itemsData: any) => {
        if (!itemsData) return [];
        if (typeof itemsData === 'string') {
            try { return JSON.parse(itemsData); } catch (e) { return []; }
        }
        return itemsData;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[60vh]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">BOM Şablonları</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Sık kullanılan montaj veya revizyon malzemelerini şablon olarak kaydedin.</p>
                </div>
            </div>

            {!editing ? (
                <div>
                    <button onClick={() => { setEditing({}); setName(''); setDesc(''); setItems([]); }} className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold mb-6 flex items-center gap-2 hover:bg-emerald-700 shadow-sm transition-all"><Plus size={18} /> Yeni Şablon Oluştur</button>
                    {loading ? <Loader2 className="animate-spin text-slate-400 mx-auto" /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map(t => (
                                <div key={t.id} className="border border-slate-200 p-5 rounded-xl flex flex-col justify-between bg-slate-50">
                                    <div className="mb-4">
                                        <h3 className="font-bold text-slate-800 text-lg">{t.name}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2">{t.description}</p>
                                    </div>
                                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 mt-auto">
                                        <button onClick={() => handleDuplicate(t)} className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors" title="Kopyala"><Copy size={18} /></button>
                                        <button onClick={() => { setEditing(t); setName(t.name); setDesc(t.description); setItems(parseItems(t.items)); }} className="p-2.5 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors" title="Düzenle"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(t.id)} className="p-2.5 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors" title="Sil"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                            {templates.length === 0 && (
                               <div className="col-span-full py-12 text-center text-slate-500">Kayıtlı şablon bulunamadı.</div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Şablon Adı</label>
                       <input value={name} onChange={e => setName(e.target.value)} placeholder="Örn: MRL 10 Durak Standart Paket" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Açıklama</label>
                       <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Örn: Kılavuz raylar, motor, pano vb." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                    </div>
                    
                    <div className="border border-slate-200 bg-slate-50 p-5 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="font-bold text-slate-800">Malzemeler</h3>
                           <button onClick={() => setItems([...items, { stock_id: '', quantity: 1 }])} className="text-xs bg-blue-600 text-white font-bold px-3 py-2 rounded-lg flex items-center gap-1 shadow-sm hover:bg-blue-700 transition-all"><Plus size={14} /> Malzeme Ekle</button>
                        </div>
                        {items.map((it, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200">
                                <select value={it.stock_id} onChange={e => setItems(current => current.map((item, i) => i === idx ? { ...item, stock_id: e.target.value } : item))} className="flex-1 px-3 py-2 text-sm font-bold border-none outline-none">
                                    <option value="">Stoktan Seçiniz...</option>
                                    {data?.stock?.map((s: any) => <option key={s.id} value={s.id}>{s.itemName || s.item_name}</option>)}
                                </select>
                                <input type="number" value={it.quantity} onChange={e => setItems(current => current.map((item, i) => i === idx ? { ...item, quantity: e.target.value } : item))} className="w-20 px-3 py-2 text-sm font-bold border-l border-slate-200 outline-none" min="1" placeholder="Miktar" />
                                <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setEditing(null)} className="px-5 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">İptal</button>
                        <button onClick={handleSave} className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm transition-all"><Save size={16} /> Kaydet</button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}