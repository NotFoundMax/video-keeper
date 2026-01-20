import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useVideos, useDeleteVideo, useUpdateVideo } from "@/hooks/use-videos";
import { useFolders } from "@/hooks/use-folders";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Play,
  ListPlus,
  Trash2,
  Pencil,
  MoreVertical,
  Calendar,
  ExternalLink,
  ChevronRight,
  FolderOpen
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { getEmbedUrl } from "@/components/video-player-native";
import { usePlaylists } from "@/hooks/use-playlists";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VideoPlayerNative } from "@/components/video-player-native";

export default function FolderDetail() {
  const [, params] = useRoute("/folders/:id");
  const [, setLocation] = useLocation();
  const folderId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();

  const { data: allFolders } = useFolders();
  const folder = allFolders?.find((f: any) => f.id === folderId);

  const { data: videos, isLoading } = useVideos({ folderId: folderId || undefined });
  const { mutate: deleteVideo } = useDeleteVideo();
  const { mutate: updateVideo } = useUpdateVideo();
  const { data: playlists } = usePlaylists();

  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Cargando carpeta...</p>
        </div>
      </LayoutShell>
    );
  }

  const handlePlay = (video: any) => {
    setSelectedVideo(video);
    setIsPlaying(true);
  };

  const handleAddToPlaylist = async (playlistId: number, videoId: number) => {
    try {
      await apiRequest("POST", `/api/playlists/${playlistId}/videos/${videoId}`);
      toast({
        title: "¡Añadido!",
        description: "El video se ha agregado a tu playlist.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo añadir el video a la playlist.",
        variant: "destructive",
      });
    }
  };

  return (
    <LayoutShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-32">
        {/* Header Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12 hover:bg-muted"
            onClick={() => setLocation("/folders")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground font-bold">
            <span className="hover:text-foreground cursor-pointer" onClick={() => setLocation("/folders")}>Carpetas</span>
            <ChevronRight className="w-4 h-4 opacity-30" />
            <span className="text-foreground">{folder?.name || "Sin Nombre"}</span>
          </div>
        </div>

        {/* Folder Header Banner */}
        <div className="relative h-48 md:h-64 rounded-[3rem] overflow-hidden group shadow-2xl">
          {folder?.coverUrl ? (
            <img src={folder.coverUrl} className="w-full h-full object-cover" alt={folder.name} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <FolderOpen className="w-20 h-20 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{folder?.name}</h1>
            <p className="text-white/70 font-bold uppercase tracking-widest text-sm mt-2">
              {videos?.length || 0} videos guardados • Creado el {folder?.createdAt ? format(new Date(folder.createdAt), "dd MMM yyyy", { locale: es }) : "N/A"}
            </p>
          </div>
        </div>

        {/* Video List - YouTube Style */}
        <div className="space-y-4">
          <AnimatePresence>
            {videos?.map((video: any, index: number) => {
              const videoInfo = getEmbedUrl(video.url);
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex flex-col md:flex-row gap-6 p-4 rounded-[2rem] hover:bg-muted/50 transition-all border border-transparent hover:border-border/40"
                >
                  {/* Thumbnail Container */}
                  <div
                    className="relative w-full md:w-72 aspect-video rounded-2xl overflow-hidden cursor-pointer shrink-0 shadow-sm group-hover:shadow-md transition-shadow"
                    onClick={() => handlePlay(video)}
                  >
                    <img src={video.thumbnailUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>
                    </div>
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black text-white">
                        {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                      </div>
                    )}
                  </div>

                  {/* Metadata Container */}
                  <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <h3
                          className="text-xl font-black leading-tight text-foreground line-clamp-2 cursor-pointer hover:text-primary transition-colors shrink"
                          onClick={() => handlePlay(video)}
                        >
                          {video.title}
                        </h3>

                        <div className="flex items-center gap-1 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary">
                                <ListPlus className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border bg-card shadow-2xl">
                              <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40 mb-1">Añadir a Playlist</p>
                              {playlists?.map((p: any) => (
                                <DropdownMenuItem
                                  key={p.id}
                                  className="rounded-xl font-bold gap-2 cursor-pointer"
                                  onClick={() => handleAddToPlaylist(p.id, video.id)}
                                >
                                  {p.name}
                                </DropdownMenuItem>
                              ))}
                              {playlists?.length === 0 && (
                                <p className="px-3 py-4 text-center text-xs text-muted-foreground font-medium italic">No tienes listas creadas</p>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                <MoreVertical className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-border shadow-2xl">
                              <DropdownMenuItem
                                className="rounded-xl font-bold gap-2 cursor-pointer"
                                onClick={() => {
                                  const newTitle = prompt("Nuevo título:", video.title);
                                  if (newTitle) updateVideo({ id: video.id, title: newTitle });
                                }}
                              >
                                <Pencil className="w-4 h-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="rounded-xl font-bold text-destructive gap-2 cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => {
                                  if (confirm("¿Eliminar video de esta carpeta?")) deleteVideo(video.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground/80">
                        {video.authorName && <span className="truncate max-w-[150px]">{video.authorName}</span>}
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Vinculado el {format(new Date(video.createdAt), "dd/MM/yyyy", { locale: es })}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {video.tags?.map((tag: any) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="bg-primary/5 text-primary border-none font-bold text-[10px] px-3 py-1 rounded-lg"
                          >
                            #{tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <Button
                        size="sm"
                        className="rounded-full px-6 font-black gap-2 shadow-lg shadow-primary/20"
                        onClick={() => handlePlay(video)}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Reproducir
                      </Button>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                        title="Ver en plataforma original"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {videos?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground/30" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">Carpeta vacía</h3>
                <p className="text-muted-foreground font-medium max-w-xs mx-auto text-sm mt-1">
                  Añade videos a esta carpeta para verlos aquí.
                </p>
              </div>
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="rounded-2xl px-8 h-14 font-bold border-2"
              >
                Volver al Inicio
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none rounded-[2.5rem] aspect-video">
          {selectedVideo && (
            <VideoPlayerNative
              video={selectedVideo}
              isActive={isPlaying}
              autoPlay={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </LayoutShell>
  );
}
