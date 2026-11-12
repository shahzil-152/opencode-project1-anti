const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const app = express();

// Security headers (tuned so the API can be called from the browser client).
app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow avatar images cross-origin
    contentSecurityPolicy: false, // API only - no HTML served
  })
);

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

if (!config.isProd) {
  app.use(morgan('dev'));
}

// Uploaded avatar files (stored on local disk by multer).
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: config.env, time: new Date().toISOString() });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
