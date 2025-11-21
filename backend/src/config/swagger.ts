import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MicroCare Backend API',
      version: '1.0.0',
      description: 'RESTful API for MicroCare mental health and wellness journaling application',
      contact: {
        name: 'MicroCare Support',
        email: 'support@microcare.app',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last profile update timestamp',
            },
          },
          required: ['id', 'email', 'name', 'createdAt', 'updatedAt'],
        },
        JournalEntry: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique entry identifier',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the entry owner',
            },
            title: {
              type: 'string',
              description: 'Entry title',
            },
            content: {
              type: 'string',
              description: 'Entry content/body',
            },
            mood: {
              type: 'string',
              nullable: true,
              description: 'Mood associated with the entry',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
              description: 'Tags associated with the entry',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Entry creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last entry update timestamp',
            },
          },
          required: ['id', 'userId', 'title', 'content', 'createdAt', 'updatedAt'],
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token for API requests',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token for obtaining new access tokens',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
          required: ['accessToken', 'refreshToken', 'user'],
        },
        PaginatedEntries: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/JournalEntry',
              },
              description: 'Array of journal entries',
            },
            total: {
              type: 'integer',
              description: 'Total number of entries',
            },
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Number of entries per page',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
          },
          required: ['data', 'total', 'page', 'limit', 'totalPages'],
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
            },
            data: {
              type: 'object',
              description: 'Response data (structure varies by endpoint)',
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message',
                },
                details: {
                  type: 'object',
                  description: 'Additional error details',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp',
            },
          },
          required: ['success', 'timestamp'],
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                details: {
                  type: 'object',
                  example: {
                    email: 'Invalid email format',
                    password: 'Password must be at least 8 characters',
                  },
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or invalid token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Unauthorized',
                      },
                    },
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Forbidden',
                      },
                    },
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Not found',
                      },
                    },
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
          },
        },
        TooManyRequestsError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Too many requests',
                      },
                    },
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
