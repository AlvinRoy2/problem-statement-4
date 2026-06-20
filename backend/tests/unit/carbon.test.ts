import { logActivity, getTrends, LogActivitySchema } from '../../src/controllers/carbonController';
import { db } from '../../src/db/database';

jest.mock('../../src/db/database', () => ({
    db: { run: jest.fn(), get: jest.fn(), all: jest.fn() },
}));

jest.mock('node-cache', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn().mockReturnValue(undefined),
        set: jest.fn(),
        del: jest.fn(),
    }));
});

describe('Carbon Controller', () => {
    let req: any, res: any;

    beforeEach(() => {
        req = {
            user: { userId: 42 },
            body: {
                category: 'transport',
                activity_type: 'Car trip',
                amount: 10,
                co2_emission_kg: 2.5,
            },
        };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    // ─── logActivity ──────────────────────────────────────────────────────────

    describe('logActivity', () => {
        it('should insert activity and return 201 on success', () => {
            (db.run as jest.Mock).mockImplementation((_q, _p, cb) => {
                cb.call({ lastID: 99 }, null);
            });

            logActivity(req, res);

            expect(db.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO activities'),
                [42, 'transport', 'Car trip', 10, 2.5],
                expect.any(Function)
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ id: 99, message: 'Activity logged successfully.' });
        });

        it('should return 500 when DB insertion fails', () => {
            (db.run as jest.Mock).mockImplementation((_q, _p, cb) => {
                cb.call(null, new Error('DB error'));
            });

            logActivity(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to log activity.' });
        });

        it('should return 401 when user is not authenticated', () => {
            req.user = undefined;
            logActivity(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    // ─── getTrends ────────────────────────────────────────────────────────────

    describe('getTrends', () => {
        it('should return data from DB when cache is empty', () => {
            const mockRows = [{ date: '2026-06-20', total_co2: 12.5 }];
            (db.all as jest.Mock).mockImplementation((_q, _p, cb) => {
                cb(null, mockRows);
            });

            getTrends(req, res);

            expect(db.all).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockRows);
        });

        it('should return 500 when DB query fails', () => {
            (db.all as jest.Mock).mockImplementation((_q, _p, cb) => {
                cb(new Error('DB error'), null);
            });

            getTrends(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should return 401 when user is not authenticated', () => {
            req.user = undefined;
            getTrends(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });
});

// ─── LogActivitySchema Zod Validation ─────────────────────────────────────────

describe('LogActivitySchema', () => {
    it('should pass with valid data', () => {
        const result = LogActivitySchema.safeParse({
            category: 'energy',
            activity_type: 'Home heating',
            amount: 50,
            co2_emission_kg: 8.0,
        });
        expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
        const result = LogActivitySchema.safeParse({
            category: 'flying', // not in enum
            activity_type: 'Flight',
            amount: 100,
            co2_emission_kg: 200,
        });
        expect(result.success).toBe(false);
    });

    it('should reject negative co2_emission_kg', () => {
        const result = LogActivitySchema.safeParse({
            category: 'transport',
            activity_type: 'Car',
            amount: 10,
            co2_emission_kg: -5,
        });
        expect(result.success).toBe(false);
    });

    it('should reject zero amount', () => {
        const result = LogActivitySchema.safeParse({
            category: 'food',
            activity_type: 'Beef meal',
            amount: 0, // must be positive
            co2_emission_kg: 5,
        });
        expect(result.success).toBe(false);
    });
});
