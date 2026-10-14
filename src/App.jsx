import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import OAuthConsent from '@/pages/OAuthConsent';
import { MissionProvider } from '@/lib/MissionContext';
import MarsLogin from '@/pages/MarsLogin';
import CrewSelection from '@/pages/CrewSelection';
import MissionShell from '@/components/MissionShell';
import Dashboard from '@/pages/Dashboard';
import DigitalTwin from '@/pages/DigitalTwin';
import BodyMap from '@/pages/BodyMap';
import SymptomAssessment from '@/pages/SymptomAssessment';
import MedicalCopilot from '@/pages/MedicalCopilot';
import SpaceMedicine from '@/pages/SpaceMedicine';
import Devices from '@/pages/Devices';
import Inventory from '@/pages/Inventory';
import TreatmentCoach from '@/pages/TreatmentCoach';
import EarthAlert from '@/pages/EarthAlert';
import CommanderView from '@/pages/CommanderView';
import VoiceAssessment from '@/pages/VoiceAssessment';
import Wellness from '@/pages/Wellness';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<MarsLogin />} />
        <Route path="/crew" element={<CrewSelection />} />
        <Route element={<MissionShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/twin" element={<DigitalTwin />} />
          <Route path="/body" element={<BodyMap />} />
          <Route path="/assessment" element={<SymptomAssessment />} />
          <Route path="/copilot" element={<MedicalCopilot />} />
          <Route path="/space-medicine" element={<SpaceMedicine />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/treatment" element={<TreatmentCoach />} />
          <Route path="/earth-alert" element={<EarthAlert />} />
          <Route path="/commander" element={<CommanderView />} />
          <Route path="/voice" element={<VoiceAssessment />} />
          <Route path="/wellness" element={<Wellness />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <MissionProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </MissionProvider>
    </AuthProvider>
  )
}

export default App