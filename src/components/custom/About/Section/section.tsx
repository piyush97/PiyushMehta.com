import React, { memo } from "react";

type SectionProps = {
  title: string;
  content: string;
};

/**
 * Section component that displays a title and content.
 */
const Section: React.FC<SectionProps> = ({ title, content }) => (
  <div className="space-y-2">
    <h2 className="text-lg font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
      {title}
    </h2>
    <p className="text-gray-500 md:text-base dark:text-gray-400 text-justify">
      {content}
    </p>
  </div>
);

export default memo(Section);
