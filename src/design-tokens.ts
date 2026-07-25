/**
 * MarketBeacon Pro — Design Token System
 * Single source of truth for all visual design decisions.
 * Import from '@/design-tokens' (configured in tsconfig.json)
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Brand colors
  brand: {
    primary: '#00d09c',      // Emerald — primary actions, success states
    primaryHover: '#00bda0',
    primaryLight: '#00d09c1a',
    primaryBorder: '#00d09c33',
    secondary: '#3b82f6',    // Blue — secondary actions, info states
    secondaryHover: '#2563eb',
    secondaryLight: '#3b82f61a',
    accent: '#f59e0b',       // Amber — warnings, highlights
    accentHover: '#d97706',
    accentLight: '#f59e0b1a',
    danger: '#ef4444',       // Red — errors, destructive actions
    dangerHover: '#dc2626',
    dangerLight: '#ef44441a',
    purple: '#8b5cf6',       // Purple — premium/alpha features
    purpleHover: '#7c3aed',
  },

  // Semantic colors (map to brand for consistency)
  semantic: {
    success: '#00d09c',
    successHover: '#00bda0',
    successLight: '#00d09c1a',
    info: '#3b82f6',
    infoHover: '#2563eb',
    infoLight: '#3b82f61a',
    warning: '#f59e0b',
    warningHover: '#d97706',
    warningLight: '#f59e0b1a',
    danger: '#ef4444',
    dangerHover: '#dc2626',
    dangerLight: '#ef44441a',
  },

  // Background colors
  bg: {
    primary: '#f8fafc',      // slate-50
    secondary: '#f1f5f9',    // slate-100
    tertiary: '#e2e8f0',     // slate-200
    inverse: '#0f172a',      // slate-900
    card: '#ffffff',         // white
    overlay: 'rgba(15, 23, 42, 0.6)',
  },

  // Text colors
  text: {
    primary: '#0f172a',      // slate-900
    secondary: '#334155',    // slate-700
    tertiary: '#64748b',     // slate-500
    muted: '#94a3b8',        // slate-400
    inverse: '#f8fafc',      // on dark backgrounds
    link: '#00d09c',
    linkHover: '#00bda0',
  },

  // Border colors
  border: {
    primary: '#e2e8f0',      // slate-200
    secondary: '#cbd5e1',    // slate-300
    focus: '#00d09c',
    error: '#ef4444',
  },

  // Status colors (for badges, pills, indicators)
  status: {
    qualified: '#00d09c',
    qualifiedLight: '#00d09c1a',
    observation: '#3b82f6',
    observationLight: '#3b82f61a',
    rejected: '#ef4444',
    rejectedLight: '#ef44441a',
    pending: '#f59e0b',
    pendingLight: '#f59e0b1a',
    open: '#00d09c',
    closed: '#ef4444',
    watchlist: '#f59e0b',
    neutral: '#3b82f6',
  },

  // Level colors (ABCD tranche levels)
  level: {
    a: { main: '#3b82f6', light: '#3b82f61a', border: '#3b82f633' },
    b: { main: '#8b5cf6', light: '#8b5cf61a', border: '#8b5cf633' },
    c: { main: '#8b5cf6', light: '#8b5cf61a', border: '#8b5cf633' },
    d: { main: '#00d09c', light: '#00d09c1a', border: '#00d09c33' },
  },

  // Sector/category colors (for charts, badges)
  category: [
    '#00d09c', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
  ],
};

// ============================================================================
// SPACING SYSTEM (4px base unit)
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const typography = {
  // Font families
  fontFamily: {
    sans: 'Outfit, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Font sizes (mobile-first, responsive via Tailwind)
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],        // 12px — captions, labels
    sm: ['0.875rem', { lineHeight: '1.25rem' }],    // 14px — body small
    base: ['1rem', { lineHeight: '1.5rem' }],       // 16px — body
    lg: ['1.125rem', { lineHeight: '1.75rem' }],    // 18px — body large
    xl: ['1.25rem', { lineHeight: '1.75rem' }],     // 20px — subheadings
    '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px — headings
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px — large headings
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px — display
    '5xl': ['3rem', { lineHeight: '1' }],           // 48px — hero
  },

  // Line heights
  lineHeight: {
    tight: '1.1',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',      // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
  card: '0.75rem',    // standard card radius
  button: '0.75rem',  // standard button radius
  input: '0.75rem',   // standard input radius
  badge: '9999px',    // pill badges
};

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Colored shadows for brand elements
  brand: '0 10px 25px -5px rgb(0 208 156 / 0.2), 0 4px 6px -4px rgb(0 208 156 / 0.1)',
  brandHover: '0 20px 25px -5px rgb(0 208 156 / 0.3), 0 8px 10px -6px rgb(0 208 156 / 0.15)',
  danger: '0 10px 25px -5px rgb(239 68 68 / 0.2), 0 4px 6px -4px rgb(239 68 68 / 0.1)',
  blue: '0 10px 25px -5px rgb(59 130 246 / 0.2), 0 4px 6px -4px rgb(59 130 246 / 0.1)',
  amber: '0 10px 25px -5px rgb(245 158 11 / 0.2), 0 4px 6px -4px rgb(245 158 11 / 0.1)',
  
  // Focus rings
  focus: '0 0 0 3px rgb(0 208 156 / 0.4)',
  focusBlue: '0 0 0 3px rgb(59 130 246 / 0.4)',
  focusRed: '0 0 0 3px rgb(239 68 68 / 0.4)',
};

// ============================================================================
// TRANSITIONS & ANIMATIONS
// ============================================================================

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  slower: '500ms ease',
  
  // Spring animations (for framer-motion)
  spring: { type: 'spring', stiffness: 500, damping: 30 },
  springGentle: { type: 'spring', stiffness: 300, damping: 25 },
  springBouncy: { type: 'spring', stiffness: 500, damping: 20 },
  
  // Standard easing
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
};

// ============================================================================
// BREAKPOINTS (matching Tailwind)
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const components = {
  // Card variants
  card: {
    default: {
      bg: 'bg.card',
      border: 'border.border.primary',
      radius: 'card',
      shadow: 'sm',
      padding: spacing[6],
    },
    elevated: {
      bg: 'bg.card',
      border: 'border.border.primary',
      radius: 'card',
      shadow: 'lg',
      padding: spacing[6],
    },
    interactive: {
      bg: 'bg.card',
      border: 'border.border.primary',
      radius: 'card',
      shadow: 'sm',
      padding: spacing[6],
      hover: {
        shadow: 'lg',
        borderColor: 'border.secondary',
        transform: 'translateY(-2px)',
      },
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.8)',
      border: 'border.border.primary',
      radius: 'card',
      shadow: 'md',
      padding: spacing[6],
      backdrop: 'blur-sm',
    },
  },

  // Button variants
  button: {
    primary: {
      bg: 'brand.primary',
      color: 'text.inverse',
      hover: 'brand.hover',
      active: 'brand.primary',
      shadow: 'brand',
      radius: 'button',
      padding: `${spacing[3]} ${spacing[5]}`,
      fontSize: 'xs',
      fontWeight: 'extrabold',
      textTransform: 'uppercase',
      letterSpacing: 'wider',
    },
    secondary: {
      bg: 'bg.secondary',
      color: 'text.primary',
      hover: 'bg.tertiary',
      border: 'border.secondary',
      radius: 'button',
      padding: `${spacing[3]} ${spacing[5]}`,
      fontSize: 'xs',
      fontWeight: 'bold',
    },
    ghost: {
      bg: 'transparent',
      color: 'text.secondary',
      hover: 'bg.secondary',
      radius: 'button',
      padding: `${spacing[2]} ${spacing[4]}`,
      fontSize: 'sm',
      fontWeight: 'semibold',
    },
    danger: {
      bg: 'semantic.danger',
      color: 'text.inverse',
      hover: 'semantic.dangerHover',
      shadow: 'danger',
      radius: 'button',
      padding: `${spacing[3]} ${spacing[5]}`,
      fontSize: 'xs',
      fontWeight: 'extrabold',
      textTransform: 'uppercase',
    },
    link: {
      bg: 'transparent',
      color: 'text.link',
      hover: 'text.linkHover',
      underline: 'hover',
      padding: `${spacing[1]} ${spacing[2]}`,
      fontSize: 'sm',
      fontWeight: 'bold',
    },
  },

  // Badge variants
  badge: {
    default: {
      bg: 'bg.secondary',
      color: 'text.secondary',
      border: 'border.primary',
      radius: 'badge',
      padding: `${spacing[1]} ${spacing[3]}`,
      fontSize: 'xs',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 'wider',
    },
    success: {
      bg: 'status.qualifiedLight',
      color: 'status.qualified',
      border: 'none',
    },
    warning: {
      bg: 'status.pendingLight',
      color: 'status.pending',
      border: 'none',
    },
    danger: {
      bg: 'status.rejectedLight',
      color: 'status.rejected',
      border: 'none',
    },
    info: {
      bg: 'semantic.infoLight',
      color: 'semantic.info',
      border: 'none',
    },
    outline: {
      bg: 'transparent',
      color: 'text.tertiary',
      border: 'border.secondary',
    },
    brand: {
      bg: 'brand.primaryLight',
      color: 'brand.primary',
      border: 'brand.primaryBorder',
    },
  },

  // Table cell variants
  tableCell: {
    default: {
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: 'sm',
      fontWeight: 'normal',
      color: 'text.primary',
      borderBottom: '1px solid border.primary',
    },
    header: {
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: 'xs',
      fontWeight: 'bold',
      color: 'text.tertiary',
      textTransform: 'uppercase',
      letterSpacing: 'wider',
      borderBottom: '1px solid border.primary',
      bg: 'bg.secondary',
    },
    highlighted: {
      bg: 'brand.primaryLight',
    },
    positive: {
      color: 'status.qualified',
      fontWeight: 'bold',
    },
    negative: {
      color: 'status.rejected',
      fontWeight: 'bold',
    },
    highlight: {
      bg: 'status.pendingLight',
    },
  },

  // Input variants
  input: {
    default: {
      bg: 'bg.card',
      border: 'border.primary',
      color: 'text.primary',
      placeholder: 'text.muted',
      radius: 'input',
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: 'sm',
      focus: {
        border: 'border.focus',
        shadow: 'focus',
        bg: 'bg.card',
      },
      error: {
        border: 'border.error',
        shadow: 'focusRed',
      },
    },
  },

  // Modal variants
  modal: {
    overlay: {
      bg: 'bg.overlay',
      backdrop: 'blur-md',
    },
    content: {
      bg: 'bg.card',
      border: 'border.primary',
      radius: '3xl',
      shadow: '2xl',
      maxWidth: '40rem',
      padding: spacing[8],
    },
    header: {
      paddingBottom: spacing[4],
      marginBottom: spacing[4],
      borderBottom: '1px solid border.primary',
    },
    footer: {
      paddingTop: spacing[4],
      marginTop: spacing[4],
      borderTop: '1px solid border.primary',
      gap: spacing[3],
    },
  },

  // Tooltip
  tooltip: {
    bg: 'bg.inverse',
    color: 'text.inverse',
    radius: 'lg',
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: 'xs',
    shadow: 'lg',
    gap: spacing[1],
  },

  // Dropdown/Select
  dropdown: {
    bg: 'bg.card',
    border: 'border.primary',
    radius: 'xl',
    shadow: 'lg',
    padding: spacing[2],
    item: {
      padding: `${spacing[2]} ${spacing[3]}`,
      fontSize: 'sm',
      color: 'text.primary',
      radius: 'md',
      hover: 'bg.secondary',
      active: 'brand.primaryLight',
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color value by path (e.g., 'brand.primary', 'status.qualified')
 */
export function getColor(path: string): string {
  const keys = path.split('.');
  let value: any = colors;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return '';
  }
  return value;
}

/**
 * Get spacing value
 */
export function getSpacing(key: keyof typeof spacing): string {
  return spacing[key];
}

/**
 * Get shadow value
 */
export function getShadow(key: keyof typeof shadows): string {
  return shadows[key];
}

/**
 * Generate CSS custom properties for all tokens
 * Useful for injecting into :root
 */
export function generateCSSVariables(): string {
  const cssVars: string[] = [];
  
  // Colors
  Object.entries(flattenObject(colors)).forEach(([key, value]) => {
    cssVars.push(`--color-${key}: ${value};`);
  });
  
  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars.push(`--spacing-${key}: ${value};`);
  });
  
  // Border radius
  Object.entries(borderRadius).forEach(([key, value]) => {
    cssVars.push(`--radius-${key}: ${value};`);
  });
  
  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value};`);
  });
  
  // Transitions
  Object.entries(transitions).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVars.push(`--transition-${key}: ${value};`);
    }
  });
  
  // Z-index
  Object.entries(zIndex).forEach(([key, value]) => {
    cssVars.push(`--z-${key}: ${value};`);
  });
  
  return `:root {\n  ${cssVars.join('\n  ')}\n}`;
}

// Helper to flatten nested objects
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = String(value);
    }
  }
  return result;
}

export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  components,
  getColor,
  getSpacing,
  getShadow,
  generateCSSVariables,
};