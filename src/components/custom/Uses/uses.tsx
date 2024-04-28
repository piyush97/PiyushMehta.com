import { sections } from "@/lib/constants";
import { Section } from "@/lib/types";
import { FC } from "react";
import { twc } from "react-twc";
import SectionContent from "./sectionContent";

const Main = twc.main`w-full max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 lg:py-24`;

const Uses: FC = () => {
  return (
    <Main>
      <div className="grid gap-12 md:gap-16">
        {sections.map((section: Section, index: number) => (
          <SectionContent {...section} key={index} />
        ))}
      </div>
    </Main>
  );
};

export default Uses;
