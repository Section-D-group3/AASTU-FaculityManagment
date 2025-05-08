const request = require('supertest');
const baseUrl = 'http://localhost:5000';

describe('Acceptance Testing: Student Management System', () => {
  let token;

  test('User logs in and gets a token', async () => {
    const response = await request(baseUrl)
      .post('/api/auth/login')
      .send({ username: 'natan', password: '12345678' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    token = response.body.token;
  });

  test('Admin creates a community', async () => {
    const response = await request(baseUrl)
      .post('/api/communities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'AI Club', description: 'Discussing AI topics' });

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('AI Club');
  });

  test('Student joins a community', async () => {
    const communityRes = await request(baseUrl).get('/api/communities');
    const communityId = communityRes.body[0].id;

    const joinRes = await request(baseUrl)
      .patch(`/api/communities/join/${communityId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 'valid-user-id' });

    expect(joinRes.statusCode).toBe(200);
  });

  test('Student retrieves community discussions', async () => {
    const communityRes = await request(baseUrl).get('/api/communities');
    const communityId = communityRes.body[0].id;

    const discussionRes = await request(baseUrl).get(`/api/communities/${communityId}/discussions`);
    expect(discussionRes.statusCode).toBe(200);
    expect(Array.isArray(discussionRes.body)).toBe(true);
  });
});
