import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { routes } from "@/lib/routes";
import { MenuIcon } from "lucide-react";
import { Route } from "next";
import { useTranslations } from "next-intl";
import Link from "next/link";

type Props = {};

const MobileSheet = (props: Props) => {
  const t = useTranslations("Header");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="lg:hidden" size="icon" variant="outline">
          <MenuIcon className="h-6 w-6" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <Link className="mr-6 hidden lg:flex" href="#">
          <span className="sr-only">Piyush Mehta</span>
        </Link>
        <div className="grid gap-2 py-6">
          {routes.map(({ path, name, isVisible = true }: Route) =>
            isVisible ? (
              <Link
                className="flex w-full items-center py-2 text-lg font-semibold"
                href={path}
                key={name}
              >
                {t(name)}
              </Link>
            ) : null
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSheet;
