import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios, { AxiosResponse } from 'axios';
import { useToast } from '../../../contexts/toast/toastContext';

const strengthLabels: string[] = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors: string[] = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-400',
  'bg-green-400',
  'bg-green-600',
];

const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  if (!password) return score;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[\W_]/.test(password)) score += 1;
  if (score >= 7) return 4;
  if (score >= 5) return 3;
  if (score >= 3) return 2;
  if (score >= 1) return 1;
  return 0;
};

const SetNewPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  useEffect(() => {
    setPasswordStrength(password.length > 0 ? calculatePasswordStrength(password) : 0);
  }, [password]);

  const validate = (): boolean => {
    if (!password || !confirmPassword) {
      setError('Please fill in both fields.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      setError('Reset token is missing or invalid.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response: AxiosResponse<any> = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/reset-password/${token}`,
        { password, confirmPassword },
        { headers: { 'Content-Type': 'application/json' } },
      );
      if (response.status === 200 && response.data?.status === 'success') {
        setSuccess(true);
        toast.open({
          message: {
            heading: 'Password Changed Successful',
            content: 'Your password has been changed successfully.',
          },
          duration: 5000,
          position: 'top-center',
          color: 'success',
        });
        setTimeout(() => {
          navigate('/auth/signin');
        }, 1500);
      } else {
        setError(response.data?.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
      toast.open({
        message: {
          heading: 'Password Reset Failed',
          content: 'There was an error resetting your password. Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon: React.FC<{ open: boolean }> = ({ open }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-6 w-6 transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-180'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {open ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </>
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 012.781-4.436m2.325-1.718A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.978 9.978 0 01-1.872 3.39M3 3l18 18"
        />
      )}
    </svg>
  );

  return (
    <div className="flex items-center justify-center min-h-screen p-5">
      <div className="flex flex-col h-auto md:h-[650px] md:flex-row rounded-lg overflow-hidden w-full md:px-20 gap-5 md:gap-10 animate-fade-in">
        {/* Left panel */}
        <div className="w-full md:w-[55%] bg-blue-600 text-white p-10 flex flex-col md:pt-30 rounded-[10px] md:rounded-[50px] text-center md:text-left">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Start your
            <br /> Journey with us.
          </h1>
          <p className="mt-3 text-lg">
            Discover the India's best community of <br />
            startups and MSME's
          </p>
        </div>

        {/* Right panel */}
        <div className="p-6 md:p-10 bg-white h-fit self-center rounded-[10px] w-full md:w-[35%] shadow-lg">
          <h2 className="text-2xl font-bold text-center">Set New Password</h2>
          <p className="mt-2 text-sm text-center text-gray-600">
            Please enter your new password below
          </p>
          <form className="mt-6" onSubmit={handleSubmit} autoComplete="new-password" noValidate>
            {/* New Password Field */}
            <label className="relative block font-medium text-gray-700">New Password</label>
            <div className="relative w-full mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className="w-full px-4 py-2 pr-12 transition-all duration-300 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                aria-describedby="password-strength-text"
                aria-invalid={
                  !!error && (error.includes('Password') || error.includes('match'))
                    ? 'true'
                    : 'false'
                }
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute text-gray-600 transition-colors duration-300 -translate-y-1/2 top-1/2 right-3 hover:text-blue-600 focus:outline-none"
                tabIndex={0}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div
                className="flex items-center mt-2 space-x-2"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="flex flex-grow h-2 space-x-1 overflow-hidden bg-gray-200 rounded">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className={`transition-colors duration-500 ${
                          i <= passwordStrength
                            ? strengthColors[passwordStrength]
                            : 'bg-transparent'
                        }`}
                        style={{ flex: 1 }}
                      />
                    ))}
                </div>
                <span
                  id="password-strength-text"
                  className={`text-sm font-semibold ${
                    passwordStrength < 2
                      ? 'text-red-600'
                      : passwordStrength < 4
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                >
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}

            {/* Confirm Password Field */}
            <label className="relative block mt-4 font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative w-full mt-2">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                className={`w-full px-4 py-2 pr-12 transition-all duration-300 border rounded-md focus:outline-none focus:ring-2 ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-400'
                }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                aria-invalid={!!error && error.includes('match') ? 'true' : 'false'}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute text-gray-600 transition-colors duration-300 -translate-y-1/2 top-1/2 right-3 hover:text-blue-600 focus:outline-none"
                tabIndex={0}
              >
                <EyeIcon open={showConfirmPassword} />
              </button>
            </div>

            {/* Error / Success */}
            {error && <div className="mt-2 text-sm text-center text-red-500">{error}</div>}
            {success && (
              <div className="mt-2 text-sm text-center text-green-600">
                Password has been reset successfully! Redirecting...
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md mt-6 hover:bg-blue-700 transition-all duration-300 hover:scale-[1.001]"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Set New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetNewPassword;
