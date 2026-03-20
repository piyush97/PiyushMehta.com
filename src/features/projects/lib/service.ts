// src/features/projects/lib/service.ts
import { fetchGitHubRepos, type FormattedRepo } from './github'
import { fallbackProjects } from '../data/fallback'
import { ok } from '../../../lib/result'
import type { Result } from '../../../lib/result'
import type { Project } from '../types'

// Merges live GitHub data with the fallback list.
// Fallback provides logo/color/tags not available from GitHub API.
// Live data provides updated liveUrl if set on the repo homepage.
function mergeWithFallback(liveRepos: FormattedRepo[], fallback: Project[]): Project[] {
  const liveByName = new Map<string, FormattedRepo>()
  for (const repo of liveRepos) {
    const name = repo.githubUrl.split('/').pop()
    if (name) liveByName.set(name, repo)
  }

  return fallback.map((project) => {
    const repoName = project.github?.split('/').pop()
    const live = repoName ? liveByName.get(repoName) : undefined
    if (!live) return project
    return { ...project, url: live.liveUrl ?? project.url }
  })
}

export async function getProjects(githubToken: string): Promise<Result<Project[]>> {
  try {
    const liveRepos = await fetchGitHubRepos('piyush97', githubToken)
    return ok(mergeWithFallback(liveRepos, fallbackProjects))
  } catch {
    // GitHub API failure is not fatal — serve fallback list silently
    return ok(fallbackProjects)
  }
}
