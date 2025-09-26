//authcontext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { Profile, User } from '../types/types';
interface OnboardingData {
  firstName?: string;
  lastName?: string;
  email: string;
  gender?: string;
  phone?: string;
  dob?: string;
  photo?: string;
}

import api, { setLogoutFunction } from '../utils/api'; // Import the function to set logout
interface AuthContextState {
  user: User | null;
  accessToken: string | null;
  registerUser: (user: Partial<User>) => Promise<unknown>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  googleLogin: (credentialResponse: { credential: string }) => Promise<
    | {
        isNewUser: boolean;
        user: Partial<User>;
      }
    | undefined
  >;
  onboarding: (data: OnboardingData) => Promise<void>;
  isAuthenticated: () => boolean;
  UpdateActiveProfile?: (newProfile: Profile) => void;
  activeProfile?: Profile | null;
  updateUserPhoto?: (photoUrl: string) => Promise<User> | Error;
}

const initialAuthState: AuthContextState = {
  user: null,
  accessToken: null,
  registerUser: async () => {
    throw new Error('registerUser function must be used within AuthProvider');
  },
  login: async () => {
    throw new Error('login function must be used within AuthProvider');
  },
  logout: () => {
    throw new Error('logout function must be used within AuthProvider');
  },
  googleLogin: async () => {
    throw new Error('googleLogin function must be used within AuthProvider');
  },
  onboarding: async () => {
    throw new Error('onboarding function must be used within AuthProvider');
  },
  activeProfile: null,
  UpdateActiveProfile: () => {
    throw new Error('UpdateActiveProfile function must be used within AuthProvider');
  },
  isAuthenticated: () => false,
  updateUserPhoto: () => {
    throw new Error('updateUserPhoto function must be used within AuthProvider');
  },
};

export const AuthContext = createContext<AuthContextState>(initialAuthState);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  const registerUser = async (user: Partial<User>) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/new`,
        user,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        },
      );
      console.log('User registered successfully:', response.data);
      if (response.data.status === 'success') {
        console.log('Login successful:', response.data);
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
        const profile = response.data.user.profileIds[0];
        if (profile.type === 'user') {
          if (!profile.username || profile.username.trim() === '') {
            profile.username =
              response.data.user.firstName + ' ' + response.data.user.lastName || 'User';
          }
          if (!profile.image || profile.image.trim() === '') {
            profile.image = response.data.user.photo || '';
          }
        }

        setActiveProfile(profile);
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('activeProfile', JSON.stringify(response.data.user.profileIds[0]));
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Registration failed,Please try again');
      } else {
        throw new Error('Registration failed,Please try again');
      }
    }
  };
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/login`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        },
      );

      if (response.data.status === 'success') {
        console.log('Login successful:', response.data);
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
        const profile = response.data.user.profileIds[0];
        if (!profile.username || profile.username.trim() === '') {
          profile.username =
            response.data.user.firstName + ' ' + response.data.user.lastName || 'User';
        }
        if (!profile.image || profile.image.trim() === '') {
          profile.image = response.data.user.photo || '';
        }
        setActiveProfile(profile);
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('activeProfile', JSON.stringify(response.data.user.profileIds[0]));
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Login failed , Please try again');
      } else {
        throw new Error('Login failed , Please try again');
      }
    }
  };

  const logout = async () => {
    setUser(null);
    setAccessToken(null);
    setActiveProfile(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('activeProfile');
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/logout`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Logout failed');
      } else {
        throw new Error('Logout failed');
      }
    }
  };

  const googleLogin = async (credentialResponse: { credential: string }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/google`,
        {
          credential: credentialResponse.credential,
        },
        {
          withCredentials: true,
        },
      );
      console.log('Google auth response:', response.data);

      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      const profile = response.data.user.profileIds[0];
      if (!profile.username || profile.username.trim() === '') {
        profile.username =
          response.data.user.firstName + ' ' + response.data.user.lastName || 'User';
      }
      if (!profile.image || profile.image.trim() === '') {
        profile.image = response.data.user.photo || '';
      }
      setActiveProfile(profile);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('activeProfile', JSON.stringify(response.data.user.profileIds[0]));

      return {
        isNewUser: response.data.isNewUser || !response.data.user.isVerfied,
        user: response.data.user,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Google Login failed , Please try again');
      } else {
        throw new Error('Google Login failed , Please try again');
      }
    }
  };

  const onboarding = async (data: OnboardingData) => {
    try {
      await axios
        .post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/onboarding`,
          {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            gender: data.gender?.toLowerCase(),
            phone: data.phone,
            dob: data.dob,
            photo: data.photo,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        .then((res) => {
          console.log('Onboarding successful:', res.data);
          setUser(res.data.user);
          setAccessToken(res.data.accessToken);
          setActiveProfile(res.data.user.profileIds[0]);
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          localStorage.setItem('activeProfile', JSON.stringify(res.data.user.profileIds[0]));
          return res.data;
        });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error || 'Onboarding failed , Please try again later',
        );
      } else {
        throw new Error('Onboarding failed , Please try again later');
      }
    }
  };

  const updateUserPhoto = async (photoUrl: string) => {
    try {
      const user = localStorage.getItem('user');
      if (!user) {
        throw new Error('User not found in localStorage');
      }
      const parsedUser = JSON.parse(user);
      const res = await api.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user/edit/${parsedUser._id}`,
        {
          ...parsedUser,
          photo: photoUrl,
        },
      );
      console.log('User photo updated successfully:', res.data);
      if (res && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (localStorage.getItem('activeProfile')) {
          const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}');
          if (activeProfile && activeProfile.type === 'user') {
            activeProfile.image = photoUrl;
            setActiveProfile(activeProfile);
            localStorage.setItem('activeProfile', JSON.stringify(activeProfile));
          }
        }
      }
      return res.data.user;
    } catch (err) {
      console.error('Failed to update user photo:', err);
      return err;
    }
  };

  const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('accessToken');
  };

  const UpdateActiveProfile = (newProfile: Profile) => {
    if (!newProfile.username || newProfile.username.trim() === '') {
      newProfile.username =
        user && user.firstName && user.lastName ? user.firstName + ' ' + user.lastName : 'User';
    }
    if (!newProfile.image || newProfile.image.trim() === '') {
      newProfile.image = user && user.photo ? user.photo : '';
    }
    setActiveProfile(newProfile);
    localStorage.setItem('activeProfile', JSON.stringify(newProfile));
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    const storedActiveProfile = localStorage.getItem('activeProfile');

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
        logout();
      }
    }
    if (storedActiveProfile && storedActiveProfile !== 'undefined') {
      try {
        setActiveProfile(JSON.parse(storedActiveProfile));
      } catch (e) {
        console.error('Failed to parse activeProfile from localStorage', e);
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLogoutFunction(logout);
  }, []);

  const authContextValue: AuthContextState = {
    user,
    accessToken,
    registerUser,
    login,
    logout,
    googleLogin,
    onboarding,
    isAuthenticated,
    UpdateActiveProfile,
    activeProfile: activeProfile,
    updateUserPhoto,
  };

  if (loading) {
    return null;
  }

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
