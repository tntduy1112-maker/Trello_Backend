const env = require('./configs/env');
const express = require('express');
const authRouter = require('./modules/auth/auth.route');
const orgRouter = require('./modules/organizations/organizations.route');
const { orgBoardsRouter, boardRouter } = require('./modules/boards/boards.route');
const { error } = require('./utils/response');

const app = express();

app.use(express.json());

// Swagger — only enabled in development
if (env.SWAGGER_ENABLED) {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./configs/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'TaskFlow API Docs',
  }));
  console.log('[Swagger] Docs available at /api-docs');
}

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/organizations', orgRouter);
app.use('/api/v1/organizations/:orgId/boards', orgBoardsRouter);
app.use('/api/v1/boards/:boardId', boardRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

app.use((req, res) => {
  return error(res, 'Route not found', 404);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  if (statusCode === 500) console.error(err);
  return error(res, message, statusCode);
});

app.listen(env.PORT, () => {
  console.log(`TaskFlow API running on port ${env.PORT} [${env.NODE_ENV}]`);
});

module.exports = app;
