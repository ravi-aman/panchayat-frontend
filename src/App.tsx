import React, { useState, useEffect } from 'react';
import FullPageLoader from './components/common/FullPageLoader';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Startups from './pages/dashboardPages/startups/Startups.tsx';
import Dashboard from './pages/dashboardPages/Dashboard.tsx';
import DashboardLayout from './pages/layouts/DashboardLayout';
import CompanyRouter from './components/routing/CompanyRouter';
import UserProfile from './pages/dashboardPages/profiles/UserProfile.tsx';
import NotFound from './pages/NotFound';
import Funds from './pages/dashboardPages/funds/Funds.tsx';
import Msme from './pages/dashboardPages/msme/Msme.tsx';
import Signup from './pages/dashboardPages/auth/Signup.tsx';
import ChatInterface from './pages/dashboardPages/chat/ChatInterface.tsx';
import GovernmentPolicy from './pages/dashboardPages/policy/GovernmentPolicy.tsx';
import Reports from './pages/dashboardPages/knowledgeBase/Reports.tsx';
import Connections from './pages/dashboardPages/connections/Connections.tsx';
import KnowledgeBase from './pages/dashboardPages/knowledgeBase/KnowledgeBase.tsx';
import FundingUpdates from './pages/dashboardPages/funds/FundingUpdates.tsx';
import SignIn from './pages/dashboardPages/auth/SignIn.tsx';
import PasswordReset from './pages/dashboardPages/auth/PasswordReset.tsx';
import SetNewPassword from './pages/dashboardPages/auth/SetNewPassword.tsx';
import RegisterComplete from './pages/dashboardPages/auth/RegisterComplete.tsx';
import JobDetailsPage from './pages/dashboardPages/jobs/JobDetails.tsx';
import Jobs from './pages/dashboardPages/jobs/Jobs.tsx';
import PersonalSettings from './pages/settings/PersonalSettings.tsx';
import OnBoarding from './pages/dashboardPages/auth/onBoarding.tsx';
import RegisterMsme from './pages/dashboardPages/msme/RegisterMsme.tsx';
import ProtectedRoute from './utils/ProtectedRoutes.tsx';
import RegisterStartup from './pages/dashboardPages/startups/RegisterStartup.tsx';
import HeatmapPage from './pages/dashboardPages/heatmap/HeatmapPage.tsx';
import HeatmapAnalyticsPage from './pages/dashboardPages/heatmap/HeatmapAnalyticsPage.tsx';
// import { useAuth } from './contexts/AuthContext';
import TermsOfService from './pages/TermsOfService.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [hideLoader, setHideLoader] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHideLoader(true);
      setTimeout(() => setLoading(false), 100); // 500ms for fade-out
    }, 20); // You can adjust this duration as needed
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && (
        <div className={`loader-overlay${hideLoader ? ' fade-out' : ''}`}>
          <FullPageLoader />
        </div>
      )}
      <Router>
        <Routes>
          <Route
            index
            path="/"
            element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<ProtectedRoute authRoute={true} />}>
            <Route path="signup" element={<Signup />} />
            <Route path="signin" element={<SignIn />} />
            <Route path="password_reset" element={<PasswordReset />} />
            <Route path="password_reset/:token" element={<SetNewPassword />} />
            <Route path="register_complete" element={<RegisterComplete />} />
            <Route path="onboarding" element={<OnBoarding />} />
          </Route>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="feed" element={<Dashboard />} />
            <Route path="startups" element={<Startups />} />
            <Route path="startups/:slug" element={<CompanyRouter />} />
            <Route path="funds" element={<Funds />} />
            <Route path="funds/:id" element={<Funds />} />
            <Route path="msme" element={<Msme />} />
            <Route path="msme/:id" element={<CompanyRouter />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetailsPage />} />
            <Route path="government_policies" element={<GovernmentPolicy />} />
            <Route path="reports" element={<Reports />} />
            <Route path="chat" element={<ChatInterface />} />
            <Route path="chat/:chatId" element={<ChatInterface />} />
            <Route path="inbox" element={<ChatInterface />} />
            <Route path="connections" element={<Connections />} />
            <Route path="knowledge_base" element={<KnowledgeBase />} />
            <Route path="heatmap" element={<HeatmapPage />} />
            <Route path="heatmap/analytics" element={<HeatmapAnalyticsPage />} />
            <Route path="funding_updates" element={<FundingUpdates />} />
            <Route path="personal" element={<PersonalSettings />} />
          </Route>
          <Route
            path="/terms_of_service"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TermsOfService />} />
          </Route>
          <Route
            path="/privacy_policy"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PrivacyPolicy />} />
          </Route>

          <Route
            path="/user/:username"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserProfile />} />
          </Route>
          <Route
            path="/company/:username"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CompanyRouter />} />
          </Route>
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="personal" element={<PersonalSettings />} />
          </Route>
          <Route
            path="/msme/register"
            element={
              <ProtectedRoute>
                <RegisterMsme />
              </ProtectedRoute>
            }
          />
          <Route
            path="/startup"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="register" element={<RegisterStartup />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
