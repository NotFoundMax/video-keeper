import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateVideo } from "@/hooks/use-videos";
import { LayoutShell } from "@/components/layout-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ReactPlayer from "react-player";

export default function AddVideo() {
  const [, setLocation] = useLocation();
  const { mutate: createVideo, isPending } = useCreateVideo();
  
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    platform: "other",
  });
  const [previewError, setPreviewError] = useState(false);

  // Auto-detect platform and fetch title (mock title fetch for now)
  useEffect(() => {
    if (!formData.url) return;

    let detectedPlatform = "other";
    if (formData.url.includes("youtube.com") || formData.url.includes("youtu.be")) detectedPlatform = "youtube";
    else if (formData.url.includes("tiktok.com")) detectedPlatform = "tiktok";
    else if (formData.url.includes("instagram.com")) detectedPlatform = "instagram";
    else if (formData.url.includes("vimeo.com")) detectedPlatform = "vimeo";

    setFormData(prev => ({ ...prev, platform: detectedPlatform }));
    setPreviewError(false);
  }, [formData.url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVideo(formData, {
      onSuccess: () => setLocation("/"),
    });
  };

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold mb-2">Add New Video</h1>
          <p className="text-muted-foreground">Paste a URL from your favorite platform to save it.</p>
        </div>

        <div className="grid gap-8">
          <Card className="p-6 md:p-8 bg-card border-border shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="url">Video URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="url"
                    placeholder="https://youtube.com/watch?v=..."
                    className="pl-10 h-12 text-lg bg-background"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formData.url && !previewError && (
                <div className="rounded-xl overflow-hidden border border-border bg-black/50 aspect-video relative group">
                  <ReactPlayer
                    url={formData.url}
                    width="100%"
                    height="100%"
                    controls={false}
                    light={true} // Use thumbnail preview
                    onError={() => setPreviewError(true)}
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-mono text-white">
                    Preview
                  </div>
                </div>
              )}

              {previewError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid URL</AlertTitle>
                  <AlertDescription>
                    We couldn't load a preview for this video. Please check the URL.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="My awesome video"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select 
                    value={formData.platform} 
                    onValueChange={(val) => setFormData({ ...formData, platform: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="vimeo">Vimeo</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" 
                disabled={isPending || !formData.url}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Save Video
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </LayoutShell>
  );
}
