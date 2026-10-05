const fs = require('fs');
let w = fs.readFileSync('worker.js', 'utf8');

w = w.replace(/await env\.DB\.prepare\(\CREATE TABLE IF NOT EXISTS quotes.*?\)\.run\(\);\n/, '');
w = w.replace(/await env\.DB\.prepare\(CREATE TABLE IF NOT EXISTS quotes.*?\)\.run\(\);\n/, '');

fs.writeFileSync('worker.js', w);
