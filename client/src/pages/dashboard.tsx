import { useState } from "react";
import { Link } from "wouter";
import { useVideos, useDeleteVideo, useUpdateVideo } from "@/hooks/use-videos";
import { LayoutShell } from "@/components/layout-shell";
import { VideoCard } from "@/components/video-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Youtube, Music, Instagram, Video as VideoIcon, FilterX, Heart, HelpCircle, Share2, MousePointer2, Folder, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { FolderList } from "@/components/folder-list";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [showFavorites, setShowFavorites] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>(undefined);

  const { data: videos, isLoading } = useVideos({
    search,
    platform,
    category,
    favorite: showFavorites ? "true" : undefined,
    folderId: selectedFolderId
  });
  const { mutate: deleteVideo } = useDeleteVideo();
  const { mutate: updateVideo } = useUpdateVideo();

  const platformFilters = [
    { id: "all", label: "Todos", icon: VideoIcon },
    { id: "youtube", label: "YouTube", icon: Youtube },
    { id: "tiktok", label: "TikTok", icon: Music },
    { id: "instagram", label: "Instagram", icon: Instagram },
  ];

  return (
    <LayoutShell>
      <div className="space-y-10 pb-10 px-4 md:px-0">
        {/* Header Section */}
        <div className="flex justify-between items-start pt-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Videoteca</h1>
            <p className="text-slate-500 font-medium mt-1">Organiza tu contenido favorito</p>
          </div>
          <Link href="/add">
            <Button size="icon" className="h-14 w-14 rounded-full bg-primary shadow-xl shadow-primary/30 hover:scale-105 transition-transform">
              <PlusCircle className="h-7 w-7 text-white" />
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar videos, carpetas o etiquetas..."
            className="pl-14 bg-slate-100/50 border-none h-16 rounded-3xl text-lg focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Folders Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-slate-900">Tus Carpetas</h2>
            <Button variant="ghost" className="text-primary font-bold text-xs tracking-widest uppercase">
              Ver Todas
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4">
            <FolderList
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              layout="horizontal"
            />
          </div>
        </section>

        {/* Recently Added Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-slate-900">Agregados recientemente</h2>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-400">
              <VideoIcon className="w-5 h-5" />
            </div>
          </div>

          {/* Content Grid */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p>Cargando tu colección...</p>
              </div>
            ) : videos?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-6 text-center">
                <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <FilterX className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No se encontraron videos</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    {selectedFolderId
                      ? "Esta carpeta está vacía. ¡Añade videos para empezar!"
                      : "¡Intenta ajustar tu búsqueda o filtros, o añade tu primer video!"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-2 xl:columns-3 gap-8 space-y-8">
                <AnimatePresence>
                  {videos?.map((video: any) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="break-inside-avoid mb-8"
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
