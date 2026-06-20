import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/authRoutes';
import carbonRoutes from './routes/carbonRoutes';
import ocrRoutes from './routes/ocrRoutes';
import { getInsights } from './services/aiService';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({
    contentSecurityPolicy: false, // Disabling CSP locally for Google Maps/Translate to work easily
}));
app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Centralized error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.use('/api/auth', authRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/ocr', ocrRoutes);
app.get('/api/ai/insights', getInsights);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', type: 'Monolith (Refactored)' });
});

// Serve static files from the React frontend app
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`✅ Monolith Backend running on http://localhost:${PORT}`);
    });
}

export default app;
