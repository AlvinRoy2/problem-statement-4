import { register, login } from '../../src/controllers/authController';
import { db } from '../../src/db/database';
import bcrypt from 'bcrypt';

jest.mock('../../src/db/database', () => ({
    db: {
        run: jest.fn(),
        get: jest.fn(),
    }
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedpassword'),
    compare: jest.fn()
}));

describe('Auth Controller', () => {
    let req: any, res: any;

    beforeEach(() => {
        req = { body: { email: 'test@test.com', password: 'password', name: 'Test' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    test('register should hash password and insert user', async () => {
        (db.run as jest.Mock).mockImplementation((query, params, cb) => {
            cb.call({ lastID: 1 }, null);
        });

        await register(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
        expect(db.run).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            user: { id: 1, email: 'test@test.com', name: 'Test' },
            token: expect.any(String)
        }));
    });

    test('register should handle db error', async () => {
        (db.run as jest.Mock).mockImplementation((query, params, cb) => {
            cb.call(null, new Error('User exists'));
        });

        await register(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
