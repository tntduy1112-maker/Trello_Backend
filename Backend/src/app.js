const env = require('./configs/env');
const express = require('express');
const cors = require('cors');
const authRouter = require('./modules/auth/auth.route');
const orgRouter = require('./modules/organizations/organizations.route');
const { orgBoardsRouter, boardRouter } = require('./modules/boards/boards.route');
const { boardListsRouter, listRouter } = require('./modules/lists/lists.route');
const { listCardsRouter, cardRouter } = require('./modules/cards/cards.route');
const { boardLabelsRouter, labelRouter, cardLabelsRouter } = require('./modules/labels/labels.route');
const { boardActivityRouter, cardActivityRouter } = require('./modules/activityLogs/activityLogs.route');
const { cardCommentsRouter, commentRouter } = require('./modules/comments/comments.route');
const { error } = require('./utils/response');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    ...(env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',').map(o => o.trim()) : []),
  ],
  credentials: true,
}));

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
app.use('/api/v1/boards/:boardId/lists', boardListsRouter);
app.use('/api/v1/lists/:listId/cards', listCardsRouter);
app.use('/api/v1/lists/:listId', listRouter);
app.use('/api/v1/cards/:cardId', cardRouter);
app.use('/api/v1/boards/:boardId/labels', boardLabelsRouter);
app.use('/api/v1/cards/:cardId/labels', cardLabelsRouter);
app.use('/api/v1/labels/:labelId', labelRouter);
app.use('/api/v1/boards/:boardId/activity', boardActivityRouter);
app.use('/api/v1/cards/:cardId/activity', cardActivityRouter);
app.use('/api/v1/cards/:cardId/comments', cardCommentsRouter);
app.use('/api/v1/comments/:commentId', commentRouter);

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
