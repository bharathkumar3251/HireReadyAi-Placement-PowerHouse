import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "", email: "", phone: "", college: "", department: "", graduation_year: "", skills: "", bio: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            full_name: data.full_name || "",
            email: data.email || "",
            phone: data.phone || "",
            college: data.college || "",
            department: data.department || "",
            graduation_year: data.graduation_year?.toString() || "",
            skills: (data.skills || []).join(", "),
            bio: data.bio || "",
          });
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      phone: profile.phone,
      college: profile.college,
      department: profile.department,
      graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
      skills: profile.skills.split(",").map(s => s.trim()).filter(Boolean),
      bio: profile.bio,
    }).eq("user_id", user.id);

    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-xl font-display font-bold text-foreground">Your Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-foreground">Full Name</Label><Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
            <div><Label className="text-foreground">Email</Label><Input value={profile.email} disabled className="mt-1 bg-secondary border-border text-muted-foreground" /></div>
            <div><Label className="text-foreground">Phone</Label><Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
            <div><Label className="text-foreground">College</Label><Input value={profile.college} onChange={e => setProfile(p => ({ ...p, college: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
            <div><Label className="text-foreground">Department</Label><Input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
            <div><Label className="text-foreground">Graduation Year</Label><Input value={profile.graduation_year} onChange={e => setProfile(p => ({ ...p, graduation_year: e.target.value }))} type="number" className="mt-1 bg-secondary border-border text-foreground" /></div>
          </div>
          <div><Label className="text-foreground">Skills (comma-separated)</Label><Input value={profile.skills} onChange={e => setProfile(p => ({ ...p, skills: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
          <div><Label className="text-foreground">Bio</Label><Textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} className="mt-1 bg-secondary border-border text-foreground" /></div>
          <Button onClick={handleSave} disabled={saving} className="gradient-bg text-primary-foreground">
            <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
