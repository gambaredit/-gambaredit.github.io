import React, { useState } from 'react';
import { UploadCloud, Sparkles, FolderOpen, Files, Plus, Check } from 'lucide-react';

interface ImageUploaderProps {
  imageCount: number;
  onAddImages: (files: FileList | File[]) => void;
  onLoadSampleImage: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageCount,
  onAddImages,
  onLoadSampleImage,
  fileInputRef,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles: File[] = [];
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) droppedFiles.push(file);
        }
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        droppedFiles.push(e.dataTransfer.files[i]);
      }
    }

    if (droppedFiles.length > 0) {
      onAddImages(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileListArray: File[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        fileListArray.push(e.target.files[i]);
      }
      onAddImages(fileListArray);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.jfif,.heic,.bmp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>1. Upload Batch (Bisa 10, 50, 100+ Gambar Sekaligus)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Pilih / seret (drag & drop) puluhan gambar sekaligus tanpa batas
            </p>
          </div>
        </div>

        {imageCount > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-indigo-400" />
            <span>{imageCount} File Siap</span>
          </span>
        )}
      </div>

      {/* Dropzone Area */}
      <div
        id="image-dropzone"
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/20 scale-[1.01] ring-4 ring-indigo-500/20'
            : 'border-indigo-500/40 hover:border-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-inner">
          <Files className="w-7 h-7 text-indigo-400" />
        </div>

        <div>
          <p className="text-base font-bold text-white">
            {isDragOver
              ? '✨ Lepaskan Semua File Foto di Sini Sekarang!'
              : 'Klik atau Seret (Drag & Drop) 10, 50, 100+ Foto ke Sini'}
          </p>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Buka folder di komputer/HP, tekan <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200 font-mono">Ctrl + A</kbd> (pilih semua) lalu seret langsung ke sini.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pilih File dari Folder</span>
          </button>

          {imageCount === 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSampleImage();
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pakai Foto Demo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
