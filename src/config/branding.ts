/**
 * Centralized Branding Configuration for JeevaCare
 * Ensures consistent name, tagline, colors, and asset references throughout the application.
 */

export const BRANDING = {
  name: 'JeevaCare',
  fullName: 'JeevaCare — Maternal & Newborn Emergency Platform',
  tagline: 'Every Mother. Every Newborn. Every Moment.',
  category: 'Maternal & Newborn Emergency Care Coordination Platform',
  organization: 'Govt. of Maharashtra / NHM Emergency Obstetric Network',
  district: 'Pune District Pilot',

  // Official Healthcare Palette
  colors: {
    primaryTeal: '#0F766E', // Medical Teal
    primaryTealHover: '#0D635C',
    deepNavy: '#12304A', // Deep Healthcare Navy
    deepNavyLight: '#172638',
    softMint: '#E8F5F3', // Soft Mint background accents
    softMintHover: '#D4ECE8',
    cloudBg: '#F7FAFC', // Main page surface
    cardBg: '#FFFFFF', // Pure white cards
    slateText: '#334155', // Body text
    mutedText: '#64748B', // Secondary text
    softBorder: '#DCE7EC', // Card dividers and borders
    successGreen: '#15803D', // Verified & completed actions
    warningAmber: '#D97706', // Pending & warning alerts
    emergencyRed: '#DC2626', // Critical emergency actions only
    emergencyRedHover: '#B91C1C',
    infoBlue: '#2563EB', // Informational & transit badges
  },

  // Asset paths
  assets: {
    logoSvg: '/jeevacare-logo.svg',
    logoSymbolSvg: '/jeevacare-symbol.svg',
    faviconSvg: '/favicon.svg',
    officialLogoPng: '/logo.png', // Expected file if official raster is placed in /public
  },

  // Emergency Hotlines
  hotlines: {
    emergencyAmbulance: '108',
    maternalHelpline: '102',
    centralDesk: '+91 20 2612 7394',
  },
} as const;

export type BrandingConfig = typeof BRANDING;
