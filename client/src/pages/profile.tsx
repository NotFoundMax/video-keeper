import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Mail, Shield, Share2, Copy, MousePointer2, AlertCircle, Zap, Download, Upload, Database } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { exportCollection, downloadJSON, importCollection } from "@/lib/export-import";

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!user) return null;

  const { data: bookmarkletData } = useQuery<{ code: string }>({
    queryKey: ["/api/videos/bookmarklet-code"],
  });

  const bookmarkletCode = bookmarkletData?.code ?? "";

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonData = await exportCollection();
      const filename = `videoteca-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(jsonData, filename);
      toast({
        title: "✅ Exportación exitosa",
        description: "Tu colección ha sido exportada correctamente",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo exportar la colección",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await importCollection(text);

      if (result.success) {
        toast({
          title: "✅ Importación exitosa",
          description: `Importados: ${result.stats?.videos} videos, ${result.stats?.folders} carpetas, ${result.stats?.tags} etiquetas`,
        });
        // Refresh the page to show new data
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast({
          title: "❌ Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo importar la colección",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-10 py-10 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Mi Perfil</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestiona tu cuenta y preferencias</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <Avatar className="w-32 h-32 mb-6 ring-8 ring-slate-50 dark:ring-slate-800 shadow-inner">
            <AvatarImage src={user.profileImageUrl ?? undefined} />
            <AvatarFallback className="text-3xl bg-primary text-white font-bold">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{user.firstName} {user.lastName}</h2>
          <p className="text-slate-400 dark:text-slate-500 font-medium mt-1">Usuario desde 2024</p>

          <div className="w-full grid grid-cols-1 gap-4 mt-10">
            <div className="flex items-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm mr-4 group-hover:scale-110 transition-transform">
                <UserIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-0.5">Nombre Completo</p>
                <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">{user.firstName} {user.lastName}</p>
              </div>
            </div>

            <div className="flex items-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-none group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mr-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Email</p>
                <p className="font-bold text-slate-700 text-lg">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center p-6 rounded-3xl bg-slate-50 border-none group hover:bg-slate-100 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mr-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Tipo de Cuenta</p>
                <p className="font-bold text-slate-700 text-lg">Plan Premium</p>
              </div>
            </div>
          </div>

          {/* Bookmarklet Section */}
          <div className="w-full mt-10 p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary text-white">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Acceso Rápido</h3>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Guarda videos al instante. Arrastra el botón a tu barra de marcadores.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={bookmarkletCode}
                className="flex-1 h-16 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform cursor-move"
                onClick={(e) => {
                  if (e.currentTarget.protocol === 'javascript:') {
                    e.preventDefault();
                    alert("¡No hagas clic! Arrástrame a tu barra de marcadores (favoritos).");
                  }
                }}
              >
                <MousePointer2 className="w-5 h-5" />
                Arrastrar Marcador
              </a>

              <Button
                variant="outline"
                className="h-16 px-6 rounded-2xl border-primary/20 bg-white text-primary font-bold gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(bookmarkletCode);
                  alert("¡Código copiado! Pégalo como la URL de un nuevo marcador.");
                }}
              >
                <Copy className="w-5 h-5" />
              </Button>
            </div>

            <Alert className="bg-blue-50 border-blue-100 rounded-2xl">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800 font-bold text-xs uppercase tracking-wider">Instrucciones</AlertTitle>
              <AlertDescription className="text-blue-700 text-xs mt-1">
                Para que funcione, asegúrate de estar usando la aplicación desde <b>localhost:5000</b>. Chrome puede bloquear conexiones a 127.0.0.1 desde sitios externos por seguridad.
              </AlertDescription>
            </Alert>
          </div>

          {/* Export/Import Section */}
          <div className="w-full mt-8 p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Backup de Colección</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Exporta tu colección completa para hacer backup o importa una colección previamente guardada.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {isExporting ? (
                  <>Exportando...</>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </>
                )}
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                variant="outline"
                className="h-12 rounded-xl font-bold border-2 border-primary text-primary hover:bg-primary/10"
              >
                {isImporting ? (
                  <>Importando...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            className="mt-10 w-full h-16 rounded-2xl font-bold text-red-500 border border-red-100"
            onClick={() => logout()}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </LayoutShell>
  );
}
