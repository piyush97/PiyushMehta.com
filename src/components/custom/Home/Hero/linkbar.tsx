import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FC, memo } from "react";

/**
 * Represents the link bar component of the hero section.
 */
const Linkbar: FC = () => {
  return (
    <div className="flex flex-col gap-2 min-[400px]:flex-row">
      <Link
        href="#"
        className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
      >
        <Button variant="ghost">View Projects</Button>
      </Link>
      <Link
        href=""
        className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200  bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800  dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
      >
        <Button variant="ghost">Contact Me</Button>
      </Link>
    </div>
  );
};

export default memo(Linkbar);
