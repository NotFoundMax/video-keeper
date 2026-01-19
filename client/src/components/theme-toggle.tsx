import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl bg-white dark:bg-slate-900">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`rounded-xl cursor-pointer ${theme === "light" ? "bg-primary/10 text-primary" : ""}`}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span className="font-bold">Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`rounded-xl cursor-pointer ${theme === "dark" ? "bg-primary/10 text-primary" : ""}`}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className="font-bold">Oscuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`rounded-xl cursor-pointer ${theme === "system" ? "bg-primary/10 text-primary" : ""}`}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span className="font-bold">Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
