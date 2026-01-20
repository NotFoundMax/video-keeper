import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type Video, type Tag } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Heart,
  Play,
  Pencil,
  XCircle,
  Youtube,
  Plus,
  Tag as TagIcon,
  CheckCircle2,
  StickyNote,
  ListVideo,
  PlusSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ReactPlayer from "react-player";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useFolders } from "@/hooks/use-folders";
import { useVideoProgress } from "@/hooks/use-video-progress";
import { useTags } from "@/hooks/use-tags";
import { useVideoTags } from "@/hooks/use-video-tags";
import { usePlaylists, usePlaylistVideos } from "@/hooks/use-playlists";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const Player = ReactPlayer as any;

interface VideoWithTags extends Video {
  tags?: Tag[];
}

interface VideoCardProps {
  video: VideoWithTags;
  onDelete: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Video>) => void;
}

export function VideoCard({ video, onDelete, onUpdate }: VideoCardProps) {
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [localTimestamp, setLocalTimestamp] = useState(video.lastTimestamp || 0);

  const queryClient = useQueryClient();
  const { data: playlists } = usePlaylists();
  const { toast } = useToast();
  const [localNotes, setLocalNotes] = useState(video.notes || "");

  useEffect(() => {
    setLocalTimestamp(video.lastTimestamp || 0);
  }, [video.lastTimestamp]);

  const { data: folders } = useFolders();
  const { data: allTags } = useTags();
  const { addTag, removeTag } = useVideoTags(video.id);
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
  const getEmbedUrl = (url: string): { type: 'youtube' | 'youtube-shorts' | 'tiktok' | 'vimeo' | 'facebook' | 'instagram' | 'pinterest' | 'twitch' | 'other'; id?: string; url?: string } => {
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
        } else if (urlObj.pathname.includes("/v/")) {
          videoId = urlObj.pathname.split("/v/")[1];
        } else if (urlObj.pathname.includes("/embed/")) {
          videoId = urlObj.pathname.split("/embed/")[1];
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

      // Pinterest
      if (urlObj.hostname.includes("pinterest.com") || urlObj.hostname.includes("pin.it")) {
        // Pinterest IDs are at the end of the path /pin/123/ or just 123
        const matches = urlObj.pathname.match(/\/pin\/(\d+)/) || urlObj.pathname.match(/\/(\d+)\/?$/);
        const id = matches ? matches[1] : null;
        if (id) return { type: 'pinterest', id, url: cleanUrl };
      }

      // Twitch
      if (urlObj.hostname.includes("twitch.tv")) {
        if (urlObj.pathname.includes("/videos/")) {
          const id = urlObj.pathname.split("/videos/")[1]?.split("/")[0];
          if (id) return { type: 'twitch', id, url: cleanUrl };
        } else if (urlObj.pathname.includes("/clip/")) {
          const id = urlObj.pathname.split("/clip/")[1]?.split("/")[0];
          if (id) return { type: 'twitch', id, url: cleanUrl }; // Adjust if clips need different handling
        } else {
          // Channel
          const id = urlObj.pathname.split("/")[1];
          if (id) return { type: 'twitch', id, url: cleanUrl };
        }
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
          className={`relative overflow-hidden bg-muted border-none rounded-[2.5rem] shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 ${isVertical ? "aspect-[9/16] ring-4 ring-primary/5" :
            isSquare ? "aspect-square ring-4 ring-primary/5" :
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
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Play className="w-12 h-12 text-muted-foreground/30" />
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

            {/* Playlist Button - Top Right (left of Heart) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaylistDialogOpen(true);
              }}
              className="absolute top-5 right-16 z-30 p-3 rounded-full backdrop-blur-md border border-white/10 bg-black/20 text-white hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100"
              title="Añadir a playlist"
            >
              <ListVideo className="w-5 h-5" />
            </button>

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

            {/* Tags Overlay - Bottom Left */}
            <div className="absolute bottom-5 left-5 z-30 flex gap-1.5 flex-wrap max-w-[80%]">
              {video.tags?.slice(0, 3).map(tag => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: `${tag.color}44` || '#3b82f644' }}
                  className="backdrop-blur-md text-white border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
                >
                  #{tag.name}
                </Badge>
              ))}
              {video.tags && video.tags.length > 3 && (
                <Badge className="bg-black/40 backdrop-blur-md text-white border-none px-3 py-1 rounded-lg text-[9px] font-black">
                  +{video.tags.length - 3}
                </Badge>
              )}
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
                        src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&modestbranding=1&rel=0&start=${video.lastTimestamp || 0}&enablejsapi=1${isVertical ? '&controls=0' : ''}`}
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
                  ) : videoInfo.type === 'pinterest' ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <iframe
                        src={`https://assets.pinterest.com/ext/embed.html?id=${videoInfo.id}`}
                        className="w-full h-full border-0"
                        allow="autoplay"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-black">
                      <Player
                        url={video.url}
                        width="100%"
                        height="100%"
                        playing={true}
                        controls={true}
                        muted={false}
                        volume={1}
                        ref={playerRef}
                        onProgress={({ playedSeconds }: any) => {
                          if (playedSeconds > 0) {
                            updateProgress(playedSeconds);
                          }
                        }}
                        onPause={() => {
                          if (playerRef.current) {
                            saveProgress(playerRef.current.getCurrentTime());
                          }
                        }}
                        onEnded={() => {
                          if (playerRef.current) {
                            saveProgress(playerRef.current.getCurrentTime());
                          }
                        }}
                        config={{
                          youtube: {
                            playerVars: { start: video.lastTimestamp || 0, autoplay: 1 }
                          },
                          twitch: {
                            options: {
                              parent: [window.location.hostname],
                              autoplay: true,
                              muted: false
                            }
                          },
                          file: {
                            attributes: {
                              style: { width: '100%', height: '100%', objectFit: 'contain' }
                            }
                          }
                        }}
                      />
                    </div>
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
            <h3 className="font-black text-foreground text-lg leading-tight line-clamp-2 flex-1">
              {video.title}
            </h3>
            <div className="flex gap-2 shrink-0 pt-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full transition-colors relative ${video.notes
                  ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                  }`}
                onClick={() => setIsNotesDialogOpen(true)}
                title={video.notes ? "Ver/Editar notas" : "Añadir notas"}
              >
                <StickyNote className="w-4 h-4" />
                {video.notes && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                onClick={() => onDelete(video.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Metadata: Author & Duration */}
          {(video.authorName || (video.duration && video.duration > 0)) && (
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground -mt-1">
              {video.authorName && (
                <span className="truncate max-w-[150px]">{video.authorName}</span>
              )}
              {video.authorName && video.duration && <span>•</span>}
              {video.duration && video.duration > 0 && (
                <span>{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}</span>
              )}
            </div>
          )}

          {/* Tags List */}
          <div className="w-full">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <div className="flex w-max space-x-2">
                {video.tags?.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-[10px] font-black px-2 py-0.5 rounded-md border-0"
                    style={{ backgroundColor: (tag.color || '#3b82f6') + '15', color: tag.color || '#3b82f6' }}
                  >
                    #{tag.name.toUpperCase()}
                  </Badge>
                ))}
                <button
                  onClick={() => setIsTagDialogOpen(true)}
                  className="h-5 px-2 rounded-md bg-secondary text-muted-foreground flex items-center gap-1 text-[10px] font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  TAGS
                </button>
              </div>
              <ScrollBar orientation="horizontal" className="h-1.5 opacity-0 hover:opacity-100" />
            </ScrollArea>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {video.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: es })}
            </span>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <h4 className="text-2xl font-black tracking-tight text-foreground">Editar Video</h4>
              <p className="text-sm text-muted-foreground font-bold">Actualiza los detalles de tu video guardado.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Título</label>
                <input
                  type="text"
                  className="w-full h-14 px-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base font-bold text-foreground"
                  defaultValue={video.title}
                  autoFocus
                  id={`edit-title-${video.id}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Carpeta</label>
                  <Select
                    defaultValue={video.folderId?.toString() || "none"}
                    onValueChange={(val) => {
                      const input = document.getElementById(`edit-folder-${video.id}`) as HTMLInputElement;
                      if (input) input.value = val;
                    }}
                  >
                    <SelectTrigger className="w-full h-14 bg-muted border-none rounded-2xl px-4 font-bold text-foreground">
                      <SelectValue placeholder="Carpeta" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border border-border shadow-xl">
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
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Duración (segundos)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full h-14 px-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base font-mono font-bold text-foreground"
                  defaultValue={video.duration || 0}
                  id={`edit-duration-${video.id}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Punto inicio (s)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    className="flex-1 h-14 px-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-base font-mono font-bold text-foreground"
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
                  <SelectTrigger className="w-full h-14 bg-muted border-none rounded-2xl px-4 font-black text-foreground">
                    <SelectValue placeholder="Automático" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-border shadow-xl">
                    <SelectItem value="auto">Automático (Detección)</SelectItem>
                    <SelectItem value="horizontal">Horizontal (16:9)</SelectItem>
                    <SelectItem value="vertical">Vertical (9:16)</SelectItem>
                    <SelectItem value="square">Cuadrado (1:1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Etiquetas
                </label>
                <span className="text-xs text-muted-foreground">
                  {video.tags?.length || 0} seleccionadas
                </span>
              </div>

              {allTags && allTags.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-muted max-h-48 overflow-y-auto">
                  {allTags.map((tag: any) => {
                    const isSelected = video.tags?.some((t: any) => t.id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            removeTag.mutate(tag.id);
                          } else {
                            addTag.mutate(tag.id);
                          }
                        }}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${isSelected
                          ? 'text-white shadow-md scale-105'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:scale-105 border-2 border-slate-200 dark:border-slate-700'
                          }`}
                        style={
                          isSelected
                            ? {
                              backgroundColor: tag.color || '#3b82f6',
                              borderColor: tag.color || '#3b82f6',
                            }
                            : {}
                        }
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center">
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    No hay etiquetas disponibles. Crea una en la página de Carpetas.
                  </p>
                </div>
              )}
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
                  const folderInput = document.getElementById(`edit-folder-${video.id}`) as HTMLInputElement;

                  const title = titleInput.value;
                  const folderId = folderInput.value === "none" ? null : parseInt(folderInput.value);
                  const durationInput = document.getElementById(`edit-duration-${video.id}`) as HTMLInputElement;
                  const duration = parseInt(durationInput.value) || 0;
                  const lastTimestamp = localTimestamp;
                  const aspectRatio = localAspectRatio;

                  if (title.trim()) {
                    onUpdate(video.id, { title: title.trim(), folderId, duration, lastTimestamp, aspectRatio });
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

      {/* Tag Management Dialog */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 bg-white border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 text-center">
              Gestionar Etiquetas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Etiquetas Disponibles</label>
              <ScrollArea className="h-40 w-full rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  {allTags?.map(tag => {
                    const isSelected = video.tags?.some(t => t.id === tag.id);
                    return (
                      <Badge
                        key={tag.id}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer transition-all font-bold ${isSelected ? 'shadow-md' : 'hover:bg-slate-200 border-slate-200'}`}
                        style={isSelected ? { backgroundColor: tag.color || '#3b82f6', color: 'white' } : { borderColor: (tag.color || '#3b82f6') + '40', color: tag.color || '#64748b' }}
                        onClick={() => {
                          if (isSelected) {
                            removeTag.mutate(tag.id);
                          } else {
                            addTag.mutate(tag.id);
                          }
                        }}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        #{tag.name}
                      </Badge>
                    );
                  })}
                  {!allTags?.length && (
                    <p className="text-slate-400 text-sm font-medium italic w-full text-center py-8">
                      No hay etiquetas creadas aún.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <Button onClick={() => setIsTagDialogOpen(false)} className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 mt-2">
            Listo
          </Button>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[2rem] p-8 bg-white dark:bg-slate-900 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <StickyNote className="w-6 h-6 text-amber-500" />
              Notas del Video
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">{video.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {video.authorName && `Por ${video.authorName} • `}
                {video.platform.toUpperCase()}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Tus Notas
              </label>
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="Escribe tus notas aquí... Puedes usar Markdown para formato."
                className="w-full h-64 px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none font-mono text-sm transition-all"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                💡 Tip: Puedes usar **negrita**, *cursiva*, `código`, y más con Markdown
              </p>
            </div>

            {localNotes && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Vista Previa
                </label>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {localNotes}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setLocalNotes(video.notes || "");
                setIsNotesDialogOpen(false);
              }}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onUpdate(video.id, { notes: localNotes || null });
                setIsNotesDialogOpen(false);
              }}
              className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              Guardar Notas
            </Button>
          </div>
        </DialogContent>
        {/* Add to Playlist Dialog */}
        <Dialog open={isPlaylistDialogOpen} onOpenChange={setIsPlaylistDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 bg-white dark:bg-slate-900 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <ListVideo className="w-6 h-6 text-primary" />
                Añadir a Playlist
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
              {playlists && playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={async () => {
                      try {
                        await apiRequest("POST", `/api/playlists/${playlist.id}/videos/${video.id}`, { position: playlist.videoCount });

                        // Invalidate queries to make it reactive
                        queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
                        queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlist.id}`] });

                        toast({
                          title: "✅ Añadido",
                          description: `Video añadido a "${playlist.name}"`,
                        });
                        setIsPlaylistDialogOpen(false);
                      } catch (err) {
                        toast({
                          title: "Error",
                          description: "No se pudo añadir el video a la playlist o ya existe",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-all group border-2 border-transparent hover:border-primary/20"
                  >
                    <div className="flex flex-col items-start px-1">
                      <span className="font-black text-sm tracking-tight">{playlist.name}</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                        {playlist.videoCount} videos
                      </span>
                    </div>
                    <PlusSquare className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <ListVideo className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-6">No tienes playlists creadas</p>
                  <Button
                    className="rounded-xl font-bold h-10 px-6 shadow-lg shadow-primary/20"
                    onClick={() => {
                      setIsPlaylistDialogOpen(false);
                      // En una implementación real, esto podría abrir el diálogo de crear playlist globalmente
                    }}
                  >
                    Ir a Playlists
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </Dialog>
    </>
  );
}
