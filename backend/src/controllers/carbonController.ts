import { db } from '../db/database';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

export const logActivity = (req: any, res: any) => {
    const { category, activity_type, amount, co2_emission_kg } = req.body;
    db.run(
        'INSERT INTO activities (user_id, category, activity_type, amount, co2_emission_kg) VALUES (?, ?, ?, ?, ?)',
        [req.user.userId, category, activity_type, amount, co2_emission_kg],
        function(this: any, err: any) {
            if (err) return res.status(500).json({ error: 'Failed to log activity' });
            cache.del(`trends_${req.user.userId}`); // Invalidate cache
            res.status(201).json({ id: this.lastID });
        }
    );
};

export const getTrends = (req: any, res: any) => {
    const cachedTrends = cache.get(`trends_${req.user.userId}`);
    if (cachedTrends) return res.json(cachedTrends);

    db.all(
        'SELECT date, SUM(co2_emission_kg) as total_co2 FROM activities WHERE user_id = ? GROUP BY date ORDER BY date DESC LIMIT 30',
        [req.user.userId],
        (err: any, rows: any) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch trends' });
            cache.set(`trends_${req.user.userId}`, rows);
            res.json(rows);
        }
    );
};
