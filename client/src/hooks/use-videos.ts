import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateVideoRequest, type UpdateVideoRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ============================================
// HOOKS
// ============================================

export function useVideos(filters?: { search?: string; platform?: string }) {
  const queryKey = [api.videos.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Manually construct query string since apiRequest helper is generic
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.platform && filters.platform !== "all") params.append("platform", filters.platform);
      
      const url = `${api.videos.list.path}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch videos");
      
      return api.videos.list.responses[200].parse(await res.json());
    },
  });
}

export function useVideo(id: number) {
  return useQuery({
    queryKey: [api.videos.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.videos.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch video");
      
      return api.videos.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateVideoRequest) => {
      const validated = api.videos.create.input.parse(data);
      const res = await fetch(api.videos.create.path, {
        method: api.videos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.videos.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to create video");
      }
      return api.videos.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.videos.list.path] });
      toast({ title: "Success", description: "Video added to your collection" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add video", 
        variant: "destructive" 
      });
    },
  });
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateVideoRequest) => {
      const validated = api.videos.update.input.parse(updates);
      const url = buildUrl(api.videos.update.path, { id });
      
      const res = await fetch(url, {
        method: api.videos.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error("Video not found");
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to update video");
      }
      return api.videos.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.videos.list.path] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update video", 
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.videos.delete.path, { id });
      const res = await fetch(url, { 
        method: api.videos.delete.method, 
        credentials: "include" 
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Video not found");
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to delete video");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.videos.list.path] });
      toast({ title: "Deleted", description: "Video removed from collection" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete video", 
        variant: "destructive" 
      });
    },
  });
}
