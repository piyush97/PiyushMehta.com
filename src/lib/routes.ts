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
  },
  {
    path: "/blog",
    name: "blog",
  },
  {
    path: "/uses",
    name: "uses",
  },
  {
    path: "/projects",
    name: "projects",
  },
  {
    path: "/bookshelf",
    name: "bookshelf",
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
