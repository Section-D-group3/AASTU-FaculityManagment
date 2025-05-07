// tests/unit/controllers/discussion.controller.test.js
const prisma = require("../../../config/db");
const { io } = require("../../../config/socket");
const {
  createDiscussion,
  sendMessage,
  getDiscussionById,
  updateMessage,
  deleteMessage,
  searchDiscussions,
} = require("../../../controllers/discussion.controller");

jest.mock("../../../config/db", () => ({
  discussion: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}));

describe("Discussion Controller", () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
    end: jest.fn(),
  };
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("createDiscussion - success", async () => {
    const req = {
      body: {
        title: "Test",
        content: "This is a test",
        authorId: "user1",
        communityId: "com1",
      },
    };

    prisma.discussion.create.mockResolvedValue({ id: "d1" });

    await createDiscussion(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "d1" });
  });

  test("sendMessage - success", async () => {
    const req = {
      params: { discussionId: "d1" },
      body: { content: "msg", authorId: "user1" },
    };

    prisma.user.findUnique.mockResolvedValue({ id: "user1", role: "student" });
    prisma.message.create.mockResolvedValue({ id: "m1" });

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "m1" });
  });

  test("getDiscussionById - found", async () => {
    const req = { params: { discussionId: "d1" }, query: {} };
    prisma.discussion.findUnique.mockResolvedValue({ id: "d1" });

    await getDiscussionById(req, res);

    expect(res.json).toHaveBeenCalledWith({ id: "d1" });
  });

  test("updateMessage - success", async () => {
    const req = {
      params: { messageId: "m1" },
      body: { content: "updated", authorId: "user1" },
    };

    prisma.message.findUnique.mockResolvedValue({ id: "m1", authorId: "user1" });
    prisma.message.update.mockResolvedValue({ id: "m1", content: "updated" });

    await updateMessage(req, res);

    expect(res.json).toHaveBeenCalledWith({ id: "m1", content: "updated" });
  });

  test("deleteMessage - authorized", async () => {
    const req = {
      params: { messageId: "m1" },
      body: { authorId: "user1", role: "student" },
    };

    prisma.message.findUnique.mockResolvedValue({ id: "m1", authorId: "user1" });

    await deleteMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  test("searchDiscussions - match found", async () => {
    const req = { query: { query: "test" } };
    prisma.discussion.findMany.mockResolvedValue([{ id: "d1", title: "Test" }]);

    await searchDiscussions(req, res);

    expect(res.json).toHaveBeenCalledWith([{ id: "d1", title: "Test" }]);
  });
});
