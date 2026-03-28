-- D1 / SQLite: Mevcut veritabanına bir kez uygulayın (Wrangler SQL veya konsol).
-- Hata: "duplicate column name" alırsanız o sütun zaten vardır, satırı atlayın.

ALTER TABLE companies ADD COLUMN autopilot_daily_capacity_units REAL DEFAULT 10;

ALTER TABLE customers ADD COLUMN importance_weight REAL DEFAULT 1;

ALTER TABLE assets ADD COLUMN maintenance_load_units REAL DEFAULT 1;

ALTER TABLE staff ADD COLUMN off_days TEXT;
