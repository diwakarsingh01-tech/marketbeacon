import { describe, it, expect } from 'vitest';

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'Too short' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Missing uppercase' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Missing lowercase' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Missing number' };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { valid: false, message: 'Missing special char' };
  return { valid: true, message: 'Strong password' };
}

function hasSQLInjectionRisk(input: string): boolean {
  const patterns = /('|--|;|\bOR\b|\bAND\b|\bUNION\b|\bDROP\b|\bDELETE\b|\bINSERT\b|\bSELECT\b\s+\*)/i;
  return patterns.test(input);
}

describe('Security Validators', () => {
  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should escape HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle safe input', () => {
      expect(sanitizeInput('hello world')).toBe('hello world');
    });

    it('should escape quotes', () => {
      expect(sanitizeInput("it's a test")).toBe('it&#x27;s a test');
    });
  });

  describe('Password Strength', () => {
    it('should reject short passwords', () => {
      expect(validatePasswordStrength('Ab1!').valid).toBe(false);
    });

    it('should reject missing uppercase', () => {
      expect(validatePasswordStrength('abcdef1!@').valid).toBe(false);
    });

    it('should reject missing number', () => {
      expect(validatePasswordStrength('Abcdefgh!@').valid).toBe(false);
    });

    it('should accept strong passwords', () => {
      expect(validatePasswordStrength('StrongP@ss1').valid).toBe(true);
    });
  });

  describe('SQL Injection Detection', () => {
    it('should detect basic SQL injection', () => {
      expect(hasSQLInjectionRisk("' OR '1'='1")).toBe(true);
      expect(hasSQLInjectionRisk('; DROP TABLE users')).toBe(true);
    });

    it('should pass safe input', () => {
      expect(hasSQLInjectionRisk('hello world')).toBe(false);
      expect(hasSQLInjectionRisk('user@example.com')).toBe(false);
    });
  });
});
