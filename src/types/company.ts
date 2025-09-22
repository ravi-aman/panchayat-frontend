export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export interface SuperAdmin {
  _id: string;
  firstName: string;
  lastName: string;
  photo: string;
}

export interface UserProfile {
  _id: string;
  type: 'user' | 'company';
  username: string;
  bio: string;
}

export interface UserId {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  photo: string;
  profileIds: UserProfile[];
  phone: string;
}

export interface TeamMember {
  userId: UserId;
  role: 'admin' | 'member';
  _id: string;
}

export interface Follower {
  _id: string;
  user: string;
  username: string;
}

export interface Post {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  // Add other post properties as needed
}

export interface Following {
  _id: string;
  user: string;
  username: string;
  // Add other following properties as needed
}

export interface ProfileId {
  _id: string;
  user: string;
  type: 'company';
  username: string;
  image: string;
  bio: string;
  followers: Follower[];
  following: Following[];
  posts: Post[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Fund {
  _id: string;
  amount: number;
  currency: string;
  fundingRound: string;
  investors: string[];
  date: string;
  // Add other fund properties as needed
}

export interface PitchDeckSlide {
  _id: string;
  slideNumber: number;
  title: string;
  content: string;
  imageUrl?: string;
  // Add other slide properties as needed
}

export interface Company {
  notificationSettings: NotificationSettings;
  _id: string;
  name: string;
  type: 'startup' | 'msme';
  registeredEntity: string;
  tagline: string;
  description: string;
  industry: string;
  companySize: string;
  city: string;
  state: string;
  country: string;
  stage: string;
  establishedYear: string;
  fundedType: string;
  website: string;
  phone: string;
  email: string;
  socialLinks: string[];
  logo: string;
  banner: string;
  superAdmin: SuperAdmin;
  teamMembers: TeamMember[];
  ProfileId: ProfileId;
  jobs: Job[];
  funds: Fund[];
  slug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  isDeleted: boolean;
  verified: boolean;
  verificationStatus: 'approved' | 'pending' | 'rejected';
  pitchDeckSlides: PitchDeckSlide[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Address {
  '@type': 'PostalAddress';
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
}

export interface ContactPoint {
  '@type': 'ContactPoint';
  telephone: string;
  email: string;
  contactType: string;
}

export interface StructuredData {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  foundingDate: string;
  industry: string;
  numberOfEmployees: string;
  address: Address;
  contactPoint: ContactPoint;
  sameAs: string[];
}

export interface SEO {
  canonicalUrl: string;
  structuredData: StructuredData;
}

export interface CompanyResponse {
  status: 'success' | 'error';
  company: Company;
  seo: SEO;
}

export interface Job {
  _id: string;
  title: string;
  location: string;
  type: string;
  salary: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience?: string;
  skills?: string[];
  postedDate?: string;
  applicationDeadline?: string;
}

export interface StartupRegisterFormData {
  name: string;
  registeredEntity: string;
  tagline: string;
  description: string;
  industry: string;
  companySize: string;
  city: string;
  state: string;
  country: string;
  stage: string;
  establishedYear: string;
  fundedType: string;
  website: string;
  phone: string;
  email: string;
  socialLinks: string[];
  logo: string;
  banner: string;
  superAdmin: string;
}

export interface MsmeRegisterFormData {
  name: string;
  registeredEntity: string;
  tagline: string;
  description: string;
  industry: string;
  companySize: string;
  city: string;
  stage: string;
  establishedYear: string;
  fundedType: string;
  website: string;
  phone: string;
  email: string;
  socialLinks: string[];
  logo: string;
  banner: string;
}
