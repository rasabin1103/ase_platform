-- ASE demo seed (reference)
--
-- Prefer idempotent Python seed (bcrypt, RBAC graph):
--   cd ase_backend && .venv/Scripts/python.exe scripts/database/seed_all.py
--
-- Password for demo users below must match DEMO_SEED_PASSWORD in .env
-- Default: ChangeMeDemo123!
-- Hash generated with passlib bcrypt (rounds=12).

-- Roles (minimal; full permission matrix from seed_roles.py)
INSERT INTO roles (code, name, scope, description)
VALUES
  ('super_admin', 'Super Admin', 'platform', 'Platform administrator'),
  ('independent_user', 'Independent User', 'personal_workspace', 'Consumer / independent user')
ON CONFLICT (code) DO NOTHING;

-- Demo users (update password_hash if you change DEMO_SEED_PASSWORD)
INSERT INTO users (email, password_hash, first_name, last_name, display_name, status)
VALUES
  (
    'rasabin01@gmail.com',
    '$2b$12$lHnKfPeZHghrMLzIGN9tIOlv5LWkG4DmVj0ce8vdiS9cMw1A4VI6C',
    'Roberto',
    'Super Admin',
    'Roberto Super Admin',
    'active'
  ),
  (
    'rasabin05@gmail.com',
    '$2b$12$lHnKfPeZHghrMLzIGN9tIOlv5LWkG4DmVj0ce8vdiS9cMw1A4VI6C',
    'Roberto',
    'Independiente',
    'Roberto Independiente',
    'active'
  )
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  display_name = EXCLUDED.display_name,
  status = 'active';

-- Catalog samples (products, course, book, resource)
INSERT INTO catalog_items (
  title, slug, type, category, short_description, long_description,
  image_url, price, currency, status, level, duration, author, preview_url,
  benefits_json, requirements_json, included_items_json
)
VALUES
  (
    'ASE QA Platform',
    'ase-qa-platform-saas',
    'product',
    'SaaS',
    'Multi-tenant QA automation platform with RBAC and audit trails.',
    'Enterprise-grade SaaS to orchestrate test automation, quality gates and release confidence.',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    49.00, 'EUR', 'published', 'intermediate', 'Subscription', 'Arce Sabin Engineering',
    'https://example.com/preview/ase-qa-platform',
    '["RBAC", "Audit logs", "CI integrations"]'::jsonb,
    '["Modern browser"]'::jsonb,
    '["Cloud access", "Email support"]'::jsonb
  ),
  (
    'Playwright Mastery',
    'playwright-mastery-course',
    'course',
    'Automation',
    'Hands-on course: reliable E2E tests with Playwright and TypeScript.',
    'Design maintainable end-to-end suites with fixtures, tracing, and CI feedback loops.',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    129.00, 'EUR', 'published', 'beginner', '12 hours', 'ASE Academy',
    'https://example.com/preview/playwright-mastery',
    '["12h video + labs", "Certificate"]'::jsonb,
    '["Basic TypeScript", "Node.js 18+"]'::jsonb,
    '["8 modules", "Cheat-sheets"]'::jsonb
  ),
  (
    'Testing Strategies Handbook',
    'testing-strategies-handbook',
    'book',
    'Quality',
    'Practical guide to test strategy, risk-based testing and release gates.',
    'Reference book for QA leads and engineers building quality culture.',
    'https://images.unsplash.com/photo-1544716278-e513176f20b5?w=800&q=80',
    29.00, 'EUR', 'published', 'intermediate', NULL, 'ASE Publishing',
    NULL,
    '["Strategy templates", "Case studies"]'::jsonb,
    '[]'::jsonb,
    '["PDF + EPUB"]'::jsonb
  ),
  (
    'CI/CD Pipeline Templates',
    'cicd-pipeline-templates',
    'resource',
    'DevOps',
    'Downloadable GitHub Actions and GitLab CI templates for QA pipelines.',
    'Kickstart quality gates in your pipelines with ready-to-use workflows.',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    0.00, 'EUR', 'published', 'beginner', NULL, 'ASE Labs',
    NULL,
    '["YAML templates", "Documentation"]'::jsonb,
    '["Git repository access"]'::jsonb,
    '["ZIP download"]'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;
