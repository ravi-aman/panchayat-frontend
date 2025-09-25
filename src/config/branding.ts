// ===== PANCHAYAT BRANDING CONFIGURATION =====
// Centralized branding information for the entire application

export const PANCHAYAT_BRANDING = {
  // Basic Information
  name: 'Panchayat',
  tagline: 'Crowdsourced Civic Issue Reporting & Resolution Platform',
  domain: 'panchayat.me',
  url: 'https://panchayat.me',
  
  // Vision & Mission
  vision: 'Panchayat is a next-generation civic engagement platform that empowers citizens to report, track, and resolve everyday issues in their community while enabling governments, NGOs, and organizations to respond transparently and effectively.',
  mission: 'Transform how local governance works by creating a real-time, map-driven, social platform where every pothole, broken streetlight, or sanitation issue is not just reported — but resolved through collective action, accountability, and open data.',
  
  // Big Vision
  bigVision: 'Panchayat = Civic LinkedIn + Google Maps + Twitter for issues. Every ward in India mapped. Every department connected. Every citizen empowered. A national network of real-time civic engagement and accountability.',
  
  // Impact Statement
  impactStatement: 'For Citizens → A transparent, participatory way to improve their city. For Governments → Faster identification & resolution, reduced complaints backlog, better accountability. For Communities & NGOs → A tool to mobilize action, drive campaigns, and measure impact. For India → A unified civic engagement system aligned with Digital India & Smart Cities Mission.',
  
  // Key Value Propositions
  valueProps: [
    'Real-time civic issue reporting with photo, video & location',
    'Interactive maps showing live issue status across communities',
    'Transparent government dashboard with public accountability',
    'AI-powered issue classification and duplicate detection',
    'Social amplification through WhatsApp, Twitter integration',
    'Gamification with citizen rewards and leaderboards'
  ],
  
  // Impact Numbers (can be updated as platform grows)
  impact: {
    citizens: '10,000+',
    issues: '25,000+',
    resolved: '15,000+',
    cities: '50+',
    wards: '500+'
  },
  
  // Social Media & Contact
  social: {
    twitter: '@PanchayatIndia',
    twitterUrl: 'https://twitter.com/PanchayatIndia',
    linkedin: 'https://linkedin.com/company/panchayat-india',
    instagram: '@panchayat.india',
    facebook: 'https://facebook.com/PanchayatIndia'
  },
  
  contact: {
    email: 'support@panchayat.me',
    phone: '+91-9876543210',
    address: 'Ranchi, Jharkhand, India'
  },
  
  // Features Overview
  features: {
    citizenReporting: {
      title: 'Citizen-Centric Issue Reporting',
      description: 'Mobile-first interface with photo, video, voice, and location tagging. One-tap reporting through app or WhatsApp bot. Duplicate issue detection → merges reports into threads for clarity.',
      benefits: [
        'Mobile-first interface with photo, video, voice, and location tagging',
        'One-tap reporting through app or WhatsApp bot',
        'Duplicate issue detection → merges reports into threads for clarity',
        'Real-time issue feed with social features (like, comment, upvote, repost)'
      ]
    },
    interactiveMap: {
      title: 'Interactive Map (Powered by MapLibre + OSM + Govt GIS)',
      description: 'Base map of India down to district, ward, and colony levels with comprehensive layers and real-time tracking.',
      benefits: [
        'Base map of India down to district, ward, and colony levels',
        'Layers for roads, utilities, public services, water bodies, civic assets',
        'Live issue markers → color-coded by status (Open, In-progress, Resolved)',
        'Heatmaps for issue density + time-based trends',
        'Department/service overlays (electricity offices, sanitation depots, ward offices)'
      ]
    },
    transparency: {
      title: 'Transparency & Social Amplification',
      description: 'Each issue has a thread → all duplicates + updates linked together. Users can share issues to WhatsApp, Twitter, and other platforms.',
      benefits: [
        'Each issue has a thread → all duplicates + updates linked together',
        'Users can share issues to WhatsApp, Twitter, and other platforms',
        'If an issue trends, it\'s auto-escalated to higher authorities & tagged on social media',
        'Public dashboard shows resolved vs pending issues for each ward/city'
      ]
    },
    govDashboard: {
      title: 'Government & Admin Dashboard',
      description: 'Smart routing engine → auto-assigns issues to relevant department with comprehensive analytics and accountability tools.',
      benefits: [
        'Smart routing engine → auto-assigns issues to relevant department (sanitation, PWD, electricity)',
        'Filter & categorize by location, priority, or department',
        'Status updates: Acknowledged → In-progress → Resolved → Verified',
        'Analytics: Avg. resolution time, most common issues, ward-wise performance',
        'Accountability: Leaderboards for departments/wards with best performance'
      ]
    },
    aiPowered: {
      title: 'AI-Powered Intelligence',
      description: 'Image & text classification → auto-detect issue type. Duplicate detection → merges reports on same problem. Priority scoring based on impact.',
      benefits: [
        'Image & text classification → auto-detect issue type (pothole, garbage, streetlight)',
        'Duplicate detection → merges reports on same problem',
        'Priority scoring → hospital road pothole > empty plot garbage',
        'Insights & predictions → "Ward 12 has rising garbage complaints this month"'
      ]
    },
    community: {
      title: 'Engagement & Community',
      description: 'Gamification → badges, rewards for active reporters. Community threads for local discussions. NGOs, RWAs can adopt issues.',
      benefits: [
        'Gamification → badges, rewards for active reporters',
        'Community threads for local discussions',
        'NGOs, RWAs, and private orgs can adopt issues (CSR opportunities)',
        'Citizen leaderboard: Top contributors of the month in each area'
      ]
    },
    scalableBackend: {
      title: 'Scalable Backend',
      description: 'APIs → Open for third-party civic integrations with resilient cloud infrastructure.',
      benefits: [
        'APIs → Open for third-party civic integrations',
        'PostGIS + MongoDB for spatial + social data',
        'ElasticSearch for search & classification',
        'Queue workers for image processing & notifications',
        'Resilient cloud infra → handles spikes in citizen reporting'
      ]
    }
  },
  
  // Technical Highlights
  tech: {
    frontend: ['React Native (mobile)', 'Next.js (web)', 'MapLibre (maps)'],
    backend: ['Node.js + Express + GraphQL API', 'PostGIS (geospatial)', 'MongoDB (social features)'],
    integrations: ['OSM', 'Bhuvan', 'data.gov.in', 'State GIS', 'WhatsApp/Twitter APIs'],
    ai: ['ML models for classification', 'duplicate detection', 'priority scoring'],
    infrastructure: ['Docker + Kubernetes for scalability']
  },
  
  // Example User Flow
  userFlow: {
    steps: [
      'A citizen sees a pothole → takes a photo → reports on Panchayat app',
      'AI classifies it as "Road Issue" → auto-tags PWD Department',
      'Issue appears on city map + shared on WhatsApp group',
      '50 others upvote → visibility rises → Twitter bot tags @RanchiMunicipal',
      'PWD updates status → "Work order issued"',
      'Citizen gets push notification → "Your issue is being fixed"',
      'After completion, others verify with photos → status = Resolved ✅'
    ]
  },
  
  // Meta Information for SEO
  meta: {
    keywords: [
      'civic engagement',
      'issue reporting',
      'local governance',
      'smart city',
      'digital india',
      'community platform',
      'government transparency',
      'citizen participation',
      'civic tech',
      'urban planning',
      'public services',
      'municipal services',
      'crowd sourcing',
      'social impact'
    ],
    description: 'Panchayat is a next-generation civic engagement platform that empowers citizens to report, track, and resolve everyday issues in their community. Transform local governance through real-time, map-driven civic action.',
    ogImage: '/og-panchayat.png',
    twitterImage: '/twitter-panchayat.png'
  },
  
  // Brand Colors & Styling
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#06B6D4'
  },
  
  // Target Audience
  audience: {
    primary: 'Citizens aged 18-65 seeking better civic services',
    secondary: 'Government officials and municipal departments',
    tertiary: 'NGOs, RWAs, and community organizations'
  },
  
  // Value Proposition Statement
  elevator: 'Panchayat is like Google Maps for civic issues - citizens report problems with one tap, government departments get auto-notified, and everyone can track resolution in real-time. We\'re making local governance transparent, accountable, and community-driven.',
  
  // Call to Action Messages
  cta: {
    primary: 'Start Reporting Issues in Your Area',
    secondary: 'Join the Civic Revolution',
    government: 'Transform Your City\'s Governance',
    download: 'Download Panchayat App',
    signup: 'Get Started with Panchayat',
    demo: 'See Panchayat in Action'
  }
} as const;

// Helper functions for dynamic content
export const getPanchayatTitle = (pageName?: string): string => {
  if (pageName) {
    return `${pageName} | ${PANCHAYAT_BRANDING.name} - ${PANCHAYAT_BRANDING.tagline}`;
  }
  return `${PANCHAYAT_BRANDING.name} - ${PANCHAYAT_BRANDING.tagline}`;
};

export const getPanchayatDescription = (pageDescription?: string): string => {
  return pageDescription || PANCHAYAT_BRANDING.meta.description;
};

export const getPanchayatKeywords = (additionalKeywords: string[] = []): string => {
  return [...PANCHAYAT_BRANDING.meta.keywords, ...additionalKeywords].join(', ');
};

// Export individual sections for easy importing
export const { name, tagline, vision, mission, features, social, contact, tech, impact } = PANCHAYAT_BRANDING;