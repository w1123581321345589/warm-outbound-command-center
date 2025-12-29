import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: [api.analytics.overview.path],
    queryFn: async () => {
      const res = await fetch(api.analytics.overview.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return api.analytics.overview.responses[200].parse(await res.json());
    },
  });
}
