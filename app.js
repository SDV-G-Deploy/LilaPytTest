(() => {
  'use strict';

  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) throw new Error('2D canvas not available');

  const ui = {
    title: document.getElementById('scene-title'),
    subtitle: document.getElementById('scene-subtitle'),
    select: document.getElementById('scene-select')
  };

  const isMobile =
    matchMedia('(max-width: 900px)').matches ||
    /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  const perf = {
    fpsTarget: isMobile ? 30 : 45,
    maxDpr: isMobile ? 1.65 : 2,
    adaptiveQuality: true,
    renderScale: isMobile ? 0.92 : 1,
    minScale: isMobile ? 0.64 : 0.74,
    maxScale: 1,
    budgetMs: isMobile ? 11.5 : 9.5,
    qualitySteps: [1, 0.92, 0.84, 0.76, 0.68, 0.62],
    particlesBase: isMobile ? 70 : 108,
    particlesMin: isMobile ? 34 : 52,
    scaleCooldownMs: 4200
  };

  const SCENES = {
    lily: {
      id: 'lily',
      label: 'Lily',
      title: 'Red Spider Lily',
      subtitle: 'dark floral pulse • original spirit',
      bloom: {
        layers: 2,
        petalsPerLayer: 14,
        radiusFactor: 0.155,
        stemHeightFactor: 0.35,
        petalLength: 182,
        petalThickness: 42,
        spread: 1.2
      },
      motion: { pulse: 0.035, sway: 0.08, filamentWiggle: 0.25 },
      palette: {
        body: ['#050507', '#0c070a', '#040406'],
        vignette: ['rgba(86, 12, 16, 0.14)', 'rgba(26, 8, 10, 0.10)', 'rgba(0, 0, 0, 0.64)'],
        haze: ['rgba(110, 16, 28, ALPHA)', 'rgba(34, 10, 14, ALPHA2)', 'rgba(0, 0, 0, 0)'],
        stem: ['rgba(58, 132, 70, 0.58)', 'rgba(24, 56, 33, 0.80)'],
        petalStops: ['rgba(255, 140, 154, 0.90)', 'rgba(255, 70, 84, 0.92)', 'rgba(188, 20, 35, 0.94)', 'rgba(105, 10, 21, 0.95)'],
        petalStroke: 'rgba(255, 192, 204, 0.32)',
        glowStops: ['rgba(255, 92, 95, 0.34)', 'rgba(255, 36, 40, 0.20)', 'rgba(180, 20, 28, 0.08)'],
        coreStops: ['rgba(255, 190, 194, 0.95)', 'rgba(255, 75, 86, 0.85)', 'rgba(180, 22, 36, 0.55)'],
        filamentA: 'rgba(255, 136, 146, 0.58)',
        filamentB: 'rgba(244, 48, 66, 0.42)',
        tipStops: ['rgba(255, 214, 220, 0.95)', 'rgba(255, 162, 174, 0.82)', 'rgba(255, 108, 126, 0.22)']
      }
    },
    'acid-daisy': {
      id: 'acid-daisy',
      label: 'Acid Daisy',
      title: 'Acid Daisy',
      subtitle: 'neon flora • green-magenta bite',
      bloom: {
        layers: 2,
        petalsPerLayer: 18,
        radiusFactor: 0.175,
        stemHeightFactor: 0.33,
        petalLength: 164,
        petalThickness: 48,
        spread: 1.55
      },
      motion: { pulse: 0.028, sway: 0.11, filamentWiggle: 0.22 },
      palette: {
        body: ['#06060a', '#0b0814', '#040406'],
        vignette: ['rgba(24, 112, 54, 0.14)', 'rgba(20, 10, 28, 0.12)', 'rgba(0, 0, 0, 0.66)'],
        haze: ['rgba(92, 255, 122, ALPHA)', 'rgba(205, 64, 255, ALPHA2)', 'rgba(0, 0, 0, 0)'],
        stem: ['rgba(120, 220, 88, 0.60)', 'rgba(30, 78, 44, 0.84)'],
        petalStops: ['rgba(232, 255, 114, 0.88)', 'rgba(118, 255, 132, 0.90)', 'rgba(204, 74, 255, 0.90)', 'rgba(88, 29, 128, 0.92)'],
        petalStroke: 'rgba(233, 255, 195, 0.30)',
        glowStops: ['rgba(125, 255, 130, 0.32)', 'rgba(212, 92, 255, 0.18)', 'rgba(44, 14, 72, 0.10)'],
        coreStops: ['rgba(245, 255, 190, 0.93)', 'rgba(136, 255, 148, 0.82)', 'rgba(142, 49, 192, 0.55)'],
        filamentA: 'rgba(156, 255, 162, 0.54)',
        filamentB: 'rgba(230, 122, 255, 0.44)',
        tipStops: ['rgba(245, 255, 210, 0.95)', 'rgba(175, 255, 160, 0.80)', 'rgba(236, 125, 255, 0.22)']
      }
    },
    'neon-pollen': {
      id: 'neon-pollen',
      label: 'Neon Pollen',
      title: 'Neon Pollen',
      subtitle: 'electric bloom • cyan-violet haze',
      bloom: {
        layers: 3,
        petalsPerLayer: 12,
        radiusFactor: 0.148,
        stemHeightFactor: 0.34,
        petalLength: 146,
        petalThickness: 36,
        spread: 0.9
      },
      motion: { pulse: 0.04, sway: 0.07, filamentWiggle: 0.32 },
      palette: {
        body: ['#05060a', '#060a15', '#030408'],
        vignette: ['rgba(20, 82, 126, 0.14)', 'rgba(28, 12, 44, 0.12)', 'rgba(0, 0, 0, 0.66)'],
        haze: ['rgba(74, 190, 255, ALPHA)', 'rgba(173, 84, 255, ALPHA2)', 'rgba(0, 0, 0, 0)'],
        stem: ['rgba(68, 166, 198, 0.60)', 'rgba(29, 56, 84, 0.82)'],
        petalStops: ['rgba(176, 244, 255, 0.90)', 'rgba(102, 211, 255, 0.90)', 'rgba(124, 108, 255, 0.90)', 'rgba(51, 42, 120, 0.94)'],
        petalStroke: 'rgba(205, 237, 255, 0.34)',
        glowStops: ['rgba(126, 236, 255, 0.30)', 'rgba(88, 166, 255, 0.20)', 'rgba(128, 94, 255, 0.10)'],
        coreStops: ['rgba(210, 248, 255, 0.92)', 'rgba(112, 206, 255, 0.84)', 'rgba(91, 85, 210, 0.56)'],
        filamentA: 'rgba(174, 242, 255, 0.58)',
        filamentB: 'rgba(144, 124, 255, 0.44)',
        tipStops: ['rgba(228, 251, 255, 0.96)', 'rgba(160, 229, 255, 0.82)', 'rgba(150, 123, 255, 0.22)']
      }
    }
  };

  const sceneIds = Object.keys(SCENES);
  const queryScene = new URLSearchParams(location.search).get('scene');

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
    fpsInterval: 1000 / perf.fpsTarget,
    overBudgetStreak: 0,
    underBudgetStreak: 0,
    qualityIdx: 0,
    lastScaleChangeAt: 0,
    currentSceneId: sceneIds.includes(queryScene) ? queryScene : 'lily',
    sprites: null,
    backgroundLayer: null
  };

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function makeGlowSprite(scene, size = 256) {
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');
    const r = size * 0.5;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, scene.palette.glowStops[0]);
    grad.addColorStop(0.36, scene.palette.glowStops[1]);
    grad.addColorStop(0.74, scene.palette.glowStops[2]);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  function makePetalSprite(scene) {
    const w = scene.bloom.petalLength;
    const h = scene.bloom.petalThickness;
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');

    g.translate(8, h * 0.5);
    const path = new Path2D();
    path.moveTo(0, 0);

    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = t * (w - 12);
      const wave = Math.sin(t * Math.PI * scene.bloom.spread) * (h * 0.08);
      const y = -Math.pow(t, 0.75) * (h * 0.34) - wave;
      path.lineTo(x, y);
    }
    for (let i = 14; i >= 0; i--) {
      const t = i / 14;
      const x = t * (w - 12);
      const wave = Math.sin(t * Math.PI * (scene.bloom.spread + 0.1) + 0.55) * (h * 0.08);
      const y = Math.pow(t, 0.82) * (h * 0.32) + wave;
      path.lineTo(x, y);
    }

    path.closePath();

    const grad = g.createLinearGradient(0, -h * 0.45, w, h * 0.35);
    grad.addColorStop(0, scene.palette.petalStops[0]);
    grad.addColorStop(0.28, scene.palette.petalStops[1]);
    grad.addColorStop(0.72, scene.palette.petalStops[2]);
    grad.addColorStop(1, scene.palette.petalStops[3]);

    g.fillStyle = grad;
    g.fill(path);
    g.strokeStyle = scene.palette.petalStroke;
    g.lineWidth = 1.2;
    g.stroke(path);

    return c;
  }

  function makeCoreSprite(scene, size = 120) {
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');
    const r = size * 0.5;
    const grad = g.createRadialGradient(r, r, 1, r, r, r);
    grad.addColorStop(0, scene.palette.coreStops[0]);
    grad.addColorStop(0.2, scene.palette.coreStops[1]);
    grad.addColorStop(0.6, scene.palette.coreStops[2]);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  function makeTipSprite(scene, size = 18) {
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');
    const r = size * 0.5;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, scene.palette.tipStops[0]);
    grad.addColorStop(0.24, scene.palette.tipStops[1]);
    grad.addColorStop(0.56, scene.palette.tipStops[2]);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  function fillHazeStop(template, alpha, alpha2) {
    return template.replace('ALPHA2', alpha2.toFixed(3)).replace('ALPHA', alpha.toFixed(3));
  }

  function buildBackgroundLayer() {
    const scene = SCENES[state.currentSceneId];
    const bg = makeCanvas(
      Math.max(1, Math.floor(state.width * state.pixelRatio)),
      Math.max(1, Math.floor(state.height * state.pixelRatio))
    );
    const g = bg.getContext('2d');
    g.scale(state.pixelRatio, state.pixelRatio);

    const base = g.createLinearGradient(0, 0, 0, state.height);
    base.addColorStop(0, scene.palette.body[0]);
    base.addColorStop(0.45, scene.palette.body[1]);
    base.addColorStop(1, scene.palette.body[2]);
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
    vignette.addColorStop(0, scene.palette.vignette[0]);
    vignette.addColorStop(0.42, scene.palette.vignette[1]);
    vignette.addColorStop(1, scene.palette.vignette[2]);
    g.fillStyle = vignette;
    g.fillRect(0, 0, state.width, state.height);

    state.backgroundLayer = bg;
  }

  function resize() {
    const scene = SCENES[state.currentSceneId];
    const dpr = Math.min(window.devicePixelRatio || 1, perf.maxDpr);
    state.dpr = dpr;
    state.pixelRatio = dpr * perf.renderScale;

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
    state.stemHeight = Math.min(state.height * scene.bloom.stemHeightFactor, 310);
    state.bloomRadius = Math.min(state.width, state.height) * scene.bloom.radiusFactor;

    buildBackgroundLayer();
  }

  function drawBackground(t) {
    const scene = SCENES[state.currentSceneId];
    const layer = state.backgroundLayer;

    ctx.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, state.width, state.height);

    const drift = Math.sin(t * 0.0002) * 0.5 + 0.5;
    const hazeAlpha = 0.03 + drift * 0.03;
    const hazeY = state.height * (0.28 + drift * 0.08);
    const haze = ctx.createRadialGradient(
      state.centerX,
      hazeY,
      state.height * 0.08,
      state.centerX,
      hazeY,
      state.height * 0.56
    );
    haze.addColorStop(0, fillHazeStop(scene.palette.haze[0], hazeAlpha, hazeAlpha * 0.64));
    haze.addColorStop(0.45, fillHazeStop(scene.palette.haze[1], hazeAlpha * 0.7, hazeAlpha * 0.55));
    haze.addColorStop(1, scene.palette.haze[2]);
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawStem() {
    const scene = SCENES[state.currentSceneId];
    const x = state.centerX;
    const y0 = state.centerY + state.bloomRadius * 0.1;
    const y1 = y0 + state.stemHeight;
    const grad = ctx.createLinearGradient(x, y0, x, y1);
    grad.addColorStop(0, scene.palette.stem[0]);
    grad.addColorStop(1, scene.palette.stem[1]);

    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2.2, state.bloomRadius * 0.07);
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + state.bloomRadius * 0.05, (y0 + y1) * 0.5, x - state.bloomRadius * 0.02, y1);
    ctx.stroke();
  }

  function drawPetals(t) {
    const scene = SCENES[state.currentSceneId];
    const pulse = 1 + Math.sin(t * 0.00125) * scene.motion.pulse;
    const r = state.bloomRadius;

    ctx.save();
    ctx.translate(state.centerX, state.centerY);
    ctx.globalCompositeOperation = 'lighter';

    for (let layer = 0; layer < scene.bloom.layers; layer++) {
      const layerScale = 1 - layer * 0.18;
      const layerRot = layer * (Math.PI / scene.bloom.petalsPerLayer);
      const alpha = layer === 0 ? 0.88 : Math.max(0.5, 0.72 - layer * 0.1);

      for (let i = 0; i < scene.bloom.petalsPerLayer; i++) {
        const a = (i / scene.bloom.petalsPerLayer) * Math.PI * 2 + layerRot;
        const sway = Math.sin(t * 0.001 + i * 0.7 + layer * 1.6) * scene.motion.sway;
        const radial = r * layerScale * (1 + Math.sin(t * 0.0015 + i) * 0.04);

        ctx.save();
        ctx.rotate(a + sway);
        ctx.translate(radial * 0.25, 0);
        const lengthScale = pulse * (1 + Math.sin(i * 0.63 + t * 0.0009) * 0.04);
        ctx.scale((r / 120) * lengthScale, (r / 135) * (1 + layer * 0.08));
        ctx.globalAlpha = alpha;
        ctx.drawImage(state.sprites.petal, 0, -state.sprites.petal.height * 0.5);
        ctx.restore();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function drawFilaments(t) {
    const scene = SCENES[state.currentSceneId];
    const n = Math.max(perf.particlesMin, Math.round(perf.particlesBase * perf.qualitySteps[state.qualityIdx]));
    const r = state.bloomRadius;

    ctx.save();
    ctx.translate(state.centerX, state.centerY);
    ctx.lineCap = 'round';

    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wiggle = Math.sin(t * 0.0017 + i * 1.3) * scene.motion.filamentWiggle;
      const len = r * (0.58 + (i % 7) * 0.038);
      const c1x = Math.cos(a + wiggle) * len * 0.4;
      const c1y = Math.sin(a + wiggle) * len * 0.4;
      const ex = Math.cos(a + wiggle * 1.5) * len;
      const ey = Math.sin(a + wiggle * 1.5) * len;

      ctx.strokeStyle = i % 3 === 0 ? scene.palette.filamentA : scene.palette.filamentB;
      ctx.lineWidth = i % 2 ? 1 : 1.35;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(c1x, c1y, ex, ey);
      ctx.stroke();

      if ((i & 3) === 0) {
        const s = i % 5 === 0 ? 9 : 7;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(state.sprites.tip, ex - s * 0.5, ey - s * 0.5, s, s);
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
    ctx.drawImage(state.sprites.glow, state.centerX - s, state.centerY - s, s * 2, s * 2);
    ctx.globalAlpha = 0.9;
    const c = state.bloomRadius * 0.45;
    ctx.drawImage(state.sprites.core, state.centerX - c, state.centerY - c, c * 2, c * 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function maybeChangeScale(nextScale, now) {
    if (now - state.lastScaleChangeAt < perf.scaleCooldownMs) return false;
    if (Math.abs(nextScale - perf.renderScale) < 0.001) return false;
    perf.renderScale = nextScale;
    state.lastScaleChangeAt = now;
    resize();
    return true;
  }

  function adjustQuality(frameMs, now) {
    if (!perf.adaptiveQuality) return;

    if (frameMs > perf.budgetMs) {
      state.overBudgetStreak += 1;
      state.underBudgetStreak = 0;
    } else if (frameMs < perf.budgetMs * 0.78) {
      state.underBudgetStreak += 1;
      state.overBudgetStreak = Math.max(0, state.overBudgetStreak - 1);
    } else {
      state.underBudgetStreak = Math.max(0, state.underBudgetStreak - 1);
      state.overBudgetStreak = Math.max(0, state.overBudgetStreak - 1);
    }

    if (state.overBudgetStreak > 8) {
      state.overBudgetStreak = 0;
      if (state.qualityIdx < perf.qualitySteps.length - 1) {
        state.qualityIdx += 1;
      } else {
        maybeChangeScale(Math.max(perf.minScale, perf.renderScale - 0.05), now);
      }
    }

    if (state.underBudgetStreak > 40) {
      state.underBudgetStreak = 0;
      if (state.qualityIdx > 0) {
        state.qualityIdx -= 1;
      } else {
        maybeChangeScale(Math.min(perf.maxScale, perf.renderScale + 0.03), now);
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

  function updateMeta(scene) {
    ui.title.textContent = scene.title;
    ui.subtitle.textContent = scene.subtitle;
    document.title = `${scene.title} — Kislota Bloom Engine v0`;
  }

  function compileSceneSprites(scene) {
    state.sprites = {
      glow: makeGlowSprite(scene, 256),
      petal: makePetalSprite(scene),
      core: makeCoreSprite(scene, 120),
      tip: makeTipSprite(scene, 18)
    };
  }

  function switchScene(nextId, syncSelect = true) {
    if (!SCENES[nextId] || state.currentSceneId === nextId) return;

    state.currentSceneId = nextId;
    state.qualityIdx = 0;
    state.overBudgetStreak = 0;
    state.underBudgetStreak = 0;

    const scene = SCENES[nextId];
    compileSceneSprites(scene);
    updateMeta(scene);
    resize();

    if (syncSelect) ui.select.value = nextId;
    const url = new URL(location.href);
    url.searchParams.set('scene', nextId);
    history.replaceState({}, '', url);
  }

  function initSelector() {
    sceneIds.forEach((id) => {
      const scene = SCENES[id];
      const opt = document.createElement('option');
      opt.value = scene.id;
      opt.textContent = scene.label;
      ui.select.appendChild(opt);
    });

    ui.select.value = state.currentSceneId;
    ui.select.addEventListener('change', (e) => switchScene(e.target.value, false), { passive: true });
  }

  function togglePause(e) {
    if (e.target === ui.select) return;
    state.paused = !state.paused;
    if (!state.paused) state.lastFrame = performance.now();
  }

  function boot() {
    initSelector();
    const scene = SCENES[state.currentSceneId];
    compileSceneSprites(scene);
    updateMeta(scene);
    resize();
    state.lastFrame = performance.now();
    requestAnimationFrame(render);

    addEventListener('resize', resize, { passive: true });
    addEventListener('orientationchange', () => setTimeout(resize, 120), { passive: true });
    addEventListener('pointerdown', togglePause, { passive: true });
  }

  boot();
})();
