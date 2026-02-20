"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ChevronUp, ChevronDown, Settings, List, 
  Play, Pause, Volume2, VolumeX, X, Loader2, Gauge, Lock, Crown
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Hls from "hls.js";
import { useVipStatus } from "@/hooks/useVipStatus";

export interface VideoQuality {
  id: string;
  label: string;
  quality: number;
  url: string;
  isDefault?: boolean;
  isHls?: boolean;
}

export interface UniversalEpisode {
  id: string;
  number: number;
  title?: string;
  thumbnail?: string;
  videoQualities: VideoQuality[];
  subtitleUrl?: string;
}

export interface UniversalPlayerProps {
  provider: string;
  bookId: string;
  title: string;
  description?: string;
  episodes: UniversalEpisode[];
  currentEpisodeIndex: number;
  onEpisodeChange: (index: number) => void;
  detailPath?: string;
}

const HD_QUALITY_THRESHOLD = 720;

export default function UniversalPlayer({
  provider,
  bookId,
  title,
  description = "",
  episodes,
  currentEpisodeIndex,
  onEpisodeChange,
  detailPath,
}: UniversalPlayerProps) {
  const router = useRouter();
  const { isVip, maxQuality } = useVipStatus();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayTime, setDisplayTime] = useState({ current: 0, duration: 0 });
  const [selectedQualityId, setSelectedQualityId] = useState<string>("auto");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const totalEpisodes = episodes.length;
  const currentEpisode = episodes[currentEpisodeIndex] || null;

  const qualityOptions = useMemo(() => {
    if (!currentEpisode?.videoQualities?.length) return [];
    
    const allQualities = currentEpisode.videoQualities;
    
    return allQualities
      .map((q) => {
        const isHD = q.quality >= HD_QUALITY_THRESHOLD;
        return {
          ...q,
          isHD,
        };
      })
      .sort((a, b) => b.quality - a.quality);
  }, [currentEpisode]);

  const getCurrentVideo = useCallback((): { url: string; isHls: boolean } | null => {
    if (!currentEpisode?.videoQualities?.length) return null;

    let selectedQ = null;
    if (selectedQualityId === "auto" || !qualityOptions.length) {
      selectedQ = qualityOptions.find(q => q.isDefault) || qualityOptions[0];
    } else {
      selectedQ = qualityOptions.find(q => q.id === selectedQualityId) || qualityOptions[0];
    }
    
    if (!selectedQ) return null;
    
    const isHls = selectedQ.isHls || 
      selectedQ.url.includes('.m3u8') || 
      (selectedQ.url.includes('/api/proxy/video') && selectedQ.url.includes('.m3u8')) ||
      (selectedQ.url.includes('url=') && decodeURIComponent(selectedQ.url).includes('.m3u8'));
    
    return { url: selectedQ.url, isHls };
  }, [currentEpisode, selectedQualityId, qualityOptions]);

  const loadVideo = useCallback((videoUrl: string, isHls: boolean) => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
      });
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
          hls.destroy();
          video.src = videoUrl;
          video.load();
          video.play().catch(() => {});
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      video.load();
      video.play().catch(() => {});
    } else {
      video.src = videoUrl;
      video.load();
      video.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const video = getCurrentVideo();
    if (!video || !videoRef.current) return;

    loadVideo(video.url, video.isHls);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentEpisodeIndex, selectedQualityId, getCurrentVideo, loadVideo]);

  useEffect(() => {
    if (!currentEpisode?.subtitleUrl || !videoRef.current) return;
    
    const video = videoRef.current;
    const subtitleUrl = `/api/proxy/video?url=${encodeURIComponent(currentEpisode.subtitleUrl)}`;
    
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'Indonesia';
    track.srclang = 'id';
    track.default = true;
    track.src = subtitleUrl;
    
    track.onload = () => {
      if (track.track) track.track.mode = 'showing';
    };
    
    video.appendChild(track);
    
    return () => {
      try {
        video.removeChild(track);
      } catch (e) {}
    };
  }, [currentEpisode?.subtitleUrl]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (Math.floor(video.currentTime) !== Math.floor(displayTime.current)) {
      setDisplayTime({ 
        current: video.currentTime, 
        duration: video.duration 
      });
    }
  }, [displayTime.current]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDisplayTime({ 
        current: 0, 
        duration: videoRef.current.duration 
      });
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    if (currentEpisodeIndex < totalEpisodes - 1) {
      onEpisodeChange(currentEpisodeIndex + 1);
    }
  }, [currentEpisodeIndex, totalEpisodes, onEpisodeChange]);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const changePlaybackSpeed = useCallback((speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * displayTime.duration;
    videoRef.current.currentTime = newTime;
    setDisplayTime({ 
      current: newTime, 
      duration: videoRef.current.duration 
    });
  }, [displayTime.duration]);

  const goToPrevEpisode = useCallback(() => {
    if (currentEpisodeIndex > 0) {
      onEpisodeChange(currentEpisodeIndex - 1);
    }
  }, [currentEpisodeIndex, onEpisodeChange]);

  const goToNextEpisode = useCallback(() => {
    if (currentEpisodeIndex < totalEpisodes - 1) {
      onEpisodeChange(currentEpisodeIndex + 1);
    }
  }, [currentEpisodeIndex, totalEpisodes, onEpisodeChange]);

  const formatTime = useCallback((time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          goToPrevEpisode();
          break;
        case "ArrowDown":
          goToNextEpisode();
          break;
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "m":
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevEpisode, goToNextEpisode, togglePlayPause, toggleMute]);

  const backPath = detailPath || `/detail/${provider}/${bookId}`;

  if (!currentEpisode) {
    return (
      <main className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </main>
    );
  }

  return (
    <main 
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      <div className="w-full h-full relative">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          autoPlay
          preload="auto"
          poster={currentEpisode.thumbnail}
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlayPause}
          onCanPlay={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onContextMenu={(e) => e.preventDefault()}
          disablePictureInPicture
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-16 h-16 animate-pulse">
                <Image
                  src="/logo.png"
                  alt="Loading..."
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              </div>
              <span className="text-white/60 text-xs">Loading...</span>
            </div>
          </div>
        )}

        {!isPlaying && !isLoading && showControls && (
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <div className="w-16 h-16 bg-black/60 flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </button>
        )}

        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent safe-top pointer-events-auto">
            <Link 
              href={backPath}
              className="btn-icon bg-black/50"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            
            <div className="flex-1 text-center px-4">
              <h1 className="text-white font-medium text-sm line-clamp-1">
                {title}
              </h1>
              <p className="text-white/60 text-xs">
                EP {currentEpisodeIndex + 1} / {totalEpisodes}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="btn-icon bg-black/50"
                >
                  <Settings className="w-4 h-4 text-white" />
                </button>
                
                {showQualityMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowQualityMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 z-50 min-w-[160px] overflow-hidden">
                      <button
                        onClick={() => { setSelectedQualityId("auto"); setShowQualityMenu(false); }}
                        className={`w-full px-4 py-3 text-left text-sm ${selectedQualityId === "auto" ? 'text-violet-400 bg-white/5' : 'text-white'} hover:bg-white/10 transition-colors`}
                      >
                        Auto
                      </button>
                      {qualityOptions.map((q) => {
                        const isLocked = q.isHD && !isVip;
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              if (isLocked) {
                                setShowQualityMenu(false);
                                router.push('/upgrade');
                                return;
                              }
                              setSelectedQualityId(q.id); 
                              setShowQualityMenu(false); 
                            }}
                            className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between ${
                              isLocked ? 'text-white/40' :
                              selectedQualityId === q.id ? 'text-violet-400 bg-white/5' : 'text-white'
                            } hover:bg-white/10 transition-colors`}
                          >
                            <span className="flex items-center gap-2">
                              {q.label}
                              {q.isHD && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold">
                                  HD
                                </span>
                              )}
                            </span>
                            {isLocked ? (
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                            ) : isVip && q.isHD ? (
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowEpisodeList(true)}
                className="btn-icon bg-black/50"
              >
                <List className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-auto">
            {currentEpisodeIndex > 0 && (
              <button
                onClick={goToPrevEpisode}
                className="btn-icon bg-black/50"
              >
                <ChevronUp className="w-5 h-5 text-white" />
              </button>
            )}
            
            <button onClick={togglePlayPause} className="btn-icon bg-black/50">
              {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
            </button>
            
            <button onClick={toggleMute} className="btn-icon bg-black/50">
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)} 
                className="btn-icon bg-black/50 relative"
              >
                <Gauge className="w-5 h-5 text-white" />
                {playbackSpeed !== 1 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-[9px] font-bold flex items-center justify-center text-white">
                    {playbackSpeed}x
                  </span>
                )}
              </button>
              {showSpeedMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSpeedMenu(false)} />
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/10">
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">Speed</span>
                    </div>
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => changePlaybackSpeed(speed)}
                        className={`w-full px-4 py-2.5 text-left text-sm whitespace-nowrap ${playbackSpeed === speed ? 'text-violet-400 bg-white/5' : 'text-white'} hover:bg-white/10 transition-colors`}
                      >
                        {speed}x {speed === 1 && '(Normal)'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {currentEpisodeIndex < totalEpisodes - 1 && (
              <button
                onClick={goToNextEpisode}
                className="btn-icon bg-black/50"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent safe-bottom pointer-events-auto">
            {description && (
              <button 
                onClick={() => setShowDescription(true)}
                className="text-white/50 text-xs mb-3 line-clamp-1 hover:text-white/80 transition-colors text-left"
              >
                {description}
              </button>
            )}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="tabular-nums">{formatTime(displayTime.current)}</span>
                <div 
                  className="flex-1 h-1 bg-white/20 cursor-pointer"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${displayTime.duration ? (displayTime.current / displayTime.duration) * 100 : 0}%` }}
                  />
                </div>
                <span className="tabular-nums">{formatTime(displayTime.duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEpisodeList && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-50"
            onClick={() => setShowEpisodeList(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 max-h-[70vh] bg-card border-t border-border z-50 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-label">Episodes ({totalEpisodes})</span>
              <button
                onClick={() => setShowEpisodeList(false)}
                className="btn-icon"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-60px)] scrollbar-thin">
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
                {episodes.map((ep, idx) => (
                  <button
                    key={ep.id}
                    onClick={() => { onEpisodeChange(idx); setShowEpisodeList(false); }}
                    className={`
                      aspect-square flex items-center justify-center text-sm font-medium transition-colors
                      ${idx === currentEpisodeIndex
                        ? 'bg-primary text-white' 
                        : 'bg-muted hover:bg-muted/70 text-foreground'
                      }
                    `}
                  >
                    {ep.number}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {showDescription && description && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDescription(false)} />
          <div className="relative w-full max-w-lg bg-zinc-900 rounded-t-3xl p-6 pb-10 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">About This Drama</h3>
              <button 
                onClick={() => setShowDescription(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <h4 className="text-base font-semibold text-white mb-2">{title}</h4>
            <p className="text-sm text-white/70 leading-relaxed">{description}</p>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
              <span className="text-xs text-white/50">Total Episodes: {totalEpisodes}</span>
              <span className="text-xs text-white/50">Current: Episode {currentEpisodeIndex + 1}</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
