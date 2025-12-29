import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useTasks(filters?: { teamId?: number; assignedToId?: string; status?: string; dueDate?: string }) {
  const queryParams = filters ? new URLSearchParams(filters as any).toString() : "";
  const queryKey = [api.tasks.list.path, filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = `${api.tasks.list.path}?${queryParams}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTask) => {
      // Coerce date objects to strings if needed by schema, but typically JSON.stringify handles it as ISO
      const res = await fetch(api.tasks.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create task");
      return api.tasks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({ title: "Success", description: "Task created" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.complete.path, { id });
      const res = await fetch(url, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to complete task");
      return api.tasks.complete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({ title: "Completed", description: "Task marked as complete" });
    },
  });
}
