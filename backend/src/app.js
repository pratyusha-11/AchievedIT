const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { clerkMiddleware } = require('@clerk/express');

const authRoutes = require('./routes/auth.routes');
const certificateRoutes = require('./routes/certificate.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.set('trust proxy', 1); // Render sits behind a proxy — needed for correct rate-limit IPs

app.use(helmet());
app.use(compression()); // shrinks API responses — helps stay under Render/Vercel bandwidth caps

const clientUrl = process.env.CLIENT_URL;
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (clientUrl && (origin === clientUrl || origin === clientUrl.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }
      return callback(null, clientUrl || true);
    },
    credentials: true // required so the browser sends/receives the httpOnly auth cookie
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(cookieParser());
app.use(clerkMiddleware());

// A gentle, app-wide ceiling on top of the tighter per-route limiters below.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// Friendly root endpoint so visiting the base Render URL directly in a browser doesn't 404
app.get('/', (req, res) =>
  res.status(200).json({
    status: 'online',
    message: 'AchievedIT API is running',
    health: '/api/health'
  })
);

// Render's health check hits this to know the service is alive.
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
