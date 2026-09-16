import React, { useState, useRef } from 'react';
import {
  Scissors,
  Clock,
  Download,
  CheckCircle,
  Play,
  Layers,
  Sparkles,
  Loader2,
  PackageCheck,
  Type,
  Flame,
  Palette,
  Sliders,
  Move,
  Tag,
  Eye,
  Check,
  Zap,
  Gauge,
  Cpu,
  Dices,
  Shuffle,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  VideoItem,
  VideoEditorSettings,
  VideoSegmentItem,
  VideoPartBadgeConfig,
  VideoPartBadgePosition,
  VideoTextBannerStyle,
  VideoExportQuality,
} from '../../types';
import {
  formatVideoTime,
  recordVideoSegment,
  downloadBlob,
  DEFAULT_PART_BADGE_CONFIG,
  isWebCodecsSupported,
  getDecodedAudioBuffer,
  getExportResolutionConfig,
} from '../../utils/videoProcessor';
import { VideoExportModal, ExportBatchState } from './VideoExportModal';

interface VideoSplitterControllerProps {
  video: VideoItem;
  settings: VideoEditorSettings;
  segments: VideoSegmentItem[];
  selectedSegmentIndex: number;
  onSelectSegment: (index: number) => void;
  onUpdateSettings: (partial: Partial<VideoEditorSettings>) => void;
}

export const VideoSplitterController: React.FC<VideoSplitterControllerProps> = ({
  video,
  settings,
  segments,
  selectedSegmentIndex,
  onSelectSegment,
  onUpdateSettings,
}) => {
  const [exportingCardIndex, setExportingCardIndex] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Professional Batch Export State for Modal
  const [batchModalState, setBatchModalState] = useState<ExportBatchState>({
    isOpen: false,
    isCompleted: false,
    isExporting: false,
    totalSegments: segments.length,
    currentSegmentIndex: 0,
    overallPercent: 0,
    currentPartPercent: 0,
    currentFps: 0,
    speedMultiplier: 1.0,
    etaSeconds: 0,
    engine: isWebCodecsSupported() ? 'webcodecs' : 'mediarecorder',
    completedParts: [],
    zipBlob: null,
    zipFilename: '',
  });

  const partConfig: VideoPartBadgeConfig =
    settings.partBadgeConfig || DEFAULT_PART_BADGE_CONFIG;

  const updatePartConfig = (partial: Partial<VideoPartBadgeConfig>) => {
    onUpdateSettings({
      partBadgeConfig: {
        ...partConfig,
        ...partial,
      },
    });
  };

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'viral' | 'news' | 'luxury' | 'minimal'>('all');

  const viralPartTemplates = [
    // 1. Viral & Hook CTA
    {
      category: 'viral',
      label: '🔥 Viral Top Sunset',
      template: '🔥 {prefix} {part}/{total} • TONTON SAMPAI SELESAI 🔥',
      style: 'gradient-pill' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'impact' as const,
      anim: 'pop-in-bounce' as const,
    },
    {
      category: 'viral',
      label: '🏷️ Call To Action Bio',
      template: '🏷️ {prefix} {part} • LANJUT PART {next_part} DI PROFIL 👉',
      style: 'dark-box' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'montserrat' as const,
      anim: 'pop-in-bounce' as const,
    },
    {
      category: 'viral',
      label: '🟡 Stabilo Highlight',
      template: '⚡ {prefix} {part} • SERI LENGKAP DI PROFIL ⚡',
      style: 'yellow-highlight' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'impact' as const,
      anim: 'none' as const,
    },
    {
      category: 'viral',
      label: '⚠️ Alert Jangan Skip',
      template: '⚠️ {prefix} {part} DARI {total} PART • JANGAN SKIP! ⚠️',
      style: 'emerald-neon' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'impact' as const,
      anim: 'glitch-shake' as const,
    },
    // 2. Berita & TV
    {
      category: 'news',
      label: '🔴 Breaking News Red',
      template: '🔴 BREAKING: {prefix} {part} DARI {total} PART 🔴',
      style: 'breaking-red' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'impact' as const,
      anim: 'pop-in-bounce' as const,
    },
    {
      category: 'news',
      label: '📰 Warta TV Solid',
      template: '📰 {prefix} {part}/{total} • KABAR TERKINI',
      style: 'solid-black' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'montserrat' as const,
      anim: 'none' as const,
    },
    {
      category: 'news',
      label: '🚨 Update Kilat Merah',
      template: '🚨 {prefix} {part} (UPDATE RESMI LANJUT PART {next_part})',
      style: 'breaking-red' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'impact' as const,
      anim: 'neon-pulse' as const,
    },
    // 3. Luxury, Cyber & Gaming
    {
      category: 'luxury',
      label: '👑 Luxury Metallic Gold',
      template: '👑 EPISODE {part}/{total} • EDISI SPESIAL 👑',
      style: 'luxury-gold' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'outfit' as const,
      anim: 'neon-pulse' as const,
    },
    {
      category: 'luxury',
      label: '💎 Cyber Neon Cyan',
      template: '💎 {prefix} {part} [FULL HD] • SIMAK ENDINGNYA',
      style: 'cyber-plate' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'cyber' as const,
      anim: 'wave-float' as const,
    },
    {
      category: 'luxury',
      label: '🔮 Purple Cyber Vibe',
      template: '🎬 {prefix} {part} • KLIK FOLLOW UNTUK PART {next_part}',
      style: 'purple-cyber' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'montserrat' as const,
      anim: 'pop-in-bounce' as const,
    },
    {
      category: 'luxury',
      label: '🎮 Retro Pixel Arcade',
      template: '🕹️ {prefix} {part}/{total} • GAMEPLAY',
      style: 'retro-arcade' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'bangers' as const,
      anim: 'glitch-shake' as const,
    },
    // 4. Minimalist & Clean
    {
      category: 'minimal',
      label: '🏷️ Stiker Putih 3D',
      template: '✨ {prefix} {part} DARI {total} ✨',
      style: 'sticker-white' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'impact' as const,
      anim: 'pop-in-bounce' as const,
    },
    {
      category: 'minimal',
      label: '🌊 Ocean Blue Pill',
      template: '🌊 {prefix} {part}/{total} • CERITA LENGKAP',
      style: 'blue-ocean' as VideoTextBannerStyle,
      pos: 'top-center' as VideoPartBadgePosition,
      font: 'poppins' as const,
      anim: 'wave-float' as const,
    },
    {
      category: 'minimal',
      label: '💎 Corner Badge Kanan',
      template: '{prefix} {part}/{total}',
      style: 'gradient-pill' as VideoTextBannerStyle,
      pos: 'top-right' as VideoPartBadgePosition,
      font: 'impact' as const,
      anim: 'none' as const,
    },
    {
      category: 'minimal',
      label: '▶️ Minimalist Hitam Kiri',
      template: '▶️ {prefix} {part}',
      style: 'solid-black' as VideoTextBannerStyle,
      pos: 'top-left' as VideoPartBadgePosition,
      font: 'montserrat' as const,
      anim: 'none' as const,
    },
    {
      category: 'minimal',
      label: '🎯 Simple Part Bawah',
      template: '📌 {prefix} {part} (KLIK FOLLOW)',
      style: 'dark-box' as VideoTextBannerStyle,
      pos: 'bottom-center' as VideoPartBadgePosition,
      font: 'outfit' as const,
      anim: 'fade-slide-up' as const,
    },
  ];

  // Quick preset buttons for split durations
  const splitPresets = [
    {
      label: '⚡ 3 Menit (~03:01 - 03:10)',
      sec: 180,
      desc: 'Standar FYP FB & Reels (Durasi Acak Alami)',
      tag: '🔥 Rekomendasi FB',
    },
    {
      label: '1 Menit (~01:01 - 01:10)',
      sec: 60,
      desc: 'Shorts & TikTok (Durasi Acak 61s - 70s)',
      tag: '📱 Shorts / TikTok',
    },
    {
      label: '2 Menit (~02:01 - 02:10)',
      sec: 120,
      desc: 'Klip Sedang (Durasi Acak 121s - 130s)',
      tag: '🎬 Klip Sedang',
    },
    {
      label: '5 Menit (~05:01 - 05:10)',
      sec: 300,
      desc: 'Klip Seri Cerita / Alur Film',
      tag: '📚 Series Panjang',
    },
  ];

  // Cancel active export operation
  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setBatchModalState((prev) => ({
      ...prev,
      isExporting: false,
      errorMessage: 'Proses export telah dibatalkan.',
    }));
  };

  // Close modal
  const handleCloseModal = () => {
    setBatchModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  // Download single finished part
  const handleDownloadSinglePartBlob = (blob: Blob, filename: string) => {
    downloadBlob(blob, filename);
  };

  // Download the finalized ZIP archive
  const handleDownloadZipArchive = () => {
    if (batchModalState.zipBlob) {
      downloadBlob(batchModalState.zipBlob, batchModalState.zipFilename);
    }
  };

  // Single segment download directly from card
  const handleDownloadSingleSegment = async (seg: VideoSegmentItem, index: number) => {
    if (exportingCardIndex !== null || batchModalState.isExporting) return;

    setExportingCardIndex(index);
    let hiddenVideo: HTMLVideoElement | null = null;

    try {
      // Pre-cache audio track in memory for audio preservation
      if (!settings.muteOriginal && video.url) {
        await getDecodedAudioBuffer(video.url);
      }

      hiddenVideo = document.createElement('video');
      hiddenVideo.src = video.url;
      hiddenVideo.crossOrigin = 'anonymous';
      hiddenVideo.playsInline = true;
      hiddenVideo.muted = false;
      hiddenVideo.volume = 1.0;
      hiddenVideo.style.position = 'fixed';
      hiddenVideo.style.opacity = '0';
      hiddenVideo.style.pointerEvents = 'none';
      hiddenVideo.style.zIndex = '-9999';
      document.body.appendChild(hiddenVideo);

      await new Promise<void>((resolve, reject) => {
        hiddenVideo!.onloadedmetadata = () => resolve();
        hiddenVideo!.onerror = () => reject(new Error('Gagal memuat video'));
      });

      const blob = await recordVideoSegment(
        hiddenVideo,
        seg.startTime,
        seg.endTime,
        settings,
        seg.partNumber,
        segments.length
      );

      const baseFilename = video.name.replace(/\.[^/.]+$/, '');
      const filename = `${baseFilename}-${settings.partPrefix}-${seg.partNumber}.mp4`;
      downloadBlob(blob, filename);
    } catch (err: any) {
      console.error('Error downloading single segment:', err);
      alert('Gagal mendownload part video ini: ' + (err?.message || 'Silakan coba lagi.'));
    } finally {
      if (hiddenVideo && hiddenVideo.parentNode) {
        hiddenVideo.parentNode.removeChild(hiddenVideo);
      }
      setExportingCardIndex(null);
    }
  };

  // Batch Export all parts with Hardware-Accelerated WebCodecs & Modal UI
  const handleExportAllPartsZip = async () => {
    if (segments.length === 0) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const baseFilename = video.name.replace(/\.[^/.]+$/, '');
    const zipFilename = `${baseFilename}-Semua-${segments.length}-Part.zip`;

    // Initialize modal state
    setBatchModalState({
      isOpen: true,
      isCompleted: false,
      isExporting: true,
      totalSegments: segments.length,
      currentSegmentIndex: 0,
      overallPercent: 0,
      currentPartPercent: 0,
      currentFps: 0,
      speedMultiplier: 1.0,
      etaSeconds: 0,
      engine: isWebCodecsSupported() ? 'webcodecs' : 'mediarecorder',
      completedParts: [],
      zipBlob: null,
      zipFilename,
    });

    let hiddenVideo: HTMLVideoElement | null = null;

    try {
      // Pre-cache audio track in memory once for instant multi-part slicing
      if (!settings.muteOriginal && video.url) {
        await getDecodedAudioBuffer(video.url);
      }

      hiddenVideo = document.createElement('video');
      hiddenVideo.src = video.url;
      hiddenVideo.crossOrigin = 'anonymous';
      hiddenVideo.playsInline = true;
      document.body.appendChild(hiddenVideo);

      await new Promise<void>((resolve, reject) => {
        hiddenVideo!.onloadedmetadata = () => resolve();
        hiddenVideo!.onerror = () => reject(new Error('Gagal memuat video'));
      });

      const zip = new JSZip();
      const completed: {
        partNumber: number;
        filename: string;
        blob: Blob;
        durationSec: number;
      }[] = [];

      for (let i = 0; i < segments.length; i++) {
        if (controller.signal.aborted) break;

        const seg = segments[i];
        setBatchModalState((prev) => ({
          ...prev,
          currentSegmentIndex: i,
        }));

        const blob = await recordVideoSegment(
          hiddenVideo,
          seg.startTime,
          seg.endTime,
          settings,
          seg.partNumber,
          segments.length,
          (stats) => {
            if (typeof stats === 'object') {
              const partFraction = (stats.percent || 0) / 100;
              const overall = Math.min(
                98,
                Math.round(((i + partFraction) / segments.length) * 95)
              );
              setBatchModalState((prev) => ({
                ...prev,
                overallPercent: overall,
                currentPartPercent: stats.percent || 0,
                currentFps: stats.fps || prev.currentFps,
                speedMultiplier: stats.speedMultiplier || prev.speedMultiplier,
                etaSeconds: stats.etaSeconds || prev.etaSeconds,
                engine: stats.engine || prev.engine,
              }));
            }
          },
          controller.signal
        );

        const filename = `${baseFilename}-${settings.partPrefix}-${seg.partNumber}.mp4`;
        zip.file(filename, blob);

        completed.push({
          partNumber: seg.partNumber,
          filename,
          blob,
          durationSec: seg.duration,
        });

        setBatchModalState((prev) => ({
          ...prev,
          completedParts: [...completed],
          overallPercent: Math.round(((i + 1) / segments.length) * 95),
        }));
      }

      if (controller.signal.aborted) return;

      // Finalize ZIP archive
      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'STORE' },
        (meta) => {
          const zipPercent = Math.min(100, 95 + Math.round(meta.percent * 0.05));
          setBatchModalState((prev) => ({
            ...prev,
            overallPercent: zipPercent,
          }));
        }
      );

      setBatchModalState((prev) => ({
        ...prev,
        isCompleted: true,
        isExporting: false,
        overallPercent: 100,
        zipBlob,
      }));

      // Automatically trigger ZIP download
      downloadBlob(zipBlob, zipFilename);
    } catch (err: any) {
      if (controller.signal.aborted) {
        console.log('Export dibatalkan.');
      } else {
        console.error('Batch export error:', err);
        setBatchModalState((prev) => ({
          ...prev,
          isExporting: false,
          errorMessage: 'Gagal mengekspor video: ' + (err?.message || 'Silakan coba lagi.'),
        }));
      }
    } finally {
      if (hiddenVideo && hiddenVideo.parentNode) {
        document.body.removeChild(hiddenVideo);
      }
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 rounded-xl border border-purple-500/30">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Bagi Video Panjang Menjadi Klip 3 Menitan (Splitter)</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {segments.length} Part Dihasilkan
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Otomatis memotong video 30+ menit menjadi beberapa part per 3 menit (kurang/lebih) untuk Facebook, Reels & TikTok
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.splitEnabled}
            onChange={(e) => onUpdateSettings({ splitEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600 shadow-inner"></div>
        </label>
      </div>

      {settings.splitEnabled ? (
        <div className="space-y-4">
          {/* Quick Preset Buttons for Split Duration */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Pilih Durasi Per Potongan (Part):</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {splitPresets.map((preset) => {
                const isActive = settings.splitDurationSec === preset.sec;
                return (
                  <button
                    key={preset.sec}
                    type="button"
                    onClick={() => onUpdateSettings({ splitDurationSec: preset.sec })}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-lg shadow-purple-950/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-100 flex items-center justify-between">
                      <span>{preset.label}</span>
                      {isActive && <CheckCircle className="w-3.5 h-3.5 text-purple-400" />}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">{preset.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Duration Slider & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            {/* Custom Seconds / Minutes Slider */}
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Atur Durasi Dasar:</span>
                <span className="font-mono text-purple-400 font-bold">
                  {settings.splitDurationSec} detik ({Math.round((settings.splitDurationSec / 60) * 10) / 10} menit)
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={600}
                step={5}
                value={settings.splitDurationSec}
                onChange={(e) => onUpdateSettings({ splitDurationSec: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>15s (Story)</span>
                <span>60s (1m)</span>
                <span>180s (3m - Rekomendasi)</span>
                <span>300s (5m)</span>
                <span>600s (10m)</span>
              </div>
            </div>

            {/* Part Prefix & Auto Part Counter Toggle */}
            <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Label Awalan Part:</label>
                <input
                  type="text"
                  value={settings.partPrefix}
                  onChange={(e) => onUpdateSettings({ partPrefix: e.target.value })}
                  placeholder="Misal: Part, Eps, Bagian"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={settings.autoAddPartWatermark}
                  onChange={(e) => onUpdateSettings({ autoAddPartWatermark: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">
                  Aktifkan teks otomatis <b className="text-purple-300">Part 1, 2, dst.</b> pada video
                </span>
              </label>
            </div>
          </div>

          {/* Natural Random Duration Variation (Anti-Deteksi & Alami: +1s s/d +10s) */}
          <div className="bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-purple-950/40 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                  <Dices className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Variasi Durasi Acak / Alami (Anti-Deteksi Algoritma)</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {settings.randomDurationVariation !== false ? `+1s s/d +${settings.randomJitterMaxSec || 10}s Acak` : 'Nonaktif'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Membuat durasi setiap part berbeda alami (contoh: <span className="text-purple-300 font-mono font-bold">01:01</span>, <span className="text-pink-300 font-mono font-bold">01:04</span>, <span className="text-amber-300 font-mono font-bold">01:08</span>, <span className="text-cyan-300 font-mono font-bold">01:10</span>) agar tidak kaku & disukai algoritma Reels/TikTok/FB
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.randomDurationVariation !== false}
                  onChange={(e) => onUpdateSettings({ randomDurationVariation: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
              </label>
            </div>

            {settings.randomDurationVariation !== false && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Random Jitter Range Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-300">Rentang Tambahan Detik:</span>
                  {[
                    { label: '+1s s/d +5s', max: 5 },
                    { label: '+1s s/d +10s (Standar)', max: 10 },
                    { label: '+1s s/d +15s', max: 15 },
                  ].map((rng) => {
                    const isSelected = (settings.randomJitterMaxSec || 10) === rng.max;
                    return (
                      <button
                        key={rng.max}
                        type="button"
                        onClick={() => onUpdateSettings({ randomJitterMaxSec: rng.max })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {rng.label}
                      </button>
                    );
                  })}
                </div>

                {/* Shuffle / Re-roll seed button */}
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ randomSeed: (settings.randomSeed || 1) + 1 })}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Klik untuk mengacak ulang kombinasi detik setiap part"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>🎲 Acak Ulang Durasi (Re-Roll)</span>
                </button>
              </div>
            )}
          </div>

          {/* Auto Part Text Overlay Configurator */}
          {settings.autoAddPartWatermark && (
            <div className="bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-pink-950/30 border border-purple-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3.5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pink-500/20 text-pink-400 rounded-lg border border-pink-500/30">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Kustomisasi Teks Otomatis "Part 1, Part 2, Part 3..."</span>
                      <span className="px-1.5 py-0.2 bg-pink-500/20 text-pink-300 text-[10px] rounded-full border border-pink-500/30">
                        Otomatis Berubah Tiap Part
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Teks ini akan otomatis menyesuaikan nomor part (Part 1, Part 2, Part 3, dst.) di setiap video hasil potong
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Template Presets with Category Filter */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pilih Variasi Gaya Teks Part (1-Klik Terapkan):</span>
                  </label>
                  
                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    {[
                      { id: 'all', label: `🌟 Semua (${viralPartTemplates.length})` },
                      { id: 'viral', label: '🔥 Viral & CTA' },
                      { id: 'news', label: '🔴 TV & Berita' },
                      { id: 'luxury', label: '👑 Luxury & Cyber' },
                      { id: 'minimal', label: '✨ Minimalis' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id as any)}
                        className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                          selectedCategory === cat.id
                            ? 'bg-pink-600 text-white shadow-sm shadow-pink-600/40'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {viralPartTemplates
                    .filter((t) => selectedCategory === 'all' || t.category === selectedCategory)
                    .map((tmpl, idx) => {
                      const isSelected = partConfig.template === tmpl.template && partConfig.style === tmpl.style;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            updatePartConfig({
                              template: tmpl.template,
                              style: tmpl.style,
                              position: tmpl.pos,
                              fontFamily: tmpl.font,
                              animation: tmpl.anim,
                            });
                          }}
                          className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gradient-to-r from-pink-950/90 to-purple-950/90 border-pink-500 text-white shadow-lg ring-1 ring-pink-500'
                              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-200 text-[11px]">{tmpl.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-pink-300/90 font-mono line-clamp-1">
                            {tmpl.template
                              .replace(/{part}/gi, '1')
                              .replace(/{total}/gi, `${segments.length || 10}`)
                              .replace(/{prefix}/gi, settings.partPrefix || 'Part')
                              .replace(/{next_part}/gi, '2')}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Template Text Editor with Token Pills */}
              <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="text-slate-300 font-semibold">Format Teks Part:</span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>Klik tag untuk sisipkan:</span>
                    <button
                      type="button"
                      onClick={() => updatePartConfig({ template: `${partConfig.template} {part}` })}
                      className="px-1.5 py-0.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded border border-purple-500/40"
                    >
                      {'{part}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePartConfig({ template: `${partConfig.template} {total}` })}
                      className="px-1.5 py-0.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded border border-purple-500/40"
                    >
                      {'{total}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePartConfig({ template: `${partConfig.template} {next_part}` })}
                      className="px-1.5 py-0.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded border border-purple-500/40"
                    >
                      {'{next_part}'}
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={partConfig.template}
                  onChange={(e) => updatePartConfig({ template: e.target.value })}
                  placeholder="Misal: 🔥 {prefix} {part}/{total} • TONTON SAMPAI SELESAI 🔥"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2 outline-none focus:border-pink-500 font-medium"
                />

                {/* Simulated Live Preview of Text across Parts */}
                <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="text-slate-400">Pratinjau Hasil:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold shadow-sm">
                      {partConfig.template
                        .replace(/{part}/gi, '1')
                        .replace(/{total}/gi, `${segments.length || 10}`)
                        .replace(/{prefix}/gi, settings.partPrefix || 'Part')
                        .replace(/{next_part}/gi, '2')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold opacity-80">
                      {partConfig.template
                        .replace(/{part}/gi, '2')
                        .replace(/{total}/gi, `${segments.length || 10}`)
                        .replace(/{prefix}/gi, settings.partPrefix || 'Part')
                        .replace(/{next_part}/gi, '3')}
                    </span>
                    {segments.length > 2 && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                        ... Part {segments.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Style, Font, Position, Drag & Animation Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Banner Style */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">Gaya Plat / Banner:</label>
                  <select
                    value={partConfig.style}
                    onChange={(e) => updatePartConfig({ style: e.target.value as VideoTextBannerStyle })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-pink-500"
                  >
                    <option value="gradient-pill">💊 Gradient Pill (Pink-Amber)</option>
                    <option value="breaking-red">🔴 Breaking Red TV Bar</option>
                    <option value="dark-box">⬛ Dark Glass Plate</option>
                    <option value="luxury-gold">👑 Luxury Metallic Gold</option>
                    <option value="emerald-neon">🌿 Emerald Alert Neon</option>
                    <option value="purple-cyber">🔮 Purple Cyber Glow</option>
                    <option value="blue-ocean">🌊 Ocean Blue Pill</option>
                    <option value="retro-arcade">🕹️ Retro Arcade 8-bit</option>
                    <option value="sticker-white">🏷️ Stiker Putih 3D</option>
                    <option value="yellow-highlight">🟡 Stabilo Kuning Viral</option>
                    <option value="cyber-plate">💎 Cyber Cyan Glow</option>
                    <option value="solid-black">◾ Solid Black Box</option>
                    <option value="none">🚫 Tanpa Banner (Teks Saja)</option>
                  </select>
                </div>

                {/* Font Family */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">Gaya Huruf (Font):</label>
                  <select
                    value={partConfig.fontFamily || 'impact'}
                    onChange={(e) => updatePartConfig({ fontFamily: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-pink-500"
                  >
                    <option value="impact">💥 Impact (Tebal Viral & Padat)</option>
                    <option value="montserrat">✨ Montserrat (Modern & Tegas)</option>
                    <option value="outfit">💎 Outfit (Elegan & Bersih)</option>
                    <option value="poppins">🎈 Poppins (Rounded Halus)</option>
                    <option value="bangers">⚡ Bangers (Gaya Komik Seru)</option>
                    <option value="cyber">🤖 Orbitron (Futuristik / Cyber)</option>
                  </select>
                </div>

                {/* Animation */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">Efek Animasi Teks:</label>
                  <select
                    value={partConfig.animation}
                    onChange={(e) =>
                      updatePartConfig({
                        animation: e.target.value as VideoPartBadgeConfig['animation'],
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-pink-500"
                  >
                    <option value="pop-in-bounce">🌟 Pop In & Bounce (Viral)</option>
                    <option value="wave-float">🌊 Wave Float (Mengambang)</option>
                    <option value="neon-pulse">💫 Neon Pulse (Glow Berkedip)</option>
                    <option value="glitch-shake">💥 Glitch Shake Hook</option>
                    <option value="fade-slide-up">🎭 Fade & Slide Up</option>
                    <option value="none">🔤 Statis Tanpa Animasi</option>
                  </select>
                </div>
              </div>

              {/* Fitur Menggeser Posisi Format Teks Part Sesuai Keinginan */}
              <div className="bg-slate-950/90 border border-pink-500/30 rounded-xl p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-xs font-bold text-white">Geser Posisi Format Teks Part Sesuai Keinginan:</span>
                  </div>
                  <span className="text-[10px] text-pink-300 font-mono bg-pink-950/80 px-2 py-0.5 rounded border border-pink-500/30">
                    Posisi: X: {partConfig.customX ?? 50}% • Y: {partConfig.customY ?? 7}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Visual 2D Screen Touchpad */}
                  <div className="space-y-2">
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = Math.round(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
                        const clickY = Math.round(Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100)));
                        updatePartConfig({
                          position: 'custom',
                          customX: clickX,
                          customY: clickY,
                        });
                      }}
                      className="relative w-full h-28 bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 hover:border-pink-500 cursor-crosshair overflow-hidden transition-all group"
                      title="Klik di mana saja pada layar ini untuk menggeser teks part"
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

                      {/* Moving Part Badge on Pad */}
                      <div
                        style={{
                          left: `${partConfig.customX ?? 50}%`,
                          top: `${partConfig.customY ?? 7}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute px-2 py-0.5 bg-gradient-to-r from-pink-600 to-rose-600 border border-white/50 text-white rounded-full shadow-lg shadow-pink-600/40 pointer-events-none text-[9px] font-bold whitespace-nowrap"
                      >
                        Part 1
                      </div>

                      <div className="absolute bottom-1 right-1.5 text-[9px] text-slate-500 pointer-events-none group-hover:text-pink-400">
                        👆 Klik / Geser di layar mini ini
                      </div>
                    </div>

                    {/* Quick 3x3 D-Pad Matrix */}
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { label: '↖️ Kiri Atas', x: 18, y: 7, pos: 'top-left' as VideoPartBadgePosition },
                        { label: '⬆️ Atas Tengah', x: 50, y: 7, pos: 'top-center' as VideoPartBadgePosition },
                        { label: '↗️ Kanan Atas', x: 82, y: 7, pos: 'top-right' as VideoPartBadgePosition },
                        { label: '⬅️ Kiri Tengah', x: 18, y: 50, pos: 'custom' as VideoPartBadgePosition },
                        { label: '🎯 Tengah', x: 50, y: 50, pos: 'center' as VideoPartBadgePosition },
                        { label: '➡️ Kanan Tengah', x: 82, y: 50, pos: 'custom' as VideoPartBadgePosition },
                        { label: '↙️ Kiri Bawah', x: 18, y: 92, pos: 'bottom-left' as VideoPartBadgePosition },
                        { label: '⬇️ Bawah Tengah', x: 50, y: 92, pos: 'bottom-center' as VideoPartBadgePosition },
                        { label: '↘️ Kanan Bawah', x: 82, y: 92, pos: 'bottom-right' as VideoPartBadgePosition },
                      ].map((dp, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            updatePartConfig({
                              position: dp.pos,
                              customX: dp.x,
                              customY: dp.y,
                            })
                          }
                          className="px-1.5 py-1 bg-slate-900 hover:bg-pink-950/80 hover:border-pink-500/60 border border-slate-800 text-slate-300 hover:text-pink-300 text-[10px] rounded font-medium transition-all text-center"
                        >
                          {dp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Precision Sliders */}
                  <div className="space-y-2.5 flex flex-col justify-center">
                    {/* Horizontal X Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span className="font-semibold">Geser Horizontal (X):</span>
                        <div className="flex items-center gap-1 font-mono text-pink-400 font-bold">
                          <span>{partConfig.customX ?? 50}%</span>
                          <button
                            type="button"
                            onClick={() => updatePartConfig({ position: 'custom', customX: 50 })}
                            className="px-1.5 py-0.2 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                          >
                            Pusatkan
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updatePartConfig({
                              position: 'custom',
                              customX: Math.max(0, (partConfig.customX ?? 50) - 5),
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
                          value={partConfig.customX ?? 50}
                          onChange={(e) =>
                            updatePartConfig({
                              position: 'custom',
                              customX: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updatePartConfig({
                              position: 'custom',
                              customX: Math.min(100, (partConfig.customX ?? 50) + 5),
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
                        <div className="flex items-center gap-1 font-mono text-pink-400 font-bold">
                          <span>{partConfig.customY ?? 7}%</span>
                          <button
                            type="button"
                            onClick={() => updatePartConfig({ position: 'custom', customY: 7 })}
                            className="px-1.5 py-0.2 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                          >
                            Atas (7%)
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePartConfig({ position: 'custom', customY: 92 })}
                            className="px-1.5 py-0.2 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                          >
                            Bawah (92%)
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updatePartConfig({
                              position: 'custom',
                              customY: Math.max(0, (partConfig.customY ?? 7) - 5),
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
                          value={partConfig.customY ?? 7}
                          onChange={(e) =>
                            updatePartConfig({
                              position: 'custom',
                              customY: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updatePartConfig({
                              position: 'custom',
                              customY: Math.min(100, (partConfig.customY ?? 7) + 5),
                            })
                          }
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                        >
                          +5%
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Segments Grid Cards */}
          <div className="space-y-4">
            {/* Resolution & Quality Control (240p, 360p, 480p, 720p, 1080p) */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-amber-300 rounded-lg border border-amber-500/30">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Pilihan Kualitas & Ukuran File Export:</span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {settings.exportQuality || '720p'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Pilih 240p, 360p, atau 480p agar file download lebih ringan & tidak boros kuota/penyimpanan
                    </p>
                  </div>
                </div>

                {/* Live Resolution & Est Size Indicator */}
                {(() => {
                  const resConf = getExportResolutionConfig(
                    video.width || 1080,
                    video.height || 1920,
                    settings.aspectRatio,
                    settings.exportQuality || '720p',
                    settings.exportSpeedMode
                  );
                  return (
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400 text-[11px]">Dimensi Render:</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {resConf.width}x{resConf.height}px
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 text-[11px]">Est. Ukuran:</span>
                      <span className="font-bold text-emerald-400">
                        {resConf.estSizePerPart3Min}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Quality Options Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  {
                    id: '240p' as VideoExportQuality,
                    label: '240p',
                    name: 'Super Hemat',
                    size: '~3 - 6 MB/part',
                    icon: '⚡',
                    desc: 'Ukuran sangat kecil & download instan',
                    activeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-emerald-500/20',
                  },
                  {
                    id: '360p' as VideoExportQuality,
                    label: '360p',
                    name: 'Hemat Kuota',
                    size: '~8 - 12 MB/part',
                    icon: '📱',
                    desc: 'Ringan, cocok untuk HP & kuota hemat',
                    activeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-cyan-500/20',
                  },
                  {
                    id: '480p' as VideoExportQuality,
                    label: '480p',
                    name: 'SD Sedang',
                    size: '~15 - 22 MB/part',
                    icon: '🎬',
                    desc: 'Seimbang gambar cukup jelas & ukuran sedang',
                    activeColor: 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-blue-500/20',
                  },
                  {
                    id: '720p' as VideoExportQuality,
                    label: '720p',
                    name: 'HD Standar',
                    size: '~25 - 35 MB/part',
                    icon: '🌟',
                    desc: 'Jernih standar Reels, Shorts & TikTok',
                    activeColor: 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-purple-500/20',
                  },
                  {
                    id: '1080p' as VideoExportQuality,
                    label: '1080p',
                    name: 'Full HD',
                    size: '~55 - 75 MB/part',
                    icon: '💎',
                    desc: 'Visual tajam maksimal untuk master video',
                    activeColor: 'bg-pink-500/20 text-pink-300 border-pink-500 shadow-pink-500/20',
                  },
                ].map((q) => {
                  const isSelected = (settings.exportQuality || '720p') === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onUpdateSettings({ exportQuality: q.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? `${q.activeColor} shadow-md ring-1 ring-white/20`
                          : 'bg-slate-950/60 border-slate-800/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-xs font-black flex items-center gap-1 text-white">
                          <span>{q.icon}</span>
                          <span>{q.label}</span>
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[11px] font-bold block truncate">
                        {q.name}
                      </span>
                      <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-amber-300/90">{q.size}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Speed / Quality Mode & Batch Export Header */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Mode Render:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'turbo-fast', label: '⚡ Turbo Cepat', desc: 'Akselerasi GPU hardware kilat' },
                      { id: 'balanced', label: '⚖️ Seimbang', desc: 'Keseimbangan kecepatan dan detail' },
                      { id: 'ultra-quality', label: '💎 Ultra HQ', desc: 'Kualitas bitrate tinggi' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onUpdateSettings({ exportSpeedMode: m.id as any })}
                        title={m.desc}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all border ${
                          (settings.exportSpeedMode || 'turbo-fast') === m.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch Export Button */}
                <button
                  type="button"
                  id="btn-batch-export-zip-all"
                  onClick={handleExportAllPartsZip}
                  disabled={batchModalState.isExporting || segments.length === 0}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                >
                  {batchModalState.isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                      <span>Mengekspor ({batchModalState.overallPercent}%)</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                      <span>⚡ Export Semua {segments.length} Part ({settings.exportQuality || '720p'} ZIP)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Daftar Potongan Segmen ({segments.length} Klip Siap Export):</span>
              </label>
            </div>

            {/* Segments Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {segments.map((seg, idx) => {
                const isSelected = idx === selectedSegmentIndex;
                return (
                  <div
                    key={seg.index}
                    onClick={() => onSelectSegment(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-950/90 border-purple-500 text-white shadow-md shadow-purple-950/50 ring-1 ring-purple-500'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {seg.partNumber}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{settings.partPrefix} {seg.partNumber}</span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-purple-400/20 text-purple-200 border border-purple-400/40'
                                : 'bg-slate-800 text-purple-300 border border-slate-700'
                            }`}
                          >
                            ⏱️ {formatVideoTime(seg.duration)}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {formatVideoTime(seg.startTime)} - {formatVideoTime(seg.endTime)}
                          {settings.randomDurationVariation !== false && seg.duration > settings.splitDurationSec && (
                            <span className="ml-1.5 text-amber-400/90 font-sans text-[9px] font-bold">
                              (+{Math.round(seg.duration - settings.splitDurationSec)}s acak)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSegment(idx);
                        }}
                        className={`p-1.5 rounded-lg text-xs ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title="Tonton / Preview Part Ini"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSingleSegment(seg, idx);
                        }}
                        disabled={exportingCardIndex !== null || batchModalState.isExporting}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          exportingCardIndex === idx
                            ? 'bg-pink-600 text-white animate-pulse'
                            : 'bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white'
                        }`}
                        title="Download Part Ini Saja (Video + Audio)"
                      >
                        {exportingCardIndex === idx ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl text-center text-xs text-slate-400">
          Mode Split video nonaktif. Video akan diproses utuh sebagai satu kesatuan.
        </div>
      )}

      {/* Video Hardware-Accelerated Export Modal */}
      <VideoExportModal
        state={batchModalState}
        onClose={handleCloseModal}
        onCancel={handleCancelExport}
        onDownloadSingle={handleDownloadSinglePartBlob}
        onDownloadZip={handleDownloadZipArchive}
        segments={segments}
        partPrefix={settings.partPrefix || 'PART'}
        exportQuality={settings.exportQuality || '720p'}
      />
    </div>
  );
};
