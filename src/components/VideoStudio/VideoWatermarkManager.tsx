import React, { useRef } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Move,
  RotateCw,
  Eye,
  Sun,
  ShieldCheck,
  Crosshair,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  VideoWatermarkItem,
  LogoPosition,
} from '../../types';

interface VideoWatermarkManagerProps {
  watermarks: VideoWatermarkItem[];
  onChangeWatermarks: (watermarks: VideoWatermarkItem[]) => void;
}

export const VideoWatermarkManager: React.FC<VideoWatermarkManagerProps> = ({
  watermarks,
  onChangeWatermarks,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle transparent PNG upload
  const handleUploadPng = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: VideoWatermarkItem[] = [];

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, '');

      newItems.push({
        id: `wm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name,
        url,
        file,
        enabled: true,
        position: 'custom',
        customX: 85,
        customY: 10,
        scalePercent: 18,
        opacity: 0.95,
        rotation: 0,
        dropShadow: true,
        glowEffect: false,
        glowColor: '#00f0ff',
        animation: 'none',
      });
    });

    onChangeWatermarks([...watermarks, ...newItems]);
  };

  // Add a preset sample transparent watermark
  const handleAddSampleLogo = () => {
    // Generate a clean transparent SVG badge as data URL
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="70" viewBox="0 0 240 70">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ec4899" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="230" height="60" rx="14" fill="rgba(15,23,42,0.85)" stroke="url(#grad)" stroke-width="3" />
      <circle cx="35" cy="35" r="18" fill="url(#grad)" />
      <path d="M28 35 L33 40 L43 28" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <text x="65" y="34" fill="#ffffff" font-family="Montserrat, sans-serif" font-weight="900" font-size="16" letter-spacing="1">OFFICIAL</text>
      <text x="65" y="52" fill="#fbbf24" font-family="Montserrat, sans-serif" font-weight="700" font-size="12">VIRAL CREATOR</text>
    </svg>`;

    const sampleUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;

    const newItem: VideoWatermarkItem = {
      id: `wm-sample-${Date.now()}`,
      name: 'Logo Official Creator (Sample)',
      url: sampleUrl,
      enabled: true,
      position: 'custom',
      customX: 85,
      customY: 10,
      scalePercent: 22,
      opacity: 0.95,
      rotation: 0,
      dropShadow: true,
      glowEffect: true,
      glowColor: '#ec4899',
      animation: 'float',
    };

    onChangeWatermarks([...watermarks, newItem]);
  };

  const updateItem = (id: string, partial: Partial<VideoWatermarkItem>) => {
    onChangeWatermarks(
      watermarks.map((item) => (item.id === id ? { ...item, ...partial } : item))
    );
  };

  const removeItem = (id: string) => {
    onChangeWatermarks(watermarks.filter((item) => item.id !== id));
  };

  const dpadPresets = [
    { label: '↖️ Kiri Atas', x: 12, y: 8, pos: 'top-left' as LogoPosition },
    { label: '⬆️ Atas Tengah', x: 50, y: 8, pos: 'custom' as LogoPosition },
    { label: '↗️ Kanan Atas', x: 88, y: 8, pos: 'top-right' as LogoPosition },
    { label: '⬅️ Kiri Tengah', x: 12, y: 50, pos: 'custom' as LogoPosition },
    { label: '🎯 Tengah Layar', x: 50, y: 50, pos: 'center' as LogoPosition },
    { label: '➡️ Kanan Tengah', x: 88, y: 50, pos: 'custom' as LogoPosition },
    { label: '↙️ Kiri Bawah', x: 12, y: 92, pos: 'bottom-left' as LogoPosition },
    { label: '⬇️ Bawah Tengah', x: 50, y: 92, pos: 'custom' as LogoPosition },
    { label: '↘️ Kanan Bawah', x: 88, y: 92, pos: 'bottom-right' as LogoPosition },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Upload & Geser Logo / Watermark PNG Transparan</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {watermarks.filter((w) => w.enabled).length} Aktif
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Geser dan tempatkan logo branding Anda ke posisi mana pun di video secara bebas dan presisi
            </p>
          </div>
        </div>

        {/* Upload & Sample Buttons */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/webp,image/svg+xml,image/jpeg"
            multiple
            onChange={(e) => handleUploadPng(e.target.files)}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleAddSampleLogo}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Contoh Logo</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Logo PNG</span>
          </button>
        </div>
      </div>

      {/* Watermarks List */}
      {watermarks.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">
              Klik untuk Unggah Logo PNG Transparan Milik Anda
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Mendukung file PNG transparan, WebP, dan SVG (Bisa upload lebih dari satu logo dan digeser bebas)
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {watermarks.map((wm, idx) => {
            const currentX = wm.customX ?? 85;
            const currentY = wm.customY ?? 10;

            return (
              <div
                key={wm.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  wm.enabled
                    ? 'bg-slate-950/70 border-slate-800'
                    : 'bg-slate-950/30 border-slate-800/50 opacity-60'
                }`}
              >
                {/* Row Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={wm.enabled}
                      onChange={(e) => updateItem(wm.id, { enabled: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                      <img src={wm.url} alt={wm.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200">
                        Logo #{idx + 1}: {wm.name}
                      </span>
                      <span className="block text-[10px] text-cyan-400 font-mono">
                        Posisi: X: {currentX}% • Y: {currentY}% • Ukuran: {wm.scalePercent}%
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(wm.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors"
                    title="Hapus Logo Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Main Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Left Column: Visual 2D Screen Touchpad & Quick Matrix */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                        <Move className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Geser Posisi Logo (X: {currentX}%, Y: {currentY}%):</span>
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                        X: {currentX}% • Y: {currentY}%
                      </span>
                    </div>

                    {/* Interactive 2D Mini Screen Touchpad */}
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = Math.round(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
                        const clickY = Math.round(Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100)));
                        updateItem(wm.id, {
                          position: 'custom',
                          customX: clickX,
                          customY: clickY,
                        });
                      }}
                      className="relative w-full h-28 bg-slate-950 rounded-xl border-2 border-dashed border-slate-800 hover:border-cyan-500/60 cursor-crosshair overflow-hidden transition-all group"
                      title="Klik di mana saja pada layar ini untuk memindahkan posisi logo"
                    >
                      {/* Grid crosshair guides */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-15 pointer-events-none">
                        <div className="border-r border-b border-white"></div>
                        <div className="border-r border-b border-white"></div>
                        <div className="border-b border-white"></div>
                        <div className="border-r border-b border-white"></div>
                        <div className="border-r border-b border-white"></div>
                        <div className="border-b border-white"></div>
                        <div className="border-r border-white"></div>
                        <div className="border-r border-white"></div>
                        <div></div>
                      </div>

                      {/* Moving Logo Badge on Pad */}
                      <div
                        style={{
                          left: `${currentX}%`,
                          top: `${currentY}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute p-1 bg-cyan-500/30 border border-cyan-400 rounded-lg shadow-lg shadow-cyan-500/40 pointer-events-none flex items-center gap-1 backdrop-blur-sm"
                      >
                        <img src={wm.url} alt="mini" className="w-5 h-5 object-contain" />
                        <span className="text-[9px] font-bold text-white px-1 bg-cyan-600 rounded">LOGO</span>
                      </div>

                      <div className="absolute bottom-1 right-1.5 text-[9px] text-slate-500 pointer-events-none group-hover:text-cyan-400">
                        👆 Klik / Geser di layar mini ini
                      </div>
                    </div>

                    {/* Quick D-Pad 3x3 Position Buttons */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block">Posisi Cepat (9 Titik):</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {dpadPresets.map((dp, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              updateItem(wm.id, {
                                position: 'custom',
                                customX: dp.x,
                                customY: dp.y,
                              })
                            }
                            className="px-2 py-1 bg-slate-800 hover:bg-cyan-950/80 hover:border-cyan-500/50 border border-slate-700/80 text-slate-300 hover:text-cyan-300 text-[10px] rounded-lg font-medium transition-all text-center"
                          >
                            {dp.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Precision Sliders, Scale, Rotation & Effects */}
                  <div className="space-y-3">
                    {/* Precision X & Y Position Sliders */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
                      {/* Horizontal X Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span className="font-semibold">Geser Horizontal (X):</span>
                          <div className="flex items-center gap-1 font-mono text-cyan-400 font-bold">
                            <span>{currentX}%</span>
                            <button
                              type="button"
                              onClick={() => updateItem(wm.id, { position: 'custom', customX: 50 })}
                              className="px-1.5 py-0.2 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                            >
                              Tengah
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(wm.id, {
                                position: 'custom',
                                customX: Math.max(0, currentX - 5),
                              })
                            }
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                          >
                            -5%
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={currentX}
                            onChange={(e) =>
                              updateItem(wm.id, {
                                position: 'custom',
                                customX: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(wm.id, {
                                position: 'custom',
                                customX: Math.min(100, currentX + 5),
                              })
                            }
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                          >
                            +5%
                          </button>
                        </div>
                      </div>

                      {/* Vertical Y Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span className="font-semibold">Geser Vertikal (Y):</span>
                          <div className="flex items-center gap-1 font-mono text-cyan-400 font-bold">
                            <span>{currentY}%</span>
                            <button
                              type="button"
                              onClick={() => updateItem(wm.id, { position: 'custom', customY: 50 })}
                              className="px-1.5 py-0.2 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                            >
                              Tengah
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(wm.id, {
                                position: 'custom',
                                customY: Math.max(0, currentY - 5),
                              })
                            }
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                          >
                            -5%
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={currentY}
                            onChange={(e) =>
                              updateItem(wm.id, {
                                position: 'custom',
                                customY: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(wm.id, {
                                position: 'custom',
                                customY: Math.min(100, currentY + 5),
                              })
                            }
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                          >
                            +5%
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scale, Opacity, Animation & Effects */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Scale & Opacity */}
                      <div className="space-y-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-300">
                            <span>Ukuran:</span>
                            <span className="font-mono text-cyan-400 font-bold">{wm.scalePercent}%</span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={60}
                            value={wm.scalePercent}
                            onChange={(e) =>
                              updateItem(wm.id, { scalePercent: parseInt(e.target.value, 10) })
                            }
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-300">
                            <span>Transparansi:</span>
                            <span className="font-mono text-cyan-400 font-bold">
                              {Math.round(wm.opacity * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.1}
                            max={1.0}
                            step={0.05}
                            value={wm.opacity}
                            onChange={(e) => updateItem(wm.id, { opacity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                        </div>
                      </div>

                      {/* Animation & Shadow */}
                      <div className="space-y-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>Animasi:</span>
                          </label>
                          <select
                            value={wm.animation}
                            onChange={(e) => updateItem(wm.id, { animation: e.target.value as any })}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-lg px-2 py-1 outline-none focus:border-cyan-500"
                          >
                            <option value="none">Statis</option>
                            <option value="float">🌊 Float</option>
                            <option value="pulse">💓 Pulse</option>
                            <option value="bounce">🏀 Bounce</option>
                            <option value="spin-slow">🔄 360° Spin</option>
                          </select>
                        </div>

                        <div className="space-y-1 pt-0.5">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={wm.dropShadow}
                              onChange={(e) => updateItem(wm.id, { dropShadow: e.target.checked })}
                              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                            />
                            <span className="text-[10px] text-slate-200">Shadow 3D</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={wm.glowEffect}
                              onChange={(e) => updateItem(wm.id, { glowEffect: e.target.checked })}
                              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                            />
                            <span className="text-[10px] text-slate-200">Glow Neon</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
