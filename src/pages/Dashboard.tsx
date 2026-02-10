import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import RecruiterDashboard from "@/components/dashboards/RecruiterDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

export default function Dashboard() {
  const { role } = useAuth();

  return (
    <DashboardLayout>
      {role === "admin" && <AdminDashboard />}
      {role === "recruiter" && <RecruiterDashboard />}
      {(!role || role === "student") && <StudentDashboard />}
    </DashboardLayout>
  );
}
