import { type Request, type Response, type NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

/**
 * Generic middleware factory that validates `req.body` against a Zod schema.
 * Returns HTTP 422 Unprocessable Entity on validation failure.
 * @param schema - A Zod schema to validate the request body against.
 */
export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const errors = (result.error as ZodError).errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        res.status(422).json({ error: 'Validation failed', details: errors });
        return;
    }
    req.body = result.data; // use the parsed, safe data
    next();
};
