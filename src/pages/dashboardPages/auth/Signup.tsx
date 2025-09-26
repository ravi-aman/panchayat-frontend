import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader, Upload } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import GoogleAuthButton from '../../../components/auth/GoogleAuthBtn';
// import { User } from '../../../types/types';
import { uploadFile, validateFile } from '../../../utils/fileUpload.utils';
import { useToast } from '../../../contexts/toast/toastContext';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string;
    dob: string;
    photo: string;
    phone: string;
    agreeToTerms: boolean;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dob: '',
    photo: '',
    phone: '',
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const { registerUser, updateUserPhoto } = useAuth();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    message: string;
    color: string;
  }>({
    score: 0,
    message: '',
    color: 'bg-gray-200',
  });
  const toast = useToast();
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0] || null;

      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength({
        score: 0,
        message: '',
        color: 'bg-gray-200',
      });
      return;
    }

    let score = 0;

    if (formData.password.length >= 8) score += 1;
    if (formData.password.length >= 12) score += 1;

    // Character variety checks
    if (/[A-Z]/.test(formData.password)) score += 1;
    if (/[a-z]/.test(formData.password)) score += 1;
    if (/[0-9]/.test(formData.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) score += 1;

    let message = '';
    let color = '';

    if (score < 3) {
      message = 'Weak';
      color = 'bg-red-500';
    } else if (score < 5) {
      message = 'Moderate';
      color = 'bg-yellow-500';
    } else {
      message = 'Strong';
      color = 'bg-green-500';
    }

    setPasswordStrength({ score: Math.min(score, 6), message, color });
  }, [formData.password]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'firstName is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'firstName must be at least 2 characters';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'lastName is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'lastName must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 100);

      if (dobDate > today) {
        newErrors.dob = 'Date of birth cannot be in the future';
      } else if (dobDate < minDate) {
        newErrors.dob = 'Please enter a valid date of birth';
      }
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];

      // Validate file using the utility
      const validation = validateFile(file, {
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
        maxSize: 5 * 1024 * 1024, // 5MB
      });

      if (validation !== true) {
        setSubmitMessage({
          type: 'error',
          message: validation,
        });
        return;
      }
      setSubmitMessage({ type: null, message: '' });
      setUserPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitMessage({ type: null, message: '' });

    const isValid = validateForm();

    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (!isValid) {
      setSubmitMessage({
        type: 'error',
        message: 'Please fix the errors in the form',
      });
      return;
    }

    setLoading(true);

    const data = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      photo: formData.photo,
      gender: formData.gender.toLowerCase() as 'male' | 'female',
      dob: formData.dob,
      phone: formData.phone,
    };

    try {
      await registerUser(data).then(() => {
        setSubmitMessage({
          type: 'success',
          message: 'Account created successfully! Redirecting to dashboard...',
        });

        toast.open({
          message: {
            heading: 'Registration Successful',
            content: 'Your account has been created successfully.',
          },
          duration: 5000,
          position: 'top-center',
          color: 'success',
        });
      });
    } catch (error: unknown) {
      console.error('Sign up failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during sign up';
      setSubmitMessage({
        type: 'error',
        message: errorMessage,
      });
      toast.open({
        message: {
          heading: 'Sign Up Failed',
          content:
            error instanceof Error
              ? error.message
              : 'There was an error signing up. Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    } finally {
      setLoading(false);
    }
    if (userPhoto) {
      const res = await uploadFile(userPhoto as File, 'profile-photos', {
        email: formData.email || 'unknown',
        context: 'User',
        name: `${formData.firstName || 'user'}-${formData.lastName || 'profile'}-${Date.now()}`,
      });
      console.log(res);
      if (res && res.publicUrl) {
        if (updateUserPhoto) {
          await updateUserPhoto(res.publicUrl);
        }
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5 bg-gray-100">
      <div className="flex flex-col w-full gap-5 px-4 overflow-hidden rounded-lg md:flex-row md:px-20 md:gap-10 animate-fade-in">
        <div className="w-full md:w-[55%] bg-blue-600 text-white p-10 flex flex-col md:pt-30 rounded-[10px] md:rounded-[50px] text-center md:text-left relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 right-0 opacity-10">
            <div className="absolute w-40 h-40 bg-white rounded-full top-10 right-10"></div>
            <div className="absolute bg-white rounded-full bottom-20 left-10 w-60 h-60"></div>
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Start your
              <br />
              Journey with us.
            </h1>
            <p className="mt-3 text-lg md:text-xl opacity-90">
              Discover India's best community of
              <br />
              Startups and MSME's
            </p>

            <div className="hidden mt-12 md:block">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-white/20">
                  <CheckCircle size={24} />
                </div>
                <p className="text-lg">Network with top entrepreneurs</p>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-white/20">
                  <CheckCircle size={24} />
                </div>
                <p className="text-lg">Access to exclusive resources</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-white/20">
                  <CheckCircle size={24} />
                </div>
                <p className="text-lg">Participate in growth workshops</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="p-6 md:p-10 bg-white rounded-[10px] w-full md:w-[40%] shadow-lg">
          <h2 className="text-2xl font-bold text-center">Create an Account</h2>
          <p className="mt-2 text-center text-gray-600">
            Have an Account?{' '}
            <a href="/auth/signin" className="font-semibold text-blue-600 hover:underline">
              Sign In
            </a>
          </p>

          {submitMessage.type && (
            <div
              className={`mt-4 p-3 rounded-md flex items-center gap-2 ${
                submitMessage.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {submitMessage.type === 'success' ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{submitMessage.message}</span>
            </div>
          )}

          <form className="mt-6" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-4 mb-4 md:flex-row">
              <div className="w-full">
                <label className="block font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all
                                    ${
                                      touched.firstName && errors.firstName
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                    }`}
                />
                {touched.firstName && errors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div className="w-full">
                <label className="block font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all
                                    ${
                                      touched.lastName && errors.lastName
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                    }`}
                />
                {touched.lastName && errors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter Email Address"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all
                                ${
                                  touched.email && errors.email
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                                }`}
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="string"
                name="phone"
                placeholder="Enter Phone Number"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all
                                ${
                                  touched.phone && errors.phone
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                                }`}
              />
              {touched.phone && errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-medium text-gray-700">Profile Photo</label>
              <div className="flex items-center mt-2">
                {avatarPreview || formData.photo ? (
                  <div className="relative">
                    <img
                      src={avatarPreview || formData.photo}
                      alt="Profile preview"
                      className="object-cover w-16 h-16 rounded-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, photo: '' }));
                        setAvatarPreview('');
                        setSubmitMessage({ type: null, message: '' });
                        console.log('Avatar removed');
                      }}
                      className="absolute p-1 text-xs text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
                      title="Remove photo"
                      aria-label="Remove profile photo"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full">
                    <Upload size={24} className="text-gray-500" />
                  </div>
                )}

                <label className="flex items-center justify-center px-4 py-2 ml-5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="sr-only"
                    title="Upload profile photo"
                    aria-label="Upload profile photo"
                  />
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Max file size: 5MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>

            <div className="mb-4">
              <label className="block font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create Password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all pr-10
                                    ${
                                      touched.password && errors.password
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute text-gray-500 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
                    <div
                      className={`h-full ${passwordStrength.color}`}
                      style={{
                        width: `${(passwordStrength.score / 6) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="mt-1 text-sm">
                    Password strength:{' '}
                    <span className="font-medium">{passwordStrength.message}</span>
                  </p>
                </div>
              )}
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Your Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all pr-10
                                    ${
                                      touched.confirmPassword && errors.confirmPassword
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute text-gray-500 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-medium text-gray-700">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-4 mt-2">
                <label
                  className={`flex items-center px-4 py-2 rounded-md cursor-pointer border transition-all
                                    ${
                                      formData.gender === 'male'
                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span>Male</span>
                </label>

                <label
                  className={`flex items-center px-4 py-2 rounded-md cursor-pointer border transition-all
                                    ${
                                      formData.gender === 'female'
                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span>Female</span>
                </label>
              </div>
              {touched.gender && errors.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-medium text-gray-700">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all
                                ${
                                  touched.dob && errors.dob ? 'border-red-500' : 'border-gray-300'
                                }`}
              />
              {touched.dob && errors.dob && (
                <p className="mt-1 text-sm text-red-500">{errors.dob}</p>
              )}
            </div>

            <div className="mb-6">
              <label
                className={`flex items-start cursor-pointer
                                ${
                                  touched.agreeToTerms && errors.agreeToTerms
                                    ? 'text-red-500'
                                    : 'text-gray-700'
                                }`}
              >
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span className="ml-2 text-sm">
                  By creating an account, I agree to the{' '}
                  <a href="#" className="font-semibold text-blue-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="font-semibold text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {touched.agreeToTerms && errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-500">{errors.agreeToTerms}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-[1.01] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader size={20} className="mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          <div className="flex items-center my-6">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-sm text-gray-500">Or sign in with</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>
          <div className="flex justify-center">
            <GoogleAuthButton />
          </div>

          {/* <div className="pt-6 mt-8 border-t border-gray-200">
                        <p className="text-sm text-center text-gray-600">
                            Join thousands of entrepreneurs building their businesses
                        </p>

                        <div className="flex justify-center mt-4 space-x-4">
                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        </div>
                    </div> */}
        </div>
      </div>
    </div>
  );
};

export default Signup;
