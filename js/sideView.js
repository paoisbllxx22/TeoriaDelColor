/**
 * sideView.js
 * Cross-section view of the HSL bicone or HSV cone for the current Hue.
 *
 * HSL — diamond cross-section:
 *   X: Saturation (0 at centre, 1 at horizontal edge)
 *   Y: Lightness  (0 at bottom, 1 at top)
 *   Valid region: |xFrac| ≤ r(L) = 1 − |2L − 1|
 *
 * HSV — triangular cross-section:
 *   X: physical radius r = V × S  (0 at centre, V at horizontal edge)
 *   Y: Value (0 at bottom, 1 at top)
 *   Valid region: |xFrac| ≤ V (cone shape)
 */

class SideView {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.onDrag  = null;
    this._mode   = 'hsl';
    this._lv     = 50;
    this._drag   = false;

    const hit = e => {
      if (!this.onDrag) return;
      const r   = canvas.getBoundingClientRect();
      const cx  = r.width / 2;
      const px  = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const py  = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      const lv  = Math.max(0, Math.min(100, (1 - py / r.height) * 100));
      let s;
      if (this._mode === 'hsl') {
        s = Math.max(0, Math.min(100, Math.abs(px - cx) / cx * 100));
      } else {
        const physR = Math.max(0, Math.min(1, Math.abs(px - cx) / cx));
        s = lv > 0 ? Math.min(100, physR / (lv / 100) * 100) : 0;
      }
      this.onDrag(s, lv);
    };

    canvas.addEventListener('mousedown',  e => { this._drag = true;  hit(e); });
    window.addEventListener('mousemove',  e => { if (this._drag) hit(e); });
    window.addEventListener('mouseup',    () => { this._drag = false; });
    canvas.addEventListener('touchstart', e => { this._drag = true;  hit(e); e.preventDefault(); }, { passive: false });
    window.addEventListener('touchmove',  e => { if (this._drag) { hit(e); e.preventDefault(); } }, { passive: false });
    window.addEventListener('touchend',   () => { this._drag = false; });
  }

  draw(h, s, lv, mode, bgR, bgG, bgB, curR, curG, curB) {
    this._mode = mode;
    this._lv   = lv;
    const W = this.canvas.width, H = this.canvas.height;
    if (!W || !H) return;

    const cx  = W / 2;
    const img  = this.ctx.createImageData(W, H);
    const data = img.data;

    // Background fill
    for (let i = 0; i < data.length; i += 4) {
      data[i] = bgR; data[i+1] = bgG; data[i+2] = bgB; data[i+3] = 255;
    }

    for (let py = 0; py < H; py++) {
      const lvVal = 1 - py / (H - 1);   // 1 at top, 0 at bottom

      // Horizontal extent of the shape at this height
      const maxFrac = mode === 'hsl'
        ? (1 - Math.abs(2 * lvVal - 1))   // bicone: r(L) = 1-|2L-1|
        : lvVal;                            // cone:   r(V) = V

      if (maxFrac <= 0) continue;

      for (let px = 0; px < W; px++) {
        const xFrac = (px - cx) / cx;       // signed, -1..+1
        const absX  = Math.abs(xFrac);
        if (absX > maxFrac) continue;

        let rgb;
        if (mode === 'hsl') {
          // absX IS the saturation value (0..maxFrac, always ≤ 1)
          rgb = hslToRgb(h, absX * 100, lvVal * 100);
        } else {
          // absX is the physical radius; actual S = absX / lvVal
          const sVal = absX / maxFrac;
          rgb = hsvToRgb(h, sVal * 100, lvVal * 100);
        }

        const i = (py * W + px) * 4;
        data[i] = rgb.r; data[i+1] = rgb.g; data[i+2] = rgb.b; data[i+3] = 255;
      }
    }

    this.ctx.putImageData(img, 0, 0);

    // Cursor
    let curPx, curPy;
    if (mode === 'hsl') {
      curPy = (1 - lv / 100) * H;
      curPx = cx + (s / 100) * cx;           // right half; S maps directly
    } else {
      curPy = (1 - lv / 100) * H;            // lv = V
      const physR = (s / 100) * (lv / 100);  // r = S × V (normalised)
      curPx = cx + physR * cx;
    }

    this.ctx.beginPath();
    this.ctx.arc(curPx, curPy, 9, 0, 2 * Math.PI);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth   = 2.5;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(curPx, curPy, 6, 0, 2 * Math.PI);
    this.ctx.fillStyle = `rgb(${curR},${curG},${curB})`;
    this.ctx.fill();
  }

  resize(w, h) {
    this.canvas.width  = Math.round(w);
    this.canvas.height = Math.round(h);
  }
}
