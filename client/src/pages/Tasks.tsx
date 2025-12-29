import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useTasks, useCompleteTask } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export default function Tasks() {
  const [showCompleted, setShowCompleted] = useState(false);
  const { data: tasks, isLoading } = useTasks({ 
    status: showCompleted ? undefined : 'PENDING' 
  });
  const completeTask = useCompleteTask();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
            <p className="text-muted-foreground mt-1">Daily execution queue.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCompleted(!showCompleted)}
              className={showCompleted ? "bg-slate-100" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showCompleted ? "Hide Completed" : "Show All"}
            </Button>
            <Button>Create Task</Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>
          ) : tasks?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No tasks found. Nice work!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks?.map((task) => (
                <div 
                  key={task.id} 
                  className={`group flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${
                    task.status === 'COMPLETED' ? 'opacity-50' : ''
                  }`}
                >
                  <Checkbox 
                    checked={task.status === 'COMPLETED'}
                    onCheckedChange={() => {
                      if (task.status !== 'COMPLETED') {
                        completeTask.mutate(task.id);
                      }
                    }}
                    disabled={task.status === 'COMPLETED'}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium truncate ${task.status === 'COMPLETED' ? 'line-through' : ''}`}>
                        {task.title}
                      </span>
                      {task.priority === 'URGENT' && (
                        <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Urgent</Badge>
                      )}
                      <Badge variant="outline" className="h-5 text-[10px] px-1.5 bg-slate-50">
                        {task.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-500 truncate">{task.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                    </div>
                    {task.assignedToId && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                        VA
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
