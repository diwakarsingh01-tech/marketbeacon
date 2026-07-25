import React, { forwardRef } from 'react';

/**
 * Unified Card Component
 * Replaces all custom card implementations across the app
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', hover = false, className = '', children, style, ...props }, ref) => {
    const getPadding = (p: string) => {
      const map: Record<string, string> = { none: '0', sm: '0.5rem', md: '1.5rem', lg: '2rem', xl: '3rem' };
      return map[p] || '1.5rem';
    };

    const baseStyles: React.CSSProperties = {
      backgroundColor: '#ffffff',
      borderRadius: '1rem',
      padding: getPadding(padding),
      transition: 'all 0.2s ease',
      border: '1px solid #e2e8f0',
    };

    if (variant === 'glass') {
      Object.assign(baseStyles, {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
      });
    }
    if (variant === 'elevated') {
      Object.assign(baseStyles, {
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      });
    }

    const hoverStyles: React.CSSProperties = (variant === 'interactive' || hover) ? {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      borderColor: '#cbd5e1',
    } : {};

    return (
      <div
        ref={ref}
        className={`card ${className}`}
        style={{ ...baseStyles, ...hoverStyles, ...style }}
        onMouseEnter={(variant === 'interactive' || hover) ? () => {} : undefined}
        onMouseLeave={(variant === 'interactive' || hover) ? () => {} : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, loading = false, leftIcon, rightIcon, className = '', disabled, children, style, ...props }, ref) => {
    const sizeStyles = {
      sm: { padding: '0.5rem 1rem', fontSize: '0.75rem' },
      md: { padding: '0.75rem 1.25rem', fontSize: '0.75rem' },
      lg: { padding: '1rem 1.5rem', fontSize: '0.875rem' },
    };

    const variantStyles = {
      primary: {
        backgroundColor: '#00d09c',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgb(0 208 156 / 0.2), 0 4px 6px -4px rgb(0 208 156 / 0.1)',
        border: 'none',
      },
      secondary: {
        backgroundColor: '#f1f5f9',
        color: '#0f172a',
        border: '1px solid #cbd5e1',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#64748b',
        border: 'none',
      },
      danger: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgb(239 68 68 / 0.2), 0 4px 6px -4px rgb(239 68 68 / 0.1)',
        border: 'none',
      },
      link: {
        backgroundColor: 'transparent',
        color: '#00d09c',
        textDecoration: 'underline',
        border: 'none',
        padding: '0.25rem 0.5rem',
      },
    };

    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontWeight: 700,
      textTransform: (variant === 'primary' || variant === 'danger') ? 'uppercase' : 'none',
      letterSpacing: (variant === 'primary' || variant === 'danger') ? '0.05em' : '0',
      borderRadius: '0.75rem',
      transition: 'all 0.2s ease',
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    };

    const sizeConfig = sizeStyles[size];
    const variantConfig = variantStyles[variant];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={className}
        style={{ ...baseStyles, ...sizeConfig, ...variantConfig, ...style }}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : leftIcon ? (
          <span style={{ display: 'flex' }}>{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !loading && <span style={{ display: 'flex' }}>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// BADGE COMPONENT
// ============================================================================

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'brand';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className = '', children, style, ...props }, ref) => {
    const sizeStyles = {
      sm: { padding: '0.125rem 0.5rem', fontSize: '0.625rem' },
      md: { padding: '0.25rem 0.75rem', fontSize: '0.75rem' },
    };

    const variantStyles = {
      default: {
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        border: '1px solid #e2e8f0',
      },
      success: {
        backgroundColor: '#00d09c1a',
        color: '#00d09c',
        border: 'none',
      },
      warning: {
        backgroundColor: '#f59e0b1a',
        color: '#f59e0b',
        border: 'none',
      },
      danger: {
        backgroundColor: '#ef44441a',
        color: '#ef4444',
        border: 'none',
      },
      info: {
        backgroundColor: '#3b82f61a',
        color: '#3b82f6',
        border: 'none',
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#64748b',
        border: '1px solid #cbd5e1',
      },
      brand: {
        backgroundColor: '#00d09c1a',
        color: '#00d09c',
        border: '1px solid #00d09c33',
      },
    };

    const sizeConfig = sizeStyles[size];
    const variantConfig = variantStyles[variant];

    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '9999px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontSize: '0.75rem',
      padding: '0.25rem 0.75rem',
      border: '1px solid transparent',
    };

    return (
      <span
        ref={ref}
        className={className}
        style={{
          ...baseStyles,
          ...sizeConfig,
          ...variantConfig,
          ...style,
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// ============================================================================
// TABLE HEADER COMPONENT
// ============================================================================

export interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  sortable?: boolean;
  sortKey?: string;
  currentSort?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
}

const TableHeader = forwardRef<HTMLTableHeaderCellElement, TableHeaderProps>(
  ({ sortable = false, sortKey, currentSort, onSort, children, className = '', style, ...props }, ref) => {
    const isActive = sortable && currentSort?.key === sortKey;
    const direction = isActive && currentSort ? currentSort.direction : 'asc';

    const handleClick = () => {
      if (sortable && onSort && sortKey) {
        onSort(sortKey);
      }
    };

    return (
      <th
        ref={ref}
        onClick={sortable ? handleClick : undefined}
        style={{
          padding: '0.75rem 1rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f1f5f9',
          cursor: sortable ? 'pointer' : 'default',
          userSelect: 'none',
          ...style,
        }}
        className={className}
        {...props}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          {children}
          {sortable && (
            <span style={{ display: 'inline-flex', marginLeft: '0.25rem' }}>
              {isActive ? (
                direction === 'asc' ? '▲' : '▼'
              ) : (
                <span style={{ opacity: 0.3 }}>⇅</span>
              )}
            </span>
          )}
        </div>
      </th>
    );
  }
);

TableHeader.displayName = 'TableHeader';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  variant?: 'default' | 'positive' | 'negative' | 'highlight' | 'mono' | 'center' | 'right';
  align?: 'left' | 'center' | 'right';
}

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ variant = 'default', align = 'left', children, className = '', style, ...props }, ref) => {
    const variantStyles = {
      default: { color: '#0f172a', fontWeight: 500 },
      positive: { color: '#00d09c', fontWeight: 700 },
      negative: { color: '#ef4444', fontWeight: 700 },
      highlight: { backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600 },
      mono: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' },
      center: { textAlign: 'center' as const },
      right: { textAlign: 'right' as const },
    };

    const baseStyles: React.CSSProperties = {
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#0f172a',
      borderBottom: '1px solid #e2e8f0',
      textAlign: align as React.CSSProperties['textAlign'],
    };

    const variantConfig = variantStyles[variant] || {};

    return (
      <td
        ref={ref}
        style={{ ...baseStyles, ...variantConfig, ...style }}
        className={className}
        {...props}
      >
        {children}
      </td>
    );
  }
);

TableCell.displayName = 'TableCell';

// ============================================================================
// EXPORTS
// ============================================================================

export { Card, Button, Badge, TableHeader, TableCell };