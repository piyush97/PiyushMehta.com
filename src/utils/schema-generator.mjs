// schema-generator.mjs - For generating rich structured data for the website

export const generatePersonSchema = (additionalData = {}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Piyush Mehta',
    url: 'https://piyushmehta.com',
    jobTitle: 'Senior Software Engineer',
    description:
      'Software Engineer, React Developer, Tech Speaker, and Open Source Contributor based in Canada',
    image: 'https://piyushmehta.com/images/piyush-profile.jpg',
    sameAs: [
      'https://github.com/piyush97',
      'https://linkedin.com/in/piyush24',
      'https://twitter.com/piyushmehtas',
    ],
    worksFor: {
      '@type': 'Organization',
      name: 'Tech Industry',
    },
    alumniOf: {
      '@type': 'EducationalOrganization',
      name: 'University of Windsor',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Toronto',
      addressRegion: 'Ontario',
      addressCountry: 'Canada',
    },
    knowsAbout: [
      'React',
      'ReactJS',
      'React.js',
      'Node.js',
      'TypeScript',
      'JavaScript',
      'DevOps',
      'Cloud Computing',
      'Software Architecture',
      'Web Development',
      'Frontend Development',
      'Software Engineering',
    ],
    ...additionalData,
  };
};

export const generateWebsiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Piyush Mehta - Software Engineer & React Developer',
    url: 'https://piyushmehta.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://piyushmehta.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    author: {
      '@type': 'Person',
      name: 'Piyush Mehta',
    },
    description:
      'Personal website and blog of Piyush Mehta, a Senior Software Engineer and React Developer based in Canada. Sharing insights on web development, React.js, and software engineering.',
    publisher: {
      '@type': 'Person',
      name: 'Piyush Mehta',
    },
    inLanguage: 'en-US',
  };
};

export const generateBlogSchema = (posts = []) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Piyush Mehta Blog',
    url: 'https://piyushmehta.com/blog',
    description:
      'Articles and tutorials on React.js, JavaScript, web development, and software engineering by Piyush Mehta.',
    author: {
      '@type': 'Person',
      name: 'Piyush Mehta',
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      url: `https://piyushmehta.com/blog/${post.slug}`,
      datePublished: post.publishedDate,
      dateModified: post.modifiedDate || post.publishedDate,
      author: {
        '@type': 'Person',
        name: 'Piyush Mehta',
      },
      keywords: post.tags.join(', '),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://piyushmehta.com/blog/${post.slug}`,
      },
    })),
  };
};

export const generateServicesSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Software Development',
    name: 'React Development Services',
    provider: {
      '@type': 'Person',
      name: 'Piyush Mehta',
    },
    description:
      'Professional React.js development and software engineering services, including custom application development, performance optimization, and technical consultation.',
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      price: '155.00',
      priceCurrency: 'USD',
      validFrom: '2023-01-01',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Software Development Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'React.js Development',
            description:
              'Custom React.js application development with modern patterns and best practices.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Frontend Architecture',
            description:
              'Designing scalable frontend architectures for modern web applications.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Performance Optimization',
            description:
              'Improving application performance through code optimization and efficient rendering strategies.',
          },
        },
      ],
    },
  };
};

export const generateReactDeveloperSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'React Developer Services - Piyush Mehta',
    description:
      'Expert React.js development services by Piyush Mehta, a senior software engineer specializing in building modern, high-performance React applications.',
    url: 'https://piyushmehta.com/react-developer',
    serviceType: ['Web Development', 'React Development', 'Software Engineering'],
    provider: {
      '@type': 'Person',
      name: 'Piyush Mehta',
      jobTitle: 'React Developer',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'React Development Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Custom React Applications',
            description:
              'End-to-end development of custom React applications tailored to your business requirements.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'React Performance Optimization',
            description:
              'Identification and resolution of performance bottlenecks in React applications.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'React Architecture Consultation',
            description:
              'Expert guidance on React application architecture and state management.',
          },
        },
      ],
    },
  };
};

export const generateSoftwareEngineerSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Software Engineering Services - Piyush Mehta',
    description:
      'Professional software engineering services by Piyush Mehta, a senior software engineer based in Canada specializing in modern web technologies.',
    url: 'https://piyushmehta.com/services',
    serviceType: ['Software Development', 'Web Development', 'Technical Consultation'],
    provider: {
      '@type': 'Person',
      name: 'Piyush Mehta',
      jobTitle: 'Software Engineer',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
  };
};

export const generateFAQSchema = (faqs = []) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};
