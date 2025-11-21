declare module 'swagger-jsdoc' {
  interface SwaggerDefinition {
    openapi?: string;
    info?: {
      title?: string;
      version?: string;
      description?: string;
      contact?: {
        name?: string;
        email?: string;
      };
    };
    servers?: Array<{
      url?: string;
      description?: string;
    }>;
    components?: Record<string, unknown>;
    security?: Array<Record<string, unknown>>;
  }

  interface SwaggerOptions {
    definition: SwaggerDefinition;
    apis: string[];
  }

  function swaggerJsdoc(options: SwaggerOptions): Record<string, unknown>;

  export default swaggerJsdoc;
}
