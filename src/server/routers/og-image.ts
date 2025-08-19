// OG Image tRPC Router
import { z } from 'zod';
import { generateOGImage, type OGImageParams } from '../../utils/og-generator';
import {
  getOptimalDimensions,
  optimizeDescriptionForPlatform,
  optimizeTitleForPlatform,
  type SocialPlatform,
  suggestTemplateForPlatform,
} from '../../utils/og-title-optimizer';
import { createTRPCError, createTRPCRouter, publicProcedure } from '../trpc';

// Validation schemas
const ogImageSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  template: z
    .enum([
      'default',
      'article',
      'minimal',
      'tech',
      'personal',
      'blog',
      'cyber',
      'gradient',
      'terminal',
      'modern',
      'professional',
      'facebook',
      'linkedin',
      'whatsapp',
    ])
    .default('default'),
  theme: z.enum(['light', 'dark', 'blue', 'purple', 'green']).default('dark'),
  platform: z.enum(['facebook', 'linkedin', 'whatsapp', 'twitter', 'general']).optional(),
  tags: z.array(z.string()).max(5).optional(),
  author: z.string().max(50).optional(),
  date: z.string().optional(),
  readTime: z.string().optional(),
});

const previewSchema = z.object({
  width: z.number().min(100).max(1200).default(1200),
  height: z.number().min(100).max(630).default(630),
  format: z.enum(['png', 'jpeg']).default('png'),
});

export const ogImageRouter = createTRPCRouter({
  // Generate OG image
  generate: publicProcedure
    .input(ogImageSchema.merge(previewSchema))
    .mutation(async ({ input }) => {
      try {
        const { width, height, format, ...params } = input;

        const ogParams: OGImageParams = {
          ...params,
          width,
          height,
        };

        const imageBuffer = await generateOGImage(ogParams);

        // Convert buffer to base64 for client response
        const base64Image = imageBuffer.toString('base64');
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64Image}`;

        return {
          success: true,
          data: {
            image: dataUri,
            size: imageBuffer.length,
            format,
            dimensions: { width, height },
            generatedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error('OG image generation error:', error);
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to generate OG image');
      }
    }),

  // Get available templates
  getTemplates: publicProcedure.query(async () => {
    return {
      success: true,
      data: {
        templates: [
          {
            id: 'default',
            name: 'Default',
            description: 'Standard blog post template',
          },
          {
            id: 'article',
            name: 'Article',
            description: 'Long-form article template',
          },
          {
            id: 'minimal',
            name: 'Minimal',
            description: 'Clean and simple design',
          },
          {
            id: 'tech',
            name: 'Tech',
            description: 'Technical content template',
          },
          {
            id: 'personal',
            name: 'Personal',
            description: 'Personal blog template',
          },
          {
            id: 'blog',
            name: 'Blog',
            description: 'Modern blog post template',
          },
          {
            id: 'cyber',
            name: 'Cyber',
            description: 'Cyberpunk aesthetic template',
          },
          {
            id: 'gradient',
            name: 'Gradient',
            description: 'Colorful gradient template',
          },
          {
            id: 'terminal',
            name: 'Terminal',
            description: 'Developer terminal theme',
          },
          {
            id: 'modern',
            name: 'Modern',
            description: 'Contemporary design template',
          },
          {
            id: 'professional',
            name: 'Professional',
            description: 'Business-focused template',
          },
          {
            id: 'facebook',
            name: 'Facebook',
            description: 'Optimized for Facebook sharing',
          },
          {
            id: 'linkedin',
            name: 'LinkedIn',
            description: 'Professional LinkedIn template',
          },
          {
            id: 'whatsapp',
            name: 'WhatsApp',
            description: 'Clean WhatsApp-optimized design',
          },
        ],
        themes: [
          {
            id: 'light',
            name: 'Light',
            primary: '#ffffff',
            secondary: '#000000',
          },
          {
            id: 'dark',
            name: 'Dark',
            primary: '#000000',
            secondary: '#ffffff',
          },
          {
            id: 'blue',
            name: 'Blue',
            primary: '#1e40af',
            secondary: '#ffffff',
          },
          {
            id: 'purple',
            name: 'Purple',
            primary: '#7c3aed',
            secondary: '#ffffff',
          },
          {
            id: 'green',
            name: 'Green',
            primary: '#059669',
            secondary: '#ffffff',
          },
        ],
      },
    };
  }),

  // Validate OG image parameters
  validate: publicProcedure.input(ogImageSchema).query(async ({ input }) => {
    try {
      // Perform validation checks
      const issues: string[] = [];

      if (input.title.length > 80) {
        issues.push('Title should be under 80 characters for better readability');
      }

      if (input.description && input.description.length > 160) {
        issues.push('Description should be under 160 characters');
      }

      if (input.tags && input.tags.length > 3) {
        issues.push('Consider using 3 or fewer tags for better layout');
      }

      return {
        success: true,
        data: {
          valid: issues.length === 0,
          issues,
          suggestions: [
            'Use action-oriented titles for better engagement',
            'Include relevant keywords in the description',
            'Choose colors that match your brand',
          ],
        },
      };
    } catch (_error) {
      throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to validate OG image parameters');
    }
  }),

  // Get platform-specific optimization recommendations
  getPlatformOptimizations: publicProcedure
    .input(
      z.object({
        platform: z.enum(['facebook', 'linkedin', 'whatsapp', 'twitter', 'general']),
      })
    )
    .query(async ({ input }) => {
      const optimizations = {
        facebook: {
          recommendedDimensions: { width: 1200, height: 630 },
          titleLimit: 65,
          descriptionLimit: 155,
          template: 'facebook',
          tips: [
            'Use bright, engaging visuals for better engagement',
            'Include your brand colors for recognition',
            'Keep text large enough to read on mobile',
            'Use contrasting colors for better visibility',
          ],
        },
        linkedin: {
          recommendedDimensions: { width: 1200, height: 627 },
          titleLimit: 70,
          descriptionLimit: 160,
          template: 'linkedin',
          tips: [
            'Professional appearance is key for LinkedIn',
            'Include job titles or company information',
            'Use business-appropriate colors and fonts',
            'Highlight expertise and achievements',
          ],
        },
        whatsapp: {
          recommendedDimensions: { width: 1200, height: 630 },
          titleLimit: 60,
          descriptionLimit: 120,
          template: 'whatsapp',
          tips: [
            'Keep design clean and readable',
            'Use clear, simple messaging',
            'Optimize for mobile viewing',
            'Ensure text is legible at small sizes',
          ],
        },
        twitter: {
          recommendedDimensions: { width: 1200, height: 675 },
          titleLimit: 70,
          descriptionLimit: 200,
          template: 'default',
          tips: [
            'Use bold, eye-catching visuals',
            'Keep text concise and impactful',
            'Include hashtags strategically',
            'Optimize for timeline viewing',
          ],
        },
        general: {
          recommendedDimensions: { width: 1200, height: 630 },
          titleLimit: 60,
          descriptionLimit: 155,
          template: 'default',
          tips: [
            'Follow Open Graph standard dimensions',
            'Ensure compatibility across platforms',
            'Use universal design principles',
            'Test on multiple social networks',
          ],
        },
      };

      return {
        success: true,
        data: optimizations[input.platform],
      };
    }),

  // Optimize title and description for specific platform
  optimizeForPlatform: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
        platform: z.enum(['facebook', 'linkedin', 'whatsapp', 'twitter', 'general']),
      })
    )
    .query(async ({ input }) => {
      try {
        const { title, description, platform } = input;

        // Optimize title
        const titleOptimization = optimizeTitleForPlatform(title, platform as SocialPlatform);

        // Optimize description if provided
        const descriptionOptimization = description
          ? optimizeDescriptionForPlatform(description, platform as SocialPlatform)
          : null;

        // Get optimal dimensions and template suggestion
        const optimalDimensions = getOptimalDimensions(platform as SocialPlatform);
        const suggestedTemplate = suggestTemplateForPlatform(platform as SocialPlatform);

        return {
          success: true,
          data: {
            platform,
            title: titleOptimization,
            description: descriptionOptimization,
            recommendations: {
              dimensions: optimalDimensions,
              template: suggestedTemplate,
            },
            platformSpecific: {
              characterLimits: {
                title:
                  platform === 'facebook'
                    ? 65
                    : platform === 'linkedin'
                      ? 70
                      : platform === 'whatsapp'
                        ? 60
                        : platform === 'twitter'
                          ? 70
                          : 60,
                description:
                  platform === 'facebook'
                    ? 155
                    : platform === 'linkedin'
                      ? 160
                      : platform === 'whatsapp'
                        ? 120
                        : platform === 'twitter'
                          ? 200
                          : 155,
              },
              bestPractices:
                platform === 'facebook'
                  ? [
                      'Use engaging visuals',
                      'Include call-to-action',
                      'Optimize for mobile viewing',
                    ]
                  : platform === 'linkedin'
                    ? [
                        'Maintain professional tone',
                        'Highlight expertise',
                        'Include business value',
                      ]
                    : platform === 'whatsapp'
                      ? [
                          'Keep it simple and clean',
                          'Ensure mobile readability',
                          'Use clear messaging',
                        ]
                      : platform === 'twitter'
                        ? ['Include hashtags', 'Use trending keywords', 'Optimize for timeline']
                        : [
                            'Universal compatibility',
                            'Cross-platform optimization',
                            'Standard dimensions',
                          ],
            },
          },
        };
      } catch (error) {
        console.error('Platform optimization error:', error);
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to optimize content for platform');
      }
    }),
});
