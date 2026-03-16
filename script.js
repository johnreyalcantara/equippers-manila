/**
 * Equippers Manila — Premium Splash Screen Animation
 *
 * ANIMATION TIMELINE:
 *   Page load → Logo outline appears instantly (thick white border, interior transparent)
 *   After 2s  → Step 1: Liquid fill rises inside logo via SVG mask (4 seconds)
 *   Instantly  → Step 2: Glow expansion + flash transition (one continuous animation)
 *               - Logo emits glow via drop-shadow
 *               - Radial glow expands outward from logo center
 *               - Glow fills entire screen → full white
 *               - Hold white briefly
 *               - Fade out to reveal landing page
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     CONFIGURATION
     ══════════════════════════════════════════════ */

  var TIMING = {
    initialDelay: 2000,  // Show outline for 2s before fill begins
    liquidFill: 4000,  // Step 1: liquid fill duration (4 seconds)
    glowExpansion: 200,  // Step 2a: glow starts + radial expansion (~850ms)
    whiteHold: 10,  // Step 2b: hold full white screen (~400ms)
    fadeToLanding: 500   // Step 2c: fade out white to reveal landing (~500ms)
  };

  // SVG viewBox dimensions
  var VB = 200;

  /*
   * Scale needed for the 120px glow circle to cover the full viewport.
   * Viewport diagonal ≈ 2200px on a 1920×1080 screen.
   * 2200 / 120 ≈ 18.3 — we use 25 for generous overshoot on all screen sizes.
   */
  var GLOW_MAX_SCALE = 25;

  /* ══════════════════════════════════════════════
     DOM REFERENCES
     ══════════════════════════════════════════════ */

  var splash = document.getElementById('splash');
  var landing = document.getElementById('landing');
  var svgEl = document.getElementById('splashSvg');
  var waterPath = document.getElementById('waterPath');
  var glowExpansion = document.getElementById('glowExpansion');

  /* ══════════════════════════════════════════════
     UTILITY FUNCTIONS
     ══════════════════════════════════════════════ */

  /** Promise-based delay */
  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /** Smooth cubic ease-in-out for premium feel */
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /** Accelerating ease-in (quad) for expansion buildup */
  function easeInQuad(t) {
    return t * t;
  }

  /**
   * Generate an SVG path string for the water shape.
   *
   * Creates a filled region from an animated wave surface down to the bottom.
   * Three overlapping sine waves at different frequencies and speeds
   * create an organic, fluid water surface that moves horizontally.
   *
   * @param {number} waterLevel - Y position of the water surface (0 = top, VB = bottom)
   * @param {number} time       - Elapsed time in seconds (drives horizontal wave motion)
   * @returns {string} SVG path `d` attribute
   */
  function generateWaterPath(waterLevel, time) {
    var w = VB + 40;
    var startX = -20;
    var steps = 60;
    var stepSize = w / steps;

    var d = 'M ' + startX + ',' + (VB + 20);
    d += ' L ' + startX + ',' + waterLevel;

    for (var i = 0; i <= steps; i++) {
      var x = startX + i * stepSize;
      var norm = i / steps;

      // Three sine waves for organic water motion
      var wave1 = Math.sin(norm * Math.PI * 3 + time * 3.0) * 5;
      var wave2 = Math.sin(norm * Math.PI * 5 - time * 2.2) * 2.5;
      var wave3 = Math.sin(norm * Math.PI * 7 + time * 1.5) * 1.2;

      var y = waterLevel + wave1 + wave2 + wave3;
      d += ' L ' + x.toFixed(1) + ',' + y.toFixed(1);
    }

    d += ' L ' + (startX + w) + ',' + (VB + 20);
    d += ' Z';
    return d;
  }

  /* ══════════════════════════════════════════════
     STEP 1 — LIQUID FILL ANIMATION (4 seconds)

     Water rises from below the logo to fully fill it.
     The SVG wave path is recalculated every frame.
     The water is clipped by the SVG <mask> referencing
     logo.png, so it only appears inside the logo shape.
     ══════════════════════════════════════════════ */

  function animateLiquidFill() {
    return new Promise(function (resolve) {
      var start = performance.now();
      var duration = TIMING.liquidFill;

      function frame(now) {
        var elapsed = now - start;
        var t = Math.min(elapsed / duration, 1);
        var eased = easeInOutCubic(t);
        var timeSec = elapsed / 1000;

        // Water level rises: starts below viewBox, ends above it
        var waterLevel = (VB + 20) - ((VB + 30) * eased);
        waterPath.setAttribute('d', generateWaterPath(waterLevel, timeSec));

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          // Ensure fully filled
          waterPath.setAttribute('d', 'M -20,-10 L 220,-10 L 220,220 L -20,220 Z');
          resolve();
        }
      }

      requestAnimationFrame(frame);
    });
  }

  /* ══════════════════════════════════════════════
     STEP 2 — GLOW EXPANSION + FLASH TRANSITION

     One continuous animation that flows seamlessly:

     Phase A — Glow Start (0% – 25% of expansion duration)
       The SVG logo emits a soft white drop-shadow glow.
       Simultaneously, the radial glow circle fades in at the
       logo center at a small scale, creating a bright point.

     Phase B — Radial Expansion (25% – 100% of expansion duration)
       The radial glow circle scales outward from the logo center.
       The drop-shadow on the SVG increases in intensity.
       As the circle grows, its opacity and the gradient fill
       make the screen progressively whiter.
       By the end, the circle is large enough to cover the
       entire viewport → full white screen.

     Phase C — White Hold (~400ms)
       The screen stays fully white. The SVG glow is cleared.

     Phase D — Fade to Landing (~500ms)
       The splash screen fades out (from white), revealing
       the landing page underneath.

     The result feels like:
     Logo → glow → expanding light → white flash → landing page
     ══════════════════════════════════════════════ */

  function animateGlowExpansion() {
    return new Promise(function (resolve) {
      var start = performance.now();
      var expansionDuration = TIMING.glowExpansion;

      function frame(now) {
        var elapsed = now - start;
        var t = Math.min(elapsed / expansionDuration, 1);

        /*
         * Phase A + B run together as one continuous rAF loop.
         *
         * Drop-shadow glow on SVG: ramps up as t increases.
         * Uses sine curve for a natural brightness swell.
         */
        var glowIntensity = Math.sin(t * Math.PI * 0.5); // 0 → 1 smoothly

        var blur1 = (glowIntensity * 35).toFixed(1);
        var alpha1 = (glowIntensity * 0.9).toFixed(2);
        var blur2 = (glowIntensity * 20).toFixed(1);
        var alpha2 = (glowIntensity * 0.5).toFixed(2);

        svgEl.style.filter =
          'drop-shadow(0 0 ' + blur1 + 'px rgba(255,255,255,' + alpha1 + ')) ' +
          'drop-shadow(0 0 ' + blur2 + 'px rgba(255,255,255,' + alpha2 + '))';

        /*
         * Radial glow expansion:
         * Opacity fades in quickly (first 30% of timeline),
         * then scale grows from 0.3 → GLOW_MAX_SCALE using easeInQuad
         * so the expansion accelerates outward (starts slow, then rushes).
         */
        var opacity = Math.min(t / 0.3, 1);
        var scaleT = easeInQuad(t);
        var scale = 0.3 + (GLOW_MAX_SCALE - 0.3) * scaleT;

        glowExpansion.style.opacity = opacity.toFixed(3);
        glowExpansion.style.transform = 'scale(' + scale.toFixed(2) + ')';

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          /*
           * Expansion complete — screen is now fully white.
           * Clean up the SVG glow filter.
           * Transition to Phase C (hold) and D (fade).
           */
          svgEl.style.filter = 'none';
          glowExpansion.style.opacity = '1';

          // Make the splash background white to ensure full coverage
          splash.style.background = '#ffffff';

          // Phase C: Hold white screen
          setTimeout(function () {

            // Phase D: Fade out splash to reveal landing page
            splash.style.transition = 'opacity ' + TIMING.fadeToLanding + 'ms cubic-bezier(0.4, 0, 0.2, 1)';
            splash.style.opacity = '0';
            landing.classList.add('visible');

            setTimeout(function () {
              splash.style.display = 'none';
              resolve();
            }, TIMING.fadeToLanding);

          }, TIMING.whiteHold);
        }
      }

      requestAnimationFrame(frame);
    });
  }

  /* ══════════════════════════════════════════════
     MAIN SEQUENCE
     ══════════════════════════════════════════════ */

  async function run() {
    try {
      // Cache and preload the logo to ensure SVG mask is ready
      var cachedLogo = new Image();
      cachedLogo.src = 'logo.png';
      await new Promise(function (resolve, reject) {
        cachedLogo.onload = resolve;
        cachedLogo.onerror = reject;
      });

      // Small delay to let the browser render the SVG mask + outline filter
      await wait(150);

      // Logo outline is already visible instantly via the SVG filter in HTML.
      // Wait 2 seconds so the user can see the outline before fill begins.
      await wait(TIMING.initialDelay);

      // Step 1: Liquid fill (4 seconds)
      await animateLiquidFill();

      // Step 2: Glow expansion → white flash → landing page (one continuous flow)
      await animateGlowExpansion();

    } catch (err) {
      // Graceful fallback: skip splash if anything fails
      console.warn('Splash animation error, skipping:', err);
      splash.style.display = 'none';
      landing.classList.add('visible');
    }
  }

  // Start animation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

})();

/* ══════════════════════════════════════════════
   CONNECT HUB — Scroll-triggered Animations

   Uses IntersectionObserver to detect when the
   Connect Hub section enters the viewport.
   - Header fades in first
   - Cards fade + slide up with stagger delays
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  function initHubAnimations() {
    var hubSection = document.getElementById('connectHub');
    if (!hubSection) return;

    var header = hubSection.querySelector('.hub-header');
    var cards = hubSection.querySelectorAll('.hub-card');

    // Observe the section entering the viewport
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        // Fade in the header first
        if (header) {
          header.classList.add('visible');
        }

        // Stagger-reveal each card with increasing delay
        cards.forEach(function (card, index) {
          var delay = 150 + index * 100; // 150ms base + 100ms per card
          card.style.transitionDelay = delay + 'ms';
          card.classList.add('visible');
        });

        // Stop observing after reveal
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.15  // Trigger when 15% of the section is visible
    });

    observer.observe(hubSection);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHubAnimations);
  } else {
    initHubAnimations();
  }
})();

/* ══════════════════════════════════════════════
   COMMUNITY SECTION — Public listing of Teams, Hubs, Groups

   Fetches data from the public API endpoints (no auth required).
   Tab buttons switch between teams, hubs, and groups.
   Cards show name, description, leader, and member count.
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  var communityGrid = document.getElementById('communityGrid');
  if (!communityGrid) return;

  var currentTab = 'teams';
  var endpoints = {
    teams: '/api/equip-teams',
    hubs: '/api/e-hubs',
    groups: '/api/e-groups'
  };

  // Tab click handlers
  var tabs = document.querySelectorAll('.community-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentTab = tab.getAttribute('data-tab');
      loadCommunity();
    });
  });

  function loadCommunity() {
    communityGrid.innerHTML = '<p style="color:var(--gray-400)">Loading...</p>';

    fetch(endpoints[currentTab])
      .then(function (res) { return res.json(); })
      .then(function (rows) {
        if (!rows || rows.length === 0) {
          communityGrid.innerHTML = '<p style="color:var(--gray-400)">Nothing here yet — check back soon!</p>';
          return;
        }

        communityGrid.innerHTML = rows.map(function (item) {
          var meetingInfo = item.meeting_day ? ' · ' + item.meeting_day : '';
          var locationInfo = item.meeting_location ? '<p style="font-size:0.8rem;color:var(--gray-400);margin-top:0.5rem;">📍 ' + item.meeting_location + '</p>' : '';

          return '<div class="community-card">' +
            '<h3>' + item.name + '</h3>' +
            '<div class="card-meta">Led by ' + item.leader_name + ' · ' + item.total_members + ' member' + (item.total_members !== 1 ? 's' : '') + meetingInfo + '</div>' +
            '<p class="card-desc">' + (item.description || 'No description.') + '</p>' +
            locationInfo +
          '</div>';
        }).join('');
      })
      .catch(function () {
        communityGrid.innerHTML = '<p style="color:var(--gray-400)">Failed to load. Please try again later.</p>';
      });
  }

  // Load on page ready
  function init() {
    loadCommunity();

    // Scroll-triggered fade-in
    var section = document.getElementById('community');
    if (section) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
            observer.unobserve(section);
          }
        });
      }, { threshold: 0.1 });
      section.style.opacity = '0';
      section.style.transform = 'translateY(30px)';
      section.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      observer.observe(section);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
