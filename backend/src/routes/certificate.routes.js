const express = require('express');
const rateLimit = require('express-rate-limit');
const upload = require('../middleware/upload.middleware');
const { authUser } = require('../middleware/auth.middleware');
const certificateController = require('../controllers/certificate.controller');
const { extractCertificate } = require('../controllers/extract.controller');

const router = express.Router();

router.use(authUser);

// AI extraction calls out to Groq — worth its own tighter limit so one user
// can't burn the whole app's free-tier quota.
const extractLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many extraction requests — please slow down a little' }
});

router.get('/', certificateController.listCertificates);
router.get('/:id', certificateController.getCertificate);
router.post('/', upload.single('file'), certificateController.createCertificate);
router.put('/:id', upload.single('file'), certificateController.updateCertificate);
router.delete('/:id', certificateController.deleteCertificate);
router.post('/extract', extractLimiter, extractCertificate);

module.exports = router;
