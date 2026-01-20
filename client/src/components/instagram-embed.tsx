import { useEffect, useRef, useState } from "react";

interface InstagramEmbedProps {
  url: string;
  embedHtml?: string;
}

export function InstagramEmbed({ url, embedHtml }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Clean URL for fallback
  const cleanUrl = url.split('?')[0].replace(/\/$/, "");

  useEffect(() => {
    // 1. Load Instagram script if not already present
    if (!(window as any).instgrm) {
      const script = document.createElement("script");
      script.src = "//www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process();
          setIsLoaded(true);
        }
      };
    } else {
      // 2. If already loaded, process the new embed
      (window as any).instgrm.Embeds.process();
      setIsLoaded(true);
    }
  }, [url, embedHtml]);

  /**
   * ESTRATEGIA DE RECORTE 9:16:
   * Instagram no permite el uso de iframes limpios sin UI. 
   * Usamos un contenedor "Viewport" con overflow: hidden y aspect-ratio 9:16.
   * Dentro, movemos el embed de Instagram hacia arriba y abajo para ocultar el "ruido".
   */
  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-0 overflow-hidden">
      {/* Viewport 9:16 Rígido */}
      <div
        className="relative shadow-2xl overflow-hidden bg-[#050505]"
        style={{
          width: 'min(100%, 100vh * (9/16))',
          aspectRatio: '9/16',
          maxHeight: '100%',
        }}
      >
        {/* Contenedor que hace el Shift para ocultar Header y Footer */}
        <div
          className="absolute inset-x-0 w-full flex flex-col items-center"
          style={{
            top: '-54px', // Oculta el Header (Foto perfil, nombre, botón seguir)
            height: 'calc(100% + 150px)', // Aumentamos altura para compensar el shift
            transform: 'scale(1.02)', // Pequeño zoom para eliminar bordes finos
          }}
        >
          {embedHtml ? (
            <div
              className="w-full h-full flex justify-center"
              dangerouslySetInnerHTML={{ __html: embedHtml }}
            />
          ) : (
            <div className="w-full flex justify-center">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={cleanUrl + "/"}
                data-instgrm-version="14"
                style={{ width: '100% !important', margin: '0 !important', padding: '0 !important' }}
              >
                {/* Loader placeholder */}
                <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              </blockquote>
            </div>
          )}
        </div>

        {/* Overlay para bloquear clicks en links de Instagram y mantener al usuario en la app */}
        <div className="absolute inset-0 z-20 pointer-events-none hover:pointer-events-auto bg-transparent" />
      </div>
    </div>
  );
}
