export interface FullJob {
  _id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  salary?: string;
  company: {
    _id: string;
    name: string;
    logo?: string;
    city?: string;
    type?: string;
  };
  postedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  applicationDeadline?: Date;
  isActive?: boolean;
  applicationsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
