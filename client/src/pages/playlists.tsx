import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlaylists, useCreatePlaylist, useDeletePlaylist } from "@/hooks/use-playlists";
import { useTags } from "@/hooks/use-tags";
import { Plus, Play, Trash2, Edit, ListVideo, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

export default function PlaylistsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [autoAdd, setAutoAdd] = useState(false);

  const queryClient = useQueryClient();
  const { data: playlists, isLoading } = usePlaylists();
  const { data: allTags } = useTags();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const { toast } = useToast();

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la playlist es requerido",
        variant: "destructive",
      });
      return;
    }

    createPlaylist.mutate(
      {
        name: newPlaylistName,
        description: newPlaylistDescription || undefined,
        autoAdd,
      },
      {
        onSuccess: async (playlist: any) => {
          // Add tags to playlist if selected
          if (selectedTags.length > 0 && playlist?.id) {
            for (const tagId of selectedTags) {
              await apiRequest("POST", `/api/playlists/${playlist.id}/tags/${tagId}`);
            }

            // Sync videos if autoAdd is true
            if (autoAdd) {
              await apiRequest("POST", `/api/playlists/${playlist.id}/sync`);
            }

            // Invalidate again to show updated video count and tags
            queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
          }

          toast({
            title: "✅ Playlist creada",
            description: `"${newPlaylistName}" ha sido creada exitosamente`,
          });

          setIsCreateDialogOpen(false);
          setNewPlaylistName("");
          setNewPlaylistDescription("");
          setSelectedTags([]);
          setAutoAdd(false);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "No se pudo crear la playlist",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeletePlaylist = (id: number, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la playlist "${name}"?`)) {
      deletePlaylist.mutate(id, {
        onSuccess: () => {
          toast({
            title: "✅ Playlist eliminada",
            description: `"${name}" ha sido eliminada`,
          });
        },
      });
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <LayoutShell>
      <div className="space-y-8 pb-32 px-6 md:px-0">
        {/* Header */}
        <div className="flex justify-between items-center pt-8">
          <div>
            <h1 className="text-[2.5rem] font-black tracking-tight text-foreground leading-tight">
              Playlists
            </h1>
            <p className="text-muted-foreground font-bold text-base mt-0.5">
              Organiza tus videos en listas de reproducción
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="h-14 px-8 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-105 transition-transform font-black"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva Playlist
          </Button>
        </div>

        {/* Playlists Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-400 font-bold">Cargando playlists...</p>
          </div>
        ) : playlists && playlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group bg-card rounded-[2rem] p-6 shadow-sm border border-border hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-foreground mb-1">
                      {playlist.name}
                    </h3>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                {playlist.tags && playlist.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {playlist.tags.map((tag: any) => (
                      <Badge
                        key={tag.id}
                        style={{ backgroundColor: tag.color || "#3b82f6" }}
                        className="text-primary-foreground text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <ListVideo className="w-4 h-4" />
                    <span>{playlist.videoCount} videos</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/playlists/${playlist.id}`} className="flex-1">
                    <Button className="w-full h-12 rounded-xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                      <Play className="w-4 h-4 mr-2" />
                      Reproducir
                    </Button>
                  </Link>
                  <Link href={`/playlists/${playlist.id}/edit`}>
                    <Button
                      variant="outline"
                      className="h-12 px-4 rounded-xl font-bold border-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-24 h-24 rounded-[2rem] bg-muted flex items-center justify-center">
              <ListVideo className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-foreground mb-2">
                No tienes playlists
              </h3>
              <p className="text-muted-foreground font-bold max-w-xs mx-auto text-sm">
                Crea tu primera playlist para organizar tus videos
              </p>
            </div>
          </div>
        )}

        {/* Create Playlist Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-lg rounded-[2rem] p-8 bg-card border-none shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-foreground">
                Nueva Playlist
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Nombre de la Playlist
                </label>
                <Input
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Ej. Mi Aprendizaje Semanal"
                  className="h-14 rounded-xl bg-muted border-none text-base font-bold text-foreground"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Describe de qué trata esta playlist..."
                  className="w-full h-24 px-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm text-foreground"
                />
              </div>

              {/* Tags Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Seleccionar Etiquetas
                  </label>
                  <button
                    onClick={() => setAutoAdd(!autoAdd)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    AUTO-ADD {autoAdd ? "✓" : ""}
                  </button>
                </div>

                {allTags && allTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-muted max-h-48 overflow-y-auto">
                    {allTags.map((tag: any) => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${isSelected
                            ? "text-primary-foreground shadow-md scale-105"
                            : "bg-card text-muted-foreground hover:scale-105 border-2 border-border"
                            }`}
                          style={
                            isSelected
                              ? {
                                backgroundColor: tag.color || "#3b82f6",
                                borderColor: tag.color || "#3b82f6",
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
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center p-4">
                    No hay etiquetas disponibles
                  </p>
                )}

                {autoAdd && selectedTags.length > 0 && (
                  <div className="p-4 rounded-xl bg-primary/10 border-2 border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-foreground mb-1">
                          Previsualización
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Se añadirán automáticamente los videos nuevos que contengan estas etiquetas.
                        </p>
                        <p className="text-xs text-primary font-bold mt-2">
                          +{selectedTags.length} etiquetas seleccionadas
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreatePlaylist}
                disabled={createPlaylist.isPending}
                className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                {createPlaylist.isPending ? "Creando..." : "Crear Playlist"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutShell>
  );
}
