import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50/50">
        <div className="max-w-7xl mx-auto p-8 fade-in">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
