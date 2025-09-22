import { useState, useEffect } from 'react';
import BasicInfo from '../../../components/dashboard/startupRegister/BasicInfo';
import SocialLinks from '../../../components/dashboard/startupRegister/SocialLinks';
import MediaUpload from '../../../components/dashboard/startupRegister/MediaUpload';
import ReviewSubmit from '../../../components/dashboard/startupRegister/ReviewSubmit';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { StartupRegisterFormData } from '../../../types/company';
import { uploadFile } from '../../../utils/fileUpload.utils';
import { useToast } from '../../../contexts/toast/toastContext';
import { AutoSaveProvider } from '../../../contexts/AutoSaveContext';
import { ResetFormButton } from '../../../components/common/ResetFormData';
import { useNavigate } from 'react-router-dom';
import { validateCompanyFormData } from '../../../validations/startups.validations';

const STORAGE_KEY = 'startupFormData';

const StartupRegister = () => {
  const [activeSection, setActiveSection] = useState('basic');
  const { user, accessToken } = useAuth();
  const [imageUrl, setImageUrl] = useState({ logo: '', banner: '' });
  const [uploadLoading, setUploadLoading] = useState({ logo: false, banner: false });
  const [loading, setLoading] = useState(false);
  const initialFormData: StartupRegisterFormData = {
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
  };

  const [formData, setFormData] = useState<StartupRegisterFormData>(initialFormData);
  const toast = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, superAdmin: user.email }));
    }
  }, [user?.email]);

  // Sync imageUrl state with formData URLs (for autosave restoration)
  useEffect(() => {
    if (formData.logo || formData.banner) {
      setImageUrl((prev) => ({
        ...prev,
        ...(formData.logo && { logo: formData.logo }),
        ...(formData.banner && { banner: formData.banner }),
      }));
    }
  }, [formData.logo, formData.banner]);

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
      setUploadLoading((prev) => ({ ...prev, [type]: true }));
      try {
        const result = await uploadFile(file, 'company', {
          name: formData.registeredEntity || 'sample',
          context: 'Company',
          'alt-text': `${type} for ${formData.registeredEntity || 'company'}`,
        });
        setFormData((prev) => ({
          ...prev,
          [type]: result.publicUrl || result.url,
        }));
        setImageUrl((prev) => ({ ...prev, [type]: result.url }));
      } catch (err) {
        console.error(`${type} upload failed:`, err);
        toast.open({
          message: {
            heading: `Failed to upload ${type}`,
            content: `Failed to upload ${type}. Please try again.`,
          },
          duration: 5000,
          position: 'top-center',
          color: 'error',
        });
      } finally {
        setUploadLoading((prev) => ({ ...prev, [type]: false }));
      }
    }
  };

  const handleDefaultLogoSelect = (logoUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      logo: logoUrl,
    }));
    setImageUrl((prev) => ({ ...prev, logo: logoUrl }));
    toast.open({
      message: {
        heading: 'Logo Selected',
        content: 'Default logo has been applied successfully.',
      },
      duration: 3000,
      position: 'top-center',
      color: 'success',
    });
  };

  const handleDefaultBannerSelect = (bannerUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      banner: bannerUrl,
    }));
    setImageUrl((prev) => ({ ...prev, banner: bannerUrl }));
    toast.open({
      message: {
        heading: 'Banner Selected',
        content: 'Default banner has been applied successfully.',
      },
      duration: 3000,
      position: 'top-center',
      color: 'success',
    });
  };

  const handleSubmit = async () => {
    const validationError = validateCompanyFormData(formData);
    if (validationError) {
      toast.open({
        message: {
          heading: 'Please Complete Required Fields',
          content: validationError,
        },
        duration: 5000,
        position: 'top-center',
        color: 'warning',
      });
      return;
    }

    const dataToSend = {
      ...formData,
      socialLinks: formData.socialLinks.map((link) =>
        typeof link === 'object' && link !== null ? JSON.stringify(link) : link,
      ),
      logo: String(formData.logo || ''),
      banner: String(formData.banner || ''),
    };

    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/company/startup/register-request`,
        dataToSend,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      toast.open({
        message: {
          heading: 'Registration Successful',
          content:
            'Your startup registration request has been submitted successfully. Our team will review it shortly.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'success',
      });
      localStorage.removeItem(STORAGE_KEY);
      setTimeout(() => {
        navigate('/dashboard/startups');
      }, 1000);
    } catch (e: unknown) {
      console.error('Error submitting registration:', e);
      toast.open({
        message: {
          heading: 'Submission Failed',
          content:
            e instanceof AxiosError
              ? e.response?.data?.error ||
                'There was an error submitting your registration. Please try again.'
              : 'There was an error submitting your registration. Please try again.',
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
    <AutoSaveProvider storageKey={STORAGE_KEY} formData={formData} setFormData={setFormData}>
      <div className="min-h-screen bg-gray-50 w-full">
        {/* Header */}
        <header className="w-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Register Your Startup
              </h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">
                Complete the steps below to submit your registration
              </p>
            </div>
            <ResetFormButton
              setFormData={setFormData}
              initialFormData={initialFormData}
              onReset={() => setImageUrl({ logo: '', banner: '' })}
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Registration Steps</h3>
              <nav>
                <ul className="space-y-2">
                  {['basic', 'social', 'media', 'review'].map((section) => (
                    <li
                      key={section}
                      onClick={() => setActiveSection(section)}
                      className={`cursor-pointer px-4 py-3 rounded-md font-medium transition-all duration-200 ${
                        activeSection === section
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {section === 'basic' && 'Basic Information'}
                      {section === 'social' && 'Social Links'}
                      {section === 'media' && 'Media Upload'}
                      {section === 'review' && 'Review & Submit'}
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Form Content */}
            <div className="flex-1 w-full">
              <form className="bg-white p-4 sm:p-8 rounded-lg shadow-md space-y-6 sm:space-y-8">
                {/* Basic Information Section */}
                {activeSection === 'basic' && (
                  <section>
                    <BasicInfo
                      formData={formData}
                      handleChange={handleChange}
                      setActiveSection={setActiveSection}
                    />
                  </section>
                )}
                {/* Social Links Section */}
                {activeSection === 'social' && (
                  <section>
                    <SocialLinks
                      formData={formData}
                      setFormData={setFormData}
                      setActiveSection={setActiveSection}
                    />
                  </section>
                )}
                {/* Media Upload Section */}
                {activeSection === 'media' && (
                  <section>
                    <MediaUpload
                      imageUrl={imageUrl}
                      formData={formData}
                      handleFileChange={handleFileUpload}
                      handleDefaultLogoSelect={handleDefaultLogoSelect}
                      handleDefaultBannerSelect={handleDefaultBannerSelect}
                      setActiveSection={setActiveSection}
                      uploadLoading={uploadLoading}
                    />
                  </section>
                )}
                {/* Review & Submit Section */}
                {activeSection === 'review' && (
                  <section>
                    <ReviewSubmit
                      formData={formData}
                      handleSubmit={handleSubmit}
                      loading={loading}
                    />
                  </section>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>
    </AutoSaveProvider>
  );
};

export default StartupRegister;
