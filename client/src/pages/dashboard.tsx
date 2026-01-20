import { useState } from "react";
import { Link } from "wouter";
import { useVideos, useDeleteVideo, useUpdateVideo } from "@/hooks/use-videos";
import { useTags } from "@/hooks/use-tags";
import { useViewMode } from "@/contexts/view-mode-context";
import { LayoutShell } from "@/components/layout-shell";
import { VideoCard } from "@/components/video-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Youtube, Music, Instagram, Video as VideoIcon, FilterX, Heart, HelpCircle, Share2, MousePointer2, Folder, PlusCircle, Tag as TagIcon, Play, ListVideo } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { FolderList } from "@/components/folder-list";
import { usePlaylists } from "@/hooks/use-playlists";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFolders } from "@/hooks/use-folders";
import { ThemeToggle } from "@/components/theme-toggle";

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>(undefined);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const { data: allVideos } = useVideos();
  const { data: allFolders } = useFolders();
  const { data: playlists } = usePlaylists();
  const { data: videos, isLoading } = useVideos({
    search,
    favorite: showFavorites ? "true" : undefined,
    folderId: selectedFolderId,
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined
  });
  const { data: tags } = useTags();
  const { mutate: deleteVideo } = useDeleteVideo();
  const { mutate: updateVideo } = useUpdateVideo();
  const { viewMode } = useViewMode();

  // Calculate statistics from the currently filtered videos
  const stats = {
    totalVideos: videos?.length || 0,
    totalFolders: allFolders?.length || 0,
    totalPlaylists: playlists?.length || 0,
    totalDuration: videos?.reduce((acc: number, v: any) => acc + (v.duration || 0), 0) || 0
  };

  return (
    <LayoutShell>
      {/* Floating Truly Fixed Header */}
      <div className="sticky top-0 z-[100] w-full py-4 bg-background/95 backdrop-blur-md border-b border-border/40 transition-all duration-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row gap-4 items-center">
          {/* Main Search & Logic */}
          <div className="flex flex-1 w-full gap-3 items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors z-10" />
              <Input
                placeholder="Buscar en tu videoteca..."
                className="pl-14 bg-muted/50 border-none h-14 rounded-2xl text-base font-medium focus-visible:ring-2 focus-visible:ring-primary/20 transition-all shadow-sm w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="bg-muted/50 rounded-2xl h-14 flex items-center justify-center px-1 shadow-sm">
              <ThemeToggle />
            </div>
          </div>

          {/* Quick Filters Group */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {/* Tags Filter Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`h-14 px-6 rounded-2xl border-none shadow-sm gap-2 whitespace-nowrap ${selectedTagIds.length > 0 ? "bg-primary/10 text-primary" : "bg-muted/50"}`}>
                  <TagIcon className="w-4 h-4" />
                  {selectedTagIds.length > 0 ? `Etiquetas (${selectedTagIds.length})` : "Etiquetas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-3xl bg-card border-border shadow-2xl" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Filtrar por Etiquetas</h4>
                    {selectedTagIds.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTagIds([])} className="h-7 text-xs font-bold text-primary hover:bg-primary/10">Limpiar</Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {tags?.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className={`cursor-pointer h-9 px-4 rounded-xl font-bold transition-all border-none ${isSelected ? "text-white ring-2 ring-primary/20 scale-95" : "bg-muted text-foreground opacity-60 hover:opacity-100"}`}
                          style={isSelected ? { backgroundColor: tag.color || '#3b82f6' } : {}}
                          onClick={() => isSelected ? setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id)) : setSelectedTagIds([...selectedTagIds, tag.id])}
                        >
                          #{tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Folder Filter Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`h-14 px-6 rounded-2xl border-none shadow-sm gap-2 whitespace-nowrap ${selectedFolderId ? "bg-primary/10 text-primary" : "bg-muted/50"}`}>
                  <Folder className="w-4 h-4" />
                  {selectedFolderId ? "Carpeta Activa" : "Carpetas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-3xl bg-card border-border shadow-2xl overflow-hidden" align="end">
                <div className="p-4 border-b border-border/40 bg-muted/30">
                  <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Elegir Carpeta</h4>
                </div>
                <div className="p-2">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-12 rounded-xl mb-1 font-bold ${!selectedFolderId ? "bg-primary/10 text-primary" : ""}`}
                    onClick={() => setSelectedFolderId(undefined)}
                  >
                    Todas las carpetas
                  </Button>
                  <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                    {allFolders?.map((folder) => (
                      <Button
                        key={folder.id}
                        variant="ghost"
                        className={`w-full justify-start h-12 rounded-xl font-bold ${selectedFolderId === folder.id ? "bg-primary/10 text-primary font-black" : "text-muted-foreground"}`}
                        onClick={() => setSelectedFolderId(folder.id)}
                      >
                        <div className="w-2 h-2 rounded-full mr-3 bg-primary/40" />
                        {folder.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="h-10 w-[1px] bg-border/40 mx-2 hidden md:block" />

            <div className="flex items-center gap-1">
              <ViewModeToggle />
            </div>

            <div className="h-10 w-[1px] bg-border/40 mx-2 hidden lg:block" />

            <Link href="/add" className="hidden lg:block">
              <Button className="h-14 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95">
                <PlusCircle className="w-5 h-5" />
                Añadir Video
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Rest of the Content with internal padding */}
      <div className="space-y-12 pb-32 pt-8 px-6 md:px-8 max-w-7xl mx-auto w-full">

        {/* Dash Statistics Section - Circular Scrollable Row */}
        <div className="flex flex-nowrap items-center gap-4 px-2 md:px-0 overflow-x-auto no-scrollbar pb-2">
          {[
            { label: "Videos", value: stats.totalVideos, icon: VideoIcon, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Carpetas", value: stats.totalFolders, icon: Folder, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Playlists", value: stats.totalPlaylists, icon: ListVideo, color: "text-pink-500", bg: "bg-pink-500/10" },
            { label: "Tiempo total", value: formatDuration(stats.totalDuration), icon: Music, color: "text-amber-500", bg: "bg-amber-500/10" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 bg-card/40 border border-border/40 rounded-2xl py-2.5 px-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-default shrink-0"
              title={stat.label === "Tiempo total" ? "Sumatoria de los minutos de los videos detectados en esta vista" : undefined}
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground leading-none mb-0.5">{stat.label}</p>
                <h4 className="text-sm font-black text-foreground leading-none">{stat.value}</h4>
              </div>
            </motion.div>
          ))}
        </div>


        {/* Recently Added Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground tracking-tight">Agregados recientemente</h2>
            <div className="p-3 rounded-2xl bg-secondary text-muted-foreground">
              <VideoIcon className="w-5 h-5" />
            </div>
          </div>

          {/* Content Grid */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="font-bold">Cargando tu colección...</p>
              </div>
            ) : videos?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-6 text-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-card shadow-sm border border-border flex items-center justify-center">
                  <FilterX className="w-12 h-12 text-muted/50" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground mb-2">No se encontraron videos</h3>
                  <p className="text-muted-foreground font-bold max-w-xs mx-auto text-sm">
                    {selectedFolderId
                      ? "Esta carpeta está vacía. ¡Añade videos para empezar!"
                      : "¡Intenta ajustar tu búsqueda o filtros, o añade tu primer video!"}
                  </p>
                </div>
              </div>
            ) : (
              <div className={`grid gap-${viewMode === 'list' ? '4' : '8'} ${viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : viewMode === 'compact'
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'grid-cols-1'
                }`}>
                <AnimatePresence>
                  {videos?.map((video: any) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      <VideoCard
                        video={video}
                        onDelete={(id) => deleteVideo(id)}
                        onUpdate={(id, updates) => updateVideo({ id, ...updates })}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </div>
    </LayoutShell>
  );
}
