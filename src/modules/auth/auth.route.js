const router = require('express').Router();
const Joi = require('joi');
const controller = require('./auth.controller');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(1).max(255).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', controller.refreshToken);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.getMe);

router.post('/verify-email', controller.verifyEmail);
router.post('/resend-verification', controller.resendVerification);

router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

module.exports = router;
