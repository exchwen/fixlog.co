import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Copy, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BomTemplatesModal({ data, onClose }: any) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any>(null);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [items, setItems] = useState<any[]>([]); 
    
    const companySlug = data?.slug || data?.company_slug;

    useEffect(() => {
        fetch('/get-bom-templates?company_slug=' + companySlug)
            .then(res => res.json())
            .then(res => { if(res.success) setTemplates(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [companySlug]);

    const refreshData = async () => {
        try {
            const res = await fetch('/get-bom-templates?company_slug=' + companySlug);
            const r = await res.json();
            if(r.success) setTemplates(r.data);
        } catch(e) {}
    };

    const handleSave = async () => {
        if(!name) return alert('İsim gerekli');
        
        const id = editing?.id || Date.now().toString();
        const endpoint = editing?.id ? '/update-bom-template' : '/add-bom-template';
        
        const itemsString = typeof items === 'string' ? items : JSON.stringify(items);
        const payload = { id, company_slug: companySlug, name, description: desc, items: itemsString };
        
        try {
            const response = await fetch(endpoint, { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
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
            const response = await fetch('/delete-bom-template', { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, company_slug: companySlug }) 
            });

            if(response.ok) {
                setTemplates(templates.filter(t => t.id !== id));
            }
        } catch(e) {
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const handleDuplicate = async (t: any) => {
        const payload = { 
            id: Date.now().toString(), 
            company_slug: companySlug, 
            name: t.name + ' (Kopya)', 
            description: t.description, 
            items: t.items || '[]' 
        };
        
        try {
            const response = await fetch('/add-bom-template', { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
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
            try { return JSON.parse(itemsData); } catch (e) { return []; }
        }
        return itemsData;
    };

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
                                    <div key={t.id} className="border p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold">{t.name}</h3>
                                            <p className="text-sm text-gray-500">{t.description}</p>
                                        </div>
                                        <div className="flex gap-2">
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
                                    <select value={it.stock_id} onChange={e => { const newI = [...items]; newI[idx].stock_id = e.target.value; setItems(newI); }} className="flex-1 p-2 border rounded-lg">
                                        <option value="">Seçiniz...</option>
                                        {data.stock?.map((s: any) => <option key={s.id} value={s.id}>{s.itemName || s.item_name}</option>)}
                                    </select>
                                    <input type="number" value={it.quantity} onChange={e => { const newI = [...items]; newI[idx].quantity = e.target.value; setItems(newI); }} className="w-24 p-2 border rounded-lg" min="1" />
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