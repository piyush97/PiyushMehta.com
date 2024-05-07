import { sections } from "@/lib/constants";
import { Section } from "@/lib/types";
import { FC } from "react";
import { twc } from "react-twc";
import SectionHeader from "../About/SectionHeader/sectionHeader";
import Container from "../Common/Container/container";
import SectionContent from "./sectionContent";

const Main = twc.main`w-full max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 lg:py-24`;

const Uses: FC = () => {
  return (
    <Main>
      <Container>
        <SectionHeader
          title="My Tech and Tools"
          body="I use a variety of tools and technologies to build things. Here are some of them."
        />
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
