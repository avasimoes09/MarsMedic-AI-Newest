// Defines app providers and routes for every screen.
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import { MissionProvider } from '@/lib/MissionContext';
import MarsLogin from '@/pages/MarsLogin';
import CrewSelection from '@/pages/CrewSelection';
import MissionShell from '@/components/MissionShell';
import Dashboard from '@/pages/Dashboard';
import DigitalTwin from '@/pages/DigitalTwin';
import SymptomAssessment from '@/pages/SymptomAssessment';
import SpaceMedicine from '@/pages/SpaceMedicine';
import Devices from '@/pages/Devices';
import Inventory from '@/pages/Inventory';
import TreatmentCoach from '@/pages/TreatmentCoach';
import EarthAlert from '@/pages/EarthAlert';
import CommanderView from '@/pages/CommanderView';
import VoiceAssessment from '@/pages/VoiceAssessment';
import Wellness from '@/pages/Wellness';

const AuthenticatedApp = () => (
  <Routes>
    <Route path="/login" element={<Navigate to="/" replace />} />
    <Route path="/register" element={<Navigate to="/" replace />} />
    <Route path="/forgot-password" element={<Navigate to="/" replace />} />
    <Route path="/reset-password" element={<Navigate to="/" replace />} />
    <Route path="/oauth/consent" element={<Navigate to="/" replace />} />
    <Route path="/" element={<MarsLogin />} />
    <Route path="/emergency" element={<SymptomAssessment emergency />} />
    <Route path="/crew" element={<CrewSelection />} />
    <Route element={<MissionShell />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/twin" element={<DigitalTwin />} />
      <Route path="/assessment" element={<SymptomAssessment />} />
      <Route path="/copilot" element={<Navigate to="/emergency" replace />} />
      <Route path="/space-medicine" element={<SpaceMedicine />} />
      <Route path="/devices" element={<Devices />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/treatment" element={<TreatmentCoach />} />
      <Route path="/earth-alert" element={<EarthAlert />} />
      <Route path="/commander" element={<CommanderView />} />
      <Route path="/voice" element={<VoiceAssessment />} />
      <Route path="/wellness" element={<Wellness />} />
    </Route>
    <Route path="*" element={<PageNotFound />} />
  </Routes>
);


function App() {

  return (
    <MissionProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </MissionProvider>
  )
}

export default App