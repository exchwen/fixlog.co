var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var rateLimitCache = /* @__PURE__ */ new Map();
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
    const APP_URL = "https://fixlog.co";
    const allowedOrigins = ["https://fixlog.co", "https://app.fixlog.co", "https://www.fixlog.co", "http://localhost:3000"];
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = allowedOrigins.includes(origin) ? origin : "https://fixlog.co";
    const corsHeaders = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (method === "OPTIONS")
      return new Response(null, { headers: corsHeaders });
    const safeAll = /* @__PURE__ */ __name(async (query) => {
      try {
        const res = await query.all();
        return res.results;
      } catch (e) {
        console.error("DB Error in safeAll:", e);
        return [];
      }
    }, "safeAll");
    const safeFirst = /* @__PURE__ */ __name(async (query) => {
      try {
        return await query.first();
      } catch (e) {
        console.error("DB Error in safeFirst:", e);
        return null;
      }
    }, "safeFirst");
    const hashPassword = /* @__PURE__ */ __name(async (password) => {
      if (!env.JWT_SECRET)
        throw new Error("Kritik: Sistemde JWT_SECRET tan\u0131ml\u0131 de\u011Fil!");
      const encoder = new TextEncoder();
      const data = encoder.encode(password + env.JWT_SECRET);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }, "hashPassword");
    const toBase64Url = /* @__PURE__ */ __name((str) => {
      const encoded = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)));
      return btoa(encoded).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }, "toBase64Url");
    const fromBase64Url = /* @__PURE__ */ __name((str) => {
      let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4)
        base64 += "=";
      const binary = atob(base64);
      return decodeURIComponent(binary.split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    }, "fromBase64Url");
    const verifyFirebaseIdToken = async (idToken) => {
      try {
        if (typeof idToken !== "string") return null;
        const parts = idToken.split(".");
        if (parts.length !== 3) return null;
        const header = JSON.parse(fromBase64Url(parts[0]));
        const claims = JSON.parse(fromBase64Url(parts[1]));
        if (header.alg !== "RS256" || !header.kid || claims.aud !== "fixlog-co" || claims.iss !== "https://securetoken.google.com/fixlog-co" || !claims.sub || claims.sub.length > 128 || claims.exp <= Date.now() / 1000 || claims.iat > Date.now() / 1000 + 60) return null;
        const keysResponse = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com", { cf: { cacheTtl: 3600, cacheEverything: true } });
        if (!keysResponse.ok) return null;
        const keyData = (await keysResponse.json()).keys?.find((key) => key.kid === header.kid);
        if (!keyData) return null;
        const publicKey = await crypto.subtle.importKey("jwk", keyData, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
        const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, Uint8Array.from(atob(parts[2].replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - parts[2].length % 4) % 4)), (char) => char.charCodeAt(0)), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
        return valid ? claims : null;
      } catch {
        return null;
      }
    };
    const triggerPusher = /* @__PURE__ */ __name(async (channel, event, data) => {
      try {
        console.log(`[Pusher] Tetikleniyor... Kanal: ${channel}, Event: ${event}`);
        const PUSHER_APP_ID = env.PUSHER_APP_ID || "2118585";
        const PUSHER_KEY = env.PUSHER_KEY || "75dfed44245e16eaea0a";
        const PUSHER_SECRET = env.PUSHER_SECRET;
        if (!PUSHER_SECRET) throw new Error("PUSHER_SECRET yapılandırılmamış.");
        const PUSHER_CLUSTER = "eu";
        const bodyStr = JSON.stringify({ name: event, channels: [channel], data: JSON.stringify(data) });
        const generateMD5 = /* @__PURE__ */ __name((str) => {
          var k = [], i = 0;
          for (; i < 64; )
            k[i] = 0 | Math.abs(Math.sin(++i)) * 4294967296;
          var calc = /* @__PURE__ */ __name((a, b2, c, d, x, s, t2) => a + c + d + x + t2 + (b2 << s | b2 >>> 32 - s) | 0, "calc");
          var b = [1732584193, -271733879, -1732584194, 271733878];
          str = unescape(encodeURIComponent(str));
          var w = [];
          for (i = 0; i < str.length; i++)
            w[i >> 2] |= (str.charCodeAt(i) & 255) << i % 4 * 8;
          w[i >> 2] |= 128 << i % 4 * 8;
          w[14 + (i + 8 >> 6 << 4)] = str.length * 8;
          for (i = 0; i < w.length; i += 16) {
            var o = b.slice(0);
            for (var j = 0; j < 64; j++) {
              var f = j < 16 ? o[1] & o[2] | ~o[1] & o[3] : j < 32 ? o[1] & o[3] | o[2] & ~o[3] : j < 48 ? o[1] ^ o[2] ^ o[3] : o[2] ^ (o[1] | ~o[3]);
              var t = calc(o[0], o[1], f, o[3], w[i + (j < 16 ? j : j < 32 ? (5 * j + 1) % 16 : j < 48 ? (3 * j + 5) % 16 : 7 * j % 16)], [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][(j >> 4) * 4 + j % 4], k[j]);
              o = [o[3], t, o[1], o[2]];
            }
            for (var j = 0; j < 4; j++)
              b[j] = b[j] + o[j] | 0;
          }
          var hex = "";
          for (i = 0; i < 32; i++)
            hex += (b[i >> 3] >> i % 4 * 8 & 15).toString(16) + (b[i >> 3] >> i % 4 * 8 + 4 & 15).toString(16);
          return hex;
        }, "generateMD5");
        const md5Hex = generateMD5(bodyStr);
        const timestamp = Math.floor(Date.now() / 1e3);
        const path = `/apps/${PUSHER_APP_ID}/events`;
        const authVersion = "1.0";
        const stringToSign = `POST
${path}
auth_key=${PUSHER_KEY}&auth_timestamp=${timestamp}&auth_version=${authVersion}&body_md5=${md5Hex}`;
        const keyData = await crypto.subtle.importKey("raw", new TextEncoder().encode(PUSHER_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signatureBuffer = await crypto.subtle.sign("HMAC", keyData, new TextEncoder().encode(stringToSign));
        const signature = Array.from(new Uint8Array(signatureBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
        const targetUrl = `https://api-${PUSHER_CLUSTER}.pusher.com${path}?auth_key=${PUSHER_KEY}&auth_timestamp=${timestamp}&auth_version=${authVersion}&body_md5=${md5Hex}&auth_signature=${signature}`;
        const pusherRes = await fetch(targetUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: bodyStr });
        const pusherText = await pusherRes.text();
        console.log(`[Pusher] Sonu\xE7: ${pusherRes.status} -> ${pusherText}`);
        return { status: pusherRes.status, response: pusherText };
      } catch (e) {
        console.error("[Pusher] Kritik Hata:", e);
        return { error: e.message };
      }
    }, "triggerPusher");
    const triggerBeams = /* @__PURE__ */ __name(async (interests, title, body, link, slug) => {
      if (slug)
        try {
          await triggerPusher(`company-${slug}`, "data_updated", {});
        } catch (e) {
        }
      try {
        const BEAMS_INSTANCE_ID = "015accc9-e581-44a3-b37f-5410549611da";
        const BEAMS_PRIMARY_KEY = env.BEAMS_PRIMARY_KEY;
        if (!BEAMS_PRIMARY_KEY) throw new Error("BEAMS_PRIMARY_KEY yapılandırılmamış.");
        let iconUrl = `${APP_URL}/icons/icon-192x192.png`;
        let finalTitle = title;
        if (slug) {
          try {
            const company = await safeFirst(env.DB.prepare("SELECT company_name, logo FROM companies WHERE slug = ?").bind(slug));
            if (company) {
              if (company.company_name) {
                if (title && (title.includes("AC\u0130L") || title.includes("ARIZA"))) {
                  finalTitle = title;
                } else {
                  finalTitle = company.company_name;
                }
              }
              if (company.logo && company.logo.startsWith("http")) {
                let safeLogo = company.logo;
                if (safeLogo.includes("r2.dev")) {
                  safeLogo = safeLogo.replace("https://pub-a78064a5e9304242b0982c01b5778197.r2.dev", `${APP_URL}/dosya-deposu`);
                }
                iconUrl = safeLogo;
              }
            }
          } catch (err) {
            console.error("Firma bilgileri \xE7ekilirken hata:", err);
          }
        }
        const payload = {
          interests,
          // 🚀 1. WEB TARAFI
          web: {
            time_to_live: 300,
            notification: {
              title: finalTitle,
              body,
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
              body,
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
                visibility: "public",
                // "private" olursa "İçerik gizlendi" yazar. "public" her şeyi gösterir.
                click_action: link || APP_URL
              }
            }
          }
        };
        const res = await fetch(`https://${BEAMS_INSTANCE_ID}.pushnotifications.pusher.com/publish_api/v1/instances/${BEAMS_INSTANCE_ID}/publishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${BEAMS_PRIMARY_KEY}`
          },
          body: JSON.stringify(payload)
        });
        console.log(`[Beams] Sonu\xE7: ${res.status}`);
      } catch (e) {
        console.error("[Beams] Kritik Hata:", e);
      }
    }, "triggerBeams");
    try {
      const publicRoutes = [
        "/register",
        "/get-slug",
        "/staff-login",
        "/public/company-info",
        "/public/get-asset",
        "/public/trigger-emergency",
        "/public/report-fault",
        "/public/request-quote",
        "/public/get-quote",
        "/public/sign-quote",
        "/masterboss-login",
        "/masterboss-data",
        "/masterboss-resolve-ticket",
        "/masterboss-company-details",
        "/masterboss-update-subscription"
      ];
      let userAuth = null;
      if (!publicRoutes.includes(url.pathname)) {
        const authHeader = request.headers.get("Authorization");
        let authErrorReason = "Token bulunamad\u0131 veya Authorization ba\u015Fl\u0131\u011F\u0131 eksik.";
        if (authHeader && authHeader.startsWith("Bearer ")) {
          let token = authHeader.split(" ")[1];
          token = token.replace(/^"|"$/g, "").trim();
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              const [headerB64, payloadB64, signatureB64] = parts;
              const payloadStr = fromBase64Url(payloadB64);
              const payload = JSON.parse(payloadStr);
              if (Date.now() <= payload.exp) {
                const secret = env.JWT_SECRET;
                if (!secret)
                  throw new Error("JWT_SECRET eksik!");
                const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
                const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${headerB64}.${payloadB64}`));
                let binarySig = "";
                const sigBytes = new Uint8Array(signatureBuffer);
                for (let i = 0; i < sigBytes.byteLength; i++) {
                  binarySig += String.fromCharCode(sigBytes[i]);
                }
                const expectedSignature = btoa(binarySig).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
                if (signatureB64 === expectedSignature) {
                  if (payload.role === "Patron" && payload.firebase_verified !== true) {
                    authErrorReason = "Oturum güvenlik nedeniyle yenilenmeli. Lütfen tekrar giriş yapın.";
                  } else {
                    userAuth = payload;
                  }
                } else {
                  authErrorReason = "Token imzas\u0131 ge\xE7ersiz (M\xFCh\xFCr uyu\u015Fmuyor).";
                }
              } else {
                authErrorReason = "Token s\xFCresi dolmu\u015F (Oturum zaman a\u015F\u0131m\u0131).";
              }
            } else {
              authErrorReason = "Token format\u0131 hatal\u0131 (Ge\xE7ersiz par\xE7a say\u0131s\u0131).";
            }
          } catch (e) {
            authErrorReason = "Token \xE7\xF6z\xFCmlenirken hata olu\u015Ftu: " + e.message;
          }
        }
        if (!userAuth) {
          return new Response(JSON.stringify({ error: "Yetkisiz Eri\u015Fim!", reason: authErrorReason }), { status: 401, headers: corsHeaders });
        }
        let requestSlug = url.searchParams.get("slug");
        if (!requestSlug && method === "POST" && url.pathname !== "/pusher/auth" && url.pathname !== "/send-test-push") {
          const clonedReq = request.clone();
          try {
            const body = await clonedReq.json();
            requestSlug = body.slug || body.company_slug;
          } catch (e) {
          }
        }
        if (userAuth.role !== "Masterboss") {
          if (!requestSlug && method !== "GET") {
            return new Response(JSON.stringify({ error: "G\xFCvenlik \u0130hlali: \u0130stekte firma tan\u0131mlay\u0131c\u0131s\u0131 (slug) bulunamad\u0131." }), { status: 403, headers: corsHeaders });
          }
          if (requestSlug && requestSlug !== userAuth.slug) {
            return new Response(JSON.stringify({ error: "\u0130hlal Tespit Edildi! Sadece kendi firman\u0131za ait verilerde i\u015Flem yapabilirsiniz." }), { status: 403, headers: corsHeaders });
          }
        }
        if (requestSlug && userAuth.role !== "Masterboss") {
          const companySub = await safeFirst(env.DB.prepare("SELECT subscription_status FROM companies WHERE slug = ?").bind(requestSlug));
          if (companySub && (companySub.subscription_status === "past_due" || companySub.subscription_status === "canceled")) {
            if (method !== "GET" && url.pathname !== "/staff-login" && url.pathname !== "/masterboss-login") {
              return new Response(JSON.stringify({ error: "PAYWALL_ACTIVE", message: "Aboneli\u011Finiz ask\u0131ya al\u0131nm\u0131\u015Ft\u0131r. \u0130\u015Flem yapabilmek i\xE7in \xF6deme yapmal\u0131s\u0131n\u0131z." }), { status: 403, headers: corsHeaders });
            }
          }
        }
        if (userAuth.role === "Usta") {
          const allowedForUsta = ["/dashboard-data", "/get-messages", "/send-message", "/read-messages", "/pusher/auth", "/update-job", "/send-sos", "/request-material", "/add-support-ticket", "/get-my-tickets", "/reply-support-ticket"];
          if (!allowedForUsta.includes(url.pathname)) {
            return new Response(JSON.stringify({ error: "Ye\u015Fil Kart (Usta) Yetkisi S\u0131n\u0131r\u0131!" }), { status: 403, headers: corsHeaders });
          }
        }
        if (userAuth.role === "Y\xF6netici") {
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
            return new Response(JSON.stringify({ error: "Mavi Kart (Y\xF6netici) Yetkisi S\u0131n\u0131r\u0131!" }), { status: 403, headers: corsHeaders });
          }
        }
      }
      if (url.pathname === "/send-test-push" && method === "POST") {
        if (!userAuth || userAuth.role !== "Masterboss") return new Response(JSON.stringify({ error: "Yetkisiz işlem." }), { status: 403, headers: corsHeaders });
        const { interests, title, body, link, slug } = await request.json();
        if (!Array.isArray(interests) || interests.length !== 1 || interests[0] !== "test-kanal") return new Response(JSON.stringify({ error: "Yalnızca test kanalına gönderim yapılabilir." }), { status: 400, headers: corsHeaders });
        const finalLink = link || APP_URL;
        await triggerBeams(interests, title, body, finalLink, slug);
        return new Response(JSON.stringify({ success: true, message: "Bildirim iste\u011Fi Pusher'a iletildi." }), { headers: corsHeaders });
      }
      if (url.pathname === "/pusher/auth" && method === "POST") {
        const formData = await request.text();
        const params = new URLSearchParams(formData);
        const socketId = params.get("socket_id");
        const channelName = params.get("channel_name");
        if (!socketId || !channelName || userAuth.role === "Masterboss" || !userAuth.slug || channelName !== `presence-chat-${userAuth.slug}`) {
          return new Response(JSON.stringify({ error: "Bu kanala erişim izniniz yok." }), { status: 403, headers: corsHeaders });
        }
        const PUSHER_KEY = env.PUSHER_KEY;
        const PUSHER_SECRET = env.PUSHER_SECRET;
        if (!PUSHER_KEY || !PUSHER_SECRET) return new Response(JSON.stringify({ error: "Pusher yapılandırması eksik." }), { status: 503, headers: corsHeaders });
        const userId = userAuth.role === "Patron" ? "PATRON" : String(userAuth.id);
        const userInfo = { name: userAuth.name, role: userAuth.role };
        const channelData = JSON.stringify({ user_id: userId, user_info: userInfo });
        const stringToSign = `${socketId}:${channelName}:${channelData}`;
        const keyData = await crypto.subtle.importKey("raw", new TextEncoder().encode(PUSHER_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signatureBuffer = await crypto.subtle.sign("HMAC", keyData, new TextEncoder().encode(stringToSign));
        const signature = Array.from(new Uint8Array(signatureBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
        const authResponse = {
          auth: `${PUSHER_KEY}:${signature}`,
          channel_data: channelData
        };
        return new Response(JSON.stringify(authResponse), { headers: corsHeaders });
      }
      if (url.pathname === "/register" && method === "POST") {
        const { idToken, companyName, sector, slug, referredByCode } = await request.json();
        const firebaseUser = await verifyFirebaseIdToken(idToken);
        if (!firebaseUser) return new Response(JSON.stringify({ error: "Firebase oturumu doğrulanamadı. Yeniden giriş yapın." }), { status: 401, headers: corsHeaders });
        const uid = firebaseUser.user_id || firebaseUser.sub;
        if (!uid || typeof uid !== "string" || uid.trim() === "") {
          return new Response(JSON.stringify({ error: "Oturum bilgisi eksik. L\xFCtfen tekrar giri\u015F yap\u0131n." }), { status: 400, headers: corsHeaders });
        }
        const existing = await safeFirst(env.DB.prepare("SELECT slug, referral_code FROM companies WHERE owner_uid = ?").bind(uid.trim()));
        if (existing) {
          return new Response(JSON.stringify({ success: true, slug: existing.slug, refCode: existing.referral_code, existing: true }), { headers: corsHeaders });
        }
        const trialEndsAt = /* @__PURE__ */ new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        const safeSlugPrefix = slug ? slug.substring(0, 4) : "COMP";
        const refCode = (safeSlugPrefix + Math.floor(1e3 + Math.random() * 9e3)).toUpperCase();
        let referredById = null;
        if (referredByCode) {
          const refCompany = await safeFirst(env.DB.prepare("SELECT id FROM companies WHERE referral_code = ?").bind(referredByCode));
          if (refCompany) {
            referredById = refCompany.id;
          }
        }
        try {
          await env.DB.prepare(`
                    INSERT INTO companies (
                        owner_uid, company_name, slug, sector, owner_name, 
                        subscription_status, trial_ends_at, referral_code, referred_by_id
                    ) VALUES (?, ?, ?, ?, ?, 'trialing', ?, ?, ?)
                `).bind(
            uid.trim(),
            companyName || "",
            slug || "",
            sector || "",
            firebaseUser.name || firebaseUser.email || "Y\xF6netici",
            trialEndsAt.toISOString(),
            refCode,
            referredById
          ).run();
        } catch (e) {
          const msg = e && e.message ? String(e.message) : "";
          if (msg.includes("UNIQUE") || msg.includes("unique")) {
            return new Response(JSON.stringify({ error: "Bu firma veya ba\u011Flant\u0131 zaten kay\u0131tl\u0131. Giri\u015F yapmay\u0131 deneyin." }), { status: 409, headers: corsHeaders });
          }
          throw e;
        }
        return new Response(JSON.stringify({ success: true, refCode }), { headers: corsHeaders });
      }
      if (url.pathname === "/get-billing-info" && method === "GET") {
        const slug = url.searchParams.get("slug");
        const company = await safeFirst(env.DB.prepare("SELECT subscription_status, custom_base_price, free_months_balance, has_masterboss_gift FROM companies WHERE slug = ?").bind(slug || ""));
        const assets = await safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM assets WHERE company_slug = ?").bind(slug || ""));
        const reward = await safeFirst(env.DB.prepare("SELECT free_months_balance, has_masterboss_gift FROM company_rewards WHERE company_slug = ?").bind(slug || ""));
        const assetCount = assets?.total || 0;
        const freeMonths = company?.free_months_balance || 0;
        const hasMasterbossGift = company?.has_masterboss_gift || 0;
        const sysSettings = await safeAll(env.DB.prepare("SELECT * FROM system_settings"));
        let globalBase = 3e3;
        let globalAsset = 50;
        sysSettings.forEach((s) => {
          if (s.key === "global_base_price")
            globalBase = Number(s.value);
          if (s.key === "global_asset_price")
            globalAsset = Number(s.value);
        });
        const basePrice = company?.custom_base_price !== null && company?.custom_base_price !== void 0 ? company.custom_base_price : globalBase;
        const assetUnitPrice = company?.custom_per_asset_price !== null && company?.custom_per_asset_price !== void 0 ? company.custom_per_asset_price : globalAsset;
        let totalAmount = basePrice + assetCount * assetUnitPrice;
        let discountApplied = false;
        if (freeMonths > 0) {
          if (hasMasterbossGift) {
            totalAmount = 0;
          } else {
            totalAmount = assetCount * assetUnitPrice;
          }
          discountApplied = true;
        }
        return new Response(JSON.stringify({
          success: true,
          status: company?.subscription_status || "unknown",
          assetCount,
          basePrice,
          assetPrice: assetCount * assetUnitPrice,
          totalAmount,
          freeMonthsBalance: freeMonths,
          discountApplied
        }), { headers: corsHeaders });
      }
      if (url.pathname === "/get-slug" && method === "POST") {
        const { idToken } = await request.json();
        const firebaseUser = await verifyFirebaseIdToken(idToken);
        if (!firebaseUser) return new Response(JSON.stringify({ success: false, error: "Firebase oturumu doğrulanamadı. Yeniden giriş yapın." }), { status: 401, headers: corsHeaders });
        const uid = firebaseUser.user_id || firebaseUser.sub;
        const company = await safeFirst(env.DB.prepare("SELECT slug, owner_name FROM companies WHERE owner_uid = ?").bind(uid));
        if (company) {
          const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
          const payload = toBase64Url(JSON.stringify({ id: uid, name: company.owner_name, role: "Patron", slug: company.slug, firebase_verified: true, exp: Date.now() + 1e3 * 60 * 60 * 24 * 30 }));
          const secret = env.JWT_SECRET;
          if (!secret)
            throw new Error("JWT_SECRET eksik!");
          const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
          const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`));
          let binarySig = "";
          const sigBytes = new Uint8Array(signatureBuffer);
          for (let i = 0; i < sigBytes.byteLength; i++) {
            binarySig += String.fromCharCode(sigBytes[i]);
          }
          const signature = btoa(binarySig).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          const token = `${header}.${payload}.${signature}`;
          return new Response(JSON.stringify({
            success: true,
            slug: company.slug,
            token,
            role: "Patron",
            name: company.owner_name
          }), { headers: corsHeaders });
        }
        return new Response(JSON.stringify({ slug: null }), { headers: corsHeaders });
      }
      if (url.pathname === "/public/company-info" && method === "GET") {
        const slug = url.searchParams.get("slug");
        const company = await safeFirst(env.DB.prepare("SELECT company_name, logo FROM companies WHERE slug = ?").bind(slug || ""));
        if (company) {
          return new Response(JSON.stringify(company), { headers: corsHeaders });
        }
        return new Response(JSON.stringify({ error: "Firma bulunamad\u0131" }), { status: 404, headers: corsHeaders });
      }
      if (url.pathname === "/staff-login" && method === "POST") {
        const now = Date.now();
        const limitData = rateLimitCache.get(clientIp) || { count: 0, time: now };
        if (now - limitData.time > 15 * 60 * 1e3) {
          limitData.count = 0;
          limitData.time = now;
        }
        if (limitData.count >= 10)
          return new Response(JSON.stringify({ error: "G\xFCvenlik: \xC7ok fazla hatal\u0131 deneme! L\xFCtfen 15 dakika bekleyin." }), { status: 429, headers: corsHeaders });
        const { slug, username, password } = await request.json();
        const hashedPw = await hashPassword(password);
        const staff = await safeFirst(env.DB.prepare("SELECT id, name, role, is_active FROM staff WHERE company_slug = ? AND username = ? AND password_hash = ?").bind(slug, username, hashedPw));
        if (!staff) {
          limitData.count++;
          rateLimitCache.set(clientIp, limitData);
          return new Response(JSON.stringify({ error: "Kullan\u0131c\u0131 ad\u0131 veya \u015Fifre hatal\u0131." }), { status: 401, headers: corsHeaders });
        }
        rateLimitCache.delete(clientIp);
        if (staff.is_active === 0) {
          return new Response(JSON.stringify({ error: "Bu hesap firma y\xF6neticisi taraf\u0131ndan dondurulmu\u015Ftur." }), { status: 403, headers: corsHeaders });
        }
        const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const payload = toBase64Url(JSON.stringify({ id: staff.id, name: staff.name, role: staff.role, slug, exp: Date.now() + 1e3 * 60 * 60 * 24 * 30 }));
        const secret = env.JWT_SECRET;
        if (!secret)
          throw new Error("JWT_SECRET eksik!");
        const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`));
        let binarySig = "";
        const sigBytes = new Uint8Array(signatureBuffer);
        for (let i = 0; i < sigBytes.byteLength; i++) {
          binarySig += String.fromCharCode(sigBytes[i]);
        }
        const signature = btoa(binarySig).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const token = `${header}.${payload}.${signature}`;
        return new Response(JSON.stringify({ success: true, token, role: staff.role, name: staff.name }), { headers: corsHeaders });
      }
      if (url.pathname === "/masterboss-login" && method === "POST") {
        const now = Date.now();
        const limitData = rateLimitCache.get(clientIp) || { count: 0, time: now };
        if (now - limitData.time > 15 * 60 * 1e3) {
          limitData.count = 0;
          limitData.time = now;
        }
        if (limitData.count >= 10)
          return new Response(JSON.stringify({ error: "G\xFCvenlik: \xC7ok fazla hatal\u0131 deneme! L\xFCtfen 15 dakika bekleyin." }), { status: 429, headers: corsHeaders });
        const { masterPassword } = await request.json();
        const MASTERBOSS_PASSWORD = env.MASTERBOSS_PASSWORD;
        if (!MASTERBOSS_PASSWORD) {
          return new Response(JSON.stringify({ error: "Kritik: Sistemde MASTERBOSS_PASSWORD tan\u0131ml\u0131 de\u011Fil!" }), { status: 500, headers: corsHeaders });
        }
        if (masterPassword === MASTERBOSS_PASSWORD) {
          rateLimitCache.delete(clientIp);
          const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
          const payload = toBase64Url(JSON.stringify({
            role: "Masterboss",
            exp: Date.now() + 1e3 * 60 * 60 * 24
            // 24 Saat geçerli
          }));
          const secret = env.JWT_SECRET;
          if (!secret)
            throw new Error("JWT_SECRET eksik!");
          const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
          const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`));
          let binarySig = "";
          const sigBytes = new Uint8Array(signatureBuffer);
          for (let i = 0; i < sigBytes.byteLength; i++) {
            binarySig += String.fromCharCode(sigBytes[i]);
          }
          const signature = btoa(binarySig).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          const masterToken = `${header}.${payload}.${signature}`;
          return new Response(JSON.stringify({ success: true, token: masterToken }), { headers: corsHeaders });
        }
        limitData.count++;
        rateLimitCache.set(clientIp, limitData);
        return new Response(JSON.stringify({ error: "Ge\xE7ersiz Masterboss \u015Eifresi!" }), { status: 401, headers: corsHeaders });
      }
      if (url.pathname === "/dashboard-data" && method === "GET") {
        const slug = url.searchParams.get("slug");
        let [
          company,
          companyReward,
          statsJob,
          statsStaff,
          statsAsset,
          income,
          expense,
          jobs,
          assets,
          staff,
          stock,
          finances,
          customers,
          suppliers,
          categories,
          activeEmergencies,
          pendingFaults,
          allEmergencies,
          allFaults,
          // 🚀 YENİ EKLENEN SORGULAR (SOS ve Malzeme Talepleri)
          activeStaffSos,
          allStaffSos,
          pendingMaterialRequests,
          allMaterialRequests
        ] = await Promise.all([
          safeFirst(env.DB.prepare("SELECT company_name, sector, owner_name, address, tax_info, phone, landline_phone, emergency_phone, whatsapp_phone, website, logo, subscription_status, custom_base_price, custom_per_asset_price, referral_code, trial_ends_at, billing_cycle_anchor, free_months_balance, has_masterboss_gift, work_days, autopilot_daily_capacity_units FROM companies WHERE slug = ?").bind(slug || "")),
          safeFirst(env.DB.prepare("SELECT free_months_balance, has_masterboss_gift FROM company_rewards WHERE company_slug = ?").bind(slug || "")),
          safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM jobs WHERE company_slug = ?").bind(slug || "")),
          safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM staff WHERE company_slug = ?").bind(slug || "")),
          safeFirst(env.DB.prepare("SELECT COUNT(*) as total FROM assets WHERE company_slug = ?").bind(slug || "")),
          safeFirst(env.DB.prepare("SELECT SUM(amount) as total FROM finances WHERE company_slug = ? AND type = 'Gelir'").bind(slug || "")),
          safeFirst(env.DB.prepare("SELECT SUM(amount) as total FROM finances WHERE company_slug = ? AND type = 'Gider'").bind(slug || "")),
          safeAll(env.DB.prepare("SELECT * FROM jobs WHERE company_slug = ? ORDER BY created_at DESC LIMIT 300").bind(slug || "")),
          safeAll(env.DB.prepare("SELECT * FROM assets WHERE company_slug = ? LIMIT 100").bind(slug || "")),
          safeAll(env.DB.prepare("SELECT * FROM staff WHERE company_slug = ?").bind(slug || "")),
          safeAll(env.DB.prepare("SELECT * FROM stock WHERE company_slug = ? LIMIT 100").bind(slug || "")),
          safeAll(env.DB.prepare("SELECT * FROM finances WHERE company_slug = ? ORDER BY created_at DESC LIMIT 50").bind(slug || "")),
          safeAll(env.DB.prepare("SELECT * FROM customers WHERE company_slug = ? LIMIT 100").bind(slug || "")),
          safeAll(env.DB.prepare("SELECT * FROM suppliers WHERE company_slug = ?").bind(slug || "")),
          safeAll(env.DB.prepare("SELECT * FROM stock_categories WHERE company_slug = ?").bind(slug || "")),
          safeAll(env.DB.prepare(`SELECT e.*, a.name as asset_name, a.apartmentName as asset_apartment, a.location as asset_location FROM emergencies e LEFT JOIN assets a ON e.asset_id = a.uuid WHERE e.company_slug = ? AND e.status = 'Aktif'`).bind(slug || "")),
          safeAll(env.DB.prepare(`SELECT f.*, a.name as asset_name, a.apartmentName as asset_apartment, a.location as asset_location FROM fault_reports f LEFT JOIN assets a ON f.asset_id = a.uuid WHERE f.company_slug = ? AND f.status = 'Aktif'`).bind(slug || "")),
          safeAll(env.DB.prepare(`SELECT e.*, a.name as asset_name, a.apartmentName as asset_apartment, a.location as asset_location FROM emergencies e LEFT JOIN assets a ON e.asset_id = a.uuid WHERE e.company_slug = ? ORDER BY e.created_at DESC LIMIT 50`).bind(slug || "")),
          safeAll(env.DB.prepare(`SELECT f.*, a.name as asset_name, a.apartmentName as asset_apartment, a.location as asset_location FROM fault_reports f LEFT JOIN assets a ON f.asset_id = a.uuid WHERE f.company_slug = ? LIMIT 50`).bind(slug || "")),
          // 🚀 YENİ: Personel SOS ve Malzeme Taleplerini Veritabanından Çekme (Eğer tablo yoksa boş döner sistemi çökertmez)
          safeAll(env.DB.prepare(`SELECT s.*, st.name as staff_name, st.phone as staff_phone FROM staff_sos s LEFT JOIN staff st ON s.staff_id = st.id WHERE s.company_slug = ? AND s.status = 'Aktif'`).bind(slug || "")),
          safeAll(env.DB.prepare(`SELECT s.*, st.name as staff_name, st.phone as staff_phone FROM staff_sos s LEFT JOIN staff st ON s.staff_id = st.id WHERE s.company_slug = ? ORDER BY s.created_at DESC LIMIT 50`).bind(slug || "")),
          safeAll(env.DB.prepare(`SELECT m.*, st.name as staff_name FROM material_requests m LEFT JOIN staff st ON m.staff_id = st.id WHERE m.company_slug = ? AND m.status = 'Bekliyor' ORDER BY m.created_at DESC LIMIT 50`).bind(slug || "")),
          safeAll(env.DB.prepare(`SELECT m.*, st.name as staff_name FROM material_requests m LEFT JOIN staff st ON m.staff_id = st.id WHERE m.company_slug = ? ORDER BY m.created_at DESC LIMIT 50`).bind(slug || ""))
        ]);
        const totalIncome = income?.total || 0;
        const totalExpense = expense?.total || 0;
        const totalAssetsNum = statsAsset?.total || 0;
        const totalStaffNum = statsStaff?.total || 0;
        let growthAdvice = null;
        if (totalStaffNum > 0) {
          const dailyLoadPerStaff = Math.round(totalAssetsNum / totalStaffNum / 26);
          if (dailyLoadPerStaff > 15) {
            growthAdvice = { status: "critical", message: `Uyar\u0131: Usta ba\u015F\u0131na g\xFCnl\xFCk y\xFCk ${dailyLoadPerStaff} bak\u0131ma ula\u015Ft\u0131. Operasyonel aksama ya\u015Famamak i\xE7in yeni personel almay\u0131 d\xFC\u015F\xFCnmelisiniz.` };
          } else {
            growthAdvice = { status: "good", message: `Sistem Stabil: Usta ba\u015F\u0131na g\xFCnl\xFCk ortalama ${dailyLoadPerStaff} bak\u0131m d\xFC\u015F\xFCyor. Kapasiteniz ideal seviyede.` };
          }
        } else if (totalAssetsNum > 0) {
          growthAdvice = { status: "warning", message: `Sistemde ${totalAssetsNum} varl\u0131k var ancak atanacak kay\u0131tl\u0131 ustan\u0131z yok!` };
        }
        if (company && !company.referral_code) {
          const safeSlugPrefix = slug ? slug.substring(0, 4) : "COMP";
          const newRefCode = (safeSlugPrefix + Math.floor(1e3 + Math.random() * 9e3)).toUpperCase();
          try {
            await env.DB.prepare("UPDATE companies SET referral_code = ? WHERE slug = ?").bind(newRefCode, slug).run();
            company.referral_code = newRefCode;
          } catch (e) {
            console.error("Referans kodu olu\u015Fturulurken hata:", e);
          }
        }
        const dashboardData = {
          growthAdvice,
          // Frontend'de uyarı çubuğunda göstermek için eklendi
          subscription_status: company?.subscription_status || "active",
          // 🚀 YENİ: Paywall kontrolü
          trial_ends_at: company?.trial_ends_at,
          // 🚀 YENİ: Kalan gün hesabı için
          billing_cycle_anchor: company?.billing_cycle_anchor,
          // 🚀 YENİ: Fatura kesim tarihi
          custom_base_price: company?.custom_base_price,
          custom_per_asset_price: company?.custom_per_asset_price,
          // Frontend'in hesaplama yapabilmesi için global fiyatları da gönderiyoruz
          global_base_price: (await safeFirst(env.DB.prepare("SELECT value FROM system_settings WHERE key = 'global_base_price'")))?.value || 3e3,
          global_asset_price: (await safeFirst(env.DB.prepare("SELECT value FROM system_settings WHERE key = 'global_asset_price'")))?.value || 50,
          free_months_balance: company?.free_months_balance || 0,
          has_masterboss_gift: company?.has_masterboss_gift || 0,
          // Masterboss hediye bayrağı
          referralCode: company?.referral_code,
          // 🚀 YENİ: Frontend'in her yerinde kolayca okunsun diye
          name: company?.company_name || "\u0130\u015Fletme",
          ownerName: company?.owner_name || "Kullan\u0131c\u0131",
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
          work_days: (() => {
            try {
              return company?.work_days ? JSON.parse(company.work_days) : [1, 2, 3, 4, 5, 6];
            } catch (e) {
              return [1, 2, 3, 4, 5, 6];
            }
          })(),
          autopilot_daily_capacity_units: company?.autopilot_daily_capacity_units != null && !isNaN(Number(company.autopilot_daily_capacity_units)) && Number(company.autopilot_daily_capacity_units) >= 0.5 ? Number(company.autopilot_daily_capacity_units) : 10,
          stats: [
            { label: "Toplam \u0130\u015F", value: (statsJob?.total || 0).toString() },
            { label: "Personel Say\u0131s\u0131", value: (statsStaff?.total || 0).toString() },
            { label: "Varl\u0131klar", value: (statsAsset?.total || 0).toString() },
            { label: "Net Kasa", value: `\u20BA${(totalIncome - totalExpense).toLocaleString("tr-TR")}` }
          ],
          jobs: (jobs || []).map((j) => {
            let details = {};
            try {
              details = JSON.parse(j.details || "{}");
            } catch (e) {
            }
            let photos = [];
            try {
              photos = JSON.parse(j.photo_urls || "[]");
            } catch (e) {
            }
            return { ...j, details, photos };
          }),
          assets: assets || [],
          staff: (staff || []).map((s) => {
            const { password_hash, ...safe } = s;
            return safe;
          }),
          stock: stock || [],
          finances: finances || [],
          customers: customers || [],
          suppliers: suppliers || [],
          categories: categories || [],
          // 🚀 YENİ VERİLER: Hem Cihaz hem Personel Acil Durumları birleştiriliyor
          activeEmergencies: [...activeEmergencies || [], ...activeStaffSos || []],
          allEmergencies: [...allEmergencies || [], ...allStaffSos || []],
          pendingFaults: pendingFaults || [],
          allFaults: allFaults || [],
          // Malzeme talepleri (Stringified JSON parse hatasını engellemek için doğrudan aktarım)
          pendingMaterialRequests: (pendingMaterialRequests || []).map((req) => {
            let parsedItems = [];
            try {
              parsedItems = typeof req.items === "string" ? JSON.parse(req.items) : req.items;
            } catch (e) {
            }
            return { ...req, parsed_items: parsedItems };
          }),
          allMaterialRequests: (allMaterialRequests || []).map((req) => {
            let parsedItems = [];
            try {
              parsedItems = typeof req.items === "string" ? JSON.parse(req.items) : req.items;
            } catch (e) {
            }
            return { ...req, parsed_items: parsedItems };
          }),
          finSummary: { income: totalIncome, expense: totalExpense }
        };
        if (userAuth.role === "Usta") {
          const ownId = String(userAuth.id);
          const ownJobs = dashboardData.jobs.filter((job) => [job.staff_id, job.worker_id, job.manager_id].some((assignedId) => assignedId != null && String(assignedId) === ownId));
          const relatedAssetIds = new Set(ownJobs.map((job) => String(job.asset_id)));
          const ownAssets = dashboardData.assets.filter((asset) => relatedAssetIds.has(String(asset.id)));
          const ownCustomerIds = new Set(ownAssets.map((asset) => String(asset.customer_id)).filter(Boolean));
          dashboardData.jobs = ownJobs;
          dashboardData.assets = ownAssets;
          dashboardData.staff = dashboardData.staff.filter((staffMember) => String(staffMember.id) === ownId);
          dashboardData.customers = dashboardData.customers.filter((customer) => ownCustomerIds.has(String(customer.id))).map(({ tax_info, ...customer }) => customer);
          dashboardData.stock = dashboardData.stock.map(({ supplier_id, unit_price, ...stockItem }) => stockItem);
          dashboardData.finances = [];
          dashboardData.suppliers = [];
          dashboardData.categories = [];
          dashboardData.activeEmergencies = [];
          dashboardData.allEmergencies = [];
          dashboardData.pendingFaults = [];
          dashboardData.allFaults = [];
          dashboardData.pendingMaterialRequests = [];
          dashboardData.allMaterialRequests = [];
          dashboardData.name = company?.company_name || "İşletme";
          dashboardData.ownerName = "";
          dashboardData.address = "";
          dashboardData.taxInfo = "";
          dashboardData.phone = "";
          dashboardData.landlinePhone = "";
          dashboardData.emergencyPhone = "";
          dashboardData.whatsappPhone = "";
          dashboardData.website = "";
          dashboardData.referralCode = undefined;
          dashboardData.referral_code = undefined;
          dashboardData.custom_base_price = undefined;
          dashboardData.custom_per_asset_price = undefined;
          dashboardData.free_months_balance = undefined;
          dashboardData.has_masterboss_gift = undefined;
          dashboardData.stats = [];
          dashboardData.finSummary = { income: 0, expense: 0 };
        }
        return new Response(JSON.stringify(dashboardData), { headers: corsHeaders });
      }
      if (url.pathname === "/update-settings" && method === "POST") {
        const { slug, companyName, ownerName, sector, address, taxInfo, phone, landlinePhone, emergencyPhone, whatsappPhone, website, logo, work_days, autopilot_daily_capacity_units } = await request.json();
        const existingCo = await safeFirst(env.DB.prepare("SELECT work_days, autopilot_daily_capacity_units FROM companies WHERE slug = ?").bind(slug || ""));
        let workDaysStr = existingCo?.work_days || "[1,2,3,4,5,6]";
        if (work_days !== void 0 && work_days !== null) {
          workDaysStr = typeof work_days === "string" ? work_days : JSON.stringify(work_days);
        }
        let capUnits = existingCo?.autopilot_daily_capacity_units != null && !isNaN(Number(existingCo.autopilot_daily_capacity_units)) && Number(existingCo.autopilot_daily_capacity_units) >= 0.5 ? Number(existingCo.autopilot_daily_capacity_units) : 10;
        if (autopilot_daily_capacity_units !== void 0 && autopilot_daily_capacity_units !== null && !isNaN(Number(autopilot_daily_capacity_units)) && Number(autopilot_daily_capacity_units) >= 0.5) {
          capUnits = Number(autopilot_daily_capacity_units);
        }
        let finalLogoUrl = logo;
        if (logo && logo.startsWith("data:image/")) {
          try {
            const base64Data = logo.split(",")[1];
            const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            const fileName = `fixlog/${slug}/logos/logo.png`;
            await env.BUCKET.put(fileName, bytes.buffer, {
              httpMetadata: { contentType: "image/png", cacheControl: "public, max-age=31536000" },
              customMetadata: { "company": slug }
            });
            finalLogoUrl = `https://pub-a78064a5e9304242b0982c01b5778197.r2.dev/${fileName}?v=${Date.now()}`;
          } catch (err) {
            console.error("Logo R2'ye y\xFCklenirken hata olu\u015Ftu:", err);
          }
        }
        await env.DB.prepare("UPDATE companies SET company_name = ?, owner_name = ?, sector = ?, address = ?, tax_info = ?, phone = ?, landline_phone = ?, emergency_phone = ?, whatsapp_phone = ?, website = ?, logo = ?, work_days = ?, autopilot_daily_capacity_units = ? WHERE slug = ?").bind(companyName || "", ownerName || "", sector || "", address || "", taxInfo || "", phone || "", landlinePhone || "", emergencyPhone || "", whatsappPhone || "", website || "", finalLogoUrl || "", workDaysStr, capUnits, slug || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/add-support-ticket" && method === "POST") {
        const { type, message } = await request.json();
        const id = crypto.randomUUID();
        const safeSlug = userAuth ? userAuth.slug : null;
        if (!safeSlug)
          return new Response(JSON.stringify({ error: "Yetkisiz veya eksik firma bilgisi!" }), { status: 403, headers: corsHeaders });
        const safeName = userAuth.name || "Yetkili";
        await env.DB.prepare("INSERT INTO support_tickets (id, company_slug, sender_name, type, message, status, replies) VALUES (?, ?, ?, ?, ?, 'A\xE7\u0131k', '[]')").bind(id, safeSlug, safeName, type || "Geri Bildirim", message || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/get-my-tickets" && method === "GET") {
        const finalSlug = userAuth ? userAuth.slug : null;
        if (!finalSlug) {
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        }
        const tickets = await safeAll(env.DB.prepare("SELECT * FROM support_tickets WHERE company_slug = ? ORDER BY created_at DESC").bind(finalSlug));
        return new Response(JSON.stringify(tickets || []), { headers: corsHeaders });
      }
      if (url.pathname === "/reply-support-ticket" && method === "POST") {
        const { ticketId, replyMessage } = await request.json();
        const safeSlug = userAuth ? userAuth.slug : null;
        if (!safeSlug)
          return new Response(JSON.stringify({ error: "Yetkisiz veya eksik firma bilgisi!" }), { status: 403, headers: corsHeaders });
        const ticket = await safeFirst(env.DB.prepare("SELECT replies FROM support_tickets WHERE id = ? AND company_slug = ?").bind(ticketId, safeSlug));
        if (!ticket)
          return new Response(JSON.stringify({ error: "Talep bulunamad\u0131" }), { status: 404, headers: corsHeaders });
        let repliesArray = [];
        try {
          repliesArray = JSON.parse(ticket.replies || "[]");
        } catch (e) {
          repliesArray = [];
        }
        repliesArray.push({
          sender: "customer",
          message: replyMessage,
          date: (/* @__PURE__ */ new Date()).toISOString()
        });
        const finalRepliesJSON = JSON.stringify(repliesArray);
        await env.DB.prepare("UPDATE support_tickets SET replies = ? WHERE id = ? AND company_slug = ?").bind(finalRepliesJSON, ticketId, safeSlug).run();
        return new Response(JSON.stringify({ success: true, updatedReplies: finalRepliesJSON }), { headers: corsHeaders });
      }
      if (url.pathname === "/add-category" && method === "POST") {
        const { slug, name } = await request.json();
        await env.DB.prepare("INSERT INTO stock_categories (company_slug, name) VALUES (?, ?)").bind(slug || "", name || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/delete-category" && method === "POST") {
        const { slug, id } = await request.json();
        await env.DB.prepare("DELETE FROM stock_categories WHERE id=? AND company_slug=?").bind(id, slug || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/update-category" && method === "POST") {
        const { slug, id, name } = await request.json();
        await env.DB.prepare("UPDATE stock_categories SET name=? WHERE id=? AND company_slug=?").bind(name || "", id, slug || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/add-staff" && method === "POST") {
        const { slug, id, name, phone, contact, role, branch, username, password, is_active, assigned_regions, off_days } = await request.json();
        const finalPhone = phone || contact || "";
        const passwordTrimmed = typeof password === "string" ? password.trim() : "";
        let offDaysStr = "[]";
        if (off_days !== void 0 && off_days !== null) {
          offDaysStr = typeof off_days === "string" ? off_days : JSON.stringify(off_days);
        }
        if (userAuth && userAuth.role === "Y\xF6netici") {
          if (role === "Y\xF6netici" || role === "Patron") {
            return new Response(JSON.stringify({ error: "Y\xF6neticiler sadece 'Usta' rol\xFCnde personel ekleyebilir." }), { status: 403, headers: corsHeaders });
          }
          if (id) {
            const targetStaff = await safeFirst(env.DB.prepare("SELECT role FROM staff WHERE id=? AND company_slug=?").bind(id, slug || ""));
            if (targetStaff && targetStaff.role === "Y\xF6netici") {
              return new Response(JSON.stringify({ error: "Y\xF6neticiler di\u011Fer y\xF6neticilerin bilgilerini g\xFCncelleyemez." }), { status: 403, headers: corsHeaders });
            }
          }
        }
        let hashedPw = null;
        if (passwordTrimmed) {
          hashedPw = await hashPassword(passwordTrimmed);
        }
        if (id) {
          if (passwordTrimmed) {
            await env.DB.prepare("UPDATE staff SET name=?, phone=?, role=?, branch=?, username=?, password_hash=?, is_active=?, assigned_regions=?, off_days=? WHERE id=? AND company_slug=?").bind(name || "", finalPhone, role || "", branch || "", username || "", hashedPw, is_active ?? 1, assigned_regions || "", offDaysStr, id, slug || "").run();
          } else {
            await env.DB.prepare("UPDATE staff SET name=?, phone=?, role=?, branch=?, username=?, is_active=?, assigned_regions=?, off_days=? WHERE id=? AND company_slug=?").bind(name || "", finalPhone, role || "", branch || "", username || "", is_active ?? 1, assigned_regions || "", offDaysStr, id, slug || "").run();
          }
        } else {
          await env.DB.prepare("INSERT INTO staff (company_slug, name, phone, role, branch, username, password_hash, is_active, assigned_regions, off_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(slug || "", name || "", finalPhone, role || "Usta", branch || "", username || "", hashedPw || "", is_active ?? 1, assigned_regions || "", offDaysStr).run();
        }
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/delete-staff" && method === "POST") {
        const { slug, id } = await request.json();
        await env.DB.prepare("DELETE FROM staff WHERE id = ? AND company_slug = ?").bind(id, slug || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/add-supplier" && method === "POST") {
        const { slug, name, phone } = await request.json();
        await env.DB.prepare("INSERT INTO suppliers (company_slug, name, phone) VALUES (?, ?, ?)").bind(slug || "", name || "", phone || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/update-supplier" && method === "POST") {
        const { slug, id, name, phone } = await request.json();
        await env.DB.prepare("UPDATE suppliers SET name=?, phone=? WHERE id=? AND company_slug=?").bind(name || "", phone || "", id, slug || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/delete-supplier" && method === "POST") {
        const { slug, id } = await request.json();
        await env.DB.prepare("DELETE FROM suppliers WHERE id=? AND company_slug=?").bind(id, slug || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/add-job" && method === "POST") {
        const { slug, customerName, workType, jobType, scheduledDate, details, assetId, staffId, projectPdf, status } = await request.json();
        let secureDetails = {};
        if (typeof details === "string") {
          try {
            secureDetails = JSON.parse(details);
          } catch (e) {
            secureDetails = {};
          }
        } else if (typeof details === "object" && details !== null) {
          secureDetails = details;
        }
        let creatorId = null;
        let creatorName = "Sistem";
        let creatorRole = "Bilinmiyor";
        let managerId = null;
        let managerName = null;
        let workerId = null;
        let workerName = null;
        if (userAuth) {
          creatorId = String(userAuth.id || "PATRON");
          creatorName = userAuth.role === "Patron" ? userAuth.name || "Patron" : userAuth.name;
          creatorRole = userAuth.role;
          if (userAuth.role === "Y\xF6netici") {
            managerId = String(userAuth.id);
            managerName = userAuth.name;
          }
        }
        const cleanStaffId = staffId && staffId !== "" ? String(staffId) : null;
        const cleanAssetId = assetId && assetId !== "" ? String(assetId) : null;
        if (cleanStaffId) {
          const assignedStaff = await safeFirst(env.DB.prepare("SELECT name, role FROM staff WHERE id = ?").bind(cleanStaffId));
          if (assignedStaff) {
            if (assignedStaff.role === "Y\xF6netici") {
              managerId = cleanStaffId;
              managerName = assignedStaff.name;
            } else if (assignedStaff.role === "Usta") {
              workerId = cleanStaffId;
              workerName = assignedStaff.name;
            }
          }
        }
        const finalStaffId = workerId || managerId || null;
        let finalPdfUrl = null;
        if (projectPdf && projectPdf.startsWith("data:application/pdf") && env.BUCKET) {
          try {
            const base64Data = projectPdf.split(",")[1];
            const byteString = atob(base64Data);
            const buffer = new ArrayBuffer(byteString.length);
            const intArray = new Uint8Array(buffer);
            for (let i = 0; i < byteString.length; i++) {
              intArray[i] = byteString.charCodeAt(i);
            }
            const pdfId = crypto.randomUUID();
            const fileName = `fixlog/${slug}/projects/job-pdf-${pdfId}.pdf`;
            await env.BUCKET.put(fileName, buffer, {
              httpMetadata: { contentType: "application/pdf", cacheControl: "public, max-age=31536000" },
              customMetadata: { "company": slug }
            });
            finalPdfUrl = `https://pub-a78064a5e9304242b0982c01b5778197.r2.dev/${fileName}`;
          } catch (err) {
            console.error("PDF R2'ye y\xFCklenirken hata:", err);
          }
        }
        const finalStatus = status || (jobType === "Planl\u0131" ? "Gelecek" : "Beklemede");
        const nowStr = (/* @__PURE__ */ new Date()).toISOString();
        await env.DB.prepare(`
            INSERT INTO jobs (
                company_slug, customer_name, work_type, job_type, scheduled_date, details, asset_id, status,
                creator_id, creator_name, creator_role, manager_id, manager_name, worker_id, worker_name, staff_id, project_pdf_url, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          slug || "",
          customerName || "",
          workType || "G\xF6rev",
          jobType || "Anl\u0131k",
          scheduledDate || null,
          JSON.stringify(secureDetails),
          cleanAssetId,
          finalStatus,
          creatorId,
          creatorName,
          creatorRole,
          managerId,
          managerName,
          workerId,
          workerName,
          finalStaffId,
          finalPdfUrl,
          nowStr
        ).run();
        if (cleanStaffId) {
          let jobLocationText = `\u{1F464} M\xFC\u015Fteri: ${customerName || "Belirtilmemi\u015F"}`;
          if (cleanAssetId) {
            const assetDetails = await safeFirst(env.DB.prepare("SELECT name, apartmentName, customer_id FROM assets WHERE id = ?").bind(cleanAssetId));
            if (assetDetails) {
              if (assetDetails.apartmentName && assetDetails.apartmentName.trim() !== "") {
                jobLocationText = `\u{1F3E2} Bina: ${assetDetails.apartmentName}
\u{1F6D7} Cihaz: ${assetDetails.name || "Bilinmiyor"}`;
              } else {
                let phone = "Telefon Yok";
                if (assetDetails.customer_id) {
                  const cust = await safeFirst(env.DB.prepare("SELECT contact FROM customers WHERE id = ?").bind(assetDetails.customer_id));
                  if (cust && cust.contact)
                    phone = cust.contact;
                }
                jobLocationText = `\u{1F464} M\xFC\u015Fteri: ${customerName}
\u{1F4DE} \u0130leti\u015Fim: ${phone}`;
              }
            }
          }
          const jobTitle = `\u{1F4CB} Yeni G\xF6rev: ${workType || "Genel \u0130\u015F"}`;
          const jobBody = `${jobLocationText}
L\xFCtfen detaylar\u0131 kontrol edin.`;
          ctx.waitUntil(triggerBeams([`user-${slug}-${cleanStaffId}`], jobTitle, jobBody, `${APP_URL}/${slug}/dashboard`, slug));
        }
        ctx.waitUntil(triggerPusher(`company-${slug}`, "data_updated", {}));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/add-stock" && method === "POST") {
        const data = await request.json();
        let finalSupplierId = data.supplierId;
        if (data.supplierMode === "NEW" && data.newSupplier && data.newSupplier.name) {
          const insertSup = await env.DB.prepare("INSERT INTO suppliers (company_slug, name, phone) VALUES (?, ?, ?) RETURNING id").bind(data.slug || "", data.newSupplier.name, data.newSupplier.phone || "").run();
          finalSupplierId = insertSup.results && insertSup.results.length > 0 ? insertSup.results[0].id : null;
        }
        const safeMinAlert = data.min_alert !== void 0 && data.min_alert !== "" ? Number(data.min_alert) : data.minAlert !== void 0 && data.minAlert !== "" ? Number(data.minAlert) : 5;
        await env.DB.prepare("INSERT INTO stock (company_slug, item_name, category, quantity, unit_name, unit_price, supplier_id, min_alert) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(data.slug || "", data.itemName || data.name || "", data.category || "", data.quantity || 0, data.unitName || data.unit || "Adet", data.unitPrice || 0, finalSupplierId === "NEW" || !finalSupplierId || finalSupplierId === "" ? null : finalSupplierId, safeMinAlert).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/update-stock" && method === "POST") {
        const { slug, id, itemName, quantity, unitName, unitPrice, category, supplierId, minAlert } = await request.json();
        const safeMinAlert = minAlert !== void 0 && minAlert !== null ? Number(minAlert) : 5;
        await env.DB.prepare("UPDATE stock SET item_name=?, quantity=?, unit_name=?, unit_price=?, category=?, supplier_id=?, min_alert=? WHERE id=? AND company_slug=?").bind(itemName || "", quantity || 0, unitName || "Adet", unitPrice || 0, category || "", supplierId && supplierId !== "" ? supplierId : null, safeMinAlert, id, slug || "").run();
        if (Number(quantity) <= safeMinAlert) {
          ctx.waitUntil(triggerBeams([`role-${slug}-ADMIN`], "\u26A0\uFE0F Kritik Stok Uyar\u0131s\u0131", `${itemName} t\xFCkenmek \xFCzere! (Kalan: ${quantity} ${unitName})`, `${APP_URL}/${slug}/manager`, slug));
        }
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/delete-stock" && method === "POST") {
        const { slug, id } = await request.json();
        await env.DB.prepare("DELETE FROM stock WHERE id=? AND company_slug=?").bind(id, slug || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/approve-job" && method === "POST") {
        const { slug, jobId, amount, customerName, paymentStatus } = await request.json();
        let approver = userAuth ? userAuth.name : "Sistem / Patron";
        const finalStatus = paymentStatus || "Tahsil Edildi";
        const finalAmount = amount ? Number(amount) : 0;
        await env.DB.prepare("UPDATE jobs SET status = 'Tamamland\u0131', payment_status = ?, payment_amount = ? WHERE id = ? AND company_slug = ?").bind(finalStatus, finalAmount, jobId, slug || "").run();
        if (finalStatus === "Tahsil Edildi" && finalAmount > 0) {
          await env.DB.prepare("INSERT INTO finances (company_slug, description, amount, type, added_by, job_id) VALUES (?, ?, ?, 'Gelir', ?, ?)").bind(slug || "", `\u0130\u015F Tahsilat\u0131: ${customerName || "M\xFC\u015Fteri"} (\u0130\u015F No: #${jobId})`, finalAmount, approver, jobId).run();
        }
        ctx.waitUntil(triggerPusher(`company-${slug}`, "data_updated", {}));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/generate-monthly-maintenance" && method === "POST") {
        let reqBody = {};
        try {
          reqBody = await request.clone().json();
        } catch (e) {
        }
        const safeSlug = userAuth && userAuth.slug ? userAuth.slug : reqBody.slug || url.searchParams.get("slug");
        if (!safeSlug) {
          return new Response(JSON.stringify({ error: "G\xFCvenlik \u0130hlali: Firma kimli\u011Fi do\u011Frulanamad\u0131." }), { status: 403, headers: corsHeaders });
        }
        const targetMonth = reqBody.month !== void 0 ? reqBody.month : (/* @__PURE__ */ new Date()).getMonth();
        const targetYear = reqBody.year !== void 0 ? reqBody.year : (/* @__PURE__ */ new Date()).getFullYear();
        const company = await safeFirst(env.DB.prepare("SELECT work_days, autopilot_daily_capacity_units FROM companies WHERE slug = ?").bind(safeSlug));
        let workDays = [1, 2, 3, 4, 5, 6];
        if (company && company.work_days) {
          try {
            workDays = JSON.parse(company.work_days);
          } catch (e) {
          }
        }
        const dailyCapacityUnits = company?.autopilot_daily_capacity_units != null && !isNaN(Number(company.autopilot_daily_capacity_units)) && Number(company.autopilot_daily_capacity_units) >= 0.5 ? Number(company.autopilot_daily_capacity_units) : 10;
        const targetMonthStr = String(targetMonth + 1).padStart(2, "0");
        const monthPrefix = `${targetYear}-${targetMonthStr}`;
        const staffList = await safeAll(env.DB.prepare("SELECT id, name, assigned_regions, off_days FROM staff WHERE company_slug = ? AND role = 'Usta' AND is_active = 1").bind(safeSlug));
        if (!staffList || staffList.length === 0) {
          return new Response(JSON.stringify({ error: "Sistemde bak\u0131m atanacak aktif usta bulunamad\u0131. L\xFCtfen \xF6nce usta ekleyin." }), { status: 400, headers: corsHeaders });
        }
        const parseOffDays = /* @__PURE__ */ __name((raw) => {
          if (!raw)
            return /* @__PURE__ */ new Set();
          try {
            const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (Array.isArray(arr))
              return new Set(arr.map(String));
          } catch (e) {
          }
          return /* @__PURE__ */ new Set();
        }, "parseOffDays");
        const staffOffSets = {};
        staffList.forEach((s) => {
          staffOffSets[String(s.id)] = parseOffDays(s.off_days);
        });
        const rawAssets = await safeAll(env.DB.prepare("SELECT * FROM assets WHERE company_slug = ?").bind(safeSlug));
        const allAutopilotAssets = rawAssets.filter((a) => a.is_autopilot == 1 || a.is_autopilot === "1" || a.is_autopilot === "true");
        if (allAutopilotAssets.length === 0) {
          return new Response(JSON.stringify({ error: "Otopilotta olan aktif hi\xE7bir varl\u0131k bulunamad\u0131. L\xFCtfen \xF6nce tesislere otopilot atamas\u0131 yap\u0131n." }), { status: 400, headers: corsHeaders });
        }
        const thisMonthJobs = await safeAll(env.DB.prepare(`
                    SELECT asset_id FROM jobs 
                    WHERE company_slug = ? 
                    AND work_type = 'Periyodik Bak\u0131m' 
                    AND status != '\u0130ptal'
                    AND creator_name = 'Otonom Sistem'
                    AND scheduled_date LIKE ?
                `).bind(safeSlug, `${monthPrefix}%`));
        const existingAssetIds = new Set(thisMonthJobs.map((j) => String(j.asset_id)));
        const assetById = {};
        rawAssets.forEach((a) => {
          assetById[String(a.id)] = a;
        });
        const customers = await safeAll(env.DB.prepare("SELECT id, name, importance_weight FROM customers WHERE company_slug = ?").bind(safeSlug));
        const customerMap = {};
        const customerById = {};
        customers.forEach((c) => {
          customerMap[String(c.id)] = c.name;
          customerById[String(c.id)] = c;
        });
        const effectiveLoad = /* @__PURE__ */ __name((asset) => {
          const aid = asset.customer_id != null ? String(asset.customer_id) : null;
          const cw = aid && customerById[aid] ? Math.max(0.1, Number(customerById[aid].importance_weight) || 1) : 1;
          const aw = asset.maintenance_load_units != null && asset.maintenance_load_units !== "" && !isNaN(Number(asset.maintenance_load_units)) ? Math.max(0.1, Number(asset.maintenance_load_units)) : 1;
          return cw * aw;
        }, "effectiveLoad");
        const openPeriodicJobs = await safeAll(env.DB.prepare(`
                    SELECT asset_id, staff_id FROM jobs
                    WHERE company_slug = ?
                    AND work_type = 'Periyodik Bak\u0131m'
                    AND status NOT IN ('Tamamland\u0131', '\u0130ptal')
                `).bind(safeSlug));
        const openAssetIds = /* @__PURE__ */ new Set();
        openPeriodicJobs.forEach((j) => {
          if (j.asset_id)
            openAssetIds.add(String(j.asset_id));
        });
        const assets = allAutopilotAssets.filter(
          (a) => !existingAssetIds.has(String(a.id)) && !openAssetIds.has(String(a.id))
        );
        if (assets.length === 0) {
          return new Response(JSON.stringify({ success: true, message: "Otopilot: Bu ay i\xE7in ek plan gerekmiyor (kay\u0131tlar olu\u015Fturulmu\u015F veya tamamlanmam\u0131\u015F a\xE7\u0131k periyodik i\u015F var)." }), { headers: corsHeaders });
        }
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        let availableDates = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(targetYear, targetMonth, day);
          const dayOfWeek = date.getDay();
          const mappedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
          if (workDays.includes(mappedDay)) {
            const dateStr = date.toISOString().split("T")[0];
            if (targetYear === (/* @__PURE__ */ new Date()).getFullYear() && targetMonth === (/* @__PURE__ */ new Date()).getMonth()) {
              if (dateStr >= todayStr) {
                availableDates.push(dateStr);
              }
            } else {
              availableDates.push(dateStr);
            }
          }
        }
        if (availableDates.length === 0) {
          return new Response(JSON.stringify({ error: "Se\xE7ilen ayda ileriye d\xF6n\xFCk \xE7al\u0131\u015Fma g\xFCn\xFC bulunmuyor." }), { status: 400, headers: corsHeaders });
        }
        const sortedAssets = assets.map((a) => ({ asset: a, loadUnits: effectiveLoad(a) })).sort((x, y) => y.loadUnits - x.loadUnits);
        const staffDayUnits = {};
        const getDayLoad = /* @__PURE__ */ __name((sid, d) => staffDayUnits[sid] && staffDayUnits[sid][d] ? staffDayUnits[sid][d] : 0, "getDayLoad");
        const addDayLoad = /* @__PURE__ */ __name((sid, d, units) => {
          if (!staffDayUnits[sid])
            staffDayUnits[sid] = {};
          staffDayUnits[sid][d] = getDayLoad(sid, d) + units;
        }, "addDayLoad");
        const sumStaffLoads = /* @__PURE__ */ __name((sid) => {
          const o = staffDayUnits[sid] || {};
          return Object.values(o).reduce((a, b) => a + b, 0);
        }, "sumStaffLoads");
        const backlogByStaff = {};
        for (const j of openPeriodicJobs) {
          const sid = j.staff_id != null ? String(j.staff_id) : null;
          if (!sid || !staffList.some((s) => String(s.id) === sid))
            continue;
          const ast = assetById[String(j.asset_id)];
          if (!ast)
            continue;
          backlogByStaff[sid] = (backlogByStaff[sid] || 0) + effectiveLoad(ast);
        }
        let backlogTotalUnits = 0;
        for (const sid of Object.keys(backlogByStaff)) {
          backlogTotalUnits += backlogByStaff[sid];
          let rem = backlogByStaff[sid];
          for (const dateStr of availableDates) {
            if (rem <= 0)
              break;
            const chunk = Math.min(dailyCapacityUnits, rem);
            addDayLoad(sid, dateStr, chunk);
            rem -= chunk;
          }
          if (rem > 0 && availableDates.length > 0) {
            addDayLoad(sid, availableDates[availableDates.length - 1], rem);
          }
        }
        const getEligibleStaff = /* @__PURE__ */ __name((asset) => {
          if (asset.route_staff_id && staffList.some((s) => String(s.id) === String(asset.route_staff_id))) {
            return staffList.filter((s) => String(s.id) === String(asset.route_staff_id));
          }
          let eligible = staffList;
          if (asset.region) {
            const regional = staffList.filter((s) => {
              if (!s.assigned_regions)
                return false;
              return s.assigned_regions.split(",").map((r) => r.trim()).includes(asset.region);
            });
            if (regional.length > 0)
              eligible = regional;
          }
          return eligible;
        }, "getEligibleStaff");
        const scheduleRows = [];
        const nowStr = (/* @__PURE__ */ new Date()).toISOString();
        for (const row of sortedAssets) {
          const asset = row.asset;
          const loadUnits = row.loadUnits;
          let eligible = getEligibleStaff(asset);
          if (eligible.length === 0)
            eligible = staffList;
          let best = null;
          let bestScore = Infinity;
          for (const dateStr of availableDates) {
            for (const staff of eligible) {
              const sid = String(staff.id);
              if (staffOffSets[sid] && staffOffSets[sid].has(dateStr))
                continue;
              const cur = getDayLoad(sid, dateStr);
              if (cur + loadUnits <= dailyCapacityUnits + 1e-9) {
                const score = cur * 1e4 + sumStaffLoads(sid);
                if (score < bestScore) {
                  bestScore = score;
                  best = { sid, dateStr };
                }
              }
            }
          }
          if (!best) {
            bestScore = Infinity;
            for (const dateStr of availableDates) {
              for (const staff of eligible) {
                const sid = String(staff.id);
                if (staffOffSets[sid] && staffOffSets[sid].has(dateStr))
                  continue;
                const cur = getDayLoad(sid, dateStr);
                if (cur < bestScore) {
                  bestScore = cur;
                  best = { sid, dateStr };
                }
              }
            }
          }
          if (!best)
            continue;
          addDayLoad(best.sid, best.dateStr, loadUnits);
          const customerName = customerMap[String(asset.customer_id)] || "Ba\u011F\u0131ms\u0131z Varl\u0131k";
          const assetFee = asset.maintenance_fee || 0;
          const assignedStaff = staffList.find((s) => String(s.id) === best.sid);
          const assignedWorkerName = assignedStaff ? assignedStaff.name : "Sistem Atamas\u0131";
          scheduleRows.push({
            asset,
            scheduledDate: best.dateStr,
            assignedStaffId: best.sid,
            assignedWorkerName,
            customerName,
            assetFee
          });
        }
        const jobsToInsert = scheduleRows.map((r) => env.DB.prepare(`
                    INSERT INTO jobs (
                        company_slug, customer_name, work_type, job_type, scheduled_date, asset_id, status, 
                        worker_id, worker_name, staff_id, payment_status, payment_amount, creator_name, creator_role, details, created_at
                    )
                    VALUES (?, ?, 'Periyodik Bak\u0131m', 'Planl\u0131', ?, ?, 'Usta Bekliyor', ?, ?, ?, 'Bekliyor', ?, 'Otonom Sistem', 'Sistem', '{}', ?)
                `).bind(safeSlug, r.customerName, r.scheduledDate, r.asset.id, r.assignedStaffId, r.assignedWorkerName, r.assignedStaffId, r.assetFee, nowStr));
        const workloadCounters = {};
        staffList.forEach((s) => {
          workloadCounters[String(s.id)] = 0;
        });
        scheduleRows.forEach((r) => {
          workloadCounters[r.assignedStaffId] = (workloadCounters[r.assignedStaffId] || 0) + 1;
        });
        if (jobsToInsert.length > 0) {
          const assetUpdateQueries = scheduleRows.map((r) => env.DB.prepare("UPDATE assets SET next_maintenance_date = ? WHERE id = ?").bind(r.scheduledDate, r.asset.id));
          const chunkSize = 50;
          const allQueries = [...jobsToInsert, ...assetUpdateQueries];
          for (let i = 0; i < allQueries.length; i += chunkSize) {
            const chunk = allQueries.slice(i, i + chunkSize);
            await env.DB.batch(chunk);
          }
          Object.keys(workloadCounters).forEach((staffId) => {
            const count = workloadCounters[staffId];
            if (count > 0) {
              ctx.waitUntil(triggerBeams(
                [`user-${safeSlug}-${staffId}`],
                "\u{1F504} Yeni Periyodik Bak\u0131mlar",
                `Fixlog.co Asistan\u0131 rotan\u0131za bu ay i\xE7in ${count} adet periyodik bak\u0131m g\xF6revi ekledi.`,
                `${APP_URL}/${safeSlug}/dashboard`,
                safeSlug
              ));
            }
          });
        }
        const totalUnits = scheduleRows.reduce((acc, r) => acc + effectiveLoad(r.asset), 0);
        return new Response(JSON.stringify({
          success: true,
          message: `${scheduleRows.length} yeni periyodik bak\u0131m planland\u0131 (${totalUnits.toFixed(1)} y\xFCk birimi). G\xFCnl\xFCk kapasite: ${dailyCapacityUnits} birim/usta.` + (backlogTotalUnits > 0 ? ` A\xE7\u0131k/geciken i\u015F y\xFCk\xFC ${backlogTotalUnits.toFixed(1)} birim takvimde rezerve edildi; yeni atamalar buna g\xF6re s\u0131k\u0131ld\u0131.` : "")
        }), { headers: corsHeaders });
      }
      if (url.pathname === "/add-expense" && method === "POST") {
        const { slug, description, amount, addedBy } = await request.json();
        let executor = addedBy || (userAuth ? userAuth.name : "Sistem / Patron");
        await env.DB.prepare("INSERT INTO finances (company_slug, description, amount, type, added_by) VALUES (?, ?, ?, 'Gider', ?)").bind(slug || "", description || "Gider Fi\u015Fi", amount || 0, executor).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/add-income" && method === "POST") {
        const { slug, description, amount, addedBy } = await request.json();
        let executor = addedBy || (userAuth ? userAuth.name : "Sistem / Patron");
        await env.DB.prepare("INSERT INTO finances (company_slug, description, amount, type, added_by) VALUES (?, ?, ?, 'Gelir', ?)").bind(slug || "", description || "Manuel Gelir", amount || 0, executor).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/add-asset" && method === "POST") {
        const data = await request.json();
        let finalCustomerId = data.customerId || data.customer_id;
        if (finalCustomerId === "NEW" && data.newCustomer && data.newCustomer.name) {
          const insertCust = await env.DB.prepare("INSERT INTO customers (company_slug, name, contact, address, tax_info) VALUES (?, ?, ?, ?, ?) RETURNING id").bind(data.slug || "", data.newCustomer.name, data.newCustomer.contact || "", data.newCustomer.address || "", data.newCustomer.taxInfo || data.newCustomer.tax_info || "").run();
          finalCustomerId = insertCust.results && insertCust.results.length > 0 ? insertCust.results[0].id : null;
        }
        const maintenanceFee = Number(data.maintenanceFee || data.maintenance_fee || 0);
        const maintenancePeriod = Number(data.maintenancePeriod || data.maintenance_period || 30);
        const routeStaffId = data.routeStaffId || data.route_staff_id || null;
        const assetDetails = data.assetDetails || data.asset_details || data.deviceDetails || "";
        const finalUuid = data.uuid || crypto.randomUUID();
        const loadUnits = data.maintenance_load_units != null && !isNaN(Number(data.maintenance_load_units)) && Number(data.maintenance_load_units) >= 0.1 ? Number(data.maintenance_load_units) : 1;
        
        // 🚀 YENİ TEKNİK VERİLER
        const elevatorType = data.elevator_type || "";
        const capacity = data.capacity || "";
        const stopsCount = data.stops_count || "";
        const elevatorSpeed = data.elevator_speed || "";
        const elevatorCount = data.elevator_count || "1";

        await env.DB.prepare(`
            INSERT INTO assets (
                company_slug, name, location, apartmentName, asset_details, 
                customer_id, uuid, maintenance_fee, maintenance_period, route_staff_id, region, maintenance_load_units,
                elevator_type, capacity, stops_count, elevator_speed, elevator_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.slug || "", data.name || "", data.location || "", data.apartmentName || "", assetDetails,
          finalCustomerId === "NEW" || !finalCustomerId || finalCustomerId === "" ? null : finalCustomerId,
          finalUuid, maintenanceFee, maintenancePeriod, routeStaffId === "" ? null : routeStaffId, data.region || "", loadUnits,
          elevatorType, capacity, stopsCount, elevatorSpeed, elevatorCount
        ).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (url.pathname === "/update-asset" && method === "POST") {
        const data = await request.json();
        const currentAsset = await safeFirst(env.DB.prepare("SELECT * FROM assets WHERE id = ? AND company_slug = ?").bind(data.id, data.slug || ""));
        if (!currentAsset) {
          return new Response(JSON.stringify({ error: "Varlık bulunamadı" }), { status: 404, headers: corsHeaders });
        }
        const name = data.name !== void 0 ? data.name : currentAsset.name;
        const location = data.location !== void 0 ? data.location : currentAsset.location;
        const apartmentName = data.apartmentName !== void 0 ? data.apartmentName : currentAsset.apartmentName || currentAsset.apartment_name;
        const assetDetails = data.assetDetails !== void 0 ? data.assetDetails : data.asset_details !== void 0 ? data.asset_details : data.deviceDetails !== void 0 ? data.deviceDetails : currentAsset.asset_details;
        const customerId = data.customer_id !== void 0 ? data.customer_id === "" ? null : data.customer_id : currentAsset.customer_id;
        const maintenanceFee = data.maintenanceFee !== void 0 ? Number(data.maintenanceFee) : data.maintenance_fee !== void 0 ? Number(data.maintenance_fee) : currentAsset.maintenance_fee || 0;
        const maintenancePeriod = data.maintenancePeriod !== void 0 ? Number(data.maintenancePeriod) : data.maintenance_period !== void 0 ? Number(data.maintenance_period) : currentAsset.maintenance_period || 30;
        const routeStaffId = data.routeStaffId !== void 0 ? data.routeStaffId : data.route_staff_id !== void 0 ? data.route_staff_id : currentAsset.route_staff_id;
        const isAutopilot = data.is_autopilot !== void 0 ? data.is_autopilot : currentAsset.is_autopilot;
        const lastCollectionDate = data.last_collection_date !== void 0 ? data.last_collection_date : currentAsset.last_collection_date;
        const region = data.region !== void 0 ? data.region : currentAsset.region;
        const maintenanceLoadUnits = data.maintenance_load_units !== void 0 ? data.maintenance_load_units != null && !isNaN(Number(data.maintenance_load_units)) && Number(data.maintenance_load_units) >= 0.1 ? Number(data.maintenance_load_units) : 1 : currentAsset.maintenance_load_units != null ? Number(currentAsset.maintenance_load_units) : 1;
        
        // 🚀 YENİ TEKNİK VERİLER
        const elevatorType = data.elevator_type !== void 0 ? data.elevator_type : currentAsset.elevator_type;
        const capacity = data.capacity !== void 0 ? data.capacity : currentAsset.capacity;
        const stopsCount = data.stops_count !== void 0 ? data.stops_count : currentAsset.stops_count;
        const elevatorSpeed = data.elevator_speed !== void 0 ? data.elevator_speed : currentAsset.elevator_speed;
        const elevatorCount = data.elevator_count !== void 0 ? data.elevator_count : currentAsset.elevator_count;

        await env.DB.prepare(`
            UPDATE assets SET 
                name = ?, location = ?, apartmentName = ?, asset_details = ?, 
                customer_id = ?, maintenance_fee = ?, maintenance_period = ?, route_staff_id = ?,
                is_autopilot = ?, last_collection_date = ?, region = ?, maintenance_load_units = ?,
                elevator_type = ?, capacity = ?, stops_count = ?, elevator_speed = ?, elevator_count = ?
            WHERE id = ? AND company_slug = ?
        `).bind(
          name || "", location || "", apartmentName || "", assetDetails || "", customerId,
          maintenanceFee, maintenancePeriod, routeStaffId === "" ? null : routeStaffId,
          isAutopilot, lastCollectionDate, region || "", maintenanceLoadUnits,
          elevatorType, capacity, stopsCount, elevatorSpeed, elevatorCount,
          data.id, data.slug || ""
        ).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/delete-asset" && method === "POST") {
        const { slug, id } = await request.json();
        await env.DB.prepare("DELETE FROM assets WHERE id = ? AND company_slug = ?").bind(id, slug || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/add-customer" && method === "POST") {
        const data = await request.json();
        const impW = data.importance_weight != null && !isNaN(Number(data.importance_weight)) && Number(data.importance_weight) >= 0.1 ? Number(data.importance_weight) : 1;
        const insertCust = await env.DB.prepare("INSERT INTO customers (company_slug, name, contact, address, tax_info, importance_weight) VALUES (?, ?, ?, ?, ?, ?) RETURNING id").bind(data.slug || "", data.name || "", data.contact || "", data.address || "", data.taxInfo || data.tax_info || "", impW).run();
        const newCustId = insertCust.results && insertCust.results.length > 0 ? insertCust.results[0].id : null;
        const finalAssetAction = data.linked_asset_id || data.assetAction;
        if (finalAssetAction === "NEW" && data.newAsset && data.newAsset.name) {
          await env.DB.prepare("INSERT INTO assets (company_slug, name, location, apartmentName, asset_details, customer_id) VALUES (?, ?, ?, ?, ?, ?)").bind(data.slug || "", data.newAsset.name, data.newAsset.location || "", data.newAsset.apartmentName || "", data.newAsset.deviceDetails || "", newCustId).run();
        } else if (finalAssetAction && finalAssetAction !== "NONE" && finalAssetAction !== "NEW") {
          await env.DB.prepare("UPDATE assets SET customer_id = ? WHERE id = ? AND company_slug = ?").bind(newCustId, finalAssetAction, data.slug || "").run();
        }
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/update-customer" && method === "POST") {
        const data = await request.json();
        const impW = data.importance_weight != null && !isNaN(Number(data.importance_weight)) && Number(data.importance_weight) >= 0.1 ? Number(data.importance_weight) : 1;
        await env.DB.prepare("UPDATE customers SET name = ?, contact = ?, address = ?, tax_info = ?, importance_weight = ? WHERE id = ? AND company_slug = ?").bind(data.name || "", data.contact || "", data.address || "", data.taxInfo || data.tax_info || "", impW, data.id, data.slug || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/delete-customer" && method === "POST") {
        const { slug, id } = await request.json();
        await env.DB.prepare("DELETE FROM customers WHERE id = ? AND company_slug = ?").bind(id, slug || "").run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/bulk-import" && method === "POST") {
        const { slug, items } = await request.json();
        if (!items || !items.length) {
          return new Response(JSON.stringify({ error: "Veri bulunamad\u0131" }), { status: 400, headers: corsHeaders });
        }
        const generateCustKey = /* @__PURE__ */ __name((name) => {
          return name ? name.toLowerCase().trim() : "";
        }, "generateCustKey");
        let customerMap = {};
        const existingCustomers = await safeAll(env.DB.prepare("SELECT id, name FROM customers WHERE company_slug = ?").bind(slug));
        existingCustomers.forEach((c) => {
          if (c.name) {
            const key = generateCustKey(c.name);
            customerMap[key] = c.id;
          }
        });
        const newCustomerStatements = [];
        const uniqueNewCustomers = /* @__PURE__ */ new Set();
        for (const item of items) {
          const custName = item.customerName ? item.customerName.trim() : null;
          if (custName) {
            const key = generateCustKey(custName);
            if (!customerMap[key] && !uniqueNewCustomers.has(key)) {
              uniqueNewCustomers.add(key);
              let rawTax = item.taxInfo || item.tax_info || "";
              let safeTax = String(rawTax).trim();
              if (safeTax.endsWith(".0")) {
                safeTax = safeTax.slice(0, -2);
              }
              newCustomerStatements.push(
                env.DB.prepare("INSERT INTO customers (company_slug, name, contact, address, tax_info) VALUES (?, ?, ?, ?, ?)").bind(slug, custName, item.customerPhone || "", item.location || "", safeTax)
              );
            }
          }
        }
        if (newCustomerStatements.length > 0) {
          const chunkSize = 50;
          for (let i = 0; i < newCustomerStatements.length; i += chunkSize) {
            const chunk = newCustomerStatements.slice(i, i + chunkSize);
            await env.DB.batch(chunk);
          }
          const updatedCustomers = await safeAll(env.DB.prepare("SELECT id, name FROM customers WHERE company_slug = ?").bind(slug));
          updatedCustomers.forEach((c) => {
            if (c.name)
              customerMap[generateCustKey(c.name)] = c.id;
          });
        }
        const assetStatements = [];
        for (const item of items) {
          const custName = item.customerName ? item.customerName.trim() : null;
          const mappedCustomerId = custName ? customerMap[generateCustKey(custName)] : null;
          const assetName = item.assetType || "Bilinmeyen Cihaz";
          const apartmentName = item.apartmentName || "";
          const location = item.location || "";
          const details = item.assetDetails || "";
          const uuid = crypto.randomUUID();
          const maintenancePeriod = item.maintenance_period ? Number(item.maintenance_period) : 30;
          const maintenanceFee = item.maintenanceFee ? Number(item.maintenanceFee) : 0;
          const region = item.district || item.region || item.ilce || "";
          assetStatements.push(
            env.DB.prepare("INSERT INTO assets (company_slug, name, location, apartmentName, asset_details, customer_id, uuid, maintenance_period, maintenance_fee, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(slug, assetName, location, apartmentName, details, mappedCustomerId, uuid, maintenancePeriod, maintenanceFee, region)
          );
        }
        if (assetStatements.length > 0) {
          const chunkSize = 100;
          for (let i = 0; i < assetStatements.length; i += chunkSize) {
            const chunk = assetStatements.slice(i, i + chunkSize);
            await env.DB.batch(chunk);
          }
        }
        return new Response(JSON.stringify({ success: true, importedCount: assetStatements.length }), { headers: corsHeaders });
      }
      if (url.pathname === "/get-archived-messages" && method === "GET") {
        const slug = url.searchParams.get("slug");
        if (!env.BUCKET)
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        const objects = await env.BUCKET.list({ prefix: `global-archives/messages/` });
        if (!objects || !objects.objects || objects.objects.length === 0)
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        let allMsgs = [];
        for (const obj of objects.objects) {
          const file = await env.BUCKET.get(obj.key);
          if (file) {
            try {
              const data = await file.json();
              if (Array.isArray(data)) {
                allMsgs = [...allMsgs, ...data.filter((m) => m.company_slug === slug)];
              }
            } catch (err) {
              console.error("Ar\u015Fiv dosyas\u0131 JSON parse hatas\u0131:", err);
            }
          }
        }
        return new Response(JSON.stringify(allMsgs), { headers: corsHeaders });
      }
      if (url.pathname === "/get-recent-history" && method === "GET") {
        const slug = url.searchParams.get("slug");
        if (!slug)
          return new Response(JSON.stringify({ error: "Eksik parametre" }), { status: 400, headers: corsHeaders });
        const recentJobs = await safeAll(env.DB.prepare("SELECT * FROM jobs WHERE company_slug = ? AND status = 'Tamamland\u0131' ORDER BY created_at DESC LIMIT 200").bind(slug));
        const mappedJobs = (recentJobs || []).map((j) => {
          let details = {};
          try {
            details = JSON.parse(j.details || "{}");
          } catch (e) {
          }
          let photos = [];
          try {
            photos = JSON.parse(j.photo_urls || "[]");
          } catch (e) {
          }
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
            const filtered = data.filter((j) => {
              const matchSlug = j.company_slug === slug;
              const matchAsset = assetId ? String(j.asset_id) === String(assetId) : true;
              return matchSlug && matchAsset;
            }).map((j) => {
              let details = {};
              try {
                details = JSON.parse(j.details || "{}");
              } catch (e) {
              }
              let photos = [];
              try {
                photos = JSON.parse(j.photo_urls || "[]");
              } catch (e) {
              }
              return { ...j, details, photos };
            });
            allArchived = [...allArchived, ...filtered];
          }
        }
        return new Response(JSON.stringify(allArchived), { headers: corsHeaders });
      }
      if (url.pathname === "/send-message" && method === "POST") {
        const { slug, senderId, receiverId, message, tempId } = await request.json();
        const trustedSlug = userAuth?.slug;
        const trustedSenderId = userAuth?.role === "Patron" ? "PATRON" : String(userAuth?.id || "");
        if (!trustedSlug || slug !== trustedSlug || !trustedSenderId || !receiverId || typeof message !== "string" || !message.trim() || message.length > 5000) return new Response(JSON.stringify({ error: "Mesaj verisi geçersiz." }), { status: 400, headers: corsHeaders });
        if (receiverId !== "PATRON") {
          const recipient = await safeFirst(env.DB.prepare("SELECT id FROM staff WHERE id = ? AND company_slug = ? AND is_active = 1").bind(receiverId, trustedSlug));
          if (!recipient) return new Response(JSON.stringify({ error: "Alıcı bulunamadı." }), { status: 404, headers: corsHeaders });
        }
        const insertResult = await env.DB.prepare("INSERT INTO messages (company_slug, sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?, 0) RETURNING id, created_at").bind(trustedSlug, trustedSenderId, String(receiverId), message.trim()).all();
        const insertRow = insertResult?.results?.[0];
        let pusherResult = null;
        if (insertRow) {
          pusherResult = await triggerPusher(`presence-chat-${trustedSlug}`, "new-message", {
            id: insertRow.id,
            _tempId: tempId,
            sender_id: trustedSenderId,
            receiver_id: String(receiverId),
            message,
            created_at: insertRow.created_at,
            is_read: 0
          });
          ctx.waitUntil((async () => {
            let senderName = "Yeni Mesaj";
            if (trustedSenderId === "PATRON") {
              const company = await safeFirst(env.DB.prepare("SELECT owner_name FROM companies WHERE slug = ?").bind(trustedSlug));
              senderName = company?.owner_name || "Firma Y\xF6neticisi";
            } else {
              const staffUser = await safeFirst(env.DB.prepare("SELECT name FROM staff WHERE id = ? AND company_slug = ?").bind(trustedSenderId, trustedSlug));
              if (staffUser)
                senderName = staffUser.name;
            }
            const targetInterest = receiverId === "PATRON" ? `user-${trustedSlug}-PATRON` : `user-${trustedSlug}-${receiverId}`;
            await triggerBeams([targetInterest], "Yeni Mesaj", `${senderName}: ${message.trim()}`, `${APP_URL}/${trustedSlug}/manager`, trustedSlug);
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
        const trustedSlug = userAuth?.slug;
        const trustedReaderId = userAuth?.role === "Patron" ? "PATRON" : String(userAuth?.id || "");
        if (!trustedSlug || slug !== trustedSlug || String(readerId) !== trustedReaderId || !senderId) return new Response(JSON.stringify({ error: "Mesaj yetkisi doğrulanamadı." }), { status: 403, headers: corsHeaders });
        await env.DB.prepare("UPDATE messages SET is_read = 1 WHERE company_slug = ? AND receiver_id = ? AND sender_id = ? AND is_read = 0").bind(trustedSlug, trustedReaderId, String(senderId)).run();
        ctx.waitUntil(triggerPusher(`presence-chat-${trustedSlug}`, "messages-read", { readerId: trustedReaderId, senderId: String(senderId) }));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/get-messages" && method === "GET") {
        const slug = url.searchParams.get("slug");
        const staffId = url.searchParams.get("staffId");
        const trustedSlug = userAuth?.slug;
        if (!trustedSlug || slug !== trustedSlug) return new Response(JSON.stringify({ error: "Firma doğrulanamadı." }), { status: 403, headers: corsHeaders });
        const selfId = userAuth.role === "Patron" ? "PATRON" : String(userAuth.id);
        const results = userAuth.role === "Usta"
          ? staffId === selfId
            ? await safeAll(env.DB.prepare("SELECT id, company_slug, sender_id, receiver_id, message, created_at, is_read FROM messages WHERE company_slug = ? AND (sender_id = ? OR receiver_id = ?) ORDER BY created_at DESC LIMIT 75").bind(trustedSlug, selfId, selfId))
            : await safeAll(env.DB.prepare("SELECT id, company_slug, sender_id, receiver_id, message, created_at, is_read FROM messages WHERE company_slug = ? AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) ORDER BY created_at DESC LIMIT 75").bind(trustedSlug, selfId, staffId, staffId, selfId))
          : await safeAll(env.DB.prepare("SELECT id, company_slug, sender_id, receiver_id, message, created_at, is_read FROM messages WHERE company_slug = ? AND (sender_id = ? OR receiver_id = ? OR sender_id = ? OR receiver_id = ?) ORDER BY created_at DESC LIMIT 75").bind(trustedSlug, staffId || null, staffId || null, staffId && !isNaN(Number(staffId)) ? Number(staffId) : null, staffId && !isNaN(Number(staffId)) ? Number(staffId) : null));
        return new Response(JSON.stringify(results.reverse()), { headers: corsHeaders });
      }
      if (url.pathname === "/update-job" && method === "POST") {
        const requestBody = await request.json();
        const { slug, id, scheduledDate, staffId, taskNote, status, lastEditedBy, workType, photos, customerName, assetId, signatureName, signatureImage, usedMaterials, paymentStatus, paymentAmount } = requestBody;
        const currentJob = await safeFirst(env.DB.prepare("SELECT details, photo_urls, manager_id, manager_name, worker_id, worker_name, staff_id, payment_status, status FROM jobs WHERE id = ? AND company_slug = ?").bind(id, slug || ""));
        if (!currentJob) {
          return new Response(JSON.stringify({ error: "\u0130\u015F bulunamad\u0131" }), { status: 404, headers: corsHeaders });
        }
        if (userAuth.role === "Usta") {
          const ownId = String(userAuth.id);
          if (![currentJob.staff_id, currentJob.worker_id, currentJob.manager_id].some((assignedId) => assignedId != null && String(assignedId) === ownId)) return new Response(JSON.stringify({ error: "Bu görev size atanmamış." }), { status: 403, headers: corsHeaders });
          if ([staffId, workType, customerName, assetId, paymentStatus, paymentAmount].some((value) => value !== undefined)) return new Response(JSON.stringify({ error: "Bu alanları güncelleme yetkiniz yok." }), { status: 403, headers: corsHeaders });
          if (status !== undefined && !["Devam Ediyor", "Sahada", "Onay Bekliyor", "Tamamland\u0131"].includes(status)) return new Response(JSON.stringify({ error: "Görev durumu geçersiz." }), { status: 400, headers: corsHeaders });
        }
        let details = {};
        try {
          details = JSON.parse(currentJob.details || "{}");
        } catch (e) {
        }
        let newManagerId = currentJob.manager_id;
        let newManagerName = currentJob.manager_name;
        let newWorkerId = currentJob.worker_id;
        let newWorkerName = currentJob.worker_name;
        const cleanStaffId = staffId && staffId !== "" ? String(staffId) : null;
        if (cleanStaffId && cleanStaffId !== newWorkerId && cleanStaffId !== newManagerId) {
          const newStaff = await safeFirst(env.DB.prepare("SELECT name, role FROM staff WHERE id = ?").bind(cleanStaffId));
          if (newStaff) {
            if (newStaff.role === "Y\xF6netici") {
              newManagerId = cleanStaffId;
              newManagerName = newStaff.name;
              newWorkerId = null;
              newWorkerName = null;
            } else if (newStaff.role === "Usta") {
              newWorkerId = cleanStaffId;
              newWorkerName = newStaff.name;
              if (userAuth && userAuth.role === "Y\xF6netici" && !newManagerId) {
                newManagerId = String(userAuth.id);
                newManagerName = userAuth.name;
              }
            }
          }
        }
        if (userAuth && userAuth.role === "Y\xF6netici" && (status === "Usta Bekliyor" || status === "Devam Ediyor") && !newManagerId) {
          newManagerId = String(userAuth.id);
          newManagerName = userAuth.name;
        }
        let existingPhotos = [];
        try {
          existingPhotos = JSON.parse(currentJob.photo_urls || "[]");
        } catch (e) {
        }
        const safeUsedMaterials = Array.isArray(usedMaterials) ? usedMaterials : [];
        if (userAuth.role === "Usta" && usedMaterials !== undefined && !Array.isArray(usedMaterials)) return new Response(JSON.stringify({ error: "Kullanılan malzeme listesi geçersiz." }), { status: 400, headers: corsHeaders });
        if (taskNote !== void 0)
          details.note = taskNote;
        if (safeUsedMaterials.length > 0)
          details.usedMaterials = safeUsedMaterials;
        const inventoryTransition = (status === "Tamamland\u0131" || status === "Onay Bekliyor") && currentJob.status !== "Tamamland\u0131" && currentJob.status !== "Onay Bekliyor";
        if (inventoryTransition && safeUsedMaterials.length > 0) {
          const materialTotals = new Map();
          for (const mat of safeUsedMaterials) {
            const quantity = Number(mat?.quantity);
            const stockId = String(mat?.id || "");
            if (!stockId || !Number.isFinite(quantity) || quantity <= 0) return new Response(JSON.stringify({ error: "Kullanılan malzeme miktarı geçersiz." }), { status: 400, headers: corsHeaders });
            materialTotals.set(stockId, (materialTotals.get(stockId) || 0) + quantity);
          }
          const inventoryUpdates = [];
          for (const [stockId, quantity] of materialTotals) {
            const stockBefore = await safeFirst(env.DB.prepare("SELECT quantity, item_name, min_alert, unit_name FROM stock WHERE id = ? AND company_slug = ?").bind(stockId, slug));
            if (!stockBefore || Number(stockBefore.quantity || 0) < quantity) return new Response(JSON.stringify({ error: "Stok miktarı kullanılan malzemeyi karşılamıyor." }), { status: 409, headers: corsHeaders });
            inventoryUpdates.push(env.DB.prepare("UPDATE stock SET quantity = quantity - ? WHERE id = ? AND company_slug = ? AND quantity >= ?").bind(quantity, stockId, slug, quantity));
          }
          await env.DB.batch(inventoryUpdates);
          for (const [stockId] of materialTotals) {
            const updatedStock = await safeFirst(env.DB.prepare("SELECT item_name, quantity, min_alert, unit_name FROM stock WHERE id = ? AND company_slug = ?").bind(stockId, slug));
            if (updatedStock && Number(updatedStock.quantity) <= Number(updatedStock.min_alert)) {
              ctx.waitUntil(triggerBeams([`role-${slug}-ADMIN`], "\u26A0\uFE0F Kritik Stok Uyar\u0131s\u0131", `${updatedStock.item_name} t\xFCkenmek \xFCzere! (Kalan: ${updatedStock.quantity} ${updatedStock.unit_name})`, `${APP_URL}/${slug}/manager`, slug));
            }
          }
        }
        if (lastEditedBy) {
          details.lastEditedBy = lastEditedBy;
          details.lastEditedAt = (/* @__PURE__ */ new Date()).toISOString();
        }
        if (photos && photos.length > 0 && env.BUCKET) {
          const now = /* @__PURE__ */ new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const day = String(now.getDate()).padStart(2, "0");
          for (let i = 0; i < photos.length; i++) {
            const base64Data = photos[i].split(",")[1];
            const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            const fileName = `fixlog/${slug}/photos/${year}/${month}/${day}/job-${id}/foto-${crypto.randomUUID()}.jpg`;
            await env.BUCKET.put(fileName, bytes.buffer, {
              httpMetadata: { contentType: "image/jpeg", cacheControl: "public, max-age=31536000" },
              customMetadata: { "status": "hot", "company": slug, "jobId": String(id) }
            });
            existingPhotos.push(`https://pub-a78064a5e9304242b0982c01b5778197.r2.dev/${fileName}`);
          }
        }
        let finalSignatureUrl = currentJob.signature_url || null;
        let finalSignatureName = currentJob.customer_signature_name || null;
        if (signatureImage && signatureImage.startsWith("data:image/") && env.BUCKET) {
          try {
            const now = /* @__PURE__ */ new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const base64Data = signatureImage.split(",")[1];
            const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            const fileName = `fixlog/${slug}/signatures/${year}/${month}/${day}/job-${id}/sign-${crypto.randomUUID()}.png`;
            await env.BUCKET.put(fileName, bytes.buffer, {
              httpMetadata: { contentType: "image/png", cacheControl: "public, max-age=31536000" },
              customMetadata: { "status": "hot", "company": slug, "jobId": String(id) }
            });
            finalSignatureUrl = `https://pub-a78064a5e9304242b0982c01b5778197.r2.dev/${fileName}`;
            finalSignatureName = signatureName || "Bilinmiyor";
          } catch (err) {
            console.error("\u0130mza R2'ye y\xFCklenirken hata:", err);
          }
        }
        let query = `UPDATE jobs SET details = ?, photo_urls = ?, manager_id = ?, manager_name = ?, worker_id = ?, worker_name = ?, customer_signature_name = ?, signature_url = ?`;
        const params = [JSON.stringify(details), JSON.stringify(existingPhotos), newManagerId, newManagerName, newWorkerId, newWorkerName, finalSignatureName, finalSignatureUrl];
        const finalStaffId = newWorkerId || newManagerId || currentJob.staff_id || null;
        query += `, staff_id = ?`;
        params.push(finalStaffId);
        if (scheduledDate) {
          query += ", scheduled_date = ?";
          params.push(scheduledDate);
        }
        if (status) {
          query += ", status = ?";
          params.push(status);
        }
        if (workType) {
          query += ", work_type = ?";
          params.push(workType);
        }
        if (customerName) {
          query += ", customer_name = ?";
          params.push(customerName);
        }
        if (assetId !== void 0) {
          query += ", asset_id = ?";
          params.push(assetId === "" ? null : assetId);
        }
        if (paymentStatus !== void 0) {
          query += ", payment_status = ?";
          params.push(paymentStatus);
        }
        if (paymentAmount !== void 0) {
          query += ", payment_amount = ?";
          params.push(paymentAmount === "" ? 0 : Number(paymentAmount));
        }
        query += ` WHERE id = ? AND company_slug = ?`;
        params.push(id, slug || "");
        await env.DB.prepare(query).bind(...params).run();
        if (paymentStatus === "Tahsil Edildi" && currentJob.payment_status !== "Tahsil Edildi") {
          const finalAmount = paymentAmount ? Number(paymentAmount) : 0;
          if (finalAmount > 0) {
            const approver = lastEditedBy || "Y\xF6netici";
            await env.DB.prepare("INSERT INTO finances (company_slug, description, amount, type, added_by, job_id) VALUES (?, ?, ?, 'Gelir', ?, ?)").bind(slug || "", `\u0130\u015F Tahsilat\u0131 (D\xFCzenleme): ${customerName || "M\xFC\u015Fteri"} (\u0130\u015F No: #${id})`, finalAmount, approver, id).run();
          }
        }
        if (status === "Devam Ediyor" || status === "Tamamland\u0131" || status === "\u0130ptal") {
          const currentUserId = userAuth ? String(userAuth.id) : null;
          const targetStaffId = finalStaffId ? String(finalStaffId) : null;
          if (currentUserId === targetStaffId) {
            ctx.waitUntil(triggerBeams([`role-${slug}-ADMIN`], "\u{1F504} \u0130\u015F Durumu De\u011Fi\u015Fti", `Saha personeli i\u015F (#${id}) durumunu "${status}" olarak g\xFCncelledi.`, `${APP_URL}/${slug}/manager`, slug));
          } else {
            if (targetStaffId) {
              ctx.waitUntil(triggerBeams([`user-${slug}-${targetStaffId}`], "\u{1F504} \u0130\u015Finiz G\xFCncellendi", `Merkez, \xFCzerinizdeki i\u015Fin durumunu "${status}" yapt\u0131.`, `${APP_URL}/${slug}/dashboard`, slug));
            }
          }
        }
        ctx.waitUntil(triggerPusher(`company-${slug}`, "data_updated", {}));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/request-material" && method === "POST") {
        const { slug, staffId, items, note } = await request.json();
        let staffName = "Personel";
        const staff = await safeFirst(env.DB.prepare("SELECT name FROM staff WHERE id = ? AND company_slug = ?").bind(staffId, slug));
        if (staff)
          staffName = staff.name;
        try {
          const reqId = crypto.randomUUID();
          const now = (/* @__PURE__ */ new Date()).toISOString();
          await env.DB.prepare("INSERT INTO material_requests (id, company_slug, staff_id, items, note, status, created_at) VALUES (?, ?, ?, ?, ?, 'Bekliyor', ?)").bind(reqId, slug, staffId, JSON.stringify(items), note || "", now).run();
        } catch (e) {
          return new Response(JSON.stringify({ error: "Malzeme DB Hatas\u0131: " + e.message }), { status: 500, headers: corsHeaders });
        }
        const itemsText = items.map((item) => `- ${item.name}: ${item.qty} ${item.unit}`).join("\n");
        const finalMessage = `\u{1F4E6} YEN\u0130 MALZEME TALEB\u0130

Talep Eden: ${staffName}

\u0130stenen Malzemeler:
${itemsText}

Not: ${note || "Not girilmemi\u015F."}`;
        ctx.waitUntil(triggerBeams([`role-${slug}-ADMIN`], "\u{1F4E6} Yeni Malzeme Talebi!", finalMessage, `${APP_URL}/${slug}/manager`, slug));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/send-sos" && method === "POST") {
        const { slug, staffId, type, message, location } = await request.json();
        const id = crypto.randomUUID();
        const locString = location ? JSON.stringify(location) : null;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        try {
          await env.DB.prepare("INSERT INTO staff_sos (id, company_slug, staff_id, type, message, location, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Aktif', ?)").bind(id, slug, staffId, type, message || "", locString, now).run();
        } catch (e) {
          try {
            await env.DB.prepare("INSERT INTO staff_sos (company_slug, staff_id, type, message, location, status, created_at) VALUES (?, ?, ?, ?, ?, 'Aktif', ?)").bind(slug, staffId, type, message || "", locString, now).run();
          } catch (e2) {
            return new Response(JSON.stringify({ error: "SOS DB Hatas\u0131: " + e2.message }), { status: 500, headers: corsHeaders });
          }
        }
        let staffName = "Personel";
        const staff = await safeFirst(env.DB.prepare("SELECT name FROM staff WHERE id = ? AND company_slug = ?").bind(staffId, slug));
        if (staff)
          staffName = staff.name;
        const locText = location ? `\u{1F4CD} Konum: http://googleusercontent.com/maps.google.com/maps?q=${location.lat},${location.lng}` : "\u{1F4CD} Konum al\u0131namad\u0131.";
        const finalMessage = `\u{1F6A8} PERSONEL AC\u0130L DURUMU

\u{1F464} Kim: ${staffName}
\u26A0\uFE0F Neden: ${type}${message ? ` - ${message}` : ""}

${locText}`;
        ctx.waitUntil(triggerBeams([`role-${slug}-ADMIN`], "\u{1F6A8} AC\u0130L! PERSONEL SOS", finalMessage, `${APP_URL}/${slug}/manager`, slug));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/public/get-asset" && method === "GET") {
        const uuid = url.searchParams.get("uuid");
        const asset = await safeFirst(env.DB.prepare("SELECT * FROM assets WHERE uuid = ?").bind(uuid));
        if (!asset)
          return new Response(JSON.stringify({ error: "Varl\u0131k bulunamad\u0131" }), { status: 404, headers: corsHeaders });
        const company = await safeFirst(env.DB.prepare("SELECT company_name, emergency_phone, whatsapp_phone, landline_phone, website, logo FROM companies WHERE slug = ?").bind(asset.company_slug));
        const jobsQuery = `
            SELECT j.id, j.work_type, j.status, j.scheduled_date, j.created_at, j.details, s.name as staff_name 
            FROM jobs j
            LEFT JOIN staff s ON j.staff_id = s.id
            WHERE j.asset_id = ? AND j.status IN ('Devam Ediyor', 'Tamamland\u0131') 
            ORDER BY j.created_at DESC 
            LIMIT 15
        `;
        const jobs = await safeAll(env.DB.prepare(jobsQuery).bind(asset.id));
        const responseData = {
          ...asset,
          company_name: company?.company_name || "Firma Bilgisi Yok",
          emergency_phone: company?.emergency_phone || "",
          whatsapp_phone: company?.whatsapp_phone || "",
          landline_phone: company?.landline_phone || "",
          website: company?.website || "",
          logo: company?.logo || "",
          jobs: jobs || []
        };
        return new Response(JSON.stringify(responseData), { headers: corsHeaders });
      }
      if (url.pathname === "/public/trigger-emergency" && method === "POST") {
        const { uuid, company_slug } = await request.json();
        if (!uuid || !company_slug)
          return new Response("Bad Request", { status: 400, headers: corsHeaders });
        const id = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO emergencies (id, asset_id, company_slug, status) VALUES (?, ?, ?, 'Aktif')").bind(id, uuid, company_slug).run();
        const asset = await safeFirst(env.DB.prepare("SELECT name, location, apartmentName FROM assets WHERE uuid = ?").bind(uuid));
        const aptName = asset && asset.apartmentName ? asset.apartmentName : "Bina Belirtilmemi\u015F";
        const assetType = asset && asset.name ? asset.name : "Cihaz T\xFCr\xFC Belirtilmemi\u015F";
        const assetLoc = asset && asset.location ? asset.location : "Konum Belirtilmemi\u015F";
        ctx.waitUntil(triggerBeams(
          [`role-${company_slug}-ADMIN`],
          `\u{1F6A8} KAB\u0130N \u0130\xC7\u0130 AC\u0130L DURUM`,
          `\u{1F3E2} Bina: ${aptName}
\u{1F6D7} Cihaz: ${assetType}
\u{1F4CD} Konum: ${assetLoc}
\u26A0\uFE0F Bu adresten acil yard\u0131m \xE7a\u011Fr\u0131s\u0131 al\u0131nd\u0131!`,
          `${APP_URL}/${company_slug}/manager?tab=emergencies`,
          company_slug
        ));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/public/report-fault" && method === "POST") {
        const { uuid, company_slug, name, phone, description } = await request.json();
        if (!uuid || !company_slug)
          return new Response("Bad Request", { status: 400, headers: corsHeaders });
        const id = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO fault_reports (id, asset_id, company_slug, reporter_name, reporter_phone, description, status) VALUES (?, ?, ?, ?, ?, ?, 'Aktif')").bind(id, uuid, company_slug, name || "", phone || "", description || "").run();
        const asset = await safeFirst(env.DB.prepare("SELECT id, name, location, apartmentName FROM assets WHERE uuid = ?").bind(uuid));
        const aptName = asset && asset.apartmentName ? asset.apartmentName : "Bina Belirtilmemi\u015F";
        const assetType = asset && asset.name ? asset.name : "Cihaz T\xFCr\xFC Belirtilmemi\u015F";
        const assetLoc = asset && asset.location ? asset.location : "Konum Belirtilmemi\u015F";
        const reporterInfo = `${name || "\u0130simsiz"} ${phone ? `(${phone})` : ""}`;
        try {
          const availableUstas = await safeAll(env.DB.prepare("SELECT id, name FROM staff WHERE company_slug = ? AND role = 'Usta' AND branch LIKE '%Ar\u0131za%'").bind(company_slug));
          let assignedWorkerId = null;
          let assignedWorkerName = null;
          if (availableUstas && availableUstas.length > 0) {
            const selectedUsta = availableUstas[Math.floor(Math.random() * availableUstas.length)];
            assignedWorkerId = selectedUsta.id;
            assignedWorkerName = selectedUsta.name;
          }
          const managers = await safeAll(env.DB.prepare("SELECT id, name FROM staff WHERE company_slug = ? AND role IN ('Y\xF6netici')").bind(company_slug));
          let assignedManagerId = null;
          let assignedManagerName = null;
          if (managers && managers.length > 0) {
            const selectedManager = managers[0];
            assignedManagerId = selectedManager.id;
            assignedManagerName = selectedManager.name;
          }
          if (asset && asset.id) {
            const jobId = crypto.randomUUID();
            const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
            await env.DB.prepare(`
                            INSERT INTO jobs (id, company_slug, customer_name, work_type, job_type, asset_id, status, scheduled_date, manager_id, manager_name, worker_id, worker_name, staff_id, creator_name, creator_role, details)
                            VALUES (?, ?, ?, 'Ar\u0131za Kayd\u0131', 'Ar\u0131za', ?, 'Beklemede', ?, ?, ?, ?, ?, ?, 'Otonom Sistem', 'Sistem', ?)
                        `).bind(
              jobId,
              company_slug,
              reporterInfo,
              "Ar\u0131za Kayd\u0131",
              "Ar\u0131za",
              asset.id,
              "Beklemede",
              today,
              assignedManagerId ? String(assignedManagerId) : null,
              assignedManagerName,
              assignedWorkerId ? String(assignedWorkerId) : null,
              assignedWorkerName,
              assignedWorkerId ? String(assignedWorkerId) : assignedManagerId ? String(assignedManagerId) : null,
              JSON.stringify({ note: `M\xFC\u015Fteri Notu: ${description}` })
            ).run();
            if (assignedWorkerId) {
              ctx.waitUntil(triggerBeams(
                [`user-${company_slug}-${assignedWorkerId}`],
                `\u{1F6A8} YEN\u0130 ARIZA G\xD6REV\u0130`,
                `Bina: ${aptName}
Bildiren: ${reporterInfo}
Otomatik olarak size atand\u0131!`,
                `${APP_URL}/${company_slug}/dashboard`,
                company_slug
              ));
            }
          }
        } catch (err) {
          console.error("Otomatik i\u015F atama motoru hatas\u0131:", err);
        }
        ctx.waitUntil(triggerBeams(
          [`role-${company_slug}-ADMIN`],
          `\u{1F6E0}\uFE0F ARIZA OTO-ATANDI`,
          `\u{1F3E2} Bina: ${aptName}
\u{1F6D7} Cihaz: ${assetType}
\u{1F4CD} Konum: ${assetLoc}
\u{1F464} Bildiren: ${reporterInfo}
\u{1F4DD} Not: ${description}`,
          `${APP_URL}/${company_slug}/manager?tab=faults`,
          company_slug
        ));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/resolve-emergency" && method === "POST") {
        const { id, slug } = await request.json();
        await env.DB.prepare("UPDATE emergencies SET status = '\xC7\xF6z\xFCld\xFC' WHERE id = ? AND company_slug = ?").bind(id, slug).run();
        ctx.waitUntil(triggerPusher(`company-${slug}`, "data_updated", {}));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/resolve-fault" && method === "POST") {
        const { id, slug } = await request.json();
        await env.DB.prepare("UPDATE fault_reports SET status = '\xC7\xF6z\xFCld\xFC' WHERE id = ? AND company_slug = ?").bind(id, slug).run();
        ctx.waitUntil(triggerPusher(`company-${slug}`, "data_updated", {}));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/resolve-sos" && method === "POST") {
        const { id, slug } = await request.json();
        await env.DB.prepare("UPDATE staff_sos SET status = '\xC7\xF6z\xFCld\xFC' WHERE id = ? AND company_slug = ?").bind(id, slug).run();
        ctx.waitUntil(triggerPusher(`company-${slug}`, "data_updated", {}));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (url.pathname === "/resolve-material" && method === "POST") {
        const { id, slug } = await request.json();
        const reqData = await safeFirst(env.DB.prepare("SELECT items FROM material_requests WHERE id = ? AND company_slug = ? AND status = 'Bekliyor'").bind(id, slug));
        if (reqData && reqData.items) {
          try {
            const items = JSON.parse(reqData.items);
            for (const item of items) {
              if (item.id && item.qty) {
                await env.DB.prepare("UPDATE stock SET quantity = quantity - ? WHERE id = ? AND company_slug = ?").bind(Number(item.qty), item.id, slug).run();
              }
            }
          } catch (e) {
            console.error("Malzeme d\xFC\u015Fme hatas\u0131: ", e);
          }
        }
        await env.DB.prepare("UPDATE material_requests SET status = 'Onayland\u0131' WHERE id = ? AND company_slug = ?").bind(id, slug).run();
        ctx.waitUntil(triggerPusher(`company-${slug}`, "data_updated", {}));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      const verifyMasterboss = /* @__PURE__ */ __name(async (req) => {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer "))
          return false;
        const token = authHeader.split(" ")[1].replace(/^"|"$/g, "").trim();
        try {
          const parts = token.split(".");
          if (parts.length !== 3)
            return false;
          const [headerB64, payloadB64, signatureB64] = parts;
          const payloadStr = fromBase64Url(payloadB64);
          const payload = JSON.parse(payloadStr);
          if (Date.now() > payload.exp)
            return false;
          if (payload.role !== "Masterboss")
            return false;
          const secret = env.JWT_SECRET;
          if (!secret)
            return false;
          const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
          const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${headerB64}.${payloadB64}`));
          let binarySig = "";
          const sigBytes = new Uint8Array(signatureBuffer);
          for (let i = 0; i < sigBytes.byteLength; i++) {
            binarySig += String.fromCharCode(sigBytes[i]);
          }
          const expectedSignature = btoa(binarySig).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          return signatureB64 === expectedSignature;
        } catch (e) {
          return false;
        }
      }, "verifyMasterboss");
      if (url.pathname === "/masterboss-data" && method === "GET") {
        if (!await verifyMasterboss(request))
          return new Response(JSON.stringify({ error: "Yetkisiz i\u015Flem!" }), { status: 403, headers: corsHeaders });
        const sysSettings = await safeAll(env.DB.prepare("SELECT * FROM system_settings"));
        let globalPricing = { base: 3e3, asset: 50 };
        sysSettings.forEach((s) => {
          if (s.key === "global_base_price")
            globalPricing.base = Number(s.value);
          if (s.key === "global_asset_price")
            globalPricing.asset = Number(s.value);
        });
        const companies = await safeAll(env.DB.prepare("SELECT c.*, (SELECT COUNT(*) FROM staff WHERE company_slug = c.slug) as total_staff, (SELECT COUNT(*) FROM jobs WHERE company_slug = c.slug) as job_count, (SELECT COUNT(*) FROM assets WHERE company_slug = c.slug) as total_assets FROM companies c ORDER BY c.created_at DESC"));
        const companyRewards = await safeAll(env.DB.prepare("SELECT * FROM company_rewards"));
        const rewardsMap = {};
        companyRewards.forEach((r) => {
          rewardsMap[r.company_slug] = {
            balance: r.free_months_balance,
            is_gift: r.has_masterboss_gift
          };
        });
        const companiesWithRewards = companies.map((c) => ({
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
        const currentMonthStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
        const currentYearStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 4);
        if (allJobsWithPhotos && allJobsWithPhotos.length > 0) {
          allJobsWithPhotos.forEach((job) => {
            try {
              const photos = JSON.parse(job.photo_urls || "[]");
              const count = photos.length;
              total_photos += count;
              if (job.created_at && job.created_at.startsWith(currentMonthStr)) {
                monthly_photos += count;
              }
              if (job.created_at && job.created_at.startsWith(currentYearStr)) {
                yearly_photos += count;
              }
            } catch (e) {
            }
          });
        }
        const platformStats = {
          totalCompanies: companies.length,
          activeCompanies: companies.filter((c) => c.subscription_status === "active").length,
          trialCompanies: companies.filter((c) => c.subscription_status === "trialing").length,
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
        let autoReferrals = [];
        try {
          autoReferrals = await safeAll(env.DB.prepare(`
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 SELECT 
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 c1.slug as referred_company_slug, 
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 c2.slug as referrer_company_slug, 
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 c1.referral_rewarded as is_verified,
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 c1.id as id
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 FROM companies c1
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 JOIN companies c2 ON c1.referred_by_id = c2.id
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 WHERE c1.referred_by_id IS NOT NULL
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 ORDER BY c1.created_at DESC
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 `));
        } catch (e) {
        }
        return new Response(JSON.stringify({
          success: true,
          globalPricing,
          companies: companiesWithRewards,
          stats: platformStats,
          tickets: supportTickets,
          referrals: autoReferrals,
          rewards: companyRewards
        }), { headers: corsHeaders });
      }
      if (url.pathname === "/masterboss-resolve-ticket" && method === "POST") {
        if (!await verifyMasterboss(request))
          return new Response(JSON.stringify({ error: "Yetkisiz i\u015Flem!" }), { status: 403, headers: corsHeaders });
        const { ticketId, companySlug, replyMessage, action } = await request.json();
        const ticket = await safeFirst(env.DB.prepare("SELECT replies FROM support_tickets WHERE id = ?").bind(ticketId));
        let repliesArray = [];
        if (ticket) {
          try {
            repliesArray = JSON.parse(ticket.replies || "[]");
          } catch (e) {
            repliesArray = [];
          }
        }
        if (replyMessage && replyMessage.trim() !== "") {
          repliesArray.push({
            sender: "masterboss",
            message: replyMessage,
            date: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        const finalRepliesJSON = JSON.stringify(repliesArray);
        if (action === "reply") {
          await env.DB.prepare("UPDATE support_tickets SET replies = ? WHERE id = ?").bind(finalRepliesJSON, ticketId).run();
        } else {
          await env.DB.prepare("UPDATE support_tickets SET status = '\xC7\xF6z\xFCld\xFC', replies = ? WHERE id = ?").bind(finalRepliesJSON, ticketId).run();
        }
        if (companySlug) {
          const titleText = action === "reply" ? "\u{1F4DE} Destek Talebiniz Yan\u0131tland\u0131" : "\u2705 Destek Talebiniz \xC7\xF6z\xFCld\xFC";
          const bodyText = action === "reply" ? `Ekibimizden yeni bir mesaj var: ${replyMessage}` : "Talebiniz ba\u015Far\u0131yla \xE7\xF6z\xFCme kavu\u015Fturuldu.";
          if (action === "resolve" || action === "reply" && replyMessage) {
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
      if (url.pathname === "/masterboss-company-details" && method === "GET") {
        if (!await verifyMasterboss(request))
          return new Response(JSON.stringify({ error: "Yetkisiz i\u015Flem!" }), { status: 403, headers: corsHeaders });
        const targetSlug = url.searchParams.get("slug");
        if (!targetSlug)
          return new Response(JSON.stringify({ error: "Slug gerekli!" }), { status: 400, headers: corsHeaders });
        const [
          staffCount,
          assetCount,
          stockCount,
          totalJobs,
          monthlyJobs,
          yearlyJobs,
          income,
          expense,
          customerCount,
          supplierCount,
          totalEmergencies,
          activeEmergencies,
          totalFaults,
          activeFaults,
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
        const currentMonthStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
        if (jobsWithPhotos && jobsWithPhotos.length > 0) {
          jobsWithPhotos.forEach((job) => {
            try {
              const photos = JSON.parse(job.photo_urls || "[]");
              const count = photos.length;
              totalPhotos += count;
              if (job.created_at && job.created_at.startsWith(currentMonthStr)) {
                monthlyPhotos += count;
              }
            } catch (e) {
            }
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
      if (url.pathname === "/masterboss-update-subscription" && request.method === "POST") {
        if (!await verifyMasterboss(request))
          return new Response(JSON.stringify({ error: "Yetkisiz i\u015Flem!" }), { status: 403, headers: corsHeaders });
        try {
          const body = await request.json();
          const { companySlug, subscriptionStatus, freeMonths, customDiscount, customAssetPrice, cancelTrial, hasMasterbossGift } = body;
          if (!companySlug) {
            return new Response(JSON.stringify({ success: false, error: "Firma slug eksik." }), { headers: corsHeaders });
          }
          const company = await safeFirst(env.DB.prepare("SELECT * FROM companies WHERE slug = ?").bind(companySlug));
          if (!company) {
            return new Response(JSON.stringify({ success: false, error: "Firma bulunamad\u0131." }), { headers: corsHeaders });
          }
          const updates = [];
          const params = [];
          if (cancelTrial) {
            updates.push("trial_ends_at = NULL");
            updates.push("subscription_status = 'past_due'");
          } else if (subscriptionStatus) {
            updates.push("subscription_status = ?");
            params.push(subscriptionStatus);
          }
          if (customDiscount !== void 0) {
            updates.push("custom_base_price = ?");
            params.push(customDiscount);
          }
          if (customAssetPrice !== void 0) {
            updates.push("custom_per_asset_price = ?");
            params.push(customAssetPrice);
          }
          if (updates.length > 0) {
            const query = `UPDATE companies SET ${updates.join(", ")} WHERE slug = ?`;
            params.push(companySlug);
            await env.DB.prepare(query).bind(...params).run();
          }
          if (subscriptionStatus === "active") {
            const checkRef = await safeFirst(env.DB.prepare("SELECT id, referred_by_id, referral_rewarded FROM companies WHERE slug = ?").bind(companySlug));
            if (checkRef && checkRef.referred_by_id && checkRef.referral_rewarded === 0) {
              const referrer = await safeFirst(env.DB.prepare("SELECT slug FROM companies WHERE id = ?").bind(checkRef.referred_by_id));
              if (referrer) {
                const addReward = /* @__PURE__ */ __name(async (targetSlug) => {
                  await env.DB.prepare("UPDATE companies SET free_months_balance = COALESCE(free_months_balance, 0) + 1 WHERE slug = ?").bind(targetSlug).run();
                }, "addReward");
                await addReward(companySlug);
                await addReward(referrer.slug);
                await env.DB.prepare("UPDATE companies SET referral_rewarded = 1 WHERE slug = ?").bind(companySlug).run();
              }
            }
          }
          if (hasMasterbossGift !== void 0 || freeMonths !== void 0) {
            const finalGiftStatus = hasMasterbossGift === true ? 1 : 0;
            const finalFreeMonths = Number(freeMonths || 0);
            await env.DB.prepare("UPDATE companies SET free_months_balance = ?, has_masterboss_gift = ? WHERE slug = ?").bind(finalFreeMonths, finalGiftStatus, companySlug).run();
          }
          return new Response(JSON.stringify({ success: true, message: "Firma abonelik detaylar\u0131 g\xFCncellendi." }), { headers: corsHeaders });
        } catch (err) {
          console.error("Abonelik G\xFCncelleme Hatas\u0131:", err);
          return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders });
        }
      }
      if (url.pathname === "/masterboss-update-global-pricing" && request.method === "POST") {
        if (!await verifyMasterboss(request))
          return new Response(JSON.stringify({ error: "Yetkisiz işlem!" }), { status: 403, headers: corsHeaders });
        try {
          const { basePrice, assetPrice } = await request.json();
          if (basePrice !== void 0) {
            await env.DB.prepare("UPDATE system_settings SET value = ? WHERE key = 'global_base_price'").bind(String(basePrice)).run();
          }
          if (assetPrice !== void 0) {
            await env.DB.prepare("UPDATE system_settings SET value = ? WHERE key = 'global_asset_price'").bind(String(assetPrice)).run();
          }
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { headers: corsHeaders });
        }
      }

      if (url.pathname === "/add-quote" && method === "POST") {
        const data = await request.json();
        const id = crypto.randomUUID();
        const publicToken = crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36); // 🚀 Müşteri için benzersiz gizli link
        const now = new Date().toISOString();
        const status = data.status || 'Onaylandı'; 

        await env.DB.prepare(`
            INSERT INTO quotes (id, company_slug, quote_type, customer_name, customer_phone, asset_name, quote_details, status, created_at, public_token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, data.company_slug || "", data.quote_type || "", data.customer_name || "", 
            data.customer_phone || "", data.asset_name || "", JSON.stringify(data.quote_details || {}), status, now, publicToken
        ).run();
        
        return new Response(JSON.stringify({ success: true, public_token: publicToken }), { headers: corsHeaders });
      }

      if (url.pathname === "/get-quotes" && method === "GET") {
        const slug = url.searchParams.get("company_slug");
        try {
          const quotes = await safeAll(env.DB.prepare("SELECT * FROM quotes WHERE company_slug = ? ORDER BY created_at DESC").bind(slug));
          return new Response(JSON.stringify({ success: true, data: quotes }), { headers: corsHeaders });
        } catch (e) {
          return new Response(JSON.stringify({ success: true, data: [] }), { headers: corsHeaders });
        }
      }

      if (url.pathname === "/delete-quote" && method === "POST") {
        const { id, company_slug } = await request.json();
        await env.DB.prepare("DELETE FROM quotes WHERE id = ? AND company_slug = ?").bind(id, company_slug).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (url.pathname === "/update-maintenance-contract" && method === "POST") {
        const { slug, template } = await request.json();
        try {
          await env.DB.prepare("UPDATE companies SET maintenance_contract_template = ? WHERE slug = ?").bind(template, slug).run();
        } catch(e) {}
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (url.pathname === "/public/request-quote" && method === "POST") {
        const { company_slug, name, phone, email, type, message } = await request.json();
        if (!company_slug || !name) return new Response("Bad Request", { status: 400, headers: corsHeaders });

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const details = JSON.stringify({ email: email || "", note: message || "Web sitesinden form dolduruldu." });

        // quotes (teklifler) tablosuna 'Web Sitesi Talebi' etiketiyle kaydediyoruz
        await env.DB.prepare(`
          INSERT INTO quotes (id, company_slug, quote_type, customer_name, customer_phone, asset_name, quote_details, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'Web Sitesi Talebi', ?, 'Bekliyor', ?)
        `).bind(id, company_slug, type || "Genel", name, phone || "", details, now).run();

        // Patronun telefonuna bildirim gönderiyoruz
        ctx.waitUntil(triggerBeams(
          [`role-${company_slug}-ADMIN`],
          `🎉 Yeni Müşteri Talebi: ${type}`,
          `${name} web siteniz üzerinden yeni bir teklif talebi gönderdi!`,
          `${APP_URL}/${company_slug}/manager#quotes`,
          company_slug
        ));

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (url.pathname === "/delete-quote" && method === "POST") {
        const { id, company_slug } = await request.json();
        await env.DB.prepare("DELETE FROM quotes WHERE id = ? AND company_slug = ?").bind(id, company_slug).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 🚀 Müşterinin linke tıklayıp teklif detaylarını görmesi için
      if (url.pathname === "/public/get-quote" && method === "GET") {
        const token = url.searchParams.get("token");
        if (!token) return new Response("Token eksik", { status: 400, headers: corsHeaders });

        const quote = await safeFirst(env.DB.prepare("SELECT * FROM quotes WHERE public_token = ?").bind(token));
        if (!quote) return new Response(JSON.stringify({ error: "Teklif bulunamadı veya süresi dolmuş." }), { status: 404, headers: corsHeaders });

        // Firmanın logo ve ismini de gönderelim ki sayfa şık dursun
        const company = await safeFirst(env.DB.prepare("SELECT company_name, owner_name, logo FROM companies WHERE slug = ?").bind(quote.company_slug));

        return new Response(JSON.stringify({ success: true, data: quote, company: company || {} }), { headers: corsHeaders });
      }

      // 🚀 Müşterinin imzasını atıp kaydetmesi için
      if (url.pathname === "/public/sign-quote" && method === "POST") {
        const { token, signatureBase64 } = await request.json();
        if (!token || !signatureBase64) return new Response("Eksik veri", { status: 400, headers: corsHeaders });

        const quote = await safeFirst(env.DB.prepare("SELECT id, company_slug, quote_details FROM quotes WHERE public_token = ?").bind(token));
        if (!quote) return new Response("Bulunamadı", { status: 404, headers: corsHeaders });

        let details = {};
        try { details = JSON.parse(quote.quote_details); } catch(e) {}
        
        // İmzayı detayların içine ekle
        details.customerSignature = signatureBase64;

        // Statüyü 'Müşteri Onayladı' yap ve kaydet
        await env.DB.prepare("UPDATE quotes SET quote_details = ?, status = 'Müşteri Onayladı' WHERE public_token = ?").bind(JSON.stringify(details), token).run();
        
        // Patronun paneline anlık bildirim düşsün
        ctx.waitUntil(triggerPusher(`company-${quote.company_slug}`, "data_updated", {}));
        ctx.waitUntil(triggerBeams([`role-${quote.company_slug}-ADMIN`], "✅ Teklif Onaylandı!", "Bir müşteriniz gönderdiğiniz sözleşmeyi uzaktan imzaladı.", `${APP_URL}/${quote.company_slug}/manager#quotes`, quote.company_slug));

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (url.pathname === "/update-maintenance-contract" && method === "POST") {
        const { slug, template } = await request.json();
        try {
          await env.DB.prepare("UPDATE companies SET maintenance_contract_template = ? WHERE slug = ?").bind(template, slug).run();
        } catch(e) {}
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

            if (url.pathname === "/get-bom-templates" && method === "GET") {
        const requestedSlug =
          url.searchParams.get("company_slug") ||
          url.searchParams.get("slug");

        const allowedRoles = ["Masterboss", "Patron", "Yönetici"];

        if (!userAuth || !allowedRoles.includes(userAuth.role)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "BOM şablonlarını görüntüleme yetkiniz yok."
            }),
            { status: 403, headers: corsHeaders }
          );
        }

        const targetSlug =
          userAuth.role === "Masterboss"
            ? requestedSlug
            : userAuth.slug;

        if (!targetSlug) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Firma kimliği bulunamadı."
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        try {
          const templates = await safeAll(
            env.DB.prepare(
              "SELECT * FROM bom_templates WHERE company_slug = ?"
            ).bind(targetSlug)
          );

          return new Response(
            JSON.stringify({ success: true, data: templates }),
            { headers: corsHeaders }
          );
        } catch (e) {
          console.error("[BOM] Şablonlar okunamadı:", e);

          return new Response(
            JSON.stringify({
              success: false,
              error: "BOM şablonları yüklenemedi."
            }),
            { status: 500, headers: corsHeaders }
          );
        }
      }

            if (url.pathname === "/add-bom-template" && method === "POST") {
        const reqBody = await request.json();

        const allowedRoles = ["Masterboss", "Patron", "Yönetici"];

        if (!userAuth || !allowedRoles.includes(userAuth.role)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "BOM şablonu oluşturma yetkiniz yok."
            }),
            { status: 403, headers: corsHeaders }
          );
        }

        const id = reqBody.id;
        const name = reqBody.name;
        const description = reqBody.description;
        const items = reqBody.items;

        const targetSlug =
          userAuth.role === "Masterboss"
            ? (reqBody.company_slug || reqBody.slug)
            : userAuth.slug;

        if (!targetSlug || !id || !name) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Firma, şablon kimliği ve şablon adı zorunludur."
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        await env.DB.prepare(`
          INSERT INTO bom_templates (id, company_slug, name, description, items)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          id,
          targetSlug,
          name,
          description || "",
          items || "[]"
        ).run();

        return new Response(
          JSON.stringify({ success: true }),
          { headers: corsHeaders }
        );
      }

            if (url.pathname === "/update-bom-template" && method === "POST") {
        const reqBody = await request.json();

        const allowedRoles = ["Masterboss", "Patron", "Yönetici"];

        if (!userAuth || !allowedRoles.includes(userAuth.role)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "BOM şablonu düzenleme yetkiniz yok."
            }),
            { status: 403, headers: corsHeaders }
          );
        }

        const id = reqBody.id;
        const name = reqBody.name;
        const description = reqBody.description;
        const items = reqBody.items;

        const targetSlug =
          userAuth.role === "Masterboss"
            ? (reqBody.company_slug || reqBody.slug)
            : userAuth.slug;

        if (!targetSlug || !id || !name) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Firma, şablon kimliği ve şablon adı zorunludur."
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        const result = await env.DB.prepare(`
          UPDATE bom_templates
          SET name = ?, description = ?, items = ?
          WHERE id = ? AND company_slug = ?
        `).bind(
          name,
          description || "",
          items || "[]",
          id,
          targetSlug
        ).run();

        if (!result.meta || result.meta.changes === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Şablon bulunamadı veya güncellenemedi."
            }),
            { status: 404, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: corsHeaders }
        );
      }

            if (url.pathname === "/delete-bom-template" && method === "POST") {
        const reqBody = await request.json();

        const allowedRoles = ["Masterboss", "Patron", "Yönetici"];

        if (!userAuth || !allowedRoles.includes(userAuth.role)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "BOM şablonu silme yetkiniz yok."
            }),
            { status: 403, headers: corsHeaders }
          );
        }

        const id = reqBody.id;

        const targetSlug =
          userAuth.role === "Masterboss"
            ? (reqBody.company_slug || reqBody.slug)
            : userAuth.slug;

        if (!targetSlug || !id) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Firma veya şablon kimliği bulunamadı."
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        const result = await env.DB.prepare(
          "DELETE FROM bom_templates WHERE id = ? AND company_slug = ?"
        ).bind(id, targetSlug).run();

        if (!result.meta || result.meta.changes === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Şablon bulunamadı veya silinemedi."
            }),
            { status: 404, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: corsHeaders }
        );
      }

      const purchaseOrderRoles = ["Masterboss", "Patron", "Y\u00f6netici"];
      const purchaseOrderError = (message, status = 400) => new Response(
        JSON.stringify({ success: false, error: message }),
        { status, headers: corsHeaders }
      );
      const normalizePurchaseItems = (rawItems) => {
        let parsed = rawItems;
        if (typeof parsed === "string") {
          try { parsed = JSON.parse(parsed); } catch { return null; }
        }
        if (!Array.isArray(parsed) || parsed.length === 0) return null;
        const items = parsed.map((item) => ({
          stock_id: String(item?.stock_id ?? "").trim(),
          ordered_quantity: Number(item?.ordered_quantity ?? item?.quantity),
          received_quantity: Number(item?.received_quantity || 0),
          unit_price: Number(item?.unit_price || 0)
        }));
        if (items.some((item) => !item.stock_id || !Number.isFinite(item.ordered_quantity) || item.ordered_quantity <= 0 || !Number.isFinite(item.received_quantity) || item.received_quantity < 0 || item.received_quantity > item.ordered_quantity || !Number.isFinite(item.unit_price) || item.unit_price < 0)) return null;
        return items;
      };
      const purchaseOrderValue = (items) => items.reduce((sum, item) => sum + item.ordered_quantity * item.unit_price, 0);
      const purchaseOrderStatus = (items) => {
        const ordered = items.reduce((sum, item) => sum + item.ordered_quantity, 0);
        const received = items.reduce((sum, item) => sum + item.received_quantity, 0);
        if (received <= 0) return "Bekliyor";
        if (received >= ordered) return "Tamamland\u0131";
        return "K\u0131smi Teslim";
      };
      const canManagePurchaseOrders = userAuth && purchaseOrderRoles.includes(userAuth.role);

      if (url.pathname === "/get-purchase-orders" && method === "GET") {
        if (!canManagePurchaseOrders) return purchaseOrderError("Satın alma siparişlerini görüntüleme yetkiniz yok.", 403);
        const requestedSlug = url.searchParams.get("company_slug") || url.searchParams.get("slug");
        const targetSlug = userAuth.role === "Masterboss" ? requestedSlug : userAuth.slug;
        if (!targetSlug) return purchaseOrderError("Firma bilgisi bulunamadı.");
        const orders = await safeAll(env.DB.prepare("SELECT * FROM purchase_orders WHERE company_slug = ? ORDER BY created_at DESC").bind(targetSlug));
        return new Response(JSON.stringify({ success: true, data: orders || [] }), { headers: corsHeaders });
      }

      if (url.pathname === "/add-purchase-order" && method === "POST") {
        const body = await request.json();
        if (!canManagePurchaseOrders) return purchaseOrderError("Sipariş oluşturma yetkiniz yok.", 403);
        const targetSlug = userAuth.role === "Masterboss" ? (body.company_slug || body.slug) : userAuth.slug;
        if (!targetSlug || !body.id || !String(body.name || "").trim() || !body.supplier_id) return purchaseOrderError("Firma, sipariş adı ve tedarikçi zorunludur.");
        const supplier = await safeFirst(env.DB.prepare("SELECT id FROM suppliers WHERE id = ? AND company_slug = ?").bind(body.supplier_id, targetSlug));
        if (!supplier) return purchaseOrderError("Seçilen tedarikçi bulunamadı.");
        const items = normalizePurchaseItems(body.items);
        if (!items) return purchaseOrderError("Siparişte geçerli en az bir malzeme bulunmalıdır.");
        for (const item of items) {
          const stock = await safeFirst(env.DB.prepare("SELECT id FROM stock WHERE id = ? AND company_slug = ?").bind(item.stock_id, targetSlug));
          if (!stock) return purchaseOrderError("Sipariş kalemlerinden biri bu firmaya ait stoklarda bulunamadı.");
        }
        const status = purchaseOrderStatus(items);
        await env.DB.prepare("INSERT INTO purchase_orders (id, company_slug, name, supplier_id, status, items, total_value) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(String(body.id), targetSlug, String(body.name).trim(), supplier.id, status, JSON.stringify(items), purchaseOrderValue(items)).run();
        ctx.waitUntil(triggerPusher(`company-${targetSlug}`, "data_updated", {}));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (url.pathname === "/update-purchase-order" && method === "POST") {
        const body = await request.json();
        if (!canManagePurchaseOrders) return purchaseOrderError("Sipariş düzenleme yetkiniz yok.", 403);
        const targetSlug = userAuth.role === "Masterboss" ? (body.company_slug || body.slug) : userAuth.slug;
        if (!targetSlug || !body.id || !String(body.name || "").trim() || !body.supplier_id) return purchaseOrderError("Firma, sipariş adı ve tedarikçi zorunludur.");
        const previous = await safeFirst(env.DB.prepare("SELECT * FROM purchase_orders WHERE id = ? AND company_slug = ?").bind(body.id, targetSlug));
        if (!previous) return purchaseOrderError("Sipariş bulunamadı.", 404);
        if (previous.status === "\u0130ptal" || previous.status === "Iptal") return purchaseOrderError("\u0130ptal edilmi\u015f sipari\u015f d\u00fczenlenemez.", 409);
        const supplier = await safeFirst(env.DB.prepare("SELECT id FROM suppliers WHERE id = ? AND company_slug = ?").bind(body.supplier_id, targetSlug));
        if (!supplier) return purchaseOrderError("Seçilen tedarikçi bulunamadı.");
        const items = normalizePurchaseItems(body.items);
        if (!items) return purchaseOrderError("Siparişte geçerli en az bir malzeme bulunmalıdır.");
        let previousItems = [];
        try { previousItems = normalizePurchaseItems(previous.items) || []; } catch {}
        const oldReceived = new Map();
        const nextReceived = new Map();
        previousItems.forEach((item) => oldReceived.set(item.stock_id, (oldReceived.get(item.stock_id) || 0) + item.received_quantity));
        items.forEach((item) => nextReceived.set(item.stock_id, (nextReceived.get(item.stock_id) || 0) + item.received_quantity));
        const stockIds = new Set([...oldReceived.keys(), ...nextReceived.keys()]);
        const adjustments = [];
        for (const stockId of stockIds) {
          const delta = (nextReceived.get(stockId) || 0) - (oldReceived.get(stockId) || 0);
          if (delta === 0) continue;
          const stock = await safeFirst(env.DB.prepare("SELECT quantity FROM stock WHERE id = ? AND company_slug = ?").bind(stockId, targetSlug));
          if (!stock) return purchaseOrderError("Teslim alınan malzeme stoklarda bulunamadı.", 404);
          if (Number(stock.quantity || 0) + delta < 0) return purchaseOrderError("Teslimat miktarı azaltılamadı; ilgili stok miktarı zaten tüketilmiş.", 409);
          adjustments.push(env.DB.prepare("UPDATE stock SET quantity = quantity + ? WHERE id = ? AND company_slug = ?").bind(delta, stockId, targetSlug));
        }
        const status = body.status === "\u0130ptal" || body.status === "Iptal" ? "\u0130ptal" : purchaseOrderStatus(items);
        adjustments.push(env.DB.prepare("UPDATE purchase_orders SET name = ?, supplier_id = ?, status = ?, items = ?, total_value = ? WHERE id = ? AND company_slug = ?").bind(String(body.name).trim(), supplier.id, status, JSON.stringify(items), purchaseOrderValue(items), body.id, targetSlug));
        await env.DB.batch(adjustments);
        ctx.waitUntil(triggerPusher(`company-${targetSlug}`, "data_updated", {}));
        return new Response(JSON.stringify({ success: true, status }), { headers: corsHeaders });
      }

      if (url.pathname === "/update-maintenance-contract" && method === "POST") {
        const { slug, template } = await request.json();
        try {
          await env.DB.prepare("UPDATE companies SET maintenance_contract_template = ? WHERE slug = ?").bind(template, slug).run();
        } catch(e) {}
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
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
      console.log("Cron Job Global Ar\u015Fivleme ve Abonelik Kontrol\xFC ba\u015Flat\u0131ld\u0131.");
      const now = /* @__PURE__ */ new Date();
      const lockCutoff = new Date(now);
      lockCutoff.setDate(lockCutoff.getDate() - 1);
      await env.DB.prepare(`
                UPDATE companies 
                SET subscription_status = 'past_due' 
                WHERE (subscription_status = 'trialing' AND trial_ends_at < ?)
                   OR (subscription_status = 'active' AND billing_cycle_anchor < ? AND slug NOT IN (SELECT company_slug FROM company_rewards WHERE free_months_balance > 0))
            `).bind(lockCutoff.toISOString(), lockCutoff.toISOString()).run();
      const msgCutoff = new Date(now);
      msgCutoff.setDate(msgCutoff.getDate() - 3);
      const jobCutoff = new Date(now);
      jobCutoff.setDate(jobCutoff.getDate() - 60);
      const emgCutoff = new Date(now);
      emgCutoff.setDate(emgCutoff.getDate() - 30);
      const oldMessages = await env.DB.prepare("SELECT * FROM messages WHERE created_at < ? LIMIT 200").bind(msgCutoff.toISOString()).all();
      if (oldMessages.results.length > 0) {
        const ids = oldMessages.results.map((m) => m.id).join(",");
        await env.BUCKET.put(`global-archives/messages/${Date.now()}.json`, JSON.stringify(oldMessages.results));
        await env.DB.prepare(`DELETE FROM messages WHERE id IN (${ids})`).run();
      }
      const oldJobs = await env.DB.prepare("SELECT * FROM jobs WHERE status IN ('Tamamland\u0131', '\u0130ptal') AND created_at < ? LIMIT 100").bind(jobCutoff.toISOString()).all();
      if (oldJobs.results.length > 0) {
        const ids = oldJobs.results.map((j) => j.id).join(",");
        await env.BUCKET.put(`global-archives/jobs/${Date.now()}.json`, JSON.stringify(oldJobs.results));
        await env.DB.prepare(`DELETE FROM jobs WHERE id IN (${ids})`).run();
      }
      const oldEmergencies = await env.DB.prepare("SELECT * FROM emergencies WHERE status != 'Aktif' AND created_at < ? LIMIT 100").bind(emgCutoff.toISOString()).all();
      if (oldEmergencies.results.length > 0) {
        const ids = oldEmergencies.results.map((e) => e.id).join(",");
        await env.BUCKET.put(`global-archives/emergencies/${Date.now()}.json`, JSON.stringify(oldEmergencies.results));
        await env.DB.prepare(`DELETE FROM emergencies WHERE id IN (${ids})`).run();
      }
    } catch (e) {
      console.error("Global Cron Hatas\u0131:", e);
    }
  }
};
export {
  worker_default as default
};
