const fs = require('fs');
const path = require('path');

let stockTab = fs.readFileSync(path.join('components', 'patron', 'StockTab.tsx'), 'utf8');

const importStr = `
import BomTemplatesModal from '../modals/BomTemplatesModal';
import PurchaseOrdersModal from '../modals/PurchaseOrdersModal';
import InventoryReturnsModal from '../modals/InventoryReturnsModal';
`;
if (!stockTab.includes('BomTemplatesModal')) {
    stockTab = stockTab.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\n" + importStr);
}

const stateStr = `
  const [showBomModal, setShowBomModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
`;
if (!stockTab.includes('showBomModal')) {
    stockTab = stockTab.replace("const [searchTerm, setSearchTerm] = useState('');", "const [searchTerm, setSearchTerm] = useState('');\n" + stateStr);
}

const buttonsStr = `
               <button onClick={() => setShowBomModal(true)} className="col-span-2 sm:col-span-1 bg-indigo-600 text-white px-4 py-3 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 hover:bg-indigo-700 whitespace-nowrap transition-all active:scale-95 border border-indigo-700">
                 BOM Şablonları
               </button>
               <button onClick={() => setShowPoModal(true)} className="col-span-2 sm:col-span-1 bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 whitespace-nowrap transition-all active:scale-95 border border-blue-700">
                 Satın Alma
               </button>
               <button onClick={() => setShowReturnsModal(true)} className="col-span-2 sm:col-span-1 bg-orange-600 text-white px-4 py-3 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-orange-200 hover:bg-orange-700 whitespace-nowrap transition-all active:scale-95 border border-orange-700">
                 İade / Dönüş
               </button>
`;
if (!stockTab.includes('BOM Şablonları')) {
    stockTab = stockTab.replace('<Archive size={16} /> Stok Girişi\n               </button>', '<Archive size={16} /> Stok Girişi\n               </button>\n' + buttonsStr);
}

const modalsStr = `
      {showBomModal && <BomTemplatesModal data={data} onClose={() => setShowBomModal(false)} />}
      {showPoModal && <PurchaseOrdersModal data={data} onClose={() => setShowPoModal(false)} />}
      {showReturnsModal && <InventoryReturnsModal data={data} onClose={() => setShowReturnsModal(false)} />}
`;
if (!stockTab.includes('<BomTemplatesModal')) {
    const parts = stockTab.split('</AnimatePresence>');
    if (parts.length > 1) {
        // Find the last occurrence
        const lastPart = parts.pop();
        const joined = parts.join('</AnimatePresence>') + '</AnimatePresence>\n' + modalsStr + lastPart;
        stockTab = joined;
    }
}

fs.writeFileSync(path.join('components', 'patron', 'StockTab.tsx'), stockTab);
console.log('StockTab updated successfully.');
