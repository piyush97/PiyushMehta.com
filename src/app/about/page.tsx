import Section from "@/components/custom/About/Section/section";
import SectionHeader from "@/components/custom/About/SectionHeader/sectionHeader";
import Skill from "@/components/custom/About/Skill/skill";
import Container from "@/components/custom/Common/Container/container";
import Main from "@/components/custom/Common/Main/main";
import SectionTitle from "@/components/custom/Common/SectionTitle/sectionTitle";
import {
  ABOUT_ME,
  ABOUT_ME_APPROACH,
  ABOUT_ME_BG,
  ABOUT_ME_WHAT_TO_EXPECT,
} from "@/lib/constants";
import { twc } from "react-twc";

const Row = twc.div`space-y-6`;
const Grid = twc.div`grid max-w-5xl gap-8 items-start text-sm md:grid-cols-2 lg:text-base lg:gap-10 xl:max-w-6xl`;
/**
 * About page component that displays information about the author.
 */
const Page: React.FC = () => {
  return (
    <Main>
      <Container>
        <SectionHeader title="About Me" body={ABOUT_ME} />
        <Grid>
          <Row>
            <Section title="Background" content={ABOUT_ME_BG} />
            <Row>
              <SectionTitle>Skills</SectionTitle>
              <Skill />
            </Row>
          </Row>
          <Row>
            <Section title="My Approach" content={ABOUT_ME_APPROACH} />
            <Section title="What to Expect" content={ABOUT_ME_WHAT_TO_EXPECT} />
          </Row>
        </Grid>
      </Container>
    </Main>
  );
};

export default Page;
