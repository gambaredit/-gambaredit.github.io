import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  Video,
  Scissors,
  ShieldCheck,
  Type,
  Sparkles,
  Download,
  Play,
  RotateCcw,
  Film,
  Plus,
  Trash2,
  Layers,
  Sliders,
  CheckCircle,
  HelpCircle,
  FileVideo,
} from 'lucide-react';
import {
  VideoItem,
  VideoEditorSettings,
  VideoSegmentItem,
} from '../../types';
import {
  DEFAULT_VIDEO_SETTINGS,
  calculateVideoSegments,
  formatVideoTime,
} from '../../utils/videoProcessor';
import { VideoPlayerPreview } from './VideoPlayerPreview';
import { VideoSplitterController } from './VideoSplitterController';
import { VideoWatermarkManager } from './VideoWatermarkManager';
import { VideoAnimatedTextManager } from './VideoAnimatedTextManager';

export const VideoStudioPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [settings, setSettings] = useState<VideoEditorSettings>(DEFAULT_VIDEO_SETTINGS);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'splitter' | 'watermark' | 'animated-text' | 'filters'>('splitter');
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Recalculate split segments when video duration or split settings change
  const segments = useMemo<VideoSegmentItem[]>(() => {
    if (!currentVideo || !currentVideo.duration) return [];
    return calculateVideoSegments(
      currentVideo.duration,
      settings.splitDurationSec,
      settings.partPrefix,
      settings.randomDurationVariation !== false,
      settings.randomJitterMaxSec || 10,
      settings.randomSeed || 1
    );
  }, [
    currentVideo?.duration,
    settings.splitDurationSec,
    settings.partPrefix,
    settings.randomDurationVariation,
    settings.randomJitterMaxSec,
    settings.randomSeed,
  ]);

  // Adjust selected segment index if out of bounds
  useEffect(() => {
    if (selectedSegmentIndex >= segments.length && segments.length > 0) {
      setSelectedSegmentIndex(0);
    }
  }, [segments.length, selectedSegmentIndex]);

  // Handle local video file upload
  const handleVideoUpload = (file: File) => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.preload = 'metadata';

    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration || 180;
      const width = tempVideo.videoWidth || 1080;
      const height = tempVideo.videoHeight || 1920;

      let aspect = '16:9';
      if (height > width * 1.3) aspect = '9:16';
      else if (Math.abs(width - height) < 20) aspect = '1:1';
      else if (Math.abs(width / height - 0.8) < 0.1) aspect = '4:5';

      const newVideo: VideoItem = {
        id: `vid-${Date.now()}`,
        name: file.name,
        url,
        file,
        duration,
        width,
        height,
        aspectRatio: aspect,
        fileSize: file.size,
      };

      setCurrentVideo(newVideo);
      setSelectedSegmentIndex(0);
    };
  };

  // Load a demo sample video for immediate testing
  const handleLoadSampleVideo = async () => {
    setIsLoadingSample(true);
    try {
      // Use a fast, reliable, high-quality public demo video
      const sampleUrl =
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

      const tempVideo = document.createElement('video');
      tempVideo.crossOrigin = 'anonymous';
      tempVideo.src = sampleUrl;
      tempVideo.preload = 'metadata';

      tempVideo.onloadedmetadata = () => {
        const duration = tempVideo.duration || 15;
        const width = tempVideo.videoWidth || 1280;
        const height = tempVideo.videoHeight || 720;

        const newVideo: VideoItem = {
          id: `vid-sample-${Date.now()}`,
          name: 'Sample-Viral-Video-Demo.mp4',
          url: sampleUrl,
          duration: duration,
          width,
          height,
          aspectRatio: '16:9',
          fileSize: 15 * 1024 * 1024,
        };

        setCurrentVideo(newVideo);
        setSelectedSegmentIndex(0);
        setIsLoadingSample(false);
      };

      tempVideo.onerror = () => {
        // Fallback procedural video
        createProceduralDemoVideo();
      };
    } catch (err) {
      console.warn('Sample video load failed, using procedural fallback:', err);
      createProceduralDemoVideo();
    }
  };

  // Fallback: Create dynamic test video canvas if offline
  const createProceduralDemoVideo = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsLoadingSample(false);
      return;
    }

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const newVideo: VideoItem = {
        id: `vid-sample-${Date.now()}`,
        name: 'Demo-Reels-9x16.webm',
        url,
        duration: 18,
        width: 720,
        height: 1280,
        aspectRatio: '9:16',
        fileSize: blob.size,
      };
      setCurrentVideo(newVideo);
      setSelectedSegmentIndex(0);
      setIsLoadingSample(false);
    };

    recorder.start();
    let frame = 0;
    const totalFrames = 30 * 18; // 18 seconds demo

    const drawDemo = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      // Draw aesthetic motion background
      const grad = ctx.createLinearGradient(0, 0, 720, 1280);
      const shift = (frame / 30) * 40;
      grad.addColorStop(0, `hsl(${(260 + shift) % 360}, 70%, 20%)`);
      grad.addColorStop(0.5, `hsl(${(320 + shift) % 360}, 65%, 25%)`);
      grad.addColorStop(1, `hsl(${(190 + shift) % 360}, 75%, 15%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);

      // Draw floating geometric particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 15; i++) {
        const x = (Math.sin(frame * 0.02 + i) * 300 + 360) % 720;
        const y = ((frame * 2 + i * 90) % 1380) - 50;
        ctx.beginPath();
        ctx.arc(x, y, 15 + (i % 5) * 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center title text
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SAMPLE VIRAL REELS', 360, 580);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 28px Montserrat, sans-serif';
      ctx.fillText(`Timer: ${Math.floor(frame / 30)}s / 18s`, 360, 640);

      frame++;
      requestAnimationFrame(drawDemo);
    };

    drawDemo();
  };

  const updateSettings = (partial: Partial<VideoEditorSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div className="space-y-6">
      {/* Studio Banner & Mode Overview */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-pink-950/80 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
              <Film className="w-3.5 h-3.5" />
              <span>Studio Video Editor, Splitter 3 Menit & Watermark PNG</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Edit & Potong Video Panjang (30+ Menit) Jadi Klip Viral
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Bagi video panjang menjadi part 3 menitan secara otomatis, tempel logo PNG transparan Anda sendiri, dan beri teks animasi (Marquee running text, Pop In, Typewriter, Part Counter) untuk Facebook, Reels & TikTok.
            </p>
          </div>

          {/* Quick Stats or Demo Trigger */}
          <div className="flex items-center gap-2">
            {!currentVideo && (
              <button
                type="button"
                onClick={handleLoadSampleVideo}
                disabled={isLoadingSample}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white text-xs font-bold rounded-2xl border border-purple-500/30 shadow-lg transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{isLoadingSample ? 'Memuat Demo...' : '🎬 Coba Video Sampel (Demo)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-2xl shadow-xl shadow-purple-600/30 flex items-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>{currentVideo ? 'Ganti Video Baru' : 'Upload File Video'}</span>
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleVideoUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      </div>

      {/* Main Workspace */}
      {!currentVideo ? (
        /* Empty State: Upload Prompt */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleVideoUpload(e.dataTransfer.files[0]);
            }
          }}
          className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-slate-950/60 hover:bg-purple-950/20 rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 shadow-2xl"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-indigo-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-inner shadow-purple-500/20 animate-pulse">
            <Video className="w-10 h-10" />
          </div>

          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-white">
              Tarik & Lepas File Video Anda ke Sini
            </h3>
            <p className="text-xs text-slate-400">
              Mendukung video durasi panjang (30 menit, 1 jam, dll.) format MP4, WebM, MOV, MKV, atau AVI.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Pilih Video dari Komputer/HP</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSampleVideo();
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-purple-300 text-xs font-semibold rounded-xl border border-purple-500/30 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Muat Video Demo Uji Coba</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Video Workspace */
        <div className="space-y-6">
          {/* Top: Live Video Player Preview with Canvas Overlays */}
          <VideoPlayerPreview
            video={currentVideo}
            settings={settings}
            segments={segments}
            selectedSegmentIndex={selectedSegmentIndex}
            onSelectSegment={setSelectedSegmentIndex}
            onUpdateSettings={updateSettings}
          />

          {/* Sub-Navigation Tabs for Video Editing Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-lg">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Tab 1: Video Splitter */}
              <button
                type="button"
                onClick={() => setActiveTab('splitter')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'splitter'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>1. Split Video 3 Menit ({segments.length} Parts)</span>
              </button>

              {/* Tab 2: Upload Logo / Watermark PNG Sendiri */}
              <button
                type="button"
                onClick={() => setActiveTab('watermark')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'watermark'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>2. + Upload Watermark PNG ({settings.watermarks.filter((w) => w.enabled).length})</span>
              </button>

              {/* Tab 3: Teks Animate */}
              <button
                type="button"
                onClick={() => setActiveTab('animated-text')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'animated-text'
                    ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>3. Teks Animate Viral ({settings.animatedTexts.filter((t) => t.enabled).length})</span>
              </button>

              {/* Tab 4: Color Filters & Layout */}
              <button
                type="button"
                onClick={() => setActiveTab('filters')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'filters'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>4. Filter & Layout Fit</span>
              </button>
            </div>

            {/* Change Video Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ganti Video</span>
            </button>
          </div>

          {/* Tab Content View */}
          <div className="space-y-6">
            {activeTab === 'splitter' && (
              <VideoSplitterController
                video={currentVideo}
                settings={settings}
                segments={segments}
                selectedSegmentIndex={selectedSegmentIndex}
                onSelectSegment={setSelectedSegmentIndex}
                onUpdateSettings={updateSettings}
              />
            )}

            {activeTab === 'watermark' && (
              <VideoWatermarkManager
                watermarks={settings.watermarks}
                onChangeWatermarks={(watermarks) => updateSettings({ watermarks })}
              />
            )}

            {activeTab === 'animated-text' && (
              <VideoAnimatedTextManager
                animatedTexts={settings.animatedTexts}
                onChangeAnimatedTexts={(animatedTexts) => updateSettings({ animatedTexts })}
              />
            )}

            {activeTab === 'filters' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Filter Warna & Mode Penyesuaian Tampilan (Fit Mode)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sempurnakan pencahayaan, kontras, saturasi, dan gaya penempatan video
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Fit Mode */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Mode Fit Video:</label>
                    <select
                      value={settings.fitMode}
                      onChange={(e) => updateSettings({ fitMode: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 outline-none focus:border-emerald-500"
                    >
                      <option value="fit-contain">Fit Utuh (Black Bars)</option>
                      <option value="crop-center">Crop Penuh (Cover Center)</option>
                      <option value="blur-background">Blur Background (Aesthetic)</option>
                    </select>
                  </div>

                  {/* Brightness */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Kecerahan:</span>
                      <span className="font-mono text-emerald-400 font-bold">{settings.brightness}</span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={settings.brightness}
                      onChange={(e) => updateSettings({ brightness: parseInt(e.target.value, 10) })}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Kontras:</span>
                      <span className="font-mono text-emerald-400 font-bold">{settings.contrast}</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={50}
                      value={settings.contrast}
                      onChange={(e) => updateSettings({ contrast: parseInt(e.target.value, 10) })}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Saturasi Warna:</span>
                      <span className="font-mono text-emerald-400 font-bold">{settings.saturation}</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={60}
                      value={settings.saturation}
                      onChange={(e) => updateSettings({ saturation: parseInt(e.target.value, 10) })}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
