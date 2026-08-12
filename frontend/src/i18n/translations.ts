/** Public `/services` copy (EN + ES). Merged as root key `servicesPage`. */
import { servicesPageEn, servicesPageEs } from './servicesPage.locale'
/** Public `/platform` copy (EN + ES). Merged as root key `platformPage`. */
import { platformPageEn, platformPageEs } from './platformPage.locale'
/** Public `/about` copy (EN + ES). Merged as root key `aboutPage`. */
import { aboutPageEn, aboutPageEs } from './aboutPage.locale'
/** Private `/organizations` copy (EN + ES). Merged as root key `organizationsPage`. */
import { organizationsPageEn, organizationsPageEs } from './organizationsPage.locale'
/** Private `/users` copy (EN + ES). Merged as root key `usersPage`. */
import { usersPageEn, usersPageEs } from './usersPage.locale'
/** Private `/plans` copy (EN + ES). Merged as root key `plansPage`. */
import { plansPageEn, plansPageEs } from './plansPage.locale'
import { requestsPageEn, requestsPageEs } from './requestsPage.locale'
import { creatorApplicationEn, creatorApplicationEs } from './creatorApplication.locale'
import {
  catalogEn,
  catalogEs,
  independentDashboardEn,
  independentDashboardEs,
  profilePageEn,
  profilePageEs,
  adminDashboardEn,
  adminDashboardEs,
  adminCatalogEn,
  adminCatalogEs,
  adminPurchasesEn,
  adminPurchasesEs,
  adminAuditLogEn,
  adminAuditLogEs,
  adminBookRedemptionsEn,
  adminBookRedemptionsEs,
  adminSearchEn,
  adminSearchEs,
  adminAnnouncementsEn,
  adminAnnouncementsEs,
  adminSystemStatusEn,
  adminSystemStatusEs,
  adminErrorLogsEn,
  adminErrorLogsEs,
  servicesAdminEn,
  servicesAdminEs,
} from './catalog.locale'
/** Private `/organization/*` copy (EN + ES). Merged as root key `organizationWorkspace`. */
import { organizationWorkspaceEn, organizationWorkspaceEs } from './organizationWorkspace.locale'
/** Join-org requests, member invites, and profile links copy (EN + ES). Merged as root key `orgMembership`. */
import { orgMembershipEn, orgMembershipEs } from './orgMembership.locale'
/** Book repo-code redemption copy (EN + ES). Merged as root key `redeemCode`. */
import { redeemCodeEn, redeemCodeEs } from './redeemCode.locale'

export type Language = 'en' | 'es'

export const translations = {
  en: {
    nav: {
      home: 'Home',
      whatsIncluded: "What's included",
      platform: 'Platform',
      plans: 'Plans',
      about: 'About ASE',
      story: 'Story',
      contact: 'Contact',
      cta: 'Get started free',
      clients: 'Client access',
    },
    notFound: {
      badge: 'Page not found',
      title: 'This page does not exist or was moved.',
      subtitle: 'Check the URL or return to the homepage to continue exploring ASE.',
      home: 'Back to home',
      contact: 'Contact us',
    },
    dashboardWelcome: {
      greeting: 'Welcome back, {{name}}',
    },
    twoFactorGrace: {
      title: 'Activate two-factor authentication',
      body: 'You have {{days}} day(s) left to activate 2FA on your account, or it will be automatically deactivated for security.',
      bodyToday: 'Today is your last day to activate 2FA on your account, or it will be automatically deactivated for security.',
      cta: 'Activate now',
      later: 'Remind me later',
    },
    suspendedGate: {
      badge: 'Account deactivated',
      twoFactor: {
        title: 'Activate 2FA to regain access',
        body: 'Your account was deactivated because two-factor authentication was never activated within the grace period. Set it up below to restore full access immediately.',
      },
      generic: {
        title: 'Your account is deactivated',
        body: 'Your account has been deactivated. Contact support if you believe this is a mistake.',
      },
      logout: 'Sign out',
    },
    servicesPage: servicesPageEn,
    platformPage: platformPageEn,
    aboutPage: aboutPageEn,
    organizationsPage: organizationsPageEn,
    organizationWorkspace: organizationWorkspaceEn,
    orgMembership: orgMembershipEn,
    redeemCode: redeemCodeEn,
    usersPage: usersPageEn,
    plansPage: plansPageEn,
    requestsPage: requestsPageEn,
    creatorApplication: creatorApplicationEn,
    catalog: catalogEn,
    independentDashboard: independentDashboardEn,
    profilePage: profilePageEn,
    adminDashboard: adminDashboardEn,
    adminCatalog: adminCatalogEn,
    adminPurchases: adminPurchasesEn,
    adminAuditLog: adminAuditLogEn,
    adminBookRedemptions: adminBookRedemptionsEn,
    adminSearch: adminSearchEn,
    adminAnnouncements: adminAnnouncementsEn,
    adminSystemStatus: adminSystemStatusEn,
    adminErrorLogs: adminErrorLogsEn,
    servicesAdmin: servicesAdminEn,
    cta: {
      talkToUs: 'Talk to us',
      clientLogin: 'Client login',
      contact: 'Contact',
      login: 'Login',
    },
    hero: {
      badge: 'The reference platform for QA professionals and teams',
      title: 'Everything you need to master software quality. In one place.',
      subtitle:
        'Arce Sabin Engineering brings together courses, templates, tools, books and premium QA consulting services — designed for independent professionals and teams who want to scale without chaos. Subscribe once, access everything.',
      primaryCta: 'Explore the platform',
      secondaryCta: 'View plans',
      trust: {
        governance: {
          label: 'FOR PROFESSIONALS',
          value: 'Courses, templates and tools to grow as a QA Lead or SDET',
        },
        quality: {
          label: 'FOR TEAMS',
          value: 'Frameworks, automation and training for teams that deliver with quality',
        },
        speed: {
          label: 'FOR COMPANIES',
          value: 'Multi-organization plans with RBAC, auditing and consulting included',
        },
      },
      preview: {
        title: 'ASE Platform',
        liveBadge: '● Live',
        maintenanceBadge: '● Maintenance',
        plansTitle: 'PLANS',
        servicesTitle: 'SERVICES',
        statusTitle: 'STATUS',
        unavailable: 'Unavailable',
        perMonth: '/mo',
        statusValues: {
          ok: 'ok',
          error: 'error',
          active: 'active',
        },
        plansCount: '{{count}} plans',
        categories: {
          platform_engineering: 'Platform',
          qa_automation: 'QA Automation',
          training: 'Training',
          digital_products: 'Digital',
          consulting: 'Consulting',
          ai_automation: 'AI',
          frameworks: 'Frameworks',
        },
        status: {
          backend: 'BACKEND',
          db: 'DB',
          api: 'API',
          plans: 'PLANS',
        },
      },
    },
    services: {
      sectionBadge: 'What ASE builds',
      title: 'Engineering services composed like a product',
      subtitle:
        'Not isolated tasks — cohesive delivery blocks with governance, quality and operability integrated from day one.',
      blocks: {
        s1: {
          title: 'SaaS Platform Engineering',
          description:
            'Design and build multi-tenant products with governance built in — so your platform stays predictable as it scales.',
          bullets: [
            'Tenant context strategy and isolation boundaries',
            'RBAC policy model and auditability',
            'Operator-first dashboards and admin workflows',
            'Incremental roadmap aligned with business outcomes',
          ],
          stats: [
            { label: 'Typical scope', value: 'Platform MVP → scale' },
            { label: 'Stack posture', value: 'API-first · observable' },
          ],
        },
        s2: {
          title: 'QA Automation Architecture',
          description:
            'Automation ecosystems that reduce risk and accelerate delivery — from test strategy to CI feedback loops.',
          bullets: [
            'Test strategy across unit/integration/e2e',
            'Framework templates and best practices',
            'CI pipelines and fast feedback signals',
            'Quality gates without slowing teams down',
          ],
          stats: [
            { label: 'Integration depth', value: 'Pipelines + dashboards' },
            { label: 'Operating model', value: 'Governed velocity' },
          ],
        },
        s3: {
          title: 'Business Process Automation',
          description:
            'Internal tools and workflow automation that reduce operational friction and make processes measurable.',
          bullets: [
            'Process mapping and system boundaries',
            'Operator UX for back-office workflows',
            'Audit-ready traceability and governance',
            'Automation aligned with KPIs and ownership',
          ],
          stats: [
            { label: 'Outcome focus', value: 'Hours saved / week' },
            { label: 'Safety', value: 'Human-in-the-loop' },
          ],
        },
        s4: {
          title: 'Technical Training & Frameworks',
          description:
            'Enablement for teams: patterns, playbooks and production-grade templates that standardize quality.',
          bullets: [
            'Training paths and internal docs',
            'Framework starter kits and conventions',
            'Review processes and delivery discipline',
            'Reusable modules for faster iteration',
          ],
          stats: [
            { label: 'Formats', value: 'Remote / onsite' },
            { label: 'Depth', value: 'Beginner → advanced' },
          ],
        },
      },
      methodology: ['Design', 'Build', 'Automate', 'Observe', 'Scale', 'Harden'],
      blueprintLabel: 'Delivery blueprint',
    },
    modules: {
      badge: 'Platform modules',
      title: 'A connected system — not isolated features',
      subtitle:
        'Modules are designed to work together: tenant context, RBAC policies, billing and auditability share one coherent backbone.',
      coreTitle: 'ASE Core',
      coreSubtitle: 'Tenant context · Policies · Events',
      integrityTitle: 'Data integrity',
      integrityBody:
        'A single backbone that keeps permissions, subscriptions and governance consistent.',
      pills: { rbac: 'RBAC', audit: 'Audit', billing: 'Billing', catalog: 'Catalog' },
      cards: {
        auth: { title: 'Auth & Users', desc: 'Identity, sessions and user lifecycle.' },
        orgs: { title: 'Organizations', desc: 'Tenant model and membership governance.' },
        roles: { title: 'Roles & Permissions', desc: 'RBAC policy model for operators.' },
        plans: { title: 'Plans & Subscriptions', desc: 'Billing primitives and lifecycle.' },
        products: { title: 'Products', desc: 'Catalog and access entitlements.' },
        courses: { title: 'Courses', desc: 'Training portal and enrollments.' },
        audit: { title: 'Audit Logs', desc: 'Traceability and governance signals.' },
      },
    },
    process: {
      badge: 'Process',
      title: 'A delivery flow built for confidence',
      subtitle:
        'From discovery to scale, we keep governance, quality and operability aligned — so systems remain predictable.',
      steps: {
        s1: { title: 'Discover', desc: 'Understand constraints, stakeholders and governance needs.' },
        s2: { title: 'Design', desc: 'Define tenant boundaries, permissions and module architecture.' },
        s3: { title: 'Build', desc: 'Ship incrementally with clean interfaces and stable schemas.' },
        s4: { title: 'Automate', desc: 'Add test strategy, QA ecosystems and operational tooling.' },
        s5: { title: 'Scale', desc: 'Harden reliability, observability and enterprise readiness.' },
      },
    },
    why: {
      badge: 'Why ASE',
      title: 'Built with rigor — delivered with empathy',
      subtitle: 'You get the clarity of a product team with the discipline of platform engineering.',
      pillars: {
        p1: {
          title: 'Engineering discipline',
          desc: 'Schema integrity, migrations, predictable APIs and operational safety.',
          detail: 'Clear boundaries · measurable outcomes',
        },
        p2: {
          title: 'Quality-first mindset',
          desc: 'Automation and fast feedback loops built into the delivery system.',
          detail: 'Test strategy · CI signals',
        },
        p3: {
          title: 'Product thinking',
          desc: 'Systems built for operators: clarity, usability and ownership.',
          detail: 'UX for admins · governance',
        },
      },
    },
    pricing: {
      badge: 'Plans and pricing',
      title: 'Choose your plan. Access the entire ASE ecosystem.',
      subtitle: 'One price. Courses, templates, tools, resources and consulting — no surprises.',
      starterPara:
        'Independent QA professionals, juniors and freelancers who want to grow with quality resources.',
      professionalPara:
        'QA Leads, small teams, consultancies and startups that need management, automation and advanced training.',
      enterprisePara:
        'Companies, consultancies and academies that need multi-organization management, corporate training and consulting included.',
      guarantee: {
        title: 'No risk',
        text: 'Cancel whenever you want. No lock-in. No fine print.',
        item1: 'Cancel at any time',
        item2: 'Support included in all plans',
        item3: 'Immediate access after payment',
      },
      monthly: 'Monthly',
      yearly: 'Yearly',
      save: 'Save up to 2 months',
      perMonth: '/month',
      perYear: '/year',
      loadError: 'We could not load plans. Check your connection and try again.',
      loadingHint: 'Loading plans…',
      empty: 'No public plans are available right now.',
      retry: 'Retry',
      customPrice: 'Custom',
      plans: {
        free: {
          name: 'Free',
          desc: 'For individuals exploring automation, QA resources and platform basics.',
          features: [
            'Personal workspace',
            'Access to free resources',
            'Basic platform preview',
            'Community learning content',
            'Limited product access',
          ],
          cta: 'Start free',
        },
        pro: {
          name: 'Pro',
          badge: 'Recommended',
          desc:
            'For professionals and small teams that need frameworks, automation utilities and structured technical assets.',
          features: [
            'Everything in Free',
            'QA framework access',
            'Technical templates',
            'Product tools',
            'Training content',
            'Priority updates',
          ],
          cta: 'Start Pro',
        },
        business: {
          name: 'Business',
          desc:
            'For companies that need users, roles, subscriptions, internal tools and automation workflows.',
          features: [
            'Multi-user organization',
            'Roles and permissions',
            'Product access control',
            'Business dashboards',
            'Audit logs',
            'Automation workflows',
            'Support channel',
          ],
          cta: 'Talk to us',
        },
        enterprise: {
          name: 'Enterprise',
          desc:
            'For organizations that need custom platforms, integrations, architecture, QA automation and dedicated engineering support.',
          features: [
            'Custom SaaS platform',
            'Dedicated architecture support',
            'Private workflows',
            'Enterprise integrations',
            'Custom automation',
            'Security and governance',
            'Technical advisory',
          ],
          cta: 'Contact sales',
        },
      },
    },
    finalCta: {
      badge: 'Next step',
      title: 'Build a platform your business can trust.',
      subtitle: 'Let’s align on constraints, governance and roadmap — then ship with confidence.',
    },
    impersonation: {
      bannerText: 'Viewing as {{email}}',
      returnToAdmin: 'Return to admin',
      confirmTitle: 'Log in as this user?',
      confirmBody:
        'You will see the product exactly as {{email}} does, for up to 30 minutes. This is logged in the activity log.',
      confirmAction: 'Log in as user',
      cancel: 'Cancel',
      action: 'Log in as user',
      error: 'Could not start the impersonation session.',
    },
    footer: {
      tagline: 'The reference platform for QA professionals and teams.',
      copyright: '© 2026 Arce Sabin Engineering. All rights reserved.',
      col2Title: 'Platform',
      col3Title: 'Company',
      link1: "What's included",
      link2: 'Platform',
      link3: 'Plans',
      link4: 'Client access',
      linkRedeem: 'Redeem book code',
      link5: 'About ASE',
      link6: 'Contact',
      response: 'Reply within 24h',
      legalPrivacy: 'Privacy Policy',
      legalTerms: 'Terms of Service',
      claim:
        'Premium software platforms and automation ecosystems — engineered for governance, quality and speed.',
      tags: { enterprise: 'Enterprise-ready', automation: 'Automation-first', rbac: 'RBAC & governance' },
      cols: {
        company: 'Company',
        platform: 'Platform',
        services: 'Services',
        contact: 'Contact',
      },
      links: {
        home: 'Home',
        about: 'About',
        story: 'Story',
        platformOverview: 'Overview',
        clientLogin: 'Client login',
        servicesWhat: 'What we build',
        platformModules: 'Platform modules',
        talk: 'Talk to us',
        pricing: 'Pricing',
      },
      rights: '© 2026 Arce Sabin Engineering. All rights reserved.',
      location: 'Madrid · Remote',
      bullets: { security: 'Security-first', rbac: 'RBAC-ready', enterprise: 'Enterprise-grade' },
      brandDescription:
        'Premium SaaS platforms, QA automation and software architecture for companies that need speed, quality and control.',
      company: 'Company',
      about: 'About',
      story: 'Story',
      contact: 'Contact',
      platform: 'Platform',
      pricing: 'Pricing',
      clientLogin: 'Client login',
      services: 'Services',
      saasPlatformEngineering: 'SaaS Platform Engineering',
      qaAutomationArchitecture: 'QA Automation Architecture',
      businessProcessAutomation: 'Business Process Automation',
      technicalTraining: 'Technical Training',
      linkedin: 'LinkedIn',
      securityFirst: 'Security-first',
      rbacReady: 'RBAC-ready',
      enterpriseGrade: 'Enterprise-grade',
    },
    pages: {
      about: {
        badge: 'About',
        title: 'About ASE',
        p1:
          'Arce Sabin Engineering is a product-focused engineering studio. We build premium software platforms for organizations that need secure operations, clear roles and measurable results.',
        p2:
          'Our approach blends architecture, delivery discipline and modern UX — so teams can ship faster without sacrificing governance.',
        viewServices: 'View services',
      },
      platform: {
        badge: 'Platform',
        title: 'A foundation for secure, multi-tenant products',
        body:
          'ASE’s platform blueprint focuses on governance, clarity and scalability. It helps teams move fast while keeping permissions, tenant boundaries and monetization consistent.',
        services: 'Services',
        contact: 'Contact',
        clientLogin: 'Client login',
      },
      story: {
        badge: 'Story',
        title: 'A practical story about building platforms',
        body:
          'ASE is built around a simple philosophy: great systems are governed, observable and enjoyable to operate. The result is software that teams trust — and businesses can scale.',
        about: 'About',
        contact: 'Contact',
      },
      contact: {
        badge: "LET'S TALK",
        title: 'Have a quality challenge? Tell us about it.',
        body:
          "Whether you want to explore the platform, have questions about an Enterprise plan, or need QA consulting for your team — we're here. We reply within 24 hours on business days.",
        trust1: 'Reply within 24h',
        trust2: 'No commitment',
        trust3: 'For Enterprise plans, consulting included',
        footerText:
          'You can also reach us directly at contact@arcesabinengineering.com or connect on LinkedIn with Roberto Arce Sabín.',
        sendTitle: 'Send a message',
        sendSubtitle: 'We’ll reply within 1–2 business days.',
        fields: {
          name: 'Name',
          email: 'Email',
          company: 'Company',
          message: 'Message',
          namePh: 'Your name',
          companyPh: 'Company / team',
          messagePh: 'What are you building? What constraints matter most?',
        },
        openClient: 'Open email client',
        details: 'Details',
        location: 'Location',
        focus: 'Focus',
        focusBody: 'RBAC, multi-tenant platforms, premium UX, operational tooling',
        response: 'Response time',
        responseBody: '1–2 business days',
        subject: 'ASE — Contact request',
      },
      services: {
        badge: 'Services',
        title: 'Engineering services for enterprise platforms',
        body:
          'We partner with teams to build secure, maintainable systems with clear governance. From foundations to acceleration, we focus on outcomes your organization can operate with confidence.',
        contact: 'Contact',
        platformOverview: 'Platform overview',
      },
    },
    header: {
      menu: 'Menu',
    },
    auth: {
      backHome: 'Back to Home',
      backToLogin: 'Back to login',
      bullets: ['Secure authentication', 'Organization context', 'RBAC permissions', 'SaaS operations'],
      login: {
        badge: 'Client Workspace',
        title: 'Access your engineering workspace',
        body: 'Manage organizations, users, roles, subscriptions and products from one secure platform.',
        formTitle: 'Login',
        formSubtitle: 'Use your account to access the dashboard.',
        loading: 'Signing in…',
        submit: 'Login',
        noAccount: 'New here?',
        createAccount: 'Create an account',
        forgotPassword: 'Forgot your password?',
        twoFactorTitle: 'Enter your verification code',
        twoFactorBody: 'Open your authenticator app and enter the 6-digit code for this account.',
        twoFactorCodeLabel: 'Verification code',
        twoFactorSubmit: 'Verify',
        twoFactorError: 'Invalid or expired code. Try again.',
        twoFactorBack: 'Back to login',
        lockedError: 'Too many failed attempts. Account temporarily locked — try again in {{minutes}} min.',
        lockedErrorGeneric: 'Too many failed attempts. Account temporarily locked — try again later.',
      },
      register: {
        badge: 'Start here',
        title: 'Start building your ASE workspace',
        body: 'Create your account and begin shaping your organization, products and automation systems.',
        formTitle: 'Create account',
        formSubtitle: 'Use a work email if possible.',
        loading: 'Creating…',
        submit: 'Create account',
        haveAccount: 'Already have an account?',
        login: 'Login',
      },
      forgotPassword: {
        badge: 'Account recovery',
        title: 'Get back into your account',
        body: "Enter the email on your account and we'll send you a link to reset your password.",
        formTitle: 'Forgot your password?',
        formSubtitle: "We'll email you a reset link.",
        loading: 'Sending…',
        submit: 'Send reset link',
        sentTitle: 'Check your email',
        sentBody: "If that email is registered, we've sent a link to reset your password. It expires in 60 minutes.",
      },
      resetPassword: {
        badge: 'Account recovery',
        title: 'Set a new password',
        body: 'Choose a new password for your account.',
        formTitle: 'Reset your password',
        formSubtitle: 'Enter a new password below.',
        newPassword: 'New password',
        confirmPassword: 'Confirm new password',
        mismatch: "Passwords don't match.",
        loading: 'Saving…',
        submit: 'Reset password',
        expiredError: 'This link is invalid or has expired. Request a new one.',
        genericError: 'Could not reset your password. Try again.',
        doneTitle: 'Password updated',
        doneBody: 'Your password has been reset. You can now log in with your new password.',
        invalidTitle: 'Invalid link',
        invalidBody: 'This password reset link is missing or malformed. Request a new one.',
      },
      verifyEmail: {
        badge: 'Email verification',
        title: 'Confirm your email',
        body: 'Confirming your email unlocks purchases and keeps your account secure.',
        pendingTitle: 'Confirming your email…',
        pendingBody: 'This will only take a moment.',
        doneTitle: 'Email confirmed',
        doneBody: 'Your email is now verified. You can log in and use your account normally.',
        errorTitle: "Couldn't confirm your email",
        errorBody: 'This link is invalid or has expired. You can request a new one from your account.',
        invalidTitle: 'Invalid link',
        invalidBody: 'This verification link is missing or malformed.',
      },
    },
    emailVerification: {
      bannerText: 'Please verify your email — purchases are locked until you do.',
      resend: 'Resend verification email',
      sent: 'Email sent',
    },
    legal: {
      privacy: {
        badge: 'Legal',
        title: 'Privacy Policy',
        lastUpdated: 'Last updated: August 12, 2026',
        intro:
          'This Privacy Policy explains how Arce Sabin Engineering collects, uses and protects your personal data when you use our platform. It applies to the public site, the client dashboard and the marketplace.',
        sections: [
          {
            heading: 'Who is responsible for your data',
            body:
              'The data controller is Arce Sabin Engineering (Roberto Arce Sabín), contactable at contact@arcesabinengineering.com. For any question about this policy or how we handle your data, write to us at that address.',
          },
          {
            heading: 'Data we collect',
            body:
              'Account data: name, email address, hashed password, and organization membership.\nUsage data: purchases, catalog access, book redemption codes, and your GitHub username — only if you redeem a book that grants repository access.\nSupport data: anything you send us through the contact form or a support request.\nTechnical data: IP address and basic request logs, kept for security purposes.',
          },
          {
            heading: 'Why we process your data',
            body:
              'To provide and maintain your account and purchases, under the legal basis of contract performance.\nTo send transactional emails such as password resets and email verification, also under contract performance.\nTo keep security and audit logs, under our legitimate interest in preventing fraud and abuse.\nTo respond to messages you send us, based on the consent you give when submitting the contact form.',
          },
          {
            heading: 'How long we keep it',
            body:
              'We keep account data for as long as your account is active. If you delete your account, we retain the minimum record required for legal, tax or security purposes and anonymize the rest.',
          },
          {
            heading: 'Who we share it with',
            body:
              'We do not sell your data. We share it only with service providers acting on our behalf: hosting and database infrastructure, our email delivery provider, and — only if you use the book redemption feature — GitHub, to grant you repository access using the GitHub username you provide. These providers process data solely under our instructions.',
          },
          {
            heading: 'International transfers',
            body:
              'Some of our service providers may process data outside the European Economic Area. Where this happens, we rely on the safeguards required by data protection law, such as standard contractual clauses.',
          },
          {
            heading: 'Your rights',
            body:
              'You have the right to access, rectify, delete, restrict or object to the processing of your data, and to data portability. You can exercise these rights by writing to contact@arcesabinengineering.com. You also have the right to lodge a complaint with your local data protection authority (in Spain, the Agencia Española de Protección de Datos).',
          },
          {
            heading: 'Cookies and local storage',
            body:
              'Our platform does not use third-party advertising or analytics cookies. We use browser local storage to keep you signed in and to remember your language preference. This information stays on your device and is not shared with third parties.',
          },
          {
            heading: 'Security',
            body:
              'We apply reasonable technical and organizational measures to protect your data, including password hashing, encrypted connections and access controls. No system is completely secure, and we continuously work to improve our safeguards.',
          },
          {
            heading: 'Minors',
            body:
              'Our services are intended for professional use and are not directed at individuals under 16 years old. We do not knowingly collect data from minors.',
          },
          {
            heading: 'Changes to this policy',
            body:
              'We may update this policy as the platform evolves. We will post the updated version here with a new "last updated" date, and notify you by email of material changes where appropriate.',
          },
          {
            heading: 'Contact us',
            body: 'Questions about this policy or your data can be sent to contact@arcesabinengineering.com.',
          },
        ],
      },
      terms: {
        badge: 'Legal',
        title: 'Terms of Service',
        lastUpdated: 'Last updated: August 12, 2026',
        intro:
          'These Terms of Service govern your access to and use of the Arce Sabin Engineering platform, including the marketplace, client dashboard and organization tools.',
        sections: [
          {
            heading: 'Acceptance of these terms',
            body:
              'By creating an account or using the Arce Sabin Engineering platform, you agree to these Terms of Service. If you do not agree, please do not use the platform.',
          },
          {
            heading: 'The service',
            body:
              'ASE provides a marketplace and client dashboard for software products, courses, books and professional resources, together with organization and team management tools. Features and pricing may evolve over time.',
          },
          {
            heading: 'Your account',
            body:
              'You must provide accurate information when registering and keep your credentials confidential. You are responsible for all activity under your account. Notify us immediately at contact@arcesabinengineering.com if you suspect unauthorized use.',
          },
          {
            heading: 'Purchases and digital content',
            body:
              'Purchases grant you a personal, non-transferable license to access the corresponding digital product, course or resource, for your own use or your organization\'s use as applicable. Purchases are processed as described at checkout; specific refund terms, if any, are shown at the time of purchase.',
          },
          {
            heading: 'Book redemption codes and GitHub access',
            body:
              'Some books include a redemption code that grants access to a companion code repository on GitHub. By redeeming a code and providing your GitHub username, you authorize us to invite that GitHub account as a collaborator on the corresponding repository. You are responsible for the security of your own GitHub account.',
          },
          {
            heading: 'Organizations',
            body:
              'Organization owners can invite members, manage access to shared catalog items, and administer their team\'s workspace. Organization owners are responsible for the actions of the members they invite and manage.',
          },
          {
            heading: 'Intellectual property',
            body:
              'All content, branding and software on the platform are owned by Arce Sabin Engineering or its licensors. Purchasing access to a product does not transfer ownership or intellectual property rights beyond the license granted.',
          },
          {
            heading: 'Acceptable use',
            body:
              'You agree not to misuse the platform: no unauthorized access attempts, scraping, reverse engineering, redistribution of purchased content, or use that violates applicable law.',
          },
          {
            heading: 'Availability and changes',
            body:
              'We aim to keep the platform available but do not guarantee uninterrupted access. We may modify, suspend or discontinue features, providing reasonable notice where possible.',
          },
          {
            heading: 'Limitation of liability',
            body:
              'To the extent permitted by law, ASE is not liable for indirect, incidental or consequential damages arising from use of the platform. Nothing in these terms limits liability that cannot be excluded under applicable law.',
          },
          {
            heading: 'Termination',
            body:
              'We may suspend or terminate accounts that violate these terms. You may close your account at any time by contacting us.',
          },
          {
            heading: 'Governing law',
            body:
              'These terms are governed by Spanish law. Any dispute will be submitted to the competent courts of Spain, without prejudice to any mandatory consumer-protection rights you may have in your place of residence.',
          },
          {
            heading: 'Changes to these terms',
            body:
              'We may update these terms as the platform evolves. Material changes will be communicated by email or through the platform.',
          },
          {
            heading: 'Contact us',
            body: 'Questions about these terms can be sent to contact@arcesabinengineering.com.',
          },
        ],
      },
      cookieNotice: {
        text:
          'We use essential local storage to keep you signed in and remember your language — no third-party tracking or advertising cookies.',
        accept: 'Got it',
        learnMore: 'Privacy Policy',
      },
    },
    session: {
      loggedIn: 'Logged in',
      dashboard: 'Dashboard',
      logout: 'Logout',
      publicSite: 'Public site',
    },
    notifications: {
      bellLabel: 'Notifications',
      title: 'Notifications',
      markAllRead: 'Mark all read',
      empty: 'No notifications yet.',
    },
    suggestions: {
      boxTitle: 'Suggestions box',
      boxSubtitle: 'Send a request or recommendation to the ASE team.',
      placeholder: 'What would you like to request or recommend?',
      targetLabel: 'Send to',
      targetPlatform: 'ASE platform (super admin)',
      targetOrganization: 'My organization (owner/admin)',
      send: 'Send',
      sending: 'Sending…',
      sent: 'Sent — thanks for the feedback.',
      error: 'Could not send your suggestion. Try again.',
      myTitle: 'Your suggestions',
      empty: 'You have not sent any suggestions yet.',
      status: { pending: 'Pending', reviewed: 'Reviewed', resolved: 'Resolved' },
      adminNote: 'Note from the team',
    },
    adminSuggestions: {
      badge: 'Feedback',
      title: 'Suggestions box',
      subtitle: 'Requests and recommendations submitted by users and organizations.',
      stats: { total: 'Total', pending: 'Pending', resolved: 'Resolved' },
      filterLabel: 'Status',
      filterAll: 'All',
      loadError: 'Could not load suggestions.',
      emptyTitle: 'No suggestions yet',
      emptyDescription: 'When users submit requests or recommendations, they will show up here.',
      review: 'Review',
      modalTitle: 'Review suggestion',
      statusLabel: 'Status',
      save: 'Save',
      saving: 'Saving…',
    },
    private: {
      nav: {
        dashboard: 'Dashboard',
        organizations: 'Organizations',
        services: 'Services',
        suggestions: 'Suggestions',
        auditLog: 'Activity log',
        bookRedemptions: 'Book redemptions',
        announcements: 'Announcements',
        systemStatus: 'System status',
        errorLogs: 'Error logs',
        users: 'Users',
        plans: 'Plans',
        products: 'Products',
        subscriptions: 'Subscriptions',
        courses: 'Courses',
        auditLogs: 'Audit Logs',
        organization: 'Organization',
        myProducts: 'My Products',
        myCourses: 'My Courses',
        mySubscriptions: 'My Subscriptions',
        billing: 'Billing',
        requests: 'Requests',
        requestsReview: 'Review requests',
        profile: 'Profile',
        joinOrganization: 'Join organization',
        catalogProducts: 'Product catalog',
        catalogCourses: 'Course catalog',
        catalogBooks: 'Book catalog',
        catalogResources: 'Resource catalog',
        favorites: 'Favorites',
        myPurchases: 'My purchases',
        myBooks: 'My books',
        myResources: 'My resources',
        redeemCode: 'Redeem code',
        catalogManage: 'Catalog management',
        purchasesAdmin: 'Purchases',
        orgCatalog: 'Organization catalog',
        orgGrant: 'Send product',
        orgMembers: 'Members',
        groups: {
          command: 'Command Center',
          operations: 'Operations',
          monetization: 'Monetization',
          knowledge: 'Knowledge & Governance',
          account: 'Account',
          catalogs: 'Catalogs',
          library: 'My library',
          admin: 'Administration',
          organization: 'Organization',
        },
      },
      common: {
        updating: 'Updating…',
        total: 'total',
        couldNotLoad: 'Could not load',
        loading: 'Loading',
        authError: 'Auth error',
        pageOf: 'Page {{page}} of {{pageCount}}',
        exportCsv: 'Export CSV',
      },
      dashboard: {
        welcome: 'Welcome',
        controlPanel: 'Control panel for your workspace: organizations, users and billing.',
        goToOrganizations: 'Go to Organizations',
        quickActions: 'Quick actions',
        shortcuts: 'Shortcuts to the main areas.',
        recentActivity: 'Recent activity',
        tenantsHint: 'Your tenants',
        usersHint: 'Team',
        plansHint: 'Billing',
        productsHint: 'Catalog',
        subscriptionsHint: 'Revenue',
      },
    },
  },
  es: {
    nav: {
      home: 'Inicio',
      whatsIncluded: 'Qué incluye',
      platform: 'Plataforma',
      plans: 'Planes',
      about: 'Sobre ASE',
      story: 'Historia',
      contact: 'Contacto',
      cta: 'Empezar gratis',
      clients: 'Acceso clientes',
    },
    notFound: {
      badge: 'Página no encontrada',
      title: 'Esta página no existe o fue movida.',
      subtitle: 'Revisa la URL o vuelve al inicio para seguir explorando ASE.',
      home: 'Volver al inicio',
      contact: 'Contacto',
    },
    dashboardWelcome: {
      greeting: 'Bienvenido de nuevo, {{name}}',
    },
    twoFactorGrace: {
      title: 'Activa la verificación en dos pasos',
      body: 'Te queda(n) {{days}} día(s) para activar 2FA en tu cuenta, o se desactivará automáticamente por seguridad.',
      bodyToday: 'Hoy es tu último día para activar 2FA en tu cuenta, o se desactivará automáticamente por seguridad.',
      cta: 'Activar ahora',
      later: 'Recordarmelo después',
    },
    suspendedGate: {
      badge: 'Cuenta desactivada',
      twoFactor: {
        title: 'Activa el 2FA para recuperar el acceso',
        body: 'Tu cuenta se desactivó porque no se activó la verificación en dos pasos dentro del plazo de gracia. Configúrala abajo para recuperar el acceso completo al instante.',
      },
      generic: {
        title: 'Tu cuenta está desactivada',
        body: 'Tu cuenta ha sido desactivada. Contacta con soporte si crees que esto es un error.',
      },
      logout: 'Cerrar sesión',
    },
    servicesPage: servicesPageEs,
    platformPage: platformPageEs,
    aboutPage: aboutPageEs,
    organizationsPage: organizationsPageEs,
    organizationWorkspace: organizationWorkspaceEs,
    orgMembership: orgMembershipEs,
    redeemCode: redeemCodeEs,
    usersPage: usersPageEs,
    plansPage: plansPageEs,
    requestsPage: requestsPageEs,
    creatorApplication: creatorApplicationEs,
    catalog: catalogEs,
    independentDashboard: independentDashboardEs,
    profilePage: profilePageEs,
    adminDashboard: adminDashboardEs,
    adminCatalog: adminCatalogEs,
    adminPurchases: adminPurchasesEs,
    adminAuditLog: adminAuditLogEs,
    adminBookRedemptions: adminBookRedemptionsEs,
    adminSearch: adminSearchEs,
    adminAnnouncements: adminAnnouncementsEs,
    adminSystemStatus: adminSystemStatusEs,
    adminErrorLogs: adminErrorLogsEs,
    servicesAdmin: servicesAdminEs,
    cta: {
      talkToUs: 'Hablemos',
      clientLogin: 'Acceso clientes',
      contact: 'Contacto',
      login: 'Acceder',
    },
    hero: {
      badge: 'La plataforma de referencia para profesionales y equipos QA',
      title: 'Todo lo que necesitas para dominar la calidad del software. En un solo lugar.',
      subtitle:
        'Arce Sabin Engineering reúne cursos, plantillas, herramientas, libros y servicios de consultoría QA premium — diseñada para profesionales independientes y equipos que quieren escalar sin caos. Suscríbete una vez, accede a todo.',
      primaryCta: 'Explorar la plataforma',
      secondaryCta: 'Ver planes',
      trust: {
        governance: {
          label: 'PARA PROFESIONALES',
          value: 'Cursos, plantillas y herramientas para crecer como QA Lead o SDET',
        },
        quality: {
          label: 'PARA EQUIPOS',
          value: 'Frameworks, automatización y formación para equipos que entregan con calidad',
        },
        speed: {
          label: 'PARA EMPRESAS',
          value: 'Planes multi-organización con RBAC, auditoría y consultoría incluida',
        },
      },
      preview: {
        title: 'ASE Platform',
        liveBadge: '● Live',
        maintenanceBadge: '● Mantenimiento',
        plansTitle: 'PLANES',
        servicesTitle: 'SERVICIOS',
        statusTitle: 'ESTADO',
        unavailable: 'No disponible',
        perMonth: '/mes',
        statusValues: {
          ok: 'ok',
          error: 'error',
          active: 'activo',
        },
        plansCount: '{{count}} planes',
        categories: {
          platform_engineering: 'Plataforma',
          qa_automation: 'Automatización QA',
          training: 'Formación',
          digital_products: 'Digital',
          consulting: 'Consultoría',
          ai_automation: 'IA',
          frameworks: 'Frameworks',
        },
        status: {
          backend: 'BACKEND',
          db: 'DB',
          api: 'API',
          plans: 'PLANES',
        },
      },
    },
    services: {
      sectionBadge: 'Qué construye ASE',
      title: 'Servicios de ingeniería compuestos como producto',
      subtitle:
        'No tareas sueltas: bloques de entrega coherentes con gobernanza, calidad y operabilidad desde el día uno.',
      blocks: {
        s1: {
          title: 'Ingeniería de plataformas SaaS',
          description:
            'Diseñamos y construimos productos multi-tenant con gobernanza integrada para que tu plataforma siga siendo predecible al escalar.',
          bullets: [
            'Estrategia de contexto de organización y aislamiento',
            'Modelo RBAC y trazabilidad',
            'Dashboards y workflows pensados para operadores',
            'Roadmap incremental alineado al negocio',
          ],
          stats: [
            { label: 'Alcance típico', value: 'MVP de plataforma → escala' },
            { label: 'Postura de stack', value: 'API-first · observable' },
          ],
        },
        s2: {
          title: 'Arquitectura de automatización QA',
          description:
            'Ecosistemas de automatización que reducen riesgo y aceleran la entrega: estrategia, frameworks y CI.',
          bullets: [
            'Estrategia de tests unit/integración/e2e',
            'Templates y buenas prácticas de framework',
            'Pipelines CI y señales de feedback rápido',
            'Quality gates sin frenar al equipo',
          ],
          stats: [
            { label: 'Profundidad de integración', value: 'Pipelines + dashboards' },
            { label: 'Modelo operativo', value: 'Velocidad gobernada' },
          ],
        },
        s3: {
          title: 'Automatización de procesos de negocio',
          description:
            'Herramientas internas y automatización de flujos para reducir fricción operativa y hacer procesos medibles.',
          bullets: [
            'Mapeo de procesos y límites del sistema',
            'UX para workflows back-office',
            'Trazabilidad lista para auditoría',
            'Automatización alineada a KPIs y ownership',
          ],
          stats: [
            { label: 'Foco del resultado', value: 'Horas ahorradas / semana' },
            { label: 'Seguridad', value: 'Humano en el bucle' },
          ],
        },
        s4: {
          title: 'Formación técnica y frameworks',
          description:
            'Habilitación de equipos: patrones, playbooks y plantillas productivas para estandarizar calidad.',
          bullets: [
            'Rutas de formación y documentación interna',
            'Starter kits y convenciones',
            'Procesos de revisión y disciplina de entrega',
            'Módulos reutilizables para iterar más rápido',
          ],
          stats: [
            { label: 'Formatos', value: 'Remoto / presencial' },
            { label: 'Profundidad', value: 'Principiante → avanzado' },
          ],
        },
      },
      methodology: ['Diseño', 'Construcción', 'Automatización', 'Observabilidad', 'Escala', 'Hardening'],
      blueprintLabel: 'Plano de entrega',
    },
    modules: {
      badge: 'Módulos de plataforma',
      title: 'Un sistema conectado — no features aisladas',
      subtitle:
        'Los módulos están diseñados para trabajar juntos: contexto de organización, políticas RBAC, billing y auditoría comparten un backbone coherente.',
      coreTitle: 'Núcleo ASE',
      coreSubtitle: 'Contexto · Políticas · Eventos',
      integrityTitle: 'Integridad de datos',
      integrityBody: 'Un backbone que mantiene permisos, suscripciones y gobernanza consistentes.',
      pills: { rbac: 'RBAC', audit: 'Auditoría', billing: 'Billing', catalog: 'Catálogo' },
      cards: {
        auth: { title: 'Auth & Usuarios', desc: 'Identidad, sesiones y ciclo de vida.' },
        orgs: { title: 'Organizaciones', desc: 'Modelo multi-tenant y membresías.' },
        roles: { title: 'Roles y permisos', desc: 'Políticas RBAC para operadores.' },
        plans: { title: 'Planes y suscripciones', desc: 'Billing y lifecycle.' },
        products: { title: 'Productos', desc: 'Catálogo y accesos.' },
        courses: { title: 'Cursos', desc: 'Portal de formación e inscripciones.' },
        audit: { title: 'Logs de auditoría', desc: 'Trazabilidad y señales de gobernanza.' },
      },
    },
    process: {
      badge: 'Proceso',
      title: 'Un flujo de entrega pensado para la confianza',
      subtitle:
        'De discovery a escala, alineamos gobernanza, calidad y operabilidad para mantener sistemas predecibles.',
      steps: {
        s1: { title: 'Discover', desc: 'Entender restricciones, stakeholders y necesidades de gobernanza.' },
        s2: { title: 'Design', desc: 'Definir límites multi-tenant, permisos y arquitectura modular.' },
        s3: { title: 'Build', desc: 'Entregar incrementalmente con interfaces limpias y schemas estables.' },
        s4: { title: 'Automate', desc: 'Estrategia de tests, ecosistema QA y tooling operativo.' },
        s5: { title: 'Scale', desc: 'Endurecer fiabilidad, observabilidad y readiness enterprise.' },
      },
    },
    why: {
      badge: 'Por qué ASE',
      title: 'Rigor de ingeniería — entrega con empatía',
      subtitle: 'La claridad de un equipo de producto con la disciplina de platform engineering.',
      pillars: {
        p1: {
          title: 'Disciplina de ingeniería',
          desc: 'Integridad de schemas, migraciones, APIs predecibles y seguridad operativa.',
          detail: 'Límites claros · resultados medibles',
        },
        p2: {
          title: 'Mentalidad quality-first',
          desc: 'Automatización y feedback loops rápidos integrados en el sistema de entrega.',
          detail: 'Estrategia de tests · señales CI',
        },
        p3: {
          title: 'Pensamiento de producto',
          desc: 'Sistemas para operadores: claridad, usabilidad y ownership.',
          detail: 'UX para admins · gobernanza',
        },
      },
    },
    pricing: {
      badge: 'Planes y precios',
      title: 'Elige tu plan. Accede a todo el ecosistema ASE.',
      subtitle: 'Un solo precio. Cursos, plantillas, herramientas, recursos y consultoría — sin sorpresas.',
      starterPara:
        'Profesionales QA independientes, juniors y freelancers que quieren crecer con recursos de calidad.',
      professionalPara:
        'QA Leads, equipos pequeños, consultoras y startups que necesitan gestión, automatización y formación avanzada.',
      enterprisePara:
        'Empresas, consultoras y academias que necesitan gestión multi-organización, formación corporativa y consultoría incluida.',
      guarantee: {
        title: 'Sin riesgo',
        text: 'Cancela cuando quieras. Sin permanencia. Sin letra pequeña.',
        item1: 'Cancela en cualquier momento',
        item2: 'Soporte incluido en todos los planes',
        item3: 'Acceso inmediato tras el pago',
      },
      monthly: 'Mensual',
      yearly: 'Anual',
      save: 'Ahorra hasta 2 meses',
      perMonth: '/mes',
      perYear: '/año',
      loadError: 'No pudimos cargar los planes. Revisa la conexión e inténtalo de nuevo.',
      loadingHint: 'Cargando planes…',
      empty: 'No hay planes públicos disponibles en este momento.',
      retry: 'Reintentar',
      customPrice: 'Personalizado',
      plans: {
        free: {
          name: 'Gratis',
          desc: 'Para personas explorando automatización, recursos QA y fundamentos de plataforma.',
          features: [
            'Workspace personal',
            'Acceso a recursos gratuitos',
            'Preview básico de plataforma',
            'Contenido de aprendizaje comunitario',
            'Acceso limitado a productos',
          ],
          cta: 'Empezar gratis',
        },
        pro: {
          name: 'Pro',
          badge: 'Recomendado',
          desc:
            'Para profesionales y pequeños equipos que necesitan frameworks, utilidades de automatización y assets técnicos estructurados.',
          features: [
            'Todo lo de Gratis',
            'Acceso a framework QA',
            'Plantillas técnicas',
            'Herramientas de producto',
            'Contenido de formación',
            'Actualizaciones prioritarias',
          ],
          cta: 'Empezar Pro',
        },
        business: {
          name: 'Empresa',
          desc:
            'Para compañías que necesitan usuarios, roles, suscripciones, herramientas internas y flujos de automatización.',
          features: [
            'Organización multiusuario',
            'Roles y permisos',
            'Control de acceso a productos',
            'Dashboards de negocio',
            'Logs de auditoría',
            'Workflows de automatización',
            'Canal de soporte',
          ],
          cta: 'Hablemos',
        },
        enterprise: {
          name: 'Enterprise',
          desc:
            'Para organizaciones que necesitan plataformas a medida, integraciones, arquitectura, automatización QA y soporte dedicado.',
          features: [
            'Plataforma SaaS a medida',
            'Soporte de arquitectura dedicado',
            'Workflows privados',
            'Integraciones enterprise',
            'Automatización a medida',
            'Seguridad y gobernanza',
            'Asesoría técnica',
          ],
          cta: 'Contactar ventas',
        },
      },
    },
    finalCta: {
      badge: 'Siguiente paso',
      title: 'Construye una plataforma en la que tu negocio pueda confiar.',
      subtitle: 'Alineemos restricciones, gobernanza y roadmap — y entrega con confianza.',
    },
    impersonation: {
      bannerText: 'Viendo como {{email}}',
      returnToAdmin: 'Volver a admin',
      confirmTitle: '¿Iniciar sesión como este usuario?',
      confirmBody:
        'Verás el producto exactamente como lo ve {{email}}, durante un máximo de 30 minutos. Esto queda registrado en el log de actividad.',
      confirmAction: 'Iniciar sesión como usuario',
      cancel: 'Cancelar',
      action: 'Iniciar sesión como usuario',
      error: 'No se pudo iniciar la sesión de impersonación.',
    },
    footer: {
      tagline: 'La plataforma de referencia para profesionales y equipos QA.',
      copyright: '© 2026 Arce Sabin Engineering. Todos los derechos reservados.',
      col2Title: 'Plataforma',
      col3Title: 'Empresa',
      link1: 'Qué incluye',
      link2: 'Plataforma',
      link3: 'Planes',
      link4: 'Acceso clientes',
      linkRedeem: 'Canjear código de libro',
      link5: 'Sobre ASE',
      link6: 'Contacto',
      response: 'Respuesta en menos de 24h',
      legalPrivacy: 'Política de Privacidad',
      legalTerms: 'Términos de Servicio',
      claim:
        'Plataformas premium y ecosistemas de automatización — con gobernanza, calidad y velocidad.',
      tags: { enterprise: 'Listo para enterprise', automation: 'Automation-first', rbac: 'RBAC y gobernanza' },
      cols: {
        company: 'Empresa',
        platform: 'Plataforma',
        services: 'Servicios',
        contact: 'Contacto',
      },
      links: {
        home: 'Inicio',
        about: 'Sobre ASE',
        story: 'Historia',
        platformOverview: 'Overview',
        clientLogin: 'Acceso clientes',
        servicesWhat: 'Qué construimos',
        platformModules: 'Módulos',
        talk: 'Hablemos',
        pricing: 'Planes',
      },
      rights: '© 2026 Arce Sabin Engineering. Todos los derechos reservados.',
      location: 'Madrid · Remoto',
      bullets: { security: 'Seguridad', rbac: 'RBAC', enterprise: 'Nivel enterprise' },
      brandDescription:
        'Plataformas SaaS premium, automatización QA y arquitectura de software para empresas que necesitan velocidad, calidad y control.',
      company: 'Empresa',
      about: 'Sobre ASE',
      story: 'Historia',
      contact: 'Contacto',
      platform: 'Plataforma',
      pricing: 'Planes',
      clientLogin: 'Acceso clientes',
      services: 'Servicios',
      saasPlatformEngineering: 'Ingeniería de plataformas SaaS',
      qaAutomationArchitecture: 'Arquitectura de automatización QA',
      businessProcessAutomation: 'Automatización de procesos de negocio',
      technicalTraining: 'Formación técnica',
      linkedin: 'LinkedIn',
      securityFirst: 'Seguridad primero',
      rbacReady: 'Listo para RBAC',
      enterpriseGrade: 'Nivel enterprise',
    },
    pages: {
      about: {
        badge: 'Sobre ASE',
        title: 'Sobre ASE',
        p1:
          'Arce Sabin Engineering es un estudio de ingeniería orientado a producto. Construimos plataformas premium para organizaciones que necesitan operaciones seguras, roles claros y resultados medibles.',
        p2:
          'Mezclamos arquitectura, disciplina de entrega y UX moderna para que los equipos avancen rápido sin perder gobernanza.',
        viewServices: 'Ver servicios',
      },
      platform: {
        badge: 'Plataforma',
        title: 'Una base segura para productos multi-tenant',
        body:
          'El blueprint de ASE prioriza gobernanza, claridad y escalabilidad. Ayuda a moverse rápido manteniendo permisos, contexto y monetización consistentes.',
        services: 'Servicios',
        contact: 'Contacto',
        clientLogin: 'Acceso clientes',
      },
      story: {
        badge: 'Historia',
        title: 'Una historia práctica sobre construir plataformas',
        body:
          'ASE se basa en una idea simple: los grandes sistemas están gobernados, son observables y agradables de operar. El resultado: software en el que se confía y que escala.',
        about: 'Sobre ASE',
        contact: 'Contacto',
      },
      contact: {
        badge: 'HABLEMOS',
        title: '¿Tienes un reto de calidad? Cuéntanos.',
        body:
          'Ya sea que quieras explorar la plataforma, tienes preguntas sobre un plan Enterprise, o necesitas consultoría QA para tu equipo — estamos aquí. Te respondemos en menos de 24 horas en días laborables.',
        trust1: 'Respuesta en menos de 24h',
        trust2: 'Sin compromiso',
        trust3: 'Para planes Enterprise, consultoría incluida',
        footerText:
          'También puedes escribirnos directamente a contact@arcesabinengineering.com o conectar en LinkedIn con Roberto Arce Sabín.',
        sendTitle: 'Enviar mensaje',
        sendSubtitle: 'Respondemos en 1–2 días laborables.',
        fields: {
          name: 'Nombre',
          email: 'Email',
          company: 'Empresa',
          message: 'Mensaje',
          namePh: 'Tu nombre',
          companyPh: 'Empresa / equipo',
          messagePh: '¿Qué estás construyendo? ¿Qué restricciones importan más?',
        },
        openClient: 'Abrir cliente de email',
        details: 'Detalles',
        location: 'Ubicación',
        focus: 'Enfoque',
        focusBody: 'RBAC, plataformas multi-tenant, UX premium, tooling operativo',
        response: 'Tiempo de respuesta',
        responseBody: '1–2 días laborables',
        subject: 'ASE — Solicitud de contacto',
      },
      services: {
        badge: 'Servicios',
        title: 'Servicios de ingeniería para plataformas enterprise',
        body:
          'Colaboramos para construir sistemas seguros y mantenibles con gobernanza clara. De foundations a aceleración: foco en resultados que tu organización pueda operar con confianza.',
        contact: 'Contacto',
        platformOverview: 'Overview de plataforma',
      },
    },
    header: {
      menu: 'Menú',
    },
    auth: {
      backHome: 'Volver al inicio',
      backToLogin: 'Volver a acceder',
      bullets: ['Autenticación segura', 'Contexto de organización', 'Permisos RBAC', 'Operaciones SaaS'],
      login: {
        badge: 'Workspace cliente',
        title: 'Accede a tu workspace de ingeniería',
        body: 'Gestiona organizaciones, usuarios, roles, suscripciones y productos desde una plataforma segura.',
        formTitle: 'Acceder',
        formSubtitle: 'Usa tu cuenta para entrar al panel.',
        loading: 'Entrando…',
        submit: 'Acceder',
        noAccount: '¿Aún no tienes cuenta?',
        createAccount: 'Crear cuenta',
        forgotPassword: '¿Olvidaste tu contraseña?',
        twoFactorTitle: 'Introduce tu código de verificación',
        twoFactorBody: 'Abre tu app autenticadora e introduce el código de 6 dígitos de esta cuenta.',
        twoFactorCodeLabel: 'Código de verificación',
        twoFactorSubmit: 'Verificar',
        twoFactorError: 'Código no válido o caducado. Inténtalo de nuevo.',
        twoFactorBack: 'Volver a acceder',
        lockedError: 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente — inténtalo de nuevo en {{minutes}} min.',
        lockedErrorGeneric: 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente — inténtalo de nuevo más tarde.',
      },
      register: {
        badge: 'Empieza aquí',
        title: 'Empieza a construir tu workspace ASE',
        body: 'Crea tu cuenta y empieza a definir tu organización, productos y sistemas de automatización.',
        formTitle: 'Crear cuenta',
        formSubtitle: 'Si es posible, usa un email corporativo.',
        loading: 'Creando…',
        submit: 'Crear cuenta',
        haveAccount: '¿Ya tienes cuenta?',
        login: 'Acceder',
      },
      forgotPassword: {
        badge: 'Recuperar cuenta',
        title: 'Recupera el acceso a tu cuenta',
        body: 'Introduce el email de tu cuenta y te enviaremos un enlace para restablecer tu contraseña.',
        formTitle: '¿Olvidaste tu contraseña?',
        formSubtitle: 'Te enviaremos un enlace para restablecerla.',
        loading: 'Enviando…',
        submit: 'Enviar enlace',
        sentTitle: 'Revisa tu correo',
        sentBody: 'Si ese email está registrado, te hemos enviado un enlace para restablecer tu contraseña. Caduca en 60 minutos.',
      },
      resetPassword: {
        badge: 'Recuperar cuenta',
        title: 'Establece una nueva contraseña',
        body: 'Elige una nueva contraseña para tu cuenta.',
        formTitle: 'Restablece tu contraseña',
        formSubtitle: 'Introduce una nueva contraseña.',
        newPassword: 'Nueva contraseña',
        confirmPassword: 'Confirma la nueva contraseña',
        mismatch: 'Las contraseñas no coinciden.',
        loading: 'Guardando…',
        submit: 'Restablecer contraseña',
        expiredError: 'Este enlace no es válido o ha caducado. Solicita uno nuevo.',
        genericError: 'No se pudo restablecer tu contraseña. Inténtalo de nuevo.',
        doneTitle: 'Contraseña actualizada',
        doneBody: 'Tu contraseña se ha restablecido. Ya puedes acceder con tu nueva contraseña.',
        invalidTitle: 'Enlace no válido',
        invalidBody: 'Este enlace de restablecimiento falta o no es válido. Solicita uno nuevo.',
      },
      verifyEmail: {
        badge: 'Verificación de email',
        title: 'Confirma tu correo',
        body: 'Confirmar tu correo desbloquea las compras y mantiene tu cuenta segura.',
        pendingTitle: 'Confirmando tu correo…',
        pendingBody: 'Esto solo tomará un momento.',
        doneTitle: 'Correo confirmado',
        doneBody: 'Tu correo ya está verificado. Ya puedes acceder y usar tu cuenta con normalidad.',
        errorTitle: 'No se pudo confirmar tu correo',
        errorBody: 'Este enlace no es válido o ha caducado. Puedes solicitar uno nuevo desde tu cuenta.',
        invalidTitle: 'Enlace no válido',
        invalidBody: 'Este enlace de verificación falta o no es válido.',
      },
    },
    emailVerification: {
      bannerText: 'Verifica tu correo — las compras están bloqueadas hasta que lo hagas.',
      resend: 'Reenviar correo de verificación',
      sent: 'Correo enviado',
    },
    legal: {
      privacy: {
        badge: 'Legal',
        title: 'Política de Privacidad',
        lastUpdated: 'Última actualización: 12 de agosto de 2026',
        intro:
          'Esta Política de Privacidad explica cómo Arce Sabin Engineering recopila, utiliza y protege tus datos personales cuando usas nuestra plataforma. Se aplica al sitio público, al panel de cliente y al marketplace.',
        sections: [
          {
            heading: 'Responsable del tratamiento',
            body:
              'El responsable del tratamiento es Arce Sabin Engineering (Roberto Arce Sabín), con quien puedes contactar en contact@arcesabinengineering.com. Para cualquier consulta sobre esta política o sobre cómo tratamos tus datos, escríbenos a esa dirección.',
          },
          {
            heading: 'Datos que recopilamos',
            body:
              'Datos de cuenta: nombre, correo electrónico, contraseña cifrada y pertenencia a organizaciones.\nDatos de uso: compras, acceso al catálogo, códigos de canje de libros y tu nombre de usuario de GitHub — solo si canjeas un libro que da acceso a un repositorio.\nDatos de soporte: cualquier información que nos envíes a través del formulario de contacto o una solicitud de soporte.\nDatos técnicos: dirección IP y registros básicos de peticiones, conservados por motivos de seguridad.',
          },
          {
            heading: 'Por qué tratamos tus datos',
            body:
              'Para proporcionar y mantener tu cuenta y tus compras, sobre la base de la ejecución de un contrato.\nPara enviar correos transaccionales como el restablecimiento de contraseña y la verificación de correo, también sobre la base contractual.\nPara mantener registros de seguridad y auditoría, sobre la base de nuestro interés legítimo en prevenir fraude y abuso.\nPara responder a los mensajes que nos envías, sobre la base del consentimiento que otorgas al enviar el formulario de contacto.',
          },
          {
            heading: 'Cuánto tiempo los conservamos',
            body:
              'Conservamos los datos de tu cuenta mientras esté activa. Si eliminas tu cuenta, conservamos el registro mínimo necesario por motivos legales, fiscales o de seguridad, y anonimizamos el resto.',
          },
          {
            heading: 'Con quién los compartimos',
            body:
              'No vendemos tus datos. Los compartimos únicamente con proveedores que actúan en nuestro nombre: infraestructura de alojamiento y base de datos, nuestro proveedor de envío de correo, y — solo si usas la función de canje de libros — GitHub, para darte acceso al repositorio usando el nombre de usuario que nos indiques. Estos proveedores tratan los datos exclusivamente siguiendo nuestras instrucciones.',
          },
          {
            heading: 'Transferencias internacionales',
            body:
              'Algunos de nuestros proveedores pueden tratar datos fuera del Espacio Económico Europeo. En esos casos, aplicamos las garantías exigidas por la normativa de protección de datos, como las cláusulas contractuales tipo.',
          },
          {
            heading: 'Tus derechos',
            body:
              'Tienes derecho a acceder, rectificar, suprimir, limitar u oponerte al tratamiento de tus datos, y a la portabilidad de estos. Puedes ejercer estos derechos escribiendo a contact@arcesabinengineering.com. También tienes derecho a presentar una reclamación ante tu autoridad de protección de datos (en España, la Agencia Española de Protección de Datos).',
          },
          {
            heading: 'Cookies y almacenamiento local',
            body:
              'Nuestra plataforma no utiliza cookies de publicidad o analítica de terceros. Usamos el almacenamiento local del navegador para mantener tu sesión iniciada y recordar tu idioma preferido. Esta información permanece en tu dispositivo y no se comparte con terceros.',
          },
          {
            heading: 'Seguridad',
            body:
              'Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, incluyendo cifrado de contraseñas, conexiones cifradas y controles de acceso. Ningún sistema es completamente seguro, y trabajamos de forma continua para mejorar nuestras garantías.',
          },
          {
            heading: 'Menores de edad',
            body:
              'Nuestros servicios están dirigidos a un uso profesional y no están destinados a menores de 16 años. No recopilamos datos de menores de forma consciente.',
          },
          {
            heading: 'Cambios en esta política',
            body:
              'Podemos actualizar esta política a medida que la plataforma evolucione. Publicaremos la versión actualizada aquí con una nueva fecha de "última actualización" y, cuando proceda, te notificaremos por correo los cambios relevantes.',
          },
          {
            heading: 'Contacto',
            body: 'Cualquier consulta sobre esta política o tus datos puede enviarse a contact@arcesabinengineering.com.',
          },
        ],
      },
      terms: {
        badge: 'Legal',
        title: 'Términos de Servicio',
        lastUpdated: 'Última actualización: 12 de agosto de 2026',
        intro:
          'Estos Términos de Servicio regulan el acceso y uso de la plataforma de Arce Sabin Engineering, incluyendo el marketplace, el panel de cliente y las herramientas de organización.',
        sections: [
          {
            heading: 'Aceptación de estos términos',
            body:
              'Al crear una cuenta o usar la plataforma de Arce Sabin Engineering, aceptas estos Términos de Servicio. Si no estás de acuerdo, por favor no uses la plataforma.',
          },
          {
            heading: 'El servicio',
            body:
              'ASE ofrece un marketplace y un panel de cliente para productos de software, cursos, libros y recursos profesionales, junto con herramientas de gestión de organizaciones y equipos. Las funcionalidades y los precios pueden evolucionar con el tiempo.',
          },
          {
            heading: 'Tu cuenta',
            body:
              'Debes proporcionar información veraz al registrarte y mantener tus credenciales en secreto. Eres responsable de toda la actividad realizada bajo tu cuenta. Avísanos de inmediato a contact@arcesabinengineering.com si sospechas de un uso no autorizado.',
          },
          {
            heading: 'Compras y contenido digital',
            body:
              'Las compras te otorgan una licencia personal e intransferible para acceder al producto, curso o recurso digital correspondiente, para tu uso propio o el de tu organización según corresponda. Las compras se procesan tal como se describe en el momento de la compra; las condiciones concretas de reembolso, si las hubiera, se muestran en ese momento.',
          },
          {
            heading: 'Códigos de canje de libros y acceso a GitHub',
            body:
              'Algunos libros incluyen un código de canje que da acceso a un repositorio de código complementario en GitHub. Al canjear un código y facilitar tu nombre de usuario de GitHub, nos autorizas a invitar a esa cuenta como colaboradora del repositorio correspondiente. Eres responsable de la seguridad de tu propia cuenta de GitHub.',
          },
          {
            heading: 'Organizaciones',
            body:
              'Los propietarios de una organización pueden invitar miembros, gestionar el acceso a elementos compartidos del catálogo y administrar el espacio de trabajo de su equipo. Los propietarios de la organización son responsables de las acciones de los miembros que invitan y gestionan.',
          },
          {
            heading: 'Propiedad intelectual',
            body:
              'Todo el contenido, la marca y el software de la plataforma son propiedad de Arce Sabin Engineering o de sus licenciantes. La compra de acceso a un producto no transfiere la propiedad ni derechos de propiedad intelectual más allá de la licencia concedida.',
          },
          {
            heading: 'Uso aceptable',
            body:
              'Aceptas no hacer un uso indebido de la plataforma: sin intentos de acceso no autorizado, scraping, ingeniería inversa, redistribución del contenido comprado, ni ningún uso que infrinja la normativa aplicable.',
          },
          {
            heading: 'Disponibilidad y cambios',
            body:
              'Procuramos mantener la plataforma disponible, pero no garantizamos un acceso ininterrumpido. Podemos modificar, suspender o descontinuar funcionalidades, avisando con una antelación razonable cuando sea posible.',
          },
          {
            heading: 'Limitación de responsabilidad',
            body:
              'En la medida permitida por la ley, ASE no es responsable de daños indirectos, incidentales o consecuentes derivados del uso de la plataforma. Nada en estos términos limita la responsabilidad que no pueda excluirse conforme a la normativa aplicable.',
          },
          {
            heading: 'Terminación',
            body:
              'Podemos suspender o cancelar cuentas que incumplan estos términos. Puedes cerrar tu cuenta en cualquier momento contactándonos.',
          },
          {
            heading: 'Ley aplicable',
            body:
              'Estos términos se rigen por la ley española. Cualquier disputa se someterá a los tribunales competentes de España, sin perjuicio de los derechos de protección al consumidor de carácter imperativo que puedas tener en tu lugar de residencia.',
          },
          {
            heading: 'Cambios en estos términos',
            body:
              'Podemos actualizar estos términos a medida que la plataforma evolucione. Los cambios relevantes se comunicarán por correo electrónico o a través de la plataforma.',
          },
          {
            heading: 'Contacto',
            body: 'Cualquier consulta sobre estos términos puede enviarse a contact@arcesabinengineering.com.',
          },
        ],
      },
      cookieNotice: {
        text:
          'Usamos almacenamiento local esencial para mantener tu sesión iniciada y recordar tu idioma — sin cookies de seguimiento o publicidad de terceros.',
        accept: 'Entendido',
        learnMore: 'Política de Privacidad',
      },
    },
    session: {
      loggedIn: 'Conectado',
      dashboard: 'Dashboard',
      logout: 'Salir',
      publicSite: 'Sitio público',
    },
    notifications: {
      bellLabel: 'Notificaciones',
      title: 'Notificaciones',
      markAllRead: 'Marcar todo leído',
      empty: 'Todavía no hay notificaciones.',
    },
    suggestions: {
      boxTitle: 'Buzón de sugerencias',
      boxSubtitle: 'Envía una solicitud o recomendación al equipo de ASE.',
      placeholder: '¿Qué te gustaría solicitar o recomendar?',
      targetLabel: 'Enviar a',
      targetPlatform: 'Plataforma ASE (super admin)',
      targetOrganization: 'Mi organización (owner/admin)',
      send: 'Enviar',
      sending: 'Enviando…',
      sent: 'Enviado — gracias por el feedback.',
      error: 'No se pudo enviar tu sugerencia. Inténtalo de nuevo.',
      myTitle: 'Tus sugerencias',
      empty: 'Todavía no has enviado ninguna sugerencia.',
      status: { pending: 'Pendiente', reviewed: 'Revisada', resolved: 'Resuelta' },
      adminNote: 'Nota del equipo',
    },
    adminSuggestions: {
      badge: 'Feedback',
      title: 'Buzón de sugerencias',
      subtitle: 'Solicitudes y recomendaciones enviadas por usuarios y organizaciones.',
      stats: { total: 'Total', pending: 'Pendientes', resolved: 'Resueltas' },
      filterLabel: 'Estado',
      filterAll: 'Todos',
      loadError: 'No se pudieron cargar las sugerencias.',
      emptyTitle: 'Todavía no hay sugerencias',
      emptyDescription: 'Cuando los usuarios envíen solicitudes o recomendaciones, aparecerán aquí.',
      review: 'Revisar',
      modalTitle: 'Revisar sugerencia',
      statusLabel: 'Estado',
      save: 'Guardar',
      saving: 'Guardando…',
    },
    private: {
      nav: {
        dashboard: 'Dashboard',
        organizations: 'Organizaciones',
        services: 'Servicios',
        suggestions: 'Sugerencias',
        auditLog: 'Registro de actividad',
        bookRedemptions: 'Canjeos de libros',
        announcements: 'Anuncios',
        systemStatus: 'Estado del sistema',
        errorLogs: 'Registro de errores',
        users: 'Usuarios',
        plans: 'Planes',
        products: 'Productos',
        subscriptions: 'Suscripciones',
        courses: 'Cursos',
        auditLogs: 'Auditoría',
        organization: 'Organización',
        myProducts: 'Mis productos',
        myCourses: 'Mis cursos',
        mySubscriptions: 'Mis suscripciones',
        billing: 'Facturación',
        requests: 'Solicitudes',
        requestsReview: 'Revisar solicitudes',
        profile: 'Perfil',
        joinOrganization: 'Unirme a una organización',
        catalogProducts: 'Catálogo de productos',
        catalogCourses: 'Catálogo de cursos',
        catalogBooks: 'Catálogo de libros',
        catalogResources: 'Catálogo de recursos',
        favorites: 'Favoritos',
        myPurchases: 'Mis compras',
        myBooks: 'Mis libros',
        myResources: 'Mis recursos',
        redeemCode: 'Canjear código',
        catalogManage: 'Gestión catálogo',
        purchasesAdmin: 'Compras',
        orgCatalog: 'Catálogo de la organización',
        orgGrant: 'Enviar producto',
        orgMembers: 'Miembros',
        groups: {
          command: 'Centro de mando',
          operations: 'Operaciones',
          monetization: 'Monetización',
          knowledge: 'Conocimiento y gobierno',
          account: 'Cuenta',
          catalogs: 'Catálogos',
          library: 'Mi biblioteca',
          admin: 'Administración',
          organization: 'Organización',
        },
      },
      common: {
        updating: 'Actualizando…',
        total: 'total',
        couldNotLoad: 'No se pudo cargar',
        loading: 'Cargando',
        authError: 'Error de sesión',
        pageOf: 'Página {{page}} de {{pageCount}}',
        exportCsv: 'Exportar CSV',
      },
      dashboard: {
        welcome: 'Bienvenido',
        controlPanel: 'Panel de control: organizaciones, usuarios y billing.',
        goToOrganizations: 'Ir a Organizaciones',
        quickActions: 'Acciones rápidas',
        shortcuts: 'Accesos directos a las áreas principales.',
        recentActivity: 'Actividad reciente',
        tenantsHint: 'Tus tenants',
        usersHint: 'Equipo',
        plansHint: 'Billing',
        productsHint: 'Catálogo',
        subscriptionsHint: 'Ingresos',
      },
    },
  },
} as const

