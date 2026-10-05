-- 1. Firmalar Tablosu
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_uid TEXT,
    company_name TEXT,
    slug TEXT UNIQUE,
    sector TEXT,
    owner_name TEXT,
    address TEXT,
    tax_info TEXT,
    phone TEXT,
    landline_phone TEXT,
    emergency_phone TEXT,
    whatsapp_phone TEXT,
    website TEXT,
    logo TEXT,
    subscription_status TEXT DEFAULT 'trialing',
    trial_ends_at TEXT,
    billing_cycle_anchor TEXT,
    custom_base_price REAL,
    custom_per_asset_price REAL,
    referral_code TEXT UNIQUE,
    referred_by_id INTEGER,
    referral_rewarded INTEGER DEFAULT 0,
    free_months_balance INTEGER DEFAULT 0,
    has_masterboss_gift INTEGER DEFAULT 0,
    work_days TEXT,
    autopilot_daily_capacity_units REAL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Personel Tablosu
CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_slug TEXT,
    name TEXT,
    phone TEXT,
    role TEXT,
    branch TEXT,
    username TEXT,
    password_hash TEXT,
    is_active INTEGER DEFAULT 1,
    assigned_regions TEXT,
    off_days TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. İşler Tablosu (En Kritik Tablo)
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_slug TEXT,
    customer_name TEXT,
    work_type TEXT,
    job_type TEXT,
    scheduled_date TEXT,
    details TEXT, -- JSON Formatında
    photo_urls TEXT, -- JSON Formatında
    asset_id TEXT,
    status TEXT,
    creator_id TEXT,
    creator_name TEXT,
    creator_role TEXT,
    manager_id TEXT,
    manager_name TEXT,
    worker_id TEXT,
    worker_name TEXT,
    staff_id TEXT,
    project_pdf_url TEXT,
    payment_status TEXT,
    payment_amount REAL DEFAULT 0,
    customer_signature_name TEXT,
    signature_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Varlıklar/Cihazlar Tablosu
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE,
    company_slug TEXT,
    name TEXT,
    location TEXT,
    apartmentName TEXT,
    asset_details TEXT,
    customer_id INTEGER,
    maintenance_fee REAL DEFAULT 0,
    maintenance_period INTEGER DEFAULT 30,
    route_staff_id TEXT,
    is_autopilot INTEGER DEFAULT 0,
    next_maintenance_date TEXT,
    last_collection_date TEXT,
    region TEXT,
    maintenance_load_units REAL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Stok Tablosu
CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_slug TEXT,
    item_name TEXT,
    category TEXT,
    quantity REAL DEFAULT 0,
    unit_name TEXT,
    unit_price REAL DEFAULT 0,
    supplier_id INTEGER,
    min_alert REAL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Finans/Kasa Tablosu
CREATE TABLE IF NOT EXISTS finances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_slug TEXT,
    description TEXT,
    amount REAL,
    type TEXT, -- Gelir/Gider
    added_by TEXT,
    job_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Mesajlaşma Tablosu
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_slug TEXT,
    sender_id TEXT,
    receiver_id TEXT,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Destek Talepleri
CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    company_slug TEXT,
    sender_name TEXT,
    type TEXT,
    message TEXT,
    status TEXT DEFAULT 'Açık',
    replies TEXT, -- JSON Formatında
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Müşteriler Tablosu
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_slug TEXT,
    name TEXT,
    contact TEXT,
    address TEXT,
    tax_info TEXT,
    importance_weight REAL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tedarikçiler Tablosu
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_slug TEXT,
    name TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Stok Kategorileri
CREATE TABLE IF NOT EXISTS stock_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_slug TEXT,
    name TEXT
);

-- 12. Arıza Bildirimleri
CREATE TABLE IF NOT EXISTS fault_reports (
    id TEXT PRIMARY KEY,
    asset_id TEXT,
    company_slug TEXT,
    reporter_name TEXT,
    reporter_phone TEXT,
    description TEXT,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Acil Durumlar (Kabin İçi)
CREATE TABLE IF NOT EXISTS emergencies (
    id TEXT PRIMARY KEY,
    asset_id TEXT,
    company_slug TEXT,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Personel SOS
CREATE TABLE IF NOT EXISTS staff_sos (
    id TEXT PRIMARY KEY,
    company_slug TEXT,
    staff_id TEXT,
    type TEXT,
    message TEXT,
    location TEXT, -- JSON Formatında
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Malzeme Talepleri
CREATE TABLE IF NOT EXISTS material_requests (
    id TEXT PRIMARY KEY,
    company_slug TEXT,
    staff_id TEXT,
    items TEXT, -- JSON Formatında
    note TEXT,
    status TEXT DEFAULT 'Bekliyor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Sistem Ayarları (Global Fiyatlandırma vb.)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 17. Referans Takip Tablosu
CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_code TEXT,
    referred_slug TEXT,
    is_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 18. Firma Ödülleri ve Ücretsiz Ay Bakiyesi
CREATE TABLE IF NOT EXISTS company_rewards (
    company_slug TEXT PRIMARY KEY,
    free_months_balance INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);-- 19. Firma Ayarlar�
CREATE TABLE IF NOT EXISTS company_settings (
    company_slug TEXT PRIMARY KEY,
    maintenance_contract_template TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 20. Masterboss Giri� Denemeleri
CREATE TABLE IF NOT EXISTS masterboss_rate_limits (
    ip TEXT PRIMARY KEY,
    attempts INTEGER DEFAULT 0,
    last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 21. BOM (Stock Templates)
CREATE TABLE IF NOT EXISTS bom_templates (
    id TEXT PRIMARY KEY,
    company_slug TEXT,
    name TEXT,
    description TEXT,
    items TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 22. Sipari�ler
CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    company_slug TEXT,
    name TEXT,
    supplier_id INTEGER,
    status TEXT DEFAULT 'Bekliyor',
    items TEXT,
    total_value REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 23. Envanter �adeleri
CREATE TABLE IF NOT EXISTS inventory_returns (
    id TEXT PRIMARY KEY,
    company_slug TEXT,
    staff_id TEXT,
    job_id INTEGER,
    items TEXT,
    status TEXT DEFAULT 'Bekliyor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
