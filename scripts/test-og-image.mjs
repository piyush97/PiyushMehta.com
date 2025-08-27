import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import React from 'react';
import satori from 'satori';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing OG Image Generation...');

try {
  // Load fonts from local files
  const interRegular = fs.readFileSync(join(process.cwd(), 'InterVariable.ttf'));
  const interBold = interRegular; // Use same font for bold

  console.log('✅ Fonts loaded successfully');

  // Create a simple test template
  const testTemplate = React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: 'Inter',
        color: 'white',
        fontSize: '48px',
        fontWeight: 'bold',
      },
    },
    'OG Image Test - Working! 🎉'
  );

  console.log('✅ Template created');

  // Generate SVG with Satori
  const svg = await satori(testTemplate, {
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
  });

  console.log('✅ SVG generated successfully');

  // Convert SVG to PNG with Sharp
  const png = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  console.log('✅ PNG converted successfully');

  // Save test image
  fs.writeFileSync('test-og-image.png', png);
  
  console.log('🎉 Test completed successfully! Image saved as test-og-image.png');
  console.log('📊 Image size:', png.length, 'bytes');

} catch (error) {
  console.error('❌ Error generating OG image:', error);
  process.exit(1);
}