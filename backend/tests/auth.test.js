const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/db/client");

describe("Auth - register", () => {
  it("should register a new user", async () => {
    const email = `test_${Date.now()}@example.com`;

    const res = await request(app)
      .post("/auth/register") // <- якщо в тебе інший route, зміни тут
      .send({
        email,
        password: "Password123!",
        displayName: "TestUser",
      });

    expect([200, 201]).toContain(res.status);

    // перевірка, що у відповіді є хоч щось корисне
    expect(res.body).toBeTruthy();

    // якщо API повертає user окремим полем
    if (res.body.user) {
      expect(res.body.user.email).toBe(email);
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.passwordHash).toBeUndefined();
    } else {
      // якщо API повертає user напряму
      expect(res.body.email || res.body.data?.email).toBe(email);
    }

    // перевірка, що юзер реально є в БД
    const userInDb = await prisma.user.findUnique({
      where: { email },
    });

    expect(userInDb).toBeTruthy();
    expect(userInDb.email).toBe(email);
  });

  it("should return 401 for wrong password", async () => {
    const email = `wrongpass_${Date.now()}@example.com`;
    const password = "Password123!";

    await request(app).post("/auth/register").send({
      email,
      password,
      displayName: "WrongPassUser",
    });

    const res = await request(app).post("/auth/login").send({
      email,
      password: "WrongPassword999!",
    });

    expect(res.status).toBe(401);
    expect(res.body).toBeTruthy();
  });
});

describe("Auth - login", () => {
  it("should login and return a token", async () => {
    const email = `login_${Date.now()}@example.com`;
    const password = "Password123!";

    await request(app).post("/auth/register").send({
      email,
      password,
      displayName: "LoginUser",
    });

    const res = await request(app).post("/auth/login").send({
      email,
      password,
    });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeTruthy();

    // Підлаштовуємося під різні формати відповіді
    const token =
      res.body.token ||
      res.body.accessToken ||
      res.body.data?.token ||
      res.body.data?.accessToken;

    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });
});
