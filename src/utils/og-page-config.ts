// 🎨 Intelligent OG Image Configuration for All Pages
// Automatically determines optimal templates and themes for different page types

export interface PageOGConfig {
  title: string;
  description: string;
  template: 'default' | 'minimal' | 'tech' | 'blog' | 'cyber' | 'gradient' | 'terminal' | 'modern' | 'professional';
  theme: 'dark' | 'light' | 'retro' | 'neon' | 'corporate' | 'warm' | 'ocean';
  tags?: string[];
  category?: string;
}

// 🌟 Page Configuration Registry
export const PAGE_CONFIGS: Record<string, PageOGConfig> = {
  // 🏠 Homepage
  '/': {
    title: 'Piyush Mehta - Senior Software Engineer & Full Stack Developer',
    description: 'Expert React.js, Node.js developer in Canada. 5+ years experience building scalable web applications, enterprise software, and providing technical consulting.',
    template: 'professional',
    theme: 'corporate',
    tags: ['software-engineer', 'react', 'nodejs', 'canada', 'consulting'],
    category: 'Portfolio',
  },

  // 👨‍💻 About Page
  '/about': {
    title: 'About Piyush Mehta - Software Engineer & Tech Leader',
    description: 'Senior Software Engineer with 5+ years of experience in Canada. Passionate about React.js, Node.js, system architecture, and building teams.',
    template: 'professional',
    theme: 'warm',
    tags: ['about', 'software-engineer', 'leadership', 'experience'],
    category: 'About',
  },

  // 💼 Services Page
  '/services': {
    title: 'Software Development Services - Expert Consulting & Development',
    description: 'Professional software engineering services: React.js development, Node.js APIs, system architecture, technical consulting, and enterprise solutions.',
    template: 'professional',
    theme: 'corporate',
    tags: ['services', 'consulting', 'development', 'enterprise', 'architecture'],
    category: 'Services',
  },

  // 🚀 Projects Page
  '/projects': {
    title: 'Software Projects & Open Source Contributions',
    description: 'Showcase of innovative software projects, open source contributions, and technical solutions built with React.js, Node.js, and modern technologies.',
    template: 'tech',
    theme: 'neon',
    tags: ['projects', 'open-source', 'portfolio', 'innovation', 'react', 'nodejs'],
    category: 'Portfolio',
  },

  // 📧 Contact Page
  '/contact-me': {
    title: 'Contact Piyush Mehta - Software Engineering Consultation',
    description: 'Get in touch for software development projects, technical consulting, architecture reviews, or collaboration opportunities.',
    template: 'minimal',
    theme: 'ocean',
    tags: ['contact', 'consultation', 'collaboration', 'hire'],
    category: 'Contact',
  },

  // 📄 Resume Page
  '/resume': {
    title: 'Piyush Mehta - Software Engineer Resume & Experience',
    description: 'Comprehensive resume showcasing 5+ years of software engineering experience, technical skills, achievements, and professional background.',
    template: 'professional',
    theme: 'corporate',
    tags: ['resume', 'experience', 'skills', 'career', 'professional'],
    category: 'Resume',
  },

  // 🎬 Videos Page
  '/videos': {
    title: 'Tech Talks & Video Content - Software Engineering Insights',
    description: 'Educational videos, tech talks, and software engineering content covering React.js, Node.js, system design, and industry best practices.',
    template: 'gradient',
    theme: 'retro',
    tags: ['videos', 'tech-talks', 'education', 'content', 'speaking'],
    category: 'Content',
  },

  // 🛠️ Uses Page
  '/uses': {
    title: 'Tools & Technologies I Use - Software Development Setup',
    description: 'Complete overview of my software development setup, tools, technologies, hardware, and resources that power my daily work.',
    template: 'tech',
    theme: 'dark',
    tags: ['tools', 'setup', 'technology', 'development', 'resources'],
    category: 'Resources',
  },

  // 📚 Blog Main Page
  '/blog': {
    title: 'Technical Blog - Software Engineering & Web Development',
    description: 'In-depth articles on software engineering, React.js, Node.js, system design, performance optimization, and industry best practices.',
    template: 'modern',
    theme: 'dark',
    tags: ['blog', 'articles', 'software-engineering', 'web-development', 'technical'],
    category: 'Blog',
  },

  // ⚛️ React Developer Page
  '/react-developer': {
    title: 'Expert React.js Developer - Modern Web Application Development',
    description: 'Specialized React.js development services: component architecture, state management, performance optimization, and modern web applications.',
    template: 'tech',
    theme: 'neon',
    tags: ['react', 'developer', 'frontend', 'components', 'modern-web'],
    category: 'Services',
  },

  // 🔒 Privacy Policy
  '/privacy-policy': {
    title: 'Privacy Policy - Data Protection & User Privacy',
    description: 'Comprehensive privacy policy outlining how we collect, use, and protect your personal information and data.',
    template: 'minimal',
    theme: 'light',
    tags: ['privacy', 'policy', 'data-protection', 'legal'],
    category: 'Legal',
  },

  // 📋 Terms of Service
  '/terms-of-service': {
    title: 'Terms of Service - Website Terms & Conditions',
    description: 'Terms and conditions for using this website and engaging with our software development services.',
    template: 'minimal',
    theme: 'light',
    tags: ['terms', 'conditions', 'legal', 'service'],
    category: 'Legal',
  },

  // 📱 Offline Page
  '/offline': {
    title: 'Offline - Connect to Continue',
    description: 'You are currently offline. Please check your internet connection to access the latest content.',
    template: 'minimal',
    theme: 'dark',
    tags: ['offline', 'connection', 'status'],
    category: 'System',
  },
};

// 🎯 Dynamic Configuration Generator
export function generatePageConfig(pathname: string, customTitle?: string, customDescription?: string): PageOGConfig {
  // Check for exact match first
  if (PAGE_CONFIGS[pathname]) {
    const config = PAGE_CONFIGS[pathname];
    return {
      ...config,
      title: customTitle || config.title,
      description: customDescription || config.description,
    };
  }

  // Handle blog post pattern
  if (pathname.startsWith('/blog/')) {
    return {
      title: customTitle || 'Technical Article - Software Engineering Insights',
      description: customDescription || 'Deep dive into software engineering concepts, best practices, and real-world solutions.',
      template: 'modern',
      theme: 'dark',
      tags: ['blog', 'article', 'technical', 'software-engineering'],
      category: 'Article',
    };
  }

  // Handle dynamic routes and fallbacks
  if (pathname.includes('project')) {
    return {
      title: customTitle || 'Software Project Showcase',
      description: customDescription || 'Innovative software project demonstrating modern development practices and technologies.',
      template: 'tech',
      theme: 'neon',
      tags: ['project', 'showcase', 'development'],
      category: 'Project',
    };
  }

  // Default fallback configuration
  return {
    title: customTitle || 'Piyush Mehta - Software Engineer',
    description: customDescription || 'Professional software engineering and development services.',
    template: 'professional',
    theme: 'corporate',
    tags: ['software-engineer', 'development'],
    category: 'Portfolio',
  };
}

// 🌈 Theme-Based Template Recommendations
export const THEME_TEMPLATE_MAPPING = {
  'dark': ['modern', 'tech', 'terminal'],
  'light': ['minimal', 'professional'],
  'retro': ['gradient', 'cyber'],
  'neon': ['tech', 'cyber', 'terminal'],
  'corporate': ['professional', 'modern'],
  'warm': ['professional', 'gradient'],
  'ocean': ['minimal', 'modern'],
} as const;

// 🎨 Content-Based Theme Selection
export function selectThemeForContent(content: string, tags: string[] = []): PageOGConfig['theme'] {
  const contentLower = content.toLowerCase();
  const allTags = tags.map(tag => tag.toLowerCase());

  // Technical/Code content
  if (contentLower.includes('code') || contentLower.includes('programming') || 
      allTags.some(tag => ['javascript', 'react', 'node', 'typescript', 'api'].includes(tag))) {
    return 'neon';
  }

  // Business/Professional content
  if (contentLower.includes('business') || contentLower.includes('enterprise') ||
      allTags.some(tag => ['consulting', 'enterprise', 'professional'].includes(tag))) {
    return 'corporate';
  }

  // Creative/Design content
  if (contentLower.includes('design') || contentLower.includes('creative') ||
      allTags.some(tag => ['ui', 'ux', 'design', 'creative'].includes(tag))) {
    return 'warm';
  }

  // Security/Systems content
  if (contentLower.includes('security') || contentLower.includes('system') ||
      allTags.some(tag => ['security', 'devops', 'infrastructure'].includes(tag))) {
    return 'dark';
  }

  // Data/Analytics content
  if (contentLower.includes('data') || contentLower.includes('analytics') ||
      allTags.some(tag => ['data', 'analytics', 'performance'].includes(tag))) {
    return 'ocean';
  }

  // Default to dark theme
  return 'dark';
}

// 🎯 Template Selection Algorithm
export function selectTemplateForContent(
  pageType: 'article' | 'website' | 'project' | 'about' | 'contact' | 'services',
  tags: string[] = [],
  isLongForm: boolean = false
): PageOGConfig['template'] {
  const allTags = tags.map(tag => tag.toLowerCase());

  switch (pageType) {
    case 'article':
      if (allTags.some(tag => ['tutorial', 'guide', 'howto'].includes(tag))) {
        return 'modern';
      }
      if (allTags.some(tag => ['javascript', 'react', 'node', 'typescript'].includes(tag))) {
        return 'tech';
      }
      return isLongForm ? 'modern' : 'blog';

    case 'project':
      if (allTags.some(tag => ['open-source', 'github', 'library'].includes(tag))) {
        return 'tech';
      }
      return 'gradient';

    case 'services':
    case 'about':
      return 'professional';

    case 'contact':
      return 'minimal';

    default:
      return 'professional';
  }
}

// 🚀 Smart Configuration Builder
export function buildSmartOGConfig(
  pathname: string,
  title?: string,
  description?: string,
  tags?: string[],
  pageType?: 'article' | 'website' | 'project' | 'about' | 'contact' | 'services'
): PageOGConfig {
  // Start with base configuration
  const baseConfig = generatePageConfig(pathname, title, description);

  // Override with smart selections if we have additional context
  if (title && description && tags && pageType) {
    const smartTheme = selectThemeForContent(`${title} ${description}`, tags);
    const smartTemplate = selectTemplateForContent(pageType, tags, description.length > 150);

    return {
      ...baseConfig,
      title,
      description,
      template: smartTemplate,
      theme: smartTheme,
      tags: tags.slice(0, 5), // Limit tags for URL safety
    };
  }

  return baseConfig;
}