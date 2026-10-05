const fs = require('fs');
let content = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');
const search = '<FileText size={16}/> Termal Fi';
const search2 = 'Yazd';
const search3 = 'r</button>\n                  </div>';
let i = content.indexOf(search);
if (i !== -1) {
    let end = content.indexOf('</div>', i) + 6;
    let original = content.substring(content.lastIndexOf('<div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-sm mx-auto">', i), end);
    let btn = 
                  <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-sm mx-auto mt-3">
                     <button onClick={() => { setShowQuoteModal(false); if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('navTab', { detail: 'quotes' })); }} className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">Sözleşmelere Git</button>
                  </div>;
    if (!content.includes('Sözleşmelere Git')) {
        content = content.replace(original, original + btn);
        fs.writeFileSync('components/modals/forms/QuoteModal.tsx', content);
        console.log('Success');
    } else {
        console.log('Already exists');
    }
}
