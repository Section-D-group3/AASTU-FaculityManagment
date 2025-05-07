const request = require('supertest');

describe('Auth API Integration Tests (via localhost:5000)', () => {
  test('Register a new user', async () => {
    const res = await request('http://localhost:5000')
      .post('/api/auth/signup')
      .send({ username: 'testuser', password: 'Password123!' });

    expect(res.statusCode).toBe(201);
   //  expect(res.body.token).toBeDefined();
  });

  test('Login with registered user returns JWT', async () => {
    const res = await request('http://localhost:5000')
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'Password123!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('Login fails with wrong password', async () => {
    const res = await request('http://localhost:5000')
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  test('Login fails for non-existent user', async () => {
    const res = await request('http://localhost:5000')
      .post('/api/auth/login')
      .send({ username: 'no_such_user', password: 'Password123!' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBeDefined();
  });
});
