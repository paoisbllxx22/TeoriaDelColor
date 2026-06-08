/**
 * hueWheel.js
 * Chromatic wheel drawn pixel-by-pixel at L = 50% (pure hues).
 * Marker: white ring + current colour fill.
 */

class HueWheel {
  constructor(canvas) {
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d');
    this.markerAngle  = (14.6 * Math.PI) / 180;
    this.markerRadius = 1.0;
    this.markerColor  = '#ff6432';
    this._draw();
  }

  _draw() {
    const ctx  = this.ctx;
    const size = this.canvas.width;
    const cx = size / 2, cy = size / 2;
    const R  = size / 2 - 4;

    const img  = ctx.createImageData(size, size);
    const data = img.data;

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const dx   = px - cx, dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > R) continue;

        const s = (dist / R) * 100;
        let h   = Math.atan2(dy, dx) * (180 / Math.PI);
        if (h < 0) h += 360;

        const { r, g, b } = hslToRgb(h, s, 50);
        const i = (py * size + px) * 4;
        data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);

    // Subtle tick marks at hue primaries / secondaries
    [0, 60, 120, 180, 240, 300].forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx + (R - 1) * Math.cos(rad), cy + (R - 1) * Math.sin(rad));
      ctx.lineTo(cx + (R + 5) * Math.cos(rad), cy + (R + 5) * Math.sin(rad));
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });

    this._drawMarker();
  }

  _drawMarker() {
    const ctx  = this.ctx;
    const size = this.canvas.width;
    const cx = size / 2, cy = size / 2;
    const R  = size / 2 - 4;

    const mx = cx + this.markerRadius * R * Math.cos(this.markerAngle);
    const my = cy + this.markerRadius * R * Math.sin(this.markerAngle);

    // Subtle shadow
    ctx.beginPath();
    ctx.arc(mx, my, 12.5, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // White outer ring
    ctx.beginPath();
    ctx.arc(mx, my, 10.5, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    // Current colour fill
    ctx.beginPath();
    ctx.arc(mx, my, 8, 0, 2 * Math.PI);
    ctx.fillStyle = this.markerColor;
    ctx.fill();
  }

  /** Update marker from hue/saturation + current colour string (for display). */
  setHSColor(h, s, colorCss) {
    this.markerAngle  = (h * Math.PI) / 180;
    this.markerRadius = s / 100;
    this.markerColor  = colorCss;
    this._draw();
  }

  /** Legacy compat. */
  setHS(h, s) {
    this.markerAngle  = (h * Math.PI) / 180;
    this.markerRadius = s / 100;
    this._draw();
  }
}
