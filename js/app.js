/* ══════════════════════════════════════════════
   app.js — Color Lab main controller
   ══════════════════════════════════════════════ */

'use strict';

/* ── State ──────────────────────────────────── */
let currentR = 66, currentG = 135, currentB = 245;
let activeSpace = 'hsl';   // 'hsl' | 'hsv'
let activeView  = '3d';    // 'top' | '3d'
let isDark      = true;

/* ── Instances ──────────────────────────────── */
let hslModel3D, hsvModel3D, topViewInst, sideViewInst, hueWheelInst;

/* ═══════════════════════════════════════════════
   COLOUR FAMILY
   ═══════════════════════════════════════════════ */
function getHueRegion(h) {
  if (h <   8 || h >= 352) return { name: 'Rojo',          hex: '#e63946' };
  if (h <  25)             return { name: 'Rojo-naranja',   hex: '#f4511e' };
  if (h <  45)             return { name: 'Naranja',        hex: '#ff6d00' };
  if (h <  65)             return { name: 'Amarillo',       hex: '#ffca28' };
  if (h <  80)             return { name: 'Amarillo-verde', hex: '#c0ca33' };
  if (h < 150)             return { name: 'Verde',          hex: '#2e7d32' };
  if (h < 175)             return { name: 'Verde-cian',     hex: '#00897b' };
  if (h < 195)             return { name: 'Cian',           hex: '#00b8d4' };
  if (h < 255)             return { name: 'Azul',           hex: '#1565c0' };
  if (h < 275)             return { name: 'Azul-violeta',   hex: '#6200ea' };
  if (h < 310)             return { name: 'Violeta',        hex: '#8e24aa' };
  if (h < 352)             return { name: 'Magenta',        hex: '#c62828' };
  return { name: 'Rojo', hex: '#e63946' };
}

function colorFamily(r, g, b, hsl) {
  const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  if (hsl.s < 8) {
    if (lum < 0.08) return { name: 'Negro',  hex: '#111111' };
    if (lum > 0.92) return { name: 'Blanco', hex: '#eeeeee' };
    return { name: 'Gris', hex: `rgb(${r},${g},${b})` };
  }
  return getHueRegion(hsl.h);
}

/* ═══════════════════════════════════════════════
   ANALYSIS TEXT
   ═══════════════════════════════════════════════ */
function buildAnalysis(r, g, b, hsl, hsv) {
  const lum    = (r * 0.299 + g * 0.587 + b * 0.114);
  const fam    = colorFamily(r, g, b, hsl);
  const domCh  = (r >= g && r >= b) ? 'R' : (g > r && g >= b) ? 'G' : 'B';

  const line1 = hsl.s < 8
    ? `Color acromático — sin tono definido. Luminosidad perceptual ≈ <strong>${lum.toFixed(0)}</strong>/255.`
    : `Familia <strong>${fam.name}</strong>. Matiz <strong>${hsl.h.toFixed(1)}°</strong>, canal dominante <strong>${domCh}</strong>.`;

  const cone  = activeSpace === 'hsl' ? 'bicono HSL' : 'cono HSV';
  const sUsed = activeSpace === 'hsl' ? hsl.s : hsv.s;
  const lvUsed = activeSpace === 'hsl' ? hsl.l : hsv.v;
  const lvLbl = activeSpace === 'hsl' ? 'L' : 'V';
  const radius = activeSpace === 'hsl'
    ? (hsl.s / 100 * (1 - Math.abs(2 * hsl.l / 100 - 1))).toFixed(2)
    : (hsv.s / 100 * hsv.v / 100).toFixed(2);

  const line2 = `En el ${cone}: radio = <strong>${radius}</strong>, ${lvLbl} = ${lvUsed.toFixed(0)}%, S = ${sUsed.toFixed(0)}%.`;

  const satWord = hsl.s > 70 ? 'muy saturado' : hsl.s > 35 ? 'moderadamente saturado' : 'poco saturado';
  const lumWord = lum > 180 ? 'claro' : lum < 80 ? 'oscuro' : 'de luminosidad media';
  const line3 = `Tono ${satWord} y ${lumWord}. Luminancia W3C: <strong>${(lum / 255 * 100).toFixed(1)}%</strong>.`;

  return [line1, line2, line3];
}

/* ═══════════════════════════════════════════════
   UPDATE ALL
   ═══════════════════════════════════════════════ */
function updateAll(r, g, b) {
  currentR = Math.round(Math.max(0, Math.min(255, r)));
  currentG = Math.round(Math.max(0, Math.min(255, g)));
  currentB = Math.round(Math.max(0, Math.min(255, b)));

  const all = allFromRgb(currentR, currentG, currentB);
  const hsl = all.hsl;
  const hsv = all.hsv;

  updateSwatch(currentR, currentG, currentB, all.hex, hsl);
  updateRgbSliders(currentR, currentG, currentB);
  updateHueWheel(hsl, currentR, currentG, currentB);
  updateLVSlider(hsl, hsv);
  updateMini(hsl, hsv);
  updateRepr(currentR, currentG, currentB, all.hex, hsl, hsv);
  updateFamily(currentR, currentG, currentB, hsl);
  updateHSVBars(hsl, hsv);
  updateAnalysis(currentR, currentG, currentB, hsl, hsv);
  update3DModels(hsl, hsv);
  updateTopView(hsl, hsv);
  updateSideView(hsl, hsv);
  if (window._syncColorInput) window._syncColorInput();
}

/* ── Swatch ─────────────────────────────────── */
function updateSwatch(r, g, b, hex, hsl) {
  const sw  = document.getElementById('swatch');
  const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  const textColor = lum > 0.55 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)';
  sw.style.background = `rgb(${r},${g},${b})`;
  document.getElementById('sw-hex').textContent    = hex.toUpperCase();
  document.getElementById('sw-hex').style.color    = textColor;
  const fam = colorFamily(r, g, b, hsl);
  document.getElementById('sw-family').textContent = fam.name;
  document.getElementById('sw-family').style.color = textColor;
}

/* ── RGB sliders ─────────────────────────────── */
function updateRgbSliders(r, g, b) {
  document.getElementById('sl-r').value = r;
  document.getElementById('sl-g').value = g;
  document.getElementById('sl-b').value = b;
  document.getElementById('sn-r').value = r;
  document.getElementById('sn-g').value = g;
  document.getElementById('sn-b').value = b;
  document.getElementById('sl-r').style.setProperty('--track',
    `linear-gradient(to right, rgb(0,${g},${b}), rgb(255,${g},${b}))`);
  document.getElementById('sl-g').style.setProperty('--track',
    `linear-gradient(to right, rgb(${r},0,${b}), rgb(${r},255,${b}))`);
  document.getElementById('sl-b').style.setProperty('--track',
    `linear-gradient(to right, rgb(${r},${g},0), rgb(${r},${g},255))`);
}

/* ── Hue wheel ───────────────────────────────── */
function updateHueWheel(hsl, r, g, b) {
  if (!hueWheelInst) return;
  hueWheelInst.setHSColor(hsl.h, hsl.s, `rgb(${r},${g},${b})`);
}

/* ── L/V slider ──────────────────────────────── */
function updateLVSlider(hsl, hsv) {
  const slider = document.getElementById('lv-slider');
  const lbl    = document.getElementById('lv-lbl');
  const valEl  = document.getElementById('lv-val');

  if (activeSpace === 'hsl') {
    slider.value = hsl.l;
    valEl.textContent = hsl.l.toFixed(0) + '%';
    lbl.textContent = 'L';
    slider.style.setProperty('--track',
      `linear-gradient(to right, hsl(${hsl.h},${hsl.s}%,0%), hsl(${hsl.h},${hsl.s}%,50%), hsl(${hsl.h},${hsl.s}%,100%))`);
  } else {
    slider.value = hsv.v;
    valEl.textContent = hsv.v.toFixed(0) + '%';
    lbl.textContent = 'V';
    slider.style.setProperty('--track',
      `linear-gradient(to right, #000, hsl(${hsl.h},100%,50%))`);
  }
}

/* ── Mini H · S · L/V ───────────────────────── */
function updateMini(hsl, hsv) {
  document.getElementById('mini-h').textContent = hsl.h.toFixed(1) + '°';
  document.getElementById('mini-s').textContent = hsl.s.toFixed(0) + '%';
  const lv = activeSpace === 'hsl' ? hsl.l : hsv.v;
  const ll = activeSpace === 'hsl' ? 'L' : 'V';
  document.getElementById('mini-lv').textContent     = lv.toFixed(0) + '%';
  document.getElementById('mini-lv-lbl').textContent = ll;
}

/* ── Representations ─────────────────────────── */
function updateRepr(r, g, b, hex, hsl, hsv) {
  document.getElementById('repr-rgb').textContent  = `rgb(${r}, ${g}, ${b})`;
  document.getElementById('repr-hex').textContent  = hex.toUpperCase();
  document.getElementById('repr-hsl').textContent  =
    `hsl(${hsl.h.toFixed(0)}, ${hsl.s.toFixed(0)}%, ${hsl.l.toFixed(0)}%)`;
  document.getElementById('repr-hsv').textContent  =
    `hsv(${hsv.h.toFixed(0)}, ${hsv.s.toFixed(0)}%, ${hsv.v.toFixed(0)}%)`;
}

/* ── Color family chip ───────────────────────── */
function updateFamily(r, g, b, hsl) {
  const fam = colorFamily(r, g, b, hsl);
  document.getElementById('fam-dot').style.background = fam.hex;
  document.getElementById('fam-txt').textContent = fam.name;
}

/* ── HSL/HSV value bars ──────────────────────── */
function updateHSVBars(hsl, hsv) {
  const lv   = activeSpace === 'hsl' ? hsl.l : hsv.v;
  const sVal = activeSpace === 'hsl' ? hsl.s : hsv.s;

  // H bar
  const hPct = hsl.h / 360 * 100;
  document.getElementById('hbv-h').textContent = hsl.h.toFixed(0) + '°';
  document.getElementById('hbth-h').style.left = hPct + '%';

  // S bar
  document.getElementById('hbv-s').textContent = sVal.toFixed(0) + '%';
  document.getElementById('hbth-s').style.left = sVal + '%';
  document.getElementById('hbf-s').style.width  = sVal + '%';

  const sTrack = document.getElementById('hbtr-s');
  const sBg = activeSpace === 'hsl'
    ? `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))`
    : `linear-gradient(to right, hsl(${hsl.h},0%,${hsv.v/2}%), hsl(${hsl.h},100%,${hsv.v/2}%))`;
  sTrack.style.background = sBg;
  document.getElementById('hbf-s').style.background = sBg;

  // L/V bar
  document.getElementById('hb-lv-lbl').textContent  = activeSpace === 'hsl' ? 'L' : 'V';
  document.getElementById('hslv-ttl').textContent    = (activeSpace === 'hsl' ? 'HSL' : 'HSV') + ' — valores';
  document.getElementById('hbv-lv').textContent = lv.toFixed(0) + '%';
  document.getElementById('hbth-lv').style.left = lv + '%';
  document.getElementById('hbf-lv').style.width  = lv + '%';

  const lvTrack = document.getElementById('hbtr-lv');
  const lvBg = activeSpace === 'hsl'
    ? `linear-gradient(to right, hsl(${hsl.h},${hsl.s}%,0%), hsl(${hsl.h},${hsl.s}%,50%), hsl(${hsl.h},${hsl.s}%,100%))`
    : `linear-gradient(to right, #000, hsl(${hsl.h},100%,50%))`;
  lvTrack.style.background = lvBg;
  document.getElementById('hbf-lv').style.background = lvBg;
}

/* ── Analysis text ───────────────────────────── */
function updateAnalysis(r, g, b, hsl, hsv) {
  const lines = buildAnalysis(r, g, b, hsl, hsv);
  document.getElementById('analysis').innerHTML =
    lines.map(l => `<p class="analysis-line">${l}</p>`).join('');
}

/* ── 3D models ───────────────────────────────── */
function update3DModels(hsl, hsv) {
  if (hslModel3D) hslModel3D.setHSL(hsl.h, hsl.s, hsl.l);
  if (hsvModel3D) hsvModel3D.setHSV(hsv.h, hsv.s, hsv.v);
}

/* ── 2D views ────────────────────────────────── */
function updateTopView(hsl, hsv) {
  if (!topViewInst) return;
  const lv = activeSpace === 'hsl' ? hsl.l : hsv.v;
  topViewInst.draw(hsl.h, hsl.s, lv, activeSpace, currentR, currentG, currentB);
}

function updateSideView(hsl, hsv) {
  if (!sideViewInst) return;
  const lv = activeSpace === 'hsl' ? hsl.l : hsv.v;
  const bg = isDark ? { r: 13, g: 13, b: 15 } : { r: 240, g: 240, b: 238 };
  sideViewInst.draw(hsl.h, hsl.s, lv, activeSpace, bg.r, bg.g, bg.b, currentR, currentG, currentB);
}

/* ═══════════════════════════════════════════════
   COLOR INPUT PARSER
   ═══════════════════════════════════════════════ */

function parseColorInput(raw) {
  const s = raw.trim();
  if (!s) return null;

  // HEX: #RGB, #RRGGBB (ignore alpha)
  const hexMatch = s.match(/^#?([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    const h = hexMatch[1];
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      return { r, g, b };
    }
    if (h.length === 6 || h.length === 8) {
      return hexToRgb('#' + h.substring(0, 6));
    }
  }

  // rgb(r, g, b) or rgb(r g b)
  const rgbMatch = s.match(/^rgba?\(\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)[\s,)]/i);
  if (rgbMatch) {
    const parse = (v) => v.endsWith('%') ? Math.round(parseFloat(v) / 100 * 255) : Math.round(parseFloat(v));
    return { r: parse(rgbMatch[1]), g: parse(rgbMatch[2]), b: parse(rgbMatch[3]) };
  }

  // hsl(h, s%, l%) or hsl(h s% l%)
  const hslMatch = s.match(/^hsla?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?/i);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) % 360;
    const sat = parseFloat(hslMatch[2]);
    const l = parseFloat(hslMatch[3]);
    return hslToRgb(h, sat, l);
  }

  // hsv(h, s%, v%) or hsb(h, s%, b%)
  const hsvMatch = s.match(/^hs[vb]a?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?/i);
  if (hsvMatch) {
    const h = parseFloat(hsvMatch[1]) % 360;
    const sat = parseFloat(hsvMatch[2]);
    const v = parseFloat(hsvMatch[3]);
    return hsvToRgb(h, sat, v);
  }

  // Named CSS color via canvas
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = s;
    const filled = ctx.fillStyle;
    if (filled && filled !== '#000000' || s.toLowerCase() === 'black') {
      if (filled.startsWith('#')) return hexToRgb(filled);
      const m = filled.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    }
  } catch (_) {}

  return null;
}

function initColorInput() {
  const field = document.getElementById('color-input');
  const hint  = document.getElementById('color-input-hint');
  const DEFAULT_HINT = 'HEX · RGB · HSL · HSV — presiona Enter';
  let clearTimer = null;

  function setValid() {
    field.classList.remove('is-error');
    field.classList.add('is-valid');
    hint.textContent = DEFAULT_HINT;
    hint.classList.remove('hint-error');
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => field.classList.remove('is-valid'), 1200);
  }

  function setError() {
    field.classList.remove('is-valid');
    field.classList.add('is-error');
    hint.textContent = 'Formato no reconocido — prueba #FF6432, rgb(255,100,50) o hsl(15,100%,60%)';
    hint.classList.add('hint-error');
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => {
      field.classList.remove('is-error');
      hint.textContent = DEFAULT_HINT;
      hint.classList.remove('hint-error');
    }, 2500);
  }

  function tryApply() {
    const rgb = parseColorInput(field.value);
    if (!rgb) { setError(); return; }
    const r = Math.max(0, Math.min(255, rgb.r));
    const g = Math.max(0, Math.min(255, rgb.g));
    const b = Math.max(0, Math.min(255, rgb.b));
    setValid();
    updateAll(r, g, b);
    field.blur();
  }

  field.addEventListener('input', () => {
    field.classList.remove('is-valid', 'is-error');
    hint.textContent = DEFAULT_HINT;
    hint.classList.remove('hint-error');
  });

  field.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); tryApply(); }
    if (e.key === 'Escape') { field.value = ''; field.blur(); }
  });

  field.addEventListener('blur', () => {
    if (field.value.trim()) tryApply();
  });

  field.addEventListener('focus', () => {
    if (!field.value.trim()) {
      field.placeholder = rgbToHex(currentR, currentG, currentB);
    }
  });

  window._syncColorInput = () => {};
}

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */

function initTheme() {
  const btn  = document.getElementById('theme-btn');
  const icon = document.getElementById('theme-icon');

  function applyTheme(dark) {
    isDark = dark;
    document.body.classList.toggle('theme-dark',  dark);
    document.body.classList.toggle('theme-light', !dark);
    icon.textContent = dark ? '🌙' : '☀️';
    if (hslModel3D) hslModel3D.updateTheme(dark);
    if (hsvModel3D) hsvModel3D.updateTheme(dark);
    // Re-draw side view with new background
    const all = allFromRgb(currentR, currentG, currentB);
    updateSideView(all.hsl, all.hsv);
  }

  btn.addEventListener('click', () => applyTheme(!isDark));
  applyTheme(true);
}

function initSpaceTabs() {
  document.querySelectorAll('.space-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeSpace = tab.dataset.space;
      document.querySelectorAll('.space-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.getElementById('three-hsl').classList.toggle('hidden', activeSpace !== 'hsl');
      document.getElementById('three-hsv').classList.toggle('hidden', activeSpace !== 'hsv');

      if (activeView === '3d') {
        setTimeout(() => {
          if (hslModel3D) hslModel3D._onResize();
          if (hsvModel3D) hsvModel3D._onResize();
        }, 50);
      }

      updateAll(currentR, currentG, currentB);
    });
  });
}

function initViewToggle() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeView = btn.dataset.view;
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-' + activeView).classList.add('active');

      if (activeView === '3d') {
        setTimeout(() => {
          if (hslModel3D && activeSpace === 'hsl') hslModel3D._onResize();
          if (hsvModel3D && activeSpace === 'hsv') hsvModel3D._onResize();
        }, 50);
      } else {
        resizeCanvases();
        const all = allFromRgb(currentR, currentG, currentB);
        if (activeView === 'top')  updateTopView(all.hsl, all.hsv);
        if (activeView === 'side') updateSideView(all.hsl, all.hsv);
      }
    });
  });
}


function initHueWheel() {
  const canvas = document.getElementById('hue-wheel');
  hueWheelInst = new HueWheel(canvas);

  function onWheelPointer(evt) {
    const rect = canvas.getBoundingClientRect();
    const cx   = canvas.width / 2, cy = canvas.height / 2;
    const R    = cx - 4;
    const sx   = evt.clientX - rect.left, sy = evt.clientY - rect.top;
    const dx   = (sx / rect.width)  * canvas.width  - cx;
    const dy   = (sy / rect.height) * canvas.height - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const h = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
    const s = Math.min(dist / R * 100, 100);
    const all = allFromRgb(currentR, currentG, currentB);
    const lv  = activeSpace === 'hsl' ? all.hsl.l : all.hsv.v;
    const rgb = activeSpace === 'hsl' ? hslToRgb(h, s, lv) : hsvToRgb(h, s, lv);
    updateAll(rgb.r, rgb.g, rgb.b);
  }

  let dragging = false;
  canvas.addEventListener('pointerdown', e => { dragging = true; canvas.setPointerCapture(e.pointerId); onWheelPointer(e); });
  canvas.addEventListener('pointermove', e => { if (dragging) onWheelPointer(e); });
  canvas.addEventListener('pointerup',   () => { dragging = false; });
}

function initRgbSliders() {
  ['r', 'g', 'b'].forEach(ch => {
    const slider = document.getElementById('sl-' + ch);
    const num    = document.getElementById('sn-' + ch);

    slider.addEventListener('input', () => {
      num.value = slider.value;
      updateAll(
        +document.getElementById('sl-r').value,
        +document.getElementById('sl-g').value,
        +document.getElementById('sl-b').value
      );
    });

    num.addEventListener('change', () => {
      const v = Math.max(0, Math.min(255, +num.value || 0));
      num.value    = v;
      slider.value = v;
      updateAll(
        +document.getElementById('sl-r').value,
        +document.getElementById('sl-g').value,
        +document.getElementById('sl-b').value
      );
    });
  });
}

function initLVSlider() {
  const slider = document.getElementById('lv-slider');
  slider.addEventListener('input', () => {
    const val = +slider.value;
    const all = allFromRgb(currentR, currentG, currentB);
    const rgb = activeSpace === 'hsl'
      ? hslToRgb(all.hsl.h, all.hsl.s, val)
      : hsvToRgb(all.hsv.h, all.hsv.s, val);
    updateAll(rgb.r, rgb.g, rgb.b);
  });
}


function init3DModels() {
  if (typeof HSLModel !== 'undefined')
    hslModel3D = new HSLModel(document.getElementById('three-hsl'));
  if (typeof HSVModel !== 'undefined')
    hsvModel3D = new HSVModel(document.getElementById('three-hsv'));
}

function initKeyboardControls() {
  const ARROWS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
  const keysHeld  = new Set();
  let shiftHeld   = false;
  let ctrlHeld    = false;
  let rafId       = null;

  // step como fracción del radio normalizado (0–1) por frame a 60 fps
  function loop() {
    if (keysHeld.size === 0) { rafId = null; return; }

    const all  = allFromRgb(currentR, currentG, currentB);
    let h      = all.hsl.h;
    let s      = activeSpace === 'hsl' ? all.hsl.s : all.hsv.s;
    let lv     = activeSpace === 'hsl' ? all.hsl.l : all.hsv.v;

    const step   = ctrlHeld ? 0.004 : 0.015;  // fracción del radio por frame
    const stepLV = ctrlHeld ? 0.4   : 1.5;

    // Ejes de la cámara proyectados al plano XZ del modelo
    const activeModel = activeSpace === 'hsl' ? hslModel3D : hsvModel3D;
    const axes = (activeModel && activeModel.getScreenAxes)
      ? activeModel.getScreenAxes()
      : { right: { x: 1, z: 0 }, forward: { x: 0, z: 1 } };

    // Posición actual en coordenadas cartesianas del plano HS
    const hRad = h * Math.PI / 180;
    const sN   = s / 100;
    let cx = sN * Math.cos(hRad);
    let cz = sN * Math.sin(hRad);
    let moved2D = false;

    if (!shiftHeld) {
      // ←/→ = dirección derecha de la cámara (siempre acorde a lo que ves en pantalla)
      if (keysHeld.has('ArrowLeft'))  {
        cx -= axes.right.x * step;
        cz -= axes.right.z * step;
        moved2D = true;
      }
      if (keysHeld.has('ArrowRight')) {
        cx += axes.right.x * step;
        cz += axes.right.z * step;
        moved2D = true;
      }
      // ↑/↓ = eje vertical (L o V)
      if (keysHeld.has('ArrowUp'))   lv = Math.min(100, lv + stepLV);
      if (keysHeld.has('ArrowDown')) lv = Math.max(0,   lv - stepLV);
    } else {
      // ⇧↑/⇧↓ = dirección profundidad de la cámara en el plano XZ
      if (keysHeld.has('ArrowUp'))   {
        cx += axes.forward.x * step;
        cz += axes.forward.z * step;
        moved2D = true;
      }
      if (keysHeld.has('ArrowDown')) {
        cx -= axes.forward.x * step;
        cz -= axes.forward.z * step;
        moved2D = true;
      }
    }

    if (moved2D) {
      const newSN = Math.sqrt(cx * cx + cz * cz);
      s = Math.min(100, newSN * 100);
      if (newSN > 0.005) {
        h = ((Math.atan2(cz, cx) * 180 / Math.PI) + 360) % 360;
      } else {
        s = 0;
      }
    }

    const rgb = activeSpace === 'hsl'
      ? hslToRgb(h, s, lv)
      : hsvToRgb(h, s, lv);
    updateAll(rgb.r, rgb.g, rgb.b);

    rafId = requestAnimationFrame(loop);
  }

  // capture:true → nuestro handler dispara ANTES que OrbitControls
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift')   { shiftHeld = true;  return; }
    if (e.key === 'Control') { ctrlHeld  = true;  return; }
    if (!ARROWS.has(e.key))  return;
    if (activeView !== '3d') return;
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    e.preventDefault();
    e.stopPropagation();   // bloquea OrbitControls definitivamente

    keysHeld.add(e.key);
    if (!rafId) rafId = requestAnimationFrame(loop);
  }, { capture: true });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift')   { shiftHeld = false; return; }
    if (e.key === 'Control') { ctrlHeld  = false; return; }
    keysHeld.delete(e.key);
    if (keysHeld.size === 0 && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }, { capture: true });

  window.addEventListener('blur', () => {
    keysHeld.clear();
    shiftHeld = false;
    ctrlHeld  = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  });
}

function initTopView() {
  const canvas = document.getElementById('top-view');
  topViewInst  = new TopView(canvas);
  topViewInst.onDrag = (h, s) => {
    const all = allFromRgb(currentR, currentG, currentB);
    const lv  = activeSpace === 'hsl' ? all.hsl.l : all.hsv.v;
    const rgb = activeSpace === 'hsl' ? hslToRgb(h, s, lv) : hsvToRgb(h, s, lv);
    updateAll(rgb.r, rgb.g, rgb.b);
  };
}

function initSideView() {
  const canvas = document.getElementById('side-view');
  sideViewInst = new SideView(canvas);
  sideViewInst.onDrag = (s, lv) => {
    const all = allFromRgb(currentR, currentG, currentB);
    const rgb = activeSpace === 'hsl'
      ? hslToRgb(all.hsl.h, s, lv)
      : hsvToRgb(all.hsv.h, s, lv);
    updateAll(rgb.r, rgb.g, rgb.b);
  };
}

function resizeCanvases() {
  const area = document.getElementById('view-area');
  const W = area.clientWidth, H = area.clientHeight;
  const sz = Math.max(60, Math.min(W, H) - 24);
  if (topViewInst)  topViewInst.resize(sz, sz);
  if (sideViewInst) sideViewInst.resize(sz, sz);
}

function initResizeObserver() {
  const area = document.getElementById('view-area');
  const ro   = new ResizeObserver(() => {
    resizeCanvases();
    const all = allFromRgb(currentR, currentG, currentB);
    updateTopView(all.hsl, all.hsv);
    updateSideView(all.hsl, all.hsv);
  });
  ro.observe(area);
}

/* ═══════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSpaceTabs();
  initViewToggle();
  initHueWheel();
  initRgbSliders();
  initLVSlider();
  init3DModels();
  initTopView();
  initResizeObserver();
  initKeyboardControls();
  initColorInput();

  updateAll(currentR, currentG, currentB);

  // Scroll-cue
  const cue = document.querySelector('.tsc-inner');
  if (cue) {
    cue.style.cursor = 'pointer';
    cue.addEventListener('click', () => {
      document.querySelector('.theory-wrapper')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
});
