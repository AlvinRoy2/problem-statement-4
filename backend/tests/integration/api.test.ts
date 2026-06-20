import request from 'supertest';
import app from '../../src/server';

describe('EcoTrack API Integration Tests', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('type', 'Monolith (Refactored)');
        });
    });

    describe('POST /api/auth/register', () => {
        it('should attempt to register a new user and return appropriate status', async () => {
            const testEmail = `test_${Date.now()}@example.com`;
            
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: testEmail,
                    password: 'password123'
                });
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should fail login with incorrect credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword'
                });
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid email or password');
        });
    });
});
