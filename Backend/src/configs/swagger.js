const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API',
      version: '1.0.0',
      description: 'REST API for TaskFlow — Trello-style task management app',
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Local Development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string' },
            avatar_url: { type: 'string', nullable: true },
            is_verified: { type: 'boolean' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            logo_url: { type: 'string', nullable: true },
            created_by: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Board: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            organization_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            cover_color: { type: 'string' },
            cover_image_url: { type: 'string', nullable: true },
            visibility: { type: 'string', enum: ['private', 'workspace', 'public'] },
            is_archived: { type: 'boolean' },
            created_by: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            role: { type: 'string' },
            email: { type: 'string' },
            full_name: { type: 'string' },
            joined_at: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & user management' },
      { name: 'Organizations', description: 'Workspace management' },
      { name: 'Boards', description: 'Board management' },
    ],
    paths: {
      // ─── AUTH ───────────────────────────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'fullName'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', minLength: 6, example: '123456' },
                    fullName: { type: 'string', example: 'Nguyen Van A' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: { user: { $ref: '#/components/schemas/User' } },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and get JWT tokens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', example: '123456' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          accessToken: { type: 'string' },
                          refreshToken: { type: 'string' },
                          user: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Get a new access token using refresh token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'New access token issued' },
            401: { description: 'Invalid or expired refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout and revoke refresh token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Logged out successfully' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current logged-in user profile',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Current user info',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },

      '/auth/verify-email': {
        post: {
          tags: ['Auth'],
          summary: 'Verify email using OTP code',
          description: 'Submit the 6-digit OTP sent to the user\'s email after registration.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'otp'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    otp: { type: 'string', minLength: 6, maxLength: 6, example: '482910' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Email verified successfully' },
            400: { description: 'Invalid or expired OTP', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/auth/resend-verification': {
        post: {
          tags: ['Auth'],
          summary: 'Resend OTP verification email',
          description: 'Sends a new 6-digit OTP to the user\'s email. Valid for 15 minutes.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Verification email resent' },
            400: { description: 'Email already verified', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request a password reset email',
          description: 'Sends a password reset OTP to the user\'s email. Valid for 1 hour.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Reset email sent (silent — does not reveal if email exists)' },
          },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password using OTP token',
          description: 'Submit the reset token from the email along with the new password.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'password'],
                  properties: {
                    token: { type: 'string', example: 'abc123...', description: 'Reset token received by email' },
                    password: { type: 'string', minLength: 6, example: 'newpassword123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Password reset successfully' },
            400: { description: 'Invalid or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },

      // ─── ORGANIZATIONS ───────────────────────────────────────────────────────
      '/organizations': {
        get: {
          tags: ['Organizations'],
          summary: 'Get all organizations of the current user',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'List of organizations' },
            401: { description: 'Unauthorized' },
          },
        },
        post: {
          tags: ['Organizations'],
          summary: 'Create a new organization',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'My Team' },
                    description: { type: 'string', example: 'Development team workspace' },
                    logoUrl: { type: 'string', format: 'uri' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Organization created' },
            401: { description: 'Unauthorized' },
            422: { description: 'Validation error' },
          },
        },
      },
      '/organizations/{orgId}': {
        get: {
          tags: ['Organizations'],
          summary: 'Get organization by ID',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Organization detail' },
            403: { description: 'Forbidden' },
            404: { description: 'Not found' },
          },
        },
        put: {
          tags: ['Organizations'],
          summary: 'Update organization (owner/admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    logoUrl: { type: 'string', format: 'uri' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Updated successfully' },
            403: { description: 'Forbidden' },
          },
        },
        delete: {
          tags: ['Organizations'],
          summary: 'Delete organization (owner only)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Deleted successfully' },
            403: { description: 'Forbidden — owner only' },
          },
        },
      },
      '/organizations/{orgId}/members': {
        get: {
          tags: ['Organizations'],
          summary: 'Get all members of an organization',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'List of members' } },
        },
        post: {
          tags: ['Organizations'],
          summary: 'Invite a member to organization (owner/admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['admin', 'member'], default: 'member' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Member invited' }, 403: { description: 'Forbidden' } },
        },
      },
      '/organizations/{orgId}/members/{userId}': {
        put: {
          tags: ['Organizations'],
          summary: 'Update member role (owner/admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: { role: { type: 'string', enum: ['admin', 'member'] } },
                },
              },
            },
          },
          responses: { 200: { description: 'Role updated' }, 403: { description: 'Forbidden' } },
        },
        delete: {
          tags: ['Organizations'],
          summary: 'Remove member from organization (owner/admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Member removed' }, 403: { description: 'Forbidden' } },
        },
      },

      // ─── BOARDS ─────────────────────────────────────────────────────────────
      '/organizations/{orgId}/boards': {
        get: {
          tags: ['Boards'],
          summary: 'Get all boards in an organization',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'List of boards' } },
        },
        post: {
          tags: ['Boards'],
          summary: 'Create a board in an organization',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Sprint 1' },
                    description: { type: 'string' },
                    coverColor: { type: 'string', example: '#0052CC' },
                    coverImageUrl: { type: 'string', format: 'uri' },
                    visibility: { type: 'string', enum: ['private', 'workspace', 'public'], default: 'private' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Board created' }, 403: { description: 'Forbidden' } },
        },
      },
      '/boards/{boardId}': {
        get: {
          tags: ['Boards'],
          summary: 'Get board detail',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Board detail' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
        },
        put: {
          tags: ['Boards'],
          summary: 'Update board (owner/admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    coverColor: { type: 'string' },
                    coverImageUrl: { type: 'string', format: 'uri' },
                    visibility: { type: 'string', enum: ['private', 'workspace', 'public'] },
                    isArchived: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated' }, 403: { description: 'Forbidden' } },
        },
        delete: {
          tags: ['Boards'],
          summary: 'Delete board (owner only)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Deleted' }, 403: { description: 'Forbidden — owner only' } },
        },
      },
      '/boards/{boardId}/members': {
        get: {
          tags: ['Boards'],
          summary: 'Get all members of a board',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'List of members' } },
        },
        post: {
          tags: ['Boards'],
          summary: 'Invite a member to board (owner/admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['admin', 'member', 'viewer'], default: 'member' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Member invited' }, 403: { description: 'Forbidden' } },
        },
      },
      '/boards/{boardId}/members/{userId}': {
        put: {
          tags: ['Boards'],
          summary: 'Update board member role (owner/admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'boardId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: { role: { type: 'string', enum: ['admin', 'member', 'viewer'] } },
                },
              },
            },
          },
          responses: { 200: { description: 'Role updated' }, 403: { description: 'Forbidden' } },
        },
        delete: {
          tags: ['Boards'],
          summary: 'Remove member from board (owner/admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'boardId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Member removed' }, 403: { description: 'Forbidden' } },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
