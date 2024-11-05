import { Link } from "@/i18n/routing";
import {
  MenubarGroup,
  MenubarMenu,
  MenubarTrigger,
} from "@radix-ui/react-menubar";
import { FC } from "react";

interface NavbarProps {
  name: string;
  path: string;
}

/**
 * Represents the navigation bar component of the website.
 * This component displays the navigation bar of the website.
 */
const Navbar: FC<NavbarProps> = ({ name, path }) => {
  return (
    <MenubarGroup className="flex md:flex-row">
      <MenubarMenu>
        <Link href={path} className="transition-colors hover:text-primary">
          <MenubarTrigger>{name}</MenubarTrigger>
        </Link>
      </MenubarMenu>
    </MenubarGroup>
  );
};

export default Navbar;
