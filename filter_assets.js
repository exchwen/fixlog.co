const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');

const oldFilter = \                                    {(data?.assets || []).filter((a: any) => {
                                        const term = (searchAsset || '').toLowerCase();
                                        return (a.name || '').toLowerCase().includes(term) || (a.apartmentName || '').toLowerCase().includes(term);
                                    }).map((a: any) => {\;

const newFilter = \                                    {(data?.assets || []).filter((a: any) => {
                                        if (!newCustomerMode && selectedCustomerId && String(a.customer_id) !== selectedCustomerId) return false;
                                        const term = (searchAsset || '').toLowerCase();
                                        return (a.name || '').toLowerCase().includes(term) || (a.apartmentName || '').toLowerCase().includes(term);
                                    }).map((a: any) => {\;

c = c.replace(oldFilter, newFilter);

const oldEmpty = \                                    {(data?.assets || []).length === 0 && (
                                      <div className="p-4 text-center text-xs text-slate-500">Sistemde kayıtlı asansör yok. Yeni eklemeyi seçin.</div>
                                    )}\;

const newEmpty = \                                    {(data?.assets || []).filter((a: any) => !newCustomerMode && selectedCustomerId ? String(a.customer_id) === selectedCustomerId : true).length === 0 && (
                                      <div className="p-4 text-center text-xs text-slate-500">Sistemde bu müşteriye ait kayıtlı asansör yok veya eşleşme bulunamadı. Lütfen yeni eklemeyi seçin.</div>
                                    )}\;

c = c.replace(oldEmpty, newEmpty);

fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
