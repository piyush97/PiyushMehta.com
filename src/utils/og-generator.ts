import { Resvg } from '@resvg/resvg-js';
import fs from 'fs/promises';
import path from 'path';
import satori from 'satori';
import sharp from 'sharp';

// Cache for page data
const pageDataCache = new Map();

interface PageData {
  title: string;
  description: string;
  imagePreview?: string;
}

export async function getPageData(pagePath: string): Promise<PageData> {
  // If we have cached data, return it
  if (pageDataCache.has(pagePath)) {
    return pageDataCache.get(pagePath);
  }

  // Default values
  let pageData: PageData = {
    title: 'Piyush Mehta',
    description: 'Software Engineer, Speaker, and Open Source Enthusiast',
  };

  try {
    // For home page
    if (pagePath === '' || pagePath === 'home') {
      pageData = {
        title: 'Piyush Mehta',
        description: 'Software Engineer, Speaker, and Open Source Enthusiast',
        imagePreview: 'home-preview.png',
      };
    }
    // For contact page
    else if (pagePath === 'contact-me') {
      pageData = {
        title: "Let's Talk",
        description:
          'Connect with me for speaking engagements, collaborations or questions about software development.',
        imagePreview: 'contact-preview.png',
      };
    }
    // Add more page-specific data here
    // else if (pagePath === 'another-page') {...}

    // Cache the data
    pageDataCache.set(pagePath, pageData);
    return pageData;
  } catch (error) {
    console.error(`Failed to get data for page ${pagePath}:`, error);
    return pageData;
  }
}

export async function generateOgImage(pagePath: string): Promise<Buffer> {
  // Get page specific data
  const pageData = await getPageData(pagePath);

  // Load fonts
  const interRegular = await fs.readFile(
    path.resolve('./public/fonts/Inter-Regular.ttf')
  );
  const interBold = await fs.readFile(
    path.resolve('./public/fonts/Inter-Bold.ttf')
  );

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0f172a', // Dark background color
          padding: '40px',
          color: '#ffffff',
          fontFamily: 'Inter',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
              },
              children: [
                {
                  type: 'h1',
                  props: {
                    style: {
                      fontSize: '48px',
                      fontWeight: 'bold',
                      color: '#60a5fa', // Light blue accent
                      margin: 0,
                    },
                    children: pageData.title,
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
                lineHeight: 1.5,
                marginBottom: '30px',
              },
              children: pageData.description,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '24px',
                      fontWeight: 'bold',
                    },
                    children: 'piyushmehta.com',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#60a5fa',
                            marginRight: '10px',
                          },
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '20px',
                          },
                          children: 'Piyush Mehta',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interRegular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interBold,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  // Convert SVG to PNG
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Optimize the PNG
  return await sharp(pngBuffer).png({ quality: 90 }).toBuffer();
}
