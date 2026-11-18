import { hashSocialCardVersion, type SocialCardData } from '../utils/social-card';

export type LabComponent =
  | 'BloomFilterDemo'
  | 'InteractiveQuiz'
  | 'CacheChannelSimulator'
  | 'AsteriskChain'
  | 'AgentGateSimulator'
  | 'LunaDecisionsDemo'
  | 'MoEDecodeBudget'
  | 'RiskAssessmentMatrix';

export interface LabDemo {
  slug: string;
  title: string;
  /** One honest sentence: what you can do here. */
  description: string;
  /** What the reader should know before using it. */
  context: string;
  /** What the demo is not (model, fixtures, schematic). */
  caveat: string;
  /** Blog post slug the demo was written for. Must be published. */
  postSlug: string;
  /** Resolved to a static import in src/components/lab/LabDemo.astro. */
  component: LabComponent;
  tags: string[];
  /** Iframe height in px for the embed snippet. */
  embedHeight: number;
}

/** Path segments under /lab that are routes, not demos. */
export const LAB_RESERVED_SLUGS = ['embed', 'og', 'index'] as const;

export const labDemos: readonly LabDemo[] = [
  {
    slug: 'bloom-filter',
    title: 'Bloom filter playground',
    description:
      'Add words to an 8-bit filter, then check other words and watch a false positive appear.',
    context:
      'The filter has 8 bits and 3 hash functions, so it fills up after a handful of words. That is deliberate: collisions show up fast, and a "maybe" answer is easy to catch.',
    caveat: 'A teaching-size filter. Real filters use far more bits and tuned hash counts.',
    postSlug: 'bloom-filters',
    component: 'BloomFilterDemo',
    tags: ['Algorithms', 'Data structures'],
    embedHeight: 1100,
  },
  {
    slug: 'bloom-filter-quiz',
    title: 'Bloom filter quiz',
    description:
      'Five questions on what a Bloom filter\'s "yes" and "no" actually guarantee, with an explanation after each answer.',
    context:
      'Each answer is explained before you move on, and you can restart at the end. Nothing is stored or sent anywhere.',
    caveat: 'Scores stay in your browser tab and are not recorded.',
    postSlug: 'bloom-filters',
    component: 'InteractiveQuiz',
    tags: ['Algorithms', 'Quiz'],
    embedHeight: 760,
  },
  {
    slug: 'cache-channel',
    title: 'Cache timing channel simulator',
    description:
      'Tune bit rate, timing noise, samples per bit and repetition coding to see when a cache covert channel still decodes.',
    context:
      'Two agents in separate sandboxes share an L3 cache. One signals by evicting lines, the other reads the bits from access latency. The readout shows bit errors, goodput, and how long a 256-bit key or a 10 MB repository would take to leak.',
    caveat:
      'Hit and miss latencies and the bit-rate stops come from the article. The decode result is a seeded simulation, not a measurement of your hardware.',
    postSlug: 'agent-sandbox-shared-cache',
    component: 'CacheChannelSimulator',
    tags: ['Security', 'Sandboxing', 'CPU cache'],
    embedHeight: 900,
  },
  {
    slug: 'asterisk-chain',
    title: 'OpenSSH asterisk bypass chain',
    description:
      'Flip libc, PAM, password auth, the shadow field and password length to see which conditions the musl bypass needs.',
    context:
      'The bypass needs several independent choices to line up. Start from a preset, switch one condition off, and the verdict flips with a step-by-step reason.',
    caveat: 'A model of the password compare, not sshd. It does not test any real system.',
    postSlug: 'openssh-musl-asterisk-bypass',
    component: 'AsteriskChain',
    tags: ['Security', 'OpenSSH', 'musl'],
    embedHeight: 940,
  },
  {
    slug: 'agent-gate',
    title: 'Agent PR gate simulator',
    description:
      'Pick an agent PR that passes its unit tests, toggle the CI checks, and see whether it merges and whether what merged is safe.',
    context:
      'Every example passes its unit tests. The point is which extra check catches which problem, and which one only a human reviewer would.',
    caveat: 'Hand-written example diffs, not benchmark data.',
    postSlug: 'ai-coding-agent-security-gate',
    component: 'AgentGateSimulator',
    tags: ['AI agents', 'CI', 'Application security'],
    embedHeight: 1000,
  },
  {
    slug: 'luna-decisions',
    title: 'Decision threshold playground',
    description:
      'Choose a support ticket and move the auto-route threshold to see when a routing decision goes to a human.',
    context:
      'A typed decision returns a probability per team. The application, not the model, decides how certain is certain enough to skip review.',
    caveat: 'Illustrative fixtures, not model predictions. No API calls are made.',
    postSlug: 'gpt-6-luna-decisions',
    component: 'LunaDecisionsDemo',
    tags: ['AI', 'Routing', 'Thresholds'],
    embedHeight: 860,
  },
  {
    slug: 'moe-decode-budget',
    title: 'MoE decode budget',
    description:
      'Compare Mixture-of-Experts presets against RAM and memory bandwidth to see whether decode fits; token rates come from measured llama.cpp runs, not a live benchmark.',
    context:
      'Each preset pins a model file, RAM ceiling, and bandwidth figure from the article, so moving a slider shows which limit the decode loop actually hits.',
    caveat: 'Arithmetic model over three measured presets, not a benchmark harness.',
    postSlug: 'moe-decode-memory-budget',
    component: 'MoEDecodeBudget',
    tags: ['AI', 'Inference', 'Memory bandwidth'],
    embedHeight: 1180,
  },
  {
    slug: 'migration-risk-matrix',
    title: 'Migration risk matrix',
    description:
      'Read the nine migration risks from the article by probability, impact, and status; open one to see the mitigation and contingency the team committed to.',
    context:
      'The matrix is a planning artefact: it separates risks that were avoided or mitigated from the ones still open at cutover.',
    caveat: 'Qualitative assessment recorded for one migration. Not incident data.',
    postSlug: 'zero-downtime-database-migration-at-scale',
    component: 'RiskAssessmentMatrix',
    tags: ['Databases', 'Migration', 'Risk'],
    embedHeight: 1240,
  },
];

export const labPath = (slug: string) => `/lab/${slug}`;
export const labEmbedPath = (slug: string) => `/lab/embed/${slug}`;

export const LAB_INDEX_CARD: SocialCardData = {
  title: 'Lab - Piyush Mehta',
  description:
    'Interactive demos from the articles, each on its own page with a share link and an iframe embed.',
  type: 'website',
  template: 'tech',
  theme: 'dark',
  tags: ['Interactive', 'Demos', 'Embeds'],
  path: '/lab',
};

export function labSocialCard(demo: LabDemo): SocialCardData {
  return {
    title: demo.title,
    description: demo.description,
    type: 'website',
    template: 'tech',
    theme: 'dark',
    tags: demo.tags,
    path: labPath(demo.slug),
  };
}

/** Card key ('index' for the lab index) to its data, or undefined for unknown keys. */
export function labCardForKey(key: string): SocialCardData | undefined {
  if (key === 'index') return LAB_INDEX_CARD;
  const demo = getLabDemo(key);
  return demo ? labSocialCard(demo) : undefined;
}

/** Versioned like /og/*, so the immutable cache rotates when copy changes. */
export function labOgImage(key: string): string {
  const card = labCardForKey(key);
  const version = hashSocialCardVersion(`lab/${key}`, JSON.stringify(card ?? {}));
  return `/lab/og/${key}.png?v=${version}`;
}

export function getLabDemo(slug: string): LabDemo | undefined {
  return labDemos.find((demo) => demo.slug === slug);
}
