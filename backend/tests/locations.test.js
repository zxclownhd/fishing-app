const request = require("supertest");
const app = require("../src/app");

describe("GET /locations", () => {
  it("should return 200", async () => {
    const res = await request(app).get("/locations");

    expect(res.status).toBe(200);
  });
});