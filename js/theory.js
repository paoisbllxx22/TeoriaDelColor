/* ══════════════════════════════════════════════
   theory.js — Interactivos de la sección educativa
   ══════════════════════════════════════════════ */
'use strict';

function clampV(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function toH(n) { const h = Math.round(n).toString(16).toUpperCase(); return h.length === 1 ? '0'+h : h; }
function toRgbHex(r,g,b) { return '#'+toH(r)+toH(g)+toH(b); }

/* ── Navigation ─────────────────────────────── */
function initEduNav() {
  const pills    = document.querySelectorAll('.edu-pill');
  const chapters = document.querySelectorAll('.edu-chapter');
  if (!pills.length) return;

  function scrollToChapter(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  pills.forEach(pill =>
    pill.addEventListener('click', () => scrollToChapter('ch-' + pill.dataset.ch))
  );

  document.querySelectorAll('.edu-toc-card').forEach(card =>
    card.addEventListener('click', e => {
      e.preventDefault();
      scrollToChapter(card.getAttribute('href').slice(1));
    })
  );

  function updateActiveNav() {
    const threshold = 72;
    let active = chapters[0] ? chapters[0].id.replace('ch-', '') : '01';
    chapters.forEach(ch => {
      if (ch.getBoundingClientRect().top <= threshold) {
        active = ch.id.replace('ch-', '');
      }
    });
    pills.forEach(p => p.classList.toggle('active', p.dataset.ch === active));
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();
}

/* ── Ch 02 — LMS Simulator ──────────────────── */
function initCh02() {
  const slL = document.getElementById('lms-l');
  const slM = document.getElementById('lms-m');
  const slS = document.getElementById('lms-s');
  const vL  = document.getElementById('lms-lv');
  const vM  = document.getElementById('lms-mv');
  const vS  = document.getElementById('lms-sv');
  const box = document.getElementById('lms-preview');
  const lbl = document.getElementById('lms-label');
  if (!slL) return;

  function lmsToRgb(l, m, s) {
    const lN = l/255, mN = m/255, sN = s/255;
    const r = clampV(Math.round(255*(4.4679*lN - 3.5873*mN + 0.1193*sN)), 0, 255);
    const g = clampV(Math.round(255*(-1.2186*lN + 2.3809*mN - 0.1624*sN)), 0, 255);
    const b = clampV(Math.round(255*(0.0497*lN - 0.2439*mN + 1.2045*sN)), 0, 255);
    return {r, g, b};
  }

  function colorLabel(l, m, s, r, g, bv) {
    if (l < 15 && m < 15 && s < 15) return 'Sin activación — el cerebro percibe oscuridad total';
    if (l > 190 && m > 190 && s > 90) return 'Los 3 conos activos a alta intensidad → el cerebro percibe blanco';
    if (l < 20 && m < 20 && s < 20) return 'Activación mínima → percepción casi nula, muy oscuro';
    if (l > 180 && m > 140 && s < 50) return 'L + M activos, S bajo → amarillo (así percibimos ~580nm sin cono propio)';
    if (l > 180 && m < 70 && s < 50)  return 'Solo L muy activo → el cerebro interpreta rojo-naranja';
    if (l < 70  && m > 180 && s < 70) return 'Solo M activo → el cerebro interpreta verde';
    if (l < 60  && m < 60  && s > 140) return 'Solo S activo → violeta-azul (2% de los conos, pero perceptible)';
    if (l > 100 && m > 100 && s > 100) return `Activación proporcional en los 3 conos → gris o blanco apagado`;
    if (l < 80  && m > 100 && s > 100) return 'M + S activos → el cerebro interpreta cian';
    if (l > 100 && m < 60  && s > 100) return 'L + S activos → el cerebro interpreta magenta';
    return `Mezcla L:M:S = ${Math.round(l/2.55)}%·${Math.round(m/2.55)}%·${Math.round(s/2.55)}%`;
  }

  function update() {
    const l = +slL.value, m = +slM.value, s = +slS.value;
    vL.textContent = l; vM.textContent = m; vS.textContent = s;
    const {r, g, b} = lmsToRgb(l, m, s);
    box.style.background = `rgb(${r},${g},${b})`;
    lbl.textContent = colorLabel(l, m, s, r, g, b);
  }

  [slL, slM, slS].forEach(sl => sl.addEventListener('input', update));
  update();
}

/* ── Ch 03 — Bit Calculator ─────────────────── */
function initCh03Bits() {
  const cells = document.querySelectorAll('.edu-bit-cell');
  const decEl = document.getElementById('bit-decimal');
  const barEl = document.getElementById('bit-bar');
  if (!cells.length) return;

  const weights = [128, 64, 32, 16, 8, 4, 2, 1];
  const state   = new Array(8).fill(0);

  function update() {
    const val = state.reduce((acc, bit, i) => acc + bit * weights[i], 0);
    decEl.textContent = val;
    barEl.style.width = (val / 255 * 100).toFixed(1) + '%';
    cells.forEach((c, i) => {
      c.textContent = state[i];
      c.classList.toggle('on', state[i] === 1);
    });
  }

  cells.forEach((cell, i) => {
    cell.addEventListener('click', () => { state[i] ^= 1; update(); });
  });
  update();
}

/* ── Ch 03 — RGB Mixer ──────────────────────── */
function initCh03Rgb() {
  const slR = document.getElementById('rgbm-r');
  const slG = document.getElementById('rgbm-g');
  const slB = document.getElementById('rgbm-b');
  const vR  = document.getElementById('rgbm-rv');
  const vG  = document.getElementById('rgbm-gv');
  const vB  = document.getElementById('rgbm-bv');
  const box = document.getElementById('rgbm-preview');
  const hex = document.getElementById('rgbm-hex');
  const rgb = document.getElementById('rgbm-rgb');
  if (!slR) return;

  function update() {
    const r = +slR.value, g = +slG.value, b = +slB.value;
    vR.textContent = r; vG.textContent = g; vB.textContent = b;
    slR.style.setProperty('--track', `linear-gradient(to right,rgb(0,${g},${b}),rgb(255,${g},${b}))`);
    slG.style.setProperty('--track', `linear-gradient(to right,rgb(${r},0,${b}),rgb(${r},255,${b}))`);
    slB.style.setProperty('--track', `linear-gradient(to right,rgb(${r},${g},0),rgb(${r},${g},255))`);
    box.style.background = `rgb(${r},${g},${b})`;
    hex.textContent = toRgbHex(r,g,b);
    rgb.textContent = `rgb(${r}, ${g}, ${b})`;
  }

  [slR, slG, slB].forEach(sl => sl.addEventListener('input', update));
  update();
}

/* ── Ch 04 — CMYK Mixer ─────────────────────── */
function initCh04() {
  const slC = document.getElementById('cmyk-c');
  const slM = document.getElementById('cmyk-m');
  const slY = document.getElementById('cmyk-y');
  const slK = document.getElementById('cmyk-k');
  const vC  = document.getElementById('cmyk-cv');
  const vM  = document.getElementById('cmyk-mv');
  const vY  = document.getElementById('cmyk-yv');
  const vK  = document.getElementById('cmyk-kv');
  const box = document.getElementById('cmyk-preview');
  const val = document.getElementById('cmyk-value');
  if (!slC) return;

  function update() {
    const c = +slC.value/100, m = +slM.value/100;
    const y = +slY.value/100, k = +slK.value/100;
    vC.textContent = Math.round(c*100)+'%';
    vM.textContent = Math.round(m*100)+'%';
    vY.textContent = Math.round(y*100)+'%';
    vK.textContent = Math.round(k*100)+'%';
    const r = clampV(Math.round(255*(1-c)*(1-k)), 0, 255);
    const g = clampV(Math.round(255*(1-m)*(1-k)), 0, 255);
    const b = clampV(Math.round(255*(1-y)*(1-k)), 0, 255);
    box.style.background = `rgb(${r},${g},${b})`;
    val.textContent = `${toRgbHex(r,g,b)}   rgb(${r}, ${g}, ${b})`;
  }

  [slC, slM, slY, slK].forEach(sl => sl.addEventListener('input', update));
  update();
}

/* ── Ch 05 — HSL vs HSV Gradients ──────────── */
function initCh05() {
  const slHue  = document.getElementById('ch05-hue');
  const vHue   = document.getElementById('ch05-huev');
  const barHsl = document.getElementById('ch05-hsl-bar');
  const barHsv = document.getElementById('ch05-hsv-bar');
  if (!slHue) return;

  function hslStr(h, s, l) {
    const sN=s/100, lN=l/100;
    const C=(1-Math.abs(2*lN-1))*sN, X=C*(1-Math.abs((h/60)%2-1)), mv=lN-C/2;
    let rP=0,gP=0,bP=0;
    if(h<60){rP=C;gP=X;}else if(h<120){rP=X;gP=C;}
    else if(h<180){gP=C;bP=X;}else if(h<240){gP=X;bP=C;}
    else if(h<300){rP=X;bP=C;}else{rP=C;bP=X;}
    return `rgb(${Math.round((rP+mv)*255)},${Math.round((gP+mv)*255)},${Math.round((bP+mv)*255)})`;
  }

  function hsvStr(h, s, v) {
    const sN=s/100, vN=v/100;
    const C=vN*sN, X=C*(1-Math.abs((h/60)%2-1)), mv=vN-C;
    let rP=0,gP=0,bP=0;
    if(h<60){rP=C;gP=X;}else if(h<120){rP=X;gP=C;}
    else if(h<180){gP=C;bP=X;}else if(h<240){gP=X;bP=C;}
    else if(h<300){rP=X;bP=C;}else{rP=C;bP=X;}
    return `rgb(${Math.round((rP+mv)*255)},${Math.round((gP+mv)*255)},${Math.round((bP+mv)*255)})`;
  }

  function buildGrad(h, fn, param) {
    const stops = [];
    for (let v = 0; v <= 100; v += 4) stops.push(`${fn(h, 90, v)} ${v}%`);
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }

  function update() {
    const h = +slHue.value;
    vHue.textContent = h + '°';
    barHsl.style.background = buildGrad(h, hslStr, 'l');
    barHsv.style.background = buildGrad(h, hsvStr, 'v');
  }

  slHue.addEventListener('input', update);
  update();
}

/* ── Boot ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initEduNav();
  initCh02();
  initCh03Bits();
  initCh03Rgb();
  initCh04();
  initCh05();
});
