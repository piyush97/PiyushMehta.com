import { sections } from "@/lib/constants";
import { Section } from "@/lib/types";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { twc } from "react-twc";
import SectionHeader from "../About/SectionHeader/sectionHeader";
import Container from "../Common/Container/container";
import SectionContent from "./sectionContent";

const Main = twc.main`w-full max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 lg:py-24`;

const Uses: FC = () => {
  const t = useTranslations("Uses");
  return (
    <Main>
      <Container>
        <SectionHeader title={t("title")} body={t("uses")} />
        <div className="grid gap-12 md:gap-16">
          {sections.map((section: Section, index: number) => (
            <SectionContent {...section} key={index} />
          ))}
        </div>
      </Container>
    </Main>
  );
};

export default Uses;
