import { useState } from "react";
import { Link } from "wouter";
import { useVideos, useDeleteVideo, useUpdateVideo } from "@/hooks/use-videos";
import { LayoutShell } from "@/components/layout-shell";
import { VideoCard } from "@/components/video-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Youtube, Music, Instagram, Video as VideoIcon, FilterX, Heart, HelpCircle, Share2, MousePointer2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [showFavorites, setShowFavorites] = useState(false);
  
  const [category, setCategory] = useState<string>("all");
  
  const { data: videos, isLoading } = useVideos({ 
    search, 
    platform, 
    category,
    favorite: showFavorites ? "true" : undefined 
  });
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
          
          <div className="flex gap-4 items-center">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px] bg-card/50 border-border h-10">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="tutorials">Tutorials</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search videos..." 
                className="pl-9 bg-card/50 border-border focus:bg-card transition-all h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
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
          
          <div className="h-4 w-[1px] bg-border mx-2" />
          
          <Button
            variant={showFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavorites(!showFavorites)}
            className={`rounded-full px-4 gap-2 transition-all ${
              showFavorites 
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600" 
                : "bg-card border-border hover:bg-card/80 text-red-500"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showFavorites ? "fill-white" : ""}`} />
            Favorites
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full px-4 gap-2 bg-card border-border hover:bg-card/80 text-primary border-primary/20">
                <HelpCircle className="w-3.5 h-3.5" />
                ¿Cómo guardar videos?
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <HelpCircle className="text-primary" />
                  Guardar desde Navegador
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary" />
                    En Móvil (Android/iOS)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Instala esta app como <strong>PWA</strong> usando el botón "Añadir a pantalla de inicio" de tu navegador. 
                    Después, podrás guardar cualquier video simplemente usando el botón <strong>"Compartir"</strong> y seleccionando <strong>Video Keeper</strong>.
                  </p>
                </div>

                <div className="h-[1px] bg-border/50" />

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-primary" />
                    En Computadora (Botón Mágico)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Arrastra el siguiente botón a tu <strong>barra de marcadores</strong>. Cuando estés viendo un video en YouTube o TikTok, haz clic en él para guardarlo instantáneamente:
                  </p>
                  <div className="pt-2">
                    <a 
                      href={`javascript:(function(){const u=window.location.href;const t=document.title;window.open('${window.location.origin}/quick-add?url='+encodeURIComponent(u)+'&title='+encodeURIComponent(t), '_blank', 'width=500,height=600,menubar=no,toolbar=no,location=no');})();`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-move select-none"
                      onClick={(e) => e.preventDefault()}
                    >
                      <VideoIcon className="w-4 h-4" />
                      + Video Keeper Magic
                    </a>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center uppercase tracking-wider font-medium">
                      Arrastrable a marcadores
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                <Link href="/add">Add Video</Link>
              </Button>
            </div>
          ) : (
            <motion.div 
              layout
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
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
                    className="break-inside-avoid"
                  >
                    <VideoCard 
                      video={video} 
                      onDelete={(id) => deleteVideo(id)}
                      onUpdate={(id, updates) => updateVideo({ id, ...updates })}
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
