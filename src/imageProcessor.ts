import {
  FilterSettings,
  LogoItem,
  AspectRatioOption,
  ViralHookSettings,
  BrushBannerStyle,
  LogoRemoverRegion,
  LogoRemovalMode,
} from '../types';

// Helper to load HTMLImageElement from URL
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Gagal memuat gambar: ' + e));
    img.src = url;
  });
}

// Calculate target canvas dimensions and drawing parameters based on aspect ratio, fitMode, and upscaleFactor
export function getTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  aspectRatio: AspectRatioOption,
  fitMode: string = 'blur-fill',
  customCropOffsetY = 50,
  maxDimension = 8192,
  upscaleFactor: number = 1
): {
  canvasWidth: number;
  canvasHeight: number;
  drawType: 'direct' | 'blur-fill' | 'contain' | 'crop';
  cropParams?: { sx: number; sy: number; sWidth: number; sHeight: number };
  fitParams?: { fgX: number; fgY: number; fgWidth: number; fgHeight: number };
} {
  const factor = Math.max(1, upscaleFactor || 1);

  if (aspectRatio === 'original') {
    let canvasWidth = Math.round(originalWidth * factor);
    let canvasHeight = Math.round(originalHeight * factor);

    if (canvasWidth > maxDimension || canvasHeight > maxDimension) {
      if (canvasWidth > canvasHeight) {
        canvasHeight = Math.round((canvasHeight * maxDimension) / canvasWidth);
        canvasWidth = maxDimension;
      } else {
        canvasWidth = Math.round((canvasWidth * maxDimension) / canvasHeight);
        canvasHeight = maxDimension;
      }
    }

    return {
      canvasWidth,
      canvasHeight,
      drawType: 'direct',
    };
  }

  let targetRatio: number;
  let baseWidth = 1080;
  let baseHeight = 1350;

  switch (aspectRatio) {
    case '4:5':
      targetRatio = 4 / 5;
      baseWidth = 1080 * factor;
      baseHeight = 1350 * factor;
      break;
    case '1:1':
      targetRatio = 1 / 1;
      baseWidth = 1080 * factor;
      baseHeight = 1080 * factor;
      break;
    case '16:9':
      targetRatio = 16 / 9;
      baseWidth = 1920 * factor;
      baseHeight = 1080 * factor;
      break;
    case '9:16':
      targetRatio = 9 / 16;
      baseWidth = 1080 * factor;
      baseHeight = 1920 * factor;
      break;
    case '3:4':
      targetRatio = 3 / 4;
      baseWidth = 1080 * factor;
      baseHeight = 1440 * factor;
      break;
    default:
      targetRatio = originalWidth / originalHeight;
      baseWidth = originalWidth * factor;
      baseHeight = originalHeight * factor;
      break;
  }

  // Scale resolution nicely to balance quality & speed
  let canvasWidth = Math.round(baseWidth);
  let canvasHeight = Math.round(baseHeight);

  if (canvasWidth > maxDimension || canvasHeight > maxDimension) {
    if (canvasWidth > canvasHeight) {
      canvasHeight = Math.round((canvasHeight * maxDimension) / canvasWidth);
      canvasWidth = maxDimension;
    } else {
      canvasWidth = Math.round((canvasWidth * maxDimension) / canvasHeight);
      canvasHeight = maxDimension;
    }
  }

  const originalRatio = originalWidth / originalHeight;

  // FIT MODE 1: Blur Background (100% full subject preserved, no head/feet cut off)
  if (fitMode === 'blur-fill') {
    const scale = Math.min(canvasWidth / originalWidth, canvasHeight / originalHeight);
    const fgWidth = Math.round(originalWidth * scale);
    const fgHeight = Math.round(originalHeight * scale);
    const fgX = Math.round((canvasWidth - fgWidth) / 2);
    const fgY = Math.round((canvasHeight - fgHeight) / 2);

    return {
      canvasWidth,
      canvasHeight,
      drawType: 'blur-fill',
      fitParams: { fgX, fgY, fgWidth, fgHeight },
    };
  }

  // FIT MODE 2: Dark / Solid Letterbox
  if (fitMode === 'fit-contain' || fitMode === 'contain') {
    const scale = Math.min(canvasWidth / originalWidth, canvasHeight / originalHeight);
    const fgWidth = Math.round(originalWidth * scale);
    const fgHeight = Math.round(originalHeight * scale);
    const fgX = Math.round((canvasWidth - fgWidth) / 2);
    const fgY = Math.round((canvasHeight - fgHeight) / 2);

    return {
      canvasWidth,
      canvasHeight,
      drawType: 'contain',
      fitParams: { fgX, fgY, fgWidth, fgHeight },
    };
  }

  // FIT MODE 3: Crop Modes (Top / Center / Bottom / Custom)
  let sx = 0;
  let sy = 0;
  let sWidth = originalWidth;
  let sHeight = originalHeight;

  if (originalRatio > targetRatio) {
    // Image is wider than target ratio -> crop horizontal left/right
    sWidth = originalHeight * targetRatio;
    sx = (originalWidth - sWidth) / 2;
  } else {
    // Image is taller than target ratio (e.g. 9:16 portrait in 4:5) -> crop vertical
    sHeight = originalWidth / targetRatio;
    const maxSy = Math.max(0, originalHeight - sHeight);

    if (fitMode === 'crop-top') {
      // Fokus Kepala / Atas: sy = 0, kepala tidak terpotong sama sekali!
      sy = 0;
    } else if (fitMode === 'crop-bottom') {
      // Fokus Bawah
      sy = maxSy;
    } else if (customCropOffsetY !== undefined) {
      // Custom offset (0 = top, 50 = center, 100 = bottom)
      sy = Math.round((customCropOffsetY / 100) * maxSy);
    } else {
      // Default center
      sy = Math.round(maxSy / 2);
    }
  }

  return {
    canvasWidth,
    canvasHeight,
    drawType: 'crop',
    cropParams: { sx, sy, sWidth, sHeight },
  };
}

// State-of-the-art Image Enhancement & Super-Resolution Detail Engine
function applyAiHdrAndSharpen(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: FilterSettings
) {
  const {
    aiHdrIntensity = 0,
    sharpness = 0,
    clarity = 0,
    aiSmoothNeural = 0,
    vibrance = 0,
    contrast = 0,
    brightness = 0,
    warmth = 0,
    enhancementClarity = 0,
    enhancementDetailSharp = 0,
    enhancementDenoise = 0,
    enhancementColorVibrance = 0,
    enhancementAutoLevel = false,
    upscaleFactor = 1,
  } = settings;

  const effectiveClarity = Math.max(clarity, enhancementClarity);
  const effectiveSharpness = Math.max(sharpness, enhancementDetailSharp);
  const effectiveDenoise = Math.max(aiSmoothNeural, enhancementDenoise);
  const effectiveVibrance = Math.max(vibrance, enhancementColorVibrance);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const len = data.length;

  // ----------------------------------------------------
  // PASS 0: Smart Auto-Levels / Dynamic Range Histogram Stretch
  // (Mengoreksi gambar gelap, berkabut / dull agar langsung jernih dan cerah alami)
  // ----------------------------------------------------
  if (enhancementAutoLevel) {
    let minLum = 255;
    let maxLum = 0;
    // Sample step to keep performance instant on large images
    const sampleStep = Math.max(1, Math.floor(len / 40000)) * 4;

    for (let i = 0; i < len; i += sampleStep) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    if (maxLum - minLum > 30) {
      const range = maxLum - minLum;
      for (let i = 0; i < len; i += 4) {
        data[i] = Math.min(255, Math.max(0, ((data[i] - minLum) / range) * 255));
        data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - minLum) / range) * 255));
        data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - minLum) / range) * 255));
      }
    }
  }

  // ----------------------------------------------------
  // PASS 1: Edge-Preserving Denoise & JPEG Compression Artifact Smoother
  // (Menghilangkan bintik/noise/pecah kompresi JPG pada gambar buram tanpa mengaburkan tepi objek)
  // ----------------------------------------------------
  if (effectiveDenoise > 5) {
    const smoothFactor = (effectiveDenoise / 100) * 0.48;
    const threshold = 32; // Edge detection threshold
    const tempBuffer = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y += 1) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x += 1) {
        const idx = (rowOffset + x) * 4;
        const cR = data[idx];
        const cG = data[idx + 1];
        const cB = data[idx + 2];
        const cLum = 0.299 * cR + 0.587 * cG + 0.114 * cB;

        // Sample 4 cross neighbors
        const topIdx = ((y - 1) * width + x) * 4;
        const botIdx = ((y + 1) * width + x) * 4;
        const leftIdx = (rowOffset + (x - 1)) * 4;
        const rightIdx = (rowOffset + (x + 1)) * 4;

        let accumR = cR;
        let accumG = cG;
        let accumB = cB;
        let weightSum = 1;

        const neighbors = [topIdx, botIdx, leftIdx, rightIdx];
        for (let n = 0; n < 4; n++) {
          const nIdx = neighbors[n];
          const nR = data[nIdx];
          const nG = data[nIdx + 1];
          const nB = data[nIdx + 2];
          const nLum = 0.299 * nR + 0.587 * nG + 0.114 * nB;
          const diff = Math.abs(cLum - nLum);

          if (diff < threshold) {
            const spatialWeight = smoothFactor * (1 - diff / threshold);
            accumR += nR * spatialWeight;
            accumG += nG * spatialWeight;
            accumB += nB * spatialWeight;
            weightSum += spatialWeight;
          }
        }

        tempBuffer[idx] = accumR / weightSum;
        tempBuffer[idx + 1] = accumG / weightSum;
        tempBuffer[idx + 2] = accumB / weightSum;
      }
    }
    data.set(tempBuffer);
  }

  // ----------------------------------------------------
  // PASS 2: Dynamic Range S-Curve, Micro-Clarity (De-Haze) & Vibrance
  // (Meningkatkan kejernihan, kontras mikro, dan kecerahan warna tanpa merusak warna kulit)
  // ----------------------------------------------------
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const brightnessOffset = brightness * 1.6;
  const hdrNorm = aiHdrIntensity / 100;
  const clarityNorm = effectiveClarity / 100;
  const vibranceNorm = effectiveVibrance / 100;
  const warmthOffset = warmth * 0.85;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness offset
    r += brightnessOffset;
    g += brightnessOffset;
    b += brightnessOffset;

    // S-Curve Contrast
    if (contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Warmth / Golden Tone
    if (warmth !== 0) {
      r += warmthOffset;
      b -= warmthOffset * 0.75;
    }

    // Dynamic Luminance
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // HDR Shadow Lift & Specular Highlight Compression
    if (hdrNorm > 0) {
      if (luminance < 130) {
        const shadowLift = Math.pow((130 - luminance) / 130, 1.2) * 45 * hdrNorm;
        r += shadowLift;
        g += shadowLift;
        b += shadowLift;
      } else if (luminance > 175) {
        const highlightGlow = Math.pow((luminance - 175) / 80, 1.4) * 32 * hdrNorm;
        r += highlightGlow * 1.05;
        g += highlightGlow * 1.0;
        b += highlightGlow * 0.95;
      }
    }

    // Micro-Clarity (De-haze midtone depth boost)
    if (clarityNorm > 0) {
      const midtoneDistance = Math.abs(luminance - 128) / 128;
      const clarityBoost = (1 - midtoneDistance) * 26 * clarityNorm;
      if (luminance > 128) {
        r += clarityBoost;
        g += clarityBoost;
        b += clarityBoost;
      } else {
        r -= clarityBoost * 0.75;
        g -= clarityBoost * 0.75;
        b -= clarityBoost * 0.75;
      }
    }

    // Smart Vibrance (Saturation pop with skin-tone protection)
    if (vibranceNorm > 0) {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = (max - min) / (max || 1);
      const amt = (1 - sat) * vibranceNorm * 0.8;

      r += (r - luminance) * amt;
      g += (g - luminance) * amt;
      b += (b - luminance) * amt;
    }

    // Clamp
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }

  // ----------------------------------------------------
  // PASS 3: High-Pass Unsharp Mask & Micro-Detail Sharpening
  // (Meningkatkan ketajaman detail: mata, rambut, tekstur pakaian, garis tepi objek)
  // ----------------------------------------------------
  // Scale sharpening strength slightly if upscaling is active for razor crisp results
  const upscaleBonus = upscaleFactor > 1 ? (upscaleFactor - 1) * 15 : 0;
  const totalSharpness = Math.max(effectiveSharpness, effectiveClarity * 0.7) + upscaleBonus;

  if (totalSharpness > 5) {
    const sharpWeight = (Math.min(100, totalSharpness) / 100) * 0.58;
    const centerWeight = 1 + 4 * sharpWeight;
    const negWeight = -sharpWeight;
    const outputBuffer = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      const topRow = (y - 1) * width;
      const botRow = (y + 1) * width;

      for (let x = 1; x < width - 1; x++) {
        const idx = (row + x) * 4;

        for (let c = 0; c < 3; c++) {
          const top = data[(topRow + x) * 4 + c];
          const bottom = data[(botRow + x) * 4 + c];
          const left = data[(row + (x - 1)) * 4 + c];
          const right = data[(row + (x + 1)) * 4 + c];
          const center = data[idx + c];

          const val = center * centerWeight + (top + bottom + left + right) * negWeight;
          outputBuffer[idx + c] = val < 0 ? 0 : val > 255 ? 255 : val;
        }
      }
    }
    imageData.data.set(outputBuffer);
  }

  ctx.putImageData(imageData, 0, 0);
}

// Apply AI Bloom Glow overlay
function applyAiBloomGlow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bloomAmount: number
) {
  if (bloomAmount <= 0) return;

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = width / 4;
  glowCanvas.height = height / 4;
  const gCtx = glowCanvas.getContext('2d');
  if (!gCtx) return;

  // Draw scaled down
  gCtx.drawImage(ctx.canvas, 0, 0, glowCanvas.width, glowCanvas.height);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = (bloomAmount / 100) * 0.35;
  ctx.filter = `blur(${Math.max(6, Math.round(width * 0.02))}px)`;
  ctx.drawImage(glowCanvas, 0, 0, width, height);
  ctx.restore();
}

// Draw Neon Streaks / Light Rays (as seen in viral media like Asupan Videy template)
function drawNeonRays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Diagonal laser ray from bottom right to top left
  const grad1 = ctx.createLinearGradient(width * 0.4, height, width, height * 0.6);
  grad1.addColorStop(0, 'rgba(0,0,0,0)');
  grad1.addColorStop(0.3, color + '99');
  grad1.addColorStop(0.5, '#ffffff');
  grad1.addColorStop(0.7, color + '99');
  grad1.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad1;
  ctx.beginPath();
  ctx.moveTo(width * 0.3, height);
  ctx.lineTo(width, height * 0.5);
  ctx.lineTo(width, height * 0.75);
  ctx.lineTo(width * 0.5, height);
  ctx.closePath();
  ctx.fill();

  // Top Left glow streak
  const grad2 = ctx.createLinearGradient(0, height * 0.25, width * 0.45, 0);
  grad2.addColorStop(0, color + 'aa');
  grad2.addColorStop(0.4, '#ffffff');
  grad2.addColorStop(0.7, color + '88');
  grad2.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad2;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.2);
  ctx.lineTo(width * 0.4, 0);
  ctx.lineTo(width * 0.2, 0);
  ctx.lineTo(0, height * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Apply Vignette for Facebook thumb-stopping focus
function applyVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vignetteAmount: number
) {
  if (vignetteAmount <= 0) return;

  ctx.save();
  const radius = Math.max(width, height) * 0.75;
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    radius * 0.3,
    width / 2,
    height / 2,
    radius
  );

  const opacity = (vignetteAmount / 100) * 0.65;
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.7, `rgba(5, 7, 15, ${opacity * 0.4})`);
  gradient.addColorStop(1, `rgba(5, 7, 15, ${opacity})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Content-Aware Logo Inpainting, Eraser, Patch Cloning, and Logo Replacer Engine
export async function applyLogoRemoverRegions(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: FilterSettings,
  logos: LogoItem[] = [],
  logoImgCache?: Map<string, HTMLImageElement>
) {
  const removerSettings = settings.logoRemover;
  if (!removerSettings || !removerSettings.enabled || !removerSettings.regions || removerSettings.regions.length === 0) {
    return;
  }

  for (const region of removerSettings.regions) {
    if (!region.enabled) continue;

    // Convert relative % coordinates to canvas pixel space
    const rx = Math.max(0, Math.min(width - 10, Math.round((region.x / 100) * width)));
    const ry = Math.max(0, Math.min(height - 10, Math.round((region.y / 100) * height)));
    const rw = Math.max(8, Math.min(width - rx, Math.round((region.width / 100) * width)));
    const rh = Math.max(8, Math.min(height - ry, Math.round((region.height / 100) * height)));

    if (rw <= 4 || rh <= 4) continue;

    const pad = Math.max(8, Math.min(60, Math.round(Math.min(rw, rh) * 0.3)));
    const sampleX = Math.max(0, rx - pad);
    const sampleY = Math.max(0, ry - pad);
    const sampleW = Math.min(width - sampleX, rw + pad * 2);
    const sampleH = Math.min(height - sampleY, rh + pad * 2);

    const featherPx = Math.max(4, region.feather || Math.round(Math.min(rw, rh) * 0.15));

    // ----------------------------------------------------
    // PASS A1: CLONE STAMP / DIRECTIONAL TEXTURE PATCH (Menambal dari area bersih sekitar)
    // ----------------------------------------------------
    if (region.mode === 'clone-stamp-patch') {
      const dir = region.fillSource || 'clone-left';
      let srcX = rx;
      let srcY = ry;

      if (dir === 'clone-left') {
        srcX = Math.max(0, rx - rw);
      } else if (dir === 'clone-right') {
        srcX = Math.min(width - rw, rx + rw);
      } else if (dir === 'clone-top') {
        srcY = Math.max(0, ry - rh);
      } else if (dir === 'clone-bottom') {
        srcY = Math.min(height - rh, ry + rh);
      }

      // Grab source and destination imageData
      const srcData = ctx.getImageData(srcX, srcY, rw, rh);
      const dstData = ctx.getImageData(rx, ry, rw, rh);
      const sPix = srcData.data;
      const dPix = dstData.data;

      // Calculate average boundary color of destination (outer 4px ring)
      let dstBorderR = 0, dstBorderG = 0, dstBorderB = 0, dstCount = 0;
      let srcBorderR = 0, srcBorderG = 0, srcBorderB = 0, srcCount = 0;

      for (let y = 0; y < rh; y++) {
        for (let x = 0; x < rw; x++) {
          const isBorder = x < 4 || x >= rw - 4 || y < 4 || y >= rh - 4;
          if (isBorder) {
            const idx = (y * rw + x) * 4;
            dstBorderR += dPix[idx];
            dstBorderG += dPix[idx + 1];
            dstBorderB += dPix[idx + 2];
            dstCount++;

            srcBorderR += sPix[idx];
            srcBorderG += sPix[idx + 1];
            srcBorderB += sPix[idx + 2];
            srcCount++;
          }
        }
      }

      const diffR = dstCount > 0 ? (dstBorderR / dstCount) - (srcBorderR / srcCount) : 0;
      const diffG = dstCount > 0 ? (dstBorderG / dstCount) - (srcBorderG / srcCount) : 0;
      const diffB = dstCount > 0 ? (dstBorderB / dstCount) - (srcBorderB / srcCount) : 0;

      const fDist = Math.max(6, featherPx);

      // Blend patch into destination with lighting correction and feathered alpha
      for (let y = 0; y < rh; y++) {
        const distY = Math.min(y, rh - 1 - y);
        for (let x = 0; x < rw; x++) {
          const distX = Math.min(x, rw - 1 - x);
          const minDist = Math.min(distX, distY);

          // Smooth cosine curve
          const normDist = Math.min(1, minDist / fDist);
          const alpha = normDist * normDist * (3 - 2 * normDist);

          const idx = (y * rw + x) * 4;

          // Color & lighting adapted pixel from clean source
          const matchedR = Math.min(255, Math.max(0, sPix[idx] + diffR));
          const matchedG = Math.min(255, Math.max(0, sPix[idx + 1] + diffG));
          const matchedB = Math.min(255, Math.max(0, sPix[idx + 2] + diffB));

          dPix[idx] = Math.round(dPix[idx] * (1 - alpha) + matchedR * alpha);
          dPix[idx + 1] = Math.round(dPix[idx + 1] * (1 - alpha) + matchedG * alpha);
          dPix[idx + 2] = Math.round(dPix[idx + 2] * (1 - alpha) + matchedB * alpha);
        }
      }

      ctx.putImageData(dstData, rx, ry);
    }
    // ----------------------------------------------------
    // PASS A2: Content-Aware Texture & Gradient Inpainting (Hapus Bersih Logo)
    // ----------------------------------------------------
    else if (
      region.mode === 'content-aware-heal' ||
      region.mode === 'replace-my-logo' ||
      region.mode === 'cover-badge'
    ) {
      const imgData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
      const data = imgData.data;

      const innerLeft = rx - sampleX;
      const innerTop = ry - sampleY;
      const innerRight = innerLeft + rw;
      const innerBottom = innerTop + rh;

      // Sample boundary colors from surrounding outer border
      const topSamples: { r: number; g: number; b: number }[] = [];
      const bottomSamples: { r: number; g: number; b: number }[] = [];
      const leftSamples: { r: number; g: number; b: number }[] = [];
      const rightSamples: { r: number; g: number; b: number }[] = [];

      for (let x = 0; x < sampleW; x++) {
        // Top boundary sample
        const topIdx = (Math.max(0, innerTop - 3) * sampleW + x) * 4;
        topSamples.push({ r: data[topIdx], g: data[topIdx + 1], b: data[topIdx + 2] });

        // Bottom boundary sample
        const botY = Math.min(sampleH - 1, innerBottom + 3);
        const botIdx = (botY * sampleW + x) * 4;
        bottomSamples.push({ r: data[botIdx], g: data[botIdx + 1], b: data[botIdx + 2] });
      }

      for (let y = 0; y < sampleH; y++) {
        // Left boundary sample
        const leftIdx = (y * sampleW + Math.max(0, innerLeft - 3)) * 4;
        leftSamples.push({ r: data[leftIdx], g: data[leftIdx + 1], b: data[leftIdx + 2] });

        // Right boundary sample
        const rX = Math.min(sampleW - 1, innerRight + 3);
        const rightIdx = (y * sampleW + rX) * 4;
        rightSamples.push({ r: data[rightIdx], g: data[rightIdx + 1], b: data[rightIdx + 2] });
      }

      // Compute regional average tone
      let avgR = 0, avgG = 0, avgB = 0, sampleCount = 0;
      topSamples.forEach(s => { avgR += s.r; avgG += s.g; avgB += s.b; sampleCount++; });
      bottomSamples.forEach(s => { avgR += s.r; avgG += s.g; avgB += s.b; sampleCount++; });
      leftSamples.forEach(s => { avgR += s.r; avgG += s.g; avgB += s.b; sampleCount++; });
      rightSamples.forEach(s => { avgR += s.r; avgG += s.g; avgB += s.b; sampleCount++; });
      if (sampleCount > 0) {
        avgR /= sampleCount;
        avgG /= sampleCount;
        avgB /= sampleCount;
      }

      // Fill inpaint area with distance-weighted boundary interpolation + subtle natural photo noise
      for (let y = innerTop; y < innerBottom; y++) {
        if (y < 0 || y >= sampleH) continue;
        const normY = (y - innerTop) / Math.max(1, innerBottom - innerTop); // 0 to 1

        for (let x = innerLeft; x < innerRight; x++) {
          if (x < 0 || x >= sampleW) continue;
          const normX = (x - innerLeft) / Math.max(1, innerRight - innerLeft); // 0 to 1

          const topS = topSamples[x] || { r: avgR, g: avgG, b: avgB };
          const botS = bottomSamples[x] || { r: avgR, g: avgG, b: avgB };
          const leftS = leftSamples[y] || { r: avgR, g: avgG, b: avgB };
          const rightS = rightSamples[y] || { r: avgR, g: avgG, b: avgB };

          // Bilinear boundary blend with harmonic weights
          const wTop = Math.max(0.001, (1 - normY) * (1 - normY));
          const wBot = Math.max(0.001, normY * normY);
          const wLeft = Math.max(0.001, (1 - normX) * (1 - normX));
          const wRight = Math.max(0.001, normX * normX);
          const totalW = wTop + wBot + wLeft + wRight;

          let finalR = (topS.r * wTop + botS.r * wBot + leftS.r * wLeft + rightS.r * wRight) / totalW;
          let finalG = (topS.g * wTop + botS.g * wBot + leftS.g * wLeft + rightS.g * wRight) / totalW;
          let finalB = (topS.b * wTop + botS.b * wBot + leftS.b * wLeft + rightS.b * wRight) / totalW;

          // Add subtle natural photo grain to prevent flat digital artifact
          const noise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1) * 4 - 2;
          finalR = Math.min(255, Math.max(0, finalR + noise));
          finalG = Math.min(255, Math.max(0, finalG + noise));
          finalB = Math.min(255, Math.max(0, finalB + noise));

          // Feathered distance to box edges for seamless transition
          const distToLeft = x - innerLeft;
          const distToRight = innerRight - x;
          const distToTop = y - innerTop;
          const distToBottom = innerBottom - y;
          const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

          const alpha = Math.min(1, minDist / Math.max(1, featherPx));
          const smoothAlpha = alpha * alpha * (3 - 2 * alpha); // Smoothstep curve

          const idx = (y * sampleW + x) * 4;
          data[idx] = Math.round(data[idx] * (1 - smoothAlpha) + finalR * smoothAlpha);
          data[idx + 1] = Math.round(data[idx + 1] * (1 - smoothAlpha) + finalG * smoothAlpha);
          data[idx + 2] = Math.round(data[idx + 2] * (1 - smoothAlpha) + finalB * smoothAlpha);
        }
      }

      ctx.putImageData(imgData, sampleX, sampleY);
    } else if (region.mode === 'smart-blur') {
      // Smart Gaussian / Box Blur mode on logo area
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = rw;
      blurCanvas.height = rh;
      const bCtx = blurCanvas.getContext('2d');
      if (bCtx) {
        bCtx.drawImage(ctx.canvas, rx, ry, rw, rh, 0, 0, rw, rh);
        ctx.save();
        const blurRadius = Math.max(8, region.blurStrength || Math.round(rw * 0.12));
        ctx.filter = `blur(${blurRadius}px)`;
        ctx.drawImage(blurCanvas, rx, ry, rw, rh);
        ctx.restore();
      }
    }

    // ----------------------------------------------------
    // PASS B: Cover Plate (Opsional Plat Background Estetik)
    // ----------------------------------------------------
    if (region.coverPlateStyle && region.coverPlateStyle !== 'transparent') {
      ctx.save();
      const radius = Math.min(rw, rh) * 0.35;

      if (region.coverPlateStyle === 'dark-glass') {
        ctx.fillStyle = 'rgba(10, 15, 29, 0.82)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = Math.max(1.5, Math.round(width * 0.0015));
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = Math.round(width * 0.015);
      } else if (region.coverPlateStyle === 'blur-pill') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.lineWidth = Math.max(1.5, Math.round(width * 0.002));
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = Math.round(width * 0.02);
      } else if (region.coverPlateStyle === 'solid-pill') {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = Math.max(2, Math.round(width * 0.002));
      } else if (region.coverPlateStyle === 'white-card') {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = Math.round(width * 0.015);
      }

      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, radius);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // ----------------------------------------------------
    // PASS C: Ganti dengan Logo Baru Milik Saya (Auto Replace with My Logo)
    // ----------------------------------------------------
    if (region.mode === 'replace-my-logo' || region.mode === 'cover-badge') {
      let targetLogo: LogoItem | undefined;

      if (region.replaceWithLogoId) {
        targetLogo = logos.find((l) => l.id === region.replaceWithLogoId);
      }
      if (!targetLogo) {
        targetLogo = logos.find((l) => l.enabled && l.url) || logos[0];
      }

      if (targetLogo && targetLogo.url) {
        try {
          let repImg: HTMLImageElement;
          if (logoImgCache && logoImgCache.has(targetLogo.url)) {
            repImg = logoImgCache.get(targetLogo.url)!;
          } else {
            repImg = await loadImage(targetLogo.url);
            if (logoImgCache) logoImgCache.set(targetLogo.url, repImg);
          }

          const repAspect = repImg.width / repImg.height;
          // Scale to fit nicely inside the replacement box with 10% padding
          const padInner = Math.round(Math.min(rw, rh) * 0.12);
          const maxInnerW = rw - padInner * 2;
          const maxInnerH = rh - padInner * 2;

          let drawW = maxInnerW;
          let drawH = drawW / repAspect;

          if (drawH > maxInnerH) {
            drawH = maxInnerH;
            drawW = drawH * repAspect;
          }

          const drawX = rx + (rw - drawW) / 2;
          const drawY = ry + (rh - drawH) / 2;

          ctx.save();
          ctx.globalAlpha = targetLogo.opacity ?? 1.0;

          if (targetLogo.glowEffect) {
            ctx.shadowColor = targetLogo.glowColor || '#ff007f';
            ctx.shadowBlur = Math.round(width * 0.02);
          } else if (targetLogo.dropShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = Math.round(width * 0.012);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = Math.round(height * 0.004);
          }

          ctx.drawImage(repImg, drawX, drawY, drawW, drawH);
          ctx.restore();
        } catch (e) {
          console.warn('Could not render replacement logo:', e);
        }
      }
    }
  }
}

// Render individual logo on canvas
export async function renderLogo(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  logo: LogoItem,
  logoImgCache?: Map<string, HTMLImageElement>
) {
  if (!logo.enabled || !logo.url) return;

  let img: HTMLImageElement;
  if (logoImgCache && logoImgCache.has(logo.url)) {
    img = logoImgCache.get(logo.url)!;
  } else {
    img = await loadImage(logo.url);
    if (logoImgCache) logoImgCache.set(logo.url, img);
  }

  const logoAspect = img.width / img.height;
  const targetLogoWidth = (canvasWidth * logo.scalePercent) / 100;
  const targetLogoHeight = targetLogoWidth / logoAspect;
  const margin = (canvasWidth * logo.marginPercent) / 100;

  let x = margin;
  let y = margin;

  switch (logo.position) {
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-center':
      x = (canvasWidth - targetLogoWidth) / 2;
      y = margin;
      break;
    case 'top-right':
      x = canvasWidth - targetLogoWidth - margin;
      y = margin;
      break;
    case 'middle-left':
      x = margin;
      y = (canvasHeight - targetLogoHeight) / 2;
      break;
    case 'center':
      x = (canvasWidth - targetLogoWidth) / 2;
      y = (canvasHeight - targetLogoHeight) / 2;
      break;
    case 'middle-right':
      x = canvasWidth - targetLogoWidth - margin;
      y = (canvasHeight - targetLogoHeight) / 2;
      break;
    case 'bottom-left':
      x = margin;
      y = canvasHeight - targetLogoHeight - margin;
      break;
    case 'bottom-center':
      x = (canvasWidth - targetLogoWidth) / 2;
      y = canvasHeight - targetLogoHeight - margin;
      break;
    case 'bottom-right':
      x = canvasWidth - targetLogoWidth - margin;
      y = canvasHeight - targetLogoHeight - margin;
      break;
    case 'custom':
      x = ((logo.customX ?? 10) / 100) * canvasWidth;
      y = ((logo.customY ?? 10) / 100) * canvasHeight;
      break;
  }

  ctx.save();
  ctx.globalAlpha = logo.opacity;

  // Drop shadow or glow
  if (logo.glowEffect) {
    ctx.shadowColor = logo.glowColor || '#ff007f';
    ctx.shadowBlur = Math.round(canvasWidth * 0.025);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else if (logo.dropShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = Math.round(canvasWidth * 0.015);
    ctx.shadowOffsetX = Math.round(canvasWidth * 0.005);
    ctx.shadowOffsetY = Math.round(canvasWidth * 0.005);
  }

  ctx.drawImage(img, x, y, targetLogoWidth, targetLogoHeight);
  ctx.restore();
}

// Procedural organic grunge brush shape for viral Facebook subtitle banners
function drawGrungeBrushShape(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  style: BrushBannerStyle,
  rotation = 0
) {
  if (style === 'none') return;

  ctx.save();
  ctx.translate(centerX, centerY);
  if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);

  const hw = width / 2;
  const hh = height / 2;

  let fillGradient: CanvasGradient | string = '#e11d48';

  if (style === 'pink-brush') {
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#e11d48');
    grad.addColorStop(0.45, '#f43f5e');
    grad.addColorStop(1, '#ec4899');
    fillGradient = grad;
  } else if (style === 'yellow-brush') {
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.3, '#fbbf24');
    grad.addColorStop(0.75, '#f59e0b');
    grad.addColorStop(1, '#d97706');
    fillGradient = grad;
  } else if (style === 'red-brush') {
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#991b1b');
    grad.addColorStop(0.4, '#dc2626');
    grad.addColorStop(1, '#ef4444');
    fillGradient = grad;
  } else if (style === 'cyan-brush') {
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#0891b2');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, '#22d3ee');
    fillGradient = grad;
  } else if (style === 'white-brush') {
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, '#e2e8f0');
    fillGradient = grad;
  } else if (style === 'dark-carbon') {
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    fillGradient = grad;
  } else if (style === 'solid-rounded') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, width, height, 12);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Draw procedural jagged paint brush ribbon with deep shadow for contrast
  ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
  ctx.shadowBlur = Math.round(height * 0.35);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(height * 0.12);

  ctx.fillStyle = fillGradient;
  ctx.beginPath();

  // Top edge (slightly wavy with micro bristle notches)
  ctx.moveTo(-hw, -hh * 0.85);
  ctx.bezierCurveTo(-hw * 0.6, -hh * 1.05, hw * 0.6, -hh * 0.95, hw, -hh * 0.88);

  // Right edge jagged brush tails
  ctx.lineTo(hw + 14, -hh * 0.6);
  ctx.lineTo(hw + 4, -hh * 0.3);
  ctx.lineTo(hw + 22, -hh * 0.05);
  ctx.lineTo(hw + 8, hh * 0.25);
  ctx.lineTo(hw + 18, hh * 0.55);
  ctx.lineTo(hw + 2, hh * 0.85);

  // Bottom edge (slightly wavy)
  ctx.bezierCurveTo(hw * 0.5, hh * 1.05, -hw * 0.5, hh * 0.92, -hw, hh * 0.85);

  // Left edge jagged brush tails
  ctx.lineTo(-hw - 12, hh * 0.6);
  ctx.lineTo(-hw - 3, hh * 0.35);
  ctx.lineTo(-hw - 20, hh * 0.05);
  ctx.lineTo(-hw - 6, -hh * 0.25);
  ctx.lineTo(-hw - 16, -hh * 0.55);
  ctx.lineTo(-hw - 2, -hh * 0.8);

  ctx.closePath();
  ctx.fill();

  // Highlight inner brush stroke line for extra realism
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = Math.max(1.5, height * 0.04);
  ctx.beginPath();
  ctx.moveTo(-hw * 0.85, -hh * 0.45);
  ctx.bezierCurveTo(-hw * 0.3, -hh * 0.55, hw * 0.3, -hh * 0.45, hw * 0.85, -hh * 0.4);
  ctx.stroke();

  ctx.restore();
}

// Render Top 3D Headline (seperti "BFF" pada gambar contoh pengguna)
function renderTop3DHeadline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viralHook: ViralHookSettings
) {
  if (!viralHook.showTop3DText || !viralHook.top3DText.trim()) return;

  const text = viralHook.top3DText.trim();
  const fontSize = Math.round(width * (viralHook.top3DSize / 100) * 0.45);
  const centerX = width / 2;
  const centerY = height * (viralHook.top3DYPosition / 100);
  const depth = Math.max(2, Math.round(viralHook.top3DDepth * (width / 1000)));

  ctx.save();
  ctx.translate(centerX, centerY);
  if (viralHook.top3DRotation !== 0) {
    ctx.rotate((viralHook.top3DRotation * Math.PI) / 180);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 italic ${fontSize}px "Montserrat", "Impact", "Anton", sans-serif`;

  // Color schemes for 3D Text
  let gradColors = {
    top: '#ffffff',
    mid: '#fce7f3',
    bot: '#f43f5e',
    extrusion: '#9f1239',
    extrusionDark: '#4c0519',
    outerStroke: '#25020c',
    glow: '#ff2a85',
  };

  switch (viralHook.top3DStyle) {
    case 'cyan-electric':
      gradColors = {
        top: '#ffffff',
        mid: '#a5f3fc',
        bot: '#06b6d4',
        extrusion: '#0e7490',
        extrusionDark: '#164e63',
        outerStroke: '#082f49',
        glow: '#00f0ff',
      };
      break;
    case 'gold-metal':
      gradColors = {
        top: '#ffffff',
        mid: '#fef08a',
        bot: '#f59e0b',
        extrusion: '#b45309',
        extrusionDark: '#78350f',
        outerStroke: '#451a03',
        glow: '#fbbf24',
      };
      break;
    case 'fire-orange':
      gradColors = {
        top: '#ffffff',
        mid: '#fed7aa',
        bot: '#ea580c',
        extrusion: '#c2410c',
        extrusionDark: '#7c2d12',
        outerStroke: '#431407',
        glow: '#ff5722',
      };
      break;
    case 'white-silver':
      gradColors = {
        top: '#ffffff',
        mid: '#e2e8f0',
        bot: '#94a3b8',
        extrusion: '#475569',
        extrusionDark: '#1e293b',
        outerStroke: '#0f172a',
        glow: '#ffffff',
      };
      break;
    case 'purple-cyber':
      gradColors = {
        top: '#ffffff',
        mid: '#f3e8ff',
        bot: '#a855f7',
        extrusion: '#7e22ce',
        extrusionDark: '#581c87',
        outerStroke: '#3b0764',
        glow: '#d946ef',
      };
      break;
    case 'pink-neon':
    default:
      gradColors = {
        top: '#ffffff',
        mid: '#fce7f3',
        bot: '#f43f5e',
        extrusion: '#9f1239',
        extrusionDark: '#4c0519',
        outerStroke: '#25020c',
        glow: '#ff2a85',
      };
      break;
  }

  // 1. Neon Outer Glow & Deep Shadow
  ctx.save();
  ctx.shadowColor = gradColors.glow;
  ctx.shadowBlur = Math.round(fontSize * 0.28);
  ctx.lineWidth = Math.round(fontSize * 0.14);
  ctx.strokeStyle = gradColors.outerStroke;
  ctx.strokeText(text, 0, 0);
  ctx.restore();

  // 2. 3D Extrusion Stacking (Back to Front)
  for (let i = depth; i >= 1; i--) {
    const offsetX = -i * 0.85;
    const offsetY = i * 1.05;

    ctx.fillStyle = i > depth / 2 ? gradColors.extrusionDark : gradColors.extrusion;
    ctx.strokeStyle = gradColors.outerStroke;
    ctx.lineWidth = Math.round(fontSize * 0.09);
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2.5;

    ctx.strokeText(text, offsetX, offsetY);
    ctx.fillText(text, offsetX, offsetY);
  }

  // 3. Thick Outer Border on Front Face
  ctx.lineWidth = Math.round(fontSize * 0.08);
  ctx.strokeStyle = gradColors.outerStroke;
  ctx.strokeText(text, 0, 0);

  // 4. Front Face Gradient Fill
  const faceGrad = ctx.createLinearGradient(0, -fontSize * 0.45, 0, fontSize * 0.45);
  faceGrad.addColorStop(0, gradColors.top);
  faceGrad.addColorStop(0.35, gradColors.mid);
  faceGrad.addColorStop(0.8, gradColors.bot);
  faceGrad.addColorStop(1, gradColors.extrusion);

  ctx.fillStyle = faceGrad;
  ctx.fillText(text, 0, 0);

  // 5. White Gloss Inner Bevel Outline (Bikin efek timbul 3D mengkilap seperti di contoh)
  ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.022));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.strokeText(text, 0, 0);

  ctx.restore();
}

// Render Bottom Viral Subtitle Banners (seperti di foto contoh)
function renderBottomViralHook(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viralHook: ViralHookSettings
) {
  if (!viralHook.showBottomHook) return;

  const sf = viralHook.bottomHookScale / 100;
  const bottomY = height * (1 - viralHook.bottomHookYOffset / 100);

  ctx.save();
  ctx.translate(width / 2, bottomY);
  if (viralHook.bottomHookRotation !== 0) {
    ctx.rotate((viralHook.bottomHookRotation * Math.PI) / 180);
  }

  const hasLine1 = viralHook.line1Text && viralHook.line1Text.trim().length > 0;
  const hasLine2 = viralHook.line2Text && viralHook.line2Text.trim().length > 0;
  const hasLine3 = viralHook.showSubTag && viralHook.subTagText && viralHook.subTagText.trim().length > 0;

  const fontLine1Size = Math.round(width * 0.046 * sf);
  const fontLine2Size = Math.round(width * 0.043 * sf);
  const fontLine3Size = Math.round(width * 0.048 * sf);

  const line2H = fontLine2Size * 1.65;
  const line2CenterY = 0;
  const line1CenterY = -line2H * 0.88;
  const line3CenterY = line2H * 0.88;

  // --- DRAW LINE 1 (e.g. "Awalnya biasa saja,") ---
  if (hasLine1) {
    ctx.font = `900 italic ${fontLine1Size}px "Montserrat", "Plus Jakarta Sans", "Impact", sans-serif`;
    const t1 = viralHook.line1Text.trim();
    const metrics1 = ctx.measureText(t1);
    const textW1 = metrics1.width;
    const brushW1 = Math.max(textW1 + 75 * sf, width * 0.48 * sf);
    const brushH1 = fontLine1Size * 1.6;

    // Draw Pink/Selected Brush Banner
    drawGrungeBrushShape(ctx, 0, line1CenterY, brushW1, brushH1, viralHook.line1BgStyle, -1.2);

    // Draw Line 1 Text
    ctx.save();
    ctx.translate(0, line1CenterY);
    ctx.rotate((-1.2 * Math.PI) / 180);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 italic ${fontLine1Size}px "Montserrat", "Plus Jakarta Sans", "Impact", sans-serif`;

    // Dark stroke outline & shadow for 100% legibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.lineWidth = Math.max(3, Math.round(fontLine1Size * 0.08));
    ctx.strokeStyle = '#050505';
    ctx.strokeText(t1, 0, fontLine1Size * 0.02);

    ctx.fillStyle = viralHook.line1TextColor || '#ffffff';
    ctx.fillText(t1, 0, fontLine1Size * 0.02);
    ctx.restore();
  }

  // --- DRAW LINE 2 (e.g. "tapi ending-nya bikin penasaran banget 😳") ---
  if (hasLine2) {
    ctx.font = `900 italic ${fontLine2Size}px "Montserrat", "Plus Jakarta Sans", "Impact", sans-serif`;
    const t2 = viralHook.line2Text.trim();
    const metrics2 = ctx.measureText(t2);
    const textW2 = metrics2.width;
    const brushW2 = Math.max(textW2 + 90 * sf, width * 0.75 * sf);
    const brushH2 = fontLine2Size * 1.75;

    // Draw Yellow/Selected Brush Banner
    drawGrungeBrushShape(ctx, 0, line2CenterY, brushW2, brushH2, viralHook.line2BgStyle, 0.5);

    // Draw Line 2 Text
    ctx.save();
    ctx.translate(0, line2CenterY);
    ctx.rotate((0.5 * Math.PI) / 180);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 italic ${fontLine2Size}px "Montserrat", "Plus Jakarta Sans", "Impact", sans-serif`;

    ctx.fillStyle = viralHook.line2TextColor || '#000000';
    ctx.fillText(t2, 0, fontLine2Size * 0.02);
    ctx.restore();
  }

  // --- DRAW LINE 3 (Sub-Tag / Cursive Script Badge e.g. "Ytta") ---
  if (hasLine3) {
    const t3 = viralHook.subTagText.trim();
    ctx.save();
    ctx.translate(0, line3CenterY);

    if (viralHook.subTagStyle === 'script-pink-wings') {
      ctx.font = `700 italic ${fontLine3Size}px "Pacifico", "Caveat", "Brush Script MT", cursive`;
      const metrics3 = ctx.measureText(t3);
      const textW3 = metrics3.width;
      const wingLength = Math.max(70 * sf, width * 0.14 * sf);

      // Glowing pink winged accent lines
      ctx.save();
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#ff2a85';
      ctx.lineWidth = Math.max(2.5, 3.5 * sf);
      ctx.lineCap = 'round';

      // Left wing line + diamond
      const leftStartX = -textW3 / 2 - 16 * sf;
      const leftEndX = leftStartX - wingLength;
      ctx.beginPath();
      ctx.moveTo(leftStartX, 0);
      ctx.lineTo(leftEndX, 0);
      ctx.stroke();

      // Left diamond dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(leftEndX - 6 * sf, 0, 3.5 * sf, 0, Math.PI * 2);
      ctx.fill();

      // Right wing line + diamond
      const rightStartX = textW3 / 2 + 16 * sf;
      const rightEndX = rightStartX + wingLength;
      ctx.beginPath();
      ctx.moveTo(rightStartX, 0);
      ctx.lineTo(rightEndX, 0);
      ctx.stroke();

      // Right diamond dot
      ctx.beginPath();
      ctx.arc(rightEndX + 6 * sf, 0, 3.5 * sf, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Text with thick pink outline + white fill
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 italic ${fontLine3Size}px "Pacifico", "Caveat", "Brush Script MT", cursive`;

      // Dark outer border
      ctx.lineWidth = Math.max(4, fontLine3Size * 0.18);
      ctx.strokeStyle = '#25020c';
      ctx.strokeText(t3, 0, 0);

      // Neon pink middle stroke
      ctx.lineWidth = Math.max(3, fontLine3Size * 0.12);
      ctx.strokeStyle = '#ff007f';
      ctx.strokeText(t3, 0, 0);

      // White fill
      ctx.fillStyle = '#ffffff';
      ctx.fillText(t3, 0, 0);
    } else if (viralHook.subTagStyle === 'script-gold') {
      ctx.font = `700 italic ${fontLine3Size}px "Pacifico", "Caveat", cursive`;
      const metrics3 = ctx.measureText(t3);
      const textW3 = metrics3.width;

      // Gold wing lines
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3 * sf;
      ctx.beginPath();
      ctx.moveTo(-textW3 / 2 - 14 * sf, 0);
      ctx.lineTo(-textW3 / 2 - 80 * sf, 0);
      ctx.moveTo(textW3 / 2 + 14 * sf, 0);
      ctx.lineTo(textW3 / 2 + 80 * sf, 0);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(4, fontLine3Size * 0.15);
      ctx.strokeStyle = '#451a03';
      ctx.strokeText(t3, 0, 0);

      ctx.fillStyle = '#fef08a';
      ctx.fillText(t3, 0, 0);
    } else if (viralHook.subTagStyle === 'neon-pill') {
      ctx.font = `800 ${Math.round(fontLine3Size * 0.7)}px "Montserrat", sans-serif`;
      const metrics3 = ctx.measureText(t3);
      const pillW = metrics3.width + 36 * sf;
      const pillH = fontLine3Size * 0.95;

      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2 * sf;
      ctx.beginPath();
      ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(t3, 0, 0);
    } else if (viralHook.subTagStyle === 'verified-badge') {
      ctx.font = `900 ${Math.round(fontLine3Size * 0.65)}px "Montserrat", sans-serif`;
      const metrics3 = ctx.measureText(t3);
      const badgeW = metrics3.width + 44 * sf;
      const badgeH = fontLine3Size * 0.85;

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * sf;
      ctx.beginPath();
      ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 6 * sf);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`✓ ${t3}`, 0, 0);
    } else {
      ctx.font = `800 italic ${Math.round(fontLine3Size * 0.75)}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(t3, 0, 0);
    }

    ctx.restore();
  }

  ctx.restore();
}

export function renderViralHook(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viralHook?: ViralHookSettings
) {
  if (!viralHook || !viralHook.enabled) return;

  // 1. Render Top 3D Headline ("BFF")
  renderTop3DHeadline(ctx, width, height, viralHook);

  // 2. Render Bottom High-CTR Brush Subtitle Hook ("Awalnya biasa saja, tapi ending-nya bikin penasaran banget 😳 Ytta")
  renderBottomViralHook(ctx, width, height, viralHook);
}

// Master function to process a single image
export async function processSingleImage(
  imageSource: string | File,
  settings: FilterSettings,
  logos: LogoItem[],
  logoImgCache?: Map<string, HTMLImageElement>
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  let sourceUrl = '';
  let isCreatedUrl = false;

  if (typeof imageSource === 'string') {
    sourceUrl = imageSource;
  } else {
    sourceUrl = URL.createObjectURL(imageSource);
    isCreatedUrl = true;
  }

  try {
    const mainImg = await loadImage(sourceUrl);
    const originalWidth = mainImg.naturalWidth || 1080;
    const originalHeight = mainImg.naturalHeight || 1350;

    const dim = getTargetDimensions(
      originalWidth,
      originalHeight,
      settings.aspectRatio,
      settings.fitMode || 'blur-fill',
      settings.customCropOffsetY ?? 50,
      8192,
      settings.upscaleFactor || 1
    );

    const canvas = document.createElement('canvas');
    canvas.width = dim.canvasWidth;
    canvas.height = dim.canvasHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context not available');

    // High quality scaling filters for upscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const width = dim.canvasWidth;
    const height = dim.canvasHeight;

    // 1. Draw base layout according to fitMode
    if (dim.drawType === 'blur-fill' && dim.fitParams) {
      // Step A: Blurred background fill (100% prevents black bars & prevents cropping head/feet)
      ctx.save();
      const bgScale = Math.max(width / originalWidth, height / originalHeight) * 1.15;
      const bgW = originalWidth * bgScale;
      const bgH = originalHeight * bgScale;
      const bgX = (width - bgW) / 2;
      const bgY = (height - bgH) / 2;

      // Draw enlarged image for blur
      ctx.drawImage(mainImg, bgX, bgY, bgW, bgH);

      // Fast Canvas box blur simulation
      ctx.filter = `blur(${Math.max(24, Math.round(width * 0.03))}px) brightness(0.65) saturate(1.2)`;
      ctx.drawImage(mainImg, bgX, bgY, bgW, bgH);
      ctx.filter = 'none';
      ctx.restore();

      // Subtle dark vignette gradient over background so foreground stands out
      const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.8);
      grad.addColorStop(0, 'rgba(0,0,0,0.15)');
      grad.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Step B: Foreground Image (100% uncropped - kepala & kaki utuh sempurna!)
      const { fgX, fgY, fgWidth, fgHeight } = dim.fitParams;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = Math.round(width * 0.03);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.round(height * 0.008);
      ctx.drawImage(mainImg, fgX, fgY, fgWidth, fgHeight);
      ctx.restore();
    } else if (dim.drawType === 'contain' && dim.fitParams) {
      // Dark solid background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      const { fgX, fgY, fgWidth, fgHeight } = dim.fitParams;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = Math.round(width * 0.02);
      ctx.drawImage(mainImg, fgX, fgY, fgWidth, fgHeight);
      ctx.restore();
    } else if (dim.drawType === 'crop' && dim.cropParams) {
      // Cropped image (Top / Center / Bottom)
      const { sx, sy, sWidth, sHeight } = dim.cropParams;
      ctx.drawImage(mainImg, sx, sy, sWidth, sHeight, 0, 0, width, height);
    } else {
      // Direct (original aspect ratio)
      ctx.drawImage(mainImg, 0, 0, width, height);
    }

    // 1.5. Content-Aware Logo Inpainting, Watermark Eraser & Logo Replacer Pass
    if (settings.logoRemover && settings.logoRemover.enabled && settings.logoRemover.regions?.length) {
      await applyLogoRemoverRegions(ctx, width, height, settings, logos, logoImgCache);
    }

    // 2. Image Enhancement & Sharpening pixel pass (only if any setting is active)
    const hasEnhancement =
      settings.aiHdrIntensity > 0 ||
      settings.sharpness > 0 ||
      (settings.clarity || 0) > 0 ||
      (settings.aiSmoothNeural || 0) > 0 ||
      settings.vibrance > 0 ||
      settings.contrast !== 0 ||
      settings.brightness !== 0 ||
      settings.warmth !== 0 ||
      (settings.enhancementClarity || 0) > 0 ||
      (settings.enhancementDetailSharp || 0) > 0 ||
      (settings.enhancementDenoise || 0) > 0 ||
      (settings.enhancementColorVibrance || 0) > 0 ||
      settings.enhancementAutoLevel ||
      (settings.upscaleFactor || 1) > 1;

    if (hasEnhancement) {
      applyAiHdrAndSharpen(ctx, width, height, settings);
    }

    // 3. AI Bloom Glow
    if (settings.bloomGlow > 0) {
      applyAiBloomGlow(ctx, width, height, settings.bloomGlow);
    }

    // 4. Neon streak / rays if enabled
    if (settings.neonGlowRays) {
      drawNeonRays(ctx, width, height, settings.neonColor || '#ff007f');
    }

    // 5. Vignette (Focus for FB algorithm)
    if (settings.vignette > 0) {
      applyVignette(ctx, width, height, settings.vignette);
    }

    // 6. Draw all active Multi-Logos
    for (const logo of logos) {
      if (logo.enabled && logo.url) {
        await renderLogo(ctx, width, height, logo, logoImgCache);
      }
    }

    // 7. Draw Viral Hook Typography & Brush Banners (3D Top "BFF" + Bottom "Penasaran" + "Ytta")
    if (settings.viralHook && settings.viralHook.enabled) {
      renderViralHook(ctx, width, height, settings.viralHook);
    }

    // 8. Output result
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Gagal mengekspor gambar'));
            return;
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          resolve({ blob, dataUrl, width, height });
        },
        'image/jpeg',
        0.95
      );
    });
  } finally {
    if (isCreatedUrl) {
      URL.revokeObjectURL(sourceUrl);
    }
  }
}
