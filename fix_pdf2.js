const fs = require('fs');
let c = fs.readFileSync('components/modals/forms/QuoteModal.tsx', 'utf8');

c = c.replace(/<div>\s*<h1 className="text-3xl font-black">\{data\?\.settings\?\.company_name \|\| 'Firma Ad.'\}<\/h1>\s*<p className="text-sm font-medium mt-1">\{quoteType\}<\/p>\s*<\/div>/, 
              '<div className="flex items-center gap-4">\\n' +
              '  {data?.settings?.company_logo && <img src={data.settings.company_logo} alt="Logo" className="w-16 h-16 object-contain" />}\\n' +
              '  <div>\\n' +
              '    <h1 className="text-3xl font-black">{data?.settings?.company_name || "Firma Adı"}</h1>\\n' +
              '    <p className="text-sm font-medium mt-1">{quoteType}</p>\\n' +
              '  </div>\\n' +
              '</div>'
);

c = c.replace(/<p className="font-bold mb-16">Yetkili \(Firma\) .mzas.<\/p>/, '<p className="font-bold mb-16">Yetkili (Firma) İmzası<br/><span className="font-normal text-sm">{data?.ownerName || data?.settings?.owner_name || ""}</span></p>');
c = c.replace(/\\n/g, '\n');

fs.writeFileSync('components/modals/forms/QuoteModal.tsx', c);
