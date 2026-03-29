(() => {
  'use strict';

  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

  if (!ctx) throw new Error('2D canvas not available');

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
    particlesMin: isMobile ? 36 : 56,
    scaleCooldownMs: 4200
  };

  const scene = {
    petalLayers: 2,
    petalsPerLayer: 14,
    bloomRadiusFactor: 0.155,
    stemHeightFactor: 0.35
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
    qualityIdx: 0,
    lastScaleChangeAt: 0
  };

  let glowSprite = null;
  let petalSprite = null;
  let coreSprite = null;
  let tipSprite = null;
  let backgroundLayer = null;

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function makeGlowSprite(size = 256) {
    const c = makeCanvas(size, size);
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
    const c = makeCanvas(w, h);
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
    const c = makeCanvas(size, size);
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

  function makeTipSprite(size = 18) {
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');
    const r = size * 0.5;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, 'rgba(255, 214, 220, 0.95)');
    grad.addColorStop(0.22, 'rgba(255, 162, 174, 0.82)');
    grad.addColorStop(0.56, 'rgba(255, 108, 126, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  function buildBackgroundLayer() {
    const bg = makeCanvas(Math.max(1, Math.floor(state.width * state.pixelRatio)), Math.max(1, Math.floor(state.height * state.pixelRatio)));
    const g = bg.getContext('2d');
    g.scale(state.pixelRatio, state.pixelRatio);

    const base = g.createLinearGradient(0, 0, 0, state.height);
    base.addColorStop(0, '#050507');
    base.addColorStop(0.45, '#0c070a');
    base.addColorStop(1, '#040406');
    g.fillStyle = base;
    g.fillRect(0, 0, state.width, state.height);

    const vignette = g.createRadialGradient(
      state.centerX,
      state.height * 0.34,
      state.height * 0.1,
      state.centerX,
      state.height * 0.34,
      state.height * 0.9
    );
    vignette.addColorStop(0, 'rgba(85, 12, 16, 0.14)');
    vignette.addColorStop(0.42, 'rgba(26, 8, 10, 0.1)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.64)');
    g.fillStyle = vignette;
    g.fillRect(0, 0, state.width, state.height);

    backgroundLayer = bg;
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
    state.stemHeight = Math.min(state.height * scene.stemHeightFactor, 300);
    state.bloomRadius = Math.min(state.width, state.height) * scene.bloomRadiusFactor;

    buildBackgroundLayer();
  }

  function drawBackground(t) {
    ctx.drawImage(backgroundLayer, 0, 0, backgroundLayer.width, backgroundLayer.height, 0, 0, state.width, state.height);

    const drift = Math.sin(t * 0.0002) * 0.5 + 0.5;
    const hazeAlpha = 0.03 + drift * 0.03;
    const hazeY = state.height * (0.28 + drift * 0.08);
    const haze = ctx.createRadialGradient(
      state.centerX,
      hazeY,
      state.height * 0.08,
      state.centerX,
      hazeY,
      state.height * 0.55
    );
    haze.addColorStop(0, `rgba(110, 16, 28, ${hazeAlpha})`);
    haze.addColorStop(0.45, `rgba(34, 10, 14, ${hazeAlpha * 0.55})`);
    haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, state.width, state.height);
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
    const pulse = 1 + Math.sin(t * 0.00125) * 0.035;
    const r = state.bloomRadius;

    ctx.save();
    ctx.translate(state.centerX, state.centerY);
    ctx.globalCompositeOperation = 'lighter';

    for (let layer = 0; layer < scene.petalLayers; layer++) {
      const layerScale = layer === 0 ? 1 : 0.78;
      const layerRot = layer * (Math.PI / scene.petalsPerLayer);
      const alpha = layer === 0 ? 0.88 : 0.6;

      for (let i = 0; i < scene.petalsPerLayer; i++) {
        const a = (i / scene.petalsPerLayer) * Math.PI * 2 + layerRot;
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
        const s = i % 5 === 0 ? 9 : 7;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(tipSprite, ex - s * 0.5, ey - s * 0.5, s, s);
      }
    }

    ctx.globalAlpha = 1;
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

  function maybeChangeScale(nextScale, now) {
    if (now - state.lastScaleChangeAt < cfg.scaleCooldownMs) return false;
    if (Math.abs(nextScale - cfg.renderScale) < 0.001) return false;
    cfg.renderScale = nextScale;
    state.lastScaleChangeAt = now;
    resize();
    return true;
  }

  function adjustQuality(frameMs, now) {
    if (!cfg.adaptiveQuality) return;

    if (frameMs > cfg.budgetMs) {
      state.overBudgetStreak += 1;
      state.underBudgetStreak = 0;
    } else if (frameMs < cfg.budgetMs * 0.78) {
      state.underBudgetStreak += 1;
      state.overBudgetStreak = Math.max(0, state.overBudgetStreak - 1);
    } else {
      state.underBudgetStreak = Math.max(0, state.underBudgetStreak - 1);
      state.overBudgetStreak = Math.max(0, state.overBudgetStreak - 1);
    }

    if (state.overBudgetStreak > 8) {
      state.overBudgetStreak = 0;
      if (state.qualityIdx < cfg.qualitySteps.length - 1) {
        state.qualityIdx += 1;
      } else {
        maybeChangeScale(Math.max(cfg.minScale, cfg.renderScale - 0.05), now);
      }
    }

    if (state.underBudgetStreak > 40) {
      state.underBudgetStreak = 0;
      if (state.qualityIdx > 0) {
        state.qualityIdx -= 1;
      } else {
        maybeChangeScale(Math.min(cfg.maxScale, cfg.renderScale + 0.03), now);
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
    adjustQuality(frameMs, now);
    requestAnimationFrame(render);
  }

  function togglePause() {
    state.paused = !state.paused;
    if (!state.paused) state.lastFrame = performance.now();
  }

  glowSprite = makeGlowSprite(256);
  petalSprite = makePetalSprite(180, 42);
  coreSprite = makeCoreSprite(120);
  tipSprite = makeTipSprite(18);

  resize();
  state.lastFrame = performance.now();
  requestAnimationFrame(render);

  addEventListener('resize', resize, { passive: true });
  addEventListener('orientationchange', () => setTimeout(resize, 120), { passive: true });
  addEventListener('pointerdown', togglePause, { passive: true });
})();
