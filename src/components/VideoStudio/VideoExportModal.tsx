import React from 'react';
import {
  X,
  CheckCircle2,
  Download,
  Loader2,
  Zap,
  Cpu,
  Clock,
  Film,
  PackageCheck,
  AlertCircle,
  FileArchive,
} from 'lucide-react';
import { VideoSegmentItem } from '../../types';
import { formatVideoTime } from '../../utils/videoProcessor';

export interface ExportBatchState {
  isOpen: boolean;
  isCompleted: boolean;
  isExporting: boolean;
  totalSegments: number;
  currentSegmentIndex: number;
  overallPercent: number;
  currentPartPercent: number;
  currentFps: number;
  speedMultiplier: number;
  etaSeconds: number;
  engine: 'webcodecs' | 'mediarecorder';
  completedParts: {
    partNumber: number;
    filename: string;
    blob: Blob;
    durationSec: number;
  }[];
  zipBlob: Blob | null;
  zipFilename: string;
  errorMessage?: string;
}

interface VideoExportModalProps {
  state: ExportBatchState;
  onClose: () => void;
  onCancel: () => void;
  onDownloadSingle: (blob: Blob, filename: string) => void;
  onDownloadZip: () => void;
  segments: VideoSegmentItem[];
  partPrefix: string;
  exportQuality?: string;
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({
  state,
  onClose,
  onCancel,
  onDownloadSingle,
  onDownloadZip,
  segments,
  partPrefix,
  exportQuality = '720p',
}) => {
  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="video-export-batch-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Fast Hardware Render & Export</span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {exportQuality}
                </span>
                {state.engine === 'webcodecs' ? (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    GPU ⚡
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    Media Engine
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {state.isCompleted
                  ? 'Semua part berhasil diproses & siap didownload'
                  : 'Memotong, memberi watermark teks, dan mengompres video dengan akselerasi perangkat keras'}
              </p>
            </div>
          </div>

          {!state.isExporting && (
            <button
              id="btn-close-export-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Main Progress Indicator */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                {state.isExporting && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                {state.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                <span>
                  {state.isCompleted
                    ? '🎉 Proses Export 100% Selesai!'
                    : `Sedang memproses ${partPrefix} ${state.currentSegmentIndex + 1} dari ${state.totalSegments}...`}
                </span>
              </div>
              <span className="font-mono font-black text-amber-400 text-sm">
                {state.overallPercent}%
              </span>
            </div>

            {/* Main Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800">
              <div
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 h-full rounded-full transition-all duration-200 shadow-[0_0_12px_#f59e0b]"
                style={{ width: `${Math.max(2, state.overallPercent)}%` }}
              />
            </div>

            {/* Performance Stats telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Kecepatan Render:</span>
                <span className="font-bold text-amber-300 font-mono">
                  {state.currentFps > 0 ? `${state.currentFps} FPS` : 'Memulai...'}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Multi-Speed:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {state.speedMultiplier > 0 ? `${state.speedMultiplier}x Realtime` : '1.0x'}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Perkiraan Sisa:</span>
                <span className="font-bold text-slate-200 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {state.isCompleted
                    ? '0 detik'
                    : state.etaSeconds > 0
                    ? `~${state.etaSeconds}s`
                    : 'Menghitung...'}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Part Selesai:</span>
                <span className="font-bold text-purple-300 font-mono">
                  {state.completedParts.length} / {state.totalSegments} Part
                </span>
              </div>
            </div>
          </div>

          {/* Error notice if any */}
          {state.errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{state.errorMessage}</span>
            </div>
          )}

          {/* List of Segments & Individual Download Status */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Status Potongan Segmen:</span>
              <span className="text-slate-500 font-normal text-[11px]">
                {state.completedParts.length} siap diunduh
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {segments.map((seg, idx) => {
                const completedItem = state.completedParts.find(
                  (p) => p.partNumber === seg.partNumber
                );
                const isCurrent = state.isExporting && state.currentSegmentIndex === idx;

                return (
                  <div
                    key={seg.id}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 text-xs ${
                      completedItem
                        ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-200'
                        : isCurrent
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-200 shadow-sm animate-pulse'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {completedItem ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                          {idx + 1}
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-bold block truncate">
                          {partPrefix} {seg.partNumber}
                        </span>
                        <span className="text-[10px] opacity-75 font-mono">
                          {formatVideoTime(seg.startTime)} - {formatVideoTime(seg.endTime)} ({Math.round(seg.duration)}s)
                        </span>
                      </div>
                    </div>

                    {completedItem && (
                      <button
                        id={`btn-download-part-${seg.partNumber}`}
                        onClick={() => onDownloadSingle(completedItem.blob, completedItem.filename)}
                        title="Download Part Ini Saja"
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>MP4</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          {state.isExporting ? (
            <button
              id="btn-cancel-export"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-red-900/60 hover:border-red-500/50 border border-slate-700 text-slate-300 hover:text-red-200 text-xs font-bold rounded-xl transition-all"
            >
              Batalkan Export
            </button>
          ) : (
            <button
              id="btn-close-finished-modal"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
            >
              Tutup Dialog
            </button>
          )}

          {state.isCompleted && (
            <button
              id="btn-download-all-zip-modal"
              onClick={onDownloadZip}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform active:scale-95 animate-bounce"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Download Semua Part (.ZIP)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
