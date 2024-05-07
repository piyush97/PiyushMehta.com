import { Button } from "@/components/ui/button";
import { socials } from "@/lib/routes";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { MenubarGroup } from "@radix-ui/react-menubar";
import { Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Link from "next/link";
import { FC, memo } from "react";

import LocaleSelect from "./localeSelect";
/**
 * Represents the auxiliary bar component of the website.
 * This component displays the auxiliary bar of the website.
 */
const AuxBar: FC = () => {
  const { setTheme, theme } = useTheme();
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();

  return (
    <nav className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
      <MenubarGroup className="flex items-center justify-between space-x-4 md:justify-end">
        <LocaleSelect defaultValue={locale} label={t("label")} />
        <Link href={socials[1].url}>
          <GitHubLogoIcon className="h-6 w-6  hover:text-blue-500 transition-colors" />
        </Link>
        <Button
          variant="link"
          size="icon"
          onClick={() =>
            theme === "dark" ? setTheme("light") : setTheme("dark")
          }
        >
          {theme === "dark" ? (
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-100 transition-all dark:rotate-0 dark:scale-100 " />
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
  );
};

export default memo(AuxBar);
