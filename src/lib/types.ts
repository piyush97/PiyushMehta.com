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
