/* ================================================================
   portfolio.js — Tibyan Saad · RETRO ARCADE EDITION
   ================================================================ */

/* ── Spaceship cursor with directional rotation ─────────────── */
const cursorPixel = document.getElementById('cursor-pixel');

let mx = 0, my = 0;
let prevMx = 0, prevMy = 0;
let lastStarTime = 0;
let lastAngle = 0;

const pixelChars = ['■', '□', '▪', '◆', '◇', '▲', '+', '×', '·', '*'];

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;

  cursorPixel.style.left = mx + 'px';
  cursorPixel.style.top  = my + 'px';

  const dx   = mx - prevMx;
  const dy   = my - prevMy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 2) {
    // atan2 from positive-x; ship points up by default so add 90deg offset
    lastAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    prevMx = mx;
    prevMy = my;
  }
  cursorPixel.style.transform = `translate(-50%, -50%) rotate(${lastAngle}deg)`;

  const now = Date.now();
  if (now - lastStarTime > 60 && dist > 2) {
    lastStarTime = now;
    spawnPixelTrail(mx, my);
  }
});

function spawnPixelTrail(x, y) {
  const el = document.createElement('div');
  el.className = 'cursor-star';
  el.textContent = pixelChars[Math.floor(Math.random() * pixelChars.length)];

  const spreadAngle = lastAngle + 180 + (Math.random() - 0.5) * 60;
  const spreadRad   = spreadAngle * (Math.PI / 180);
  const spreadDist  = 14 + Math.random() * 18;
  const dx = Math.cos(spreadRad) * spreadDist;
  const dy = Math.sin(spreadRad) * spreadDist;

  el.style.setProperty('--dx', dx + 'px');
  el.style.setProperty('--dy', dy + 'px');
  el.style.left     = (x + (Math.random() - 0.5) * 6) + 'px';
  el.style.top      = (y + (Math.random() - 0.5) * 6) + 'px';

  // Randomly pick from pink arcade palette
  const colors = ['#ff00aa', '#ffe600', '#ff80d0', '#cc00ff', '#ff3c3c', '#ffffff'];
  el.style.color    = colors[Math.floor(Math.random() * colors.length)];
  el.style.fontSize = (10 + Math.random() * 8) + 'px';

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

/* ── Arcade grid / pixel background canvas ──────────────────── */
const canvas = document.getElementById('arcade-canvas');
const ctx    = canvas.getContext('2d');
let W, H;
let gridParticles = [];
let shooters      = [];
let bgFrame       = 0;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  initParticles();
}

function initParticles() {
  // Sparse glowing dots for the "dark arcade room" feel
  gridParticles = Array.from({ length: 140 }, () => ({
    x:       Math.round(Math.random() * (W / 8)) * 8,
    y:       Math.round(Math.random() * (H / 8)) * 8,
    alpha:   Math.random() * 0.35 + 0.05,
    twinkle: Math.random() * 0.02 + 0.005,
    offset:  Math.random() * Math.PI * 2,
    color:   Math.random() > 0.7 ? '#ff00aa' : Math.random() > 0.5 ? '#ffe600' : '#ff80d0'
  }));
}

/* Pixel shooting star */
function spawnShooter() {
  shooters.push({
    x:      Math.random() * W * 0.5,
    y:      Math.random() * H * 0.3,
    len:    5,    // number of pixel segments
    speed:  5 + Math.random() * 6,
    angle:  Math.PI / 4 + (Math.random() - 0.5) * 0.4,
    life:   1,
    color:  Math.random() > 0.5 ? '#ff00aa' : '#ffe600'
  });
}

function drawGrid() {
  // Subtle pixel grid lines
  ctx.strokeStyle = 'rgba(255, 0, 170, 0.025)';
  ctx.lineWidth   = 1;
  const spacing   = 40;
  for (let x = 0; x < W; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Draw subtle pixel grid
  drawGrid();

  // Glowing pixel dots
  gridParticles.forEach(p => {
    const tw = Math.sin(bgFrame * p.twinkle + p.offset) * 0.4 + 0.6;
    ctx.fillStyle = hexToRgba(p.color, p.alpha * tw);
    ctx.fillRect(p.x, p.y, 3, 3);
  });

  // Pixel shooting stars (rendered as dashed segments)
  shooters = shooters.filter(s => s.life > 0);
  shooters.forEach(s => {
    // Draw pixel trail
    for (let i = 0; i < s.len; i++) {
      const tx = s.x - Math.cos(s.angle) * i * 8;
      const ty = s.y - Math.sin(s.angle) * i * 8;
      const a  = (s.life * (s.len - i)) / s.len;
      ctx.fillStyle = hexToRgba(s.color, a * 0.9);
      ctx.fillRect(Math.round(tx), Math.round(ty), 4, 4);
    }
    s.x    += Math.cos(s.angle) * s.speed;
    s.y    += Math.sin(s.angle) * s.speed;
    s.life -= 0.018;
    if (s.x > W || s.y > H) s.life = 0;
  });

  // Occasional random single-pixel flashes (arcade noise)
  if (bgFrame % 3 === 0) {
    for (let i = 0; i < 4; i++) {
      const fx = Math.floor(Math.random() * W / 4) * 4;
      const fy = Math.floor(Math.random() * H / 4) * 4;
      ctx.fillStyle = 'rgba(255,0,170,0.08)';
      ctx.fillRect(fx, fy, 2, 2);
    }
  }

  bgFrame++;
  requestAnimationFrame(draw);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

window.addEventListener('resize', resize);
resize();
draw();
setInterval(spawnShooter, 2500);
spawnShooter();

/* ── Skill chip toggle ─────────────────────────────────────── */
document.querySelectorAll('.skill-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('active');
    // Mini beep feedback via Web Audio API
    playBeep(chip.classList.contains('active') ? 880 : 440, 0.06, 0.08);
  });
});

/* ── Tiny pixel beep using Web Audio ──────────────────────── */
let audioCtx = null;
function playBeep(frequency, volume, duration) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type            = 'square';  // classic 8-bit square wave
    osc.frequency.value = frequency;
    gain.gain.value     = volume;
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio might be blocked; silently fail
  }
}

/* ── Score count-up animation ──────────────────────────────── */
function animateScore(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  const steps  = 30;
  let   step   = 0;
  const interval = setInterval(() => {
    step++;
    const val = Math.floor((step / steps) * target);
    el.textContent = String(val).padStart(6, '0');
    if (step >= steps) {
      clearInterval(interval);
      el.textContent = String(target).padStart(6, '0');
    }
  }, 40);
}

const scoreEl = document.querySelector('.count-up');
if (scoreEl) {
  const scoreObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateScore(e.target);
        scoreObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  scoreObs.observe(scoreEl);
}

/* ── Scroll reveal ─────────────────────────────────────────── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      // Play soft reveal beep
      playBeep(330, 0.04, 0.05);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ── Nav pixel click sound ─────────────────────────────────── */
document.querySelectorAll('nav a, .btn-primary, .btn-ghost, .contact-link').forEach(el => {
  el.addEventListener('click', () => playBeep(660, 0.05, 0.07));
});

/* ── Konami Code easter egg ────────────────────────────────── */
const KONAMI = [38,38,40,40,37,39,37,39,66,65];
let konamiIdx = 0;
document.addEventListener('keydown', e => {
  if (e.keyCode === KONAMI[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0;
      activateKonami();
    }
  } else {
    konamiIdx = 0;
  }
});

function activateKonami() {
  // Flash the screen, spawn lots of particles, play fanfare
  document.body.style.animation = 'konami-flash 0.6s steps(3)';
  setTimeout(() => document.body.style.animation = '', 700);

  const notes = [523, 523, 523, 523, 523, 659, 784, 880];
  notes.forEach((n, i) => setTimeout(() => playBeep(n, 0.07, 0.12), i * 120));

  // Burst of particles from center
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'cursor-star';
      el.textContent = pixelChars[Math.floor(Math.random() * pixelChars.length)];
      const angle = (i / 40) * Math.PI * 2;
      const dist  = 60 + Math.random() * 80;
      el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      el.style.left     = (W / 2) + 'px';
      el.style.top      = (H / 2) + 'px';
      const colors = ['#ff00aa', '#ffe600', '#ff80d0', '#cc00ff', '#ff3c3c'];
      el.style.color    = colors[Math.floor(Math.random() * colors.length)];
      el.style.fontSize = '14px';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 800);
    }, i * 20);
  }

  // Show cheat message
  const msg = document.createElement('div');
  msg.textContent = '★ CHEAT CODE ACTIVATED! +30 LIVES ★';
  msg.style.cssText = `
    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
    font-family:'Press Start 2P',monospace; font-size:14px; color:#ffe600;
    z-index:9999; text-shadow:0 0 20px #ffe600; text-align:center;
    animation:blink-slow 0.3s steps(2) 6;
    pointer-events:none;
  `;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 2500);
}

// Add konami flash keyframe dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes konami-flash {
    0%,100% { filter: none; }
    33%      { filter: invert(1) hue-rotate(90deg); }
    66%      { filter: brightness(2) saturate(3); }
  }
`;
document.head.appendChild(style);
