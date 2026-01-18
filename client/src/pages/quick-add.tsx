import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function QuickAdd() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState("");
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    // If auth is loading, wait
    if (isLoading) return;

    // If not logged in, redirect to auth
    if (!user) {
      return;
    }

    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    let url = params.get("url");
    const title = params.get("title");
    const text = params.get("text");

    // Android/iOS sharing often puts the URL in 'text' instead of 'url'
    if (!url && text) {
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        url = urlMatch[0];
      }
    }

    if (!url) {
      setStatus('error');
      setErrorMsg("No se encontró una URL válida en el contenido compartido");
      return;
    }

    // Attempt to add video
    const addVideo = async () => {
      try {
        // First, fetch metadata to get thumbnail and proper title
        let videoData: any = {
          url,
          title: title || "Video Guardado Rápido",
          platform: "other",
          isFavorite: false
        };

        try {
          addLog("Fetching metadata for URL: " + url);
          const metadataResponseRaw = await apiRequest("POST", "/api/videos/metadata", { url });
          const metadataResponse = await metadataResponseRaw.json();
          addLog("Metadata response: " + JSON.stringify(metadataResponse));

          if (metadataResponse && metadataResponse.title) {
            // ALWAYS use metadata title, never the URL title (which may have (19) prefix)
            videoData.title = metadataResponse.title || "Video sin título";
            videoData.thumbnailUrl = metadataResponse.thumbnail || null;
            videoData.platform = metadataResponse.platform || "other";
            addLog("Using metadata - Title: " + videoData.title);
            addLog("Using metadata - Thumbnail: " + (videoData.thumbnailUrl || "NONE"));
          } else {
            videoData.title = "Video sin título";
            addLog("No metadata response, using default title");
          }
        } catch (metaError) {
          addLog("ERROR fetching metadata: " + metaError);
          // Continue with basic data if metadata fails
        }

        addLog("Saving video with title: " + videoData.title);
        // Now save the video with metadata
        await apiRequest("POST", "/api/videos", videoData);

        // Invalidate queries so main dashboard updates if open
        queryClient.invalidateQueries({ queryKey: ["/api/videos"] });

        setStatus('success');

        // Auto close after 5 seconds to give time to read
        setTimeout(() => {
          window.close();
        }, 5000);

      } catch (e) {
        addLog("ERROR: " + e);
        setStatus('error');
        setErrorMsg("Error al añadir el video. Podría estar duplicado.");
      }
    };

    addVideo();

  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 text-white text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
          <Loader2 className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Sesión requerida</h2>
          <p className="text-zinc-400 max-w-xs">Debes iniciar sesión para poder guardar videos desde el menú compartir.</p>
        </div>
        <Button
          className="w-full max-w-xs bg-primary hover:bg-primary/90"
          onClick={() => setLocation(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
        >
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 text-white shadow-2xl">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
          {status === 'loading' && (
            <>
              <div className="relative">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-semibold">Guardando Video...</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-400 mb-1">¡Guardado!</h2>
                <p className="text-zinc-400 text-sm">Añadido a tu colección.</p>
              </div>
              <p className="text-xs text-zinc-500 mt-4">Cerrando ventana...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-400 mb-1">Falló</h2>
                <p className="text-zinc-400 text-sm">{errorMsg}</p>
              </div>
              <Button variant="secondary" onClick={() => window.close()} className="mt-4">
                Cerrar
              </Button>
            </>
          )}
        </CardContent>

        {/* DEBUG PANEL */}
        {debugLogs.length > 0 && (
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 max-h-64 overflow-y-auto">
            <p className="text-xs font-bold text-amber-500 mb-2">DEBUG LOGS:</p>
            {debugLogs.map((log, i) => (
              <p key={i} className="text-xs text-zinc-400 font-mono mb-1">{log}</p>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
