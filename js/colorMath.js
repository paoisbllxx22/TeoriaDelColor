/**
 * colorMath.js
 * All color space conversion functions implemented from scratch.
 * Every formula follows the formal mathematical definition.
 */

// ─────────────────────────────────────────────
// RGB ↔ HEX
// ─────────────────────────────────────────────

function rgbToHex(r, g, b) {
  const toHex = n => {
    const h = Math.round(n).toString(16).toUpperCase();
    return h.length === 1 ? '0' + h : h;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

// ─────────────────────────────────────────────
// RGB → HSL
// Source: IEC 61966-2-1, Foley et al. "Computer Graphics"
// ─────────────────────────────────────────────

function rgbToHsl(r, g, b) {
  // Normalise to [0, 1]
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;

  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const delta = max - min;

  // Lightness
  const L = (max + min) / 2;

  // Saturation
  let S = 0;
  if (delta !== 0) {
    S = delta / (1 - Math.abs(2 * L - 1));
  }

  // Hue
  let H = 0;
  if (delta !== 0) {
    if (max === rN) {
      H = 60 * (((gN - bN) / delta) % 6);
    } else if (max === gN) {
      H = 60 * ((bN - rN) / delta + 2);
    } else {
      H = 60 * ((rN - gN) / delta + 4);
    }
  }
  if (H < 0) H += 360;

  return {
    h: parseFloat(H.toFixed(2)),
    s: parseFloat((S * 100).toFixed(2)),
    l: parseFloat((L * 100).toFixed(2))
  };
}

// ─────────────────────────────────────────────
// HSL → RGB
// ─────────────────────────────────────────────

function hslToRgb(h, s, l) {
  // Normalise s, l to [0, 1]
  const sN = s / 100;
  const lN = l / 100;

  const C = (1 - Math.abs(2 * lN - 1)) * sN;   // chroma
  const X = C * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lN - C / 2;

  let rP = 0, gP = 0, bP = 0;

  if      (h < 60)  { rP = C; gP = X; bP = 0; }
  else if (h < 120) { rP = X; gP = C; bP = 0; }
  else if (h < 180) { rP = 0; gP = C; bP = X; }
  else if (h < 240) { rP = 0; gP = X; bP = C; }
  else if (h < 300) { rP = X; gP = 0; bP = C; }
  else              { rP = C; gP = 0; bP = X; }

  return {
    r: Math.round((rP + m) * 255),
    g: Math.round((gP + m) * 255),
    b: Math.round((bP + m) * 255)
  };
}

// ─────────────────────────────────────────────
// RGB → HSV
// ─────────────────────────────────────────────

function rgbToHsv(r, g, b) {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;

  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const delta = max - min;

  // Value
  const V = max;

  // Saturation
  const S = max === 0 ? 0 : delta / max;

  // Hue
  let H = 0;
  if (delta !== 0) {
    if (max === rN) {
      H = 60 * (((gN - bN) / delta) % 6);
    } else if (max === gN) {
      H = 60 * ((bN - rN) / delta + 2);
    } else {
      H = 60 * ((rN - gN) / delta + 4);
    }
  }
  if (H < 0) H += 360;

  return {
    h: parseFloat(H.toFixed(2)),
    s: parseFloat((S * 100).toFixed(2)),
    v: parseFloat((V * 100).toFixed(2))
  };
}

// ─────────────────────────────────────────────
// HSV → RGB
// ─────────────────────────────────────────────

function hsvToRgb(h, s, v) {
  const sN = s / 100;
  const vN = v / 100;

  const C = vN * sN;                            // chroma
  const X = C * (1 - Math.abs((h / 60) % 2 - 1));
  const m = vN - C;

  let rP = 0, gP = 0, bP = 0;

  if      (h < 60)  { rP = C; gP = X; bP = 0; }
  else if (h < 120) { rP = X; gP = C; bP = 0; }
  else if (h < 180) { rP = 0; gP = C; bP = X; }
  else if (h < 240) { rP = 0; gP = X; bP = C; }
  else if (h < 300) { rP = X; gP = 0; bP = C; }
  else              { rP = C; gP = 0; bP = X; }

  return {
    r: Math.round((rP + m) * 255),
    g: Math.round((gP + m) * 255),
    b: Math.round((bP + m) * 255)
  };
}

// ─────────────────────────────────────────────
// Utility: CSS colour string from RGB object
// ─────────────────────────────────────────────

function rgbToCss(r, g, b) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// ─────────────────────────────────────────────
// Utility: compute all representations at once
// ─────────────────────────────────────────────

function allFromRgb(r, g, b) {
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const hsv = rgbToHsv(r, g, b);
  return { r, g, b, hex, hsl, hsv };
}
