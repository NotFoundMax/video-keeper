import { useState, useRef, useEffect } from "react";
import { type Video } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Heart,
  Play,
  Pencil,
  XCircle,
  Youtube
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ReactPlayer from "react-player";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFolders } from "@/hooks/use-folders";
import { useVideoProgress } from "@/hooks/use-video-progress";

const Player = ReactPlayer as any;

interface VideoCardProps {
  video: Video;
  onDelete: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Video>) => void;
}

export function VideoCard({ video, onDelete, onUpdate }: VideoCardProps) {
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [localTimestamp, setLocalTimestamp] = useState(video.lastTimestamp || 0);

  useEffect(() => {
    setLocalTimestamp(video.lastTimestamp || 0);
  }, [video.lastTimestamp]);

  const { data: folders } = useFolders();
  const playerRef = useRef<any>(null);

  // Auto-save video progress
  const { updateProgress, saveProgress } = useVideoProgress({
    videoId: video.id,
    initialTimestamp: video.lastTimestamp || 0,
    onProgressUpdate: (timestamp) => {
      setLocalTimestamp(timestamp);
    }
  });

  // Helper to format URLs for best compatibility
  const getEmbedUrl = (url: string): { type: 'youtube' | 'youtube-shorts' | 'tiktok' | 'vimeo' | 'facebook' | 'instagram' | 'other'; id?: string; url?: string } => {
    try {
      let cleanUrl = (url || "").trim();
      if (!cleanUrl) return { type: 'other', url: '' };

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

      // TikTok
      if (urlObj.hostname.includes("tiktok.com")) {
        const matches = urlObj.pathname.match(/\/video\/(\d+)/) || urlObj.pathname.match(/\/(\d+)$/);
        const id = matches ? matches[1] : null;

        if (id) return { type: 'tiktok', id, url: cleanUrl };
        return { type: 'other', url: cleanUrl };
      }

      // Vimeo
      if (urlObj.hostname.includes("vimeo.com")) {
        const parts = urlObj.pathname.split('/');
        const id = parts.find(p => /^\d+$/.test(p));
        if (id) return { type: 'vimeo', id, url: cleanUrl };
      }

      // Facebook
      if (urlObj.hostname.includes("facebook.com") || urlObj.hostname.includes("fb.watch")) {
        return { type: 'facebook', url: cleanUrl };
      }

      // Instagram
      if (urlObj.hostname.includes("instagram.com")) {
        return { type: 'instagram', url: cleanUrl };
      }

      return { type: 'other', url: cleanUrl };
    } catch (e) {
      return { type: 'other', url: url || "" };
    }
  };

  const videoInfo = getEmbedUrl(video.url);

  // Determine effective aspect ratio
  const effectiveAspectRatio = video.aspectRatio && video.aspectRatio !== 'auto'
    ? video.aspectRatio
    : (
      videoInfo.type === 'tiktok' ||
      videoInfo.type === 'youtube-shorts' ||
      videoInfo.type === 'instagram' ||
      (videoInfo.type === 'facebook' && (
        video.url.includes('/reel/') ||
        video.url.includes('/reels/') ||
        video.url.includes('/share/r/') ||
        video.url.includes('fb.watch')
      )) ||
      video.platform.toLowerCase() === 'tiktok' ||
      video.platform.toLowerCase() === 'instagram'
    ) ? 'vertical' : 'horizontal';

  const isVertical = effectiveAspectRatio === 'vertical';
  const isSquare = effectiveAspectRatio === 'square';

  const [localAspectRatio, setLocalAspectRatio] = useState(video.aspectRatio || 'auto');

  useEffect(() => {
    setLocalAspectRatio(video.aspectRatio || 'auto');
  }, [video.aspectRatio]);

  const handleCloseInline = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      try {
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime > 0) {
          setLocalTimestamp(Math.floor(currentTime));
        }
      } catch (err) { }
    }
    setIsPlayingInline(false);
  };

  // Progress calculation (mock for now, but UI ready)
  const progress = 20; // Example progress

  return (
    <>
      <div className="group flex flex-col gap-4">
        <Card
          className={`relative overflow-hidden bg-slate-200 border-none rounded-[2.5rem] shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 ${isVertical ? "aspect-[9/16] ring-4 ring-slate-900/5" :
            isSquare ? "aspect-square ring-4 ring-slate-900/5" :
              "aspect-video"
            }`}
        >
          <div
            className="w-full h-full cursor-pointer relative group/thumb overflow-hidden"
            onClick={() => setIsPlayingInline(true)}
          >
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <Play className="w-12 h-12 text-slate-300" />
              </div>
            )}

            {/* Progress Indicator - Top Left */}
            <div className="absolute top-5 left-5 z-30">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/20"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 * (1 - progress / 100)}
                    className="text-primary"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-white">{progress}%</span>
              </div>
            </div>

            {/* Favorite Button - Top Right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(video.id, { isFavorite: !video.isFavorite });
              }}
              className={`absolute top-5 right-5 z-30 p-3 rounded-full backdrop-blur-md border border-white/10 transition-all ${video.isFavorite ? "bg-red-500/80 text-white" : "bg-black/20 text-white hover:bg-black/40"
                }`}
            >
              <Heart
                className={`w-5 h-5 transition-all duration-300 ${video.isFavorite ? "fill-white" : ""}`}
              />
            </button>

            {/* Tag Overlay - Bottom Left */}
            <div className="absolute bottom-5 left-5 z-30">
              <Badge className="bg-black/40 backdrop-blur-md text-white border-none px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                #{video.category || "GENERAL"}
              </Badge>
            </div>

            {/* Inline Player Overlay */}
            {isPlayingInline && (
              <div className="absolute inset-0 z-40 bg-black flex items-center justify-center">
                <div className="w-full h-full relative">
                  {videoInfo.type === 'tiktok' ? (
                    <div className="w-full h-full relative z-10 overflow-hidden bg-black">
                      <div className="absolute inset-0 scale-[1.01] origin-center">
                        <iframe
                          src={`https://www.tiktok.com/player/v1/${videoInfo.id}?&music_info=1&description=1&autoplay=1`}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    </div>
                  ) : (videoInfo.type === 'youtube' || videoInfo.type === 'youtube-shorts') ? (
                    <div className="w-full h-full bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&modestbranding=1&rel=0&start=${video.lastTimestamp || 0}&origin=${window.location.origin}${isVertical ? '&controls=0' : ''}`}
                        className={`w-full h-full border-0 ${isVertical ? 'scale-[1.01]' : ''}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : videoInfo.type === 'facebook' ? (
                    <div className="w-full h-full bg-black">
                      <iframe
                        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.url)}&show_text=0&autoplay=1`}
                        className="w-full h-full border-0"
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <iframe
                      src={`https://player.vimeo.com/video/${videoInfo.id}?autoplay=1&badge=0&autopause=0&player_id=0&app_id=58479#t=${video.lastTimestamp || 0}s`}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                  <button
                    onClick={handleCloseInline}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-md"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="px-2 space-y-2">
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-black text-slate-900 text-lg leading-tight line-clamp-2 flex-1">
              {video.title}
            </h3>
            <div className="flex gap-2 shrink-0 pt-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                onClick={() => onDelete(video.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: es })}
            </span>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <h4 className="text-2xl font-black tracking-tight text-slate-900">Editar Video</h4>
              <p className="text-sm text-slate-400 font-bold">Actualiza los detalles de tu video guardado.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Título</label>
                <input
                  type="text"
                  className="w-full h-14 px-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base font-bold"
                  defaultValue={video.title}
                  autoFocus
                  id={`edit-title-${video.id}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Categoría</label>
                  <Select
                    defaultValue={video.category || "general"}
                    onValueChange={(val) => {
                      const input = document.getElementById(`edit-category-${video.id}`) as HTMLInputElement;
                      if (input) input.value = val;
                    }}
                  >
                    <SelectTrigger className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-bold">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="music">Música</SelectItem>
                      <SelectItem value="education">Educación</SelectItem>
                      <SelectItem value="entertainment">Entretenimiento</SelectItem>
                      <SelectItem value="tutorials">Tutoriales</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" id={`edit-category-${video.id}`} defaultValue={video.category || "general"} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Carpeta</label>
                  <Select
                    defaultValue={video.folderId?.toString() || "none"}
                    onValueChange={(val) => {
                      const input = document.getElementById(`edit-folder-${video.id}`) as HTMLInputElement;
                      if (input) input.value = val;
                    }}
                  >
                    <SelectTrigger className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-bold">
                      <SelectValue placeholder="Carpeta" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      <SelectItem value="none">Sin carpeta</SelectItem>
                      {folders?.map((f: any) => (
                        <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" id={`edit-folder-${video.id}`} defaultValue={video.folderId?.toString() || "none"} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Punto inicio (s)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    className="flex-1 h-14 px-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base font-mono font-bold"
                    value={localTimestamp}
                    onChange={(e) => setLocalTimestamp(parseInt(e.target.value) || 0)}
                    id={`edit-timestamp-${video.id}`}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-2xl border-slate-100 hover:bg-destructive/5 hover:text-destructive transition-colors"
                    title="Borrar punto de inicio"
                    onClick={() => setLocalTimestamp(0)}
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Formato de Pantalla</label>
                <Select
                  value={localAspectRatio}
                  onValueChange={setLocalAspectRatio}
                >
                  <SelectTrigger className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-black">
                    <SelectValue placeholder="Automático" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="auto">Automático (Detección)</SelectItem>
                    <SelectItem value="horizontal">Horizontal (16:9)</SelectItem>
                    <SelectItem value="vertical">Vertical (9:16)</SelectItem>
                    <SelectItem value="square">Cuadrado (1:1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 h-14 rounded-2xl font-black text-slate-400"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const titleInput = document.getElementById(`edit-title-${video.id}`) as HTMLInputElement;
                  const categoryInput = document.getElementById(`edit-category-${video.id}`) as HTMLInputElement;
                  const folderInput = document.getElementById(`edit-folder-${video.id}`) as HTMLInputElement;

                  const title = titleInput.value;
                  const category = categoryInput.value;
                  const folderId = folderInput.value === "none" ? null : parseInt(folderInput.value);
                  const lastTimestamp = localTimestamp;
                  const aspectRatio = localAspectRatio;

                  if (title.trim()) {
                    onUpdate(video.id, { title: title.trim(), category, folderId, lastTimestamp, aspectRatio });
                    setIsEditDialogOpen(false);
                  }
                }}
                className="flex-1 h-14 rounded-2xl font-black shadow-2xl shadow-primary/30"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
