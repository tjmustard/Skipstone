import { describe, it, expect } from 'vitest';

/**
 * Calculates WCAG 2.1 relative luminance for a hex color.
 */
function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('WCAG AAA Color Contrast Verification', () => {
  const pairings = [
    {
      name: 'Root App: Slate 100 on Deep Navy',
      text: '#f8fafc',
      bg: '#090d16',
    },
    {
      name: 'Tier 1 (Warm Up): White text on Slate 900',
      text: '#ffffff',
      bg: '#0f172a',
    },
    {
      name: 'Tier 2 (Vulnerability): White text on Stone 900',
      text: '#ffffff',
      bg: '#1c1917',
    },
    {
      name: 'Tier 3 (Core Truths): White text on Zinc 900',
      text: '#ffffff',
      bg: '#18181b',
    },
    {
      name: 'Active Listener coaching: Slate 200 on Slate 950',
      text: '#e2e8f0',
      bg: '#020617',
    },
    {
      name: 'Active Listener badge: Emerald 400 on Slate 950',
      text: '#34d399',
      bg: '#020617',
    },
  ];

  pairings.forEach(({ name, text, bg }) => {
    it(`ensures ${name} meets or exceeds WCAG AAA standard (>= 7.0:1)`, () => {
      const ratio = getContrastRatio(text, bg);
      console.log(`Contrast for ${name}: ${ratio.toFixed(2)}:1`);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });
  });
});
