import { skills } from "@/lib/constants";
import { memo } from "react";

/**
 * Skill component that displays a list of skills.
 */
const Skill: React.FC = () => (
  <ul className="grid gap-2 list-disc list-inside text-gray-500 md:grid-cols-2 dark:text-gray-400">
    {skills.map(({ Icon, skill }) => (
      <li key={skill} className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {skill}
      </li>
    ))}
  </ul>
);

export default memo(Skill);
