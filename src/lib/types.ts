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
