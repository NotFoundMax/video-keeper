import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { Play, Pause, SkipForward, SkipBack, List, X, Shuffle, Repeat, ChevronLeft, Loader2, Trash2, ListVideo, CheckCircle2, GripVertical } from "lucide-react";
import { usePlaylist, usePlaylistVideos } from "@/hooks/use-playlists";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import ReactPlayer from "react-player";
import { motion, AnimatePresence } from "framer-motion";
import { VideoPlayerNative, getEmbedUrl } from "@/components/video-player-native";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const Player = ReactPlayer as any;

// Move helper functions OUTSIDE the component to avoid any confusion and re-definitions

// Specialized Feed Item Component
function PlaylistFeedItem({
  video,
  isActive,
  shouldRender,
  onEnded,
  onSelect,
  isLast
}: {
  video: any;
  isActive: boolean;
  shouldRender: boolean;
  onEnded: () => void;
  onSelect: () => void;
  isLast: boolean;
}) {
  const playerRef = useRef<any>(null);
  const videoInfo = useMemo(() => getEmbedUrl(video.url), [video.url]);
  const [hasError, setHasError] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  // Determine aspect ratio for the card look
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
      ))
    ) ? 'vertical' : 'horizontal';

  const isVertical = effectiveAspectRatio === 'vertical';
  const isSquare = effectiveAspectRatio === 'square';

  // Reset state on change and monitor playback
  useEffect(() => {
    if (isActive) {
      setHasStartedPlaying(false);
      setHasError(false);
    }
  }, [isActive, video.id]);

  // General auto-skip fallback based on duration (essential for iframes/stalled players)
  useEffect(() => {
    if (isActive && video.duration && video.duration > 0) {
      // Use duration + small buffer (e.g., 4 seconds)
      const buffer = videoInfo.type === 'pinterest' ? 2 : 5;
      const timer = setTimeout(() => {
        console.log("Auto-advancing due to duration limit reached:", video.title);
        onEnded();
      }, (video.duration + buffer) * 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, videoInfo.type, video.duration, onEnded, video.id]);

  return (
    <div
      className={`w-full max-w-2xl mx-auto mb-12 transition-all duration-700 ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-40 grayscale-[0.5]'}`}
      onClick={() => !isActive && onSelect()}
    >
      <div className="px-4 mb-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-xl text-foreground truncate ">{video.title}</h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            {video.authorName || 'Contenido Guardado'} {video.duration ? `• ${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : ''}
          </p>
        </div>
      </div>

      <div
        className={`relative overflow-hidden bg-card border-none rounded-[2.5rem] shadow-2xl transition-all duration-500 ${isActive ? 'ring-4 ring-primary/20 shadow-primary/10' : 'shadow-lg'
          } ${isVertical ? "aspect-[9/16]" :
            isSquare ? "aspect-square" :
              "aspect-video"
          }`}
      >
        {!shouldRender ? (
          <div className="w-full h-full relative cursor-pointer group">
            <img
              src={video.thumbnailUrl || ""}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt={video.title}
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-black relative">
            {/* Show thumbnail while not active even if rendering player in background */}
            {!isActive && (
              <div className="absolute inset-0 z-10 cursor-pointer group">
                <img
                  src={video.thumbnailUrl || ""}
                  className="w-full h-full object-cover"
                  alt={video.title}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white/50" />
                </div>
              </div>
            )}

            {isActive && (
              <VideoPlayerNative
                video={video}
                isActive={isActive}
                isVertical={isVertical}
                onEnded={onEnded}
                onError={() => setHasError(true)}
              />
            )}

            {/* Removed "Tap to play" overlay as per user request */}

            {hasError && isActive && (
              <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center p-8 text-center gap-4">
                <X className="w-12 h-12 text-destructive" />
                <p className="text-white font-bold">No se puede reproducir este contenido</p>
                <Button variant="outline" onClick={onEnded} className="text-white border-white/20">Saltar video</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* End Indicator for better UI */}
      {isActive && !isLast && (
        <div className="mt-8 flex flex-col items-center gap-2 animate-bounce opacity-30">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Siguiente Video</p>
          <ChevronLeft className="-rotate-90 w-4 h-4" />
        </div>
      )}
    </div>
  );
}

function SortableVideoItem({ video, index, currentIndex, onSelect }: { video: any; index: number; currentIndex: number; onSelect: () => void; }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
    >
      <div className={`flex items-center gap-2 p-2 rounded-3xl transition-all ${index === currentIndex ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/50'}`}>
        {/* Professional Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="w-5 h-5 opacity-40 group-hover:opacity-100" />
        </div>

        <button
          onClick={onSelect}
          className={`flex-1 p-3 rounded-2xl text-left transition-all relative overflow-hidden active:scale-[0.98] ${index === currentIndex
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
            : 'bg-card text-foreground hover:bg-muted border border-border/50'
            } ${isDragging ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="flex items-start gap-4 relative z-10">
            <span className={`text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${index === currentIndex ? 'bg-primary-foreground/20' : 'bg-muted'}`}>{index + 1}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-sm line-clamp-1 leading-tight">{video.title}</h3>
              {video.authorName && (
                <p className={`text-[9px] uppercase tracking-widest font-black mt-1 ${index === currentIndex ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{video.authorName}</p>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function PlaylistPage() {
  const [, params] = useRoute("/playlists/:id");
  const [, setLocation] = useLocation();
  const playlistId = params?.id ? parseInt(params.id) : undefined;

  const { data: playlist, isLoading } = usePlaylist(playlistId || 0);
  const { reorderVideos } = usePlaylistVideos(playlistId || 0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [localVideos, setLocalVideos] = useState<any[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (playlist?.videos) {
      setLocalVideos(playlist.videos);
    }
  }, [playlist?.videos]);

  const videos = localVideos;

  const handleNext = () => {
    if (videos && currentIndex < videos.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex((v) => v.id === active.id);
      const newIndex = videos.findIndex((v) => v.id === over.id);

      const newOrder = arrayMove(videos, oldIndex, newIndex);
      setLocalVideos(newOrder);

      // Persist to backend
      reorderVideos.mutate(newOrder.map(v => v.id));

      // Adjust current index if necessary
      if (currentIndex === oldIndex) {
        setCurrentIndex(newIndex);
      } else if (currentIndex > oldIndex && currentIndex <= newIndex) {
        setCurrentIndex(currentIndex - 1);
      } else if (currentIndex < oldIndex && currentIndex >= newIndex) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handleSelectVideo = (index: number) => {
    setCurrentIndex(index);
    setHasStarted(true);
    setShowPlaylist(false);
  };

  // Sync scroll with currentIndex
  useEffect(() => {
    if (hasStarted) {
      videoRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentIndex, hasStarted]);

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="font-black text-muted-foreground text-lg italic">Sincronizando tu feed...</p>
        </div>
      </LayoutShell>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
              <ListVideo className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h2 className="text-3xl font-black text-foreground">
              Esta lista está vacía
            </h2>
            <Button onClick={() => setLocation("/")} className="rounded-full px-8 h-14 font-black">
              Explorar Videos
            </Button>
          </div>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="fixed inset-0 bg-background z-0" />

      {/* Sidebar Controls - Absolute on top */}
      <div className="fixed top-8 left-8 z-50 flex gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-card/80 hover:bg-card text-foreground backdrop-blur-md shadow-xl border border-border transition-all"
          onClick={() => setLocation("/playlists")}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      </div>

      <div className="fixed top-8 right-8 z-50 flex flex-col gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-card/80 hover:bg-card text-foreground backdrop-blur-md shadow-xl border border-border transition-all"
          onClick={() => setShowPlaylist(!showPlaylist)}
        >
          <List className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Feed Container */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 max-w-5xl mx-auto pt-24 pb-40 px-4 scroll-smooth"
      >
        <div className="text-center mb-20 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
            {playlist?.name || 'Playlist'}
          </span>
          <h1 className="text-[2.5rem] font-black tracking-tight text-foreground leading-tight">
            Feed de Reproducción
          </h1>
          <p className="text-muted-foreground font-bold text-base max-w-lg mx-auto">
            Disfruta de tus videos en secuencia. La reproducción avanzará automáticamente al finalizar cada video.
          </p>

          {!hasStarted && (
            <div className="pt-8">
              <Button
                onClick={() => {
                  setHasStarted(true);
                  setCurrentIndex(0);
                }}
                className="h-20 px-12 rounded-[2rem] bg-primary text-primary-foreground text-xl font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-transform"
              >
                <Play className="w-8 h-8 mr-4 fill-current" />
                Iniciar Playlist
              </Button>
            </div>
          )}
        </div>

        {/* The Actual Feed */}
        <div className="space-y-32">
          {videos.map((video: any, index: number) => {
            // Buffer: render player for current, next and previous video
            const isNear = Math.abs(index - currentIndex) <= 1;

            return (
              <div
                key={video.id}
                ref={el => videoRefs.current[index] = el}
                className="scroll-mt-32"
              >
                <PlaylistFeedItem
                  video={video}
                  isActive={hasStarted && index === currentIndex}
                  shouldRender={isNear}
                  onEnded={handleNext}
                  onSelect={() => handleSelectVideo(index)}
                  isLast={index === videos.length - 1}
                />
              </div>
            );
          })}
        </div>

        {/* End of Playlist Footer */}
        {hasStarted && currentIndex === videos.length - 1 && (
          <div className="text-center mt-32 p-12 rounded-[3rem] bg-card border border-border shadow-2xl">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
            <h3 className="text-2xl font-black text-foreground mb-2">¡Has terminado la lista!</h3>
            <p className="text-muted-foreground font-bold mb-8">¿Qué quieres hacer ahora?</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => handleSelectVideo(0)} className="rounded-2xl h-14 px-8 font-black">
                Repetir Lista
              </Button>
              <Button onClick={() => setLocation("/playlists")} className="rounded-2xl h-14 px-8 font-black">
                Otras Playlists
              </Button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPlaylist && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowPlaylist(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card shadow-2xl overflow-hidden z-[70] border-l border-border"
            >
              <div className="flex flex-col h-full">
                <div className="p-8 flex items-center justify-between border-b border-border">
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Lista de Videos</h2>
                    <p className="text-sm text-muted-foreground font-bold mt-1">{videos.length} contenidos</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:bg-muted rounded-full h-12 w-12"
                    onClick={() => setShowPlaylist(false)}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={videos.map(v => v.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {videos.map((video: any, index: number) => (
                        <SortableVideoItem
                          key={video.id}
                          video={video}
                          index={index}
                          currentIndex={currentIndex}
                          onSelect={() => handleSelectVideo(index)}
                        />
                      ))}
                    </SortableContext>
                    <DragOverlay>
                      {activeId ? (
                        <div className="w-[calc(100%-1rem)] bg-primary text-primary-foreground p-4 rounded-2xl shadow-2xl opacity-90 backdrop-blur-md border border-primary/20 rotate-1 scale-105 transition-transform">
                          <div className="flex items-start gap-4">
                            <GripVertical className="w-5 h-5 opacity-40" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-black text-sm line-clamp-1">{videos.find(v => v.id === activeId)?.title}</h3>
                              <p className="text-[10px] uppercase tracking-widest font-black mt-1 opacity-70">Moviendo video...</p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </LayoutShell>
  );
}


