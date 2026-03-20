// src/features/videos/data/videos.ts
export interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  url: string
  date: string
  duration?: string
  tags: string[]
}

export const videos: Video[] = [
  {
    id: 'gPk-K1mIfm4',
    title: 'Best way to start with Backend Development • Super fast CRUD Api using NestJS',
    description: 'Learn how to build a super fast CRUD API using NestJS. Perfect starting point for backend development with modern TypeScript framework.',
    thumbnail: 'https://img.youtube.com/vi/gPk-K1mIfm4/maxresdefault.jpg',
    url: 'https://www.youtube.com/watch?v=gPk-K1mIfm4',
    date: '3 years ago',
    duration: '19:00',
    tags: ['NestJS', 'Backend', 'TypeScript', 'CRUD'],
  },
  {
    id: 'UUYPYPLYkWI',
    title: 'Learn Typescript in a Single Video | The ultimate free Typescript Crash Course',
    description: 'Complete TypeScript crash course covering all essential concepts. Perfect for developers wanting to learn TypeScript quickly and effectively.',
    thumbnail: 'https://img.youtube.com/vi/UUYPYPLYkWI/maxresdefault.jpg',
    url: 'https://www.youtube.com/watch?v=UUYPYPLYkWI',
    date: '3 years ago',
    duration: '33:00',
    tags: ['TypeScript', 'JavaScript', 'Crash Course'],
  },
  {
    id: 'Tbvt2UMxdiE',
    title: 'Develop and Deploy Portfolio for free • The only way to showcase your dev skills in Interview!',
    description: 'Learn how to develop and deploy a portfolio for free - the essential way to showcase your development skills in interviews.',
    thumbnail: 'https://img.youtube.com/vi/Tbvt2UMxdiE/maxresdefault.jpg',
    url: 'https://www.youtube.com/watch?v=Tbvt2UMxdiE',
    date: '3 years ago',
    duration: '6:10',
    tags: ['Portfolio', 'Deployment', 'Career'],
  },
  {
    id: 'MqlliYknQM0',
    title: 'Unit testing in React Fully Explained in 1 Video | Watch Till End what happens!',
    description: 'Complete guide to unit testing in React. Learn everything you need to know about testing React applications in one comprehensive video.',
    thumbnail: 'https://img.youtube.com/vi/MqlliYknQM0/maxresdefault.jpg',
    url: 'https://www.youtube.com/watch?v=MqlliYknQM0',
    date: '3 years ago',
    duration: '28:00',
    tags: ['React', 'Testing', 'Unit Tests'],
  },
  {
    id: 'eVrXFitvegs',
    title: 'The one with OpenGraph Protocol and React Helmet | Part Infinity of series',
    description: 'Learn about OpenGraph Protocol and React Helmet for better social media sharing and SEO optimization in React applications.',
    thumbnail: 'https://img.youtube.com/vi/eVrXFitvegs/maxresdefault.jpg',
    url: 'https://www.youtube.com/watch?v=eVrXFitvegs',
    date: '3 years ago',
    duration: '9:32',
    tags: ['React', 'SEO', 'OpenGraph'],
  },
  {
    id: 'v862HChL4gE',
    title: 'Free Firebase Unlimited!!! | Supabase for ReactJS Auth | Part 8 of series',
    description: 'Learn how to use Supabase as a free Firebase alternative for ReactJS authentication. Complete tutorial with practical examples.',
    thumbnail: 'https://img.youtube.com/vi/v862HChL4gE/maxresdefault.jpg',
    url: 'https://www.youtube.com/watch?v=v862HChL4gE',
    date: '3 years ago',
    duration: '25:00',
    tags: ['React', 'Supabase', 'Authentication'],
  },
  {
    id: '82hBce77RDE',
    title: 'Easiest Way to make a Dashboard in ReactJS! | Part 11 of series',
    description: 'Learn the easiest way to create a beautiful and functional dashboard in ReactJS. Step-by-step tutorial with practical examples.',
    thumbnail: 'https://img.youtube.com/vi/82hBce77RDE/maxresdefault.jpg',
    url: 'https://www.youtube.com/watch?v=82hBce77RDE',
    date: '3 years ago',
    duration: '17:00',
    tags: ['React', 'Dashboard', 'UI'],
  },
  {
    id: 'cnmPhFof23Y',
    title: 'Why developers are crazy for this one!! |React Query, does all for me!',
    description: 'Discover why developers love React Query and how it can simplify your data fetching and state management in React applications.',
    thumbnail: 'https://img.youtube.com/vi/cnmPhFof23Y/maxresdefault.jpg',
    url: 'https://www.youtube.com/watch?v=cnmPhFof23Y',
    date: '3 years ago',
    duration: '21:00',
    tags: ['React', 'React Query', 'State Management'],
  },
]
