import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import GoogleAuthButton from '../../../components/auth/GoogleAuthBtn';
import { useToast } from '../../../contexts/toast/toastContext';
const SignIn: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    await login(formData.email, formData.password)
      .then(() => {
        setSubmitMessage({
          type: 'success',
          message: 'Sign in successful! Redirecting...',
        });
        toast.open({
          message: {
            heading: 'Sign In Successful',
            content: 'You have successfully signed in.',
          },
          duration: 5000,
          position: 'top-center',
          color: 'success',
        });
        setTimeout(() => {
          window.location.href = '/dashboard/startups';
        }, 1000);
      })
      .catch((error) => {
        console.error('Sign in failed:', error);
        setSubmitMessage({
          type: 'error',
          message: error.message || 'An error occurred during sign in',
        });
        toast.open({
          message: {
            heading: 'Sign In Failed',
            content: error.message || 'There was an error signing in. Please try again.',
          },
          duration: 5000,
          position: 'top-center',
          color: 'error',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <div className="flex flex-col md:flex-row rounded-lg overflow-hidden w-full px-4 md:px-20 gap-5 md:gap-10 animate-fade-in">
        <div className="w-full md:w-[55%] bg-blue-600 text-white p-10 flex flex-col md:pt-30 rounded-[10px] md:rounded-[50px] text-center md:text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10">
            <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white"></div>
            <div className="absolute bottom-20 left-10 w-60 h-60 rounded-full bg-white"></div>
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Start your
              <br /> Journey with us.
            </h1>
            <p className="mt-3 text-lg md:text-xl opacity-90">
              Discover India's best community of <br />
              startups and MSME's
            </p>

            <div className="mt-12 hidden md:block">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/20 p-3 rounded-full">
                  <CheckCircle size={24} />
                </div>
                <p className="text-lg">Network with top entrepreneurs</p>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/20 p-3 rounded-full">
                  <CheckCircle size={24} />
                </div>
                <p className="text-lg">Access to exclusive resources</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <CheckCircle size={24} />
                </div>
                <p className="text-lg">Participate in growth workshops</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 bg-white rounded-[10px] w-full md:w-[40%] shadow-lg">
          <h2 className="text-2xl font-bold text-center">Sign In</h2>
          <p className="text-center text-gray-600 mt-2">
            New to Our Product?{' '}
            <a href="/auth/signup" className="text-blue-600 font-semibold hover:underline">
              Create an Account
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
            <div className="mb-4">
              <label className="block text-gray-700 font-medium">
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
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter Password"
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center cursor-pointer text-gray-700">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">Keep me signed in</span>
              </label>
              <a
                href="/auth/password_reset"
                className="text-blue-600 text-sm font-semibold hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-[1.01] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
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

          {/* <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm">
              Join thousands of entrepreneurs building their businesses
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default SignIn;
