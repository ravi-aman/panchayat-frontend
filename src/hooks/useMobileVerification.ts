import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MobileVerificationService, { VerificationStatus } from '../services/MobileVerificationService';

export const useMobileVerification = () => {
  const { activeProfile, isAuthenticated, user, refreshUserData } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [verificationCompleted, setVerificationCompleted] = useState(false);

  console.log('🔍 useMobileVerification - Initial state:', {
    isAuthenticated,
    user,
    activeProfile,
    verificationStatus,
    isLoading,
    shouldShowModal,
    verificationCompleted
  });
  
  console.log('🔍 Current user from AuthContext:', user);
  console.log('🔍 User phone field:', user?.phone);
  console.log('🔍 User phoneVerified field:', user?.phoneVerified);

  // Check verification status when user is authenticated
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!isAuthenticated || !activeProfile || !user) {
        console.log('🔍 Skipping verification check - not authenticated or missing data');
        setIsLoading(false);
        return;
      }

      // If user data is missing phone fields, try to refresh it first
      if (!user.phone && !user.phoneVerified && refreshUserData) {
        console.log('🔍 User data missing phone info, refreshing from backend...');
        try {
          await refreshUserData();
          // The useEffect will re-run with updated user data
          return;
        } catch (error) {
          console.error('🔍 Failed to refresh user data:', error);
        }
      }

      // If user already has phoneVerified: true, skip everything
      if (!!user.phoneVerified) {
        console.log('🔍 User already verified in AuthContext, skipping verification check');
        setVerificationStatus({ phoneVerified: true, phone: user.phone });
        setVerificationCompleted(true);
        setShouldShowModal(false);
        setIsLoading(false);
        return;
      }

      try {
        // Always check the backend verification status first
        console.log('🔍 Checking backend verification status...');
        const status = await MobileVerificationService.getVerificationStatus();
        setVerificationStatus(status);
        
        console.log('🔍 Backend verification status received:', status);
        console.log('🔍 Current user data:', user);
        
        console.log('User verification check:', {
          userPhone: user.phone,
          backendStatus: status,
          verificationCompleted,
          hasPhoneInUser: user.phone && user.phone.trim() !== '',
          isPhoneVerifiedInBackend: status.phoneVerified === true,
          isFullyVerified: status.phoneVerified === true || verificationCompleted
        });
        
        // Check multiple conditions for phone verification
        const hasPhoneInUser = user.phone && user.phone.trim() !== '';
        const isPhoneVerifiedInUser = !!user.phoneVerified;
        const isPhoneVerifiedInBackend = status.phoneVerified === true;
        
        // User is considered verified if ANY of these conditions are true:
        // 1. User object has phoneVerified: true
        // 2. Backend verification status is true  
        // 3. Verification was completed in this session
        const isFullyVerified = isPhoneVerifiedInUser || isPhoneVerifiedInBackend || verificationCompleted;
        
        console.log('🔍 Verification decision logic:', {
          hasPhoneInUser,
          isPhoneVerifiedInUser,
          isPhoneVerifiedInBackend, 
          verificationCompleted,
          isFullyVerified,
          willShowModal: !hasPhoneInUser && !isFullyVerified
        });
        
        if (!hasPhoneInUser && !isFullyVerified) {
          // User has no phone number and is not verified - show modal to add phone
          console.log('🔍 DECISION: Showing modal - user has no phone and is not verified');
          setTimeout(() => {
            setShouldShowModal(true);
          }, 1000);
        } else if (isFullyVerified) {
          // User is verified - mark as completed and hide modal
          console.log('🔍 DECISION: User is verified - hiding modal');
          setVerificationCompleted(true);
          setShouldShowModal(false);
        } else {
          console.log('🔍 DECISION: User has phone but not verified - no modal, cards may show');
        }
        
      } catch (error) {
        console.error('Error checking verification status:', error);
        // If there's an error, only show modal if user has no phone and isn't verified
        const hasPhoneNumber = user.phone && user.phone.trim() !== '';
        const isVerified = !!user.phoneVerified || verificationCompleted;
        
        if (!hasPhoneNumber && !isVerified) {
          setTimeout(() => {
            setShouldShowModal(true);
          }, 1000);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkVerificationStatus();
  }, [isAuthenticated, activeProfile, user, verificationCompleted]);

  // Function to manually show the modal
  const showVerificationModal = () => {
    setShouldShowModal(true);
  };

  // Function to hide the modal
  const hideVerificationModal = () => {
    setShouldShowModal(false);
  };

  // Function to mark verification as complete
  const markVerificationComplete = async () => {
    setShouldShowModal(false);
    setVerificationCompleted(true); // Mark that verification was completed
    
    // Refresh verification status
    try {
      const status = await MobileVerificationService.getVerificationStatus();
      setVerificationStatus(status);
      
      // Refresh user data in AuthContext to get updated phone info
      if (refreshUserData) {
        await refreshUserData();
      }
    } catch (error) {
      console.error('Error refreshing verification status:', error);
    }
  };

  const returnValues = {
    verificationStatus,
    isLoading,
    shouldShowModal,
    showVerificationModal,
    hideVerificationModal,
    markVerificationComplete,
    isPhoneVerified: verificationStatus?.phoneVerified || !!user?.phoneVerified || verificationCompleted,
    hasPhone: !!(verificationStatus?.phone || user?.phone),
  };

  console.log('🔍 useMobileVerification return values:', returnValues);

  return returnValues;
};

export default useMobileVerification;