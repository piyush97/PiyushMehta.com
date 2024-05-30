import { LucideIcon } from "lucide-react";

/**
 * Route interface to represent a route in the website.
 *
 * @export
 * @interface Route
 */
export interface Route {
  path: string;
  name: string;
  isVisible?: boolean;
}

type IconName = "Twitter" | "GitHub" | "Linkedin" | "Instagram" | "Email";

export interface Social {
  name: IconName;
  url: string;
}

export type SkillType = {
  Icon: LucideIcon;
  skill: string;
};

export type Item = {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
};

export type Section = {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  items: Item[];
};

export type Project = {
  id: number;
  title: string;
  description: string;
  stars: number;
  forks: number;
  repos_url: string;
  githubUrl: string;
  lastActivity: string;
  languages: string[];
};

export type Book = {
  id: string;
  title: string;
  subtitle: string;
  quote: string;
  coverUrl: string;
};
