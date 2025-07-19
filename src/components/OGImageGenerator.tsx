// OG Image Generator Component with tRPC
import { useEffect, useState } from 'react';
import { trpc } from '../lib/trpc';

// Types for templates and themes
interface Template {
  id: string;
  name: string;
  description: string;
}

interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
}

interface OGImageGeneratorProps {
  initialTitle?: string;
  initialDescription?: string;
  className?: string;
}

export default function OGImageGenerator({
  initialTitle = '',
  initialDescription = '',
  className = '',
}: OGImageGeneratorProps) {
  const [formData, setFormData] = useState({
    title: initialTitle,
    description: initialDescription,
    template: 'default' as const,
    theme: 'dark' as const,
    tags: [] as string[],
    author: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);

  // Load available templates and themes
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const result = await trpc.ogImage.getTemplates.query();
        if (result.success) {
          setTemplates(result.data.templates);
          setThemes(result.data.themes);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    loadTemplates();
  }, []);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const generateImage = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const result = await trpc.ogImage.generate.mutate({
        ...formData,
        width: 1200,
        height: 630,
        format: 'png',
      });

      if (result.success) {
        setGeneratedImage(result.data.image);
      } else {
        alert('Failed to generate image');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `og-image-${formData.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`og-image-generator ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Generate OG Image</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter image title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
              <select
                value={formData.template}
                onChange={(e) => handleInputChange('template', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={formData.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="react, typescript, tutorial"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              placeholder="Author name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={50}
            />
          </div>

          <button
            type="button"
            onClick={generateImage}
            disabled={isGenerating || !formData.title.trim()}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isGenerating ? 'Generating...' : 'Generate OG Image'}
          </button>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>

          {generatedImage ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                <img src={generatedImage} alt="Generated OG Image" className="w-full h-auto" />
              </div>

              <button
                type="button"
                onClick={downloadImage}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Download Image
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">🖼️</div>
              <p>Generated image will appear here</p>
              <p className="text-sm">Fill in the form and click generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
