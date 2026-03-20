// src/features/videos/components/VideoCard.tsx
import type { Video } from '../data/videos'

interface Props { video: Video }
export function VideoCard({ video }: Props) {
  return (
    <article className="video-card">
      <a href={video.url} target="_blank" rel="noopener noreferrer">
        <img src={video.thumbnail} alt={video.title} className="video-thumbnail" loading="lazy" />
        <div className="video-content">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-description">{video.description}</p>
        </div>
      </a>
    </article>
  )
}
