// prisma/seed.mjs
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function dec(n) {
  return new Prisma.Decimal(String(n));
}

async function upsertUser({ email, role, displayName, passwordHash }) {
  return prisma.user.upsert({
    where: { email },
    update: { role, displayName },
    create: { email, role, displayName, passwordHash },
  });
}

async function upsertLocationByOwnerAndTitle(data) {
  // У тебе немає @@unique на (ownerId, title), тому робимо find + update/create
  const existing = await prisma.location.findFirst({
    where: { ownerId: data.ownerId, title: data.title },
    select: { id: true },
  });

  if (existing) {
    return prisma.location.update({
      where: { id: existing.id },
      data,
      select: { id: true, title: true },
    });
  }

  return prisma.location.create({
    data,
    select: { id: true, title: true },
  });
}

async function main() {
  // 1) USERS
  const pwd = await bcrypt.hash("Password123!", 10);

  const admin = await upsertUser({
    email: "admin@test.com",
    passwordHash: pwd,
    role: "ADMIN",
    displayName: "Admin",
  });

  const owner1 = await upsertUser({
    email: "owner1@test.com",
    passwordHash: pwd,
    role: "OWNER",
    displayName: "Owner One",
  });

  const owner2 = await upsertUser({
    email: "owner2@test.com",
    passwordHash: pwd,
    role: "OWNER",
    displayName: "Owner Two",
  });

  const user1 = await upsertUser({
    email: "user1@test.com",
    passwordHash: pwd,
    role: "USER",
    displayName: "User One",
  });

  const user2 = await upsertUser({
    email: "user2@test.com",
    passwordHash: pwd,
    role: "USER",
    displayName: "User Two",
  });

  // 2) DICTIONARIES
  const fishRows = [
    { name: "Carp" },
    { name: "Crucian carp" },
    { name: "Pike" },
    { name: "Perch" },
    { name: "Zander" },
    { name: "Catfish" },
    { name: "Bream" },
    { name: "Roach" },
    { name: "Trout" },
    { name: "Salmon" },

    { name: "Asp" },
    { name: "Chub" },
    { name: "Ide" },
    { name: "Rudd" },
    { name: "Tench" },
    { name: "Gudgeon" },
    { name: "Bleak" },
    { name: "Dace" },

    { name: "European eel" },
    { name: "Burbot" },

    { name: "Common barbel" },
    { name: "Nase" },

    { name: "White bream" },
    { name: "Silver bream" },

    { name: "Grass carp" },
    { name: "Bighead carp" },

    { name: "Rainbow trout" },

    { name: "European grayling" },
    { name: "Taimen" },
  ];

  await prisma.fish.createMany({
    data: fishRows,
    skipDuplicates: true,
  });

  const seasonRows = [
    { code: "SPRING", name: "Spring" },
    { code: "SUMMER", name: "Summer" },
    { code: "AUTUMN", name: "Autumn" },
    { code: "WINTER", name: "Winter" },
  ];
  await prisma.season.createMany({ data: seasonRows, skipDuplicates: true });

  const fish = await prisma.fish.findMany({ select: { id: true, name: true } });
  const seasons = await prisma.season.findMany({
    select: { id: true, code: true },
  });

  const byFish = Object.fromEntries(fish.map((f) => [f.name, f.id]));
  const bySeason = Object.fromEntries(seasons.map((s) => [s.code, s.id]));

  // 3) LOCATIONS (seed content)
  const locData = [
    {
      title: "Dnipro river pier",
      description: "Easy access, parking ok, good morning bite.",
      contactInfo: "Telegram: @dnipro_owner",
      region: "KYIV",
      waterType: "RIVER",
      lat: 50.4501,
      lng: 30.5234,
      status: "APPROVED",
      ownerId: owner1.id,
      fish: ["Pike", "Perch", "Zander"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/dnipro1/1200/800",
          publicId: "seed_dnipro1",
        },
        {
          url: "https://picsum.photos/seed/dnipro2/1200/800",
          publicId: "seed_dnipro2",
        },
      ],
    },
    {
      title: "Lake spot with reeds",
      description: "Quiet place. Bring boots in spring.",
      contactInfo: "Phone: +380000000000",
      region: "LVIV",
      waterType: "LAKE",
      lat: 49.8397,
      lng: 24.0297,
      status: "PENDING",
      ownerId: owner2.id,
      fish: ["Carp", "Catfish"],
      seasons: ["SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/lake1/1200/800",
          publicId: "seed_lake1",
        },
      ],
    },
    {
      title: "Sea rocks",
      description: "Windy. Great sunset. Watch the waves.",
      contactInfo: null,
      region: "ODESA",
      waterType: "SEA",
      lat: 46.4825,
      lng: 30.7233,
      status: "HIDDEN",
      ownerId: owner1.id,
      fish: ["Perch"],
      seasons: ["SUMMER"],
      photos: [],
    },
    {
      title: "Pond near village",
      description: "Private pond vibes, ask owner before fishing.",
      contactInfo: "Instagram: @pond_owner",
      region: "VINNYTSIA",
      waterType: "POND",
      lat: 49.2331,
      lng: 28.4682,
      status: "REJECTED",
      ownerId: owner2.id,
      fish: ["Carp"],
      seasons: ["SPRING", "SUMMER"],
      photos: [
        {
          url: "https://picsum.photos/seed/pond1/1200/800",
          publicId: "seed_pond1",
        },
      ],
    },
  ];

  const createdLocations = [];

  for (const l of locData) {
    const loc = await upsertLocationByOwnerAndTitle({
      ownerId: l.ownerId,
      title: l.title,
      description: l.description,
      contactInfo: l.contactInfo,
      region: l.region,
      waterType: l.waterType,
      lat: dec(l.lat),
      lng: dec(l.lng),
      status: l.status,
    });

    createdLocations.push({ id: loc.id, title: loc.title });

    // Щоб seed був повторюваний і без дублювань логіки:
    // чистимо тільки зв’язки для цієї локації і створюємо заново
    await prisma.locationFish.deleteMany({ where: { locationId: loc.id } });
    await prisma.locationSeason.deleteMany({ where: { locationId: loc.id } });
    await prisma.photo.deleteMany({ where: { locationId: loc.id } });

    // joins: fish
    if (l.fish?.length) {
      await prisma.locationFish.createMany({
        data: l.fish.map((name) => ({
          locationId: loc.id,
          fishId: byFish[name],
        })),
        skipDuplicates: true,
      });
    }

    // joins: seasons
    if (l.seasons?.length) {
      await prisma.locationSeason.createMany({
        data: l.seasons.map((code) => ({
          locationId: loc.id,
          seasonId: bySeason[code],
        })),
        skipDuplicates: true,
      });
    }

    // photos
    if (l.photos?.length) {
      await prisma.photo.createMany({
        data: l.photos.map((p) => ({
          locationId: loc.id,
          url: p.url,
          publicId: p.publicId,
        })),
        skipDuplicates: true,
      });
    }
  }

  // 4) REVIEWS + FAVORITES (робимо повторювано через clean per location)
  const approvedLoc = createdLocations.find(
    (x) => x.title === "Dnipro river pier",
  );
  if (approvedLoc) {
    await prisma.review.deleteMany({ where: { locationId: approvedLoc.id } });
    await prisma.favorite.deleteMany({ where: { locationId: approvedLoc.id } });

    await prisma.review.createMany({
      data: [
        {
          locationId: approvedLoc.id,
          userId: user1.id,
          rating: 5,
          comment: "Solid spot. Caught pike early morning.",
        },
        {
          locationId: approvedLoc.id,
          userId: user2.id,
          rating: 4,
          comment: "Good access, a bit crowded on weekends.",
        },
      ],
      skipDuplicates: true,
    });

    await prisma.favorite.createMany({
      data: [
        { userId: user1.id, locationId: approvedLoc.id },
        { userId: user2.id, locationId: approvedLoc.id },
      ],
      skipDuplicates: true,
    });
  }

  console.log("Seed complete");
  console.log("Logins:");
  console.log("admin@test.com / Password123!");
  console.log("owner1@test.com / Password123!");
  console.log("owner2@test.com / Password123!");
  console.log("user1@test.com / Password123!");
  console.log("user2@test.com / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
