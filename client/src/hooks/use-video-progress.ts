import { useRef, useEffect } from "react";

interface UseVideoProgressProps {
  videoId: number;
  initialTimestamp?: number;
  onProgressUpdate?: (timestamp: number) => void;
}

export function useVideoProgress({ videoId, initialTimestamp = 0, onProgressUpdate }: UseVideoProgressProps) {
  const lastSavedTimestamp = useRef(initialTimestamp);
  const saveTimerRef = useRef<NodeJS.Timeout>();

  // Save progress to the server
  const saveProgress = async (timestamp: number) => {
    try {
      // Only save if the timestamp changed significantly (>= 5 seconds difference)
      if (Math.abs(timestamp - lastSavedTimestamp.current) < 5) {
        return;
      }

      const response = await fetch(`/api/videos/${videoId}/progress`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ lastTimestamp: Math.floor(timestamp) }),
      });

      if (response.ok) {
        lastSavedTimestamp.current = Math.floor(timestamp);
        onProgressUpdate?.(Math.floor(timestamp));
      }
    } catch (error) {
      console.error("Failed to save video progress:", error);
    }
  };

  // Debounced save function
  const updateProgress = (timestamp: number) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveProgress(timestamp);
    }, 2000); // Wait 2 seconds of inactivity before saving
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return { updateProgress, saveProgress };
}
