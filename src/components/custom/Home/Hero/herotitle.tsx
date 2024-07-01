import { useTranslations } from "next-intl";
import { FC, memo } from "react";
import Title from "../../Common/Title/title";

interface HeroTitleProps {
  bio: string;
}

/**
 * Represents the title component of the hero section.
 *
 * @param {Object} props - The component props.
 * @param {string} props.bio - The author's bio.
 * @returns {JSX.Element} The rendered title component.
 */
const HeroTitle: FC<HeroTitleProps> = ({ bio }) => {
  const t = useTranslations("Hero");
  return (
    <div className="space-y-2">
      <Title>{t("main")}</Title>

      <h1 className="text-xl font-semibold text-primary dark:text-primary sm:text-3xl">
        {t("title")}
      </h1>
      <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
        {bio}
      </p>
    </div>
  );
};

export default memo(HeroTitle);
