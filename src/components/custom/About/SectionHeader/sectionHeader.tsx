import { memo } from "react";
import Title from "../../Common/Title/title";

type Props = {
  title: string;
  body: string;
};

/**
 * Section header component that displays a title and body.
 */
const SectionHeader: React.FC<Props> = ({ title, body }: Props) => (
  <div className="container flex flex-col items-center space-y-10 px-4 md:px-6">
    <div className="text-center space-y-4">
      <Title>{title}</Title>
      <p className="max-w-[800px] text-gray-500 md:text-xl md:mx-auto dark:text-gray-400 ">
        {body}
      </p>
    </div>
  </div>
);
export default memo(SectionHeader);
