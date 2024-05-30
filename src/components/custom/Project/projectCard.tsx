import { Card } from "@/components/ui/card";
import {
  ActivityIcon,
  ExternalLinkIcon,
  GitForkIcon,
  GithubIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Owner = {
  avatar_url: string;
  html_url: string;
};

type Project = {
  name: string;
  forks_count: number;
  stargazers_count: number;
  pushed_at: string;
  html_url: string;
  owner: Owner;
  id: string;
};

export default function ProjectCard({
  name,
  forks_count,
  stargazers_count,
  pushed_at,
  html_url,
  owner,
  id,
}: Project) {
  return (
    <Card className="h-full border-gray-100 dark:border-transparent ">
      <div className="relative h-48 md:h-56 lg:h-64 overflow-hidden rounded-t-lg">
        <Image
          alt={name}
          className="w-full h-full object-cover"
          height="460"
          src={`https://opengraph.githubassets.com/${id}/piyush97/${name}`}
          style={{
            objectFit: "fill",
          }}
          width="920"
        />
      </div>
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-b-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <StarIcon className="w-4 h-4" />
            <span>{stargazers_count}</span>
            <GitForkIcon className="w-4 h-4" />
            <span>{forks_count}</span>
            <ActivityIcon className="w-4 h-4" />
            <span>{new Date(pushed_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={html_url}>
              <GithubIcon className="w-5 h-5" />
            </Link>
            <Link href={owner.html_url}>
              <ExternalLinkIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
