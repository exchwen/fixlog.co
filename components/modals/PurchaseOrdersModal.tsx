import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckSquare, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PurchaseOrdersModal({ data, onClose }: any) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any>(null);
    const [name, setName] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState<any[]>([]); 
    const [status, setStatus] = useState('Bekliyor');
    const [bomTemplates, setBomTemplates] = useState<any[]>([]);
    
    const companySlug = data?.slug || data?.company_slug;

    useEffect(() => {
        fetch('/get-purchase-orders?company_slug=' + companySlug)
            .then(res => res.json())
            .then(res => { if(res.success) setOrders(res.data); })
            .catch(() => {});
        
        fetch('/get-bom-templates?company_slug=' + companySlug)
            .then(res => res.json())
            .then(res => { if(res.success) setBomTemplates(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [companySlug]);

    const handleSave = async () => {
        if(!name) return alert('İsim gerekli');
        const id = editing?.id || Date.now().toString();
        const endpoint = editing?.id ? '/update-purchase-order' : '/add-purchase-order';
        
        const totalValue = items.reduce((acc, it) => acc + (Number(it.ordered_quantity) * Number(it.unit_price || 0)), 0);
        const payload = { id, company_slug: companySlug, name, supplier_id: supplierId, status, items, total_value: totalValue };
        
        await fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
        onClose();
    };

    const handleDelete = async (id: string) => {
        if(!window.confirm('Emin misiniz?')) return;
        await fetch('/delete-purchase-order', { method: 'POST', body: JSON.stringify({ id, company_slug: companySlug }) });
        setOrders(orders.filter(t => t.id !== id));
    };

    const loadBomTemplate = (templateId: string) => {
        const t = bomTemplates.find(x => x.id === templateId);
        if(!t) return;
        try {
            const parsed = JSON.parse(t.items || '[]');
            const newItems = parsed.map((pi: any) => ({
                stock_id: pi.stock_id,
                ordered_quantity: pi.quantity,
                received_quantity: 0,
                unit_price: 0
            }));
            setItems([...items, ...newItems]);
            if(!name) setName(t.name + " Siparişi");
        } catch(e) {}
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Satın Alma Siparişleri</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
                </div>

                {!editing ? (
                    <div>
                        <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-4 py-2 rounded-xl mb-4 flex items-center gap-2"><Plus size={16} /> Yeni Sipariş</button>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                            <div className="grid gap-4">
                                {orders.map(o => {
                                    const parsedItems = JSON.parse(o.items || '[]');
                                    const totalOrdered = parsedItems.reduce((acc: number, it: any) => acc + Number(it.ordered_quantity || 0), 0);
                                    const totalReceived = parsedItems.reduce((acc: number, it: any) => acc + Number(it.received_quantity || 0), 0);
                                    const percent = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
                                    const totalValueReceived = parsedItems.reduce((acc: number, it: any) => acc + (Number(it.received_quantity || 0) * Number(it.unit_price || 0)), 0);
                                    
                                    return (
                                        <div key={o.id} className="border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1 w-full">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold">{o.name}</h3>
                                                    <span className="text-xs px-2 py-1 bg-slate-100 rounded-lg">{o.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">Tedarikçi: {data.suppliers?.find((s:any) => s.id == o.supplier_id)?.name || 'Bilinmiyor'}</p>
                                                
                                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                                                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: percent + '%' }}></div>
                                                </div>
                                                <p className="text-xs mt-1 text-gray-600">Tamamlanma: %{percent} ({totalReceived} / {totalOrdered} kalem geldi)</p>
                                                <p className="text-xs text-gray-600">Gelen Değer: {totalValueReceived.toLocaleString('tr-TR')} ₺ / Toplam: {o.total_value?.toLocaleString('tr-TR')} ₺</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditing(o); setName(o.name); setSupplierId(o.supplier_id); setStatus(o.status); setItems(parsedItems); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Düzenle / Malzeme Kabul"><CheckSquare size={18} /></button>
                                                <button onClick={() => handleDelete(o.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Sipariş Adı (örn: Şişli MRL Asansör Malzemeleri)" className="w-full p-3 border rounded-xl" />
                        <div className="flex gap-4">
                            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="flex-1 p-3 border rounded-xl">
                                <option value="">Tedarikçi Seçin...</option>
                                {data.suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="flex-1 p-3 border rounded-xl">
                                <option value="Bekliyor">Bekliyor</option>
                                <option value="Kısmi Teslim">Kısmi Teslim</option>
                                <option value="Tamamlandı">Tamamlandı</option>
                                <option value="İptal">İptal</option>
                            </select>
                        </div>
                        
                        <div className="border p-4 rounded-xl space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold">Sipariş Kalemleri</h3>
                                <div className="flex gap-2">
                                    <select onChange={e => loadBomTemplate(e.target.value)} className="text-sm border rounded-lg p-1" defaultValue="">
                                        <option value="" disabled>BOM Şablonu Yükle...</option>
                                        {bomTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <button onClick={() => setItems([...items, { stock_id: '', ordered_quantity: 1, received_quantity: 0, unit_price: 0 }])} className="text-sm bg-slate-100 px-3 py-1 rounded-lg flex items-center gap-1"><Plus size={14} /> Kalem Ekle</button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 bg-gray-50">
                                        <tr>
                                            <th className="px-2 py-2">Malzeme</th>
                                            <th className="px-2 py-2 w-24">Sipariş Adet</th>
                                            <th className="px-2 py-2 w-24">Gelen Adet</th>
                                            <th className="px-2 py-2 w-32">Birim Fiyat</th>
                                            <th className="px-2 py-2 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((it, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="px-2 py-2">
                                                    <select value={it.stock_id} onChange={e => { const newI = [...items]; newI[idx].stock_id = e.target.value; setItems(newI); }} className="w-full p-2 border rounded-lg">
                                                        <option value="">Seçiniz...</option>
                                                        {data.stock?.map((s: any) => <option key={s.id} value={s.id}>{s.itemName || s.item_name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-2 py-2"><input type="number" value={it.ordered_quantity} onChange={e => { const newI = [...items]; newI[idx].ordered_quantity = Number(e.target.value); setItems(newI); }} className="w-full p-2 border rounded-lg" min="1" /></td>
                                                <td className="px-2 py-2"><input type="number" value={it.received_quantity} onChange={e => { const newI = [...items]; newI[idx].received_quantity = Number(e.target.value); setItems(newI); }} className="w-full p-2 border rounded-lg" min="0" /></td>
                                                <td className="px-2 py-2"><input type="number" value={it.unit_price} onChange={e => { const newI = [...items]; newI[idx].unit_price = Number(e.target.value); setItems(newI); }} className="w-full p-2 border rounded-lg" min="0" step="0.01" /></td>
                                                <td className="px-2 py-2"><button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-red-600"><X size={18} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-xl">İptal</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2"><Save size={16} /> Kaydet</button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
