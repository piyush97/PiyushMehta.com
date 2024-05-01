import SectionHeader from "@/components/custom/About/SectionHeader/sectionHeader";
import Container from "@/components/custom/Common/Container/container";
import Main from "@/components/custom/Common/Main/main";
import Posts from "@/components/custom/Posts/posts";
import { SanityDocument } from "next-sanity";
import { sanityFetch } from "../../../../sanity/lib/fetch";
import { POSTS_QUERY } from "../../../../sanity/lib/queries";

const Page: React.FC = async () => {
  const posts = await sanityFetch<SanityDocument[]>({
    query: POSTS_QUERY,
  });

  return (
    <Main>
      <Container>
        <SectionHeader
          title="Blog"
          body="I write here and share my knowledge with the world. Learnings, Mistakes and fun all included."
        />
        <Posts posts={posts} />
      </Container>
    </Main>
  );
};
export default Page;
