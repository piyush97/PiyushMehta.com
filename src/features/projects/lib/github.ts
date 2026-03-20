// src/features/projects/lib/github.ts
// NOTE: import.meta.env.GITHUB_TOKEN removed — Cloudflare Workers do not expose
// env vars via import.meta.env. Token is always passed as a parameter from the loader.

export interface FormattedRepo {
  id: string
  title: string
  description: string
  githubUrl: string
  liveUrl?: string
  technologies: string[]
}

export async function fetchGitHubRepos(
  username: string,
  token: string
): Promise<FormattedRepo[]> {
  const headers = new Headers()
  headers.append('Accept', 'application/vnd.github.v3+json')
  if (token) headers.append('Authorization', `token ${token}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      { headers, signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)

    const repos = await response.json() as Array<{
      id: number; name: string; description: string; html_url: string;
      homepage: string; fork: boolean; topics: string[]; language: string
    }>

    return repos
      .filter((r) => !r.fork)
      .map((r) => ({
        id: String(r.id),
        title: r.name,
        description: r.description ?? '',
        githubUrl: r.html_url,
        liveUrl: r.homepage || undefined,
        technologies: r.topics ?? [],
      }))
  } finally {
    clearTimeout(timeoutId)
  }
}
