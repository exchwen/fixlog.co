CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_company_created ON jobs(company_slug, created_at);
CREATE INDEX IF NOT EXISTS idx_staff_company_slug ON staff(company_slug);
CREATE INDEX IF NOT EXISTS idx_assets_company_slug ON assets(company_slug);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
