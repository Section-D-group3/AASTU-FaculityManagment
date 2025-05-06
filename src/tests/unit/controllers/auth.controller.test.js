

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../../config/db'); 
const { registerUser, loginUser } = require('../../../controllers/auth.controller');

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../../config/db', () => ({
  query: jest.fn(),
}));

describe('Auth Controller', () => {
  describe('registerUser', () => {
    it('should hash the password and register the user', async () => {
      // Mock request, response, and next
      const req = { body: { username: 'testuser', password: 'testpassword' } };
      const res = { status: jest.fn(() => res), json: jest.fn() };
      const next = jest.fn();

      // Mock bcrypt and DB behavior
      bcrypt.hash.mockResolvedValue('hashed_password');
      db.query.mockResolvedValue({}); // Simulate DB insertion

      await registerUser(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith('testpassword', 10);
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        ['testuser', 'hashed_password']
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully' });
    });
  });

  describe('loginUser', () => {
    it('should validate the password and return a JWT token', async () => {
      // Mock request, response, and next
      const req = { body: { username: 'testuser', password: 'testpassword' } };
      const res = { status: jest.fn(() => res), json: jest.fn() };
      const next = jest.fn();

      // Mock bcrypt, jwt, and DB behavior
      const mockUser = { id: 1, username: 'testuser', password: 'hashed_password' };
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mocked_token');
      db.query.mockResolvedValue([mockUser]); // Simulate DB query

      await loginUser(req, res, next);

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?', ['testuser']);
      expect(bcrypt.compare).toHaveBeenCalledWith('testpassword', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 }, 'your_jwt_secret', { expiresIn: '1h' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'mocked_token' });
    });

    it('should return 404 if user is not found', async () => {
      const req = { body: { username: 'nonexistentuser', password: 'testpassword' } };
      const res = { status: jest.fn(() => res), json: jest.fn() };
      const next = jest.fn();

      db.query.mockResolvedValue([]); // No user found

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 401 if password is invalid', async () => {
      const req = { body: { username: 'testuser', password: 'wrongpassword' } };
      const res = { status: jest.fn(() => res), json: jest.fn() };
      const next = jest.fn();

      const mockUser = { id: 1, username: 'testuser', password: 'hashed_password' };
      db.query.mockResolvedValue([mockUser]); // User found
      bcrypt.compare.mockResolvedValue(false); // Password mismatch

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });
});