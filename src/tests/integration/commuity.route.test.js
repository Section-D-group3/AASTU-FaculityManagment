const request = require("supertest");

const baseURL = "http://localhost:5000";

describe("Community API Integration Tests", () => {
  let createdCommunityId;
  let testUserId = "681afa8db9fe4ae5675c7684";

  test("GET /api/communities - should return all communities", async () => {
    const res = await request(baseURL).get("/api/communities");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/communities - create a new community", async () => {
    const res = await request(baseURL).post("/api/communities").send({
      name: "Test Communi",
      description: "A test community for integration testing",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Test Communi");
    createdCommunityId = res.body.id;
  });

  test("GET /api/communities/:id - fetch specific community", async () => {
    const res = await request(baseURL).get(
      `/api/communities/${createdCommunityId}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("name");
  });

//   test("PATCH /api/communities/:communityId/join - join a community", async () => {
//     const token =
//       "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODFiZTI4ODgwZDJkZTgwYmU1NTljYWYiLCJpYXQiOjE3NDY2NTk1MjgsImV4cCI6MTc0NjY2MzEyOH0.UHWOp7Le_060DiS75cuSfISsq7fBbYmQ1_RNkv9oN8o";

//     const res = await request(baseURL)
//       .patch(`/api/communities/${createdCommunityId}/join`)
//       .set("Authorization", token)
//       .send({ userId: testUserId });

//     expect(res.statusCode).toBe(200);
//     expect(res.body.communityId).toBe(createdCommunityId);
//   });

  test("GET /api/communities/:id/discussions - fetch discussions of community", async () => {
    const res = await request(baseURL).get(
      `/api/communities/${createdCommunityId}/discussions`
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
