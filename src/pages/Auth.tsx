import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, ArrowLeft, GraduationCap, Briefcase, Shield } from "lucide-react";

type AuthMode = "signin" | "signup";
type AppRole = "student" | "recruiter" | "admin";

const roleConfig: { role: AppRole; label: string; desc: string; icon: React.ElementType }[] = [
  { role: "student", label: "Student", desc: "Job seeker / Candidate", icon: GraduationCap },
  { role: "recruiter", label: "Recruiter", desc: "Hiring manager", icon: Briefcase },
  { role: "admin", label: "Admin", desc: "Placement cell", icon: Shield },
];

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        // After signIn, onAuthStateChange will update role. We navigate and let
        // Dashboard.tsx handle the role-based rendering.
        navigate("/dashboard");
      } else {
        await signUp(email, password, fullName, selectedRole);
        toast({
          title: "Account created!",
          description: `Welcome! You're registered as ${selectedRole}.`,
        });
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <div className="glass-card p-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-display font-bold text-foreground">HireReadyAI</span>
          </div>

          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {mode === "signin"
              ? "Sign in to your account"
              : "Get started with your placement prep"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="mt-1 bg-secondary border-border text-foreground"
                  />
                </div>

                <div>
                  <Label className="text-foreground mb-2 block">I am a</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleConfig.map(({ role, label, desc, icon: Icon }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all border-2 ${
                          selectedRole === role
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-semibold">{label}</span>
                        <span className="text-[10px] opacity-70 text-center leading-tight">{desc}</span>
                      </button>
                    ))}
                  </div>
                  {selectedRole !== "student" && (
                    <p className="text-xs text-warning mt-2 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {selectedRole === "admin" ? "Admin" : "Recruiter"} accounts have elevated access permissions.
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1 bg-secondary border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1 bg-secondary border-border text-foreground"
              />
            </div>

            <Button
              type="submit"
              className="w-full gradient-bg text-primary-foreground font-semibold"
              disabled={isLoading}
            >
              {isLoading
                ? mode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : mode === "signin"
                ? "Sign In"
                : `Sign Up as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary hover:underline font-medium"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
