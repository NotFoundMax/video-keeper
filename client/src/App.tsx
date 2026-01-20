import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { ViewModeProvider } from "@/contexts/view-mode-context";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AddVideo from "@/pages/add-video";
import Profile from "@/pages/profile";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import FoldersPage from "@/pages/folders";
import QuickAdd from "@/pages/quick-add";
import PlaylistPage from "@/pages/playlist";
import PlaylistsPage from "@/pages/playlists";


function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/add">
        <ProtectedRoute component={AddVideo} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/folders">
        <ProtectedRoute component={FoldersPage} />
      </Route>
      <Route path="/playlists">
        <ProtectedRoute component={PlaylistsPage} />
      </Route>
      <Route path="/playlists/:id">
        <ProtectedRoute component={PlaylistPage} />
      </Route>
      <Route path="/auth" component={AuthPage} />
      <Route path="/landing" component={Landing} />
      <Route path="/quick-add" component={QuickAdd} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ViewModeProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </ViewModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
