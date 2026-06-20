import express from 'express';
import multer from 'multer';
import { parseReceipt } from '../controllers/ocrController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Setup Multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

router.post('/upload', authMiddleware, upload.single('receipt'), parseReceipt);

export default router;
