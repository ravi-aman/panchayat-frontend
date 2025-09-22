import { MapPin, Clock, Search, Filter, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FullJob } from '../../../types/jobs';

interface ApiResponse {
  status: string;
  jobs: FullJob[];
  totalJobs?: number;
}

const Jobs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [allJobs, setAllJobs] = useState<FullJob[]>([]);

  // Fetch all jobs on component mount to get filter options
  useEffect(() => {
    const fetchAllJobs = async () => {
      try {
        const response = await axios.get<ApiResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/jobs`,
        );
        if (response.data.status === 'success' && response.data.jobs) {
          setAllJobs(response.data.jobs);
        }
      } catch (error) {
        console.error('Error fetching all jobs for filters:', error);
        // Fallback to mock data for development
        setAllJobs(mockJobs);
      }
    };

    fetchAllJobs();
  }, []);

  // Extract unique locations and types from all jobs
  const uniqueLocations = Array.from(new Set(allJobs.map((job) => job.location))).sort();
  const uniqueTypes = Array.from(new Set(allJobs.map((job) => job.type))).sort();

  return (
    <div className="flex-1 p-1 md:p-2 lg:p-4 bg-transparent min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Job Opportunities</h1>
          <p className="text-gray-600">Find your next career opportunity</p>
        </div>

        {/* Search and Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          uniqueLocations={uniqueLocations}
          uniqueTypes={uniqueTypes}
        />

        {/* Jobs List */}
        <JobsList
          searchTerm={searchTerm}
          locationFilter={locationFilter}
          typeFilter={typeFilter}
          navigate={navigate}
        />
      </div>
    </div>
  );
};

const SearchAndFilters = ({
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  typeFilter,
  setTypeFilter,
  uniqueLocations,
  uniqueTypes,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  uniqueLocations: string[];
  uniqueTypes: string[];
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <select
        value={locationFilter}
        onChange={(e) => setLocationFilter(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All Locations</option>
        {uniqueLocations.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All Types</option>
        {uniqueTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Filter className="h-5 w-5 mr-2" />
        Filter
      </button>
    </div>
  </div>
);

const JobsList = ({
  searchTerm,
  locationFilter,
  typeFilter,
  navigate,
}: {
  searchTerm: string;
  locationFilter: string;
  typeFilter: string;
  navigate: (path: string) => void;
}) => {
  const [jobs, setJobs] = useState<FullJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ApiResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/jobs`,
          {
            params: {
              search: debouncedSearchTerm,
              location: locationFilter,
              type: typeFilter,
            },
          },
        );
        if (response.data.status === 'success' && response.data.jobs) {
          setJobs(response.data.jobs);
          console.log('Fetched jobs:', response.data.jobs);
        } else {
          setError('Failed to load jobs');
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load jobs');
        // Fallback to mock data for development
        setJobs(mockJobs);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [debouncedSearchTerm, locationFilter, typeFilter]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No jobs found matching your criteria.</p>
        </div>
      ) : (
        jobs.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            onViewDetails={() => navigate(`/dashboard/jobs/${job._id}`)}
          />
        ))
      )}
    </div>
  );
};

const JobCard = ({ job, onViewDetails }: { job: FullJob; onViewDetails: () => void }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center space-x-4">
        <img
          src={job.company.logo || 'https://placehold.co/48x48/E2E8F0/4A5568?text=Co'}
          alt={job.company.name}
          className="h-12 w-12 rounded-lg object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = 'https://placehold.co/48x48/E2E8F0/4A5568?text=Co';
          }}
        />
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
          <p className="text-gray-600">{job.company.name}</p>
        </div>
      </div>
      <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{job.type}</span>
    </div>

    <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-6 text-sm text-gray-500">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{job.location}</span>
        </div>
        {job.salary && (
          <div className="flex items-center font-semibold text-green-600">
            <span>{job.salary}</span>
          </div>
        )}
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewDetails();
        }}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Details
        <ExternalLink className="h-4 w-4 ml-2" />
      </button>
    </div>
  </div>
);

// Mock data for development/fallback
const mockJobs: FullJob[] = [
  {
    _id: '507f1f77bcf86cd799439011',
    title: 'Senior Software Engineer',
    description:
      'We are looking for a passionate Senior Software Engineer to join our growing team. You will be responsible for developing high-quality software solutions and mentoring junior developers.',
    location: 'Bangalore',
    type: 'Full-time',
    salary: '₹15-25 LPA',
    company: {
      _id: '507f1f77bcf86cd799439012',
      name: 'TechCorp India',
      logo: 'https://placehold.co/48x48/E2E8F0/4A5568?text=TC',
      city: 'Bangalore',
    },
    postedBy: {
      _id: '507f1f77bcf86cd799439013',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@techcorp.com',
    },
    requirements: [
      '5+ years of experience in software development',
      'Strong knowledge of React, Node.js, and TypeScript',
      'Experience with cloud platforms (AWS/Azure)',
      'Good understanding of microservices architecture',
    ],
    responsibilities: [
      'Design and develop scalable software solutions',
      'Mentor junior developers and conduct code reviews',
      'Collaborate with cross-functional teams',
      'Participate in architectural decisions',
    ],
    benefits: [
      'Competitive salary and equity',
      'Health insurance for family',
      'Flexible working hours',
      'Learning and development budget',
    ],
    applicationDeadline: new Date('2025-08-15'),
    isActive: true,
    applicationsCount: 23,
    createdAt: new Date('2025-07-01'),
    updatedAt: new Date('2025-07-10'),
  },
  {
    _id: '507f1f77bcf86cd799439014',
    title: 'Product Manager',
    description:
      "Join our product team to drive innovation and create amazing user experiences. You'll work closely with engineering, design, and business teams.",
    location: 'Mumbai',
    type: 'Full-time',
    salary: '₹20-30 LPA',
    company: {
      _id: '507f1f77bcf86cd799439015',
      name: 'InnovateLabs',
      logo: 'https://placehold.co/48x48/E2E8F0/4A5568?text=IL',
      city: 'Mumbai',
    },
    postedBy: {
      _id: '507f1f77bcf86cd799439016',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@innovatelabs.com',
    },
    requirements: [
      '3+ years of product management experience',
      'Strong analytical and problem-solving skills',
      'Experience with agile methodologies',
      'Excellent communication skills',
    ],
    isActive: true,
    applicationsCount: 15,
    createdAt: new Date('2025-07-05'),
    updatedAt: new Date('2025-07-12'),
  },
];

export default Jobs;
