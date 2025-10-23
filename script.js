document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity = 0;
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.6s ease';
    document.body.style.opacity = 1;
  });

  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--x', `${x}%`);
      hero.style.setProperty('--y', `${y}%`);
    });
    hero.addEventListener('mouseleave', () => {
      hero.style.setProperty('--x', '50%');
      hero.style.setProperty('--y', '50%');
    });
  }

  const navLinks = document.querySelectorAll('.nav a[href]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      e.preventDefault();
      document.body.style.opacity = 0;
      setTimeout(() => {
        window.location.href = href;
      }, 500);
    });
  });

  const revealElements = document.querySelectorAll('[data-reveal]');
  if (revealElements.length > 0) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealElements.forEach(el => {
      el.classList.add('to-reveal');
      observer.observe(el);
    });
  }
});