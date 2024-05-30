"use client";
import SectionHeader from "@/components/custom/About/SectionHeader/sectionHeader";
import Container from "@/components/custom/Common/Container/container";
import Main from "@/components/custom/Common/Main/main";
import ProjectCard from "@/components/custom/Project/projectCard";
import { useTranslations } from "next-intl";
import { Octokit } from "octokit";
import { useEffect, useState } from "react";

type Props = {
  params: { locale: string };
};

const octokit = new Octokit({
  auth: process.env.GITHUB_API_TOKEN,
});

const getProjectsFromGithub = async () => {
  const response = await octokit.request("GET /users/piyush97/repos", {
    username: "piyush97",
    type: "owner",
    per_page: 42,
    page: 1,
    sort: "updated",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return response.data;
};

const Page: React.FC<Props> = ({ params: { locale } }: Props) => {
  // unstable_setRequestLocale(locale);
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    getProjectsFromGithub().then((data) => setProjects(data));
  }, []);

  const t = useTranslations("Projects");
  return (
    <Main>
      <Container>
        <SectionHeader title={t("title")} body={t("description")} />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      </Container>
    </Main>
  );
};
export default Page;
