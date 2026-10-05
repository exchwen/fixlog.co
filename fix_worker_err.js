const fs = require('fs');
let w = fs.readFileSync('worker.js', 'utf8');

w = w.replace(
    'if (url.pathname === "/add-quote" && method === "POST") {\n                const data = await request.json();',
    'if (url.pathname === "/add-quote" && method === "POST") {\n                try {\n                const data = await request.json();'
);

w = w.replace(
    'return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });\n            }',
    'return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });\n                } catch(e) { return new Response(JSON.stringify({ success: false, error: e.message }), { headers: corsHeaders }); }\n            }'
);

fs.writeFileSync('worker.js', w);
