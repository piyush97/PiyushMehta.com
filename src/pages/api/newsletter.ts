import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if request has content
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Content-Type must be application/json',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the body text first to check if it's empty
    const bodyText = await request.text();
    if (!bodyText.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Request body is empty',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON
    let data: { email: string; };
    try {
      data = JSON.parse(bodyText);
    } catch (_parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid JSON in request body',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email } = data;

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email is required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Please enter a valid email address',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log the subscription attempt
    console.log('Newsletter subscription received:', email);

    // Try Substack integration first
    try {
      const result = await subscribeToSubstack(email);
      console.log('Successfully subscribed to Substack:', email, result);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Successfully subscribed to newsletter via Substack!',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (substackError) {
      console.error('Substack subscription failed:', substackError.message);

      // Try database fallback only if we have database credentials
      if (process.env.POSTGRES_URL) {
        try {
          await storeInDatabase(email);
          console.log('Fallback: Subscriber stored in database:', email);

          return new Response(
            JSON.stringify({
              success: true,
              message:
                "Successfully subscribed to newsletter! We'll add you to our system.",
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (dbError) {
          console.error('Database fallback also failed:', dbError.message);
          // Final fallback: log to file or console for manual processing
          await logEmailForManualProcessing(email);
        }
      } else {
        console.log('No database fallback configured');
        // Log email for manual processing
        await logEmailForManualProcessing(email);
      }

      // If both Substack and database fail, still return success to user
      // but log for manual follow-up
      console.error('Both Substack and database failed for email:', email);

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "Thank you for subscribing! We'll add you to our newsletter soon.",
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to subscribe. Please try again later.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Database storage function
async function storeInDatabase(email: string) {
  // Using your existing Postgres connection
  const { Pool } = await import('pg');

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    // Add connection timeout and retry settings
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 1, // Limit connections for serverless
  });

  try {
    // Test connection first
    const client = await pool.connect();

    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        source VARCHAR(100) DEFAULT 'website'
      )
    `);

    // Insert subscriber
    await client.query(
      'INSERT INTO newsletter_subscribers (email, source) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET subscribed_at = CURRENT_TIMESTAMP, is_active = true',
      [email, 'website-fallback']
    );

    client.release();
    console.log('Subscriber stored in database:', email);
  } catch (dbError) {
    console.error('Database error:', dbError.message);
    throw new Error(`Database storage failed: ${dbError.message}`);
  } finally {
    await pool.end();
  }
}

// Final fallback: log email for manual processing
async function logEmailForManualProcessing(email: string) {
  const timestamp = new Date().toISOString();
  const _logEntry = `${timestamp} - MANUAL_PROCESSING_NEEDED: ${email}`;

  // In production, you might want to:
  // 1. Send to a monitoring service like Sentry
  // 2. Save to a file system (if available)
  // 3. Send to an admin email
  // 4. Use a third-party logging service

  console.error('🚨 MANUAL PROCESSING NEEDED:', {
    email,
    timestamp,
    message: 'Both Substack and database failed - manual follow-up required',
  });

  // For now, we'll just ensure it's prominently logged
  // In production, consider adding Sentry or other monitoring
}

// Substack integration function
async function subscribeToSubstack(email: string) {
  const SUBSTACK_PUBLICATION_URL = process.env.SUBSTACK_PUBLICATION_URL;

  if (!SUBSTACK_PUBLICATION_URL) {
    throw new Error(
      'SUBSTACK_PUBLICATION_URL environment variable is required'
    );
  }

  // Remove trailing slash if present
  const baseUrl = SUBSTACK_PUBLICATION_URL.replace(/\/$/, '');

  // Try multiple Substack integration methods
  const methods = [
    () => subscribeViaPublicAPI(email, baseUrl),
    () => subscribeViaEmbed(email, baseUrl),
    () => subscribeViaDirectForm(email, baseUrl),
  ];

  let lastError: unknown;

  for (const method of methods) {
    try {
      const result = await method();
      console.log('Substack subscription successful via method:', method.name);
      return result;
    } catch (error) {
      console.warn('Substack method failed:', method.name, error.message);
      lastError = error;
    }
  }

  throw lastError || new Error('All Substack subscription methods failed');
}

// Method 1: Public API approach
async function subscribeViaPublicAPI(email: string, baseUrl: string) {
  const subscriptionUrl = `${baseUrl}/api/v1/free`;

  const formData = new FormData();
  formData.append('email', email);
  formData.append(
    'first_url',
    process.env.SUBSTACK_REFERRER_URL || 'https://piyushmehta.com'
  );

  const response = await fetch(subscriptionUrl, {
    method: 'POST',
    body: formData,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Newsletter-Bot/1.0)',
      Referer: process.env.SUBSTACK_REFERRER_URL || 'https://piyushmehta.com',
    },
  });

  if (!response.ok) {
    throw new Error(`API method failed: ${response.status}`);
  }

  const responseText = await response.text();

  // Check for common error patterns
  if (
    responseText.includes('error') ||
    responseText.includes('Error') ||
    responseText.includes('failed')
  ) {
    throw new Error(
      `API response indicates failure: ${responseText.slice(0, 200)}`
    );
  }

  return {
    success: true,
    method: 'public-api',
    response: responseText.slice(0, 100),
  };
}

// Method 2: Embed form approach
async function subscribeViaEmbed(email: string, baseUrl: string) {
  const subscriptionUrl = `${baseUrl}/subscribe`;

  const params = new URLSearchParams({
    email: email,
    utm_source: 'piyushmehta.com',
    utm_medium: 'web',
    utm_campaign: 'newsletter_signup',
  });

  const response = await fetch(subscriptionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (compatible; Newsletter-Bot/1.0)',
      Referer: 'https://piyushmehta.com',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Embed method failed: ${response.status}`);
  }

  return { success: true, method: 'embed-form' };
}

// Method 3: Direct form submission (mimics browser behavior)
async function subscribeViaDirectForm(email: string, baseUrl: string) {
  const subscriptionUrl = `${baseUrl}/api/v1/free`;

  const response = await fetch(subscriptionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Referer: baseUrl,
      Origin: baseUrl,
    },
    body: JSON.stringify({
      email: email,
      first_url: process.env.SUBSTACK_REFERRER_URL || 'https://piyushmehta.com',
    }),
  });

  if (!response.ok) {
    throw new Error(`Direct form method failed: ${response.status}`);
  }

  return { success: true, method: 'direct-form' };
}

// Example integration functions (uncomment and configure as needed)

/*
// MAILCHIMP INTEGRATION
async function sendToMailchimp(email: string) {
  const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
  const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
  const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;

  const response = await fetch(
    `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to subscribe to Mailchimp');
  }
}
*/

/*
// CONVERTKIT INTEGRATION
async function sendToConvertKit(email: string) {
  const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
  const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;

  const response = await fetch(
    `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: CONVERTKIT_API_KEY,
        email: email,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to subscribe to ConvertKit');
  }
}
*/

/*
// RESEND INTEGRATION
async function sendToResend(email: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const response = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      audience_id: process.env.RESEND_AUDIENCE_ID,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to subscribe to Resend');
  }
}
*/
