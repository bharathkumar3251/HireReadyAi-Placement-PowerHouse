import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Briefcase, FileText, TrendingUp } from "lucide-react";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, resumes: 0, jobs: 0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [profilesRes, resumesRes, jobsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("resumes").select("id", { count: "exact", head: true }),
        supabase.from("job_listings").select("id", { count: "exact", head: true }).eq("recruiter_id", user.id),
      ]);
      setStats({
        students: profilesRes.count || 0,
        resumes: resumesRes.count || 0,
        jobs: jobsRes.count || 0,
      });
    };
    fetch();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.students}</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10"><FileText className="h-5 w-5 text-info" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.resumes}</p>
              <p className="text-sm text-muted-foreground">Resumes Available</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10"><Briefcase className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.jobs}</p>
              <p className="text-sm text-muted-foreground">My Job Listings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-foreground mb-2">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Use the sidebar to browse students, view resumes, and manage job listings.</p>
      </div>
    </div>
  );
}
