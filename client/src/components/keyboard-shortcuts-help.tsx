import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const shortcuts = [
  { key: "/", description: "Enfocar búsqueda" },
  { key: "H", description: "Ir a Inicio" },
  { key: "A", description: "Añadir video" },
  { key: "F", description: "Ir a Carpetas" },
  { key: "P", description: "Ir a Perfil" },
  { key: "?", description: "Mostrar esta ayuda" },
  { key: "Esc", description: "Cerrar diálogos" },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => setIsOpen(true);
    window.addEventListener("show-shortcuts", handleShowShortcuts);
    return () => window.removeEventListener("show-shortcuts", handleShowShortcuts);
  }, []);

  return (
    <>
      {/* Floating help button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-24 right-6 md:bottom-6 h-12 w-12 rounded-full shadow-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform z-40"
        onClick={() => setIsOpen(true)}
        title="Atajos de teclado (Shift + ?)"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-8 bg-white dark:bg-slate-900 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Keyboard className="w-6 h-6 text-primary" />
              Atajos de Teclado
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {shortcut.description}
                </span>
                <kbd className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-lg shadow-sm text-slate-900 dark:text-white min-w-[3rem] text-center">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center font-medium">
              💡 <span className="font-bold">Tip:</span> Presiona <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-600 text-xs font-bold mx-1">?</kbd> en cualquier momento para ver esta ayuda
            </p>
          </div>

          <Button
            onClick={() => setIsOpen(false)}
            className="w-full h-12 rounded-xl font-bold mt-4 shadow-lg shadow-primary/20"
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
