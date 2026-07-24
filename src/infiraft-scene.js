import * as THREE from 'three';

const CHAPTERS = ['hero', 'why', 'services', 'work', 'pricing', 'contact'];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = THREE.MathUtils.lerp;

function makeRibbonGeometry(segments = 160, width = 0.42) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    const x = Math.sin(t) * 2.25;
    const y = Math.sin(t) * Math.cos(t) * 1.42;
    const z = Math.cos(t * 2) * 0.22;
    const dx = Math.cos(t) * 2.25;
    const dy = Math.cos(t * 2) * 1.42;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const twist = Math.sin(t * 2) * 0.18;

    [-1, 1].forEach((side) => {
      positions.push(
        x + nx * width * side,
        y + ny * width * side,
        z + twist * side,
      );
      uvs.push(i / segments, side === -1 ? 0 : 1);
    });
  }

  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createPanel(color, x, y, z) {
  const geometry = new THREE.BoxGeometry(2.7, 1.62, 0.08, 1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.32,
    metalness: 0.08,
    transparent: true,
    opacity: 0.78,
  });
  const panel = new THREE.Mesh(geometry, material);
  panel.position.set(x, y, z);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), lineMaterial);
  panel.add(edges);
  return panel;
}

export function createInfiraftScene(container) {
  const canvas = container.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 900 ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0, 9.2);

  scene.add(new THREE.HemisphereLight(0xf8fbff, 0x34235c, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
  keyLight.position.set(3, 5, 7);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x5fd8ff, 38, 16);
  rimLight.position.set(-4, -2, 4);
  scene.add(rimLight);
  const violetLight = new THREE.PointLight(0x9b7bff, 32, 14);
  violetLight.position.set(4, 2, 2);
  scene.add(violetLight);

  const group = new THREE.Group();
  scene.add(group);

  const ribbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x7557ff,
    roughness: 0.24,
    metalness: 0.18,
    side: THREE.DoubleSide,
  });
  const ribbon = new THREE.Mesh(makeRibbonGeometry(), ribbonMaterial);
  group.add(ribbon);

  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(makeRibbonGeometry(80, 0.425)),
    new THREE.LineBasicMaterial({ color: 0xaeeeff, transparent: true, opacity: 0.11 }),
  );
  group.add(wire);

  const panels = [
    createPanel(0x9a84ff, -0.34, 0.15, -0.55),
    createPanel(0x73d9f2, 0.18, -0.12, -0.82),
    createPanel(0xf3b9ef, 0.58, 0.22, -1.08),
  ];
  panels.forEach((panel) => {
    panel.scale.setScalar(0.001);
    group.add(panel);
  });

  const state = {
    chapter: 0,
    local: 0,
    pointerX: 0,
    pointerY: 0,
    targetX: 0,
    targetY: 0,
    running: false,
    settledFrames: 0,
  };

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender(90);
  }

  function pointerMove(event) {
    state.targetX = (event.clientX / window.innerWidth - 0.5) * 0.34;
    state.targetY = (event.clientY / window.innerHeight - 0.5) * 0.22;
    requestRender(50);
  }

  function applyChapter() {
    const chapter = state.chapter;
    const local = state.local;
    const panelReveal = clamp((chapter - 0.35) / 1.2 + local * 0.24);
    const serviceFocus = chapter === 2 ? local : chapter > 2 ? 1 : 0;
    const reunite = chapter >= 4 ? clamp((chapter - 4) + local) : 0;

    ribbon.rotation.x = lerp(ribbon.rotation.x, 0.04 + chapter * 0.08 + state.pointerY, 0.075);
    ribbon.rotation.y = lerp(ribbon.rotation.y, -0.18 + chapter * 0.34 + state.pointerX, 0.075);
    ribbon.rotation.z = lerp(ribbon.rotation.z, -0.08 + local * 0.36, 0.075);
    ribbon.scale.setScalar(lerp(ribbon.scale.x, lerp(1, 0.72, panelReveal) + reunite * 0.28, 0.08));
    ribbon.material.opacity = 1;
    ribbon.material.transparent = false;

    panels.forEach((panel, index) => {
      const stagger = clamp(panelReveal * 1.35 - index * 0.13);
      const closing = reunite;
      const depth = (index - 1) * 0.72;
      const activeIndex = Math.min(2, Math.floor(serviceFocus * 2.99));
      const activeLift = chapter === 2 && index === activeIndex ? 0.72 : 0;
      const scale = lerp(0.001, 0.78 + activeLift * 0.16, stagger) * lerp(1, 0.001, closing);
      panel.scale.setScalar(lerp(panel.scale.x, scale, 0.09));
      panel.position.x = lerp(panel.position.x, (index - 1) * 0.54 + activeLift * 0.14, 0.08);
      panel.position.y = lerp(panel.position.y, (1 - index) * 0.3, 0.08);
      panel.position.z = lerp(panel.position.z, depth + activeLift, 0.08);
      panel.rotation.y = lerp(panel.rotation.y, (index - 1) * -0.2, 0.08);
      panel.rotation.z = lerp(panel.rotation.z, (index - 1) * 0.055, 0.08);
    });

    group.position.x = lerp(group.position.x, chapter === 1 ? 0.5 : chapter === 2 ? -1.45 : chapter === 3 ? 0.8 : 0, 0.06);
    group.position.y = lerp(group.position.y, chapter === 4 ? 0.25 : 0, 0.06);
    group.scale.setScalar(lerp(group.scale.x, chapter === 3 ? 0.82 : chapter === 5 ? 0.74 : 1, 0.06));
    camera.position.z = lerp(camera.position.z, chapter === 0 ? 8.8 - local * 0.9 : chapter === 5 ? 10.8 : 8.3, 0.055);
    camera.position.x = lerp(camera.position.x, chapter === 1 ? -0.45 : chapter === 2 ? 0.35 : 0, 0.055);
    camera.lookAt(0, 0, 0);
  }

  function render() {
    if (!state.running || document.hidden) return;
    state.pointerX = lerp(state.pointerX, state.targetX, 0.075);
    state.pointerY = lerp(state.pointerY, state.targetY, 0.075);
    applyChapter();
    renderer.render(scene, camera);

    state.settledFrames -= 1;
    if (state.settledFrames > 0) requestAnimationFrame(render);
    else state.running = false;
  }

  function requestRender(frames = 42) {
    state.settledFrames = Math.max(state.settledFrames, frames);
    if (!state.running) {
      state.running = true;
      requestAnimationFrame(render);
    }
  }

  function setProgress({ chapter, localProgress }) {
    state.chapter = Math.max(0, CHAPTERS.indexOf(chapter));
    state.local = clamp(localProgress);
    requestRender(48);
  }

  function onVisibility() {
    if (!document.hidden) requestRender(60);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  window.addEventListener('pointermove', pointerMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', () => container.classList.add('scene-failed'), { once: true });
  resize();
  requestRender(100);
  container.classList.add('scene-ready');

  return {
    setProgress,
    destroy() {
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', pointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.dispose();
      ribbon.geometry.dispose();
      ribbonMaterial.dispose();
      panels.forEach((panel) => {
        panel.geometry.dispose();
        panel.material.dispose();
      });
    },
  };
}
