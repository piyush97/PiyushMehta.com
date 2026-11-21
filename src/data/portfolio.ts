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
  architecture?: string;
  approach: string[];
  outcomes: string[];
  tradeoffs?: string[];
  /** Planned work recorded in the project docs. */
  next?: string[];
  /** Documented limits, shown when the project docs record no plan. */
  knownLimits?: string[];
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
    title: 'Indian Food Recommends',
    eyebrow: 'Next.js, Postgres, open source',
    role: 'Product Engineer',
    timeframe: '2026',
    summary:
      'Built a site that ranks where Indian food vloggers say to eat by how many different creators picked each place, with the exact video moment behind every pick.',
    problem:
      'After living in Canada since 2021, a trip back to India left me unsure where to eat after five years away. Google reviews felt unreliable, some biased, some paid. Food creators already film honest visits, but their picks are scattered across hours of video.',
    approach: [
      'An ingest worker pulls creator uploads, uses an LLM to extract place and dish picks, and only publishes a pick when the video text supports it; unsupported picks are rejected with a recorded reason.',
      'Ranking counts distinct creators per place with documented tie-breaks, never payment or anonymous ratings.',
      'Places are geocoded with PostGIS and OpenStreetMap Nominatim, deduplicated, and grouped into city, dish, neighbourhood and food-walk pages with typo-tolerant search.',
      'Every worker command logs a row to worker_runs; a run still marked running after two hours is closed as failed.',
    ],
    outcomes: [
      'Shipped on Vercel with city, dish-in-city, place, creator and search pages, each pick linked to its source timestamp.',
      'CI proves every pull request migrates an empty database and blocks unsafe migrations.',
      'Published the code under MIT with a creator opt-out path.',
    ],
    stack: ['Next.js', 'TypeScript', 'Postgres', 'PostGIS', 'Drizzle', 'MapLibre', 'Vercel'],
    links: [
      { label: 'Live site', href: 'https://indian-food-recommends.vercel.app' },
      { label: 'GitHub', href: 'https://github.com/piyush97/IndianFoodRecommends' },
    ],
  },
  {
    title: 'Understory',
    eyebrow: 'Cloudflare Workers, Workers AI, open source',
    role: 'Product Engineer',
    timeframe: '2026',
    summary:
      'Built a reading layer that turns new engineering blog posts into reviewed explainers with context, mechanism, a diagram, an ELI5, trade-offs, and a source behind every claim.',
    problem:
      'Engineering blog posts announce results but skip the mechanism and trade-offs. Summary bots compress the announcement and invent details; readers still have to open three more articles to understand one.',
    architecture:
      'Two Workers share one D1 database. understory-web serves the read-only, server-rendered site, a JSON API, RSS, the sitemap, FTS5 search, and an auth-gated editorial desk. understory-pipeline runs a quarter-hour cron that discovers posts from engineeringblogs.xyz, then queue jobs extract readable blocks with HTMLRewriter into a content-hashed snapshot, ask Workers AI for strict JSON, validate it, and write a revision to D1.',
    approach: [
      'Split discovery, extraction, generation, and validation into leased queue jobs so a failed step stays in D1 and never reaches the public index.',
      'Validated model output with a Zod schema plus reference checks: every citation, source URL, and diagram edge must resolve before a draft enters review.',
      'Rendered diagrams deterministically from a small validated graph instead of letting the model draw SVG.',
      'Reserved the Workers AI neuron budget with one conditional SQL statement and invalidated the edge cache by bumping a publication version on approval.',
    ],
    outcomes: [
      'Launched with eleven reviewed explainers across thirty sources, running entirely on the Cloudflare free plan.',
      'Kept readers off the inference path: every page is server-rendered from approved, immutable revisions.',
      'Published the code under MIT and the explainers under CC BY 4.0.',
    ],
    tradeoffs: [
      'Automated checks are not fact-checking. With AUTO_PUBLISH on, a valid new generation publishes without a human; setting it to false sends every draft to manual review.',
      'Fits the free tier: Workers AI allows 10,000 neurons a day, so production caps the budget at 9,000, reserves about 500 per attempt, and defers jobs to the next UTC day instead of overspending.',
      'Scores sources for mechanism evidence and near-duplicates before generation, so low-scoring posts never reach the model. Enforcement rests on a reviewed audit of the latest 500 articles, not a full-corpus check.',
      'Ships read-only in v1: no accounts, comments, votes, public submissions, or arbitrary URL ingestion.',
    ],
    next: [
      'Decide what happens to already published explainers whose sources now score low: noindex, unpublish, and regeneration are each a separate owner decision.',
      'Define a retention policy for private snapshots. Today the storage audits only report candidates; any deletion needs owner approval, a separately reviewed implementation, and a D1 backup and recovery check.',
    ],
    stack: ['Cloudflare Workers', 'Workers AI', 'D1', 'Queues', 'Hono', 'TypeScript'],
    links: [
      { label: 'Live site', href: 'https://understory.piyushmehta.com/' },
      { label: 'Technical article', href: '/blog/understory-engineering-blogs-explained' },
      { label: 'GitHub', href: 'https://github.com/piyush97/understory' },
    ],
  },
  {
    title: 'agentgate',
    eyebrow: 'GitHub Action, CLI, CI security, open source',
    role: 'Author and maintainer',
    timeframe: '2026',
    summary:
      'Built a zero-dependency GitHub Action and CLI that fails a pull request when an AI coding agent weakens tests, edits guardrail files, or escalates CI permissions.',
    problem:
      'Semgrep and gitleaks catch insecure code. They do not catch a pull request that deletes the failing test, loosens workflow permissions, or silences the scanner, and that change can arrive with CI still green.',
    architecture:
      'One Node 24 pipeline with two entry points: a GitHub Action and an agentgate check CLI. git produces the base...head diff, a hunk parser splits it into added and removed lines per file, five pure rules return findings, and an engine applies block, warn, or off per rule to reach a verdict. Reports render as a step summary, JSON, and workflow annotations; exit 0 passes, 1 blocks, 2 is a usage or environment error.',
    approach: [
      'Read .agentgate.json from the PR base commit, not the head, so a PR cannot turn a rule off in the same change that violates it.',
      'Made protectedPaths append-only: a repository can add guarded paths but cannot drop .agentgate.json or .github/**.',
      'Failed closed. A missing base commit, shallow clone, or bad config exits 2 instead of passing, unknown config keys are errors, and a failed label lookup keeps the block.',
      'Kept the override human-only: the approval label turns block into warn only when its newest event is labeled, the actor is a user account rather than a bot, and the actor is not the PR author unless they own the repository. A new push blocks again.',
      'Wrote each rule as a pure function over the parsed diff, with file reads as its only I/O, and shared the rules between the Action and the CLI.',
    ],
    outcomes: [
      'Released v0.1.0 with five rules: test-weakened, guardrail-edited, workflow-escalation, dependency-added, and suppression-added.',
      'Shipped the Action with a step summary, annotations, a verdict output, and the label override, plus a CLI with Markdown and JSON output.',
      'Gated the agentgate repository with its own Action, pinned to a release commit SHA so a PR cannot swap in its own dist/.',
      'Published under MIT with no runtime dependencies and a private path for reporting bypasses.',
    ],
    tradeoffs: [
      'Reads diffs, not behavior. Authorization bugs, IDOR, tenant isolation breaks, and business-logic errors pass, and so does a plausible test for wrong behavior, so SAST, secret scanning, and human review stay in place.',
      'Needs fetch-depth: 0 to read the base commit. Exit 2 makes a shallow clone fail loudly rather than pass silently.',
      'An approval covers only the commits present when the label was applied, so reviewers re-apply it after every push.',
      'The gate is only as strong as repository settings: it must be a required check with CODEOWNERS review on .github/**, or a PR can replace the workflow that runs it.',
    ],
    next: [
      'Publish a demo repository with three agent-style PRs (a skipped test, a CODEOWNERS edit, a pull_request_target trigger), each blocked.',
      'Add rules for go.mod and Cargo.toml dependencies, lockfile-only changes, and monitoring-config deletions once there is real false-positive data.',
    ],
    stack: ['TypeScript', 'Node.js 24', 'GitHub Actions', 'node:test'],
    links: [
      { label: 'Technical article', href: '/blog/agentgate-block-agent-prs-that-weaken-tests' },
      { label: 'GitHub', href: 'https://github.com/piyush97/agentgate' },
    ],
  },
  {
    title: 'OmaSwitch',
    eyebrow: 'Omarchy plugin, Hyprland, on-device OCR, open source',
    role: 'Author and maintainer',
    timeframe: '2026',
    summary:
      'Built a keyboard-first Alt+Tab switcher for Omarchy that orders windows by recent use, streams a live preview, and finds a window by text visible inside it.',
    problem:
      'Omarchy’s default Alt+Tab cycles windows directly. It does not put the most recently used window first, show what a window contains before switching, or find the terminal that printed a specific error.',
    architecture:
      'A Quickshell overlay with two parts. Switcher.qml owns the window list, the double-buffered live preview, the OCR capture queue, and keyboard handling. Model.js holds pure logic for MRU ordering, filtering, OCR layout parsing, and highlight geometry, and test_model.js runs it in CI without a compositor. OCR uses the Tesseract package Omarchy already ships.',
    approach: [
      'Used two capture views for preview handoff instead of one stream per window, with a single extra capture only during an OCR search.',
      'Held plain snapshots in the window list, never compositor-owned objects, so a window closing mid-switch cannot leave a dangling reference.',
      'Applied the selection after the overlay unmaps, because Hyprland restores focus on unmap and an earlier switch would not stick.',
      'Started OCR only after three typed characters: title, app, and workspace matches appear first, and plain Alt+Tab cycling never runs OCR.',
      'Kept OCR on the machine: each capture sits in $XDG_RUNTIME_DIR only while scanned, extracted text stays in memory, and both are discarded when the switcher closes.',
    ],
    outcomes: [
      'Installs with one omarchy plugin add command and needs no daemon, extra package, or elevated privilege.',
      'Shipped content search with match outlines drawn from Tesseract page layout analysis, plus OCR language selection through OMARCHY_OCR_LANGS.',
      'Merged fixes and features from four outside contributors, including the double-buffered preview, app icons, and a fix for Alt+Tab intermittently unmapping.',
      'Published under MIT, with releases tracked in a changelog.',
    ],
    tradeoffs: [
      'Degrades instead of failing: without hyprland-toplevel-export-v1, switching and title search still work and the preview pane stays empty; without Tesseract, title, app, and workspace search still work.',
      'Content matches arrive after instant title matches because windows are scanned one at a time.',
      'Installing does not change keybindings, so replacing Omarchy’s Alt+Tab is a one-time manual edit to bindings.lua.',
    ],
    knownLimits: [
      'OCR can miss very small text, low-contrast text, and stylised fonts.',
      'Windows that cannot be captured match only by title, app, and workspace.',
      'A known upstream Quickshell crash on Qt 6.11.x affects setups with or without OmaSwitch.',
    ],
    stack: ['QML', 'JavaScript', 'Quickshell', 'Hyprland', 'Tesseract OCR'],
    links: [
      { label: 'Technical article', href: '/blog/omaswitch-alt-tab-omarchy' },
      { label: 'GitHub', href: 'https://github.com/piyush97/omaswitch' },
    ],
  },
  {
    title: 'FocusTube',
    eyebrow: 'TypeSafe Jev, browser extension, open source',
    role: 'Product Engineer',
    timeframe: '2026',
    summary:
      'Built a Chrome and Firefox extension that turns YouTube recommendations into a strict learning feed using typed probability judgments from TypeSafe’s Jev System One model.',
    problem:
      'YouTube mixes useful engineering tutorials with entertainment, hype, and short-form distractions. Keyword filters miss the semantic difference, while a generative model would add latency and prose the product does not need.',
    approach: [
      'Concealed new recommendation cards before evaluation so blocked content never flashed on screen.',
      'Asked Jev one narrow Noul question per video and let extension code compare the returned probability with a user-controlled threshold.',
      'Placed TypeSafe calls behind an authenticated Cloudflare Worker, keeping the API key out of browser code and limiting each request to twenty validated records.',
      'Cached decisions locally for seven days and blocked YouTube Shorts before classification to reduce repeat calls.',
    ],
    outcomes: [
      'Shipped an installable Manifest V3 extension for Chrome and Firefox with no extension build step.',
      'Kept model output small and deterministic: one typed probability drives each reveal-or-hide decision.',
      'Published the full implementation, local setup, privacy boundary, and classification policy as open source.',
    ],
    stack: ['TypeSafe Jev', 'System One', 'TypeScript', 'Cloudflare Workers', 'Manifest V3'],
    links: [
      { label: 'Technical article', href: '/blog/building-focustube-typesafe-jev' },
      { label: 'GitHub', href: 'https://github.com/piyush97/focus-tube' },
    ],
  },
  {
    title: 'RoastTube',
    eyebrow: 'Google OAuth review, Cloudflare Workers, Gemini',
    role: 'Product Engineer',
    timeframe: '2026',
    summary:
      'Built and shipped a free entertainment site that reads a visitor’s YouTube likes with read-only Google access, scores their taste in code, and has Gemini write a shareable tabloid verdict.',
    problem:
      'A comedy product that wants access to a stranger’s Google account has to pass a real privacy review before it can read anything. The first submission was rejected: the privacy policy lacked substance and the home page read like a login wall that never explained what the product does.',
    approach: [
      'Opened the whole pipeline to anonymous visitors first: three fabricated demo defendants run the real scoring and generation path with no account, cached for an hour.',
      'Wrote the privacy policy section by section against the code, naming retention per store: reports kept until deletion is requested, rate-limit counters about an hour, budget counters 48 hours, and no server-side token storage.',
      'Ran a twelve-run head-to-head eval across Gemini and three Workers AI models before choosing an engine, then kept Gemini at the schema boundary and recorded the free fallback as needing a repair layer.',
      'Kept every judgement in code: the Brain Rot Score is computed from signals and overwrites the model’s self-reported score, so the model only ever writes prose.',
      'Rationed the paid model with a three-per-hour per-IP limit, a fifteen-per-day site budget, and error copy a person can act on instead of bare status codes.',
    ],
    outcomes: [
      'Shipped to production on Cloudflare Workers with the live OAuth flow, a permanent report link per visitor, and a per-report Open Graph card.',
      'Answered the login-wall finding by making the no-account path the primary one, then resubmitted verification with all three reviewer findings addressed directly.',
      'Fixed two production-only failures the local build never showed: a share card that crashed the runtime’s CSS parser, and a deploy wizard that double-wrapped the OAuth client secret.',
    ],
    stack: [
      'Next.js',
      'Cloudflare Workers',
      'Workers KV',
      'Google OAuth',
      'YouTube Data API',
      'Gemini',
      'Turnstile',
    ],
    links: [
      { label: 'Technical article', href: '/blog/roasttube-ai-roast-youtube-history' },
      { label: 'Live site', href: 'https://roasttube.piyushmehta.com' },
    ],
  },
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
    stack: ['Astro', 'TypeScript', 'MDX', 'Tailwind CSS', 'React islands', 'Cloudflare Workers'],
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
    items: ['Azure', 'AWS', 'Cloudflare', 'Docker', 'Kubernetes', 'Terraform'],
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
    label: 'Contact form',
    href: '#contact-form',
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
    items: ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'Azure', 'Cloudflare', 'Sentry'],
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
