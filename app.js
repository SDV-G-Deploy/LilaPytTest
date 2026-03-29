(() => {
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: true });

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let dpr = 1;
  let bloomRadius = 120;
  let quality = 1;

  const TAU = Math.PI * 2;
  const spriteCache = new Map();
  const filaments = [];

  function detectQuality() {
    const narrow = Math.min(window.innerWidth, window.innerHeight);
    const touch = navigator.maxTouchPoints > 0;
    if (touch || narrow < 900) return 0.58;
    return 1;
  }

  function resize() {
    quality = detectQuality();
    dpr = Math.min(window.devicePixelRatio || 1, quality < 1 ? 1.5 : 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w * 0.5;
    cy = h * 0.62;
    bloomRadius = Math.min(w, h) * (quality < 1 ? 0.18 : 0.2);
    buildFilaments();
  }

  function createGlowSprite(size, color) {
    const key = `${size}_${color}`;
    if (spriteCache.has(key)) return spriteCache.get(key);

    const c = document.createElement('canvas');
    const pad = size * 3;
    c.width = pad;
    c.height = pad;
    const g = c.getContext('2d');
    const r = pad / 2;

    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, color.replace('ALPHA', '0.95'));
    grad.addColorStop(0.22, color.replace('ALPHA', '0.42'));
    grad.addColorStop(0.6, color.replace('ALPHA', '0.10'));
    grad.addColorStop(1, color.replace('ALPHA', '0'));

    g.fillStyle = grad;
    g.beginPath();
    g.arc(r, r, r, 0, TAU);
    g.fill();

    spriteCache.set(key, c);
    return c;
  }

  function buildFilaments() {
    filaments.length = 0;
    const petalCount = Math.max(10, Math.round(16 * quality));
    const strandsPerPetal = Math.max(5, Math.round(8 * quality));
    const pointsPerStrand = Math.max(20, Math.round(32 * quality));

    for (let p = 0; p < petalCount; p++) {
      const petalBase = (p / petalCount) * TAU;
      const spread = 0.18;

      for (let s = 0; s < strandsPerPetal; s++) {
        const n = strandsPerPetal === 1 ? 0 : (s / (strandsPerPetal - 1)) - 0.5;
        const offset = n * spread;
        const strand = [];

        for (let i = 0; i < pointsPerStrand; i++) {
          const u = i / (pointsPerStrand - 1);
          const ease = u * u * (3 - 2 * u);
          const localR = bloomRadius * (0.08 + 1.02 * ease);
          const bend = 0.55 * Math.sin(u * Math.PI * (1.8 + s * 0.06));
          const lift = u * bloomRadius * 0.42;
          const size = (quality < 1 ? 14 : 16) - u * (quality < 1 ? 8 : 10);
          const phase = p * 0.37 + s * 0.21 + i * 0.09;

          strand.push({ petalBase, offset, u, localR, bend, lift, size, phase });
        }
        filaments.push(strand);
      }
    }
  }

  function drawBackground(t) {
    const grad = ctx.createRadialGradient(cx, cy + bloomRadius * 0.55, bloomRadius * 0.2, cx, cy, Math.max(w, h) * 0.72);
    grad.addColorStop(0, 'rgba(32, 8, 12, 0.18)');
    grad.addColorStop(0.45, 'rgba(8, 8, 14, 0.16)');
    grad.addColorStop(1, 'rgba(3, 4, 8, 0.34)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const haze = 0.025 + 0.01 * Math.sin(t * 0.6);
    ctx.fillStyle = `rgba(2, 2, 6, ${0.17 + haze})`;
    ctx.fillRect(0, 0, w, h);
  }

  function drawFilaments(t) {
    ctx.globalCompositeOperation = 'lighter';

    for (const strand of filaments) {
      for (let i = 0; i < strand.length; i++) {
        const pt = strand[i];
        const sway = Math.sin(t * 0.7 + pt.petalBase * 2.2 + pt.phase) * 0.06;
        const angle = pt.petalBase + pt.offset + sway + pt.bend * (1 - pt.u) * 0.9;
        const pulse = 1 + 0.025 * Math.sin(t * 1.8 + pt.phase);

        const x = cx + Math.cos(angle) * pt.localR * pulse;
        const y = cy + Math.sin(angle) * pt.localR * (0.95 + pt.u * 0.35) - pt.lift;

        const glow = 0.55 + 0.45 * Math.sin(t * 1.3 + pt.phase) ** 2;
        const alpha = 0.22 + (1 - pt.u) * 0.18 + glow * 0.14;

        const sprite = createGlowSprite(
          Math.max(5, pt.size * (0.9 + glow * 0.35)),
          i < strand.length * 0.22
            ? 'rgba(255,120,145,ALPHA)'
            : 'rgba(255,52,82,ALPHA)'
        );

        ctx.globalAlpha = Math.min(alpha, quality < 1 ? 0.5 : 0.62);
        ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2, sprite.width, sprite.height);
      }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawCenter(t) {
    const pulse = 1 + 0.08 * Math.sin(t * 2.3);
    const coreR = bloomRadius * 0.06 * pulse;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 6.2);
    grad.addColorStop(0, 'rgba(255,145,162,0.95)');
    grad.addColorStop(0.24, 'rgba(255,78,110,0.5)');
    grad.addColorStop(1, 'rgba(255,30,60,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 6.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 182, 192, 0.88)';
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 0.95, 0, TAU);
    ctx.fill();
  }

  function frame(ms) {
    const t = ms * 0.001;
    drawBackground(t);
    drawFilaments(t);
    drawCenter(t);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(frame);
})();
