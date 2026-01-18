import { useState, useRef } from "react";
import { type Video } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  ExternalLink, 
  Heart,
  Play,
  AlertCircle,
  Pencil,
  MapPin
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReactPlayer from "react-player";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Player = ReactPlayer as any;

interface VideoCardProps {
  video: Video;
  onDelete: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Video>) => void;
}

export function VideoCard({ video, onDelete, onUpdate }: VideoCardProps) {
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  // Helper to format URLs for best compatibility
  const getEmbedUrl = (url: string): { type: 'youtube' | 'youtube-shorts' | 'tiktok' | 'vimeo' | 'other'; id?: string; url?: string } => {
    try {
      let cleanUrl = (url || "").trim();
      if (!cleanUrl) return { type: 'other', url: '' };
      
      // Manejar enlaces cortos de TikTok (vm.tiktok.com) o móviles
      if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
      const urlObj = new URL(cleanUrl);
      
      // YouTube
      if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
        let videoId = "";
        let isShort = false;

        if (urlObj.hostname.includes("youtu.be")) {
          videoId = urlObj.pathname.slice(1);
        } else if (urlObj.pathname.includes("/shorts/")) {
          videoId = urlObj.pathname.split("/shorts/")[1];
          isShort = true;
        } else {
          videoId = urlObj.searchParams.get("v") || "";
        }

        if (videoId) {
          return { 
            type: isShort ? 'youtube-shorts' : 'youtube', 
            id: videoId.split('&')[0],
            url: cleanUrl
          };
        }
      }

      // TikTok (Mejorado para detectar IDs en cualquier parte de la ruta)
      if (urlObj.hostname.includes("tiktok.com")) {
        const matches = urlObj.pathname.match(/\/video\/(\d+)/) || urlObj.pathname.match(/\/(\d+)$/);
        const id = matches ? matches[1] : null;
        
        // Solo marcar como tipo 'tiktok' si tenemos el ID necesario para el iframe especial
        if (id) return { type: 'tiktok', id, url: cleanUrl };
        
        // Si es un link de tiktok pero no tiene ID claro (ej. links cortos),
        // dejamos que pase como 'other' para que ReactPlayer intente cargarlo.
        return { type: 'other', url: cleanUrl };
      }

      // Vimeo
      if (urlObj.hostname.includes("vimeo.com")) {
        // Vimeo IDs usually are the last part of path, e.g. vimeo.com/123456
        const parts = urlObj.pathname.split('/');
        // Filter out empty parts and find the first numeric part
        const id = parts.find(p => /^\d+$/.test(p));
        if (id) return { type: 'vimeo', id, url: cleanUrl };
      }

      return { type: 'other', url: cleanUrl };
    } catch (e) {
      return { type: 'other', url: url || "" };
    }
  };

  const videoInfo = getEmbedUrl(video.url);

  const playerRef = useRef<any>(null);
  // Remove progress state as we will request time directly
  
  const handleCloseInline = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingInline(false);
    setTimeout(() => {
      setIsReady(false);
    }, 50);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setIsReady(false);
          setIsPlayingInline(false);
        }
      }}>
        <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 rounded-2xl flex flex-col h-full">
          {/* Main Container - Dynamic Aspect Ratio for Puzzle Effect */}
          {/* Main Container - Dynamic Aspect Ratio for Puzzle Effect */}
          <div className={`relative bg-black overflow-hidden bg-zinc-950 transition-all duration-700 ease-in-out shadow-inner ${
            videoInfo.type === 'tiktok' || videoInfo.type === 'youtube-shorts' ? 'aspect-[9/16]' : 'aspect-video'
          }`}>
            {isPlayingInline ? (
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                {videoInfo.type === 'tiktok' ? (
                  <div className="w-full h-full relative z-10 overflow-hidden bg-black">
                    <div className="absolute inset-x-0 top-0 bottom-0 scale-[1.35] origin-center -translate-y-[5%]">
                      <iframe
                        src={`https://www.tiktok.com/embed/v2/${videoInfo.id}`}
                        className="w-full h-full border-0 pointer-events-auto"
                        scrolling="no"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        onLoad={() => setIsReady(true)}
                      />
                    </div>
                  </div>
                ) : (videoInfo.type === 'youtube' || videoInfo.type === 'youtube-shorts') ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&modestbranding=1&rel=0&start=${video.lastTimestamp || 0}`}
                    className="w-full h-full border-0 z-10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsReady(true)}
                  />
                ) : videoInfo.type === 'vimeo' ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${videoInfo.id}?autoplay=1&badge=0&autopause=0&player_id=0&app_id=58479#t=${video.lastTimestamp || 0}s`}
                    className="w-full h-full border-0 z-10"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                    allowFullScreen
                    title={video.title}
                    onLoad={() => setIsReady(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white p-8 space-y-4">
                    <AlertCircle className="w-12 h-12 text-muted-foreground" />
                    <p className="text-sm">Plataforma no soportada para reproducción directa.</p>
                    <Button asChild variant="outline" size="sm">
                      <a href={video.url} target="_blank" rel="noopener noreferrer">Ver en {video.platform}</a>
                    </Button>
                  </div>
                )}

                {!isReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-30">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-2xl" />
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="w-full h-full cursor-pointer relative group/thumb overflow-hidden" 
                onClick={() => {
                  setIsReady(false);
                  setIsPlayingInline(true);
                }}
              >
                {/* Thumbnail Image */}
                {video.thumbnailUrl ? (
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover/thumb:scale-110 opacity-90 group-hover/thumb:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white/10">
                    <Play className="w-20 h-20 fill-current" />
                  </div>
                )}
                
                {/* Play Button Overlay - Premium Design */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-all duration-500 backdrop-blur-[3px] z-20">
                  <div className="p-6 rounded-full bg-primary/95 text-white shadow-[0_0_50px_rgba(var(--primary),0.5)] transform scale-50 group-hover/thumb:scale-110 transition-all duration-500 ease-out">
                    <Play className="w-12 h-12 fill-white translate-x-1" />
                  </div>
                </div>

                {/* Overlays inside the frame (Badges & Favorite) */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30">
                  <div className="flex flex-col gap-2">
                    <Badge className={`capitalize border shadow-xl backdrop-blur-md ${getPlatformBadge(video.platform)}`}>
                      {video.platform}
                    </Badge>
                    
                    {(videoInfo.type === 'tiktok' || videoInfo.type === 'youtube-shorts') && (
                      <Badge className="bg-black/50 backdrop-blur-xl border-white/20 text-[10px] py-1 px-3 rounded-full flex gap-1.5 items-center w-fit shadow-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Vertical Video
                      </Badge>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate(video.id, { isFavorite: !video.isFavorite });
                    }}
                    className="p-2.5 rounded-xl bg-black/40 backdrop-blur-xl hover:bg-black/60 transition-all border border-white/10 shadow-lg text-white group/fav"
                  >
                    <Heart 
                      className={`w-4 h-4 transition-all duration-300 ${video.isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-white group-hover/fav:text-red-400"}`} 
                    />
                  </button>
                </div>

                {/* External/Fullscreen Link */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReady(false);
                    setIsOpen(true);
                  }}
                  className="absolute bottom-4 right-4 p-2.5 rounded-xl bg-black/60 backdrop-blur-md hover:bg-primary text-white transition-all shadow-xl border border-white/10 opacity-0 group-hover/thumb:opacity-100 translate-y-2 group-hover/thumb:translate-y-0 z-30"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-semibold text-sm sm:text-base line-clamp-2 leading-tight mb-3 group-hover:text-primary transition-colors min-h-[2.5rem]">
              {video.title}
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-auto pt-3 border-t border-border/40">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-[10px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-border/50 capitalize whitespace-nowrap">
                  {video.category || "General"}
                </span>
                
                {isPlayingInline && (
                  <div className="flex items-center gap-1.5 ml-1 border-l border-border/50 pl-2">
                    <Button 
                      onClick={handleCloseInline}
                      variant="ghost" 
                      className="h-7 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 uppercase font-bold tracking-wider"
                    >
                      Dejar de ver
                    </Button>

                    {videoInfo.type !== 'tiktok' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary active:scale-95 transition-all relative group/marker"
                        title="Toque: Guardar | Manten: Restaurar"
                        onPointerDown={(e) => {
                          const btn = e.currentTarget;
                          btn.dataset.isLong = "false";
                          const timer = setTimeout(() => {
                            btn.dataset.isLong = "true";
                            if (playerRef.current && video.lastTimestamp && video.lastTimestamp > 0) {
                              try {
                                playerRef.current.seekTo(video.lastTimestamp);
                                btn.classList.add('text-blue-500', 'bg-blue-500/10');
                                setTimeout(() => btn.classList.remove('text-blue-500', 'bg-blue-500/10'), 800);
                              } catch(err) { console.error("Restore failed", err); }
                            }
                          }, 600);
                          (btn as any)._lpTimer = timer;
                        }}
                        onPointerUp={(e) => {
                          const btn = e.currentTarget;
                          if ((btn as any)._lpTimer) {
                            clearTimeout((btn as any)._lpTimer);
                            (btn as any)._lpTimer = null;
                          }
                          
                          if (btn.dataset.isLong === "false") {
                            // Short Click: Save Current Time
                            if (playerRef.current) {
                              try {
                                const time = playerRef.current.getCurrentTime();
                                if (time > 0) {
                                  onUpdate(video.id, { lastTimestamp: Math.floor(time) });
                                  btn.classList.add('text-green-500', 'bg-green-500/10');
                                  setTimeout(() => btn.classList.remove('text-green-500', 'bg-green-500/10'), 800);
                                }
                              } catch(err) { console.error("Save failed", err); }
                            }
                          }
                        }}
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">
                  {video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                </span>
                
                <div className="flex items-center gap-1">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
                    <div className="p-6 space-y-5">
                      <div className="space-y-1">
                        <h4 className="text-xl font-bold tracking-tight">Editar Video</h4>
                        <p className="text-xs text-muted-foreground">Actualiza los detalles de tu video guardado.</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título</label>
                          <input
                            type="text"
                            className="w-full p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                            defaultValue={video.title}
                            autoFocus
                            id={`edit-title-${video.id}`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoría</label>
                            <Select 
                              defaultValue={video.category || "general"}
                              onValueChange={(val) => {
                                const input = document.getElementById(`edit-category-${video.id}`) as HTMLInputElement;
                                if (input) input.value = val;
                              }}
                            >
                              <SelectTrigger className="w-full bg-background border-border rounded-xl">
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="music">Music</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="entertainment">Entertainment</SelectItem>
                                <SelectItem value="tutorials">Tutorials</SelectItem>
                                <SelectItem value="fitness">Fitness</SelectItem>
                              </SelectContent>
                            </Select>
                            <input type="hidden" id={`edit-category-${video.id}`} defaultValue={video.category || "general"} />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Punto inicio (s)</label>
                            <input
                              type="number"
                              min="0"
                              className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-mono"
                              defaultValue={video.lastTimestamp || 0}
                              id={`edit-timestamp-${video.id}`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsEditDialogOpen(false)}
                          className="rounded-xl px-4"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={() => {
                            const titleInput = document.getElementById(`edit-title-${video.id}`) as HTMLInputElement;
                            const categoryInput = document.getElementById(`edit-category-${video.id}`) as HTMLInputElement;
                            const timestampInput = document.getElementById(`edit-timestamp-${video.id}`) as HTMLInputElement;
                            
                            const title = titleInput.value;
                            const category = categoryInput.value;
                            const lastTimestamp = parseInt(timestampInput.value) || 0;

                            if (title.trim()) {
                              onUpdate(video.id, { title: title.trim(), category, lastTimestamp });
                              setIsEditDialogOpen(false);
                            }
                          }}
                          className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
                        >
                          Guardar Cambios
                        </Button>
                      </div>
                    </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(video.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Video Player Modal (Full Screen View) */}
        <DialogContent className="max-w-5xl p-0 bg-black border-none overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
          <div className="relative w-full aspect-video bg-zinc-950 group">
            {videoInfo.type === 'tiktok' ? (
              <div className="w-full h-full relative z-10 overflow-hidden bg-black">
                <div className="absolute inset-x-0 top-0 bottom-0 scale-[1.35] origin-center -translate-y-[5%]">
                  <iframe
                    src={`https://www.tiktok.com/embed/v2/${videoInfo.id}`}
                    className="w-full h-full border-0 pointer-events-auto"
                    scrolling="no"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    onLoad={() => setIsReady(true)}
                  />
                </div>
              </div>
            ) : (videoInfo.type === 'youtube' || videoInfo.type === 'youtube-shorts') ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&modestbranding=1&rel=0&start=${video.lastTimestamp || 0}`}
                className="w-full h-full border-0 z-10"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsReady(true)}
              />
            ) : videoInfo.type === 'vimeo' ? (
              <iframe
                src={`https://player.vimeo.com/video/${videoInfo.id}?autoplay=1&badge=0&autopause=0&player_id=0&app_id=58479#t=${video.lastTimestamp || 0}s`}
                className="w-full h-full border-0 z-10"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                allowFullScreen
                title={video.title}
                onLoad={() => setIsReady(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white p-8 space-y-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground" />
                <p>No se pudo cargar el reproductor directo.</p>
                <Button asChild variant="outline">
                  <a href={video.url} target="_blank" rel="noopener noreferrer">Ver en {video.platform}</a>
                </Button>
              </div>
            )}
            
            <div className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="secondary" asChild className="rounded-full bg-black/50 backdrop-blur hover:bg-black/70">
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Original
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
