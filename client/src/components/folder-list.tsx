import { useState } from "react";
import { useFolders, useCreateFolder, useDeleteFolder, useAddTagToFolder, useRemoveTagFromFolder } from "@/hooks/use-folders";
import { useTags, useCreateTag, useDeleteTag } from "@/hooks/use-tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder as FolderIcon, Plus, Trash2, Tag as TagIcon, X, MoreVertical, FolderPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";

interface FolderListProps {
  selectedFolderId?: number;
  onSelectFolder: (id?: number) => void;
  layout?: "vertical" | "horizontal";
}

export function FolderList({ selectedFolderId, onSelectFolder, layout = "vertical" }: FolderListProps) {
  const { data: folders } = useFolders();
  const { data: tags } = useTags();

  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const addTagToFolder = useAddTagToFolder();
  const removeTagFromFolder = useRemoveTagFromFolder();

  const [newFolderName, setNewFolderName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createFolder.mutate({ name: newFolderName.trim() }, {
      onSuccess: () => {
        setNewFolderName("");
        setIsCreateFolderOpen(false);
      }
    });
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    createTag.mutate({ name: newTagName.trim(), color: newTagColor }, {
      onSuccess: () => setNewTagName("")
    });
  };

  if (layout === "horizontal") {
    return (
      <div className="flex gap-4">
        {folders?.map((folder) => (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className={`flex-shrink-0 w-44 p-5 rounded-[2rem] border-none text-left flex flex-col gap-4 ${selectedFolderId === folder.id
              ? "bg-primary text-white shadow-xl shadow-primary/30"
              : "bg-white text-slate-900 shadow-sm"
              }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedFolderId === folder.id ? "bg-white/20" : "bg-slate-100"}`}>
              <FolderIcon className={`w-6 h-6 ${selectedFolderId === folder.id ? "text-white" : "text-primary"}`} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight truncate">{folder.name}</h3>
              <p className={`text-xs mt-1 font-medium ${selectedFolderId === folder.id ? "text-white/70" : "text-slate-400"}`}>
                {(folder as any).videoCount || 0} videos
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FolderIcon className="w-5 h-5 text-primary" />
          Carpetas
        </h2>
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full gap-2 border-primary/20 text-primary">
              <FolderPlus className="w-4 h-4" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-none shadow-2xl rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Crear Nueva Carpeta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFolder} className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Nombre de la carpeta</label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ej: Recetas, Tutoriales..."
                  className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-primary/20"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="submit" size="lg" className="w-full rounded-2xl h-14 font-bold text-lg shadow-lg shadow-primary/20" disabled={createFolder.isPending}>
                  {createFolder.isPending ? "Creando..." : "Crear Carpeta"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onSelectFolder(undefined)}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left ${selectedFolderId === undefined
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : "bg-white border border-slate-100 text-slate-600"
            }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedFolderId === undefined ? "bg-white/20" : "bg-slate-50"}`}>
            <FolderIcon className="w-5 h-5" />
          </div>
          <span className="font-bold">Todos los videos</span>
        </button>

        <AnimatePresence mode="popLayout">
          {folders?.map((folder) => (
            <motion.div
              key={folder.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative"
            >
              <button
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left ${selectedFolderId === folder.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white border border-slate-100 text-slate-600"
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedFolderId === folder.id ? "bg-white/20" : "bg-slate-50"}`}>
                  <FolderIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="font-bold truncate block">{folder.name}</span>
                  <span className={`text-[10px] font-medium ${selectedFolderId === folder.id ? "text-white/70" : "text-slate-400"}`}>
                    {(folder as any).videoCount || 0} videos
                  </span>
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3 bg-card border-border shadow-xl" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Etiquetas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {folder.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: `${tag.color || '#3b82f6'}20`, color: tag.color || '#3b82f6', borderColor: `${tag.color || '#3b82f6'}40` }}
                              className="gap-1 pr-1"
                            >
                              {tag.name}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeTagFromFolder.mutate({ folderId: folder.id, tagId: tag.id })}
                              />
                            </Badge>
                          ))}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="icon" className="h-5 w-5 rounded-full">
                                <Plus className="w-3 h-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2 bg-card border-border shadow-lg" side="right">
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground px-1">Añadir Etiqueta</p>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                  {tags?.filter(t => !folder.tags.some(ft => ft.id === t.id)).map((tag) => (
                                    <button
                                      key={tag.id}
                                      onClick={() => addTagToFolder.mutate({ folderId: folder.id, tagId: tag.id })}
                                      className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-primary/10 transition-colors flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || '#3b82f6' }} />
                                      {tag.name}
                                    </button>
                                  ))}
                                  {tags?.length === 0 && <p className="text-[10px] text-center py-2 text-muted-foreground">No hay etiquetas</p>}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="h-[1px] bg-border/50" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                        onClick={() => deleteFolder.mutate(folder.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Eliminar Carpeta
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                {folder.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {folder.tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="w-2 h-2 rounded-full shadow-sm"
                        style={{ backgroundColor: tag.color || '#3b82f6' }}
                        title={tag.name}
                      />
                    ))}
                  </div>
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="pt-6 border-t border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
            <TagIcon className="w-4 h-4" />
            Gestionar Etiquetas
          </h3>
        </div>

        <form onSubmit={handleCreateTag} className="flex gap-2 mb-4">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Nueva etiqueta..."
            className="h-8 text-xs"
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="w-8 h-8 rounded-md cursor-pointer border-none bg-transparent"
          />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={createTag.isPending}>
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {tags?.map((tag) => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: `${tag.color || '#3b82f6'}20`, color: tag.color || '#3b82f6', borderColor: `${tag.color || '#3b82f6'}40` }}
              className="group/tag pr-1"
            >
              {tag.name}
              <X
                className="w-3 h-3 ml-1 cursor-pointer opacity-0 group-hover/tag:opacity-100 transition-opacity hover:text-destructive"
                onClick={() => deleteTag.mutate(tag.id)}
              />
            </Badge>
          ))}
        </div>
      </div>
    </div >
  );
}
