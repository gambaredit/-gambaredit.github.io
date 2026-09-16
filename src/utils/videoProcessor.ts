import JSZip from 'jszip';
// @ts-ignore
import * as MP4Box from 'mp4box';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import {
  VideoEditorSettings,
  VideoSegmentItem,
  VideoAnimatedTextItem,
  VideoWatermarkItem,
  VideoPartBadgeConfig,
  VideoAspectOption,
  VideoExportQuality,
} from '../types';

export interface ResolutionOutputConfig {
  width: number;
  height: number;
  fps: number;
  videoBitrate: number;
  audioBitrate: number;
  qualityLabel: string;
  badge: string;
  estSizePerPart3Min: string;
  description: string;
}

export function getExportResolutionConfig(
  sourceW: number,
  sourceH: number,
  aspectRatio: VideoAspectOption,
  quality: VideoExportQuality = '720p',
  speedMode?: 'turbo-fast' | 'balanced' | 'ultra-quality'
): ResolutionOutputConfig {
  const sw = sourceW || 1080;
  const sh = sourceH || 1920;

  // Determine target aspect ratio (W / H)
  let baseAspect = sw / sh;
  if (aspectRatio === '9:16') baseAspect = 9 / 16;
  else if (aspectRatio === '16:9') baseAspect = 16 / 9;
  else if (aspectRatio === '1:1') baseAspect = 1;
  else if (aspectRatio === '4:5') baseAspect = 4 / 5;

  let shortSide = 720;
  let fps = 30;
  let videoBitrate = 3_200_000;
  let audioBitrate = 128_000;
  let qualityLabel = '720p HD';
  let badge = 'HD Standar';
  let estSizePerPart3Min = '~25 - 35 MB';
  let description = 'Kualitas jernih standar medsos (Reels/TikTok/FB)';

  switch (quality) {
    case '240p':
      shortSide = 240;
      fps = 24;
      videoBitrate = 450_000; // 450 kbps
      audioBitrate = 128_000; // Standar AAC 128k menjamin kompatibilitas suara tidak hilang
      qualityLabel = '240p Super Hemat';
      badge = '⚡ Ukuran Sangat Kecil';
      estSizePerPart3Min = '~4 - 7 MB';
      description = 'File sangat kecil, render instan, hemat kuota maksimal';
      break;

    case '360p':
      shortSide = 360;
      fps = 25;
      videoBitrate = 800_000; // 800 kbps
      audioBitrate = 128_000;
      qualityLabel = '360p Hemat Kuota';
      badge = '📱 Ringan & Cepat';
      estSizePerPart3Min = '~9 - 14 MB';
      description = 'Ukuran ringan, cocok untuk HP & koneksi kuota terbatas';
      break;

    case '480p':
      shortSide = 480;
      fps = 30;
      videoBitrate = 1_400_000; // 1.4 Mbps
      audioBitrate = 128_000;
      qualityLabel = '480p SD Sedang';
      badge = '🎬 SD Seimbang';
      estSizePerPart3Min = '~16 - 24 MB';
      description = 'Keseimbangan bagus antara ketajaman gambar dan ukuran file';
      break;

    case '720p':
      shortSide = 720;
      fps = 30;
      videoBitrate = 3_200_000; // 3.2 Mbps
      audioBitrate = 128_000;
      qualityLabel = '720p HD Standar';
      badge = '🌟 Rekomendasi HD';
      estSizePerPart3Min = '~25 - 35 MB';
      description = 'Jernih standar platform Reels, Shorts, dan Facebook Feed';
      break;

    case '1080p':
      shortSide = 1080;
      fps = 30;
      videoBitrate = 6_000_000; // 6 Mbps
      audioBitrate = 192_000;
      qualityLabel = '1080p Full HD';
      badge = '💎 Ultra Tajam';
      estSizePerPart3Min = '~55 - 75 MB';
      description = 'Kualitas visual tertinggi dan paling jernih untuk master video';
      break;

    case 'original':
    default:
      if (aspectRatio === 'original') {
        const minSide = Math.min(sw, sh);
        shortSide = Math.min(minSide, 1080);
      } else {
        shortSide = 720;
      }
      fps = 30;
      videoBitrate = 4_500_000;
      audioBitrate = 128_000;
      qualityLabel = 'Rasio & Kualitas Asli';
      badge = '📐 Asli';
      estSizePerPart3Min = '~35 - 50 MB';
      description = 'Mengikuti dimensi asli video sumber';
      break;
  }

  // Calculate width and height based on orientation
  let renderW: number;
  let renderH: number;

  if (baseAspect <= 1) {
    // Portrait or Square: width is the short side
    renderW = shortSide;
    renderH = Math.round(renderW / baseAspect);
  } else {
    // Landscape: height is the short side
    renderH = shortSide;
    renderW = Math.round(renderH * baseAspect);
  }

  // Make sure both dimensions are strictly multiples of 4 (required by H.264/AVC hardware encoders)
  renderW = Math.max(4, Math.round(renderW / 4) * 4);
  renderH = Math.max(4, Math.round(renderH / 4) * 4);

  return {
    width: renderW,
    height: renderH,
    fps,
    videoBitrate,
    audioBitrate,
    qualityLabel,
    badge,
    estSizePerPart3Min,
    description,
  };
}

export function calculateTargetVideoDimensions(
  sourceW: number,
  sourceH: number,
  aspectRatio: VideoAspectOption,
  quality: VideoExportQuality = '720p'
): { width: number; height: number } {
  const conf = getExportResolutionConfig(sourceW, sourceH, aspectRatio, quality);
  return { width: conf.width, height: conf.height };
}

export const DEFAULT_PART_BADGE_CONFIG: VideoPartBadgeConfig = {
  enabled: true,
  template: '🔥 {prefix} {part}/{total} • TONTON SAMPAI SELESAI 🔥',
  position: 'top-center',
  customX: 50,
  customY: 7,
  style: 'gradient-pill',
  fontFamily: 'impact',
  fontSizePercent: 4.8,
  textColor: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 3,
  animation: 'pop-in-bounce',
  showNextPartCallout: true,
};

// Default initial settings for Video Editor
export const DEFAULT_VIDEO_SETTINGS: VideoEditorSettings = {
  splitEnabled: true,
  splitDurationSec: 180, // Default 3 menit (180 detik)
  randomDurationVariation: true, // Acak durasi alami (+1s s/d +10s seperti 01:01, 01:02, ..., 01:10)
  randomJitterMaxSec: 10, // Maksimal variasi acak (1 s/d 10 detik)
  randomSeed: 1,
  partPrefix: 'Part',
  autoAddPartWatermark: true,
  partBadgeConfig: DEFAULT_PART_BADGE_CONFIG,
  aspectRatio: 'original',
  fitMode: 'fit-contain',
  volume: 1.0,
  muteOriginal: false,
  exportQuality: '720p',
  exportSpeedMode: 'turbo-fast',
  watermarks: [],
  animatedTexts: [], // Default dinonaktifkan (0 teks aktif)
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  vignette: 0,
};

// Format seconds into MM:SS or HH:MM:SS
export function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate video split parts based on duration with optional natural random duration jitter (e.g. +1s to +10s)
export function calculateVideoSegments(
  totalDurationSec: number,
  splitDurationSec: number = 180,
  prefix: string = 'Part',
  enableRandomVariation: boolean = true,
  randomJitterMaxSec: number = 10,
  randomSeed: number = 1
): VideoSegmentItem[] {
  if (!totalDurationSec || totalDurationSec <= 0) return [];

  const baseSec = Math.max(10, splitDurationSec);
  const maxJitter = Math.max(1, Math.min(30, randomJitterMaxSec || 10));
  const segments: VideoSegmentItem[] = [];

  // Deterministic PRNG to produce consistent randomized duration (+1s to +10s) per part
  const getJitter = (index: number): number => {
    if (!enableRandomVariation) return 0;
    // Variasi acak antara 1 sampai maxJitter (misal: 1, 2, 3, 4, ..., 10 detik)
    const x = Math.sin((randomSeed || 1) * 997.13 + index * 37.19 + 11.7) * 10000;
    const rnd = Math.abs(x - Math.floor(x)); // 0.0 to 1.0
    return Math.floor(rnd * maxJitter) + 1; // 1 s/d maxJitter (contoh: 1s s/d 10s)
  };

  let currentStart = 0;
  let partIndex = 0;

  while (currentStart < totalDurationSec - 0.5) {
    const jitter = getJitter(partIndex);
    const targetSegmentDuration = baseSec + jitter;
    let currentEnd = Math.min(totalDurationSec, currentStart + targetSegmentDuration);

    // If remaining time after this cut is too short (< 6 seconds), merge it into this last segment
    const remainingAfter = totalDurationSec - currentEnd;
    if (remainingAfter > 0 && remainingAfter < 6) {
      currentEnd = totalDurationSec;
    }

    const duration = currentEnd - currentStart;

    segments.push({
      index: partIndex,
      partNumber: partIndex + 1,
      startTime: currentStart,
      endTime: currentEnd,
      duration,
      label: `${prefix} ${partIndex + 1} (${formatVideoTime(currentStart)} - ${formatVideoTime(currentEnd)})`,
      status: 'idle',
    });

    currentStart = currentEnd;
    partIndex++;
  }

  return segments;
}

// Render overlays (Watermarks & Animated Texts) on canvas
export function renderCanvasVideoOverlays(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  videoElem: HTMLVideoElement,
  settings: VideoEditorSettings,
  currentPart: number = 1,
  totalParts: number = 1,
  currentTimeSec: number = 0,
  watermarkImagesCache: Map<string, HTMLImageElement> = new Map()
) {
  const w = canvas.width;
  const h = canvas.height;

  if (w <= 0 || h <= 0) return;

  // 1. Draw video frame to canvas
  if (videoElem.readyState >= 2) {
    ctx.save();

    // Apply color filters
    let filterStr = '';
    if (settings.brightness !== 0) filterStr += `brightness(${1 + settings.brightness / 100}) `;
    if (settings.contrast !== 0) filterStr += `contrast(${1 + settings.contrast / 100}) `;
    if (settings.saturation !== 0) filterStr += `saturate(${1 + settings.saturation / 100}) `;
    if (filterStr) ctx.filter = filterStr.trim();

    const vw = videoElem.videoWidth || w;
    const vh = videoElem.videoHeight || h;

    if (settings.fitMode === 'crop-center') {
      const scale = Math.max(w / vw, h / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(videoElem, dx, dy, dw, dh);
    } else if (settings.fitMode === 'blur-background') {
      // Blurred backdrop
      ctx.save();
      ctx.filter = 'blur(20px) brightness(0.6)';
      ctx.drawImage(videoElem, 0, 0, w, h);
      ctx.restore();

      // Contained foreground
      const scale = Math.min(w / vw, h / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(videoElem, dx, dy, dw, dh);
    } else {
      // Default: fit contain with clean black letterboxing
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      const scale = Math.min(w / vw, h / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(videoElem, dx, dy, dw, dh);
    }

    ctx.restore();
  }

  // 2. Draw Vignette effect if enabled
  if (settings.vignette > 0) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.35,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.75
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${Math.min(0.85, settings.vignette / 100)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 3. Render Custom PNG Transparent Watermarks
  for (const wm of settings.watermarks) {
    if (!wm.enabled || !wm.url) continue;

    let img = watermarkImagesCache.get(wm.url);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = wm.url;
      watermarkImagesCache.set(wm.url, img);
    }

    if (img.complete && img.naturalWidth > 0) {
      const targetW = (w * (wm.scalePercent || 15)) / 100;
      const targetH = (img.naturalHeight / img.naturalWidth) * targetW;

      let posX = 0;
      let posY = 0;
      const marginX = w * 0.04;
      const marginY = h * 0.04;

      if (wm.position === 'top-left') {
        posX = marginX;
        posY = marginY;
      } else if (wm.position === 'top-right') {
        posX = w - targetW - marginX;
        posY = marginY;
      } else if (wm.position === 'bottom-left') {
        posX = marginX;
        posY = h - targetH - marginY;
      } else if (wm.position === 'bottom-right') {
        posX = w - targetW - marginX;
        posY = h - targetH - marginY;
      } else if (wm.position === 'center') {
        posX = (w - targetW) / 2;
        posY = (h - targetH) / 2;
      } else {
        // Custom X/Y
        posX = ((wm.customX ?? 50) / 100) * w - targetW / 2;
        posY = ((wm.customY ?? 50) / 100) * h - targetH / 2;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(1.0, wm.opacity || 1.0));

      // Animation calculation
      let animScale = 1.0;
      let animRot = (wm.rotation || 0) * (Math.PI / 180);
      let animOffsetY = 0;

      if (wm.animation === 'pulse') {
        animScale = 1.0 + Math.sin(currentTimeSec * 4) * 0.08;
      } else if (wm.animation === 'float') {
        animOffsetY = Math.sin(currentTimeSec * 2.5) * (h * 0.015);
      } else if (wm.animation === 'bounce') {
        animOffsetY = -Math.abs(Math.sin(currentTimeSec * 5)) * (h * 0.025);
      } else if (wm.animation === 'spin-slow') {
        animRot += (currentTimeSec * 40 * Math.PI) / 180;
      }

      const centerX = posX + targetW / 2;
      const centerY = posY + targetH / 2 + animOffsetY;

      ctx.translate(centerX, centerY);
      ctx.rotate(animRot);
      ctx.scale(animScale, animScale);

      // Drop shadow & glow
      if (wm.dropShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      }
      if (wm.glowEffect) {
        ctx.shadowColor = wm.glowColor || '#00f0ff';
        ctx.shadowBlur = 15;
      }

      ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
      ctx.restore();
    }
  }

  // 4. Render Auto Part Counter badge if enabled and split active
  const partBadge = settings.partBadgeConfig || DEFAULT_PART_BADGE_CONFIG;
  const isPartBadgeActive =
    settings.splitEnabled &&
    settings.autoAddPartWatermark !== false &&
    partBadge.enabled !== false &&
    totalParts >= 1;

  if (isPartBadgeActive) {
    ctx.save();
    const nextPart = Math.min(totalParts, currentPart + 1);
    const prevPart = Math.max(1, currentPart - 1);
    const rawTemplate = partBadge.template || '🔥 {prefix} {part}/{total} • TONTON SAMPAI SELESAI 🔥';
    
    let partText = rawTemplate
      .replace(/{part}/gi, `${currentPart}`)
      .replace(/{total}/gi, `${totalParts}`)
      .replace(/{prefix}/gi, settings.partPrefix || 'Part')
      .replace(/{next_part}/gi, `${nextPart}`)
      .replace(/{prev_part}/gi, `${prevPart}`);

    const badgeFontSize = Math.max(
      15,
      Math.round((h * (partBadge.fontSizePercent || 4.8)) / 100)
    );
    const fontName = getFontFamilyName(partBadge.fontFamily || 'impact');
    ctx.font = `900 ${badgeFontSize}px ${fontName}, "Impact", "Montserrat", sans-serif`;

    let posX = w * 0.5;
    let posY = h * 0.07;
    const marginX = w * 0.04;
    const marginY = h * 0.04;

    if (partBadge.position === 'top-center') {
      posX = w * 0.5;
      posY = (h * (partBadge.customY ?? 7)) / 100;
    } else if (partBadge.position === 'top-left') {
      posX = marginX;
      posY = marginY + badgeFontSize;
    } else if (partBadge.position === 'top-right') {
      posX = w - marginX;
      posY = marginY + badgeFontSize;
    } else if (partBadge.position === 'center') {
      posX = w * 0.5;
      posY = h * 0.5;
    } else if (partBadge.position === 'bottom-center') {
      posX = w * 0.5;
      posY = h - marginY - badgeFontSize * 0.5;
    } else if (partBadge.position === 'bottom-left') {
      posX = marginX;
      posY = h - marginY - badgeFontSize * 0.5;
    } else if (partBadge.position === 'bottom-right') {
      posX = w - marginX;
      posY = h - marginY - badgeFontSize * 0.5;
    } else if (partBadge.position === 'custom') {
      posX = ((partBadge.customX ?? 50) / 100) * w;
      posY = ((partBadge.customY ?? 7) / 100) * h;
    }

    // Animation computation for Part Badge
    const animSpeed = 1.0;
    const animTime = currentTimeSec * animSpeed;
    let scaleX = 1.0;
    let scaleY = 1.0;
    let offsetY = 0;
    let rotation = 0;
    let alpha = 1.0;

    if (partBadge.animation === 'pop-in-bounce') {
      const beat = Math.sin(animTime * 3.5);
      scaleX = 1.0 + beat * 0.05;
      scaleY = 1.0 + beat * 0.05;
    } else if (partBadge.animation === 'wave-float') {
      offsetY = Math.sin(animTime * 2.8) * (badgeFontSize * 0.25);
      rotation = Math.sin(animTime * 1.8) * 0.025;
    } else if (partBadge.animation === 'neon-pulse') {
      const pulse = 0.5 + Math.sin(animTime * 5.0) * 0.5;
      alpha = 0.75 + pulse * 0.25;
    } else if (partBadge.animation === 'glitch-shake') {
      if (Math.floor(animTime * 7) % 5 === 0) {
        posX += (Math.random() - 0.5) * 6;
        posY += (Math.random() - 0.5) * 4;
        scaleX = 1.0 + (Math.random() - 0.5) * 0.05;
      }
    } else if (partBadge.animation === 'fade-slide-up') {
      const cycle = animTime % 3.5;
      if (cycle < 0.5) {
        alpha = cycle / 0.5;
        offsetY = (1 - alpha) * 15;
      }
    }

    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(posX, posY + offsetY);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);

    const metrics = ctx.measureText(partText);
    const badgeW = metrics.width + badgeFontSize * 1.4;
    const badgeH = badgeFontSize * 1.5;

    let rectX = -badgeW / 2;
    let rectY = -badgeH / 2;
    if (partBadge.position === 'top-left' || partBadge.position === 'bottom-left') {
      ctx.textAlign = 'left';
      rectX = 0;
    } else if (partBadge.position === 'top-right' || partBadge.position === 'bottom-right') {
      ctx.textAlign = 'right';
      rectX = -badgeW;
    } else {
      ctx.textAlign = 'center';
    }
    ctx.textBaseline = 'middle';

    // Draw Badge Background
    const badgeStyle = partBadge.style || 'gradient-pill';
    if (badgeStyle !== 'none') {
      ctx.save();
      if (badgeStyle === 'gradient-pill') {
        const grad = ctx.createLinearGradient(rectX, rectY, rectX + badgeW, rectY + badgeH);
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(0.5, '#ef4444');
        grad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(236, 72, 153, 0.6)';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, badgeH / 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (badgeStyle === 'breaking-red') {
        const grad = ctx.createLinearGradient(rectX, rectY, rectX + badgeW, rectY);
        grad.addColorStop(0, '#b91c1c');
        grad.addColorStop(0.5, '#dc2626');
        grad.addColorStop(1, '#991b1b');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, 8);
        ctx.fill();
        ctx.stroke();
      } else if (badgeStyle === 'dark-box') {
        ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, 8);
        ctx.fill();
        ctx.stroke();
      } else if (badgeStyle === 'yellow-highlight') {
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, 6);
        ctx.fill();
        ctx.stroke();
      } else if (badgeStyle === 'cyber-plate') {
        ctx.fillStyle = 'rgba(8, 20, 40, 0.9)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, 4);
        ctx.fill();
        ctx.stroke();
      } else if (badgeStyle === 'solid-black') {
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, 6);
        ctx.fill();
        ctx.stroke();
      } else if (badgeStyle === 'luxury-gold') {
        const grad = ctx.createLinearGradient(rectX, rectY, rectX + badgeW, rectY + badgeH);
        grad.addColorStop(0, '#1c1917');
        grad.addColorStop(0.3, '#78350f');
        grad.addColorStop(0.7, '#d97706');
        grad.addColorStop(1, '#fbbf24');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, 10);
        ctx.fill();
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (badgeStyle === 'emerald-neon') {
        const grad = ctx.createLinearGradient(rectX, rectY, rectX + badgeW, rectY);
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.5, '#059669');
        grad.addColorStop(1, '#10b981');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, badgeH / 2);
        ctx.fill();
        ctx.strokeStyle = '#a7f3d0';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (badgeStyle === 'purple-cyber') {
        const grad = ctx.createLinearGradient(rectX, rectY, rectX + badgeW, rectY + badgeH);
        grad.addColorStop(0, '#581c87');
        grad.addColorStop(0.5, '#9333ea');
        grad.addColorStop(1, '#c084fc');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, badgeH / 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (badgeStyle === 'blue-ocean') {
        const grad = ctx.createLinearGradient(rectX, rectY, rectX + badgeW, rectY);
        grad.addColorStop(0, '#1e3a8a');
        grad.addColorStop(0.5, '#2563eb');
        grad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, badgeH / 2);
        ctx.fill();
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (badgeStyle === 'retro-arcade') {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.rect(rectX, rectY, badgeW, badgeH);
        ctx.fill();
        ctx.stroke();
      } else if (badgeStyle === 'sticker-white') {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, badgeW, badgeH, 12);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Text Stroke & Fill
    const textColor =
      badgeStyle === 'yellow-highlight' ? '#000000' : partBadge.textColor || '#ffffff';
    const strokeColor =
      badgeStyle === 'yellow-highlight' ? '#fde047' : partBadge.strokeColor || '#000000';
    const strokeWidth = partBadge.strokeWidth ?? 3;

    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      const textTargetX =
        partBadge.position === 'top-left' || partBadge.position === 'bottom-left'
          ? badgeFontSize * 0.7
          : partBadge.position === 'top-right' || partBadge.position === 'bottom-right'
          ? -badgeFontSize * 0.7
          : 0;
      ctx.strokeText(partText, textTargetX, 0);
      ctx.fillStyle = textColor;
      ctx.fillText(partText, textTargetX, 0);
    } else {
      ctx.fillStyle = textColor;
      const textTargetX =
        partBadge.position === 'top-left' || partBadge.position === 'bottom-left'
          ? badgeFontSize * 0.7
          : partBadge.position === 'top-right' || partBadge.position === 'bottom-right'
          ? -badgeFontSize * 0.7
          : 0;
      ctx.fillText(partText, textTargetX, 0);
    }

    ctx.restore();
  }

  // 5. Render Animated Texts
  for (const item of settings.animatedTexts) {
    if (!item.enabled || !item.text) continue;

    // Time window check
    if (item.startTimeSec > 0 && currentTimeSec < item.startTimeSec) continue;
    if (item.endTimeSec > 0 && currentTimeSec > item.endTimeSec) continue;

    const nextPart = Math.min(totalParts, currentPart + 1);
    const prevPart = Math.max(1, currentPart - 1);
    let displayText = item.text
      .replace(/{part}/gi, `${currentPart}`)
      .replace(/{total}/gi, `${totalParts}`)
      .replace(/{prefix}/gi, settings.partPrefix || 'Part')
      .replace(/{next_part}/gi, `${nextPart}`)
      .replace(/{prev_part}/gi, `${prevPart}`);

    const baseFontSize = Math.max(16, Math.round((h * (item.fontSizePercent || 5.0)) / 100));
    const fontName = getFontFamilyName(item.fontFamily);

    ctx.save();
    ctx.font = `900 ${baseFontSize}px ${fontName}, sans-serif`;

    let posX = (w * (item.customX ?? 50)) / 100;
    let posY = (h * (item.customY ?? 50)) / 100;

    if (item.position === 'top') {
      posY = h * 0.12;
      posX = w * 0.5;
    } else if (item.position === 'bottom') {
      posY = h * 0.88;
      posX = w * 0.5;
    } else if (item.position === 'center') {
      posY = h * 0.5;
      posX = w * 0.5;
    }

    // Animation computation
    const speed = item.animationSpeed || 1.0;
    const animTime = currentTimeSec * speed;
    let textToDraw = displayText;
    let scaleX = 1.0;
    let scaleY = 1.0;
    let offsetY = 0;
    let rotation = 0;
    let alpha = 1.0;
    let colorOverride = item.textColor || '#ffffff';

    if (item.animationType === 'typewriter') {
      const charDuration = 0.08 / speed;
      const totalChars = displayText.length;
      const loopDuration = totalChars * charDuration + 2.5; // loop every couple seconds
      const currentLoopTime = animTime % loopDuration;
      const visibleCount = Math.min(totalChars, Math.floor(currentLoopTime / charDuration));
      textToDraw = displayText.substring(0, visibleCount);
      if (visibleCount < totalChars && Math.floor(animTime * 4) % 2 === 0) {
        textToDraw += '▌'; // blinking cursor
      }
    } else if (item.animationType === 'running-marquee') {
      // Marquee Running Text across video width
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const textWidth = ctx.measureText(displayText).width;
      const totalDistance = w + textWidth + 80;
      const loopTime = Math.max(4, totalDistance / (140 * speed));
      const progress = (animTime % loopTime) / loopTime;
      posX = w - progress * totalDistance;
    } else if (item.animationType === 'pop-in-bounce') {
      const beat = Math.sin(animTime * 3.5);
      scaleX = 1.0 + beat * 0.06;
      scaleY = 1.0 + beat * 0.06;
    } else if (item.animationType === 'wave-float') {
      offsetY = Math.sin(animTime * 3.0) * (baseFontSize * 0.3);
      rotation = Math.sin(animTime * 2.0) * 0.03;
    } else if (item.animationType === 'neon-pulse') {
      const pulse = 0.5 + Math.sin(animTime * 6) * 0.5;
      alpha = 0.6 + pulse * 0.4;
    } else if (item.animationType === 'glitch-shake') {
      if (Math.floor(animTime * 8) % 6 === 0) {
        posX += (Math.random() - 0.5) * 8;
        posY += (Math.random() - 0.5) * 6;
        scaleX = 1.0 + (Math.random() - 0.5) * 0.08;
      }
    } else if (item.animationType === 'fade-slide-up') {
      const cycle = animTime % 4; // 4s cycle
      if (cycle < 0.6) {
        alpha = cycle / 0.6;
        offsetY = (1 - alpha) * 20;
      } else if (cycle > 3.4) {
        alpha = (4 - cycle) / 0.6;
      }
    } else if (item.animationType === 'rainbow-shift') {
      const hue = Math.floor((animTime * 80) % 360);
      colorOverride = `hsl(${hue}, 100%, 65%)`;
    }

    if (!textToDraw) {
      ctx.restore();
      continue;
    }

    const itemOpacity = item.opacity !== undefined ? Math.max(0.05, Math.min(1.0, item.opacity)) : 1.0;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * itemOpacity));
    ctx.translate(posX, posY + offsetY);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);

    if (item.animationType !== 'running-marquee') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }

    const textMetrics = ctx.measureText(textToDraw);
    const boxW = textMetrics.width + baseFontSize * 1.4;
    const boxH = baseFontSize * 1.5;

    // Draw Background Banner Plate
    if (item.bgBannerStyle && item.bgBannerStyle !== 'none') {
      ctx.save();
      const rectX = item.animationType === 'running-marquee' ? -baseFontSize * 0.5 : -boxW / 2;
      const rectY = -boxH / 2;

      if (item.bgBannerStyle === 'breaking-red') {
        const grad = ctx.createLinearGradient(rectX, rectY, rectX + boxW, rectY);
        grad.addColorStop(0, '#b91c1c');
        grad.addColorStop(0.5, '#dc2626');
        grad.addColorStop(1, '#991b1b');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();
      } else if (item.bgBannerStyle === 'dark-box') {
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();
      } else if (item.bgBannerStyle === 'gradient-pill') {
        const grad = ctx.createLinearGradient(rectX, rectY, rectX + boxW, rectY);
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, boxW, boxH, boxH / 2);
        ctx.fill();
      } else if (item.bgBannerStyle === 'yellow-highlight') {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, boxW, boxH, 4);
        ctx.fill();
      } else if (item.bgBannerStyle === 'cyber-plate') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();
      } else if (item.bgBannerStyle === 'solid-black') {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, boxW, boxH, 6);
        ctx.fill();
      }
      ctx.restore();
    }

    // Text Shadow
    if (item.shadowColor) {
      ctx.shadowColor = item.shadowColor;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;
    }

    // Text Stroke Outline
    if (item.strokeWidth > 0 && item.strokeColor) {
      ctx.strokeStyle = item.strokeColor;
      ctx.lineWidth = item.strokeWidth * (baseFontSize / 24);
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(textToDraw, 0, 0);
    }

    // Text Fill
    ctx.fillStyle = colorOverride;
    ctx.fillText(textToDraw, 0, 0);

    ctx.restore();
  }
}

// Helper to resolve font name
function getFontFamilyName(key: string): string {
  switch (key) {
    case 'impact':
      return '"Impact", "Arial Black"';
    case 'montserrat':
      return '"Montserrat", sans-serif';
    case 'poppins':
      return '"Poppins", sans-serif';
    case 'outfit':
      return '"Outfit", sans-serif';
    case 'bangers':
      return '"Bangers", "Impact", cursive';
    case 'cyber':
      return '"Orbitron", "Courier New", monospace';
    default:
      return '"Montserrat", sans-serif';
  }
}

// Check if WebCodecs Hardware Video & Audio Encoding is available
export function isWebCodecsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).VideoEncoder === 'function' &&
    typeof (window as any).VideoFrame === 'function'
  );
}

export interface ExportProgressStats {
  percent: number;
  currentFrame?: number;
  totalFrames?: number;
  fps?: number;
  speedMultiplier?: number;
  engine: 'webcodecs' | 'mediarecorder';
  etaSeconds?: number;
}

// Global AudioBuffer cache for multi-segment fast batch exports
let _cachedAudioSourceUrl: string | null = null;
let _cachedAudioBuffer: AudioBuffer | null = null;

// Standardize AudioBuffer sample rate (to 44.1kHz or 48kHz) to prevent AAC encoder rejections
async function resampleAudioBuffer(audioBuffer: AudioBuffer, targetSampleRate: number = 44100): Promise<AudioBuffer> {
  if (!audioBuffer) return audioBuffer;
  if (audioBuffer.sampleRate === targetSampleRate) return audioBuffer;

  const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  if (!OfflineCtx) return audioBuffer;

  try {
    const numChannels = Math.min(2, Math.max(1, audioBuffer.numberOfChannels || 2));
    const targetLength = Math.max(1, Math.ceil(audioBuffer.duration * targetSampleRate));
    const offlineCtx = new OfflineCtx(numChannels, targetLength, targetSampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const resampled = await offlineCtx.startRendering();
    return resampled;
  } catch (err) {
    console.warn('Audio resample warning:', err);
    return audioBuffer;
  }
}

// Fallback: Demux MP4 container using MP4Box and decode raw audio frames with WebCodecs AudioDecoder
async function decodeAudioWithMP4Box(arrayBuffer: ArrayBuffer): Promise<AudioBuffer | null> {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  const AudioDecoderClass = (window as any).AudioDecoder;
  const EncodedAudioChunkClass = (window as any).EncodedAudioChunk;

  return new Promise((resolve) => {
    try {
      const createFileFn = (MP4Box as any).createFile || (MP4Box as any).default?.createFile;
      if (typeof createFileFn !== 'function') {
        resolve(null);
        return;
      }

      const mp4boxfile = createFileFn();
      let audioTrack: any = null;
      const audioChunks: any[] = [];
      let isSettled = false;

      const finishAndResolve = (result: AudioBuffer | null) => {
        if (!isSettled) {
          isSettled = true;
          resolve(result);
        }
      };

      // Timeout safeguard (5 seconds)
      const timeoutTimer = setTimeout(() => {
        finishAndResolve(null);
      }, 5000);

      mp4boxfile.onReady = (info: any) => {
        if (info.audioTracks && info.audioTracks.length > 0) {
          audioTrack = info.audioTracks[0];
          mp4boxfile.setExtractionOptions(audioTrack.id, null, { nbSamples: 1000 });
          mp4boxfile.start();
        } else {
          clearTimeout(timeoutTimer);
          finishAndResolve(null);
        }
      };

      mp4boxfile.onSamples = (id: number, user: any, samples: any[]) => {
        if (samples && samples.length > 0) {
          audioChunks.push(...samples);
        }
      };

      mp4boxfile.onError = (e: any) => {
        console.warn('MP4Box parse error:', e);
        clearTimeout(timeoutTimer);
        finishAndResolve(null);
      };

      const bufferCopy = arrayBuffer.slice(0);
      (bufferCopy as any).fileStart = 0;
      mp4boxfile.appendBuffer(bufferCopy);
      mp4boxfile.flush();

      // Process extracted audio samples if available
      setTimeout(async () => {
        clearTimeout(timeoutTimer);
        if (!audioTrack || audioChunks.length === 0 || !AudioDecoderClass || !EncodedAudioChunkClass) {
          finishAndResolve(null);
          return;
        }

        try {
          const decodedFrames: any[] = [];
          const sampleRate = audioTrack.audio?.sample_rate || 44100;
          const numberOfChannels = Math.min(2, Math.max(1, audioTrack.audio?.channel_count || 2));

          const decoder = new AudioDecoderClass({
            output: (audioData: any) => {
              decodedFrames.push(audioData);
            },
            error: (e: any) => {
              console.warn('AudioDecoder error during MP4Box decode:', e);
            },
          });

          const codecStr = audioTrack.codec || 'mp4a.40.2';
          decoder.configure({
            codec: codecStr,
            sampleRate,
            numberOfChannels,
            description: (audioTrack as any).description,
          });

          for (const sample of audioChunks) {
            const timescale = sample.timescale || audioTrack.timescale || sampleRate;
            const timestampMicros = Math.round((sample.cts / timescale) * 1_000_000);
            const durationMicros = Math.round((sample.duration / timescale) * 1_000_000);

            const chunk = new EncodedAudioChunkClass({
              type: sample.is_sync ? 'key' : 'delta',
              timestamp: timestampMicros,
              duration: durationMicros,
              data: sample.data,
            });
            decoder.decode(chunk);
          }

          await decoder.flush();

          if (decodedFrames.length === 0) {
            finishAndResolve(null);
            return;
          }

          let totalFrames = 0;
          for (const f of decodedFrames) {
            totalFrames += f.numberOfFrames;
          }

          const outSampleRate = decodedFrames[0].sampleRate || sampleRate;
          const outChannels = Math.min(2, Math.max(1, decodedFrames[0].numberOfChannels || numberOfChannels));

          const actx = new AudioCtx({ sampleRate: outSampleRate });
          const audioBuffer = actx.createBuffer(outChannels, totalFrames, outSampleRate);

          let frameOffset = 0;
          for (const f of decodedFrames) {
            const numFrames = f.numberOfFrames;
            for (let ch = 0; ch < outChannels; ch++) {
              const chData = audioBuffer.getChannelData(ch);
              const planarBuffer = new Float32Array(numFrames);
              f.copyTo(planarBuffer, { planeIndex: ch, format: 'f32-planar' });
              chData.set(planarBuffer, frameOffset);
            }
            frameOffset += numFrames;
            f.close();
          }

          actx.close().catch(() => {});
          finishAndResolve(audioBuffer);
        } catch (decErr) {
          console.warn('WebCodecs AudioDecoder exception:', decErr);
          finishAndResolve(null);
        }
      }, 100);
    } catch (err) {
      console.warn('decodeAudioWithMP4Box exception:', err);
      resolve(null);
    }
  });
}

// Multi-tier audio extractor: Web Audio decodeAudioData -> MP4Box + AudioDecoder -> Resampled
export async function getDecodedAudioBuffer(videoSrc: string): Promise<AudioBuffer | null> {
  if (!videoSrc) return null;
  if (_cachedAudioSourceUrl === videoSrc && _cachedAudioBuffer) {
    return _cachedAudioBuffer;
  }

  try {
    const res = await fetch(videoSrc);
    const ab = await res.arrayBuffer();
    if (!ab || ab.byteLength === 0) return null;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    let audioBuffer: AudioBuffer | null = null;

    // Tier 1: Try native decodeAudioData
    try {
      const bufferCopy = ab.slice(0);
      audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        const promise = ctx.decodeAudioData(
          bufferCopy,
          (decoded) => resolve(decoded),
          (err) => reject(err)
        );
        if (promise && typeof (promise as any).then === 'function') {
          (promise as any).then(resolve).catch(reject);
        }
      });
    } catch (decodeErr) {
      console.warn('Native decodeAudioData failed, trying MP4Box demuxer...', decodeErr);
    }

    // Tier 2: If native decode failed on multiplexed MP4, use MP4Box + WebCodecs AudioDecoder
    if (!audioBuffer) {
      audioBuffer = await decodeAudioWithMP4Box(ab);
    }

    ctx.close().catch(() => {});

    if (audioBuffer) {
      // Standardize sample rate to 44.1kHz or 48kHz for AAC encoder hardware compatibility
      if (audioBuffer.sampleRate !== 44100 && audioBuffer.sampleRate !== 48000) {
        audioBuffer = await resampleAudioBuffer(audioBuffer, 44100);
      }

      _cachedAudioSourceUrl = videoSrc;
      _cachedAudioBuffer = audioBuffer;
      return audioBuffer;
    }

    return null;
  } catch (e) {
    console.warn('Audio decoding fallback / warning:', e);
    return null;
  }
}

// Fast WebCodecs Video & Audio Hardware-Accelerated Exporter
async function exportWithWebCodecs(
  videoElem: HTMLVideoElement,
  startTime: number,
  endTime: number,
  settings: VideoEditorSettings,
  currentPart: number,
  totalParts: number,
  onProgress?: (stats: ExportProgressStats) => void,
  abortSignal?: AbortSignal
): Promise<Blob> {
  const resConf = getExportResolutionConfig(
    videoElem.videoWidth || 1080,
    videoElem.videoHeight || 1920,
    settings.aspectRatio,
    settings.exportQuality || '720p',
    settings.exportSpeedMode
  );

  let renderW = resConf.width;
  let renderH = resConf.height;
  let targetFps = resConf.fps;
  let targetBitrate = resConf.videoBitrate;
  let audioBitrate = resConf.audioBitrate || 128_000;

  // Ensure dimensions are multiples of 4 (required for H.264 AVC)
  renderW = Math.max(4, Math.round(renderW / 4) * 4);
  renderH = Math.max(4, Math.round(renderH / 4) * 4);

  const canvas = document.createElement('canvas');
  canvas.width = renderW;
  canvas.height = renderH;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) throw new Error('Canvas 2D context error');

  // Load / prepare audio if original audio is unmuted
  let audioBuffer: AudioBuffer | null = null;
  const videoSourceUrl = videoElem.src || videoElem.currentSrc;
  if (!settings.muteOriginal && videoSourceUrl) {
    audioBuffer = await getDecodedAudioBuffer(videoSourceUrl);
  }

  const AudioEncoderClass = (window as any).AudioEncoder;
  const AudioDataClass = (window as any).AudioData;

  let canEncodeAudio = false;
  let numChannels = 2;
  let sampleRate = 44100;
  const standardAudioBitrate = Math.max(96000, Math.min(192000, audioBitrate));

  if (audioBuffer && AudioEncoderClass && AudioDataClass && !settings.muteOriginal) {
    try {
      numChannels = Math.min(2, Math.max(1, audioBuffer.numberOfChannels || 2));
      sampleRate = audioBuffer.sampleRate || 44100;

      const audioConfig = {
        codec: 'mp4a.40.2',
        numberOfChannels: numChannels,
        sampleRate: sampleRate,
        bitrate: standardAudioBitrate,
      };

      if (typeof AudioEncoderClass.isConfigSupported === 'function') {
        const sup = await AudioEncoderClass.isConfigSupported(audioConfig).catch(() => ({ supported: false }));
        if (sup && sup.supported) {
          canEncodeAudio = true;
        } else {
          // Check standard 48000
          const sup48k = await AudioEncoderClass.isConfigSupported({
            ...audioConfig,
            sampleRate: 48000,
          }).catch(() => ({ supported: false }));
          if (sup48k && sup48k.supported) {
            canEncodeAudio = true;
          }
        }
      } else {
        canEncodeAudio = true;
      }
    } catch (e) {
      console.warn('AudioEncoder check error:', e);
      canEncodeAudio = true;
    }
  }

  // Safety check: If user wants audio (!settings.muteOriginal) but WebCodecs could not prepare it,
  // do NOT produce a silent video; throw so it falls back to MediaRecorder real-time engine!
  if (!settings.muteOriginal && (!audioBuffer || !canEncodeAudio)) {
    throw new Error('WebCodecs audio extraction requires realtime audio capture fallback');
  }

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width: renderW,
      height: renderH,
    },
    audio: canEncodeAudio && audioBuffer
      ? {
          codec: 'aac',
          numberOfChannels: numChannels,
          sampleRate: sampleRate,
        }
      : undefined,
    fastStart: 'in-memory',
  });

  const VideoEncoderClass = (window as any).VideoEncoder;
  const videoEncoder = new VideoEncoderClass({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: any) => console.error('VideoEncoder error:', e),
  });

  // H.264 profile
  const videoConfig: any = {
    codec: 'avc1.4d002a', // Main Profile 4.2
    width: renderW,
    height: renderH,
    bitrate: targetBitrate,
    framerate: targetFps,
    hardwareAcceleration: 'prefer-hardware',
  };

  const isSupported = await VideoEncoderClass.isConfigSupported(videoConfig).catch(() => ({ supported: false }));
  if (isSupported && isSupported.supported) {
    videoEncoder.configure(videoConfig);
  } else {
    // Fallback standard baseline
    videoEncoder.configure({
      codec: 'avc1.42001f',
      width: renderW,
      height: renderH,
      bitrate: targetBitrate,
      framerate: targetFps,
    });
  }

  // Audio Encoder setup & encoding
  let audioEncoderPromise: Promise<void> | null = null;
  if (canEncodeAudio && audioBuffer) {
    try {
      const audioEncoder = new AudioEncoderClass({
        output: (chunk: any, meta: any) => muxer.addAudioChunk(chunk, meta),
        error: (e: any) => console.error('AudioEncoder runtime error:', e),
      });

      audioEncoder.configure({
        codec: 'mp4a.40.2',
        numberOfChannels: numChannels,
        sampleRate: sampleRate,
        bitrate: standardAudioBitrate,
      });

      // Slice audio buffer for exact duration [startTime, endTime]
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
      const totalSamples = Math.max(0, endSample - startSample);
      const volumeScale = settings.muteOriginal ? 0 : (settings.volume ?? 1.0);

      if (totalSamples > 0 && volumeScale > 0) {
        const chunkSize = 2048;
        for (let offset = 0; offset < totalSamples; offset += chunkSize) {
          const curChunkSize = Math.min(chunkSize, totalSamples - offset);
          const planarData = new Float32Array(curChunkSize * numChannels);

          for (let ch = 0; ch < numChannels; ch++) {
            const channelData = audioBuffer.getChannelData(ch);
            const slice = channelData.subarray(startSample + offset, startSample + offset + curChunkSize);
            if (volumeScale !== 1.0) {
              const chOffset = ch * curChunkSize;
              for (let j = 0; j < curChunkSize; j++) {
                planarData[chOffset + j] = slice[j] * volumeScale;
              }
            } else {
              planarData.set(slice, ch * curChunkSize);
            }
          }

          const timestampMicros = Math.round((offset / sampleRate) * 1_000_000);
          const audioData = new AudioDataClass({
            format: 'f32-planar',
            sampleRate: sampleRate,
            numberOfFrames: curChunkSize,
            numberOfChannels: numChannels,
            timestamp: timestampMicros,
            data: planarData,
          });

          audioEncoder.encode(audioData);
          audioData.close();
        }
      }

      audioEncoderPromise = audioEncoder.flush().catch((err: any) => {
        console.warn('AudioEncoder flush error:', err);
      });
    } catch (encErr) {
      console.warn('AudioEncoder configuration error:', encErr);
    }
  }

  // Frame rendering and fast hardware encoding
  const totalDuration = endTime - startTime;
  const totalFrames = Math.max(1, Math.round(totalDuration * targetFps));
  const wmCache = new Map<string, HTMLImageElement>();
  const VideoFrameClass = (window as any).VideoFrame;

  const renderStart = performance.now();
  let framesDone = 0;

  for (let i = 0; i < totalFrames; i++) {
    if (abortSignal?.aborted) {
      throw new Error('Export dibatalkan oleh pengguna');
    }

    const curTime = startTime + i / targetFps;
    videoElem.currentTime = curTime;

    // Fast asynchronous frame seek
    await new Promise<void>((r) => {
      const onSeeked = () => {
        videoElem.removeEventListener('seeked', onSeeked);
        r();
      };
      videoElem.addEventListener('seeked', onSeeked, { once: true });
    });

    renderCanvasVideoOverlays(
      canvas,
      ctx,
      videoElem,
      settings,
      currentPart,
      totalParts,
      curTime,
      wmCache
    );

    const timestampMicros = Math.round((i / targetFps) * 1_000_000);
    const frame = new VideoFrameClass(canvas, { timestamp: timestampMicros });
    videoEncoder.encode(frame, { keyFrame: i % (targetFps * 2) === 0 });
    frame.close();

    framesDone++;
    const now = performance.now();
    const elapsedSec = (now - renderStart) / 1000;
    const currentFps = elapsedSec > 0 ? Math.round(framesDone / elapsedSec) : targetFps;
    const speedMultiplier = Math.round((currentFps / targetFps) * 10) / 10;
    const remainingFrames = totalFrames - framesDone;
    const etaSeconds = currentFps > 0 ? Math.ceil(remainingFrames / currentFps) : 0;

    if (onProgress) {
      onProgress({
        percent: Math.round(((i + 1) / totalFrames) * 100),
        currentFrame: i + 1,
        totalFrames,
        fps: currentFps,
        speedMultiplier,
        engine: 'webcodecs',
        etaSeconds,
      });
    }
  }

  await videoEncoder.flush();
  if (audioEncoderPromise) {
    await audioEncoderPromise;
  }
  muxer.finalize();

  const buffer = target.buffer;
  return new Blob([buffer], { type: 'video/mp4' });
}

// Universal Segment Recorder: Fast WebCodecs with seamless MediaRecorder fallback
export async function recordVideoSegment(
  videoElem: HTMLVideoElement,
  startTime: number,
  endTime: number,
  settings: VideoEditorSettings,
  currentPart: number,
  totalParts: number,
  onProgress?: (progress: number | ExportProgressStats) => void,
  abortSignal?: AbortSignal
): Promise<Blob> {
  const normalizedProgress = (val: number | ExportProgressStats) => {
    if (!onProgress) return;
    if (typeof val === 'number') {
      onProgress(val);
    } else {
      onProgress(val);
    }
  };

  // Try WebCodecs first for blazing fast GPU-accelerated export
  if (isWebCodecsSupported()) {
    try {
      return await exportWithWebCodecs(
        videoElem,
        startTime,
        endTime,
        settings,
        currentPart,
        totalParts,
        (stats) => normalizedProgress(stats),
        abortSignal
      );
    } catch (webcodecsErr) {
      console.warn('WebCodecs GPU export fell back to MediaRecorder:', webcodecsErr);
    }
  }

  // Fallback: Realtime MediaRecorder Engine
  return new Promise(async (resolve, reject) => {
    const origMuted = videoElem.muted;
    const origVolume = videoElem.volume;

    try {
      const resConf = getExportResolutionConfig(
        videoElem.videoWidth || 1080,
        videoElem.videoHeight || 1920,
        settings.aspectRatio,
        settings.exportQuality || '720p',
        settings.exportSpeedMode
      );

      let renderW = resConf.width;
      let renderH = resConf.height;
      let targetFps = resConf.fps;
      let targetBitrate = resConf.videoBitrate;
      let audioBitrate = resConf.audioBitrate;

      const canvas = document.createElement('canvas');
      canvas.width = renderW;
      canvas.height = renderH;
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

      if (!ctx) throw new Error('Canvas 2D context error');

      const mimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4;codecs=avc1,aac',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
      ];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const stream = canvas.captureStream(targetFps);

      if (!settings.muteOriginal) {
        videoElem.muted = false;
        videoElem.volume = 1.0;
      }

      let audioTrackAdded = false;
      try {
        const vidCaptureStream =
          (videoElem as any).captureStream ? (videoElem as any).captureStream() :
          (videoElem as any).mozCaptureStream ? (videoElem as any).mozCaptureStream() : null;

        if (vidCaptureStream) {
          const aTracks = vidCaptureStream.getAudioTracks();
          if (aTracks && aTracks.length > 0 && !settings.muteOriginal) {
            const track = aTracks[0].clone ? aTracks[0].clone() : aTracks[0];
            track.enabled = true;
            stream.addTrack(track);
            audioTrackAdded = true;
          }
        }
      } catch (streamErr) {
        console.warn('captureStream audio error:', streamErr);
      }

      if (!audioTrackAdded && !settings.muteOriginal) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            let audioCtx: AudioContext = (videoElem as any)._audioCtx;
            if (!audioCtx || audioCtx.state === 'closed') {
              audioCtx = new AudioContextClass();
              (videoElem as any)._audioCtx = audioCtx;
            }

            if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
            }

            let sourceNode: MediaElementAudioSourceNode = (videoElem as any)._audioSourceNode;
            if (!sourceNode) {
              sourceNode = audioCtx.createMediaElementSource(videoElem);
              (videoElem as any)._audioSourceNode = sourceNode;
            }

            let destNode: MediaStreamAudioDestinationNode = (videoElem as any)._audioDestNode;
            if (!destNode) {
              destNode = audioCtx.createMediaStreamDestination();
              (videoElem as any)._audioDestNode = destNode;
              sourceNode.connect(destNode);
            }

            const audioTracks = destNode.stream.getAudioTracks();
            if (audioTracks && audioTracks.length > 0) {
              audioTracks[0].enabled = true;
              stream.addTrack(audioTracks[0]);
              audioTrackAdded = true;
            }
          }
        } catch (audioErr) {
          console.warn('Web Audio capture fallback error:', audioErr);
        }
      }

      const recorderOptions: MediaRecorderOptions = {
        mimeType: selectedMime || undefined,
        videoBitsPerSecond: targetBitrate,
      };
      if (audioTrackAdded) {
        recorderOptions.audioBitsPerSecond = audioBitrate;
      }

      const recorder = new MediaRecorder(stream, recorderOptions);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const cleanupAndRestore = () => {
        videoElem.muted = origMuted;
        videoElem.volume = origVolume;
      };

      recorder.onstop = () => {
        cleanupAndRestore();
        const blob = new Blob(chunks, { type: selectedMime || 'video/mp4' });
        resolve(blob);
      };

      recorder.onerror = (e) => {
        cleanupAndRestore();
        reject(e);
      };

      videoElem.currentTime = startTime;
      await new Promise<void>((r) => {
        const onSeeked = () => {
          videoElem.removeEventListener('seeked', onSeeked);
          r();
        };
        videoElem.addEventListener('seeked', onSeeked);
      });

      recorder.start(100);
      try {
        await videoElem.play();
      } catch (playErr) {
        console.warn('Video play error during recording:', playErr);
      }

      const duration = endTime - startTime;
      const wmCache = new Map<string, HTMLImageElement>();
      let animFrameId: number;

      const renderLoop = () => {
        if (abortSignal?.aborted || videoElem.currentTime >= endTime || videoElem.paused || videoElem.ended) {
          cancelAnimationFrame(animFrameId);
          videoElem.pause();
          if (recorder.state === 'recording') {
            recorder.stop();
          }
          return;
        }

        const elapsed = videoElem.currentTime - startTime;
        const progress = Math.min(100, Math.round((elapsed / Math.max(1, duration)) * 100));
        normalizedProgress({
          percent: progress,
          engine: 'mediarecorder',
        });

        renderCanvasVideoOverlays(
          canvas,
          ctx,
          videoElem,
          settings,
          currentPart,
          totalParts,
          videoElem.currentTime,
          wmCache
        );

        animFrameId = requestAnimationFrame(renderLoop);
      };

      animFrameId = requestAnimationFrame(renderLoop);
    } catch (err) {
      videoElem.muted = origMuted;
      videoElem.volume = origVolume;
      reject(err);
    }
  });
}

// Download a blob file to user device
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
