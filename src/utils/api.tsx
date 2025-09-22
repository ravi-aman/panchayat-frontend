import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Type definitions
interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}

interface RefreshTokenResponse {
  status: string;
  message: string;
  accessToken: string;
  expiresIn?: string;
}

interface ErrorResponse {
  status: string;
  code: string;
  message: string;
  requiresLogin?: boolean;
  accountStatus?: string;
}

type LogoutFunction = () => void | Promise<void>;

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

let isRefreshing: boolean = false;
let failedQueue: QueueItem[] = [];

let logoutFunction: LogoutFunction | null = null;

// Function to set the logout function from AuthContext
export const setLogoutFunction = (logout: LogoutFunction): void => {
  logoutFunction = logout;
};

const processQueue = (error: AxiosError | null, token: string | null = null): void => {
  failedQueue.forEach((prom: QueueItem) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

const handleLogout = async (): Promise<void> => {
  if (logoutFunction) {
    await logoutFunction();
  } else {
    // Fallback if logout function is not set
    console.warn('Logout function not set, falling back to manual cleanup');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('activeProfile');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/auth/signin';
  }
};

// Add request interceptor to include token from localStorage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<AxiosResponse | AxiosError> => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err: AxiosError) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data }: AxiosResponse<RefreshTokenResponse> = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/refreshtoken`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem('accessToken', data.accessToken);
        if (api.defaults.headers.common) {
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        }

        processQueue(null, data.accessToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError: unknown) {
        const axiosError = refreshError as AxiosError<ErrorResponse>;
        processQueue(axiosError, null);
        isRefreshing = false;

        console.error('Refresh token failed:', axiosError);

        const refreshResponse = axiosError.response?.data;

        if (
          refreshResponse?.requiresLogin ||
          refreshResponse?.code === 'REFRESH_TOKEN_MISSING' ||
          refreshResponse?.code === 'REFRESH_TOKEN_EXPIRED' ||
          refreshResponse?.code === 'ACCOUNT_INACTIVE' ||
          refreshResponse?.code === 'TOKEN_MISMATCH' ||
          refreshResponse?.code === 'USER_NOT_FOUND'
        ) {
          console.log('Authentication required, redirecting to login');
          await handleLogout();
          return Promise.reject(axiosError);
        }

        // For other refresh errors, still logout but could show different message
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          await handleLogout();
          return Promise.reject(axiosError);
        }

        // For network errors or 500 errors, don't logout immediately
        return Promise.reject(axiosError);
      }
    }

    if (error.response?.status === 403) {
      const errorData = error.response.data as ErrorResponse;

      if (
        errorData?.code === 'ACCOUNT_INACTIVE' ||
        errorData?.message?.includes('Account is not active')
      ) {
        console.error('Account is suspended or inactive');

        await handleLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
