import { Route } from "./types";

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

export const socials = [
  {
    name: "Twitter",
    url: "https://twitter.com/piyushmehtas",
  },
  {
    name: "GitHub",
    url: "https://github.com/piyush97",
  },
];
