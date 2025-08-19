// Platform-specific title optimization utilities
export type SocialPlatform = 'facebook' | 'linkedin' | 'whatsapp' | 'twitter' | 'general';

export interface TitleOptimizationResult {
  optimizedTitle: string;
  originalLength: number;
  optimizedLength: number;
  truncated: boolean;
  suggestions: string[];
}

// Platform-specific character limits and optimization rules
const PLATFORM_LIMITS = {
  facebook: {
    titleLimit: 65,
    descriptionLimit: 155,
    prioritizeEngagement: true,
    preferredWords: ['Learn', 'Discover', 'Build', 'Create', 'Master', 'Guide'],
  },
  linkedin: {
    titleLimit: 70,
    descriptionLimit: 160,
    prioritizeProfilessional: true,
    preferredWords: ['Professional', 'Expert', 'Industry', 'Business', 'Career', 'Strategy'],
  },
  whatsapp: {
    titleLimit: 60,
    descriptionLimit: 120,
    prioritizeClarity: true,
    preferredWords: ['Simple', 'Quick', 'Easy', 'Tips', 'How-to', 'Guide'],
  },
  twitter: {
    titleLimit: 70,
    descriptionLimit: 200,
    prioritizeHashtags: true,
    preferredWords: ['Breaking', 'New', 'Update', 'Thread', 'Insights', 'Trends'],
  },
  general: {
    titleLimit: 60,
    descriptionLimit: 155,
    prioritizeUniversal: true,
    preferredWords: ['Ultimate', 'Complete', 'Essential', 'Comprehensive', 'Best', 'Top'],
  },
} as const;

/**
 * Optimizes a title for a specific social media platform
 */
export function optimizeTitleForPlatform(
  title: string,
  platform: SocialPlatform
): TitleOptimizationResult {
  const config = PLATFORM_LIMITS[platform];
  const originalLength = title.length;
  const suggestions: string[] = [];

  let optimizedTitle = title.trim();
  let truncated = false;

  // If title is already within limits, return as-is
  if (originalLength <= config.titleLimit) {
    return {
      optimizedTitle,
      originalLength,
      optimizedLength: optimizedTitle.length,
      truncated: false,
      suggestions: generatePlatformSuggestions(platform, optimizedTitle),
    };
  }

  // Smart truncation strategies
  if (originalLength > config.titleLimit) {
    // Try to truncate at word boundaries
    const words = optimizedTitle.split(' ');
    const truncatedWords: string[] = [];
    let currentLength = 0;

    for (const word of words) {
      if (currentLength + word.length + 1 <= config.titleLimit - 3) {
        // Reserve 3 chars for "..."
        truncatedWords.push(word);
        currentLength += word.length + 1; // +1 for space
      } else {
        break;
      }
    }

    if (truncatedWords.length > 0) {
      optimizedTitle = `${truncatedWords.join(' ')}...`;
      truncated = true;
      suggestions.push('Consider shortening the title to avoid truncation');
    } else {
      // Fallback: hard truncate
      optimizedTitle = `${title.substring(0, config.titleLimit - 3)}...`;
      truncated = true;
      suggestions.push('Title was too long and had to be truncated at character level');
    }
  }

  // Add platform-specific suggestions
  suggestions.push(...generatePlatformSuggestions(platform, optimizedTitle));

  return {
    optimizedTitle,
    originalLength,
    optimizedLength: optimizedTitle.length,
    truncated,
    suggestions,
  };
}

/**
 * Generates platform-specific suggestions for title optimization
 */
function generatePlatformSuggestions(platform: SocialPlatform, title: string): string[] {
  const config = PLATFORM_LIMITS[platform];
  const suggestions: string[] = [];
  const lowerTitle = title.toLowerCase();

  switch (platform) {
    case 'facebook':
      if (!config.preferredWords.some((word) => lowerTitle.includes(word.toLowerCase()))) {
        suggestions.push('Consider using engaging words like "Learn", "Discover", or "Build"');
      }
      if (!lowerTitle.includes('?') && !lowerTitle.includes('!')) {
        suggestions.push('Add a question or exclamation to increase engagement');
      }
      break;

    case 'linkedin':
      if (!config.preferredWords.some((word) => lowerTitle.includes(word.toLowerCase()))) {
        suggestions.push('Use professional terms like "Expert", "Industry", or "Strategy"');
      }
      if (!lowerTitle.includes('professional') && !lowerTitle.includes('business')) {
        suggestions.push('Emphasize professional value and business impact');
      }
      break;

    case 'whatsapp':
      if (title.length > 40) {
        suggestions.push('Keep titles under 40 characters for better mobile readability');
      }
      if (!config.preferredWords.some((word) => lowerTitle.includes(word.toLowerCase()))) {
        suggestions.push('Use clear, simple words like "Quick", "Easy", or "Simple"');
      }
      break;

    case 'twitter':
      if (!lowerTitle.includes('#')) {
        suggestions.push('Consider adding relevant hashtags for better discoverability');
      }
      if (!config.preferredWords.some((word) => lowerTitle.includes(word.toLowerCase()))) {
        suggestions.push('Use trending words like "Breaking", "Update", or "Thread"');
      }
      break;

    case 'general':
      if (!config.preferredWords.some((word) => lowerTitle.includes(word.toLowerCase()))) {
        suggestions.push('Use universal appeal words like "Ultimate", "Complete", or "Best"');
      }
      suggestions.push('Ensure title works well across all platforms');
      break;
  }

  return suggestions;
}

/**
 * Optimizes description text for a specific platform
 */
export function optimizeDescriptionForPlatform(
  description: string,
  platform: SocialPlatform
): TitleOptimizationResult {
  const config = PLATFORM_LIMITS[platform];
  const originalLength = description.length;

  let optimizedDescription = description.trim();
  let truncated = false;

  if (originalLength > config.descriptionLimit) {
    const sentences = optimizedDescription.split('. ');
    const truncatedSentences: string[] = [];
    let currentLength = 0;

    for (const sentence of sentences) {
      if (currentLength + sentence.length + 2 <= config.descriptionLimit - 3) {
        // +2 for ". ", -3 for "..."
        truncatedSentences.push(sentence);
        currentLength += sentence.length + 2;
      } else {
        break;
      }
    }

    if (truncatedSentences.length > 0) {
      optimizedDescription = `${truncatedSentences.join('. ')}...`;
      truncated = true;
    } else {
      // Fallback: hard truncate
      optimizedDescription = `${description.substring(0, config.descriptionLimit - 3)}...`;
      truncated = true;
    }
  }

  return {
    optimizedTitle: optimizedDescription,
    originalLength,
    optimizedLength: optimizedDescription.length,
    truncated,
    suggestions: generateDescriptionSuggestions(platform, optimizedDescription),
  };
}

/**
 * Generates platform-specific suggestions for description optimization
 */
function generateDescriptionSuggestions(platform: SocialPlatform, description: string): string[] {
  const suggestions: string[] = [];
  const lowerDescription = description.toLowerCase();

  switch (platform) {
    case 'facebook':
      suggestions.push('Include a call-to-action to increase engagement');
      if (!lowerDescription.includes('learn') && !lowerDescription.includes('discover')) {
        suggestions.push('Use action words to encourage interaction');
      }
      break;

    case 'linkedin':
      suggestions.push('Highlight professional benefits and outcomes');
      if (!lowerDescription.includes('professional') && !lowerDescription.includes('career')) {
        suggestions.push('Emphasize career and professional development aspects');
      }
      break;

    case 'whatsapp':
      suggestions.push('Keep descriptions concise and easy to scan');
      if (description.length > 80) {
        suggestions.push('Consider shortening for better mobile readability');
      }
      break;

    case 'twitter':
      suggestions.push('Include relevant hashtags and mentions');
      if (!lowerDescription.includes('#')) {
        suggestions.push('Add hashtags for better discoverability');
      }
      break;

    case 'general':
      suggestions.push('Ensure description appeals to a broad audience');
      suggestions.push('Include key benefits and value propositions');
      break;
  }

  return suggestions;
}

/**
 * Gets optimal dimensions for a specific platform
 */
export function getOptimalDimensions(platform: SocialPlatform): {
  width: number;
  height: number;
} {
  const dimensions = {
    facebook: { width: 1200, height: 630 },
    linkedin: { width: 1200, height: 627 },
    whatsapp: { width: 1200, height: 630 },
    twitter: { width: 1200, height: 675 },
    general: { width: 1200, height: 630 },
  };

  return dimensions[platform];
}

/**
 * Suggests the best template for a platform
 */
export function suggestTemplateForPlatform(platform: SocialPlatform): string {
  const templateSuggestions = {
    facebook: 'facebook',
    linkedin: 'linkedin',
    whatsapp: 'whatsapp',
    twitter: 'modern',
    general: 'default',
  };

  return templateSuggestions[platform];
}
