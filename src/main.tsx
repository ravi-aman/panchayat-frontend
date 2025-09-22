import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from './contexts/toast/toast.tsx';
import { UnreadMessageProvider } from './contexts/UnreadMessageContext.tsx';
import { GlobalChatManager } from './components/GlobalChatManager.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <AuthProvider>
          <UnreadMessageProvider>
            <GlobalChatManager />
            <App />
          </UnreadMessageProvider>
        </AuthProvider>
      </ToastProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
