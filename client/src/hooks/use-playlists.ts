import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Playlist, CreatePlaylistRequest, UpdatePlaylistRequest } from "@shared/schema";

export function usePlaylists() {
  return useQuery<(Playlist & { tags: any[]; videoCount: number })[]>({
    queryKey: ["/api/playlists"],
  });
}

export function usePlaylist(id: number) {
  return useQuery<Playlist & { tags: any[]; videos: any[] }>({
    queryKey: [`/api/playlists/${id}`],
    enabled: !!id,
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlist: CreatePlaylistRequest) => {
      return await apiRequest("POST", "/api/playlists", playlist);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
  });
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdatePlaylistRequest) => {
      return await apiRequest("PATCH", `/api/playlists/${id}`, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${variables.id}`] });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/playlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
  });
}

export function usePlaylistTags(playlistId: number) {
  const queryClient = useQueryClient();

  const addTag = useMutation({
    mutationFn: async (tagId: number) => {
      await apiRequest("POST", `/api/playlists/${playlistId}/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}`] });
    },
  });

  const removeTag = useMutation({
    mutationFn: async (tagId: number) => {
      await apiRequest("DELETE", `/api/playlists/${playlistId}/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}`] });
    },
  });

  return { addTag, removeTag };
}

export function usePlaylistVideos(playlistId: number) {
  const queryClient = useQueryClient();

  const addVideo = useMutation({
    mutationFn: async ({ videoId, position }: { videoId: number; position: number }) => {
      await apiRequest("POST", `/api/playlists/${playlistId}/videos/${videoId}`, { position });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}`] });
    },
  });

  const removeVideo = useMutation({
    mutationFn: async (videoId: number) => {
      await apiRequest("DELETE", `/api/playlists/${playlistId}/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}`] });
    },
  });

  const reorderVideos = useMutation({
    mutationFn: async (videoIds: number[]) => {
      await apiRequest("POST", `/api/playlists/${playlistId}/reorder`, { videoIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}`] });
    },
  });

  const syncVideos = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/playlists/${playlistId}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
  });

  return { addVideo, removeVideo, reorderVideos, syncVideos };
}
