import React from 'react';
import MobileVerificationModal from './MobileVerificationModal';
import { useMobileVerification } from '../../hooks/useMobileVerification';

interface MobileVerificationWrapperProps {
  children: React.ReactNode;
}

const MobileVerificationWrapper: React.FC<MobileVerificationWrapperProps> = ({ children }) => {
  const {
    shouldShowModal,
    hideVerificationModal,
    markVerificationComplete,
    isLoading,
  } = useMobileVerification();

  console.log('🔍 MobileVerificationWrapper render:', {
    shouldShowModal,
    isLoading,
    willShowModal: !isLoading && shouldShowModal
  });

  return (
    <>
      {children}
      
      {/* Mobile Verification Modal */}
      {!isLoading && shouldShowModal && (
        <MobileVerificationModal
          isOpen={shouldShowModal}
          onClose={hideVerificationModal}
          onComplete={markVerificationComplete}
          title="Complete Your Profile"
          subtitle="Verify your phone number to secure your account and unlock all features"
        />
      )}
    </>
  );
};

export default MobileVerificationWrapper;