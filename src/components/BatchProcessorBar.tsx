import React from 'react';
import { Zap, Download, Archive, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ProcessedImageItem } from '../types';

interface BatchProcessorBarProps {
  images: ProcessedImageItem[];
  isProcessing: boolean;
  progressPercent: number;
  currentProcessingIndex: number;
  onProcessAll: () => void;
  onDownloadAllZip: () => void;
  isZipping: boolean;
}

export const BatchProcessorBar: React.FC<BatchProcessorBarProps> = ({
  images,
  isProcessing,
  progressPercent,
  currentProcessingIndex,
  onProcessAll,
  onDownloadAllZip,
  isZipping,
}) => {
  const total = images.length;
  const doneCount = images.filter((img) => img.status === 'done').length;
  const hasDoneImages = doneCount > 0;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Status & Info */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" /> 1-KLIK BATCH ENGINE
            </span>
            {hasDoneImages && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {doneCount} / {total} Gambar Siap Download
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Terapkan Filter AI & Multi-Logo ke Semua Gambar
          </h2>
          <p className="text-xs text-slate-400">
            Satu klik untuk memproses puluhan gambar sekaligus dengan resolusi tinggi siap posting ke Facebook.
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Main 1-Click Process Button */}
          <button
            id="batch-process-all-main-btn"
            type="button"
            onClick={onProcessAll}
            disabled={isProcessing || total === 0}
            className={`px-5 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 transition-all shadow-lg min-w-[200px] ${
              isProcessing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : total === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:from-blue-500 hover:via-indigo-500 hover:to-pink-500 text-white shadow-indigo-600/30 active:scale-95'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>Memproses ({currentProcessingIndex + 1}/{total})...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                <span>⚡ PROSES SEMUA (1-KLIK)</span>
              </>
            )}
          </button>

          {/* Download All ZIP Button */}
          {hasDoneImages && (
            <button
              id="download-all-zip-btn"
              type="button"
              onClick={onDownloadAllZip}
              disabled={isZipping || isProcessing}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 active:scale-95 border border-emerald-500/40"
            >
              {isZipping ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Membuat ZIP...</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 text-emerald-200" />
                  <span>Download Semua ({doneCount} Foto .ZIP)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (Visible during batch processing) */}
      {isProcessing && (
        <div className="mt-4 pt-3 border-t border-indigo-500/20">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Sedang memproses gambar ke-{currentProcessingIndex + 1} dari {total}...
            </span>
            <span className="font-mono text-indigo-300 font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
