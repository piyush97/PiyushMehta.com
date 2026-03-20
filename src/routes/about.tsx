// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'About - Piyush Mehta' },
      {
        name: 'description',
        content: 'Learn more about Piyush Mehta - Software Engineer, Tech Speaker, and Open Source Enthusiast',
      },
    ],
  }),
  component: AboutPage,
})

function AboutPage() {
  return (
    <>
      {/* Enhanced Hero Section */}
      <section className="about-hero-section">
        {/* Animated background elements */}
        <div className="about-hero-bg-pattern"></div>
        <div className="about-hero-bg-gradient"></div>
        <div className="about-hero-particle-field">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
        </div>
        <div className="about-hero-floating-elements">
          <div className="about-floating-element about-element-1">
            <div className="floating-icon">👨‍💻</div>
            <div className="floating-pulse"></div>
          </div>
          <div className="about-floating-element about-element-2">
            <div className="floating-icon">🚀</div>
            <div className="floating-pulse"></div>
          </div>
          <div className="about-floating-element about-element-3">
            <div className="floating-icon">💡</div>
            <div className="floating-pulse"></div>
          </div>
        </div>

        {/* Content container */}
        <div className="relative z-10 container-base">
          <div className="py-16 text-center md:py-24">
            <div className="hero-content-wrapper">
              <p className="about-hero-intro">
                <span className="intro-icon">👋</span>
                <span className="intro-text">Get to know me</span>
              </p>
              <h1 className="about-hero-title">
                <span className="title-primary">About</span>
                <strong className="title-accent">Me</strong>
                <div className="title-underline"></div>
              </h1>
              <p className="about-hero-teaser">
                Passionate <span className="highlight">software engineer</span> with expertise
                in building scalable web applications and distributed systems. I love
                sharing knowledge through <span className="highlight">technical talks</span>,
                writing, and contributing to <span className="highlight">open source</span> projects.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="page-container">
        <div className="max-w-4xl mx-auto space-y-16">
          <section className="about-intro">
            <div className="content-card">
              <h2 className="mb-8 text-3xl font-bold text-center md:text-4xl text-text-primary">
                <span className="title-icon">🎯</span>
                What I Do
              </h2>
              <div className="what-i-do-grid">
                <div className="activity-item">
                  <div className="activity-icon">🚀</div>
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">
                    Build Applications
                  </h3>
                  <p>
                    Create scalable web applications using modern technologies and
                    best practices
                  </p>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">🎤</div>
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">
                    Tech Speaking
                  </h3>
                  <p>
                    Share knowledge at conferences and meetups about software
                    engineering
                  </p>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">✍️</div>
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">
                    Technical Writing
                  </h3>
                  <p>
                    Write comprehensive articles and tutorials for the developer
                    community
                  </p>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">🌟</div>
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">
                    Open Source
                  </h3>
                  <p>
                    Contribute to open source projects and maintain useful libraries
                  </p>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">👨‍🏫</div>
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">
                    Mentoring
                  </h3>
                  <p>
                    Guide developers and lead technical workshops to share knowledge
                  </p>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">🤝</div>
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">
                    Collaboration
                  </h3>
                  <p>Work with teams to solve complex technical challenges</p>
                </div>
              </div>
            </div>
          </section>

          <section className="about-skills">
            <div className="content-card">
              <h2 className="mb-8 text-3xl font-bold text-center md:text-4xl text-text-primary">
                <span className="title-icon">⚡</span>
                Technologies I Work With
              </h2>
              <div className="skills-grid">
                <div className="skill-category">
                  <div className="skill-header">
                    <span className="skill-icon">🎨</span>
                    <h3 className="text-xl font-semibold text-text-primary">
                      Frontend
                    </h3>
                  </div>
                  <div className="skill-tags">
                    <span className="skill-tag">React</span>
                    <span className="skill-tag">TypeScript</span>
                    <span className="skill-tag">Next.js</span>
                    <span className="skill-tag">Astro</span>
                    <span className="skill-tag">HTML/CSS</span>
                  </div>
                </div>
                <div className="skill-category">
                  <div className="skill-header">
                    <span className="skill-icon">⚙️</span>
                    <h3 className="text-xl font-semibold text-text-primary">Backend</h3>
                  </div>
                  <div className="skill-tags">
                    <span className="skill-tag">Node.js</span>
                    <span className="skill-tag">Python</span>
                    <span className="skill-tag">Microservices</span>
                    <span className="skill-tag">APIs</span>
                    <span className="skill-tag">GraphQL</span>
                  </div>
                </div>
                <div className="skill-category">
                  <div className="skill-header">
                    <span className="skill-icon">☁️</span>
                    <h3 className="text-xl font-semibold text-text-primary">
                      Cloud &amp; DevOps
                    </h3>
                  </div>
                  <div className="skill-tags">
                    <span className="skill-tag">Azure</span>
                    <span className="skill-tag">AWS</span>
                    <span className="skill-tag">Docker</span>
                    <span className="skill-tag">Kubernetes</span>
                    <span className="skill-tag">CI/CD</span>
                  </div>
                </div>
                <div className="skill-category">
                  <div className="skill-header">
                    <span className="skill-icon">🗄️</span>
                    <h3 className="text-xl font-semibold text-text-primary">
                      Databases
                    </h3>
                  </div>
                  <div className="skill-tags">
                    <span className="skill-tag">PostgreSQL</span>
                    <span className="skill-tag">MongoDB</span>
                    <span className="skill-tag">Redis</span>
                    <span className="skill-tag">ElasticSearch</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="about-contact">
            <div className="content-card text-center">
              <h2 className="mb-6 text-3xl font-bold md:text-4xl text-text-primary">
                <span className="title-icon">🤝</span>
                Let's Connect
              </h2>
              <p className="contact-description">
                I'm always interested in discussing new opportunities, collaborating
                on projects, or speaking at events. Feel free to reach out!
              </p>
              <a href="/contact-me/" className="btn-primary btn-enhanced">
                <span className="btn-content">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    ></path>
                  </svg>
                  Get In Touch
                  <svg
                    className="w-4 h-4 ml-2 transition-transform btn-arrow"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    ></path>
                  </svg>
                </span>
                <div className="btn-bg-effect"></div>
              </a>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
