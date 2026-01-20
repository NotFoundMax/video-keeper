import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(effectiveTheme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
      onClick={toggleTheme}
      title={`Cambiar a modo ${effectiveTheme === "light" ? "oscuro" : "claro"}`}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
