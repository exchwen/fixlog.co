import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InventoryReturnsModal({ data, onClose }: any) {
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any>(null);
    const [staffId, setStaffId] = useState('');
    const [jobId, setJobId] = useState('');
    const [items, setItems] = useState<any[]>([]); 
    const [status, setStatus] = useState('Bekliyor');
    
    const companySlug = data?.slug || data?.company_slug;

    useEffect(() => {
        fetch('/get-inventory-returns?company_slug=' + companySlug)
            .then(res => res.json())
            .then(res => { if(res.success) setReturns(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [companySlug]);

    const handleSave = async () => {
        const id = editing?.id || Date.now().toString();
        const endpoint = editing?.id ? '/update-inventory-return' : '/add-inventory-return';
        const payload = { id, company_slug: companySlug, staff_id: staffId, job_id: jobId, status, items };
        
        await fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
        onClose();
    };

    const handleDelete = async (id: string) => {
        if(!window.confirm('Emin misiniz?')) return;
        await fetch('/delete-inventory-return', { method: 'POST', body: JSON.stringify({ id, company_slug: companySlug }) });
        setReturns(returns.filter(t => t.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Şantiye Dönüş / İade</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
                </div>

                {!editing ? (
                    <div>
                        <button onClick={() => setEditing({})} className="bg-orange-600 text-white px-4 py-2 rounded-xl mb-4 flex items-center gap-2"><Plus size={16} /> Yeni İade Kaydı</button>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                            <div className="grid gap-4">
                                {returns.map(r => {
                                    const parsedItems = JSON.parse(r.items || '[]');
                                    return (
                                        <div key={r.id} className="border p-4 rounded-xl flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold">İade #{r.id.slice(-6)}</h3>
                                                    <span className={`text-xs px-2 py-1 rounded-lg ${r.status === 'Depoya Alındı' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{r.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">{parsedItems.length} Kalem Malzeme</p>
                                                <p className="text-xs text-gray-400">Personel: {data.staff?.find((s:any) => s.id == r.staff_id)?.name || 'Bilinmiyor'} | İş: {data.jobs?.find((j:any) => j.id == r.job_id)?.title || 'Genel'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditing(r); setStaffId(r.staff_id); setJobId(r.job_id); setStatus(r.status); setItems(parsedItems); }} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <select value={staffId} onChange={e => setStaffId(e.target.value)} className="flex-1 p-3 border rounded-xl">
                                <option value="">Personel Seçin...</option>
                                {data.staff?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select value={jobId} onChange={e => setJobId(e.target.value)} className="flex-1 p-3 border rounded-xl">
                                <option value="">İlgili İş (Opsiyonel)</option>
                                {data.jobs?.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="flex-1 p-3 border rounded-xl">
                                <option value="Bekliyor">Bekliyor</option>
                                <option value="Depoya Alındı">Depoya Alındı</option>
                                <option value="Hurda">Hurda / Fire</option>
                            </select>
                        </div>
                        
                        <div className="border p-4 rounded-xl space-y-4">
                            <h3 className="font-bold">İade Kalemleri</h3>
                            <button onClick={() => setItems([...items, { stock_id: '', quantity: 1, condition: 'Sağlam' }])} className="text-sm bg-slate-100 px-3 py-1 rounded-lg flex items-center gap-1"><Plus size={14} /> Kalem Ekle</button>
                            {items.map((it, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <select value={it.stock_id} onChange={e => { const newI = [...items]; newI[idx].stock_id = e.target.value; setItems(newI); }} className="flex-1 p-2 border rounded-lg">
                                        <option value="">Seçiniz...</option>
                                        {data.stock?.map((s: any) => <option key={s.id} value={s.id}>{s.itemName || s.item_name}</option>)}
                                    </select>
                                    <input type="number" value={it.quantity} onChange={e => { const newI = [...items]; newI[idx].quantity = e.target.value; setItems(newI); }} className="w-24 p-2 border rounded-lg" min="1" />
                                    <select value={it.condition} onChange={e => { const newI = [...items]; newI[idx].condition = e.target.value; setItems(newI); }} className="w-32 p-2 border rounded-lg">
                                        <option value="Sağlam">Sağlam</option>
                                        <option value="Arızalı">Arızalı</option>
                                        <option value="Kullanılamaz">Kullanılamaz</option>
                                    </select>
                                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-red-600"><X size={18} /></button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-xl">İptal</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-orange-600 text-white rounded-xl flex items-center gap-2"><Save size={16} /> Kaydet</button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
