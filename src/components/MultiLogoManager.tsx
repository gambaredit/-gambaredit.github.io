import React, { useState, useRef } from 'react';
import {
  Layers,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  RefreshCw,
  Sun,
  Flame,
  Radio,
  CheckCircle2,
  Sliders,
  Type,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LogoItem, LogoPosition } from '../types';
import {
  INITIAL_LOGOS,
  LOGO_TEMPLATE_PRESETS,
  LogoTemplatePreset,
  createAsupanBadgeDataUrl,
  createBreakingNewsBadgeDataUrl,
  createVerifiedBadgeDataUrl,
} from '../utils/sampleAssets';

interface MultiLogoManagerProps {
  logos: LogoItem[];
  onChangeLogos: (logos: LogoItem[]) => void;
  onLivePreviewUpdate: () => void;
}

const POSITION_OPTIONS: { value: LogoPosition; label: string }[] = [
  { value: 'top-left', label: '↖ Kiri Atas' },
  { value: 'top-center', label: '↑ Tengah Atas' },
  { value: 'top-right', label: '↗ Kanan Atas' },
  { value: 'middle-left', label: '← Kiri Tengah' },
  { value: 'center', label: '• Tengah Pusat' },
  { value: 'middle-right', label: '→ Kanan Tengah' },
  { value: 'bottom-left', label: '↙ Kiri Bawah' },
  { value: 'bottom-center', label: '↓ Tengah Bawah' },
  { value: 'bottom-right', label: '↘ Kanan Bawah' },
  { value: 'custom', label: '🎯 Posisi Bebas (Geser dengan Mouse)' },
];

export const MultiLogoManager: React.FC<MultiLogoManagerProps> = ({
  logos,
  onChangeLogos,
  onLivePreviewUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'asupan' | 'breaking-news' | 'verified' | 'custom-generator'>('asupan');
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(true);

  // Custom Badge Generator State
  const [customText1, setCustomText1] = useState('ASUPAN');
  const [customText2, setCustomText2] = useState('VIRAL HARI INI');
  const [customStyle, setCustomStyle] = useState<'asupan-badge' | 'breaking-news-bar' | 'verified-pill'>('asupan-badge');
  const [customColor1, setCustomColor1] = useState('#ec4899');
  const [customColor2, setCustomColor2] = useState('#06b6d4');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleLogo = (id: string) => {
    const updated = logos.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l));
    onChangeLogos(updated);
    onLivePreviewUpdate();
  };

  const handleUpdateLogo = (id: string, partial: Partial<LogoItem>) => {
    const updated = logos.map((l) => (l.id === id ? { ...l, ...partial } : l));
    onChangeLogos(updated);
    onLivePreviewUpdate();
  };

  const handleRemoveLogo = (id: string) => {
    const updated = logos.filter((l) => l.id !== id);
    onChangeLogos(updated);
    onLivePreviewUpdate();
  };

  // Add custom PNG from user computer
  const handleAddCustomLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const newLogo: LogoItem = {
      id: `custom-logo-${Date.now()}`,
      name: `Logo ${logos.length + 1}: ${file.name.replace(/\.[^/.]+$/, '')}`,
      url,
      file,
      enabled: true,
      position: logos.length === 0 ? 'top-left' : logos.length === 1 ? 'bottom-left' : 'top-right',
      scalePercent: 25,
      opacity: 0.95,
      marginPercent: 4,
      dropShadow: true,
      glowEffect: false,
      glowColor: '#3b82f6',
    };

    onChangeLogos([...logos, newLogo]);
    onLivePreviewUpdate();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Apply template directly (replace matching position or add new)
  const handleApplyPresetTemplate = (preset: LogoTemplatePreset, targetLogoId?: string) => {
    if (targetLogoId) {
      // Replace existing
      const updated = logos.map((l) => {
        if (l.id === targetLogoId) {
          return {
            ...l,
            name: preset.name,
            url: preset.dataUrl,
            glowEffect: !!preset.glowColor,
            glowColor: preset.glowColor || l.glowColor,
            enabled: true,
          };
        }
        return l;
      });
      onChangeLogos(updated);
    } else {
      // Add or replace smart position
      const existingAtPositionIndex = logos.findIndex((l) => l.position === preset.defaultPosition);

      if (existingAtPositionIndex >= 0) {
        const updated = [...logos];
        updated[existingAtPositionIndex] = {
          ...updated[existingAtPositionIndex],
          name: preset.name,
          url: preset.dataUrl,
          glowEffect: !!preset.glowColor,
          glowColor: preset.glowColor || updated[existingAtPositionIndex].glowColor,
          enabled: true,
        };
        onChangeLogos(updated);
      } else {
        const newLogo: LogoItem = {
          id: `preset-logo-${Date.now()}`,
          name: preset.name,
          url: preset.dataUrl,
          enabled: true,
          position: preset.defaultPosition,
          scalePercent: preset.defaultScale,
          opacity: 0.95,
          marginPercent: 4,
          dropShadow: true,
          glowEffect: !!preset.glowColor,
          glowColor: preset.glowColor || '#ec4899',
        };
        onChangeLogos([...logos, newLogo]);
      }
    }
    onLivePreviewUpdate();
  };

  // Generate Custom Badge
  const handleCreateCustomBadge = () => {
    let url = '';
    let defaultPos: LogoPosition = 'top-left';
    let defaultScale = 25;

    if (customStyle === 'asupan-badge') {
      url = createAsupanBadgeDataUrl(customText1, customText2, customColor1, customColor2, 'flame');
      defaultPos = 'top-left';
      defaultScale = 25;
    } else if (customStyle === 'breaking-news-bar') {
      url = createBreakingNewsBadgeDataUrl(`${customText1} ${customText2}`.trim(), 'crimson-pulse');
      defaultPos = 'bottom-left';
      defaultScale = 34;
    } else {
      url = createVerifiedBadgeDataUrl(`${customText1} ${customText2}`.trim(), customColor1, 'check');
      defaultPos = 'top-right';
      defaultScale = 25;
    }

    const newLogo: LogoItem = {
      id: `custom-badge-${Date.now()}`,
      name: `Kustom: ${customText1} ${customText2}`,
      url,
      enabled: true,
      position: defaultPos,
      scalePercent: defaultScale,
      opacity: 0.95,
      marginPercent: 4,
      dropShadow: true,
      glowEffect: true,
      glowColor: customColor1,
    };

    onChangeLogos([...logos, newLogo]);
    onLivePreviewUpdate();
  };

  const handleResetToSampleLogos = () => {
    onChangeLogos([...INITIAL_LOGOS]);
    onLivePreviewUpdate();
  };

  const filteredPresets = LOGO_TEMPLATE_PRESETS.filter((p) => p.category === activeTab);
  const activeCount = logos.filter((l) => l.enabled).length;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">2. Multi-Logo & Template Watermark</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {activeCount} Aktif (Min. 2-3 Logo)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pilihan lengkap "Asupan Viral", "Videy", "Breaking News" & upload PNG
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToSampleLogos}
          className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700/60"
          title="Reset ke 3 Template Logo Bawaan"
        >
          <RefreshCw className="w-3 h-3 text-slate-400" />
          <span className="hidden sm:inline">Reset 3 Logo</span>
        </button>
      </div>

      {/* TEMPLATE PICKER SECTION */}
      <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Katalog Template Logo Viral (1-Klik Terapkan)</span>
          </div>

          <button
            type="button"
            onClick={() => setIsTemplateDrawerOpen(!isTemplateDrawerOpen)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>{isTemplateDrawerOpen ? 'Tutup Pilihan' : 'Buka Pilihan'}</span>
            {isTemplateDrawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isTemplateDrawerOpen && (
          <div className="space-y-3 pt-1">
            {/* Category Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('asupan')}
                className={`py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'asupan'
                    ? 'bg-pink-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Asupan & Videy</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('breaking-news')}
                className={`py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'breaking-news'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Breaking News ({LOGO_TEMPLATE_PRESETS.filter((p) => p.category === 'breaking-news').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('verified')}
                className={`py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'verified'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Badges</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('custom-generator')}
                className={`py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'custom-generator'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Ketik Teks Sendiri</span>
              </button>
            </div>

            {/* Content for Presets */}
            {activeTab !== 'custom-generator' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/50 transition-all flex flex-col justify-between gap-2 group"
                  >
                    <div className="bg-black/60 rounded-lg p-2 flex items-center justify-center min-h-[52px] border border-slate-800/80">
                      <img
                        src={preset.dataUrl}
                        alt={preset.name}
                        className="max-h-12 max-w-full object-contain filter drop-shadow"
                      />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                        {preset.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-tight">{preset.description}</p>
                    </div>

                    {/* Quick Apply Buttons */}
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTemplate(preset)}
                        className="py-1 px-1.5 rounded-md bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-semibold transition-colors text-center"
                      >
                        ⚡ Pasang Cepat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newLogo: LogoItem = {
                            id: `logo-custom-${Date.now()}`,
                            name: preset.name,
                            url: preset.dataUrl,
                            enabled: true,
                            position: preset.defaultPosition,
                            scalePercent: preset.defaultScale,
                            opacity: 0.95,
                            marginPercent: 4,
                            dropShadow: true,
                            glowEffect: !!preset.glowColor,
                            glowColor: preset.glowColor || '#ec4899',
                          };
                          onChangeLogos([...logos, newLogo]);
                          onLivePreviewUpdate();
                        }}
                        className="py-1 px-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors text-center"
                      >
                        + Tambah Layer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Custom Text Generator Tab */
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Teks Baris 1 (Atas):
                    </label>
                    <input
                      type="text"
                      value={customText1}
                      onChange={(e) => setCustomText1(e.target.value)}
                      placeholder="Contoh: ASUPAN / VIRAL"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Teks Baris 2 (Bawah / Utama):
                    </label>
                    <input
                      type="text"
                      value={customText2}
                      onChange={(e) => setCustomText2(e.target.value)}
                      placeholder="Contoh: VIRAL HARI INI"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Model Badge:
                    </label>
                    <select
                      value={customStyle}
                      onChange={(e) => setCustomStyle(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="asupan-badge">Asupan Slanted 3D Cyber</option>
                      <option value="breaking-news-bar">Breaking News Ticker Bar</option>
                      <option value="verified-pill">Verified Checkmark Pill</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Warna Utama:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColor1}
                        onChange={(e) => setCustomColor1(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs text-slate-300 font-mono">{customColor1}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Warna Sekunder:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColor2}
                        onChange={(e) => setCustomColor2(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs text-slate-300 font-mono">{customColor2}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCustomBadge}
                  className="w-full py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>+ Buat & Pasang Logo Teks Ini Sekarang</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Custom PNG Button */}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAddCustomLogo}
        />
        <button
          type="button"
          id="upload-custom-logo-btn"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-2.5 px-3 bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-600/30 hover:to-purple-600/30 border border-pink-500/30 rounded-xl text-xs font-semibold text-pink-200 flex items-center justify-center gap-2 transition-all"
        >
          <Upload className="w-3.5 h-3.5 text-pink-400" />
          <span>+ Upload Logo / Watermark PNG Transparan Sendiri</span>
        </button>
      </div>

      {/* ACTIVE LOGOS LAYER LIST & CONTROLS */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
          <span>Daftar Logo Aktif ({logos.length} Layer)</span>
          <span className="text-[10px] text-slate-400 font-normal">
            Atur posisi, ukuran, dan transparansi masing-masing logo
          </span>
        </div>

        {logos.map((logo, index) => (
          <div
            key={logo.id}
            id={`logo-item-${logo.id}`}
            className={`rounded-xl border p-3.5 transition-all space-y-3 ${
              logo.enabled
                ? 'bg-slate-850 bg-slate-900/90 border-slate-700 shadow-sm'
                : 'bg-slate-950/50 border-slate-800/60 opacity-60'
            }`}
          >
            {/* Top row: Logo thumb, name, toggle, delete */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleLogo(logo.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    logo.enabled
                      ? 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20'
                      : 'text-slate-500 bg-slate-800 hover:bg-slate-700'
                  }`}
                  title={logo.enabled ? 'Nonaktifkan logo ini' : 'Aktifkan logo ini'}
                >
                  {logo.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <div className="w-12 h-10 rounded-lg bg-black/70 border border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-200 truncate">{logo.name}</p>
                  <p className="text-[10px] text-slate-400">
                    Posisi: {POSITION_OPTIONS.find((p) => p.value === logo.position)?.label || logo.position} • Ukuran: {logo.scalePercent}%
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleRemoveLogo(logo.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Hapus logo ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Detailed Controls if enabled */}
            {logo.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                {/* Position Select */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Posisi pada Gambar:
                  </label>
                  <select
                    value={logo.position}
                    onChange={(e) => {
                      const newPos = e.target.value as LogoPosition;
                      if (newPos === 'custom' && logo.customX === undefined) {
                        handleUpdateLogo(logo.id, { position: newPos, customX: 10, customY: 10 });
                      } else {
                        handleUpdateLogo(logo.id, { position: newPos });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                  >
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom X & Y Sliders if custom position selected */}
                {logo.position === 'custom' && (
                  <div className="sm:col-span-2 p-2.5 rounded-lg bg-pink-500/10 border border-pink-500/30 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-pink-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
                        🎯 Geser Bebas (Bisa Tarik Mouse di Preview):
                      </span>
                      <span className="font-mono text-[10px] text-slate-300">
                        X: {logo.customX ?? 10}% | Y: {logo.customY ?? 10}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Posisi X (Horizontal)</span>
                          <span className="text-pink-300 font-mono">{logo.customX ?? 10}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="95"
                          value={logo.customX ?? 10}
                          onChange={(e) => handleUpdateLogo(logo.id, { customX: Number(e.target.value) })}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Posisi Y (Vertikal)</span>
                          <span className="text-pink-300 font-mono">{logo.customY ?? 10}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="95"
                          value={logo.customY ?? 10}
                          onChange={(e) => handleUpdateLogo(logo.id, { customY: Number(e.target.value) })}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      💡 Klik & geser logo langsung menggunakan mouse di jendela Preview Live.
                    </p>
                  </div>
                )}

                {/* Scale Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-semibold text-slate-400">
                      Ukuran Logo:
                    </label>
                    <span className="text-[10px] font-mono text-pink-400 font-bold">
                      {logo.scalePercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={logo.scalePercent}
                    onChange={(e) => handleUpdateLogo(logo.id, { scalePercent: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-semibold text-slate-400">
                      Transparansi / Opacity:
                    </label>
                    <span className="text-[10px] font-mono text-pink-400 font-bold">
                      {Math.round(logo.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={Math.round(logo.opacity * 100)}
                    onChange={(e) => handleUpdateLogo(logo.id, { opacity: parseInt(e.target.value) / 100 })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                {/* Margin Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-semibold text-slate-400">
                      Jarak dari Tepi (Margin):
                    </label>
                    <span className="text-[10px] font-mono text-pink-400 font-bold">
                      {logo.marginPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={logo.marginPercent}
                    onChange={(e) => handleUpdateLogo(logo.id, { marginPercent: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                {/* Glow and Drop Shadow Toggles */}
                <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center space-x-1.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={logo.dropShadow}
                      onChange={(e) => handleUpdateLogo(logo.id, { dropShadow: e.target.checked })}
                      className="rounded border-slate-700 text-pink-600 focus:ring-pink-500 bg-slate-900"
                    />
                    <span>Drop Shadow (Bayangan)</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={logo.glowEffect}
                      onChange={(e) => handleUpdateLogo(logo.id, { glowEffect: e.target.checked })}
                      className="rounded border-slate-700 text-pink-600 focus:ring-pink-500 bg-slate-900"
                    />
                    <span className="flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span>AI Neon Glow</span>
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
