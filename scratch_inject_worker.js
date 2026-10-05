const fs = require('fs');
const code = fs.readFileSync('worker.js', 'utf8');

const endpoints = `
            // --- BOM TEMPLATES ---
            if (url.pathname === "/get-bom-templates" && method === "GET") {
                const slug = url.searchParams.get("company_slug");
                if (!slug) return new Response("Missing company_slug", { status: 400, headers: corsHeaders });
                const { results } = await env.DB.prepare("SELECT * FROM bom_templates WHERE company_slug = ? ORDER BY created_at DESC").bind(slug).all();
                return new Response(JSON.stringify({ success: true, data: results }), { headers: corsHeaders });
            }
            if (url.pathname === "/add-bom-template" && method === "POST") {
                const { id, company_slug, name, description, items } = await request.json();
                try {
                    await env.DB.prepare("INSERT INTO bom_templates (id, company_slug, name, description, items) VALUES (?, ?, ?, ?, ?)").bind(id, company_slug, name, description || '', JSON.stringify(items)).run();
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (err) { return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders }); }
            }
            if (url.pathname === "/update-bom-template" && method === "POST") {
                const { id, company_slug, name, description, items } = await request.json();
                try {
                    await env.DB.prepare("UPDATE bom_templates SET name = ?, description = ?, items = ? WHERE id = ? AND company_slug = ?").bind(name, description || '', JSON.stringify(items), id, company_slug).run();
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (err) { return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders }); }
            }
            if (url.pathname === "/delete-bom-template" && method === "POST") {
                const { id, company_slug } = await request.json();
                try {
                    await env.DB.prepare("DELETE FROM bom_templates WHERE id = ? AND company_slug = ?").bind(id, company_slug).run();
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (err) { return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders }); }
            }

            // --- PURCHASE ORDERS ---
            if (url.pathname === "/get-purchase-orders" && method === "GET") {
                const slug = url.searchParams.get("company_slug");
                if (!slug) return new Response("Missing company_slug", { status: 400, headers: corsHeaders });
                const { results } = await env.DB.prepare("SELECT * FROM purchase_orders WHERE company_slug = ? ORDER BY created_at DESC").bind(slug).all();
                return new Response(JSON.stringify({ success: true, data: results }), { headers: corsHeaders });
            }
            if (url.pathname === "/add-purchase-order" && method === "POST") {
                const { id, company_slug, name, supplier_id, status, items, total_value } = await request.json();
                try {
                    await env.DB.prepare("INSERT INTO purchase_orders (id, company_slug, name, supplier_id, status, items, total_value) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, company_slug, name, supplier_id || null, status || 'Bekliyor', JSON.stringify(items), total_value || 0).run();
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (err) { return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders }); }
            }
            if (url.pathname === "/update-purchase-order" && method === "POST") {
                const { id, company_slug, name, supplier_id, status, items, total_value } = await request.json();
                try {
                    await env.DB.prepare("UPDATE purchase_orders SET name = ?, supplier_id = ?, status = ?, items = ?, total_value = ? WHERE id = ? AND company_slug = ?").bind(name, supplier_id || null, status, JSON.stringify(items), total_value, id, company_slug).run();
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (err) { return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders }); }
            }
            if (url.pathname === "/delete-purchase-order" && method === "POST") {
                const { id, company_slug } = await request.json();
                try {
                    await env.DB.prepare("DELETE FROM purchase_orders WHERE id = ? AND company_slug = ?").bind(id, company_slug).run();
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (err) { return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders }); }
            }

            // --- INVENTORY RETURNS ---
            if (url.pathname === "/get-inventory-returns" && method === "GET") {
                const slug = url.searchParams.get("company_slug");
                if (!slug) return new Response("Missing company_slug", { status: 400, headers: corsHeaders });
                const { results } = await env.DB.prepare("SELECT * FROM inventory_returns WHERE company_slug = ? ORDER BY created_at DESC").bind(slug).all();
                return new Response(JSON.stringify({ success: true, data: results }), { headers: corsHeaders });
            }
            if (url.pathname === "/add-inventory-return" && method === "POST") {
                const { id, company_slug, staff_id, job_id, items, status } = await request.json();
                try {
                    await env.DB.prepare("INSERT INTO inventory_returns (id, company_slug, staff_id, job_id, items, status) VALUES (?, ?, ?, ?, ?, ?)").bind(id, company_slug, staff_id || null, job_id || null, JSON.stringify(items), status || 'Bekliyor').run();
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (err) { return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders }); }
            }
            if (url.pathname === "/update-inventory-return" && method === "POST") {
                const { id, company_slug, staff_id, job_id, items, status } = await request.json();
                try {
                    await env.DB.prepare("UPDATE inventory_returns SET staff_id = ?, job_id = ?, items = ?, status = ? WHERE id = ? AND company_slug = ?").bind(staff_id || null, job_id || null, JSON.stringify(items), status, id, company_slug).run();
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (err) { return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders }); }
            }
            if (url.pathname === "/delete-inventory-return" && method === "POST") {
                const { id, company_slug } = await request.json();
                try {
                    await env.DB.prepare("DELETE FROM inventory_returns WHERE id = ? AND company_slug = ?").bind(id, company_slug).run();
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (err) { return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders }); }
            }
`;

const targetStr = 'return new Response("Not Found", { status: 404, headers: corsHeaders });';
if (code.includes(targetStr)) {
    const newCode = code.replace(targetStr, endpoints + '\n            ' + targetStr);
    fs.writeFileSync('worker.js', newCode, 'utf8');
    console.log('Successfully injected endpoints!');
} else {
    console.log('Could not find target string in worker.js');
}
