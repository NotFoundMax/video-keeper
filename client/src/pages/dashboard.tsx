import { useState } from "react";
import { useVideos, useDeleteVideo, useUpdateVideo } from "@/hooks/use-videos";
import { LayoutShell } from "@/components/layout-shell";
import { VideoCard } from "@/components/video-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Youtube, Music, Instagram, Video as VideoIcon, FilterX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  
  const { data: videos, isLoading } = useVideos({ search, platform });
  const { mutate: deleteVideo } = useDeleteVideo();
  const { mutate: updateVideo } = useUpdateVideo();

  const platformFilters = [
    { id: "all", label: "All", icon: VideoIcon },
    { id: "youtube", label: "YouTube", icon: Youtube },
    { id: "tiktok", label: "TikTok", icon: Music },
    { id: "instagram", label: "Instagram", icon: Instagram },
  ];

  return (
    <LayoutShell>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Collection</h1>
            <p className="text-muted-foreground">Manage and organize your favorite videos</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search videos..." 
              className="pl-9 bg-card/50 border-border focus:bg-card transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {platformFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={platform === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatform(filter.id)}
              className={`rounded-full px-4 gap-2 transition-all ${
                platform === filter.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90" 
                  : "bg-card border-border hover:bg-card/80"
              }`}
            >
              <filter.icon className="w-3.5 h-3.5" />
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>Loading your collection...</p>
            </div>
          ) : videos?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-6 text-center">
              <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center">
                <FilterX className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No videos found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Try adjusting your search or filters, or add your first video to get started!
                </p>
              </div>
              <Button asChild size="lg" className="rounded-xl px-8 shadow-lg shadow-primary/20">
                <a href="/add">Add Video</a>
              </Button>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {videos?.map((video) => (
                  <motion.div
                    key={video.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <VideoCard 
                      video={video} 
                      onDelete={(id) => deleteVideo(id)}
                      onToggleFavorite={(id, isFavorite) => updateVideo({ id, isFavorite })}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
