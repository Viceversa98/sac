import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = Number(process.env.PORT || 8080);

// WHY: Cloud Run sets PORT. @hono/node-server binds that port instead of a fixed listen() call.
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`sampay-api listening on ${info.port}`);
});
