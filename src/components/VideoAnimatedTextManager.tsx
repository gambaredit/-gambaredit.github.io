import React from 'react';
import {
  Type,
  Plus,
  Trash2,
  Sparkles,
  Move,
  Sliders,
  Palette,
  Eye,
  Activity,
  Layers,
  Flame,
  Radio,
  Zap,
} from 'lucide-react';
import {
  VideoAnimatedTextItem,
  VideoTextAnimationType,
  VideoTextBannerStyle,
} from '../../types';

interface VideoAnimatedTextManagerProps {
  animatedTexts: VideoAnimatedTextItem[];
  onChangeAnimatedTexts: (texts: VideoAnimatedTextItem[]) => void;
}

export const VideoAnimatedTextManager: React.FC<VideoAnimatedTextManagerProps> = ({
  animatedTexts,
  onChangeAnimatedTexts,
}) => {
  // Add a new blank animated text
  const handleAddNewText = () => {
    const newItem: VideoAnimatedTextItem = {
      id: `text-${Date.now()}`,
      text: 'TEKS VIRAL BARU ANDA DISINI ✨',
      enabled: true,
      animationType: 'pop-in-bounce',
      animationSpeed: 1.0,
      fontFamily: 'impact',
      fontSizePercent: 5.0,
      textColor: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowColor: 'rgba(0,0,0,0.8)',
      bgBannerStyle: 'breaking-red',
      opacity: 1.0,
      position: 'top',
      customX: 50,
      customY: 12,
      startTimeSec: 0,
      endTimeSec: -1,
      isPartCounter: false,
    };
    onChangeAnimatedTexts([...animatedTexts, newItem]);
  };

  // Add specific Viral Preset
  const handleAddPreset = (presetType: 'marquee' | 'hook3d' | 'typewriter' | 'partcounter') => {
    let newItem: VideoAnimatedTextItem;

    if (presetType === 'marquee') {
      newItem = {
        id: `text-marquee-${Date.now()}`,
        text: '🔴 BREAKING NEWS • SIMAK SAMPAI HABIS • JANGAN LUPA SHARE & FOLLOW UNTUK PART SELANJUTNYA! 🔴',
        enabled: true,
        animationType: 'running-marquee',
        animationSpeed: 1.0,
        fontFamily: 'montserrat',
        fontSizePercent: 4.2,
        textColor: '#fef08a',
        strokeColor: '#000000',
        strokeWidth: 3,
        shadowColor: 'rgba(0,0,0,0.9)',
        bgBannerStyle: 'dark-box',
        opacity: 1.0,
        position: 'bottom',
        customX: 50,
        customY: 92,
        startTimeSec: 0,
        endTimeSec: -1,
        isPartCounter: false,
      };
    } else if (presetType === 'hook3d') {
      newItem = {
        id: `text-hook-${Date.now()}`,
        text: 'AWAS KAGET DI MENIT INI! 😱🔥',
        enabled: true,
        animationType: 'glitch-shake',
        animationSpeed: 1.2,
        fontFamily: 'impact',
        fontSizePercent: 6.0,
        textColor: '#ffffff',
        strokeColor: '#e11d48',
        strokeWidth: 5,
        shadowColor: 'rgba(225,29,72,0.8)',
        bgBannerStyle: 'breaking-red',
        opacity: 1.0,
        position: 'top',
        customX: 50,
        customY: 10,
        startTimeSec: 0,
        endTimeSec: -1,
        isPartCounter: false,
      };
    } else if (presetType === 'typewriter') {
      newItem = {
        id: `text-type-${Date.now()}`,
        text: 'Awalnya biasa saja, tapi setelah tahu faktanya... 😳',
        enabled: true,
        animationType: 'typewriter',
        animationSpeed: 1.0,
        fontFamily: 'outfit',
        fontSizePercent: 4.8,
        textColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 3,
        shadowColor: 'rgba(0,0,0,0.7)',
        bgBannerStyle: 'dark-box',
        opacity: 1.0,
        position: 'center',
        customX: 50,
        customY: 50,
        startTimeSec: 0,
        endTimeSec: -1,
        isPartCounter: false,
      };
    } else {
      // Part counter
      newItem = {
        id: `text-part-${Date.now()}`,
        text: '🔥 {prefix} {part}/{total} • TONTON SAMPAI SELESAI 🔥',
        enabled: true,
        animationType: 'wave-float',
        animationSpeed: 1.0,
        fontFamily: 'impact',
        fontSizePercent: 4.5,
        textColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 3,
        shadowColor: 'rgba(0,0,0,0.8)',
        bgBannerStyle: 'gradient-pill',
        opacity: 1.0,
        position: 'top',
        customX: 50,
        customY: 6,
        startTimeSec: 0,
        endTimeSec: -1,
        isPartCounter: true,
      };
    }

    onChangeAnimatedTexts([...animatedTexts, newItem]);
  };

  const updateItem = (id: string, partial: Partial<VideoAnimatedTextItem>) => {
    onChangeAnimatedTexts(
      animatedTexts.map((item) => (item.id === id ? { ...item, ...partial } : item))
    );
  };

  const removeItem = (id: string) => {
    onChangeAnimatedTexts(animatedTexts.filter((item) => item.id !== id));
  };

  const animationTypes: { label: string; type: VideoTextAnimationType; icon: string }[] = [
    { label: '🏃 Running Text (Marquee Berjalan)', type: 'running-marquee', icon: '🏃' },
    { label: '🌟 Pop In & Bounce (Membal Bertenaga)', type: 'pop-in-bounce', icon: '🌟' },
    { label: '⚡ Typewriter (Mengetik Huruf demi Huruf)', type: 'typewriter', icon: '⚡' },
    { label: '🌊 Wave & Float (Mengambang Gelombang)', type: 'wave-float', icon: '🌊' },
    { label: '💫 Neon Pulse (Glow Berkedip)', type: 'neon-pulse', icon: '💫' },
    { label: '💥 Glitch & Shake (Getar Viral Hook)', type: 'glitch-shake', icon: '💥' },
    { label: '🎭 Fade & Slide Up', type: 'fade-slide-up', icon: '🎭' },
    { label: '🌈 Rainbow Color Shift', type: 'rainbow-shift', icon: '🌈' },
    { label: '🔤 Statis Tebal (Solid)', type: 'static-bold', icon: '🔤' },
  ];

  const bannerStyles: { label: string; style: VideoTextBannerStyle }[] = [
    { label: '🔴 Breaking News Bar Merah TV', style: 'breaking-red' },
    { label: '⬛ Dark Glass Box Elegan', style: 'dark-box' },
    { label: '💊 Gradient Pill (Pink-Amber)', style: 'gradient-pill' },
    { label: '🟡 Highlight Stabilo Kuning', style: 'yellow-highlight' },
    { label: '💎 Cyber Futuristic Cyan', style: 'cyber-plate' },
    { label: '◾ Solid Black Box', style: 'solid-black' },
    { label: '🚫 Tanpa Banner (Teks Saja)', style: 'none' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-rose-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Teks Animate & Viral Overlay Editor</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {animatedTexts.filter((t) => t.enabled).length} Teks Aktif
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Tambahkan teks animasi bergerak seperti Running Text Berita TV, Typewriter, Pop In Bounce, dan Hook 3D
            </p>
          </div>
        </div>

        {/* Quick Add Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleAddPreset('marquee')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 border border-amber-500/20"
          >
            <span>🏃 + Running Text TV</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPreset('hook3d')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 border border-rose-500/20"
          >
            <span>🔥 + Viral Hook</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPreset('typewriter')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 border border-cyan-500/20"
          >
            <span>⚡ + Typewriter</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPreset('partcounter')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 border border-purple-500/20"
          >
            <span>🏷️ + Part Counter</span>
          </button>

          <button
            type="button"
            onClick={handleAddNewText}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Teks Baru</span>
          </button>
        </div>
      </div>

      {/* Texts List */}
      {animatedTexts.length === 0 ? (
        <div
          onClick={handleAddNewText}
          className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Type className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">
              Belum Ada Teks Animasi. Klik untuk Menambahkan!
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Teks animasi akan bergerak secara halus di atas video selama pemutaran dan ekspor klip
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {animatedTexts.map((item, idx) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all ${
                item.enabled
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-950/30 border-slate-800/50 opacity-60'
              }`}
            >
              {/* Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-[240px]">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => updateItem(item.id, { enabled: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 mt-2"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateItem(item.id, { text: e.target.value })}
                      placeholder="Ketik teks animasi Anda disini..."
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500"
                    />
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                      <span className="text-slate-500">Sisipkan Tag Part Otomatis:</span>
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { text: `${item.text} {part}` })}
                        className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-purple-500/30"
                        title="Nomor part saat ini (1, 2, 3...)"
                      >
                        {'{part}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { text: `${item.text} {total}` })}
                        className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-purple-500/30"
                        title="Total semua part"
                      >
                        {'{total}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { text: `${item.text} {next_part}` })}
                        className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-pink-300 rounded border border-pink-500/30"
                        title="Nomor part berikutnya untuk CTA bio"
                      >
                        {'{next_part}'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold rounded border"
                    style={{
                      backgroundColor:
                        (item.opacity ?? 1.0) < 0.6
                          ? 'rgba(6, 182, 212, 0.2)'
                          : 'rgba(245, 158, 11, 0.2)',
                      borderColor:
                        (item.opacity ?? 1.0) < 0.6
                          ? 'rgba(6, 182, 212, 0.4)'
                          : 'rgba(245, 158, 11, 0.4)',
                      color: (item.opacity ?? 1.0) < 0.6 ? '#67e8f9' : '#fcd34d',
                    }}
                    title="Tingkat kejernihan/transparansi teks"
                  >
                    👁️ {Math.round((item.opacity ?? 1.0) * 100)}%{' '}
                    {(item.opacity ?? 1.0) >= 0.9
                      ? 'Jelas'
                      : (item.opacity ?? 1.0) >= 0.5
                      ? 'Semi'
                      : 'Buram/Samar'}
                  </span>

                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {animationTypes.find((a) => a.type === item.animationType)?.label.split(' ')[0]}{' '}
                    {animationTypes.find((a) => a.type === item.animationType)?.label.split(' ')[1]}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors"
                    title="Hapus Teks Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Animation Type Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Jenis Animasi Gerak:</span>
                  </label>
                  <select
                    value={item.animationType}
                    onChange={(e) => updateItem(item.id, { animationType: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-amber-500"
                  >
                    {animationTypes.map((a) => (
                      <option key={a.type} value={a.type}>
                        {a.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex justify-between text-[11px] pt-1">
                    <span className="text-slate-300 font-semibold">Kecepatan Gerak:</span>
                    <span className="font-mono text-amber-400 font-bold">{item.animationSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    value={item.animationSpeed}
                    onChange={(e) => updateItem(item.id, { animationSpeed: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* 2. Banner Style & Font Family */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-amber-400" />
                    <span>Plat / Banner Background:</span>
                  </label>
                  <select
                    value={item.bgBannerStyle}
                    onChange={(e) => updateItem(item.id, { bgBannerStyle: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-amber-500"
                  >
                    {bannerStyles.map((b) => (
                      <option key={b.style} value={b.style}>
                        {b.label}
                      </option>
                    ))}
                  </select>

                  <label className="text-[11px] font-semibold text-slate-300 block pt-1">
                    Font Huruf:
                  </label>
                  <select
                    value={item.fontFamily}
                    onChange={(e) => updateItem(item.id, { fontFamily: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-amber-500"
                  >
                    <option value="impact">Impact (Viral Headline Tebal)</option>
                    <option value="montserrat">Montserrat (Modern Clean)</option>
                    <option value="outfit">Outfit (Stylish Headline)</option>
                    <option value="poppins">Poppins (Friendly Bold)</option>
                    <option value="bangers">Bangers (Komik Enerjik)</option>
                    <option value="cyber">Cyber Orbitron (Futuristik)</option>
                  </select>
                </div>

                {/* 3. Position & Size */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Move className="w-3 h-3 text-amber-400" />
                    <span>Posisi Teks:</span>
                  </label>
                  <select
                    value={item.position}
                    onChange={(e) => updateItem(item.id, { position: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-amber-500"
                  >
                    <option value="top">⬆️ Atas (Headline Hook)</option>
                    <option value="center">🎯 Tengah</option>
                    <option value="bottom">⬇️ Bawah (Marquee/Caption)</option>
                    <option value="custom">🎛️ Posisi Kustom (X,Y)</option>
                  </select>

                  <div className="flex justify-between text-[11px] pt-1">
                    <span className="text-slate-300 font-semibold">Ukuran Teks:</span>
                    <span className="font-mono text-amber-400 font-bold">{item.fontSizePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={2.5}
                    max={12}
                    step={0.5}
                    value={item.fontSizePercent}
                    onChange={(e) => updateItem(item.id, { fontSizePercent: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* 4. Colors & Outlines */}
                <div className="space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300">Warna Teks:</span>
                    <input
                      type="color"
                      value={item.textColor || '#ffffff'}
                      onChange={(e) => updateItem(item.id, { textColor: e.target.value })}
                      className="w-6 h-6 rounded border border-slate-700 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300">Garis Tepi (Stroke):</span>
                    <input
                      type="color"
                      value={item.strokeColor || '#000000'}
                      onChange={(e) => updateItem(item.id, { strokeColor: e.target.value })}
                      className="w-6 h-6 rounded border border-slate-700 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Tebal Garis:</span>
                    <span className="font-mono text-amber-400 font-bold">{item.strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    value={item.strokeWidth}
                    onChange={(e) => updateItem(item.id, { strokeWidth: parseInt(e.target.value, 10) })}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* 5. Transparansi & Kejernihan Slider Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200">
                        Transparansi / Opasitas Teks & Banner:
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Atur seberapa jelas (solid) atau buram/samar teks di atas video
                      </span>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { opacity: 1.0 })}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        (item.opacity ?? 1.0) >= 0.95
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      100% (Jelas)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { opacity: 0.75 })}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        (item.opacity ?? 1.0) >= 0.7 && (item.opacity ?? 1.0) < 0.85
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { opacity: 0.5 })}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        (item.opacity ?? 1.0) >= 0.45 && (item.opacity ?? 1.0) < 0.6
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      50% (Semi)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { opacity: 0.25 })}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        (item.opacity ?? 1.0) <= 0.3
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      25% (Buram/Samar)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                    Buram (10%)
                  </span>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={item.opacity ?? 1.0}
                    onChange={(e) => updateItem(item.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                    Jelas Solid (100%)
                  </span>
                  <span className="font-mono text-xs font-black text-cyan-300 w-12 text-right bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {Math.round((item.opacity ?? 1.0) * 100)}%
                  </span>
                </div>
              </div>

              {/* Custom X/Y Sliders when position === 'custom' */}
              {item.position === 'custom' && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-2.5 border-t border-slate-800/80 bg-slate-900/40 p-2 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span>Posisi Horizontal (X):</span>
                      <span className="font-mono text-amber-400 font-bold">{item.customX}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={item.customX}
                      onChange={(e) => updateItem(item.id, { customX: parseInt(e.target.value, 10) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span>Posisi Vertikal (Y):</span>
                      <span className="font-mono text-amber-400 font-bold">{item.customY}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={item.customY}
                      onChange={(e) => updateItem(item.id, { customY: parseInt(e.target.value, 10) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
