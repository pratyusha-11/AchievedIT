// Fails fast on boot if required config is missing, instead of crashing
// unpredictably later on the first request that needs it.

const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill these in.');
    process.exit(1);
  }
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not set — "Extract with AI" will be disabled, manual entry still works.');
  }
  if (!process.env.EMAIL_USER) {
    console.warn('EMAIL_USER not set — verification & reset codes will be logged to server console.');
  }
}

module.exports = validateEnv;
