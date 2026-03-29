(() => {
  'use strict';

  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

  if (!ctx) {
    throw new Error('2D canvas not available');
  }

  const isMobile =
    matchMedia('(max-width: 900px)').matches ||
    /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  const cfg = {
    fpsTarget: isMobile ? 30 : 45,
    maxDpr: isMobile ? 1.6 : 2,
    adaptiveQuality: true,
    renderScale: isMobile ? 0.92 : 1,
    minScale: isMobile ? 0.64 : 0.74,
    maxScale: 1,
    budgetMs: isMobile ? 11.5 : 9.5,
    qualitySteps: [1, 0.92, 0.84, 0.76, 0.68, 0.62],
    particlesBase: isMobile ? 70 : 110,
    particlesMin: isMobile ? 36 : 56
  };

  const state = {
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    stemHeight: 0,
    bloomRadius: 0,
    dpr: 1,
    pixelRatio: 1,
    paused: false,
    lastFrame: 0,
    fpsInterval: 1000 / cfg.fpsTarget,
    overBudgetStreak: 0,
    underBudgetStreak: 0,
    qualityIdx: 0
  };

  let glowSprite = null;
  let petalSprite = null;
  let coreSprite = null;

  function makeGlowSprite(size = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');

    const r = size * 0.5;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, 'rgba(255, 92, 95, 0.34)');
    grad.addColorStop(0.36, 'rgba(255, 36, 40, 0.2)');
    grad.addColorStop(0.75, 'rgba(180, 20, 28, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  function makePetalSprite(w = 180, h = 42) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');

    g.translate(8, h * 0.5);

    const path = new Path2D();
    path.moveTo(0, 0);

    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = t * (w - 12);
      const wave = Math.sin(t * Math.PI * 1.2) * 4.2;
      const y = -Math.pow(t, 0.75) * 14 - wave;
      path.lineTo(x, y);
    }

    for (let i = 14; i >= 0; i--) {
      const t = i / 14;
      const x = t * (w - 12);
      const wave = Math.sin(t * Math.PI * 1.15 + 0.55) * 4.2;
      const y = Math.pow(t, 0.82) * 13 + wave;
      path.lineTo(x, y);
    }

    path.closePath();

    const grad = g.createLinearGradient(0, -18, w, 14);
    grad.addColorStop(0, 'rgba(255, 140, 154, 0.9)');
    grad.addColorStop(0.28, 'rgba(255, 70, 84, 0.92)');
    grad.addColorStop(0.72, 'rgba(188, 20, 35, 0.94)');
    grad.addColorStop(1, 'rgba(105, 10, 21, 0.95)');

    g.fillStyle = grad;
    g.fill(path);

    g.strokeStyle = 'rgba(255, 192, 204, 0.32)';
    g.lineWidth = 1.2;
    g.stroke(path);

    return c;
  }

  function makeCoreSprite(size = 120) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');

    const r = size * 0.5;
    const grad = g.createRadialGradient(r, r, 1, r, r, r);
    grad.addColorStop(0, 'rgba(255, 190, 194, 0.95)');
    grad.addColorStop(0.2, 'rgba(255, 75, 86, 0.85)');
    grad.addColorStop(0.6, 'rgba(180, 22, 36, 0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    g.fillStyle = grad;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();

    return c;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);
    state.dpr = dpr;
    state.pixelRatio = dpr * cfg.renderScale;

    const w = Math.max(1, Math.floor(innerWidth * state.pixelRatio));
    const h = Math.max(1, Math.floor(innerHeight * state.pixelRatio));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(state.pixelRatio, state.pixelRatio);

    state.width = innerWidth;
    state.height = innerHeight;
    state.centerX = state.width * 0.5;
    state.centerY = state.height * 0.56;
    state.stemHeight = Math.min(state.height * 0.35, 300);
    state.bloomRadius = Math.min(state.width, state.height) * 0.155;
  }

  function drawBackground(t) {
    const w = state.width;
    const h = state.height;

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#050507');
    bg.addColorStop(0.45, '#0c070a');
    bg.addColorStop(1, '#040406');

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const drift = Math.sin(t * 0.0002) * 0.5 + 0.5;
    const vignetteY = h * (0.3 + drift * 0.06);

    const vignette = ctx.createRadialGradient(
      state.centerX,
      vignetteY,
      h * 0.1,
      state.centerX,
      vignetteY,
      h * 0.9
    );
    vignette.addColorStop(0, 'rgba(85, 12, 16, 0.18)');
    vignette.addColorStop(0.42, 'rgba(26, 8, 10, 0.12)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.64)');

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function drawStem() {
    const x = state.centerX;
    const y0 = state.centerY + state.bloomRadius * 0.1;
    const y1 = y0 + state.stemHeight;

    const grad = ctx.createLinearGradient(x, y0, x, y1);
    grad.addColorStop(0, 'rgba(58, 132, 70, 0.58)');
    grad.addColorStop(1, 'rgba(24, 56, 33, 0.8)');

    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2.2, state.bloomRadius * 0.07);

    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + state.bloomRadius * 0.05, (y0 + y1) * 0.5, x - state.bloomRadius * 0.02, y1);
    ctx.stroke();
  }

  function drawPetals(t) {
    const basePetals = 14;
    const layers = 2;
    const pulse = 1 + Math.sin(t * 0.00125) * 0.035;
    const r = state.bloomRadius;

    ctx.save();
    ctx.translate(state.centerX, state.centerY);
    ctx.globalCompositeOperation = 'lighter';

    for (let layer = 0; layer < layers; layer++) {
      const layerScale = layer === 0 ? 1 : 0.78;
      const layerRot = layer * (Math.PI / basePetals);
      const alpha = layer === 0 ? 0.88 : 0.6;

      for (let i = 0; i < basePetals; i++) {
        const a = (i / basePetals) * Math.PI * 2 + layerRot;
        const sway = Math.sin(t * 0.001 + i * 0.7 + layer * 1.6) * 0.08;
        const radial = r * layerScale * (1 + Math.sin(t * 0.0015 + i) * 0.04);

        ctx.save();
        ctx.rotate(a + sway);
        ctx.translate(radial * 0.25, 0);
        const lengthScale = pulse * (1 + Math.sin(i * 0.63 + t * 0.0009) * 0.04);
        ctx.scale((r / 120) * lengthScale, (r / 135) * (1 + layer * 0.08));
        ctx.globalAlpha = alpha;
        ctx.drawImage(petalSprite, 0, -petalSprite.height * 0.5);
        ctx.restore();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function drawFilaments(t) {
    const n = Math.max(cfg.particlesMin, Math.round(cfg.particlesBase * cfg.qualitySteps[state.qualityIdx]));
    const r = state.bloomRadius;

    ctx.save();
    ctx.translate(state.centerX, state.centerY);
    ctx.lineCap = 'round';

    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wiggle = Math.sin(t * 0.0017 + i * 1.3) * 0.25;
      const len = r * (0.58 + (i % 7) * 0.038);

      const c1x = Math.cos(a + wiggle) * len * 0.4;
      const c1y = Math.sin(a + wiggle) * len * 0.4;
      const ex = Math.cos(a + wiggle * 1.5) * len;
      const ey = Math.sin(a + wiggle * 1.5) * len;

      ctx.strokeStyle = i % 3 === 0 ? 'rgba(255, 136, 146, 0.58)' : 'rgba(244, 48, 66, 0.42)';
      ctx.lineWidth = i % 2 ? 1 : 1.4;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(c1x, c1y, ex, ey);
      ctx.stroke();

      if ((i & 3) === 0) {
        ctx.fillStyle = 'rgba(255, 164, 174, 0.76)';
        ctx.beginPath();
        ctx.arc(ex, ey, 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawCore(t) {
    const s = state.bloomRadius * (1.24 + Math.sin(t * 0.0014) * 0.03);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.72;
    ctx.drawImage(glowSprite, state.centerX - s, state.centerY - s, s * 2, s * 2);
    ctx.globalAlpha = 0.9;

    const c = state.bloomRadius * 0.45;
    ctx.drawImage(coreSprite, state.centerX - c, state.centerY - c, c * 2, c * 2);

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function adjustQuality(frameMs) {
    if (!cfg.adaptiveQuality) return;

    if (frameMs > cfg.budgetMs) {
      state.overBudgetStreak += 1;
      state.underBudgetStreak = 0;
    } else {
      state.underBudgetStreak += 1;
      state.overBudgetStreak = Math.max(0, state.overBudgetStreak - 1);
    }

    if (state.overBudgetStreak > 6) {
      state.overBudgetStreak = 0;
      if (state.qualityIdx < cfg.qualitySteps.length - 1) {
        state.qualityIdx += 1;
      } else if (cfg.renderScale > cfg.minScale + 0.001) {
        cfg.renderScale = Math.max(cfg.minScale, cfg.renderScale - 0.06);
        resize();
      }
    }

    if (state.underBudgetStreak > 26) {
      state.underBudgetStreak = 0;
      if (state.qualityIdx > 0) {
        state.qualityIdx -= 1;
      } else if (cfg.renderScale < cfg.maxScale - 0.001) {
        cfg.renderScale = Math.min(cfg.maxScale, cfg.renderScale + 0.04);
        resize();
      }
    }
  }

  function render(now) {
    if (state.paused) {
      requestAnimationFrame(render);
      return;
    }

    const delta = now - state.lastFrame;
    if (delta < state.fpsInterval) {
      requestAnimationFrame(render);
      return;
    }

    const t0 = performance.now();

    state.lastFrame = now - (delta % state.fpsInterval);

    drawBackground(now);
    drawStem();
    drawPetals(now);
    drawFilaments(now);
    drawCore(now);

    const frameMs = performance.now() - t0;
    adjustQuality(frameMs);

    requestAnimationFrame(render);
  }

  function togglePause() {
    state.paused = !state.paused;
    if (!state.paused) {
      state.lastFrame = performance.now();
    }
  }

  glowSprite = makeGlowSprite(256);
  petalSprite = makePetalSprite(180, 42);
  coreSprite = makeCoreSprite(120);

  resize();
  state.lastFrame = performance.now();
  requestAnimationFrame(render);

  addEventListener('resize', resize, { passive: true });
  addEventListener('orientationchange', () => setTimeout(resize, 120), { passive: true });
  addEventListener('pointerdown', togglePause, { passive: true });
})();
