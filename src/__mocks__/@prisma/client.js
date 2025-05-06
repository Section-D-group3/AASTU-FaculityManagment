const mockPrisma = {
   user: {
     create: jest.fn(),
     findUnique: jest.fn(),
     findMany: jest.fn(),
     update: jest.fn(),
     delete: jest.fn(),
     count: jest.fn(),
   },
   $transaction: jest.fn(async (operations) => {
     // Improved transaction mock that handles both direct operations and callback functions
     const results = [];
     for (const op of operations) {
       if (typeof op === 'function') {
         // Handle Prisma client operations passed as functions
         results.push(await op());
       } else {
         // Handle direct Prisma queries
         results.push(await op);
       }
     }
     return results;
   }),
 };
 
 // Mock the PrismaClient constructor and instance methods
 const PrismaClient = jest.fn(() => mockPrisma);
 
 module.exports = {
   PrismaClient,
   mockPrisma // Exporting mockPrisma for individual test customization
 };