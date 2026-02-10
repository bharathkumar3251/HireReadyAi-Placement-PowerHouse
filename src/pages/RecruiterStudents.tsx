import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";

export default function RecruiterStudents() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setProfiles(data || []));
  }, []);

  const filtered = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    (p.skills || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
    p.college?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, skill, or college..." className="pl-10 bg-secondary border-border text-foreground" />
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.map(p => (
            <div key={p.id} className="glass-card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{p.full_name || "Unnamed"}</p>
                <p className="text-sm text-muted-foreground">{p.college || "N/A"} • {p.department || "N/A"}</p>
                {p.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.skills.slice(0, 5).map((s: string) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{p.email}</p>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground text-center py-10">No students found.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
