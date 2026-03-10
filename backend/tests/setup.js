const prisma = require("../src/db/client");

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  await prisma.photo.deleteMany();
  await prisma.locationSeason.deleteMany();
  await prisma.locationFish.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});