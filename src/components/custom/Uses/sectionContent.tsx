import { Section as SectionType } from "@/lib/types";
import { twc } from "react-twc";
import Item from "./item";

const Section = twc.section`grid gap-4 md:gap-6`;
const HeadingContainer = twc.div`flex items-center gap-4`;
const Heading = twc.h2`text-2xl font-bold tracking-tight`;
const Row = twc.div`grid sm:grid-cols-2 lg:grid-cols-3 gap-6`;

const SectionContent: React.FC<SectionType> = ({ Icon, title, items }) => (
  <Section>
    <HeadingContainer>
      <Icon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
      <Heading>{title}</Heading>
    </HeadingContainer>
    <Row>
      {items.map((item, index) => (
        <Item {...item} key={item.title} />
      ))}
    </Row>
  </Section>
);

export default SectionContent;
