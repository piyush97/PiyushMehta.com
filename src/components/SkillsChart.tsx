import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Skill {
  name: string;
  level: number;
  category: string;
}

const SKILLS: Skill[] = [
  { name: 'TypeScript / JavaScript', level: 95, category: 'Frontend' },
  { name: 'React / Next.js / Astro', level: 93, category: 'Frontend' },
  { name: 'Node.js / Bun', level: 88, category: 'Backend' },
  { name: 'PostgreSQL / Redis', level: 82, category: 'Backend' },
  { name: 'Docker / Kubernetes', level: 78, category: 'DevOps' },
  { name: 'Go', level: 68, category: 'Backend' },
];

const BAR_DURATION_MS = 1200;
const STAGGER_MS = 100;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const SkillRow: React.FC<{
  skill: Skill;
  delayMs: number;
  started: boolean;
}> = ({ skill, delayMs, started }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!started) return;

    const timeout = setTimeout(() => {
      setVisible(true);
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const p = Math.min(elapsed / BAR_DURATION_MS, 1);
        setProgress(easeOutCubic(p));

        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [started, delayMs]);

  const displayLevel = Math.round(progress * skill.level);
  const barWidth = `${progress * skill.level}%`;

  return (
    <div
      className="skill-row"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-12px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
      role="listitem"
      aria-label={`${skill.name}: ${skill.level}%`}
    >
      <div className="skill-row-header">
        <span className="skill-row-name">{skill.name}</span>
        <span className="skill-row-pct" aria-hidden="true">
          {displayLevel}%
        </span>
      </div>
      <div
        className="skill-row-track"
        role="progressbar"
        aria-valuenow={displayLevel}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="skill-row-bar" style={{ width: barWidth }} />
      </div>
    </div>
  );
};

interface SkillsChartProps {
  theme?: 'dark' | 'light';
}

const SkillsChart: React.FC<SkillsChartProps> = () => {
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

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.25 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion, started, handleIntersect]);

  const categories = Array.from(new Set(SKILLS.map((s) => s.category)));
  let globalIndex = 0;

  return (
    <div
      ref={containerRef}
      className="skills-chart"
      role="list"
      aria-label="Technology proficiency"
    >
      {categories.map((cat) => {
        const catSkills = SKILLS.filter((s) => s.category === cat);
        return (
          <div key={cat} className="skills-chart-group">
            <h3 className="skills-chart-category">{cat}</h3>
            {catSkills.map((skill) => {
              const idx = globalIndex;
              globalIndex += 1;
              return (
                <SkillRow
                  key={skill.name}
                  skill={skill}
                  delayMs={idx * STAGGER_MS}
                  started={started}
                />
              );
            })}
          </div>
        );
      })}

      <style>{`
        .skills-chart {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding-top: 0.5rem;
        }

        .skills-chart-group {}

        .skills-chart-category {
          font-family: inherit;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-text-secondary);
          margin: 0 0 0.75rem 0;
          padding: 0;
        }

        .skill-row {
          margin-bottom: 0.875rem;
        }

        .skill-row-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.375rem;
        }

        .skill-row-name {
          font-family: 'Geist Mono', 'Fira Code', ui-monospace, monospace;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-text-primary);
          letter-spacing: -0.01em;
        }

        .skill-row-pct {
          font-family: 'Geist Mono', 'Fira Code', ui-monospace, monospace;
          font-size: 0.6875rem;
          color: var(--color-accent);
          letter-spacing: 0.02em;
          font-variant-numeric: tabular-nums;
        }

        .skill-row-track {
          position: relative;
          height: 4px;
          border-radius: 2px;
          background: var(--color-light-800);
          overflow: hidden;
        }

        .skill-row-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 2px;
          background: var(--color-accent);
          will-change: width;
        }
      `}</style>
    </div>
  );
};

export default SkillsChart;
