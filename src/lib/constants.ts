import {
  AccessibilityIcon,
  ArrowRightIcon,
  ChromeIcon,
  CloudIcon,
  ComponentIcon,
  ContainerIcon,
  DatabaseIcon,
  FolderGitIcon,
  GitlabIcon,
  LayoutIcon,
  LucideIcon,
  NetworkIcon,
  QrCodeIcon,
  RedoIcon,
  SearchIcon,
  SofaIcon,
  TextIcon,
  TypeIcon,
  WindIcon,
} from "lucide-react";

export const AUTHOR_NAME = "Piyush Mehta";

export const EMAIL = "mailto:me@piyushmehta.com";
export const TWITTER = "https://twitter.com/piyushmehtas";
export const GITHUB = "https://github.com/piyush97";
export const LINKEDIN = "https://www.linkedin.com/in/piyush24";
export const INSTAGRAM = "https://www.instagram.com/pyushhh";

export const IMG_CDN =
  "https://github.com/piyush97/PiyushMehta.com/blob/feature-add-hero-component/src/components/custom/Hero/hero.png?raw=true";

const careerStartYear = 2020;
const currentYear = new Date().getFullYear();
const experience = currentYear - careerStartYear;

export const BIO = ` I specialize in building modern, responsive web applications using the
        latest technologies. With over ${experience} years of experience, I have honed my
        skills in JavaScript, React, Node.js, and more.`;

export const ABOUT_ME = `I'm a passionate and versatile software developer with a keen eye
            for detail and a relentless drive to create elegant, user-centric
            solutions. My expertise spans the full stack, from crafting visually
            stunning interfaces to architecting robust backend systems.`;

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

type SkillType = {
  Icon: LucideIcon;
  skill: string;
};

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
