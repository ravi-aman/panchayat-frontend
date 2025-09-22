import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/toast/toastContext';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PasswordReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const isEmailValid = emailRegex.test(email.trim());
  const isSubmitDisabled = loading || !email.trim() || !isEmailValid;

  // Auto-focus email on mount for quick entry
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Improved keyboard UX: allow Enter to submit only when valid & not loading
  const handleKeyDown: React.KeyboardEventHandler<HTMLFormElement> = (e) => {
    if (e.key === 'Enter' && isSubmitDisabled) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    setSuccess(false);

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email is required');
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/forgot-password`,
        { email: trimmed },
        { headers: { 'Content-Type': 'application/json' } },
      );

      if ((res.status === 200 || res.status === 201) && res.data?.status === 'success') {
        setSuccess(true);
        setError(null);
        toast.open({
          message: {
            heading: 'Password Reset Successful',
            content: 'A password reset link has been sent to your email.',
          },
          duration: 5000,
          position: 'top-center',
          color: 'success',
        });
        setTimeout(() => {
          navigate('/auth/register_complete');
        }, 600);
      } else {
        setError(res.data?.message || 'Something went wrong. Please try again.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Password reset failed. Please check your email and try again.';
      setError(msg);
      toast.open({
        message: { heading: 'Password Reset Failed', content: msg },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full h-screen  bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <div className="mx-auto flex h-screen justify-center items-center max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex flex-col md:h-[100%] md:w-[100%] md:flex-row gap-6 md:gap-8 items-center justify-center">
          {/* Left panel (hero) */}
          <div className="w-full md:w-[55%] h-full bg-blue-600 text-white p-10 flex flex-col md:pt-30 rounded-[10px] md:rounded-[50px] text-center md:text-left">
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Start your
              <br /> Journey with us.
            </h1>
            <p className="mt-3 text-lg">
              Discover the India's best community of <br />
              startups and MSME's
            </p>
          </div>

          {/* Right panel (form card) */}
          <section className="w-full md:w-[420px] lg:w-[440px] mx-auto md:ml-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-5 sm:p-6 md:p-8">
            <header className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold">Password Reset</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                We'll help you reset your Password
              </p>
            </header>

            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              aria-busy={loading}
              noValidate
            >
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  ref={inputRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Enter Email Address"
                  className={[
                    'w-full px-4 py-2 rounded-md border transition-all duration-200 bg-white dark:bg-gray-950',
                    'focus:outline-none focus:ring-2 focus:ring-blue-400',
                    error && touched
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-gray-300 dark:border-gray-700',
                  ].join(' ')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  onBlur={() => setTouched(true)}
                  required
                  aria-invalid={!!error}
                  aria-describedby={error ? 'email-error' : undefined}
                />
                {/* Inline helper/validation */}
                <div className="min-h-[1.25rem]">
                  {error ? (
                    <p id="email-error" role="alert" className="text-xs text-red-600">
                      {error}
                    </p>
                  ) : touched && email && !isEmailValid ? (
                    <p className="text-xs text-red-600">Please enter a valid email address</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      We’ll send a secure reset link to this email.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className={[
                  'w-full inline-flex items-center justify-center gap-2',
                  'bg-blue-600 text-white font-semibold py-2.5 rounded-md',
                  'transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                ].join(' ')}
                disabled={isSubmitDisabled}
              >
                {loading && (
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {loading ? 'Sending...' : 'Reset Password'}
              </button>

              {/* Success message region */}
              <AnimateMessage show={success} type="success">
                Password reset link has been sent! Redirecting to login...
              </AnimateMessage>
            </form>

            <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400">
              Remember your Password?{' '}
              <a
                href="/auth/signin"
                className="font-semibold text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Back to Sign In
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

/** Small helper to animate status messages without extra deps */
const AnimateMessage: React.FC<{
  show: boolean;
  type?: 'success' | 'error';
  children: React.ReactNode;
}> = ({ show, type = 'success', children }) => (
  <div
    role="status"
    aria-live="polite"
    className={[
      'transition-all duration-300 overflow-hidden',
      show ? 'max-h-24 opacity-100 mt-1' : 'max-h-0 opacity-0',
      type === 'success' ? 'text-sm text-green-600' : 'text-sm text-red-600',
    ].join(' ')}
  >
    {children}
  </div>
);

export default PasswordReset;
