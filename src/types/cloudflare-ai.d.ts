/** Minimal ambient types for the Workers bindings used by the chat endpoint. */
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}

interface Ai {
  run(model: string, inputs: unknown, options?: unknown): Promise<unknown>;
}
