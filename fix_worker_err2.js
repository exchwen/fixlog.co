const fs = require('fs');
let w = fs.readFileSync('worker.js', 'utf8');

w = w.replace(
    'return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });\\n            }',
    'return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });\\n                } catch(e) { return new Response(JSON.stringify({ success: false, error: e.message }), { headers: corsHeaders }); }\\n            }'
);

fs.writeFileSync('worker.js', w);
