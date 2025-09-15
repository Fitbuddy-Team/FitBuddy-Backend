import { createServer } from 'http';
import { createApp } from './app/app.js';
import config from './config/env.js';

const app = createApp();
const server = createServer(app);

server.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${config.port}`);
});

