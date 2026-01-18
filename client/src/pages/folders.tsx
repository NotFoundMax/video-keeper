import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useFolders, useTags, useCreateTag, useUpdateTag, useDeleteTag, useUpdateFolder, useAddTagToFolder, useRemoveTagFromFolder, useCreateFolder, useDeleteFolder } from "@/hooks/use-folders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  FolderPlus
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
      createTag.mutate({ name: newTagName.trim() }, {
        onSuccess: () => setNewTagName("")
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
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Mis Carpetas</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl border-slate-200 text-slate-600 font-bold gap-2"
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
          <p className="text-slate-500 font-medium">Organiza tus videos por temas y etiquetas.</p>
        </div>

        {/* Folders Grid - Photo Panel Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders?.map((folder: any) => (
            <Card
              key={folder.id}
              className="group relative overflow-hidden rounded-[2.5rem] border-none shadow-sm bg-white aspect-[4/3]"
            >
              {/* Background Image (Cover) */}
              <div className="absolute inset-0 z-0">
                {folder.coverUrl ? (
                  <img
                    src={folder.coverUrl}
                    alt={folder.name}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                    <FolderIcon className="w-16 h-16 text-slate-200" />
                  </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap gap-2 max-w-[80%]">
                    {folder.tags?.map((tag: any) => (
                      <Badge
                        key={tag.id}
                        className="bg-white/20 backdrop-blur-md text-white border-none px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    <button
                      onClick={() => setSelectedFolderForTags(folder)}
                      className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2">
                      <DropdownMenuItem
                        className="rounded-xl font-bold text-slate-600 gap-2 cursor-pointer"
                        onClick={() => {
                          const name = prompt("Nuevo nombre:", folder.name);
                          if (name) updateFolder.mutate({ id: folder.id, name });
                        }}
                      >
                        <Pencil className="w-4 h-4" /> Editar nombre
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-xl font-bold text-destructive gap-2 cursor-pointer focus:text-destructive focus:bg-destructive/5"
                        onClick={() => {
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

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white leading-tight">{folder.name}</h3>
                  <p className="text-white/70 font-bold text-sm uppercase tracking-widest">
                    {folder.videoCount} videos
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {/* Add Folder Card */}
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 aspect-[4/3] text-slate-400 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
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
                <DialogTitle className="text-2xl font-bold text-slate-900">Gestionar Etiquetas</DialogTitle>
                <p className="text-sm text-slate-500 font-medium">Crea y organiza etiquetas para tus carpetas.</p>
              </div>

              <form onSubmit={handleCreateTag} className="flex gap-2">
                <Input
                  placeholder="Nueva etiqueta..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-primary/20"
                />
                <Button type="submit" className="h-12 rounded-xl px-6 font-bold" disabled={createTag.isPending}>
                  Añadir
                </Button>
              </form>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {tags?.map((tag: any) => (
                    <div key={tag.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 group">
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
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400" onClick={() => setEditingTagId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || "#3b82f6" }} />
                            <span className="font-bold text-slate-700">{tag.name}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-400 hover:text-primary"
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
                              className="h-8 w-8 text-slate-400 hover:text-destructive"
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
                <DialogTitle className="text-2xl font-bold text-slate-900">Etiquetas de {selectedFolderForTags?.name}</DialogTitle>
                <p className="text-sm text-slate-500 font-medium">Selecciona las etiquetas para esta carpeta.</p>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2">
                {tags?.map((tag: any) => {
                  const isAssigned = selectedFolderForTags?.tags?.some((t: any) => t.id === tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTagForFolder(selectedFolderForTags.id, tag.id, isAssigned)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${isAssigned
                          ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                          : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
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
                <DialogTitle className="text-2xl font-bold text-slate-900">Crear Nueva Carpeta</DialogTitle>
                <p className="text-sm text-slate-500 font-medium">Dale un nombre a tu nueva colección.</p>
              </div>
              <form onSubmit={handleCreateFolder} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Nombre</label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Ej: Inspiración, Recetas..."
                    className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-primary/20 text-lg font-medium"
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
