import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.use(routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
  });

  return app;
}

export default createApp;

