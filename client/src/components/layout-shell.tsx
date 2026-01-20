import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ThemeToggle } from "@/components/theme-toggle";
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help";
import {
  Home,
  PlusCircle,
  LogOut,
  User as UserIcon,
  Video,
  Menu,
  Folder,
  ListVideo
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

  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  const navItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/add", label: "Añadir", icon: PlusCircle },
    { href: "/playlists", label: "Playlists", icon: ListVideo },
    { href: "/folders", label: "Carpetas", icon: Folder },
    { href: "/profile", label: "Perfil", icon: UserIcon },
  ];
  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 flex flex-col md:flex-row transition-colors">
      {/* Mobile Top Header - Only on subpages, replaced by SearchBar on home */}
      {location !== "/" && (
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-background border-b border-border sticky top-0 z-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 bg-background">
              <img src="/logo.png" alt="Keeper Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-lg font-black font-display tracking-tighter text-foreground uppercase">Keeper</h1>
          </div>
          <ThemeToggle />
        </header>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card h-screen sticky top-0 p-6 z-40 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl shadow-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 bg-background">
            <img src="/logo.png" alt="Keeper Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tighter text-foreground uppercase tracking-[-0.05em]">Keeper</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${isActive
                  ? "bg-primary/10 text-primary font-black"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground font-bold"
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-6 mt-auto space-y-4">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarImage src={user?.profileImageUrl ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-black">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-black truncate">{user?.firstName}</p>
              <p className="text-[10px] font-bold text-muted-foreground truncate uppercase">{user?.email}</p>
            </div>
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl font-bold"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-32 md:pb-8">
        <div className={`${location === "/" ? "p-0" : "p-4 md:p-8"} max-w-7xl mx-auto animate-in fade-in duration-500`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - More compact */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#0F172A] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] z-50 px-4 py-3 border border-white/5 backdrop-blur-lg">
        <div className="flex justify-around items-center">
          {navItems.filter(item => item.href !== "/add").map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-white scale-105' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'fill-white/10' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[8px] font-bold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Global Floating Add Button for Mobile - Replaces Keyboard Shortcuts on mobile */}
      <Link href="/add">
        <Button
          size="icon"
          className="md:hidden fixed bottom-24 right-6 h-14 w-14 rounded-full bg-primary shadow-2xl shadow-primary/40 active:scale-95 z-40 transition-transform"
        >
          <PlusCircle className="h-8 w-8 text-white" />
        </Button>
      </Link>

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />
    </div >
  );
}
