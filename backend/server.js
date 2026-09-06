require('dotenv').config();

const validateEnv = require('./src/config/env');
validateEnv();

const app = require('./src/app');
const connectDB = require('./src/db/db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`AchievedIT API running on port ${PORT}`);
  });

  // Let in-flight requests finish instead of dying mid-response on redeploy.
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => process.exit(0));
  });
});
