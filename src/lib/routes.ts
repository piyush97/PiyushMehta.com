import { EMAIL, GITHUB, INSTAGRAM, LINKEDIN, TWITTER } from "./constants";
import { Route, Social } from "./types";

/**
 * Represents the website's routes.
 */
export const routes: Route[] = [
  {
    path: "/",
    name: "home",
    isVisible: false,
  },
  {
    path: "/about",
    name: "about",
    isVisible: true,
  },
  {
    path: "/blog",
    name: "blog",
    isVisible: true,
  },
  {
    path: "/uses",
    name: "uses",
    isVisible: true,
  },
  {
    path: "/projects",
    name: "projects",
    isVisible: true,
  },
  {
    path: "/bookshelf",
    name: "bookshelf",
    isVisible: true,
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
