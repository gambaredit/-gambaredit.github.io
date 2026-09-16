import React from 'react';
import { Image as ImageIcon, CheckCircle, Clock, Trash2, Plus, Sparkles, AlertTriangle } from 'lucide-react';
import { ProcessedImageItem } from '../types';

interface ImageBatchListProps {
  images: ProcessedImageItem[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
  onRemoveImage: (id: string) => void;
  onTriggerFileInput: () => void;
  onClearAll: () => void;
}

export const ImageBatchList: React.FC<ImageBatchListProps> = ({
  images,
  selectedImageId,
  onSelectImage,
  onRemoveImage,
  onTriggerFileInput,
  onClearAll,
}) => {
  if (images.length === 0) return null;

  const doneCount = images.filter((img) => img.status === 'done').length;
  const processingCount = images.filter((img) => img.status === 'processing').length;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Semua Gambar yang Diunggah</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                {images.length} Gambar
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Klik gambar mana saja untuk melihat Preview Sebelum vs Sesudah di layar utama
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onTriggerFileInput}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Lagi</span>
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua</span>
          </button>
        </div>
      </div>

      {/* Grid of all uploaded images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[420px] overflow-y-auto pr-1 p-1">
        {images.map((img, idx) => {
          const isSelected = img.id === selectedImageId;
          const displayUrl = img.processedUrl || img.previewUrl || img.originalUrl;

          return (
            <div
              key={img.id}
              id={`batch-card-${img.id}`}
              onClick={() => onSelectImage(img.id)}
              className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 aspect-[4/5] bg-slate-950 flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/20 scale-[1.02]'
                  : 'border-slate-800 hover:border-slate-600 hover:bg-slate-900'
              }`}
            >
              <img
                src={displayUrl}
                alt={img.name}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 opacity-80 group-hover:opacity-95 transition-opacity" />

              {/* Top Info: Index & Status */}
              <div className="relative z-10 p-1.5 flex items-center justify-between">
                <span className="w-5 h-5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white flex items-center justify-center border border-white/20">
                  {idx + 1}
                </span>

                {img.status === 'done' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/90 backdrop-blur-sm text-[9px] font-bold text-white flex items-center gap-0.5 shadow">
                    <CheckCircle className="w-2.5 h-2.5" /> AI Ready
                  </span>
                )}
                {img.status === 'processing' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-sm text-[9px] font-bold text-white flex items-center gap-0.5 shadow animate-pulse">
                    <Clock className="w-2.5 h-2.5 animate-spin" /> Proses
                  </span>
                )}
                {img.status === 'error' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-500/90 backdrop-blur-sm text-[9px] font-bold text-white flex items-center gap-0.5 shadow">
                    <AlertTriangle className="w-2.5 h-2.5" /> Gagal
                  </span>
                )}
                {img.status === 'idle' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 backdrop-blur-sm text-[9px] font-medium text-slate-300 border border-slate-700">
                    Antre
                  </span>
                )}
              </div>

              {/* Center Active Indicator if selected */}
              {isSelected && (
                <div className="relative z-10 self-center bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-indigo-300/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Preview Aktif</span>
                </div>
              )}

              {/* Bottom Bar: Name & Delete */}
              <div className="relative z-10 p-1.5 flex items-center justify-between">
                <p className="text-[10px] text-slate-200 truncate max-w-[75%] font-medium" title={img.name}>
                  {img.name}
                </p>
                <button
                  type="button"
                  id={`remove-image-${img.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(img.id);
                  }}
                  className="p-1 rounded-md bg-black/60 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
                  title="Hapus gambar ini"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Plus card to add more */}
        <div
          onClick={onTriggerFileInput}
          className="rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/40 hover:bg-slate-800/60 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer aspect-[4/5]"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-1">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-300">Tambah Foto</span>
          <span className="text-[9px] text-slate-500">Pilih 10-50+ foto</span>
        </div>
      </div>
    </div>
  );
};
