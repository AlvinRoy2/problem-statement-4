import express from 'express';
import { login, register, RegisterSchema, LoginSchema } from '../controllers/authController';
import { validate } from '../middleware/validateRequest';
import rateLimit from 'express-rate-limit';

const router = express.Router();

/** Strict rate limiter for auth endpoints to prevent brute-force attacks */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', authLimiter, validate(RegisterSchema), register);
router.post('/login', authLimiter, validate(LoginSchema), login);

export default router;
