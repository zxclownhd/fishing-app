const request = require("supertest");
const app = require("../../src/app");
const prisma = require("../../src/db/client");

async function registerAndLogin(role = "USER") {
  const unique = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const email = `user_${unique}@example.com`;
  const password = "Password123!";
  const displayName = `User${unique}`.slice(0, 30);

  const registerRes = await request(app).post("/auth/register").send({
    email,
    password,
    displayName,
    role,
  });

  if (![200, 201].includes(registerRes.status)) {
    throw new Error(
      `registerAndLogin register failed: ${registerRes.status} ${JSON.stringify(registerRes.body)}`
    );
  }

  const token =
    registerRes.body.token ||
    registerRes.body.accessToken ||
    registerRes.body.data?.token ||
    registerRes.body.data?.accessToken;

  if (!token) {
    throw new Error(
      `registerAndLogin no token in register response: ${JSON.stringify(registerRes.body)}`
    );
  }

  return { token, email, password, registerRes };
}

async function registerAndLoginAsAdmin() {
  const unique = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const email = `admin_${unique}@example.com`;
  const password = "Password123!";
  const displayName = `Admin${unique}`.slice(0, 30);

  const registerRes = await request(app).post("/auth/register").send({
    email,
    password,
    displayName,
  });

  if (![200, 201].includes(registerRes.status)) {
    throw new Error(
      `registerAndLoginAsAdmin register failed: ${registerRes.status} ${JSON.stringify(registerRes.body)}`
    );
  }

  const userInDb = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });

  if (!userInDb) {
    throw new Error(`registerAndLoginAsAdmin user not found after register: ${email}`);
  }

  await prisma.user.update({
    where: { id: userInDb.id },
    data: { role: "ADMIN" },
  });

  const loginRes = await request(app).post("/auth/login").send({
    email,
    password,
  });

  if (![200, 201].includes(loginRes.status)) {
    throw new Error(
      `registerAndLoginAsAdmin login failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`
    );
  }

  const token =
    loginRes.body.token ||
    loginRes.body.accessToken ||
    loginRes.body.data?.token ||
    loginRes.body.data?.accessToken;

  if (!token) {
    throw new Error(
      `registerAndLoginAsAdmin no token in login response: ${JSON.stringify(loginRes.body)}`
    );
  }

  return { token, email, password, loginRes };
}

module.exports = {
  registerAndLogin,
  registerAndLoginAsAdmin,
};