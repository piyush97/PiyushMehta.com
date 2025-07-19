// OG Image tRPC Router
import { z } from 'zod';
import { generateOGImage, type OGImageParams } from '../../utils/og-generator';
import { createTRPCError, createTRPCRouter, publicProcedure } from '../trpc';

// Validation schemas
const ogImageSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  template: z.enum(['default', 'article', 'minimal', 'tech', 'personal']).default('default'),
  theme: z.enum(['light', 'dark', 'blue', 'purple', 'green']).default('dark'),
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
          { id: 'default', name: 'Default', description: 'Standard blog post template' },
          { id: 'article', name: 'Article', description: 'Long-form article template' },
          { id: 'minimal', name: 'Minimal', description: 'Clean and simple design' },
          { id: 'tech', name: 'Tech', description: 'Technical content template' },
          { id: 'personal', name: 'Personal', description: 'Personal blog template' },
        ],
        themes: [
          { id: 'light', name: 'Light', primary: '#ffffff', secondary: '#000000' },
          { id: 'dark', name: 'Dark', primary: '#000000', secondary: '#ffffff' },
          { id: 'blue', name: 'Blue', primary: '#1e40af', secondary: '#ffffff' },
          { id: 'purple', name: 'Purple', primary: '#7c3aed', secondary: '#ffffff' },
          { id: 'green', name: 'Green', primary: '#059669', secondary: '#ffffff' },
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
});
