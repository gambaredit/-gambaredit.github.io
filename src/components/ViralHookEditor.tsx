import React from 'react';
import {
  ViralHookSettings,
  Top3DTextStyle,
  BrushBannerStyle,
  SubTagStyle,
} from '../types';
import { VIRAL_HOOK_TEMPLATES, DEFAULT_VIRAL_HOOK_SETTINGS } from '../utils/presets';
import {
  Sparkles,
  Flame,
  Type,
  Palette,
  Sliders,
  RotateCcw,
  Check,
  Zap,
  HelpCircle,
} from 'lucide-react';

interface ViralHookEditorProps {
  settings: ViralHookSettings;
  onChange: (updated: ViralHookSettings) => void;
}

export const ViralHookEditor: React.FC<ViralHookEditorProps> = ({
  settings,
  onChange,
}) => {
  const updateSetting = <K extends keyof ViralHookSettings>(
    key: K,
    value: ViralHookSettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  const applyTemplate = (templateSettings: Partial<ViralHookSettings>) => {
    onChange({
      ...settings,
      ...templateSettings,
      enabled: true,
    });
  };

  const TOP_3D_STYLES: { id: Top3DTextStyle; label: string; previewColor: string; bgBadge: string }[] = [
    { id: 'pink-neon', label: '🌸 Pink Neon 3D (Persis Contoh)', previewColor: '#f43f5e', bgBadge: 'bg-pink-500/20 border-pink-500/50 text-pink-300' },
    { id: 'cyan-electric', label: '💎 Cyan Electric', previewColor: '#06b6d4', bgBadge: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' },
    { id: 'gold-metal', label: '👑 Gold Metal', previewColor: '#f59e0b', bgBadge: 'bg-amber-500/20 border-amber-500/50 text-amber-300' },
    { id: 'fire-orange', label: '🔥 Fire Orange', previewColor: '#ea580c', bgBadge: 'bg-orange-500/20 border-orange-500/50 text-orange-300' },
    { id: 'white-silver', label: '⚡ White Chrome', previewColor: '#e2e8f0', bgBadge: 'bg-slate-500/20 border-slate-400/50 text-slate-200' },
    { id: 'purple-cyber', label: '🔮 Cyber Purple', previewColor: '#a855f7', bgBadge: 'bg-purple-500/20 border-purple-500/50 text-purple-300' },
  ];

  const BRUSH_STYLES: { id: BrushBannerStyle; label: string; colorDot: string }[] = [
    { id: 'pink-brush', label: 'Pink Brush', colorDot: 'bg-pink-600' },
    { id: 'yellow-brush', label: 'Yellow Brush (Mencolok)', colorDot: 'bg-yellow-400' },
    { id: 'red-brush', label: 'Red Brush', colorDot: 'bg-red-600' },
    { id: 'cyan-brush', label: 'Cyan Brush', colorDot: 'bg-cyan-500' },
    { id: 'white-brush', label: 'White Brush', colorDot: 'bg-white' },
    { id: 'dark-carbon', label: 'Dark Carbon', colorDot: 'bg-slate-900' },
    { id: 'none', label: 'Tanpa Background', colorDot: 'bg-transparent border border-slate-600' },
  ];

  const SUBTAG_STYLES: { id: SubTagStyle; label: string; desc: string }[] = [
    { id: 'script-pink-wings', label: '💖 Cursive Pink + Sayap Glowing (Persis Contoh)', desc: 'Gaya tulisan tangan Ytta dengan aksen sayap pink' },
    { id: 'script-gold', label: '👑 Cursive Gold + Sayap Emas', desc: 'Gaya tulisan mewah dengan sayap garis emas' },
    { id: 'neon-pill', label: '⚡ Neon Cyber Pill Capsule', desc: 'Kapsul modern dengan border neon glow' },
    { id: 'verified-badge', label: '🛡️ Verified Creator Badge', desc: 'Badge akun centang biru terverifikasi' },
    { id: 'italic-white', label: '⚪ Italic Clean Text', desc: 'Teks miring putih tajam minimalis' },
  ];

  return (
    <div id="viral-hook-editor" className="space-y-5">
      {/* Header & Main Toggle */}
      <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-amber-500/10 rounded-xl border border-pink-500/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">
                VIRAL HOOK & HIGH-CTR TEXT
              </span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-pink-500 text-white rounded-full tracking-wider shadow-sm">
                FB ALGORITHM #1
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Gaya 3D Teks Atas ("BFF") + Brush Banner Bawah ("Penasaran") + Tag ("Ytta")
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => updateSetting('enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500 shadow-inner"></div>
        </label>
      </div>

      {settings.enabled && (
        <>
          {/* Quick 1-Click Viral Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Pilihan Cepat Template Viral Facebook:
              </span>
              <button
                onClick={() => onChange(DEFAULT_VIRAL_HOOK_SETTINGS)}
                className="text-[11px] text-slate-400 hover:text-pink-300 flex items-center gap-1 transition-colors"
                title="Reset ke template standar contoh"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Default
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VIRAL_HOOK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => applyTemplate(tmpl.settings)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col justify-between gap-1 group ${
                    settings.top3DText === tmpl.settings.top3DText &&
                    settings.line1Text === tmpl.settings.line1Text
                      ? 'bg-pink-500/20 border-pink-500 text-white shadow-md shadow-pink-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-pink-500/50 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white group-hover:text-pink-300 transition-colors">
                      {tmpl.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {tmpl.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 italic font-mono">
                    "{tmpl.settings.top3DText}" • "{tmpl.settings.line1Text} {tmpl.settings.line2Text}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: TOP 3D HEADLINE */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-pink-500/20 text-pink-400 text-xs font-bold">1</span>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-pink-400" />
                  Headline 3D Teks Atas (Seperti "BFF")
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showTop3DText}
                  onChange={(e) => updateSetting('showTop3DText', e.target.checked)}
                  className="rounded border-slate-700 text-pink-500 focus:ring-pink-500 bg-slate-800"
                />
                <span>Tampilkan</span>
              </label>
            </div>

            {settings.showTop3DText && (
              <div className="space-y-3 pt-1">
                {/* Input Text */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Teks Headline 3D (Huruf Besar):
                  </label>
                  <input
                    type="text"
                    value={settings.top3DText}
                    onChange={(e) => updateSetting('top3DText', e.target.value)}
                    placeholder="Contoh: BFF, VIRAL, ASUPAN, OMG, RAHASIA..."
                    className="w-full px-3 py-2 text-sm font-black bg-slate-950 border border-slate-700 rounded-lg text-pink-300 placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 tracking-wider uppercase font-mono"
                  />
                </div>

                {/* 3D Color Style Selector */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-pink-400" />
                    Warna Gaya 3D & Efek Timbul:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TOP_3D_STYLES.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => updateSetting('top3DStyle', st.id)}
                        className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                          settings.top3DStyle === st.id
                            ? `${st.bgBadge} font-bold shadow-sm`
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: st.previewColor }}
                        />
                        <span className="truncate">{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders (Size, Position Y, 3D Depth) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Ukuran Font</span>
                      <span className="text-pink-300 font-mono">{settings.top3DSize}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="75"
                      value={settings.top3DSize}
                      onChange={(e) => updateSetting('top3DSize', Number(e.target.value))}
                      className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Posisi Tinggi (Y)</span>
                      <span className="text-pink-300 font-mono">{settings.top3DYPosition}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      value={settings.top3DYPosition}
                      onChange={(e) => updateSetting('top3DYPosition', Number(e.target.value))}
                      className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Kedalaman 3D</span>
                      <span className="text-pink-300 font-mono">{settings.top3DDepth} px</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="18"
                      value={settings.top3DDepth}
                      onChange={(e) => updateSetting('top3DDepth', Number(e.target.value))}
                      className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: BOTTOM VIRAL CAPTION / BRUSH BANNERS */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-amber-500/20 text-amber-400 text-xs font-bold">2</span>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Hook Caption Bawah (Pita Brush Cat + Ytta)
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showBottomHook}
                  onChange={(e) => updateSetting('showBottomHook', e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-800"
                />
                <span>Tampilkan</span>
              </label>
            </div>

            {settings.showBottomHook && (
              <div className="space-y-4 pt-1">
                {/* Line 1: Pink Brush Line */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-pink-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                      Baris 1 (Pita Brush Pertama):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Brush:</span>
                      <select
                        value={settings.line1BgStyle}
                        onChange={(e) => updateSetting('line1BgStyle', e.target.value as BrushBannerStyle)}
                        className="text-[11px] bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white"
                      >
                        {BRUSH_STYLES.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={settings.line1Text}
                    onChange={(e) => updateSetting('line1Text', e.target.value)}
                    placeholder="Contoh: Awalnya biasa saja,"
                    className="w-full px-3 py-1.5 text-xs font-extrabold bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                {/* Line 2: Yellow Brush Line */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-yellow-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      Baris 2 (Pita Brush Kedua - Punchline Viral):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Brush:</span>
                      <select
                        value={settings.line2BgStyle}
                        onChange={(e) => updateSetting('line2BgStyle', e.target.value as BrushBannerStyle)}
                        className="text-[11px] bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white"
                      >
                        {BRUSH_STYLES.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={settings.line2Text}
                    onChange={(e) => updateSetting('line2Text', e.target.value)}
                    placeholder="Contoh: tapi ending-nya bikin penasaran banget 😳"
                    className="w-full px-3 py-1.5 text-xs font-extrabold bg-slate-900 border border-slate-700 rounded-md text-yellow-300 placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                  />
                </div>

                {/* Line 3: SubTag / Cursive Script Badge */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.showSubTag}
                        onChange={(e) => updateSetting('showSubTag', e.target.checked)}
                        className="rounded border-slate-700 text-pink-500 focus:ring-pink-500 bg-slate-800"
                        id="show-subtag-check"
                      />
                      <label htmlFor="show-subtag-check" className="text-[11px] font-bold text-white cursor-pointer">
                        Baris 3: Sub-Tag Cursive (Aksen "Ytta" & Sayap Glowing)
                      </label>
                    </div>
                  </div>

                  {settings.showSubTag && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={settings.subTagText}
                        onChange={(e) => updateSetting('subTagText', e.target.value)}
                        placeholder="Contoh: Ytta, Paham Kan?, Full di Komentar..."
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-900 border border-slate-700 rounded-md text-pink-300 placeholder-slate-500 focus:outline-none focus:border-pink-500"
                      />

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">Variasi Gaya Sub-Tag:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {SUBTAG_STYLES.map((st) => (
                            <button
                              key={st.id}
                              onClick={() => updateSetting('subTagStyle', st.id)}
                              className={`p-1.5 rounded border text-left text-[11px] transition-all flex flex-col ${
                                settings.subTagStyle === st.id
                                  ? 'bg-pink-500/20 border-pink-500 text-white font-semibold'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <span>{st.label}</span>
                              <span className="text-[9px] text-slate-400 line-clamp-1">{st.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sizing & Vertical Offset Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Ukuran Keseluruhan (Scale)</span>
                      <span className="text-amber-300 font-mono">{settings.bottomHookScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="140"
                      value={settings.bottomHookScale}
                      onChange={(e) => updateSetting('bottomHookScale', Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Jarak dari Bawah (Margin Y)</span>
                      <span className="text-amber-300 font-mono">{settings.bottomHookYOffset}%</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="25"
                      value={settings.bottomHookYOffset}
                      onChange={(e) => updateSetting('bottomHookYOffset', Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
