import { FC, memo } from "react";
import Copyright from "./copyright";
import Socials from "./socials";

/**
 * Represents the footer component of the website.
 * This component displays the footer of the website.
 */
const Footer: FC = () => {
  return (
    <footer className="py-6 md:px-8 md:py-0">
      <div className="max-w-screen-2xl container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <Copyright />
        <Socials />
      </div>
    </footer>
  );
};

export default memo(Footer);
