import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Scissors,
  FastForward,
  Loader2,
  Move,
  Smartphone,
  Tv,
  Square,
  Maximize,
  Crosshair,
  Shield,
  Type,
  LayoutTemplate,
  Trash2,
  ZoomIn,
  ZoomOut,
  Plus,
} from 'lucide-react';
import {
  VideoItem,
  VideoEditorSettings,
  VideoSegmentItem,
  VideoAspectOption,
  VideoWatermarkItem,
  VideoPartBadgeConfig,
} from '../../types';
import {
  renderCanvasVideoOverlays,
  formatVideoTime,
  recordVideoSegment,
  downloadBlob,
  calculateTargetVideoDimensions,
  DEFAULT_PART_BADGE_CONFIG,
} from '../../utils/videoProcessor';

interface VideoPlayerPreviewProps {
  video: VideoItem;
  settings: VideoEditorSettings;
  segments: VideoSegmentItem[];
  selectedSegmentIndex: number;
  onSelectSegment: (index: number) => void;
  onUpdateSettings: (partial: Partial<VideoEditorSettings>) => void;
}

interface DragTargetState {
  type: 'watermark' | 'part-badge' | 'resize-watermark';
  id?: string;
  startX: number;
  startY: number;
  initialElemX: number;
  initialElemY: number;
  initialScale?: number;
}

export const VideoPlayerPreview: React.FC<VideoPlayerPreviewProps> = ({
  video,
  settings,
  segments,
  selectedSegmentIndex,
  onSelectSegment,
  onUpdateSettings,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const overlayContainerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const watermarkCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [isLoopingSegment, setIsLoopingSegment] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(settings.muteOriginal || false);
  const [isExportingCurrentPart, setIsExportingCurrentPart] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Selected element & direct mouse dragging state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeDragTarget, setActiveDragTarget] = useState<DragTargetState | null>(null);
  const [isSnapX, setIsSnapX] = useState(false);
  const [isSnapY, setIsSnapY] = useState(false);
  const [liveCoords, setLiveCoords] = useState<{ x: number; y: number } | null>(null);

  const activeSegment = segments[selectedSegmentIndex] || segments[0] || {
    index: 0,
    partNumber: 1,
    startTime: 0,
    endTime: video.duration || 180,
    duration: video.duration || 180,
    label: 'Part 1',
  };

  // Helper to resolve effective X & Y percentage for any watermark
  const getWatermarkPosPercent = (wm: VideoWatermarkItem): { x: number; y: number } => {
    if (wm.position === 'top-left') return { x: 15, y: 10 };
    if (wm.position === 'top-right') return { x: 85, y: 10 };
    if (wm.position === 'bottom-left') return { x: 15, y: 90 };
    if (wm.position === 'bottom-right') return { x: 85, y: 90 };
    if (wm.position === 'center') return { x: 50, y: 50 };
    return { x: wm.customX ?? 85, y: wm.customY ?? 10 };
  };

  // Helper to resolve effective X & Y percentage for Part Badge
  const getPartBadgePosPercent = (partBadge: VideoPartBadgeConfig): { x: number; y: number } => {
    if (partBadge.position === 'top-left') return { x: 20, y: 7 };
    if (partBadge.position === 'top-right') return { x: 80, y: 7 };
    if (partBadge.position === 'top-center') return { x: 50, y: 7 };
    if (partBadge.position === 'bottom-left') return { x: 20, y: 92 };
    if (partBadge.position === 'bottom-right') return { x: 80, y: 92 };
    if (partBadge.position === 'bottom-center') return { x: 50, y: 92 };
    if (partBadge.position === 'center') return { x: 50, y: 50 };
    return { x: partBadge.customX ?? 50, y: partBadge.customY ?? 7 };
  };

  // Synchronize canvas resolution when video dimensions or aspect ratio change
  const updateCanvasResolution = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (v && c) {
      const targetDim = calculateTargetVideoDimensions(
        v.videoWidth || 1080,
        v.videoHeight || 1920,
        settings.aspectRatio
      );
      if (c.width !== targetDim.width || c.height !== targetDim.height) {
        c.width = targetDim.width;
        c.height = targetDim.height;
      }
    }
  }, [settings.aspectRatio]);

  // Continuous frame rendering on canvas overlay
  const drawFrame = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    const ctx = c.getContext('2d');
    if (!ctx) return;

    // Ensure canvas internal buffer dimensions match desired aspect ratio
    updateCanvasResolution();

    // Check if video reached segment end while looping is active
    if (settings.splitEnabled && isLoopingSegment && activeSegment) {
      if (v.currentTime >= activeSegment.endTime) {
        v.currentTime = activeSegment.startTime;
      }
    }

    setCurrentTime(v.currentTime);

    // Calculate dynamic part number based on playback mode
    const currentPlayingPart = isLoopingSegment
      ? activeSegment.partNumber
      : settings.splitEnabled && settings.splitDurationSec > 0 && segments.length > 0
      ? Math.min(segments.length, Math.max(1, Math.floor(v.currentTime / settings.splitDurationSec) + 1))
      : activeSegment.partNumber;

    renderCanvasVideoOverlays(
      c,
      ctx,
      v,
      settings,
      currentPlayingPart,
      segments.length || 1,
      v.currentTime,
      watermarkCacheRef.current
    );

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [settings, activeSegment, segments.length, isLoopingSegment, updateCanvasResolution]);

  // Start/stop render loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawFrame]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v) {
      updateCanvasResolution();
      setDuration(v.duration || 0);

      // Seek to segment start
      if (activeSegment) {
        v.currentTime = activeSegment.startTime;
      }
    }
  };

  // When selected segment changes, jump video to that segment start time
  useEffect(() => {
    const v = videoRef.current;
    if (v && activeSegment) {
      v.currentTime = activeSegment.startTime;
      setCurrentTime(activeSegment.startTime);
    }
  }, [selectedSegmentIndex, activeSegment?.startTime]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    const v = videoRef.current;
    if (v) {
      v.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) videoRef.current.muted = nextMuted;
    onUpdateSettings({ muteOriginal: nextMuted });
  };

  // Quick helper to add a sample transparent logo if list is empty
  const handleAddSampleLogo = () => {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 400;
    sampleCanvas.height = 120;
    const sctx = sampleCanvas.getContext('2d');
    if (sctx) {
      sctx.fillStyle = '#06b6d4';
      sctx.beginPath();
      sctx.roundRect(10, 10, 380, 100, 24);
      sctx.fill();
      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 36px "Montserrat", sans-serif';
      sctx.textAlign = 'center';
      sctx.textBaseline = 'middle';
      sctx.fillText('★ OFFICIAL LOGO ★', 200, 60);
    }
    const sampleUrl = sampleCanvas.toDataURL('image/png');
    const newWm: VideoWatermarkItem = {
      id: `wm-${Date.now()}`,
      name: 'Logo Official (Sample)',
      url: sampleUrl,
      enabled: true,
      position: 'custom',
      customX: 85,
      customY: 12,
      scalePercent: 22,
      opacity: 0.95,
      animation: 'none',
      rotation: 0,
      dropShadow: true,
      glowEffect: true,
      glowColor: '#00f0ff',
    };
    onUpdateSettings({ watermarks: [...(settings.watermarks || []), newWm] });
    setSelectedElementId(newWm.id);
  };

  // --- DIRECT MOUSE DRAGGING ENGINE ---
  // Start dragging a Watermark Logo directly with the mouse
  const handleStartDragWatermark = (e: React.PointerEvent, wm: VideoWatermarkItem) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId(wm.id);

    const pos = getWatermarkPosPercent(wm);
    setActiveDragTarget({
      type: 'watermark',
      id: wm.id,
      startX: e.clientX,
      startY: e.clientY,
      initialElemX: pos.x,
      initialElemY: pos.y,
    });
    setLiveCoords({ x: pos.x, y: pos.y });
  };

  // Start resizing a Watermark Logo corner directly with the mouse
  const handleStartResizeWatermark = (e: React.PointerEvent, wm: VideoWatermarkItem) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId(wm.id);

    const pos = getWatermarkPosPercent(wm);
    setActiveDragTarget({
      type: 'resize-watermark',
      id: wm.id,
      startX: e.clientX,
      startY: e.clientY,
      initialElemX: pos.x,
      initialElemY: pos.y,
      initialScale: wm.scalePercent || 20,
    });
  };

  // Start dragging Part Badge directly with the mouse
  const handleStartDragPartBadge = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId('part-badge');

    const partConfig = settings.partBadgeConfig || DEFAULT_PART_BADGE_CONFIG;
    const pos = getPartBadgePosPercent(partConfig);
    setActiveDragTarget({
      type: 'part-badge',
      startX: e.clientX,
      startY: e.clientY,
      initialElemX: pos.x,
      initialElemY: pos.y,
    });
    setLiveCoords({ x: pos.x, y: pos.y });
  };

  // Global window pointer move & up listeners for ultra-smooth drag tracking
  useEffect(() => {
    if (!activeDragTarget) return;

    const handlePointerMove = (e: PointerEvent) => {
      const container = overlayContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const deltaXPercent = ((e.clientX - activeDragTarget.startX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - activeDragTarget.startY) / rect.height) * 100;

      if (activeDragTarget.type === 'watermark' && activeDragTarget.id) {
        let rawX = activeDragTarget.initialElemX + deltaXPercent;
        let rawY = activeDragTarget.initialElemY + deltaYPercent;

        // Snap to center guideline
        let snappedX = false;
        let snappedY = false;
        if (Math.abs(rawX - 50) < 2.5) {
          rawX = 50;
          snappedX = true;
        }
        if (Math.abs(rawY - 50) < 2.5) {
          rawY = 50;
          snappedY = true;
        }

        setIsSnapX(snappedX);
        setIsSnapY(snappedY);

        const clampedX = Math.round(Math.max(4, Math.min(96, rawX)));
        const clampedY = Math.round(Math.max(4, Math.min(96, rawY)));

        setLiveCoords({ x: clampedX, y: clampedY });

        const updatedWatermarks = (settings.watermarks || []).map((w) => {
          if (w.id === activeDragTarget.id) {
            return {
              ...w,
              position: 'custom' as const,
              customX: clampedX,
              customY: clampedY,
            };
          }
          return w;
        });
        onUpdateSettings({ watermarks: updatedWatermarks });
      } else if (activeDragTarget.type === 'resize-watermark' && activeDragTarget.id) {
        // Scaling with mouse drag
        const initialScale = activeDragTarget.initialScale || 20;
        const scaleDelta = (deltaXPercent + deltaYPercent) * 0.8;
        const newScale = Math.round(Math.max(5, Math.min(70, initialScale + scaleDelta)));

        const updatedWatermarks = (settings.watermarks || []).map((w) => {
          if (w.id === activeDragTarget.id) {
            return {
              ...w,
              scalePercent: newScale,
            };
          }
          return w;
        });
        onUpdateSettings({ watermarks: updatedWatermarks });
      } else if (activeDragTarget.type === 'part-badge') {
        let rawX = activeDragTarget.initialElemX + deltaXPercent;
        let rawY = activeDragTarget.initialElemY + deltaYPercent;

        // Snap to center guideline
        let snappedX = false;
        if (Math.abs(rawX - 50) < 2.5) {
          rawX = 50;
          snappedX = true;
        }

        setIsSnapX(snappedX);

        const clampedX = Math.round(Math.max(4, Math.min(96, rawX)));
        const clampedY = Math.round(Math.max(4, Math.min(96, rawY)));

        setLiveCoords({ x: clampedX, y: clampedY });

        const currentConfig = settings.partBadgeConfig || DEFAULT_PART_BADGE_CONFIG;
        onUpdateSettings({
          partBadgeConfig: {
            ...currentConfig,
            position: 'custom',
            customX: clampedX,
            customY: clampedY,
          },
        });
      }
    };

    const handlePointerUp = () => {
      setActiveDragTarget(null);
      setIsSnapX(false);
      setIsSnapY(false);
      setLiveCoords(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activeDragTarget, settings, onUpdateSettings]);

  // Export current selected segment as video
  const handleExportCurrentSegment = async () => {
    const v = videoRef.current;
    if (!v) return;

    setIsExportingCurrentPart(true);
    setExportProgress(0);

    try {
      // Pause current playback
      v.pause();
      setIsPlaying(false);

      const blob = await recordVideoSegment(
        v,
        activeSegment.startTime,
        activeSegment.endTime,
        settings,
        activeSegment.partNumber,
        segments.length || 1,
        (p) => setExportProgress(p)
      );

      const filename = `${video.name.replace(/\.[^/.]+$/, '')}-${settings.partPrefix}-${activeSegment.partNumber}.mp4`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Error exporting segment:', err);
      alert('Gagal mengekspor segmen video. Silakan coba lagi.');
    } finally {
      setIsExportingCurrentPart(false);
      setExportProgress(0);
    }
  };

  // Aspect ratio styling for preview container
  const getAspectClass = () => {
    if (settings.aspectRatio === '9:16') return 'aspect-[9/16] max-w-[340px]';
    if (settings.aspectRatio === '16:9') return 'aspect-[16/9] max-w-[660px]';
    if (settings.aspectRatio === '1:1') return 'aspect-square max-w-[420px]';
    if (settings.aspectRatio === '4:5') return 'aspect-[4/5] max-w-[390px]';
    return 'max-h-[500px] w-auto';
  };

  const currentPartConfig = settings.partBadgeConfig || DEFAULT_PART_BADGE_CONFIG;
  const activeWatermark = settings.watermarks?.find((w) => w.enabled) || settings.watermarks?.[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 text-pink-400 rounded-xl border border-pink-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Preview Video Real-Time & Live Overlays</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {activeSegment.label}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {video.name} • {video.width}x{video.height}px • Total {formatVideoTime(duration)}
            </p>
          </div>
        </div>

        {/* Action: Export Current Part */}
        <button
          type="button"
          onClick={handleExportCurrentSegment}
          disabled={isExportingCurrentPart}
          className="px-3.5 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-600/30 flex items-center gap-1.5 transition-all"
        >
          {isExportingCurrentPart ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Merekam Part ({exportProgress}%)</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download {activeSegment.label.split(' ')[0]} {activeSegment.partNumber} (.MP4)</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Aspect Ratio Presets Bar including Facebook Reels */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-950/70 border border-slate-800/80 rounded-xl">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Smartphone className="w-3.5 h-3.5 text-pink-400" />
          <span>Ukuran Rasio Video:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Facebook Reels (9:16) */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ aspectRatio: '9:16' })}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              settings.aspectRatio === '9:16'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-white/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>FB Reels (9:16)</span>
          </button>

          {/* Facebook Feed (4:5) */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ aspectRatio: '4:5' })}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              settings.aspectRatio === '4:5'
                ? 'bg-pink-600 text-white shadow-md ring-1 ring-white/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>FB Feed (4:5)</span>
          </button>

          {/* Square (1:1) */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ aspectRatio: '1:1' })}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              settings.aspectRatio === '1:1'
                ? 'bg-pink-600 text-white shadow-md ring-1 ring-white/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Square (1:1)</span>
          </button>

          {/* Landscape (16:9) */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ aspectRatio: '16:9' })}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              settings.aspectRatio === '16:9'
                ? 'bg-pink-600 text-white shadow-md ring-1 ring-white/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Landscape (16:9)</span>
          </button>

          {/* Original */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ aspectRatio: 'original' })}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              settings.aspectRatio === 'original'
                ? 'bg-pink-600 text-white shadow-md ring-1 ring-white/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>Rasio Asli</span>
          </button>
        </div>

        {/* Fit Mode */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400">Tampilan:</span>
          <select
            value={settings.fitMode}
            onChange={(e) => onUpdateSettings({ fitMode: e.target.value as any })}
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700 outline-none"
          >
            <option value="fit-contain">Fit Utuh (Letterbox)</option>
            <option value="crop-center">Crop Penuh Layar</option>
            <option value="blur-background">Blur Background (Viral Reels)</option>
          </select>
        </div>
      </div>

      {/* Interactive Drag-and-Drop & Logo Quick-Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-pink-950/50 border border-indigo-500/40 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
            <Move className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>🖱️ Drag Langsung Logo & Teks Part dengan Mouse</span>
              {activeDragTarget && (
                <span className="px-2 py-0.5 text-[10px] font-mono bg-pink-500 text-white rounded-full animate-pulse font-extrabold shadow-sm">
                  DRAGGING {activeDragTarget.type === 'watermark' ? 'LOGO' : 'PART'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              Arahkan kursor mouse langsung ke logo atau teks part di layar video lalu seret ke posisi mana saja.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(!settings.watermarks || settings.watermarks.length === 0) && (
            <button
              type="button"
              onClick={handleAddSampleLogo}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Logo Contoh untuk Digeser</span>
            </button>
          )}

          {/* Direct element selectors */}
          <button
            type="button"
            onClick={() => setSelectedElementId('part-badge')}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              selectedElementId === 'part-badge'
                ? 'bg-pink-600 text-white shadow-md ring-2 ring-pink-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-pink-300" />
            <span>🏷️ Teks Part ({currentPartConfig.customX ?? 50}%, {currentPartConfig.customY ?? 7}%)</span>
          </button>

          {(settings.watermarks || []).map((wm, idx) => {
            const wmPos = getWatermarkPosPercent(wm);
            const isSel = selectedElementId === wm.id;
            return (
              <button
                key={wm.id}
                type="button"
                onClick={() => setSelectedElementId(wm.id)}
                className={`px-3 py-1.5 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  isSel
                    ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-cyan-300" />
                <span>🛡️ {wm.name || `Logo ${idx + 1}`} ({wmPos.x}%, {wmPos.y}%)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Canvas & Video Player Viewport with Direct Mouse Manipulation */}
      <div
        ref={canvasContainerRef}
        className="relative w-full flex items-center justify-center bg-black/95 rounded-2xl overflow-hidden border border-slate-800 min-h-[340px] p-2 select-none"
      >
        {/* Hidden source video element */}
        <video
          ref={videoRef}
          src={video.url}
          playsInline
          crossOrigin="anonymous"
          muted={isMuted}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        {/* Main Render Canvas Wrapper */}
        <div
          ref={overlayContainerRef}
          className="relative inline-block overflow-hidden rounded-xl shadow-2xl mx-auto"
        >
          {/* Canvas Rendering */}
          <canvas
            ref={canvasRef}
            className={`rounded-xl object-contain mx-auto block ${getAspectClass()}`}
          />

          {/* Snap Alignment Guides */}
          {isSnapX && (
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-pink-400 pointer-events-none z-30 shadow-[0_0_8px_#ec4899]" />
          )}
          {isSnapY && (
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-pink-400 pointer-events-none z-30 shadow-[0_0_8px_#ec4899]" />
          )}

          {/* LIVE INTERACTIVE DRAG HANDLE 1: PART BADGE (No duplicate text, pure bounding drag box) */}
          {settings.splitEnabled && settings.autoAddPartWatermark && (
            (() => {
              const partPos = getPartBadgePosPercent(currentPartConfig);
              const isSelected = selectedElementId === 'part-badge';
              const isBeingDragged = activeDragTarget?.type === 'part-badge';

              return (
                <div
                  onPointerDown={handleStartDragPartBadge}
                  style={{
                    left: `${partPos.x}%`,
                    top: `${partPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    minWidth: '140px',
                    minHeight: '44px',
                  }}
                  className={`absolute z-20 cursor-grab active:cursor-grabbing group touch-none select-none flex items-center justify-center p-1 rounded-xl transition-all ${
                    isSelected || isBeingDragged
                      ? 'border-2 border-dashed border-pink-400 bg-pink-500/15 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'hover:border-2 hover:border-dashed hover:border-pink-400/70 hover:bg-pink-500/10'
                  }`}
                  title="Klik & Geser Teks Part dengan Mouse ke Posisi Mana Saja"
                >
                  {/* Subtle drag indicator icon on hover/selected */}
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-opacity ${
                      isSelected || isBeingDragged
                        ? 'opacity-100 bg-pink-600 text-white shadow-md'
                        : 'opacity-0 group-hover:opacity-100 bg-slate-900/90 text-pink-300 border border-pink-500/40'
                    }`}
                  >
                    <Move className="w-3 h-3 text-pink-200" />
                    <span>Geser Part ({partPos.x}%, {partPos.y}%)</span>
                  </div>
                </div>
              );
            })()
          )}

          {/* LIVE INTERACTIVE DRAG HANDLE 2: WATERMARK LOGOS (No duplicate image, pure bounding drag & resize box) */}
          {(settings.watermarks || []).filter((w) => w.enabled).map((wm, idx) => {
            const wmPos = getWatermarkPosPercent(wm);
            const isSelected = selectedElementId === wm.id;
            const isBeingDragged = activeDragTarget?.id === wm.id;
            const boxSize = Math.max(50, (wm.scalePercent || 20) * 1.8);

            return (
              <div
                key={wm.id}
                onPointerDown={(e) => handleStartDragWatermark(e, wm)}
                style={{
                  left: `${wmPos.x}%`,
                  top: `${wmPos.y}%`,
                  width: `${boxSize}px`,
                  height: `${boxSize}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-20 cursor-grab active:cursor-grabbing group touch-none select-none flex items-center justify-center rounded-xl transition-all ${
                  isSelected || isBeingDragged
                    ? 'border-2 border-dashed border-cyan-400 bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'hover:border-2 hover:border-dashed hover:border-cyan-400/70 hover:bg-cyan-500/10'
                }`}
                title={`Klik & Geser Logo ${wm.name || idx + 1} dengan Mouse`}
              >
                {/* Corner Resize Grip */}
                {(isSelected || isBeingDragged) && (
                  <div
                    onPointerDown={(e) => handleStartResizeWatermark(e, wm)}
                    className="absolute -bottom-2 -right-2 w-6 h-6 bg-cyan-500 text-slate-950 rounded-full border-2 border-white cursor-se-resize flex items-center justify-center shadow-lg hover:scale-125 transition-transform z-30"
                    title="Tarik untuk memperbesar / memperkecil ukuran logo"
                  >
                    <ZoomIn className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Coordinates Badge info on hover or drag */}
                <div
                  className={`absolute -top-7 left-1/2 -translate-x-1/2 transition-opacity pointer-events-none bg-slate-900/90 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/40 whitespace-nowrap shadow-lg ${
                    isSelected || isBeingDragged ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  Logo {idx + 1} (X: {wmPos.x}%, Y: {wmPos.y}%)
                </div>
              </div>
            );
          })}

          {/* Real-time live coordinate display banner when dragging */}
          {liveCoords && (
            <div className="absolute top-2 left-2 pointer-events-none bg-black/85 backdrop-blur-md px-3 py-1 rounded-xl border border-pink-500/50 text-xs font-mono text-pink-300 flex items-center gap-2 shadow-2xl z-40">
              <Crosshair className="w-4 h-4 text-pink-400 animate-spin" />
              <span>
                {activeDragTarget?.type === 'watermark' ? '🛡️ Posisi Logo:' : '🏷️ Posisi Part:'}{' '}
                <strong className="text-white">X: {liveCoords.x}%</strong> •{' '}
                <strong className="text-white">Y: {liveCoords.y}%</strong>
              </span>
            </div>
          )}
        </div>

        {/* Center Play Button Overlay when paused */}
        {!isPlaying && !activeDragTarget && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 bg-black/60 hover:bg-pink-600/90 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl transition-transform hover:scale-110 z-10"
          >
            <Play className="w-7 h-7 fill-white translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Timeline Scrubbing Bar with Segment Markers */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300">
          <span className="text-pink-400 font-bold">{formatVideoTime(currentTime)}</span>
          <span className="text-slate-400">
            Segmen {activeSegment.partNumber}: {formatVideoTime(activeSegment.startTime)} -{' '}
            {formatVideoTime(activeSegment.endTime)} (Total: {formatVideoTime(duration)})
          </span>
        </div>

        {/* Timeline Slider with visual Part blocks */}
        <div className="relative w-full">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500 z-10 relative"
          />

          {/* Segment Tick Marks along timeline */}
          {segments.length > 1 && (
            <div className="w-full flex h-1.5 mt-1 rounded-full overflow-hidden gap-0.5 opacity-80">
              {segments.map((seg, idx) => {
                const segPercent = (seg.duration / Math.max(1, duration)) * 100;
                const isCurrent = idx === selectedSegmentIndex;
                return (
                  <div
                    key={seg.index}
                    onClick={() => onSelectSegment(idx)}
                    title={seg.label}
                    style={{ width: `${segPercent}%` }}
                    className={`h-full cursor-pointer transition-colors rounded-sm ${
                      isCurrent
                        ? 'bg-pink-500 ring-1 ring-white'
                        : 'bg-slate-700 hover:bg-indigo-500'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Media Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left: Play/Pause, Seek Reset, Mute, Loop Part */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="p-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl shadow-md shadow-pink-600/30 transition-transform active:scale-95"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (videoRef.current && activeSegment) {
                videoRef.current.currentTime = activeSegment.startTime;
              }
            }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Reset ke Awal Part"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-2.5 rounded-xl transition-colors ${
              isMuted
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsLoopingSegment(!isLoopingSegment)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isLoopingSegment
                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="Ulangi Hanya Part Aktif"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Loop Part {activeSegment.partNumber}</span>
          </button>
        </div>

        {/* Right: Playback Speed & Aspect Ratio Quick Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSpeedChange}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1"
          >
            <FastForward className="w-3 h-3 text-pink-400" />
            <span>{playbackSpeed}x</span>
          </button>

          <select
            value={settings.aspectRatio}
            onChange={(e) => onUpdateSettings({ aspectRatio: e.target.value as any })}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-pink-500 font-bold"
          >
            <option value="9:16">📱 Facebook Reels / TikTok (9:16)</option>
            <option value="4:5">📰 Facebook Feed Portrait (4:5)</option>
            <option value="1:1">⬛ Facebook Square Feed (1:1)</option>
            <option value="16:9">🖥️ Landscape 16:9 (YouTube)</option>
            <option value="original">📐 Rasio Asli Video</option>
          </select>
        </div>
      </div>
    </div>
  );
};
