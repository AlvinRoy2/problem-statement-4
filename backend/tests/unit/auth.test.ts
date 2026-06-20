import { register, login, RegisterSchema, LoginSchema } from '../../src/controllers/authController';
import { db } from '../../src/db/database';
import bcrypt from 'bcrypt';

jest.mock('../../src/db/database', () => ({
    db: { run: jest.fn(), get: jest.fn() },
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedpassword'),
    compare: jest.fn(),
}));

describe('Auth Controller', () => {
    let req: any, res: any;

    beforeEach(() => {
        req = { body: { email: 'test@test.com', password: 'password123', name: 'Test User' } };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    // ─── register ─────────────────────────────────────────────────────────────

    describe('register', () => {
        it('should hash password and return 201 with token on success', async () => {
            (db.run as jest.Mock).mockImplementation((_q, _p, cb) => {
                cb.call({ lastID: 1 }, null);
            });

            await register(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                user: { id: 1, email: 'test@test.com', name: 'Test User' },
                token: expect.any(String),
            }));
        });

        it('should return 409 when email already exists', async () => {
            (db.run as jest.Mock).mockImplementation((_q, _p, cb) => {
                cb.call(null, new Error('UNIQUE constraint failed'));
            });

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
        });
    });

    // ─── login ────────────────────────────────────────────────────────────────

    describe('login', () => {
        it('should return token on valid credentials', async () => {
            (db.get as jest.Mock).mockImplementation((_q, _p, cb) => {
                cb(null, { id: 1, email: 'test@test.com', name: 'Test User', password_hash: 'hashedpassword' });
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            login(req, res);
            await new Promise(r => setTimeout(r, 50)); // wait for async

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
        });

        it('should return 401 when user does not exist', () => {
            (db.get as jest.Mock).mockImplementation((_q, _p, cb) => {
                cb(null, undefined); // no user found
            });

            login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 on wrong password', async () => {
            (db.get as jest.Mock).mockImplementation((_q, _p, cb) => {
                cb(null, { id: 1, email: 'test@test.com', password_hash: 'hashedpassword' });
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            login(req, res);
            await new Promise(r => setTimeout(r, 50));

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });
});

// ─── RegisterSchema Zod Validation ───────────────────────────────────────────

describe('RegisterSchema', () => {
    it('should reject invalid email', () => {
        const result = RegisterSchema.safeParse({ name: 'A', email: 'not-an-email', password: 'password123' });
        expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
        const result = RegisterSchema.safeParse({ name: 'A', email: 'a@b.com', password: 'short' });
        expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
        const result = RegisterSchema.safeParse({ name: '', email: 'a@b.com', password: 'password123' });
        expect(result.success).toBe(false);
    });

    it('should accept valid registration data', () => {
        const result = RegisterSchema.safeParse({ name: 'Alice', email: 'alice@example.com', password: 'mypassword' });
        expect(result.success).toBe(true);
    });
});
