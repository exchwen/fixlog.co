const fs = require('fs');

let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');

if (!c.includes('const [newCustomerMode')) {
    c = c.replace(
        "const [customerEmail, setCustomerEmail] = useState('');",
        "const [customerEmail, setCustomerEmail] = useState('');\n  const [newCustomerMode, setNewCustomerMode] = useState(false);\n  const [searchCustomer, setSearchCustomer] = useState('');\n  const [selectedCustomerId, setSelectedCustomerId] = useState('');"
    );
}

const customerUI = 
  '                        <div className="space-y-4">\n' +
  '                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Müşteri Seçimi</label>\n' +
  '                            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">\n' +
  '                              <button onClick={() => {setNewCustomerMode(false); setSelectedCustomerId(\'\');}} className={"flex-1 py-2 text-xs font-bold rounded-lg transition-all " + (!newCustomerMode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Sistemde Var Olanı Seç</button>\n' +
  '                               <button onClick={() => {setNewCustomerMode(true); setSelectedCustomerId(\'\');}} className={"flex-1 py-2 text-xs font-bold rounded-lg transition-all " + (newCustomerMode ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>+ Yeni Müşteri Ekle</button>\n' +
  '                            </div>\n' +
  '\n' +
  '                            {!newCustomerMode ? (\n' +
  '                              <div className="space-y-3">\n' +
  '                                <div className="relative">\n' +
  '                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />\n' +
  '                                  <input type="text" placeholder="Müşteri Ara..." className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} />\n' +
  '                                </div>\n' +
  '                                <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">\n' +
  '                                  <div className="max-h-48 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">\n' +
  '                                    {(data?.customers || []).filter((c) => {\n' +
  '                                        const term = (searchCustomer || \'\').toLowerCase();\n' +
  '                                        return (c.name || \'\').toLowerCase().includes(term);\n' +
  '                                    }).map((c) => {\n' +
  '                                        const isSelected = selectedCustomerId === String(c.id);\n' +
  '                                        return (\n' +
  '                                            <button \n' +
  '                                                key={c.id} \n' +
  '                                                onClick={() => { setSelectedCustomerId(String(c.id)); setCustomerName(c.name || \'\'); setCustomerPhone(c.phone || \'\'); }}\n' +
  '                                                className={"text-left p-3 rounded-lg border transition-all " + (isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100 hover:border-blue-200")}\n' +
  '                                            >\n' +
  '                                                <div className="font-bold text-sm text-slate-800">{c.name}</div>\n' +
  '                                                {c.phone && <div className="text-xs text-slate-500 mt-0.5">{c.phone}</div>}\n' +
  '                                            </button>\n' +
  '                                        )\n' +
  '                                    })}\n' +
  '                                    {(data?.customers || []).length === 0 && (\n' +
  '                                      <div className="p-4 text-center text-xs text-slate-500">Sistemde kayıtlı müşteri yok. Yeni eklemeyi seçin.</div>\n' +
  '                                    )}\n' +
  '                                  </div>\n' +
  '                                </div>\n' +
  '                              </div>\n' +
  '                            ) : (\n' +
  '                                <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">\n' +
  '                                  <div className="space-y-1.5">\n' +
  '                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Yeni Müşteri Adı *</label>\n' +
  '                                    <input required type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Örn: X Apartmanı veya Y Firması" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />\n' +
  '                                  </div>\n' +
  '                                  <div className="space-y-1.5">\n' +
  '                                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Telefon Numarası</label>\n' +
  '                                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="05XX XXX XX XX" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm" />\n' +
  '                                  </div>\n' +
  '                                </div>\n' +
  '                            )}\n' +
  '                        </div>';

c = c.replace(/<div className="space-y-4">\s*<div className="space-y-1\.5">\s*<label[^>]*>.*?<\/label>\s*<input[^>]*setCustomerName[^>]*>\s*<\/div>\s*<div className="space-y-1\.5">\s*<label[^>]*>.*?<\/label>\s*<input[^>]*setCustomerPhone[^>]*>\s*<\/div>\s*<\/div>/, customerUI);

fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
