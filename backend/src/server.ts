import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import carbonRoutes from './routes/carbonRoutes';
import ocrRoutes from './routes/ocrRoutes';
import { getInsights } from './services/aiService';

const app = express();
const PORT = process.env.PORT || 4000;

/** Security headers via Helmet — CSP configured to allow Google Fonts and Maps */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://maps.googleapis.com', 'https://translate.google.com', 'https://translate.googleapis.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://translate.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            frameSrc: ["'self'", 'https://www.google.com'],
            imgSrc: ["'self'", 'data:', 'https://maps.gstatic.com', 'https://maps.googleapis.com', 'https://www.google-analytics.com', 'https://translate.googleapis.com'],
            connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://translate.googleapis.com'],
        },
    },
}));

/** CORS — in production, restrict to the deployed origin */
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:4000'];

app.use(cors({
    origin: (origin, callback) => {
        // In a monolith deployment where the URL is dynamic (e.g. Cloud Run),
        // it's safest to reflect the origin back or allow all for the demo.
        callback(null, origin || '*');
    },
    credentials: true,
}));

/** Limit request body size to prevent payload-based attacks */
app.use(express.json({ limit: '10kb' }));

/** Global API rate limiter — 100 requests per 15 minutes per IP */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/ocr', ocrRoutes);
app.get('/api/ai/insights', getInsights);

/** Health check endpoint */
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', type: 'Monolith', timestamp: new Date().toISOString() });
});

// ─── Static Frontend ──────────────────────────────────────────────────────────
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (_req: Request, res: Response, next: NextFunction) => {
    const indexPath = path.join(frontendDistPath, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
            return next(err); // Pass to global error handler
        }
        
        // Safely inject runtime environment variables for the frontend
        const mapsKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';
        const analyticsId = process.env.VITE_GOOGLE_ANALYTICS_ID || '';
        
        const envScript = `<script>
            window.__ENV__ = {
                VITE_GOOGLE_MAPS_API_KEY: "${mapsKey}",
                VITE_GOOGLE_ANALYTICS_ID: "${analyticsId}"
            };
        </script>`;
        
        // Replace placeholders and inject script
        let html = data.replace(/%VITE_GOOGLE_ANALYTICS_ID%/g, analyticsId);
        html = html.replace('</head>', `${envScript}</head>`);
        
        res.send(html);
    });
});

// ─── Global Error Handler (MUST be after routes) ──────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`✅ Monolith Backend running on http://localhost:${PORT}`);
    });
}

export default app;
