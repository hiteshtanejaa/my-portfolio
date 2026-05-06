/* =============================================================
   HITESH TANEJA — Scroll-Driven Portfolio Experience
   Lenis + GSAP + ScrollTrigger + Neural Network Canvas
   ============================================================= */

"use strict";

// ─── DARK OVERLAY TIMING (0–1) ────────────────────────────────
const OVERLAY_ENTER = 0.48;   /* matches data-enter="48" */
const OVERLAY_LEAVE = 0.63;   /* matches data-leave="63" */
const OVERLAY_FADE  = 0.04;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* =============================================================
   NEURAL NETWORK CANVAS
   Replaces video frames — continuous animated background
   that evolves with scroll progress (0 = sparse, 1 = dense)
   ============================================================= */
class NeuralNetwork {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext("2d");
    this.nodes   = [];
    this.COUNT   = 90;
    this.MAX_DIST = 165;
    this.scroll  = 0;   // 0–1, updated by scroll
    this.raf     = null;
    this.dpr     = window.devicePixelRatio || 1;
    this.W = window.innerWidth;
    this.H = window.innerHeight;

    this._resize  = this.resize.bind(this);
    window.addEventListener("resize", this._resize);

    this.resize();
    this.spawn();
    this.tick();
  }

  resize() {
    this.dpr      = window.devicePixelRatio || 1;
    this.W        = window.innerWidth;
    this.H        = window.innerHeight;
    this.canvas.width  = this.W * this.dpr;
    this.canvas.height = this.H * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  spawn() {
    this.nodes = [];
    for (let i = 0; i < this.COUNT; i++) {
      this.nodes.push({
        x:     Math.random() * this.W,
        y:     Math.random() * this.H,
        vx:    (Math.random() - 0.5) * 0.45,
        vy:    (Math.random() - 0.5) * 0.45,
        size:  Math.random() * 1.4 + 0.7,
        phase: Math.random() * Math.PI * 2,   // for pulse offset
      });
    }
  }

  update() {
    /* Speed increases gently with scroll progress */
    const spd = 0.7 + this.scroll * 1.8;

    for (const n of this.nodes) {
      n.x += n.vx * spd;
      n.y += n.vy * spd;
      n.phase += 0.018;

      /* Seamless wrap */
      if (n.x < -20)       n.x = this.W + 20;
      if (n.x > this.W + 20) n.x = -20;
      if (n.y < -20)       n.y = this.H + 20;
      if (n.y > this.H + 20) n.y = -20;
    }
  }

  draw() {
    const { ctx, W, H, nodes, MAX_DIST, scroll } = this;

    /* Clear with bg colour */
    ctx.fillStyle = "#080c16";
    ctx.fillRect(0, 0, W, H);

    /* -- connections ----------------------------------------- */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a  = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d  = Math.sqrt(dx * dx + dy * dy);

        if (d >= MAX_DIST) continue;

        /* Connections grow denser with scroll */
        const proximity = 1 - d / MAX_DIST;
        const alpha = proximity * proximity * (0.25 + scroll * 0.5);

        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `rgba(0,212,255,${alpha})`);
        grad.addColorStop(1, `rgba(124,58,237,${alpha})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth   = 0.4 + proximity * 0.7;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    /* -- nodes ----------------------------------------------- */
    for (const n of nodes) {
      const pulse = 0.5 + Math.sin(n.phase) * 0.5;           // 0–1
      const size  = n.size * (1 + pulse * 0.5);
      const alpha = 0.3 + pulse * 0.35 + scroll * 0.35;

      /* Glow */
      ctx.shadowBlur  = 10 + pulse * 10;
      ctx.shadowColor = `rgba(0,212,255,${0.5 + scroll * 0.4})`;

      /* Alternate cyan / purple based on node index */
      const isCyan = (n.phase < Math.PI);
      ctx.fillStyle = isCyan
        ? `rgba(0,212,255,${alpha})`
        : `rgba(167,139,250,${alpha * 0.9})`;

      ctx.beginPath();
      ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    /* -- ambient glow blobs in background -------------------- */
    const drawBlob = (x, y, r, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    drawBlob(W * 0.15, H * 0.25, 320, `rgba(0,212,255,${0.03 + scroll * 0.05})`);
    drawBlob(W * 0.85, H * 0.75, 400, `rgba(124,58,237,${0.03 + scroll * 0.04})`);
    drawBlob(W * 0.5,  H * 0.5,  250, `rgba(0,212,255,${0.02 + scroll * 0.03})`);
  }

  tick() {
    this.update();
    this.draw();
    this.raf = requestAnimationFrame(() => this.tick());
  }

  setScroll(p) { this.scroll = p; }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this._resize);
  }
}

/* =============================================================
   LOADER  (short branded loader — no frames to wait for)
   ============================================================= */
function runLoader() {
  return new Promise((resolve) => {
    const fill    = document.getElementById("loader-bar-fill");
    const percent = document.getElementById("loader-percent");
    const DURATION = 1600; // ms
    const start    = performance.now();

    const LABELS = [
      "Initialising",
      "Loading modules",
      "Connecting nodes",
      "Calibrating AI",
      "Ready",
    ];

    function step(now) {
      const p    = clamp((now - start) / DURATION, 0, 1);
      const pct  = Math.round(p * 100);
      fill.style.width   = pct + "%";
      percent.textContent = LABELS[Math.floor(p * (LABELS.length - 1))];

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

/* =============================================================
   LENIS SMOOTH SCROLL
   ============================================================= */
function initLenis() {
  const lenis = new Lenis({
    duration:    1.2,
    easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

/* =============================================================
   CIRCLE-WIPE HERO REVEAL  +  Neural network scroll binding
   ============================================================= */
function initHeroTransition(neural) {
  const hero      = document.getElementById("hero-section");
  const canvasWrap = document.getElementById("canvas-wrap");

  ScrollTrigger.create({
    trigger: "#scroll-container",
    start:   "top top",
    end:     "bottom bottom",
    scrub:   true,
    onUpdate(self) {
      const p = self.progress;

      /* Hero fades out as scroll begins */
      hero.style.opacity = String(Math.max(0, 1 - p * 20));

      /* Canvas circle-wipe reveal (0 → 75%) */
      const wipe   = clamp((p - 0.01) / 0.07, 0, 1);
      canvasWrap.style.clipPath = `circle(${wipe * 75}% at 50% 50%)`;

      /* Feed scroll progress to neural network */
      neural.setScroll(p);
    },
  });
}

/* =============================================================
   DARK OVERLAY  (stats section)
   ============================================================= */
function initDarkOverlay() {
  const overlay = document.getElementById("dark-overlay");

  ScrollTrigger.create({
    trigger: "#scroll-container",
    start:   "top top",
    end:     "bottom bottom",
    scrub:   true,
    onUpdate(self) {
      const p = self.progress;
      let o = 0;

      if (p >= OVERLAY_ENTER - OVERLAY_FADE && p <= OVERLAY_ENTER) {
        o = (p - (OVERLAY_ENTER - OVERLAY_FADE)) / OVERLAY_FADE;
      } else if (p > OVERLAY_ENTER && p < OVERLAY_LEAVE) {
        o = 0.96;
      } else if (p >= OVERLAY_LEAVE && p <= OVERLAY_LEAVE + OVERLAY_FADE) {
        o = 0.91 * (1 - (p - OVERLAY_LEAVE) / OVERLAY_FADE);
      }

      overlay.style.opacity = String(o);
    },
  });
}

/* =============================================================
   HORIZONTAL MARQUEES
   ============================================================= */
function initMarquees() {
  document.querySelectorAll(".marquee-wrap").forEach((wrap) => {
    const speed = parseFloat(wrap.dataset.scrollSpeed) || -25;
    const text  = wrap.querySelector(".marquee-text");
    const isM1  = wrap.id === "marquee-1";

    /* Slide on scroll */
    gsap.to(text, {
      xPercent: speed,
      ease:     "none",
      scrollTrigger: {
        trigger: "#scroll-container",
        start:   "top top",
        end:     "bottom bottom",
        scrub:   true,
      },
    });

    /* Fade in / out based on scroll range */
    const visStart = isM1 ? 0.10 : 0.08;
    const visEnd   = isM1 ? 0.84 : 0.92;
    const fade     = 0.04;

    ScrollTrigger.create({
      trigger: "#scroll-container",
      start:   "top top",
      end:     "bottom bottom",
      scrub:   true,
      onUpdate(self) {
        const p = self.progress;
        let o = 0;

        if (p >= visStart && p < visStart + fade) {
          o = (p - visStart) / fade;
        } else if (p >= visStart + fade && p < visEnd - fade) {
          o = 1;
        } else if (p >= visEnd - fade && p <= visEnd) {
          o = 1 - (p - (visEnd - fade)) / fade;
        }

        wrap.style.opacity = String(o);
      },
    });
  });
}

/* =============================================================
   SECTION ANIMATION SYSTEM  (6 types, no consecutive repeats)
   ============================================================= */
function buildTimeline(section, type) {
  const children = section.querySelectorAll(
    ".section-label, .section-heading, .section-body, .section-note, .cta-button, .cta-link, .stat"
  );

  const tl = gsap.timeline({ paused: true });

  switch (type) {
    case "slide-left":
      gsap.set(children, { x: -90, opacity: 0 });
      tl.to(children, { x: 0, opacity: 1, stagger: 0.14, duration: 0.9, ease: "power3.out" });
      break;

    case "slide-right":
      gsap.set(children, { x: 90, opacity: 0 });
      tl.to(children, { x: 0, opacity: 1, stagger: 0.14, duration: 0.9, ease: "power3.out" });
      break;

    case "scale-up":
      gsap.set(children, { scale: 0.82, opacity: 0 });
      tl.to(children, { scale: 1, opacity: 1, stagger: 0.12, duration: 1.0, ease: "power2.out" });
      break;

    case "stagger-up":
      gsap.set(children, { y: 60, opacity: 0 });
      tl.to(children, { y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: "power3.out" });
      break;

    case "clip-reveal":
      gsap.set(children, { clipPath: "inset(100% 0 0 0)", opacity: 0 });
      tl.to(children, {
        clipPath: "inset(0% 0 0 0)",
        opacity:  1,
        stagger:  0.15,
        duration: 1.2,
        ease:     "power4.inOut",
      });
      break;

    case "rotate-in":
      gsap.set(children, { y: 40, rotation: 2.5, opacity: 0 });
      tl.to(children, { y: 0, rotation: 0, opacity: 1, stagger: 0.1, duration: 0.9, ease: "power3.out" });
      break;

    default:
      gsap.set(children, { y: 50, opacity: 0 });
      tl.to(children, { y: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease: "power3.out" });
  }

  return tl;
}

function initSectionAnimations() {
  document.querySelectorAll(".scroll-section").forEach((section) => {
    const type    = section.dataset.animation;
    const persist = section.dataset.persist === "true";
    const enter   = parseFloat(section.dataset.enter) / 100;
    const leave   = parseFloat(section.dataset.leave) / 100;

    const tl        = buildTimeline(section, type);
    let   hasPlayed = false;

    ScrollTrigger.create({
      trigger: "#scroll-container",
      start:   "top top",
      end:     "bottom bottom",
      onUpdate(self) {
        const p        = self.progress;
        const inRange  = p >= enter && p < leave;
        const past     = p >= leave;

        if (inRange) {
          section.style.visibility = "visible";
          section.classList.add("is-active");
          if (!hasPlayed) { hasPlayed = true; tl.play(); }
        } else if (persist && hasPlayed && past) {
          section.style.visibility = "visible";
          section.classList.add("is-active");
        } else {
          section.style.visibility = "hidden";
          section.classList.remove("is-active");
          if (!persist && p < enter) { hasPlayed = false; tl.pause(0); }
        }
      },
    });
  });
}

/* =============================================================
   COUNTER ANIMATIONS
   ============================================================= */
function initCounters() {
  document.querySelectorAll(".stat-number").forEach((el) => {
    const target   = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || "0");

    ScrollTrigger.create({
      trigger: el.closest(".scroll-section"),
      start:   "top 80%",
      once:    true,
      onEnter() {
        gsap.fromTo(
          el,
          { textContent: 0 },
          {
            textContent: target,
            duration:    2.4,
            ease:        "power1.out",
            snap:        { textContent: decimals === 0 ? 1 : 0.1 },
            onUpdate()  { el.textContent = parseFloat(el.textContent).toFixed(decimals); },
          }
        );
      },
    });
  });
}

/* =============================================================
   HERO ENTRANCE ANIMATION  (after loader)
   ============================================================= */
function animateHeroIn() {
  const tl = gsap.timeline({ delay: 0.1 });

  tl.from(".site-header", { y: -20, opacity: 0, duration: 0.7, ease: "power2.out" });

  tl.from(".hero-label",  { y: 14, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.3");

  tl.from(".hero-heading .word", {
    y: 120, opacity: 0,
    stagger:  0.18,
    duration: 1.2,
    ease:     "power4.out",
  }, "-=0.2");

  tl.from(".hero-tagline", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.5");

  tl.from(".scroll-indicator", { opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.3");
}

/* =============================================================
   INIT
   ============================================================= */
async function init() {
  gsap.registerPlugin(ScrollTrigger);

  /* Start neural network immediately (canvas is hidden by clip-path) */
  const canvasEl = document.getElementById("canvas");
  const neural   = new NeuralNetwork(canvasEl);

  /* Run branded loader */
  await runLoader();
  await new Promise((r) => setTimeout(r, 300));

  /* Hide loader */
  document.getElementById("loader").classList.add("hidden");

  /* Boot experience */
  initLenis();
  initHeroTransition(neural);
  initDarkOverlay();
  initMarquees();
  initSectionAnimations();
  initCounters();
  animateHeroIn();
}

document.addEventListener("DOMContentLoaded", init);
