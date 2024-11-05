import { socials } from "@/lib/routes";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { MenubarGroup } from "@radix-ui/react-menubar";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { FC, memo } from "react";

import LocaleSelect from "./localeSelect";
import ThemeSelect from "./themeSelect";
/**
 * Represents the auxiliary bar component of the website.
 * This component displays the auxiliary bar of the website.
 */
const AuxBar: FC = () => {
  const { setTheme, theme } = useTheme();
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();

  return (
    <nav className="flex flex-1 items-center justify-between space-x-2 md:justify-end ">
      <MenubarGroup className="flex items-center justify-between space-x-4 md:justify-end">
        <LocaleSelect defaultValue={locale} label={t("label")} />
        <a href={socials[1].url}>
          <GitHubLogoIcon className="h-6 w-6 text-primary transition-colors" />
        </a>
        <ThemeSelect />
      </MenubarGroup>
    </nav>
  );
};

export default memo(AuxBar);
