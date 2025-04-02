const mockPrisma = {
   user: {
     create: jest.fn(),
     findUnique: jest.fn(),
     findMany: jest.fn(),
     update: jest.fn(),
     delete: jest.fn(),
   },
   $transaction: jest.fn(),
 };
 
 module.exports = {
   PrismaClient: jest.fn(() => mockPrisma),
 };