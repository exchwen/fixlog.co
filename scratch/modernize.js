const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'masterboss', 'dashboard', 'page.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update main container and background
content = content.replace(
    '<div className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500/30 relative">',
    `<div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-rose-500/30 relative overflow-hidden">
      {/* Abstract Animated Background Elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />`
);

// 2. Update Navbar
content = content.replace(
    '<nav className="sticky top-0 z-50 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800">',
    '<motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5">'
);
content = content.replace(
    '</nav>',
    '</motion.nav>'
);

// 3. Animate Metric Cards Grid
content = content.replace(
    '<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">',
    '<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">'
);
content = content.replace(
    `          <MetricCard icon={Activity} label="Aylık Net Kazanç" value={\`₺\${totalMonthlyRevenue.toLocaleString('tr-TR')}\`} ext={\`Yıllık: ₺\${totalYearlyRevenue.toLocaleString('tr-TR')}\`} color="from-emerald-500 to-teal-600" />
          <MetricCard icon={AlertCircle} label="Aylık Gerçek Maliyet" value={\`₺\${monthlyExpectedCost.toFixed(2).toLocaleString('tr-TR')}\`} ext={\`Yıllık Toplam: ₺\${yearlyExpectedCost.toFixed(2).toLocaleString('tr-TR')}\`} color="from-rose-500 to-red-600" />
        </div>`,
    `          <MetricCard icon={Activity} label="Aylık Net Kazanç" value={\`₺\${totalMonthlyRevenue.toLocaleString('tr-TR')}\`} ext={\`Yıllık: ₺\${totalYearlyRevenue.toLocaleString('tr-TR')}\`} color="from-emerald-500 to-teal-600" />
          <MetricCard icon={AlertCircle} label="Aylık Gerçek Maliyet" value={\`₺\${monthlyExpectedCost.toFixed(2).toLocaleString('tr-TR')}\`} ext={\`Yıllık Toplam: ₺\${yearlyExpectedCost.toFixed(2).toLocaleString('tr-TR')}\`} color="from-rose-500 to-red-600" />
        </motion.div>`
);

// 4. Modernize Content Area container
content = content.replace(
    'className="bg-neutral-900/50 border border-neutral-800 rounded-2xl sm:rounded-3xl overflow-hidden"',
    'className="bg-white/5 border border-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"'
);

// 5. Replace MetricCard, TabButton, InfoBox functions at the bottom
const metricCardIndex = content.indexOf("function MetricCard({");
if (metricCardIndex !== -1) {
    content = content.substring(0, metricCardIndex) + `function MetricCard({ icon: Icon, label, value, ext, color }) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden group flex flex-col justify-between shadow-xl"
    >
      <div className={\`absolute -right-4 -top-4 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br \${color} opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500\`} />
      <div className="flex justify-between items-start mb-2 sm:mb-4 relative z-10">
        <div className={\`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br \${color} p-[1px] flex items-center justify-center shadow-lg shadow-black/50\`}>
          <div className="w-full h-full bg-neutral-900/80 backdrop-blur-sm rounded-[10px] sm:rounded-[14px] flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-xl sm:text-3xl font-black text-white mb-0.5 sm:mb-1 tracking-tight truncate drop-shadow-md">{value}</div>
        <div className="text-[10px] sm:text-sm font-medium text-neutral-300 mb-0.5 sm:mb-1 leading-tight">{label}</div>
        <div className="text-[9px] sm:text-xs text-neutral-400 leading-tight truncate">{ext}</div>
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={\`relative flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-bold sm:font-medium transition-all duration-300 shrink-0 overflow-hidden \${
        active 
          ? "text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10" 
          : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-white/5"
      }\`}
    >
      {active && (
        <motion.div 
          layoutId="activeTab" 
          className="absolute inset-0 bg-gradient-to-r from-rose-500/80 to-purple-600/80 backdrop-blur-md" 
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
        <span className="truncate">{label}</span>
      </div>
    </button>
  );
}

function InfoBox({ label, value, fullWidth = false }) {
  return (
    <div className={\`bg-white/5 border border-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-inner \${fullWidth ? 'col-span-1 md:col-span-2' : ''}\`}>
      <div className="text-[10px] sm:text-xs font-medium text-neutral-400 mb-0.5 sm:mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-xs sm:text-sm text-white font-semibold break-words">{value || '-'}</div>
    </div>
  );
}
`;
}

// 6. Modernize Table
content = content.replace(
    '<thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">',
    '<thead className="bg-white/5 border-b border-white/10 text-neutral-300 backdrop-blur-md">'
);
// replace all tbodys matching this
content = content.split('<tbody className="divide-y divide-neutral-800/50">').join('<tbody className="divide-y divide-white/5">');
content = content.split('<tr key={c.slug} className="hover:bg-neutral-800/20 transition-colors">').join('<tr key={c.slug} className="hover:bg-white/5 transition-all duration-200">');


// 7. Modernize Info Cards / Filtering Buttons
content = content.split('bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5').join('bg-white/5 border border-white/10 backdrop-blur-lg shadow-xl rounded-2xl p-4 sm:p-5');
content = content.split('bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl').join('bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-2xl backdrop-blur-md');
content = content.split('bg-neutral-800 text-neutral-400 hover:text-white').join('bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10');

// 8. Modals UI
content = content.split('className="bg-neutral-900 border border-neutral-800 rounded-none sm:rounded-3xl').join('className="bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-none sm:rounded-3xl');
content = content.split('border-b border-neutral-800 relative bg-neutral-900').join('border-b border-white/10 relative bg-transparent');
content = content.split('border-t border-neutral-800 bg-neutral-900').join('border-t border-white/10 bg-transparent');

// 9. Modernize other blocks with plain replace
content = content.replace(
    '<div className="bg-neutral-900 border border-neutral-800 text-white p-4 sm:p-5 rounded-2xl shadow-2xl',
    '<div className="bg-black/80 backdrop-blur-xl border border-white/10 text-white p-4 sm:p-5 rounded-2xl shadow-2xl'
);


fs.writeFileSync(filePath, content, 'utf-8');
console.log('Updated successfully!');
