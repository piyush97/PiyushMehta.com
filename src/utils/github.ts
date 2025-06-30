/**
 * GitHub API utilities for fetching repositories
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string;
  topics: string[];
}

export interface FormattedRepo {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl: string;
  liveUrl?: string;
  imageUrl?: string;
  category: string;
  featured: boolean;
  year: number;
}

/**
 * Fetches repositories from a GitHub user
 *
 * @param username The GitHub username
 * @param token Optional GitHub token for authentication
 * @returns A Promise resolving to an array of formatted repositories
 */
export async function fetchGitHubRepos(
  username: string,
  token?: string
): Promise<FormattedRepo[]> {
  try {
    // Set up request headers
    const headers = new Headers();
    headers.append('Accept', 'application/vnd.github.v3+json');

    // Add authentication token if available (for higher rate limits)
    if (token) {
      headers.append('Authorization', `token ${token}`);
      console.log('Using GitHub token for API requests');
    } else {
      // Try to use the environment variable if token is not provided directly
      const envToken = import.meta.env.GITHUB_TOKEN;
      if (envToken) {
        headers.append('Authorization', `token ${envToken}`);
        console.log('Using GitHub token from environment for API requests');
      } else {
        console.log(
          'No GitHub token found. Using unauthenticated requests (rate limited).'
        );
      }
    }

    // Fetch repositories with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      { 
        headers,
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos: GitHubRepo[] = await response.json();

    // Filter out forks and empty repos, and format them for our component
    return repos
      .filter((repo) => !repo.fork && repo.description) // Filter out forks and repos without descriptions
      .map((repo) => formatRepo(repo))
      .sort((a, b) => b.year - a.year); // Sort by year (newest first)
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return [];
  }
}

/**
 * Formats a GitHub repository to match our ProjectShowcase component format
 */
function formatRepo(repo: GitHubRepo): FormattedRepo {
  // Determine if the repo should be featured based on stars or other criteria
  const isFeatured = repo.stargazers_count >= 5;

  // Determine the technologies based on repo language and topics
  const technologies = [repo.language]
    .concat(repo.topics || [])
    .filter(Boolean) // Remove null/undefined values
    .map((tech) => (typeof tech === 'string' ? tech : ''));

  // Create a year from the created_at date
  const year = new Date(repo.created_at).getFullYear();

  // Determine category based on topics or make a best guess
  let category = 'personal';
  if (repo.topics?.includes('api') || repo.topics?.includes('backend')) {
    category = 'backend';
  } else if (
    repo.topics?.includes('frontend') ||
    repo.topics?.includes('website')
  ) {
    category = 'frontend';
  } else if (
    repo.topics?.includes('fullstack') ||
    repo.topics?.includes('full-stack')
  ) {
    category = 'fullstack';
  } else if (
    repo.topics?.includes('tool') ||
    repo.topics?.includes('utility')
  ) {
    category = 'tool';
  }

  // Generate a placeholder image if we don't have one
  // This creates a colored box with the first letter of the repo name
  const primaryLanguage = repo.language || 'Code';
  const colorMap: Record<string, string> = {
    JavaScript: '#f7df1e',
    TypeScript: '#3178c6',
    Python: '#3776ab',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    Ruby: '#701516',
    Go: '#00ADD8',
    PHP: '#4F5D95',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Rust: '#dea584',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Shell: '#89e051',
    Vue: '#41b883',
    React: '#61dafb',
    Node: '#339933',
    Code: '#6e768c',
  };

  const bgColor = colorMap[primaryLanguage] || '#6e768c';
  const firstLetter = repo.name.charAt(0).toUpperCase();

  // Generate image URL based on the repository details
  let imageUrl: string;

  try {
    // Primary option: Use GitHub's OpenGraph image for all repositories
    // Format: https://opengraph.githubassets.com/1/username/repo
    imageUrl = `https://opengraph.githubassets.com/1/${repo.full_name}`;

    // For empty repositories or those with minimal information, we might want a fallback
    // But we'll still try the OpenGraph URL first and let the error handler in the component work
  } catch (error) {
    console.error(`Error generating image URL for ${repo.name}:`, error);

    // Fallback to a simple placeholder in case of any errors
    const displayText = encodeURIComponent(
      repo.name.length <= 10 ? repo.name : firstLetter
    );
    imageUrl = `https://via.placeholder.com/300x150/${bgColor.replace('#', '')}/${getContrastColor(bgColor)}?text=${displayText}`;
  }

  return {
    id: repo.id.toString(),
    title: repo.name,
    description: repo.description || '',
    technologies,
    githubUrl: repo.html_url,
    liveUrl: repo.homepage || undefined,
    imageUrl,
    category,
    featured: isFeatured,
    year,
  };
}

/**
 * Determine a contrasting color (black or white) based on background color
 */
function getContrastColor(hexColor: string): string {
  // Remove the # if it exists
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = Number.parseInt(hex.substring(0, 2), 16);
  const g = Number.parseInt(hex.substring(2, 4), 16);
  const b = Number.parseInt(hex.substring(4, 6), 16);

  // Calculate luminance - human eye favors green over red over blue
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for bright colors, white for dark colors
  return luminance > 0.5 ? '000000' : 'ffffff';
}
