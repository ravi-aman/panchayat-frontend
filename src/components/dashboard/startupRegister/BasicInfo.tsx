import React from 'react';
import { StartupRegisterFormData, MsmeRegisterFormData } from '../../../types/company';
import { InputField, TextAreaField, SelectField } from '../../../components/common/form-components';
import { useToast } from '../../../contexts/toast/toastContext';
import {
  Building,
  Tag,
  Users,
  Target,
  DollarSign,
  Link as LinkIcon,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

interface BasicInforProps {
  formData: StartupRegisterFormData | MsmeRegisterFormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  setActiveSection: (section: string) => void;
}

const BasicInfo: React.FC<BasicInforProps> = ({ formData, handleChange, setActiveSection }) => {
  const toast = useToast();

  const isStartupData = (
    data: StartupRegisterFormData | MsmeRegisterFormData,
  ): data is StartupRegisterFormData => {
    return 'state' in data && 'country' in data && 'superAdmin' in data;
  };

  const validateBasicInfo = () => {
    const errors: string[] = [];

    // Required field validations
    if (!formData.name.trim()) errors.push('• Startup name is required');
    if (!formData.registeredEntity.trim()) errors.push('• Registered entity is required');
    if (!formData.tagline.trim()) errors.push('• Tagline is required');
    if (!formData.description.trim()) errors.push('• Description is required');
    if (!formData.industry.trim()) errors.push('• Industry is required');
    if (!formData.city.trim()) errors.push('• City is required');
    if (!formData.stage.trim()) errors.push('• Stage is required');
    if (!formData.phone.trim()) errors.push('• Phone is required');
    if (!formData.email.trim()) errors.push('• Email is required');

    // Startup-specific validations
    if (isStartupData(formData)) {
      if (!formData.state.trim()) errors.push('• State is required');
      if (!formData.country.trim()) errors.push('• Country is required');
    }

    // Email format validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('• Please enter a valid email address');
    }

    // Website format validation (if provided)
    if (
      formData.website &&
      formData.website.trim() &&
      !/^https?:\/\/.+\..+/.test(formData.website)
    ) {
      errors.push('• Please enter a valid website URL (e.g., https://example.com)');
    }

    // Phone format validation (basic)
    if (formData.phone && !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-()]/g, ''))) {
      errors.push('• Please enter a valid phone number');
    }

    return errors;
  };

  const handleNext = () => {
    const validationErrors = validateBasicInfo();

    if (validationErrors.length > 0) {
      toast.open({
        message: {
          heading: 'Please Complete Required Fields',
          content: validationErrors.join('\n'),
        },
        duration: 5000,
        position: 'top-center',
        color: 'warning',
      });
      return;
    }

    setActiveSection('social');
  };

  return (
    <div className="w-[90%] max-sm:w-full">
      {/* Heading */}
      <div className="rounded-lg p-4">
        <h2 className="text-xl font-semibold text-[#1E5EFF]">Basic Information</h2>
        <p className="text-sm text-gray-500">Please provide your startup&apos;s basic details.</p>
      </div>

      {/* Startup Name & Registered Entity */}
      <div className="grid grid-cols-2 gap-4 mt-6 max-sm:grid-cols-1">
        <InputField
          label="Startup Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter startup name"
          icon={<Building className="w-4 h-4" />}
        />
        <InputField
          label="Registered Entity"
          name="registeredEntity"
          value={formData.registeredEntity}
          onChange={handleChange}
          required
          placeholder="Enter registered entity name"
          icon={<Building className="w-4 h-4" />}
        />
      </div>

      {/* Tagline */}
      <div className="mt-4">
        <InputField
          label="Tagline"
          name="tagline"
          value={formData.tagline}
          onChange={handleChange}
          required
          placeholder="A short tagline for your startup"
          icon={<Tag className="w-4 h-4" />}
        />
      </div>

      {/* Description */}
      <div className="mt-4">
        <TextAreaField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Describe your startup..."
          rows={4}
        />
      </div>

      {/* Industry & Company Size */}
      <div className="grid grid-cols-2 gap-4 mt-4 max-sm:grid-cols-1">
        <SelectField
          label="Industry"
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          required
          options={[
            { value: 'Technology', label: 'Technology' },
            { value: 'E-commerce', label: 'E-commerce' },
            { value: 'Fintech', label: 'Fintech' },
            { value: 'Healthcare', label: 'Healthcare' },
            { value: 'EdTech', label: 'EdTech' },
            { value: 'AgriTech', label: 'AgriTech' },
            { value: 'CleanTech', label: 'CleanTech' },
            { value: 'FoodTech', label: 'FoodTech' },
            { value: 'Logistics', label: 'Logistics' },
            { value: 'Real Estate', label: 'Real Estate' },
            { value: 'Manufacturing', label: 'Manufacturing' },
            { value: 'Retail', label: 'Retail' },
            { value: 'Entertainment', label: 'Entertainment' },
            { value: 'Travel & Tourism', label: 'Travel & Tourism' },
            { value: 'Automotive', label: 'Automotive' },
            { value: 'Energy', label: 'Energy' },
            { value: 'Other', label: 'Other' },
          ]}
          icon={<Tag className="w-4 h-4" />}
        />
        <SelectField
          label="Company Size"
          name="companySize"
          value={formData.companySize}
          onChange={handleChange}
          options={[
            { value: '1-10', label: '1-10 employees' },
            { value: '11-50', label: '11-50 employees' },
            { value: '51-100', label: '51-100 employees' },
            { value: '101-500', label: '101-500 employees' },
            { value: '500+', label: '500+ employees' },
          ]}
          icon={<Users className="w-4 h-4" />}
        />
      </div>

      {/* City, State, Country */}
      <div className="grid grid-cols-3 gap-4 mt-4 max-sm:grid-cols-1">
        <InputField
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          placeholder="Enter city"
          icon={<Building className="w-4 h-4" />}
        />
        {isStartupData(formData) && (
          <>
            <InputField
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              placeholder="Enter state"
              icon={<Building className="w-4 h-4" />}
            />
            <InputField
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              placeholder="Enter country"
              icon={<Building className="w-4 h-4" />}
            />
          </>
        )}
      </div>

      {/* Stage, Established Year, Funding Type */}
      <div className="grid grid-cols-3 gap-4 mt-4 max-sm:grid-cols-1">
        <SelectField
          label="Stage"
          name="stage"
          required
          value={formData.stage}
          onChange={handleChange}
          options={[
            { value: 'Idea', label: 'Idea' },
            { value: 'MVP', label: 'MVP' },
            { value: 'Early Stage', label: 'Early Stage' },
            { value: 'Growth', label: 'Growth' },
            { value: 'Expansion', label: 'Expansion' },
            { value: 'Mature', label: 'Mature' },
          ]}
          icon={<Target className="w-4 h-4" />}
        />
        <InputField
          label="Established Year"
          name="establishedYear"
          type="number"
          value={formData.establishedYear}
          onChange={handleChange}
          placeholder="2024"
          min="1900"
          icon={<Calendar className="w-4 h-4" />}
        />
        <SelectField
          label="Funding Type"
          name="fundedType"
          value={formData.fundedType}
          onChange={handleChange}
          options={[
            { value: 'Bootstrapped', label: 'Bootstrapped' },
            { value: 'Angel Funded', label: 'Angel Funded' },
            { value: 'Pre-Series A', label: 'Pre-Series A' },
            { value: 'Series A', label: 'Series A' },
            { value: 'Series B', label: 'Series B' },
            { value: 'Series C+', label: 'Series C+' },
            { value: 'Grant Funded', label: 'Grant Funded' },
            { value: 'Crowdfunded', label: 'Crowdfunded' },
          ]}
          icon={<DollarSign className="w-4 h-4" />}
        />
      </div>

      {/* Website & Phone */}
      <div className="grid grid-cols-2 gap-4 mt-4 max-sm:grid-cols-1">
        <InputField
          label="Website"
          name="website"
          type="url"
          value={formData.website}
          onChange={handleChange}
          placeholder="https://yourwebsite.com"
          icon={<LinkIcon className="w-4 h-4" />}
        />
        <InputField
          label="Phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="+91-XXXXXXXXXX"
          icon={<Phone className="w-4 h-4" />}
        />
      </div>

      {/* Email */}
      <div className="mt-4">
        <InputField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="contact@startup.com"
          required
          icon={<Mail className="w-4 h-4" />}
        />
      </div>

      {/* Next Button */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-2 bg-[#1E5EFF] text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BasicInfo;
