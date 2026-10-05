const fs = require('fs');
const path = require('path');

const bomTemplateModal = `
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Copy, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BomTemplatesModal({ data, onClose }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [items, setItems] = useState([]); // [{ stock_id, quantity }]
    
    const companySlug = data?.slug || data?.company_slug;

    useEffect(() => {
        fetch('/get-bom-templates?company_slug=' + companySlug)
            .then(res => res.json())
            .then(res => { if(res.success) setTemplates(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [companySlug]);

    const handleSave = async () => {
        if(!name) return alert('İsim gerekli');
        const id = editing?.id || Date.now().toString();
        const endpoint = editing ? '/update-bom-template' : '/add-bom-template';
        const payload = { id, company_slug: companySlug, name, description: desc, items };
        
        await fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
        onClose();
    };

    const handleDelete = async (id) => {
        if(!confirm('Emin misiniz?')) return;
        await fetch('/delete-bom-template', { method: 'POST', body: JSON.stringify({ id, company_slug: companySlug }) });
        setTemplates(templates.filter(t => t.id !== id));
    };

    const handleDuplicate = async (t) => {
        const payload = { id: Date.now().toString(), company_slug: companySlug, name: t.name + ' (Kopya)', description: t.description, items: JSON.parse(t.items || '[]') };
        await fetch('/add-bom-template', { method: 'POST', body: JSON.stringify(payload) });
        onClose();
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
                        <button onClick={() => setEditing({})} className="bg-emerald-600 text-white px-4 py-2 rounded-xl mb-4 flex items-center gap-2"><Plus size={16} /> Yeni Şablon</button>
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
                                            <button onClick={() => { setEditing(t); setName(t.name); setDesc(t.description); setItems(JSON.parse(t.items || '[]')); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit2 size={18} /></button>
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
                                        {data.stock?.map(s => <option key={s.id} value={s.id}>{s.itemName || s.item_name}</option>)}
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
`;

const poModal = `
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Loader2, Save, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PurchaseOrdersModal({ data, onClose }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState([]); // [{ stock_id, ordered_quantity, received_quantity, unit_price }]
    const [status, setStatus] = useState('Bekliyor');
    
    const companySlug = data?.slug || data?.company_slug;

    useEffect(() => {
        fetch('/get-purchase-orders?company_slug=' + companySlug)
            .then(res => res.json())
            .then(res => { if(res.success) setOrders(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [companySlug]);

    const handleSave = async () => {
        if(!name) return alert('İsim gerekli');
        const id = editing?.id || Date.now().toString();
        const endpoint = editing ? '/update-purchase-order' : '/add-purchase-order';
        
        const totalValue = items.reduce((acc, it) => acc + (it.ordered_quantity * (it.unit_price || 0)), 0);
        const payload = { id, company_slug: companySlug, name, supplier_id: supplierId, status, items, total_value: totalValue };
        
        await fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
        onClose();
    };

    const handleDelete = async (id) => {
        if(!confirm('Emin misiniz?')) return;
        await fetch('/delete-purchase-order', { method: 'POST', body: JSON.stringify({ id, company_slug: companySlug }) });
        setOrders(orders.filter(t => t.id !== id));
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
                        <button onClick={() => setEditing({})} className="bg-emerald-600 text-white px-4 py-2 rounded-xl mb-4 flex items-center gap-2"><Plus size={16} /> Yeni Sipariş</button>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                            <div className="grid gap-4">
                                {orders.map(o => {
                                    const parsedItems = JSON.parse(o.items || '[]');
                                    const totalOrdered = parsedItems.reduce((acc, it) => acc + Number(it.ordered_quantity || 0), 0);
                                    const totalReceived = parsedItems.reduce((acc, it) => acc + Number(it.received_quantity || 0), 0);
                                    const percent = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
                                    const totalValueReceived = parsedItems.reduce((acc, it) => acc + (Number(it.received_quantity || 0) * Number(it.unit_price || 0)), 0);
                                    
                                    return (
                                        <div key={o.id} className="border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold">{o.name}</h3>
                                                    <span className="text-xs px-2 py-1 bg-slate-100 rounded-lg">{o.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">Tedarikçi: {data.suppliers?.find(s => s.id == o.supplier_id)?.name || 'Bilinmiyor'}</p>
                                                
                                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                                                  <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: percent + '%' }}></div>
                                                </div>
                                                <p className="text-xs mt-1 text-gray-600">Tamamlanma: %{percent} ({totalReceived} / {totalOrdered} kalem geldi)</p>
                                                <p className="text-xs text-gray-600">Gelen Değer: {totalValueReceived.toLocaleString('tr-TR')} ₺ / Toplam: {o.total_value?.toLocaleString('tr-TR')} ₺</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditing(o); setName(o.name); setSupplierId(o.supplier_id); setStatus(o.status); setItems(parsedItems); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Düzenle / Malzeme Kabul"><CheckSquare size={18} /></button>
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
                                {data.suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                                <button onClick={() => setItems([...items, { stock_id: '', ordered_quantity: 1, received_quantity: 0, unit_price: 0 }])} className="text-sm bg-slate-100 px-3 py-1 rounded-lg flex items-center gap-1"><Plus size={14} /> Kalem Ekle</button>
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
                                                        {data.stock?.map(s => <option key={s.id} value={s.id}>{s.itemName || s.item_name}</option>)}
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
                            <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-xl flex items-center gap-2"><Save size={16} /> Kaydet</button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
`;

const inventoryModal = `
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InventoryReturnsModal({ data, onClose }) {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [staffId, setStaffId] = useState('');
    const [jobId, setJobId] = useState('');
    const [items, setItems] = useState([]); // [{ stock_id, quantity, condition }]
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
        const endpoint = editing ? '/update-inventory-return' : '/add-inventory-return';
        const payload = { id, company_slug: companySlug, staff_id: staffId, job_id: jobId, status, items };
        
        await fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
        onClose();
    };

    const handleDelete = async (id) => {
        if(!confirm('Emin misiniz?')) return;
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
                        <button onClick={() => setEditing({})} className="bg-emerald-600 text-white px-4 py-2 rounded-xl mb-4 flex items-center gap-2"><Plus size={16} /> Yeni İade Kaydı</button>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                            <div className="grid gap-4">
                                {returns.map(r => {
                                    const parsedItems = JSON.parse(r.items || '[]');
                                    return (
                                        <div key={r.id} className="border p-4 rounded-xl flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold">İade #{r.id.slice(-6)}</h3>
                                                    <span className={\`text-xs px-2 py-1 rounded-lg \${r.status === 'Onaylandı' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}\`}>{r.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">{parsedItems.length} Kalem Malzeme</p>
                                                <p className="text-xs text-gray-400">Personel: {data.staff?.find(s => s.id == r.staff_id)?.name || 'Bilinmiyor'} | İş: {data.jobs?.find(j => j.id == r.job_id)?.title || 'Genel'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditing(r); setStaffId(r.staff_id); setJobId(r.job_id); setStatus(r.status); setItems(parsedItems); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit2 size={18} /></button>
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
                                {data.staff?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select value={jobId} onChange={e => setJobId(e.target.value)} className="flex-1 p-3 border rounded-xl">
                                <option value="">İlgili İş (Opsiyonel)</option>
                                {data.jobs?.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
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
                                        {data.stock?.map(s => <option key={s.id} value={s.id}>{s.itemName || s.item_name}</option>)}
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
                            <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-xl flex items-center gap-2"><Save size={16} /> Kaydet</button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
`;

fs.mkdirSync(path.join('components', 'modals'), { recursive: true });
fs.writeFileSync(path.join('components', 'modals', 'BomTemplatesModal.tsx'), bomTemplateModal);
fs.writeFileSync(path.join('components', 'modals', 'PurchaseOrdersModal.tsx'), poModal);
fs.writeFileSync(path.join('components', 'modals', 'InventoryReturnsModal.tsx'), inventoryModal);
console.log('Modals created');

// Now inject into StockTab.tsx
let stockTab = fs.readFileSync(path.join('components', 'patron', 'StockTab.tsx'), 'utf8');

// Add imports
if (!stockTab.includes('BomTemplatesModal')) {
    const importStr = \`
import BomTemplatesModal from '../modals/BomTemplatesModal';
import PurchaseOrdersModal from '../modals/PurchaseOrdersModal';
import InventoryReturnsModal from '../modals/InventoryReturnsModal';
\`;
    stockTab = stockTab.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';" + importStr);
}

// Add state variables
if (!stockTab.includes('showBomModal')) {
    const stateStr = \`
  const [showBomModal, setShowBomModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
\`;
    stockTab = stockTab.replace("const [searchTerm, setSearchTerm] = useState('');", "const [searchTerm, setSearchTerm] = useState('');" + stateStr);
}

// Add Buttons
if (!stockTab.includes('BOM Şablonları')) {
    const buttonsStr = \`
               {/* Yeni Eklenen Modüller */}
               <button onClick={() => setShowBomModal(true)} className="col-span-2 sm:col-span-1 bg-indigo-600 text-white px-4 py-3 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 hover:bg-indigo-700 whitespace-nowrap transition-all active:scale-95 border border-indigo-700">
                 BOM Şablonları
               </button>
               <button onClick={() => setShowPoModal(true)} className="col-span-2 sm:col-span-1 bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 whitespace-nowrap transition-all active:scale-95 border border-blue-700">
                 Satın Alma
               </button>
               <button onClick={() => setShowReturnsModal(true)} className="col-span-2 sm:col-span-1 bg-orange-600 text-white px-4 py-3 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-orange-200 hover:bg-orange-700 whitespace-nowrap transition-all active:scale-95 border border-orange-700">
                 İade / Dönüş
               </button>
\`;
    stockTab = stockTab.replace('<Archive size={16} /> Stok Girişi\n               </button>', '<Archive size={16} /> Stok Girişi\n               </button>' + buttonsStr);
}

// Add Modals at bottom
if (!stockTab.includes('<BomTemplatesModal')) {
    const modalsStr = \`
      {showBomModal && <BomTemplatesModal data={data} onClose={() => setShowBomModal(false)} />}
      {showPoModal && <PurchaseOrdersModal data={data} onClose={() => setShowPoModal(false)} />}
      {showReturnsModal && <InventoryReturnsModal data={data} onClose={() => setShowReturnsModal(false)} />}
\`;
    // Find last </div> before export default function
    const parts = stockTab.split('</AnimatePresence>');
    if (parts.length > 1) {
        parts[1] = modalsStr + '\\n' + parts[1];
        stockTab = parts.join('</AnimatePresence>');
    }
}

fs.writeFileSync(path.join('components', 'patron', 'StockTab.tsx'), stockTab);
console.log('StockTab updated');
