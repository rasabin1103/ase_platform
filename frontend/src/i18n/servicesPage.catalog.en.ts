/**
 * English overlay for API-backed public services (`code` matches seed catalog).
 * Mirrors servicesPage.catalog.es.ts so pillar cards and bands are not stuck
 * showing raw (Spanish) database copy when the UI language is `en`.
 */

export const servicesPageCatalogEnByCode = {
  saas_platform_engineering: {
    name: 'SaaS platform engineering',
    heroTitle: 'SaaS platform engineering',
    heroSubtitle: 'From foundations to production operations.',
    shortDescription: 'Multi-tenant platforms, RBAC, billing and enterprise workflows.',
    description:
      'Design and delivery of production-ready SaaS platforms, with tenant isolation, role-based access control, subscription billing, product entitlements and auditable operations.',
    features: [
      'Multi-tenant architecture',
      'RBAC systems',
      'Billing and subscriptions',
      'Product access control',
      'Audit logs',
      'Enterprise workflows',
    ],
    highlights: [
      {
        title: 'Typical scope',
        value: 'Platform MVP → scale',
        description: 'Architecture, delivery and hardening across iterative releases.',
      },
      {
        title: 'Stack posture',
        value: 'API-first · observable',
        description: 'Services built for CI/CD, metrics and operational clarity.',
      },
    ],
  },
  qa_automation_architecture: {
    name: 'QA automation architecture',
    heroTitle: 'QA automation architecture',
    heroSubtitle: 'Reliable signal from automation, not noise.',
    shortDescription: 'Automation ecosystems wired into CI/CD with governance.',
    description:
      'End-to-end QA automation architecture: frameworks, pipelines, reporting and quality governance aligned with how your teams actually ship.',
    features: [
      'API automation frameworks',
      'UI automation ecosystems',
      'CI/CD integration',
      'Observability and reporting',
      'Test strategy',
      'Quality governance',
    ],
    highlights: [
      {
        title: 'Integration depth',
        value: 'Pipelines + dashboards',
        description: 'Automation wired into build, deploy and quality gates.',
      },
      {
        title: 'Operating model',
        value: 'Governed velocity',
        description: 'Flake management, ownership and measurable release confidence.',
      },
    ],
  },
  business_process_automation: {
    name: 'Business process automation',
    heroTitle: 'Business process automation',
    heroSubtitle: 'Less manual friction. More throughput.',
    shortDescription: 'Internal workflows, AI-assisted operations and integration tooling.',
    description:
      'Automation of administrative and operational workflows with pragmatic AI assistance, documents, notifications and integrations across your toolchain.',
    features: [
      'Internal workflows',
      'AI-assisted operations',
      'Document automation',
      'Administrative automation',
      'Notifications and integrations',
      'Automation pipelines',
    ],
    highlights: [
      {
        title: 'Outcome focus',
        value: 'Hours saved / week',
        description: 'Automation scoped to a measurable operational lever.',
      },
      {
        title: 'Safety',
        value: 'Human in the loop',
        description: 'Controls for approvals, audit trail and rollback paths.',
      },
    ],
  },
  technical_training: {
    name: 'Technical training',
    heroTitle: 'Technical training',
    heroSubtitle: 'Enablement that outlasts the workshop.',
    shortDescription: 'Workshops, enablement and hands-on technical coaching.',
    description:
      'Enterprise training programs covering QA, Python, automation engineering and team enablement — from onboarding ramps to advanced workshops.',
    features: [
      'QA training',
      'Python training',
      'Automation courses',
      'Enterprise workshops',
      'Team enablement',
      'Hands-on labs',
    ],
    highlights: [
      {
        title: 'Formats',
        value: 'Remote / on-site',
        description: 'Cohorts, intensives and embedded coaching.',
      },
      {
        title: 'Depth',
        value: 'Beginner → advanced',
        description: 'Progressions aligned to your stack and delivery constraints.',
      },
    ],
  },
  premium_frameworks: {
    name: 'Premium frameworks',
    heroTitle: 'Premium frameworks',
    heroSubtitle: 'Accelerators for shipping, not shelfware demos.',
    shortDescription: 'Karate, Playwright, Pytest and WDIO accelerators for enterprise teams.',
    description:
      'Curated automation frameworks and reusable accelerators — structured for maintainability, CI integration and enterprise governance.',
    features: [
      'Karate framework',
      'Playwright framework',
      'Pytest API framework',
      'WDIO ecosystems',
      'Enterprise templates',
      'Reusable accelerators',
    ],
    highlights: [
      {
        title: 'Repositories',
        value: 'Opinionated layouts',
        description: 'Patterns for scaling suites across teams and services.',
      },
      {
        title: 'CI posture',
        value: 'Parallel · sharded',
        description: 'Defaults for fast feedback and stable pipelines.',
      },
    ],
  },
  technical_books_digital_assets: {
    name: 'Technical books and digital assets',
    heroTitle: 'Technical books and digital assets',
    heroSubtitle: 'Dense, practical references — like internal playbooks.',
    shortDescription: 'Books, guides, PDFs and premium technical assets.',
    description:
      'Premium technical books and digital assets on Python, SQL, QA and automation — built for people who ship real systems.',
    features: [
      'Python books',
      'SQL books',
      'QA books',
      'Automation guides',
      'Premium PDFs',
      'Technical assets',
    ],
    highlights: [
      {
        title: 'Formats',
        value: 'PDF · bundles',
        description: 'Structured chapters, checklists and worked examples.',
      },
      {
        title: 'Audience',
        value: 'Builders',
        description: 'Written for engineers, leads and operators — not hype decks.',
      },
    ],
  },
} as const
