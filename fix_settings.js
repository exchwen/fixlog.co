const fs = require('fs');
let content = fs.readFileSync('components/patron/SettingsTab.tsx', 'utf8');

// Add imports
if (!content.includes('import { auth } from')) {
    content = content.replace(import trCitiesData from '@/lib/data/tr-cities.json';, import trCitiesData from '@/lib/data/tr-cities.json';\nimport { auth } from '@/lib/firebase';\nimport { sendPasswordResetEmail } from 'firebase/auth';);
}
if (!content.includes('Key round')) {
    content = content.replace(CreditCard } from 'lucide-react';, CreditCard, KeyRound } from 'lucide-react';);
}

// Add state for password
if (!content.includes('passwordResetSent')) {
    content = content.replace(const [isOffline, setIsOffline] = useState(false);, const [isOffline, setIsOffline] = useState(false);\n  const [passwordResetSent, setPasswordResetSent] = useState(false);\n  const [passwordError, setPasswordError] = useState(''););
}

// Add UI
const ui = 
        <div className="border-t border-slate-100 pt-6 pb-2">
          <label className="text-[11px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <KeyRound size={16} /> Şifre Belirleme & Doğrulama
          </label>
          <p className="text-[11px] font-medium text-slate-500 mb-4 leading-relaxed">
            Google (Gmail) ile kayıt olduysanız veya şifrenizi değiştirmek istiyorsanız aşağıdaki butonu kullanabilirsiniz. Kayıtlı e-posta adresinize bir şifre sıfırlama/belirleme bağlantısı gönderilecektir.
          </p>
          <div className="flex items-center gap-3">
             <button 
                onClick={async () => {
                   if (!auth.currentUser?.email) {
                      setPasswordError('Geçerli bir oturum e-postası bulunamadı.');
                      return;
                   }
                   try {
                      await sendPasswordResetEmail(auth, auth.currentUser.email);
                      setPasswordResetSent(true);
                      setPasswordError('');
                   } catch(e: any) {
                      setPasswordError('Hata: ' + e.message);
                   }
                }}
                disabled={passwordResetSent}
                className="px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all shadow-sm disabled:opacity-50"
             >
                {passwordResetSent ? 'E-posta Gönderildi ✓' : 'Şifre Doğrulama / Sıfırlama E-postası Gönder'}
             </button>
          </div>
          {passwordError && <div className="text-[10px] text-rose-500 font-bold mt-2">{passwordError}</div>}
        </div>
;

if (!content.includes('Şifre Belirleme')) {
    content = content.replace('{!isFormValid && (', ui + '\\n        {!isFormValid && (');
}

fs.writeFileSync('components/patron/SettingsTab.tsx', content);
