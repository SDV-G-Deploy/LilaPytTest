(() => {
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: true });

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let dpr = 1;

  const TAU = Math.PI * 2;
  const petalCount = 18;
  const strandsPerPetal = 12;
  const bloomRadiusFactor = 0.2;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w * 0.5;
    cy = h * 0.62;
  }

  function smoothStep(t) {
    return t * t * (3 - 2 * t);
  }

  function drawFilament(baseAngle, offset, t, bloomRadius) {
    const sway = Math.sin(t * 0.85 + baseAngle * 2.5) * 0.08;
    const curl = 1.2 + 0.25 * Math.sin(t * 0.6 + offset * 0.15);

    for (let i = 0; i < 58; i++) {
      const u = i / 57;
      const ease = smoothStep(u);
      const localR = bloomRadius * (0.06 + 1.06 * ease);
      const bend = 0.58 * Math.sin(u * Math.PI * (curl + 0.6));
      const a = baseAngle + sway + offset + bend * (1 - u) * 0.92;

      const x = cx + Math.cos(a) * localR;
      const y = cy + Math.sin(a) * localR * (0.9 + u * 0.45) - u * bloomRadius * 0.45;

      const glow = 0.3 + 0.7 * Math.sin((u * 5.2 + t * 0.75 + offset) * 1.7) ** 2;
      const size = (1.2 + (1 - u) * 2.2) * (0.65 + glow * 0.6);

      const alpha = (0.045 + 0.18 * (1 - u) + 0.08 * glow) * (0.9 + 0.1 * Math.sin(t + i * 0.2));
      const r = 230 + Math.floor(25 * glow);
      const g = 20 + Math.floor(35 * (1 - u));
      const b = 35 + Math.floor(45 * (1 - u));

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fill();
    }
  }

  function drawCenter(t, bloomRadius) {
    const pulse = 1 + 0.08 * Math.sin(t * 2.5);
    const coreR = bloomRadius * 0.065 * pulse;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 5.5);
    grad.addColorStop(0, 'rgba(255,110,130,0.95)');
    grad.addColorStop(0.28, 'rgba(255,55,85,0.55)');
    grad.addColorStop(1, 'rgba(255,20,50,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 5.5, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 130, 150, 0.86)';
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, TAU);
    ctx.fill();
  }

  function drawFrame(ms) {
    const t = ms * 0.001;
    const bloomRadius = Math.min(w, h) * bloomRadiusFactor;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(4, 5, 10, 0.16)';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(255, 30, 60, 0.8)';

    for (let p = 0; p < petalCount; p++) {
      const petalBase = (p / petalCount) * TAU + t * 0.05;
      const spread = 0.16 + 0.02 * Math.sin(t + p * 0.8);

      for (let s = 0; s < strandsPerPetal; s++) {
        const n = (s / (strandsPerPetal - 1)) - 0.5;
        const offset = n * spread;
        drawFilament(petalBase, offset, t, bloomRadius);
      }
    }

    ctx.shadowBlur = 8;
    drawCenter(t, bloomRadius);

    requestAnimationFrame(drawFrame);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(drawFrame);
})();
