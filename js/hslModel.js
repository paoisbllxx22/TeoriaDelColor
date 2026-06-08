/**
 * hslModel.js — HSL double-cone (bicone) in Three.js.
 * Mouse = orbit only. Color is controlled externally via setHSL().
 */

class HSLModel {
  constructor(container) {
    this.container   = container;
    this.markerMesh  = null;
    this.animFrameId = null;
    this._init();
  }

  _init() {
    const w = this.container.clientWidth  || 500;
    const h = this.container.clientHeight || 500;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0d0f);

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
    this.camera.position.set(2.5, 1.5, 2.5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(w, h);
    this.container.appendChild(this.renderer.domElement);

    // Cursor: grab en hover, grabbing mientras arrastra
    const el = this.renderer.domElement;
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', () => { el.style.cursor = 'grabbing'; });
    window.addEventListener('pointerup',   () => { el.style.cursor = 'grab'; });

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableKeys   = false;  // flechas manejadas por app.js

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(3, 5, 3);
    this.scene.add(dir);

    this._buildBicone();
    this._buildAxes();
    this._buildMarker();
    this._animate();

    window.addEventListener('resize', () => this._onResize());
  }

  _buildBicone() {
    const HUE_STEPS = 120, L_STEPS = 80, RADIUS = 1.0, HEIGHT = 2.0;
    const positions = [], colors = [], indices = [];

    for (let li = 0; li <= L_STEPS; li++) {
      const l = li / L_STEPS;
      const y = l * HEIGHT - HEIGHT / 2;
      const r = RADIUS * (1 - Math.abs(2 * l - 1));
      for (let hi = 0; hi < HUE_STEPS; hi++) {
        const a = (hi / HUE_STEPS) * 2 * Math.PI;
        positions.push(r * Math.cos(a), y, r * Math.sin(a));
        const { r: cr, g: cg, b: cb } = hslToRgb((hi / HUE_STEPS) * 360, 100, l * 100);
        colors.push(cr / 255, cg / 255, cb / 255);
      }
    }

    for (let li = 0; li < L_STEPS; li++) {
      for (let hi = 0; hi < HUE_STEPS; hi++) {
        const nx = (hi + 1) % HUE_STEPS;
        const a = li * HUE_STEPS + hi, b = li * HUE_STEPS + nx;
        const c = (li + 1) * HUE_STEPS + hi, d = (li + 1) * HUE_STEPS + nx;
        indices.push(a, b, d, a, d, c);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    this.scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.92
    })));
    this.scene.add(new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 })
    ));
  }

  _buildAxes() {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.2, 0), new THREE.Vector3(0, 1.2, 0)
    ]);
    this.scene.add(new THREE.Line(geo,
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.35, transparent: true })
    ));
  }

  _buildMarker() {
    // Sphere: shows current color, slightly smaller
    const geo = new THREE.SphereGeometry(0.052, 20, 20);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.markerMesh = new THREE.Mesh(geo, mat);

    // Inner white ring — visible against dark backgrounds
    const ringWhite = new THREE.Mesh(
      new THREE.TorusGeometry(0.064, 0.011, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    // Outer dark ring — visible against light backgrounds
    const ringDark = new THREE.Mesh(
      new THREE.TorusGeometry(0.078, 0.008, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    this.markerMesh.add(ringWhite);
    this.markerMesh.add(ringDark);
    this.scene.add(this.markerMesh);
  }

  /* Devuelve los ejes de la cámara proyectados en el plano XZ (horizontal del modelo).
     right   = dirección "pantalla-derecha" en el plano
     forward = dirección "pantalla-adentro" en el plano  */
  getScreenAxes() {
    const cp = this.camera.position;
    const ct = this.controls.target;

    const fx = ct.x - cp.x, fy = ct.y - cp.y, fz = ct.z - cp.z;
    const fLen = Math.sqrt(fx*fx + fy*fy + fz*fz) || 1;
    const fNx = fx/fLen, fNz = fz/fLen;

    // right = cross(forward, worldUp) proyectado en XZ = (-fNz, 0, fNx)
    const rx = -fNz, rz = fNx;
    const rLen = Math.sqrt(rx*rx + rz*rz) || 1;

    // forward en XZ
    const ffLen = Math.sqrt(fNx*fNx + fNz*fNz) || 1;

    return {
      right:   { x: rx/rLen,      z: rz/rLen },
      forward: { x: fNx/ffLen,    z: fNz/ffLen }
    };
  }

  setHSL(h, s, l) {
    const hN = h / 360, sN = s / 100, lN = l / 100;
    const r  = (1 - Math.abs(2 * lN - 1)) * sN;
    const y  = lN * 2 - 1;
    const a  = hN * 2 * Math.PI;
    this.markerMesh.position.set(r * Math.cos(a), y, r * Math.sin(a));
    const rgb = hslToRgb(h, s, l);
    this.markerMesh.material.color.setRGB(rgb.r / 255, rgb.g / 255, rgb.b / 255);
  }

  _animate() {
    this.animFrameId = requestAnimationFrame(() => this._animate());
    if (!this.container.offsetParent) return;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  updateTheme(dark) {
    this.scene.background = new THREE.Color(dark ? 0x0d0d0f : 0xf0f0ee);
  }

  destroy() {
    cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement))
      this.container.removeChild(this.renderer.domElement);
  }
}
