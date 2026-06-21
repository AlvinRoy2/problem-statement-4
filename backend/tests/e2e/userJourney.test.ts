import request from 'supertest';
import { db } from '../../src/db/database';
import app from '../../src/server';

describe('User Journey End-to-End Test', () => {
    let testToken: string;

    beforeAll((done) => {
        // Clear test users
        db.run('DELETE FROM users WHERE email = ?', ['e2e@test.com'], () => {
            done();
        });
    });

    afterAll((done) => {
        // Clean up
        db.run('DELETE FROM users WHERE email = ?', ['e2e@test.com'], () => {
            done();
        });
    });

    test('Full User Journey: Register, Login, Log Carbon, and View Trends', async () => {
        // 1. Register a new user
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'E2E User',
                email: 'e2e@test.com',
                password: 'SecurePassword123'
            });

        expect(registerRes.status).toBe(201);
        expect(registerRes.body).toHaveProperty('token');
        testToken = registerRes.body.token;

        // 2. Log in with the new user
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'e2e@test.com',
                password: 'SecurePassword123'
            });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body).toHaveProperty('token');

        // 3. Log a new carbon activity
        const logRes = await request(app)
            .post('/api/carbon/log')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                category: 'transport',
                activity_type: 'E2E Driving',
                amount: 15,
                co2_emission_kg: 3.5
            });

        expect(logRes.status).toBe(201);
        expect(logRes.body).toHaveProperty('message', 'Activity logged successfully.');

        // 4. Retrieve carbon trends
        const trendsRes = await request(app)
            .get('/api/carbon/trends')
            .set('Authorization', `Bearer ${testToken}`);

        expect(trendsRes.status).toBe(200);
        expect(Array.isArray(trendsRes.body)).toBe(true);
        expect(trendsRes.body.length).toBeGreaterThan(0);
        expect(trendsRes.body[0]).toHaveProperty('total_co2');
    });
});
