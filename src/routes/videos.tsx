// src/routes/videos.tsx
import { createFileRoute } from '@tanstack/react-router'
import { videos } from '../features/videos/data/videos'
import { VideoCard } from '../features/videos/components/VideoCard'

export const Route = createFileRoute('/videos')({
  head: () => ({
    meta: [
      { title: 'Videos - Piyush Mehta' },
      {
        name: 'description',
        content:
          'Watch my latest videos on React, JavaScript, UI/UX, and software development. Learn through practical tutorials and insights.',
      },
    ],
  }),
  component: VideosPage,
})

function VideosPage() {
  return (
    <>
      {/* Enhanced Hero Section */}
      <section className="videos-hero-section">
        {/* Animated background elements */}
        <div className="videos-hero-bg-pattern"></div>
        <div className="videos-hero-bg-gradient"></div>
        <div className="videos-hero-particle-field">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
        </div>
        <div className="videos-hero-floating-elements">
          <div className="videos-floating-element videos-element-1">
            <div className="floating-icon">🎥</div>
            <div className="floating-pulse"></div>
          </div>
          <div className="videos-floating-element videos-element-2">
            <div className="floating-icon">📹</div>
            <div className="floating-pulse"></div>
          </div>
          <div className="videos-floating-element videos-element-3">
            <div className="floating-icon">🎬</div>
            <div className="floating-pulse"></div>
          </div>
        </div>

        {/* Content container */}
        <div className="relative z-10 container-base">
          <div className="py-16 text-center md:py-24">
            <div className="hero-content-wrapper">
              <p className="videos-hero-intro">
                <span className="intro-icon">📺</span>
                <span className="intro-text">Watch &amp; Learn</span>
              </p>
              <h1 className="videos-hero-title">
                <span className="title-primary">Video</span>
                <strong className="title-accent">Tutorials</strong>
                <div className="title-underline"></div>
              </h1>
              <p className="videos-hero-teaser">
                Learn <span className="highlight">React</span>,{' '}
                <span className="highlight">JavaScript</span>,{' '}
                <span className="highlight">UI/UX</span>, and software development
                through practical tutorials and insights. Subscribe for the latest
                content!
              </p>
              <div className="videos-hero-meta">
                <div className="meta-item">
                  <span className="meta-icon">🎯</span>
                  <span className="meta-text">Practical Tutorials</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📚</span>
                  <span className="meta-text">Learn by Doing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container">
        <div className="max-w-6xl container-base">
          {/* Videos Grid */}
          <section className="mb-16">
            <h2 className="mb-8 text-3xl font-bold text-center md:text-4xl text-text-primary">
              <span className="title-icon">🔥</span>
              Videos
            </h2>

            <div className="videos-grid">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>

          {/* YouTube Channel CTA */}
          <section className="youtube-cta">
            <div className="content-card text-center">
              <h2 className="mb-6 text-3xl font-bold md:text-4xl text-text-primary">
                <span className="title-icon">📺</span>
                Subscribe for More Content
              </h2>
              <p className="cta-description">
                Join thousands of developers learning through practical tutorials.
                New videos uploaded weekly covering the latest in web development!
              </p>
              <div className="cta-stats">
                <div className="stat-item">
                  <div className="stat-number">290+</div>
                  <div className="stat-label">Subscribers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">15K+</div>
                  <div className="stat-label">Views</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">48+</div>
                  <div className="stat-label">Videos</div>
                </div>
              </div>
              <a
                href="https://youtube.com/@CoderWhoKnows"
                target="_blank"
                rel="noopener"
                className="btn-primary btn-enhanced"
              >
                <span className="btn-content">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                    ></path>
                  </svg>
                  Subscribe on YouTube
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
          </section>
        </div>
      </div>
    </>
  )
}
