const fs = require('fs');
let c = fs.readFileSync('app/[slug]/dashboard/page.jsx', 'utf8');

if (!c.includes('navTab')) {
    const listener = 
  useEffect(() => {
    const handleNav = (e) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('navTab', handleNav);
    return () => window.removeEventListener('navTab', handleNav);
  }, []);
;
    c = c.replace('const handleAction = async (action, targetId) => {', listener + '\n  const handleAction = async (action, targetId) => {');
    fs.writeFileSync('app/[slug]/dashboard/page.jsx', c);
}
