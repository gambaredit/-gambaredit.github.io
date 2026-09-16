import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Zap,
  Film,
  Palette,
  Radio,
  Camera,
  ChevronDown,
  ChevronUp,
  Sun,
  Flame,
  Image as ImageIcon,
  CheckCircle2,
  Maximize2,
  Crop,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { FilterSettings, AspectRatioOption, FitModeOption } from '../types';
import { PRESET_CONFIGS } from '../utils/presets';

interface PresetSelectorProps {
  settings: FilterSettings;
  onUpdateSettings: (partial: Partial<FilterSettings>) => void;
  onApplyPreset: (presetId: string) => void;
  onLivePreviewUpdate: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  settings,
  onUpdateSettings,
  onApplyPreset,
  onLivePreviewUpdate,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleRatioChange = (ratio: AspectRatioOption) => {
    onUpdateSettings({ aspectRatio: ratio });
    onLivePreviewUpdate();
  };

  const handleFitModeChange = (mode: FitModeOption) => {
    let customY = settings.customCropOffsetY ?? 50;
    if (mode === 'crop-top') customY = 0;
    if (mode === 'crop-center') customY = 50;
    if (mode === 'crop-bottom') customY = 100;

    onUpdateSettings({ fitMode: mode, customCropOffsetY: customY });
    onLivePreviewUpdate();
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Image':
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Film':
        return <Film className="w-4 h-4 text-cyan-400" />;
      case 'Palette':
        return <Palette className="w-4 h-4 text-pink-400" />;
      case 'Radio':
        return <Radio className="w-4 h-4 text-rose-400" />;
      case 'Camera':
        return <Camera className="w-4 h-4 text-indigo-400" />;
      case 'Zap':
      default:
        return <Zap className="w-4 h-4 text-blue-400" />;
    }
  };

  const currentFitMode = settings.fitMode || 'blur-fill';

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white">3. Preset & Penyesuaian Rasio</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                <span>Default: Original (Asli)</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Format 4:5 Feed, proteksi kepala terpotong, watermark logo & opsional filter
            </p>
          </div>
        </div>
      </div>

      {/* Aspect Ratio Selector (Key for FB Algorithm) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 block">
          Rasio Aspek (Ukuran Feed Facebook)
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[
            { id: '4:5', label: '4:5 Feed', sub: 'Rekomendasi FB (Viral)', highlight: true },
            { id: '1:1', label: '1:1 Persegi', sub: 'Standar Post' },
            { id: '16:9', label: '16:9 Lebar', sub: 'Landscape' },
            { id: '9:16', label: '9:16 Story', sub: 'Reels / Cerita' },
            { id: 'original', label: 'Asli', sub: 'Ukuran Asal' },
          ].map((opt) => {
            const isSelected = settings.aspectRatio === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                id={`ratio-btn-${opt.id}`}
                onClick={() => handleRatioChange(opt.id as AspectRatioOption)}
                className={`py-2 px-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-800/40 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                } ${opt.highlight && !isSelected ? 'ring-1 ring-blue-400/40' : ''}`}
              >
                <span className="text-xs font-bold">{opt.label}</span>
                <span className="text-[9px] text-slate-400 truncate max-w-full">{opt.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fit Mode Selector (SOLUSI GAMBAR TERPOTONG / KEPALA TERPOTONG) */}
      {settings.aspectRatio !== 'original' && (
        <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Solusi Pas 4:5 (Cegah Kepala / Objek Terpotong)</span>
            </div>
            <span className="text-[10px] text-indigo-400/80 font-medium">Pilih tampilan pas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1. Fit & Blur Fill (Recommended) */}
            <button
              type="button"
              id="fit-mode-blur-fill"
              onClick={() => handleFitModeChange('blur-fill')}
              className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                currentFitMode === 'blur-fill'
                  ? 'bg-indigo-600/30 border-indigo-400 text-white ring-1 ring-indigo-400 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-md shrink-0 mt-0.5">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Fit + Background Blur</span>
                  </span>
                  {currentFitMode === 'blur-fill' && (
                    <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-semibold">
                      Aktif (Rekomendasi)
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  <b className="text-emerald-400">Foto utuh 100% (Kepala & kaki aman)</b>, sisa ruang diisi blur estetik.
                </p>
              </div>
            </button>

            {/* 2. Crop Focus Top / Head */}
            <button
              type="button"
              id="fit-mode-crop-top"
              onClick={() => handleFitModeChange('crop-top')}
              className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                currentFitMode === 'crop-top'
                  ? 'bg-indigo-600/30 border-indigo-400 text-white ring-1 ring-indigo-400 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="p-1.5 bg-blue-500/20 text-blue-300 rounded-md shrink-0 mt-0.5">
                <Crop className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Crop Penuh - Fokus Kepala</span>
                  {currentFitMode === 'crop-top' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Pangkas penuh tanpa border, <b className="text-blue-300">kepala & wajah tetap aman</b> di atas.
                </p>
              </div>
            </button>

            {/* 3. Crop Focus Center */}
            <button
              type="button"
              id="fit-mode-crop-center"
              onClick={() => handleFitModeChange('crop-center')}
              className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                currentFitMode === 'crop-center' || currentFitMode === 'cover'
                  ? 'bg-indigo-600/30 border-indigo-400 text-white ring-1 ring-indigo-400 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="p-1.5 bg-slate-700/50 text-slate-300 rounded-md shrink-0 mt-0.5">
                <Crop className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white block">Crop Penuh - Fokus Tengah</span>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Potong seimbang tengah (cocok untuk gambar landscape/objek tengah).
                </p>
              </div>
            </button>

            {/* 4. Fit Contain with Dark Canvas */}
            <button
              type="button"
              id="fit-mode-fit-contain"
              onClick={() => handleFitModeChange('fit-contain')}
              className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                currentFitMode === 'fit-contain' || currentFitMode === 'contain'
                  ? 'bg-indigo-600/30 border-indigo-400 text-white ring-1 ring-indigo-400 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="p-1.5 bg-slate-800 text-slate-300 rounded-md shrink-0 mt-0.5">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white block">Fit + Bingkai Hitam Rapi</span>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  100% foto utuh di dalam rasio dengan latar belakang gelap sinematik.
                </p>
              </div>
            </button>
          </div>

          {/* Micro-adjust Vertical Crop slider if user chose crop mode */}
          {(currentFitMode === 'crop-top' || currentFitMode === 'crop-center' || currentFitMode === 'crop-bottom') && (
            <div className="pt-2 border-t border-indigo-500/20">
              <div className="flex justify-between text-[11px] text-indigo-200 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <ArrowUpDown className="w-3 h-3 text-indigo-400" /> Geser Posisi Potong (Atas ↔ Bawah)
                </span>
                <span className="text-indigo-300 font-mono">
                  {settings.customCropOffsetY === 0
                    ? 'Paling Atas (Kepala)'
                    : settings.customCropOffsetY === 50
                    ? 'Tengah'
                    : settings.customCropOffsetY === 100
                    ? 'Paling Bawah'
                    : `${settings.customCropOffsetY}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.customCropOffsetY ?? 0}
                onChange={(e) => {
                  onUpdateSettings({ customCropOffsetY: Number(e.target.value) });
                  onLivePreviewUpdate();
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                <span>0% (Kepala / Atas)</span>
                <span>50% (Tengah)</span>
                <span>100% (Bawah)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preset Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            Pilihan Preset AI-Style & Algoritma
          </label>
          <span className="text-[11px] text-slate-400">
            {settings.presetId === 'original-clean' ? '🌿 Mode Asli Aktif' : '✨ AI Filter Aktif'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PRESET_CONFIGS.map((preset) => {
            const isSelected = settings.presetId === preset.id;
            return (
              <div
                key={preset.id}
                id={`preset-card-${preset.id}`}
                onClick={() => onApplyPreset(preset.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-950/80 to-slate-900 border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isSelected ? 'bg-indigo-500/20 border border-indigo-500/40' : 'bg-slate-800'
                  }`}
                >
                  {getPresetIcon(preset.iconName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-indigo-300' : 'text-slate-200'
                      }`}
                    >
                      {preset.name}
                    </h4>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-1 shadow-sm" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {preset.tagline}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toggle Advanced Tuning Sliders */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-between transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kustomisasi Manual (HDR, Ketajaman, Warna, Neon Glow)</span>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-4 text-xs">
            {/* AI HDR Intensity */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-amber-400" /> AI HDR & Shadow Recovery
                </span>
                <span className="text-amber-400 font-mono">{settings.aiHdrIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.aiHdrIntensity}
                onChange={(e) => {
                  onUpdateSettings({ aiHdrIntensity: Number(e.target.value) });
                  onLivePreviewUpdate();
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* AI Micro-Clarity / Kejernihan */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1 font-medium text-emerald-300">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> AI Micro-Clarity (Super Jernih & De-Haze)
                </span>
                <span className="text-emerald-400 font-mono font-bold">{settings.clarity ?? 70}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.clarity ?? 70}
                onChange={(e) => {
                  onUpdateSettings({ clarity: Number(e.target.value) });
                  onLivePreviewUpdate();
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* AI Neural Polish (Kulit & Permukaan Mulus Glowing) */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1 font-medium text-purple-300">
                  <Sparkles className="w-3 h-3 text-purple-400" /> AI Neural Polish (Mulus Glowing 3D Render)
                </span>
                <span className="text-purple-400 font-mono font-bold">{settings.aiSmoothNeural ?? 45}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.aiSmoothNeural ?? 45}
                onChange={(e) => {
                  onUpdateSettings({ aiSmoothNeural: Number(e.target.value) });
                  onLivePreviewUpdate();
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            {/* Sharpness & Clarity */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Zap className="w-3 h-3 text-cyan-400" /> Ketajaman Detail 8K (Sharpness)
                </span>
                <span className="text-cyan-400 font-mono font-bold">{settings.sharpness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sharpness}
                onChange={(e) => {
                  onUpdateSettings({ sharpness: Number(e.target.value) });
                  onLivePreviewUpdate();
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Vibrance / Color Pop */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Palette className="w-3 h-3 text-pink-400" /> Saturasi Warna (Vibrance)
                </span>
                <span className="text-pink-400 font-mono">{settings.vibrance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.vibrance}
                onChange={(e) => {
                  onUpdateSettings({ vibrance: Number(e.target.value) });
                  onLivePreviewUpdate();
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>

            {/* AI Bloom Glow */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Sun className="w-3 h-3 text-yellow-400" /> AI Specular Bloom / Dreamy Glow
                </span>
                <span className="text-yellow-400 font-mono">{settings.bloomGlow}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.bloomGlow}
                onChange={(e) => {
                  onUpdateSettings({ bloomGlow: Number(e.target.value) });
                  onLivePreviewUpdate();
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>

            {/* Vignette Attention */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  Vignette (Fokus Tengah FB Scroll)
                </span>
                <span className="text-indigo-400 font-mono">{settings.vignette}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.vignette}
                onChange={(e) => {
                  onUpdateSettings({ vignette: Number(e.target.value) });
                  onLivePreviewUpdate();
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Neon Flare / Ray lines toggle */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.neonGlowRays}
                  onChange={(e) => {
                    onUpdateSettings({ neonGlowRays: e.target.checked });
                    onLivePreviewUpdate();
                  }}
                  className="rounded border-slate-700 bg-slate-900 text-pink-500 focus:ring-pink-500/20"
                />
                <span className="font-semibold text-pink-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Efek Neon Streak / Laser Viral
                </span>
              </label>

              {settings.neonGlowRays && (
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400">Warna:</span>
                  <input
                    type="color"
                    value={settings.neonColor}
                    onChange={(e) => {
                      onUpdateSettings({ neonColor: e.target.value });
                      onLivePreviewUpdate();
                    }}
                    className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
