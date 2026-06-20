import express from 'express';
import { logActivity, getTrends } from '../controllers/carbonController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/log', authMiddleware, logActivity);
router.get('/trends', authMiddleware, getTrends);

export default router;
