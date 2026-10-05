const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');
c = c.replace(/filter\(\(c\) =>/g, "filter((c: any) =>");
c = c.replace(/map\(\(c\) =>/g, "map((c: any) =>");
fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
