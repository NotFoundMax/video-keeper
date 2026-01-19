import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateVideo, useVideoMetadata } from "@/hooks/use-videos";
import { LayoutShell } from "@/components/layout-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFolders } from "@/hooks/use-folders";
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2, Play } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ReactPlayer from "react-player";

const Player = ReactPlayer as any;

// Helper to format URLs for best compatibility
const getEmbedUrl = (url: string) => {
  try {
    if (url.includes("youtube.com/shorts/")) {
      return url.replace("youtube.com/shorts/", "youtube.com/watch?v=");
    }
    return url;
  } catch (e) {
    return url;
  }
};

export default function AddVideo() {
  const [, setLocation] = useLocation();
  const { mutate: createVideo, isPending } = useCreateVideo();
  const { mutate: fetchMetadata, isPending: isFetchingMetadata } = useVideoMetadata();
  const { data: folders } = useFolders();

  const [formData, setFormData] = useState({
    url: "",
    title: "",
    platform: "other",
    thumbnailUrl: "" as string | undefined,
    category: "general",
    folderId: undefined as number | undefined,
  });
  const [previewError, setPreviewError] = useState(false);

  // Handle incoming shared content
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get("url");
    const sharedText = params.get("text");
    const sharedTitle = params.get("title");

    // Some apps put the URL in the 'text' field
    const urlToUse = sharedUrl || (sharedText?.startsWith("http") ? sharedText : "");
    const titleToUse = sharedTitle || (!sharedText?.startsWith("http") ? sharedText : "");

    if (urlToUse) {
      setFormData(prev => ({
        ...prev,
        url: urlToUse,
        title: titleToUse || prev.title
      }));
    }
  }, []);

  // Auto-detect platform and fetch metadata
  useEffect(() => {
    if (!formData.url || !formData.url.startsWith("http")) return;

    const timer = setTimeout(() => {
      fetchMetadata(formData.url, {
        onSuccess: (data: any) => {
          setFormData(prev => ({
            ...prev,
            title: prev.title || data.title,
            platform: data.platform,
            thumbnailUrl: data.thumbnail
          }));
        }
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.url, fetchMetadata]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVideo(formData, {
      onSuccess: () => setLocation("/"),
    });
  };

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-10 py-10 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Añadir Video</h1>
          <p className="text-slate-500 font-medium">Guarda tus videos favoritos de cualquier plataforma</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">URL del Video</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-focus-within:bg-primary/10 transition-colors">
                  <LinkIcon className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                  id="url"
                  placeholder="https://youtube.com/watch?v=..."
                  className="pl-16 h-16 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg font-medium"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                />
              </div>
            </div>

            {formData.url && !previewError && (
              <div className={`rounded-[2rem] overflow-hidden bg-slate-100 relative group flex items-center justify-center shadow-inner transition-all duration-500 ${formData.platform === 'tiktok' || formData.platform === 'instagram' || formData.url.includes('/shorts/')
                  ? "aspect-[9/16] max-w-[300px] mx-auto ring-4 ring-slate-900/5"
                  : "aspect-video"
                }`}>
                {isFetchingMetadata ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Analizando...</p>
                  </div>
                ) : (
                  <>
                    {formData.thumbnailUrl ? (
                      <div className="w-full h-full relative group/preview">
                        <img
                          src={formData.thumbnailUrl}
                          alt="Preview"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/preview:bg-black/30 transition-all">
                          <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20 transform transition-transform group-hover/preview:scale-110">
                            <Play className="w-8 h-8 text-white fill-white translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Player
                        url={getEmbedUrl(formData.url)}
                        width="100%"
                        height="100%"
                        controls={false}
                        light={true}
                        onError={() => setPreviewError(true)}
                      />
                    )}
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-white z-10 border border-white/10">
                      Vista Previa
                    </div>
                  </>
                )}
              </div>
            )}

            {previewError && (
              <Alert className="rounded-2xl border-red-100 bg-red-50 text-red-600">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <AlertTitle className="font-bold">URL Inválida</AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-80">
                  No pudimos cargar una vista previa para este video. Por favor, verifica la URL.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Título</label>
                  {isFetchingMetadata && (
                    <div className="flex items-center text-[10px] text-primary font-bold uppercase tracking-widest animate-pulse">
                      Cargando...
                    </div>
                  )}
                </div>
                <Input
                  id="title"
                  placeholder="Mi video increíble"
                  className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Plataforma</label>
                <Select
                  value={formData.platform}
                  onValueChange={(val) => setFormData({ ...formData, platform: val })}
                >
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 font-bold">
                    <SelectValue placeholder="Seleccionar plataforma" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="other">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Categoría</label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 font-bold">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="music">Música</SelectItem>
                    <SelectItem value="education">Educación</SelectItem>
                    <SelectItem value="entertainment">Entretenimiento</SelectItem>
                    <SelectItem value="tutorials">Tutoriales</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Carpeta</label>
                <Select
                  value={formData.folderId?.toString() || "none"}
                  onValueChange={(val) => setFormData({ ...formData, folderId: val === "none" ? undefined : parseInt(val) })}
                >
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 font-bold">
                    <SelectValue placeholder="Sin carpeta" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="none">Sin carpeta</SelectItem>
                    {folders?.map((f: any) => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-16 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 mt-4"
              disabled={isPending || !formData.url}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 mr-3" />
                  Guardar Video
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </LayoutShell>
  );
}
