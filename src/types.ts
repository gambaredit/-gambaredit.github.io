export interface ProcessedImageItem {
  id: string;
  name: string;
  originalUrl: string;
  originalFile?: File | null;
  originalWidth: number;
  originalHeight: number;
  previewUrl?: string;
  processedBlob?: Blob;
  processedUrl?: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress?: number;
}

export type LogoPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'middle-left'
  | 'center' 
  | 'middle-right'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right'
  | 'custom';

export interface LogoItem {
  id: string;
  name: string;
  url: string;
  file?: File;
  enabled: boolean;
  position: LogoPosition;
  customX?: number; // 0 to 100%
  customY?: number; // 0 to 100%
  scalePercent: number; // e.g. 15% of canvas width
  opacity: number; // 0.1 to 1.0
  marginPercent: number; // distance from edges 1-15%
  dropShadow: boolean;
  glowEffect: boolean;
  glowColor?: string;
}

export type AspectRatioOption = 'original' | '4:5' | '1:1' | '16:9' | '9:16' | '3:4';

export type FitModeOption =
  | 'blur-fill'       // Fit Utuh 100% + Background Blur (Kepala & Kaki Aman)
  | 'crop-top'        // Crop Penuh - Fokus Atas / Kepala
  | 'crop-center'     // Crop Penuh - Fokus Tengah
  | 'crop-bottom'     // Crop Penuh - Fokus Bawah
  | 'fit-contain'     // Fit Utuh 100% + Background Gelap
  | 'cover'           // Alias for crop-center
  | 'contain';        // Alias for fit-contain

export type Top3DTextStyle =
  | 'pink-neon'       // Pink Gradient + Neon Glow (Mirip contoh BFF)
  | 'cyan-electric'   // Cyan/Blue 3D Slanted
  | 'gold-metal'      // Emas Metallic 3D
  | 'fire-orange'     // Orange Flame 3D
  | 'white-silver'    // Silver White Chrome 3D
  | 'purple-cyber';   // Cyberpunk Purple 3D

export type BrushBannerStyle =
  | 'pink-brush'      // Kuas Grunge Pink (#e11d48 / #ec4899)
  | 'yellow-brush'    // Kuas Grunge Kuning (#f59e0b / #fbbf24)
  | 'red-brush'       // Kuas Grunge Merah (#dc2626)
  | 'cyan-brush'      // Kuas Grunge Cyan (#06b6d4)
  | 'white-brush'     // Kuas Grunge Putih
  | 'dark-carbon'     // Kuas Dark Carbon / Hitam
  | 'solid-rounded'   // Stiker Rounded Solid
  | 'none';           // Tanpa background (Teks doang)

export type SubTagStyle =
  | 'script-pink-wings' // Cursive "Ytta" + Sayap Garis Pink Neon (Mirip contoh)
  | 'script-gold'       // Cursive Emas Elegan
  | 'neon-pill'         // Kapsul Neon Minimalis
  | 'verified-badge'    // Centang Biru + Teks
  | 'italic-white';     // Teks Miring Putih Minimalis

export interface ViralHookSettings {
  enabled: boolean;
  
  // TOP 3D HEADLINE (e.g. "BFF")
  showTop3DText: boolean;
  top3DText: string;
  top3DStyle: Top3DTextStyle;
  top3DSize: number; // 20% - 80%
  top3DYPosition: number; // 5% - 40%
  top3DDepth: number; // 2 - 16px
  top3DRotation: number; // -15 to +15 deg
  
  // BOTTOM VIRAL CAPTION / BRUSH BANNERS (High CTR Hook)
  showBottomHook: boolean;
  
  // Line 1 (e.g. "Awalnya biasa saja,")
  line1Text: string;
  line1BgStyle: BrushBannerStyle;
  line1TextColor: string;
  
  // Line 2 (e.g. "tapi ending-nya bikin penasaran banget 😳")
  line2Text: string;
  line2BgStyle: BrushBannerStyle;
  line2TextColor: string;
  
  // Line 3 (Sub-Tag / Cursive Script e.g. "Ytta")
  showSubTag: boolean;
  subTagText: string;
  subTagStyle: SubTagStyle;
  
  // Bottom Hook Position & Sizing
  bottomHookScale: number; // 60% - 140%
  bottomHookYOffset: number; // margin from bottom: 2% - 30%
  bottomHookRotation: number; // -10 to +10 deg
}

export type UpscaleFactor = 1 | 1.5 | 2 | 3 | 4;
export type UpscaleAlgorithm = 'bicubic-sharp' | 'lanczos-detail' | 'edge-preserve' | 'smooth-superres';

export type LogoRemovalMode = 
  | 'content-aware-heal' // Smart Inpaint & Texture Fill (menghilangkan logo mulus menyatu background)
  | 'replace-my-logo'    // Hapus logo lama & otomatis pasang Logo Baru milik kita
  | 'smart-blur'         // Blur tersamar pada watermark lama
  | 'cover-badge'        // Tutup logo lama dengan plat cover badge elegan + logo baru
  | 'clone-stamp-patch'; // Tambal dari area bersih sebelah (Baju/Kain/Background)

export type FillSourceDirection = 'auto-surrounding' | 'clone-left' | 'clone-right' | 'clone-top' | 'clone-bottom';

export interface LogoRemoverRegion {
  id: string;
  name: string;
  enabled: boolean;
  x: number; // 0 - 100% of canvas width
  y: number; // 0 - 100% of canvas height
  width: number; // 5 - 80% of canvas width
  height: number; // 3 - 60% of canvas height
  mode: LogoRemovalMode;
  fillSource?: FillSourceDirection;
  feather: number; // 0 - 30px (kelembutan tepi transisi)
  blurStrength?: number; // 1 - 25px
  healStrength?: number; // 0 - 100% (intensitas perataan)
  // Logo replacement specific properties
  replaceWithLogoId?: string; // ID of logo to place right over this erased area
  coverPlateStyle?: 'transparent' | 'dark-glass' | 'blur-pill' | 'solid-pill' | 'white-card';
}

export interface LogoRemoverSettings {
  enabled: boolean;
  regions: LogoRemoverRegion[];
}

export interface FilterSettings {
  presetId: string;

  // 1. LOGO REMOVER & REPLACER (Hapus Logo Lama / Ganti Logo Sendiri)
  logoRemover?: LogoRemoverSettings;

  // 2. IMAGE UPSCALING (Perbesar Resolusi)
  upscaleFactor: UpscaleFactor; // 1x, 1.5x, 2x, 3x, 4x
  upscaleAlgorithm: UpscaleAlgorithm;

  // 3. IMAGE ENHANCEMENT (Tingkatkan Kejernihan & Detail)
  enhancementClarity: number; // 0 - 100 (Kejernihan Mikro & De-haze)
  enhancementDetailSharp: number; // 0 - 100 (Ketajaman Detail & Garis Tepi)
  enhancementDenoise: number; // 0 - 100 (Pembersih Noise & Artefak JPEG)
  enhancementColorVibrance: number; // 0 - 100 (Warna Hidup & Alami)
  enhancementAutoLevel: boolean; // Auto Tone & Lighting Dynamic Balance

  // FB & General Color Enhancements
  aiHdrIntensity: number; // 0 - 100
  sharpness: number; // 0 - 100
  clarity?: number; // 0 - 100 (Micro-contrast & De-hazing ultra-jernih)
  aiSmoothNeural?: number; // 0 - 100 (AI Skin & Surface Polish - mulus seperti render 3D/Midjourney)
  vibrance: number; // 0 - 100
  contrast: number; // 0 - 100
  brightness: number; // -50 - 50
  warmth: number; // -50 - 50
  bloomGlow: number; // 0 - 100 (AI Dreamy / Specular glow)
  vignette: number; // 0 - 100 (FB attention focus)
  neonGlowRays: boolean; // Neon streak / lens flare effect like viral posts
  neonColor: string; // Hex e.g. #ff007f or #00f0ff
  
  // Facebook Layout
  aspectRatio: AspectRatioOption;
  fitMode: FitModeOption;
  customCropOffsetY?: number; // 0% (top/kepala) - 100% (bawah)
  
  // News / Viral overlay bar
  showBreakingNewsBar: boolean;
  breakingNewsText: string;
  breakingNewsTag: string;

  // Viral Hook 3D & Brush Banner (CTR Booster ala BFF & Ytta)
  viralHook: ViralHookSettings;
}

export interface PresetConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  settings: Partial<FilterSettings>;
}

// ----------------------------------------------------
// VIDEO EDITING & SPLITTER TYPES
// ----------------------------------------------------

export type VideoAspectOption = 'original' | '9:16' | '16:9' | '1:1' | '4:5';

export type VideoTextAnimationType =
  | 'pop-in-bounce'    // Pop In & Bounce (Muncul membal bertenaga)
  | 'typewriter'       // Typewriter (Mengetik huruf per huruf)
  | 'running-marquee'  // Running Text / Marquee (Teks Berjalan Berita TV dari kanan ke kiri)
  | 'wave-float'       // Mengambang gelombang lembut
  | 'neon-pulse'       // Berkedip denyut neon glow
  | 'glitch-shake'     // Efek getar glitch viral hook
  | 'fade-slide-up'    // Fade In & geser ke atas
  | 'rainbow-shift'    // Warna pelangi bergerak
  | 'static-bold';     // Teks statis tebal bergaris tepi

export type VideoTextBannerStyle =
  | 'none'             // Tanpa kotak banner
  | 'dark-box'         // Kotak hitam transparan modern
  | 'breaking-red'     // Bar Merah Breaking News TV
  | 'gradient-pill'    // Kapsul Gradasi Neon Pink-Amber
  | 'yellow-highlight' // Stabilo Kuning Viral
  | 'cyber-plate'      // Plat Futuristik Cyan
  | 'luxury-gold'      // Emas Mewah Metallic & Black Gold
  | 'emerald-neon'     // Neon Hijau Segar Modern
  | 'purple-cyber'     // Gradasi Deep Violet & Magenta Glow
  | 'blue-ocean'       // Gradasi Biru Elektrik Modern
  | 'retro-arcade'     // Retro 8-bit Arcade Box
  | 'sticker-white'    // Stiker Putih Kontras Tebal
  | 'solid-black';     // Balok Solid Hitam Kontras

export interface VideoAnimatedTextItem {
  id: string;
  text: string;
  enabled: boolean;
  animationType: VideoTextAnimationType;
  animationSpeed: number; // 0.5x, 1x, 1.5x, 2x
  fontFamily: 'impact' | 'montserrat' | 'poppins' | 'outfit' | 'bangers' | 'cyber';
  fontSizePercent: number; // 3% - 15% dari tinggi video
  textColor: string;
  strokeColor: string;
  strokeWidth: number; // 0 - 10px
  shadowColor?: string;
  bgBannerStyle: VideoTextBannerStyle;
  opacity?: number; // 0.1 (transparan/samar) - 1.0 (jelas/solid)
  position: 'top' | 'center' | 'bottom' | 'custom';
  customX: number; // 0 - 100%
  customY: number; // 0 - 100%
  startTimeSec: number; // Kapan teks mulai muncul (detik)
  endTimeSec: number; // Kapan teks menghilang (detik, -1 = sampai selesai)
  isPartCounter?: boolean; // Apakah otomatis menampilkan "PART 1/10" sesuai segmen split
}

export interface VideoWatermarkItem {
  id: string;
  name: string;
  url: string;
  file?: File;
  enabled: boolean;
  position: LogoPosition | 'custom';
  customX: number; // 0 - 100%
  customY: number; // 0 - 100%
  scalePercent: number; // 5% - 50% lebar video
  opacity: number; // 0.1 - 1.0
  rotation: number; // -180 to 180 deg
  dropShadow: boolean;
  glowEffect: boolean;
  glowColor?: string;
  animation: 'none' | 'pulse' | 'float' | 'bounce' | 'spin-slow' | 'fade-in';
}

export interface VideoSegmentItem {
  index: number;
  partNumber: number;
  startTime: number; // Detik mulai
  endTime: number; // Detik selesai
  duration: number; // Durasi segmen dalam detik
  label: string; // Misal "Part 1 (00:00 - 03:00)"
  status: 'idle' | 'rendering' | 'ready' | 'error';
  progress?: number;
  renderedBlob?: Blob;
  renderedUrl?: string;
}

export interface VideoItem {
  id: string;
  name: string;
  url: string;
  file?: File;
  duration: number; // Total durasi video dalam detik
  width: number;
  height: number;
  aspectRatio: string;
  fileSize: number;
  thumbnailUrl?: string;
}

export type VideoPartBadgePosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'custom';

export interface VideoPartBadgeConfig {
  enabled: boolean;
  template: string; // Misal "🔥 {prefix} {part}/{total} • SIMAK SAMPAI HABIS 🔥" atau "{prefix} {part}"
  position: VideoPartBadgePosition;
  customX?: number; // 0 - 100%
  customY?: number; // 0 - 100%
  style: VideoTextBannerStyle; // 'gradient-pill', 'breaking-red', 'dark-box', 'yellow-highlight', 'cyber-plate', 'solid-black', 'none'
  fontFamily: 'impact' | 'montserrat' | 'outfit' | 'poppins' | 'bangers' | 'cyber';
  fontSizePercent: number; // 2.5 - 10%
  textColor: string;
  strokeColor: string;
  strokeWidth: number;
  animation: 'none' | 'pop-in-bounce' | 'wave-float' | 'neon-pulse' | 'glitch-shake' | 'fade-slide-up';
  showNextPartCallout?: boolean; // Menampilkan ajakan "Lanjut Part {next_part}" saat menjelang akhir durasi part
}

export type VideoExportQuality = '240p' | '360p' | '480p' | '720p' | '1080p' | 'original';

export interface VideoEditorSettings {
  // Split Video Settings
  splitEnabled: boolean;
  splitDurationSec: number; // Durasi per part (default 180 detik = 3 menit, atau 60 detik = 1 menit)
  randomDurationVariation?: boolean; // Acak durasi alami per part (+1s s/d +10s contoh: 01:01, 01:02, ..., 01:10)
  randomJitterMaxSec?: number; // Rentang acak maksimal detik tambahan (default 10 detik)
  randomSeed?: number; // Seed acak untuk generate variasi durasi
  partPrefix: string; // Misal "Part", "Bagian", "Eps"
  autoAddPartWatermark: boolean; // Otomatis cantumkan teks "PART 1/10" di pojok/atas video
  partBadgeConfig?: VideoPartBadgeConfig; // Pengaturan tampilan otomatis teks part

  // Output Aspect Ratio & Fit
  aspectRatio: VideoAspectOption;
  fitMode: 'fit-contain' | 'crop-center' | 'blur-background';
  
  // Audio settings
  volume: number; // 0.0 - 1.5
  muteOriginal: boolean;

  // Export Resolution & File Size Quality (240p, 360p, 480p, 720p, 1080p, original)
  exportQuality?: VideoExportQuality;

  // Export Speed & Quality Mode
  exportSpeedMode?: 'turbo-fast' | 'balanced' | 'ultra-quality'; // turbo-fast (1.5x - 2.0x playback rate capture & smart resolution), balanced (1.0x), ultra-quality (full res)

  // Watermarks (PNG Transparan Sendiri)
  watermarks: VideoWatermarkItem[];

  // Animated Text Overlays
  animatedTexts: VideoAnimatedTextItem[];

  // Video Enhancements / Filters
  brightness: number; // -50 to 50
  contrast: number; // 0 to 100
  saturation: number; // 0 to 100
  sharpness: number; // 0 to 100
  vignette: number; // 0 to 100
}

