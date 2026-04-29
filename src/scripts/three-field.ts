/*
  Ambient Three.js particle field — port pattern from berserk.html, trimmed for editorial mood.
   - ~12k particles (15k on desktop, fewer on smaller screens)
   - Cream-tinted with sparse terra accents
   - Slow auto-pan camera; subtle scroll-velocity vertex displacement
   - Listens for `cinemaMode` CustomEvent → opacity swell + camera dolly
   - Lazily loaded via dynamic import so initial paint stays fast
*/

export async function initAmbientField(canvasSelector: string) {
  const canvas = document.querySelector<HTMLCanvasElement>(canvasSelector);
  if (!canvas) return;

  const THREE = await import('three');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 14);

  const COUNT = window.innerWidth > 1200 ? 15000 : window.innerWidth > 720 ? 9000 : 4000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  const cream = new THREE.Color(0xede4d3);
  const terra = new THREE.Color(0xc25a3a);
  const moss  = new THREE.Color(0x2d4533);

  for (let i = 0; i < COUNT; i++) {
    const r = 6 + Math.random() * 14;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.6; // squashed vertical
    const z = r * Math.cos(phi);
    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const roll = Math.random();
    const c = roll < 0.04 ? terra : roll < 0.10 ? moss : cream;
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // STATE
  let cinema = false;
  let opacityTarget = 0.55;
  let cameraZTarget = 14;
  let scrollVel = 0;
  let lastScroll = window.scrollY;

  window.addEventListener('cinemaMode', ((e: CustomEvent) => {
    cinema = !!e.detail?.active;
    opacityTarget = cinema ? 0.95 : 0.55;
    cameraZTarget = cinema ? 10 : 14;
  }) as EventListener);

  let mx = 0, my = 0;
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  });

  window.addEventListener('scroll', () => {
    const dy = Math.abs(window.scrollY - lastScroll);
    scrollVel = scrollVel * 0.85 + dy * 0.06;
    lastScroll = window.scrollY;
  }, { passive: true });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  let t0 = performance.now();
  function tick() {
    const t = (performance.now() - t0) / 1000;

    // Slow auto-pan
    points.rotation.y = t * 0.02;
    points.rotation.x = Math.sin(t * 0.1) * 0.04;

    // Mouse parallax
    camera.position.x += (mx * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.6 - camera.position.y) * 0.04;
    camera.position.z += (cameraZTarget - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);

    // Opacity swell
    material.opacity += (opacityTarget - material.opacity) * 0.05;

    // Scroll-velocity nudges particle size
    const baseSize = 0.045;
    material.size = baseSize + Math.min(scrollVel, 30) * 0.0008;
    scrollVel *= 0.92;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
