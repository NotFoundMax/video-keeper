// Export/Import utilities for Video Keeper collections

export interface ExportData {
  version: string;
  exportDate: string;
  folders: any[];
  tags: any[];
  videos: any[];
  videoTags: any[];
  folderTags: any[];
}

export async function exportCollection(): Promise<string> {
  try {
    // Fetch all data
    const [foldersRes, tagsRes, videosRes] = await Promise.all([
      fetch("/api/folders", { credentials: "include" }),
      fetch("/api/tags", { credentials: "include" }),
      fetch("/api/videos", { credentials: "include" }),
    ]);

    const folders = await foldersRes.json();
    const tags = await tagsRes.json();
    const videos = await videosRes.json();

    // Extract video-tag relationships
    const videoTags = videos.flatMap((video: any) =>
      (video.tags || []).map((tag: any) => ({
        videoId: video.id,
        tagId: tag.id,
      }))
    );

    // Extract folder-tag relationships
    const folderTags = folders.flatMap((folder: any) =>
      (folder.tags || []).map((tag: any) => ({
        folderId: folder.id,
        tagId: tag.id,
      }))
    );

    const exportData: ExportData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      folders,
      tags,
      videos,
      videoTags,
      folderTags,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error("Export error:", error);
    throw new Error("Failed to export collection");
  }
}

export function downloadJSON(jsonString: string, filename: string) {
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importCollection(jsonString: string): Promise<{
  success: boolean;
  message: string;
  stats?: {
    folders: number;
    tags: number;
    videos: number;
  };
}> {
  try {
    const data: ExportData = JSON.parse(jsonString);

    // Validate format
    if (!data.version || !data.videos || !data.tags) {
      throw new Error("Invalid export file format");
    }

    // Import tags first (they don't have dependencies)
    const tagMap = new Map<number, number>(); // old ID -> new ID
    for (const tag of data.tags) {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: tag.name,
          color: tag.color,
        }),
      });
      if (res.ok) {
        const newTag = await res.json();
        tagMap.set(tag.id, newTag.id);
      }
    }

    // Import folders
    const folderMap = new Map<number, number>(); // old ID -> new ID
    for (const folder of data.folders || []) {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: folder.name,
          coverUrl: folder.coverUrl,
        }),
      });
      if (res.ok) {
        const newFolder = await res.json();
        folderMap.set(folder.id, newFolder.id);

        // Add folder tags
        const folderTagsForThis = (data.folderTags || []).filter(
          (ft: any) => ft.folderId === folder.id
        );
        for (const ft of folderTagsForThis) {
          const newTagId = tagMap.get(ft.tagId);
          if (newTagId) {
            await fetch(`/api/folders/${newFolder.id}/tags/${newTagId}`, {
              method: "POST",
              credentials: "include",
            });
          }
        }
      }
    }

    // Import videos
    let importedVideos = 0;
    for (const video of data.videos) {
      const newFolderId = video.folderId ? folderMap.get(video.folderId) : null;
      
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          url: video.url,
          title: video.title,
          platform: video.platform,
          thumbnailUrl: video.thumbnailUrl,
          authorName: video.authorName,
          duration: video.duration,
          folderId: newFolderId,
          aspectRatio: video.aspectRatio,
          notes: video.notes,
        }),
      });

      if (res.ok) {
        const newVideo = await res.json();
        importedVideos++;

        // Add video tags
        const videoTagsForThis = (data.videoTags || []).filter(
          (vt: any) => vt.videoId === video.id
        );
        for (const vt of videoTagsForThis) {
          const newTagId = tagMap.get(vt.tagId);
          if (newTagId) {
            await fetch(`/api/videos/${newVideo.id}/tags/${newTagId}`, {
              method: "POST",
              credentials: "include",
            });
          }
        }
      }
    }

    return {
      success: true,
      message: "Collection imported successfully",
      stats: {
        folders: folderMap.size,
        tags: tagMap.size,
        videos: importedVideos,
      },
    };
  } catch (error: any) {
    console.error("Import error:", error);
    return {
      success: false,
      message: error.message || "Failed to import collection",
    };
  }
}
