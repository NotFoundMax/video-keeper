import { useState, useRef, useEffect } from "react";
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
  MapPin,
  XCircle,
  Youtube
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ReactPlayer from "react-player";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFolders } from "@/hooks/use-folders";

const Player = ReactPlayer as any;

interface VideoCardProps {
  video: Video;
  onDelete: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Video>) => void;
}

export function VideoCard({ video, onDelete, onUpdate }: VideoCardProps) {
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [localTimestamp, setLocalTimestamp] = useState(video.lastTimestamp || 0);

  useEffect(() => {
    setLocalTimestamp(video.lastTimestamp || 0);
  }, [video.lastTimestamp]);

  const { data: folders } = useFolders();
  const playerRef = useRef<any>(null);

  // Helper to format URLs for best compatibility
  const getEmbedUrl = (url: string): { type: 'youtube' | 'youtube-shorts' | 'tiktok' | 'vimeo' | 'other'; id?: string; url?: string } => {
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

      return { type: 'other', url: cleanUrl };
    } catch (e) {
      return { type: 'other', url: url || "" };
    }
  };

  const videoInfo = getEmbedUrl(video.url);
  const isVertical = videoInfo.type === 'tiktok' || videoInfo.type === 'youtube-shorts' || video.platform.toLowerCase() === 'instagram';

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
    setIsClosing(false);
  };

  return (
    <>
      <div className={`group flex flex-col gap-3 ${isVertical ? "row-span-2" : "row-span-1"}`}>
        <Card
          className={`relative overflow-hidden bg-slate-200 border-none rounded-[2rem] shadow-sm ${isVertical ? "aspect-[9/16]" : "aspect-video"
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
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <Play className="w-12 h-12 text-slate-300" />
              </div>
            )}

            {/* Play Icon Overlay - Top Left */}
            <div className="absolute top-4 left-4 z-30">
              <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                {video.platform.toLowerCase() === 'youtube' ? (
                  <Youtube className="w-5 h-5 text-white fill-white" />
                ) : (
                  <Play className="w-4 h-4 text-white fill-white translate-x-0.5" />
                )}
              </div>
            </div>

            {/* Favorite Button - Top Right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(video.id, { isFavorite: !video.isFavorite });
              }}
              className="absolute top-4 right-4 z-30 p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10"
            >
              <Heart
                className={`w-4 h-4 transition-all duration-300 ${video.isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-white"}`}
              />
            </button>

            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent z-20" />

            {/* Tags Overlay - Bottom Left */}
            <div className="absolute bottom-4 left-4 z-30 flex flex-wrap gap-2">
              <Badge className="bg-white/20 backdrop-blur-md text-white border-none px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                #{video.category || "VIBE"}
              </Badge>
              {video.isFavorite && (
                <Badge className="bg-primary/80 backdrop-blur-md text-white border-none px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  #FAV
                </Badge>
              )}
            </div>

            {/* Inline Player Overlay */}
            {isPlayingInline && (
              <div className="absolute inset-0 z-40 bg-black flex items-center justify-center">
                <div className="w-full h-full relative">
                  {videoInfo.type === 'tiktok' ? (
                    <div className="w-full h-full relative z-10 overflow-hidden">
                      <div className="absolute inset-x-0 top-0 bottom-0 scale-[1.35] origin-center -translate-y-[5%]">
                        <iframe
                          src={`https://www.tiktok.com/embed/v2/${videoInfo.id}`}
                          className="w-full h-full border-0"
                          scrolling="no"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    </div>
                  ) : (videoInfo.type === 'youtube' || videoInfo.type === 'youtube-shorts') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&modestbranding=1&rel=0&start=${video.lastTimestamp || 0}&origin=${window.location.origin}`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
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
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="px-1 space-y-1">
          <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
            {video.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: es })}
            </span>
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-300 rounded-full"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-300 rounded-full"
                onClick={() => onDelete(video.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <h4 className="text-2xl font-bold tracking-tight text-slate-900">Editar Video</h4>
              <p className="text-sm text-slate-500">Actualiza los detalles de tu video guardado.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Título</label>
                <input
                  type="text"
                  className="w-full h-14 px-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base font-medium"
                  defaultValue={video.title}
                  autoFocus
                  id={`edit-title-${video.id}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Categoría</label>
                  <Select
                    defaultValue={video.category || "general"}
                    onValueChange={(val) => {
                      const input = document.getElementById(`edit-category-${video.id}`) as HTMLInputElement;
                      if (input) input.value = val;
                    }}
                  >
                    <SelectTrigger className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4">
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
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Carpeta</label>
                  <Select
                    defaultValue={video.folderId?.toString() || "none"}
                    onValueChange={(val) => {
                      const input = document.getElementById(`edit-folder-${video.id}`) as HTMLInputElement;
                      if (input) input.value = val;
                    }}
                  >
                    <SelectTrigger className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4">
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Punto inicio (s)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    className="flex-1 h-14 px-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base font-mono"
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
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 h-14 rounded-2xl font-bold text-slate-500"
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

                  if (title.trim()) {
                    onUpdate(video.id, { title: title.trim(), category, folderId, lastTimestamp });
                    setIsEditDialogOpen(false);
                  }
                }}
                className="flex-1 h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
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
