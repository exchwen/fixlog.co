const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');
c = c.replace(/setTimeout\(\(\) => \{\s*handleClose\(\);\s*\}, 2500\);/, '');
fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
