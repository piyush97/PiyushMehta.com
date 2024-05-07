import { EMAIL, GITHUB, INSTAGRAM, LINKEDIN, TWITTER } from "./constants";
import { Route, Social } from "./types";

/**
 * Represents the website's routes.
 */
export const routes: Route[] = [
  {
    path: "/",
    name: "Home",
    isVisible: false,
  },
  {
    path: "/about",
    name: "About",
  },
  {
    path: "/blog",
    name: "Blog",
  },
  {
    path: "/uses",
    name: "Uses",
  },
  {
    path: "/videos",
    name: "Videos",
  },
  {
    path: "/workshops",
    name: "Workshops",
  },
  {
    path: "/projects",
    name: "Projects",
  },
  {
    path: "/bookshelf",
    name: "Bookshelf",
  },
  {
    path: "/404",
    name: "404",
    isVisible: false,
  },
];

export const socials: Social[] = [
  {
    name: "Twitter",
    url: TWITTER,
  },
  {
    name: "GitHub",
    url: GITHUB,
  },
  {
    name: "Linkedin",
    url: LINKEDIN,
  },
  {
    name: "Instagram",
    url: INSTAGRAM,
  },
  {
    name: "Email",
    url: EMAIL,
  },
];
