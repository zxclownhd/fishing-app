const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/db/client");
const { registerAndLogin, registerAndLoginAsAdmin } = require("./helpers/auth");

describe("DELETE /locations/:id (admin)", () => {
  it("should return 409 when admin deletes non-hidden location", async () => {
    const { token: ownerToken } = await registerAndLogin("OWNER");

    const createPayload = {
      title: "Visible Spot",
      description: "Should not be deleted",
      region: "KYIV",
      waterType: "RIVER",
      lat: 50.4501,
      lng: 30.5234,
      photos: [
        {
          url: "https://example.com/visible.jpg",
          publicId: "visible-photo-1",
        },
      ],
    };

    const createRes = await request(app)
      .post("/locations")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(createPayload);

    expect(createRes.status).toBe(201);

    const locationId = createRes.body.id;

    const { token: adminToken } = await registerAndLoginAsAdmin();

    const deleteRes = await request(app)
      .delete(`/admin/locations/${locationId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(409);
    expect(deleteRes.body).toBeTruthy();
    expect(deleteRes.body.error?.code).toBe("CONFLICT");
  });

  it("should delete hidden location for admin", async () => {
    const { token: ownerToken } = await registerAndLogin("OWNER");

    const createPayload = {
      title: "Hidden Spot",
      description: "Should be deleted",
      region: "KYIV",
      waterType: "LAKE",
      lat: 50.4601,
      lng: 30.5334,
      photos: [
        {
          url: "https://example.com/hidden.jpg",
          publicId: "hidden-photo-1",
        },
      ],
    };

    const createRes = await request(app)
      .post("/locations")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(createPayload);

    expect(createRes.status).toBe(201);

    const locationId = createRes.body.id;

    await prisma.location.update({
      where: { id: locationId },
      data: { status: "HIDDEN" },
    });

    // щоб тест не ліз у Cloudinary
    await prisma.photo.updateMany({
      where: { locationId },
      data: { publicId: "" }
    });

    const { token: adminToken } = await registerAndLoginAsAdmin();

    const deleteRes = await request(app)
      .delete(`/admin/locations/${locationId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(204);

    const locationInDb = await prisma.location.findUnique({
      where: { id: locationId },
    });

    expect(locationInDb).toBeNull();
  });
});
