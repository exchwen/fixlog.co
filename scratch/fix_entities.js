const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'masterboss', 'dashboard', 'page.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix unescaped entities
content = content.replace("Ekrana Ekle'yi", "Ekrana Ekle&apos;yi");
content = content.split("Paywall'a Düşür").join("Paywall&apos;a Düşür");
content = content.replace('"Karlılık & Maliyet"', '&quot;Karlılık &amp; Maliyet&quot;');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed entities!');
