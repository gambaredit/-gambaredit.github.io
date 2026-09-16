import React from 'react';
import { Sparkles, Layers, Image as ImageIcon, Zap, CheckCircle2, Video, Film } from 'lucide-react';

interface NavbarProps {
  imageCount: number;
  activeLogoCount: number;
  processedCount: number;
  isProcessing: boolean;
  onProcessAll: () => void;
  activeStudioMode: 'video' | 'photo';
  onSelectStudioMode: (mode: 'video' | 'photo') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  imageCount,
  activeLogoCount,
  processedCount,
  isProcessing,
  onProcessAll,
  activeStudioMode,
  onSelectStudioMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
            {activeStudioMode === 'video' ? (
              <Film className="w-5 h-5 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Viral Studio AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-amber-300" /> Video & Foto
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {activeStudioMode === 'video'
                ? 'Split Video 3 Menit, Watermark PNG Transparan & Teks Animasi'
                : 'Batch Image Resizer 4:5, AI Upscaling & Viral Hook 3D'}
            </p>
          </div>
        </div>

        {/* Studio Mode Selector (Video vs Photo) */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => onSelectStudioMode('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeStudioMode === 'video'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>🎬 Edit Video (3 Mnt)</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStudioMode('photo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeStudioMode === 'photo'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>📸 Edit Foto FB</span>
          </button>
        </div>

        {/* Stats & Quick Actions */}
        <div className="flex items-center space-x-2">
          {activeStudioMode === 'photo' && (
            <>
              <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-1">
                  <ImageIcon className="w-3 h-3 text-blue-400" />
                  <span>{imageCount} Foto</span>
                </div>
                <span className="text-slate-600">|</span>
                <div className="flex items-center space-x-1">
                  <Layers className="w-3 h-3 text-pink-400" />
                  <span>{activeLogoCount} Logo</span>
                </div>
              </div>

              <button
                id="navbar-process-btn"
                onClick={onProcessAll}
                disabled={isProcessing || imageCount === 0}
                className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-md ${
                  isProcessing
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : imageCount === 0
                    ? 'bg-slate-800 text-slate-500 border border-slate-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 active:scale-95'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : 'text-amber-300'}`} />
                <span className="hidden sm:inline">{isProcessing ? 'Memproses...' : 'Proses Semua'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

