import SectionHeader from "@/components/custom/About/SectionHeader/sectionHeader";
import Container from "@/components/custom/Common/Container/container";
import Main from "@/components/custom/Common/Main/main";
import ProjectCard from "@/components/custom/Project/projectCard";
import { projects } from "@/lib/constants";
import { Project } from "@/lib/types";

// Define the Project type

const Page: React.FC = () => {
  return (
    <Main>
      <Container>
        <SectionHeader
          title="Projects"
          body="I have worked on a variety of projects. Here are a few of them."
        />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: Project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      </Container>
    </Main>
  );
};
export default Page;
