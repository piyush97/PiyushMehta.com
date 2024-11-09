import { AUTHOR_NAME } from "@/lib/constants";
import { socials } from "@/lib/routes";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FC, memo } from "react";

/**
 * Represents the footer component of the website.
 * This component displays the footer of the website.
 */
const Copyright: FC = () => {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
      <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
        &#169; {currentYear} {t("design")}{" "}
        <a
          href={socials[0].url}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4 text-primary  hover:text-accent transition-colors"
        >
          {AUTHOR_NAME}
        </a>
        . {t("source")}
        <Link
          href="https://github.com/piyush97/piyushmehta.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4 text-primary hover:text-accent transition-colors"
        >
          {" "}
          GitHub
        </Link>
        .
      </p>
    </div>
  );
};

export default memo(Copyright);
