import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProspect, type Prospect } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useProspects(filters?: { teamId?: number; stage?: string; assignedToId?: string }) {
  const queryParams = filters ? new URLSearchParams(filters as any).toString() : "";
  const queryKey = [api.prospects.list.path, filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = `${api.prospects.list.path}?${queryParams}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch prospects");
      return api.prospects.list.responses[200].parse(await res.json());
    },
  });
}

export function useProspect(id: number) {
  return useQuery({
    queryKey: [api.prospects.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.prospects.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch prospect");
      return api.prospects.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateProspect() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertProspect) => {
      const res = await fetch(api.prospects.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create prospect");
      }
      return api.prospects.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.prospects.list.path] });
      toast({ title: "Success", description: "Prospect created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateProspect() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertProspect>) => {
      const url = buildUrl(api.prospects.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update prospect");
      }
      return api.prospects.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.prospects.list.path] });
      toast({ title: "Success", description: "Prospect updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteProspect() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.prospects.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete prospect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.prospects.list.path] });
      toast({ title: "Success", description: "Prospect deleted" });
    },
  });
}
