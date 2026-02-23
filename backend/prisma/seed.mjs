import "dotenv/config";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// ⚠️ шлях під себе: у тебе в роутерах `require("../db/client")`
// але seed лежить в /prisma, тому до /src/db/client буде так:
const prisma = require("../src/db/client");

async function main() {
  await prisma.season.createMany({
    data: [
      { code: "SPRING", name: "Spring" },
      { code: "SUMMER", name: "Summer" },
      { code: "AUTUMN", name: "Autumn" },
      { code: "WINTER", name: "Winter" },
    ],
    skipDuplicates: true,
  });

  await prisma.fish.createMany({
    data: [
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
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed complete: Season + Fish");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });