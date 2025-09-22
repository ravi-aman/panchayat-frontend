import {
  MapPin,
  Mail,
  Phone,
  Bookmark,
  MessageSquare,
  Star,
  Share2,
  ExternalLink,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from 'lucide-react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Company, TeamMember, Job } from '../../../types/company';
import { getCompanyData } from '../../../utils/companyHelpers';

// Main Component - can be named 'DashboardContent' or similar
const isValidMongoId = (id: string) => /^[a-f\d]{24}$/i.test(id);

interface ApiResponse {
  status: string;
  company: Company;
}

const MsmeDetails = () => {
  const { id, username, slug } = useParams<{ id?: string; username?: string; slug?: string }>();
  // Use any available identifier, preferring username/slug over id
  const companyIdentifier = username || slug || id;
  const navigate = useNavigate();
  const { state } = useLocation();

  const [msme, setMsme] = useState<Company | null>(getCompanyData(state));

  useEffect(() => {
    if (!companyIdentifier) {
      navigate('/404', { replace: true });
    }
  }, [companyIdentifier, navigate]);

  useEffect(() => {
    if (!state?.company && companyIdentifier) {
      const fetchMsme = async () => {
        try {
          // If it's a MongoDB ID, use the ID endpoint, otherwise use the slug endpoint
          const isMongoId = companyIdentifier && isValidMongoId(companyIdentifier);
          const endpoint = isMongoId
            ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/msme/${companyIdentifier}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/v1/company/msme/slug/${companyIdentifier}`;

          const response = await axios.get<ApiResponse>(endpoint);
          if (response.data.status === 'success' && response.data.company) {
            console.log('Fetched MSME:', response.data.company);
            setMsme(response.data.company);
          } else {
            console.error('Invalid response structure:', response.data);
          }
        } catch (error) {
          console.error('Error fetching msme:', error);
        }
      };

      fetchMsme();
    }
  }, [companyIdentifier, state]);

  if (!msme) return <p>No MSME data found.</p>;

  return (
    <div className="flex-1 min-h-screen p-1 font-sans bg-transparent md:p-2 lg:p-4">
      <div className="mx-auto max-w-7xl">
        {/* Page Header: Logo and Company Name */}
        <div className="flex items-center mb-8 space-x-4">
          <div className="p-3 border-gray-300 rounded-full border-1">
            <img
              src={msme.logo}
              alt="Logo"
              className="object-contain w-8 h-8"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://placehold.co/40x40/E2E8F0/4A5568?text=??';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">{msme.name}</h1>
        </div>

        <main className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Main content on the left */}
          <div className="space-y-5 lg:col-span-2">
            <CompanyDetailsCard
              tagline={msme.tagline}
              description={msme.description}
              city={msme.city}
            />
            <ContactInformation phone={msme.phone} email={msme.email} website={msme.website} />
            <SocialMediaLinks links={msme.socialLinks} />
            <OpenPositions jobs={msme.jobs ?? []} />
          </div>

          {/* Sidebar on the right */}
          <div className="space-y-5 lg:col-span-1">
            <ActionButtons />
            <TeamMembers members={msme.teamMembers ?? []} />
          </div>
        </main>
      </div>
    </div>
  );
};

const CompanyDetailsCard = ({
  tagline,
  description,
  city,
}: {
  tagline: string;
  description: string;
  city: string;
}) => (
  <div className="p-6 bg-white rounded-lg shadow-sm">
    <div className="flex items-start justify-between">
      <h2 className="pr-4 text-lg font-semibold text-gray-700">{tagline}</h2>
    </div>
    <p className="mt-2 text-gray-600">{description}</p>
    {/* Social Media Tags */}
    <div className="flex mt-4 space-x-2">
      <span className="flex items-center w-auto px-3 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
        <MapPin className="w-5 h-5 mr-2 text-gray-700" />
        {city}
      </span>
    </div>
  </div>
);

// New Action Buttons Component
const ActionButtons = () => (
  // Changed justify-end to justify-between and removed space-x-4 for equal spacing
  <div className="flex items-center justify-center p-6 space-x-8 text-gray-500 bg-white rounded-lg shadow-sm">
    <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600">
      <Star className="w-5 h-5" />
      <span>5</span>
    </div>
    <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600">
      <MessageSquare className="w-5 h-5" />
      <span>1</span>
    </div>
    <Bookmark className="w-5 h-5 cursor-pointer hover:text-blue-600" />
    <Share2 className="w-5 h-5 cursor-pointer hover:text-blue-600" />
  </div>
);

const ContactInformation = ({
  phone,
  email,
  website,
}: {
  phone: string;
  email: string;
  website: string;
}) => (
  <div className="p-6 bg-white rounded-lg shadow-sm">
    <h3 className="mb-4 text-lg font-semibold text-gray-800">Contact Information</h3>
    <div className="space-y-4">
      <div className="flex flex-wrap items-center text-gray-600">
        <ExternalLink className="w-5 h-5 mr-3 text-gray-400" />
        {website === 'No website available.' ? (
          <span className="text-gray-600">{website}</span>
        ) : (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:underline"
          >
            {website}
          </a>
        )}
        <span className="hidden mx-3 text-gray-300 sm:inline">|</span>
        <Mail className="w-5 h-5 mt-2 mr-2 text-gray-400 sm:mt-0" />
        <span className="mt-2 sm:mt-0">{email}</span>
      </div>
      <div className="flex items-center text-gray-600">
        <Phone className="w-5 h-5 mr-3 text-gray-400" />
        <span>{phone}</span>
      </div>
    </div>
  </div>
);

// Open Positions Component
const OpenPositions = ({ jobs }: { jobs: Job[] }) => {
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Open Positions</h3>
      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job._id}
            className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-md"
          >
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800">{job.title}</h4>
                <span className="px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded-full">
                  {job.type}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-green-600">{job.salary}</span>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => navigate(`/dashboard/jobs/${job._id}`)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Apply Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TeamMembers = ({ members }: { members: TeamMember[] }) => (
  <div className="p-6 bg-white rounded-lg shadow-sm">
    <h3 className="mb-4 text-lg font-semibold text-gray-800">Team members</h3>
    <div className="space-y-4">
      {members.map((member) => {
        const fullName = `${member.userId.firstName} ${member.userId.lastName}`;
        const photo =
          member.userId.photo && member.userId.photo.trim() !== ''
            ? member.userId.photo
            : 'https://placehold.co/40x40/E2E8F0/4A5568?text=fuc';

        const userProfile = member.userId.profileIds.find(
          (profile: any) => profile.type === 'user',
        );

        const username = userProfile?.username || 'unknown';

        return (
          <div key={member._id || fullName} className="flex items-center space-x-3">
            <img
              className="object-cover w-10 h-10 rounded-full"
              src={photo}
              alt={fullName}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://placehold.co/40x40/E2E8F0/4A5568?text=👤';
              }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">{fullName}</p>
              <p className="text-xs text-gray-500">@{username}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const SocialMediaLinks = ({ links }: { links: string[] }) => (
  <div className="p-6 bg-white rounded-lg shadow-sm">
    <h3 className="mb-4 text-lg font-semibold text-gray-800">Social Links</h3>
    <div className="flex space-x-4">
      {links && links.length > 0 ? (
        links.map((link, idx) => (
          <a
            key={idx}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-blue-600"
          >
            {link.includes('facebook') && <Facebook className="w-6 h-6" />}
            {link.includes('twitter') && <Twitter className="w-6 h-6" />}
            {link.includes('linkedin') && <Linkedin className="w-6 h-6" />}
            {link.includes('instagram') && <Instagram className="w-6 h-6" />}
            {!(
              link.includes('facebook') ||
              link.includes('twitter') ||
              link.includes('linkedin') ||
              link.includes('instagram')
            ) && <ExternalLink className="w-6 h-6" />}
          </a>
        ))
      ) : (
        <span className="text-gray-500">No social links available.</span>
      )}
    </div>
  </div>
);

export default MsmeDetails;
