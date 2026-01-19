import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useVideos } from "@/hooks/use-videos";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack, List, X, Shuffle, Repeat } from "lucide-react";
import ReactPlayer from "react-player";
import { motion, AnimatePresence } from "framer-motion";

const Player = ReactPlayer as any;

export default function PlaylistPage() {
  const [, params] = useRoute("/playlist/:tagId");
  const [, setLocation] = useLocation();
  const tagId = params?.tagId ? parseInt(params.tagId) : undefined;

  const { data: videos } = useVideos({ tagId });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const playerRef = useRef<any>(null);

  const currentVideo = videos?.[currentIndex];

  const handleVideoEnd = () => {
    if (currentIndex < (videos?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    } else if (repeat) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    if (videos && currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const handleSelectVideo = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
    setShowPlaylist(false);
  };

  if (!videos || videos.length === 0) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              No hay videos en esta lista
            </h2>
            <Button onClick={() => setLocation("/")}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="min-h-screen bg-black">
        {/* Video Player */}
        <div className="relative w-full h-screen flex items-center justify-center">
          {currentVideo && (
            <div className="w-full h-full">
              <Player
                ref={playerRef}
                url={currentVideo.url}
                playing={isPlaying}
                controls
                width="100%"
                height="100%"
                onEnded={handleVideoEnd}
                config={{
                  youtube: {
                    playerVars: { showinfo: 1, modestbranding: 1 }
                  }
                }}
              />
            </div>
          )}

          {/* Overlay Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 space-y-4">
            {/* Video Info */}
            <div className="text-white">
              <h1 className="text-2xl font-black mb-2">{currentVideo?.title}</h1>
              <p className="text-sm text-white/70">
                {currentVideo?.authorName && `${currentVideo.authorName} • `}
                Video {currentIndex + 1} de {videos.length}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <SkipBack className="w-6 h-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-white"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={handleNext}
                  disabled={currentIndex === videos.length - 1 && !repeat}
                >
                  <SkipForward className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-full ${repeat ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  onClick={() => setRepeat(!repeat)}
                  title="Repetir"
                >
                  <Repeat className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  title="Ver lista"
                >
                  <List className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setLocation("/")}
                  title="Salir"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        <AnimatePresence>
          {showPlaylist && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed top-0 right-0 bottom-0 w-96 bg-slate-900 shadow-2xl overflow-y-auto z-50"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-white">Lista de Reproducción</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => setShowPlaylist(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {videos.map((video: any, index: number) => (
                    <button
                      key={video.id}
                      onClick={() => handleSelectVideo(index)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${index === currentIndex
                        ? 'bg-primary text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold mt-1">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm line-clamp-2">{video.title}</h3>
                          {video.authorName && (
                            <p className="text-xs opacity-70 mt-1">{video.authorName}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutShell>
  );
}
