import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAnalyticsOverview } from "@/hooks/use-analytics";
import { useTasks } from "@/hooks/use-tasks";
import { 
  Users, 
  CheckCircle2, 
  FileCheck2, 
  TrendingUp, 
  Clock 
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: analytics, isLoading: statsLoading } = useAnalyticsOverview();
  const { data: tasks, isLoading: tasksLoading } = useTasks({ 
    assignedToId: user?.id, 
    status: 'PENDING',
    dueDate: new Date().toISOString() // naive check for "today/overdue"
  });

  const stats = [
    { 
      label: "Total Prospects", 
      value: Object.values(analytics?.prospectsByStage || {}).reduce((a, b) => a + b, 0),
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    { 
      label: "Tasks Due Today", 
      value: analytics?.tasksDueToday || 0,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    { 
      label: "Pending QC", 
      value: analytics?.qcPending || 0,
      icon: FileCheck2,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    { 
      label: "Reply Rate", 
      value: `${analytics?.replyRate || 0}%`,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.firstName}. Here's what's happening today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow border-slate-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tasks Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1 border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Your Tasks</CardTitle>
              <CardDescription>High priority items for today</CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />)}
                </div>
              ) : tasks && tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className={`mt-1 h-2 w-2 rounded-full ${
                        task.priority === 'URGENT' ? 'bg-red-500' : 
                        task.priority === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.description || "No description"}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {format(new Date(task.dueDate), 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-8 w-8 mb-3 opacity-20" />
                  <p>All caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Summary */}
          <Card className="col-span-1 border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Pipeline Health</CardTitle>
              <CardDescription>Prospects by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statsLoading ? (
                  <div className="h-48 bg-slate-100 rounded animate-pulse" />
                ) : (
                  Object.entries(analytics?.prospectsByStage || {}).map(([stage, count]) => (
                    <div key={stage} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 capitalize">
                          {stage.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary/80" 
                          style={{ width: `${Math.min((count / 20) * 100, 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
