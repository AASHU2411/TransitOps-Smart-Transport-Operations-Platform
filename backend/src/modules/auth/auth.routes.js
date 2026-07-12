const router      = require('express').Router();
const rateLimit   = require('express-rate-limit');
const validate    = require('../../middleware/validate');
const ctrl        = require('./auth.controller');
const { signupSchema, loginSchema } = require('./auth.schema');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later' },
});

router.post('/signup',  validate(signupSchema), ctrl.signup);
router.post('/login',   loginLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout',  ctrl.logout);

module.exports = router;
