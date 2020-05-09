const siteUrl = 'https://piyushmehta.com';
const TitleName = 'Piyush Mehta';
module.exports = {
  siteMetadata: {
    title: TitleName,
    siteUrl,
    canonicalUrl: siteUrl,
    keywords: [
      'Software Engineer',
      'React Developer',
      'Full Stack JavaScript Developer',
    ],
  },
  plugins: [
    {
      resolve: 'gatsby-source-contentful',
      options: {
        spaceId: process.env.CONTENTFUL_SPACE_ID,
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
      },
    },
    {
      resolve: 'gatsby-plugin-robots-txt',
      options: {
        host: 'https://www.piyushmehta.com',
        sitemap: 'https://www.piyushmehta.com/sitemap.xml',
        policy: [{ userAgent: '*', allow: '/' }],
      },
    },
    'gatsby-plugin-sitemap',
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blog`,
        path: `${__dirname}/content/blog`,
      },
    },
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-google-fonts`,
      options: {
        fonts: [`Source Code Pro`, `Muli:400,400i,500,700`],
        display: 'swap',
      },
    },
    {
      resolve: 'gatsby-plugin-mdx',
      options: {
        extensions: ['.mdx', '.md', '.markdown'],
        gatsbyRemarkPlugins: [
          { resolve: 'gatsby-remark-copy-linked-files' },
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 800,
              disableBgImageOnAlpha: true,
            },
          },
          { resolve: 'gatsby-remark-embedder' },
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        start_url: `/`,
        name: `Piyush Mehta`,
        short_name: `mehta`,
        description:
          'The personal website of Piyush Mehta. Learn and level-up about React & JavaScript.',
        background_color: `#1f2347`,
        theme_color: `#FFCC68`,
        display: `standalone`,
        icon: `src/images/icon.png`, // This path is relative to the root of
        // the site.
      },
    },
    'gatsby-plugin-offline',
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: 'UA-71632651-1',
        anonymize: true,
      },
    },
  ],
};
