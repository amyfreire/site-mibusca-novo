(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('header');
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  var yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Hero intro: reveal once on load ---------- */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.documentElement.classList.add('loaded');
    });
  });

  /* ---------- Custom cursor: dot + trailing ring, magnetic on hover ---------- */
  (function initCursor() {
    if (prefersReduced || !window.matchMedia('(pointer: fine)').matches) return;
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;

    document.body.classList.add('has-custom-cursor');
    var mx = -999, my = -999, rx = -999, ry = -999;
    var started = false;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      if (!started) { rx = mx; ry = my; started = true; }
    }, { passive: true });

    function ringLoop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(ringLoop);
    }
    requestAnimationFrame(ringLoop);

    var hoverTargets = 'a, button, .btn, .service-card, .pillar, .testimonial-card, .faq-item, summary, input, textarea';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hoverTargets)) ring.classList.add('is-hovering');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hoverTargets)) ring.classList.remove('is-hovering');
    });
  })();

  /* ---------- Magnetic buttons ---------- */
  if (!prefersReduced && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.style.transition = 'transform .3s ' + 'cubic-bezier(0.16,1,0.3,1)';
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = 'translate(' + (dx * 0.22).toFixed(1) + 'px,' + (dy * 0.35).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ---------- Header shrink/blur on scroll ---------- */
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Living background: continuous scroll drift ---------- */
  var root = document.documentElement;
  if (!prefersReduced) {
    var bgTicking = false;
    var updateScrollVar = function () {
      root.style.setProperty('--scroll-y', window.scrollY);
      bgTicking = false;
    };
    document.addEventListener('scroll', function () {
      if (!bgTicking) {
        requestAnimationFrame(updateScrollVar);
        bgTicking = true;
      }
    }, { passive: true });
    updateScrollVar();
  }

  /* ---------- Living background: per-section theme swap ---------- */
  var themedSections = document.querySelectorAll('main section[id], .hero[id]');
  if (themedSections.length && 'IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          root.setAttribute('data-section', entry.target.id);
        }
      });
    }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });
    themedSections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Mobile nav toggle ---------- */
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    // stagger children inside grids for a nicer cascade
    document.querySelectorAll('.bento, .process__steps, .stat-strip, .faq__list').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        if (child.classList.contains('reveal')) {
          child.style.setProperty('--reveal-delay', Math.min(i * 0.08, 0.4) + 's');
        }
      });
    });

    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1500;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      var value = target * eased;
      var display = Number.isInteger(target) ? Math.round(value) : value.toFixed(1);
      el.textContent = display + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    if (prefersReduced) {
      el.textContent = target + suffix;
    } else {
      requestAnimationFrame(step);
    }
  }

  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Chat demo: sequential message reveal ---------- */
  var chatBody = document.getElementById('chatBody');
  if (chatBody) {
    var messages = chatBody.querySelectorAll('.chat-msg');
    var chatObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          messages.forEach(function (msg) {
            var delay = parseFloat(msg.getAttribute('data-delay')) || 0;
            setTimeout(function () {
              msg.classList.add('in-view');
              chatBody.scrollTop = chatBody.scrollHeight;
            }, prefersReduced ? 0 : delay * 550);
          });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    chatObserver.observe(chatBody);
  }

  /* ---------- Hero parallax blobs ---------- */
  var blobs = document.querySelectorAll('.blob');
  if (blobs.length && !prefersReduced) {
    var ticking = false;
    document.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          var y = window.scrollY;
          blobs.forEach(function (blob, i) {
            var factor = i === 0 ? 0.12 : -0.08;
            blob.style.transform = 'translateY(' + (y * factor) + 'px)';
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------- Smooth scroll offset for sticky header on hash links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var headerH = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
      history.pushState(null, '', id);
    });
  });
})();
