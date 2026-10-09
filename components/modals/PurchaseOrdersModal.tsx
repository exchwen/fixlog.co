import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, CheckSquare, Loader2, Save, Truck, PackageCheck, CircleDollarSign, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const BOM_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fixlog.co';
const getAuthToken = () => typeof window === 'undefined' ? '' : localStorage.getItem('patron_authToken') || localStorage.getItem('staff_authToken') || localStorage.getItem('masterbossToken') || '';
const parseOrderItems = (raw: any): any[] => {
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw;
        return Array.isArray(parsed) ? parsed.map(item => ({
            ...item,
            ordered_quantity: item.ordered_quantity ?? item.quantity ?? 0,
            received_quantity: item.received_quantity ?? 0,
            unit_price: item.unit_price ?? item.price ?? 0,
        })) : [];
    }
    catch { return []; }
};
const money = (value: number) => `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
const getItemValues = (items: any[]) => items.reduce((sum, item) => {
    const ordered = Math.max(0, Number(item.ordered_quantity) || 0);
    const received = Math.min(ordered, Math.max(0, Number(item.received_quantity) || 0));
    const price = Math.max(0, Number(item.unit_price) || 0);
    sum.total += ordered * price;
    sum.received += received * price;
    sum.pending += Math.max(0, ordered - received) * price;
    sum.orderedQty += ordered;
    sum.receivedQty += received;
    return sum;
}, { total: 0, received: 0, pending: 0, orderedQty: 0, receivedQty: 0 });

export default function PurchaseOrdersModal({ data, onClose }: any) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any>(null);
    const [name, setName] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState<any[]>([]); 
    const [bomTemplates, setBomTemplates] = useState<any[]>([]);
    const [cancelTarget, setCancelTarget] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    
    const companySlug = data?.slug || data?.company_slug;

    const apiRequest = async (path: string, init: RequestInit = {}) => {
        const response = await fetch(`${BOM_API_URL}${path}`, {
            ...init,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}`, ...init.headers },
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false) throw new Error(result.error || 'İşlem tamamlanamadı.');
        return result;
    };

    const refreshOrders = async () => {
        const result = await apiRequest(`/get-purchase-orders?company_slug=${encodeURIComponent(companySlug || '')}`);
        setOrders(Array.isArray(result.data) ? result.data : []);
    };

    useEffect(() => {
        let cancelled = false;
        if (!companySlug) { setLoading(false); return; }
        setLoading(true);
        Promise.all([
            apiRequest(`/get-purchase-orders?company_slug=${encodeURIComponent(companySlug)}`),
            apiRequest(`/get-bom-templates?slug=${encodeURIComponent(companySlug)}&company_slug=${encodeURIComponent(companySlug)}`),
        ]).then(([ordersResult, templatesResult]) => {
            if (cancelled) return;
            setOrders(Array.isArray(ordersResult.data) ? ordersResult.data : []);
            setBomTemplates(Array.isArray(templatesResult.data) ? templatesResult.data : []);
        }).catch((error: any) => { if (!cancelled) window.alert(error.message || 'Siparişler yüklenemedi.'); })
          .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [companySlug]);

    const activeOrders = useMemo(() => orders.filter(order => order.status !== 'İptal' && order.status !== 'Iptal'), [orders]);
    const summary = useMemo(() => {
        const result = { delivered: 0, untouched: 0, partial: 0, total: 0, received: 0, pending: 0 };
        activeOrders.forEach(order => {
            const values = getItemValues(parseOrderItems(order.items));
            result.total += values.total;
            result.received += values.received;
            result.pending += values.pending;
            if (values.orderedQty > 0 && values.receivedQty >= values.orderedQty) result.delivered++;
            else if (values.receivedQty === 0) result.untouched++;
            else result.partial++;
        });
        const total = result.received + result.pending;
        const receivedPercent = total ? Math.round(result.received / total * 100) : 0;
        return { ...result, receivedPercent, pendingPercent: total ? 100 - receivedPercent : 0 };
    }, [activeOrders]);

    const handleSave = async () => {
        if (!name.trim()) return window.alert('Siparis adi gerekli.');
        if (!supplierId) return window.alert('Tedarikci secin.');
        if (!items.length || items.some(it => !it.stock_id || Number(it.ordered_quantity) <= 0 || Number(it.received_quantity) < 0 || Number(it.received_quantity) > Number(it.ordered_quantity) || Number(it.unit_price) < 0)) return window.alert('Siparis kalemlerini ve miktarlari kontrol edin.');
        const id = editing?.id || Date.now().toString();
        const endpoint = editing?.id ? '/update-purchase-order' : '/add-purchase-order';
        const payload = { id, slug: companySlug, company_slug: companySlug, name: name.trim(), supplier_id: supplierId, items };
        setSaving(true);
        try {
            await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(payload) });
            setEditing(null);
            await refreshOrders();
        } catch (error: any) { window.alert(error.message || 'Siparis kaydedilemedi.'); }
        finally { setSaving(false); }
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;
        try {
            await apiRequest('/update-purchase-order', { method: 'POST', body: JSON.stringify({
                id: cancelTarget.id, slug: companySlug, company_slug: companySlug, name: cancelTarget.name,
                supplier_id: cancelTarget.supplier_id, status: '\u0130ptal', items: parseOrderItems(cancelTarget.items),
            }) });
            setCancelTarget(null);
            await refreshOrders();
        } catch (error: any) { window.alert(error.message || 'Siparis iptal edilemedi.'); }
    };

    const loadBomTemplate = (templateId: string) => {
        const t = bomTemplates.find(x => x.id === templateId);
        if(!t) return;
        try {
            const parsed = parseOrderItems(t.items);
            if (!Array.isArray(parsed)) throw new Error('Invalid BOM items');
            const newItems = parsed.filter((pi: any) => pi.stock_id && Number(pi.quantity) > 0).map((pi: any) => ({
                stock_id: pi.stock_id,
                ordered_quantity: pi.quantity,
                received_quantity: 0,
                unit_price: Number(data.stock?.find((stock: any) => String(stock.id) === String(pi.stock_id))?.unit_price || 0)
            }));
            setItems(current => [...current, ...newItems]);
            const supplierIds = [...new Set(parsed.map((pi: any) => data.stock?.find((stock: any) => String(stock.id) === String(pi.stock_id))?.supplier_id).filter(Boolean).map(String))];
            if (supplierIds.length === 1) setSupplierId(supplierIds[0]);
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

                {!editing && (
                    <div className="mb-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-emerald-800"><PackageCheck size={17} /> Tam teslim alinan</div><div className="mt-2 text-2xl font-black text-emerald-900">{summary.delivered} <span className="text-sm font-semibold">siparis</span></div></div>
                            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-amber-800"><Truck size={17} /> Henuz teslim alinmayan</div><div className="mt-2 text-2xl font-black text-amber-900">{summary.untouched} <span className="text-sm font-semibold">siparis</span></div><div className="text-xs text-amber-700">Kismi gelen: {summary.partial}</div></div>
                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-blue-800"><CircleDollarSign size={17} /> Aktif siparisler</div><div className="mt-2 text-lg font-black text-blue-900">{money(summary.total)}</div><div className="text-xs text-blue-700">Iptal siparisler haric</div></div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4">
                            <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span className="font-bold text-emerald-700">Depoya gelen: {money(summary.received)} (%{summary.receivedPercent})</span><span className="font-bold text-amber-700">Yolda / beklenen: {money(summary.pending)} (%{summary.pendingPercent})</span></div>
                            <div className="flex h-3 overflow-hidden rounded-full bg-amber-100"><div className="bg-emerald-500 transition-all" style={{ width: summary.receivedPercent + '%' }} /><div className="bg-amber-400 transition-all" style={{ width: summary.pendingPercent + '%' }} /></div>
                            <p className="mt-2 text-xs text-slate-500">Yuzdeler iptal olmayan siparislerin teslim alinmis ve beklenen tutari uzerinden hesaplanir.</p>
                        </div>
                    </div>
                )}

                {!editing ? (
                    <div>
                        <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-4 py-2 rounded-xl mb-4 flex items-center gap-2"><Plus size={16} /> Yeni Sipariş</button>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                            <div className="grid gap-4">
                                {orders.map(o => {
                                    const parsedItems = parseOrderItems(o.items);
                                    const totals = getItemValues(parsedItems);
                                    const percent = totals.total > 0 ? Math.round(totals.received / totals.total * 100) : (totals.orderedQty ? Math.round(totals.receivedQty / totals.orderedQty * 100) : 0);
                                    const cancelled = o.status === 'Iptal' || o.status === '\u0130ptal';
                                    const complete = totals.orderedQty > 0 && totals.receivedQty >= totals.orderedQty;
                                    
                                    return (
                                        <div key={o.id} className="border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1 w-full">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold">{o.name}</h3>
                                                    <span className="text-xs px-2 py-1 bg-slate-100 rounded-lg">{cancelled ? 'Iptal' : complete ? 'Tamamlandi' : totals.receivedQty ? 'Kismi teslim' : 'Bekliyor'}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">Tedarikçi: {data.suppliers?.find((s:any) => s.id == o.supplier_id)?.name || 'Bilinmiyor'}</p>
                                                
                                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                                                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: percent + '%' }}></div>
                                                </div>
                                                <p className="text-xs mt-1 text-gray-600">Teslim miktari: {totals.receivedQty} / {totals.orderedQty} ? %{percent}</p>
                                                <p className="text-xs text-gray-600">Gelen: {money(totals.received)} ? Beklenen: {money(totals.pending)} ? Toplam: {money(totals.total)}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {!cancelled && <button onClick={() => { setEditing(o); setName(o.name); setSupplierId(String(o.supplier_id)); setItems(parsedItems); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Teslim al / duzenle"><CheckSquare size={18} /></button>}
                                                {!cancelled && !complete && <button onClick={() => setCancelTarget(o)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Siparisi iptal et"><XCircle size={18} /></button>}
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
                {cancelTarget && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
                        <div role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                            <h3 id="cancel-order-title" className="text-lg font-bold text-slate-900">Siparişi iptal et?</h3>
                            <p className="mt-2 text-sm text-slate-600">{cancelTarget.name} iptal edilecek. Daha önce depoya alınan malzemeler stokta kalır.</p>
                            <div className="mt-6 flex justify-end gap-2">
                                <button onClick={() => setCancelTarget(null)} className="rounded-xl border px-4 py-2">Vazgeç</button>
                                <button onClick={handleCancel} className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white">Siparişi iptal et</button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
