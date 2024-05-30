import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { routes } from "@/lib/routes";
import { Route } from "@/lib/types";
import { MenuIcon } from "lucide-react";
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
          {routes.map((route: Route) =>
            route.isVisible ? (
              <Link
                className="flex w-full items-center py-2 text-lg font-semibold"
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
  );
};

export default MobileSheet;
