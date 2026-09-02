export const ROLE_FUNCTIONS = [
  'Engineering',
  'AI / Data',
  'Product',
  'Sales / Marketing',
  'Customer',
  'Operations',
  'Hardware / Field',
  'Clinical / Science',
  'Corporate',
  'Other'
] as const;

export type RoleFunction = (typeof ROLE_FUNCTIONS)[number];

export const ROLE_COLORS: Record<RoleFunction, string> = {
  Engineering: '#0b55d4',
  'AI / Data': '#7a4ce0',
  Product: '#008f88',
  'Sales / Marketing': '#f25b2a',
  Customer: '#c18400',
  Operations: '#547341',
  'Hardware / Field': '#a35327',
  'Clinical / Science': '#14835d',
  Corporate: '#46679b',
  Other: '#78849a'
};

export const ROLE_LEVELS = [
  'Internship',
  'Entry level',
  'Mid level',
  'Senior',
  'Lead / Manager',
  'Executive',
  'Unspecified'
] as const;

export type RoleLevel = (typeof ROLE_LEVELS)[number];

export const JOB_CATEGORIES = [
  'Software Engineering',
  'AI & Data',
  'Product Management',
  'Design & User Research',
  'Sales & Business Development',
  'Marketing & Communications',
  'Customer Success & Support',
  'Finance & Accounting',
  'Legal, Risk & Compliance',
  'People & Recruiting',
  'Operations & Program Management',
  'IT & Security',
  'Hardware & Manufacturing',
  'Systems Engineering & Integration',
  'Skilled Trades & Technicians',
  'Quality, Test & Safety',
  'Field Operations & Deployment',
  'Consulting & Professional Services',
  'Clinical & Life Sciences',
  'Automotive & Field Service',
  'Retail & Local Operations',
  'Supply Chain & Logistics',
  'Education & Content',
  'Other'
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const JOB_CATEGORY_COLORS: Record<JobCategory, string> = {
  'Software Engineering': '#0b55d4',
  'AI & Data': '#7a4ce0',
  'Product Management': '#008f88',
  'Design & User Research': '#d14f8b',
  'Sales & Business Development': '#f25b2a',
  'Marketing & Communications': '#d66b00',
  'Customer Success & Support': '#00a0a8',
  'Finance & Accounting': '#46679b',
  'Legal, Risk & Compliance': '#7d5d45',
  'People & Recruiting': '#b84d68',
  'Operations & Program Management': '#547341',
  'IT & Security': '#244f75',
  'Hardware & Manufacturing': '#8a6200',
  'Systems Engineering & Integration': '#375f95',
  'Skilled Trades & Technicians': '#a35327',
  'Quality, Test & Safety': '#9b4a33',
  'Field Operations & Deployment': '#28656c',
  'Consulting & Professional Services': '#5362a8',
  'Clinical & Life Sciences': '#14835d',
  'Automotive & Field Service': '#c64b32',
  'Retail & Local Operations': '#a16a25',
  'Supply Chain & Logistics': '#687c2c',
  'Education & Content': '#9c5e9e',
  Other: '#78849a'
};

export type DirectProvider = 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'smartrecruiters' | 'workable' | 'recruitee';
export type Provider = DirectProvider;

export const SECTORS = [
  'Data & AI',
  'Infrastructure & Cloud',
  'Cybersecurity',
  'Fintech & Crypto',
  'AdTech & Media',
  'Consumer & Marketplaces',
  'Health & Bio',
  'Hardware & Space',
  'Enterprise Software'
] as const;

export type Sector = (typeof SECTORS)[number];

export const SECTOR_COLORS: Record<Sector, string> = {
  'Data & AI': '#7a4ce0',
  'Infrastructure & Cloud': '#0b55d4',
  Cybersecurity: '#d64550',
  'Fintech & Crypto': '#128f5b',
  'AdTech & Media': '#f25b2a',
  'Consumer & Marketplaces': '#d14f8b',
  'Health & Bio': '#14835d',
  'Hardware & Space': '#8a6200',
  'Enterprise Software': '#46679b'
};

export interface CompanyConfig {
  id: string;
  name: string;
  ticker: string;
  exchange: 'NYSE' | 'NASDAQ' | 'UNLISTED';
  jobSeekerOnly?: boolean;
  provider: DirectProvider;
  boardToken: string | string[];
  sector: Sector;
  headquarters: string;
  color: string;
  description: string;
}

export interface NormalizedJob {
  id: string;
  sourceId: string;
  companyId: string;
  company: string;
  ticker: string;
  title: string;
  function: RoleFunction;
  category: JobCategory;
  level: RoleLevel;
  location: string;
  country: string;
  remote: boolean;
  sourceUrl: string;
  provider: Provider;
  firstSeen: string;
  lastSeen: string;
  sourceUpdatedAt?: string;
  sourcePublishedAt?: string;
  current: boolean;
  missingCount: number;
  removedAt?: string;
}

export interface CompanyState {
  lastAttempt?: string;
  lastSuccess?: string;
  consecutiveFailures: number;
  stale: boolean;
  error?: string;
  jobs: Record<string, NormalizedJob>;
}

export interface CollectorState {
  version: 1;
  trackingSince: string;
  lastRun?: string;
  companies: Record<string, CompanyState>;
}

export interface DailyCompanyPoint {
  date: string;
  current: number;
  opened: number;
  removed: number;
  remote?: number;
  stale: boolean;
}

export interface HistoryFile {
  trackingSince: string;
  companies: Record<string, DailyCompanyPoint[]>;
}

export interface PublicationPoint {
  date: string;
  published: number;
  rolling7: number;
  rolling30Weekly: number;
}

export interface PublicationHistoryFile {
  generatedAt: string;
  basis: 'official-publication-timestamps';
  limitation: string;
  companies: Record<string, PublicationPoint[]>;
}

export interface CollectionStatus {
  trackingSince: string;
  generatedAt: string;
  lastSuccessfulRefresh?: string;
  totalSources: number;
  healthySources: number;
  staleSources: number;
  companies: Record<string, {
    stale: boolean;
    lastAttempt?: string;
    lastSuccess?: string;
    consecutiveFailures: number;
    error?: string;
  }>;
}

export interface CompanyProfile extends CompanyConfig {
  currentOpenings: number;
  new7d: number | null;
  published7d: number;
  publicationDelta7d: number;
  published30d: number;
  publicationDelta30d: number;
  publicationIntensity7d: number;
  change7d: number | null;
  change30d: number | null;
  removed7d: number | null;
  remoteShare: number;
  medianOpenDays: number | null;
  stale: boolean;
  lastSuccess?: string;
  functionCounts: Record<RoleFunction, number>;
  levelCounts: Record<RoleLevel, number>;
  locationCounts: Record<string, number>;
}

export interface MarketSector {
  name: Sector;
  color: string;
  companies: number;
  currentOpenings: number;
  published7d: number;
  publicationDelta7d: number;
  remoteShare: number;
  medianOpenDays: number | null;
  leader: { id: string; name: string; ticker: string; currentOpenings: number } | null;
}

export interface MarketFile {
  generatedAt: string;
  day: string;
  sectors: MarketSector[];
  aggregates: {
    currentOpenings: number;
    published7d: number;
    publicationDelta7d: number;
    remoteShare: number;
    medianOpenDays: number | null;
    top10PublicationShare30d: number;
    levelCounts: Record<RoleLevel, number>;
  };
}
