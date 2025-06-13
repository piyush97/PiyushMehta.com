// src/utils/seo-redirects.js - Handles SEO-friendly redirects and canonicalization

/**
 * Middleware function for handling SEO redirects and canonicalization
 * @param {Request} request - The incoming request object
 * @returns {Response|null} - Redirect response or null to continue
 */
export function handleSeoRedirects(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Remove trailing slashes (except for root)
  if (path.length > 1 && path.endsWith('/')) {
    return new Response(null, {
      status: 301,
      headers: {
        Location: url.origin + path.slice(0, -1) + url.search,
      },
    });
  }
  
  // Enforce HTTPS and www subdomain removal
  if (url.hostname.startsWith('www.')) {
    const newUrl = new URL(request.url);
    newUrl.hostname = newUrl.hostname.replace(/^www\./, '');
    return new Response(null, {
      status: 301,
      headers: {
        Location: newUrl.toString(),
      },
    });
  }
  
  // Add more redirect rules as needed
  const redirects = {
    '/cv': '/resume',
    '/react': '/react-developer',
    '/developer': '/services',
    '/hire-me': '/contact-me',
    '/piyush-mehta': '/about',
    '/piyush': '/about',
  };
  
  if (redirects[path]) {
    return new Response(null, {
      status: 301,
      headers: {
        Location: url.origin + redirects[path] + url.search,
      },
    });
  }
  
  // Handle old blog post URLs (if they were previously different format)
  if (path.match(/^\/posts\/(.+)$/)) {
    const slug = path.replace('/posts/', '');
    return new Response(null, {
      status: 301,
      headers: {
        Location: `${url.origin}/blog/${slug}${url.search}`,
      },
    });
  }
  
  // Continue with normal request processing
  return null;
}

// Export function to format canonical URLs for the site
export function getCanonicalUrl(path) {
  // Ensure path starts with a slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Remove trailing slash except for homepage
  const cleanPath = formattedPath.length > 1 && formattedPath.endsWith('/')
    ? formattedPath.slice(0, -1)
    : formattedPath;
    
  return `https://piyushmehta.com${cleanPath}`;
}
