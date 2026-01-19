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
import { Search, Loader2, Youtube, Music, Instagram, Video as VideoIcon, FilterX, Heart, HelpCircle, Share2, MousePointer2, Folder, PlusCircle, Tag as TagIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { FolderList } from "@/components/folder-list";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [showFavorites, setShowFavorites] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>(undefined);
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>(undefined);

  const { data: videos, isLoading } = useVideos({
    search,
    platform,
    category,
    favorite: showFavorites ? "true" : undefined,
    folderId: selectedFolderId,
    tagId: selectedTagId
  });
  const { data: tags } = useTags();
  const { mutate: deleteVideo } = useDeleteVideo();
  const { mutate: updateVideo } = useUpdateVideo();
  const { viewMode } = useViewMode();

  return (
    <LayoutShell>
      <div className="space-y-8 pb-32 px-6 md:px-0">
        {/* Header Section */}
        <div className="flex justify-between items-center pt-8 gap-4">
          <div className="flex-1">
            <h1 className="text-[2.5rem] font-black tracking-tight text-slate-900 dark:text-white leading-tight">Videoteca</h1>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-base mt-0.5">Organiza tu contenido favorito</p>
          </div>
          <div className="flex items-center gap-3">
            <ViewModeToggle />
            <Link href="/add">
              <Button size="icon" className="h-14 w-14 rounded-full bg-primary shadow-2xl shadow-primary/40 hover:scale-105 transition-transform">
                <PlusCircle className="h-8 w-8 text-white" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar videos, carpetas o etiquetas..."
            className="pl-14 bg-white dark:bg-slate-900 border-none h-16 rounded-[1.5rem] text-base font-medium focus-visible:ring-primary/10 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tags Filter Section */}
        {tags && tags.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <TagIcon className="w-5 h-5 text-primary" />
                Filtrar por Etiqueta
              </h2>
              {selectedTagId && (
                <Button
                  variant="ghost"
                  className="text-slate-400 font-black text-[10px] tracking-widest uppercase hover:bg-transparent p-0 hover:text-primary"
                  onClick={() => setSelectedTagId(undefined)}
                >
                  <FilterX className="w-3 h-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-6 px-6">
              <Button
                onClick={() => setSelectedTagId(undefined)}
                className={`rounded-full px-8 h-12 font-bold shadow-lg transition-all ${selectedTagId === undefined
                  ? 'bg-primary text-white shadow-primary/20'
                  : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                  }`}
              >
                Todos
              </Button>
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  onClick={() => setSelectedTagId(tag.id)}
                  className={`rounded-full px-6 h-12 font-bold shadow-sm transition-all border-0 ${selectedTagId === tag.id
                    ? 'text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:scale-105'
                    }`}
                  style={selectedTagId === tag.id ? { backgroundColor: tag.color || '#3b82f6' } : {}}
                >
                  #{tag.name}
                </Button>
              ))}
            </div>
          </section>
        )}

        {/* Folders Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Tus Carpetas</h2>
            <Button variant="ghost" className="text-primary font-black text-[10px] tracking-widest uppercase hover:bg-transparent p-0">
              Ver Todas
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none -mx-6 px-6">
            <FolderList
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              layout="horizontal"
            />
          </div>
        </section>

        {/* Recently Added Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Agregados recientemente</h2>
            <div className="p-3 rounded-2xl bg-slate-100 text-slate-400">
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
                <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-sm flex items-center justify-center">
                  <FilterX className="w-12 h-12 text-slate-200" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No se encontraron videos</h3>
                  <p className="text-slate-400 font-bold max-w-xs mx-auto text-sm">
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
      </div >
    </LayoutShell >
  );
}
