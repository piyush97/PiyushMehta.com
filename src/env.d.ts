/// <reference path="../.astro/types.d.ts" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Legacy declarations retained for migration compatibility; the current
    // runtime has no database callsite.
    POSTGRES_URL: string;
    POSTGRES_PRISMA_URL: string;
    POSTGRES_URL_NO_SSL: string;
    POSTGRES_URL_NON_POOLING: string;
    POSTGRES_USER: string;
    POSTGRES_HOST: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DATABASE: string;

    RESEND_API_KEY?: string;

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

/// <reference types="astro/client" />
