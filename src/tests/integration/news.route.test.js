const request = require('supertest');
const baseURL = 'http://localhost:5000';

describe('News API Integration Tests', () => {
  let token;
  let createdNewsId;

  beforeAll(async () => {
    // Login as a staff/admin user to get token
    const res = await request(baseURL).post('/api/auth/login').send({
      email: 'natan@example.com',     
      password: '12345678'
    });
    token = `Bearer ${res.body.token}`;
  });

  test('POST /api/news - create news (authorized)', async () => {
    const res = await request(baseURL)
      .post('/api/news')
      .set('Authorization', token)
      .send({
        title: 'Integration Test News',
        content: 'This is a test news content.',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Integration Test News');
    createdNewsId = res.body.id;
  });

  test('POST /api/news - fail to create without token', async () => {
    const res = await request(baseURL)
      .post('/api/news')
      .send({
        title: 'Unauthorized News',
        content: 'Should not be created.',
      });

    expect(res.statusCode).toBe(401);
  });

  test('GET /api/news - fetch all news (public)', async () => {
    const res = await request(baseURL).get('/api/news');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(news => news.id === createdNewsId)).toBe(true);
  });
});
