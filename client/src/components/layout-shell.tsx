import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  PlusCircle, 
  LogOut, 
  User as UserIcon, 
  Video,
  Menu
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetTitle
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LayoutShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/add", label: "Add Video", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl h-screen sticky top-0 p-6 z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight text-white">VidStack</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-6 mt-auto">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar>
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.firstName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-accent">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold font-display text-lg">VidStack</span>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] bg-card border-l border-border">
            <SheetTitle className="hidden">Navigation</SheetTitle>
            <div className="flex flex-col h-full mt-8">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl text-lg ${
                        isActive 
                          ? "bg-primary/10 text-primary font-semibold" 
                          : "text-muted-foreground"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              
              <div className="mt-auto pt-8 border-t border-border">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={() => logout()}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 md:pb-8 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border pb-safe z-40">
        <div className="flex justify-around items-center h-16 px-2">
          <Link href="/" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          
          <Link href="/add">
            <div className="relative -top-5">
              <div className="bg-gradient-to-tr from-primary to-accent p-4 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 active:scale-95">
                <PlusCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </Link>

          <Link href="/profile" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${location === '/profile' ? 'text-primary' : 'text-muted-foreground'}`}>
            <UserIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
