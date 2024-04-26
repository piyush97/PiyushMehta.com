import Section from "@/components/custom/About/Section/section";
import SectionHeader from "@/components/custom/About/SectionHeader/sectionHeader";
import Skill from "@/components/custom/About/Skill/skill";
import {
  ABOUT_ME,
  ABOUT_ME_APPROACH,
  ABOUT_ME_BG,
  ABOUT_ME_WHAT_TO_EXPECT,
} from "@/lib/constants";

/**
 * About page component that displays information about the author.
 */
const Page: React.FC = () => {
  return (
    <main className="w-full py-12 md:py-24 lg:py-32">
      <div className="container flex flex-col items-center space-y-10 px-4 md:px-6">
        <SectionHeader title="About Me" body={ABOUT_ME} />
        <div className="grid max-w-5xl gap-8 items-start text-sm md:grid-cols-2 lg:text-base lg:gap-10 xl:max-w-6xl">
          <div className="space-y-6">
            <Section title="Background" content={ABOUT_ME_BG} />
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                Skills
              </h2>
              <Skill />
            </div>
          </div>
          <div className="space-y-6">
            <Section title="My Approach" content={ABOUT_ME_APPROACH} />
            <Section title="What to Expect" content={ABOUT_ME_WHAT_TO_EXPECT} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
