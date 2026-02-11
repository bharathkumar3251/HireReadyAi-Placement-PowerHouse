import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, User, Shield, Trash2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function AdminUsers() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);
    setProfiles(profilesRes.data || []);
    const roleMap: Record<string, string> = {};
    (rolesRes.data || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
    setRoles(roleMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
    if (error) {
      toast({ title: "Error updating role", description: error.message, variant: "destructive" });
    } else {
      setRoles(prev => ({ ...prev, [userId]: newRole }));
      toast({ title: `Role updated to ${newRole}` });
    }
  };

  const filtered = profiles.filter(p => {
    const matchSearch = !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || (roles[p.user_id] || "student") === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadgeColor = (role: string) => {
    if (role === "admin") return "bg-destructive/10 text-destructive";
    if (role === "recruiter") return "bg-info/10 text-info";
    return "bg-primary/10 text-primary";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-10 bg-secondary border-border text-foreground" />
          </div>
          <Select value={roleFilter} onValueChange={v => setRoleFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40 bg-secondary border-border text-foreground">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="recruiter">Recruiter</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Department</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const userRole = roles[p.user_id] || "student";
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">{p.full_name || "Unnamed"}</span>
                              {p.college && <p className="text-xs text-muted-foreground">{p.college}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{p.email}</td>
                        <td className="p-4 text-sm text-muted-foreground">{p.department || "N/A"}</td>
                        <td className="p-4">
                          <Select value={userRole} onValueChange={v => handleRoleChange(p.user_id, v)}>
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="recruiter">Recruiter</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${roleBadgeColor(userRole)}`}>
                            {userRole}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <p className="text-muted-foreground text-center py-10">No users found.</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
