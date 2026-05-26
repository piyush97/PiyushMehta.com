import React, { useMemo, useState } from 'react';

type ImpactStep = {
  label: string;
  metric: string;
  detail: string;
  takeaway: string;
  color: string;
};

type VideoItem = {
  title: string;
  publisher: string;
  focus: string;
  url: string;
  embedUrl?: string;
  thumbnail?: string;
};

const impactSteps: ImpactStep[] = [
  {
    label: 'Payroll shock',
    metric: '$150K+ roles',
    detail:
      'A cut in tech payroll removes high-income spending from restaurants, travel, childcare, contractors, housing, and local taxes.',
    takeaway: 'Layoffs start inside one company but the demand hit lands outside it.',
    color: '#ef4444',
  },
  {
    label: 'Local multiplier',
    metric: '4-5 jobs',
    detail:
      'Innovation-economy jobs support non-tech work nearby. When the anchor job disappears, the secondary demand can disappear too.',
    takeaway: 'The second-order effect is why tech-heavy cities feel the shock first.',
    color: '#f97316',
  },
  {
    label: 'Office and housing',
    metric: '36% SF vacancy',
    detail:
      'Remote work, weaker hiring, and reduced startup expansion push down office demand. Housing pressure changes by neighborhood, not evenly.',
    takeaway: 'This is a city budget and services story, not only an HR story.',
    color: '#38bdf8',
  },
  {
    label: 'Funding loop',
    metric: 'Burn cuts',
    detail:
      'When investors push efficiency, startups slow hiring. That creates fewer landing spots for laid-off engineers.',
    takeaway: 'The market absorbs talent only if new companies are funded to hire.',
    color: '#a78bfa',
  },
  {
    label: 'Career reset',
    metric: 'Skill premium',
    detail:
      'General coding supply is up, but demand is strongest for engineers who combine deep systems, domain knowledge, security, AI tooling, and product judgment.',
    takeaway: 'The safest career move is not panic. It is sharper differentiation.',
    color: '#22c55e',
  },
];

const layoffYears = [
  { year: '2022', workers: 165269 },
  { year: '2023', workers: 264320 },
  { year: '2024', workers: 152922 },
  { year: '2025', workers: 124802 },
  { year: '2026 YTD', workers: 115859 },
];

const videos: VideoItem[] = [
  {
    title: 'Why widespread tech layoffs keep happening despite a strong U.S. economy',
    publisher: 'CNBC',
    focus:
      'Good primer on why profitable tech firms still cut roles during an AI and efficiency cycle.',
    url: 'https://www.cnbc.com/video/2024/02/24/why-widespread-tech-layoffs-keep-happening-despite-a-strong-us-economy.html',
    thumbnail:
      'https://image.cnbcfm.com/api/v1/image/107147487-1667854565525-GettyImages-1205578716.jpg?v=1708718414&w=960&h=540',
  },
  {
    title: 'How AI Is Already Reshaping White-Collar Work',
    publisher: 'Wall Street Journal',
    focus: 'Useful context for the article section on augmentation versus displacement.',
    url: 'https://www.youtube.com/watch?v=DVpTpx9Avf0',
    embedUrl: 'https://www.youtube-nocookie.com/embed/DVpTpx9Avf0',
  },
];

const compactNumber = (value: number) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toLocaleString('en-US');
};

const LayoffEconomyExplainer: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [jobsLost, setJobsLost] = useState(50000);

  const selectedStep = impactSteps[activeStep];
  const maxWorkers = Math.max(...layoffYears.map((year) => year.workers));
  const trackedLayoffs = layoffYears.reduce((sum, year) => sum + year.workers, 0);

  const shockModel = useMemo(() => {
    const annualPayroll = jobsLost * 150000;
    const downstreamJobs = Math.round(jobsLost * 4.5);
    const monthlyPayroll = annualPayroll / 12;

    return {
      annualPayroll,
      downstreamJobs,
      monthlyPayroll,
    };
  }, [jobsLost]);

  return (
    <section className="layoff-economy not-prose" aria-labelledby="layoff-economy-title">
      <div className="layoff-economy__header">
        <p className="layoff-economy__eyebrow">Interactive explainer</p>
        <h2 id="layoff-economy-title">The layoff wave in one mental model</h2>
        <p>
          Follow the chain from a company payroll decision to local spending, real estate, venture
          funding, and developer career strategy.
        </p>
      </div>

      <div className="layoff-economy__stats" aria-label="Tech layoff summary">
        <div>
          <strong>{compactNumber(trackedLayoffs)}</strong>
          <span>tracked tech layoffs since 2022</span>
        </div>
        <div>
          <strong>2023</strong>
          <span>peak reset year in public trackers</span>
        </div>
        <div>
          <strong>AI + rates</strong>
          <span>two forces behind the new labor market</span>
        </div>
      </div>

      <div className="layoff-economy__flow" role="group" aria-label="Economic impact sequence">
        {impactSteps.map((step, index) => (
          <button
            type="button"
            key={step.label}
            className={`layoff-economy__step ${index === activeStep ? 'is-active' : ''}`}
            onClick={() => setActiveStep(index)}
            aria-pressed={index === activeStep}
            style={{ borderColor: index === activeStep ? step.color : undefined }}
          >
            <span className="layoff-economy__step-index" style={{ backgroundColor: step.color }}>
              {index + 1}
            </span>
            <span>
              <strong>{step.label}</strong>
              <small>{step.metric}</small>
            </span>
          </button>
        ))}
      </div>

      <div
        className="layoff-economy__detail"
        aria-live="polite"
        style={{ borderColor: selectedStep.color }}
      >
        <div className="layoff-economy__progress">
          <span
            style={{
              width: `${((activeStep + 1) / impactSteps.length) * 100}%`,
              backgroundColor: selectedStep.color,
            }}
          />
        </div>
        <div>
          <p className="layoff-economy__metric" style={{ color: selectedStep.color }}>
            {selectedStep.metric}
          </p>
          <h3>{selectedStep.label}</h3>
          <p>{selectedStep.detail}</p>
        </div>
        <blockquote>{selectedStep.takeaway}</blockquote>
      </div>

      <div className="layoff-economy__lab">
        <div className="layoff-economy__control">
          <div className="layoff-economy__control-header">
            <label htmlFor="layoff-shock-size">Layoff shock size</label>
            <output htmlFor="layoff-shock-size">{jobsLost.toLocaleString('en-US')} jobs</output>
          </div>
          <input
            id="layoff-shock-size"
            type="range"
            min="10000"
            max="250000"
            step="5000"
            value={jobsLost}
            onChange={(event) => setJobsLost(Number(event.currentTarget.value))}
          />
          <p>
            Assumes $150K average annual compensation and a 4.5x local-job multiplier. Directional
            model, not a forecast.
          </p>
        </div>

        <div className="layoff-economy__outputs">
          <div>
            <span>Annual payroll removed</span>
            <strong>{compactNumber(shockModel.annualPayroll)}</strong>
          </div>
          <div>
            <span>Monthly spending pressure</span>
            <strong>{compactNumber(shockModel.monthlyPayroll)}</strong>
          </div>
          <div>
            <span>Downstream local jobs exposed</span>
            <strong>{shockModel.downstreamJobs.toLocaleString('en-US')}</strong>
          </div>
        </div>
      </div>

      <div className="layoff-economy__chart" aria-label="Layoffs by year from 2022 through 2026">
        <div>
          <h3>Tracked layoffs by year</h3>
          <p>2026 is year-to-date, so compare directionally.</p>
        </div>
        <div className="layoff-economy__bars" role="img" aria-label="2023 is the largest bar">
          {layoffYears.map((year) => (
            <div className="layoff-economy__bar-wrap" key={year.year}>
              <div
                className="layoff-economy__bar"
                style={{ height: `${(year.workers / maxWorkers) * 100}%` }}
              >
                <span>{compactNumber(year.workers)}</span>
              </div>
              <strong>{year.year}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="layoff-economy__videos" aria-label="Related explainer videos">
        <div>
          <h3>Watch the moving parts</h3>
          <p>Two short context pieces before diving into the deeper sections below.</p>
        </div>
        <div className="layoff-economy__video-grid">
          {videos.map((video) => (
            <article className="layoff-economy__video" key={video.title}>
              {video.embedUrl ? (
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${video.title}`}
                >
                  <img src={video.thumbnail} alt="" loading="lazy" />
                  <span className="layoff-economy__play" aria-hidden="true" />
                </a>
              )}
              <div>
                <span>{video.publisher}</span>
                <h4>{video.title}</h4>
                <p>{video.focus}</p>
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                  Open video
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .layoff-economy {
          display: grid;
          gap: 1rem;
          margin: 2.5rem 0 3rem;
          border: 1px solid color-mix(in srgb, var(--color-card-border) 84%, transparent);
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.12), transparent 42%),
            color-mix(in srgb, var(--color-surface-raised, var(--color-light-900)) 84%, var(--color-darker) 16%);
          padding: clamp(1rem, 3vw, 1.5rem);
          color: var(--color-text);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
        }

        .layoff-economy * {
          box-sizing: border-box;
          letter-spacing: 0;
        }

        .layoff-economy__header,
        .layoff-economy__videos > div:first-child,
        .layoff-economy__chart > div:first-child {
          display: grid;
          gap: 0.35rem;
        }

        .layoff-economy__eyebrow,
        .layoff-economy__metric,
        .layoff-economy__video span {
          margin: 0;
          font-size: 0.76rem;
          font-weight: 850;
          text-transform: uppercase;
        }

        .layoff-economy h2,
        .layoff-economy h3,
        .layoff-economy h4,
        .layoff-economy p {
          margin: 0;
        }

        .layoff-economy h2 {
          color: var(--color-text-primary);
          font-size: clamp(1.45rem, 3vw, 2.15rem);
          line-height: 1.08;
        }

        .layoff-economy h3 {
          color: var(--color-text-primary);
          font-size: 1.08rem;
          line-height: 1.2;
        }

        .layoff-economy h4 {
          color: var(--color-text-primary);
          font-size: 0.98rem;
          line-height: 1.25;
        }

        .layoff-economy p {
          color: var(--color-text-secondary);
          line-height: 1.58;
        }

        .layoff-economy__stats,
        .layoff-economy__outputs,
        .layoff-economy__video-grid {
          display: grid;
          gap: 1px;
          border: 1px solid var(--color-card-border);
          background: var(--color-card-border);
          border-radius: 8px;
          overflow: hidden;
        }

        .layoff-economy__stats {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .layoff-economy__stats div,
        .layoff-economy__outputs div {
          display: grid;
          gap: 0.25rem;
          align-content: start;
          background: rgba(var(--color-darker-rgb), 0.22);
          padding: 0.9rem;
        }

        .layoff-economy__stats strong,
        .layoff-economy__outputs strong {
          color: var(--color-text-primary);
          font-size: clamp(1.25rem, 3vw, 1.8rem);
          line-height: 1;
        }

        .layoff-economy__stats span,
        .layoff-economy__outputs span {
          color: var(--color-text-secondary);
          font-size: 0.84rem;
          line-height: 1.35;
        }

        .layoff-economy__flow {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.55rem;
        }

        .layoff-economy__step {
          display: flex;
          min-height: 5.2rem;
          align-items: flex-start;
          gap: 0.55rem;
          border: 1px solid var(--color-card-border);
          border-radius: 8px;
          background: rgba(var(--color-darker-rgb), 0.2);
          color: var(--color-text-primary);
          padding: 0.72rem;
          text-align: left;
          cursor: pointer;
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease;
        }

        .layoff-economy__step:hover,
        .layoff-economy__step:focus-visible,
        .layoff-economy__step.is-active {
          transform: translateY(-2px);
          background: rgba(var(--color-darker-rgb), 0.34);
        }

        .layoff-economy__step-index {
          display: inline-grid;
          width: 1.55rem;
          height: 1.55rem;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 50%;
          color: #11131f;
          font-size: 0.78rem;
          font-weight: 900;
        }

        .layoff-economy__step strong,
        .layoff-economy__step small {
          display: block;
          overflow-wrap: anywhere;
        }

        .layoff-economy__step strong {
          margin-bottom: 0.18rem;
          font-size: 0.86rem;
          line-height: 1.15;
        }

        .layoff-economy__step small {
          color: var(--color-text-secondary);
          font-size: 0.78rem;
          line-height: 1.25;
        }

        .layoff-economy__detail {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(12rem, 0.78fr);
          gap: 1rem;
          border: 1px solid;
          border-radius: 8px;
          background: rgba(var(--color-darker-rgb), 0.28);
          padding: 1rem;
        }

        .layoff-economy__progress {
          grid-column: 1 / -1;
          height: 0.42rem;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
        }

        .layoff-economy__progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          transition: width 260ms ease;
        }

        .layoff-economy__detail > div:nth-child(2) {
          display: grid;
          gap: 0.4rem;
        }

        .layoff-economy__detail blockquote {
          display: grid;
          align-content: center;
          margin: 0;
          border-left: 3px solid currentColor;
          color: var(--color-text-primary);
          padding-left: 0.85rem;
          font-size: 0.98rem;
          font-weight: 750;
          line-height: 1.45;
        }

        .layoff-economy__lab {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
          gap: 1rem;
        }

        .layoff-economy__control {
          display: grid;
          gap: 0.75rem;
          border: 1px solid var(--color-card-border);
          border-radius: 8px;
          background: rgba(var(--color-darker-rgb), 0.2);
          padding: 1rem;
        }

        .layoff-economy__control-header {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .layoff-economy__control label {
          color: var(--color-text-primary);
          font-weight: 850;
        }

        .layoff-economy__control output {
          color: var(--color-accent);
          font-variant-numeric: tabular-nums;
          font-weight: 850;
        }

        .layoff-economy__control input {
          width: 100%;
          accent-color: var(--color-accent);
        }

        .layoff-economy__control p {
          font-size: 0.88rem;
        }

        .layoff-economy__outputs {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .layoff-economy__chart,
        .layoff-economy__videos {
          display: grid;
          gap: 0.85rem;
          border-top: 1px solid color-mix(in srgb, var(--color-card-border) 78%, transparent);
          padding-top: 1rem;
        }

        .layoff-economy__bars {
          display: grid;
          grid-template-columns: repeat(5, minmax(3rem, 1fr));
          gap: 0.65rem;
          min-height: 13rem;
          align-items: end;
          border: 1px solid var(--color-card-border);
          border-radius: 8px;
          background: rgba(var(--color-darker-rgb), 0.2);
          padding: 1rem 0.7rem 0.7rem;
        }

        .layoff-economy__bar-wrap {
          display: grid;
          min-height: 11rem;
          grid-template-rows: 1fr auto;
          align-items: end;
          gap: 0.45rem;
          text-align: center;
        }

        .layoff-economy__bar {
          display: grid;
          min-height: 1.8rem;
          align-items: start;
          justify-items: center;
          border-radius: 7px 7px 3px 3px;
          background: linear-gradient(180deg, #ffcc68, #ef4444);
          transform-origin: bottom;
          animation: layoff-bar-rise 640ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
        }

        .layoff-economy__bar span {
          margin-top: -1.45rem;
          color: var(--color-text-primary);
          font-size: 0.74rem;
          font-weight: 850;
          white-space: nowrap;
        }

        .layoff-economy__bar-wrap strong {
          color: var(--color-text-secondary);
          font-size: 0.76rem;
          line-height: 1.2;
        }

        .layoff-economy__video-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .layoff-economy__video {
          display: grid;
          grid-template-rows: auto 1fr;
          background: rgba(var(--color-darker-rgb), 0.22);
        }

        .layoff-economy__video iframe,
        .layoff-economy__video > a:first-child {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          border: 0;
          background: #0f1221;
        }

        .layoff-economy__video > a:first-child {
          position: relative;
          overflow: hidden;
        }

        .layoff-economy__video img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 220ms ease;
        }

        .layoff-economy__video > a:first-child:hover img {
          transform: scale(1.03);
        }

        .layoff-economy__play {
          position: absolute;
          inset: 50% auto auto 50%;
          width: 3.25rem;
          height: 3.25rem;
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          background: rgba(15, 18, 33, 0.72);
          transform: translate(-50%, -50%);
        }

        .layoff-economy__play::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-top: 0.48rem solid transparent;
          border-bottom: 0.48rem solid transparent;
          border-left: 0.72rem solid #fff;
          transform: translate(-38%, -50%);
        }

        .layoff-economy__video > div {
          display: grid;
          gap: 0.45rem;
          align-content: start;
          padding: 0.9rem;
        }

        .layoff-economy__video span {
          color: var(--color-accent);
        }

        .layoff-economy__video p {
          font-size: 0.9rem;
        }

        .layoff-economy__video a:last-child {
          color: var(--color-accent);
          font-size: 0.9rem;
          font-weight: 850;
          text-decoration: none;
        }

        .layoff-economy__video a:last-child:hover {
          text-decoration: underline;
          text-underline-offset: 0.18em;
        }

        @keyframes layoff-bar-rise {
          from {
            transform: scaleY(0.08);
          }
          to {
            transform: scaleY(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .layoff-economy__step,
          .layoff-economy__progress span,
          .layoff-economy__video img {
            transition: none;
          }

          .layoff-economy__bar {
            animation: none;
          }
        }

        @media (max-width: 840px) {
          .layoff-economy__stats,
          .layoff-economy__flow,
          .layoff-economy__lab,
          .layoff-economy__outputs,
          .layoff-economy__video-grid {
            grid-template-columns: 1fr;
          }

          .layoff-economy__flow {
            gap: 0.45rem;
          }

          .layoff-economy__step {
            min-height: auto;
          }

          .layoff-economy__detail {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .layoff-economy {
            margin-inline: -0.25rem;
          }

          .layoff-economy__bars {
            grid-template-columns: repeat(5, minmax(2.7rem, 1fr));
            gap: 0.4rem;
            padding-inline: 0.45rem;
          }

          .layoff-economy__bar span {
            font-size: 0.68rem;
          }
        }
      `}</style>
    </section>
  );
};

export default LayoffEconomyExplainer;
