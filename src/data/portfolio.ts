export interface PortfolioMetric {
  value: string;
  label: string;
  detail: string;
}

export interface CaseStudy {
  title: string;
  eyebrow: string;
  role: string;
  timeframe: string;
  summary: string;
  problem: string;
  approach: string[];
  outcomes: string[];
  stack: string[];
  links?: {
    label: string;
    href: string;
  }[];
}

export interface WritingHighlight {
  title: string;
  href: string;
  description: string;
  theme: string;
}

export interface ResumeRole {
  title: string;
  company: string;
  location: string;
  timeframe: string;
  summary: string;
  highlights: string[];
}

export interface SkillGroup {
  title: string;
  items: string[];
}

export interface Achievement {
  title: string;
  detail: string;
}

export interface ContactChannel {
  label: string;
  href: string;
  note: string;
}

export interface ContactTopic {
  title: string;
  detail: string;
}

export interface PageFeature {
  title: string;
  description: string;
}

export interface ServiceEngagement {
  title: string;
  summary: string;
  usefulFor: string[];
}

export interface ToolCategory {
  title: string;
  description: string;
  items: string[];
}

export interface VideoHighlight {
  id: string;
  title: string;
  description: string;
  topic: string;
}

export const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/piyush97' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/piyush24' },
  { label: 'Email', href: 'mailto:contact@piyushmehta.com' },
];

export const portfolioMetrics: PortfolioMetric[] = [
  {
    value: '5+',
    label: 'years building production software',
    detail: 'Enterprise consulting, product engineering, developer education, and platform work.',
  },
  {
    value: '30%',
    label: 'workflow efficiency gain',
    detail: 'AI dashboards and chatbot delivery across enterprise workflow programs.',
  },
  {
    value: '35%',
    label: 'vulnerability reduction',
    detail: 'Secure coding, SonarQube assessment, and review loops for enterprise applications.',
  },
  {
    value: '1,500+',
    label: 'developers mentored',
    detail: 'Google Developer Student Clubs and workshop leadership.',
  },
];

export const caseStudies: CaseStudy[] = [
  {
    title: 'Enterprise AI Workflows',
    eyebrow: 'AI systems for consulting clients',
    role: 'Senior Software Consultant / Senior Software Engineer',
    timeframe: '2023-2026',
    summary:
      'Designed AI-assisted dashboards, chatbots, and internal workflow tools for enterprise teams where correctness, adoption, and security mattered more than novelty.',
    problem:
      'Teams had fragmented processes, slow manual workflows, and rising pressure to introduce AI without weakening controls or maintainability.',
    approach: [
      'Started with workflow bottlenecks and failure modes before choosing model or UI patterns.',
      'Built TypeScript and Node.js services with PostgreSQL-backed state and Azure/OpenAI integrations.',
      'Applied secure coding practices, vulnerability scanning, and review loops to keep AI features operationally grounded.',
    ],
    outcomes: [
      'Improved client workflow efficiency by 30%.',
      'Reduced tracked vulnerabilities by 35% through secure coding, scanning, and review loops.',
      'Helped teams adopt AI integration patterns that could survive beyond a prototype.',
    ],
    stack: ['TypeScript', 'Node.js', 'PostgreSQL', 'Azure', 'OpenAI', 'SonarQube'],
  },
  {
    title: 'Scalable Product Platform',
    eyebrow: 'Nuclei product engineering',
    role: 'Full Stack Developer',
    timeframe: '2020-2021',
    summary:
      'Worked on a scalable progressive web application and supporting services for a product organization, balancing UX polish with system reliability.',
    problem:
      'The product needed maintainable application structure, secure data handling, and infrastructure work that could support growing usage.',
    approach: [
      'Used React, Node.js, SQL, and practical design patterns to keep the application understandable as features grew.',
      'Improved data protection and security posture as part of day-to-day feature work.',
      'Automated analytics infrastructure with AWS microservices to reduce operational load.',
    ],
    outcomes: [
      'Reduced vulnerabilities by 40%.',
      'Cut analytics operating costs by 25%.',
      'Contributed UX and review work connected to a 62% retention lift.',
    ],
    stack: ['React', 'Node.js', 'SQL', 'AWS', 'Microservices'],
    links: [{ label: 'Nuclei', href: 'https://gonuclei.com/' }],
  },
  {
    title: 'PiyushMehta.com',
    eyebrow: 'Personal platform as engineering proof',
    role: 'Owner and engineer',
    timeframe: 'Ongoing',
    summary:
      'A content and portfolio platform built with Astro, MDX, React islands, Open Graph generation, RSS, sitemap generation, search, and deployment automation.',
    problem:
      'The previous site had energy, but it leaned on broad SEO claims and visual noise instead of making engineering judgment easy to inspect.',
    approach: [
      'Moved the site toward a typed data model, evidence-led case studies, and smaller runtime surfaces.',
      'Kept Astro because the product is content-led and benefits from low JavaScript by default.',
      'Separated redesign risk from the future Astro 6 and Tailwind 4 migration path.',
    ],
    outcomes: [
      'Clearer first impression for engineering leaders.',
      'A reusable structure for adding future case studies and migration notes.',
      'A stronger base for lint, type, build, RSS, and browser verification.',
    ],
    stack: ['Astro', 'TypeScript', 'MDX', 'Tailwind CSS', 'React islands', 'Vercel'],
    links: [
      { label: 'Live site', href: 'https://piyushmehta.com/' },
      { label: 'Source', href: 'https://github.com/piyush97/PiyushMehta.com' },
    ],
  },
  {
    title: 'Homelab and GitOps',
    eyebrow: 'Infrastructure thinking in public',
    role: 'Builder and operator',
    timeframe: '2025',
    summary:
      'A Proxmox homelab and GitOps setup for self-hosting, observability, infrastructure as code, and operational discipline outside work constraints.',
    problem:
      'Real infrastructure learning needs failure, recovery, documentation, and repeatability, not just toy deployments.',
    approach: [
      'Documented services, operating choices, and tradeoffs in public repositories.',
      'Used infrastructure as code and GitOps patterns to keep changes reviewable.',
      'Treated the lab as a place to practice production instincts at smaller scale.',
    ],
    outcomes: [
      'Public documentation for a multi-service homelab.',
      'Repeatable infrastructure experiments across Proxmox, containers, and monitoring.',
      'A visible signal of infrastructure thinking beyond application code.',
    ],
    stack: ['Proxmox', 'LXC', 'Terraform', 'GitOps', 'Shell', 'Monitoring'],
    links: [
      { label: 'Homelab docs', href: 'https://piyush97.github.io/homelab-docs/' },
      { label: 'Homelab repo', href: 'https://github.com/piyush97/Homelab' },
    ],
  },
  {
    title: 'Interview Prep Portal',
    eyebrow: 'AI product, open source',
    role: 'Creator and engineer',
    timeframe: '2025',
    summary:
      'An open-source, terminal-first AI tool that scores resumes against job descriptions, generates behavioral interview stories, writes negotiation scripts, and scans job boards.',
    problem:
      "Job hunting tools are fragmented, expensive, and rarely grounded in a candidate's actual experience — most give generic advice instead of personal output.",
    approach: [
      'Built a Python + FastAPI backend with typed tool endpoints driving an in-browser chat.',
      'Scored resumes against live job descriptions and generated stories and scripts from real work history.',
      'Kept it open source and terminal-first to stay fast and free for engineers.',
    ],
    outcomes: [
      'A free, usable AI interview workflow from resume score to negotiation.',
      'Public code that proves the full-stack engineer shipping AI positioning.',
    ],
    stack: ['Python', 'FastAPI', 'React', 'AI agents', 'Open source'],
    links: [{ label: 'Repo', href: 'https://github.com/piyush97/interview-prep-portal' }],
  },
  {
    title: 'Developer Education and Talks',
    eyebrow: 'Community leadership',
    role: 'Speaker, mentor, workshop lead',
    timeframe: '2018 onward',
    summary:
      'Led workshops, mentored developers, spoke at community events, and turned technical learning into material other engineers can use.',
    problem:
      'Good engineering culture scales when people can explain systems clearly and make others stronger.',
    approach: [
      'Created practical workshop material around web development, security, and developer workflows.',
      'Mentored large cohorts through Google Developer Student Clubs and community events.',
      'Continued publishing technical writing that explains architecture and operational tradeoffs.',
    ],
    outcomes: [
      'Mentored 1,500+ developers.',
      'Supported 200+ job placements through community leadership work.',
      'Built a visible writing library around systems, migrations, and developer productivity.',
    ],
    stack: ['Teaching', 'Workshops', 'Technical writing', 'Community leadership'],
    links: [{ label: 'Workshops', href: 'https://piyush97.github.io/Workshops/' }],
  },
];

export const writingHighlights: WritingHighlight[] = [
  {
    title: 'What I Learned About AI Agents, MCP, and the Next Supply Chain Risk',
    href: '/blog/ai-agents-mcp-security-crisis',
    theme: 'AI agents',
    description:
      'A hands-on look at agentic systems, MCP, and where the next supply chain risk actually shows up.',
  },
  {
    title:
      'How I Designed an AI Chat App That Handles a Million Users (And the Mistakes That Almost Killed It)',
    href: '/blog/ai-chat-system-design-million-users',
    theme: 'System design',
    description:
      'A real design walkthrough of AI chat architecture at scale, including the failure modes that almost broke it.',
  },
  {
    title:
      'STAR+R: The Behavioral Interview Framework That Lands Senior Offers (With 5 Real Stories)',
    href: '/blog/star-r-behavioral-interviews',
    theme: 'Career',
    description:
      'A practical framework for structuring senior behavioral answers, grounded in real interview stories.',
  },
];

export const technologyPrinciples = [
  'Start with the workflow and failure modes before choosing the implementation shape.',
  'Keep systems observable, typed, and boring where reliability matters most.',
  'Document tradeoffs clearly so teams can change direction without losing context.',
  'Use evidence, tests, and operational feedback to decide when an abstraction has earned its keep.',
];

export const resumeQuickFacts = [
  { label: 'Based in', value: 'Canada' },
  { label: 'Current lane', value: 'Senior software engineering' },
  { label: 'Focus', value: 'AI workflows, web platforms, system design' },
  { label: 'Audience', value: 'Engineering leaders, teams, founders' },
];

export const resumeRoles: ResumeRole[] = [
  {
    title: 'Senior Software Engineer',
    company: 'Tundra Technical Solutions',
    location: 'Remote',
    timeframe: 'Jul 2025 - Present',
    summary:
      'Driving enterprise software and AI delivery where teams need usable systems, not demo-only prototypes.',
    highlights: [
      'Lead architecture and delivery of enterprise software and AI agent workflows for a major Ontario energy client.',
      'Build LLM-powered systems — RAG, MCP tools, agentic pipelines — focused on maintainability and operational fit.',
      'Coach teams on secure, durable engineering practices.',
    ],
  },
  {
    title: 'Senior Software Consultant',
    company: 'BDO Canada LLP',
    location: 'Oakville, ON, Canada',
    timeframe: 'Jan 2023 - Jun 2025',
    summary:
      'Built internal and client-facing platforms across AI, automation, and secure application delivery.',
    highlights: [
      'Delivered AI dashboards and chatbots with Azure, OpenAI, Node.js, TypeScript, and PostgreSQL.',
      'Improved workflow efficiency by 30% and reduced vulnerabilities by 35%.',
      'Worked across teams and clients including OPG, GreenShield Canada, and BDO USA.',
    ],
  },
  {
    title: 'Full Stack Developer',
    company: 'Nuclei',
    location: 'Bangalore, India',
    timeframe: 'Jan 2020 - Dec 2021',
    summary:
      'Worked on product engineering, application structure, security posture, and analytics infrastructure.',
    highlights: [
      'Built scalable product features with React, Node.js, SQL, and AWS.',
      'Reduced vulnerabilities by 40% through stronger data handling and secure practices.',
      'Helped drive UX and platform improvements tied to retention growth.',
    ],
  },
  {
    title: 'DSC Lead Intern',
    company: 'Google',
    location: 'Bangalore, India',
    timeframe: 'Dec 2018 - May 2020',
    summary: 'Focused on developer education, workshops, and community leadership at scale.',
    highlights: [
      'Mentored 1,500+ developers in web engineering and system design topics.',
      'Supported 200+ job placements through teaching and coaching.',
      'Organized DevFest events and hands-on learning programs.',
    ],
  },
];

export const resumeSkillGroups: SkillGroup[] = [
  {
    title: 'Languages',
    items: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'SQL'],
  },
  {
    title: 'Frontend and app',
    items: ['React', 'Next.js', 'Astro', 'React Native', 'Tailwind CSS'],
  },
  {
    title: 'Backend and platforms',
    items: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis', 'REST APIs', 'Microservices'],
  },
  {
    title: 'Cloud and delivery',
    items: ['Azure', 'AWS', 'Vercel', 'Docker', 'Kubernetes', 'Terraform'],
  },
];

export const resumeEducation = [
  {
    degree: 'Master of Applied Computing',
    school: 'University of Windsor',
    location: 'Windsor, ON, Canada',
    timeframe: '2022 - 2023',
  },
  {
    degree: 'Bachelor of Engineering in Information Science and Engineering',
    school: 'Ramaiah Institute of Technology',
    location: 'Bangalore, India',
    timeframe: '2016 - 2020',
  },
];

export const resumeAchievements: Achievement[] = [
  {
    title: 'Microsoft Certified: Azure AI Engineer Associate',
    detail: 'Credential ID: A7694B155AFA9F38',
  },
  {
    title: 'Polygon Hackathon Winner',
    detail: '$10,000 prize for Divvy in 2021.',
  },
  {
    title: 'Smart India Hackathon Winner',
    detail: 'Recognized in 2018 for product execution and delivery.',
  },
  {
    title: 'Golden Recognition Award, BDO Canada',
    detail: 'Awarded for strong performance and delivery impact.',
  },
];

export const contactChannels: ContactChannel[] = [
  {
    label: 'Email',
    href: 'mailto:contact@piyushmehta.com',
    note: 'Best for projects, speaking requests, and thoughtful technical context.',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/piyush24',
    note: 'Good for professional outreach, introductions, and longer-term opportunities.',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/piyush97',
    note: 'Useful when you want to point me at code, repos, or public work.',
  },
];

export const contactTopics: ContactTopic[] = [
  {
    title: 'Engineering leadership help',
    detail: 'Architecture reviews, migration thinking, delivery tradeoffs, and platform direction.',
  },
  {
    title: 'AI workflow work',
    detail:
      'Internal tools, enterprise copilots, retrieval flows, and operationalizing model-backed features.',
  },
  {
    title: 'Speaking and workshops',
    detail: 'Conference talks, team sessions, and practical engineering education.',
  },
  {
    title: 'Product and platform builds',
    detail:
      'TypeScript-heavy web systems, content platforms, and reliability-focused product work.',
  },
];

export const contactPrompts = [
  'What problem are you trying to solve?',
  'Which constraints matter most: time, quality, compliance, reliability, or team bandwidth?',
  'What kind of help do you want: build, review, strategy, or speaking?',
];

export const aboutFocusAreas: PageFeature[] = [
  {
    title: 'Systems that keep working',
    description:
      'I like software that can be explained, operated, reviewed, and changed after the first successful release.',
  },
  {
    title: 'AI with product discipline',
    description:
      'AI work is strongest when it starts with real workflows, clear failure modes, and guardrails teams can live with.',
  },
  {
    title: 'Teaching as engineering leverage',
    description:
      'Talks, workshops, mentoring, and writing sharpen how teams reason about tradeoffs together.',
  },
];

export const serviceEngagements: ServiceEngagement[] = [
  {
    title: 'Architecture and delivery reviews',
    summary:
      'A focused read on system shape, tradeoffs, delivery risk, and the next decisions that will matter.',
    usefulFor: ['Migration planning', 'Reliability work', 'Technical debt triage'],
  },
  {
    title: 'AI workflow implementation',
    summary:
      'Practical AI features that start with workflow reality, not a model demo, with security and adoption in view.',
    usefulFor: ['Internal tools', 'Chatbot workflows', 'Operational dashboards'],
  },
  {
    title: 'Web platform engineering',
    summary:
      'Hands-on product engineering for content-led sites, React applications, APIs, and performance-sensitive interfaces.',
    usefulFor: ['Astro and MDX sites', 'React frontends', 'Node.js services'],
  },
  {
    title: 'Developer education',
    summary:
      'Workshops, mentoring, documentation, and review loops that help teams make better technical decisions together.',
    usefulFor: ['Team upskilling', 'Technical writing', 'Architecture walkthroughs'],
  },
];

export const usesCategories: ToolCategory[] = [
  {
    title: 'Daily engineering',
    description: 'Tools I reach for when I need fast feedback and low-friction iteration.',
    items: ['VS Code', 'Zed', 'TypeScript', 'Node.js', 'Astro', 'React', 'Tailwind CSS'],
  },
  {
    title: 'Systems and operations',
    description:
      'Infrastructure tools that help me practice production habits outside a narrow app surface.',
    items: ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'Azure', 'Vercel', 'Sentry'],
  },
  {
    title: 'Data and backend',
    description:
      'Default toolbox for services, API work, persistence, and internal workflow systems.',
    items: ['PostgreSQL', 'Redis', 'MongoDB', 'REST APIs', 'GraphQL'],
  },
  {
    title: 'Writing and teaching',
    description:
      'Tools that turn engineering work into material other people can inspect and reuse.',
    items: ['MDX', 'Figma', 'CleanShot X', 'Notion', 'GitHub', 'YouTube'],
  },
];

export const setupPrinciples = [
  'Prefer tools that shorten the loop between idea, code, review, and verification.',
  'Keep the stack portable enough that a project can move from laptop to CI to hosting without drama.',
  'Treat documentation, screenshots, and diagrams as part of the engineering system.',
  'Do not confuse a fancy setup with a better setup; tools should stay out of the way.',
];

export const videoHighlights: VideoHighlight[] = [
  {
    id: 'gPk-K1mIfm4',
    title: 'Backend Development with NestJS',
    description: 'A practical walkthrough for building a CRUD API with NestJS and TypeScript.',
    topic: 'Backend',
  },
  {
    id: 'UUYPYPLYkWI',
    title: 'TypeScript Crash Course',
    description:
      'A single-session intro to TypeScript language features developers use most often.',
    topic: 'TypeScript',
  },
  {
    id: 'Tbvt2UMxdiE',
    title: 'Build and Deploy a Developer Portfolio',
    description: 'Turning a personal site into useful signal for interviews and project reviews.',
    topic: 'Portfolio',
  },
  {
    id: 'MqlliYknQM0',
    title: 'Unit Testing in React',
    description: 'A focused explanation of unit testing patterns for React applications.',
    topic: 'React',
  },
  {
    id: 'eVrXFitvegs',
    title: 'Open Graph Protocol and React Helmet',
    description: 'A short guide to social previews and metadata in React applications.',
    topic: 'Metadata',
  },
  {
    id: 'cnmPhFof23Y',
    title: 'React Query for Data Fetching',
    description: 'A practical look at simplifying client-side data fetching.',
    topic: 'React',
  },
];

export const reactStrengths: PageFeature[] = [
  {
    title: 'Application architecture',
    description:
      'Component boundaries, state placement, data-fetching patterns, routing, and tests that keep product work maintainable.',
  },
  {
    title: 'Performance and UX quality',
    description:
      'Bundle shape, render behavior, accessibility, loading states, and details that make interfaces feel dependable.',
  },
  {
    title: 'React as an island, not a default',
    description:
      'Astro, MDX, and mostly static pages stay lean while React powers surfaces that genuinely need interactivity.',
  },
];
