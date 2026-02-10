import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mic, FileText, BarChart3 } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, interviews: 0, resumes: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [profilesRes, interviewsRes, resumesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("interview_sessions").select("id", { count: "exact", head: true }),
        supabase.from("resumes").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        users: profilesRes.count || 0,
        interviews: interviewsRes.count || 0,
        resumes: resumesRes.count || 0,
      });
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.users}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10"><Mic className="h-5 w-5 text-info" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.interviews}</p>
              <p className="text-sm text-muted-foreground">Total Interviews</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10"><FileText className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.resumes}</p>
              <p className="text-sm text-muted-foreground">Total Resumes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-foreground mb-2">Platform Management</h3>
        <p className="text-sm text-muted-foreground">Use the sidebar to manage users, view analytics, and configure platform settings.</p>
      </div>
    </div>
  );
}
