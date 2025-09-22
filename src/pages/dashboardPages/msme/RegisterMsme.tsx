import { useState, useEffect } from 'react';
import BasicInfo from '../../../components/dashboard/startupRegister/BasicInfo';
import SocialLinks from '../../../components/dashboard/startupRegister/SocialLinks';
import MediaUpload from '../../../components/dashboard/startupRegister/MediaUpload';
import ReviewSubmit from '../../../components/dashboard/startupRegister/ReviewSubmit';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { StartupRegisterFormData } from '../../../types/company';
import { uploadFile } from '../../../utils/fileUpload.utils';
import { useToast } from '../../../contexts/toast/toastContext';

const StartupRegister = () => {
  const [activeSection, setActiveSection] = useState('basic');
  const { user, accessToken } = useAuth(); // Get accessToken from auth context

  const [imageUrl, setImageUrl] = useState({ logo: '', banner: '' });
  const [uploadLoading, setUploadLoading] = useState({
    logo: false,
    banner: false,
  }); // Track upload states
  const toast = useToast();
  const [formData, setFormData] = useState<StartupRegisterFormData>({
    name: '',
    registeredEntity: '',
    tagline: '',
    description: '',
    industry: '',
    companySize: '',
    city: '',
    state: '',
    country: 'India',
    stage: '',
    establishedYear: '',
    fundedType: '',
    website: '',
    phone: '',
    email: '',
    socialLinks: [] as string[],
    logo: '',
    banner: '',
    superAdmin: user?.email || '',
  });

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        superAdmin: user.email,
      }));
    }
  }, [user?.email]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner',
  ) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];

      // Set loading state for this upload type
      setUploadLoading((prev) => ({ ...prev, [type]: true }));

      try {
        // Use the updated uploadFile function
        const result = await uploadFile(file, 'company', {
          name: formData.registeredEntity || 'sample',
          context: 'Company',
          'alt-text': `${type} for ${formData.registeredEntity || 'company'}`,
        });

        // Update form data with the uploaded file key and display URL
        setFormData((prev) => ({
          ...prev,
          [type]: result.publicUrl || result.url,
        }));
        setImageUrl((prev) => ({ ...prev, [type]: result.url })); // Use result.url to display the image

        console.log(`${type} uploaded successfully:`, {
          key: result.key,
          url: result.url,
          publicUrl: result.publicUrl,
          filename: result.filename,
        });
      } catch (err) {
        console.error(`${type} upload failed:`, err);
        toast.open({
          message: {
            heading: 'Upload Failed',
            content: `Failed to upload ${type}. Please try again.`,
          },
          duration: 5000,
          position: 'top-center',
          color: 'error',
        });
      } finally {
        // Clear loading state
        setUploadLoading((prev) => ({ ...prev, [type]: false }));
      }
    }
  };

  const handleSubmit = async () => {
    console.log('Final Form Data:', formData);
    const dataToSend = {
      ...formData,
      socialLinks: formData.socialLinks.map((link) =>
        typeof link === 'object' && link !== null ? JSON.stringify(link) : link,
      ),
      logo: String(formData.logo || ''),
      banner: String(formData.banner || ''),
    };
    try {
      await axios
        .post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/company/msme/register-request`,
          dataToSend,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`, // Add authorization header
            },
          },
        )
        .then((res) => {
          if (res.data.status == 'success') {
            window.location.href = '/dashboard/startups';
          }
        });
      toast.open({
        message: {
          heading: 'Registration Successful',
          content:
            'Your MSME registration request has been submitted successfully. Our team will review it and get back to you shortly.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'success',
      });
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        toast.open({
          message: {
            heading: 'Email Already Exists',
            content:
              'An account with this email already exists. Please use a different email or log in.',
          },
          duration: 5000,
          position: 'top-center',
          color: 'warning',
        });
      }
      console.log('Error :- ' + e);
      toast.open({
        message: {
          heading: 'Registration Failed',
          content: 'There was an error submitting your registration. Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    }
  };

  return (
    <div className="flex h-full bg-gray-100">
      <div className="w-64 p-4 pt-24 bg-white shadow-lg max-sm:hidden">
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 bg-white shadow-md">
          <div className="flex items-center space-x-4">
            <div className="flex items-center pr-36">
              <img src="/logo.png" alt="Neecop Logo" className="h-8" />
            </div>
          </div>
        </nav>
        <ul className="space-y-2">
          {['basic', 'social', 'media', 'review'].map((section) => (
            <li
              key={section}
              className={`cursor-pointer p-2 rounded-md ${
                activeSection === section ? 'bg-[#1E5EFF] text-white' : 'hover:bg-gray-200'
              }`}
              onClick={() => setActiveSection(section)}
            >
              {section === 'basic' && 'Basic Information'}
              {section === 'social' && 'Social Links'}
              {section === 'media' && 'Media'}
              {section === 'review' && 'Review & Submit'}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 p-6 pt-24 bg-white rounded-lg shadow-md max-sm:p-2">
        {activeSection === 'basic' && (
          <BasicInfo
            formData={formData}
            handleChange={handleChange}
            setActiveSection={setActiveSection}
          />
        )}

        {activeSection === 'social' && (
          <SocialLinks
            formData={formData}
            setFormData={setFormData}
            setActiveSection={setActiveSection}
          />
        )}

        {activeSection === 'media' && (
          <MediaUpload
            imageUrl={imageUrl}
            formData={formData}
            handleFileChange={handleFileUpload}
            setActiveSection={setActiveSection}
            uploadLoading={uploadLoading} // Pass loading states to component
          />
        )}

        {activeSection === 'review' && (
          <ReviewSubmit formData={formData} handleSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
};

export default StartupRegister;
