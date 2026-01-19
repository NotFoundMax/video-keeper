import { useEffect } from "react";
import { useLocation } from "wouter";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Exception: Allow '/' to focus search even in inputs if it's empty
        if (event.key !== "/") {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

// Global keyboard shortcuts hook for the entire app
export function useGlobalShortcuts() {
  const [, setLocation] = useLocation();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "/",
      description: "Enfocar búsqueda",
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
    },
    {
      key: "h",
      description: "Ir a Inicio",
      action: () => setLocation("/"),
    },
    {
      key: "a",
      description: "Añadir video",
      action: () => setLocation("/add"),
    },
    {
      key: "f",
      description: "Ir a Carpetas",
      action: () => setLocation("/folders"),
    },
    {
      key: "p",
      description: "Ir a Perfil",
      action: () => setLocation("/profile"),
    },
    {
      key: "?",
      shift: true,
      description: "Mostrar atajos",
      action: () => {
        // This will be handled by a separate component
        const event = new CustomEvent("show-shortcuts");
        window.dispatchEvent(event);
      },
    },
    {
      key: "Escape",
      description: "Cerrar diálogos",
      action: () => {
        // Close any open dialogs
        const closeButtons = document.querySelectorAll('[role="dialog"] button');
        if (closeButtons.length > 0) {
          (closeButtons[0] as HTMLButtonElement).click();
        }
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
