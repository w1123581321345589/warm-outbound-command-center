import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertQCQueueItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useQCQueue(status?: string) {
  const queryKey = [api.qc.list.path, status];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = status 
        ? `${api.qc.list.path}?status=${status}` 
        : api.qc.list.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch QC queue");
      return api.qc.list.responses[200].parse(await res.json());
    },
  });
}

export function useReviewQCItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { id: number; status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED'; feedback?: string; reviewedById: string }) => {
      const { id, ...body } = data;
      const url = buildUrl(api.qc.review.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to review item");
      return api.qc.review.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.qc.list.path] });
      toast({ title: "Reviewed", description: "Item status updated" });
    },
  });
}
