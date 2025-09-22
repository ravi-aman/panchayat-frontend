import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import LocationSelector from '../../../components/common/LocationSelector';
import {
  Check,
  AlertCircle,
  Calendar,
  DollarSign,
  Building,
  Mail,
  Phone,
  FileText,
  Target,
  Users,
  Tag,
  Loader2,
  Link,
} from 'lucide-react';
import { useToast } from '../../../contexts/toast/toastContext';
import axios from 'axios';
import {
  DocumentsUpload,
  InputField,
  LogoUpload,
  SelectField,
  TagInput,
  TextAreaField,
  URLsInput,
} from '../../../components/common/form-components';

export interface FundDocument {
  name: string;
  url: string;
  type: string;
  size?: number;
  key?: string;
}

export interface FundFormValues {
  provider: string;
  logo: string;
  type: string;
  description: string;
  amount: string;
  minAmount?: string;
  maxAmount?: string;
  launchDate?: string;
  deadline: string;
  active: boolean;
  stage: string;
  industries: string[];
  region: string;
  team?: string;
  teamDate?: string;
  entityType: string;
  documentRequired: string[];
  evaluationCriteria: string[];
  contactEmail: string;
  supportPhone: string;
  pitchRequired: boolean;
  interviewRequired: boolean;
  verified: boolean;
  urls: string[];
  documents: FundDocument[];
}

const defaultValues: FundFormValues = {
  provider: '',
  logo: '',
  type: 'Grant',
  description: '',
  amount: '',
  minAmount: '',
  maxAmount: '',
  launchDate: '',
  deadline: '',
  active: true,
  stage: '',
  industries: [],
  region: '',
  team: '',
  teamDate: '',
  entityType: 'Startup (DPIIT)',
  documentRequired: [],
  evaluationCriteria: [],
  contactEmail: '',
  supportPhone: '',
  pitchRequired: false,
  interviewRequired: false,
  verified: false,
  urls: [''], // First URL is apply link
  documents: [],
};

const FUND_TYPES = [
  {
    value: 'Grant',
    label: 'Grant Funding',
    description: 'Non-repayable funds',
  },
  {
    value: 'Equity',
    label: 'Equity Investment',
    description: 'Investment for ownership stake',
  },
  {
    value: 'Debt',
    label: 'Debt Financing',
    description: 'Loans and credit facilities',
  },
  {
    value: 'Hybrid',
    label: 'Hybrid Funding',
    description: 'Mix of equity and debt',
  },
];

const STAGES = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Growth',
  'Pre-IPO',
  'Any Stage',
];

const COMMON_INDUSTRIES = [
  'Artificial Intelligence',
  'Machine Learning',
  'FinTech',
  'HealthTech',
  'EdTech',
  'E-commerce',
  'SaaS',
  'Mobile Apps',
  'IoT',
  'Blockchain',
  'CleanTech',
  'AgriTech',
  'FoodTech',
  'RetailTech',
  'TravelTech',
  'PropTech',
  'LegalTech',
  'HRTech',
  'MarTech',
];

const ENTITY_TYPES = [
  'Startup (DPIIT)',
  'Private Limited Company',
  'Limited Liability Partnership',
  'Partnership Firm',
  'Sole Proprietorship',
  'Section 8 Company',
  'Producer Company',
];

const COMMON_DOCUMENTS = [
  'Business Plan',
  'Financial Projections',
  'Company Registration Certificate',
  'GST Registration',
  'Bank Statements',
  'Audited Financials',
  'DPIIT Certificate',
  'Product Demo',
  'Team Profiles',
  'Market Research',
  'Legal Compliance Certificates',
];

const EVALUATION_CRITERIA = [
  'Innovation & Technology',
  'Market Potential',
  'Team Experience',
  'Financial Viability',
  'Scalability',
  'Social Impact',
  'Revenue Model',
  'Competitive Advantage',
  'Execution Capability',
  'Risk Assessment',
];

const FundCreateForm: React.FC<{
  onSubmit?: (values: FundFormValues) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [values, setValues] = useState<FundFormValues>(defaultValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setValues((prev) => ({ ...prev, [name]: newValue }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!values.provider.trim()) newErrors.provider = 'Provider name is required';
    if (!values.logo) newErrors.logo = 'Logo is required';
    if (!values.description.trim()) newErrors.description = 'Description is required';
    if (!values.amount.trim()) newErrors.amount = 'Amount is required';
    if (!values.deadline) newErrors.deadline = 'Deadline is required';
    if (!values.stage.trim()) newErrors.stage = 'Stage is required';
    if (!values.region.trim()) newErrors.region = 'Region is required';
    if (!values.entityType.trim()) newErrors.entityType = 'Entity type is required';
    if (!values.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
    if (!values.supportPhone.trim()) newErrors.supportPhone = 'Support phone is required';
    if (!values.urls[0]?.trim()) newErrors.urls = 'Application link is required';
    if (values.documentRequired.length === 0)
      newErrors.documentRequired = 'At least one document is required';

    // Email validation
    if (values.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }

    // Phone validation
    if (values.supportPhone && !/^\+?[0-9\s\-()]{10,}$/.test(values.supportPhone)) {
      newErrors.supportPhone = 'Invalid phone format';
    }

    // URL validation
    if (values.urls[0] && !isValidURL(values.urls[0])) {
      newErrors.urls = 'Invalid application link format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidURL = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix the errors above');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Filter out empty URLs
      const cleanedUrls = values.urls.filter((url) => url.trim() !== '');

      const submitData = {
        ...values,
        urls: cleanedUrls,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/opportunities`,
        submitData,
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (response.status >= 200 && response.status < 300) {
        setSuccess(true);
        setValues(defaultValues);
        if (onSubmit) onSubmit(values);

        toast.open({
          message: {
            heading: 'Fund Created Successfully',
            content: 'Your funding opportunity has been created.',
          },
          duration: 5000,
          position: 'top-center',
          color: 'success',
        });
      }
    } catch (err) {
      type AxiosLikeError =
        | { response?: { data?: { message?: string } }; message?: string }
        | Error;
      const axiosErr = err as AxiosLikeError;
      let errorMessage = 'Something went wrong';

      if (axiosErr && typeof axiosErr === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maybeAny = axiosErr as any;
        if (maybeAny?.response?.data?.message) {
          errorMessage = String(maybeAny.response.data.message);
        } else if (maybeAny?.message) {
          errorMessage = String(maybeAny.message);
        }
      }

      setError(errorMessage);

      toast.open({
        message: {
          heading: 'Fund Creation Failed',
          content: errorMessage || 'There was an error creating the fund. Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-5 mx-auto bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Create New Fund</h2>
        <p className="mt-1 text-slate-600">
          Fill in the details to create a new funding opportunity
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="p-4 rounded-lg">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-800">
            <Building className="w-5 h-5" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Provider Name"
              name="provider"
              value={values.provider}
              onChange={handleChange}
              required
              placeholder="e.g., Indian Angel Network"
              icon={<Building className="w-4 h-4" />}
              error={errors.provider}
            />
            <SelectField
              label="Fund Type"
              name="type"
              value={values.type}
              onChange={handleChange}
              required
              options={FUND_TYPES}
              icon={<DollarSign className="w-4 h-4" />}
            />
          </div>
          <div className="mt-4">
            <LogoUpload
              value={values.logo}
              onChange={(logo) => setValues((prev) => ({ ...prev, logo }))}
              provider={values.provider}
            />
          </div>
          <div className="mt-4">
            <TextAreaField
              label="Description"
              name="description"
              value={values.description}
              onChange={handleChange}
              required
              placeholder="Describe the fund, its purpose, and what makes it unique..."
              rows={4}
              error={errors.description}
            />
          </div>
        </div>

        {/* Funding Details */}
        <div className="p-4 rounded-lg bg-slate-50">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-800">
            <DollarSign className="w-5 h-5" />
            Funding Details
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InputField
              label="Primary Amount"
              name="amount"
              value={values.amount}
              onChange={handleChange}
              required
              placeholder="₹10.00 Lakh"
              icon={<DollarSign className="w-4 h-4" />}
              error={errors.amount}
            />
            <InputField
              label="Minimum Amount"
              name="minAmount"
              value={values.minAmount || ''}
              onChange={handleChange}
              placeholder="₹5.00 Lakh"
            />
            <InputField
              label="Maximum Amount"
              name="maxAmount"
              value={values.maxAmount || ''}
              onChange={handleChange}
              placeholder="₹50.00 Lakh"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
            <SelectField
              label="Stage"
              name="stage"
              value={values.stage}
              onChange={handleChange}
              required
              options={STAGES.map((s) => ({ value: s, label: s }))}
              icon={<Target className="w-4 h-4" />}
            />
            <LocationSelector
              label="Region"
              value={values.region}
              onChange={(region) => setValues((prev) => ({ ...prev, region }))}
              required
              error={errors.region}
              type="region"
              placeholder="Select target region"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 rounded-lg bg-slate-50">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-800">
            <Calendar className="w-5 h-5" />
            Timeline
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Launch Date"
              name="launchDate"
              type="date"
              value={values.launchDate || ''}
              onChange={handleChange}
              icon={<Calendar className="w-4 h-4" />}
            />
            <InputField
              label="Application Deadline"
              name="deadline"
              type="date"
              value={values.deadline}
              onChange={handleChange}
              required
              icon={<Calendar className="w-4 h-4" />}
              error={errors.deadline}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Links & URLs */}
        <div className="p-4 rounded-lg bg-slate-50">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-800">
            <Link className="w-5 h-5" />
            Links & URLs
          </h3>
          <URLsInput
            urls={values.urls}
            onChange={(urls) => setValues((prev) => ({ ...prev, urls }))}
            error={errors.urls}
          />
        </div>

        {/* Industry & Team */}
        <div className="p-4 rounded-lg bg-slate-50">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-800">
            <Tag className="w-5 h-5" />
            Industry & Team
          </h3>
          <div className="space-y-4">
            <TagInput
              label="Industries"
              tags={values.industries}
              onAdd={(industry) =>
                setValues((prev) => ({
                  ...prev,
                  industries: [...prev.industries, industry],
                }))
              }
              onRemove={(index) =>
                setValues((prev) => ({
                  ...prev,
                  industries: prev.industries.filter((_, i) => i !== index),
                }))
              }
              suggestions={COMMON_INDUSTRIES}
              icon={<Tag className="w-4 h-4" />}
              placeholder="AI, FinTech, HealthTech..."
            />
            <SelectField
              label="Entity Type"
              name="entityType"
              value={values.entityType}
              onChange={handleChange}
              required
              options={ENTITY_TYPES.map((type) => ({
                value: type,
                label: type,
              }))}
              icon={<Building className="w-4 h-4" />}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Team/Partner"
                name="team"
                value={values.team || ''}
                onChange={handleChange}
                placeholder="Team Neecop"
                icon={<Users className="w-4 h-4" />}
              />
              <InputField
                label="Team Date"
                name="teamDate"
                type="date"
                value={values.teamDate || ''}
                onChange={handleChange}
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="p-4 rounded-lg bg-slate-50">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-800">
            <FileText className="w-5 h-5" />
            Requirements & Criteria
          </h3>
          <div className="space-y-4">
            <TagInput
              label="Documents Required"
              tags={values.documentRequired}
              onAdd={(doc) =>
                setValues((prev) => ({
                  ...prev,
                  documentRequired: [...prev.documentRequired, doc],
                }))
              }
              onRemove={(index) =>
                setValues((prev) => ({
                  ...prev,
                  documentRequired: prev.documentRequired.filter((_, i) => i !== index),
                }))
              }
              suggestions={COMMON_DOCUMENTS}
              icon={<FileText className="w-4 h-4" />}
            />
            {errors.documentRequired && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                {errors.documentRequired}
              </div>
            )}
            <TagInput
              label="Evaluation Criteria"
              tags={values.evaluationCriteria}
              onAdd={(criteria) =>
                setValues((prev) => ({
                  ...prev,
                  evaluationCriteria: [...prev.evaluationCriteria, criteria],
                }))
              }
              onRemove={(index) =>
                setValues((prev) => ({
                  ...prev,
                  evaluationCriteria: prev.evaluationCriteria.filter((_, i) => i !== index),
                }))
              }
              suggestions={EVALUATION_CRITERIA}
              icon={<Target className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Supporting Documents */}
        <div className="p-4 rounded-lg bg-slate-50">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-800">
            <FileText className="w-5 h-5" />
            Supporting Documents
          </h3>
          <DocumentsUpload
            documents={values.documents}
            onChange={(documents) => setValues((prev) => ({ ...prev, documents }))}
            provider={values.provider}
          />
        </div>

        {/* Contact Information */}
        <div className="p-4 rounded-lg bg-slate-50">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-800">
            <Mail className="w-5 h-5" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Contact Email"
              name="contactEmail"
              type="email"
              value={values.contactEmail}
              onChange={handleChange}
              required
              placeholder="contact@provider.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.contactEmail}
            />
            <InputField
              label="Support Phone"
              name="supportPhone"
              value={values.supportPhone}
              onChange={handleChange}
              required
              placeholder="+91-1234567890"
              icon={<Phone className="w-4 h-4" />}
              error={errors.supportPhone}
            />
          </div>
        </div>

        {/* Settings & Preferences */}
        <div className="p-4 rounded-lg bg-slate-50">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-800">
            <Target className="w-5 h-5" />
            Settings & Preferences
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <label className="flex items-center gap-3 p-3 transition-colors border rounded-lg cursor-pointer border-slate-200 hover:bg-white">
              <input
                type="checkbox"
                name="active"
                checked={values.active}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-700">Active</div>
                <div className="text-xs text-slate-500">Currently accepting applications</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 transition-colors border rounded-lg cursor-pointer border-slate-200 hover:bg-white">
              <input
                type="checkbox"
                name="pitchRequired"
                checked={values.pitchRequired}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-700">Pitch Required</div>
                <div className="text-xs text-slate-500">Applicants must submit pitch</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 transition-colors border rounded-lg cursor-pointer border-slate-200 hover:bg-white">
              <input
                type="checkbox"
                name="interviewRequired"
                checked={values.interviewRequired}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-700">Interview Required</div>
                <div className="text-xs text-slate-500">Selection includes interview</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 transition-colors border rounded-lg cursor-pointer border-slate-200 hover:bg-white">
              <input
                type="checkbox"
                name="verified"
                checked={values.verified}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-700">Verified</div>
                <div className="text-xs text-slate-500">Fund has been verified</div>
              </div>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Required fields
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2.5 text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !values.provider || !values.logo}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Fund...
                </>
              ) : (
                'Create Fund'
              )}
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
            <AlertCircle className="flex-shrink-0 w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 text-sm text-green-800 border border-green-200 rounded-lg bg-green-50">
            <Check className="flex-shrink-0 w-4 h-4" />
            Fund created successfully! You can now view it in your dashboard.
          </div>
        )}
      </form>
    </div>
  );
};

export default FundCreateForm;
