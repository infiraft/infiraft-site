const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function createScrollController({ onProgress } = {}) {
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  const root = document.documentElement;
  let frame = 0;

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -2% 0px', threshold: 0.06 });

  revealItems.forEach((item, index) => {
    item.style.setProperty('--reveal-order', index % 4);
    revealObserver.observe(item);
  });

  function measure() {
    const viewport = window.innerHeight;
    const centers = chapters.map((section) => {
      const rect = section.getBoundingClientRect();
      return {
        id: section.dataset.chapter,
        rect,
        distance: Math.abs(rect.top + rect.height / 2 - viewport / 2),
        local: clamp((viewport * 0.72 - rect.top) / Math.max(rect.height + viewport * 0.2, 1)),
      };
    });

    const active = centers.sort((a, b) => a.distance - b.distance)[0];
    const pageRange = Math.max(document.documentElement.scrollHeight - viewport, 1);
    const pageProgress = clamp(window.scrollY / pageRange);

    root.style.setProperty('--page-progress', pageProgress.toFixed(4));
    document.body.dataset.activeChapter = active?.id || 'hero';
    onProgress?.({
      chapter: active?.id || 'hero',
      localProgress: active?.local || 0,
      pageProgress,
    });
  }

  function requestMeasure() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      measure();
    });
  }

  window.addEventListener('scroll', requestMeasure, { passive: true });
  window.addEventListener('resize', requestMeasure, { passive: true });
  measure();

  return () => {
    window.removeEventListener('scroll', requestMeasure);
    window.removeEventListener('resize', requestMeasure);
    revealObserver.disconnect();
    if (frame) cancelAnimationFrame(frame);
  };
}
