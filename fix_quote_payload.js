const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');

c = c.replace(/body: JSON\.stringify\(\{\s*company_slug: companySlug,\s*quote_type: quoteType,\s*customer_name: customerName,\s*customer_phone: customerPhone,\s*asset_name: assetName,\s*quote_details:/, \ody: JSON.stringify({
          company_slug: companySlug,
          quote_type: quoteType,
          is_new_customer: newCustomerMode,
          customer_id: newCustomerMode ? null : selectedCustomerId,
          customer_name: customerName,
          customer_phone: customerPhone,
          is_new_asset: newAssetMode,
          asset_id: newAssetMode ? null : selectedAssetId,
          asset_name: assetName,
          quote_details:\);

fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
