/// <reference path="../.astro/types.d.ts" />

declare namespace NodeJS {
  interface ProcessEnv {
    POSTGRES_URL: string;
    POSTGRES_PRISMA_URL: string;
    POSTGRES_URL_NO_SSL: string;
    POSTGRES_URL_NON_POOLING: string;
    POSTGRES_USER: string;
    POSTGRES_HOST: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DATABASE: string;

    // Substack integration
    SUBSTACK_PUBLICATION_URL?: string;
    SUBSTACK_API_TOKEN?: string;
    SUBSTACK_REFERRER_URL?: string;

    // Optional newsletter service integrations
    MAILCHIMP_API_KEY?: string;
    MAILCHIMP_AUDIENCE_ID?: string;
    MAILCHIMP_SERVER_PREFIX?: string;

    CONVERTKIT_API_KEY?: string;
    CONVERTKIT_FORM_ID?: string;

    RESEND_API_KEY?: string;
    RESEND_AUDIENCE_ID?: string;

    GITHUB_API_TOKEN?: string;
    GITHUB_TOKEN?: string;
  }
}

interface ImportMetaEnv {
  readonly GITHUB_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
