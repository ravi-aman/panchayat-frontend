import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Shield, X, AlertTriangle } from 'lucide-react';
import { useMobileVerification } from '../../hooks/useMobileVerification';

interface MobileVerificationCardProps {
  variant?: 'banner' | 'card' | 'inline';
  showDismiss?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const MobileVerificationCard: React.FC<MobileVerificationCardProps> = ({
  variant = 'card',
  showDismiss = false,
  onDismiss,
  className = '',
}) => {
  const { showVerificationModal, isPhoneVerified, hasPhone } = useMobileVerification();

  console.log('🔍 MobileVerificationCard render:', {
    isPhoneVerified,
    hasPhone,
    variant,
    willShow: !isPhoneVerified
  });

  // Don't show if phone is already verified
  if (isPhoneVerified) {
    console.log('MobileVerificationCard: Not showing because phone is verified');
    return null;
  }

  const handleVerifyClick = () => {
    showVerificationModal();
  };

  

  const renderCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white border border-orange-200 rounded-xl p-6 shadow-sm ${className}`}
    >
      {showDismiss && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}
      
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
          {hasPhone ? (
            <Shield className="w-6 h-6 text-orange-600" />
          ) : (
            <Phone className="w-6 h-6 text-orange-600" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {hasPhone ? 'Verify Your Phone Number' : 'Add Your Phone Number'}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {hasPhone 
              ? 'Complete verification to secure your account and access all features'
              : 'Add and verify your phone number to unlock all platform features'
            }
          </p>
          
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              <span>Enhanced account security</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              <span>Two-factor authentication</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              <span>Connect with nearby users</span>
            </div>
          </div>
          
          <button
            onClick={handleVerifyClick}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors text-sm"
          >
            {hasPhone ? 'Verify Now' : 'Add Phone Number'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderInline = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            {hasPhone ? (
              <Shield className="w-4 h-4 text-orange-600" />
            ) : (
              <Phone className="w-4 h-4 text-orange-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">
              {hasPhone ? 'Verify phone number' : 'Add phone number'}
            </p>
            <p className="text-xs text-gray-600">
              Required for account security
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleVerifyClick}
            className="bg-orange-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-orange-700 transition-colors text-xs"
          >
            {hasPhone ? 'Verify' : 'Add'}
          </button>
          
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-orange-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  switch (variant) {
    case 'banner':
      // return renderBanner();
      console.log('🔍 Banner variant not implemented yet, defaulting to card');
      break;
    case 'inline':
      return renderInline();
    default:
      return renderCard();
  }
};

export default MobileVerificationCard;