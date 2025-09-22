import { MapPin, Clock, Users, ArrowLeft } from 'lucide-react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FullJob } from '../../../types/jobs';

const isValidMongoId = (id: string) => /^[a-f\d]{24}$/i.test(id);

interface ApiResponse {
  status: string;
  job: FullJob;
}

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [job, setJob] = useState<FullJob | null>(state?.job || null);
  const [loading, setLoading] = useState(!state?.job);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !isValidMongoId(id)) {
      navigate('/404', { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!state?.job && id) {
      const fetchJob = async () => {
        try {
          setLoading(true);
          const response = await axios.get<ApiResponse>(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/jobs/${id}`,
          );
          if (response.data.status === 'success' && response.data.job) {
            console.log('Fetched Job:', response.data.job);
            setJob(response.data.job);
          } else {
            setError('Job not found');
          }
        } catch (error) {
          console.error('Error fetching job:', error);
          setError('Failed to load job details');
        } finally {
          setLoading(false);
        }
      };

      fetchJob();
    }
  }, [id, state]);

  if (loading) {
    return (
      <div className="flex-1 p-1 md:p-2 lg:p-4 bg-transparent min-h-screen font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex-1 p-1 md:p-2 lg:p-4 bg-transparent min-h-screen font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Job not found'}</h2>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-1 md:p-2 lg:p-4 bg-transparent min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>

        {/* Page Header: Company Logo and Job Title */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="border-1 border-gray-300 p-3 rounded-full">
            <img
              src={job.company.logo || 'https://placehold.co/40x40/E2E8F0/4A5568?text=Co'}
              alt="Company Logo"
              className="h-8 w-8 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://placehold.co/40x40/E2E8F0/4A5568?text=Co';
              }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{job.title}</h1>
            <p className="text-lg text-gray-600">{job.company.name}</p>
          </div>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main content on the left */}
          <div className="lg:col-span-2 space-y-5">
            <JobOverview job={job} />
            <JobDescription description={job.description} />
            {job.requirements && job.requirements.length > 0 && (
              <JobSection title="Requirements" items={job.requirements} />
            )}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <JobSection title="Responsibilities" items={job.responsibilities} />
            )}
            {job.benefits && job.benefits.length > 0 && (
              <JobSection title="Benefits" items={job.benefits} />
            )}
          </div>

          {/* Sidebar on the right */}
          <div className="lg:col-span-1 space-y-5">
            <JobActions />
            <JobDetailsCard job={job} />
            <CompanyInfo company={job.company} />
          </div>
        </main>
      </div>
    </div>
  );
};

const JobOverview = ({ job }: { job: FullJob }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h2 className="text-lg font-semibold text-gray-700 mb-4">Job Overview</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="flex items-center space-x-2">
        <MapPin className="h-5 w-5 text-gray-400" />
        <div>
          <p className="text-sm text-gray-500">Location</p>
          <p className="font-medium text-gray-800">{job.location}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Clock className="h-5 w-5 text-gray-400" />
        <div>
          <p className="text-sm text-gray-500">Type</p>
          <p className="font-medium text-gray-800">{job.type}</p>
        </div>
      </div>
      {job.salary && (
        <div className="flex items-center space-x-2">
          <span className="text-green-600 font-bold text-lg">₹</span>
          <div>
            <p className="text-sm text-gray-500">Salary</p>
            <p className="font-medium text-gray-800">{job.salary}</p>
          </div>
        </div>
      )}
      {job.applicationsCount !== undefined && (
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Applicants</p>
            <p className="font-medium text-gray-800">{job.applicationsCount}</p>
          </div>
        </div>
      )}
    </div>
  </div>
);

const JobDescription = ({ description }: { description: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Description</h3>
    <div className="text-gray-600 whitespace-pre-wrap">{description}</div>
  </div>
);

const JobSection = ({ title, items }: { title: string; items: string[] }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start text-gray-700">
          <span className="text-blue-500 mr-2 mt-1">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const JobActions = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="space-y-3">
      <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
        Apply Now
      </button>
    </div>
  </div>
);

const JobDetailsCard = ({ job }: { job: FullJob }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Details</h3>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-600">Posted Date</span>
        <span className="text-gray-800">{new Date(job.createdAt).toLocaleDateString()}</span>
      </div>
      {job.applicationDeadline && (
        <div className="flex justify-between">
          <span className="text-gray-600">Deadline</span>
          <span className="text-gray-800">
            {new Date(job.applicationDeadline).toLocaleDateString()}
          </span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-gray-600">Status</span>
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            job.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {job.isActive !== false ? 'Active' : 'Closed'}
        </span>
      </div>
    </div>
  </div>
);

const CompanyInfo = ({ company }: { company: FullJob['company'] }) => {
  const navigate = useNavigate();

  const handleViewCompany = () => {
    // Default to 'msme' if company type is not specified
    navigate(`/dashboard/${company.type}/${company._id}`);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">About Company</h3>
      <div className="flex items-center space-x-3 mb-4">
        <img
          className="h-12 w-12 rounded-lg object-cover"
          src={company.logo || 'https://placehold.co/48x48/E2E8F0/4A5568?text=Co'}
          alt={company.name}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = 'https://placehold.co/48x48/E2E8F0/4A5568?text=Co';
          }}
        />
        <div>
          <p className="font-semibold text-gray-800">{company.name}</p>
          {company.city && (
            <p className="text-gray-500 text-sm flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {company.city}
            </p>
          )}
        </div>
      </div>
      <button
        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        onClick={handleViewCompany}
      >
        View Company Profile
      </button>
    </div>
  );
};

export default JobDetailsPage;
