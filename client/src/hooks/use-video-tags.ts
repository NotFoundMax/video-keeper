import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useVideoTags(videoId: number) {
  const queryClient = useQueryClient();

  const addTag = useMutation({
    mutationFn: async (tagId: number) => {
      await apiRequest("POST", `/api/videos/${videoId}/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      // Invalidate specific video query if it exists
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
    },
  });

  const removeTag = useMutation({
    mutationFn: async (tagId: number) => {
      await apiRequest("DELETE", `/api/videos/${videoId}/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
    },
  });

  return { addTag, removeTag };
}
