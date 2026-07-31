'use client';
import { useEffect, useRef, useState } from 'react';

const PURPLE_LIGHT = 'var(--gx-accent)';
const CYAN = 'var(--gx-accent-hover)';

const STATS = [
  { target: 500, suffix: '+', label: 'Students Enrolled' },
  { target: 10,  suffix: '',  label: 'Career Domains' },
  { target: 365, suffix: '',  label: 'Day Roadmap' },
  { target: 30,  suffix: '+', label: 'Algorithms Visualized' },
];

function useCounter(target, duration, started) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return count;
}

function StatItem({ stat, started }) {
  const count = useCounter(stat.target, 1800, started);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-syne), sans-serif',
        fontSize: 56, fontWeight: 800, lineHeight: 1.1,
        backgroundImage: PURPLE_LIGHT,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
      }}>
        {count}{stat.suffix}
      </div>
      <div style={{
        fontSize: 12, color: 'var(--gx-text-muted)',
        letterSpacing: 1.5, textTransform: 'uppercase',
        marginTop: 10, fontFamily: 'var(--font-outfit), sans-serif',
      }}>
        {stat.label}
      </div>
    </div>
  );
}

export default function AnimatedStats() {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.25 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 48, maxWidth: 860, margin: '0 auto',
    }}>
      {STATS.map(s => <StatItem key={s.label} stat={s} started={started} />)}
    </div>
  );
}
