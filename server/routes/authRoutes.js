const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const authValidator = require('../validators/authValidator');
const authController = require('../controllers/authController');

const router = express.Router();

// Basic brute-force protection on credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in a few minutes' },
});

router.post('/register', authLimiter, validate(authValidator.register), authController.register);
router.post('/login', authLimiter, validate(authValidator.login), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
