const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');
c = c.replace(/\\n/g, '\n');
fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
