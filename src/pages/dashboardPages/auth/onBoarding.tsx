import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../../../utils/fileUpload.utils';
import { useToast } from '../../../contexts/toast/toastContext';

type User = {
  firstName?: string;
  lastName?: string;
  email: string;
  gender?: string;
  phone?: string;
  dob?: string;
  photo?: string;
};

const OnBoarding: React.FC = () => {
  const { user, onboarding } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState<User>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    gender: user?.gender ?? '',
    phone: user?.phone ?? '',
    dob: user?.dob ?? '',
    photo: user?.photo ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!(form.firstName ?? '').trim()) {
      newErrors.firstName = 'First name is required';
    } else if ((form.firstName ?? '').trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    if (!(form.lastName ?? '').trim()) {
      newErrors.lastName = 'Last name is required';
    } else if ((form.lastName ?? '').trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    if (!form.gender || form.gender === '') {
      newErrors.gender = 'Please select gender';
    }
    if (!(form.phone ?? '').trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!(form.dob ?? '').trim()) {
      newErrors.dob = 'Date of birth is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      try {
        const file = e.target.files[0];

        // Use the uploadFile utility from fileUpload.utils.ts
        const result = await uploadFile(file, 'profile-photos', {
          email: form.email || 'unknown',
          context: 'User',
          userId: user?._id || 'new-user',
        });

        // Update the form with the returned public URL
        if (result && result.publicUrl) {
          setForm((prev) => ({ ...prev, photo: result.publicUrl }));
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setSubmitMessage({
          type: 'error',
          message: 'Failed to upload profile photo. Please try again.',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage({ type: null, message: '' });

    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      setSubmitMessage({
        type: 'error',
        message: 'Please fix the errors in the form',
      });
      return;
    }

    try {
      await onboarding(form);
      setSubmitMessage({
        type: 'success',
        message: 'Profile updated successfully!',
      });
      toast.open({
        message: {
          heading: 'Onboarding Successful',
          content: 'Your profile has been updated successfully!',
        },
        duration: 5000,
        position: 'top-center',
        color: 'success',
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during onboarding';
      setSubmitMessage({
        type: 'error',
        message: errorMessage,
      });
      toast.open({
        message: {
          heading: 'Onboarding Failed',
          content:
            error instanceof Error
              ? error.message
              : 'There was an error updating your profile. Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-5 bg-gray-100 md:px-20 animate-fade-in">
      <div className="flex flex-col w-full max-w-5xl overflow-hidden bg-white rounded-lg shadow-lg md:flex-row">
        {/* Left Section */}
        <div className="w-full md:w-[55%] bg-blue-600 text-white p-10 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-40 h-40 bg-white rounded-full top-10 right-10"></div>
            <div className="absolute bg-white rounded-full bottom-20 left-10 w-60 h-60"></div>
          </div>
          <div className="relative z-10">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Complete Your Profile</h1>
            <p className="text-lg md:text-xl opacity-90">
              Let’s make your account stand out and connect you with the right opportunities.
            </p>
          </div>
        </div>
        {/* Right Section */}
        <div className="w-full md:w-[45%] p-6 md:p-10">
          {submitMessage.type && (
            <div
              className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
                submitMessage.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <span>{submitMessage.message}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* First Name */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="Enter First Name"
                value={form.firstName ?? ''}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                  touched.firstName && errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {touched.firstName && errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Enter Last Name"
                value={form.lastName ?? ''}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                  touched.lastName && errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {touched.lastName && errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email ?? ''}
                disabled
                className="w-full px-4 py-2 mt-2 bg-gray-100 border rounded-md cursor-not-allowed"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={form.gender ?? ''}
                onChange={handleChange}
                onBlur={handleBlur}
                title="Select your gender"
                aria-label="Gender selection"
                className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  touched.gender && errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {touched.gender && errors.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter Phone Number"
                value={form.phone ?? ''}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                  touched.phone && errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {touched.phone && errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={form.dob ?? ''}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full px-4 py-2 border rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                  touched.dob && errors.dob ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {touched.dob && errors.dob && (
                <p className="mt-1 text-sm text-red-500">{errors.dob}</p>
              )}
            </div>

            {/* Photo Field */}
            <div className="mb-4">
              <label className="block font-medium text-gray-700">Profile Photo</label>
              <div className="flex items-center mt-2">
                {form.photo ? (
                  <div className="relative">
                    <img
                      src={form.photo}
                      alt="Profile preview"
                      className="object-cover w-16 h-16 rounded-full"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, photo: '' }))}
                      className="absolute p-1 text-xs text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full">
                    <span className="text-gray-500">Upload</span>
                  </div>
                )}

                <label className="flex items-center justify-center px-4 py-2 ml-5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleFileUpload}
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

            <button
              type="submit"
              className="w-full py-3 font-semibold text-white transition-all bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnBoarding;
