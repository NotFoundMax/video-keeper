import { useAuth } from "@/hooks/use-auth";
import { LayoutShell } from "@/components/layout-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, User as UserIcon, Mail, Shield } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold">Profile</h1>

        <Card className="p-8 bg-card border-border shadow-lg">
          <div className="flex flex-col items-center text-center mb-8">
            <Avatar className="w-24 h-24 mb-4 ring-4 ring-primary/20">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-muted-foreground">Member since {new Date().getFullYear()}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center p-4 rounded-xl bg-background/50 border border-border">
              <UserIcon className="w-5 h-5 text-muted-foreground mr-4" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Full Name</p>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
              </div>
            </div>

            <div className="flex items-center p-4 rounded-xl bg-background/50 border border-border">
              <Mail className="w-5 h-5 text-muted-foreground mr-4" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 rounded-xl bg-background/50 border border-border">
              <Shield className="w-5 h-5 text-muted-foreground mr-4" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Account Type</p>
                <p className="font-medium">Free Plan</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </Card>
      </div>
    </LayoutShell>
  );
}
