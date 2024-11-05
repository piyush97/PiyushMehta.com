import { Link } from "@/i18n/routing";
import { SanityDocument } from "next-sanity";

export default function Posts({ posts }: { posts: SanityDocument[] }) {
  return (
    <main className="container mx-auto grid grid-cols-2 divide-x-4 divide-y-2 divide-gray-100">
      {posts?.length > 0 ? (
        posts.map((post) => (
          <Link key={post._id} href={`/blog/${post.slug.current}`}>
            <h2 className="p-4 hover:bg-blue-50 dark:hover:bg-slate-900">
              {post.title}
            </h2>
          </Link>
        ))
      ) : (
        <div className="p-4 text-red-500">No posts found</div>
      )}
    </main>
  );
}
