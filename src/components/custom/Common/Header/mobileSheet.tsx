import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AUTHOR_NAME } from "@/lib/constants";
import { routes, socials } from "@/lib/routes";
import { Route } from "@/lib/types";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { MenuIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import LocaleSelect from "./localeSelect";
import ThemeSelect from "./themeSelect";

type Props = {};
const MobileSheet = (props: Props) => {
  const t = useTranslations("Header");
  const locale = useLocale();

  return (
    <div className="lg:hidden flex justify-between items-center w-full text-primary pb-8">
      <div className="flex">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="lg:hidden" size="icon" variant="link">
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <Link className="text-3xl lg:flex" href="#">
              <span>∆ {AUTHOR_NAME}</span>
            </Link>
            <div className="grid gap-2 py-6">
              {routes.map((route: Route) =>
                route.isVisible ? (
                  <Link
                    className="text-primary flex w-full items-center py-2 text-lg font-semibold"
                    href={route.path}
                    key={route.name}
                  >
                    {t(route.name)}
                  </Link>
                ) : null
              )}
            </div>
          </SheetContent>
        </Sheet>
        <Link className="text-3xl lg:flex" href="#">
          <span>∆ {AUTHOR_NAME}</span>
        </Link>
      </div>
      <div className="flex">
        <div className="flex items-center space-x-4">
          <div className="flex items-center h-10">
            <LocaleSelect defaultValue={locale} label={t("label")} />
          </div>
          <div className="flex items-center h-10">
            <Link href={socials[1].url}>
              <GitHubLogoIcon className="h-8 w-8 hover:text-primary transition-colors" />
            </Link>
          </div>
          <div className="flex items-center h-10">
            <ThemeSelect />
          </div>
        </div>
      </div>
    </div>
  );
};
export default MobileSheet;
