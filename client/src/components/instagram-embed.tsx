import { useEffect, useRef } from "react";

interface InstagramEmbedProps {
  url: string;
  embedHtml?: string;
}

export function InstagramEmbed({ url, embedHtml }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean URL for the fallback
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
        }
      };
    } else {
      // 2. If already loaded, process the new embed
      (window as any).instgrm.Embeds.process();
    }
  }, [url, embedHtml]);

  // If we have official embedHtml from the API, use it. 
  // It's the most reliable way to avoid X-Frame-Options errors.
  if (embedHtml) {
    return (
      <div
        className="w-full h-full bg-black flex items-center justify-center overflow-auto p-2"
        dangerouslySetInnerHTML={{ __html: embedHtml }}
      />
    );
  }

  // Fallback: Using a blockquote instead of a direct iframe.
  // The instagram embed.js script will detect this and turn it into a working embed.
  return (
    <div className="w-full h-full bg-black flex items-center justify-center overflow-auto p-4">
      <div ref={containerRef} className="w-full max-w-[540px]">
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={cleanUrl + "/"}
          data-instgrm-version="14"
          style={{
            background: '#000',
            border: '0',
            borderRadius: '3px',
            boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
            margin: '1px',
            maxWidth: '540px',
            minWidth: '326px',
            padding: '0',
            width: '99.375%'
          }}
        >
          <div style={{ padding: '16px' }}>
            <a
              href={cleanUrl + "/"}
              style={{ background: '#000', lineHeight: '0', textAlign: 'center', textDecoration: 'none', width: '100%' }}
              target="_blank"
              rel="noreferrer"
            >
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#F4F4F4', borderRadius: '50%', flexGrow: 0, height: '40px', marginRight: '14px', width: '40px' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
                  <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', flexGrow: 0, height: '14px', marginBottom: '6px', width: '100px' }}></div>
                  <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', flexGrow: 0, height: '14px', width: '60px' }}></div>
                </div>
              </div>
              <div style={{ padding: '19% 0' }}></div>
              <div style={{ display: 'block', height: '50px', margin: '0 auto 12px', width: '50px' }}></div>
              <div style={{ paddingTop: '8px' }}>
                <div style={{ color: '#3897f0', fontFamily: 'Arial,sans-serif', fontSize: '14px', fontStyle: 'normal', fontWeight: '550', lineHeight: '18px' }}>Ver esta publicación en Instagram</div>
              </div>
            </a>
          </div>
        </blockquote>
      </div>
    </div>
  );
}
