const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');

c = c.replace(
    /await fetch\('\/add-quote', \{[\s\S]*?\}\);[\s\S]*?setStatus\('success'\);/,
    \const res = await fetch('/add-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_slug: companySlug,
          quote_type: quoteType,
          is_new_customer: newCustomerMode,
          customer_id: newCustomerMode ? null : selectedCustomerId,
          customer_name: customerName,
          customer_phone: customerPhone,
          is_new_asset: newAssetMode,
          asset_id: newAssetMode ? null : selectedAssetId,
          asset_name: assetName,
          quote_details: {
             revisionDetails,
             elevatorType,
             stopsCount,
             capacity
          }
        })
      });
      
      const responseData = await res.text();
      if (!res.ok) {
        throw new Error('API Error: ' + responseData);
      }
      try {
        const j = JSON.parse(responseData);
        if(!j.success) throw new Error(j.error || 'Bilinmeyen hata');
      } catch(e) {
        // eger JSON degilse html olabilir (500)
      }
      
      setStatus('success');\
);

fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
