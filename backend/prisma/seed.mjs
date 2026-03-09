// prisma/seed.mjs
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import "dotenv/config";
import { pathToFileURL } from "url";

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

  const owner3 = await upsertUser({
    email: "owner3@test.com",
    passwordHash: pwd,
    role: "OWNER",
    displayName: "Owner Three",
  });

  const owner4 = await upsertUser({
    email: "owner4@test.com",
    passwordHash: pwd,
    role: "OWNER",
    displayName: "Owner Four",
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

  const user3 = await upsertUser({
    email: "user3@test.com",
    passwordHash: pwd,
    role: "USER",
    displayName: "User Three",
  });

  const user4 = await upsertUser({
    email: "user4@test.com",
    passwordHash: pwd,
    role: "USER",
    displayName: "User Four",
  });

  const user5 = await upsertUser({
    email: "user5@test.com",
    passwordHash: pwd,
    role: "USER",
    displayName: "User Five",
  });

  const reviewUsers = {
    admin,
    owner1,
    owner2,
    owner3,
    owner4,
    user1,
    user2,
    user3,
    user4,
    user5,
  };

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
      title: "Southern Vinnytsia Canal",
      description: "Gentle canal run behind the industrial park; early mornings hold big carp.",
      contactInfo: "Phone: +380432000111",
      region: "VINNYTSIA",
      waterType: "RIVER",
      lat: 49.2331,
      lng: 28.4682,
      status: "APPROVED",
      ownerId: owner1.id,
      fish: ["Carp", "Tench", "Gudgeon"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/vinnytsia_canal/1200/800",
          publicId: "seed_vinnytsia_canal",
        },
      ],
      reviews: [
        {
          user: "user1",
          rating: 5,
          comment: "Morning casts along the canal gave steady tench and a couple of big carp.",
        },
        {
          user: "user2",
          rating: 4,
          comment: "Calm bank and easy parking, though the late summer weeds need a sweep.",
        },
      ],
      favorites: ["user1", "user3", "user4"],
    },
    {
      title: "Styr River Bend",
      description: "Wide bend with gravel shoals; evening insect hatch gets the pike moving.",
      contactInfo: "Telegram: @styr_volyn",
      region: "VOLYN",
      waterType: "RIVER",
      lat: 50.7472,
      lng: 25.3245,
      status: "APPROVED",
      ownerId: owner2.id,
      fish: ["Pike", "Perch", "Chub"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/styr_bend/1200/800",
          publicId: "seed_styr_bend",
        },
      ],
      reviews: [
        {
          user: "user3",
          rating: 5,
          comment: "The bend holds big pike in spring and the bank is quiet after work.",
        },
        {
          user: "user2",
          rating: 4,
          comment: "Water clarity is impressive but the access road is still a little soft.",
        },
      ],
      favorites: ["user2", "user5", "owner2"],
    },
    {
      title: "Dnipro Central Spit",
      description: "Concrete spit near the bridge; nights are great for zander and catfish.",
      contactInfo: "Phone: +380562111222",
      region: "DNIPROPETROVSK",
      waterType: "RIVER",
      lat: 48.4647,
      lng: 35.0462,
      status: "APPROVED",
      ownerId: owner3.id,
      fish: ["Zander", "Pike", "Catfish"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/dnipro_spit/1200/800",
          publicId: "seed_dnipro_spit",
        },
      ],
      reviews: [
        {
          user: "user1",
          rating: 4,
          comment: "Zander came in the evening after the city heat calmed down.",
        },
        {
          user: "user4",
          rating: 5,
          comment: "Solid catfish bite from the headland, owner let us keep a few photos.",
        },
      ],
      favorites: ["user1", "user4", "owner3"],
    },
    {
      title: "Kalmius Gravel Shore",
      description: "Wide gravel bars below the highway; quiet except for the farmers.",
      contactInfo: "Instagram: @kalmius_fish",
      region: "DONETSK",
      waterType: "RIVER",
      lat: 48.0159,
      lng: 37.8029,
      status: "APPROVED",
      ownerId: owner4.id,
      fish: ["Roach", "Carp", "Perch"],
      seasons: ["SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/kalmius_shore/1200/800",
          publicId: "seed_kalmius_shore",
        },
      ],
      reviews: [
        {
          user: "user2",
          rating: 3,
          comment: "Bite slowed by the weekend crowds but the shore is well maintained.",
        },
        {
          user: "user5",
          rating: 4,
          comment: "Roach and perch took bread paste all afternoon, firm gravel bottom.",
        },
      ],
      favorites: ["user2", "user5", "owner4"],
    },
    {
      title: "Teteriv Floodplain",
      description: "Wide floodplain with reed pockets; best after the spring drawdown.",
      contactInfo: "Telegram: @teteriv_guard",
      region: "ZHYTOMYR",
      waterType: "RIVER",
      lat: 50.2547,
      lng: 28.6587,
      status: "APPROVED",
      ownerId: owner1.id,
      fish: ["Perch", "Bream", "Rudd"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/teteriv_flood/1200/800",
          publicId: "seed_teteriv_flood",
        },
      ],
      reviews: [
        {
          user: "user3",
          rating: 4,
          comment: "Bream ran deep in the afternoon so I slid down a lump weight.",
        },
        {
          user: "user5",
          rating: 5,
          comment: "Perch hopped on and off the drop-shot, and the locals shared a hot drink.",
        },
      ],
      favorites: ["user3", "user5"],
    },
    {
      title: "Tisza Mountain Reach",
      description: "Clear mountain tributary with low banks; grayling like nymphs.",
      contactInfo: "Email: tisza@fishmail.ua",
      region: "ZAKARPATTIA",
      waterType: "RIVER",
      lat: 48.6208,
      lng: 22.2879,
      status: "APPROVED",
      ownerId: owner2.id,
      fish: ["Asp", "Chub", "European grayling"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/tisza_reach/1200/800",
          publicId: "seed_tisza_reach",
        },
      ],
      reviews: [
        {
          user: "user4",
          rating: 5,
          comment: "Grayling were present even in late autumn, and the mountain spray is refreshing.",
        },
        {
          user: "user1",
          rating: 5,
          comment: "Chub pulls kept the rod bent while the view of the ridges stayed clear.",
        },
      ],
      favorites: ["user1", "user4"],
    },
    {
      title: "Khortytsia South Rapids",
      description: "Rapid-laced stretch near the island; need sturdy boots on the rocks.",
      contactInfo: "Phone: +380612222333",
      region: "ZAPORIZHZHIA",
      waterType: "RIVER",
      lat: 47.8388,
      lng: 35.1396,
      status: "APPROVED",
      ownerId: owner3.id,
      fish: ["Zander", "Catfish", "Tench"],
      seasons: ["SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/khortytsia_south/1200/800",
          publicId: "seed_khortytsia_south",
        },
      ],
      reviews: [
        {
          user: "user2",
          rating: 5,
          comment: "Zander took a slow-sinking lure right next to the current seam.",
        },
        {
          user: "user3",
          rating: 4,
          comment: "Deep holes hold big catfish but watch the midday wind.",
        },
      ],
      favorites: ["user2", "user3", "user5"],
    },
    {
      title: "Bystrytsia Gorge Access",
      description: "Steep trail down to the gorge; trout and grayling hold the cool runs.",
      contactInfo: "Instagram: @bystritsia_lodge",
      region: "IVANO_FRANKIVSK",
      waterType: "RIVER",
      lat: 48.9215,
      lng: 24.7097,
      status: "APPROVED",
      ownerId: owner4.id,
      fish: ["Rainbow trout", "Taimen", "European grayling"],
      seasons: ["SPRING", "SUMMER"],
      photos: [
        {
          url: "https://picsum.photos/seed/bystritsia_gorge/1200/800",
          publicId: "seed_bystritsia_gorge",
        },
      ],
      reviews: [
        {
          user: "user5",
          rating: 5,
          comment: "Rainbow trout show up in the higher riffles, no crowds on weekdays.",
        },
        {
          user: "owner3",
          rating: 4,
          comment: "Taimen was a dream target, one took the dry fly but slipped away.",
        },
      ],
      favorites: ["user5", "owner3", "user1"],
    },
    {
      title: "Obolon Floodplain Platform",
      description: "Large platform with reed-sheltered pockets; city skyline in the background.",
      contactInfo: "Phone: +380442222444",
      region: "KYIV",
      waterType: "RIVER",
      lat: 50.4501,
      lng: 30.5234,
      status: "APPROVED",
      ownerId: owner1.id,
      fish: ["Perch", "Carp", "Tench", "Zander"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/obolon_platform/1200/800",
          publicId: "seed_obolon_platform",
        },
      ],
      reviews: [
        {
          user: "admin",
          rating: 5,
          comment: "Obolon stretch stays clean and the crew keeps the floating platform tidy.",
        },
        {
          user: "user3",
          rating: 4,
          comment: "Perch were plentiful once the Dnieper current dipped in the evening.",
        },
      ],
      favorites: ["user1", "admin", "user3"],
    },
    {
      title: "Inhul Urban Terrace",
      description: "Wide terrace along the Inhul with brick steps; catfish like the deeper holes.",
      contactInfo: "Telegram: @inhul_fishing",
      region: "KIROVOHRAD",
      waterType: "RIVER",
      lat: 48.5079,
      lng: 32.2623,
      status: "APPROVED",
      ownerId: owner2.id,
      fish: ["Carp", "Catfish", "Bream"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/inhul_terrace/1200/800",
          publicId: "seed_inhul_terrace",
        },
      ],
      reviews: [
        {
          user: "user2",
          rating: 4,
          comment: "Carp warmed up once the sun dropped behind the terrace.",
        },
        {
          user: "user4",
          rating: 3,
          comment: "Catfish watchers need to arrive early, the current picks up after lunch.",
        },
      ],
      favorites: ["user2", "user4", "owner1"],
    },
    {
      title: "Siverskyi Donets Meadow",
      description: "Grassy meadow slopes down to the Donets, great for evening pike.",
      contactInfo: "Phone: +380577333444",
      region: "LUHANSK",
      waterType: "RIVER",
      lat: 48.574,
      lng: 39.3078,
      status: "APPROVED",
      ownerId: owner3.id,
      fish: ["Pike", "Perch", "Burbot"],
      seasons: ["SPRING", "SUMMER"],
      photos: [
        {
          url: "https://picsum.photos/seed/donets_meadow/1200/800",
          publicId: "seed_donets_meadow",
        },
      ],
      reviews: [
        {
          user: "user3",
          rating: 4,
          comment: "Pike were cruising with big weeds, no shortage of casts.",
        },
        {
          user: "user5",
          rating: 3,
          comment: "Wind gusts stirred the surface but also kept the carp near.",
        },
      ],
      favorites: ["user3", "user5", "owner2"],
    },
    {
      title: "Lviv Highland Dam",
      description: "Tranquil dam with forested banks; best near sunset for carp and bream.",
      contactInfo: "Email: services@lvivcatch.org",
      region: "LVIV",
      waterType: "LAKE",
      lat: 49.8397,
      lng: 24.0297,
      status: "APPROVED",
      ownerId: owner4.id,
      fish: ["Carp", "Silver bream", "Roach"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/lviv_dam/1200/800",
          publicId: "seed_lviv_dam",
        },
      ],
      reviews: [
        {
          user: "user4",
          rating: 5,
          comment: "Silver bream schools responded to light pellets, nice view of the hills.",
        },
        {
          user: "user1",
          rating: 4,
          comment: "Carp bite was steady in the evening though the access gate locks early.",
        },
      ],
      favorites: ["user4", "user1", "user2"],
    },
    {
      title: "Southern Bug Bend",
      description: "Wide river bend with reed lines; barbel and catfish patrol the deeper slots.",
      contactInfo: "Instagram: @bugstart",
      region: "MYKOLAIV",
      waterType: "RIVER",
      lat: 46.975,
      lng: 31.9946,
      status: "APPROVED",
      ownerId: owner1.id,
      fish: ["Catfish", "Grass carp", "Common barbel"],
      seasons: ["SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/bug_bend/1200/800",
          publicId: "seed_bug_bend",
        },
      ],
      reviews: [
        {
          user: "user2",
          rating: 5,
          comment: "Grass carp at dusk made the fight interesting.",
        },
        {
          user: "user5",
          rating: 4,
          comment: "Common barbel chased bloodworms all night.",
        },
      ],
      favorites: ["user2", "owner1", "user5"],
    },
    {
      title: "Odesa Sandbar Pier",
      description: "Sea pier with slipway, tide pushes in European eel and small mullet.",
      contactInfo: "Phone: +380482333555",
      region: "ODESA",
      waterType: "SEA",
      lat: 46.4825,
      lng: 30.7233,
      status: "APPROVED",
      ownerId: owner2.id,
      fish: ["European eel", "Dace", "Bleak"],
      seasons: ["SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/odesa_pier/1200/800",
          publicId: "seed_odesa_pier",
        },
      ],
      reviews: [
        {
          user: "user3",
          rating: 4,
          comment: "Eel run after high tide, the pier is easier to stand on.",
        },
        {
          user: "user4",
          rating: 5,
          comment: "Small shoals teased with spoons, best near sunset.",
        },
      ],
      favorites: ["user3", "user4", "user1"],
    },
    {
      title: "Vorskla Forest Reach",
      description: "Forest trail ends at a wide Vorskla reach; the shade keeps the bite steady.",
      contactInfo: "Telegram: @vorskla_tracks",
      region: "POLTAVA",
      waterType: "RIVER",
      lat: 49.5883,
      lng: 34.5514,
      status: "APPROVED",
      ownerId: owner3.id,
      fish: ["Bream", "Perch", "White bream"],
      seasons: ["SPRING", "SUMMER"],
      photos: [
        {
          url: "https://picsum.photos/seed/vorskla_reach/1200/800",
          publicId: "seed_vorskla_reach",
        },
      ],
      reviews: [
        {
          user: "user2",
          rating: 4,
          comment: "Perch responded to slow jigs after the forest rain.",
        },
        {
          user: "user5",
          rating: 5,
          comment: "White bream flashed under the willows, quick action.",
        },
      ],
      favorites: ["user2", "user5", "owner4"],
    },
    {
      title: "Horyn River Flats",
      description: "Calm flats lined with sandbars; the river slows for easy casts.",
      contactInfo: "Phone: +380362111333",
      region: "RIVNE",
      waterType: "RIVER",
      lat: 50.6199,
      lng: 26.2516,
      status: "APPROVED",
      ownerId: owner4.id,
      fish: ["Chub", "Rudd", "Gudgeon"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/horyn_flats/1200/800",
          publicId: "seed_horyn_flats",
        },
      ],
      reviews: [
        {
          user: "user1",
          rating: 4,
          comment: "Chub busting on the fly line kept me busy in the calm sections.",
        },
        {
          user: "user3",
          rating: 4,
          comment: "Rudd and gudgeon simply took maggots, an easy evening so far.",
        },
      ],
      favorites: ["user1", "user3", "owner3"],
    },
    {
      title: "Psel Lakeside Grove",
      description: "Shallow lake with a grove of pines; warm waters welcome carp and roach.",
      contactInfo: "Email: lake@psel.ua",
      region: "SUMY",
      waterType: "LAKE",
      lat: 50.9077,
      lng: 34.7981,
      status: "APPROVED",
      ownerId: owner1.id,
      fish: ["Carp", "Roach", "Tench"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/psel_grove/1200/800",
          publicId: "seed_psel_grove",
        },
      ],
      reviews: [
        {
          user: "user4",
          rating: 5,
          comment: "Carp heated up as the sun dropped, and the grove kept the breeze off.",
        },
        {
          user: "user5",
          rating: 3,
          comment: "Roach took it easy, needed smaller hooks in the early run.",
        },
      ],
      favorites: ["user4", "user5", "owner2"],
    },
    {
      title: "Seret Gorge Outfall",
      description: "Steep outfall below the gorge, great for float rigs and trout.",
      contactInfo: "Phone: +380352444666",
      region: "TERNOPIL",
      waterType: "RIVER",
      lat: 49.5535,
      lng: 25.5948,
      status: "APPROVED",
      ownerId: owner2.id,
      fish: ["Perch", "Rainbow trout", "White bream"],
      seasons: ["SPRING", "SUMMER"],
      photos: [
        {
          url: "https://picsum.photos/seed/seret_outfall/1200/800",
          publicId: "seed_seret_outfall",
        },
      ],
      reviews: [
        {
          user: "user3",
          rating: 5,
          comment: "Seret drop-off held steady perch and the gorge echo keeps the place quiet.",
        },
        {
          user: "user1",
          rating: 4,
          comment: "Rainbow trout were shy but hooked once the water cooled.",
        },
      ],
      favorites: ["user3", "user1", "owner4"],
    },
    {
      title: "Lopan Timber Locks",
      description: "Lock chambers and timber piles, topwater works early on the Lopan.",
      contactInfo: "Telegram: @lopan_lock",
      region: "KHARKIV",
      waterType: "RIVER",
      lat: 49.9935,
      lng: 36.2304,
      status: "APPROVED",
      ownerId: owner3.id,
      fish: ["Pike", "Roach", "Carp"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/lopan_locks/1200/800",
          publicId: "seed_lopan_locks",
        },
      ],
      reviews: [
        {
          user: "user2",
          rating: 5,
          comment: "Two quick pike before lunch, this lock is surprisingly productive.",
        },
        {
          user: "user4",
          rating: 4,
          comment: "Carp and roach both came to paprika glugs when the current slowed.",
        },
      ],
      favorites: ["user2", "user4", "owner2"],
    },
    {
      title: "Dnieper Delta Wharf",
      description: "Sandy wharf with reed avenues, the lower delta loves carp and catfish.",
      contactInfo: "Instagram: @delta_tide",
      region: "KHERSON",
      waterType: "RIVER",
      lat: 46.655,
      lng: 32.617,
      status: "APPROVED",
      ownerId: owner4.id,
      fish: ["Catfish", "Bream", "Tench"],
      seasons: ["SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/delta_wharf/1200/800",
          publicId: "seed_delta_wharf",
        },
      ],
      reviews: [
        {
          user: "user1",
          rating: 4,
          comment: "Catfish were patient, drifted deadbaits with a hair rig.",
        },
        {
          user: "user5",
          rating: 5,
          comment: "Bream came in fast, and the ferry noise kept the rares away.",
        },
      ],
      favorites: ["user1", "user5", "owner3"],
    },
    {
      title: "Bug Urban Park Outlet",
      description: "Park trail drops to a wide Bug channel; carp cruise past the concrete.",
      contactInfo: "Phone: +380382233445",
      region: "KHMELNYTSKYI",
      waterType: "RIVER",
      lat: 49.4216,
      lng: 26.997,
      status: "APPROVED",
      ownerId: owner1.id,
      fish: ["Carp", "Common barbel", "Nase"],
      seasons: ["SPRING", "SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/bug_outlet/1200/800",
          publicId: "seed_bug_outlet",
        },
      ],
      reviews: [
        {
          user: "user3",
          rating: 4,
          comment: "Common barbel slowed but fought hard, the park crew chops the weeds.",
        },
        {
          user: "user4",
          rating: 5,
          comment: "Carp eat soft bread, and a friendly dog watched the rods.",
        },
      ],
      favorites: ["user3", "user4", "user5"],
    },
    {
      title: "Ros River Shoreline",
      description: "Wide shoreline with grassy banks; zander like the deeper channels.",
      contactInfo: "Email: ros@riverwatch.ua",
      region: "CHERKASY",
      waterType: "RIVER",
      lat: 49.4444,
      lng: 32.0598,
      status: "APPROVED",
      ownerId: owner2.id,
      fish: ["Zander", "Carp", "Perch"],
      seasons: ["SPRING", "SUMMER"],
      photos: [
        {
          url: "https://picsum.photos/seed/ros_shore/1200/800",
          publicId: "seed_ros_shore",
        },
      ],
      reviews: [
        {
          user: "user2",
          rating: 4,
          comment: "Zander kept the casting lively, best after the midday lull.",
        },
        {
          user: "user5",
          rating: 5,
          comment: "Perch blew up on the popper, got me laughing.",
        },
      ],
      favorites: ["user2", "user5", "owner1"],
    },
    {
      title: "Prut Valley Meadow",
      description: "Prut corridor under the hills, cool water for trout and chub.",
      contactInfo: "Instagram: @prut_trail",
      region: "CHERNIVTSI",
      waterType: "RIVER",
      lat: 48.2915,
      lng: 25.9403,
      status: "APPROVED",
      ownerId: owner3.id,
      fish: ["Trout", "Chub", "European grayling"],
      seasons: ["SPRING", "SUMMER"],
      photos: [
        {
          url: "https://picsum.photos/seed/prut_meadow/1200/800",
          publicId: "seed_prut_meadow",
        },
      ],
      reviews: [
        {
          user: "user1",
          rating: 5,
          comment: "Trout responded to wet flies while the valley held a chilly breeze.",
        },
        {
          user: "user3",
          rating: 4,
          comment: "Chub took soft plastics, nice handshake from the hill.",
        },
      ],
      favorites: ["user1", "user3", "owner4"],
    },
    {
      title: "Desna Reed Line",
      description: "Long reed line on the Desna; burbot and rudd both show up after dusk.",
      contactInfo: "Phone: +380462111888",
      region: "CHERNIHIV",
      waterType: "RIVER",
      lat: 51.4982,
      lng: 31.2893,
      status: "APPROVED",
      ownerId: owner4.id,
      fish: ["Burbot", "Perch", "Rudd"],
      seasons: ["SPRING", "SUMMER", "WINTER"],
      photos: [
        {
          url: "https://picsum.photos/seed/desna_reed/1200/800",
          publicId: "seed_desna_reed",
        },
      ],
      reviews: [
        {
          user: "user4",
          rating: 5,
          comment: "Burbot before dawn is quiet, but the reeds keep the bank safe.",
        },
        {
          user: "user2",
          rating: 3,
          comment: "Windy but the rudd bite was consistent if you held the boat.",
        },
      ],
      favorites: ["user4", "user2", "owner2"],
    },
    {
      title: "Kerch Strait Jetty",
      description: "Jetty with breakwaters; eels and dace chase small baits fields.",
      contactInfo: "Telegram: @kerch_shore",
      region: "CRIMEA",
      waterType: "SEA",
      lat: 44.9521,
      lng: 34.1024,
      status: "APPROVED",
      ownerId: owner1.id,
      fish: ["European eel", "Bleak", "Dace"],
      seasons: ["SUMMER", "AUTUMN", "WINTER"],
      photos: [
        {
          url: "https://picsum.photos/seed/kerch_jetty/1200/800",
          publicId: "seed_kerch_jetty",
        },
      ],
      reviews: [
        {
          user: "user5",
          rating: 4,
          comment: "European eel favourite after the noon current shift.",
        },
        {
          user: "user1",
          rating: 5,
          comment: "Bleak and dace tussled with small soft plastics, crowded but manageable.",
        },
      ],
      favorites: ["user5", "user1", "owner2"],
    },
    {
      title: "Obolon Hidden Arm",
      description: "Quiet arm off the main Dnieper channel; currently under review for safety upgrades.",
      contactInfo: "Phone: +380442555666",
      region: "KYIV",
      waterType: "RIVER",
      lat: 50.435,
      lng: 30.422,
      status: "PENDING",
      ownerId: owner2.id,
      fish: ["Perch", "Chub"],
      seasons: ["SPRING", "SUMMER"],
      photos: [
        {
          url: "https://picsum.photos/seed/obolon_hidden/1200/800",
          publicId: "seed_obolon_hidden",
        },
      ],
    },
    {
      title: "Odessa Quay Ruins",
      description: "Old quay with unstable concrete, needs clearance before public use.",
      contactInfo: "Email: admin@odesaquake.com",
      region: "ODESA",
      waterType: "SEA",
      lat: 46.476,
      lng: 30.697,
      status: "REJECTED",
      ownerId: owner4.id,
      fish: ["European eel", "Bleak"],
      seasons: ["SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/odesa_quay/1200/800",
          publicId: "seed_odesa_quay",
        },
      ],
    },
    {
      title: "Volyn Forest Spring",
      description: "Spring-fed pool inside a forest stand; hidden for now pending stewardship.",
      contactInfo: "Telegram: @volyn_springs",
      region: "VOLYN",
      waterType: "POND",
      lat: 50.81,
      lng: 25.275,
      status: "HIDDEN",
      ownerId: owner1.id,
      fish: ["Carp", "Roach"],
      seasons: ["SPRING", "SUMMER"],
      photos: [
        {
          url: "https://picsum.photos/seed/volyn_spring/1200/800",
          publicId: "seed_volyn_spring",
        },
      ],
    },
    {
      title: "Rivne Migrant Lake",
      description: "Shallow lake with migrating birds; pending clearance for night camping.",
      contactInfo: "Phone: +380362888990",
      region: "RIVNE",
      waterType: "LAKE",
      lat: 50.603,
      lng: 26.245,
      status: "PENDING",
      ownerId: owner3.id,
      fish: ["Carp", "Perch"],
      seasons: ["SUMMER", "AUTUMN"],
      photos: [
        {
          url: "https://picsum.photos/seed/rivne_migrant/1200/800",
          publicId: "seed_rivne_migrant",
        },
      ],
    },
    {
      title: "Crimea Secluded Cove",
      description: "Private cove near the southern cliffs; represented as hidden for now.",
      contactInfo: "Instagram: @crimea_cove",
      region: "CRIMEA",
      waterType: "SEA",
      lat: 44.9,
      lng: 34.058,
      status: "HIDDEN",
      ownerId: owner2.id,
      fish: ["Dace", "Bleak"],
      seasons: ["SUMMER"],
      photos: [
        {
          url: "https://picsum.photos/seed/crimea_cove/1200/800",
          publicId: "seed_crimea_cove",
        },
      ],
    },
  ];

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

    await prisma.review.deleteMany({ where: { locationId: loc.id } });
    await prisma.favorite.deleteMany({ where: { locationId: loc.id } });

    if (l.status === "APPROVED") {
      if (l.reviews?.length) {
        await prisma.review.createMany({
          data: l.reviews.map((review) => {
            const actor = reviewUsers[review.user];
            if (!actor) {
              throw new Error(
                `Unknown review user "${review.user}" for location "${l.title}"`,
              );
            }
            return {
              locationId: loc.id,
              userId: actor.id,
              rating: review.rating,
              comment: review.comment,
            };
          }),
          skipDuplicates: true,
        });
      }

      if (l.favorites?.length) {
        await prisma.favorite.createMany({
          data: l.favorites.map((key) => {
            const user = reviewUsers[key];
            if (!user) {
              throw new Error(
                `Unknown favorite user "${key}" for location "${l.title}"`,
              );
            }
            return {
              locationId: loc.id,
              userId: user.id,
            };
          }),
          skipDuplicates: true,
        });
      }
    }
  }

  console.log("Seed complete");
  console.log("Logins:");
  console.log("admin@test.com / Password123!");
  console.log("owner1@test.com / Password123!");
  console.log("owner2@test.com / Password123!");
  console.log("owner3@test.com / Password123!");
  console.log("owner4@test.com / Password123!");
  console.log("user1@test.com / Password123!");
  console.log("user2@test.com / Password123!");
  console.log("user3@test.com / Password123!");
  console.log("user4@test.com / Password123!");
  console.log("user5@test.com / Password123!");
}

export async function runSeed() {
  await main();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSeed()
    .catch((e) => {
      console.error("Seed failed:", e);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
