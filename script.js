import { createScrollController } from './src/scroll-controller.js';

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const nav = document.querySelector('.navbar');
const sceneContainer = document.querySelector('.scene-stage');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopScene = window.matchMedia('(min-width: 768px)');
let scene = null;
let latestProgress = { chapter: 'hero', localProgress: 0, pageProgress: 0 };

function canUseWebGL() {
  try {
    const test = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (test.getContext('webgl2') || test.getContext('webgl')));
  } catch {
    return false;
  }
}

async function loadScene() {
  if (!sceneContainer || scene || reducedMotion.matches || !desktopScene.matches || !canUseWebGL()) return;

  try {
    const { createInfiraftScene } = await import('./src/infiraft-scene.js');
    scene = createInfiraftScene(sceneContainer);
    scene.setProgress(latestProgress);
  } catch (error) {
    sceneContainer.classList.add('scene-failed');
    console.info('Infiraft 3D scene memakai fallback statis.', error);
  }
}

createScrollController({
  onProgress(progress) {
    latestProgress = progress;
    scene?.setProgress(progress);
    nav?.classList.toggle('is-scrolled', window.scrollY > 24);
  },
});

const workCards = document.querySelectorAll('.work-card');
workCards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || event.pointerType === 'touch') return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--tilt-x', `${(-y * 2.2).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${(x * 2.2).toFixed(2)}deg`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
});

if ('requestIdleCallback' in window) requestIdleCallback(loadScene, { timeout: 900 });
else window.setTimeout(loadScene, 120);
