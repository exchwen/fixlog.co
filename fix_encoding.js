const fs = require('fs');
const buf = fs.readFileSync('components/modals/forms/QuoteModal.tsx');
// The file is currently UTF-16LE. We need to convert it to UTF-8.
const text = buf.toString('utf16le');
fs.writeFileSync('components/modals/forms/QuoteModal.tsx', text, 'utf8');
