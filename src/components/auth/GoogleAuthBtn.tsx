import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/toast/toastContext';

const GoogleAuthButton = () => {
  const naviagate = useNavigate();
  const { googleLogin } = useAuth();
  const toast = useToast();
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential returned from Google');
      }
      const res = await googleLogin({
        credential: credentialResponse.credential,
      });
      toast.open({
        message: {
          heading: 'Google Login Successful',
          content: 'You have successfully logged in with Google.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'success',
      });
      if (res?.isNewUser) {
        naviagate('/auth/onboarding');
      } else {
        naviagate('/dashboard/startups');
      }
    } catch (error) {
      console.error('Google auth failed:', error);
      toast.open({
        message: {
          heading: 'Google Login Failed',
          content: 'There was an error logging in with Google. Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    }
  };

  const handleError = () => {
    console.log('Google login failed');
  };

  return <GoogleLogin onSuccess={handleSuccess} onError={handleError} useOneTap />;
};

export default GoogleAuthButton;
