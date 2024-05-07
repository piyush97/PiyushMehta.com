import { Card } from "@/components/ui/card";
import { Project } from "@/lib/types";
import {
  ActivityIcon,
  ExternalLinkIcon,
  GitForkIcon,
  GithubIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ProjectCard({
  title,
  description,
  stars,
  forks,
  lastActivity,
  githubUrl,
  href,
}: Project) {
  return (
    <Card className="h-full border-0 ">
      <div className="relative h-48 md:h-56 lg:h-64 overflow-hidden rounded-t-lg">
        <Image
          alt={title}
          className="w-full h-full object-cover"
          height="360"
          src="https://picsum.photos/600/360" // TODO: Replace with actual image
          style={{
            aspectRatio: "640/360",
            objectFit: "cover",
          }}
          width="640"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm">{description}</p>
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-b-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <StarIcon className="w-4 h-4" />
            <span>{stars}</span>
            <GitForkIcon className="w-4 h-4" />
            <span>{forks}</span>
            <ActivityIcon className="w-4 h-4" />
            <span>{lastActivity}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="hover:text-gray-900 dark:hover:text-gray-50"
              href={githubUrl}
            >
              <GithubIcon className="w-5 h-5" />
            </Link>
            <Link
              className="hover:text-gray-900 dark:hover:text-gray-50"
              href={href}
            >
              <ExternalLinkIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
