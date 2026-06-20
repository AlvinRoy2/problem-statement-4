import request from 'supertest';
import express from 'express';
import carbonRoutes from '../../src/routes/carbonRoutes';
import { db } from '../../src/db/database';

jest.mock('../../src/db/database', () => ({
    db: {
        run: jest.fn(),
        all: jest.fn(),
    }
}));

jest.mock('../../src/middleware/authMiddleware', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.user = { userId: 1 };
        next();
    }
}));

const app = express();
app.use(express.json());
app.use('/api/carbon', carbonRoutes);

describe('Carbon Routes Integration', () => {
    test('POST /api/carbon/log should successfully log activity', async () => {
        (db.run as jest.Mock).mockImplementation((query, params, cb) => {
            cb.call({ lastID: 5 }, null);
        });

        const res = await request(app)
            .post('/api/carbon/log')
            .send({
                category: 'Transport',
                activity_type: 'Driving',
                amount: 10,
                co2_emission_kg: 2.5
            });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ id: 5 });
    });

    test('POST /api/carbon/log should handle failure', async () => {
        (db.run as jest.Mock).mockImplementation((query, params, cb) => {
            cb.call(null, new Error('DB error'));
        });

        const res = await request(app)
            .post('/api/carbon/log')
            .send({});

        expect(res.status).toBe(500);
    });
});
