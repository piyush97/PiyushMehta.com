"use client";
import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarGroup,
  MenubarLabel,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { routes, socials } from "@/lib/routes";
import { Route } from "@/lib/types";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { FC, memo } from "react";

/**
 * Represents the header component of the website.
 * This component displays the website's logo and navigation menu.
 */
const Header: FC = () => {
  const { setTheme, theme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-0">
      <Menubar className="container flex h-14 max-w-screen-2xl items-center border-0 ">
        <Link href="/">
          <MenubarLabel>Piyush Mehta</MenubarLabel>
        </Link>
        <MenubarGroup className="flex">
          <MenubarMenu>
            <nav className="flex items-center gap-4 text-sm lg:gap-6">
              {routes.map(({ path, name, isVisible = true }: Route) =>
                isVisible ? (
                  <Link href={path} key={path}>
                    <MenubarTrigger>{name}</MenubarTrigger>
                  </Link>
                ) : null
              )}
            </nav>
          </MenubarMenu>
        </MenubarGroup>
        <nav className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <MenubarGroup className="flex items-center justify-between space-x-4 md:justify-end">
            <Link href={socials[1].url}>
              <GitHubLogoIcon className="h-6 w-6" />
            </Link>
            <Button
              variant="link"
              size="icon"
              onClick={() =>
                theme === "dark" ? setTheme("light") : setTheme("dark")
              }
            >
              {theme === "dark" ? (
                <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-100 transition-all dark:rotate-0 dark:scale-100" />
              ) : (
                <Sun
                  onClick={() => setTheme("dark")}
                  className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </MenubarGroup>
        </nav>
      </Menubar>
    </header>
  );
};

export default memo(Header);
