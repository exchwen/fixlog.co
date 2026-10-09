import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Copy, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const BOM_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';

export default function BomTemplatesModal({ data, onClose }: any) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any>(null);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [items, setItems] = useState<any[]>([]); 
    
    const companySlug = data?.slug || data?.company_slug;

    // Worker'ın kapısından geçmek için token'ı alıyoruz
    const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken') || localStorage.getItem('masterbossToken') || '' : '';

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
        try {
            const res = await fetch(`${BOM_API_URL}/get-bom-templates?slug=${encodeURIComponent(companySlug)}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const r = await res.json();
            if(r.success) setTemplates(r.data);
        } catch(e) {}
    };

    const handleSave = async () => {
        if(!name.trim()) return alert('Sablon adi gerekli.');
        if (!companySlug) return alert('Firma bilgisi bulunamadi.');
        if (items.some((item: any) => !item.stock_id || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) return alert('Her malzeme icin stok ve pozitif miktar secin.');
        
        const id = editing?.id || Date.now().toString();
        const endpoint = editing?.id ? '/update-bom-template' : '/add-bom-template';
        
        const itemsString = typeof items === 'string' ? items : JSON.stringify(items);
        const payload = { id, slug: companySlug, name: name.trim(), description: desc, items: itemsString };
        
        try {
            const response = await fetch(`${BOM_API_URL}${endpoint}`, { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}` // Kimlik eklendi
                },
                body: JSON.stringify(payload) 
            });

            if(response.ok) {
                setEditing(null);
                refreshData(); 
            } else {
                alert('Kaydetme işlemi başarısız oldu.');
            }
        } catch(e) {
            alert('Sunucu ile bağlantı kurulamadı.');
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
            alert('Kopyalama başarısız oldu.');
        }
    };

    const parseItems = (itemsData: any) => {
        if (!itemsData) return [];
        if (typeof itemsData === 'string') {
            try {
                const parsed = JSON.parse(itemsData);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) { return []; }
        }
        return Array.isArray(itemsData) ? itemsData : [];
    };

    const getTemplateTotal = (templateItems: any[]) => templateItems.reduce((total, item) => {
        const stock = data?.stock?.find((entry: any) => String(entry.id) === String(item.stock_id));
        return total + (Number(item.quantity) || 0) * (Number(stock?.unit_price) || 0);
    }, 0);
    const formatMoney = (value: number) => `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

    return (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">BOM Şablonları</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
                </div>

                {!editing ? (
                    <div>
                        <button onClick={() => { setEditing({}); setName(''); setDesc(''); setItems([]); }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl mb-4 flex items-center gap-2"><Plus size={16} /> Yeni Şablon</button>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                            <div className="grid gap-4">
                                {templates.map(t => (
                                    <div key={t.id} className="border p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold">{t.name}</h3>
                                            <p className="text-sm text-gray-500">{t.description}</p>
                                            <p className="mt-2 text-sm font-bold text-emerald-700">Tahmini toplam: {formatMoney(getTemplateTotal(parseItems(t.items)))}</p>
                                            {parseItems(t.items).length > 0 && (
                                                <ul className="mt-3 space-y-1.5 border-t border-slate-200 pt-3">
                                                    {parseItems(t.items).map((item: any, index: number) => {
                                                        const stock = data?.stock?.find((entry: any) => String(entry.id) === String(item.stock_id));
                                                        return (
                                                            <li key={`${item.stock_id}-${index}`} className="flex justify-between gap-3 text-sm text-slate-600">
                                                                <span className="truncate">{stock?.itemName || stock?.item_name || `Stok #${item.stock_id}`}</span>
                                                                <span className="shrink-0 font-semibold text-slate-800">{item.quantity} adet</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="flex gap-2 self-end sm:self-auto shrink-0">
                                            <button onClick={() => handleDuplicate(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Copy size={18} /></button>
                                            <button onClick={() => { setEditing(t); setName(t.name); setDesc(t.description); setItems(parseItems(t.items)); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Şablon Adı" className="w-full p-3 border rounded-xl" />
                        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Açıklama" className="w-full p-3 border rounded-xl" />
                        
                        <div className="border p-4 rounded-xl space-y-4">
                            <h3 className="font-bold">Malzemeler</h3>
                            <button onClick={() => setItems([...items, { stock_id: '', quantity: 1 }])} className="text-sm bg-slate-100 px-3 py-1 rounded-lg flex items-center gap-1"><Plus size={14} /> Malzeme Ekle</button>
                            {items.map((it, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <select value={it.stock_id} onChange={e => setItems(current => current.map((item, i) => i === idx ? { ...item, stock_id: e.target.value } : item))} className="flex-1 p-2 border rounded-lg">
                                        <option value="">Seçiniz...</option>
                                        {data.stock?.map((s: any) => <option key={s.id} value={s.id}>{s.itemName || s.item_name}</option>)}
                                    </select>
                                    <input type="number" value={it.quantity} onChange={e => setItems(current => current.map((item, i) => i === idx ? { ...item, quantity: e.target.value } : item))} className="w-24 p-2 border rounded-lg" min="1" />
                                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-red-600"><X size={18} /></button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-xl">İptal</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-xl flex items-center gap-2"><Save size={16} /> Kaydet</button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
