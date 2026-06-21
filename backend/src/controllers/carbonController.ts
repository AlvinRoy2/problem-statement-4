import { type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

/** Valid carbon emission categories */
const CARBON_CATEGORIES = ['transport', 'energy', 'food', 'shopping', 'waste', 'other'] as const;

/** Zod schema for logging a carbon activity */
export const LogActivitySchema = z.object({
    category: z.enum(CARBON_CATEGORIES, { message: 'Invalid category' }),
    activity_type: z.string().trim().min(1, 'Activity type is required').max(100).regex(/^[^<>]*$/, 'Invalid HTML characters'),
    amount: z.number().positive('Amount must be a positive number'),
    co2_emission_kg: z.number().nonnegative('CO2 emission must be a non-negative number'),
}).strict();

export type LogActivityInput = z.infer<typeof LogActivitySchema>;

interface AuthenticatedRequest extends Request {
    user?: { userId: number };
}

/**
 * Logs a new carbon emission activity for the authenticated user.
 * Invalidates the user's trend cache on success.
 */
export const logActivity = (req: AuthenticatedRequest, res: Response): void => {
    const { category, activity_type, amount, co2_emission_kg } = req.body as LogActivityInput;
    const userId = req.user?.userId;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    db.run(
        'INSERT INTO activities (user_id, category, activity_type, amount, co2_emission_kg) VALUES (?, ?, ?, ?, ?)',
        [userId, category, activity_type, amount, co2_emission_kg],
        function (this: { lastID: number }, err: Error | null) {
            if (err) {
                return res.status(500).json({ error: 'Failed to log activity.' });
            }
            cache.del(`trends_${userId}`); // Invalidate user's trend cache
            res.status(201).json({ id: this.lastID, message: 'Activity logged successfully.' });
        }
    );
};

/**
 * Retrieves the last 30 days of carbon emission trends for the authenticated user.
 * Results are cached for 10 minutes per user to reduce DB load.
 */
export const getTrends = (req: AuthenticatedRequest, res: Response): void => {
    const userId = req.user?.userId;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const cacheKey = `trends_${userId}`;
    const cachedTrends = cache.get(cacheKey);
    if (cachedTrends) {
        res.json(cachedTrends);
        return;
    }

    db.all(
        'SELECT date, SUM(co2_emission_kg) as total_co2 FROM activities WHERE user_id = ? GROUP BY date ORDER BY date DESC LIMIT 30',
        [userId],
        (err: Error | null, rows: unknown[]) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to retrieve emission trends.' });
            }
            cache.set(cacheKey, rows);
            res.json(rows);
        }
    );
};

/**
 * Deletes a specific carbon activity.
 * Demonstrates explicit authorization by enforcing the Principle of Least Privilege (Ownership Check).
 */
export const deleteActivity = (req: AuthenticatedRequest, res: Response): void => {
    const userId = req.user?.userId;
    const activityId = parseInt(req.params.id, 10);

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if (isNaN(activityId)) {
        res.status(400).json({ error: 'Invalid activity ID' });
        return;
    }

    // Explicit Ownership Check (IDOR Prevention)
    db.get('SELECT user_id FROM activities WHERE id = ?', [activityId], (err: Error | null, row: { user_id: number } | undefined) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Activity not found.' });
        }
        if (row.user_id !== userId) {
            // User is trying to access a resource they do not own
            return res.status(403).json({ error: 'Forbidden: You do not own this resource.' });
        }

        // Ownership confirmed, safe to delete
        db.run('DELETE FROM activities WHERE id = ?', [activityId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete activity.' });
            }
            cache.del(`trends_${userId}`); // Invalidate user's trend cache
            res.status(200).json({ message: 'Activity deleted successfully.' });
        });
    });
};
