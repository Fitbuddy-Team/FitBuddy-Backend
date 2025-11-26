import { createServer } from 'http';
import { createApp } from './app/app.js';
import config from './config/env.js';

const app = createApp();
const server = createServer(app);

server.listen(config.port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://0.0.0.0:${config.port}`);
});

