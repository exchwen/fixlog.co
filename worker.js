const rateLimitCache = new Map();

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const method = request.method;
        const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';

        // 🚀 CANLI DOMAIN AYARI
        const APP_URL = "https://fixlog.co";

        const allowedOrigins = ["https://fixlog.co", "https://app.fixlog.co", "https://www.fixlog.co", "http://localhost:3000"];
        const origin = request.headers.get("Origin") || "";
        const corsOrigin = allowedOrigins.includes(origin) ? origin : "https://fixlog.co";

        const corsHeaders = {
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        if (method === "OPTIONS") return new Response(null, { headers: corsHeaders });

        const safeAll = async (query) => { try { const res = await query.all(); return res.results; } catch (e) { console.error("DB Error in safeAll:", e); return []; } };
        const safeFirst = async (query) => { try { return await query.first(); } catch (e) { console.error("DB Error in safeFirst:", e); return null; } };

        const hashPassword = async (password) => {
            if (!env.JWT_SECRET) throw new Error("Kritik: Sistemde JWT_SECRET tanımlı değil!");
            const encoder = new TextEncoder();
            const data = encoder.encode(password + env.JWT_SECRET);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };

        const toBase64Url = (str) => {
            const encoded = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)));
            return btoa(encoded).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        };

        const fromBase64Url = (str) => {
            let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) base64 += '=';
            const binary = atob(base64);
            return decodeURIComponent(binary.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        };

        const triggerPusher = async (channel, event, data) => {
            try {
                console.log(`[Pusher] Tetikleniyor... Kanal: ${channel}, Event: ${event}`);
                const PUSHER_APP_ID = env.PUSHER_APP_ID || "2118585";
                const PUSHER_KEY = env.PUSHER_KEY || "75dfed44245e16eaea0a";
                const PUSHER_SECRET = env.PUSHER_SECRET || "3e7c62a8460da425c4f4";
                const PUSHER_CLUSTER = "eu";

                const bodyStr = JSON.stringify({ name: event, channels: [channel], data: JSON.stringify(data) });
            
            // 🚀 ÇÖZÜM: Cloudflare Worker MD5 desteklemediği için saf JS MD5 fonksiyonu eklendi
            const generateMD5 = (str) => {
                var k=[], i=0;
                for(; i<64; ) k[i] = 0 | (Math.abs(Math.sin(++i)) * 4294967296);
                var calc = (a, b, c, d, x, s, t) => (a + c + d + x + t + (b << s | b >>> (32 - s))) | 0;
                var b = [1732584193, -271733879, -1732584194, 271733878];
                str = unescape(encodeURIComponent(str));
                var w = [];
                for(i=0; i<str.length; i++) w[i>>2] |= (str.charCodeAt(i) & 255) << ((i%4)*8);
                w[i>>2] |= 128 << ((i%4)*8);
                w[14 + (i+8>>6<<4)] = str.length * 8;
                for(i=0; i<w.length; i+=16) {
                    var o = b.slice(0);
                    for(var j=0; j<64; j++) {
                        var f = j<16 ? (o[1]&o[2] | ~o[1]&o[3]) : j<32 ? (o[1]&o[3] | o[2]&~o[3]) : j<48 ? (o[1]^o[2]^o[3]) : (o[2]^(o[1]|~o[3]));
                        var t = calc(o[0], o[1], f, o[3], w[i + (j<16 ? j : j<32 ? (5*j+1)%16 : j<48 ? (3*j+5)%16 : (7*j)%16)], [7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21][(j>>4)*4 + j%4], k[j]);
                        o = [o[3], t, o[1], o[2]];
                    }
                    for(var j=0; j<4; j++) b[j] = (b[j] + o[j]) | 0;
                }
                var hex = '';
                for(i=0; i<32; i++) hex += (b[i>>3] >> ((i%4)*8) & 15).toString(16) + (b[i>>3] >> ((i%4)*8 + 4) & 15).toString(16);
                return hex;
            };

            const md5Hex = generateMD5(bodyStr);

                const timestamp = Math.floor(Date.now() / 1000);
                const path = `/apps/${PUSHER_APP_ID}/events`;
                const authVersion = '1.0';

                const stringToSign = `POST\n${path}\nauth_key=${PUSHER_KEY}&auth_timestamp=${timestamp}&auth_version=${authVersion}&body_md5=${md5Hex}`;

                const keyData = await crypto.subtle.importKey('raw', new TextEncoder().encode(PUSHER_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
                const signatureBuffer = await crypto.subtle.sign('HMAC', keyData, new TextEncoder().encode(stringToSign));
                const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

                const targetUrl = `https://api-${PUSHER_CLUSTER}.pusher.com${path}?auth_key=${PUSHER_KEY}&auth_timestamp=${timestamp}&auth_version=${authVersion}&body_md5=${md5Hex}&auth_signature=${signature}`;

                const pusherRes = await fetch(targetUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: bodyStr });
                const pusherText = await pusherRes.text();

                console.log(`[Pusher] Sonuç: ${pusherRes.status} -> ${pusherText}`);
                return { status: pusherRes.status, response: pusherText };
            } catch (e) {
                console.error("[Pusher] Kritik Hata:", e);
                return { error: e.message };
            }
        };

        // 🚀 GÜNCELLENMİŞ VE FİNAL HALE GETİRİLMİŞ BEAMS FONKSİYONU
        const triggerBeams = async (interests, title, body, link, slug) => {
            if (slug) try { await triggerPusher(`company-${slug}`, 'data_updated', {}); } catch (e) {}
            try {
                const BEAMS_INSTANCE_ID = "015accc9-e581-44a3-b37f-5410549611da";
                const BEAMS_PRIMARY_KEY = "EB43AD23817C10DE923F9A222F19A4E6696642534F2F54DAEB30A6D966DB5DEC";

                // Varsayılan Logo ve Başlık
                let iconUrl = `${APP_URL}/icons/icon-192x192.png`;
                let finalTitle = title;

                if (slug) {
                    try {
                        const company = await safeFirst(env.DB.prepare("SELECT company_name, logo FROM companies WHERE slug = ?").bind(slug));
                        if (company) {
                            // 1. BAŞLIK AYARI: Bildirim başlığı Firma Adı olur
                            if (company.company_name) {
                                // Eğer başlık kritik bir uyarı içeriyorsa (Acil/Arıza), orijinal başlığı koru.
                                // Aksi halde (Sohbet vb.) firma adını göster.
                                if (title && (title.includes("ACİL") || title.includes("ARIZA"))) {
                                    finalTitle = title;
                                } else {
                                    finalTitle = company.company_name;
                                }
                            }

                            // 2. LOGO PROXY AYARI (SSL Çözümü)
                            if (company.logo && company.logo.startsWith('http')) {
                                let safeLogo = company.logo;
                                // Eğer logo R2 (güvensiz) ise, onu Vercel Proxy (güvenli) linkine çevir
                                if (safeLogo.includes('r2.dev')) {
                                    safeLogo = safeLogo.replace('https://pub-a78064a5e9304242b0982c01b5778197.r2.dev', `${APP_URL}/dosya-deposu`);
                                }
                                iconUrl = safeLogo;
                            }
                        }
                    } catch (err) {
                        console.error("Firma bilgileri çekilirken hata:", err);
                    }
                }

                const payload = {
                    interests: interests,

                    // 🚀 1. WEB TARAFI
                    web: {
                        time_to_live: 300,
                        notification: {
                            title: finalTitle,
                            body: body,
                            deep_link: link || APP_URL,
                            icon: iconUrl,
                            hide_notification_if_site_has_focus: false,
                            renotify: true,
                            tag: `notif-${Date.now()}`,
                            require_interaction: true,
                            silent: false
                        }
                    },

                    // 🚀 2. ANDROID / FCM TARAFI
                    fcm: {
                        notification: {
                            title: finalTitle,
                            body: body,
                            icon: iconUrl,
                            click_action: link || APP_URL
                        },
                        priority: "high",
                        android: {
                            priority: "high",
                            notification: {
                                channel_id: "aciller",
                                default_sound: true,
                                default_vibrate_timings: true,
                                priority: "high",

                                // 🔥 İŞTE ÇÖZÜM BU SATIR:
                                visibility: "public", // "private" olursa "İçerik gizlendi" yazar. "public" her şeyi gösterir.

                                click_action: link || APP_URL
                            }
                        }
                    }
                };

                const res = await fetch(`https://${BEAMS_INSTANCE_ID}.pushnotifications.pusher.com/publish_api/v1/instances/${BEAMS_INSTANCE_ID}/publishes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${BEAMS_PRIMARY_KEY}`
                    },
                    body: JSON.stringify(payload)
                });
                console.log(`[Beams] Sonuç: ${res.status}`);
            } catch (e) {
                console.error("[Beams] Kritik Hata:", e);
            }
        };

        try {
            // 🚀 GÜVENLİK DUVARI AYARI: Test rotası eklendi
            const publicRoutes = [
                "/register", "/get-slug", "/staff-login", "/public/company-info",
                "/public/get-asset", "/public/trigger-emergency", "/public/report-fault",
                "/send-test-push", "/masterboss-login",
                "/masterboss-data", "/masterboss-resolve-ticket", "/masterboss-company-details", "/masterboss-update-subscription"
            ];
            let userAuth = null;

            if (!publicRoutes.includes(url.pathname)) {
                const authHeader = request.headers.get('Authorization');
                let authErrorReason = "Token bulunamadı veya Authorization başlığı eksik.";

                if (authHeader && authHeader.startsWith('Bearer ')) {
                    let token = authHeader.split(' ')[1];
                    token = token.replace(/^"|"$/g, '').trim();

                    try {
                        const parts = token.split('.');
                        if (parts.length === 3) {
                            const [headerB64, payloadB64, signatureB64] = parts;
                            const payloadStr = fromBase64Url(payloadB64);
                            const payload = JSON.parse(payloadStr);

                            if (Date.now() <= payload.exp) {
                                const secret = env.JWT_SECRET; if(!secret) throw new Error("JWT_SECRET eksik!");
                                const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
                                const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${headerB64}.${payloadB64}`));

                                let binarySig = '';
                                const sigBytes = new Uint8Array(signatureBuffer);
                                for (let i = 0; i < sigBytes.byteLength; i++) { binarySig += String.fromCharCode(sigBytes[i]); }
                                const expectedSignature = btoa(binarySig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

                                if (signatureB64 === expectedSignature) {
                                    userAuth = payload;
                                } else {
                                    authErrorReason = "Token imzası geçersiz (Mühür uyuşmuyor).";
                                }
                            } else {
                                authErrorReason = "Token süresi dolmuş (Oturum zaman aşımı).";
                            }
                        } else {
                            authErrorReason = "Token formatı hatalı (Geçersiz parça sayısı).";
                        }
                    } catch (e) {
                        authErrorReason = "Token çözümlenirken hata oluştu: " + e.message;
                    }
                }

                if (!userAuth) {
                    return new Response(JSON.stringify({ error: "Yetkisiz Erişim!", reason: authErrorReason }), { status: 401, headers: corsHeaders });
                }

                let requestSlug = url.searchParams.get("slug");
                if (!requestSlug && method === "POST" && url.pathname !== "/pusher/auth" && url.pathname !== "/send-test-push") {
                    const clonedReq = request.clone();
                    try { const body = await clonedReq.json(); requestSlug = body.slug; } catch (e) { }
                }

                if (userAuth.role !== "Masterboss") {
                    if (!requestSlug && method !== "GET") {
                        return new Response(JSON.stringify({ error: "Güvenlik İhlali: İstekte firma tanımlayıcısı (slug) bulunamadı." }), { status: 403, headers: corsHeaders });
                    }
                    if (requestSlug && requestSlug !== userAuth.slug) {
                        return new Response(JSON.stringify({ error: "İhlal Tespit Edildi! Sadece kendi firmanıza ait verilerde işlem yapabilirsiniz." }), { status: 403, headers: corsHeaders });
                    }
                }

                // 🚀 YENİ: PAYWALL (ABONELİK KONTROLÜ) - İşlem Yapmayı Engeller
                if (requestSlug && userAuth.role !== "Masterboss") {
                    const companySub = await safeFirst(env.DB.prepare("SELECT subscription_status FROM companies WHERE slug = ?").bind(requestSlug));
                    if (companySub && (companySub.subscription_status === 'past_due' || companySub.subscription_status === 'canceled')) {
                        // Veri okumaya (GET) izin ver, ancak yazma/silme/güncelleme (POST) işlemlerini engelle
                        if (method !== "GET" && url.pathname !== "/staff-login" && url.pathname !== "/masterboss-login") {
                            return new Response(JSON.stringify({ error: "PAYWALL_ACTIVE", message: "Aboneliğiniz askıya alınmıştır. İşlem yapabilmek için ödeme yapmalısınız." }), { status: 403, headers: corsHeaders });
                        }
                    }
                }

                if (userAuth.role === "Usta") {
                    // 🚀 YENİ: Ustaların da destek bileti açabilmesi ve görebilmesi için ilgili rotalar eklendi
                    const allowedForUsta = ["/dashboard-data", "/get-messages", "/send-message", "/read-messages", "/pusher/auth", "/add-job", "/update-job", "/approve-job", "/send-sos", "/request-material", "/add-support-ticket", "/get-my-tickets", "/reply-support-ticket"];
                    if (!allowedForUsta.includes(url.pathname)) {
                        return new Response(JSON.stringify({ error: "Yeşil Kart (Usta) Yetkisi Sınırı!" }), { status: 403, headers: corsHeaders });
                    }
                }

                if (userAuth.role === "Yönetici") {
                    // Yöneticilerin kesin olarak giremeyeceği rotalar (Net ve açık)
                    const blockedForYonetici = [
                        "/update-settings",
                        "/delete-asset",
                        "/delete-customer",
                        "/delete-stock",
                        "/delete-category",
                        "/delete-supplier",
                        "/delete-job"
                    ];
                    if (blockedForYonetici.includes(url.pathname)) {
                        return new Response(JSON.stringify({ error: "Mavi Kart (Yönetici) Yetkisi Sınırı!" }), { status: 403, headers: corsHeaders });
                    }
                }
            }

            if (url.pathname === "/send-test-push" && method === "POST") {
                const { interests, title, body, link, slug } = await request.json();

                const finalLink = link || APP_URL;

                // triggerBeams artık firma adı ve logo düzeltmesini kendi içinde yapıyor
                await triggerBeams(interests, title, body, finalLink, slug);

                return new Response(JSON.stringify({
                    success: true,
                    message: "Bildirim isteği Pusher'a iletildi."
                }), { headers: corsHeaders });
            }

            if (url.pathname === "/pusher/auth" && method === "POST") {
                const formData = await request.text();
                const params = new URLSearchParams(formData);
                const socketId = params.get('socket_id');
                const channelName = params.get('channel_name');

                const PUSHER_KEY = env.PUSHER_KEY || "75dfed44245e16eaea0a";
                const PUSHER_SECRET = env.PUSHER_SECRET || "3e7c62a8460da425c4f4";

                const userId = userAuth.role === 'Patron' ? 'PATRON' : String(userAuth.id);
                const userInfo = { name: userAuth.name, role: userAuth.role };
                const channelData = JSON.stringify({ user_id: userId, user_info: userInfo });

                const stringToSign = `${socketId}:${channelName}:${channelData}`;

                const keyData = await crypto.subtle.importKey('raw', new TextEncoder().encode(PUSHER_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
                const signatureBuffer = await crypto.subtle.sign('HMAC', keyData, new TextEncoder().encode(stringToSign));
                const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

                const authResponse = {
                    auth: `${PUSHER_KEY}:${signature}`,
                    channel_data: channelData
                };

                return new Response(JSON.stringify(authResponse), { headers: corsHeaders });
            }

            // 🚀 EKLENDİ: Abonelik, Deneme Süresi ve Referans Sistemini Destekleyen Register
            if (url.pathname === "/register" && method === "POST") {
                const { uid, companyName, sector, slug, ownerName, referredByCode } = await request.json();

                // 14 gün sonrası için trial_ends_at hesaplama
                const trialEndsAt = new Date();
                trialEndsAt.setDate(trialEndsAt.getDate() + 14);

                // Firma için benzersiz referans kodu üret (Örn: IZZD7492)
                const safeSlugPrefix = slug ? slug.substring(0, 4) : 'COMP';
                const refCode = (safeSlugPrefix + Math.floor(1000 + Math.random() * 9000)).toUpperCase();

                // Eğer bir referans kodu girildiyse, o kodun sahibini bul
                let referredById = null;
                if (referredByCode) {
                    const refCompany = await safeFirst(env.DB.prepare("SELECT id FROM companies WHERE referral_code = ?").bind(referredByCode));
                    if (refCompany) {
                        referredById = refCompany.id;
                    }
                }

                // Veritabanına yeni özellikleri dahil ederek yazıyoruz
                await env.DB.prepare(`
                    INSERT INTO companies (
                        owner_uid, company_name, slug, sector, owner_name, 
                        subscription_status, trial_ends_at, referral_code, referred_by_id
                    ) VALUES (?, ?, ?, ?, ?, 'trialing', ?, ?, ?)
                `).bind(
                    uid || '', companyName || '', slug || '', sector || '', ownerName || 'Yönetici',
                    trialEndsAt.toISOString(), refCode, referredById
                ).run();

                return new Response(JSON.stringify({ success: true, refCode }), { headers: corsHeaders });
            }

            // 🚀 EKLENDİ: Fatura ve Ödeme Gerekçesini Ekran Karartmasında Göstermek İçin Yeni Motor
            if (url.pathname === "/get-billing-info" && method === "GET") {
                const slug = url.searchParams.get("slug");
                const company = await safeFirst(env.DB.prepare("SELECT subscription_status, custom_base_price, free_months_balance, has_masterboss_gift FROM companies WHERE slug = ?").bind(slug || ''));
                const assets = await safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM assets WHERE company_slug = ?").bind(slug || ''));
                const reward = await safeFirst(env.DB.prepare("SELECT free_months_balance, has_masterboss_gift FROM company_rewards WHERE company_slug = ?").bind(slug || ''));

                const assetCount = assets?.total || 0;
                const freeMonths = company?.free_months_balance || 0;
                const hasMasterbossGift = company?.has_masterboss_gift || 0;

                // Global ayarları çek
                const sysSettings = await safeAll(env.DB.prepare("SELECT * FROM system_settings"));
                let globalBase = 3000; let globalAsset = 50;
                sysSettings.forEach(s => {
                    if (s.key === 'global_base_price') globalBase = Number(s.value);
                    if (s.key === 'global_asset_price') globalAsset = Number(s.value);
                });

                // Eğer özel bir fiyat tanımlanmadıysa Global (Sistem) fiyatları geçerli olur
                const basePrice = company?.custom_base_price !== null && company?.custom_base_price !== undefined ? company.custom_base_price : globalBase;
                const assetUnitPrice = company?.custom_per_asset_price !== null && company?.custom_per_asset_price !== undefined ? company.custom_per_asset_price : globalAsset;

                let totalAmount = basePrice + (assetCount * assetUnitPrice);
                let discountApplied = false;

                // Eğer kullanıcının kazandığı ücretsiz referans ayı varsa sabit fiyat alınmaz
                if (freeMonths > 0) {
                    if (hasMasterbossGift) {
                        totalAmount = 0; // Masterboss hediye verdiyse tüm faturayı sıfırla
                    } else {
                        totalAmount = assetCount * assetUnitPrice; // Referans ise sadece taban ücret düşer
                    }
                    discountApplied = true;
                }

                return new Response(JSON.stringify({
                    success: true,
                    status: company?.subscription_status || 'unknown',
                    assetCount: assetCount,
                    basePrice: basePrice,
                    assetPrice: assetCount * assetUnitPrice,
                    totalAmount: totalAmount,
                    freeMonthsBalance: freeMonths,
                    discountApplied: discountApplied
                }), { headers: corsHeaders });
            }

            if (url.pathname === "/get-slug" && method === "GET") {
                const uid = url.searchParams.get("uid");
                const company = await safeFirst(env.DB.prepare("SELECT slug, owner_name FROM companies WHERE owner_uid = ?").bind(uid || ''));

                if (company) {
                    const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
                    const payload = toBase64Url(JSON.stringify({ id: uid, name: company.owner_name, role: "Patron", slug: company.slug, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));

                    const secret = env.JWT_SECRET; if(!secret) throw new Error("JWT_SECRET eksik!");
                    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
                    const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`));

                    let binarySig = '';
                    const sigBytes = new Uint8Array(signatureBuffer);
                    for (let i = 0; i < sigBytes.byteLength; i++) { binarySig += String.fromCharCode(sigBytes[i]); }
                    const signature = btoa(binarySig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

                    const token = `${header}.${payload}.${signature}`;

                    return new Response(JSON.stringify({
                        success: true,
                        slug: company.slug,
                        token: token,
                        role: "Patron",
                        name: company.owner_name
                    }), { headers: corsHeaders });
                }

                return new Response(JSON.stringify({ slug: null }), { headers: corsHeaders });
            }

            if (url.pathname === "/public/company-info" && method === "GET") {
                const slug = url.searchParams.get("slug");
                const company = await safeFirst(env.DB.prepare("SELECT company_name, logo FROM companies WHERE slug = ?").bind(slug || ''));
                if (company) {
                    return new Response(JSON.stringify(company), { headers: corsHeaders });
                }
                return new Response(JSON.stringify({ error: "Firma bulunamadı" }), { status: 404, headers: corsHeaders });
            }

            if (url.pathname === "/staff-login" && method === "POST") {
                const now = Date.now();
                const limitData = rateLimitCache.get(clientIp) || { count: 0, time: now };
                if (now - limitData.time > 15 * 60 * 1000) { limitData.count = 0; limitData.time = now; }
                if (limitData.count >= 10) return new Response(JSON.stringify({ error: "Güvenlik: Çok fazla hatalı deneme! Lütfen 15 dakika bekleyin." }), { status: 429, headers: corsHeaders });
                
                const { slug, username, password } = await request.json();
                const hashedPw = await hashPassword(password);

                const staff = await safeFirst(env.DB.prepare("SELECT id, name, role, is_active FROM staff WHERE company_slug = ? AND username = ? AND password_hash = ?").bind(slug, username, hashedPw));

                if (!staff) {
                    limitData.count++; rateLimitCache.set(clientIp, limitData);
                    return new Response(JSON.stringify({ error: "Kullanıcı adı veya şifre hatalı." }), { status: 401, headers: corsHeaders });
                }
                rateLimitCache.delete(clientIp);

                if (staff.is_active === 0) {
                    return new Response(JSON.stringify({ error: "Bu hesap firma yöneticisi tarafından dondurulmuştur." }), { status: 403, headers: corsHeaders });
                }

                const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
                const payload = toBase64Url(JSON.stringify({ id: staff.id, name: staff.name, role: staff.role, slug: slug, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));

                const secret = env.JWT_SECRET; if(!secret) throw new Error("JWT_SECRET eksik!");
                const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
                const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`));

                let binarySig = '';
                const sigBytes = new Uint8Array(signatureBuffer);
                for (let i = 0; i < sigBytes.byteLength; i++) { binarySig += String.fromCharCode(sigBytes[i]); }
                const signature = btoa(binarySig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

                const token = `${header}.${payload}.${signature}`;

                return new Response(JSON.stringify({ success: true, token, role: staff.role, name: staff.name }), { headers: corsHeaders });
            }

            if (url.pathname === "/masterboss-login" && method === "POST") {
                const now = Date.now();
                const limitData = rateLimitCache.get(clientIp) || { count: 0, time: now };
                if (now - limitData.time > 15 * 60 * 1000) { limitData.count = 0; limitData.time = now; }
                if (limitData.count >= 10) return new Response(JSON.stringify({ error: "Güvenlik: Çok fazla hatalı deneme! Lütfen 15 dakika bekleyin." }), { status: 429, headers: corsHeaders });

                const { masterPassword } = await request.json();

                // Güvenlik: Masterboss şifresini çevre değişkeninden alıyoruz
                const MASTERBOSS_PASSWORD = env.MASTERBOSS_PASSWORD;
                if (!MASTERBOSS_PASSWORD) {
                    return new Response(JSON.stringify({ error: "Kritik: Sistemde MASTERBOSS_PASSWORD tanımlı değil!" }), { status: 500, headers: corsHeaders });
                }

                if (masterPassword === MASTERBOSS_PASSWORD) {
                    rateLimitCache.delete(clientIp);
                    const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
                    const payload = toBase64Url(JSON.stringify({
                        role: "Masterboss",
                        exp: Date.now() + 1000 * 60 * 60 * 24 // 24 Saat geçerli
                    }));

                    const secret = env.JWT_SECRET; if(!secret) throw new Error("JWT_SECRET eksik!");
                    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
                    const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`));

                    let binarySig = '';
                    const sigBytes = new Uint8Array(signatureBuffer);
                    for (let i = 0; i < sigBytes.byteLength; i++) { binarySig += String.fromCharCode(sigBytes[i]); }
                    const signature = btoa(binarySig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

                    const masterToken = `${header}.${payload}.${signature}`;

                    return new Response(JSON.stringify({ success: true, token: masterToken }), { headers: corsHeaders });
                }

                limitData.count++; rateLimitCache.set(clientIp, limitData);
                return new Response(JSON.stringify({ error: "Geçersiz Masterboss Şifresi!" }), { status: 401, headers: corsHeaders });
            }

            // 🔥 OPTİMİZE EDİLMİŞ DASHBOARD-DATA (Performans + Maliyet Odaklı)
            if (url.pathname === "/dashboard-data" && method === "GET") {
                const slug = url.searchParams.get("slug");

                // 1. İstatistikleri COUNT(*) ile çek (Daha ucuz, daha hızlı)
                // 2. Listeleri LIMIT ile çek (Bandwidth ve RAM koruması)
                // 3. photo_urls ve details alanlarını koru (İsteğin üzerine)

                let [
                    company,
                    companyReward,
                    statsJob, statsStaff, statsAsset,
                    income, expense,
                    jobs, assets, staff, stock, finances, customers, suppliers, categories,
                    activeEmergencies, pendingFaults, allEmergencies, allFaults,
                    // 🚀 YENİ EKLENEN SORGULAR (SOS ve Malzeme Talepleri)
                    activeStaffSos, allStaffSos, pendingMaterialRequests, allMaterialRequests
                ] = await Promise.all([
                    safeFirst(env.DB.prepare("SELECT company_name, sector, owner_name, address, tax_info, phone, landline_phone, emergency_phone, whatsapp_phone, website, logo, subscription_status, custom_base_price, referral_code, trial_ends_at, billing_cycle_anchor, free_months_balance, has_masterboss_gift FROM companies WHERE slug = ?").bind(slug || '')),
                    safeFirst(env.DB.prepare("SELECT free_months_balance, has_masterboss_gift FROM company_rewards WHERE company_slug = ?").bind(slug || '')),

                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM jobs WHERE company_slug = ?").bind(slug || '')),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM staff WHERE company_slug = ?").bind(slug || '')),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM assets WHERE company_slug = ?").bind(slug || '')),

                    safeFirst(env.DB.prepare("SELECT SUM(amount) as total FROM finances WHERE company_slug = ? AND type = 'Gelir'").bind(slug || '')),
                    safeFirst(env.DB.prepare("SELECT SUM(amount) as total FROM finances WHERE company_slug = ? AND type = 'Gider'").bind(slug || '')),

                    safeAll(env.DB.prepare("SELECT * FROM jobs WHERE company_slug = ? ORDER BY created_at DESC LIMIT 300").bind(slug || '')),
                    safeAll(env.DB.prepare("SELECT * FROM assets WHERE company_slug = ? LIMIT 100").bind(slug || '')),
                    safeAll(env.DB.prepare("SELECT * FROM staff WHERE company_slug = ?").bind(slug || '')),
                    safeAll(env.DB.prepare("SELECT * FROM stock WHERE company_slug = ? LIMIT 100").bind(slug || '')),
                    safeAll(env.DB.prepare("SELECT * FROM finances WHERE company_slug = ? ORDER BY created_at DESC LIMIT 50").bind(slug || '')),
                    safeAll(env.DB.prepare("SELECT * FROM customers WHERE company_slug = ? LIMIT 100").bind(slug || '')),
                    safeAll(env.DB.prepare("SELECT * FROM suppliers WHERE company_slug = ?").bind(slug || '')),
                    safeAll(env.DB.prepare("SELECT * FROM stock_categories WHERE company_slug = ?").bind(slug || '')),

                    safeAll(env.DB.prepare(`SELECT e.*, a.name as asset_name, a.apartmentName as asset_apartment, a.location as asset_location FROM emergencies e LEFT JOIN assets a ON e.asset_id = a.uuid WHERE e.company_slug = ? AND e.status = 'Aktif'`).bind(slug || '')),
                    safeAll(env.DB.prepare(`SELECT f.*, a.name as asset_name, a.apartmentName as asset_apartment, a.location as asset_location FROM fault_reports f LEFT JOIN assets a ON f.asset_id = a.uuid WHERE f.company_slug = ? AND f.status = 'Aktif'`).bind(slug || '')),
                    safeAll(env.DB.prepare(`SELECT e.*, a.name as asset_name, a.apartmentName as asset_apartment, a.location as asset_location FROM emergencies e LEFT JOIN assets a ON e.asset_id = a.uuid WHERE e.company_slug = ? ORDER BY e.created_at DESC LIMIT 50`).bind(slug || '')),
                    safeAll(env.DB.prepare(`SELECT f.*, a.name as asset_name, a.apartmentName as asset_apartment, a.location as asset_location FROM fault_reports f LEFT JOIN assets a ON f.asset_id = a.uuid WHERE f.company_slug = ? LIMIT 50`).bind(slug || '')),

                    // 🚀 YENİ: Personel SOS ve Malzeme Taleplerini Veritabanından Çekme (Eğer tablo yoksa boş döner sistemi çökertmez)
                    safeAll(env.DB.prepare(`SELECT s.*, st.name as staff_name, st.phone as staff_phone FROM staff_sos s LEFT JOIN staff st ON s.staff_id = st.id WHERE s.company_slug = ? AND s.status = 'Aktif'`).bind(slug || '')),
                    safeAll(env.DB.prepare(`SELECT s.*, st.name as staff_name, st.phone as staff_phone FROM staff_sos s LEFT JOIN staff st ON s.staff_id = st.id WHERE s.company_slug = ? ORDER BY s.created_at DESC LIMIT 50`).bind(slug || '')),
                    safeAll(env.DB.prepare(`SELECT m.*, st.name as staff_name FROM material_requests m LEFT JOIN staff st ON m.staff_id = st.id WHERE m.company_slug = ? AND m.status = 'Bekliyor' ORDER BY m.created_at DESC LIMIT 50`).bind(slug || '')),
                    safeAll(env.DB.prepare(`SELECT m.*, st.name as staff_name FROM material_requests m LEFT JOIN staff st ON m.staff_id = st.id WHERE m.company_slug = ? ORDER BY m.created_at DESC LIMIT 50`).bind(slug || ''))
                ]);

                const totalIncome = income?.total || 0;
                const totalExpense = expense?.total || 0;

                // 🚀 BÜYÜME DANIŞMANI VE KAPASİTE ÖLÇER
                const totalAssetsNum = statsAsset?.total || 0;
                const totalStaffNum = statsStaff?.total || 0;
                let growthAdvice = null;

                // Çalışma gününü aylık bazda ortalama 26 kabul ederek günlük yük hesaplıyoruz
                if (totalStaffNum > 0) {
                    const dailyLoadPerStaff = Math.round((totalAssetsNum / totalStaffNum) / 26);
                    if (dailyLoadPerStaff > 15) {
                        growthAdvice = { status: "critical", message: `Uyarı: Usta başına günlük yük ${dailyLoadPerStaff} bakıma ulaştı. Operasyonel aksama yaşamamak için yeni personel almayı düşünmelisiniz.` };
                    } else {
                        growthAdvice = { status: "good", message: `Sistem Stabil: Usta başına günlük ortalama ${dailyLoadPerStaff} bakım düşüyor. Kapasiteniz ideal seviyede.` };
                    }
                } else if (totalAssetsNum > 0) {
                    growthAdvice = { status: "warning", message: `Sistemde ${totalAssetsNum} varlık var ancak atanacak kayıtlı ustanız yok!` };
                }

                // 🚀 EĞER FİRMANIN REFERANS KODU YOKSA (NULL), OTOMATİK OLUŞTUR VE DB'YE YAZ
                if (company && !company.referral_code) {
                    const safeSlugPrefix = slug ? slug.substring(0, 4) : 'COMP';
                    const newRefCode = (safeSlugPrefix + Math.floor(1000 + Math.random() * 9000)).toUpperCase();
                    try {
                        await env.DB.prepare("UPDATE companies SET referral_code = ? WHERE slug = ?").bind(newRefCode, slug).run();
                        company.referral_code = newRefCode;
                    } catch (e) {
                        console.error("Referans kodu oluşturulurken hata:", e);
                    }
                }

                return new Response(JSON.stringify({
                    growthAdvice: growthAdvice, // Frontend'de uyarı çubuğunda göstermek için eklendi
                    subscription_status: company?.subscription_status || 'active', // 🚀 YENİ: Paywall kontrolü
                    trial_ends_at: company?.trial_ends_at, // 🚀 YENİ: Kalan gün hesabı için
                    billing_cycle_anchor: company?.billing_cycle_anchor, // 🚀 YENİ: Fatura kesim tarihi
                    custom_base_price: company?.custom_base_price,
                    custom_per_asset_price: company?.custom_per_asset_price,

                    // Frontend'in hesaplama yapabilmesi için global fiyatları da gönderiyoruz
                    global_base_price: (await safeFirst(env.DB.prepare("SELECT value FROM system_settings WHERE key = 'global_base_price'")))?.value || 3000,
                    global_asset_price: (await safeFirst(env.DB.prepare("SELECT value FROM system_settings WHERE key = 'global_asset_price'")))?.value || 50,

                    free_months_balance: company?.free_months_balance || 0,
                    has_masterboss_gift: company?.has_masterboss_gift || 0, // Masterboss hediye bayrağı
                    referralCode: company?.referral_code, // 🚀 YENİ: Frontend'in her yerinde kolayca okunsun diye
                    name: company?.company_name || "İşletme",
                    ownerName: company?.owner_name || "Kullanıcı",
                    sector: company?.sector || "",
                    address: company?.address || "",
                    taxInfo: company?.tax_info || "",
                    phone: company?.phone || "",
                    landlinePhone: company?.landline_phone || "",
                    emergencyPhone: company?.emergency_phone || "",
                    whatsappPhone: company?.whatsapp_phone || "",
                    website: company?.website || "",
                    logo: company?.logo || "",
                    referral_code: company?.referral_code,
                    stats: [
                        { label: 'Toplam İş', value: (statsJob?.total || 0).toString() },
                        { label: 'Personel Sayısı', value: (statsStaff?.total || 0).toString() },
                        { label: 'Varlıklar', value: (statsAsset?.total || 0).toString() },
                        { label: 'Net Kasa', value: `₺${(totalIncome - totalExpense).toLocaleString('tr-TR')}` }
                    ],
                    jobs: (jobs || []).map(j => {
                        let details = {};
                        try { details = JSON.parse(j.details || '{}'); } catch (e) { }
                        let photos = [];
                        try { photos = JSON.parse(j.photo_urls || '[]'); } catch (e) { }
                        return { ...j, details, photos };
                    }),
                    assets: assets || [], staff: staff || [], stock: stock || [], finances: finances || [], customers: customers || [],
                    suppliers: suppliers || [], categories: categories || [],

                    // 🚀 YENİ VERİLER: Hem Cihaz hem Personel Acil Durumları birleştiriliyor
                    activeEmergencies: [...(activeEmergencies || []), ...(activeStaffSos || [])],
                    allEmergencies: [...(allEmergencies || []), ...(allStaffSos || [])],

                    pendingFaults: pendingFaults || [], allFaults: allFaults || [],

                    // Malzeme talepleri (Stringified JSON parse hatasını engellemek için doğrudan aktarım)
                    pendingMaterialRequests: (pendingMaterialRequests || []).map(req => {
                        let parsedItems = [];
                        try {
                            parsedItems = typeof req.items === 'string' ? JSON.parse(req.items) : req.items;
                        } catch (e) { }
                        return { ...req, parsed_items: parsedItems };
                    }),
                    allMaterialRequests: (allMaterialRequests || []).map(req => {
                        let parsedItems = [];
                        try {
                            parsedItems = typeof req.items === 'string' ? JSON.parse(req.items) : req.items;
                        } catch (e) { }
                        return { ...req, parsed_items: parsedItems };
                    }),

                    finSummary: { income: totalIncome, expense: totalExpense }
                }), { headers: corsHeaders });
            }

            // 🚀 R2 PUBLIC URL KULLANAN, ÜSTÜNE YAZAN (OVERWRITE) VE CACHE KIRAN LOGO MOTORU
            if (url.pathname === "/update-settings" && method === "POST") {
                const { slug, companyName, ownerName, sector, address, taxInfo, phone, landlinePhone, emergencyPhone, whatsappPhone, website, logo } = await request.json();

                let finalLogoUrl = logo;

                // Eğer logo base64 formatındaysa (Frontend'den yeni yüklendiyse) R2'ye aktar
                if (logo && logo.startsWith('data:image/')) {
                    try {
                        const base64Data = logo.split(',')[1];
                        const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                        // SABİT İSİM KULLANIYORUZ: Eski logo silinmeden direkt üstüne yazılacak (Overwrite)
                        const fileName = `fixlog/${slug}/logos/logo.png`;

                        await env.BUCKET.put(fileName, bytes.buffer, {
                            httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' },
                            customMetadata: { 'company': slug }
                        });

                        // VERİTABANINA YAZILAN LİNK: Sonuna ?v=... eklenerek CDN Cache kırılır.
                        // Bu sayede frontend React kodlarında sahte parametreler ekleyip resmi kırpıştırmak zorunda kalmayız.
                        finalLogoUrl = `https://pub-a78064a5e9304242b0982c01b5778197.r2.dev/${fileName}?v=${Date.now()}`;
                    } catch (err) {
                        console.error("Logo R2'ye yüklenirken hata oluştu:", err);
                    }
                }

                await env.DB.prepare("UPDATE companies SET company_name = ?, owner_name = ?, sector = ?, address = ?, tax_info = ?, phone = ?, landline_phone = ?, emergency_phone = ?, whatsapp_phone = ?, website = ?, logo = ? WHERE slug = ?")
                    .bind(companyName || '', ownerName || '', sector || '', address || '', taxInfo || '', phone || '', landlinePhone || '', emergencyPhone || '', whatsappPhone || '', website || '', finalLogoUrl || '', slug || '').run();

                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/add-support-ticket" && method === "POST") {
                const { type, message } = await request.json(); // Slug body'den çekilmiyor, manipülasyon önlendi
                const id = crypto.randomUUID();

                // 🚀 ÇÖZÜM: Kesin güvenlik için frontend slug'ı yerine doğrudan token'daki yetkili slug baz alınıyor
                const safeSlug = userAuth ? userAuth.slug : null;
                if (!safeSlug) return new Response(JSON.stringify({ error: "Yetkisiz veya eksik firma bilgisi!" }), { status: 403, headers: corsHeaders });

                const safeName = userAuth.name || 'Yetkili';

                await env.DB.prepare("INSERT INTO support_tickets (id, company_slug, sender_name, type, message, status, replies) VALUES (?, ?, ?, ?, ?, 'Açık', '[]')")
                    .bind(id, safeSlug, safeName, type || 'Geri Bildirim', message || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // YENİ: FİRMANIN GEÇMİŞ DESTEK TALEPLERİNİ GETİRİR
            if (url.pathname === "/get-my-tickets" && method === "GET") {
                // 🚀 ÇÖZÜM: Frontend'den gelen manipüle edilebilir slug yerine doğrudan güvenli token (userAuth) içindeki slug'ı kullanıyoruz!
                const finalSlug = userAuth ? userAuth.slug : null;

                if (!finalSlug) {
                    return new Response(JSON.stringify([]), { headers: corsHeaders });
                }

                const tickets = await safeAll(env.DB.prepare("SELECT * FROM support_tickets WHERE company_slug = ? ORDER BY created_at DESC").bind(finalSlug));

                return new Response(JSON.stringify(tickets || []), { headers: corsHeaders });
            }

            // 🚀 YENİ: MÜŞTERİNİN (FİRMANIN) MEVCUT TALEBE YANIT VERMESİ
            if (url.pathname === "/reply-support-ticket" && method === "POST") {
                const { ticketId, replyMessage } = await request.json();

                // 🚀 ÇÖZÜM: Frontend'den gelen şüpheli slug yerine kesin ve güvenilir olan userAuth.slug kullanımı
                const safeSlug = userAuth ? userAuth.slug : null;
                if (!safeSlug) return new Response(JSON.stringify({ error: "Yetkisiz veya eksik firma bilgisi!" }), { status: 403, headers: corsHeaders });

                // Mevcut yanıtları çek
                const ticket = await safeFirst(env.DB.prepare("SELECT replies FROM support_tickets WHERE id = ? AND company_slug = ?").bind(ticketId, safeSlug));
                if (!ticket) return new Response(JSON.stringify({ error: "Talep bulunamadı" }), { status: 404, headers: corsHeaders });

                let repliesArray = [];
                try { repliesArray = JSON.parse(ticket.replies || '[]'); } catch (e) { repliesArray = []; }

                // Yeni yanıtı ekle
                repliesArray.push({
                    sender: 'customer',
                    message: replyMessage,
                    date: new Date().toISOString()
                });

                const finalRepliesJSON = JSON.stringify(repliesArray);

                // 🚀 DÜZELTME: Tanımsız olan 'slug' yerine veritabanı güvenliği için 'safeSlug' kullanıldı!
                await env.DB.prepare("UPDATE support_tickets SET replies = ? WHERE id = ? AND company_slug = ?")
                    .bind(finalRepliesJSON, ticketId, safeSlug).run();

                return new Response(JSON.stringify({ success: true, updatedReplies: finalRepliesJSON }), { headers: corsHeaders });
            }

            if (url.pathname === "/add-category" && method === "POST") {
                const { slug, name } = await request.json();
                await env.DB.prepare("INSERT INTO stock_categories (company_slug, name) VALUES (?, ?)")
                    .bind(slug || '', name || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/delete-category" && method === "POST") {
                const { slug, id } = await request.json();
                await env.DB.prepare("DELETE FROM stock_categories WHERE id=? AND company_slug=?").bind(id, slug || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/update-category" && method === "POST") {
                const { slug, id, name } = await request.json();
                await env.DB.prepare("UPDATE stock_categories SET name=? WHERE id=? AND company_slug=?").bind(name || '', id, slug || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/add-staff" && method === "POST") {
                const { slug, id, name, phone, contact, role, branch, username, password, is_active, assigned_regions } = await request.json();

                const finalPhone = phone || contact || '';

                // Yönetici rolündekilerin yalnızca "Usta" eklemesini / düzenlemesini sağlayan kontrol
                if (userAuth && userAuth.role === "Yönetici") {
                    if (role === "Yönetici" || role === "Patron") {
                        return new Response(JSON.stringify({ error: "Yöneticiler sadece 'Usta' rolünde personel ekleyebilir." }), { status: 403, headers: corsHeaders });
                    }
                    if (id) {
                        const targetStaff = await safeFirst(env.DB.prepare("SELECT role FROM staff WHERE id=? AND company_slug=?").bind(id, slug || ''));
                        if (targetStaff && targetStaff.role === "Yönetici") {
                            return new Response(JSON.stringify({ error: "Yöneticiler diğer yöneticilerin bilgilerini güncelleyemez." }), { status: 403, headers: corsHeaders });
                        }
                    }
                }

                let hashedPw = null;
                if (password) {
                    hashedPw = await hashPassword(password);
                }

                if (id) {
                    if (password) {
                        await env.DB.prepare("UPDATE staff SET name=?, phone=?, role=?, branch=?, username=?, password_hash=?, is_active=?, assigned_regions=? WHERE id=? AND company_slug=?")
                            .bind(name || '', finalPhone, role || '', branch || '', username || '', hashedPw, is_active ?? 1, assigned_regions || '', id, slug || '').run();
                    } else {
                        await env.DB.prepare("UPDATE staff SET name=?, phone=?, role=?, branch=?, username=?, is_active=?, assigned_regions=? WHERE id=? AND company_slug=?")
                            .bind(name || '', finalPhone, role || '', branch || '', username || '', is_active ?? 1, assigned_regions || '', id, slug || '').run();
                    }
                } else {
                    await env.DB.prepare("INSERT INTO staff (company_slug, name, phone, role, branch, username, password_hash, is_active, assigned_regions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
                        .bind(slug || '', name || '', finalPhone, role || 'Usta', branch || '', username || '', hashedPw || '', is_active ?? 1, assigned_regions || '').run();
                }
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/delete-staff" && method === "POST") {
                const { slug, id } = await request.json();
                await env.DB.prepare("DELETE FROM staff WHERE id = ? AND company_slug = ?").bind(id, slug || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/add-supplier" && method === "POST") {
                const { slug, name, phone } = await request.json();
                await env.DB.prepare("INSERT INTO suppliers (company_slug, name, phone) VALUES (?, ?, ?)")
                    .bind(slug || '', name || '', phone || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/update-supplier" && method === "POST") {
                const { slug, id, name, phone } = await request.json();
                await env.DB.prepare("UPDATE suppliers SET name=?, phone=? WHERE id=? AND company_slug=?").bind(name || '', phone || '', id, slug || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/delete-supplier" && method === "POST") {
                const { slug, id } = await request.json();
                await env.DB.prepare("DELETE FROM suppliers WHERE id=? AND company_slug=?").bind(id, slug || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/add-job" && method === "POST") {
                const { slug, customerName, workType, jobType, scheduledDate, details, assetId, staffId, projectPdf, status } = await request.json();

                let secureDetails = {};
                if (typeof details === 'string') {
                    try { secureDetails = JSON.parse(details); } catch (e) { secureDetails = {}; }
                } else if (typeof details === 'object' && details !== null) {
                    secureDetails = details;
                }

                // 🚀 YENİ SÜTUNLAR (Default Değerler)
                let creatorId = null;
                let creatorName = 'Sistem';
                let creatorRole = 'Bilinmiyor';
                let managerId = null;
                let managerName = null;
                let workerId = null;
                let workerName = null;

                // İşi kim oluşturuyor? Oku ve yaz!
                if (userAuth) {
                    creatorId = String(userAuth.id || 'PATRON');
                    creatorName = userAuth.role === 'Patron' ? (userAuth.name || 'Patron') : userAuth.name;
                    creatorRole = userAuth.role;

                    // Eğer işi bizzat YÖNETİCİ oluşturuyorsa, onu otomatik "Sorumlu Yönetici" yap!
                    if (userAuth.role === 'Yönetici') {
                        managerId = String(userAuth.id);
                        managerName = userAuth.name;
                    }
                }

                const cleanStaffId = (staffId && staffId !== "") ? String(staffId) : null;
                const cleanAssetId = (assetId && assetId !== "") ? String(assetId) : null;

                // 🚀 İLK ATAMA MOTORU: Yeni iş kime gidiyor tespit edelim
                if (cleanStaffId) {
                    const assignedStaff = await safeFirst(env.DB.prepare("SELECT name, role FROM staff WHERE id = ?").bind(cleanStaffId));
                    if (assignedStaff) {
                        if (assignedStaff.role === 'Yönetici') {
                            managerId = cleanStaffId;
                            managerName = assignedStaff.name;
                        } else if (assignedStaff.role === 'Usta') {
                            workerId = cleanStaffId;
                            workerName = assignedStaff.name;
                        }
                    }
                }

                const finalStaffId = workerId || managerId || null;

                let finalPdfUrl = null;
                if (projectPdf && projectPdf.startsWith('data:application/pdf') && env.BUCKET) {
                    try {
                        const base64Data = projectPdf.split(',')[1];
                        // 🚀 Cloudflare Worker sınırlarına takılmamak için Buffer (binary) çevrimi yapıyoruz
                        const byteString = atob(base64Data);
                        const buffer = new ArrayBuffer(byteString.length);
                        const intArray = new Uint8Array(buffer);
                        for (let i = 0; i < byteString.length; i++) {
                            intArray[i] = byteString.charCodeAt(i);
                        }

                        const pdfId = crypto.randomUUID();
                        const fileName = `fixlog/${slug}/projects/job-pdf-${pdfId}.pdf`;

                        await env.BUCKET.put(fileName, buffer, {
                            httpMetadata: { contentType: 'application/pdf', cacheControl: 'public, max-age=31536000' },
                            customMetadata: { 'company': slug }
                        });
                        finalPdfUrl = `https://pub-a78064a5e9304242b0982c01b5778197.r2.dev/${fileName}`;
                    } catch (err) {
                        console.error("PDF R2'ye yüklenirken hata:", err);
                    }
                }

                const finalStatus = status || (jobType === 'Planlı' ? 'Gelecek' : 'Beklemede');
                const nowStr = new Date().toISOString();

                // 🚀 JSON Yerine Doğrudan Yeni Sütunlara INSERT Ediyoruz
                await env.DB.prepare(`
            INSERT INTO jobs (
                company_slug, customer_name, work_type, job_type, scheduled_date, details, asset_id, status,
                creator_id, creator_name, creator_role, manager_id, manager_name, worker_id, worker_name, staff_id, project_pdf_url, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
                    slug || '', customerName || '', workType || 'Görev', jobType || 'Anlık', scheduledDate || null, JSON.stringify(secureDetails), cleanAssetId, finalStatus,
                    creatorId, creatorName, creatorRole, managerId, managerName, workerId, workerName, finalStaffId, finalPdfUrl, nowStr
                ).run();

                if (cleanStaffId) {
                    let jobLocationText = `👤 Müşteri: ${customerName || 'Belirtilmemiş'}`;
                    if (cleanAssetId) {
                        const assetDetails = await safeFirst(env.DB.prepare("SELECT name, apartmentName, customer_id FROM assets WHERE id = ?").bind(cleanAssetId));
                        if (assetDetails) {
                            if (assetDetails.apartmentName && assetDetails.apartmentName.trim() !== "") {
                                jobLocationText = `🏢 Bina: ${assetDetails.apartmentName}\n🛗 Cihaz: ${assetDetails.name || 'Bilinmiyor'}`;
                            } else {
                                let phone = 'Telefon Yok';
                                if (assetDetails.customer_id) {
                                    const cust = await safeFirst(env.DB.prepare("SELECT contact FROM customers WHERE id = ?").bind(assetDetails.customer_id));
                                    if (cust && cust.contact) phone = cust.contact;
                                }
                                jobLocationText = `👤 Müşteri: ${customerName}\n📞 İletişim: ${phone}`;
                            }
                        }
                    }
                    const jobTitle = `📋 Yeni Görev: ${workType || 'Genel İş'}`;
                    const jobBody = `${jobLocationText}\nLütfen detayları kontrol edin.`;
                    ctx.waitUntil(triggerBeams([`user-${slug}-${cleanStaffId}`], jobTitle, jobBody, `${APP_URL}/${slug}/dashboard`, slug));
                }

                ctx.waitUntil(triggerPusher(`company-${slug}`, 'data_updated', {}));
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/add-stock" && method === "POST") {
                const data = await request.json();
                let finalSupplierId = data.supplierId;

                if (data.supplierMode === 'NEW' && data.newSupplier && data.newSupplier.name) {
                    const insertSup = await env.DB.prepare("INSERT INTO suppliers (company_slug, name, phone) VALUES (?, ?, ?) RETURNING id")
                        .bind(data.slug || '', data.newSupplier.name, data.newSupplier.phone || '').run();
                    finalSupplierId = insertSup.results && insertSup.results.length > 0 ? insertSup.results[0].id : null;
                }

                const safeMinAlert = data.min_alert !== undefined && data.min_alert !== "" ? Number(data.min_alert) : (data.minAlert !== undefined && data.minAlert !== "" ? Number(data.minAlert) : 5);

                await env.DB.prepare("INSERT INTO stock (company_slug, item_name, category, quantity, unit_name, unit_price, supplier_id, min_alert) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                    .bind(data.slug || '', data.itemName || data.name || '', data.category || '', data.quantity || 0, data.unitName || data.unit || 'Adet', data.unitPrice || 0, (finalSupplierId === 'NEW' || !finalSupplierId || finalSupplierId === "") ? null : finalSupplierId, safeMinAlert).run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/update-stock" && method === "POST") {
                const { slug, id, itemName, quantity, unitName, unitPrice, category, supplierId, minAlert } = await request.json();
                const safeMinAlert = minAlert !== undefined && minAlert !== null ? Number(minAlert) : 5;
                await env.DB.prepare("UPDATE stock SET item_name=?, quantity=?, unit_name=?, unit_price=?, category=?, supplier_id=?, min_alert=? WHERE id=? AND company_slug=?")
                    .bind(itemName || '', quantity || 0, unitName || 'Adet', unitPrice || 0, category || '', (supplierId && supplierId !== "") ? supplierId : null, safeMinAlert, id, slug || '').run();

                if (Number(quantity) <= safeMinAlert) {
                    ctx.waitUntil(triggerBeams([`role-${slug}-ADMIN`], '⚠️ Kritik Stok Uyarısı', `${itemName} tükenmek üzere! (Kalan: ${quantity} ${unitName})`, `${APP_URL}/${slug}/manager`, slug));
                }
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/delete-stock" && method === "POST") {
                const { slug, id } = await request.json();
                await env.DB.prepare("DELETE FROM stock WHERE id=? AND company_slug=?").bind(id, slug || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // 🚀 AKILLI TAHSİLAT VE KASA BAĞLANTISI (TÜM İŞLEMLER İÇİN)
            if (url.pathname === "/approve-job" && method === "POST") {
                const { slug, jobId, amount, customerName, paymentStatus } = await request.json();
                let approver = userAuth ? userAuth.name : 'Sistem / Patron';

                // Patron/Yönetici frontend'den ödeme durumunu seçmezse varsayılanı koruyoruz
                const finalStatus = paymentStatus || 'Tahsil Edildi';
                const finalAmount = amount ? Number(amount) : 0;

                // 1. İşin durumunu ve tahsilat bilgisini jobs tablosunda güncelle
                await env.DB.prepare("UPDATE jobs SET status = 'Tamamlandı', payment_status = ?, payment_amount = ? WHERE id = ? AND company_slug = ?")
                    .bind(finalStatus, finalAmount, jobId, slug || '').run();

                // 2. SADECE tahsilat tamamlandıysa ve tutar girildiyse kasaya işle, job_id ile bağla!
                if (finalStatus === 'Tahsil Edildi' && finalAmount > 0) {
                    await env.DB.prepare("INSERT INTO finances (company_slug, description, amount, type, added_by, job_id) VALUES (?, ?, ?, 'Gelir', ?, ?)")
                        .bind(slug || '', `İş Tahsilatı: ${customerName || 'Müşteri'} (İş No: #${jobId})`, finalAmount, approver, jobId).run();
                }

                ctx.waitUntil(triggerPusher(`company-${slug}`, 'data_updated', {}));
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // 🚀 YENİ OTONOM PERİYODİK BAKIM DAĞITIM MOTORU (SIFIR MALİYETLİ MATEMATİKSEL ALGORİTMA)
            if (url.pathname === "/generate-monthly-maintenance" && method === "POST") {
                let reqBody = {};
                try { reqBody = await request.clone().json(); } catch (e) { }

                // 🚀 KÖK NEDEN ÇÖZÜMÜ: Arayüz slug göndermeyi unutsa bile Güvenlik Token'ından kimliği zorla çeker!
                const safeSlug = (userAuth && userAuth.slug) ? userAuth.slug : (reqBody.slug || url.searchParams.get("slug"));

                if (!safeSlug) {
                    return new Response(JSON.stringify({ error: "Güvenlik İhlali: Firma kimliği doğrulanamadı." }), { status: 403, headers: corsHeaders });
                }

                const targetMonth = reqBody.month !== undefined ? reqBody.month : new Date().getMonth();
                const targetYear = reqBody.year !== undefined ? reqBody.year : new Date().getFullYear();

                // 1. Firmanın çalışma günlerini dinamik olarak çek
                const company = await safeFirst(env.DB.prepare("SELECT work_days FROM companies WHERE slug = ?").bind(safeSlug));
                let workDays = [1, 2, 3, 4, 5, 6]; // Varsayılan Pzt-Cmt
                if (company && company.work_days) {
                    try { workDays = JSON.parse(company.work_days); } catch (e) { }
                }

                // 🚀 OTOPİLOT HEDEF AYI
                const targetMonthStr = String(targetMonth + 1).padStart(2, '0');
                const monthPrefix = `${targetYear}-${targetMonthStr}`;

                // 2. Bakım yapabilecek aktif ustaları çek (Otopilot Bölge Eşleştirmesi için assigned_regions dahil edildi)
                const staffList = await safeAll(env.DB.prepare("SELECT id, name, assigned_regions FROM staff WHERE company_slug = ? AND role = 'Usta' AND is_active = 1").bind(safeSlug));
                if (!staffList || staffList.length === 0) {
                    return new Response(JSON.stringify({ error: "Sistemde bakım atanacak aktif usta bulunamadı. Lütfen önce usta ekleyin." }), { status: 400, headers: corsHeaders });
                }

                // 🚀 PROD SEVİYE RAM FİLTRELEME MİMARİSİ (SQLite Hatalarını %100 Önler)
                // A. Tüm varlıkları çek ve JS ile filtrele
                const rawAssets = await safeAll(env.DB.prepare("SELECT * FROM assets WHERE company_slug = ?").bind(safeSlug));
                const allAutopilotAssets = rawAssets.filter(a => a.is_autopilot == 1 || a.is_autopilot === '1' || a.is_autopilot === 'true');

                if (allAutopilotAssets.length === 0) {
                    return new Response(JSON.stringify({ error: "Otopilotta olan aktif hiçbir varlık bulunamadı. Lütfen önce tesislere otopilot ataması yapın." }), { status: 400, headers: corsHeaders });
                }

                // B. Bu aya ait oluşturulmuş işleri çek
                const thisMonthJobs = await safeAll(env.DB.prepare(`
                    SELECT asset_id FROM jobs 
                    WHERE company_slug = ? 
                    AND work_type = 'Periyodik Bakım' 
                    AND status != 'İptal'
                    AND creator_name = 'Otonom Sistem'
                    AND scheduled_date LIKE ?
                `).bind(safeSlug, `${monthPrefix}%`));

                const existingAssetIds = new Set(thisMonthJobs.map(j => String(j.asset_id)));

                // C. İşi olmayan varlıkları ayır
                const assets = allAutopilotAssets.filter(a => !existingAssetIds.has(String(a.id)));

                if (assets.length === 0) {
                    return new Response(JSON.stringify({ success: true, message: "Sistem Kusursuz: Otopilottaki tüm varlıklar için bu ayın bakım kayıtları zaten başarıyla oluşturulmuş ve ustaların rotalarına düşmüştür!" }), { headers: corsHeaders });
                }

                // D. Müşteri isimlerini hızlıca RAM'e al
                const customers = await safeAll(env.DB.prepare("SELECT id, name FROM customers WHERE company_slug = ?").bind(safeSlug));
                const customerMap = {};
                customers.forEach(c => { customerMap[String(c.id)] = c.name; });

                // 4. İlgili ayın içinde çalışılacak net günleri (Tarih formatında) hesapla
                const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                const todayStr = new Date().toISOString().split('T')[0];

                let availableDates = [];
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(targetYear, targetMonth, day);
                    const dayOfWeek = date.getDay(); // JS'de 0 Pazardır
                    const mappedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Patronun DB mantığıyla uyuşması için 7'ye çeviriyoruz

                    if (workDays.includes(mappedDay)) {
                        const dateStr = date.toISOString().split('T')[0];

                        // 🚀 TARİH GÜNCELLEMESİ: Eğer otopilotu içinde bulunduğumuz ay için çalıştırıyorsa, bugünden öncesine iş atama!
                        if (targetYear === new Date().getFullYear() && targetMonth === new Date().getMonth()) {
                            if (dateStr >= todayStr) {
                                availableDates.push(dateStr);
                            }
                        } else {
                            availableDates.push(dateStr); // Gelecek ay ise tüm günleri kullan
                        }
                    }
                }

                if (availableDates.length === 0) {
                    return new Response(JSON.stringify({ error: "Seçilen ayda ileriye dönük çalışma günü bulunmuyor." }), { status: 400, headers: corsHeaders });
                }

                // 5. Yük Dengeleme (Load Balancing) ile İşleri Zamana Yayma Algoritması
                let jobsToInsert = [];
                let workloadCounters = {};
                staffList.forEach(s => workloadCounters[String(s.id)] = 0); // Ustaların iş yükü sıfırlanıyor

                const nowStr = new Date().toISOString();

                for (let i = 0; i < assets.length; i++) {
                    const asset = assets[i];

                    let assignedStaffId = asset.route_staff_id ? String(asset.route_staff_id) : null;
                    
                    // 🚀 AKILLI BÖLGE-USTA EŞLEŞTİRMESİ
                    if (!assignedStaffId || !workloadCounters.hasOwnProperty(assignedStaffId)) {
                        let eligibleStaff = staffList;
                        
                        // Varlığın bulunduğu bölge sisteme kayıtlıysa, o bölgeye bakan ustaları bul
                        if (asset.region) {
                            const regionalStaff = staffList.filter(s => {
                                if (!s.assigned_regions) return false;
                                const regions = s.assigned_regions.split(',').map(r => r.trim());
                                return regions.includes(asset.region);
                            });
                            
                            if (regionalStaff.length > 0) {
                                eligibleStaff = regionalStaff;
                            }
                        }

                        // Uygun olan ustalar arasından en az iş yükü olanı seç (Load Balancing)
                        assignedStaffId = eligibleStaff.sort((a, b) => workloadCounters[String(a.id)] - workloadCounters[String(b.id)])[0].id;
                        assignedStaffId = String(assignedStaffId);
                    }
                    workloadCounters[assignedStaffId]++;

                    const dateIndex = Math.floor((i / assets.length) * availableDates.length);
                    const scheduledDate = availableDates[dateIndex];

                    const customerName = customerMap[String(asset.customer_id)] || 'Bağımsız Varlık';
                    const assetFee = asset.maintenance_fee || 0;

                    let assignedWorkerName = 'Sistem Ataması';
                    const assignedStaff = staffList.find(s => String(s.id) === assignedStaffId);
                    if (assignedStaff) assignedWorkerName = assignedStaff.name;

                    jobsToInsert.push(
                        env.DB.prepare(`
                    INSERT INTO jobs (
                        company_slug, customer_name, work_type, job_type, scheduled_date, asset_id, status, 
                        worker_id, worker_name, staff_id, payment_status, payment_amount, creator_name, creator_role, details, created_at
                    )
                    VALUES (?, ?, 'Periyodik Bakım', 'Planlı', ?, ?, 'Usta Bekliyor', ?, ?, ?, 'Bekliyor', ?, 'Otonom Sistem', 'Sistem', '{}', ?)
                `).bind(safeSlug, customerName, scheduledDate, asset.id, assignedStaffId, assignedWorkerName, assignedStaffId, assetFee, nowStr)
                    );
                }

                // 6. D1 Limitlerini Aşmayan Toplu Yazım (Batch Query)
                if (jobsToInsert.length > 0) {
                    const assetUpdateQueries = assets.map((asset, i) => {
                        const dateIndex = Math.floor((i / assets.length) * availableDates.length);
                        const scheduledDate = availableDates[dateIndex];
                        return env.DB.prepare("UPDATE assets SET next_maintenance_date = ? WHERE id = ?").bind(scheduledDate, asset.id);
                    });

                    const chunkSize = 50;
                    const allQueries = [...jobsToInsert, ...assetUpdateQueries];

                    for (let i = 0; i < allQueries.length; i += chunkSize) {
                        const chunk = allQueries.slice(i, i + chunkSize);
                        await env.DB.batch(chunk);
                    }

                    // 🚀 7. BİLDİRİM MOTORU: Tüm işler dağıtıldıktan sonra ustaları bilgilendir
                    Object.keys(workloadCounters).forEach(staffId => {
                        const count = workloadCounters[staffId];
                        if (count > 0) {
                            ctx.waitUntil(triggerBeams(
                                [`user-${safeSlug}-${staffId}`],
                                '🔄 Yeni Periyodik Bakımlar',
                                `Fixlog.co Asistanı rotanıza bu ay için ${count} adet periyodik bakım görevi ekledi.`,
                                `${APP_URL}/${safeSlug}/dashboard`,
                                safeSlug
                            ));
                        }
                    });
                }

                return new Response(JSON.stringify({
                    success: true,
                    message: `${assets.length} periyodik bakım, ${staffList.length} ustaya ${availableDates.length} iş günü içine otonom olarak dağıtıldı.`
                }), { headers: corsHeaders });
            }

            if (url.pathname === "/add-expense" && method === "POST") {
                const { slug, description, amount, addedBy } = await request.json();
                let executor = addedBy || (userAuth ? userAuth.name : 'Sistem / Patron');

                await env.DB.prepare("INSERT INTO finances (company_slug, description, amount, type, added_by) VALUES (?, ?, ?, 'Gider', ?)")
                    .bind(slug || '', description || 'Gider Fişi', amount || 0, executor).run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/add-income" && method === "POST") {
                const { slug, description, amount, addedBy } = await request.json();
                let executor = addedBy || (userAuth ? userAuth.name : 'Sistem / Patron');

                await env.DB.prepare("INSERT INTO finances (company_slug, description, amount, type, added_by) VALUES (?, ?, ?, 'Gelir', ?)")
                    .bind(slug || '', description || 'Manuel Gelir', amount || 0, executor).run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // 🚀 1. GÜNCELLEME: YENİ VARLIK EKLENİRKEN BAKIM ÜCRETİNİ, PERİYODUNU VE ROTASINI KAYDET
            if (url.pathname === "/add-asset" && method === "POST") {
                const data = await request.json();
                // 🚀 DÜZELTME: Hem data.customerId hem de data.customer_id desteklenerek frontend'den gelen veri kaybı önlendi.
                let finalCustomerId = data.customerId || data.customer_id;
                if (finalCustomerId === 'NEW' && data.newCustomer && data.newCustomer.name) {
                    const insertCust = await env.DB.prepare("INSERT INTO customers (company_slug, name, contact, address, tax_info) VALUES (?, ?, ?, ?, ?) RETURNING id")
                        .bind(data.slug || '', data.newCustomer.name, data.newCustomer.contact || '', data.newCustomer.address || '', data.newCustomer.taxInfo || data.newCustomer.tax_info || '').run();
                    finalCustomerId = insertCust.results && insertCust.results.length > 0 ? insertCust.results[0].id : null;
                }

                // 🚀 ÇÖZÜM: Frontend'den gelebilecek tüm isimlendirme varyasyonları kapsandı
                const maintenanceFee = Number(data.maintenanceFee || data.maintenance_fee || 0);
                const maintenancePeriod = Number(data.maintenancePeriod || data.maintenance_period || 30);
                const routeStaffId = data.routeStaffId || data.route_staff_id || null;
                const assetDetails = data.assetDetails || data.asset_details || data.deviceDetails || '';

                const finalUuid = data.uuid || crypto.randomUUID();

                await env.DB.prepare(`
            INSERT INTO assets (
                company_slug, name, location, apartmentName, asset_details, 
                customer_id, uuid, maintenance_fee, maintenance_period, route_staff_id, region
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
                    data.slug || '',
                    data.name || '',
                    data.location || '',
                    data.apartmentName || '',
                    assetDetails,
                    (finalCustomerId === 'NEW' || !finalCustomerId || finalCustomerId === "") ? null : finalCustomerId,
                    finalUuid,
                    maintenanceFee,
                    maintenancePeriod,
                    routeStaffId === "" ? null : routeStaffId,
                    data.region || ''
                ).run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/update-asset" && method === "POST") {
                const data = await request.json();

                const currentAsset = await safeFirst(env.DB.prepare("SELECT * FROM assets WHERE id = ? AND company_slug = ?").bind(data.id, data.slug || ''));

                if (!currentAsset) {
                    return new Response(JSON.stringify({ error: "Varlık bulunamadı" }), { status: 404, headers: corsHeaders });
                }

                const name = data.name !== undefined ? data.name : currentAsset.name;
                const location = data.location !== undefined ? data.location : currentAsset.location;
                const apartmentName = data.apartmentName !== undefined ? data.apartmentName : (currentAsset.apartmentName || currentAsset.apartment_name);
                const assetDetails = data.assetDetails !== undefined ? data.assetDetails : (data.asset_details !== undefined ? data.asset_details : (data.deviceDetails !== undefined ? data.deviceDetails : currentAsset.asset_details));

                const customerId = data.customer_id !== undefined ? (data.customer_id === '' ? null : data.customer_id) : currentAsset.customer_id;

                const maintenanceFee = data.maintenanceFee !== undefined ? Number(data.maintenanceFee) : (data.maintenance_fee !== undefined ? Number(data.maintenance_fee) : (currentAsset.maintenance_fee || 0));
                const maintenancePeriod = data.maintenancePeriod !== undefined ? Number(data.maintenancePeriod) : (data.maintenance_period !== undefined ? Number(data.maintenance_period) : (currentAsset.maintenance_period || 30));
                const routeStaffId = data.routeStaffId !== undefined ? data.routeStaffId : (data.route_staff_id !== undefined ? data.route_staff_id : currentAsset.route_staff_id);

                // 🚀 OTOPİLOT VE TAHSİLAT GÜNCELLEMELERİ EKLENDİ
                const isAutopilot = data.is_autopilot !== undefined ? data.is_autopilot : currentAsset.is_autopilot;
                const lastCollectionDate = data.last_collection_date !== undefined ? data.last_collection_date : currentAsset.last_collection_date;
                const region = data.region !== undefined ? data.region : currentAsset.region;

                await env.DB.prepare(`
            UPDATE assets SET 
                name = ?, location = ?, apartmentName = ?, asset_details = ?, 
                customer_id = ?, maintenance_fee = ?, maintenance_period = ?, route_staff_id = ?,
                is_autopilot = ?, last_collection_date = ?, region = ?
            WHERE id = ? AND company_slug = ?
        `).bind(
                    name || '', location || '', apartmentName || '', assetDetails || '',
                    customerId, maintenanceFee, maintenancePeriod, routeStaffId === "" ? null : routeStaffId,
                    isAutopilot, lastCollectionDate, region || '',
                    data.id, data.slug || ''
                ).run();

                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/delete-asset" && method === "POST") {
                const { slug, id } = await request.json();
                await env.DB.prepare("DELETE FROM assets WHERE id = ? AND company_slug = ?").bind(id, slug || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/add-customer" && method === "POST") {
                const data = await request.json();
                const insertCust = await env.DB.prepare("INSERT INTO customers (company_slug, name, contact, address, tax_info) VALUES (?, ?, ?, ?, ?) RETURNING id")
                    .bind(data.slug || '', data.name || '', data.contact || '', data.address || '', data.taxInfo || data.tax_info || '').run();
                const newCustId = insertCust.results && insertCust.results.length > 0 ? insertCust.results[0].id : null;

                // 🚀 DÜZELTME: Hem yeni yöntemdeki linked_asset_id hem de eski assetAction destekleniyor
                const finalAssetAction = data.linked_asset_id || data.assetAction;

                if (finalAssetAction === 'NEW' && data.newAsset && data.newAsset.name) {
                    await env.DB.prepare("INSERT INTO assets (company_slug, name, location, apartmentName, asset_details, customer_id) VALUES (?, ?, ?, ?, ?, ?)")
                        .bind(data.slug || '', data.newAsset.name, data.newAsset.location || '', data.newAsset.apartmentName || '', data.newAsset.deviceDetails || '', newCustId).run();
                }
                else if (finalAssetAction && finalAssetAction !== 'NONE' && finalAssetAction !== 'NEW') {
                    await env.DB.prepare("UPDATE assets SET customer_id = ? WHERE id = ? AND company_slug = ?")
                        .bind(newCustId, finalAssetAction, data.slug || '').run();
                }
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/update-customer" && method === "POST") {
                const data = await request.json();
                await env.DB.prepare("UPDATE customers SET name = ?, contact = ?, address = ?, tax_info = ? WHERE id = ? AND company_slug = ?")
                    .bind(data.name || '', data.contact || '', data.address || '', data.taxInfo || data.tax_info || '', data.id, data.slug || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/delete-customer" && method === "POST") {
                const { slug, id } = await request.json();
                await env.DB.prepare("DELETE FROM customers WHERE id = ? AND company_slug = ?").bind(id, slug || '').run();
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // 🚀 AKILLI EXCEL TOPLU VERİ YÜKLEME MOTORU (BULK IMPORT)
            if (url.pathname === "/bulk-import" && method === "POST") {
                const { slug, items } = await request.json();

                if (!items || !items.length) {
                    return new Response(JSON.stringify({ error: "Veri bulunamadı" }), { status: 400, headers: corsHeaders });
                }

                // 🚀 İBNELİK: Aynı isimdeki binaların ve müşterilerin karışmasını önleyen Özel Anahtar
                const generateCustKey = (name) => {
                    return name ? name.toLowerCase().trim() : '';
                };

                let customerMap = {};

                // Mevcut müşterileri çekip İSİM kombinasyonuyla haritalıyoruz
                const existingCustomers = await safeAll(env.DB.prepare("SELECT id, name FROM customers WHERE company_slug = ?").bind(slug));
                existingCustomers.forEach(c => {
                    if (c.name) {
                        const key = generateCustKey(c.name);
                        customerMap[key] = c.id;
                    }
                });

                // 1. AŞAMA: Müşterileri Kaydet (Performanslı Toplu İşlem - D1 Limit Koruması)
                const newCustomerStatements = [];
                const uniqueNewCustomers = new Set();

                for (const item of items) {
                    const custName = item.customerName ? item.customerName.trim() : null;
                    if (custName) {
                        const key = generateCustKey(custName);
                        if (!customerMap[key] && !uniqueNewCustomers.has(key)) {
                            uniqueNewCustomers.add(key); // Aynı dosyada aynı isim tekrar geçerse DB'yi yormamak için listeye al

                            // 🚀 EXCEL .0 TEMİZLİĞİ
                            let rawTax = item.taxInfo || item.tax_info || '';
                            let safeTax = String(rawTax).trim();
                            if (safeTax.endsWith('.0')) {
                                safeTax = safeTax.slice(0, -2);
                            }

                            newCustomerStatements.push(
                                env.DB.prepare("INSERT INTO customers (company_slug, name, contact, address, tax_info) VALUES (?, ?, ?, ?, ?)")
                                    .bind(slug, custName, item.customerPhone || '', item.location || '', safeTax)
                            );
                        }
                    }
                }

                if (newCustomerStatements.length > 0) {
                    // Müşterileri toplu halde (batch) sıfır maliyetle ekle
                    const chunkSize = 50;
                    for (let i = 0; i < newCustomerStatements.length; i += chunkSize) {
                        const chunk = newCustomerStatements.slice(i, i + chunkSize);
                        await env.DB.batch(chunk);
                    }

                    // Eklenen yeni müşterilerin ID'lerini Varlıklara atayabilmek için haritayı (Map) güncelle
                    const updatedCustomers = await safeAll(env.DB.prepare("SELECT id, name FROM customers WHERE company_slug = ?").bind(slug));
                    updatedCustomers.forEach(c => {
                        if (c.name) customerMap[generateCustKey(c.name)] = c.id;
                    });
                }

                // 2. AŞAMA: Varlıkları Kaydet
                const assetStatements = [];
                for (const item of items) {
                    const custName = item.customerName ? item.customerName.trim() : null;

                    // 🚀 Varlığı bağlarken müşteri anahtarını kullanıyoruz
                    const mappedCustomerId = custName ? customerMap[generateCustKey(custName)] : null;

                    const assetName = item.assetType || 'Bilinmeyen Cihaz';
                    const apartmentName = item.apartmentName || '';
                    const location = item.location || ''; // Frontend'de birleştirilen Adres (Sokak+İlçe+İl)
                    const details = item.assetDetails || '';
                    const uuid = crypto.randomUUID();

                    // 🚀 YENİ EXCEL SÜTUNLARI ENTEGRASYONU: Bakım Periyodu ve Ücreti
                    const maintenancePeriod = item.maintenance_period ? Number(item.maintenance_period) : 30;
                    const maintenanceFee = item.maintenanceFee ? Number(item.maintenanceFee) : 0;
                    const region = item.district || item.region || item.ilce || ''; // Otopilot için Excel'den bölge bilgisini al

                    // Toplu Insert için D1 Batch Query hazırlıyoruz
                    assetStatements.push(
                        env.DB.prepare("INSERT INTO assets (company_slug, name, location, apartmentName, asset_details, customer_id, uuid, maintenance_period, maintenance_fee, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                            .bind(slug, assetName, location, apartmentName, details, mappedCustomerId, uuid, maintenancePeriod, maintenanceFee, region)
                    );
                }

                // Batch ile hepsini tek seferde basıyoruz (Vercel Limitlerini aşmamak için)
                if (assetStatements.length > 0) {
                    const chunkSize = 100;
                    for (let i = 0; i < assetStatements.length; i += chunkSize) {
                        const chunk = assetStatements.slice(i, i + chunkSize);
                        await env.DB.batch(chunk);
                    }
                }

                return new Response(JSON.stringify({ success: true, importedCount: assetStatements.length }), { headers: corsHeaders });
            }

            // 🚀 HİBRİT MOTOR: ARŞİVLENMİŞ MESAJLARI GETİR
            if (url.pathname === "/get-archived-messages" && method === "GET") {
                const slug = url.searchParams.get("slug");
                if (!env.BUCKET) return new Response(JSON.stringify([]), { headers: corsHeaders });

                const objects = await env.BUCKET.list({ prefix: `global-archives/messages/` });
                if (!objects || !objects.objects || objects.objects.length === 0) return new Response(JSON.stringify([]), { headers: corsHeaders });

                let allMsgs = [];
                for (const obj of objects.objects) {
                    const file = await env.BUCKET.get(obj.key);
                    if (file) {
                        try {
                            const data = await file.json();
                            if (Array.isArray(data)) {
                                allMsgs = [...allMsgs, ...data.filter(m => m.company_slug === slug)];
                            }
                        } catch (err) {
                            console.error("Arşiv dosyası JSON parse hatası:", err);
                        }
                    }
                }
                return new Response(JSON.stringify(allMsgs), { headers: corsHeaders });
            }

            // 🚀 HİBRİT MOTOR: ARŞİVLENMİŞ İŞLERİ GETİR
            // 🚀 GEÇMİŞ İŞLER ENDPOINT (SICAK VERİ - SADECE TAMAMLANMIŞ VE ARŞİVLENMEMİŞ İŞLER)
            if (url.pathname === "/get-recent-history" && method === "GET") {
                const slug = url.searchParams.get("slug");
                if (!slug) return new Response(JSON.stringify({ error: "Eksik parametre" }), { status: 400, headers: corsHeaders });
                const recentJobs = await safeAll(env.DB.prepare("SELECT * FROM jobs WHERE company_slug = ? AND status = 'Tamamlandı' ORDER BY created_at DESC LIMIT 200").bind(slug));
                const mappedJobs = (recentJobs || []).map(j => {
                    let details = {};
                    try { details = JSON.parse(j.details || '{}'); } catch (e) { }
                    let photos = [];
                    try { photos = JSON.parse(j.photo_urls || '[]'); } catch (e) { }
                    return { ...j, details, photos };
                });
                return new Response(JSON.stringify(mappedJobs), { headers: corsHeaders });
            }

            if (url.pathname === "/get-archived-jobs" && method === "GET") {
                const slug = url.searchParams.get("slug");
                const assetId = url.searchParams.get("assetId");

                const objects = await env.BUCKET.list({ prefix: `global-archives/jobs/` });
                let allArchived = [];

                for (const obj of objects.objects) {
                    const file = await env.BUCKET.get(obj.key);
                    if (file) {
                        const data = await file.json();
                        const filtered = data.filter(j => {
                            const matchSlug = j.company_slug === slug;
                            const matchAsset = assetId ? String(j.asset_id) === String(assetId) : true;
                            return matchSlug && matchAsset;
                        }).map(j => {
                            let details = {};
                            try { details = JSON.parse(j.details || '{}'); } catch (e) { }
                            let photos = [];
                            try { photos = JSON.parse(j.photo_urls || '[]'); } catch (e) { }
                            return { ...j, details, photos };
                        });
                        allArchived = [...allArchived, ...filtered];
                    }
                }
                return new Response(JSON.stringify(allArchived), { headers: corsHeaders });
            }

            if (url.pathname === "/send-message" && method === "POST") {
                const { slug, senderId, receiverId, message, tempId } = await request.json();

                console.log(`[D1 Insert Başlıyor] Sender: ${senderId}, Receiver: ${receiverId}, Msg: ${message}`);

                const insertResult = await env.DB.prepare("INSERT INTO messages (company_slug, sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?, 0) RETURNING id, created_at")
                    .bind(slug || '', senderId != null ? String(senderId) : null, receiverId != null ? String(receiverId) : null, message || '').all();

                const insertRow = insertResult?.results?.[0];
                console.log(`[D1 Insert Bitti] Kayıt Olan Row:`, insertRow);

                let pusherResult = null;

                if (insertRow) {
                    pusherResult = await triggerPusher(`presence-chat-${slug}`, 'new-message', {
                        id: insertRow.id,
                        _tempId: tempId,
                        sender_id: senderId != null ? String(senderId) : null,
                        receiver_id: receiverId != null ? String(receiverId) : null,
                        message: message,
                        created_at: insertRow.created_at,
                        is_read: 0
                    });

                    ctx.waitUntil((async () => {
                        let senderName = 'Yeni Mesaj';
                        if (senderId === 'PATRON') {
                            const company = await safeFirst(env.DB.prepare("SELECT owner_name FROM companies WHERE slug = ?").bind(slug));
                            senderName = company?.owner_name || 'Firma Yöneticisi';
                        } else {
                            const staffUser = await safeFirst(env.DB.prepare("SELECT name FROM staff WHERE id = ?").bind(senderId));
                            if (staffUser) senderName = staffUser.name;
                        }

                        const targetInterest = receiverId === 'PATRON' ? `user-${slug}-PATRON` : `user-${slug}-${receiverId}`;

                        // 🚀 DÜZELTİLDİ: Başlık Firma Adı, Mesaj "Gönderen: İçerik" formatında
                        // "Yeni Mesaj" burada placeholder'dır, triggerBeams bunu Firma Adı ile ezecek.
                        await triggerBeams([targetInterest], "Yeni Mesaj", `${senderName}: ${message}`, `${APP_URL}/${slug}/manager`, slug);
                    })());
                }

                return new Response(JSON.stringify({
                    success: true,
                    data: insertRow,
                    debug: { pusherResult }
                }), { headers: corsHeaders });
            }

            if (url.pathname === "/read-messages" && method === "POST") {
                const { slug, readerId, senderId } = await request.json();
                await env.DB.prepare("UPDATE messages SET is_read = 1 WHERE company_slug = ? AND receiver_id = ? AND sender_id = ? AND is_read = 0")
                    .bind(slug || '', readerId != null ? String(readerId) : null, senderId != null ? String(senderId) : null).run();

                ctx.waitUntil(triggerPusher(`presence-chat-${slug}`, 'messages-read', { readerId: String(readerId), senderId: String(senderId) }));

                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/get-messages" && method === "GET") {
                const slug = url.searchParams.get("slug");
                const staffId = url.searchParams.get("staffId");
                const numId = (staffId && !isNaN(Number(staffId))) ? Number(staffId) : null;

                // 🚀 ÇÖZÜM: ORDER BY created_at DESC yapılarak EN SON mesajlar alınır, ardından reverse() ile kronolojik sıraya sokulur!
                const results = await safeAll(env.DB.prepare("SELECT id, company_slug, sender_id, receiver_id, message, created_at, is_read FROM messages WHERE company_slug = ? AND (sender_id = ? OR receiver_id = ? OR sender_id = ? OR receiver_id = ?) ORDER BY created_at DESC LIMIT 75")
                    .bind(slug || '', staffId || null, staffId || null, numId, numId));
                return new Response(JSON.stringify(results.reverse()), { headers: corsHeaders });
            }

            if (url.pathname === "/update-job" && method === "POST") {
                // İSTEĞİ TEK BİR KERE VE GÜVENLİ OKU, usedMaterials'i EKLE
                const requestBody = await request.json();
                const { slug, id, scheduledDate, staffId, taskNote, status, lastEditedBy, workType, photos, customerName, assetId, signatureName, signatureImage, usedMaterials, paymentStatus, paymentAmount } = requestBody;

                // 🚀 VERİTABANINDAN YENİ SÜTUNLARI DA ÇEKİYORUZ
                const currentJob = await safeFirst(env.DB.prepare("SELECT details, photo_urls, manager_id, manager_name, worker_id, worker_name, staff_id, payment_status FROM jobs WHERE id = ? AND company_slug = ?").bind(id, slug || ''));

                if (!currentJob) {
                    return new Response(JSON.stringify({ error: "İş bulunamadı" }), { status: 404, headers: corsHeaders });
                }

                let details = {};
                try { details = JSON.parse(currentJob.details || '{}'); } catch (e) { }

                let newManagerId = currentJob.manager_id;
                let newManagerName = currentJob.manager_name;
                let newWorkerId = currentJob.worker_id;
                let newWorkerName = currentJob.worker_name;

                // 🚀 HİYERARŞİ MOTORU: İşi alan personel değiştiyse (Devir/Atama işlemi varsa)
                const cleanStaffId = (staffId && staffId !== "") ? String(staffId) : null;
                if (cleanStaffId && cleanStaffId !== newWorkerId && cleanStaffId !== newManagerId) {
                    const newStaff = await safeFirst(env.DB.prepare("SELECT name, role FROM staff WHERE id = ?").bind(cleanStaffId));

                    if (newStaff) {
                        if (newStaff.role === 'Yönetici') {
                            // İş YENİ bir yöneticiye devredildiyse
                            newManagerId = cleanStaffId;
                            newManagerName = newStaff.name;
                            newWorkerId = null; // Usta sıfırlanır
                            newWorkerName = null;
                        } else if (newStaff.role === 'Usta') {
                            // İş bir USTAYA atanıyorsa
                            newWorkerId = cleanStaffId;
                            newWorkerName = newStaff.name;

                            // Atamayı yapan bizzat Yöneticiyse ve işin henüz yöneticisi yoksa, kendisini yazar.
                            if (userAuth && userAuth.role === 'Yönetici' && !newManagerId) {
                                newManagerId = String(userAuth.id);
                                newManagerName = userAuth.name;
                            }
                        }
                    }
                }

                // Kullanıcı kendi üzerinden "GÖREVİ KABUL ET" butonuna bastıysa ve kendisi Yöneticiyse
                if (userAuth && userAuth.role === 'Yönetici' && (status === 'Usta Bekliyor' || status === 'Devam Ediyor') && !newManagerId) {
                    newManagerId = String(userAuth.id);
                    newManagerName = userAuth.name;
                }

                let existingPhotos = [];
                try { existingPhotos = JSON.parse(currentJob.photo_urls || '[]'); } catch (e) { }

                const safeUsedMaterials = usedMaterials || [];

                if (taskNote !== undefined) details.note = taskNote;
                if (safeUsedMaterials.length > 0) details.usedMaterials = safeUsedMaterials;

                // 🚀 STOK DÜŞME İŞLEMİ (İşlem bittiğinde veya onaya gittiğinde malzemeleri stoktan düş)
                if ((status === 'Tamamlandı' || status === 'Onay Bekliyor') && safeUsedMaterials.length > 0) {
                    for (const mat of safeUsedMaterials) {
                        await env.DB.prepare("UPDATE stock SET quantity = quantity - ? WHERE id = ? AND company_slug = ?")
                            .bind(Number(mat.quantity), mat.id, slug).run();

                        // Kritik stok kontrolü yap ve uyarı gönder
                        const updatedStock = await safeFirst(env.DB.prepare("SELECT item_name, quantity, min_alert, unit_name FROM stock WHERE id = ? AND company_slug = ?").bind(mat.id, slug));
                        if (updatedStock && Number(updatedStock.quantity) <= Number(updatedStock.min_alert)) {
                            ctx.waitUntil(triggerBeams([`role-${slug}-ADMIN`], '⚠️ Kritik Stok Uyarısı', `${updatedStock.item_name} tükenmek üzere! (Kalan: ${updatedStock.quantity} ${updatedStock.unit_name})`, `${APP_URL}/${slug}/manager`, slug));
                        }
                    }
                }

                if (lastEditedBy) {
                    details.lastEditedBy = lastEditedBy;
                    details.lastEditedAt = new Date().toISOString();
                }

                if (photos && photos.length > 0 && env.BUCKET) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');

                    for (let i = 0; i < photos.length; i++) {
                        const base64Data = photos[i].split(',')[1];
                        const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                        const fileName = `fixlog/${slug}/photos/${year}/${month}/${day}/job-${id}/foto-${crypto.randomUUID()}.jpg`;

                        await env.BUCKET.put(fileName, bytes.buffer, {
                            httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' },
                            customMetadata: { 'status': 'hot', 'company': slug, 'jobId': String(id) }
                        });

                        existingPhotos.push(`https://pub-a78064a5e9304242b0982c01b5778197.r2.dev/${fileName}`);
                    }
                }

                // 🚀 İMZA YAKALAMA VE R2'YE KAYDETME (SOĞUK/SICAK VERİ MİMARİSİ)
                // İmzalar yukarıda çekildiği için tekrar request.json() YAPILMAYACAK!
                let finalSignatureUrl = currentJob.signature_url || null; // Eski imza varsa koru
                let finalSignatureName = currentJob.customer_signature_name || null;

                if (signatureImage && signatureImage.startsWith('data:image/') && env.BUCKET) {
                    try {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const day = String(now.getDate()).padStart(2, '0');

                        const base64Data = signatureImage.split(',')[1];
                        const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                        const fileName = `fixlog/${slug}/signatures/${year}/${month}/${day}/job-${id}/sign-${crypto.randomUUID()}.png`;

                        await env.BUCKET.put(fileName, bytes.buffer, {
                            httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' },
                            customMetadata: { 'status': 'hot', 'company': slug, 'jobId': String(id) }
                        });

                        finalSignatureUrl = `https://pub-a78064a5e9304242b0982c01b5778197.r2.dev/${fileName}`;
                        finalSignatureName = signatureName || 'Bilinmiyor';
                    } catch (err) {
                        console.error("İmza R2'ye yüklenirken hata:", err);
                    }
                }

                // 🚀 SQL GÜNCELLEMESİ - Yeni sütunlara da yazıyoruz.
                let query = `UPDATE jobs SET details = ?, photo_urls = ?, manager_id = ?, manager_name = ?, worker_id = ?, worker_name = ?, customer_signature_name = ?, signature_url = ?`;
                const params = [JSON.stringify(details), JSON.stringify(existingPhotos), newManagerId, newManagerName, newWorkerId, newWorkerName, finalSignatureName, finalSignatureUrl];

                // Artık staff_id'yi de worker_id veya manager_id'ye göre dolduruyoruz (geriye dönük uyumluluk için)
                const finalStaffId = newWorkerId || newManagerId || currentJob.staff_id || null;
                query += `, staff_id = ?`;
                params.push(finalStaffId);

                if (scheduledDate) { query += ", scheduled_date = ?"; params.push(scheduledDate); }
                if (status) { query += ", status = ?"; params.push(status); }
                if (workType) { query += ", work_type = ?"; params.push(workType); }
                if (customerName) { query += ", customer_name = ?"; params.push(customerName); }
                if (assetId !== undefined) { query += ", asset_id = ?"; params.push(assetId === '' ? null : assetId); }
                if (paymentStatus !== undefined) { query += ", payment_status = ?"; params.push(paymentStatus); }
                if (paymentAmount !== undefined) { query += ", payment_amount = ?"; params.push(paymentAmount === '' ? 0 : Number(paymentAmount)); }

                query += ` WHERE id = ? AND company_slug = ?`;
                params.push(id, slug || '');

                await env.DB.prepare(query).bind(...params).run();

                if (paymentStatus === 'Tahsil Edildi' && currentJob.payment_status !== 'Tahsil Edildi') {
                    const finalAmount = paymentAmount ? Number(paymentAmount) : 0;
                    if (finalAmount > 0) {
                        const approver = lastEditedBy || 'Yönetici';
                        await env.DB.prepare("INSERT INTO finances (company_slug, description, amount, type, added_by, job_id) VALUES (?, ?, ?, 'Gelir', ?, ?)")
                            .bind(slug || '', `İş Tahsilatı (Düzenleme): ${customerName || 'Müşteri'} (İş No: #${id})`, finalAmount, approver, id).run();
                    }
                }

                if (status === 'Devam Ediyor' || status === 'Tamamlandı' || status === 'İptal') {
                    const currentUserId = userAuth ? String(userAuth.id) : null;
                    const targetStaffId = finalStaffId ? String(finalStaffId) : null;

                    if (currentUserId === targetStaffId) {
                        ctx.waitUntil(triggerBeams([`role-${slug}-ADMIN`], '🔄 İş Durumu Değişti', `Saha personeli iş (#${id}) durumunu "${status}" olarak güncelledi.`, `${APP_URL}/${slug}/manager`, slug));
                    } else {
                        if (targetStaffId) {
                            ctx.waitUntil(triggerBeams([`user-${slug}-${targetStaffId}`], '🔄 İşiniz Güncellendi', `Merkez, üzerinizdeki işin durumunu "${status}" yaptı.`, `${APP_URL}/${slug}/dashboard`, slug));
                        }
                    }
                }

                ctx.waitUntil(triggerPusher(`company-${slug}`, 'data_updated', {}));
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // 🚀 YENİ: USTA MALZEME TALEP SİSTEMİ
            if (url.pathname === "/request-material" && method === "POST") {
                const { slug, staffId, items, note } = await request.json();

                let staffName = 'Personel';
                const staff = await safeFirst(env.DB.prepare("SELECT name FROM staff WHERE id = ? AND company_slug = ?").bind(staffId, slug));
                if (staff) staffName = staff.name;

                // 🚀 ÇÖZÜM: Veritabanına INSERT etmeyi atlamıştık, eklendi!
                try {
                    const reqId = crypto.randomUUID();
                    const now = new Date().toISOString();
                    await env.DB.prepare("INSERT INTO material_requests (id, company_slug, staff_id, items, note, status, created_at) VALUES (?, ?, ?, ?, ?, 'Bekliyor', ?)")
                        .bind(reqId, slug, staffId, JSON.stringify(items), note || '', now).run();
                } catch (e) {
                    return new Response(JSON.stringify({ error: "Malzeme DB Hatası: " + e.message }), { status: 500, headers: corsHeaders });
                }

                const itemsText = items.map(item => `- ${item.name}: ${item.qty} ${item.unit}`).join('\n');
                const finalMessage = `📦 YENİ MALZEME TALEBİ\n\nTalep Eden: ${staffName}\n\nİstenen Malzemeler:\n${itemsText}\n\nNot: ${note || 'Not girilmemiş.'}`;

                ctx.waitUntil(triggerBeams([`role-${slug}-ADMIN`], '📦 Yeni Malzeme Talebi!', finalMessage, `${APP_URL}/${slug}/manager`, slug));

                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // 🚀 YENİ: USTA SOS / ACİL DURUM BİLDİRİMİ
            if (url.pathname === "/send-sos" && method === "POST") {
                const { slug, staffId, type, message, location } = await request.json();

                const id = crypto.randomUUID();
                const locString = location ? JSON.stringify(location) : null;
                const now = new Date().toISOString();

                // 🚀 ÇÖZÜM: Hataları yutan try-catch düzeltildi, SQL yapısı güçlendirildi.
                try {
                    // Önce UUID ile yazmayı deneriz. Tablo id'si TEXT/UUID ise çalışır.
                    await env.DB.prepare("INSERT INTO staff_sos (id, company_slug, staff_id, type, message, location, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Aktif', ?)")
                        .bind(id, slug, staffId, type, message || '', locString, now).run();
                } catch (e) {
                    // Eğer tablo ID'si Integer Autoincrement olarak açıldıysa üstteki patlar, bu çalışır.
                    try {
                        await env.DB.prepare("INSERT INTO staff_sos (company_slug, staff_id, type, message, location, status, created_at) VALUES (?, ?, ?, ?, ?, 'Aktif', ?)")
                            .bind(slug, staffId, type, message || '', locString, now).run();
                    } catch (e2) {
                        return new Response(JSON.stringify({ error: "SOS DB Hatası: " + e2.message }), { status: 500, headers: corsHeaders });
                    }
                }

                let staffName = 'Personel';
                const staff = await safeFirst(env.DB.prepare("SELECT name FROM staff WHERE id = ? AND company_slug = ?").bind(staffId, slug));
                if (staff) staffName = staff.name;

                const locText = location ? `📍 Konum: http://googleusercontent.com/maps.google.com/maps?q=${location.lat},${location.lng}` : '📍 Konum alınamadı.';
                const finalMessage = `🚨 PERSONEL ACİL DURUMU\n\n👤 Kim: ${staffName}\n⚠️ Neden: ${type}${message ? ` - ${message}` : ''}\n\n${locText}`;

                ctx.waitUntil(triggerBeams([`role-${slug}-ADMIN`], '🚨 ACİL! PERSONEL SOS', finalMessage, `${APP_URL}/${slug}/manager`, slug));

                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/public/get-asset" && method === "GET") {
                const uuid = url.searchParams.get("uuid");
                const asset = await safeFirst(env.DB.prepare("SELECT * FROM assets WHERE uuid = ?").bind(uuid));

                if (!asset) return new Response(JSON.stringify({ error: "Varlık bulunamadı" }), { status: 404, headers: corsHeaders });

                const company = await safeFirst(env.DB.prepare("SELECT company_name, emergency_phone, whatsapp_phone, landline_phone, website, logo FROM companies WHERE slug = ?").bind(asset.company_slug));

                // 🚀 BUG FIX: Hem "Devam Ediyor" (bakım durumunu anlamak için) hem de "Tamamlandı" (geçmişi listelemek için) işleri çekiyoruz.
                // Ayrıca usta adını çekmek için staff tablosuna LEFT JOIN atıyoruz ve details'i dahil ediyoruz.
                const jobsQuery = `
            SELECT j.id, j.work_type, j.status, j.scheduled_date, j.created_at, j.details, s.name as staff_name 
            FROM jobs j
            LEFT JOIN staff s ON j.staff_id = s.id
            WHERE j.asset_id = ? AND j.status IN ('Devam Ediyor', 'Tamamlandı') 
            ORDER BY j.created_at DESC 
            LIMIT 15
        `;
                const jobs = await safeAll(env.DB.prepare(jobsQuery).bind(asset.id));

                const responseData = {
                    ...asset,
                    company_name: company?.company_name || 'Firma Bilgisi Yok',
                    emergency_phone: company?.emergency_phone || '',
                    whatsapp_phone: company?.whatsapp_phone || '',
                    landline_phone: company?.landline_phone || '',
                    website: company?.website || '',
                    logo: company?.logo || '',
                    jobs: jobs || []
                };

                return new Response(JSON.stringify(responseData), { headers: corsHeaders });
            }

            if (url.pathname === "/public/trigger-emergency" && method === "POST") {
                const { uuid, company_slug } = await request.json();
                if (!uuid || !company_slug) return new Response("Bad Request", { status: 400, headers: corsHeaders });

                const id = crypto.randomUUID();
                await env.DB.prepare("INSERT INTO emergencies (id, asset_id, company_slug, status) VALUES (?, ?, ?, 'Aktif')").bind(id, uuid, company_slug).run();

                const asset = await safeFirst(env.DB.prepare("SELECT name, location, apartmentName FROM assets WHERE uuid = ?").bind(uuid));
                const aptName = asset && asset.apartmentName ? asset.apartmentName : 'Bina Belirtilmemiş';
                const assetType = asset && asset.name ? asset.name : 'Cihaz Türü Belirtilmemiş';
                const assetLoc = asset && asset.location ? asset.location : 'Konum Belirtilmemiş';

                ctx.waitUntil(triggerBeams(
                    [`role-${company_slug}-ADMIN`],
                    `🚨 KABİN İÇİ ACİL DURUM`,
                    `🏢 Bina: ${aptName}\n🛗 Cihaz: ${assetType}\n📍 Konum: ${assetLoc}\n⚠️ Bu adresten acil yardım çağrısı alındı!`,
                    `${APP_URL}/${company_slug}/manager?tab=emergencies`,
                    company_slug
                ));

                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/public/report-fault" && method === "POST") {
                const { uuid, company_slug, name, phone, description } = await request.json();
                if (!uuid || !company_slug) return new Response("Bad Request", { status: 400, headers: corsHeaders });

                const id = crypto.randomUUID();
                await env.DB.prepare("INSERT INTO fault_reports (id, asset_id, company_slug, reporter_name, reporter_phone, description, status) VALUES (?, ?, ?, ?, ?, ?, 'Aktif')")
                    .bind(id, uuid, company_slug, name || '', phone || '', description || '').run();

                const asset = await safeFirst(env.DB.prepare("SELECT id, name, location, apartmentName FROM assets WHERE uuid = ?").bind(uuid));
                const aptName = asset && asset.apartmentName ? asset.apartmentName : 'Bina Belirtilmemiş';
                const assetType = asset && asset.name ? asset.name : 'Cihaz Türü Belirtilmemiş';
                const assetLoc = asset && asset.location ? asset.location : 'Konum Belirtilmemiş';
                const reporterInfo = `${name || 'İsimsiz'} ${phone ? `(${phone})` : ''}`;

                // 🚀 YENİ OTOMATİK İŞ ATAMA (FAULT ROUTING) MOTORU 🚀
                try {
                    // 1. "Arıza" branşındaki ustaları bul ve en az işi olanı / rastgele birini seç
                    const availableUstas = await safeAll(env.DB.prepare("SELECT id, name FROM staff WHERE company_slug = ? AND role = 'Usta' AND branch LIKE '%Arıza%'").bind(company_slug));
                    let assignedWorkerId = null;
                    let assignedWorkerName = null;

                    if (availableUstas && availableUstas.length > 0) {
                        // Basit yük dengeleme: Rastgele (veya ilk) Arıza ustasını seç
                        const selectedUsta = availableUstas[Math.floor(Math.random() * availableUstas.length)];
                        assignedWorkerId = selectedUsta.id;
                        assignedWorkerName = selectedUsta.name;
                    }

                    // 2. En çok arıza kaydı çözen Yöneticiyi bul (Sistemde en aktif yönetici)
                    // Hızlı çözüm için rastgele/ilk yöneticiyi alıyoruz ancak id'ye göre sıralanabilir
                    const managers = await safeAll(env.DB.prepare("SELECT id, name FROM staff WHERE company_slug = ? AND role IN ('Yönetici')").bind(company_slug));
                    let assignedManagerId = null;
                    let assignedManagerName = null;

                    if (managers && managers.length > 0) {
                        const selectedManager = managers[0]; // Şimdilik ilk yönetici
                        assignedManagerId = selectedManager.id;
                        assignedManagerName = selectedManager.name;
                    }

                    if (asset && asset.id) {
                        const jobId = crypto.randomUUID();
                        const today = new Date().toISOString().split('T')[0];

                        await env.DB.prepare(`
                            INSERT INTO jobs (id, company_slug, customer_name, work_type, job_type, asset_id, status, scheduled_date, manager_id, manager_name, worker_id, worker_name, staff_id, creator_name, creator_role, details)
                            VALUES (?, ?, ?, 'Arıza Kaydı', 'Arıza', ?, 'Beklemede', ?, ?, ?, ?, ?, ?, 'Otonom Sistem', 'Sistem', ?)
                        `).bind(
                            jobId, company_slug, reporterInfo, 'Arıza Kaydı', 'Arıza', asset.id, 'Beklemede', today,
                            assignedManagerId ? String(assignedManagerId) : null, assignedManagerName,
                            assignedWorkerId ? String(assignedWorkerId) : null, assignedWorkerName,
                            assignedWorkerId ? String(assignedWorkerId) : (assignedManagerId ? String(assignedManagerId) : null),
                            JSON.stringify({ note: `Müşteri Notu: ${description}` })
                        ).run();

                        // Ustaya özel bildirim gönder
                        if (assignedWorkerId) {
                            ctx.waitUntil(triggerBeams(
                                [`user-${company_slug}-${assignedWorkerId}`],
                                `🚨 YENİ ARIZA GÖREVİ`,
                                `Bina: ${aptName}\nBildiren: ${reporterInfo}\nOtomatik olarak size atandı!`,
                                `${APP_URL}/${company_slug}/dashboard`,
                                company_slug
                            ));
                        }
                    }
                } catch (err) {
                    console.error("Otomatik iş atama motoru hatası:", err);
                }

                ctx.waitUntil(triggerBeams(
                    [`role-${company_slug}-ADMIN`],
                    `🛠️ ARIZA OTO-ATANDI`,
                    `🏢 Bina: ${aptName}\n🛗 Cihaz: ${assetType}\n📍 Konum: ${assetLoc}\n👤 Bildiren: ${reporterInfo}\n📝 Not: ${description}`,
                    `${APP_URL}/${company_slug}/manager?tab=faults`,
                    company_slug
                ));

                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/resolve-emergency" && method === "POST") {
                const { id, slug } = await request.json();
                await env.DB.prepare("UPDATE emergencies SET status = 'Çözüldü' WHERE id = ? AND company_slug = ?")
                    .bind(id, slug).run();
                ctx.waitUntil(triggerPusher(`company-${slug}`, 'data_updated', {}));
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (url.pathname === "/resolve-fault" && method === "POST") {
                const { id, slug } = await request.json();
                await env.DB.prepare("UPDATE fault_reports SET status = 'Çözüldü' WHERE id = ? AND company_slug = ?")
                    .bind(id, slug).run();
                ctx.waitUntil(triggerPusher(`company-${slug}`, 'data_updated', {}));
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // 🚀 YENİ: PERSONEL SOS KAPATMA
            if (url.pathname === "/resolve-sos" && method === "POST") {
                const { id, slug } = await request.json();
                await env.DB.prepare("UPDATE staff_sos SET status = 'Çözüldü' WHERE id = ? AND company_slug = ?").bind(id, slug).run();
                ctx.waitUntil(triggerPusher(`company-${slug}`, 'data_updated', {}));
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // 🚀 YENİ: MALZEME TALEBİ ONAYLAMA/KAPATMA VE STOKTAN DÜŞME
            if (url.pathname === "/resolve-material" && method === "POST") {
                const { id, slug } = await request.json();

                // Talebi bul
                const reqData = await safeFirst(env.DB.prepare("SELECT items FROM material_requests WHERE id = ? AND company_slug = ? AND status = 'Bekliyor'").bind(id, slug));

                if (reqData && reqData.items) {
                    try {
                        const items = JSON.parse(reqData.items);
                        // Stoktan düşme işlemini yap
                        for (const item of items) {
                            if (item.id && item.qty) {
                                await env.DB.prepare("UPDATE stock SET quantity = quantity - ? WHERE id = ? AND company_slug = ?")
                                    .bind(Number(item.qty), item.id, slug).run();
                            }
                        }
                    } catch (e) {
                        console.error("Malzeme düşme hatası: ", e);
                    }
                }

                await env.DB.prepare("UPDATE material_requests SET status = 'Onaylandı' WHERE id = ? AND company_slug = ?").bind(id, slug).run();
                ctx.waitUntil(triggerPusher(`company-${slug}`, 'data_updated', {}));
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // 🚀 MASTERBOSS ENDPOINTS

            const verifyMasterboss = async (req) => {
                const authHeader = req.headers.get('Authorization');
                if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
                const token = authHeader.split(' ')[1].replace(/^"|"$/g, '').trim();

                try {
                    const parts = token.split('.');
                    if (parts.length !== 3) return false;
                    const [headerB64, payloadB64, signatureB64] = parts;
                    const payloadStr = fromBase64Url(payloadB64);
                    const payload = JSON.parse(payloadStr);

                    if (Date.now() > payload.exp) return false;
                    if (payload.role !== "Masterboss") return false;

                    const secret = env.JWT_SECRET; if(!secret) return false;
                    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
                    const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${headerB64}.${payloadB64}`));

                    let binarySig = '';
                    const sigBytes = new Uint8Array(signatureBuffer);
                    for (let i = 0; i < sigBytes.byteLength; i++) { binarySig += String.fromCharCode(sigBytes[i]); }
                    const expectedSignature = btoa(binarySig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

                    return signatureB64 === expectedSignature;
                } catch (e) {
                    return false;
                }
            };

            if (url.pathname === "/masterboss-data" && method === "GET") {
                if (!await verifyMasterboss(request)) return new Response(JSON.stringify({ error: "Yetkisiz işlem!" }), { status: 403, headers: corsHeaders });

                // Global fiyatları çek
                const sysSettings = await safeAll(env.DB.prepare("SELECT * FROM system_settings"));
                let globalPricing = { base: 3000, asset: 50 };
                sysSettings.forEach(s => {
                    if (s.key === 'global_base_price') globalPricing.base = Number(s.value);
                    if (s.key === 'global_asset_price') globalPricing.asset = Number(s.value);
                });

                // 1. İSİM DÜZELTMESİ: staff_count -> total_staff, asset_count -> total_assets (Frontend böyle bekliyor)
                const companies = await safeAll(env.DB.prepare("SELECT c.*, (SELECT COUNT(*) FROM staff WHERE company_slug = c.slug) as total_staff, (SELECT COUNT(*) FROM jobs WHERE company_slug = c.slug) as job_count, (SELECT COUNT(*) FROM assets WHERE company_slug = c.slug) as total_assets FROM companies c ORDER BY c.created_at DESC"));

                const companyRewards = await safeAll(env.DB.prepare("SELECT * FROM company_rewards"));
                const rewardsMap = {};
                companyRewards.forEach(r => {
                    rewardsMap[r.company_slug] = {
                        balance: r.free_months_balance,
                        is_gift: r.has_masterboss_gift
                    };
                });

                const companiesWithRewards = companies.map(c => ({
                    ...c,
                    free_months_balance: c.free_months_balance || 0,
                    has_masterboss_gift: c.has_masterboss_gift || 0
                }));

                const globalStats = await safeFirst(env.DB.prepare(`
                    SELECT 
                        (SELECT COUNT(*) FROM jobs) as total_jobs,
                        (SELECT COUNT(*) FROM jobs WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) as monthly_jobs,
                        (SELECT COUNT(*) FROM jobs WHERE strftime('%Y', created_at) = strftime('%Y', 'now')) as yearly_jobs
                `));

                const allJobsWithPhotos = await safeAll(env.DB.prepare("SELECT created_at, photo_urls FROM jobs WHERE photo_urls IS NOT NULL AND photo_urls != '[]' AND photo_urls != ''"));
                let total_photos = 0;
                let monthly_photos = 0;
                let yearly_photos = 0;
                const currentMonthStr = new Date().toISOString().slice(0, 7);
                const currentYearStr = new Date().toISOString().slice(0, 4);

                if (allJobsWithPhotos && allJobsWithPhotos.length > 0) {
                    allJobsWithPhotos.forEach(job => {
                        try {
                            const photos = JSON.parse(job.photo_urls || '[]');
                            const count = photos.length;
                            total_photos += count;
                            if (job.created_at && job.created_at.startsWith(currentMonthStr)) {
                                monthly_photos += count;
                            }
                            if (job.created_at && job.created_at.startsWith(currentYearStr)) {
                                yearly_photos += count;
                            }
                        } catch (e) { }
                    });
                }

                const platformStats = {
                    totalCompanies: companies.length,
                    activeCompanies: companies.filter(c => c.subscription_status === 'active').length,
                    trialCompanies: companies.filter(c => c.subscription_status === 'trialing').length,
                    totalPlatformRevenue: 0,
                    monthlyJobs: globalStats?.monthly_jobs || 0,
                    yearlyJobs: globalStats?.yearly_jobs || 0,
                    totalJobs: globalStats?.total_jobs || 0,
                    monthlyPhotos: monthly_photos,
                    yearlyPhotos: yearly_photos,
                    totalPhotos: total_photos
                };

                const supportTickets = await safeAll(env.DB.prepare(`
                    SELECT s.*, c.company_name, c.phone as company_phone 
                    FROM support_tickets s 
                    LEFT JOIN companies c ON s.company_slug = c.slug 
                    ORDER BY s.created_at DESC
                `));

                // Otomatik olarak kaydedilen referans ilişkilerini `companies` tablosundan çek (Sistem Kendi Algılar)
                let autoReferrals = [];
                try {
                    autoReferrals = await safeAll(env.DB.prepare(`
                        SELECT 
                            c1.slug as referred_company_slug, 
                            c2.slug as referrer_company_slug, 
                            c1.referral_rewarded as is_verified,
                            c1.id as id
                        FROM companies c1
                        JOIN companies c2 ON c1.referred_by_id = c2.id
                        WHERE c1.referred_by_id IS NOT NULL
                        ORDER BY c1.created_at DESC
                    `));
                } catch (e) { }

                // 2. EN KRİTİK DÜZELTME: success: true eklendi ve objelerin isimleri frontend'in beklediği şekle getirildi.
                return new Response(JSON.stringify({
                    success: true,
                    globalPricing: globalPricing,
                    companies: companiesWithRewards,
                    stats: platformStats,
                    tickets: supportTickets,
                    referrals: autoReferrals,
                    rewards: companyRewards
                }), { headers: corsHeaders });
            }

            if (url.pathname === "/masterboss-resolve-ticket" && method === "POST") {
                if (!await verifyMasterboss(request)) return new Response(JSON.stringify({ error: "Yetkisiz işlem!" }), { status: 403, headers: corsHeaders });

                const { ticketId, companySlug, replyMessage, action } = await request.json();

                // Önce mevcut ticket verisini al ki `replies` geçmişini kaybetmeyelim
                const ticket = await safeFirst(env.DB.prepare("SELECT replies FROM support_tickets WHERE id = ?").bind(ticketId));
                let repliesArray = [];
                if (ticket) {
                    try { repliesArray = JSON.parse(ticket.replies || '[]'); } catch (e) { repliesArray = []; }
                }

                // Eğer bir mesaj yazılmışsa (çözüldü derken bile yazılabilir) diziye ekle
                if (replyMessage && replyMessage.trim() !== '') {
                    repliesArray.push({
                        sender: 'masterboss',
                        message: replyMessage,
                        date: new Date().toISOString()
                    });
                }

                const finalRepliesJSON = JSON.stringify(repliesArray);

                // 1. Gelen eyleme (action) göre statüyü koru veya Çözüldü yap
                if (action === 'reply') {
                    await env.DB.prepare("UPDATE support_tickets SET replies = ? WHERE id = ?")
                        .bind(finalRepliesJSON, ticketId).run();
                } else {
                    await env.DB.prepare("UPDATE support_tickets SET status = 'Çözüldü', replies = ? WHERE id = ?")
                        .bind(finalRepliesJSON, ticketId).run();
                }

                if (companySlug) {
                    const titleText = action === 'reply' ? '📞 Destek Talebiniz Yanıtlandı' : '✅ Destek Talebiniz Çözüldü';
                    const bodyText = action === 'reply' ? `Ekibimizden yeni bir mesaj var: ${replyMessage}` : 'Talebiniz başarıyla çözüme kavuşturuldu.';

                    // Sadece yanıt (reply) aksiyonu seçilmişse ve mesaj yoksa bildirim atma, ama çözüldü ise mutlaka at!
                    if (action === 'resolve' || (action === 'reply' && replyMessage)) {
                        ctx.waitUntil(triggerBeams(
                            [`role-${companySlug}-ADMIN`],
                            titleText,
                            bodyText,
                            `${APP_URL}/${companySlug}/manager`,
                            companySlug
                        ));
                    }
                }

                return new Response(JSON.stringify({ success: true, updatedReplies: finalRepliesJSON }), { headers: corsHeaders });
            }

            // 🚀 YENİ: MASTERBOSS DETAYLI FİRMA BİLGİSİ (İstatistikler, Kasa, Stok)
            if (url.pathname === "/masterboss-company-details" && method === "GET") {
                if (!await verifyMasterboss(request)) return new Response(JSON.stringify({ error: "Yetkisiz işlem!" }), { status: 403, headers: corsHeaders });

                const targetSlug = url.searchParams.get("slug");
                if (!targetSlug) return new Response(JSON.stringify({ error: "Slug gerekli!" }), { status: 400, headers: corsHeaders });

                const [
                    staffCount, assetCount, stockCount,
                    totalJobs, monthlyJobs, yearlyJobs,
                    income, expense,
                    customerCount, supplierCount,
                    totalEmergencies, activeEmergencies,
                    totalFaults, activeFaults,
                    jobsWithPhotos
                ] = await Promise.all([
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM staff WHERE company_slug = ?").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM assets WHERE company_slug = ?").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM stock WHERE company_slug = ?").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM jobs WHERE company_slug = ?").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM jobs WHERE company_slug = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM jobs WHERE company_slug = ? AND strftime('%Y', created_at) = strftime('%Y', 'now')").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT SUM(amount) as total FROM finances WHERE company_slug = ? AND type = 'Gelir'").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT SUM(amount) as total FROM finances WHERE company_slug = ? AND type = 'Gider'").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM customers WHERE company_slug = ?").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM suppliers WHERE company_slug = ?").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM emergencies WHERE company_slug = ?").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM emergencies WHERE company_slug = ? AND status = 'Aktif'").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM fault_reports WHERE company_slug = ?").bind(targetSlug)),
                    safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM fault_reports WHERE company_slug = ? AND status = 'Aktif'").bind(targetSlug)),
                    safeAll(env.DB.prepare("SELECT created_at, photo_urls FROM jobs WHERE company_slug = ? AND photo_urls IS NOT NULL AND photo_urls != '[]' AND photo_urls != ''").bind(targetSlug))
                ]);

                let totalPhotos = 0;
                let monthlyPhotos = 0;
                const currentMonthStr = new Date().toISOString().slice(0, 7);

                if (jobsWithPhotos && jobsWithPhotos.length > 0) {
                    jobsWithPhotos.forEach(job => {
                        try {
                            const photos = JSON.parse(job.photo_urls || '[]');
                            const count = photos.length;
                            totalPhotos += count;
                            if (job.created_at && job.created_at.startsWith(currentMonthStr)) {
                                monthlyPhotos += count;
                            }
                        } catch (e) { }
                    });
                }

                return new Response(JSON.stringify({
                    success: true,
                    stats: {
                        staff: staffCount?.total || 0,
                        assets: assetCount?.total || 0,
                        stock: stockCount?.total || 0,
                        customers: customerCount?.total || 0,
                        suppliers: supplierCount?.total || 0,
                        jobs: {
                            total: totalJobs?.total || 0,
                            monthly: monthlyJobs?.total || 0,
                            yearly: yearlyJobs?.total || 0
                        },
                        emergencies: {
                            total: totalEmergencies?.total || 0,
                            active: activeEmergencies?.total || 0
                        },
                        faults: {
                            total: totalFaults?.total || 0,
                            active: activeFaults?.total || 0
                        },
                        photos: {
                            total: totalPhotos,
                            monthly: monthlyPhotos
                        },
                        finances: {
                            income: income?.total || 0,
                            expense: expense?.total || 0,
                            net: (income?.total || 0) - (expense?.total || 0)
                        }
                    }
                }), { headers: corsHeaders });
            }

            if (url.pathname === '/masterboss-update-subscription' && request.method === 'POST') {
                if (!await verifyMasterboss(request)) return new Response(JSON.stringify({ error: "Yetkisiz işlem!" }), { status: 403, headers: corsHeaders });

                try {
                    const body = await request.json();
                    const { companySlug, subscriptionStatus, freeMonths, customDiscount, customAssetPrice, cancelTrial, hasMasterbossGift } = body;

                    if (!companySlug) {
                        return new Response(JSON.stringify({ success: false, error: 'Firma slug eksik.' }), { headers: corsHeaders });
                    }

                    // Önce firmayı bulalım (Güvenli sorgu)
                    const company = await safeFirst(env.DB.prepare("SELECT * FROM companies WHERE slug = ?").bind(companySlug));
                    if (!company) {
                        return new Response(JSON.stringify({ success: false, error: 'Firma bulunamadı.' }), { headers: corsHeaders });
                    }

                    // Verileri güncelle
                    const updates = [];
                    const params = [];

                    if (cancelTrial) {
                        updates.push("trial_ends_at = NULL");
                        updates.push("subscription_status = 'past_due'"); // 🚀 YENİ: Deneme iptali doğrudan paywall'a düşürür
                    } else if (subscriptionStatus) {
                        updates.push("subscription_status = ?");
                        params.push(subscriptionStatus);
                    }

                    // 🚀 YENİ: customDiscount null gelse bile parametreye ekliyoruz ki fiyat sıfırlanabilsin.
                    if (customDiscount !== undefined) {
                        updates.push("custom_base_price = ?");
                        params.push(customDiscount);
                    }
                    if (customAssetPrice !== undefined) {
                        updates.push("custom_per_asset_price = ?");
                        params.push(customAssetPrice);
                    }

                    if (updates.length > 0) {
                        const query = `UPDATE companies SET ${updates.join(', ')} WHERE slug = ?`;
                        params.push(companySlug);
                        await env.DB.prepare(query).bind(...params).run();
                    }

                    // 🚀 OTOMATİK REFERANS ÖDÜL SİSTEMİ (İlk Aktifleşmede Tetiklenir)
                    if (subscriptionStatus === 'active') {
                        const checkRef = await safeFirst(env.DB.prepare("SELECT id, referred_by_id, referral_rewarded FROM companies WHERE slug = ?").bind(companySlug));
                        if (checkRef && checkRef.referred_by_id && checkRef.referral_rewarded === 0) {
                            const referrer = await safeFirst(env.DB.prepare("SELECT slug FROM companies WHERE id = ?").bind(checkRef.referred_by_id));
                            if (referrer) {
                                const addReward = async (targetSlug) => {
                                    await env.DB.prepare("UPDATE companies SET free_months_balance = COALESCE(free_months_balance, 0) + 1 WHERE slug = ?").bind(targetSlug).run();
                                };
                                await addReward(companySlug);
                                await addReward(referrer.slug);
                                await env.DB.prepare("UPDATE companies SET referral_rewarded = 1 WHERE slug = ?").bind(companySlug).run();
                            }
                        }
                    }

                    // 🚀 MUAFİYET (MASTERBOSS HEDİYESİ) VE REFERANS SİSTEMİ (HATA ÇÖZÜMÜ)
                    // Artık company_rewards tablosuna yazmaya ÇALIŞMIYORUZ. Direkt companies tablosunu güncelliyoruz!
                    if (hasMasterbossGift !== undefined || freeMonths !== undefined) {

                        const finalGiftStatus = hasMasterbossGift === true ? 1 : 0;
                        const finalFreeMonths = Number(freeMonths || 0);

                        await env.DB.prepare("UPDATE companies SET free_months_balance = ?, has_masterboss_gift = ? WHERE slug = ?")
                            .bind(finalFreeMonths, finalGiftStatus, companySlug).run();
                    }

                    return new Response(JSON.stringify({ success: true, message: 'Firma abonelik detayları güncellendi.' }), { headers: corsHeaders });

                } catch (err) {
                    console.error("Abonelik Güncelleme Hatası:", err);
                    return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders });
                }
            }

            // 🚀 YENİ: GLOABAL SİSTEM FİYATLANDIRMASI GÜNCELLEME (TEK TUŞLA ZAM MOTORU)
            if (url.pathname === '/masterboss-update-global-pricing' && request.method === 'POST') {
                if (!await verifyMasterboss(request)) return new Response(JSON.stringify({ error: "Yetkisiz işlem!" }), { status: 403, headers: corsHeaders });
                try {
                    const { basePrice, assetPrice } = await request.json();
                    if (basePrice !== undefined) {
                        await env.DB.prepare("UPDATE system_settings SET value = ? WHERE key = 'global_base_price'").bind(String(basePrice)).run();
                    }
                    if (assetPrice !== undefined) {
                        await env.DB.prepare("UPDATE system_settings SET value = ? WHERE key = 'global_asset_price'").bind(String(assetPrice)).run();
                    }
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (err) {
                    return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders });
                }
            }

            return new Response("Not Found", { status: 404, headers: corsHeaders });
        } catch (e) {
            console.error(e);
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
        }
    },

    // 🚀 AŞAMA 3: GÜNCELLENMİŞ VE GELİŞTİRİLMİŞ CRON TRIGGER (SOĞUK VERİ MİMARİSİ)
    async scheduled(event, env, ctx) {
        try {
            console.log("Cron Job Global Arşivleme ve Abonelik Kontrolü başlatıldı.");
            const now = new Date();

            // 🚀 ABONELİK VE DENEME SÜRESİ KONTROLÜ (1 GÜN TOLERANS VE PAYWALL TETİKLEYİCİ)
            const lockCutoff = new Date(now);
            lockCutoff.setDate(lockCutoff.getDate() - 1); // 1 gün tolerans süresi ("Bugün son gün" için)

            await env.DB.prepare(`
                UPDATE companies 
                SET subscription_status = 'past_due' 
                WHERE (subscription_status = 'trialing' AND trial_ends_at < ?)
                   OR (subscription_status = 'active' AND billing_cycle_anchor < ? AND slug NOT IN (SELECT company_slug FROM company_rewards WHERE free_months_balance > 0))
            `).bind(lockCutoff.toISOString(), lockCutoff.toISOString()).run();

            const msgCutoff = new Date(now); msgCutoff.setDate(msgCutoff.getDate() - 3);
            const jobCutoff = new Date(now); jobCutoff.setDate(jobCutoff.getDate() - 60);
            const emgCutoff = new Date(now); emgCutoff.setDate(emgCutoff.getDate() - 30);

            // LIMIT 200 sayesinde V8 CPU Timeout yemeyiz. Cron her çalıştığında azar azar temizler.
            const oldMessages = await env.DB.prepare("SELECT * FROM messages WHERE created_at < ? LIMIT 200").bind(msgCutoff.toISOString()).all();
            if (oldMessages.results.length > 0) {
                const ids = oldMessages.results.map(m => m.id).join(',');
                await env.BUCKET.put(`global-archives/messages/${Date.now()}.json`, JSON.stringify(oldMessages.results));
                await env.DB.prepare(`DELETE FROM messages WHERE id IN (${ids})`).run();
            }

            const oldJobs = await env.DB.prepare("SELECT * FROM jobs WHERE status IN ('Tamamlandı', 'İptal') AND created_at < ? LIMIT 100").bind(jobCutoff.toISOString()).all();
            if (oldJobs.results.length > 0) {
                const ids = oldJobs.results.map(j => j.id).join(',');
                await env.BUCKET.put(`global-archives/jobs/${Date.now()}.json`, JSON.stringify(oldJobs.results));
                await env.DB.prepare(`DELETE FROM jobs WHERE id IN (${ids})`).run();
            }

            const oldEmergencies = await env.DB.prepare("SELECT * FROM emergencies WHERE status != 'Aktif' AND created_at < ? LIMIT 100").bind(emgCutoff.toISOString()).all();
            if (oldEmergencies.results.length > 0) {
                const ids = oldEmergencies.results.map(e => e.id).join(',');
                await env.BUCKET.put(`global-archives/emergencies/${Date.now()}.json`, JSON.stringify(oldEmergencies.results));
                await env.DB.prepare(`DELETE FROM emergencies WHERE id IN (${ids})`).run();
            }
        } catch (e) {
            console.error("Global Cron Hatası:", e);
        }
    }
};