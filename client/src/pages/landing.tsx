import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Layers, Share2, Smartphone } from "lucide-react";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight">VidStack</span>
          </div>
          <Button asChild variant="outline" className="hidden sm:flex border-primary/20 hover:border-primary/50 hover:bg-primary/5">
            <a href="/api/login">Log In</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Abstract Background Blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10" />
        <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[128px] -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight leading-[1.1]">
            All your videos in <br />
            <span className="text-gradient">one aesthetic place.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Curate, organize, and enjoy your favorite content from YouTube, TikTok, and Instagram in a unified, distraction-free space.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
              <a href="/api/login">Get Started for Free</a>
            </Button>
            <Button asChild variant="ghost" size="lg" className="h-14 px-8 text-lg rounded-full hover:bg-white/5">
              <a href="#features">Learn more</a>
            </Button>
          </div>
        </div>
        
        {/* Hero Image / Mockup */}
        <div className="mt-20 max-w-5xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          {/* Unsplash abstract tech image as placeholder for dashboard screenshot */}
          {/* tech dashboard abstract dark */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-card aspect-video flex items-center justify-center group-hover:scale-[1.01] transition duration-500">
             <img 
               src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop" 
               alt="App Dashboard"
               className="w-full h-full object-cover opacity-80"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
             <div className="absolute bottom-10 left-10 text-left">
               <div className="flex gap-2 mb-2">
                 <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">YouTube</span>
                 <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">TikTok</span>
               </div>
               <h3 className="text-3xl font-bold">Unified Dashboard</h3>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-card/30 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Why use VidStack?</h2>
            <p className="text-muted-foreground text-lg">Designed for content curators and video lovers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Layers,
                title: "Centralized Library",
                desc: "Stop switching apps. Keep your learning materials, entertainment, and inspiration all in one searchable library."
              },
              {
                icon: Smartphone,
                title: "Mobile First",
                desc: "Designed for your phone. The interface feels like a native app, perfect for watching on the go."
              },
              {
                icon: Share2,
                title: "Cross-Platform",
                desc: "Works with links from YouTube, Vimeo, TikTok, Instagram Reels, and more. Just paste and play."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-card border border-border hover:border-primary/30 hover:bg-card/80 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary fill-primary" />
            <span className="font-bold font-display">VidStack</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VidStack. Built for the modern web.
          </p>
        </div>
      </footer>
    </div>
  );
}
