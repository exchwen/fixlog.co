const fs = require('fs');
let w = fs.readFileSync('worker.js', 'utf8');

const newQuoteEndpoint = \
            // --- QUOTES ---
            if (url.pathname === "/add-quote" && method === "POST") {
                const data = await request.json();
                
                let finalCustomerId = data.customer_id;
                
                // 1. Müşteri işlemleri
                if (data.is_new_customer && data.customer_name) {
                    const insertCust = await env.DB.prepare("INSERT INTO customers (company_slug, name, contact, address, tax_info) VALUES (?, ?, ?, ?, ?) RETURNING id")
                        .bind(data.company_slug, data.customer_name, data.customer_phone || '', '', '').first();
                    if (insertCust) finalCustomerId = insertCust.id;
                }

                let finalAssetId = data.asset_id;

                // 2. Asansör/Varlık işlemleri
                if (data.is_new_asset && data.asset_name) {
                    const insertAsset = await env.DB.prepare("INSERT INTO assets (company_slug, name, location, apartmentName, asset_details, customer_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id")
                        .bind(data.company_slug, data.asset_name, '', '', JSON.stringify(data.quote_details || {}), finalCustomerId || null).first();
                    if (insertAsset) finalAssetId = insertAsset.id;
                } else if (finalAssetId && finalCustomerId) {
                    // Mevcut varlığı seçtiyse, müşterisiyle eşleştir
                    await env.DB.prepare("UPDATE assets SET customer_id = ? WHERE id = ? AND company_slug = ?")
                        .bind(finalCustomerId, finalAssetId, data.company_slug).run();
                }

                await env.DB.prepare("INSERT INTO quotes (id, company_slug, quote_type, customer_id, customer_name, customer_phone, asset_id, asset_name, quote_details, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                    .bind(data.id || Date.now().toString(), data.company_slug, data.quote_type, finalCustomerId || null, data.customer_name, data.customer_phone, finalAssetId || null, data.asset_name, JSON.stringify(data.quote_details || {}), data.status || 'Bekliyor').run();
                
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }
\;

w = w.replace(/\/\/\s*---\s*QUOTES\s*---\s*\n\s*if \(url\.pathname === "\/add-quote"[\s\S]*?\}\s*(?=if \(url\.pathname === "\/get-quotes")/, newQuoteEndpoint.trim() + '\n\n            ');

fs.writeFileSync('worker.js', w);
