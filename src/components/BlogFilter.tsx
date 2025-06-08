import { useMemo, useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  categories: string[];
  readingTime: number;
}

interface BlogFilterProps {
  posts: BlogPost[];
  className?: string;
}

export default function BlogFilter({
  posts = [],
  className = '',
}: BlogFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'readingTime'>(
    'date'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get all unique categories
  const categories = useMemo(() => {
    const allCategories = posts.flatMap((post) => post.categories);
    return ['all', ...Array.from(new Set(allCategories))];
  }, [posts]);

  // Filtered and sorted posts
  const filteredPosts = useMemo(() => {
    const filtered = posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' ||
        post.categories.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });

    // Sort posts
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'readingTime':
          aValue = a.readingTime;
          bValue = b.readingTime;
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

    return filtered;
  }, [posts, searchTerm, selectedCategory, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={`blog-filter ${className}`}>
      {/* Filter Controls */}
      <div className="p-6 mb-8 border rounded-lg bg-surface-secondary border-card-border">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-6">
          {/* Search Input */}
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block mb-2 text-sm font-medium text-text-primary"
            >
              Search Posts
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or content..."
                className="w-full px-4 py-2 pl-10 transition-all duration-200 border rounded-lg bg-surface-primary border-card-border text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <svg
                className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex-1">
            <label
              htmlFor="category"
              className="block mb-2 text-sm font-medium text-text-primary"
            >
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 pr-10 transition-all duration-200 border rounded-lg appearance-none cursor-pointer bg-surface-primary border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent hover:border-accent/50"
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                    className="bg-surface-primary text-text-primary"
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <label
                htmlFor="sortBy"
                className="block mb-2 text-sm font-medium text-text-primary"
              >
                Sort By
              </label>
              <div className="relative">
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as 'date' | 'title' | 'readingTime'
                    )
                  }
                  className="w-full px-4 py-2 pr-10 transition-all duration-200 border rounded-lg appearance-none cursor-pointer bg-surface-primary border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent hover:border-accent/50"
                >
                  <option
                    value="date"
                    className="bg-surface-primary text-text-primary"
                  >
                    Date
                  </option>
                  <option
                    value="title"
                    className="bg-surface-primary text-text-primary"
                  >
                    Title
                  </option>
                  <option
                    value="readingTime"
                    className="bg-surface-primary text-text-primary"
                  >
                    Reading Time
                  </option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <label
                htmlFor="sortOrder"
                className="block mb-2 text-sm font-medium text-text-primary"
              >
                Order
              </label>
              <div className="relative">
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as 'asc' | 'desc')
                  }
                  className="w-full px-4 py-2 pr-10 transition-all duration-200 border rounded-lg appearance-none cursor-pointer bg-surface-primary border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent hover:border-accent/50"
                >
                  <option
                    value="desc"
                    className="bg-surface-primary text-text-primary"
                  >
                    Descending
                  </option>
                  <option
                    value="asc"
                    className="bg-surface-primary text-text-primary"
                  >
                    Ascending
                  </option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 transition-all duration-200 border rounded-lg text-text-secondary hover:text-text-primary border-card-border hover:bg-surface-primary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-text-secondary">
          <span>
            Showing {filteredPosts.length} of {posts.length} posts
          </span>
        </div>

        {(searchTerm || selectedCategory !== 'all') && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span className="px-3 py-1 text-sm rounded-full bg-accent/20 text-accent">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="px-3 py-1 text-sm rounded-full bg-accent/20 text-accent">
                Category: {selectedCategory}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Blog Posts Grid */}
      <div className="transition-opacity duration-200 opacity-100">
        {filteredPosts.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-medium text-text-primary">
              No posts found
            </h3>
            <p className="text-text-secondary">
              Try adjusting your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="group bg-surface-secondary rounded-lg border border-card-border hover:border-accent/50 transition-all duration-200 overflow-hidden hover:shadow-lg hover:transform hover:scale-[1.02]"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3 text-sm text-text-secondary">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span>{post.readingTime} min read</span>
                  </div>

                  <h3 className="mb-3 text-xl font-semibold transition-colors duration-200 text-text-primary group-hover:text-accent">
                    <a href={`/blog/${post.slug}/`} className="hover:underline">
                      {post.title}
                    </a>
                  </h3>

                  <p className="mb-4 text-text-secondary line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.categories.map((category) => (
                      <span
                        key={category}
                        className="px-2 py-1 text-xs rounded-md bg-surface-primary text-text-secondary"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <a
                    href={`/blog/${post.slug}/`}
                    className="inline-flex items-center font-medium transition-colors duration-200 text-accent hover:text-accent/80"
                  >
                    Read more
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
