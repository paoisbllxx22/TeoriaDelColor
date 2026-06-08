/**
 * topView.js
 * Interactive top-down view: draws the H/S plane at the current L (or V).
 * H = angle around centre, S = radial distance.
 * Dragging changes H and S; L/V is controlled by the external slider.
 */

class TopView {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.onDrag  = null;   // callback(h, s)
    this._drag   = false;

    const hit = e => {
      if (!this.onDrag) return;
      const r   = canvas.getBoundingClientRect();
      const cx  = r.width / 2, cy = r.height / 2;
      const R   = Math.min(cx, cy) - 3;
      const cX  = (e.touches ? e.touches[0].clientX : e.clientX) - r.left - cx;
      const cY  = (e.touches ? e.touches[0].clientY : e.clientY) - r.top  - cy;
      const d   = Math.sqrt(cX * cX + cY * cY);
      const h   = ((Math.atan2(cY, cX) * 180 / Math.PI) + 360) % 360;
      const s   = Math.min(100, (Math.min(d, R) / R) * 100);
      this.onDrag(h, s);
    };

    canvas.addEventListener('mousedown',  e => { this._drag = true;  hit(e); });
    window.addEventListener('mousemove',  e => { if (this._drag) hit(e); });
    window.addEventListener('mouseup',    () => { this._drag = false; });
    canvas.addEventListener('touchstart', e => { this._drag = true;  hit(e); e.preventDefault(); }, { passive: false });
    window.addEventListener('touchmove',  e => { if (this._drag) { hit(e); e.preventDefault(); } }, { passive: false });
    window.addEventListener('touchend',   () => { this._drag = false; });
  }

  /** Draw the wheel. lv = current L (HSL) or V (HSV) in 0–100. */
  draw(h, s, lv, mode, curR, curG, curB) {
    const W = this.canvas.width, H = this.canvas.height;
    if (!W || !H) return;

    const cx = W / 2, cy = H / 2;
    const R  = Math.min(cx, cy) - 3;

    const img  = this.ctx.createImageData(W, H);
    const data = img.data;

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const dx   = px - cx, dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > R) continue;

        const hAngle = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
        const sat    = (dist / R) * 100;
        const rgb    = mode === 'hsl'
          ? hslToRgb(hAngle, sat, lv)
          : hsvToRgb(hAngle, sat, lv);

        const i = (py * W + px) * 4;
        data[i] = rgb.r; data[i+1] = rgb.g; data[i+2] = rgb.b; data[i+3] = 255;
      }
    }

    this.ctx.putImageData(img, 0, 0);

    // Draw thin border
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    this.ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    this.ctx.lineWidth   = 1;
    this.ctx.stroke();

    // Cursor — white ring + current colour fill
    const angle = (h * Math.PI) / 180;
    const dist  = (s / 100) * R;
    const mx    = cx + dist * Math.cos(angle);
    const my    = cy + dist * Math.sin(angle);

    this.ctx.beginPath();
    this.ctx.arc(mx, my, 10, 0, 2 * Math.PI);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth   = 2.5;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(mx, my, 7, 0, 2 * Math.PI);
    this.ctx.fillStyle = `rgb(${curR},${curG},${curB})`;
    this.ctx.fill();
  }

  resize(w, h) {
    this.canvas.width  = Math.round(w);
    this.canvas.height = Math.round(h);
  }
}
