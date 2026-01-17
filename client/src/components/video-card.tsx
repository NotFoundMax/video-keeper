import { useState } from "react";
import { type Video } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  ExternalLink, 
  Heart,
  Play
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReactPlayer from "react-player";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface VideoCardProps {
  video: Video;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number, isFavorite: boolean) => void;
}

export function VideoCard({ video, onDelete, onToggleFavorite }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Platform styling
  const getPlatformBadge = (platform: string) => {
    const styles: Record<string, string> = {
      youtube: "bg-red-500/20 text-red-400 border-red-500/30",
      tiktok: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      instagram: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      vimeo: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };
    return styles[platform.toLowerCase()] || styles.other;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 rounded-2xl flex flex-col h-full">
          {/* Thumbnail / Video Area */}
          <div className="relative aspect-video bg-black/50 overflow-hidden cursor-pointer" onClick={() => setIsOpen(true)}>
            {video.thumbnailUrl ? (
              <img 
                src={video.thumbnailUrl} 
                alt={video.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <Play className="w-12 h-12 text-white/30" />
              </div>
            )}
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
              <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>

            {/* Platform Badge */}
            <Badge className={`absolute top-3 left-3 capitalize border ${getPlatformBadge(video.platform)}`}>
              {video.platform}
            </Badge>

            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(video.id, !video.isFavorite);
              }}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors"
            >
              <Heart 
                className={`w-4 h-4 transition-colors ${video.isFavorite ? "fill-red-500 text-red-500" : "text-white"}`} 
              />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
              {video.title}
            </h3>
            
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-xs text-muted-foreground font-medium">
                {video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
              </span>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <a href={video.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(video.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Video Player Modal */}
        <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden rounded-2xl aspect-video">
          <div className="w-full h-full">
            <ReactPlayer
              url={video.url}
              width="100%"
              height="100%"
              controls
              playing={isOpen}
              config={{
                youtube: {
                  playerVars: { showinfo: 1 }
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
