import Container from "@/components/custom/Common/Container/container";
import Title from "@/components/custom/Common/Title/title";
import { memo } from "react";
import { twc } from "react-twc";

const TextContainer = twc.div`text-center space-y-4`;
const Body = twc.p`max-w-[800px] text-gray-500 md:text-xl md:mx-auto dark:text-gray-400 text-justify`;

interface SectionHeaderProps {
  title: string;
  body: string;
}

/**
 * Section header component that displays a title and body.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, body }) => (
  <Container>
    <TextContainer>
      <Title>{title}</Title>
      <Body>{body}</Body>
    </TextContainer>
  </Container>
);

export default memo(SectionHeader);
