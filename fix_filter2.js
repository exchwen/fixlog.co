const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');

const oldFilter = /\{\(data\?\.assets \|\| \[\]\)\.filter\(\(a: any\) => \{\r?\n\s*const term/g;
c = c.replace(oldFilter, "{(data?.assets || []).filter((a: any) => {\\n                                      if (!newCustomerMode && selectedCustomerId && String(a.customer_id) !== selectedCustomerId) return false;\\n                                      const term");

const oldEmpty = /\{\(data\?\.assets \|\| \[\]\)\.length === 0/g;
c = c.replace(oldEmpty, "{(data?.assets || []).filter((a: any) => (!newCustomerMode && selectedCustomerId) ? String(a.customer_id) === selectedCustomerId : true).length === 0");

c = c.replace(/\\n/g, '\n');
fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
