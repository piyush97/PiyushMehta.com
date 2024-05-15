import {
  AccessibilityIcon,
  ActivityIcon,
  AirplayIcon,
  ArrowRightIcon,
  AtomIcon,
  ChromeIcon,
  CloudIcon,
  CodeIcon,
  CodepenIcon,
  ComponentIcon,
  ContainerIcon,
  DatabaseIcon,
  FigmaIcon,
  FolderGitIcon,
  GitlabIcon,
  HardDriveIcon,
  HashIcon,
  ImageIcon,
  LaptopIcon,
  LayoutIcon,
  Link2Icon,
  NetworkIcon,
  QrCodeIcon,
  RedoIcon,
  SearchIcon,
  ShellIcon,
  SlackIcon,
  SofaIcon,
  SubtitlesIcon,
  TabletIcon,
  TerminalIcon,
  TextIcon,
  TypeIcon,
  WindIcon,
} from "lucide-react";
import { Project, Section, SkillType } from "./types";

export const AUTHOR_NAME = "Piyush Mehta";

export const EMAIL = "mailto:me@piyushmehta.com";
export const TWITTER = "https://twitter.com/piyushmehtas";
export const GITHUB = "https://github.com/piyush97";
export const LINKEDIN = "https://www.linkedin.com/in/piyush24";
export const INSTAGRAM = "https://www.instagram.com/pyushhh";

export const IMG_CDN =
  "https://github.com/piyush97/PiyushMehta.com/blob/feature-add-hero-component/src/components/custom/Hero/hero.png?raw=true";

export const ABOUT_ME_BG = ` I discovered my passion for coding at a young age, and have
                since honed my skills through a combination of formal education
                and hands-on experience. After obtaining my degree in Computer
                Science, I dove headfirst into the world of software
                development, embracing the ever-evolving nature of technology
                and continuously expanding my knowledge.`;

export const ABOUT_ME_APPROACH = ` I believe in the power of continuous learning and staying
                up-to-date with the latest tools and technologies. Every project
                is an opportunity to push the boundaries of innovation while
                ensuring accessibility, inclusivity, and exceptional user
                experiences. I take a collaborative approach, working closely
                with clients and stakeholders to understand their unique needs
                and translate them into visually stunning and highly functional
                digital solutions.`;

export const ABOUT_ME_WHAT_TO_EXPECT = `This website is a reflection of my dedication to craftsmanship
                and attention to detail. I invite you to explore my portfolio,
                where you'll find a curated collection of my work, showcasing my
                ability to blend cutting-edge technology with elegant design.
                Whether you're a fellow developer, a potential collaborator, or
                simply someone who appreciates well-crafted code, I hope my
                passion and expertise shine through in every line of my work.`;

export const skills: SkillType[] = [
  { Icon: ChromeIcon, skill: "JavaScript (ES6+)" },
  { Icon: ComponentIcon, skill: "React.js" },
  { Icon: NetworkIcon, skill: "Node.js" },
  { Icon: TextIcon, skill: "HTML5 / CSS3" },
  { Icon: TypeIcon, skill: "TypeScript" },
  { Icon: ArrowRightIcon, skill: "Next.js" },
  { Icon: WindIcon, skill: "Tailwind CSS" },
  { Icon: LayoutIcon, skill: "UI/UX Design" },
  { Icon: FolderGitIcon, skill: "Git Version Control" },
  { Icon: AccessibilityIcon, skill: "Responsive Design" },
  { Icon: GitlabIcon, skill: "Agile Methodologies" },
  { Icon: CloudIcon, skill: "AWS / Cloud Deployment" },
  { Icon: QrCodeIcon, skill: "GraphQL" },
  { Icon: ContainerIcon, skill: "Docker" },
  { Icon: ContainerIcon, skill: "Kubernetes" },
  { Icon: DatabaseIcon, skill: "PostgreSQL" },
  { Icon: DatabaseIcon, skill: "MongoDB" },
  { Icon: RedoIcon, skill: "Redis" },
  { Icon: SearchIcon, skill: "Elasticsearch" },
  { Icon: SofaIcon, skill: "Apache Kafka" },
];
export const sections: Section[] = [
  {
    Icon: CodeIcon,
    title: "Text Editor",
    items: [
      {
        Icon: AtomIcon,
        title: "Atom",
        description: "A hackable text editor for the 21st Century.",
      },
      {
        Icon: CodepenIcon,
        title: "Visual Studio Code",
        description: "A free, open-source, and powerful code editor.",
      },
      {
        Icon: SubtitlesIcon,
        title: "Sublime Text",
        description: "A sophisticated text editor for code, markup, and prose.",
      },
    ],
  },
  {
    Icon: TerminalIcon,
    title: "Terminal",
    items: [
      {
        Icon: Link2Icon,
        title: "iTerm2",
        description:
          "A replacement for Terminal and the best terminal emulator on macOS.",
      },
      {
        Icon: HashIcon,
        title: "Hyper",
        description: "A terminal built on web technologies.",
      },
      {
        Icon: ShellIcon,
        title: "Zsh",
        description:
          "A powerful shell that operates as both an interactive shell and a scripting language interpreter.",
      },
    ],
  },
  {
    Icon: ActivityIcon,
    title: "Productivity",
    items: [
      {
        Icon: ImageIcon,
        title: "Notion",
        description:
          "A all-in-one workspace for notes, tasks, wikis, and databases.",
      },
      {
        Icon: SlackIcon,
        title: "Slack",
        description:
          "A collaboration hub for work, no matter what work you do.",
      },
      {
        Icon: FigmaIcon,
        title: "Figma",
        description: "A collaborative interface design tool.",
      },
    ],
  },
  {
    Icon: HardDriveIcon,
    title: "Hardware",
    items: [
      {
        Icon: LaptopIcon,
        title: "MacBook Pro",
        description: "A powerful and versatile laptop for professional use.",
      },
      {
        Icon: TabletIcon,
        title: "iPad Pro",
        description:
          "A tablet with desktop-class performance and Apple Pencil support.",
      },
      {
        Icon: AirplayIcon,
        title: "AirPods Pro",
        description:
          "Wireless earbuds with active noise cancellation and spatial audio.",
      },
    ],
  },
];

export const projects: Project[] = [
  {
    id: 1,
    title: "Project 1",
    description: "A brief description of Project 1.",
    stars: 100,
    forks: 50,
    href: "",
    githubUrl: "",
    lastActivity: "2 weeks ago",
    languages: ["React", "Tailwind CSS", "Next.js"],
  },
  {
    id: 2,
    title: "Project 2",
    description: "A brief description of Project 2.",
    stars: 200,
    forks: 75,
    githubUrl: "",
    href: "",
    lastActivity: "1 month ago",
    languages: ["React", "Tailwind CSS", "Next.js"],
  },
  {
    id: 3,
    title: "Project 3",
    description: "A brief description of Project 3.",
    stars: 150,
    forks: 60,
    href: "",
    githubUrl: "",
    lastActivity: "3 months ago",
    languages: ["React", "Tailwind CSS", "Next.js"],
  },
  {
    id: 4,
    title: "Project 4",
    description: "A brief description of Project 4.",
    stars: 80,
    href: "",
    githubUrl: "",
    forks: 30,
    lastActivity: "6 months ago",
    languages: ["React", "Tailwind CSS", "Next.js"],
  },
  {
    id: 5,
    title: "Project 5",
    description: "A brief description of Project 5.",
    stars: 120,
    forks: 40,
    githubUrl: "",
    href: "",
    lastActivity: "4 months ago",
    languages: ["React", "Tailwind CSS", "Next.js"],
  },
  {
    id: 6,
    title: "Project 6",
    description: "A brief description of Project 6.",
    stars: 90,
    forks: 25,
    githubUrl: "",
    href: "",
    lastActivity: "8 months ago",
    languages: ["React", "Tailwind CSS", "Next.js"],
  },
];

export const books = [
  {
    id: "1",
    title: "Atomic Habits",
    subtitle: "Tiny Changes, Remarkable Results",
    quote:
      "You do not rise to the level of your goals. You fall to the level of your systems.",
    coverUrl: "https://picsum.photos/300/450?random=1",
  },
  {
    id: "2",
    title: "The Lean Startup",
    subtitle:
      "How Today's Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses",
    quote:
      "Success is not delivering a feature, it is learning how to solve the customer's problem.",
    coverUrl: "https://picsum.photos/300/450?random=1",
  },
  {
    id: "3",
    title: "The Subtle Art of Not Giving a F*ck",
    subtitle: "A Counterintuitive Approach to Living a Good Life",
    quote:
      "The desire for more positive experience is itself a negative experience. And, paradoxically, the acceptance of one's negative experience is itself a positive experience.",
    coverUrl: "https://picsum.photos/300/450?random=1",
  },
];
