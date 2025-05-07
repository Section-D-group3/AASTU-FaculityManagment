
const prisma = require("../../../config/db");
const { createNews, getNews } = require("../../../controllers/news.controller");
const { sendNotification } = require("../../../utils/pushNotification");

jest.mock("../../../config/db", () => ({
  news: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  subscription: {
    findMany: jest.fn(),
  },
}));

jest.mock("../../../utils/pushNotification", () => ({
  sendNotification: jest.fn(),
}));

describe("News Controller", () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("createNews - success", async () => {
    const req = {
      body: { title: "News Title", content: "News content" },
      user: { id: "author1" },
    };

    const mockNews = { id: "n1", title: "News Title" };
    const mockSubscriptions = [
      { endpoint: "sub1" },
      { endpoint: "sub2" },
    ];

    prisma.news.create.mockResolvedValue(mockNews);
    prisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

    await createNews(req, res);

    expect(prisma.news.create).toHaveBeenCalledWith({
      data: {
        title: "News Title",
        content: "News content",
        authorId: "author1",
      },
    });

    expect(prisma.subscription.findMany).toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(sendNotification).toHaveBeenCalledWith(mockSubscriptions[0], {
      title: "New News Alert!",
      body: "News Title",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockNews);
  });

  test("createNews - missing fields", async () => {
    const req = {
      body: {},
      user: { id: "author1" },
    };

    // Simulate throwing an error when creating news due to missing fields
    prisma.news.create.mockImplementation(() => {
      throw new Error("Missing required fields");
    });

    await createNews(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields" });
  });

  test("getNews - success", async () => {
    const req = {};
    const mockNews = [{ id: "n1", title: "Title 1" }, { id: "n2", title: "Title 2" }];
    prisma.news.findMany.mockResolvedValue(mockNews);

    await getNews(req, res);

    expect(prisma.news.findMany).toHaveBeenCalledWith({
      include: { author: true },
    });

    expect(res.json).toHaveBeenCalledWith(mockNews);
  });

  test("getNews - error", async () => {
    const req = {};
    prisma.news.findMany.mockRejectedValue(new Error("DB error"));

    await getNews(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
  });
});
