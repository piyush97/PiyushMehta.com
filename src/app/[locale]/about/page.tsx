import Section from "@/components/custom/About/Section/section";
import SectionHeader from "@/components/custom/About/SectionHeader/sectionHeader";
import Skill from "@/components/custom/About/Skill/skill";
import SectionTitle from "@/components/custom/Common/SectionTitle/sectionTitle";
import { useTranslations } from "next-intl";

/**
 * About page component that displays information about the author.
 */
const Page: React.FC = () => {
  const t = useTranslations("AboutMe");

  return (
    <main className="w-full py-12 md:py-24 lg:py-32">
      <div className="container flex flex-col items-center space-y-10 px-4 md:px-6">
        <SectionHeader title={t("title")} body={t("about")} />
        <div className="grid max-w-5xl gap-8 items-start text-sm md:grid-cols-2 lg:text-base lg:gap-10 xl:max-w-6xl">
          <div className="space-y-6">
            <Section title={t("background")} content={t("aboutme")} />
            <div className="space-y-2">
              <SectionTitle>{t("skills")}</SectionTitle>
              <Skill />
            </div>
          </div>
          <div className="space-y-6">
            <Section title={t("myapproach")} content={t("approach")} />
            <Section title={t("whattoexpect")} content={t("expectation")} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
