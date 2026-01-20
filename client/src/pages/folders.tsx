import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useFolders, useTags, useCreateTag, useUpdateTag, useDeleteTag, useUpdateFolder, useAddTagToFolder, useRemoveTagFromFolder, useCreateFolder, useDeleteFolder } from "@/hooks/use-folders";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Folder as FolderIcon,
  Tag as TagIcon,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronRight,
  PlusCircle,
  FolderPlus,
  ArrowLeft
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FoldersPage() {
  const [, setLocation] = useLocation();
  const { data: folders, isLoading: foldersLoading } = useFolders();
  const { data: tags, isLoading: tagsLoading } = useTags();

  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();

  const addTagToFolder = useAddTagToFolder();
  const removeTagFromFolder = useRemoveTagFromFolder();

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState("");

  const [selectedFolderForTags, setSelectedFolderForTags] = useState<any>(null);
  const [newTagColor, setNewTagColor] = useState("#3b82f6");

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder.mutate({ name: newFolderName.trim() }, {
        onSuccess: () => {
          setNewFolderName("");
          setIsCreateFolderOpen(false);
        }
      });
    }
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      createTag.mutate({ name: newTagName.trim(), color: newTagColor }, {
        onSuccess: () => {
          setNewTagName("");
          setNewTagColor("#3b82f6");
        }
      });
    }
  };

  const handleUpdateTag = (id: number) => {
    if (editingTagName.trim()) {
      updateTag.mutate({ id, name: editingTagName.trim() }, {
        onSuccess: () => setEditingTagId(null)
      });
    }
  };

  const toggleTagForFolder = (folderId: number, tagId: number, isAssigned: boolean) => {
    if (isAssigned) {
      removeTagFromFolder.mutate({ folderId, tagId });
    } else {
      addTagToFolder.mutate({ folderId, tagId });
    }
  };

  return (
    <LayoutShell>
      <div className="p-6 space-y-8 pb-32">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight text-foreground">Mis Carpetas</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl border-border text-muted-foreground font-bold gap-2"
                onClick={() => setIsTagManagerOpen(true)}
              >
                <TagIcon className="w-4 h-4" />
                Etiquetas
              </Button>
              <Button
                size="sm"
                className="rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20"
                onClick={() => setIsCreateFolderOpen(true)}
              >
                <PlusCircle className="w-4 h-4" />
                Nueva
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Organiza tus videos por temas y etiquetas.</p>
        </div>

        {/* Folders Grid - 2 per row as requested */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {folders?.map((folder: any) => (
            <Card
              key={folder.id}
              onClick={() => setLocation(`/folders/${folder.id}`)}
              className="group relative overflow-hidden rounded-[2.5rem] border-none shadow-sm bg-[#FFD93D]/10 hover:bg-[#FFD93D]/20 aspect-[4/3] cursor-pointer active:scale-95 transition-all duration-300 border-2 border-[#FFD93D]/20 hover:border-[#FFD93D]/40"
            >
              {/* Content */}
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-4 rounded-3xl bg-[#FFD93D] shadow-lg shadow-[#FFD93D]/20 group-hover:scale-110 transition-transform duration-500">
                    <FolderIcon className="w-8 h-8 text-[#8B7E00]" />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-white/50 backdrop-blur-md text-foreground border border-border/40 hover:bg-white/80" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-border bg-card shadow-2xl p-2">
                      <DropdownMenuItem
                        className="rounded-xl font-bold text-muted-foreground gap-2 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const name = prompt("Nuevo nombre:", folder.name);
                          if (name) updateFolder.mutate({ id: folder.id, name });
                        }}
                      >
                        <Pencil className="w-4 h-4" /> Editar nombre
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-xl font-bold text-destructive gap-2 cursor-pointer focus:text-destructive focus:bg-destructive/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("¿Eliminar carpeta? Los videos no se borrarán.")) {
                            deleteFolder.mutate(folder.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mt-auto">
                  <h3 className="text-2xl md:text-3xl font-black text-foreground leading-tight line-clamp-2">{folder.name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground font-black text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-60">
                      {folder.videoCount} videos
                    </p>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B7E00]/20" />
                    <p className="text-[#8B7E00] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-80">
                      Colección
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Add Folder Card */}
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border-2 border-dashed border-border bg-muted/50 aspect-[4/3] text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all group active:scale-95 duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-card shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderPlus className="w-8 h-8" />
            </div>
            <span className="font-bold text-lg">Nueva Carpeta</span>
          </button>
        </div>

        {/* Tag Manager Dialog */}
        <Dialog open={isTagManagerOpen} onOpenChange={setIsTagManagerOpen}>
          <DialogContent className="bg-white border-none shadow-2xl rounded-[2.5rem] sm:max-w-md p-0 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-foreground">Gestionar Etiquetas</DialogTitle>
                <p className="text-sm text-muted-foreground font-medium">Crea y organiza etiquetas para tus carpetas.</p>
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Elegir Color</p>
                <div className="flex flex-wrap gap-2">
                  {["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${newTagColor === color ? "border-foreground scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <form onSubmit={handleCreateTag} className="flex gap-2">
                  <Input
                    placeholder="Nueva etiqueta..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="h-12 rounded-xl bg-muted border-none focus-visible:ring-primary/20 text-foreground font-bold"
                  />
                  <Button type="submit" className="h-12 rounded-xl px-6 font-bold" disabled={createTag.isPending}>
                    Añadir
                  </Button>
                </form>
              </div>

              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-2">
                  {tags?.map((tag: any) => (
                    <div key={tag.id} className="flex items-center justify-between p-3 rounded-xl bg-muted group">
                      {editingTagId === tag.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingTagName}
                            onChange={(e) => setEditingTagName(e.target.value)}
                            className="h-9 rounded-lg bg-white border-slate-200"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-green-600" onClick={() => handleUpdateTag(tag.id)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground" onClick={() => setEditingTagId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || "#3b82f6" }} />
                            <span className="font-bold text-foreground">{tag.name}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                setEditingTagId(tag.id);
                                setEditingTagName(tag.name);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                if (confirm("¿Eliminar etiqueta?")) deleteTag.mutate(tag.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {tags?.length === 0 && (
                    <div className="text-center py-8 text-slate-400 font-medium italic">
                      No hay etiquetas creadas.
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Button variant="ghost" className="w-full rounded-xl h-12 font-bold text-slate-500" onClick={() => setIsTagManagerOpen(false)}>
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Folder Tags Dialog */}
        <Dialog open={!!selectedFolderForTags} onOpenChange={(open) => !open && setSelectedFolderForTags(null)}>
          <DialogContent className="bg-white border-none shadow-2xl rounded-[2.5rem] sm:max-w-md p-0 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-foreground">Etiquetas de {selectedFolderForTags?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground font-medium">Selecciona las etiquetas para esta carpeta.</p>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2">
                {tags?.map((tag: any) => {
                  const isAssigned = selectedFolderForTags?.tags?.some((t: any) => t.id === tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTagForFolder(selectedFolderForTags.id, tag.id, isAssigned)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${isAssigned
                        ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                {tags?.length === 0 && (
                  <div className="w-full text-center py-4 text-slate-400 font-medium italic">
                    Primero crea etiquetas en el gestor.
                  </div>
                )}
              </div>

              <Button className="w-full rounded-2xl h-14 font-bold text-lg shadow-lg shadow-primary/20" onClick={() => setSelectedFolderForTags(null)}>
                Listo
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Folder Dialog */}
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogContent className="bg-white border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-foreground">Crear Nueva Carpeta</DialogTitle>
                <p className="text-sm text-muted-foreground font-medium">Dale un nombre a tu nueva colección.</p>
              </div>
              <form onSubmit={handleCreateFolder} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nombre</label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Ej: Inspiración, Recetas..."
                    className="h-14 rounded-2xl bg-muted border-none focus-visible:ring-primary/20 text-lg font-medium text-foreground"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-slate-500" onClick={() => setIsCreateFolderOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 h-14 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={createFolder.isPending}>
                    {createFolder.isPending ? "Creando..." : "Crear"}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutShell>
  );
}
