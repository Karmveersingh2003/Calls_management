import React, { useEffect, useRef, useState } from 'react';

export const GOLD = '#f0c040';
export const GOLD2 = '#ffe082';
export const GOLD3 = '#b8860b';
export const ACCENT = '#00d4ff';
export const ACCENT2 = '#7c3aed';
export const BG_DARK = '#0a0a0f';
export const BG_CARD = '#12121a';
export const BG_PANEL = '#0d0d16';
export const TEXT = '#f0f0ff';
export const MUTED = '#8888aa';

const ROLES = ['Full Stack Developer', 'UI/UX Designer', 'Software Engineer', 'Tech Craftsman'];

export const TW = () => {
  const [t, sT] = useState('');
  const [i, sI] = useState(0);
  const [d, sD] = useState(false);
  useEffect(() => {
    const w = ROLES[i];
    const tm = setTimeout(() => {
      if (!d && t.length < w.length) sT(w.slice(0, t.length + 1));
      else if (!d && t.length === w.length) sD(true);
      else if (d && t.length > 0) sT(t.slice(0, -1));
      else { sD(false); sI(x => (x + 1) % ROLES.length); }
    }, d ? 36 : t.length === ROLES[i].length ? 1800 : 80);
    return () => clearTimeout(tm);
  }, [t, d, i]);
  return (
    <span style={{ color: GOLD, fontStyle: 'italic', fontSize: 12 }}>
      {t}<span style={{ borderRight: `2px solid ${GOLD}`, marginLeft: 1, animation: 'blink 1s step-end infinite' }} />
    </span>
  );
};

export const Particles = ({ count = 50 }) => {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    let W = c.width = c.offsetWidth, H = c.height = c.offsetHeight;
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - .5) * .3, dy: (Math.random() - .5) * .3,
      o: Math.random() * .4 + .1,
      hue: Math.random() > 0.5 ? '200,220,255' : '240,192,64',
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue},${p.o})`; ctx.fill();
      });
      pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 90) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(100,160,255,${.04 * (1 - dist / 90)})`;
          ctx.lineWidth = .5; ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [count]);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
};
