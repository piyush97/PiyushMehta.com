# GitHub API Integration

This website can fetch projects directly from your GitHub profile. To increase API rate limits and enable private repository access, you can add a GitHub Personal Access Token.

## Setting up a GitHub Personal Access Token

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "Portfolio Website")
4. Set an expiration date
5. For permissions, you only need to select the "public_repo" scope
6. Click "Generate token" and copy the token

## Adding the token to your environment

For local development, create a `.env` file in the root of your project with:

```
GITHUB_TOKEN=your_token_here
```

For deployment, add this environment variable to your hosting platform:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment
- **Cloudflare Pages**: Settings → Environment Variables

## Customizing the GitHub Integration

### Changing the GitHub username

To display repositories from a different GitHub account, update the username in `src/pages/projects.astro`:

```typescript
const githubUsername = 'your-username';
```

### Modifying project display logic

The GitHub repository formatting logic is in `src/utils/github.ts`. You can modify how repositories are categorized, which ones are featured, and how they're displayed.

## Benefits of using a token

- Higher API rate limits (5,000 requests per hour vs 60 for unauthenticated requests)
- Ability to access private repositories (if the token has appropriate permissions)
- More reliable access to GitHub API

Without a token, the site will still work but may hit rate limits if accessed frequently. The site also includes fallback project data in case the GitHub API cannot be accessed.

## Implementation Details

- Projects are fetched at build time via the GitHub API using the Astro SSR capability
- The `fetchGitHubRepos` function in `src/utils/github.ts` handles the API request and formatting
- A fallback mechanism ensures projects are displayed even if the GitHub API is unavailable
- Each project includes details like technologies, description, and links to GitHub/live demo
