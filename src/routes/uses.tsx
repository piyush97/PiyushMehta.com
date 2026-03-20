// src/routes/uses.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/uses')({
  head: () => ({
    meta: [
      { title: 'Uses - My Development Setup' },
      {
        name: 'description',
        content:
          'A comprehensive list of the tools, software, hardware, and services I use for development, content creation, and daily productivity.',
      },
    ],
  }),
  component: UsesPage,
})

function UsesPage() {
  return (
    <>
      {/* Enhanced Hero Section */}
      <section className="uses-hero-section">
        {/* Animated background elements */}
        <div className="uses-hero-bg-pattern"></div>
        <div className="uses-hero-bg-gradient"></div>
        <div className="uses-hero-particle-field">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
        </div>
        <div className="uses-hero-floating-elements">
          <div className="uses-floating-element uses-element-1">
            <div className="floating-icon">💻</div>
            <div className="floating-pulse"></div>
          </div>
          <div className="uses-floating-element uses-element-2">
            <div className="floating-icon">⚙️</div>
            <div className="floating-pulse"></div>
          </div>
          <div className="uses-floating-element uses-element-3">
            <div className="floating-icon">🛠️</div>
            <div className="floating-pulse"></div>
          </div>
        </div>

        {/* Content container */}
        <div className="relative z-10 container-base">
          <div className="py-16 text-center md:py-24">
            <div className="hero-content-wrapper">
              <p className="uses-hero-intro">
                <span className="intro-icon">⚡</span>
                <span className="intro-text">My Development Stack</span>
              </p>
              <h1 className="uses-hero-title">
                <span className="title-primary">Uses</span>
                <strong className="title-accent">Setup</strong>
                <div className="title-underline"></div>
              </h1>
              <p className="uses-hero-teaser">
                A comprehensive overview of the <span className="highlight">tools</span>,{' '}
                <span className="highlight">hardware</span>, and <span className="highlight">software</span>{' '}
                that power my development workflow and content creation process.
              </p>
              <div className="uses-hero-meta">
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span className="meta-text">Last updated: June 1, 2025</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">🔄</span>
                  <span className="meta-text">Regularly updated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container">
        <div className="max-w-4xl container-base">
          {/* Development Tools */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-accent">
              💻 Development Tools
            </h2>

            <div className="space-y-8">
              {/* Code Editors */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">Code Editors &amp; IDEs</h3>
                <div className="grid gap-4">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Visual Studio Code</h4>
                    <p className="text-muted">
                      My primary code editor for most development work. Lightning
                      fast with excellent extension ecosystem.
                    </p>
                    <div className="uses-details">
                      <span className="uses-tag">Primary</span>
                      <a
                        href="https://code.visualstudio.com/"
                        className="uses-link"
                        target="_blank"
                        rel="noopener"
                      >
                        Visit →
                      </a>
                    </div>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Zed</h4>
                    <p className="text-muted">
                      High-performance code editor built for speed and
                      collaboration, with excellent Rust and modern language
                      support.
                    </p>
                    <div className="uses-details">
                      <span className="uses-tag">Fast</span>
                      <a
                        href="https://zed.dev/"
                        className="uses-link"
                        target="_blank"
                        rel="noopener"
                      >
                        Visit →
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* VS Code Extensions */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">VS Code Extensions</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Prettier</h4>
                    <p className="text-muted">
                      Code formatter that keeps my code consistent across all
                      projects.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">ESLint</h4>
                    <p className="text-muted">
                      JavaScript linter that helps catch errors and enforce coding
                      standards.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">GitLens</h4>
                    <p className="text-muted">
                      Supercharges the Git capabilities in VS Code with blame
                      annotations and history.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Thunder Client</h4>
                    <p className="text-muted">
                      REST API client for VS Code - great alternative to Postman.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Auto Rename Tag</h4>
                    <p className="text-muted">
                      Automatically renames paired HTML/JSX tags when editing.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Bracket Pair Colorizer</h4>
                    <p className="text-muted">
                      Makes matching brackets easier to identify with colors.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terminal */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">Terminal &amp; Command Line</h3>
                <div className="grid gap-4">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Warp</h4>
                    <p className="text-muted">
                      Modern terminal with AI assistance, collaborative features,
                      and excellent developer experience.
                    </p>
                    <div className="uses-details">
                      <span className="uses-tag">macOS</span>
                      <a
                        href="https://www.warp.dev/"
                        className="uses-link"
                        target="_blank"
                        rel="noopener"
                      >
                        Visit →
                      </a>
                    </div>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Oh My Zsh</h4>
                    <p className="text-muted">
                      Framework for Zsh shell with plugins and themes that boost
                      productivity.
                    </p>
                    <div className="uses-details">
                      <span className="uses-tag">Shell</span>
                      <a
                        href="https://ohmyz.sh/"
                        className="uses-link"
                        target="_blank"
                        rel="noopener"
                      >
                        Visit →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tech Stack */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-accent">🚀 Tech Stack</h2>

            <div className="space-y-8">
              {/* Frontend */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">Frontend Development</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">React</h4>
                    <p className="text-muted">
                      My go-to library for building user interfaces. Love the
                      component-based architecture.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Next.js</h4>
                    <p className="text-muted">
                      React framework for production-ready applications with SSR,
                      SSG, and API routes.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Astro</h4>
                    <p className="text-muted">
                      Modern static site generator that I used to build this
                      website. Great for content-focused sites.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">TypeScript</h4>
                    <p className="text-muted">
                      Adds type safety to JavaScript. Essential for large
                      applications and team collaboration.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Tailwind CSS</h4>
                    <p className="text-muted">
                      Utility-first CSS framework that speeds up styling and keeps
                      designs consistent.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Framer Motion</h4>
                    <p className="text-muted">
                      Animation library for React that makes creating smooth
                      animations effortless.
                    </p>
                  </div>
                </div>
              </div>

              {/* Backend */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">Backend Development</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Node.js</h4>
                    <p className="text-muted">
                      JavaScript runtime for building scalable server-side
                      applications.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Express.js</h4>
                    <p className="text-muted">
                      Minimal and flexible Node.js web application framework.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">PostgreSQL</h4>
                    <p className="text-muted">
                      Reliable and feature-rich relational database for complex
                      applications.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">MongoDB</h4>
                    <p className="text-muted">
                      NoSQL database for flexible, document-based data storage.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Prisma</h4>
                    <p className="text-muted">
                      Modern database toolkit with type-safe client and powerful
                      migrations.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Redis</h4>
                    <p className="text-muted">
                      In-memory data structure store for caching and real-time
                      applications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Hardware */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-accent">🖥️ Hardware &amp; Setup</h2>

            <div className="space-y-8">
              {/* Computer */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">Computer</h3>
                <div className="grid gap-4">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">
                      MacBook Pro 14" (M1 Pro)
                    </h4>
                    <p className="text-muted">
                      Primary development machine with excellent performance and
                      portability. Perfect for development work and coding on the
                      go.
                    </p>
                    <div className="uses-details">
                      <span className="uses-tag">Primary</span>
                      <span className="uses-tag">2021</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accessories */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">Accessories</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">LG 27UK650-W 27"</h4>
                    <p className="text-muted">
                      4K UHD monitor with excellent color accuracy and USB-C
                      connectivity. Great for development and design work.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">
                      Logitech MX Mechanical Mini
                    </h4>
                    <p className="text-muted">
                      Compact wireless mechanical keyboard with tactile switches and
                      excellent battery life.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Logitech MX Master 3</h4>
                    <p className="text-muted">
                      Wireless mouse with precise tracking, customizable buttons,
                      and excellent ergonomics for productivity.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">AirPods Pro</h4>
                    <p className="text-muted">
                      Noise-canceling wireless earbuds for focused work and video
                      calls.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Services & Hosting */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-accent">
              ☁️ Services &amp; Hosting
            </h2>

            <div className="space-y-8">
              {/* Hosting */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">Hosting &amp; Deployment</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Vercel</h4>
                    <p className="text-muted">
                      Primary deployment platform for frontend applications.
                      Excellent DX and performance.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Netlify</h4>
                    <p className="text-muted">
                      Alternative hosting platform with great features for static
                      sites and serverless functions.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">AWS</h4>
                    <p className="text-muted">
                      Cloud services for more complex applications requiring
                      scalable infrastructure.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">DigitalOcean</h4>
                    <p className="text-muted">
                      Simple cloud hosting for backend services and databases.
                    </p>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">Development Services</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">GitHub</h4>
                    <p className="text-muted">
                      Version control and collaboration platform for all my
                      projects.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Sentry</h4>
                    <p className="text-muted">
                      Error tracking and performance monitoring for production
                      applications.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Cloudflare</h4>
                    <p className="text-muted">
                      CDN and DNS management for better performance and security.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">MongoDB Atlas</h4>
                    <p className="text-muted">
                      Managed MongoDB service for database hosting and management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Productivity */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-accent">
              📱 Productivity &amp; Apps
            </h2>

            <div className="space-y-8">
              {/* Design Tools */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">Design &amp; Creativity</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Figma</h4>
                    <p className="text-muted">
                      Collaborative design tool for UI/UX design and prototyping.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Canva</h4>
                    <p className="text-muted">
                      Quick graphic design for social media posts and presentations.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">CleanShot X</h4>
                    <p className="text-muted">
                      Screenshot and screen recording tool with annotation features.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">ImageOptim</h4>
                    <p className="text-muted">
                      Image compression tool to optimize images for web.
                    </p>
                  </div>
                </div>
              </div>

              {/* Productivity Apps */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">
                  Productivity &amp; Organization
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Notion</h4>
                    <p className="text-muted">
                      All-in-one workspace for notes, project management, and
                      documentation.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Todoist</h4>
                    <p className="text-muted">
                      Task management app to keep track of personal and work tasks.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">RescueTime</h4>
                    <p className="text-muted">
                      Time tracking app to understand and improve productivity
                      habits.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">1Blocker</h4>
                    <p className="text-muted">
                      Ad blocker for Safari to improve browsing experience and
                      privacy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Communication */}
              <div className="uses-category">
                <h3 className="mb-4 text-xl font-semibold">Communication</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Slack</h4>
                    <p className="text-muted">
                      Team communication and collaboration platform.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Discord</h4>
                    <p className="text-muted">
                      Community platform for developer communities and voice chats.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Zoom</h4>
                    <p className="text-muted">
                      Video conferencing for meetings and webinars.
                    </p>
                  </div>

                  <div className="uses-item">
                    <h4 className="font-medium text-accent">Proton Mail</h4>
                    <p className="text-muted">
                      Privacy-focused email service with end-to-end encryption and
                      secure communication.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Learning */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-accent">
              📚 Learning &amp; Resources
            </h2>

            <div className="uses-category">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="uses-item">
                  <h4 className="font-medium text-accent">MDN Web Docs</h4>
                  <p className="text-muted">
                    The definitive resource for web development documentation.
                  </p>
                </div>

                <div className="uses-item">
                  <h4 className="font-medium text-accent">Stack Overflow</h4>
                  <p className="text-muted">
                    Community-driven Q&amp;A platform for programming questions.
                  </p>
                </div>

                <div className="uses-item">
                  <h4 className="font-medium text-accent">GitHub</h4>
                  <p className="text-muted">
                    Exploring open source projects and learning from others' code.
                  </p>
                </div>

                <div className="uses-item">
                  <h4 className="font-medium text-accent">YouTube</h4>
                  <p className="text-muted">
                    Tech channels for staying updated with latest trends and
                    tutorials.
                  </p>
                </div>

                <div className="uses-item">
                  <h4 className="font-medium text-accent">Dev.to</h4>
                  <p className="text-muted">
                    Developer community for articles and discussions.
                  </p>
                </div>

                <div className="uses-item">
                  <h4 className="font-medium text-accent">Hacker News</h4>
                  <p className="text-muted">
                    Tech news and discussions from the developer community.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="prose prose-muted">
              <p>
                This page is inspired by{' '}
                <a
                  href="https://uses.tech/"
                  target="_blank"
                  rel="noopener"
                  className="text-accent hover:text-accent/80"
                >
                  uses.tech
                </a>{' '}
                and is regularly updated as my setup evolves. Some links may be affiliate
                links, but I only recommend tools I actually use and believe in.
              </p>
              <p className="text-sm text-muted">
                Have questions about any of these tools or want to suggest something new?{' '}
                <a href="/contact-me" className="text-accent hover:text-accent/80">
                  Feel free to reach out!
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
