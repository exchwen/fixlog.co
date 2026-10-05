const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');

c = c.replace(
  'export default function QuoteModal({ showQuoteModal, setShowQuoteModal, data }: any) {',
  'export default function QuoteModal({ showQuoteModal, setShowQuoteModal, data, setActiveTab }: any) {'
);

c = c.replace(
  'const handlePrint = useReactToPrint({',
  '// @ts-ignore\\n  const handlePrint = useReactToPrint({\\n    contentRef: printRef,'
);

c = c.replace(
  'content: () => printRef.current,',
  ''
);

const newHandleSubmit = \
  const handleSubmit = async () => {
    setStatus('loading');
    try {
      const companySlug = data?.slug || data?.company_slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '');
      const assetName = newAssetMode ? newAssetName : (data?.assets?.find((a: any) => a.id.toString() === selectedAssetId)?.name || 'Bilinmiyor');
      
      await fetch('/add-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_slug: companySlug,
          quote_type: quoteType,
          customer_name: customerName,
          customer_phone: customerPhone,
          asset_name: assetName,
          quote_details: {
             revisionDetails,
             elevatorType,
             stopsCount,
             capacity
          }
        })
      });
      setStatus('success');
    } catch(e) {
      alert("Hata oluştu");
      setStatus('idle');
    }
  };
\;

c = c.replace(/const handleSubmit = \(\) => \{[\s\S]*?\}, 1500\);\s*\};/, newHandleSubmit.trim());

fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
