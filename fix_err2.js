const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');

c = c.replace(/await fetch\('\/add-quote', \{[\s\S]*?\}\);[\s\S]*?setStatus\('success'\);/, 
    "const res = await fetch('/add-quote', {\\n" +
    "    method: 'POST',\\n" +
    "    headers: { 'Content-Type': 'application/json' },\\n" +
    "    body: JSON.stringify({\\n" +
    "      company_slug: companySlug,\\n" +
    "      quote_type: quoteType,\\n" +
    "      is_new_customer: newCustomerMode,\\n" +
    "      customer_id: newCustomerMode ? null : selectedCustomerId,\\n" +
    "      customer_name: customerName,\\n" +
    "      customer_phone: customerPhone,\\n" +
    "      is_new_asset: newAssetMode,\\n" +
    "      asset_id: newAssetMode ? null : selectedAssetId,\\n" +
    "      asset_name: assetName,\\n" +
    "      quote_details: {\\n" +
    "         revisionDetails,\\n" +
    "         elevatorType,\\n" +
    "         stopsCount,\\n" +
    "         capacity\\n" +
    "      }\\n" +
    "    })\\n" +
    "  });\\n" +
    "  const r = await res.json();\\n" +
    "  if(!r.success) throw new Error(r.error || 'Bilinmeyen Hata');\\n" +
    "  setStatus('success');"
);

c = c.replace(/\} catch\(e\) \{\s*alert\("Hata olu.tu"\);/, "} catch(e: any) {\\n      alert('Hata oluştu: ' + (e.message || ''));");

fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
