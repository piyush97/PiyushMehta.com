import { useMemo, useState } from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  category: string;
  featured: boolean;
  year: number;
}

interface ProjectShowcaseProps {
  projects: Project[];
  className?: string;
}

export default function ProjectShowcase({
  projects,
  className = '',
}: ProjectShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTech, setSelectedTech] = useState('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'year' | 'title'>('year');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique categories and technologies
  const categories = useMemo(() => {
    const cats = Array.from(new Set(projects.map((p) => p.category)));
    return ['all', ...cats];
  }, [projects]);

  const technologies = useMemo(() => {
    const techs = Array.from(new Set(projects.flatMap((p) => p.technologies)));
    return ['all', ...techs.sort()];
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((project) => {
      const matchesCategory =
        selectedCategory === 'all' || project.category === selectedCategory;
      const matchesTech =
        selectedTech === 'all' || project.technologies.includes(selectedTech);
      const matchesFeatured = !showFeaturedOnly || project.featured;

      return matchesCategory && matchesTech && matchesFeatured;
    });

    // Sort projects
    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else {
        return b.year - a.year; // Most recent first
      }
    });

    return filtered;
  }, [projects, selectedCategory, selectedTech, showFeaturedOnly, sortBy]);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedTech('all');
    setShowFeaturedOnly(false);
    setSortBy('year');
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <div className="group bg-surface-secondary rounded-lg border border-card-border hover:border-accent/50 transition-all duration-300 overflow-hidden hover:shadow-lg hover:transform hover:scale-[1.02]">
      {project.imageUrl && (
        <div className="w-full overflow-hidden aspect-video">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-semibold transition-colors duration-200 text-text-primary group-hover:text-accent">
              {project.title}
            </h3>
            <div className="flex items-center mt-1 text-sm text-text-secondary">
              <span>{project.year}</span>
              <span className="mx-2">•</span>
              <span className="capitalize">{project.category}</span>
              {project.featured && (
                <>
                  <span className="mx-2">•</span>
                  <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full text-xs font-medium">
                    Featured
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="mb-4 text-text-secondary line-clamp-3">
          {project.description}
        </p>

        {/* Technologies */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 text-xs transition-colors duration-200 rounded-md cursor-pointer bg-surface-primary text-text-secondary hover:bg-accent/20 hover:text-accent"
              onClick={() => setSelectedTech(tech)}
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 font-medium text-center text-white transition-colors duration-200 rounded-lg bg-accent hover:bg-accent/90"
            >
              <span className="flex items-center justify-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Live Demo
              </span>
            </a>
          )}

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 font-medium text-center transition-colors duration-200 border rounded-lg border-card-border text-text-primary hover:bg-surface-primary"
            >
              <span className="flex items-center justify-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const ProjectListItem = ({ project }: { project: Project }) => (
    <div className="flex items-center p-6 transition-all duration-200 border rounded-lg bg-surface-secondary border-card-border hover:border-accent/50">
      {project.imageUrl && (
        <div className="flex-shrink-0 w-20 h-20 mr-6 overflow-hidden rounded-lg">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg font-semibold truncate transition-colors duration-200 text-text-primary hover:text-accent">
              {project.title}
            </h3>
            <p className="mt-1 text-text-secondary line-clamp-2">
              {project.description}
            </p>
            <div className="flex items-center mt-2 text-sm text-text-secondary">
              <span>{project.year}</span>
              <span className="mx-2">•</span>
              <span className="capitalize">{project.category}</span>
              {project.featured && (
                <>
                  <span className="mx-2">•</span>
                  <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full text-xs font-medium">
                    Featured
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-shrink-0 space-x-2">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm font-medium text-white transition-colors duration-200 rounded-md bg-accent hover:bg-accent/90"
              >
                Live Demo
              </a>
            )}

            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm font-medium transition-colors duration-200 border rounded-md border-card-border text-text-primary hover:bg-surface-primary"
              >
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`project-showcase ${className}`}>
      {/* Filter Controls */}
      <div className="p-6 mb-8 border rounded-lg bg-surface-secondary border-card-border">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-6 lg:items-end">
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

          {/* Technology Filter */}
          <div className="flex-1">
            <label
              htmlFor="technology"
              className="block mb-2 text-sm font-medium text-text-primary"
            >
              Technology
            </label>
            <div className="relative">
              <select
                id="technology"
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="w-full px-4 py-2 pr-10 transition-all duration-200 border rounded-lg appearance-none cursor-pointer bg-surface-primary border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent hover:border-accent/50"
              >
                {technologies.map((tech) => (
                  <option
                    key={tech}
                    value={tech}
                    className="bg-surface-primary text-text-primary"
                  >
                    {tech === 'all' ? 'All Technologies' : tech}
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

          {/* Sort By */}
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
                onChange={(e) => setSortBy(e.target.value as 'year' | 'title')}
                className="w-full px-4 py-2 pr-10 transition-all duration-200 border rounded-lg appearance-none cursor-pointer bg-surface-primary border-card-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent hover:border-accent/50"
              >
                <option
                  value="year"
                  className="bg-surface-primary text-text-primary"
                >
                  Year
                </option>
                <option
                  value="title"
                  className="bg-surface-primary text-text-primary"
                >
                  Title
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

          {/* Featured Only Toggle */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-accent bg-surface-primary border-card-border focus:ring-accent focus:ring-2"
              />
              <span className="text-sm text-text-primary">Featured only</span>
            </label>
          </div>

          {/* View Mode Toggle */}
          <div className="flex overflow-hidden border rounded-lg border-card-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                viewMode === 'grid'
                  ? 'bg-accent text-white'
                  : 'bg-surface-primary text-text-secondary hover:text-text-primary'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                viewMode === 'list'
                  ? 'bg-accent text-white'
                  : 'bg-surface-primary text-text-secondary hover:text-text-primary'
              }`}
            >
              List
            </button>
          </div>

          {/* Clear Filters */}
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 transition-all duration-200 border rounded-lg text-text-secondary hover:text-text-primary border-card-border hover:bg-surface-primary"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-text-secondary">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>

        {(selectedCategory !== 'all' ||
          selectedTech !== 'all' ||
          showFeaturedOnly) && (
          <div className="flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <span className="px-3 py-1 text-sm rounded-full bg-accent/20 text-accent">
                Category: {selectedCategory}
              </span>
            )}
            {selectedTech !== 'all' && (
              <span className="px-3 py-1 text-sm rounded-full bg-accent/20 text-accent">
                Tech: {selectedTech}
              </span>
            )}
            {showFeaturedOnly && (
              <span className="px-3 py-1 text-sm rounded-full bg-accent/20 text-accent">
                Featured
              </span>
            )}
          </div>
        )}
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mb-2 text-lg font-medium text-text-primary">
            No projects found
          </h3>
          <p className="text-text-secondary">
            Try adjusting your filters to see more projects.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-8 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-6'
          }
        >
          {filteredProjects.map((project) =>
            viewMode === 'grid' ? (
              <ProjectCard key={project.id} project={project} />
            ) : (
              <ProjectListItem key={project.id} project={project} />
            )
          )}
        </div>
      )}
    </div>
  );
}
