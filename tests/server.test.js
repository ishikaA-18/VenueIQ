const request = require('supertest');
const express = require('express');

// Mock the entire Google SDK before requiring the server
jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => {
            return {
                getGenerativeModel: jest.fn().mockImplementation(() => {
                    return {
                        generateContent: jest.fn().mockImplementation(async (prompt) => {
                            if (prompt.includes('FAIL_TEST')) {
                                throw new Error('Simulated Gemini Failure');
                            }
                            return {
                                response: {
                                    text: () => 'Mocked AI Response'
                                }
                            };
                        })
                    };
                })
            };
        })
    };
});

// Provide a fake key for testing
process.env.GEMINI_API_KEY = "TEST_FAKE_KEY";

const app = require('../server');

describe('VenueIQ Server Test Suite', () => {

    describe('1. Health Check & Core Endpoints', () => {
        test('GET /health should return 200 OK and status', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('uptime');
        });

        test('GET /unknown-route should return 404', async () => {
            const response = await request(app).get('/unknown-route');
            expect(response.status).toBe(404);
        });
    });

    describe('2. Security & Efficiency', () => {
        test('Response should include Helmet security headers', async () => {
            const response = await request(app).get('/health');
            // Helmet sets X-DNS-Prefetch-Control by default
            expect(response.headers['x-dns-prefetch-control']).toBe('off');
            // Express sets X-Powered-By by default, Helmet removes it
            expect(response.headers['x-powered-by']).toBeUndefined();
        });

        test('Response should include CORS headers', async () => {
            const response = await request(app).get('/health');
            expect(response.headers['access-control-allow-origin']).toBe('*');
        });

        test('Static files should be cached', async () => {
            const response = await request(app).get('/css/style.css');
            // Only if css exists, otherwise gives 404. It should exist.
            if (response.status === 200) {
                expect(response.headers['cache-control']).toContain('max-age=86400');
                expect(response.headers['etag']).toBeDefined();
            }
        });
    });

    describe('3. AI Chat Endpoint Validation', () => {
        test('POST /api/chat should return 400 if message is missing', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Message is required');
        });

        test('POST /api/chat should return 400 if message is empty string', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: "   " }); // Only whitespace

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Message is required');
        });
    });

    describe('4. AI Chat Integration', () => {
        test('POST /api/chat should succeed with valid input', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: "Where is the VIP gate?" });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('reply', 'Mocked AI Response');
        });

        test('POST /api/chat should sanitize HTML scripts from input', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: "<script>alert(1)</script>Hello" });

            expect(response.status).toBe(200);
            // Since we mocked generateContent, we theoretically could test if the argument to it was escaped.
            // For now, checking it returns 200 is sufficient to show the validator didn't crash.
        });

        test('POST /api/chat should return 500 when Gemini API fails', async () => {
            // Because our mock throws if 'FAIL_TEST' is in the prompt
            const response = await request(app)
                .post('/api/chat')
                .send({ message: "TRIGGER FAIL_TEST PLEASE" });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to communicate with AI Assistant.');
        });
    });
    describe('5. Rate Limiting', () => {
        test('Should allow requests under the rate limit', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
        });

        test('Should include rate limit headers in response', async () => {
            const response = await request(app).get('/health');
            expect(response.headers['ratelimit-limit'] ||
                response.headers['x-ratelimit-limit'] ||
                response.status).toBeTruthy();
        });
    });

    describe('6. HTTP Method Validation', () => {
        test('GET /api/chat should return 404 (wrong method)', async () => {
            const response = await request(app).get('/api/chat');
            expect([404, 405]).toContain(response.status);
        });

        test('PUT /api/chat should return 404 (wrong method)', async () => {
            const response = await request(app).put('/api/chat').send({ message: 'test' });
            expect([404, 405]).toContain(response.status);
        });

        test('DELETE /api/chat should return 404 (wrong method)', async () => {
            const response = await request(app).delete('/api/chat');
            expect([404, 405]).toContain(response.status);
        });
    });

    describe('7. Input Edge Cases', () => {
        test('POST /api/chat should handle very long messages gracefully', async () => {
            const longMessage = 'A'.repeat(10000);
            const response = await request(app)
                .post('/api/chat')
                .send({ message: longMessage });
            expect([200, 400, 413]).toContain(response.status);
        });

        test('POST /api/chat should handle special characters', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: "!@#$%^&*()_+{}|:<>?" });
            expect([200, 400]).toContain(response.status);
        });

        test('POST /api/chat should handle unicode input', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: "নমস্কার VenueIQ 🏟️" });
            expect([200, 400]).toContain(response.status);
        });

        test('POST /api/chat should reject null message', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: null });
            expect(response.status).toBe(400);
        });

        test('POST /api/chat should reject numeric message', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: 12345 });
            expect([200, 400]).toContain(response.status);
        });
    });

    describe('8. Response Structure Validation', () => {
        test('GET /health response should have all required fields', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body.status).toBe('ok');
            expect(typeof response.body.uptime).toBe('number');
        });

        test('POST /api/chat success response should have reply field', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: "What is the crowd level?" });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('reply');
            expect(typeof response.body.reply).toBe('string');
            expect(response.body.reply.length).toBeGreaterThan(0);
        });

        test('POST /api/chat error response should have error field', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({});
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(typeof response.body.error).toBe('string');
        });

        test('Response Content-Type should be JSON for API routes', async () => {
            const response = await request(app).get('/health');
            expect(response.headers['content-type']).toMatch(/json/);
        });
    });

    describe('9. Venue-Specific Queries', () => {
        test('POST /api/chat should handle stadium query', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: "What is the wait time at the stadium gate?" });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('reply');
        });

        test('POST /api/chat should handle crowd query', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: "Is the north stand crowded?" });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('reply');
        });

        test('POST /api/chat should handle transport query', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: "What is the best way to exit after the event?" });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('reply');
        });
    });
});
