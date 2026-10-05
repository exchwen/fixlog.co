import re

with open('components/modals/forms/QuoteModal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

if 'const [newCustomerMode' not in c:
    c = c.replace(
        \"const [customerEmail, setCustomerEmail] = useState('');\",
        \"const [customerEmail, setCustomerEmail] = useState('');\\n  const [newCustomerMode, setNewCustomerMode] = useState(false);\\n  const [searchCustomer, setSearchCustomer] = useState('');\\n  const [selectedCustomerId, setSelectedCustomerId] = useState('');\"
    )

customer_ui = \"\"\"
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Müşteri Seçimi</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                              <button onClick={() => {setNewCustomerMode(false); setSelectedCustomerId('');}} className={lex-1 py-2 text-xs font-bold rounded-lg transition-all }>Sistemde Var Olanı Seç</button>
                               <button onClick={() => {setNewCustomerMode(true); setSelectedCustomerId('');}} className={lex-1 py-2 text-xs font-bold rounded-lg transition-all }>+ Yeni Müşteri Ekle</button>
                            </div>

                            {!newCustomerMode ? (
                              <div className="space-y-3">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                  <input type="text" placeholder="Müşteri Ara..." className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} />
                                </div>
                                <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                  <div className="max-h-48 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">
                                    {(data?.customers || []).filter((c: any) => {
                                        const term = (searchCustomer || '').toLowerCase();
                                        return (c.name || '').toLowerCase().includes(term);
                                    }).map((c: any) => {
                                        const isSelected = selectedCustomerId === String(c.id);
                                        return (
                                            <button 
                                                key={c.id} 
                                                onClick={() => { setSelectedCustomerId(String(c.id)); setCustomerName(c.name || ''); setCustomerPhone(c.phone || ''); }}
                                                className={	ext-left p-3 rounded-lg border transition-all }
                                            >
                                                <div className="font-bold text-sm text-slate-800">{c.name}</div>
                                                {c.phone && <div className="text-xs text-slate-500 mt-0.5">{c.phone}</div>}
                                            </button>
                                        )
                                    })}
                                    {(data?.customers || []).length === 0 && (
                                      <div className="p-4 text-center text-xs text-slate-500">Sistemde kayıtlı müşteri yok. Yeni eklemeyi seçin.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                                <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Yeni Müşteri Adı *</label>
                                    <input required type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Örn: X Apartmanı veya Y Firması" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Telefon Numarası</label>
                                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="05XX XXX XX XX" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />
                                  </div>
                                </div>
                            )}
                        </div>
\"\"\"

c = re.sub(r'<div className=\"space-y-4\">\\s*<div className=\"space-y-1\.5\">\\s*<label[^>]*>.*?<\\/label>\\s*<input[^>]*setCustomerName[^>]*>\\s*<\\/div>\\s*<div className=\"space-y-1\.5\">\\s*<label[^>]*>.*?<\\/label>\\s*<input[^>]*setCustomerPhone[^>]*>\\s*<\\/div>\\s*<\\/div>', customer_ui, c)

with open('components/modals/forms/QuoteModal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

