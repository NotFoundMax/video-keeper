import { useRef } from "react";
import ReactPlayer from "react-player";
const Player = ReactPlayer as any;
import { InstagramEmbed } from "./instagram-embed";

export const getEmbedUrl = (url: string): { type: any; id?: string; url?: string; subtype?: string } => {
  try {
    let cleanUrl = (url || "").trim();
    if (!cleanUrl) return { type: 'other', url: '' };

    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    const urlObj = new URL(cleanUrl);

    // YouTube
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      let videoId = "";
      let isShort = false;

      if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.pathname.includes("/shorts/")) {
        videoId = urlObj.pathname.split("/shorts/")[1];
        isShort = true;
      } else if (urlObj.pathname.includes("/v/")) {
        videoId = urlObj.pathname.split("/v/")[1];
      } else if (urlObj.pathname.includes("/embed/")) {
        videoId = urlObj.pathname.split("/embed/")[1];
      } else {
        videoId = urlObj.searchParams.get("v") || "";
      }

      if (videoId) {
        return {
          type: isShort ? 'youtube-shorts' : 'youtube',
          id: videoId.split('&')[0],
          url: cleanUrl
        };
      }
    }

    // TikTok
    if (urlObj.hostname.includes("tiktok.com")) {
      const matches = urlObj.pathname.match(/\/video\/(\d+)/) || urlObj.pathname.match(/\/(\d+)$/);
      const id = matches ? matches[1] : null;

      if (id) return { type: 'tiktok', id, url: cleanUrl };
      return { type: 'other', url: cleanUrl };
    }

    // Vimeo
    if (urlObj.hostname.includes("vimeo.com")) {
      const parts = urlObj.pathname.split('/').filter(p => p.length > 0);
      const idIndex = parts.findIndex(p => /^\d+$/.test(p));

      if (idIndex !== -1) {
        const id = parts[idIndex];
        const hash = parts[idIndex + 1];
        return {
          type: 'vimeo',
          id: hash ? `${id}?h=${hash}` : id,
          url: cleanUrl
        };
      }
    }

    // Facebook
    if (urlObj.hostname.includes("facebook.com") || urlObj.hostname.includes("fb.watch")) {
      return { type: 'facebook', url: cleanUrl };
    }

    // Instagram
    if (urlObj.hostname.includes("instagram.com")) {
      const isReel = urlObj.pathname.includes("/reel/") || urlObj.pathname.includes("/reels/");
      const isTV = urlObj.pathname.includes("/tv/");
      const isPost = urlObj.pathname.includes("/p/");

      return {
        type: 'instagram',
        id: urlObj.pathname.split('/').filter(Boolean).pop(), // Extract shortcode
        url: cleanUrl,
        subtype: isReel ? 'reel' : isTV ? 'tv' : 'post'
      };
    }

    // Pinterest
    if (urlObj.hostname.includes("pinterest.com") || urlObj.hostname.includes("pin.it")) {
      const matches = urlObj.pathname.match(/\/pin\/(\d+)/) || urlObj.pathname.match(/\/(\d+)\/?$/);
      const id = matches ? matches[1] : null;
      if (id) return { type: 'pinterest', id, url: cleanUrl };
    }

    // Twitch
    if (urlObj.hostname.includes("twitch.tv")) {
      if (urlObj.pathname.includes("/videos/")) {
        const id = urlObj.pathname.split("/videos/")[1]?.split("/")[0];
        if (id) return { type: 'twitch', id, url: cleanUrl };
      } else if (urlObj.pathname.includes("/clip/") || urlObj.hostname.includes("clips.twitch.tv")) {
        const id = urlObj.pathname.split("/").pop()?.split("?")[0];
        if (id) return { type: 'twitch', id, url: cleanUrl };
      } else {
        const channel = urlObj.pathname.split("/").filter(Boolean)[0];
        if (channel) return { type: 'twitch', id: channel, url: cleanUrl };
      }
    }

    return { type: 'other', url: cleanUrl };
  } catch (e) {
    return { type: 'other', url: url || "" };
  }
};

interface VideoPlayerNativeProps {
  video: any;
  isActive?: boolean;
  isVertical?: boolean;
  onEnded?: () => void;
  onProgress?: (seconds: number) => void;
  onPause?: () => void;
  onPlay?: () => void;
  onError?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export function VideoPlayerNative({
  video,
  isActive = true,
  isVertical = false,
  onEnded,
  onProgress,
  onPause,
  onPlay,
  onError,
  className = "",
  autoPlay = true
}: VideoPlayerNativeProps) {
  const videoInfo = getEmbedUrl(video.url);
  const playerRef = useRef<any>(null);

  if (!isActive) return null;

  return (
    <div className={`w-full h-full bg-black relative ${className}`}>
      {videoInfo.type === 'tiktok' ? (
        <div className="w-full h-full relative z-10 overflow-hidden bg-black">
          <div className="absolute inset-0 scale-[1.01] origin-center">
            <iframe
              src={`https://www.tiktok.com/player/v1/${videoInfo.id}?&music_info=1&description=1&autoplay=${autoPlay ? 1 : 0}&muted=0`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      ) : (videoInfo.type === 'youtube' || videoInfo.type === 'youtube-shorts') ? (
        <div className="w-full h-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=${autoPlay ? 1 : 0}&rel=0&start=${video.lastTimestamp || 0}&enablejsapi=1&playsinline=1&origin=${window.location.origin}&widget_referrer=${encodeURIComponent(window.location.href)}${isVertical ? '&controls=1' : ''}`}
            className={`w-full h-full border-0 ${isVertical ? 'scale-[1.01]' : ''}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : videoInfo.type === 'vimeo' ? (
        <div className="w-full h-full bg-black">
          <iframe
            src={`https://player.vimeo.com/video/${videoInfo.id}${videoInfo.id?.includes('?') ? '&' : '?'}autoplay=${autoPlay ? 1 : 0}#t=${video.lastTimestamp || 0}s`}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
          />
        </div>
      ) : videoInfo.type === 'instagram' ? (
        <InstagramEmbed url={video.url} embedHtml={video.embedHtml} />
      ) : videoInfo.type === 'facebook' ? (
        <div className="w-full h-full bg-black">
          <Player
            url={video.url}
            width="100%"
            height="100%"
            playing={isActive && autoPlay}
            controls={true}
            muted={false}
            volume={1}
            ref={playerRef}
            onEnded={onEnded}
            onProgress={({ playedSeconds }: any) => {
              if (onProgress) onProgress(playedSeconds);
            }}
            onPause={onPause}
            onPlay={onPlay}
            onError={onError}
            config={{
              facebook: {
                appId: '1305417370342616', // Optional: standard FB app ID or user provided
                attributes: {
                  'data-show-text': 'false',
                  'data-show-captions': 'false'
                }
              }
            }}
          />
        </div>
      ) : videoInfo.type === 'twitch' ? (
        <div className="w-full h-full bg-black">
          {(() => {
            const isClip = video.url.includes('/clip/') || video.url.includes('clips.twitch.tv');
            const isVideo = video.url.includes('/videos/');
            const parent = window.location.hostname;

            if (isClip) {
              return (
                <iframe
                  src={`https://clips.twitch.tv/embed?clip=${videoInfo.id}&parent=${parent}&autoplay=${autoPlay}`}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              );
            } else {
              const videoParam = isVideo
                ? `video=${videoInfo.id?.startsWith('v') ? videoInfo.id : `v${videoInfo.id}`}`
                : `channel=${videoInfo.id}`;

              return (
                <iframe
                  src={`https://player.twitch.tv/?${videoParam}&parent=${parent}&autoplay=${autoPlay}&muted=false`}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              );
            }
          })()}
        </div>
      ) : videoInfo.type === 'pinterest' ? (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <iframe
            src={`https://assets.pinterest.com/ext/embed.html?id=${videoInfo.id}`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media"
          />
        </div>
      ) : (
        <div className="w-full h-full bg-black">
          <Player
            url={video.url}
            width="100%"
            height="100%"
            playing={isActive && autoPlay}
            controls={true}
            muted={false}
            volume={1}
            ref={playerRef}
            onEnded={onEnded}
            onProgress={({ playedSeconds }: any) => {
              if (onProgress) onProgress(playedSeconds);
            }}
            onPause={onPause}
            onPlay={onPlay}
            onError={onError}
            config={{
              file: {
                attributes: {
                  style: { width: '100%', height: '100%', objectFit: 'contain' }
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
