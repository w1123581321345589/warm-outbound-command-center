import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-600/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-600/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 max-w-3xl text-center space-y-8">
        <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-sm font-medium text-slate-400 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          The Warm Outbound Playbook
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Warm Outbound<br />Command Center
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Orchestrate high-touch prospecting campaigns. Identify intent, warm up prospects, and convert with video.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <Button 
            size="lg" 
            className="h-12 px-8 text-base bg-white text-slate-950 hover:bg-slate-200 font-semibold shadow-xl shadow-white/5"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-12 px-8 text-base border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white"
          >
            Read the Playbook
          </Button>
        </div>
      </div>
    </div>
  );
}
