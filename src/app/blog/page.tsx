import { SanityDocument } from "next-sanity";

import Posts from "@/components/custom/Posts/posts";
import { sanityFetch } from "../../../sanity/lib/fetch";
import { POSTS_QUERY } from "../../../sanity/lib/queries";
const posts = await sanityFetch<SanityDocument[]>({
  query: POSTS_QUERY,
});

const Page: React.FC = () => {
  return <Posts posts={posts} />;
};
export default Page;
