// src/features/projects/data/fallback.ts
import type { Project } from '../types'

export const fallbackProjects: Project[] = [
  {
    id: 'piyushmehta-com',
    title: 'PiyushMehta.com',
    description:
      'A modern, responsive portfolio website built with Astro and TypeScript. Features a blog, project showcase, and responsive design. Built for performance and SEO optimization.',
    url: 'https://piyushmehta.com',
    github: 'https://github.com/piyush97/PiyushMehta.com',
    tags: ['Astro', 'TypeScript', 'Tailwind CSS', 'MDX'],
    color: '#667EEA',
    logo: '/src/images/Piyush.svg',
  },
  {
    id: 'ai-code-reviewer',
    title: 'AI-Powered Code Review Assistant',
    description:
      'An intelligent code review tool that uses machine learning to analyze pull requests, suggest improvements, and detect potential bugs before deployment.',
    url: 'https://github.com/piyush97/ai-code-reviewer',
    github: 'https://github.com/piyush97/ai-code-reviewer',
    tags: ['Python', 'TensorFlow', 'GitHub API', 'Docker'],
    color: '#10B981',
    logo: 'https://via.placeholder.com/64x64/10B981/ffffff?text=AI',
  },
  {
    id: 'realtime-chat',
    title: 'Real-time Chat Platform',
    description:
      'A scalable real-time messaging platform with end-to-end encryption, file sharing, and video calls. Built with modern web technologies and microservices architecture.',
    url: 'https://github.com/piyush97/realtime-chat',
    github: 'https://github.com/piyush97/realtime-chat',
    tags: ['Node.js', 'Socket.io', 'React', 'MongoDB', 'WebRTC'],
    color: '#3B82F6',
    logo: 'https://via.placeholder.com/64x64/3B82F6/ffffff?text=%F0%9F%92%AC',
  },
  {
    id: 'netflix-react-clone',
    title: 'Netflix TypeScript Clone',
    description:
      'A pixel-perfect Netflix clone built with TypeScript and React. Features user authentication, video streaming, search functionality, and responsive design.',
    url: 'https://netflix-reactjs-clone.netlify.app/',
    github: 'https://github.com/piyush97/Netflix-React-Clone',
    tags: ['TypeScript', 'React', 'Netflix API', 'Firebase'],
    color: '#E50914',
    logo: '/src/images/NTC.svg',
  },
  {
    id: 'ecommerce-analytics',
    title: 'E-commerce Analytics Dashboard',
    description:
      'A comprehensive analytics dashboard for e-commerce businesses. Features real-time sales tracking, customer insights, inventory management, and predictive analytics.',
    url: 'https://github.com/piyush97/ecommerce-analytics',
    github: 'https://github.com/piyush97/ecommerce-analytics',
    tags: ['Vue.js', 'D3.js', 'Node.js', 'PostgreSQL'],
    color: '#8B5CF6',
    logo: 'https://via.placeholder.com/64x64/8B5CF6/ffffff?text=%F0%9F%93%8A',
  },
  {
    id: 'blockchain-voting',
    title: 'Blockchain Voting System',
    description:
      'A secure, transparent voting system built on Ethereum blockchain. Features smart contracts for vote integrity, real-time results, and voter verification.',
    url: 'https://github.com/piyush97/blockchain-voting',
    github: 'https://github.com/piyush97/blockchain-voting',
    tags: ['Solidity', 'Web3.js', 'React', 'Truffle', 'MetaMask'],
    color: '#F59E0B',
    logo: 'https://via.placeholder.com/64x64/F59E0B/ffffff?text=%F0%9F%97%B3%EF%B8%8F',
  },
  {
    id: 'gonuclei-com',
    title: 'GoNuclei.com',
    description:
      'A beautiful content management platform built with Gatsby, GraphQL, and Contentful. Features dynamic content rendering and blazing-fast performance.',
    url: 'https://gonuclei.com/',
    tags: ['Gatsby', 'GraphQL', 'Contentful', 'React'],
    color: '#0092EB',
    logo: '/src/images/Nuclei.svg',
  },
  {
    id: 'microservices-task-manager',
    title: 'Microservices Task Manager',
    description:
      'A scalable task management system built with microservices architecture. Features user management, real-time notifications, and distributed task processing.',
    url: 'https://github.com/piyush97/microservices-task-manager',
    github: 'https://github.com/piyush97/microservices-task-manager',
    tags: ['Docker', 'Kubernetes', 'Node.js', 'Redis', 'RabbitMQ'],
    color: '#06B6D4',
    logo: 'https://via.placeholder.com/64x64/06B6D4/ffffff?text=%E2%9A%99%EF%B8%8F',
  },
  {
    id: 'meaww-influencers-dashboard',
    title: 'Meaww Influencers Dashboard',
    description:
      'A comprehensive analytics dashboard for social media influencers. Track growth metrics, engagement rates, and revenue analytics across multiple platforms.',
    url: 'https://meaww.com/',
    tags: ['React', 'Redux', 'D3.js', 'Analytics API'],
    color: '#000',
    logo: '/src/images/Meaww.svg',
  },
  {
    id: 'gogitter',
    title: 'Open Source Contribution Tracker',
    description:
      'GoGitter helps developers track and gamify their open source contributions. Features GitHub integration, contribution streaks, and achievement system.',
    url: 'https://gogitter-16d93.web.app/',
    github: 'https://github.com/piyush97/GoGitter',
    tags: ['React', 'GitHub API', 'Firebase', 'PWA'],
    color: '#EF9B0F',
    logo: '/src/images/GoGitter.svg',
  },
  {
    id: 'zapify-ui',
    title: 'Zapify UI Component Library',
    description:
      'A modern, accessible React component library built with performance in mind. Features 50+ components, TypeScript support, and comprehensive documentation.',
    url: 'https://zapify-ui.github.io/',
    github: 'https://github.com/zapify-ui/zapify',
    tags: ['React', 'TypeScript', 'Storybook', 'SASS'],
    color: '#6C2478',
    logo: '/src/images/Zapify.svg',
  },
  {
    id: 'ml-deployment-platform',
    title: 'Machine Learning Model Deployment Platform',
    description:
      'A platform for deploying and managing machine learning models at scale. Features automated model versioning, A/B testing, and performance monitoring.',
    url: 'https://github.com/piyush97/ml-deployment-platform',
    github: 'https://github.com/piyush97/ml-deployment-platform',
    tags: ['Python', 'FastAPI', 'Docker', 'MLflow', 'Kubernetes'],
    color: '#DC2626',
    logo: 'https://via.placeholder.com/64x64/DC2626/ffffff?text=%F0%9F%A4%96',
  },
  {
    id: 'devops-pipeline',
    title: 'DevOps Pipeline Automation',
    description:
      'An automated CI/CD pipeline solution with GitOps principles. Features infrastructure as code, automated testing, security scanning, and deployment strategies.',
    url: 'https://github.com/piyush97/devops-pipeline',
    github: 'https://github.com/piyush97/devops-pipeline',
    tags: ['Jenkins', 'Terraform', 'AWS', 'Docker', 'Helm'],
    color: '#059669',
    logo: 'https://via.placeholder.com/64x64/059669/ffffff?text=%F0%9F%94%A7',
  },
  {
    id: 'gitapp',
    title: 'GitHub Repository Explorer',
    description:
      'A powerful search interface for GitHub repositories with advanced filtering, analytics, and discovery features. Built with modern search technologies.',
    url: 'https://whispering-island-83455.herokuapp.com/',
    github: 'https://github.com/piyush97/GitApp',
    tags: ['React', 'Elasticsearch', 'GitHub API', 'SASS'],
    color: '#00CDCD',
    logo: '/src/images/GitApp.svg',
  },
  {
    id: 'saledrive-smart-crm',
    title: 'SaleDrive - Smart CRM',
    description:
      'A comprehensive sales management platform with team coordination, lead tracking, automated workflows, and performance analytics for sales teams.',
    url: 'https://play.google.com/store/apps/details?id=com.aidapp.saledrive&hl=en_GB',
    tags: ['Ionic', 'Angular', 'Node.js', 'MongoDB'],
    color: '#4F46E5',
    logo: '/src/images/Aidapp.svg',
  },
  {
    id: 'quickstagram',
    title: 'Social Media Clone - QuickStagram',
    description:
      'A feature-rich Instagram clone with real-time messaging, story features, photo filters, and social interactions. Built with modern web technologies.',
    url: 'https://quickstagram.piyushmehta.com/',
    github: 'https://github.com/piyush97/quickstagram',
    tags: ['React', 'Firebase', 'Tailwind CSS', 'PWA'],
    color: '#E1306C',
    logo: 'https://assets.stickpng.com/images/580b57fcd9996e24bc43c521.png',
  },
  {
    id: 'sawan-dry-fruits',
    title: 'Sawan Dry Fruits - E-commerce Platform',
    description:
      'A high-performance e-commerce platform serving 25,000+ monthly orders. Features inventory management, payment integration, and customer analytics.',
    url: 'https://sawandryfruits.com/',
    tags: ['Shopify', 'JavaScript', 'Payment Gateway', 'Analytics'],
    color: '#16A34A',
    logo: 'https://i.ibb.co/bKh7DWv/Piyush-2.png',
  },
  {
    id: 'awesome-portfolio',
    title: 'Awesome Portfolio Template',
    description:
      'A free, customizable portfolio template for developers and designers. Features modern animations, responsive design, and easy customization options.',
    url: 'https://awesome-portfolio.piyushmehta.com/',
    github: 'https://github.com/piyush97/awesome-portfolio',
    tags: ['React', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
    color: '#F000B8',
    logo: 'https://i.ibb.co/L5Qnqdt/Awesome.png',
  },
  {
    id: 'divvy',
    title: 'Divvy - NFT Marketplace',
    description:
      'A decentralized NFT marketplace built on Polygon network. Features minting, trading, auctions, and royalty management with low gas fees.',
    url: 'https://github.com/piyush97/divvy',
    github: 'https://github.com/piyush97/divvy',
    tags: ['Solidity', 'Next.js', 'Web3.js', 'Polygon', 'IPFS'],
    color: '#8B5CF6',
    logo: 'https://i.ibb.co/Cn9CL28/Divvy.png',
  },
  {
    id: 'cloud-monitor',
    title: 'Cloud Infrastructure Monitor',
    description:
      'A real-time monitoring solution for cloud infrastructure with alerting, performance metrics, cost optimization recommendations, and automated scaling.',
    url: 'https://github.com/piyush97/cloud-monitor',
    github: 'https://github.com/piyush97/cloud-monitor',
    tags: ['Python', 'AWS', 'Prometheus', 'Grafana', 'Terraform'],
    color: '#0EA5E9',
    logo: 'https://via.placeholder.com/64x64/0EA5E9/ffffff?text=%E2%98%81%EF%B8%8F',
  },
]
