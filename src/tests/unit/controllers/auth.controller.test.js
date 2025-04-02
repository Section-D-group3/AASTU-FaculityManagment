const { signup, login, getUsers } = require('../../../controllers/auth.controller');
const prisma = require('../../../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


jest.mock('../../../config/db');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Controller', () => {
  let mockRequest, mockResponse;

  beforeEach(() => {
    
    jest.clearAllMocks();
    
   
    mockRequest = {
      body: {},
      query: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('signup', () => {
    it('should create a new user and return token', async () => {
    
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student'
      };

      bcrypt.hash.mockResolvedValue('hashedPassword123');

      
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'student'
      };
      prisma.user.create.mockResolvedValue(mockUser);

    
      jwt.sign.mockReturnValue('fakeToken123');

     
      await signup(mockRequest, mockResponse);

   
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashedPassword123',
          role: 'student'
        }
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, role: 'student' },
        process.env.JWT_SECRET
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: mockUser,
        token: 'fakeToken123'
      });
    });

    it('should handle errors during signup', async () => {
      
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

   
      prisma.user.create.mockRejectedValue(new Error('Email already exists'));

  
      await signup(mockRequest, mockResponse);

     
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email already exists'
      });
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };

     
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'student'
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

     
      bcrypt.compare.mockResolvedValue(true);

    
      jwt.sign.mockReturnValue('fakeToken123');

      
      await login(mockRequest, mockResponse);

      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, role: 'student' },
        process.env.JWT_SECRET
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: mockUser,
        token: 'fakeToken123'
      });
    });

    it('should reject invalid credentials', async () => {
     
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      
      prisma.user.findUnique.mockResolvedValue(null);

     
      await login(mockRequest, mockResponse);

      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid credentials'
      });

     
      mockResponse.status.mockClear();
      mockResponse.json.mockClear();

     
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'student'
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

    
      await login(mockRequest, mockResponse);

    
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid credentials'
      });
    });
  });

  describe('getUsers', () => {
    it('should fetch users with pagination', async () => {
      
      mockRequest.query = {
        role: 'student',
        page: '2',
        limit: '5'
      };

      
      const mockUsers = [
        { id: 1, name: 'Student 1', email: 's1@example.com', role: 'student' },
        { id: 2, name: 'Student 2', email: 's2@example.com', role: 'student' }
      ];
      prisma.$transaction.mockResolvedValue([mockUsers, 12]);

   
      await getUsers(mockRequest, mockResponse);

     
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'student' },
        skip: 5, 
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          community: true
        }
      });
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: 'student' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        users: mockUsers,
        total: 12,
        totalPages: 3,
        currentPage: 2
      });
    });

    it('should fetch all users when no role specified', async () => {
   
      mockRequest.query = {};

      
      const mockUsers = [
        { id: 1, name: 'User 1', email: 'u1@example.com', role: 'student' },
        { id: 2, name: 'User 2', email: 'u2@example.com', role: 'teacher' }
      ];
      prisma.$transaction.mockResolvedValue([mockUsers, 2]);

      
      await getUsers(mockRequest, mockResponse);

     
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        select: expect.any(Object)
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        users: mockUsers,
        total: 2,
        totalPages: 1,
        currentPage: 1
      });
    });

    it('should handle database errors', async () => {
   
      mockRequest.query = { role: 'student' };

    
      prisma.$transaction.mockRejectedValue(new Error('Database error'));

      await getUsers(mockRequest, mockResponse);

   
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Database error'
      });
    });
  });
});