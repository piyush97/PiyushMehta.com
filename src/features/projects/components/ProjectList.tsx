// src/features/projects/components/ProjectList.tsx
import type { Project } from '../types'
import { ProjectCard } from './ProjectCard'

interface Props {
  projects: Project[]
}

export function ProjectList({ projects }: Props) {
  return (
    <div className="projects-grid">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
