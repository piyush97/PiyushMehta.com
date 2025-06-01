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
  const [isLoading, setIsLoading] = useState(false);

  // Get all unique categories
  const categories = useMemo(() => {
    const allCategories = posts.flatMap((post) => post.categories);
    return ['all', ...Array.from(new Set(allCategories))];
  }, [posts]);

  // Filtered and sorted posts
  const filteredPosts = useMemo(() => {
    setIsLoading(true);

    let filtered = posts.filter((post) => {
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
        case 'date':
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Simulate loading delay for smooth UX
    setTimeout(() => setIsLoading(false), 150);

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
      <div className="p-6 mb-8 bg-surface-secondary rounded-lg border border-card-border">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-6">
          {/* Search Input */}
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-text-primary mb-2"
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
                className="w-full px-4 py-2 pl-10 bg-surface-primary border border-card-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-surface-primary border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <label
                htmlFor="sortBy"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Sort By
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'date' | 'title' | 'readingTime')
                }
                className="w-full px-4 py-2 bg-surface-primary border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="readingTime">Reading Time</option>
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="sortOrder"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Order
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-4 py-2 bg-surface-primary border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-text-secondary hover:text-text-primary border border-card-border rounded-lg hover:bg-surface-primary transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-text-secondary">
          {isLoading ? (
            <span>Filtering posts...</span>
          ) : (
            <span>
              Showing {filteredPosts.length} of {posts.length} posts
            </span>
          )}
        </div>

        {(searchTerm || selectedCategory !== 'all') && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm">
                Category: {selectedCategory}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Blog Posts Grid */}
      <div
        className={`transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
      >
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-text-secondary mb-4"
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
            <h3 className="text-lg font-medium text-text-primary mb-2">
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
                  <div className="flex items-center justify-between text-sm text-text-secondary mb-3">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span>{post.readingTime} min read</span>
                  </div>

                  <h3 className="text-xl font-semibold text-text-primary mb-3 group-hover:text-accent transition-colors duration-200">
                    <a href={`/blog/${post.slug}/`} className="hover:underline">
                      {post.title}
                    </a>
                  </h3>

                  <p className="text-text-secondary mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.categories.map((category) => (
                      <span
                        key={category}
                        className="px-2 py-1 bg-surface-primary text-text-secondary text-xs rounded-md"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <a
                    href={`/blog/${post.slug}/`}
                    className="inline-flex items-center text-accent hover:text-accent/80 font-medium transition-colors duration-200"
                  >
                    Read more
                    <svg
                      className="ml-1 w-4 h-4"
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
