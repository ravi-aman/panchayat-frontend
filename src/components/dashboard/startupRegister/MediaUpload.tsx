import { Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { StartupRegisterFormData } from '../../../types/company';
import { ChangeEvent, useState, DragEvent } from 'react';
import { useToast } from '../../../contexts/toast/toastContext';

interface MediaUploadProps {
  formData: StartupRegisterFormData;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => Promise<void>;
  handleDefaultLogoSelect?: (logoUrl: string) => void;
  handleDefaultBannerSelect?: (bannerUrl: string) => void;
  setActiveSection: (section: string) => void;
  imageUrl: { logo: string; banner: string };
  uploadLoading: { logo: boolean; banner: boolean };
}

// Default logo options - these would typically come from your backend/S3
const DEFAULT_LOGOS = [
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_2_1757166686542_fc3d1173.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_11_1757171689485_4d9a40bb.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_9_1757171646144_5579be11.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_8_1757171626020_d43c7ca1.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_10_1757171667896_9ea3c751.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_15_1757171774434_ae005ad5.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_6_1757171571459_b4111c66.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_14_1757171749807_e91e44c2.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_1_1757166105942_fb932bb8.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_7_1757171602608_5352a9ea.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_5_1757171548174_456ccb2a.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_4_1757171500745_7258ead2.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_13_1757171730291_4e4e8555.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_12_1757171707917_7fa03837.png',
  'https://neecopdata1.s3.ap-south-1.amazonaws.com/uploads/company/68962f23bc5f7635612c8ddb/Group_3_1757171462025_b5b24166.png',
];

// Default banner options - these would typically come from your backend/S3
const DEFAULT_BANNERS = [
  'https://placehold.co/1200x400/0066CC/FFFFFF?text=TECHNOLOGY+STARTUP',
  'https://placehold.co/1200x400/28A745/FFFFFF?text=E-COMMERCE+PLATFORM',
  'https://placehold.co/1200x400/DC3545/FFFFFF?text=FINTECH+SOLUTIONS',
  'https://placehold.co/1200x400/FFC107/000000?text=HEALTHCARE+INNOVATION',
  'https://placehold.co/1200x400/6F42C1/FFFFFF?text=EDTECH+LEARNING',
  'https://placehold.co/1200x400/20C997/FFFFFF?text=AGRITECH+FARMING',
  'https://placehold.co/1200x400/E83E8C/FFFFFF?text=FOODTECH+DELIVERY',
  'https://placehold.co/1200x400/6C757D/FFFFFF?text=LOGISTICS+NETWORK',
  'https://placehold.co/1200x400/17A2B8/FFFFFF?text=REAL+ESTATE+TECH',
  'https://placehold.co/1200x400/343A40/FFFFFF?text=MANUFACTURING',
  'https://placehold.co/1200x400/fd7e14/000000?text=RETAIL+INNOVATION',
  'https://placehold.co/1200x400/20afe7/FFFFFF?text=ENTERTAINMENT+HUB',
  'https://placehold.co/1200x400/FF5722/FFFFFF?text=TRAVEL+TOURISM',
  'https://placehold.co/1200x400/795548/FFFFFF?text=AUTOMOTIVE+TECH',
  'https://placehold.co/1200x400/FF9800/FFFFFF?text=ENERGY+SOLUTIONS',
];

const MediaUpload: React.FC<MediaUploadProps> = ({
  formData,
  imageUrl,
  handleFileChange,
  handleDefaultLogoSelect,
  handleDefaultBannerSelect,
  setActiveSection,
  uploadLoading,
}) => {
  const toast = useToast();
  const [dragActive, setDragActive] = useState({ logo: false, banner: false });
  const [showDefaultLogos, setShowDefaultLogos] = useState(false);
  const [showDefaultBanners, setShowDefaultBanners] = useState(false);

  const handleSelectDefaultLogo = (logoUrl: string) => {
    if (handleDefaultLogoSelect) {
      handleDefaultLogoSelect(logoUrl);
    }
    setShowDefaultLogos(false);
  };

  const handleSelectDefaultBanner = (bannerUrl: string) => {
    if (handleDefaultBannerSelect) {
      handleDefaultBannerSelect(bannerUrl);
    }
    setShowDefaultBanners(false);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>, type: 'logo' | 'banner') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive((prev) => ({ ...prev, [type]: true }));
    } else if (e.type === 'dragleave') {
      setDragActive((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, type: 'logo' | 'banner') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [type]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.open({
          message: {
            heading: 'Invalid File Type',
            content: 'Please upload only image files (PNG, JPG, etc.).',
          },
          duration: 5000,
          position: 'top-center',
          color: 'error',
        });
        return;
      }

      // Create a synthetic event to match the expected interface
      const syntheticEvent = {
        target: {
          files: e.dataTransfer.files,
        },
      } as ChangeEvent<HTMLInputElement>;

      await handleFileChange(syntheticEvent, type);
    }
  };

  const handleSubmit = () => {
    if (!formData.logo || !formData.banner) {
      toast.open({
        message: {
          heading: 'Upload Required',
          content: 'Please upload images before proceeding further.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'warning',
      });
      return;
    }
    setActiveSection('review');
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E5EFF]">Media Settings</h2>
        <p className="text-sm text-gray-500">
          Manage your startup's settings by updating your media.
        </p>
      </div>

      {/* Logo Section */}
      <div className="mb-4 sm:mb-6">
        <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-white shadow-sm">
          <h3 className="flex items-center gap-2 text-base sm:text-lg font-medium text-gray-800">
            Startup Logo
            <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            Upload or update your startup's logo (400x400px).
          </p>
          <label className="block cursor-pointer">
            <div
              className={`border-2 rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center transition-colors duration-200 ${
                dragActive.logo
                  ? 'border-blue-500 bg-blue-50'
                  : imageUrl.logo
                    ? 'border-solid border-gray-300 bg-gray-50 hover:bg-gray-100'
                    : 'border-dashed border-gray-400 bg-gray-50 hover:bg-gray-100'
              }`}
              onDragEnter={(e) => handleDrag(e, 'logo')}
              onDragLeave={(e) => handleDrag(e, 'logo')}
              onDragOver={(e) => handleDrag(e, 'logo')}
              onDrop={(e) => handleDrop(e, 'logo')}
            >
              {imageUrl.logo ? (
                <img
                  className="object-cover h-24 w-24 sm:h-32 sm:w-32 rounded-md"
                  src={imageUrl.logo}
                  alt="Startup logo preview"
                />
              ) : (
                <>
                  <Upload className="text-gray-400 mb-2" size={32} />
                  <span className="text-sm sm:text-base text-gray-600 font-medium">
                    Click to upload logo or drag & drop
                  </span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</span>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'logo')}
              disabled={uploadLoading.logo}
            />
          </label>
        </div>

        {/* Default Logo Options */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowDefaultLogos(!showDefaultLogos)}
            className="flex items-center justify-between w-full p-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span>Choose from default logos</span>
            {showDefaultLogos ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDefaultLogos && (
            <div className="mt-3 p-4 border border-gray-200 rounded-md bg-white">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {DEFAULT_LOGOS.map((logoUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectDefaultLogo(logoUrl)}
                    className="relative group aspect-square border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                  >
                    <img
                      src={logoUrl}
                      alt={`Default logo option ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Click on any logo to use it as your startup logo
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Banner Section */}
      <div className="mb-4 sm:mb-6">
        <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-white shadow-sm">
          <h3 className="flex items-center gap-2 text-base sm:text-lg font-medium text-gray-800">
            Startup Banner
            <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            Upload or update your startup's banner image (1200x400px).
          </p>
          <label className="block cursor-pointer">
            <div
              className={`border-2 rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center transition-colors duration-200 ${
                dragActive.banner
                  ? 'border-blue-500 bg-blue-50'
                  : imageUrl.banner
                    ? 'border-solid border-gray-300 bg-gray-50 hover:bg-gray-100'
                    : 'border-dashed border-gray-400 bg-gray-50 hover:bg-gray-100'
              }`}
              onDragEnter={(e) => handleDrag(e, 'banner')}
              onDragLeave={(e) => handleDrag(e, 'banner')}
              onDragOver={(e) => handleDrag(e, 'banner')}
              onDrop={(e) => handleDrop(e, 'banner')}
            >
              {imageUrl.banner ? (
                <img
                  className="object-cover h-24 sm:h-32 w-full rounded-md"
                  src={imageUrl.banner}
                  alt="Startup banner preview"
                />
              ) : (
                <>
                  <Upload className="text-gray-400 mb-2" size={32} />
                  <span className="text-sm sm:text-base text-gray-600 font-medium">
                    Click to upload banner or drag & drop
                  </span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</span>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'banner')}
              required
              disabled={uploadLoading.banner}
            />
          </label>
        </div>

        {/* Default Banner Options */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowDefaultBanners(!showDefaultBanners)}
            className="flex items-center justify-between w-full p-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span>Choose from default banners</span>
            {showDefaultBanners ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDefaultBanners && (
            <div className="mt-3 p-4 border border-gray-200 rounded-md bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFAULT_BANNERS.map((bannerUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectDefaultBanner(bannerUrl)}
                    className="relative group aspect-[10/3] border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                  >
                    <img
                      src={bannerUrl}
                      alt={`Default banner option ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Click on any banner to use it as your startup banner
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-[#1E5EFF] text-white px-4 sm:px-6 py-2 rounded-md flex items-center gap-2 hover:bg-[#164acc] transition text-sm sm:text-base"
          disabled={uploadLoading.logo || uploadLoading.banner}
        >
          Save and Next
        </button>
      </div>
    </div>
  );
};

export default MediaUpload;
