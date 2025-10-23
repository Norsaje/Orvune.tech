(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch {} }
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const throttle = (fn, wait = 100) => {
    let last = 0, rafId = null;
    return (...args) => {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => fn(...args));
      }
    };
  };

  const fadeInBody = () => {
    if (prefersReducedMotion) return;
    document.body.style.opacity = 0;
    requestAnimationFrame(() => {
      document.body.style.transition = 'opacity 0.6s ease';
      document.body.style.opacity = 1;
    });
  };

  const pageTransitions = () => {
    const links = $$('.nav a[href]');
    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        e.preventDefault();
        if (!prefersReducedMotion) {
          document.body.style.opacity = 0;
          setTimeout(() => (window.location.href = href), 500);
        } else {
          window.location.href = href;
        }
      });
    });
  };

  const initHeroParallax = () => {
    const hero = $('.hero');
    if (!hero) return;
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
  };

  const revealOnScroll = () => {
    const els = $$('[data-reveal]');
    if (!els.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach((el) => { el.classList.add('to-reveal'); observer.observe(el); });
  };

  const initTheme = () => {
    const btn = $('#theme-toggle');
    const root = document.documentElement;
    const saved = storage.get('theme');
    const apply = (mode) => {
      if (mode === 'dark') {
        root.setAttribute('data-theme', 'dark');
        btn?.setAttribute('aria-pressed', 'true');
      } else {
        root.removeAttribute('data-theme');
        btn?.setAttribute('aria-pressed', 'false');
      }
    };
    const initial = saved || (prefersDark.matches ? 'dark' : 'light');
    apply(initial);
    btn?.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      storage.set('theme', next);
      apply(next);
    });
    prefersDark.addEventListener('change', (e) => {
      if (!storage.get('theme')) apply(e.matches ? 'dark' : 'light');
    });
  };

  const initMobileNav = () => {
    const toggle = $('#menu-toggle');
    const nav = $('#primary-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) nav.querySelector('a')?.focus();
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  };

  const scrollProgress = () => {
    const bar = $('#progress-bar');
    if (!bar) return;
    const update = throttle(() => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const pct = height > 0 ? (scrolled / height) * 100 : 0;
      bar.style.width = pct + '%';
    }, 50);
    window.addEventListener('scroll', update, { passive: true });
    update();
  };

  const backToTop = () => {
    const btn = $('#back-to-top');
    if (!btn) return;
    const toggle = throttle(() => {
      if (window.scrollY > 300) btn.classList.add('visible');
      else btn.classList.remove('visible');
    }, 100);
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    toggle();
  };

  const tabs = () => {
    const tablists = $$('.tabs[role="tablist"]');
    tablists.forEach((list) => {
      const tabs = $$('[role="tab"]', list);
      const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
      const setActive = (i) => {
        tabs.forEach((t, idx) => {
          const selected = idx === i;
          t.setAttribute('aria-selected', String(selected));
          t.tabIndex = selected ? 0 : -1;
          if (panels[idx]) {
            panels[idx].hidden = !selected;
            panels[idx].classList.toggle('is-active', selected);
          }
        });
        tabs[i].focus();
      };
      tabs.forEach((t, i) => {
        t.addEventListener('click', () => setActive(i));
        t.addEventListener('keydown', (e) => {
          const left = e.key === 'ArrowLeft';
          const right = e.key === 'ArrowRight';
          if (!left && !right) return;
          e.preventDefault();
          const next = (i + (right ? 1 : -1) + tabs.length) % tabs.length;
          setActive(next);
        });
      });
    });
  };

  const accordions = () => {
    const groups = $$('[data-accordion]');
    groups.forEach((group) => {
      group.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-accordion-button]');
        if (!btn) return;
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        if (panel) panel.hidden = expanded;
      });
    });
  };

  const modal = () => {
    const modal = $('#contact-modal');
    if (!modal) return;
    const openers = $$('[data-modal-target="#contact-modal"]');
    const closers = $$('[data-modal-close]', modal);
    const open = () => { modal.hidden = false; $('#name')?.focus(); };
    const close = () => { modal.hidden = true; };
    openers.forEach((o) => o.addEventListener('click', (e) => { e.preventDefault(); open(); }));
    closers.forEach((c) => c.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target.matches('.modal')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  };

  const navPrefetch = () => {
    const addPrefetch = (href) => {
      if (!href) return;
      if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = href;
      document.head.appendChild(l);
    };
    $$('.nav a[href]').forEach((a) => a.addEventListener('mouseenter', () => addPrefetch(a.getAttribute('href'))));
  };

  const enhanceImages = () => {
    $$('img').forEach((img) => {
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    });
  };

  const smoothAnchors = () => {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      target.focus?.({ preventScroll: true });
    });
  };

  const formValidation = () => {
    const form = $('#contact-form');
    if (!form) return;
    const fields = {
      name: { el: $('#name'), err: $('#err-name'), test: (v) => v.trim().length >= 2, msg: 'Please enter your name.' },
      email: { el: $('#email'), err: $('#err-email'), test: (v) => /.+@.+\..+/.test(v), msg: 'Enter a valid email.' },
      message: { el: $('#message'), err: $('#err-message'), test: (v) => v.trim().length >= 10, msg: 'Tell us more (10+ chars).' },
    };
    const validateField = (key) => {
      const f = fields[key];
      if (!f) return true;
      const ok = f.test(f.el.value);
      f.err.textContent = ok ? '' : f.msg;
      f.el.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    Object.keys(fields).forEach((k) => fields[k].el.addEventListener('blur', () => validateField(k)));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = Object.keys(fields).every(validateField);
      if (ok) {
        // Front-end only: show a lightweight success state
        form.reset();
        alert('Thanks! We will get back to you soon.');
        $('#contact-modal')?.setAttribute('hidden', '');
      }
    });
  };

  // Magnetic elements
  const magnetic = () => {
    const items = $$('[data-magnetic]');
    if (!items.length) return;
    const strength = 12; // px
    items.forEach((el) => {
      let rect;
      const onMove = (e) => {
        rect = rect || el.getBoundingClientRect();
        const mx = e.clientX - (rect.left + rect.width / 2);
        const my = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${(mx / rect.width) * strength}px, ${(my / rect.height) * strength}px)`;
      };
      const reset = () => { el.style.transform = 'translate(0,0)'; rect = null; };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', reset);
    });
  };

  // Button ripple
  const ripples = () => {
    const targets = $$('.btn, .cta-button');
    targets.forEach((el) => {
      el.addEventListener('click', (e) => {
        const r = document.createElement('span');
        r.className = 'ripple';
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.2;
        r.style.width = r.style.height = size + 'px';
        r.style.left = e.clientX - rect.left - size / 2 + 'px';
        r.style.top = e.clientY - rect.top - size / 2 + 'px';
        el.appendChild(r);
        setTimeout(() => r.remove(), 600);
      });
    });
  };

  // Custom cursor
  const customCursor = () => {
    if (window.matchMedia('(pointer: fine)').matches === false) return;
    const c = document.createElement('div');
    c.className = 'cursor';
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    c.appendChild(dot);
    document.body.appendChild(c);

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y; // target
    const speed = 0.18;
    const move = (e) => { tx = e.clientX; ty = e.clientY; };
    window.addEventListener('mousemove', move, { passive: true });
    const loop = () => {
      x += (tx - x) * speed; y += (ty - y) * speed;
      c.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(loop);
    };
    loop();

    const interactive = 'a, button, .btn, .card, [role="tab"], [data-accordion-button]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactive)) c.classList.add('cursor--active');
      else c.classList.remove('cursor--active');
    });
  };

  const ensureAriaCurrent = () => {
    const path = location.pathname.split('/').pop();
    $$('.nav a').forEach((a) => {
      if (!a.getAttribute('href')) return;
      const isCurrent = a.getAttribute('href') === path;
      if (isCurrent) a.setAttribute('aria-current', 'page');
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    fadeInBody();
    pageTransitions();
    initHeroParallax();
    revealOnScroll();
    initTheme();
    initMobileNav();
    scrollProgress();
    backToTop();
    tabs();
    accordions();
    modal();
    navPrefetch();
    enhanceImages();
    smoothAnchors();
    formValidation();
    ensureAriaCurrent();
    magnetic();
    ripples();
    customCursor();
  });
})();
