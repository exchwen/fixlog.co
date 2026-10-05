const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');

c = c.replace(/setMaintenanceContract\(İşbu sözleşme, taraflar arasında aylık periyodik bakım hizmetlerini kapsamaktadır\.\.\.\\n\\n1\. Kapsam:\\n2\. Ücretlendirme:\\n3\. Yükümlülükler:\);/g, 
              'setMaintenanceContract("İşbu sözleşme, taraflar arasında aylık periyodik bakım hizmetlerini kapsamaktadır...\\n\\n1. Kapsam:\\n2. Ücretlendirme:\\n3. Yükümlülükler:");');

fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
