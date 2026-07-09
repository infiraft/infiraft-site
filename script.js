document.querySelector('#year').textContent = new Date().getFullYear();

const nav = document.querySelector('.navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const current = window.scrollY;
  nav.style.boxShadow = current > 24 ? '0 18px 50px rgba(0, 0, 0, 0.22)' : 'none';
  lastScrollY = current;
}, { passive: true });
