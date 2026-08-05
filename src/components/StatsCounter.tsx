import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 50, suffix: '+', label: 'Projects' },
  { value: 25, suffix: '+', label: 'Talks' },
  { value: 10, suffix: 'K+', label: 'Stars' },
  { value: 5, suffix: '+', label: 'Years' },
];

const DURATION_MS = 1800;
const STAGGER_MS = 120;

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const AnimatedNumber: React.FC<{
  target: number;
  suffix: string;
  label: string;
  delayMs: number;
  started: boolean;
}> = ({ target, suffix, label, delayMs, started }) => {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!started) return;

    const timeout = setTimeout(() => {
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / DURATION_MS, 1);
        const eased = easeOutExpo(progress);
        setCurrent(Math.round(eased * target));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [started, target, delayMs]);

  return (
    <div className="stat-anim-item" role="group" aria-label={`${target}${suffix} ${label}`}>
      <span className="stat-anim-number" aria-hidden="true">
        {current}
        <span className="stat-anim-suffix">{suffix}</span>
      </span>
      <span className="stat-anim-label">{label}</span>
    </div>
  );
};

interface StatsCounterProps {
  autoStart?: boolean;
}

const StatsCounter: React.FC<StatsCounterProps> = ({ autoStart = false }) => {
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [started, setStarted] = useState(prefersReducedMotion);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting) {
      setStarted(true);
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || started) return;

    if (autoStart) {
      const timer = setTimeout(() => setStarted(true), 200);
      return () => clearTimeout(timer);
    }

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
      rootMargin: '200px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoStart, prefersReducedMotion, started, handleIntersect]);

  return (
    <div ref={containerRef} className="stats-counter-root" role="list" aria-label="Key statistics">
      {STATS.map((stat, i) => (
        <React.Fragment key={stat.label}>
          <AnimatedNumber
            target={stat.value}
            suffix={stat.suffix}
            label={stat.label}
            delayMs={i * STAGGER_MS}
            started={started}
          />
          {i < STATS.length - 1 && <div className="stat-anim-divider" aria-hidden="true" />}
        </React.Fragment>
      ))}

      <style>{`
        .stats-counter-root {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          width: 100%;
        }

        .stat-anim-item {
          text-align: center;
        }

        .stat-anim-number {
          display: block;
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 2rem;
          font-weight: 400;
          color: var(--color-text-primary);
          line-height: 1;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }

        .stat-anim-suffix {
          color: var(--color-text-primary);
          font-size: 1.75rem;
        }

        .stat-anim-label {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-top: 0.25rem;
        }

        .stat-anim-divider {
          width: 1px;
          height: 32px;
          background: var(--color-card-border);
        }

        @media (max-width: 768px) {
          .stats-counter-root {
            gap: 1.25rem;
          }
          .stat-anim-number {
            font-size: 1.5rem;
          }
          .stat-anim-suffix {
            font-size: 1.25rem;
          }
          .stat-anim-divider {
            height: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default StatsCounter;
