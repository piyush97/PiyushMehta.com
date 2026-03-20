// src/components/layout/Footer.tsx
const currentYear = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="border-t footer-section bg-light-950 border-card-border">
      <div className="py-12 container-base lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <div className="footer-brand">
              <h3 className="mb-4 text-xl font-bold text-accent">Piyush Mehta</h3>
              <p className="max-w-md mb-6 leading-relaxed text-text-secondary">
                Software Engineer based in Toronto, Ontario, Canada, passionate about building scalable
                applications, sharing knowledge through tech talks, and contributing to open source
                projects.
              </p>

              {/* Social Links */}
              <div className="footer-social">
                <h4 className="mb-3 text-sm font-semibold tracking-wider uppercase text-text-primary">
                  Connect with me
                </h4>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="https://github.com/piyush97"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label="GitHub"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="sr-only">GitHub</span>
                  </a>

                  <a
                    href="https://linkedin.com/in/piyush24"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="sr-only">LinkedIn</span>
                  </a>

                  <a
                    href="https://twitter.com/Piyushmehtas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label="Twitter"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                    <span className="sr-only">Twitter</span>
                  </a>

                  <a href="mailto:contact@piyushmehta.com" className="social-link" aria-label="Email">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="sr-only">Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h4 className="footer-column-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/" className="footer-link">Home</a></li>
              <li><a href="/about/" className="footer-link">About</a></li>
              <li><a href="/blog/" className="footer-link">Blog</a></li>
              <li><a href="/projects/" className="footer-link">Projects</a></li>
              <li><a href="/contact-me/" className="footer-link">Contact</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-column">
            <h4 className="footer-column-title">Resources</h4>
            <ul className="footer-links">
              <li><a href="/uses/" className="footer-link">Uses</a></li>
              <li><a href="/videos/" className="footer-link">Videos</a></li>
              <li>
                <a href="/rss.xml" className="footer-link" target="_blank" rel="noopener noreferrer">
                  RSS Feed
                </a>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="border-t footer-bottom border-card-border">
        <div className="py-6 container-base">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-sm footer-copyright text-text-secondary">
              <p>&copy; {currentYear} Piyush Mehta. All rights reserved.</p>
            </div>

            <div className="flex items-center gap-6 text-sm footer-meta">
              <span className="text-text-secondary">Built with love in Toronto, Canada</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
