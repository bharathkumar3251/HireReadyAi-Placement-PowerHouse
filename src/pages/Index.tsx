import { Link } from "react-router-dom";
import { Zap, Mic, BarChart3, BookOpen, Users, FileText, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Mic, title: "AI Mock Interviews", desc: "Practice with voice-powered AI interviewers that adapt to your skills" },
  { icon: FileText, title: "Smart Resume Builder", desc: "Build and analyze resumes with AI-powered suggestions" },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Track your readiness with detailed performance insights" },
  { icon: BookOpen, title: "Adaptive Practice", desc: "Aptitude, coding, technical & HR question banks" },
  { icon: Users, title: "Recruiter Portal", desc: "End-to-end placement management for recruiters" },
  { icon: Sparkles, title: "AI Skill Assessment", desc: "Get scored and receive personalized improvement tips" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-display font-bold text-foreground">HireReadyAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-bg text-primary-foreground font-semibold">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8 animate-pulse-glow">
            <Sparkles className="h-4 w-4" />
            AI-Powered Placement Readiness
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-tight mb-6">
            Your Path to{" "}
            <span className="gradient-text">Interview</span>{" "}
            Success
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The intelligent platform that prepares students for placements with AI voice interviews, adaptive assessments, and real-time readiness analytics.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/auth">
              <Button size="lg" className="gradient-bg text-primary-foreground font-semibold text-base px-8 h-12">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted h-12 px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg">Comprehensive tools for students, recruiters, and placement officers</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-6 hover-lift group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="glass-card p-12 glow-border">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Ready to ace your placements?</h2>
            <p className="text-muted-foreground mb-8">Join thousands of students who prepared smarter with AI.</p>
            <Link to="/auth">
              <Button size="lg" className="gradient-bg text-primary-foreground font-semibold px-10 h-12">
                Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold">HireReadyAI</span>
          </div>
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
