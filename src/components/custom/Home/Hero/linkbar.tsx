import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { FC } from "react";

/**
 * Represents the link bar component of the hero section.
 */
const Linkbar: FC = () => {
  const t = useTranslations("Linkbar");
  return (
    <div className="flex flex-col gap-2 min-[400px]:flex-row">
      <Button variant="outline">{t("viewProjects")}</Button>
      <Button variant="default">{t("contactMe")}</Button>
    </div>
  );
};

export default Linkbar;
