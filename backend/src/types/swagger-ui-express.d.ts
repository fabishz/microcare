declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';

  interface SwaggerUiOptions {
    swaggerOptions?: Record<string, unknown>;
    customCss?: string;
    customSiteTitle?: string;
    customfavIcon?: string;
    swaggerUrl?: string;
    url?: string;
    urls?: Array<{ url: string; name: string }>;
    presets?: unknown[];
    plugins?: unknown[];
    layout?: string;
  }

  export function serve(...args: unknown[]): RequestHandler;
  export function setup(
    swaggerDoc: Record<string, unknown>,
    options?: SwaggerUiOptions
  ): RequestHandler;
}
