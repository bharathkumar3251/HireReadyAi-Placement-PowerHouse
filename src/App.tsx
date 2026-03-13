import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PlacementCertificate from "./pages/PlacementCertificate";
import MockInterview from "./pages/MockInterview";
import Practice from "./pages/Practice";
import Profile from "./pages/Profile";
import RecruiterStudents from "./pages/RecruiterStudents";
import RecruiterJobs from "./pages/RecruiterJobs";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import CodingChallenge from "./pages/CodingChallenge";
import AptitudeTest from "./pages/AptitudeTest";
import ResumeGenerator from "./pages/ResumeGenerator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthRedirect><Auth /></AuthRedirect>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/placement-certificate" element={<ProtectedRoute allowedRoles={["student"]}><PlacementCertificate /></ProtectedRoute>} />
            <Route path="/mock-interview" element={<ProtectedRoute allowedRoles={["student"]}><MockInterview /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute allowedRoles={["student"]}><Practice /></ProtectedRoute>} />
            <Route path="/coding" element={<ProtectedRoute allowedRoles={["student"]}><CodingChallenge /></ProtectedRoute>} />
            <Route path="/aptitude" element={<ProtectedRoute allowedRoles={["student"]}><AptitudeTest /></ProtectedRoute>} />
            <Route path="/resume-generator" element={<ProtectedRoute allowedRoles={["student"]}><ResumeGenerator /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/recruiter/students" element={<ProtectedRoute allowedRoles={["recruiter", "admin"]}><RecruiterStudents /></ProtectedRoute>} />
            <Route path="/recruiter/jobs" element={<ProtectedRoute allowedRoles={["recruiter"]}><RecruiterJobs /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
