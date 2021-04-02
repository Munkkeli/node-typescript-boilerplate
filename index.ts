import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import express from 'express';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import { config } from 'dotenv';

config();

/**
 * Local imports should come after dotenv config() has been called
 * We can use nice ./src relative paths for local imports thanks to the { "baseUrl": "./src" } in .tsconfig.json
 */
import { Request, authenticate, protect } from 'middleware';
import { genericRouter } from 'generic/genericRouter';

const app = express();

/**
 * For development purposes
 * Create your own cors logic or remove this line when going to production
 */
app.use(cors());

app.use(helmet());
app.use(bodyParser.json());

/**
 * Request logger, can be configured to your needs
 */
app.use(morgan('tiny'));

/**
 * Boilerplate dummy authentication logic
 * Can be properly implemented in /src/middleware.ts
 */
app.use(authenticate);

/**
 * Custom routers
 */
app.use(genericRouter);

/**
 * Simple ping route, can be used to check server status
 */
app.get(
  '/ping',
  Request(async (trx, req, res) => {
    return { pong: true, time: new Date().toISOString() };
  })
);

let server;

/**
 * SSL support
 * In production you should run this server behind Apache or NGINX and let them handle SSL
 */
if (process.env.SSL == 'false') {
  server = http.createServer(app);
} else {
  server = https.createServer(
    {
      key: fs.readFileSync(process.env.SSL_PRIVATE_KEY, 'utf8'),
      cert: fs.readFileSync(process.env.SSL_CERTIFICATE, 'utf8'),
      ca: fs.readFileSync(process.env.SSL_CA_BUNDLE, 'utf8'),
    },
    app
  );
}

server.listen(process.env.PORT, () => {
  console.log(
    `Listening on port ${process.env.PORT} for ${
      process.env.SSL == 'false' ? 'HTTP' : 'HTTPS'
    } traffic...`
  );
});
