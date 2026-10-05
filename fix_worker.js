const fs = require('fs');
let w = fs.readFileSync('worker.js', 'utf8');

const createTableStr = "await env.DB.prepare(\CREATE TABLE IF NOT EXISTS quotes (id TEXT PRIMARY KEY, company_slug TEXT, quote_type TEXT, customer_name TEXT, customer_phone TEXT, asset_name TEXT, quote_details TEXT, status TEXT DEFAULT 'Bekliyor', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)\).run();";

w = w.replace(/await env\.DB\.prepare\(\CREATE TABLE IF NOT EXISTS inventory_returns.*?\)\.run\(\);/,
              "await env.DB.prepare(\CREATE TABLE IF NOT EXISTS inventory_returns (id TEXT PRIMARY KEY, company_slug TEXT, staff_id TEXT, job_id INTEGER, items TEXT, status TEXT DEFAULT 'Bekliyor', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)\).run();\\n                    " + createTableStr);

const endpoints = \
            if (url.pathname === "/add-quote" && method === "POST") {
                const data = await request.json();
                await env.DB.prepare("INSERT INTO quotes (id, company_slug, quote_type, customer_name, customer_phone, asset_name, quote_details, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                    .bind(data.id || Date.now().toString(), data.company_slug, data.quote_type, data.customer_name, data.customer_phone, data.asset_name, data.quote_details, data.status || 'Bekliyor').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/get-quotes" && method === "GET") {
                const slug = url.searchParams.get("company_slug");
                const res = await env.DB.prepare("SELECT * FROM quotes WHERE company_slug = ? ORDER BY created_at DESC").bind(slug).all();
                return new Response(JSON.stringify({ success: true, data: res.results }), { headers: corsHeaders });
            }

            if (url.pathname === "/delete-quote" && method === "POST") {
                const data = await request.json();
                await env.DB.prepare("DELETE FROM quotes WHERE id = ? AND company_slug = ?").bind(data.id, data.company_slug).run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }
\;

w = w.replace(/if \(url\.pathname === "\/get-bom-templates"/, endpoints + "\\n            if (url.pathname === \\"/get-bom-templates\\"");

fs.writeFileSync('worker.js', w);
