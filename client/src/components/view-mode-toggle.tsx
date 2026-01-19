import { Grid3x3, LayoutGrid, List } from "lucide-react";
import { useViewMode } from "@/contexts/view-mode-context";
import { Button } from "@/components/ui/button";

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-sm border border-slate-200 dark:border-slate-700">
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        className={`h-9 px-3 rounded-xl transition-all ${viewMode === "grid"
            ? "bg-primary text-white shadow-md"
            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        onClick={() => setViewMode("grid")}
        title="Vista de cuadrícula"
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>

      <Button
        variant={viewMode === "compact" ? "default" : "ghost"}
        size="sm"
        className={`h-9 px-3 rounded-xl transition-all ${viewMode === "compact"
            ? "bg-primary text-white shadow-md"
            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        onClick={() => setViewMode("compact")}
        title="Vista compacta"
      >
        <Grid3x3 className="w-4 h-4" />
      </Button>

      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        className={`h-9 px-3 rounded-xl transition-all ${viewMode === "list"
            ? "bg-primary text-white shadow-md"
            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        onClick={() => setViewMode("list")}
        title="Vista de lista"
      >
        <List className="w-4 h-4" />
      </Button>
    </div>
  );
}
