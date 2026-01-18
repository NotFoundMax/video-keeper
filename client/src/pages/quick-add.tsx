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
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If auth is loading, wait
    if (isLoading) return;

    // If not logged in, redirect to auth
    if (!user) {
        // We'll let the user login, and hopefully they come back here?
        // Actually, ProtectedRoute logic usually handles this, but since this is a popup,
        // we might want customized behavior. Ideally, the router would have redirected to /auth already
        // if we use ProtectedRoute.
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
      // If we still don't have a URL but have text, maybe the text IS the URL (without protocol?)
      // Let's be strict for now to avoid errors.
      setStatus('error');
      setErrorMsg("No valid URL found in shared content");
      return;
    }

    // Attempt to add video
    const addVideo = async () => {
      try {
        // Determine platform roughly
        let platform = "other";
        const urlStr = url.toLowerCase();
        if (urlStr.includes("youtube.com") || urlStr.includes("youtu.be")) platform = "youtube";
        else if (urlStr.includes("tiktok.com")) platform = "tiktok";
        else if (urlStr.includes("instagram.com")) platform = "instagram";

        await apiRequest("POST", "/api/videos", {
            url,
            title: title || "Quick Saved Video",
            platform,
            isFavorite: false
        });
        
        // Invalidate queries so main dashboard updates if open
        queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
        
        setStatus('success');
        
        // Auto close after 2 seconds
        setTimeout(() => {
            window.close();
        }, 2000);

      } catch (e) {
        setStatus('error');
        setErrorMsg("Error adding video. It might be a duplicate.");
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
  
  // If strict Auth check fails (handled by router wrapper usually), but here as visual backup
  if (!user) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 text-white text-center space-y-4">
              <p>Please log in to save videos.</p>
              <Button onClick={() => window.opener ? window.opener.focus() : window.open('/auth', '_blank')}>Go to Login</Button>
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
              <h2 className="text-xl font-semibold">Saving Video...</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-400 mb-1">Saved!</h2>
                <p className="text-zinc-400 text-sm">Added to your collection.</p>
              </div>
              <p className="text-xs text-zinc-500 mt-4">Closing window...</p>
            </>
          )}

          {status === 'error' && (
            <>
               <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-400 mb-1">Failed</h2>
                <p className="text-zinc-400 text-sm">{errorMsg}</p>
              </div>
              <Button variant="secondary" onClick={() => window.close()} className="mt-4">
                Close
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
