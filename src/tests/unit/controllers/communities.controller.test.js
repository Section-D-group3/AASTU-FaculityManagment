const prisma = require('../../../config/db');
const {
  getAllCommunities,
  joinCommunity,
  getCommunityById,
  createCommunity,
  getCommunityDiscussions,
} = require('../../../controllers/community.controller');

jest.mock('../../../config/db', () => ({
  community: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
  discussion: {
    findMany: jest.fn(),
  },
}));

describe('Community Controller', () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCommunities', () => {
    it('should return all communities with members', async () => {
      prisma.community.findMany.mockResolvedValue([{ id: '1', name: 'Test Community' }]);

      await getAllCommunities({}, res);

      expect(prisma.community.findMany).toHaveBeenCalledWith({ include: { members: true } });
      expect(res.json).toHaveBeenCalledWith([{ id: '1', name: 'Test Community' }]);
    });
  });

  describe('getCommunityById', () => {
    it('should return a community by ID', async () => {
      const req = { params: { id: '1' } };
      prisma.community.findUnique.mockResolvedValue({ id: '1', name: 'Test Community' });

      await getCommunityById(req, res);

      expect(prisma.community.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { members: true },
      });
      expect(res.json).toHaveBeenCalledWith({ id: '1', name: 'Test Community' });
    });

    it('should return 404 if community not found', async () => {
      const req = { params: { id: '999' } };
      prisma.community.findUnique.mockResolvedValue(null);

      await getCommunityById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Community not found' });
    });
  });

  describe('createCommunity', () => {
    it('should create a new community', async () => {
      const req = { body: { name: 'NewCommunity', description: 'A test community' } };
      prisma.community.findUnique.mockResolvedValue(null);
      prisma.community.create.mockResolvedValue({ id: '1', name: 'NewCommunity' });

      await createCommunity(req, res);

      expect(prisma.community.findUnique).toHaveBeenCalledWith({ where: { name: 'NewCommunity' } });
      expect(prisma.community.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: '1', name: 'NewCommunity' });
    });

    it('should return 400 if community name already exists', async () => {
      const req = { body: { name: 'ExistingCommunity', description: 'Test' } };
      prisma.community.findUnique.mockResolvedValue({ id: '1' });

      await createCommunity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Community with this name already exists',
      });
    });
  });

  describe('joinCommunity', () => {
    it('should update user with communityId', async () => {
      const req = {
        body: { userId: '123' },
        params: { communityId: '1' },
        user: { id: '123' },
      };
      prisma.user.update.mockResolvedValue({ id: '123', communityId: '1' });

      await joinCommunity(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { communityId: '1' },
        include: { community: true },
      });
      expect(res.json).toHaveBeenCalledWith({ id: '123', communityId: '1' });
    });
  });

  describe('getCommunityDiscussions', () => {
    it('should return discussions for a community', async () => {
      const req = { params: { id: '1' } };
      prisma.community.findUnique.mockResolvedValue({ id: '1' });
      prisma.discussion.findMany.mockResolvedValue([{ id: 'd1', title: 'Topic' }]);

      await getCommunityDiscussions(req, res);

      expect(prisma.discussion.findMany).toHaveBeenCalledWith({
        where: { communityId: '1' },
      });
      expect(res.json).toHaveBeenCalledWith([{ id: 'd1', title: 'Topic' }]);
    });

    it('should return 404 if community not found', async () => {
      const req = { params: { id: '999' } };
      prisma.community.findUnique.mockResolvedValue(null);

      await getCommunityDiscussions(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Community not found' });
    });
  });
});
