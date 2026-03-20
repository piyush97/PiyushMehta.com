// src/routes/projects.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getProjects } from '../features/projects/lib/service'
import { ProjectList } from '../features/projects/components/ProjectList'
import { fallbackProjects } from '../features/projects/data/fallback'

export const Route = createFileRoute('/projects')({
  loader: async ({ context }) => {
    // Cloudflare Workers env is injected by the adapter into context
    const cfEnv =
      (context as { cloudflare?: { env?: Record<string, string> } })?.cloudflare
        ?.env ?? {}
    const githubToken = cfEnv.GITHUB_TOKEN ?? ''
    if (!githubToken) return fallbackProjects
    const result = await getProjects(githubToken)
    return result.ok ? result.data : fallbackProjects
  },
  head: () => ({ meta: [{ title: 'Projects — Piyush Mehta' }] }),
  component: ProjectsPage,
})

function ProjectsPage() {
  const projects = Route.useLoaderData()
  return (
    <div className="container-base">
      <h1>Projects</h1>
      <ProjectList projects={projects} />
    </div>
  )
}
