import React, { memo } from "react";
import SectionTitle from "../../Common/SectionTitle/sectionTitle";

type SectionProps = {
  title: string;
  content: string;
};

/**
 * Section component that displays a title and content.
 */
const Section: React.FC<SectionProps> = ({ title, content }) => (
  <div className="space-y-2">
    <SectionTitle>{title}</SectionTitle>
    <p className="text-gray-500 md:text-base dark:text-gray-400 text-justify">
      {content}
    </p>
  </div>
);

export default memo(Section);
