import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_monolith';

export const register = async (req: any, res: any) => {
    const { email, password, name } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', [email, hash, name], function(this: any, err: any) {
            if (err) return res.status(400).json({ error: 'User already exists' });
            const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({ user: { id: this.lastID, email, name }, token });
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
};

export const login = (req: any, res: any) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user: any) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
    });
};
