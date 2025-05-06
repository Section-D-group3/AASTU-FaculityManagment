const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../../config/db');
const { registerUser, loginUser } = require('../../../controllers/auth.controller');

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../../config/db', () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
}));

describe('Auth Controller with Prisma', () => {
  describe('registerUser', () => {
    it('should hash the password and register the user', async () => {
      const req = { body: { username: 'testuser', password: 'testpassword' } };
      const res = { status: jest.fn(() => res), json: jest.fn() };
      const next = jest.fn();

      bcrypt.hash.mockResolvedValue('hashed_password');
      prisma.user.create.mockResolvedValue({});

      await registerUser(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith('testpassword', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'testuser',
          email: 'testuser@example.com',
          password: 'hashed_password',
          role: 'student',
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully' });
    });
  });

  describe('loginUser', () => {
    it('should validate the password and return a JWT token', async () => {
      const req = { body: { username: 'testuser', password: 'testpassword' } };
      const res = { status: jest.fn(() => res), json: jest.fn() };
      const next = jest.fn();

      const mockUser = { id: '123', email: 'testuser@example.com', password: 'hashed_password' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mocked_token');

      await loginUser(req, res, next);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'testuser@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('testpassword', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalledWith({ userId: '123' }, 'your_jwt_secret', { expiresIn: '1h' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'mocked_token' });
    });

    it('should return 404 if user is not found', async () => {
      const req = { body: { username: 'nonexistentuser', password: 'testpassword' } };
      const res = { status: jest.fn(() => res), json: jest.fn() };
      const next = jest.fn();

      prisma.user.findUnique.mockResolvedValue(null);

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 401 if password is invalid', async () => {
      const req = { body: { username: 'testuser', password: 'wrongpassword' } };
      const res = { status: jest.fn(() => res), json: jest.fn() };
      const next = jest.fn();

      const mockUser = { id: '123', email: 'testuser@example.com', password: 'hashed_password' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });
});
