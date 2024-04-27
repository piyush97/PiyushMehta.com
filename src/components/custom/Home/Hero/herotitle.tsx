import Title from "@/components/custom/Common/Title/title";
import { AUTHOR_NAME } from "@/lib/constants";
import { FC, memo } from "react";

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
  return (
    <div className="space-y-2">
      <Title>Hi, I&apos;m {AUTHOR_NAME}</Title>
      <h2 className="text-2xl font-semibold text-gray-500 dark:text-gray-400 sm:text-3xl">
        I&apos;m a software developer
      </h2>
      <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
        {bio}
      </p>
    </div>
  );
};

export default memo(HeroTitle);
