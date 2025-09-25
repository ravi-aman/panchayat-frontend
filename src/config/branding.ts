// ===== PANCHAYAT BRANDING CONFIGURATION =====
// Centralized branding information for the entire application

export const PANCHAYAT_BRANDING = {
  // Basic Information
  name: 'Panchayat',
  tagline: 'Crowdsourced Civic Issue Reporting & Resolution Platform',
  domain: 'panchayat.me',
  url: 'https://panchayat.me',
  
  // Vision & Mission
  vision: 'Transform how local governance works by creating a real-time, map-driven, social platform where every pothole, broken streetlight, or sanitation issue is not just reported — but resolved through collective action, accountability, and open data.',
  mission: 'Empowering citizens to report, track, and resolve everyday issues in their community while enabling governments, NGOs, and organizations to respond transparently and effectively.',
  
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
      description: 'Mobile-first interface with photo, video, voice, and location tagging. One-tap reporting through app or WhatsApp bot.',
      benefits: [
        'Instant photo/video reporting with GPS location',
        'WhatsApp bot integration for easy access',
        'Voice-to-text issue descriptions',
        'Duplicate issue detection and merging'
      ]
    },
    interactiveMap: {
      title: 'Interactive Map Visualization',
      description: 'Real-time map powered by MapLibre + OSM showing live issue status across your community.',
      benefits: [
        'Live issue markers with color-coded status',
        'Heatmaps for issue density analysis',
        'Ward-wise and department overlays',
        'Historical trend visualization'
      ]
    },
    transparency: {
      title: 'Transparency & Social Amplification',
      description: 'Public dashboards and social sharing to ensure accountability and community engagement.',
      benefits: [
        'Public resolution tracking dashboards',
        'Auto-escalation for trending issues',
        'Social media integration and sharing',
        'Department performance leaderboards'
      ]
    },
    govDashboard: {
      title: 'Government & Admin Dashboard',
      description: 'Smart routing engine for departments with comprehensive analytics and accountability tools.',
      benefits: [
        'Auto-assignment to relevant departments',
        'Status tracking from report to resolution',
        'Performance analytics and insights',
        'Ward-wise resolution comparisons'
      ]
    },
    aiPowered: {
      title: 'AI-Powered Intelligence',
      description: 'Machine learning for smart issue classification, duplicate detection, and priority scoring.',
      benefits: [
        'Automatic issue type classification',
        'Smart duplicate detection and merging',
        'Priority scoring based on impact',
        'Predictive insights and trends'
      ]
    },
    community: {
      title: 'Community Engagement',
      description: 'Gamification and social features to build an active civic community.',
      benefits: [
        'Citizen badges and reward system',
        'Community discussion threads',
        'NGO and corporate CSR partnerships',
        'Monthly contributor recognition'
      ]
    }
  },
  
  // Technical Highlights
  tech: {
    frontend: ['React Native (Mobile)', 'Next.js (Web)', 'MapLibre (Maps)', 'Real-time Updates'],
    backend: ['Node.js + Express', 'GraphQL API', 'PostGIS (Geospatial)', 'MongoDB (Social)'],
    integrations: ['OSM Maps', 'Bhuvan GIS', 'WhatsApp API', 'Twitter API', 'Government Data APIs'],
    ai: ['Image Classification', 'Duplicate Detection', 'Priority Scoring', 'Predictive Analytics'],
    infrastructure: ['Docker + Kubernetes', 'Cloud Native', 'Auto-scaling', 'High Availability']
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