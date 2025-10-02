import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MapPin, Shield, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../contexts/toast/toastContext';
import MobileVerificationService, { LocationData } from '../../services/MobileVerificationService';

interface MobileVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  title?: string;
  subtitle?: string;
}

type VerificationStep = 'phone' | 'location' | 'otp' | 'success';

const MobileVerificationModal: React.FC<MobileVerificationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  title = "Complete Your Profile",
  subtitle = "Help us secure your account and provide better services"
}) => {
  const toast = useToast();

  // State management
  const [currentStep, setCurrentStep] = useState<VerificationStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Get current location
  const handleGetLocation = async () => {
    setIsLocationLoading(true);
    try {
      const locationData = await MobileVerificationService.getCurrentLocation();
      setLocation(locationData);
      setCurrentStep('otp');
      toast.open({
        message: {
          heading: 'Location Detected',
          content: `Found your location: ${locationData.city}, ${locationData.state}`
        },
        duration: 3000,
        position: 'top-center',
        color: 'success'
      });
    } catch (error) {
      console.error('Error getting location:', error);
      toast.open({
        message: {
          heading: 'Location Error',
          content: 'Unable to get your location. You can continue without it.'
        },
        duration: 5000,
        position: 'top-center',
        color: 'warning'
      });
      // Allow user to continue without location
      setCurrentStep('otp');
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Check phone availability and send OTP
  const handlePhoneSubmit = async () => {
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    
    if (phoneNumber.length < 10) {
      toast.open({
        message: {
          heading: 'Invalid Phone Number',
          content: 'Please enter a valid phone number'
        },
        duration: 3000,
        position: 'top-center',
        color: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if phone is available
      const isAvailable = await MobileVerificationService.checkPhoneAvailability(fullPhoneNumber);
      
      if (!isAvailable) {
        toast.open({
          message: {
            heading: 'Phone Number Unavailable',
            content: 'This phone number is already registered with another account'
          },
          duration: 5000,
          position: 'top-center',
          color: 'error'
        });
        return;
      }

      // Send OTP
      const result = await MobileVerificationService.sendOTP(fullPhoneNumber);
      
      if (result.success) {
        setCurrentStep('location');
        toast.open({
          message: {
            heading: 'OTP Sent',
            content: 'Verification code sent to your WhatsApp'
          },
          duration: 3000,
          position: 'top-center',
          color: 'success'
        });
        setOtpTimer(60);
        setCanResendOtp(false);
      } else {
        throw new Error(result.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Phone Submit Error:', error);
      
      let errorMessage = 'Failed to send verification code';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific phone-related errors
      if (errorMessage.includes('already registered') || errorMessage.includes('not available')) {
        errorMessage = 'This phone number is already registered with another account';
      } else if (errorMessage.includes('invalid')) {
        errorMessage = 'Please enter a valid phone number';
      }
      
      toast.open({
        message: {
          heading: 'Error',
          content: errorMessage
        },
        duration: 5000,
        position: 'top-center',
        color: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and update profile
  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      toast.open({
        message: {
          heading: 'Invalid OTP',
          content: 'Please enter the 6-digit verification code'
        },
        duration: 3000,
        position: 'top-center',
        color: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      console.log('Verifying OTP:', {
        otp,
        phone: fullPhoneNumber,
        timestamp: new Date().toISOString()
      });
      
      // Verify OTP with phone number
      const result = await MobileVerificationService.verifyOTP(otp, fullPhoneNumber);
      
      if (result.success) {
        // OTP verification successful - backend already updated phone verification status
        console.log('OTP verification successful:', result);
        setCurrentStep('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        throw new Error(result.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('OTP Verification Error:', error);
      
      // Handle specific error messages from backend
      let errorMessage = 'Invalid verification code';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Provide user-friendly error messages
      if (errorMessage.includes('does not match')) {
        errorMessage = 'Phone number does not match the verification request. Please try again.';
      } else if (errorMessage.includes('No verification code found')) {
        errorMessage = 'No verification code found. Please request a new one.';
      } else if (errorMessage.includes('expired')) {
        errorMessage = 'Verification code has expired. Please request a new one.';
      } else if (errorMessage.includes('Invalid verification code')) {
        errorMessage = 'Invalid verification code. Please check and try again.';
      }
      
      toast.open({
        message: {
          heading: 'Verification Failed',
          content: errorMessage
        },
        duration: 5000,
        position: 'top-center',
        color: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    setIsLoading(true);
    
    try {
      const result = await MobileVerificationService.sendOTP(fullPhoneNumber);
      
      if (result.success) {
        toast.open({
          message: {
            heading: 'OTP Resent',
            content: 'New verification code sent to your WhatsApp'
          },
          duration: 3000,
          position: 'top-center',
          color: 'success'
        });
        setOtpTimer(60);
        setCanResendOtp(false);
        setOtp(''); // Clear previous OTP
      } else {
        throw new Error(result.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Resend OTP Error:', error);
      
      let errorMessage = 'Failed to resend verification code';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.open({
        message: {
          heading: 'Error',
          content: errorMessage
        },
        duration: 3000,
        position: 'top-center',
        color: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && currentStep !== 'success' && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white relative">
            {currentStep !== 'success' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                {currentStep === 'phone' && <Phone className="w-8 h-8" />}
                {currentStep === 'location' && <MapPin className="w-8 h-8" />}
                {currentStep === 'otp' && <Shield className="w-8 h-8" />}
                {currentStep === 'success' && <Check className="w-8 h-8" />}
              </div>
              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              <p className="text-blue-100 text-sm">{subtitle}</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              {['phone', 'location', 'otp', 'success'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep === step
                        ? 'bg-blue-600 text-white'
                        : ['phone', 'location', 'otp', 'success'].indexOf(currentStep) > index
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {['phone', 'location', 'otp', 'success'].indexOf(currentStep) > index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-12 h-1 mx-2 transition-colors ${
                        ['phone', 'location', 'otp', 'success'].indexOf(currentStep) > index
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Phone Step */}
            {currentStep === 'phone' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Verify Your Phone Number
                  </h3>
                  <p className="text-gray-600 text-sm">
                    We'll send a verification code to your WhatsApp
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country Code
                    </label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="+91">🇮🇳 +91 (India)</option>
                      <option value="+1">🇺🇸 +1 (USA)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+86">🇨🇳 +86 (China)</option>
                      <option value="+81">🇯🇵 +81 (Japan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter your phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={10}
                    />
                  </div>

                  <button
                    onClick={handlePhoneSubmit}
                    disabled={isLoading || phoneNumber.length < 10}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Location Step */}
            {currentStep === 'location' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Share Your Location
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Help us provide location-based services and connect you with nearby users
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Why do we need your location?</p>
                      <ul className="text-xs space-y-1">
                        <li>• Find and connect with people nearby</li>
                        <li>• Show location-based content and events</li>
                        <li>• Improve security and prevent fraud</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleGetLocation}
                    disabled={isLocationLoading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    {isLocationLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <MapPin className="w-5 h-5 mr-2" />
                    )}
                    {isLocationLoading ? 'Getting Location...' : 'Allow Location Access'}
                  </button>

                  <button
                    onClick={() => setCurrentStep('otp')}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Skip for Now
                  </button>
                </div>

                {location && (
                  <div className="bg-green-50 rounded-lg p-3 mt-4">
                    <div className="flex items-center space-x-2 text-green-800">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Location detected:</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {location.city}, {location.state}, {location.country}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* OTP Step */}
            {currentStep === 'otp' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Enter Verification Code
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    We sent a 6-digit code to {countryCode}{phoneNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    Check your WhatsApp messages
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setOtp(value);
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      setOtp(paste);
                    }}
                    placeholder="000000"
                    className="w-full px-3 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  {otp.length > 0 && otp.length < 6 && (
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {6 - otp.length} more digits needed
                    </p>
                  )}
                </div>

                <button
                  onClick={handleOtpSubmit}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <div className="text-center">
                  {otpTimer > 0 ? (
                    <p className="text-sm text-gray-600">
                      Resend code in {otpTimer} seconds
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={isLoading || !canResendOtp}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Success Step */}
            {currentStep === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Verification Complete!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your phone number has been verified successfully
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ Phone number verified</p>
                  {location && <p>✓ Location saved</p>}
                  <p>✓ Profile updated</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileVerificationModal;