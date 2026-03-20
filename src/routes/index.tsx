// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Piyush Mehta - Senior Software Engineer & Full Stack Developer in Canada | 5+ Years Experience' },
      {
        name: 'description',
        content:
          'Piyush Mehta is a Senior Software Engineer and Full Stack Developer in Canada with 5+ years of experience. Expert in React.js, Node.js, TypeScript, and cloud technologies. Specializing in enterprise software development, startup MVPs, and scalable web applications. Available for software consulting and technical architecture projects across Canada and globally.',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section>
        <div className="py-16 text-center md:py-24">
          <div className="hero-content-wrapper">
            <p className="hero-intro">
              <span className="intro-icon">👋</span>
              <span className="intro-text">Hello, my name is</span>
            </p>
            <h1 className="hero-title">
              <span className="title-primary">Piyush</span>
              <strong className="title-accent">Mehta</strong>
              <div className="title-underline"></div>
            </h1>
            <p className="hero-teaser">
              <span className="highlight">Senior Software Engineer with 5+ years experience in Canada 🇨🇦</span>,{' '}
              <span className="highlight">Full Stack Developer</span>,{' '}
              <span className="highlight">React.js &amp; Node.js Expert</span>,{' '}
              <span className="highlight">Tech Speaker</span>, and{' '}
              <span className="highlight">Open Source Contributor</span>. I architect and build
              scalable web applications using cutting-edge technologies like <strong>React.js</strong>, <strong>Node.js</strong>, <strong>TypeScript</strong>, and <strong>cloud platforms</strong>.
              Specializing in enterprise systems, startup MVPs, and high-performance solutions that drive measurable business growth.
              Available for software consulting and technical architecture projects across <strong>Canada</strong> and globally.
            </p>

            <div className="hero-cta">
              <a href="/blog/" className="btn-primary btn-enhanced">
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    ></path>
                  </svg>
                  Read My Blog
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
              <a href="/contact-me/" className="btn-secondary btn-enhanced">
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    ></path>
                  </svg>
                </span>
                <div className="btn-bg-effect"></div>
              </a>
            </div>
          </div>

          {/* Stats Section */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Projects Built</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">25+</span>
              <span className="stat-label">Tech Talks</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">GitHub Stars</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">5+</span>
              <span className="stat-label">Years Experience</span>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Articles Section */}
      <section className="py-16 container-base">
        <h2 className="mb-12 text-3xl font-bold text-center md:text-4xl">
          Latest Articles
        </h2>
        <div className="mt-12 text-center">
          <a
            href="/blog/"
            className="inline-flex items-center gap-2 font-medium transition-colors text-accent hover:text-accent/80 duration-base"
          >
            View All Articles
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </a>
        </div>
      </section>

      {/* SEO-Optimized Content Section */}
      <section
        className="seo-content-section py-16 container-base"
        itemScope
        itemType="https://schema.org/Person"
      >
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              About <span className="text-accent" itemProp="name">Piyush Mehta</span> - Senior Software Engineer in Canada
            </h2>
            <p className="text-lg text-text-secondary" itemProp="description">
              Professional software engineering services specializing in React.js, Node.js, and modern web development technologies
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <article className="seo-card p-6 rounded-lg bg-surface-100/10">
              <h3 className="text-xl font-bold mb-4 text-accent">Software Engineering Expertise</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                As a <strong>Senior Software Engineer</strong> with <span itemProp="experienceYears">5+ years of experience</span>,
                I specialize in building scalable web applications using modern technologies. My expertise includes{' '}
                <strong>React.js development</strong>, <strong>Node.js backend solutions</strong>, <strong>TypeScript</strong>,
                and <strong>cloud computing platforms</strong> like AWS and Azure.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary">
                <li itemProp="knowsAbout">React.js &amp; Next.js Development</li>
                <li itemProp="knowsAbout">Node.js &amp; Express.js Backend</li>
                <li itemProp="knowsAbout">TypeScript &amp; JavaScript ES6+</li>
                <li itemProp="knowsAbout">Database Design (PostgreSQL, MongoDB)</li>
              </ul>
            </article>

            <article className="seo-card p-6 rounded-lg bg-surface-100/10">
              <h3 className="text-xl font-bold mb-4 text-accent">Services &amp; Consulting</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                I provide comprehensive <strong>software consulting services</strong> for businesses across{' '}
                <span itemProp="workLocation">Canada</span> and internationally. From <strong>enterprise web application development</strong>{' '}
                to <strong>startup MVP creation</strong>, I help organizations build robust, scalable software solutions.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary">
                <li>Enterprise Software Development</li>
                <li>Startup MVP Development</li>
                <li>Technical Architecture &amp; Consulting</li>
                <li>Performance Optimization &amp; Code Review</li>
              </ul>
            </article>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">Technology Stack &amp; Skills</h3>
            <div className="skills-grid grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="skill-item p-4 rounded-lg bg-accent/10 text-center">
                <h4 className="font-bold text-accent" itemProp="knowsAbout">React.js</h4>
                <p className="text-sm text-text-secondary">Expert Level</p>
              </div>
              <div className="skill-item p-4 rounded-lg bg-accent/10 text-center">
                <h4 className="font-bold text-accent" itemProp="knowsAbout">Node.js</h4>
                <p className="text-sm text-text-secondary">Expert Level</p>
              </div>
              <div className="skill-item p-4 rounded-lg bg-accent/10 text-center">
                <h4 className="font-bold text-accent" itemProp="knowsAbout">TypeScript</h4>
                <p className="text-sm text-text-secondary">Advanced</p>
              </div>
              <div className="skill-item p-4 rounded-lg bg-accent/10 text-center">
                <h4 className="font-bold text-accent" itemProp="knowsAbout">Cloud Computing</h4>
                <p className="text-sm text-text-secondary">Advanced</p>
              </div>
              <div className="skill-item p-4 rounded-lg bg-accent/10 text-center">
                <h4 className="font-bold text-accent" itemProp="knowsAbout">Python</h4>
                <p className="text-sm text-text-secondary">Intermediate</p>
              </div>
              <div className="skill-item p-4 rounded-lg bg-accent/10 text-center">
                <h4 className="font-bold text-accent" itemProp="knowsAbout">DevOps</h4>
                <p className="text-sm text-text-secondary">Intermediate</p>
              </div>
              <div className="skill-item p-4 rounded-lg bg-accent/10 text-center">
                <h4 className="font-bold text-accent" itemProp="knowsAbout">GraphQL</h4>
                <p className="text-sm text-text-secondary">Advanced</p>
              </div>
              <div className="skill-item p-4 rounded-lg bg-accent/10 text-center">
                <h4 className="font-bold text-accent" itemProp="knowsAbout">System Design</h4>
                <p className="text-sm text-text-secondary">Expert Level</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Hire a Senior Software Engineer in Canada</h3>
            <p className="text-lg text-text-secondary mb-6 max-w-2xl mx-auto">
              Looking for an experienced <strong>software engineer in Canada</strong>? I'm available for consulting projects,
              technical architecture reviews, and full-stack development work. Let's discuss how I can help bring your software ideas to life.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/services/" className="btn-secondary inline-flex items-center gap-2">
                View Services
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
              </a>
              <a href="/contact-me/" className="btn-secondary inline-flex items-center gap-2">
                Get In Touch
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Hidden SEO Content for Search Engines */}
        <div className="sr-only">
          <h2>Piyush Mehta - Software Engineer Portfolio Canada</h2>
          <p>
            Piyush Mehta is a senior software engineer and full stack developer based in Canada with extensive experience
            in React.js, Node.js, TypeScript, and cloud technologies. Specializing in enterprise software development,
            startup MVP creation, technical consulting, and software architecture. Available for hire across Canada
            including Toronto, Vancouver, Montreal, Calgary, Ottawa, and Edmonton. Expert in modern web development,
            scalable applications, performance optimization, and technical leadership.
          </p>
          <ul>
            <li>Senior Software Engineer Canada</li>
            <li>Full Stack Developer Toronto</li>
            <li>React.js Developer Vancouver</li>
            <li>Node.js Developer Montreal</li>
            <li>Software Consultant Calgary</li>
            <li>Technical Architect Ottawa</li>
            <li>Startup CTO Services Canada</li>
            <li>Enterprise Software Development</li>
            <li>Custom Web Application Development</li>
            <li>Software Engineering Consulting</li>
          </ul>
        </div>
      </section>
    </>
  )
}
