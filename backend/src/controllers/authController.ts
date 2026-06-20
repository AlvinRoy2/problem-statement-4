import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/database';
import { type Request, type Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_monolith';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as `${number}${'s' | 'm' | 'h' | 'd' | 'w'}`;

/** Zod schema for user registration input */
export const RegisterSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

/** Zod schema for user login input */
export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

interface DbUser {
    id: number;
    email: string;
    name: string;
    password_hash: string;
}

/**
 * Registers a new user. Hashes the password with bcrypt before storing.
 * Returns HTTP 409 if the user already exists, 201 with a JWT on success.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, name } = req.body as RegisterInput;
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
            [email, hash, name],
            function (this: { lastID: number }, err: Error | null) {
                if (err) {
                    // SQLite UNIQUE constraint violation
                    return res.status(409).json({ error: 'An account with this email already exists.' });
                }
                const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '24h' });
                res.status(201).json({ user: { id: this.lastID, email, name }, token });
            }
        );
    } catch {
        res.status(500).json({ error: 'Server error during registration.' });
    }
};

/**
 * Authenticates an existing user by email/password.
 * Returns HTTP 401 on invalid credentials, 200 with a JWT on success.
 */
export const login = (req: Request, res: Response): void => {
    const { email, password } = req.body as LoginInput;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err: Error | null, user: DbUser | undefined) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
    });
};
