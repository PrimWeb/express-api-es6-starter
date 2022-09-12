import './env';

import fs from 'fs';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import express from 'express';
import favicon from 'serve-favicon';
import bodyParser from 'body-parser';
import compression from 'compression';

import routes from './routes';
import json from './middlewares/json';
import logger, { logStream } from './utils/logger';
import getProducts from './utils/tsv2json';
import * as errorHandler from './middlewares/errorHandler';

const app = express();
let pathData;
const pathTranslate = () => {
  setTimeout(async () => {
    pathData = await getProducts();
  }, 0);
  setInterval(async () => {
    pathData = await getProducts();
  }, 60000);
}
pathTranslate();

const APP_PORT =
  (process.env.NODE_ENV === 'test' ? process.env.TEST_APP_PORT : process.env.APP_PORT) || process.env.PORT || '3000';
const APP_HOST = process.env.APP_HOST || '0.0.0.0';

const pathToSwaggerUi = require('swagger-ui-dist').absolutePath();

app.set('port', APP_PORT);
app.set('host', APP_HOST);

app.locals.title = process.env.APP_NAME;
app.locals.version = process.env.APP_VERSION;

app.use(favicon(path.join(__dirname, '/../public', 'favicon.ico')));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('tiny', { stream: logStream }));
app.use(bodyParser.json());
app.use(errorHandler.bodyParser);
app.use(json);

// Get pathData
app.get('/tsv2json', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(pathData));
})


// Get pathData
app.use('/products', (req, res) => {
  const lang = req.acceptsLanguages(['cs', 'sk', 'en', 'pl', 'hu']);
  logger.info(lang);
  switch (lang) {
    case 'cs':
    case 'en':
    case 'sk':
      res.redirect(pathData.find(v => {
        return req.path.length > 1 && String(v.Obsah).match(`${req.path}`) !== null;
      }).cs);
      break
    case 'pl':
      res.json([pathData.find(v => {
        return req.path.length > 1 && String(v.Obsah).match(`${req.path}`) !== null;
      }).pl]);
      break
    case 'hu':
      res.redirect(pathData.find(v => {
        return req.path.length > 1 && String(v.Obsah).match(`${req.path}`) !== null;
      }).hu);
      break
    case false:
      // the fallback is text/plain, so no need to specify it above
      res.json(['hello, world!'])
      break;
  }
  !lang ? res.json([lang]) : null;
})

// API Routes
app.use('/api', routes);

// Swagger UI
// Workaround for changing the default URL in swagger.json
// https://github.com/swagger-api/swagger-ui/issues/4624
const swaggerIndexContent = fs
  .readFileSync(`${pathToSwaggerUi}/swagger-initializer.js`)
  .toString()
  .replace('https://petstore.swagger.io/v2/swagger.json', '/api/swagger.json');

app.get('/api-docs/swagger-initializer.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send(swaggerIndexContent)
});
app.get('/api-docs', (req, res) => res.redirect('/api-docs/index.html'));
app.use('/api-docs', express.static(pathToSwaggerUi));

// Error Middleware
app.use(errorHandler.genericErrorHandler);
app.use(errorHandler.methodNotAllowed);

app.listen(app.get('port'), app.get('host'), () => {
  logger.info(`Server started at http://${app.get('host')}:${app.get('port')}/products`);
});

// Catch unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
});

export default app;
