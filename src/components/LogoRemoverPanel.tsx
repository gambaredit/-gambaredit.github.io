import React, { useState } from 'react';
import {
  Eraser,
  Sparkles,
  RefreshCw,
  Trash2,
  Plus,
  Layers,
  Eye,
  Sliders,
  CheckCircle2,
  Image as ImageIcon,
  Shield,
  HelpCircle,
  Move,
  ArrowRight,
  Sun,
  Palette,
  Check,
  AlertCircle,
  Loader2,
  Wand2,
} from 'lucide-react';
import {
  FilterSettings,
  LogoItem,
  LogoRemoverRegion,
  LogoRemovalMode,
  LogoRemoverSettings,
  FillSourceDirection,
  ProcessedImageItem,
} from '../types';
import { applyLogoRemoverRegions } from '../utils/imageProcessor';

interface LogoRemoverPanelProps {
  settings: FilterSettings;
  onUpdateSettings: (partial: Partial<FilterSettings>) => void;
  onLivePreviewUpdate: () => void;
  logos: LogoItem[];
  onChangeLogos?: (logos: LogoItem[]) => void;
  onSelectViewerMode?: (mode: 'split' | 'side-by-side' | 'drag-editor') => void;
  currentImage?: ProcessedImageItem | null;
  onReplaceCurrentImage?: (newCleanUrl: string) => void;
}

export const LogoRemoverPanel: React.FC<LogoRemoverPanelProps> = ({
  settings,
  onUpdateSettings,
  onLivePreviewUpdate,
  logos,
  onChangeLogos,
  onSelectViewerMode,
  currentImage,
  onReplaceCurrentImage,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [isCleaningWithAI, setIsCleaningWithAI] = useState(false);
  const [cleanSuccessMsg, setCleanSuccessMsg] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const removerSettings: LogoRemoverSettings = settings.logoRemover || {
    enabled: false,
    regions: [],
  };

  const isEnabled = removerSettings.enabled && removerSettings.regions.length > 0;

  const updateRemover = (partial: Partial<LogoRemoverSettings>) => {
    const updated = {
      ...removerSettings,
      ...partial,
    };
    onUpdateSettings({ logoRemover: updated });
    onLivePreviewUpdate();
  };

  // 1-Click Total Inpaint & AI Cleaning Execution that converts dirty source photo to clean photo
  const handleExecuteTotalClean = async () => {
    if (!currentImage) return;
    setIsCleaningWithAI(true);
    setAiError(null);
    setCleanSuccessMsg(null);

    try {
      // Step 1: Render high-resolution canvas with pristine multi-directional patch synthesis
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = currentImage.originalUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1080;
      canvas.height = img.naturalHeight || 1350;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      ctx.drawImage(img, 0, 0);

      // Define default clean regions for BFF heart (center chest) and Breaking News banner (bottom left)
      const cleanRegions: LogoRemoverRegion[] = [
        {
          id: 'clean-bff-heart',
          name: '💖 Stiker BFF Dada',
          enabled: true,
          x: 43,
          y: 39,
          width: 36,
          height: 30,
          mode: 'clone-stamp-patch',
          fillSource: 'clone-left',
          feather: 16,
        },
        {
          id: 'clean-breaking-news',
          name: '📢 Breaking News Banner',
          enabled: true,
          x: 8,
          y: 81,
          width: 44,
          height: 18,
          mode: 'clone-stamp-patch',
          fillSource: 'clone-top',
          feather: 12,
        },
      ];

      // If user had custom regions configured, use user's enabled regions instead
      const regionsToApply =
        removerSettings.regions.length > 0 && removerSettings.enabled
          ? removerSettings.regions
          : cleanRegions;

      const cleanSettings: FilterSettings = {
        ...settings,
        logoRemover: {
          enabled: true,
          regions: regionsToApply,
        },
      };

      await applyLogoRemoverRegions(ctx, canvas.width, canvas.height, cleanSettings, logos);

      const cleanedDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      // Replace source image
      if (onReplaceCurrentImage) {
        onReplaceCurrentImage(cleanedDataUrl);
      }

      // Disable remover overlay boxes since image is now cleanly baked
      updateRemover({ enabled: false, regions: [] });

      setCleanSuccessMsg('✨ Foto berhasil dibersihkan dari stiker BFF & Breaking News!');
      setTimeout(() => setCleanSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Clean execution error:', err);
      setAiError(err.message || 'Gagal membersihkan foto');
    } finally {
      setIsCleaningWithAI(false);
    }
  };

  const handleToggleMaster = (checked: boolean) => {
    if (checked && removerSettings.regions.length === 0) {
      // Auto add first common top-right or top-left region
      const defaultRegion: LogoRemoverRegion = {
        id: `remover-${Date.now()}`,
        name: 'Area Logo 1 (Pojok Kanan Atas)',
        enabled: true,
        x: 75,
        y: 3,
        width: 22,
        height: 9,
        mode: 'replace-my-logo',
        feather: 10,
        replaceWithLogoId: logos[0]?.id,
        coverPlateStyle: 'transparent',
      };
      updateRemover({ enabled: true, regions: [defaultRegion] });
      setSelectedRegionId(defaultRegion.id);
    } else {
      updateRemover({ enabled: checked });
    }
  };

  // 1-Click Dual Eraser for BFF (Tengah) & Breaking News (Kiri Bawah)
  const handleAddBffAndBreakingNewsPreset = () => {
    const bffRegion: LogoRemoverRegion = {
      id: `remover-bff-${Date.now()}`,
      name: '💖 Stiker BFF (Tengah/Dada)',
      enabled: true,
      x: 44,
      y: 40,
      width: 34,
      height: 28,
      mode: 'content-aware-heal',
      fillSource: 'clone-left',
      feather: 14,
      blurStrength: 18,
      replaceWithLogoId: logos[0]?.id,
      coverPlateStyle: 'transparent',
    };

    const breakingNewsRegion: LogoRemoverRegion = {
      id: `remover-bn-${Date.now() + 1}`,
      name: '📢 Breaking News (Kiri Bawah)',
      enabled: true,
      x: 10,
      y: 82,
      width: 40,
      height: 16,
      mode: 'content-aware-heal',
      fillSource: 'clone-top',
      feather: 10,
      blurStrength: 15,
      replaceWithLogoId: logos[0]?.id,
      coverPlateStyle: 'transparent',
    };

    updateRemover({ enabled: true, regions: [bffRegion, breakingNewsRegion] });
    setSelectedRegionId(bffRegion.id);
  };

  // Quick Preset Adders
  const handleAddPresetCorner = (
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'bff-center' | 'breaking-news',
    mode: LogoRemovalMode = 'content-aware-heal'
  ) => {
    let x = 75;
    let y = 3;
    let width = 22;
    let height = 9;
    let name = 'Logo Kanan Atas';
    let fillSource: FillSourceDirection = 'auto-surrounding';

    if (corner === 'bff-center') {
      x = 44;
      y = 40;
      width = 34;
      height = 28;
      name = '💖 Stiker BFF (Tengah/Dada)';
      fillSource = 'clone-left';
    } else if (corner === 'breaking-news') {
      x = 10;
      y = 82;
      width = 40;
      height = 16;
      name = '📢 Breaking News (Kiri Bawah)';
      fillSource = 'clone-top';
    } else if (corner === 'top-left') {
      x = 3;
      y = 3;
      width = 22;
      height = 9;
      name = 'Logo Kiri Atas';
    } else if (corner === 'top-right') {
      x = 75;
      y = 3;
      width = 22;
      height = 9;
      name = 'Logo Kanan Atas';
    } else if (corner === 'bottom-left') {
      x = 3;
      y = 88;
      width = 26;
      height = 9;
      name = 'Logo Kiri Bawah';
    } else if (corner === 'bottom-right') {
      x = 71;
      y = 88;
      width = 26;
      height = 9;
      name = 'Logo Kanan Bawah';
    } else if (corner === 'center') {
      x = 35;
      y = 40;
      width = 32;
      height = 20;
      name = 'Logo Tengah / Watermark';
    }

    const newRegion: LogoRemoverRegion = {
      id: `remover-${Date.now()}`,
      name,
      enabled: true,
      x,
      y,
      width,
      height,
      mode,
      fillSource,
      feather: 12,
      replaceWithLogoId: logos[0]?.id,
      coverPlateStyle: mode === 'cover-badge' ? 'dark-glass' : 'transparent',
    };

    const newRegions = [...removerSettings.regions, newRegion];
    updateRemover({ enabled: true, regions: newRegions });
    setSelectedRegionId(newRegion.id);
  };

  const handleUpdateRegion = (id: string, partial: Partial<LogoRemoverRegion>) => {
    const updated = removerSettings.regions.map((r) =>
      r.id === id ? { ...r, ...partial } : r
    );
    updateRemover({ regions: updated });
  };

  const handleRemoveRegion = (id: string) => {
    const updated = removerSettings.regions.filter((r) => r.id !== id);
    updateRemover({
      regions: updated,
      enabled: updated.length > 0 ? removerSettings.enabled : false,
    });
    if (selectedRegionId === id) {
      setSelectedRegionId(updated[0]?.id || null);
    }
  };

  const activeRegion =
    removerSettings.regions.find((r) => r.id === selectedRegionId) ||
    removerSettings.regions[0];

  return (
    <div
      id="logo-remover-panel"
      className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-rose-400 rounded-xl border border-rose-500/30 shadow-inner">
            <Eraser className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Hapus / Ganti Logo Lama & Stiker</span>
              </h3>
              {isEnabled ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                  <span>{removerSettings.regions.filter((r) => r.enabled).length} Area Aktif</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                  <span>Nonaktif</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Hilangkan stiker BFF, banner Breaking News, watermark/logo lama, atau ganti otomatis dengan logo Anda
            </p>
          </div>
        </div>

        {/* Action Controls & Master Switch */}
        <div className="flex items-center gap-2">
          {currentImage && (
            <button
              type="button"
              onClick={handleExecuteTotalClean}
              disabled={isCleaningWithAI}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/40 border border-emerald-400/40 transition-all flex items-center gap-1.5"
            >
              {isCleaningWithAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sedang Membersihkan...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>✨ Bersihkan Total Foto Ini</span>
                </>
              )}
            </button>
          )}

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="toggle-master-logo-remover"
              checked={removerSettings.enabled}
              onChange={(e) => handleToggleMaster(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-rose-500 peer-checked:to-amber-500 shadow-inner"></div>
          </label>
        </div>
      </div>

      {cleanSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{cleanSuccessMsg}</span>
        </div>
      )}

      {aiError && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {/* Main Content when Enabled */}
      {removerSettings.enabled ? (
        <div className="space-y-4 pt-1">
          {/* Quick Corner Preset Picker */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
            {/* 1-Click Special Case for BFF & Breaking News */}
            <div className="p-2.5 bg-gradient-to-r from-rose-950/70 via-purple-950/60 to-slate-900 border border-rose-500/50 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-base">💖</span>
                <div>
                  <div className="text-xs font-black text-rose-200 flex items-center gap-1.5">
                    <span>1-Klik Hapus Stiker BFF (Tengah) & Breaking News (Kiri Bawah)</span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-rose-500 text-white font-bold rounded">KHUSUS FOTO INI</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Otomatis buat 2 area pembersih presisi untuk stiker dada BFF & banner Breaking News
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddBffAndBreakingNewsPreset}
                className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-lg shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Terapkan Pembersih BFF & Breaking News</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-rose-300 pt-1">
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-rose-400" /> Atau Tambah Area Hapus Logo Spesifik:
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Klik 1-Tombol Cepat</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'bff-center', label: '💖 Stiker BFF Tengah', desc: 'Area Dada / Tengah', highlight: true },
                { id: 'breaking-news', label: '📢 Breaking News', desc: 'Banner Kiri Bawah', highlight: true },
                { id: 'top-right', label: '↗ Kanan Atas', desc: 'Logo TV/Akun' },
                { id: 'top-left', label: '↖ Kiri Atas', desc: 'Logo Fanpage' },
                { id: 'bottom-right', label: '↘ Kanan Bawah', desc: 'ID / Tanggal' },
                { id: 'bottom-left', label: '↙ Kiri Bawah', desc: 'TikTok / Watermark' },
                { id: 'center', label: '• Tengah / Bebas', desc: 'Watermark Tengah' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleAddPresetCorner(
                      item.id as any,
                      'content-aware-heal'
                    )
                  }
                  className={`py-2 px-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    item.highlight
                      ? 'bg-rose-950/50 border-rose-500/50 text-rose-200 hover:bg-rose-900/60 ring-1 ring-rose-500/30'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold">{item.label}</span>
                  <span className="text-[9px] text-slate-400">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Region Tabs (if multiple) */}
          {removerSettings.regions.length > 0 && (
            <div className="space-y-3">
              {/* Region Pill Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {removerSettings.regions.map((region, idx) => {
                  const isSel = (activeRegion?.id === region.id);
                  return (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => setSelectedRegionId(region.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 border transition-all ${
                        isSel
                          ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Eraser className="w-3 h-3" />
                      <span>{region.name || `Area ${idx + 1}`}</span>
                      {!region.enabled && (
                        <span className="text-[9px] bg-black/40 px-1 rounded text-slate-400">Off</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Region Editor Card */}
              {activeRegion && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-4">
                  {/* Top Header of Selected Region */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={activeRegion.name}
                        onChange={(e) =>
                          handleUpdateRegion(activeRegion.id, { name: e.target.value })
                        }
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                      />
                      <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeRegion.enabled}
                          onChange={(e) =>
                            handleUpdateRegion(activeRegion.id, { enabled: e.target.checked })
                          }
                          className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/20"
                        />
                        <span>Aktifkan Area Ini</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRegion(activeRegion.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Hapus Area Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. AKSI PADA LOGO LAMA (ACTION MODE) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-200">
                      Pilih Aksi Penghapusan / Penggantian:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Mode 1: Replace with My Logo */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateRegion(activeRegion.id, { mode: 'replace-my-logo' })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          activeRegion.mode === 'replace-my-logo'
                            ? 'bg-gradient-to-r from-rose-950/60 to-amber-950/60 border-rose-500/60 ring-1 ring-rose-500/40 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        }`}
                      >
                        <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-rose-200 flex items-center gap-1">
                            <span>🔄 Ganti dengan Logo Saya</span>
                            <span className="text-[9px] bg-rose-500 text-white px-1 py-0.2 rounded font-black">
                              FAVORIT
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Hapus logo lama & otomatis tempatkan logo Anda di posisi yang sama
                          </p>
                        </div>
                      </button>

                      {/* Mode 2: Content-Aware Clean Erase */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateRegion(activeRegion.id, { mode: 'content-aware-heal' })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          activeRegion.mode === 'content-aware-heal'
                            ? 'bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border-emerald-500/60 ring-1 ring-emerald-500/40 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        }`}
                      >
                        <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-emerald-200">
                            ✨ Hapus Bersih (Content-Aware)
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Hilangkan logo tanpa jejak, menyatu mulus dengan warna latar belakang
                          </p>
                        </div>
                      </button>

                      {/* Mode 3: Cover Badge Plate + Logo */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateRegion(activeRegion.id, {
                            mode: 'cover-badge',
                            coverPlateStyle: 'dark-glass',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          activeRegion.mode === 'cover-badge'
                            ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-500/60 ring-1 ring-indigo-500/40 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        }`}
                      >
                        <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0 mt-0.5">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-indigo-200">
                            🛡️ Timpa Plat Badge + Logo
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Tutup logo lama dengan plat kaca gelap / capsule elegan berisi logo Anda
                          </p>
                        </div>
                      </button>

                      {/* Mode 4: Smart Blur */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateRegion(activeRegion.id, { mode: 'smart-blur' })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          activeRegion.mode === 'smart-blur'
                            ? 'bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border-cyan-500/60 ring-1 ring-cyan-500/40 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        }`}
                      >
                        <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg shrink-0 mt-0.5">
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-cyan-200">
                            🌫️ Blur Halus Tersamar
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Samarkan teks/watermark logo lama dengan efek blur lembut
                          </p>
                        </div>
                      </button>

                      {/* Mode 5: Clone Stamp / Tambal dari Sekitar */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateRegion(activeRegion.id, {
                            mode: 'clone-stamp-patch',
                            fillSource: activeRegion.fillSource || 'clone-left',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 sm:col-span-2 ${
                          activeRegion.mode === 'clone-stamp-patch'
                            ? 'bg-gradient-to-r from-fuchsia-950/60 to-rose-950/60 border-fuchsia-500/60 ring-1 ring-fuchsia-500/40 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        }`}
                      >
                        <div className="p-1.5 bg-fuchsia-500/20 text-fuchsia-400 rounded-lg shrink-0 mt-0.5">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-fuchsia-200 flex items-center gap-1.5">
                            <span>🩹 Clone Stamp / Tambal Tekstur Sekitar (Baju / Kain / Kasur)</span>
                            <span className="text-[9px] bg-fuchsia-500 text-white px-1 py-0.2 rounded font-black">
                              BAGUS UNTUK STIKER BESAR
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Mengambil sampel kain kimono / kasur / kulit bersih dari sebelah dan menambalnya dengan transisi tepi halus
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Clone Stamp Source Direction Controls */}
                    {activeRegion.mode === 'clone-stamp-patch' && (
                      <div className="mt-2.5 p-3 bg-fuchsia-950/30 border border-fuchsia-500/30 rounded-xl space-y-2">
                        <span className="text-xs font-bold text-fuchsia-300 block">
                          Pilih Arah Sampel Tekstur Penambal:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { id: 'clone-left', label: '⬅ Dari Kiri (Baju Kiri)', desc: 'Cocok utk stiker dada' },
                            { id: 'clone-right', label: '➡️ Dari Kanan (Baju Kanan)', desc: 'Ambil sisi kanan' },
                            { id: 'clone-top', label: '⬆ Dari Atas', desc: 'Ambil area atas' },
                            { id: 'clone-bottom', label: '⬇ Dari Bawah', desc: 'Ambil area bawah' },
                          ].map((dir) => (
                            <button
                              key={dir.id}
                              type="button"
                              onClick={() =>
                                handleUpdateRegion(activeRegion.id, {
                                  fillSource: dir.id as any,
                                })
                              }
                              className={`p-2 rounded-lg border text-left text-xs font-semibold transition-all ${
                                activeRegion.fillSource === dir.id
                                  ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className="font-bold">{dir.label}</div>
                              <div className="text-[9px] opacity-75">{dir.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. REPLACEMENT LOGO SELECTOR (If Replace Mode or Cover Badge) */}
                  {(activeRegion.mode === 'replace-my-logo' || activeRegion.mode === 'cover-badge') && (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pilih Logo Pengganti Milik Anda:</span>
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {logos.length} Logo Tersedia di Galeri
                        </span>
                      </div>

                      {/* Logo selector chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {logos.map((logo) => {
                          const isPicked =
                            activeRegion.replaceWithLogoId === logo.id ||
                            (!activeRegion.replaceWithLogoId && logos[0]?.id === logo.id);
                          return (
                            <button
                              key={logo.id}
                              type="button"
                              onClick={() =>
                                handleUpdateRegion(activeRegion.id, {
                                  replaceWithLogoId: logo.id,
                                })
                              }
                              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                                isPicked
                                  ? 'bg-amber-500/20 border-amber-500/60 ring-1 ring-amber-400 text-white shadow-sm'
                                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              <img
                                src={logo.url}
                                alt={logo.name}
                                className="w-7 h-7 object-contain rounded bg-black/40 p-0.5 border border-white/10 shrink-0"
                              />
                              <div className="overflow-hidden">
                                <span className="text-[11px] font-bold block truncate text-slate-200">
                                  {logo.name}
                                </span>
                                <span className="text-[9px] text-slate-500 block truncate">
                                  {isPicked ? '✓ Terpilih' : 'Klik pasang'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Cover plate styling option if cover-badge */}
                      {activeRegion.mode === 'cover-badge' && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Gaya Plat Latar:</span>
                          <div className="flex items-center gap-1.5">
                            {[
                              { id: 'dark-glass', label: 'Dark Glass' },
                              { id: 'blur-pill', label: 'Neon Capsule' },
                              { id: 'solid-pill', label: 'Solid Card' },
                              { id: 'white-card', label: 'White Card' },
                            ].map((style) => (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() =>
                                  handleUpdateRegion(activeRegion.id, {
                                    coverPlateStyle: style.id as any,
                                  })
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  (activeRegion.coverPlateStyle || 'dark-glass') === style.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. FINE-TUNING SLIDERS: POSISI & UKURAN KOTAK */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                      <span className="flex items-center gap-1.5 text-rose-300">
                        <Sliders className="w-3.5 h-3.5 text-rose-400" /> Atur Presisi Kotak Penghapus:
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        X: {activeRegion.x}% • Y: {activeRegion.y}% • L: {activeRegion.width}% • T: {activeRegion.height}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Posisi X */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Posisi Horizontal (X)</span>
                          <span className="text-rose-400 font-mono font-bold">{activeRegion.x}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="95"
                          value={activeRegion.x}
                          onChange={(e) =>
                            handleUpdateRegion(activeRegion.id, { x: Number(e.target.value) })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                      </div>

                      {/* Posisi Y */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Posisi Vertikal (Y)</span>
                          <span className="text-rose-400 font-mono font-bold">{activeRegion.y}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="95"
                          value={activeRegion.y}
                          onChange={(e) =>
                            handleUpdateRegion(activeRegion.id, { y: Number(e.target.value) })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                      </div>

                      {/* Lebar Kotak */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Lebar Area Logo (Width)</span>
                          <span className="text-rose-400 font-mono font-bold">{activeRegion.width}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="80"
                          value={activeRegion.width}
                          onChange={(e) =>
                            handleUpdateRegion(activeRegion.id, { width: Number(e.target.value) })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                      </div>

                      {/* Tinggi Kotak */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Tinggi Area Logo (Height)</span>
                          <span className="text-rose-400 font-mono font-bold">{activeRegion.height}%</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="60"
                          value={activeRegion.height}
                          onChange={(e) =>
                            handleUpdateRegion(activeRegion.id, { height: Number(e.target.value) })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                      </div>
                    </div>

                    {/* Kelembutan Tepi (Feather) */}
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1 text-xs">
                        <span className="flex items-center gap-1 text-slate-300">
                          <span>Kelembutan Tepi Transisi (Feathering)</span>
                        </span>
                        <span className="text-rose-400 font-mono font-bold">
                          {activeRegion.feather || 10}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={activeRegion.feather || 10}
                        onChange={(e) =>
                          handleUpdateRegion(activeRegion.id, { feather: Number(e.target.value) })
                        }
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                        <span>Tegas (Logo Tajam)</span>
                        <span>Halus Menyatu (Rekomendasi)</span>
                        <span>Ultra Blur Blend</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Disabled State Placeholder */
        <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-4 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Foto yang Anda upload memiliki logo orang lain / watermark? Aktifkan fitur ini untuk menghapus atau menggantinya seketika dengan logo Anda sendiri.
          </p>
          <button
            type="button"
            onClick={() => handleToggleMaster(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-1.5 mx-auto"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Aktifkan Penghapus / Pengganti Logo</span>
          </button>
        </div>
      )}
    </div>
  );
};
