import { LogoItem } from '../types';

export interface LogoTemplatePreset {
  id: string;
  category: 'asupan' | 'breaking-news' | 'verified' | 'custom';
  name: string;
  defaultPosition: 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right' | 'top-center' | 'bottom-center';
  defaultScale: number;
  dataUrl: string;
  description: string;
  glowColor?: string;
}

// 1. Asupan & Videy Slanted 3D Cyber Badges
export function createAsupanBadgeDataUrl(
  text1 = 'ASUPAN',
  text2 = 'VIRAL HARI INI',
  color1 = '#ff007f',
  color2 = '#00f0ff',
  icon: 'play' | 'flame' | 'star' | 'zap' = 'play'
): string {
  const isLongText2 = text2.length > 14;
  const fontSize2 = isLongText2 ? 26 : 34;
  const width = Math.max(340, Math.round(text2.length * 19 + 80));

  let iconSvg = '<polygon points="78,40 106,55 78,70" fill="#ffffff" />';
  if (icon === 'flame') {
    iconSvg = '<path d="M 90 35 Q 105 50 95 65 Q 90 75 75 68 Q 65 58 75 48 Q 85 45 90 35 Z" fill="#ffaa00" />';
  } else if (icon === 'zap') {
    iconSvg = '<polygon points="90,32 75,54 88,54 82,74 102,48 89,48" fill="#ffea00" />';
  } else if (icon === 'star') {
    iconSvg = '<polygon points="88,35 93,48 107,48 96,57 100,70 88,62 76,70 80,57 69,48 83,48" fill="#ffd700" />';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 175" width="${width}" height="175">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
      <linearGradient id="gradText" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
      <filter id="glowBadge" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="${color1}" flood-opacity="0.6"/>
      </filter>
    </defs>
    
    <g filter="url(#glowBadge)">
      <!-- Circle Icon Badge -->
      <circle cx="88" cy="55" r="36" fill="#090d16" stroke="${color1}" stroke-width="5"/>
      ${iconSvg}
      
      <!-- Slanted Badge Background -->
      <path d="M 30 75 L ${width - 25} 55 L ${width - 35} 145 L 20 165 Z" fill="#070a13" stroke="url(#grad1)" stroke-width="4" />
      
      <!-- Highlight Accent line inside -->
      <path d="M 45 85 L ${width - 45} 67" stroke="${color2}" stroke-width="2" stroke-opacity="0.7"/>

      <!-- Text 1 (Top line) -->
      <text x="${width / 2}" y="105" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-style="italic" font-size="30" fill="#ffffff" text-anchor="middle" letter-spacing="2">
        ${text1.toUpperCase()}
      </text>
      
      <!-- Text 2 (Bottom line with punchy color) -->
      <text x="${width / 2}" y="145" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-style="italic" font-size="${fontSize2}" fill="url(#gradText)" text-anchor="middle" letter-spacing="1.5">
        ${text2.toUpperCase()}
      </text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 2. Breaking News Variasi Beragam
export function createBreakingNewsBadgeDataUrl(
  title = 'BREAKING NEWS',
  variant: 'classic-red' | 'amber-caution' | 'crimson-pulse' | 'blue-broadcast' | 'emerald-flash' | 'golden-dark' | 'neon-magenta' | 'yellow-danger' = 'classic-red'
): string {
  const isLong = title.length > 16;
  const fontSize = isLong ? 20 : 25;
  const width = Math.max(370, Math.round(title.length * 15 + 130));

  let bgColor1 = '#0f172a';
  let bgColor2 = '#dc2626';
  let tagColor = '#dc2626';
  let strokeColor = '#f87171';
  let pulseColor = '#22c55e';
  let iconType = 'globe';

  if (variant === 'amber-caution' || variant === 'yellow-danger') {
    bgColor2 = '#d97706';
    tagColor = '#f59e0b';
    strokeColor = '#fbbf24';
    pulseColor = '#ef4444';
    iconType = 'alert';
  } else if (variant === 'crimson-pulse') {
    bgColor2 = '#991b1b';
    tagColor = '#ef4444';
    strokeColor = '#f87171';
    pulseColor = '#ef4444';
    iconType = 'pulse';
  } else if (variant === 'blue-broadcast') {
    bgColor2 = '#1d4ed8';
    tagColor = '#3b82f6';
    strokeColor = '#60a5fa';
    pulseColor = '#38bdf8';
    iconType = 'broadcast';
  } else if (variant === 'emerald-flash') {
    bgColor2 = '#047857';
    tagColor = '#10b981';
    strokeColor = '#34d399';
    pulseColor = '#6ee7b7';
    iconType = 'flash';
  } else if (variant === 'golden-dark') {
    bgColor2 = '#78350f';
    tagColor = '#d97706';
    strokeColor = '#fde047';
    pulseColor = '#facc15';
    iconType = 'star';
  } else if (variant === 'neon-magenta') {
    bgColor2 = '#831843';
    tagColor = '#ec4899';
    strokeColor = '#f472b6';
    pulseColor = '#06b6d4';
    iconType = 'globe';
  }

  let iconSvg = `
    <circle cx="34" cy="35" r="14" fill="#ffffff" fill-opacity="0.2" stroke="#ffffff" stroke-width="2"/>
    <ellipse cx="34" cy="35" rx="7" ry="14" fill="none" stroke="#ffffff" stroke-width="1.5"/>
    <line x1="20" y1="35" x2="48" y2="35" stroke="#ffffff" stroke-width="1.5"/>
  `;

  if (iconType === 'alert') {
    iconSvg = `
      <polygon points="34,20 48,47 20,47" fill="#111827" stroke="#ffffff" stroke-width="2"/>
      <line x1="34" y1="28" x2="34" y2="38" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      <circle cx="34" cy="43" r="1.5" fill="#ffffff" />
    `;
  } else if (iconType === 'pulse') {
    iconSvg = `
      <circle cx="34" cy="35" r="15" fill="#ef4444" fill-opacity="0.4"/>
      <circle cx="34" cy="35" r="9" fill="#ffffff"/>
      <circle cx="34" cy="35" r="5" fill="#ef4444"/>
    `;
  } else if (iconType === 'broadcast') {
    iconSvg = `
      <circle cx="34" cy="38" r="4" fill="#ffffff"/>
      <path d="M 26 31 A 12 12 0 0 1 42 31" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 21 26 A 18 18 0 0 1 47 26" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    `;
  } else if (iconType === 'flash') {
    iconSvg = `
      <polygon points="36,20 25,35 34,35 32,50 43,33 34,33" fill="#ffffff" />
    `;
  } else if (iconType === 'star') {
    iconSvg = `
      <polygon points="34,22 37,30 46,30 39,36 41,45 34,39 27,45 29,36 22,30 31,30" fill="#ffffff" />
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 70" width="${width}" height="70">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${bgColor1}" />
        <stop offset="60%" stop-color="#111827" />
        <stop offset="100%" stop-color="${bgColor2}" />
      </linearGradient>
      <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.8"/>
      </filter>
    </defs>
    
    <g filter="url(#shadowFilter)">
      <!-- Main Bar Box -->
      <rect x="4" y="5" width="${width - 8}" height="60" rx="8" fill="url(#bgGrad)" stroke="${strokeColor}" stroke-width="2" />
      
      <!-- Red / Colored Accent Left Tag -->
      <path d="M 4 5 L 68 5 L 54 65 L 4 65 Z" fill="${tagColor}" />
      
      <!-- Icon -->
      ${iconSvg}
      
      <!-- Text Title -->
      <text x="80" y="44" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="${fontSize}" fill="#ffffff" letter-spacing="1.5">
        ${title.toUpperCase()}
      </text>
      
      <!-- Live Indicator Beacon Light -->
      <circle cx="${width - 24}" cy="35" r="7" fill="${pulseColor}" />
      <circle cx="${width - 24}" cy="35" r="12" fill="${pulseColor}" fill-opacity="0.3" />
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 3. Verified Creator & Badge Pills
export function createVerifiedBadgeDataUrl(channelName = 'VIRAL MEDIA', color = '#3b82f6', icon: 'check' | 'star' | 'shield' = 'check'): string {
  const width = Math.max(280, Math.round(channelName.length * 13 + 90));
  
  let iconSvg = '<path d="M 28 30 L 33 35 L 44 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />';
  if (icon === 'star') {
    iconSvg = '<polygon points="36,20 38,27 45,27 39,32 41,39 36,34 31,39 33,32 27,27 34,27" fill="#ffffff" />';
  } else if (icon === 'shield') {
    iconSvg = '<path d="M 36 21 L 45 25 L 45 34 C 45 40 36 45 36 45 C 36 45 27 40 27 34 L 27 25 Z" fill="#ffffff" />';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 60" width="${width}" height="60">
    <defs>
      <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.8"/>
      </filter>
    </defs>
    
    <g filter="url(#badgeShadow)">
      <!-- Dark Glass Pill -->
      <rect x="4" y="5" width="${width - 8}" height="50" rx="25" fill="#080c14" fill-opacity="0.92" stroke="${color}" stroke-width="2.5" />
      
      <!-- Checkmark/Icon Circle -->
      <circle cx="36" cy="30" r="16" fill="${color}" />
      ${iconSvg}
      
      <!-- Text -->
      <text x="64" y="37" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="18" fill="#ffffff" letter-spacing="1">
        ${channelName.toUpperCase()}
      </text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// COMPLETE PRESET CATALOG
export const LOGO_TEMPLATE_PRESETS: LogoTemplatePreset[] = [
  // --- Asupan & Videy Variations ---
  {
    id: 'asupan-viral-hari-ini',
    category: 'asupan',
    name: 'Asupan Viral Hari Ini',
    defaultPosition: 'top-left',
    defaultScale: 25,
    dataUrl: createAsupanBadgeDataUrl('ASUPAN', 'VIRAL HARI INI', '#ec4899', '#06b6d4', 'flame'),
    description: 'Neon Pink & Cyan Flame Slanted Badge (Paling Viral di FB)',
    glowColor: '#ec4899',
  },
  {
    id: 'asupan-videy',
    category: 'asupan',
    name: 'Asupan Videy',
    defaultPosition: 'top-left',
    defaultScale: 24,
    dataUrl: createAsupanBadgeDataUrl('ASUPAN', 'VIDEY', '#ec4899', '#eab308', 'play'),
    description: 'Hot Magenta & Gold Cyber Play Badge',
    glowColor: '#ec4899',
  },
  {
    id: 'asupan-viral',
    category: 'asupan',
    name: 'Asupan Viral',
    defaultPosition: 'top-left',
    defaultScale: 23,
    dataUrl: createAsupanBadgeDataUrl('ASUPAN', 'VIRAL', '#f97316', '#a855f7', 'zap'),
    description: 'Flame Orange & Purple Lightning Badge',
    glowColor: '#f97316',
  },
  {
    id: 'videy-hari-ini',
    category: 'asupan',
    name: 'Videy Hari Ini',
    defaultPosition: 'top-left',
    defaultScale: 24,
    dataUrl: createAsupanBadgeDataUrl('VIDEY', 'HARI INI', '#06b6d4', '#10b981', 'play'),
    description: 'Electric Cyan & Emerald Green Badge',
    glowColor: '#06b6d4',
  },
  {
    id: 'asupan-hiburan-viral',
    category: 'asupan',
    name: 'Asupan Hiburan Viral',
    defaultPosition: 'top-left',
    defaultScale: 26,
    dataUrl: createAsupanBadgeDataUrl('ASUPAN', 'HIBURAN VIRAL', '#8b5cf6', '#fbbf24', 'star'),
    description: 'Royal Purple & Golden Star Entertainment Badge',
    glowColor: '#8b5cf6',
  },
  {
    id: 'dunia-asupan-viral',
    category: 'asupan',
    name: 'Dunia Asupan Viral',
    defaultPosition: 'top-left',
    defaultScale: 25,
    dataUrl: createAsupanBadgeDataUrl('DUNIA', 'ASUPAN VIRAL', '#ef4444', '#38bdf8', 'flame'),
    description: 'Crimson Red & Sky Blue High Contrast Badge',
    glowColor: '#ef4444',
  },
  {
    id: 'videy-viral-fyp',
    category: 'asupan',
    name: 'Videy Viral FYP',
    defaultPosition: 'top-left',
    defaultScale: 24,
    dataUrl: createAsupanBadgeDataUrl('VIDEY', 'VIRAL FYP', '#ec4899', '#3b82f6', 'zap'),
    description: 'TikTok / FB Reels Trending Gradient Badge',
    glowColor: '#ec4899',
  },

  // --- Breaking News Variations (Banyak Pilihan) ---
  {
    id: 'breaking-news-classic',
    category: 'breaking-news',
    name: 'BREAKING NEWS (Merah Klasik)',
    defaultPosition: 'bottom-left',
    defaultScale: 32,
    dataUrl: createBreakingNewsBadgeDataUrl('BREAKING NEWS', 'classic-red'),
    description: 'Red TV Broadcast Ticker dengan Live Green Beacon',
    glowColor: '#ef4444',
  },
  {
    id: 'breaking-news-viral',
    category: 'breaking-news',
    name: 'BREAKING NEWS VIRAL',
    defaultPosition: 'bottom-left',
    defaultScale: 33,
    dataUrl: createBreakingNewsBadgeDataUrl('BREAKING NEWS VIRAL', 'crimson-pulse'),
    description: 'Crimson Red Ticker dengan Pulsing Alert Indicator',
    glowColor: '#ef4444',
  },
  {
    id: 'berita-viral-terkini',
    category: 'breaking-news',
    name: 'BERITA VIRAL TERKINI',
    defaultPosition: 'bottom-left',
    defaultScale: 34,
    dataUrl: createBreakingNewsBadgeDataUrl('BERITA VIRAL TERKINI', 'classic-red'),
    description: 'Banner Berita Hangat Terkini Indonesia',
    glowColor: '#ef4444',
  },
  {
    id: 'info-viral-hari-ini',
    category: 'breaking-news',
    name: 'INFO VIRAL HARI INI',
    defaultPosition: 'bottom-left',
    defaultScale: 34,
    dataUrl: createBreakingNewsBadgeDataUrl('INFO VIRAL HARI INI', 'amber-caution'),
    description: 'Amber Caution Yellow & Carbon Warning Ticker',
    glowColor: '#f59e0b',
  },
  {
    id: 'headline-viral-indo',
    category: 'breaking-news',
    name: 'HEADLINE VIRAL INDO',
    defaultPosition: 'bottom-left',
    defaultScale: 33,
    dataUrl: createBreakingNewsBadgeDataUrl('HEADLINE VIRAL INDO', 'blue-broadcast'),
    description: 'Electric Blue & White Broadcast Pill',
    glowColor: '#3b82f6',
  },
  {
    id: 'update-terbaru',
    category: 'breaking-news',
    name: 'UPDATE TERBARU HARI INI',
    defaultPosition: 'bottom-left',
    defaultScale: 34,
    dataUrl: createBreakingNewsBadgeDataUrl('UPDATE TERBARU HARI INI', 'emerald-flash'),
    description: 'Emerald Green & White Flash Ticker',
    glowColor: '#10b981',
  },
  {
    id: 'kabar-heboh-netizen',
    category: 'breaking-news',
    name: 'KABAR HEBOH NETIZEN',
    defaultPosition: 'bottom-left',
    defaultScale: 34,
    dataUrl: createBreakingNewsBadgeDataUrl('KABAR HEBOH NETIZEN', 'neon-magenta'),
    description: 'Neon Magenta & Cyan Border Pill High Engagement',
    glowColor: '#ec4899',
  },
  {
    id: 'fakta-viral-terbaru',
    category: 'breaking-news',
    name: 'FAKTA VIRAL TERBARU',
    defaultPosition: 'bottom-left',
    defaultScale: 34,
    dataUrl: createBreakingNewsBadgeDataUrl('FAKTA VIRAL TERBARU', 'golden-dark'),
    description: 'Dark Amber & Gold Broadcast Banner',
    glowColor: '#f59e0b',
  },
  {
    id: 'hot-news-viral',
    category: 'breaking-news',
    name: 'HOT NEWS VIRAL',
    defaultPosition: 'bottom-left',
    defaultScale: 32,
    dataUrl: createBreakingNewsBadgeDataUrl('HOT NEWS VIRAL', 'crimson-pulse'),
    description: 'Red Hot News Alert Ticker',
    glowColor: '#ef4444',
  },
  {
    id: 'viral-banget-hari-ini',
    category: 'breaking-news',
    name: 'VIRAL BANGET HARI INI',
    defaultPosition: 'bottom-left',
    defaultScale: 34,
    dataUrl: createBreakingNewsBadgeDataUrl('VIRAL BANGET HARI INI', 'yellow-danger'),
    description: 'Yellow Alert High-Impact Ticker',
    glowColor: '#eab308',
  },

  // --- Verified Badges ---
  {
    id: 'verified-fb-official',
    category: 'verified',
    name: 'FB VIRAL OFFICIAL',
    defaultPosition: 'top-right',
    defaultScale: 25,
    dataUrl: createVerifiedBadgeDataUrl('FB VIRAL OFFICIAL', '#3b82f6', 'check'),
    description: 'Centang Biru Verified FB Creator',
    glowColor: '#3b82f6',
  },
  {
    id: 'verified-asupan-official',
    category: 'verified',
    name: 'ASUPAN OFFICIAL',
    defaultPosition: 'top-right',
    defaultScale: 25,
    dataUrl: createVerifiedBadgeDataUrl('ASUPAN OFFICIAL', '#ec4899', 'check'),
    description: 'Centang Pink Asupan Channel Official',
    glowColor: '#ec4899',
  },
  {
    id: 'verified-videy-official',
    category: 'verified',
    name: 'VIDEY OFFICIAL',
    defaultPosition: 'top-right',
    defaultScale: 24,
    dataUrl: createVerifiedBadgeDataUrl('VIDEY OFFICIAL', '#06b6d4', 'check'),
    description: 'Cyan Verified Badge Videy Official',
    glowColor: '#06b6d4',
  },
  {
    id: 'verified-konten-kreator',
    category: 'verified',
    name: 'KONTEN KREATOR INDO',
    defaultPosition: 'top-right',
    defaultScale: 26,
    dataUrl: createVerifiedBadgeDataUrl('KONTEN KREATOR INDO', '#f59e0b', 'star'),
    description: 'Bintang Emas Konten Kreator Indonesia',
    glowColor: '#f59e0b',
  },
];

// Initial 3-Logo Setup (Brand + Breaking News + Verified Check)
export const INITIAL_LOGOS: LogoItem[] = [
  {
    id: 'logo-1',
    name: 'Logo 1: Asupan Viral Hari Ini (Kiri Atas)',
    url: createAsupanBadgeDataUrl('ASUPAN', 'VIRAL HARI INI', '#ec4899', '#06b6d4', 'flame'),
    enabled: false,
    position: 'top-left',
    scalePercent: 24,
    opacity: 0.95,
    marginPercent: 4,
    dropShadow: true,
    glowEffect: true,
    glowColor: '#ec4899',
  },
  {
    id: 'logo-2',
    name: 'Logo 2: Breaking News Ticker (Kiri Bawah)',
    url: createBreakingNewsBadgeDataUrl('BREAKING NEWS', 'classic-red'),
    enabled: false,
    position: 'bottom-left',
    scalePercent: 32,
    opacity: 0.95,
    marginPercent: 4,
    dropShadow: true,
    glowEffect: false,
    glowColor: '#ef4444',
  },
  {
    id: 'logo-3',
    name: 'Logo 3: Verified Creator Badge (Kanan Atas)',
    url: createVerifiedBadgeDataUrl('FB VIRAL OFFICIAL', '#3b82f6', 'check'),
    enabled: false,
    position: 'top-right',
    scalePercent: 25,
    opacity: 0.90,
    marginPercent: 4,
    dropShadow: true,
    glowEffect: false,
    glowColor: '#3b82f6',
  },
];

export const SAMPLE_IMAGE_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop';


