import express from 'express';
import { logActivity, getTrends, LogActivitySchema } from '../controllers/carbonController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateRequest';

const router = express.Router();

router.post('/log', authMiddleware, validate(LogActivitySchema), logActivity);
router.get('/trends', authMiddleware, getTrends);

export default router;
