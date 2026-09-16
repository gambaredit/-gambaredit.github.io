import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Columns,
  SplitSquareVertical,
  Download,
  Sparkles,
  RefreshCw,
  Move,
  Pin,
  PinOff,
  Check,
  Layers,
  Eraser,
} from 'lucide-react';
import { ProcessedImageItem, LogoItem, FilterSettings, LogoRemoverRegion } from '../types';

interface BeforeAfterViewerProps {
  currentImage: ProcessedImageItem | null;
  livePreviewUrl: string | null;
  isGeneratingPreview: boolean;
  onDownloadSingle: (img: ProcessedImageItem) => void;
  logos?: LogoItem[];
  onChangeLogos?: (logos: LogoItem[]) => void;
  settings?: FilterSettings;
  onUpdateSettings?: (partial: Partial<FilterSettings>) => void;
  onLivePreviewUpdate?: () => void;
  isSticky?: boolean;
  onToggleSticky?: () => void;
}

// Calculate starting percentage for logos that are positioned via standard presets
function getLogoInitialCoords(logo: LogoItem): { x: number; y: number } {
  if (logo.position === 'custom') {
    return {
      x: Math.max(0, Math.min(92, logo.customX ?? 10)),
      y: Math.max(0, Math.min(92, logo.customY ?? 10)),
    };
  }

  const margin = logo.marginPercent || 4;
  const width = logo.scalePercent || 25;
  const estHeight = width * 0.42;

  switch (logo.position) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-center':
      return { x: 50 - width / 2, y: margin };
    case 'top-right':
      return { x: 100 - width - margin, y: margin };
    case 'middle-left':
      return { x: margin, y: 50 - estHeight / 2 };
    case 'center':
      return { x: 50 - width / 2, y: 50 - estHeight / 2 };
    case 'middle-right':
      return { x: 100 - width - margin, y: 50 - estHeight / 2 };
    case 'bottom-left':
      return { x: margin, y: 100 - estHeight - margin };
    case 'bottom-center':
      return { x: 50 - width / 2, y: 100 - estHeight - margin };
    case 'bottom-right':
      return { x: 100 - width - margin, y: 100 - estHeight - margin };
    default:
      return { x: margin, y: margin };
  }
}

export const BeforeAfterViewer: React.FC<BeforeAfterViewerProps> = ({
  currentImage,
  livePreviewUrl,
  isGeneratingPreview,
  onDownloadSingle,
  logos = [],
  onChangeLogos,
  settings,
  onUpdateSettings,
  onLivePreviewUpdate,
  isSticky = false,
  onToggleSticky,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'drag-editor'>('split');
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [activeDraggingLogoId, setActiveDraggingLogoId] = useState<string | null>(null);
  const [activeDraggingRemoverId, setActiveDraggingRemoverId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // Split Slider Dragging Handler
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    if (activeDraggingLogoId || activeDraggingRemoverId) return;
    setIsSliderDragging(true);
  };

  const handleSliderMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (activeDraggingLogoId || activeDraggingRemoverId) return;
    if (!isSliderDragging && e.type !== 'click') return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    setSliderPosition(percentage);
  };

  // Logo Interactive Mouse Drag-and-Drop Handlers
  const handleLogoMouseDown = (
    e: React.MouseEvent | React.TouchEvent,
    logoId: string,
    currentX: number,
    currentY: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!imageWrapperRef.current) return;

    const rect = imageWrapperRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const clickXPercent = ((clientX - rect.left) / rect.width) * 100;
    const clickYPercent = ((clientY - rect.top) / rect.height) * 100;

    setActiveDraggingLogoId(logoId);
    setSelectedLogoId(logoId);
    setDragOffset({
      x: clickXPercent - currentX,
      y: clickYPercent - currentY,
    });
  };

  // Remover Region Interactive Mouse Drag-and-Drop Handlers
  const handleRemoverMouseDown = (
    e: React.MouseEvent | React.TouchEvent,
    regionId: string,
    currentX: number,
    currentY: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!imageWrapperRef.current) return;

    const rect = imageWrapperRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const clickXPercent = ((clientX - rect.left) / rect.width) * 100;
    const clickYPercent = ((clientY - rect.top) / rect.height) * 100;

    setActiveDraggingRemoverId(regionId);
    setDragOffset({
      x: clickXPercent - currentX,
      y: clickYPercent - currentY,
    });
  };

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (isSliderDragging) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const offsetX = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
        setSliderPosition(percentage);
      }

      if (activeDraggingLogoId && imageWrapperRef.current && onChangeLogos) {
        const rect = imageWrapperRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const rawX = ((clientX - rect.left) / rect.width) * 100 - dragOffset.x;
        const rawY = ((clientY - rect.top) / rect.height) * 100 - dragOffset.y;

        const boundedX = Math.round(Math.max(0, Math.min(92, rawX)) * 10) / 10;
        const boundedY = Math.round(Math.max(0, Math.min(92, rawY)) * 10) / 10;

        const updated = logos.map((l) =>
          l.id === activeDraggingLogoId
            ? { ...l, position: 'custom' as const, customX: boundedX, customY: boundedY }
            : l
        );

        onChangeLogos(updated);
      }

      if (activeDraggingRemoverId && imageWrapperRef.current && onUpdateSettings && settings?.logoRemover) {
        const rect = imageWrapperRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const rawX = ((clientX - rect.left) / rect.width) * 100 - dragOffset.x;
        const rawY = ((clientY - rect.top) / rect.height) * 100 - dragOffset.y;

        const boundedX = Math.round(Math.max(0, Math.min(95, rawX)));
        const boundedY = Math.round(Math.max(0, Math.min(95, rawY)));

        const updatedRegions = settings.logoRemover.regions.map((r) =>
          r.id === activeDraggingRemoverId ? { ...r, x: boundedX, y: boundedY } : r
        );

        onUpdateSettings({
          logoRemover: {
            ...settings.logoRemover,
            regions: updatedRegions,
          },
        });
      }
    },
    [isSliderDragging, activeDraggingLogoId, activeDraggingRemoverId, dragOffset, logos, onChangeLogos, onUpdateSettings, settings]
  );

  const handleGlobalMouseUp = useCallback(() => {
    if (isSliderDragging) {
      setIsSliderDragging(false);
    }
    if (activeDraggingLogoId) {
      setActiveDraggingLogoId(null);
      if (onLivePreviewUpdate) {
        onLivePreviewUpdate();
      }
    }
    if (activeDraggingRemoverId) {
      setActiveDraggingRemoverId(null);
      if (onLivePreviewUpdate) {
        onLivePreviewUpdate();
      }
    }
  }, [isSliderDragging, activeDraggingLogoId, activeDraggingRemoverId, onLivePreviewUpdate]);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalMouseMove);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalMouseMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  if (!currentImage) {
    return (
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[420px] shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
          <Sparkles className="w-8 h-8 text-slate-600" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">Belum Ada Gambar Terpilih</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Silakan upload gambar atau klik tombol contoh demo di atas untuk melihat perbandingan Sebelum vs Sesudah.
        </p>
      </div>
    );
  }

  const originalSrc = currentImage.originalUrl;
  const enhancedSrc =
    livePreviewUrl ||
    currentImage.processedUrl ||
    currentImage.previewUrl ||
    currentImage.originalUrl;

  const enabledLogos = logos.filter((l) => l.enabled && l.url);

  return (
    <div
      id="live-preview-viewer"
      className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4"
    >
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Preview Live: Sebelum vs Sesudah</span>
              </h3>
              {isGeneratingPreview && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 animate-pulse font-medium">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Rendering...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[220px] sm:max-w-xs">
              {currentImage.name}
            </p>
          </div>
        </div>

        {/* View Mode & Sticky Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sticky Pin Toggle */}
          {onToggleSticky && (
            <button
              type="button"
              id="toggle-sticky-preview-btn"
              onClick={onToggleSticky}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                isSticky
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={
                isSticky
                  ? 'Sticky aktif: Preview terkunci saat scroll'
                  : 'Klik untuk mengaktifkan Sticky Preview saat scroll'
              }
            >
              {isSticky ? <Pin className="w-3.5 h-3.5 text-amber-400" /> : <PinOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSticky ? 'Sticky ON' : 'Sticky'}</span>
            </button>
          )}

          {/* Mode Selector */}
          <div className="bg-slate-800/90 p-0.5 rounded-xl border border-slate-700 flex items-center text-xs shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mode slider geser sebelum vs sesudah"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Slider</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('drag-editor')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'drag-editor'
                  ? 'bg-pink-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-pink-300'
              }`}
              title="Mode geser & atur posisi logo dengan mouse"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Geser Logo</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'side-by-side'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Lihat kedua gambar berdampingan"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Berdampingan</span>
            </button>
          </div>

          <button
            type="button"
            id="download-single-btn"
            onClick={() => onDownloadSingle(currentImage)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
            title="Download gambar aktif ini"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Mode Guidance Alert for Drag Mode */}
      {viewMode === 'drag-editor' && (
        <div className="px-3 py-2 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-200 text-xs flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-pink-400 animate-pulse shrink-0" />
            <span>
              <strong>Mode Geser Aktif:</strong> Klik & tahan kotak logo mana saja pada gambar di bawah untuk menggeser posisinya secara bebas.
            </span>
          </div>
          <span className="text-[10px] bg-pink-500 text-white font-black px-2 py-0.5 rounded-md shrink-0">
            {enabledLogos.length} Logo Aktif
          </span>
        </div>
      )}

      {/* Main Canvas / Viewer */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[380px] max-h-[560px]">
        {viewMode === 'split' ? (
          /* Split Slider Mode */
          <div
            ref={containerRef}
            onMouseDown={handleSliderMouseDown}
            onMouseMove={handleSliderMouseMove}
            onTouchStart={handleSliderMouseDown}
            onTouchMove={handleSliderMouseMove}
            onClick={handleSliderMouseMove}
            className="relative w-full h-[450px] sm:h-[500px] select-none cursor-ew-resize overflow-hidden flex items-center justify-center bg-black/40"
          >
            {/* Enhanced Image (Background/Right side) */}
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <img
                src={enhancedSrc}
                alt="Sesudah (AI + Logos)"
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                draggable={false}
              />
            </div>

            {/* Original Image (Clipped Left side) */}
            <div
              className="absolute inset-0 flex items-center justify-center p-2 overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={originalSrc}
                alt="Sebelum (Original)"
                className="max-h-full max-w-full object-contain rounded-lg"
                draggable={false}
              />
            </div>

            {/* Divider Line & Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] z-20 pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border-2 border-indigo-600 text-[10px] font-black pointer-events-auto cursor-grab active:cursor-grabbing">
                ⇄
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-3 left-3 z-10 bg-black/75 backdrop-blur-sm text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-md border border-white/10 pointer-events-none">
              SEBELUM (Asli)
            </div>
            <div className="absolute top-3 right-3 z-10 bg-indigo-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-indigo-400/40 pointer-events-none flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              SESUDAH (AI & Logo)
            </div>

            <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
              <span className="bg-black/70 backdrop-blur-sm text-slate-300 text-[10px] px-3 py-1 rounded-full border border-white/10">
                Geser ke kiri / kanan untuk membandingkan • Atau pilih tombol "Geser Logo" untuk memindahkan posisi watermark
              </span>
            </div>
          </div>
        ) : viewMode === 'drag-editor' ? (
          /* Interactive Logo Drag & Drop Positioning Mode */
          <div
            ref={containerRef}
            className="relative w-full h-[450px] sm:h-[500px] select-none overflow-hidden flex items-center justify-center bg-black/60 p-2"
          >
            {/* The Image Container with exact aspect ratio container */}
            <div
              ref={imageWrapperRef}
              className="relative max-h-full max-w-full flex items-center justify-center"
            >
              <img
                src={enhancedSrc}
                alt="Sesudah"
                className="max-h-[480px] max-w-full object-contain rounded-lg shadow-2xl"
                draggable={false}
              />

              {/* Draggable Watermark Overlays */}
              {enabledLogos.map((logo) => {
                const coords = getLogoInitialCoords(logo);
                const isSelected = selectedLogoId === logo.id || activeDraggingLogoId === logo.id;
                const isCurrentDrag = activeDraggingLogoId === logo.id;

                return (
                  <div
                    key={logo.id}
                    onMouseDown={(e) => handleLogoMouseDown(e, logo.id, coords.x, coords.y)}
                    onTouchStart={(e) => handleLogoMouseDown(e, logo.id, coords.x, coords.y)}
                    style={{
                      left: `${coords.x}%`,
                      top: `${coords.y}%`,
                      width: `${logo.scalePercent}%`,
                    }}
                    className={`absolute cursor-move transition-shadow select-none z-30 group rounded-lg p-1 ${
                      isCurrentDrag
                        ? 'ring-2 ring-pink-400 bg-pink-500/25 shadow-2xl scale-[1.02] cursor-grabbing'
                        : isSelected
                        ? 'ring-2 ring-pink-500/80 bg-pink-500/10 shadow-lg'
                        : 'border-2 border-dashed border-pink-400/50 hover:border-pink-400 hover:bg-pink-500/15'
                    }`}
                  >
                    {/* Logo Image Thumbnail */}
                    <img
                      src={logo.url}
                      alt={logo.name}
                      className="w-full h-auto object-contain pointer-events-none drop-shadow-md"
                      draggable={false}
                    />

                    {/* Drag Handle & Info Tag */}
                    <div
                      className={`absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-lg pointer-events-none transition-all ${
                        isCurrentDrag
                          ? 'bg-pink-600 text-white ring-1 ring-white'
                          : 'bg-slate-900/90 text-pink-300 border border-pink-500/40'
                      }`}
                    >
                      <Move className="w-3 h-3 text-pink-400" />
                      <span className="truncate max-w-[120px]">{logo.name}</span>
                      <span className="font-mono text-[9px] text-white/80 bg-black/40 px-1 rounded">
                        X:{Math.round(coords.x)}% Y:{Math.round(coords.y)}%
                      </span>
                    </div>

                    {/* Corner Grip Markers */}
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-pink-500 border border-white"></div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-500 border border-white"></div>
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-pink-500 border border-white"></div>
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-500 border border-white"></div>
                  </div>
                );
              })}

              {/* Draggable Logo Remover / Replacer Boxes */}
              {settings?.logoRemover?.enabled &&
                settings.logoRemover.regions.map((region) => {
                  if (!region.enabled) return null;
                  const isCurrentDrag = activeDraggingRemoverId === region.id;

                  return (
                    <div
                      key={region.id}
                      onMouseDown={(e) => handleRemoverMouseDown(e, region.id, region.x, region.y)}
                      onTouchStart={(e) => handleRemoverMouseDown(e, region.id, region.x, region.y)}
                      style={{
                        left: `${region.x}%`,
                        top: `${region.y}%`,
                        width: `${region.width}%`,
                        height: `${region.height}%`,
                      }}
                      className={`absolute cursor-move transition-shadow select-none z-40 group rounded-lg p-1 border-2 border-dashed ${
                        isCurrentDrag
                          ? 'border-rose-400 bg-rose-500/30 ring-2 ring-rose-300 shadow-2xl scale-[1.02] cursor-grabbing'
                          : 'border-rose-500/80 bg-rose-950/40 hover:bg-rose-900/50 hover:border-rose-300'
                      }`}
                    >
                      {/* Badge / Info Tag */}
                      <div
                        className={`absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-lg pointer-events-none transition-all ${
                          isCurrentDrag
                            ? 'bg-rose-600 text-white ring-1 ring-white'
                            : 'bg-slate-900/95 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        <Eraser className="w-3 h-3 text-rose-400" />
                        <span className="truncate max-w-[120px]">
                          {region.mode === 'replace-my-logo'
                            ? '🔄 Ganti Logo'
                            : region.mode === 'content-aware-heal'
                            ? '✨ Hapus Bersih'
                            : region.mode === 'cover-badge'
                            ? '🛡️ Plat Logo'
                            : '🌫️ Blur Logo'}
                        </span>
                        <span className="font-mono text-[9px] text-white/80 bg-black/40 px-1 rounded">
                          X:{Math.round(region.x)}% Y:{Math.round(region.y)}%
                        </span>
                      </div>

                      {/* Corner Grip Markers */}
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></div>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></div>
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></div>
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></div>
                    </div>
                  );
                })}

              {enabledLogos.length === 0 && (!settings?.logoRemover?.enabled || settings.logoRemover.regions.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs rounded-lg text-center p-4">
                  <div className="text-slate-300 text-xs">
                    <p className="font-bold text-pink-300 mb-1">Tidak ada logo atau area hapus yang aktif</p>
                    <p className="text-[11px] text-slate-400">
                      Aktifkan minimal 1 logo atau area hapus logo pada panel di bawah untuk menggesernya.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom info bar */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
              <span className="bg-black/80 backdrop-blur-md text-pink-300 text-[10px] font-semibold px-3 py-1 rounded-full border border-pink-500/30 flex items-center gap-1.5 shadow-lg">
                <Move className="w-3 h-3 text-pink-400" />
                Tahan & geser logo mana saja dengan mouse untuk menentukan posisi bebas
              </span>
            </div>
          </div>
        ) : (
          /* Side by Side Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full p-3 max-h-[500px]">
            {/* Original Card */}
            <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-2 min-h-[220px]">
              <span className="absolute top-2 left-2 z-10 bg-black/70 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
                SEBELUM (Asli)
              </span>
              <img
                src={originalSrc}
                alt="Sebelum"
                className="max-h-[360px] max-w-full object-contain rounded"
              />
            </div>

            {/* Enhanced Card */}
            <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-indigo-500/50 shadow-lg flex flex-col items-center justify-center p-2 min-h-[220px]">
              <span className="absolute top-2 left-2 z-10 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-400/40 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                SESUDAH (AI & Multi-Logo)
              </span>
              <img
                src={enhancedSrc}
                alt="Sesudah"
                className="max-h-[360px] max-w-full object-contain rounded"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

