import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { ImageUploader } from './components/ImageUploader';
import { ImageBatchList } from './components/ImageBatchList';
import { MultiLogoManager } from './components/MultiLogoManager';
import { PresetSelector } from './components/PresetSelector';
import { ViralHookEditor } from './components/ViralHookEditor';
import { BeforeAfterViewer } from './components/BeforeAfterViewer';
import { BatchProcessorBar } from './components/BatchProcessorBar';
import { ImageEnhancementPanel } from './components/ImageEnhancementPanel';
import { VideoStudioPanel } from './components/VideoStudio/VideoStudioPanel';
import { ProcessedImageItem, LogoItem, FilterSettings, ViralHookSettings } from './types';
import { INITIAL_LOGOS, SAMPLE_IMAGE_URL } from './utils/sampleAssets';
import { DEFAULT_FILTER_SETTINGS, PRESET_CONFIGS } from './utils/presets';
import { processSingleImage } from './utils/imageProcessor';
import { Flame, Cpu, ShieldCheck, UploadCloud, CheckCircle2, Layers, Sparkles, Wand2, Video, Image as ImageIcon } from 'lucide-react';

export default function App() {
  // Studio Mode: 'video' (Video Editor & Splitter) vs 'photo' (FB Image Booster)
  const [studioMode, setStudioMode] = useState<'video' | 'photo'>('video');

  const [images, setImages] = useState<ProcessedImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [logos, setLogos] = useState<LogoItem[]>(INITIAL_LOGOS);
  const [settings, setSettings] = useState<FilterSettings>(DEFAULT_FILTER_SETTINGS);

  // Live preview state for selected image
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Batch processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isZipping, setIsZipping] = useState(false);

  // Window drag overlay state
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStickyPreview, setIsStickyPreview] = useState(true);

  // References
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoImageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const previewDebounceTimer = useRef<number | null>(null);
  const dragCounter = useRef<number>(0);

  // Load sample demo image on initial mount if empty
  useEffect(() => {
    handleLoadSampleImage();
  }, []);

  // Update selected image helper
  const currentSelectedImage = images.find((img) => img.id === selectedImageId) || images[0] || null;

  // Real-time live preview generator for selected image
  const updateLivePreview = useCallback(async () => {
    if (!currentSelectedImage) {
      setLivePreviewUrl(null);
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const source = currentSelectedImage.originalFile || currentSelectedImage.originalUrl;
      const result = await processSingleImage(source, settings, logos, logoImageCache.current);
      setLivePreviewUrl(result.dataUrl);
    } catch (err) {
      console.error('Error generating live preview:', err);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [currentSelectedImage, settings, logos]);

  // Debounced live preview trigger on settings/logos/image change
  useEffect(() => {
    if (previewDebounceTimer.current) {
      window.clearTimeout(previewDebounceTimer.current);
    }
    previewDebounceTimer.current = window.setTimeout(() => {
      updateLivePreview();
    }, 120);

    return () => {
      if (previewDebounceTimer.current) {
        window.clearTimeout(previewDebounceTimer.current);
      }
    };
  }, [updateLivePreview]);

  // Fast robust multi-file loader (handles 10, 50, 100+ files in parallel)
  const handleAddImages = async (files: FileList | File[]) => {
    const rawFiles: File[] = Array.from(files);
    
    // Filter valid image files (by mime type or extension)
    const validImageFiles = rawFiles.filter((f) => {
      if (f.type && f.type.startsWith('image/')) return true;
      return /\.(jpe?g|png|webp|avif|gif|bmp|tiff|heic|jfif|svg)$/i.test(f.name);
    });

    if (validImageFiles.length === 0) return;

    // Load dimensions in parallel
    const itemPromises = validImageFiles.map(async (file, idx) => {
      const url = URL.createObjectURL(file);
      return new Promise<ProcessedImageItem>((resolve) => {
        const imgElem = new Image();
        imgElem.onload = () => {
          resolve({
            id: `img-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            originalUrl: url,
            originalFile: file,
            originalWidth: imgElem.naturalWidth || 1080,
            originalHeight: imgElem.naturalHeight || 1350,
            status: 'idle',
          });
        };
        imgElem.onerror = () => {
          resolve({
            id: `img-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            originalUrl: url,
            originalFile: file,
            originalWidth: 1080,
            originalHeight: 1350,
            status: 'idle',
          });
        };
        imgElem.src = url;
      });
    });

    const newItems = await Promise.all(itemPromises);

    if (newItems.length > 0) {
      setImages((prev) => {
        // If previous only contained the single initial sample, replace it; otherwise append
        const filteredPrev = prev.filter((p) => !p.id.startsWith('sample-'));
        return [...filteredPrev, ...newItems];
      });
      setSelectedImageId(newItems[0].id);

      // Show toast
      setToastMessage(`✅ Berhasil memuat ${newItems.length} gambar baru!`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Global Window Drag & Drop Listeners
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsWindowDragging(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        setIsWindowDragging(false);
        dragCounter.current = 0;
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragging(false);
      dragCounter.current = 0;

      const droppedFiles: File[] = [];
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          const item = e.dataTransfer.items[i];
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) droppedFiles.push(file);
          }
        }
      } else if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          droppedFiles.push(e.dataTransfer.files[i]);
        }
      }

      if (droppedFiles.length > 0) {
        handleAddImages(droppedFiles);
      }
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Load sample demo image
  const handleLoadSampleImage = async () => {
    try {
      const res = await fetch(SAMPLE_IMAGE_URL);
      const blob = await res.blob();
      const file = new File([blob], 'sample-model-feed.jpg', { type: 'image/jpeg' });
      const url = URL.createObjectURL(file);

      const sampleItem: ProcessedImageItem = {
        id: `sample-${Date.now()}`,
        name: 'sample-fb-viral-post.jpg',
        originalUrl: url,
        originalFile: file,
        originalWidth: 1080,
        originalHeight: 1350,
        status: 'idle',
      };

      setImages([sampleItem]);
      setSelectedImageId(sampleItem.id);
    } catch (e) {
      console.warn('Could not fetch remote sample image:', e);
    }
  };

  // Remove single image
  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (selectedImageId === id) {
        setSelectedImageId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  // Replace active image with cleaned inpaint version
  const handleReplaceCurrentImage = (newCleanUrl: string) => {
    if (!currentSelectedImage) return;
    setImages((prev) =>
      prev.map((img) => {
        if (img.id === currentSelectedImage.id) {
          return {
            ...img,
            originalUrl: newCleanUrl,
            originalFile: undefined,
          };
        }
        return img;
      })
    );
    setToastMessage('✨ Foto berhasil dibersihkan dan diterapkan sebagai foto utama!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Clear all images
  const handleClearAll = () => {
    images.forEach((img) => {
      if (img.originalUrl.startsWith('blob:')) URL.revokeObjectURL(img.originalUrl);
      if (img.processedUrl?.startsWith('blob:')) URL.revokeObjectURL(img.processedUrl);
    });
    setImages([]);
    setSelectedImageId(null);
    setLivePreviewUrl(null);
  };

  // Apply Preset
  const handleApplyPreset = (presetId: string) => {
    const config = PRESET_CONFIGS.find((p) => p.id === presetId);
    if (!config) return;

    setSettings((prev) => ({
      ...prev,
      presetId,
      ...config.settings,
    }));
  };

  // 1-CLICK PROCESS ALL IMAGES
  const handleProcessAll = async () => {
    if (images.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setCurrentProcessingIndex(0);
    setProgressPercent(0);

    const updatedImages = [...images];

    for (let i = 0; i < updatedImages.length; i++) {
      setCurrentProcessingIndex(i);
      setProgressPercent(((i) / updatedImages.length) * 100);

      // Update single status to processing
      updatedImages[i] = { ...updatedImages[i], status: 'processing' };
      setImages([...updatedImages]);

      try {
        const item = updatedImages[i];
        const source = item.originalFile || item.originalUrl;
        const result = await processSingleImage(source, settings, logos, logoImageCache.current);

        updatedImages[i] = {
          ...item,
          processedBlob: result.blob,
          processedUrl: result.dataUrl,
          status: 'done',
        };
      } catch (err) {
        console.error(`Error processing image ${updatedImages[i].name}:`, err);
        updatedImages[i] = { ...updatedImages[i], status: 'error' };
      }

      setImages([...updatedImages]);
      setProgressPercent(((i + 1) / updatedImages.length) * 100);
    }

    setIsProcessing(false);
    setProgressPercent(100);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#ec4899', '#10b981', '#f59e0b'],
      });
    } catch {
      // ignore
    }
  };

  // 1-CLICK DOWNLOAD ALL AS ZIP
  const handleDownloadAllZip = async () => {
    const doneImages = images.filter((img) => img.status === 'done' && (img.processedBlob || img.processedUrl));
    if (doneImages.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('fb-viral-ai-images');

      for (let i = 0; i < doneImages.length; i++) {
        const item = doneImages[i];
        let blob = item.processedBlob;

        if (!blob && item.processedUrl) {
          const res = await fetch(item.processedUrl);
          blob = await res.blob();
        }

        if (blob && folder) {
          const cleanName = item.name.replace(/\.[^/.]+$/, '');
          const filename = `${String(i + 1).padStart(2, '0')}_${cleanName}_fb_ai_boosted.jpg`;
          folder.file(filename, blob);
        }
      }

      const zipContent = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipContent);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `FB_VIRAL_AI_BATCH_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Download Single Image
  const handleDownloadSingle = async (item: ProcessedImageItem) => {
    try {
      // If image is already processed at full current settings, use processedUrl, else render high-res
      const source = item.originalFile || item.originalUrl;
      const result = await processSingleImage(source, settings, logos, logoImageCache.current);
      const downloadUrl = result.dataUrl;

      const a = document.createElement('a');
      a.href = downloadUrl;
      const cleanName = item.name.replace(/\.[^/.]+$/, '');
      const upscaleSuffix = settings.upscaleFactor > 1 ? `_${settings.upscaleFactor}x_upscaled` : '';
      a.download = `${cleanName}${upscaleSuffix}_fb_enhanced.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading single image:', err);
    }
  };

  const activeLogoCount = logos.filter((l) => l.enabled).length;
  const processedCount = images.filter((img) => img.status === 'done').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white relative">
      {/* Fullscreen Drag Overlay when dragging files anywhere over window */}
      {isWindowDragging && (
        <div className="fixed inset-0 z-50 bg-indigo-950/90 backdrop-blur-md border-4 border-dashed border-indigo-400 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="w-24 h-24 rounded-3xl bg-indigo-600/30 text-indigo-300 border-2 border-indigo-400/50 flex items-center justify-center mb-4 shadow-2xl animate-bounce">
            <UploadCloud className="w-12 h-12" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Lepaskan 10, 50, 100+ Gambar di Sini!
          </h2>
          <p className="text-sm text-indigo-200 mt-2 max-w-md">
            Semua gambar yang Anda seret akan langsung dimuat secara bersamaan dan siap diproses.
          </p>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 text-sm font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Sticky Header */}
      <Navbar
        imageCount={images.length}
        activeLogoCount={activeLogoCount}
        processedCount={processedCount}
        isProcessing={isProcessing}
        onProcessAll={handleProcessAll}
        activeStudioMode={studioMode}
        onSelectStudioMode={setStudioMode}
      />

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {studioMode === 'video' ? (
          /* ============================================================ */
          /* VIDEO STUDIO: SPLITTER (3 MENIT), WATERMARK PNG & TEKS ANIMATE */
          /* ============================================================ */
          <VideoStudioPanel />
        ) : (
          /* ============================================================ */
          /* PHOTO STUDIO: FB BATCH IMAGE BOOSTER, 4:5 RESIZER & VIRAL HOOK */
          /* ============================================================ */
          <>
            {/* Top 1-Click Action Bar */}
            <BatchProcessorBar
              images={images}
              isProcessing={isProcessing}
              progressPercent={progressPercent}
              currentProcessingIndex={currentProcessingIndex}
              onProcessAll={handleProcessAll}
              onDownloadAllZip={handleDownloadAllZip}
              isZipping={isZipping}
            />

            {/* Algorithm Highlights Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex items-center space-x-3 shadow-sm">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Algoritma Facebook Mobile 4:5</h4>
                  <p className="text-[11px] text-slate-400">Rasio potret optimal penghenti scroll (stop-thumb) pada feed beranda.</p>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex items-center space-x-3 shadow-sm">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">AI-Style HDR & Micro-Sharpen</h4>
                  <p className="text-[11px] text-slate-400">Pencahayaan dramatis, warna punchy & ketajaman detail render AI.</p>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex items-center space-x-3 shadow-sm">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Multi-Logo Branding (Min. 2-3)</h4>
                  <p className="text-[11px] text-slate-400">Koleksi lengkap Asupan Viral, Videy & 10+ variasi Breaking News.</p>
                </div>
              </div>
            </div>

            {/* 2-Column Responsive Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Dedicated Sticky Live Before/After Viewer (6 cols on lg/xl) */}
              <div
                className={`lg:col-span-6 xl:col-span-6 ${
                  isStickyPreview
                    ? 'lg:sticky lg:top-4 lg:self-start z-20 max-h-[calc(100vh-2rem)] overflow-y-auto pr-1'
                    : 'space-y-4'
                }`}
              >
                {/* Live Interactive Before/After Split Viewer with Sticky Feature & Interactive Mouse Logo Drag */}
                <BeforeAfterViewer
                  currentImage={currentSelectedImage}
                  livePreviewUrl={livePreviewUrl}
                  isGeneratingPreview={isGeneratingPreview}
                  onDownloadSingle={handleDownloadSingle}
                  logos={logos}
                  onChangeLogos={setLogos}
                  settings={settings}
                  onUpdateSettings={(partial) => setSettings((prev) => ({ ...prev, ...partial }))}
                  onLivePreviewUpdate={updateLivePreview}
                  isSticky={isStickyPreview}
                  onToggleSticky={() => setIsStickyPreview((prev) => !prev)}
                />
              </div>

              {/* Right Column: Upload, Gallery, Viral Hook, Presets & Multi-Logo (6 cols on lg/xl) */}
              <div className="lg:col-span-6 xl:col-span-6 space-y-6">
                {/* Quick Navigation Anchor Pills for Smooth Workflow */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 px-2 py-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Menu Cepat:
                  </span>
                  <a
                    href="#section-upload"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
                  >
                    1. Upload ({images.length})
                  </a>
                  <a
                    href="#section-upscale-enhance"
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 hover:text-white font-bold transition-colors border border-indigo-500/30"
                  >
                    2. Upscaling & Detail ✨
                  </a>
                  <a
                    href="#section-hook"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-300 hover:text-white font-medium transition-colors"
                  >
                    3. Viral Hook 3D
                  </a>
                  <a
                    href="#section-presets"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white font-medium transition-colors"
                  >
                    4. Preset FB
                  </a>
                  <a
                    href="#section-logos"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-medium transition-colors"
                  >
                    5. Watermark ({activeLogoCount})
                  </a>
                </div>

                {/* 1. Batch Image Uploader Dropzone */}
                <div id="section-upload">
                  <ImageUploader
                    imageCount={images.length}
                    onAddImages={handleAddImages}
                    onLoadSampleImage={handleLoadSampleImage}
                    fileInputRef={fileInputRef}
                  />
                </div>

                {/* Dedicated All Images Batch Gallery List */}
                {images.length > 0 && (
                  <div id="section-gallery">
                    <ImageBatchList
                      images={images}
                      selectedImageId={selectedImageId}
                      onSelectImage={setSelectedImageId}
                      onRemoveImage={handleRemoveImage}
                      onTriggerFileInput={() => fileInputRef.current?.click()}
                      onClearAll={handleClearAll}
                    />
                  </div>
                )}

                {/* 2. IMAGE UPSCALING & IMAGE ENHANCEMENT PANEL */}
                <div id="section-upscale-enhance">
                  <ImageEnhancementPanel
                    settings={settings}
                    onUpdateSettings={(partial) => setSettings((prev) => ({ ...prev, ...partial }))}
                    onLivePreviewUpdate={updateLivePreview}
                    currentImage={currentSelectedImage}
                  />
                </div>

                {/* 3. VIRAL HOOK & HIGH CTR TEXT EDITOR (BFF + Brush Banners + Ytta) */}
                <div id="section-hook" className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg">
                  <ViralHookEditor
                    settings={settings.viralHook || DEFAULT_FILTER_SETTINGS.viralHook!}
                    onChange={(updatedHook) => {
                      setSettings((prev) => ({ ...prev, viralHook: updatedHook }));
                    }}
                  />
                </div>

                {/* 4. FB Algorithm Presets & AI Style Tuner */}
                <div id="section-presets">
                  <PresetSelector
                    settings={settings}
                    onUpdateSettings={(partial) => setSettings((prev) => ({ ...prev, ...partial }))}
                    onApplyPreset={handleApplyPreset}
                    onLivePreviewUpdate={updateLivePreview}
                  />
                </div>

                {/* 5. Multi-Logo Watermark Manager with Template Library */}
                <div id="section-logos">
                  <MultiLogoManager
                    logos={logos}
                    onChangeLogos={setLogos}
                    onLivePreviewUpdate={updateLivePreview}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>FB Viral Auto-Booster — 1-Click AI Image Enhancer & Multi-Logo Styler</p>
          <p className="text-slate-600">Dioptimalkan untuk engagement feed, reels & carousel Facebook</p>
        </div>
      </footer>
    </div>
  );
}
