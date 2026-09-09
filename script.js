(function () {
  var unlocked = false;
  function forceUnlock() {
    if (unlocked) return;
    unlocked = true;
    document.documentElement.classList.remove('is-loading');
    document.documentElement.classList.remove('gsap-ready');
    var pre = document.getElementById('preloader');
    if (pre) pre.style.display = 'none';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
  window.addEventListener('load', function () { setTimeout(forceUnlock, 2500); });
  setTimeout(forceUnlock, 4000);
  window.__forceUnlock = forceUnlock;
})();

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineCursor = window.matchMedia('(pointer:fine)').matches;

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  document.documentElement.classList.add('is-loading');

  const clock = document.getElementById('clock');
  if (clock) {
    const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'; };
    tick(); setInterval(tick, 1000);
  }

  try {
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    if (menuToggle && mobileNav) {
      menuToggle.addEventListener('click', () => {
        const open = mobileNav.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', open);
      });
      mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', false);
      }));
    }
  } catch (e) { console.error(e); }

  const header = document.getElementById('siteHeader');
  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', updateHeaderState);

  try {
    const navLinks = document.getElementById('navLinks');
    const navAnchors = navLinks ? [...navLinks.querySelectorAll('a[data-section]')] : [];
    const sections = navAnchors.map(a => document.getElementById(a.dataset.section)).filter(Boolean);
    if (sections.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const link = navAnchors.find(a => a.dataset.section === entry.target.id);
          if (link && entry.isIntersecting) {
            navAnchors.forEach(a => a.classList.remove('active'));
            link.classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      sections.forEach(sec => io.observe(sec));
    }
    if (navLinks) {
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('mouseenter', () => navLinks.classList.add('hovering'));
        link.addEventListener('mouseleave', () => navLinks.classList.remove('hovering'));
      });
    }
  } catch (e) { console.error(e); }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const progressFill = document.getElementById('progressFill');
  function updateProgress() {
    if (!progressFill) return;
    const h = document.documentElement;
    const scrolled = h.scrollTop || document.body.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    progressFill.style.width = (max > 0 ? scrolled / max * 100 : 0) + '%';
  }
  window.addEventListener('scroll', () => { updateProgress(); updateHeaderState(); });

  try {
    if (fineCursor) {
      const cursor = document.querySelector('.cursor');
      const follower = document.querySelector('.cursor-follower');
      const cursorText = document.querySelector('.cursor-text');
      if (cursor && follower) {
        let mx = 0, my = 0, fx = 0, fy = 0;
        window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; });
        (function followLoop() { fx += (mx - fx) * 0.15; fy += (my - fy) * 0.15; follower.style.left = fx + 'px'; follower.style.top = fy + 'px'; requestAnimationFrame(followLoop); })();
        document.querySelectorAll('.hoverable').forEach(el => {
          el.addEventListener('mouseenter', () => follower.classList.add('active'));
          el.addEventListener('mouseleave', () => follower.classList.remove('active'));
        });
        document.querySelectorAll('[data-cursor]').forEach(el => {
          el.addEventListener('mouseenter', () => { if (cursorText) cursorText.textContent = el.dataset.cursor; follower.classList.add('label'); follower.classList.remove('active'); });
          el.addEventListener('mouseleave', () => { follower.classList.remove('label'); if (cursorText) cursorText.textContent = ''; });
        });
      }
    }
  } catch (e) { console.error(e); }

  /* ---------- 3D TILT (real perspective rotation, mouse-driven, smooth lerp) ---------- */
  try {
    function attachTilt(el, { max = 10, glare = false, scale = 1.03, ease = 0.12 } = {}) {
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, active = false;
      function loop() {
        cx += (tx - cx) * ease; cy += (ty - cy) * ease;
        el.style.transform = `perspective(1000px) rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg) scale3d(${scale},${scale},${scale})`;
        if (Math.abs(tx - cx) < 0.01 && Math.abs(ty - cy) < 0.01 && !active) { raf = null; return; }
        raf = requestAnimationFrame(loop);
      }
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        tx = (px - 0.5) * max * 2; ty = (0.5 - py) * max * 2;
        if (glare) { el.style.setProperty('--gx', (px * 100) + '%'); el.style.setProperty('--gy', (py * 100) + '%'); }
        active = true; if (!raf) loop();
      });
      el.addEventListener('mouseleave', () => {
        tx = 0; ty = 0; active = false;
        if (!raf) loop();
      });
    }
    function magnetize(el, strength = 0.25) {
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, active = false;
      function loop() {
        cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
        el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
        if (Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05 && !active) { raf = null; return; }
        raf = requestAnimationFrame(loop);
      }
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * strength;
        ty = (e.clientY - (r.top + r.height / 2)) * strength;
        active = true; if (!raf) loop();
      });
      el.addEventListener('mouseleave', () => { tx = 0; ty = 0; active = false; if (!raf) loop(); });
    }
    if (fineCursor && !reduceMotion) {
      document.querySelectorAll('.tilt').forEach(el => attachTilt(el, { max: 8, glare: true, scale: 1.025 }));
      document.querySelectorAll('.magnetic').forEach(el => magnetize(el, parseFloat(el.dataset.magnetStrength) || 0.25));
    }
  } catch (e) { console.error(e); }

  try {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    let lastFocused = null;
    function openLightbox(src, caption, altText) {
      lastFocused = document.activeElement;
      lightboxImg.src = src; lightboxImg.alt = altText || caption || 'Enlarged image';
      lightboxCaption.textContent = caption || '';
      lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden', 'false');
      lightboxClose.focus(); document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
      lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }
    if (lightbox && lightboxImg && lightboxClose) {
      document.querySelectorAll('[data-lightbox]').forEach(el => {
        el.addEventListener('click', () => {
          const img = el.querySelector('img');
          openLightbox(el.dataset.lightbox, el.dataset.caption, img ? img.alt : '');
        });
      });
      lightboxClose.addEventListener('click', closeLightbox);
      lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox(); });
    }
  } catch (e) { console.error(e); }

  function whenImageReady(imgEl, callback) {
    if (!imgEl) { callback(); return; }
    if (imgEl.complete && imgEl.naturalWidth > 0) { callback(); return; }
    imgEl.addEventListener('load', callback, { once: true });
    imgEl.addEventListener('error', callback, { once: true });
  }

  const preloader = document.getElementById('preloader');
  const preloadCount = document.getElementById('preloadCount');
  let count = 0;

  function initAnimations() {
    if (!window.gsap || !window.ScrollTrigger || reduceMotion) return;
    document.documentElement.classList.add('gsap-ready');
    gsap.registerPlugin(ScrollTrigger);

    const heroPhoto = document.getElementById('heroPhoto');
    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo('.hero-title .line', { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.1 })
      .fromTo('.reveal-word', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.12 }, '-=0.6')
      .fromTo('#heroPhotoMask', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power4.inOut' }, '-=1.0');

    whenImageReady(heroPhoto, () => {
      gsap.fromTo(heroPhoto, { scale: 1.15 }, { scale: 1.02, duration: 1.4, ease: 'power3.out' });
    });

    gsap.to('.hero-bg-text', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });

    const upTargets = gsap.utils.toArray('.reveal-up').filter(el => !el.closest('.hero'));
    ScrollTrigger.batch(upTargets, { start: 'top 88%', once: true, onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }) });

    gsap.utils.toArray('.from-left').forEach(el => gsap.to(el, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' } }));
    gsap.utils.toArray('.from-right').forEach(el => gsap.to(el, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' } }));

    gsap.utils.toArray('.work-visual').forEach(el => {
      gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power4.inOut', scrollTrigger: { trigger: el, start: 'top 82%' } });
      const inner = el.querySelector('.visual-inner');
      if (inner) {
        gsap.fromTo(inner, { scale: 1.2 }, { scale: 1, duration: 1.5, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' } });
        gsap.to(inner, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
      }
    });

    const aboutMask = document.getElementById('aboutPhotoMask');
    const aboutPhoto = document.getElementById('aboutPhoto');
    if (aboutMask) {
      gsap.fromTo(aboutMask, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power4.inOut', scrollTrigger: { trigger: aboutMask, start: 'top 82%' } });
      whenImageReady(aboutPhoto, () => {
        gsap.fromTo(aboutPhoto, { scale: 1.15 }, { scale: 1, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: aboutMask, start: 'top 82%' } });
      });
    }
    const accent = document.querySelector('.about-photo-accent');
    if (accent) gsap.fromTo(accent, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.about-photo-col', start: 'top 75%' } });

    const achMask = document.getElementById('achievementHeroMask');
    const achImg = document.querySelector('.achievement-hero-img');
    if (achMask) {
      gsap.fromTo(achMask, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power4.inOut', scrollTrigger: { trigger: achMask, start: 'top 82%' } });
      whenImageReady(achImg, () => {
        gsap.fromTo(achImg, { scale: 1.15 }, { scale: 1, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: achMask, start: 'top 82%' } });
      });
    }

    ScrollTrigger.batch('.gallery-item', { start: 'top 90%', once: true, onEnter: batch => gsap.fromTo(batch, { opacity: 0, y: 36, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'power3.out', stagger: 0.1 }) });

    ScrollTrigger.refresh();
  }

  function finishLoad() {
    if (window.gsap) {
      const master = gsap.timeline({ onComplete: () => { if (preloader) preloader.remove(); } });
      master
        .to('.preloader-text, .preloader-count', { opacity: 0, y: -12, duration: 0.4, ease: 'power2.in' })
        .to(preloader, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' }, '-=0.1')
        .add(() => {
          document.documentElement.classList.remove('is-loading');
          try { initAnimations(); } catch (err) { console.error(err); }
        }, '-=0.5');
    } else {
      document.documentElement.classList.remove('is-loading');
      if (preloader) preloader.remove();
    }
  }

  const loadInterval = setInterval(() => {
    count += Math.floor(Math.random() * 14) + 6;
    if (preloadCount) preloadCount.textContent = Math.min(count, 100);
    if (count >= 100) { clearInterval(loadInterval); finishLoad(); }
  }, 80);

  window.addEventListener('resize', () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
});