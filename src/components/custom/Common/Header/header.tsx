"use client";
import AuxBar from "@/components/custom/Common/Header/auxbar";
import Navbar from "@/components/custom/Common/Header/navbar";
import { Menubar, MenubarLabel } from "@/components/ui/menubar";
import { AUTHOR_NAME } from "@/lib/constants";
import { routes } from "@/lib/routes";
import { Route } from "@/lib/types";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FC, memo } from "react";

/**
 * Represents the header component of the website.
 * This component displays the website's logo and navigation menu.
 */
const Header: FC = () => {
  const t = useTranslations("Header");
  return (
    <header className="sticky top-0 z-50 w-full border-0 container px-4 md:px-6">
      <Menubar className="container flex h-14 max-w-screen-2xl items-center border-0 ">
        <Link href="/">
          <MenubarLabel>{AUTHOR_NAME}</MenubarLabel>
        </Link>
        <nav className="flex items-center gap-4 text-sm lg:gap-6 ">
          {routes.map(({ path, name, isVisible = true }: Route) =>
            isVisible ? <Navbar key={name} name={t(name)} path={path} /> : null
          )}
        </nav>
        <AuxBar />
      </Menubar>
    </header>
  );
};

export default memo(Header);
