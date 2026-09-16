import React, { useState } from 'react';
import {
  Sparkles,
  Maximize2,
  Zap,
  Sliders,
  Sun,
  Palette,
  CheckCircle2,
  RefreshCw,
  Eye,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { FilterSettings, UpscaleFactor, UpscaleAlgorithm, ProcessedImageItem } from '../types';

interface ImageEnhancementPanelProps {
  settings: FilterSettings;
  onUpdateSettings: (partial: Partial<FilterSettings>) => void;
  onLivePreviewUpdate: () => void;
  currentImage?: ProcessedImageItem | null;
}

export const ImageEnhancementPanel: React.FC<ImageEnhancementPanelProps> = ({
  settings,
  onUpdateSettings,
  onLivePreviewUpdate,
  currentImage,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleUpscaleChange = (factor: UpscaleFactor) => {
    onUpdateSettings({ upscaleFactor: factor });
    onLivePreviewUpdate();
  };

  const handleAlgorithmChange = (algo: UpscaleAlgorithm) => {
    onUpdateSettings({ upscaleAlgorithm: algo });
    onLivePreviewUpdate();
  };

  const handleQuickPreset = (preset: {
    clarity: number;
    detailSharp: number;
    denoise: number;
    vibrance: number;
    autoLevel: boolean;
  }) => {
    onUpdateSettings({
      enhancementClarity: preset.clarity,
      enhancementDetailSharp: preset.detailSharp,
      enhancementDenoise: preset.denoise,
      enhancementColorVibrance: preset.vibrance,
      enhancementAutoLevel: preset.autoLevel,
      // Sync with primary fields for backward compatibility
      clarity: preset.clarity,
      sharpness: preset.detailSharp,
      aiSmoothNeural: preset.denoise,
      vibrance: preset.vibrance,
    });
    onLivePreviewUpdate();
  };

  // Base dimensions calculation
  let baseW = 1080;
  let baseH = 1350;
  if (currentImage) {
    baseW = currentImage.width || 1080;
    baseH = currentImage.height || 1350;
  }
  if (settings.aspectRatio === '1:1') {
    baseW = 1080;
    baseH = 1080;
  } else if (settings.aspectRatio === '16:9') {
    baseW = 1920;
    baseH = 1080;
  } else if (settings.aspectRatio === '9:16') {
    baseW = 1080;
    baseH = 1920;
  } else if (settings.aspectRatio === '4:5') {
    baseW = 1080;
    baseH = 1350;
  }

  const factor = settings.upscaleFactor || 1;
  const outW = Math.round(baseW * factor);
  const outH = Math.round(baseH * factor);
  const outMP = ((outW * outH) / 1000000).toFixed(1);
  const baseMP = ((baseW * baseH) / 1000000).toFixed(1);

  const isEnhancedActive =
    (settings.enhancementClarity || 0) > 0 ||
    (settings.enhancementDetailSharp || 0) > 0 ||
    (settings.enhancementDenoise || 0) > 0 ||
    (settings.enhancementColorVibrance || 0) > 0 ||
    settings.enhancementAutoLevel ||
    (settings.upscaleFactor || 1) > 1;

  return (
    <div
      id="image-enhancement-panel"
      className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Image Upscaling & Enhancement</span>
              </h3>
              {isEnhancedActive ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                  <span>Aktif ({factor}x Res)</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                  <span>Asli 1x</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Perbesar resolusi piksel super-tajam & tingkatkan kejernihan/detail gambar
            </p>
          </div>
        </div>
      </div>

      {/* 1. IMAGE UPSCALING (PERBESAR RESOLUSI) */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Image Upscaling (Perbesar Resolusi)</span>
          </div>
          {/* Live Resolution Pill */}
          <div className="flex items-center gap-1.5 text-[10px] bg-indigo-950/80 text-indigo-200 border border-indigo-500/30 px-2.5 py-1 rounded-lg font-mono">
            <span className="text-slate-400">{baseW}×{baseH}</span>
            <ArrowUpRight className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="font-bold text-emerald-300">
              {outW}×{outH} px ({outMP} MP)
            </span>
          </div>
        </div>

        {/* Upscale Factor Buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { factor: 1, label: '1x Asli', desc: `${baseW}px` },
            { factor: 1.5, label: '1.5x HD', desc: 'Tajam Halus' },
            { factor: 2, label: '2x 2K HD', desc: 'Rekomendasi', highlight: true },
            { factor: 3, label: '3x 3K Ultra', desc: 'Super Detail' },
            { factor: 4, label: '4x 4K Master', desc: 'Maksimum Res' },
          ].map((item) => {
            const isSelected = (settings.upscaleFactor || 1) === item.factor;
            return (
              <button
                key={item.factor}
                type="button"
                id={`upscale-btn-${item.factor}x`}
                onClick={() => handleUpscaleChange(item.factor as UpscaleFactor)}
                className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-600/30 to-indigo-900/40 border-indigo-400 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                } ${item.highlight && !isSelected ? 'border-indigo-500/40' : ''}`}
              >
                {item.highlight && (
                  <span className="absolute -top-1.5 right-1 px-1 py-0.1 bg-indigo-500 text-[8px] font-bold text-white rounded shadow-sm">
                    ★
                  </span>
                )}
                <span className="text-xs font-bold">{item.label}</span>
                <span className="text-[9px] text-slate-400 truncate max-w-full">{item.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Upscale Algorithm Selector */}
        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/60">
          <span className="flex items-center gap-1 font-medium text-slate-300">
            <Layers className="w-3 h-3 text-indigo-400" /> Algoritma Interpolasi:
          </span>
          <div className="flex items-center gap-1">
            {[
              { id: 'bicubic-sharp', label: 'Bicubic Sharp' },
              { id: 'smooth-superres', label: 'Smooth Super-Res' },
              { id: 'edge-preserve', label: 'Edge Detail' },
            ].map((algo) => (
              <button
                key={algo.id}
                type="button"
                onClick={() => handleAlgorithmChange(algo.id as UpscaleAlgorithm)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                  (settings.upscaleAlgorithm || 'bicubic-sharp') === algo.id
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {algo.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. IMAGE ENHANCEMENT (TINGKATKAN KEJERNIHAN & DETAIL) */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Image Enhancement (Kejernihan & Detail)</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-medium">1-Klik Cepat</span>
        </div>

        {/* 1-Click Preset Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() =>
              handleQuickPreset({
                clarity: 0,
                detailSharp: 0,
                denoise: 0,
                vibrance: 0,
                autoLevel: false,
              })
            }
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-left text-xs transition-all"
          >
            <span className="font-bold text-slate-300 block text-[11px]">🌿 Asli (Netral)</span>
            <span className="text-[9px] text-slate-500">Tanpa peningkatan</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickPreset({
                clarity: 70,
                detailSharp: 75,
                denoise: 30,
                vibrance: 45,
                autoLevel: true,
              })
            }
            className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/40 text-left text-xs transition-all ring-1 ring-emerald-500/20"
          >
            <span className="font-bold text-emerald-300 block text-[11px] flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" /> Auto Jernih
            </span>
            <span className="text-[9px] text-emerald-400/70">Optimal & Segar</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickPreset({
                clarity: 90,
                detailSharp: 95,
                denoise: 35,
                vibrance: 50,
                autoLevel: true,
              })
            }
            className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40 hover:bg-cyan-900/40 text-left text-xs transition-all"
          >
            <span className="font-bold text-cyan-300 block text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> 4K Crystal
            </span>
            <span className="text-[9px] text-cyan-400/70">Maksimum Detail</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickPreset({
                clarity: 45,
                detailSharp: 60,
                denoise: 65,
                vibrance: 40,
                autoLevel: true,
              })
            }
            className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/40 hover:bg-purple-900/40 text-left text-xs transition-all"
          >
            <span className="font-bold text-purple-300 block text-[11px] flex items-center gap-1">
              <Eye className="w-3 h-3 text-purple-400" /> Skin & Portrait
            </span>
            <span className="text-[9px] text-purple-400/70">Mulus Natural</span>
          </button>
        </div>

        {/* Auto Level Toggle */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={settings.enhancementAutoLevel}
              onChange={(e) => {
                onUpdateSettings({ enhancementAutoLevel: e.target.checked });
                onLivePreviewUpdate();
              }}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
            />
            <span className="font-semibold text-xs text-emerald-300 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-emerald-400" /> Auto-Level & Dynamic Range Stretch
            </span>
          </label>
          <span className="text-[10px] text-slate-400">Koreksi foto gelap/kabur</span>
        </div>

        {/* Fine Tuning Sliders Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-1.5 text-slate-300">
              <Sliders className="w-3 h-3 text-emerald-400" /> Slider Kustomisasi Detail & Kejernihan
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {showAdvanced ? 'Tutup ▲' : 'Buka Slider ▼'}
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-3 bg-slate-950 border border-slate-800/90 rounded-xl space-y-3.5 text-xs">
              {/* Clarity / De-Haze */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1 font-medium text-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Kejernihan & De-Haze (Clarity)
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {settings.enhancementClarity || settings.clarity || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.enhancementClarity || settings.clarity || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateSettings({ enhancementClarity: val, clarity: val });
                    onLivePreviewUpdate();
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>Alami</span>
                  <span>Kontras Mikro Tajam</span>
                  <span>Maksimum</span>
                </div>
              </div>

              {/* High-Pass Detail Sharpness */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1 font-medium text-cyan-300">
                    <Zap className="w-3 h-3 text-cyan-400" /> Ketajaman Garis & Detail (Sharpness)
                  </span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {settings.enhancementDetailSharp || settings.sharpness || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.enhancementDetailSharp || settings.sharpness || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateSettings({ enhancementDetailSharp: val, sharpness: val });
                    onLivePreviewUpdate();
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>Halus</span>
                  <span>Mata/Rambut/Tekstur Tajam</span>
                  <span>8K Crisp</span>
                </div>
              </div>

              {/* Denoise & JPEG Artifact Reduction */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1 font-medium text-purple-300">
                    <ShieldCheck className="w-3 h-3 text-purple-400" /> Pembersih Noise & Bintik JPG (Denoise)
                  </span>
                  <span className="text-purple-400 font-mono font-bold">
                    {settings.enhancementDenoise || settings.aiSmoothNeural || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.enhancementDenoise || settings.aiSmoothNeural || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateSettings({ enhancementDenoise: val, aiSmoothNeural: val });
                    onLivePreviewUpdate();
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>0% (Asli)</span>
                  <span>Mulus Bersih</span>
                  <span>100% Polish</span>
                </div>
              </div>

              {/* Smart Vibrance */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1 font-medium text-pink-300">
                    <Palette className="w-3 h-3 text-pink-400" /> Saturasi Warna Alami (Smart Vibrance)
                  </span>
                  <span className="text-pink-400 font-mono font-bold">
                    {settings.enhancementColorVibrance || settings.vibrance || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.enhancementColorVibrance || settings.vibrance || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateSettings({ enhancementColorVibrance: val, vibrance: val });
                    onLivePreviewUpdate();
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
