import React from 'react';

// Classic book color palettes — spine + cover pairs
const PALETTES = [
  { spine: '#1e3575', cover: '#2c4a8c', text: '#f0e6c8', accent: '#d4a853' },
  { spine: '#5a1f1f', cover: '#7b2d2d', text: '#fde8d8', accent: '#e8c97a' },
  { spine: '#1b4332', cover: '#2d6a4f', text: '#d8f3dc', accent: '#95d5b2' },
  { spine: '#3b1f5a', cover: '#5b2d8c', text: '#ede0ff', accent: '#c084fc' },
  { spine: '#7c2d12', cover: '#b45309', text: '#fef3c7', accent: '#fcd34d' },
  { spine: '#0f4c81', cover: '#1a73c8', text: '#dbeafe', accent: '#93c5fd' },
  { spine: '#1f3a47', cover: '#0f766e', text: '#ccfbf1', accent: '#5eead4' },
  { spine: '#4a1942', cover: '#7e1b79', text: '#fce7f3', accent: '#f9a8d4' },
  { spine: '#1c2951', cover: '#243b73', text: '#e8edff', accent: '#d4a853' },
  { spine: '#2d3748', cover: '#4a5568', text: '#f7fafc', accent: '#fbd38d' },
];

// Deterministic hash from string → palette index
function hashString(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % PALETTES.length;
}

// Truncate text to fit given width (rough estimate: ~6px per char)
function fitText(text, maxChars) {
  if (!text) return '';
  return text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
}

// Decorative ornament lines
function Ornament({ x, y, width, color }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x + width} y2={y} stroke={color} strokeWidth="0.8" opacity="0.5" />
      <rect x={x + width / 2 - 2} y={y - 1.5} width="4" height="3" rx="0.5" fill={color} opacity="0.6" />
      <line x1={x} y1={y + 4} x2={x + width} y2={y + 4} stroke={color} strokeWidth="0.5" opacity="0.3" />
    </g>
  );
}

export default function BookCover({ title = '', author = '', size = 'md', className = '' }) {
  const palette = PALETTES[hashString(title)];

  const sizes = {
    sm:  { w: 56,  h: 80,  spineW: 9,  titleSize: 6,   authorSize: 5,   titleMaxChars: 10 },
    md:  { w: 96,  h: 136, spineW: 14, titleSize: 9,   authorSize: 7,   titleMaxChars: 14 },
    lg:  { w: 140, h: 200, spineW: 20, titleSize: 12,  authorSize: 9,   titleMaxChars: 18 },
  };

  const { w, h, spineW, titleSize, authorSize, titleMaxChars } = sizes[size] || sizes.md;
  const coverX = spineW;
  const coverW = w - spineW;
  const cx = coverX + coverW / 2;

  // Split title into lines (max 2 lines)
  const words = (title || '').split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? cur + ' ' + word : word;
    if (test.length > Math.floor(titleMaxChars * 0.9) && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
    if (lines.length === 2) { cur = ''; break; }
  }
  if (cur) lines.push(cur);
  const titleLines = lines.slice(0, 2).map((l) => fitText(l, titleMaxChars));

  // Spine title — rotated, abbreviated
  const spineTitle = fitText(title, Math.floor(h / 7));

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={title}
    >
      {/* Drop shadow */}
      <defs>
        <filter id={`shadow-${title.slice(0,4)}`} x="-10%" y="-5%" width="130%" height="120%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Book body */}
      <g filter={`url(#shadow-${title.slice(0,4)})`}>
        {/* Spine */}
        <rect x="0" y="0" width={spineW} height={h} rx="2" fill={palette.spine} />
        {/* Cover */}
        <rect x={coverX} y="0" width={coverW} height={h} rx="1" fill={palette.cover} />
        {/* Page edges (right side) */}
        <rect x={coverX + coverW} y="2" width="2" height={h - 4} rx="1" fill="#e8dcc8" opacity="0.6" />
      </g>

      {/* Spine text (rotated) */}
      <text
        transform={`translate(${spineW / 2}, ${h - 8}) rotate(-90)`}
        textAnchor="start"
        fontSize={spineW * 0.55}
        fill={palette.accent}
        fontFamily="Georgia, serif"
        letterSpacing="0.5"
        opacity="0.85"
      >
        {spineTitle}
      </text>

      {/* Cover top ornament */}
      <Ornament x={coverX + 6} y={h * 0.12} width={coverW - 12} color={palette.accent} />

      {/* Cover title */}
      {titleLines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={h * 0.38 + i * (titleSize + 4)}
          textAnchor="middle"
          fontSize={titleSize}
          fontWeight="bold"
          fill={palette.text}
          fontFamily="Georgia, 'Playfair Display', serif"
          letterSpacing="0.3"
        >
          {line}
        </text>
      ))}

      {/* Cover bottom ornament */}
      <Ornament x={coverX + 6} y={h * 0.72} width={coverW - 12} color={palette.accent} />

      {/* Author */}
      {author && (
        <text
          x={cx}
          y={h * 0.86}
          textAnchor="middle"
          fontSize={authorSize}
          fill={palette.text}
          fontFamily="Georgia, serif"
          opacity="0.7"
          letterSpacing="0.2"
        >
          {fitText(author, titleMaxChars + 4)}
        </text>
      )}

      {/* Spine highlight */}
      <rect x="1" y="2" width="2" height={h - 4} rx="1" fill="white" opacity="0.1" />
    </svg>
  );
}
