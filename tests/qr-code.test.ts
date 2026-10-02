import { describe, it, expect } from 'vitest';
import { encodeQrSvg } from '../src/infrastructure/qr/qr-code';

describe('QR Code Generator', () => {
  it('generates a valid SVG string for a menu URL', () => {
    const svg = encodeQrSvg('http://localhost:3000/menu', 200);
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('<path d="M');
    expect(svg).toContain('</svg>');
  });

  it('handles longer URLs cleanly without throwing', () => {
    const longUrl = 'https://masa-restaurant.example.com/menu?branch=MAIN-01&table=T-05&utm_source=qr_table_tent';
    const svg = encodeQrSvg(longUrl, 300);
    expect(svg).toContain('<svg');
    expect(svg).toContain('width="300"');
    expect(svg).toContain('height="300"');
  });
});
